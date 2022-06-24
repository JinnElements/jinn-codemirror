import { EditorView } from "@codemirror/basic-setup";
import { Command } from "@codemirror/view";
import { EditorStateConfig, Extension } from "@codemirror/state";
import { Tree } from "@lezer/common";
/**
 * Supported editor modes
 */
declare enum SourceType {
    xml = "xml",
    leiden_plus = "leiden_plus",
    edcs = "edcs",
    phi = "phi",
    default = "default"
}
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
    abstract setFromValue(value: Element | string | null | undefined): string;
    abstract serialize(): Element | string | null;
}
declare class JinnCodemirror extends HTMLElement {
    _mode: SourceType;
    _value?: Element | string | null;
    _namespace?: string | null;
    _editor?: EditorView;
    _config?: EditorConfig;
    _remote?: boolean;
    constructor();
    connectedCallback(): void;
    focus(): void;
    set mode(mode: string);
    get mode(): string;
    set valid(value: boolean);
    get valid(): boolean;
    set content(text: string);
    get content(): string;
    set value(value: Element | string | null | undefined);
    get value(): Element | string | null;
    private initModes;
    private registerToolbar;
    private activateToolbar;
    styles(): string;
}
export { JinnCodemirror };
