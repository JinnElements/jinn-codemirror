import { Extension } from "@codemirror/state";
import { Tree } from "@lezer/common";
import { syntax2epiDoc } from ".";
import { EditorConfig } from "./config";
import { JinnCodemirror } from "./jinn-codemirror";
import { leiden } from "./language";

export class LeidenConfig extends EditorConfig {
    async getExtensions(editor: JinnCodemirror): Promise<Extension[]> {
        return [leiden()];
    }

    onUpdate(tree: Tree, content: string): string {
        return syntax2epiDoc(tree, content);
    }
}