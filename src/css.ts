import { css } from "@codemirror/lang-css";
import { Extension } from "@codemirror/state";
import { EditorConfig } from "./config";
import { JinnCodemirror } from "./jinn-codemirror";
import { placeholder } from "@codemirror/view";

export class CSSConfig extends EditorConfig {

    constructor(editor: JinnCodemirror) {
        super(editor);
    }

    async getExtensions(editor: JinnCodemirror): Promise<Extension[]> {
        return [css(), placeholder(editor.placeholder)];
    }

    setFromValue(value: string | Element | NodeListOf<ChildNode> | null | undefined): string {
        if (!value) { return '' }
        if (!(typeof value === 'string')) {
            throw new Error("cannot set value")
        }
        return value;
    }

    serialize(): string | Element | NodeListOf<ChildNode> | null | undefined {
        return this.editor.content;
    }
}