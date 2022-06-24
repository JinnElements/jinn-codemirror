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
const teiFragmentLinter = (namespace: string|null) => (view: EditorView): Diagnostic[] => {
    const diagnostics:Diagnostic[] = [];
    const tree = syntaxTree(view.state);
    let hasNamespace = false;
    tree.iterate({
        enter: (node:TreeCursor) => {
            if (isNamespaceNode(view, node)) {
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
            }
            if (isErrorComment(view, node)) {
                diagnostics.push({
                    message: 'Enthält einen Fehler',
                    severity: 'warning',
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
            if (node.type.name === "Document" && !diagnostics.length) {
                diagnostics.push({
                    message: 'All fine',
                    severity: 'info',
                    from: node.from,
                    to: node.to
                });
            }
        }
    });
    return diagnostics;
}

const xmlKeymap: readonly KeyBinding[] = [
    { key: "Ctrl-Shift-s", mac: "Cmd-Shift-s", run: commands.selectElement },
    { key: "Ctrl-Shift-x", mac: "Cmd-Shift-x", run: commands.removeEnclosing },
    { key: "Ctrl-Shift-e", mac: "Cmd-Shift-e", run: commands.encloseWith }
];

export class XMLConfig extends EditorConfig {

    private namespace: string|null;

    constructor(editor: JinnCodemirror, namespace: string|null = null) {
        super(editor);
        this.namespace = namespace;
    }

    private getDefaultExtensions (): Extension[] {
        return [
            inputPanel(),
            keymap.of(xmlKeymap), 
            linter(teiFragmentLinter(this.namespace), {delay, markerFilter}), 
            lintGutter({markerFilter})
        ];
    }

    async getExtensions(): Promise<Extension[]> {
        const schemaUrl = this.editor.getAttribute('schema');
        if (schemaUrl) {
            const schema = await this.loadSchema(schemaUrl);
            return this.getDefaultExtensions().concat(xml(schema));
        }
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

    serialize(): Element | string | null {
        const parser = new DOMParser();
        const parsed = parser.parseFromString(this.editor.content, "application/xml");
        const errors = parsed.getElementsByTagName("parsererror")
        if (errors.length) {
            throw new TypeError("Invalid XML");
        }
        return parsed.firstElementChild
    }

    setFromValue(value: Element | string | null |undefined): string {
        if (!(value && value instanceof Element)) { 
            return ''
        }
        const s = new XMLSerializer();
        const serializedXML = s.serializeToString(value)
        return serializedXML;
    }
}