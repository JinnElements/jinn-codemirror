import { Extension } from "@codemirror/state";
import { EditorConfig } from "./config";
import { JinnCodemirror } from "./jinn-codemirror";
import { html } from "@codemirror/lang-html";

export class HTMLConfig extends EditorConfig {

    constructor(editor: JinnCodemirror) {
        super(editor);
    }

    async getExtensions(editor: JinnCodemirror): Promise<Extension[]> {
        return [html({ selfClosingTags: false})];
    }

    serialize(): string | Element | NodeListOf<ChildNode> | null | undefined {
        return this.editor.content;
    }
}