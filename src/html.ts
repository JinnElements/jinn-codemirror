import { Extension } from "@codemirror/state";
import { EditorConfig } from "./config";
import { JinnCodemirror } from "./jinn-codemirror";
import { html } from "@codemirror/lang-html";
import { commands, inputPanel } from "./xml-commands";

export class HTMLConfig extends EditorConfig {

    constructor(editor: JinnCodemirror, toolbar: HTMLElement[] = []) {
        super(editor, toolbar, commands);
    }

    async getExtensions(editor: JinnCodemirror): Promise<Extension[]> {
        return [html({ selfClosingTags: false}), inputPanel()];
    }

    serialize(): string | Element | NodeListOf<ChildNode> | null | undefined {
        return this.editor.content;
    }
}