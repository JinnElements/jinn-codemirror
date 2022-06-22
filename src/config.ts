import { EditorView, basicSetup } from "@codemirror/basic-setup";
import { Command, ViewPlugin, ViewUpdate } from "@codemirror/view";
import { syntaxTree } from "@codemirror/language";
import { EditorStateConfig, Extension, EditorSelection, StateEffect } from "@codemirror/state";
import { snippet } from "@codemirror/autocomplete";
import { Tree } from "@lezer/common";
import { JinnCodemirror } from "./jinn-codemirror";
import { Diagnostic, setDiagnosticsEffect } from "@codemirror/lint";

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
                    try {
                        const serialized = self.serialize();
                        self.editor._value = serialized;
                        if (self.editor._remote) {
                            self.editor._remote = false
                            return
                        }
                        self.editor.dispatchEvent(new CustomEvent('update', {
                            detail: {content, serialized},
                            composed: true,
                            bubbles: true
                        }));
                    }
                    catch (e) {
                        // suppress updates (invalid data)
                        return
                    }
                }
                else {
                    const firstTransaction = update.transactions[0]
                    if (firstTransaction) {
                        // linter messages have a severity
                        const linterMessages:StateEffect<Diagnostic[]>[] = firstTransaction.effects.filter(effect => effect.is(setDiagnosticsEffect))
                        if (linterMessages) {
                            const check:{valid:boolean, errors:string[]} = linterMessages.reduce((result:{valid:boolean, errors:string[]}, effect:StateEffect<Diagnostic[]>) => {
                                const error:Diagnostic[] = effect.value.filter((value: Diagnostic) => {
                                    return value.severity === "error";
                                })
                                const info:Diagnostic[] = effect.value.filter((value: Diagnostic) => {
                                    return value.severity === "info";
                                })
                                if (error.length) {
                                    result.valid = false
                                    for (let e of error) {
                                        result.errors.push(e?.message);
                                    }
                                }
                                result.valid = result.valid || (error.length === 0 && info.length > 0)
                                return result;

                            }, {valid: self.editor.valid, errors: []})
                            if (check.valid === self.editor.valid) {
                                return
                            }
                            self.editor.valid = check.valid
                            if (check.valid) {
                                self.editor.dispatchEvent(new CustomEvent('valid', {
                                    composed: true,
                                    bubbles: true
                                }));
                                return;
                            }
                            self.editor.dispatchEvent(new CustomEvent('invalid', {
                                detail: check.errors,
                                composed: true,
                                bubbles: true
                            }));
                        }
                    }
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

    abstract setFromValue(value: Element|string|null|undefined): string;

    abstract serialize(): Element | string | null;
}
