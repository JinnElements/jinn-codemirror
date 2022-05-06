import { EditorState, Extension, EditorSelection } from "@codemirror/state";
import { Tree, TreeCursor } from "@lezer/common";
import { EditorView, Command, keymap, KeyBinding } from "@codemirror/view";
import { syntaxTree } from "@codemirror/language";
import { Diagnostic, linter, lintGutter } from "@codemirror/lint";
import { syntax2epiDoc } from ".";
import { EditorConfig } from "./config";
import { JinnCodemirror } from "./jinn-codemirror";
import { leiden } from "./language";

const leidenParseLinter = () => (view: EditorView): Diagnostic[] => {
    const diagnostics:Diagnostic[] = [];
    const tree = syntaxTree(view.state);
    tree.iterate({
        enter: (node:TreeCursor) => {
            if (node.type.isError) {
                diagnostics.push({
                    message: 'Syntaxfehler',
                    severity: 'error',
                    from: node.from,
                    to: node.to
                });
            }
        }
    });
    return diagnostics;
}

const wrapCommand = (start:string, end:string, pos:number = -1):Command => (editor) => {
    editor.dispatch(editor.state.changeByRange(range => {
        return {
            changes: [{from: range.from, insert: start}, {from: range.to, insert: end}],
            range: EditorSelection.range(range.from + start.length, range.to + start.length)
        };
    }));
    return true;
}

const expanCommand:Command = (editor) => {
    editor.dispatch(editor.state.changeByRange(range => {
        return {
            changes: [{from: range.from, insert: '('}, {from: range.to, insert: '())'}],
            range: EditorSelection.range(range.to + 2, range.to + 2)
        };
    }));
    return true;
}

const leidenKeymap: readonly KeyBinding[] = [
    { key: "Ctrl-l Ctrl-e", mac: "Cmd-l Cmd-e", run: expanCommand },
    { key: "Ctrl-l Ctrl-a", mac: "Cmd-l Cmd-a", run: wrapCommand('<=', '=>') },
    { key: "Ctrl-l Ctrl-f", mac: "Cmd-l Cmd-f", run: wrapCommand('<D=.1.fragment\n', '\n=D>') },
    { key: "Ctrl-l Ctrl-p", mac: "Cmd-l Cmd-p", run: wrapCommand('<D=.A.part', '=D>')},
    { key: "Ctrl-l Ctrl-r", mac: "Cmd-l Cmd-r", run: wrapCommand('<D=.r', '=D>')},
    { key: "Ctrl-l Ctrl-v", mac: "Cmd-l Cmd-v", run: wrapCommand('<D=.v', '=D>')}
];

export class LeidenConfig extends EditorConfig {
    async getExtensions(editor: JinnCodemirror): Promise<Extension[]> {
        return [leiden(), linter(leidenParseLinter()), keymap.of(leidenKeymap), lintGutter()];
    }

    onUpdate(tree: Tree, content: string): string {
        return syntax2epiDoc(tree, content);
    }
}