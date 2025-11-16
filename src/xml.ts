import { xml, completeFromSchema } from "@codemirror/lang-xml";
import { Extension } from "@codemirror/state";
import { EditorConfig } from "./config";
import { Diagnostic, linter, lintGutter, Action } from "@codemirror/lint";
import { EditorView } from "@codemirror/view";
import { syntaxTree } from "@codemirror/language";
import { TreeCursor } from "@lezer/common";
import { JinnCodemirror } from "./jinn-codemirror";
import { JinnXMLEditor } from "./xml-editor";
import { commands, encloseWithPanel, zoteroPanel } from "./xml-commands";
import { Completion, autocompletion, CompletionSource } from "@codemirror/autocomplete";
import { XMLAttributeAutocomplete } from "./autocomplete/xml-attribute-autocomplete";

const isNamespaceNode = (view:EditorView, node:TreeCursor): boolean => {
    return node.type.name === "AttributeName" && view.state.sliceDoc(node.from, node.to) === "xmlns"
}
const isErrorComment = (view:EditorView, node:TreeCursor): boolean => {
    return node.type.name === "Comment" && /\<\!\-\- Error\:([^ ])* \-\-\>/.test(view.state.sliceDoc(node.from, node.to))
}

// linter config settings
// how long to wait before running linter
const delay = 300;
// do not show info messages in gutter nor in content
const markerFilter = (dias:readonly Diagnostic[]):Diagnostic[] => dias.filter(dia => dia.severity !== 'info');

const fixNamespaceAction = (namespace:string):Action => {
    return {
        name: "Fix",
        apply: (view:EditorView, from: number, to:number) => {
            const tx = view.state.update({
                changes: {from, to, insert: namespace}
            });
            view.dispatch(tx);
        }
    }
};

/**
 * Highlights SyntaxErrors, missing TEI or wrong namespace.
 * 
 * @fires valid - if no errors were found
 * @fires invalid - if errors found
 * 
 * @returns {function} linter
 */
const teiFragmentLinter = (editor: JinnCodemirror, namespace: string|null) => (view: EditorView): Diagnostic[] => {

    function emitEvent(valid: boolean) {
        editor.valid = valid;
        editor.dispatchEvent(new CustomEvent(valid ? 'valid' : 'invalid', {
            detail: diagnostics,
            composed: true,
            bubbles: true
        }));
    }

    const diagnostics:Diagnostic[] = [];
    
    if (view.state.doc.length === 0) {
        emitEvent(true);
        return diagnostics;
    }

    const tree = syntaxTree(view.state);
    let hasNamespace = false;
    const stack:string[] = [];
    tree.iterate({
        enter: (node:TreeCursor) => {
            if (node.type.isError) {
                diagnostics.push({
                    message: 'Syntax error',
                    severity: 'error',
                    from: node.from,
                    to: node.to
                });
            }
            if (node.type.name === 'StartTag') {
                node.nextSibling();
                stack.push(view.state.sliceDoc(node.from, node.to));
            } else if (node.type.name === 'StartCloseTag') {
                node.nextSibling();
                const closeTag = view.state.sliceDoc(node.from, node.to);
                const openTag = stack.pop();
                if (closeTag !== openTag) {
                    diagnostics.push({
                        message: `Expected closing tag for ${openTag}`,
                        severity: 'error',
                        from: node.from,
                        to: node.to
                    });
                }
            } else if (node.type.name === 'SelfCloseEndTag') {
                stack.pop();
            } else if (isNamespaceNode(view, node)) {
                hasNamespace = true;
                node.nextSibling()
                node.nextSibling()
                const ns = view.state.sliceDoc(node.from+1, node.to-1)
                if (namespace && ns !== namespace) {
                    diagnostics.push({
                        message: 'Wrong Namespace',
                        severity: 'error',
                        from: node.from+1,
                        to: node.to-1,
                        actions: [ fixNamespaceAction(namespace) ]
                    });
                }
            } else if (isErrorComment(view, node)) {
                diagnostics.push({
                    message: 'Syntax error in source input',
                    severity: 'warning',
                    from: node.from,
                    to: node.to
                });
            }
            
        },
        leave: (node:TreeCursor) => {
            if (node.type.name === "Document" && namespace && !hasNamespace) {
                diagnostics.push({
                    message: 'Missing TEI namespace',
                    severity: 'error',
                    from: node.from,
                    to: node.to
                });
            }
            if (node.type.isError) {
                diagnostics.push({
                    message: 'Syntax error in input',
                    severity: 'error',
                    from: node.from,
                    to: node.to
                });
            }
        }
    });

    emitEvent(diagnostics.length === 0);
    return diagnostics;
}

