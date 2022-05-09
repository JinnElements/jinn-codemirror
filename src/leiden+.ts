import { EditorSelection, Extension } from "@codemirror/state";
import { Tree, TreeCursor } from "@lezer/common";
import { EditorView, keymap, KeyBinding, Command } from "@codemirror/view";
import { syntaxTree } from "@codemirror/language";
import { Diagnostic, linter, lintGutter } from "@codemirror/lint";
import { syntax2epiDoc } from ".";
import { EditorConfig, EditorCommands, snippetCommand, wrapCommand } from "./config";
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

export const toggleUnclearCommand:Command = (editor) => {
    editor.dispatch(editor.state.changeByRange(range => {
        const content = editor.state.doc.slice(range.from, range.to).toString();
        let newContent = '';
        for (let i = 0; i < content.length; i++) {
            if (i + 1 < content.length && content.charCodeAt(i + 1) === 0x323) {
                newContent += content.charAt(i);
                i++;
            } else {
                newContent += `${content.charAt(i)}\u0323`;
            }
        }
        return {
            changes: [{from: range.from, to: range.to, insert: newContent}],
            range: EditorSelection.range(range.from, range.from + newContent.length)
        };
    }));
    return true;
}

const commands:EditorCommands = {
    expan: snippetCommand('(${_}(${}))'),
    div: wrapCommand('<=\n', '\n=>'),
    fragment: snippetCommand('<D=.${1:1}.fragment<=\n${2}\n=>=D>'),
    part: snippetCommand('<D=.${1:A}.part<=\n${2}\n=>=D>'),
    recto: wrapCommand('<D=.r<=\n', '\n=>=D>'),
    verso: wrapCommand('<D=.v<=\n', '\n=>=D>'),
    erasure: wrapCommand('〚', '〛'),
    unclear: toggleUnclearCommand
};

const leidenKeymap: readonly KeyBinding[] = [
    { key: "Ctrl-l Ctrl-e", mac: "Cmd-l Cmd-e", run: commands.expan },
    { key: "Ctrl-l Ctrl-a", mac: "Cmd-l Cmd-a", run: commands.div },
    { key: "Ctrl-l Ctrl-f", mac: "Cmd-l Cmd-f", run: commands.fragment },
    { key: "Ctrl-l Ctrl-p", mac: "Cmd-l Cmd-p", run: commands.part },
    { key: "Ctrl-l Ctrl-r", mac: "Cmd-l Cmd-r", run: commands.recto },
    { key: "Ctrl-l Ctrl-v", mac: "Cmd-l Cmd-v", run: commands.verso },
    { key: "Ctrl-l Ctrl-d", mac: "Cmd-l Cmd-d", run: commands.erasure },
    { key: "Ctrl-l Ctrl-u", mac: "Cmd-l Cmd-u", run: commands.unclear }
];

export class LeidenConfig extends EditorConfig {
    async getExtensions(): Promise<Extension[]> {
        return [leiden(), linter(leidenParseLinter()), keymap.of(leidenKeymap), lintGutter()];
    }

    getCommands():EditorCommands {
        return commands;
    }

    onUpdate(tree: Tree, content: string): string {
        return syntax2epiDoc(tree, content);
    }

    serialize(): string | Node {
        return this.editor.content;
    }
}