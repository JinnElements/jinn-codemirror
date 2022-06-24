import { EditorSelection, Extension } from "@codemirror/state";
import { Tree, TreeCursor } from "@lezer/common";
import { EditorView, keymap, KeyBinding, Command } from "@codemirror/view";
import { syntaxTree } from "@codemirror/language";
import { Diagnostic, linter, lintGutter } from "@codemirror/lint";
import { leidenPlus2epiDoc } from ".";
import { EditorConfig, EditorCommands, snippetCommand, wrapCommand, insertCommand } from "./config";
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
    { key: "Ctrl-Shift-e", mac: "Cmd-Shift-e", run: commands.expan },
    { key: "Ctrl-Shift-a", mac: "Cmd-Shift-a", run: commands.div },
    { key: "Ctrl-Shift-f", mac: "Cmd-Shift-f", run: commands.fragment },
    { key: "Ctrl-Shift-p", mac: "Cmd-Shift-p", run: commands.part },
    { key: "Ctrl-Shift-r", mac: "Cmd-Shift-r", run: commands.recto },
    { key: "Ctrl-Shift-v", mac: "Cmd-Shift-v", run: commands.verso },
    { key: "Ctrl-Shift-d", mac: "Cmd-Shift-d", run: commands.erasure },
    { key: "Ctrl-Shift-u", mac: "Cmd-Shift-u", run: commands.unclear }
];

export class LeidenConfig extends EditorConfig {
    
    async getExtensions(): Promise<Extension[]> {
        return [leiden(), linter(leidenParseLinter()), keymap.of(leidenKeymap), lintGutter()];
    }

    getCommands():EditorCommands {
        return commands;
    }

    onUpdate(tree: Tree, content: string): string {
        return leidenPlus2epiDoc(content, tree);
    }

    serialize(): Element | string | null {
        return this.editor.content;
    }
    setFromValue(value: Element | string | null|undefined): string {
        if (!value) { return '' }
        if (!(typeof value === 'string')) {
            throw new Error("cannot set value")
        }
        return value;
    }
}