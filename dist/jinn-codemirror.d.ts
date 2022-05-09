import { EditorView } from "@codemirror/basic-setup";
import { Command } from "@codemirror/view";
import { EditorStateConfig, Extension } from "@codemirror/state";
import { Tree } from "@lezer/common";
interface EditorCommands {
    [index: string]: Command;
}
declare abstract class EditorConfig {
    editor: JinnCodemirror;
    constructor(editor: JinnCodemirror);
    getConfig(): Promise<EditorStateConfig>;
    abstract getExtensions(editor: JinnCodemirror): Promise<Extension[]>;
    getCommands(): EditorCommands;
    onUpdate(tree: Tree, content: string): string;
    abstract serialize(): undefined | Node | string;
}
declare class JinnCodemirror extends HTMLElement {
    mode?: string;
    value?: Node | string;
    _editor?: EditorView;
    _config?: EditorConfig;
    constructor();
    connectedCallback(): void;
    set content(text: string);
    get content(): string;
    private renderToolbar;
    styles(): string;
}
export { JinnCodemirror };