const completeAttribute = (view: EditorView, completion: Completion, from: number, to: number) => {
    const tx = view.state.update({
        changes: { from: from, to: to, insert: `${completion.label}=""` },
        selection: { anchor: from + completion.label.length + 2 }
    });
    view.dispatch(tx);
}

export class XMLConfig extends EditorConfig {

    private unwrap: boolean|null;
    private checkNamespace: boolean|null;
    private attributeAutocomplete: XMLAttributeAutocomplete[];

    constructor(editor: JinnCodemirror, toolbar: HTMLElement[] = [], namespace: string|null = null, checkNamespace: boolean|null = false, unwrap: boolean|null = false, attributeAutocomplete: XMLAttributeAutocomplete[] = []) {
        super(editor, toolbar, commands);
        this.namespace = namespace;
        this.checkNamespace = checkNamespace;
        this.unwrap = unwrap;
        this.attributeAutocomplete = attributeAutocomplete;
    }

    private getDefaultExtensions (): Extension[] {
        return [
            encloseWithPanel(),
            zoteroPanel(),
            linter(teiFragmentLinter(this.editor, this.checkNamespace ? this.namespace : null), {delay, markerFilter}), 
            lintGutter({markerFilter})
        ];
    }

    async getExtensions(): Promise<Extension[]> {
        const schemaUrl = (<JinnXMLEditor>this.editor).schema;
        const defaultExtensions = this.getDefaultExtensions();
        
        // Build completion sources array - put our custom ones first so they take precedence
        const completionSources: CompletionSource[] = [];
        
        // Add attribute autocompletion sources
        this.attributeAutocomplete.forEach((autocomplete) => {
            const source = autocomplete.createCompletionSource();
            if (source) {
                completionSources.push(source);
            }
        });
        
        if (schemaUrl) {
            const schema = await this.loadSchema(schemaUrl);
            completionSources.push(completeFromSchema(schema.elements, []));
            // Get XML language support (without its default autocompletion since we're overriding)
            const xmlSupport = xml(schema);
            // Override autocompletion to include both XML schema completion and our custom one
            return defaultExtensions.concat(
                xmlSupport,
                autocompletion({
                    override: completionSources
                })
            );
        } else {
            // No schema, just use basic XML support
            const xmlSupport = xml();
            return defaultExtensions.concat(
                xmlSupport,
                autocompletion({
                    override: completionSources
                })
            );
        }
    }

    private async loadSchema(url: string) {
        const json = await fetch(url)
            .then((response) => response.json());
        let elements = json.elements;
        const entryPoint = (<JinnXMLEditor>this.editor).schemaRoot;
        if (entryPoint) {
            const root = json.elements.find((elem) => elem.name === entryPoint);
            if (root) {
                const filtered = new Map<string, any>();
                const elemMap = new Map<string, any>();
                json.elements.forEach((elem) => elemMap.set(elem.name, elem));

                this.filterSchema(root, elemMap, filtered);
                elements = Array.from(filtered.values())
            }
        }
        this.extendSchema(elements);
        return { elements };
    }

    private filterSchema(elem: any, elemList: Map<string, any>, result: Map<string, any>, level: number = 0) {
        elem.children.forEach((child) => {
            const existingEntry = result.get(child);
            if (existingEntry) {
                existingEntry.top = (level === 0);
                return;
            }
            const entry = elemList.get(child);
            if (entry) {
                entry.top = (level === 0);
                result.set(child, entry);
                this.filterSchema(entry, elemList, result, level + 1);
            }
        });
    }

    private extendSchema(elements: any[]) {
        elements.forEach((elem) => {
            elem.completion.type = 'keyword';
            elem.attributes.forEach((attr) => {
                attr.completion.type = 'property';
                attr.completion.apply = completeAttribute;
            });
        })
    }

    serialize(): Element | NodeListOf<ChildNode> | string | null | undefined {
        const parser = new DOMParser();
        const content = this.unwrap ? `<R xmlns="${this.namespace || ''}">${this.editor.content}</R>` : this.editor.content;
        const parsed = parser.parseFromString(content, "application/xml");
        const errors = parsed.getElementsByTagName("parsererror")
        if (errors.length) {
            return null;
            // throw new TypeError("Invalid XML");
        }
        return this.unwrap ? parsed.firstElementChild?.childNodes : parsed.firstElementChild;
    }
}