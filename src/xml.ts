import { xml } from "@codemirror/lang-xml";
import { Extension } from "@codemirror/state";
import { EditorCommands, EditorConfig } from "./config";
import { Diagnostic, linter, lintGutter, Action } from "@codemirror/lint";
import { EditorView, KeyBinding, keymap } from "@codemirror/view";
import { syntaxTree } from "@codemirror/language";
import { TreeCursor } from "@lezer/common";
import { JinnCodemirror } from "./jinn-codemirror";
import { commands, inputPanel } from "./xml-commands";

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
 * Highlights SyntaxErrors, missing TEI or wrong namespace
 * 
 * @returns {function} linter
 */
const teiFragmentLinter = (editor: JinnCodemirror, namespace: string|null) => (view: EditorView): Diagnostic[] => {
    const diagnostics:Diagnostic[] = [];
    
    if (view.state.doc.length === 0) {
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
                    message: 'Syntaxfehler',
                    severity: 'error',
                    from: node.from,
                    to: node.to
                });
            }
        }
    });
    if (diagnostics.length > 0) {
        editor.valid = false;
        editor.dispatchEvent(new CustomEvent('invalid', {
            detail: diagnostics,
            composed: true,
            bubbles: true
        }));
    } else {
        editor.valid = true;
        editor.dispatchEvent(new CustomEvent('valid', {
            detail: diagnostics,
            composed: true,
            bubbles: true
        }));
    }
    return diagnostics;
}

const xmlKeymap: readonly KeyBinding[] = [
    { key: "Ctrl-Shift-s", mac: "Cmd-Shift-s", run: commands.selectElement },
    { key: "Ctrl-Shift-x", mac: "Cmd-Shift-x", run: commands.removeEnclosing },
    { key: "Ctrl-Shift-e", mac: "Cmd-Shift-e", run: commands.encloseWith }
];

export class XMLConfig extends EditorConfig {

    private namespace: string|null;
    private unwrap: boolean|null;
    private checkNamespace: boolean|null;

    constructor(editor: JinnCodemirror, namespace: string|null = null, checkNamespace: boolean|null = false, unwrap: boolean|null = false) {
        super(editor);
        this.namespace = namespace;
        this.checkNamespace = checkNamespace;
        this.unwrap = unwrap;
    }

    private getDefaultExtensions (): Extension[] {
        return [
            inputPanel(),
            keymap.of(xmlKeymap), 
            linter(teiFragmentLinter(this.editor, this.checkNamespace ? this.namespace : null), {delay, markerFilter}), 
            lintGutter({markerFilter})
        ];
    }

    getExtensions(): Extension[] {
        // const schemaUrl = this.editor.getAttribute('schema');
        // if (schemaUrl) {
        //     const schema = await this.loadSchema(schemaUrl);
        //     return this.getDefaultExtensions().concat(xml(schema));
        // }
        return this.getDefaultExtensions().concat(xml());
    }

    getCommands():EditorCommands {
        return commands;
    }

    private async loadSchema(url: string) {
        const json = await fetch(url)
            .then((response) => response.json());
        return json;
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

    setFromValue(value: Element | NodeListOf<ChildNode> | string | null | undefined): string {
        if (!(value && (value instanceof Element || value instanceof NodeList))) { 
            return '';
        }
        const s = new XMLSerializer();
        if (value instanceof NodeList) {
            const buf = [];
            for (let i = 0; i < (<NodeList>value).length; i++) {
                buf.push(s.serializeToString(value[i]));
            }
            return buf.join('');
        }
        return s.serializeToString(value);
    }
}