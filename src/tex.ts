import {StreamLanguage} from "@codemirror/language";
import { stex } from "@codemirror/legacy-modes/mode/stex";
import { Extension } from "@codemirror/state";
import { EditorConfig } from "./config";
import { JinnCodemirror } from "./jinn-codemirror";

export class TeXConfig extends EditorConfig {

    async getExtensions(editor: JinnCodemirror): Promise<Extension[]> {
        return [
            StreamLanguage.define(stex)
        ];
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