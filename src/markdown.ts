import { Extension } from "@codemirror/state";
import { EditorConfig } from "./config";
import { JinnCodemirror } from "./jinn-codemirror";
import { markdown } from "@codemirror/lang-markdown";

export class MarkdownConfig extends EditorConfig {

    constructor(editor: JinnCodemirror, toolbar: HTMLElement[] = []) {
        super(editor, toolbar);
    }

    async getExtensions(editor: JinnCodemirror): Promise<Extension[]> {
        return [markdown()];
    }

    serialize(): string | Element | NodeListOf<ChildNode> | null | undefined {
        return this.editor.content;
    }
}