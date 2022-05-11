import { xml } from "@codemirror/lang-xml";
import { Extension } from "@codemirror/state";
import { EditorConfig } from "./config";
import { Diagnostic, linter, lintGutter } from "@codemirror/lint";
import { EditorView } from "@codemirror/view";
import { syntaxTree } from "@codemirror/language";
import { TreeCursor } from "@lezer/common";

const isNamespaceNode = (view:EditorView, node:TreeCursor): boolean => {
    return node.type.name === "AttributeName" && view.state.sliceDoc(node.from, node.to) === "xmlns"
}

/**
 * Highlights SyntaxErrors, missing TEI or wrong namespace
 * 
 * @returns {function} linter
 */
const teiFragmentLinter = () => (view: EditorView): Diagnostic[] => {
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
                if (ns !== 'http://www.tei-c.org/ns/1.0') {
                    diagnostics.push({
                        message: 'Invalid namespace',
                        severity: 'error',
                        from: node.from,
                        to: node.to
                    });    
                }
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
            if (node.type.name === "Document" && !hasNamespace) {
                diagnostics.push({
                    message: 'Missing namespace',
                    severity: 'error',
                    from: node.from,
                    to: node.to
                });
            }
        }
    });
    return diagnostics;
}

export class XMLConfig extends EditorConfig {

    private getDefaultExtensions (): Extension[] {
        return [linter(teiFragmentLinter()), lintGutter()];
    }

    async getExtensions(): Promise<Extension[]> {
        const schemaUrl = this.editor.getAttribute('schema');
        if (schemaUrl) {
            const schema = this.loadSchema(schemaUrl)
                .then((schema) => this.getDefaultExtensions().concat(xml(schema)));
        }
        return this.getDefaultExtensions().concat(xml());
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