import { xml } from "@codemirror/lang-xml";
import { Extension } from "@codemirror/state";
import { EditorConfig } from "./config";
import { Diagnostic, linter, lintGutter } from "@codemirror/lint";
import { EditorView } from "@codemirror/view";
import { syntaxTree } from "@codemirror/language";
import { TreeCursor } from "@lezer/common";

const xmlParserLinter = () => (view: EditorView): Diagnostic[] => {
    const diagnostics:Diagnostic[] = [];
    const tree = syntaxTree(view.state);
    tree.iterate({
        enter: (node:TreeCursor) => {
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
    return diagnostics;
}

export class XMLConfig extends EditorConfig {

    private getDefaultExtensions (): Extension[] {
        return [linter(xmlParserLinter()), lintGutter()];
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
            console.error(errors)
            return null;
        }
        return parsed.firstElementChild
    }

    setFromValue(value: Element | string | null |undefined): string {
        console.log("setFromValue XML", value, value instanceof Element)
        if (!value) { return '' }
        if (value instanceof Element) {
            const s = new XMLSerializer();
            return s.serializeToString(value);
        }
        return value?.toString();
    }
}