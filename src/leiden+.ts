import { EditorState, Extension, EditorSelection } from "@codemirror/state";
import { Tree, TreeCursor } from "@lezer/common";
import { EditorView, Command, keymap, KeyBinding } from "@codemirror/view";
import { syntaxTree } from "@codemirror/language";
import { Diagnostic, linter, lintGutter } from "@codemirror/lint";
import { syntax2epiDoc } from ".";
import { EditorConfig, EditorCommands } from "./config";
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

const commands:EditorCommands = {
    expan: expanCommand,
    div: wrapCommand('<=', '=>'),
    fragment: wrapCommand('<D=.1.fragment\n', '\n=D>'),
    part: wrapCommand('<D=.A.part', '=D>'),
    recto: wrapCommand('<D=.r', '=D>'),
    verso: wrapCommand('<D=.v', '=D>')
};

const leidenKeymap: readonly KeyBinding[] = [
    { key: "Ctrl-l Ctrl-e", mac: "Cmd-l Cmd-e", run: commands.expan },
    { key: "Ctrl-l Ctrl-a", mac: "Cmd-l Cmd-a", run: commands.div },
    { key: "Ctrl-l Ctrl-f", mac: "Cmd-l Cmd-f", run: commands.fragment },
    { key: "Ctrl-l Ctrl-p", mac: "Cmd-l Cmd-p", run: commands.part },
    { key: "Ctrl-l Ctrl-r", mac: "Cmd-l Cmd-r", run: commands.recto },
    { key: "Ctrl-l Ctrl-v", mac: "Cmd-l Cmd-v", run: commands.verso }
];

export class LeidenConfig extends EditorConfig {
    async getExtensions(editor: JinnCodemirror): Promise<Extension[]> {
        return [leiden(), linter(leidenParseLinter()), keymap.of(leidenKeymap), lintGutter()];
    }

    getCommands():EditorCommands {
        return commands;
    }

    onUpdate(tree: Tree, content: string): string {
        return syntax2epiDoc(tree, content);
    }
}