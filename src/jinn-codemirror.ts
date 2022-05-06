import {EditorState, EditorView} from "@codemirror/basic-setup";
import { XMLConfig } from "./xml";
import { LeidenConfig } from "./leiden+";

export class JinnCodemirror extends HTMLElement {

    public mode?: string;
    
    _editor?: EditorView;

    constructor() {
        super();
        this.attachShadow({mode: 'open'});

        const css = document.createElement('style');
        css.innerHTML = this.styles();
        this.shadowRoot?.appendChild(css);
    }

    connectedCallback() {
        this.mode = this.getAttribute('mode') || 'xml';
        console.log(`<jinn-codemirror> mode: ${this.mode}`);

        const initialContent = this.innerHTML;
        let config;
        switch(this.mode) {
            case 'leiden':
                config = new LeidenConfig();
                break;
            default:
                config = new XMLConfig();
                break;
        }

        const wrapper = document.createElement('div');
        this.shadowRoot?.appendChild(wrapper);
        config.getConfig(this)
        .then((config) => {
            this._editor = new EditorView({
                state: EditorState.create(config),
                parent: wrapper
            });
        });
        this.content = initialContent;
    }

    set content(text:string) {
        if (!this._editor) {
            console.log('no editor');
            return;
        }
        this._editor.dispatch({
            changes: {from: 0, to: this._editor.state.doc.length, insert: text}
        });
    }

    styles() {
        return `
            > div, .cm-editor {
                height: 100%;
                width: 100%;
            }
        `;
    }
}

window.customElements.define('jinn-codemirror', JinnCodemirror);