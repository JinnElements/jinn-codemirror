import { css } from "@codemirror/lang-css";
import { Extension } from "@codemirror/state";
import { EditorConfig } from "./config";
import { JinnCodemirror } from "./jinn-codemirror";

export class CSSConfig extends EditorConfig {

    constructor(editor: JinnCodemirror) {
        super(editor);
    }

    async getExtensions(editor: JinnCodemirror): Promise<Extension[]> {
        return [css()];
    }

    serialize(): string | Element | NodeListOf<ChildNode> | null | undefined {
        return this.editor.content;
    }
}