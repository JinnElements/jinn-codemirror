import { EditorSelection, Extension } from "@codemirror/state";
import { Tree, TreeCursor } from "@lezer/common";
import { EditorView, keymap, KeyBinding, Command, placeholder } from "@codemirror/view";
import { syntaxTree } from "@codemirror/language";
import { Diagnostic, linter, lintGutter } from "@codemirror/lint";
import { leidenPlus2epiDoc, debugLeidenTree } from "./import/leiden+2xml";
import { EditorConfig, EditorCommands, snippetCommand, wrapCommand } from "./config";
import { leiden } from "./language";
import { xml2leidenPlus } from "./import/xml2leiden+";
import { JinnCodemirror } from "./jinn-codemirror";

const leidenParseLinter = (editor: JinnCodemirror) => (view: EditorView): Diagnostic[] => {

    function emitEvent(valid: boolean) {
        editor.valid = valid;
        editor.dispatchEvent(new CustomEvent(valid ? 'valid' : 'invalid', {
            detail: diagnostics,
            composed: true,
            bubbles: true
        }));
    }

    const diagnostics:Diagnostic[] = [];
    const tree = syntaxTree(view.state);
    let abbrevs = 0;
    let hasInnerAbbrev = false;
    tree.iterate({
        enter: (node:TreeCursor) => {
            if (node.name === 'Abbrev') {
                abbrevs += 1;
            } else if (node.type.isError) {
                diagnostics.push({
                    message: 'Syntaxfehler',
                    severity: 'error',
                    from: node.from,
                    to: node.to
                });
            }
        },
        leave: (node:TreeCursor) => {
            if (node.name === 'Abbrev') {
                if (abbrevs === 2) {
                    hasInnerAbbrev = true;
                } else if (!hasInnerAbbrev) {
                    diagnostics.push({
                        message: 'Invalid abbreviation. Abbreviations must\nuse double parenthesis, e.g. "(C(aesar))"',
                        severity: 'error',
                        from: node.from,
                        to: node.to
                    });
                }
                abbrevs -= 1;
                if (abbrevs === 0) {
                    hasInnerAbbrev = false;
                }
            }
        }
    });
    
    emitEvent(diagnostics.length === 0);
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

export const fixNewlinesCommand: Command = (editor) => {
    const content = editor.state.doc.toString();
    let matchCount = 0;
    const fixed = content.replace(/^(?!\d+\.)/gm, () => {
        matchCount += 1;
        return `${matchCount}. `;
    });
    editor.dispatch({
        changes: [{from: 0, to: editor.state.doc.length, insert: fixed}]
    });
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
    foreign: snippetCommand('~|${_}|~${2:gr}'),
    unclear: toggleUnclearCommand,
    fixNewlines: fixNewlinesCommand,
    snippet: {
        create: (template:string) => snippetCommand(template)
    }
};

const leidenKeymap: readonly KeyBinding[] = [
    { key: "Ctrl-Shift-e", mac: "Cmd-Shift-e", run: commands.expan },
    { key: "Ctrl-Shift-a", mac: "Cmd-Shift-a", run: commands.div },
    { key: "Ctrl-Shift-f", mac: "Cmd-Shift-f", run: commands.fragment },
    { key: "Ctrl-Shift-p", mac: "Cmd-Shift-p", run: commands.part },
    { key: "Ctrl-Shift-r", mac: "Cmd-Shift-r", run: commands.recto },
    { key: "Ctrl-Shift-v", mac: "Cmd-Shift-v", run: commands.verso },
    { key: "Ctrl-Shift-d", mac: "Cmd-Shift-d", run: commands.erasure },
    { key: "Ctrl-Shift-u", mac: "Cmd-Shift-u", run: commands.unclear },
    { key: "Ctrl-Shift-f", mac: "Cmd-Shift-f", run: commands.foreign }
];

export class LeidenConfig extends EditorConfig {
    
    constructor(editor:JinnCodemirror, toolbar: HTMLElement[]) {
        super(editor, commands, toolbar);
    }

    async getExtensions(): Promise<Extension[]> {
        return [
            leiden(), 
            linter(leidenParseLinter(this.editor)), 
            keymap.of(leidenKeymap), 
            lintGutter(),
            placeholder(this.editor.placeholder)
        ];
    }

    getCommands():EditorCommands {
        return commands;
    }

    onUpdate(tree: Tree, content: string): string {
        // debugLeidenTree(content, tree);
        return leidenPlus2epiDoc(content, tree);
    }

    serialize(): Element | string | null {
        return this.editor.content;
    }

    setFromValue(value: Element | NodeListOf<ChildNode> | string | null|undefined): string {
        if (!value) { return '' }
        if (value instanceof NodeList) {
            const result:string[] = [];
            value.forEach((node) => result.push(xml2leidenPlus(node)));
            return result.join('');
        }
        if (value instanceof Element) {
            return xml2leidenPlus(value); 
        }
        if (!(typeof value === 'string')) {
            throw new Error("cannot set value")
        }
        return value;
    }
}