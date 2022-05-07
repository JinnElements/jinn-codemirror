import { EditorView, basicSetup } from "@codemirror/basic-setup";
import { Command, ViewPlugin, ViewUpdate } from "@codemirror/view";
import { syntaxTree } from "@codemirror/language";
import { EditorStateConfig, Extension } from "@codemirror/state";
import { Tree } from "@lezer/common";
import { JinnCodemirror } from "./jinn-codemirror";

export interface EditorCommands {
    [index:string]: Command
}

export abstract class EditorConfig {

    async getConfig(editor: JinnCodemirror): Promise<EditorStateConfig> {
        const self = this;
        const updateListener = ViewPlugin.fromClass(class {
            update(update: ViewUpdate) {
                if (update.docChanged) {
                    const tree = syntaxTree(update.state);
                    const lines = update.state.doc.toJSON();
                    const content = self.onUpdate(tree, lines.join('\n'));

                    editor.dispatchEvent(new CustomEvent('update', {
                        detail: content,
                        composed: true,
                        bubbles: true
                    }));
                }
            }
        });

        const customExtensions = await this.getExtensions(editor);
        return { extensions: [basicSetup, EditorView.lineWrapping, ...customExtensions, updateListener] };
    }

    abstract getExtensions(editor: JinnCodemirror): Promise<Extension[]>;

    getCommands():EditorCommands {
        return {};
    }
    
    onUpdate(tree: Tree, content: string) {
        return content;
    }
}
