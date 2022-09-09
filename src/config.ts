import { basicSetup, EditorView } from "codemirror";
import { Command, ViewPlugin, ViewUpdate, keymap } from "@codemirror/view";
import { syntaxTree } from "@codemirror/language";
import { EditorStateConfig, Extension, EditorSelection } from "@codemirror/state";
import {indentWithTab} from "@codemirror/commands";
import { snippet } from "@codemirror/autocomplete";
import { Tree } from "@lezer/common";
import { JinnCodemirror } from "./jinn-codemirror";

/**
 * Supported editor modes
 */
 export enum SourceType {
    xml = 'xml',
    leiden_plus = 'leiden_plus',
    edcs = "edcs",
    phi = "phi",
    default = "default"
};

export interface EditorCommands {
    [index:string]: Command|{create: Function}
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
 * Creates a command which wraps the current selection with a prefix and suffix.
 * 
 * @param start prefix to insert before selection
 * @param end suffix to insert after selection
 * @returns command to execute
 */
export const insertCommand = (insert:string):Command => (editor) => {
    editor.dispatch(editor.state.changeByRange(range => {
        return {
            changes: [{from: range.from, insert}],
            range: EditorSelection.range(range.from, range.from)
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
    template = template.replace(/\$\|([^|]+)\|/g, '${$1}');
    editor.state.selection.ranges.forEach((range) => {
        const content = editor.state.doc.slice(range.from, range.to);
        const snip = snippet(template.replace(/\${_}/, `\${${content.toString()}}`));
        snip(editor, {label: ''}, range.from, range.to);
    });
    return true;
}

export abstract class EditorConfig {

    editor: JinnCodemirror;

    constructor(editor:JinnCodemirror) {
        this.editor = editor;
    }

    getConfig(): EditorStateConfig {
        const self = this;
        const updateListener = ViewPlugin.fromClass(class {
            update(update: ViewUpdate) {
                if (update.docChanged) {
                    const tree = syntaxTree(update.state);
                    const lines = update.state.doc.toJSON();
                    const content = self.onUpdate(tree, lines.join('\n'));
                    
                    // save content to property `value` on editor parent
                    try {
                        const serialized = self.serialize();
                        if (serialized) {
                            self.editor._value = serialized;
                            self.editor.emitUpdateEvent(content);
                        }
                    } catch (e) {
                        // suppress updates (invalid data)
                    }
                }
            }
        });

        const customExtensions = this.getExtensions(this.editor);
        return { extensions: [basicSetup, EditorView.lineWrapping, keymap.of([indentWithTab]),...customExtensions, updateListener] };
    }

    abstract getExtensions(editor: JinnCodemirror): Extension[];

    getCommands():EditorCommands {
        return {};
    }

    onUpdate(tree: Tree, content: string) {
        return content;
    }

    abstract setFromValue(value: Element|NodeListOf<ChildNode>|string|null|undefined): string;

    abstract serialize(): Element | NodeListOf<ChildNode> | string | null | undefined;
}
