import { EditorView } from "@codemirror/basic-setup";
declare class JinnCodemirror extends HTMLElement {
    mode?: string;
    _editor?: EditorView;
    constructor();
    connectedCallback(): void;
    set content(text: string);
    private renderToolbar;
    styles(): string;
}
export { JinnCodemirror };
