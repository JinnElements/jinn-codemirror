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

    serialize(): string | Element | NodeListOf<ChildNode> | null | undefined {
        return this.editor.content;
    }
}