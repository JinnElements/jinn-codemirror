import { EditorView, basicSetup } from "@codemirror/basic-setup";
import { Command, ViewPlugin, ViewUpdate } from "@codemirror/view";
import { syntaxTree } from "@codemirror/language";
import { EditorStateConfig, Extension, EditorSelection } from "@codemirror/state";
import { snippet } from "@codemirror/autocomplete";
import { Tree } from "@lezer/common";
import { JinnCodemirror } from "./jinn-codemirror";

export interface EditorCommands {
    [index:string]: Command
}

/**
 * Creates a command which wraps the current selection with a prefix and suffix.
 * 
 * @param start prefix to insert before selection
 * @param end suffix to insert after selection
 * @returns command to execute
 */
export const wrapCommand = (start:string, end:string):Command => (editor) => {
    editor.dispatch(editor.state.changeByRange(range => {
        return {
            changes: [{from: range.from, insert: start}, {from: range.to, insert: end}],
            range: EditorSelection.range(range.from + start.length, range.to + start.length)
        };
    }));
    return true;
}

/**
 * Creates a command which inserts a snippet in place of the current selection.
 * '${_}' will be replaced by the selection text.
 * 
 * @param template snippet template string
 * @returns command to execute
 */
export const snippetCommand = (template:string):Command => (editor) => {
    editor.state.selection.ranges.forEach((range) => {
        const content = editor.state.doc.slice(range.from, range.to);
        const snip = snippet(template.replace(/\${_}/, `\${${content.toString()}}`));
        snip(editor, {
            label: ''
        }, range.from, range.to);
    });
    return true;
}

export abstract class EditorConfig {

    editor: JinnCodemirror;

    constructor(editor:JinnCodemirror) {
        this.editor = editor;
    }

    async getConfig(): Promise<EditorStateConfig> {
        const self = this;
        const updateListener = ViewPlugin.fromClass(class {
            update(update: ViewUpdate) {
                if (update.docChanged) {
                    const tree = syntaxTree(update.state);
                    const lines = update.state.doc.toJSON();
                    const content = self.onUpdate(tree, lines.join('\n'));
                    
                    // save content to property `value` on editor parent
                    const serialized = self.serialize();
                    self.editor.value = serialized;
                    self.editor.dispatchEvent(new CustomEvent('update', {
                        detail: {content, serialized},
                        composed: true,
                        bubbles: true
                    }));
                }
            }
        });

        const customExtensions = await this.getExtensions(this.editor);
        return { extensions: [basicSetup, EditorView.lineWrapping, ...customExtensions, updateListener] };
    }

    abstract getExtensions(editor: JinnCodemirror): Promise<Extension[]>;

    getCommands():EditorCommands {
        return {};
    }

    onUpdate(tree: Tree, content: string) {
        return content;
    }

    abstract serialize(): Node|string;
}
