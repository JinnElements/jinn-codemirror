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