import { Extension } from "@codemirror/state";
import { EditorConfig } from "./config";
import { JinnCodemirror } from "./jinn-codemirror";

export class PlainConfig extends EditorConfig {

    async getExtensions(editor: JinnCodemirror): Promise<Extension[]> {
        return [];
    }

    serialize(): string | Element | NodeListOf<ChildNode> | null | undefined {
        return this.editor.content;
    }
}