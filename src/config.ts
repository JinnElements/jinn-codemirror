import { basicSetup } from "codemirror";
import { EditorView, placeholder, Panel, showPanel } from "@codemirror/view";
import { Command, ViewPlugin, ViewUpdate, keymap, KeyBinding } from "@codemirror/view";
import { syntaxTree } from "@codemirror/language";
import { EditorStateConfig, Extension, EditorSelection } from "@codemirror/state";
import {indentWithTab} from "@codemirror/commands";
import { snippet } from "@codemirror/autocomplete";
import { oneDarkTheme } from "@codemirror/theme-one-dark";
import { materialDark, materialLight } from '@uiw/codemirror-theme-material';
import { solarizedDark, solarizedLight } from "@uiw/codemirror-theme-solarized";
import { Tree } from "@lezer/common";
import { JinnCodemirror } from "./jinn-codemirror";

function theme(name:string): Extension|null {
    switch(name) {
        case 'dark':
            return oneDarkTheme;
        case 'material-dark':
            return materialDark;
        case 'material-light':
            return materialLight;
        case 'solarized-dark':
            return solarizedDark;
        case 'solarized-light':
            return solarizedLight;
        default:
            return null;
    }
}

/**
 * Supported editor modes
 */
 export enum SourceType {
    xml = 'xml',
    html = 'html',
    leiden_plus = 'leiden_plus',
    edcs = "edcs",
    phi = "phi",
    default = "default",
    xquery = "xquery",
    css = "css",
    tex = "tex",
    markdown = "markdown",
    json = "json"
};

export abstract class ParametrizedCommand {
    abstract create(...params:any): Command;
}

export interface EditorCommands {
    [index:string]: Command|ParametrizedCommand
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
        if (content.length > 0) {
            template = template.replace(/\${(?:\d+:)?_}/, content.toString());
        } else {
            template = template.replace(/\${(\d+:)?_}/, '${$1}');
        }
        const snip = snippet(template);
        snip(editor, {label: ''}, range.from, range.to);
    });
    return true;
}

export function initCommand(cmdName: string, cmd: Command|ParametrizedCommand, control: HTMLElement):Command|null {
    if (cmd.create) {
        const paramsAttr = (control).dataset.params;
        if (paramsAttr) {
            let params;
            try {
                params = JSON.parse(paramsAttr);
            } catch (e) {
                params = [paramsAttr];
            }
            if (Array.isArray(params) && params.length === cmd.create.length) {
                return cmd.create.apply(null, params);
            } else {
                console.error('<jinn-codemirror> Expected %d arguments for command %s', cmd.create.length, cmdName);
                return null;
            }
        }
    }
    return <Command>cmd;
}

export const defaultCommands:EditorCommands = {
    snippet: {
        create: (template:string) => snippetCommand(template)
    }
};

export abstract class EditorConfig {

    editor: JinnCodemirror;
    keymap: KeyBinding[];
    commands: EditorCommands;
    threshold: number = 300;
    _status: HTMLDivElement|null = null;
    protected namespace: string|null;

    constructor(editor:JinnCodemirror, toolbar: HTMLElement[] = [], commands: EditorCommands = defaultCommands) {
        this.editor = editor;
        this.commands = commands;
        this.keymap = [];
        this.namespace = null;
        if (toolbar) {
            toolbar.forEach((control) => {
                const cmdName = <string>(<HTMLElement>control).dataset.command;
                const cmd = commands[cmdName];
                if (cmd) {
                    const shortcut = control.getAttribute('data-key');
                    if (shortcut && shortcut.length > 0) {
                        const command = initCommand(cmdName, cmd, control);
                        if (command) {
                            const binding:KeyBinding = {
                                key: shortcut,
                                run: command
                            };
                            this.keymap.push(binding);
                        }
                    }
                }
            });
        }
    }

    async getConfig(): Promise<EditorStateConfig> {
        const self = this;
        let runningUpdate:any = null;
        const updateListener = ViewPlugin.fromClass(class {
            update(update: ViewUpdate) {
                if (update.docChanged) {
                    if (runningUpdate) {
                        clearTimeout(runningUpdate);
                    }
                    runningUpdate = setTimeout(() => {
                        const tree = syntaxTree(update.state);
                        const lines = update.state.doc.toJSON();
                        const content = self.onUpdate(tree, lines.join('\n'));
                        
                        // save content to property `value` on editor parent
                        try {
                            const serialized = self.serialize();
                            if (serialized != null) {
                                self.editor._value = serialized;
                                self.editor.emitUpdateEvent(content);
                            }
                        } catch (e) {
                            // suppress updates (invalid data)
                        }
                    }, self.threshold);
                }
            }
        });

        const createStatusPanel = (view: EditorView): Panel => {
            this._status = document.createElement("div");
            this._status.className = 'status';
            this._status.part = 'status';
            return {
              dom: this._status
            }
        };

        const customExtensions = await this.getExtensions(this.editor);
        const extensions = [
            basicSetup, 
            EditorView.lineWrapping, 
            keymap.of([indentWithTab, ...this.keymap]),
            placeholder(this.editor.placeholder),
            ...customExtensions, 
            updateListener,
            showPanel.of(createStatusPanel)
        ];

        if (this.editor && this.editor.theme) {
            const extTheme = theme(this.editor.theme);
            if (extTheme) {
                extensions.push(extTheme);
            } else {
                console.error('<jinn-codemirror> Unknown theme: %s', this.editor.theme);
            }
        }
        return { extensions };
    }

    abstract getExtensions(editor: JinnCodemirror): Promise<Extension[]>;

    getCommands():EditorCommands {
        return this.commands;
    }

    onUpdate(tree: Tree, content: string) {
        return content;
    }

    /**
     * Strips default namespace declarations (xmlns="...") from serialized XML string
     * Only removes namespaces that match this.namespace
     */
    private stripDefaultNamespaces(xmlString: string): string {
        // If no namespace is set, don't remove anything
        if (!this.namespace) {
            return xmlString;
        }
        // Remove xmlns="..." attributes only if the namespace URI matches this.namespace
        // Escape special regex characters in the namespace URI
        const escapedNamespace = this.namespace.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\s+xmlns\\s*=\\s*["']${escapedNamespace}["']`, 'g');
        return xmlString.replace(regex, '');
    }

    setFromValue(value: Element|NodeListOf<ChildNode>|string|null|undefined): string {
        if (!value) { 
            return '';
        }
        if (value instanceof Node || value instanceof NodeList) {
            const serializer = new XMLSerializer();
            if (value instanceof NodeList) {
                const buf = [];
                for (let i = 0; i < (<NodeList>value).length; i++) {
                    buf.push(this.stripDefaultNamespaces(serializer.serializeToString(value[i])));
                }
                return buf.join('');
            }
            return this.stripDefaultNamespaces(serializer.serializeToString(value));
        }
        if (typeof value === 'string') {
            return value;
        }
        return JSON.stringify(value);
    }

    abstract serialize(): Element | NodeListOf<ChildNode> | string | null | undefined;

    set status(msg:string) {
        if (this._status) {
            this._status.innerHTML = msg;
        }
    }
}
