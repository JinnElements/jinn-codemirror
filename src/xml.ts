import { xml } from "@codemirror/lang-xml";
import { Extension } from "@codemirror/state";
import { EditorConfig } from "./config";
import { JinnCodemirror } from "./jinn-codemirror";

export class XMLConfig extends EditorConfig {

    async getExtensions(): Promise<Extension[]> {
        const schemaUrl = this.editor.getAttribute('schema');
        if (schemaUrl) {
            return this.loadSchema(schemaUrl).then((schema) => [xml(schema)]);
        }
        return [xml()];
    }

    private async loadSchema(url: string) {
        const json = await fetch(url)
            .then((response) => response.json());
        return json;
    }

    serialize(): string | Node {
        const parser = new DOMParser();
        return parser.parseFromString(this.editor.content, "application/xml");
    }
}