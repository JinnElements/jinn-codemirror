import {EditorState, EditorView} from "@codemirror/basic-setup";
import { XMLConfig } from "./xml";
import { LeidenConfig } from "./leiden+";
import { EditorConfig } from "./config";

export class JinnCodemirror extends HTMLElement {

    public mode?: string;
    
    _editor?: EditorView;

    constructor() {
        super();
        this.attachShadow({mode: 'open'});

        const css = document.createElement('style');
        css.innerHTML = this.styles();
        this.shadowRoot?.appendChild(css);

        const toolbarSlot = document.createElement('slot');
        toolbarSlot.name = 'toolbar';
        this.shadowRoot?.appendChild(toolbarSlot);
    }

    connectedCallback() {
        this.mode = this.getAttribute('mode') || 'xml';
        console.log(`<jinn-codemirror> mode: ${this.mode}`);

        const initialContent = this.innerHTML;
        let config:EditorConfig;
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
        .then((stateConfig) => {
            this._editor = new EditorView({
                state: EditorState.create(stateConfig),
                parent: wrapper
            });
            this.renderToolbar(config);
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

    private renderToolbar(config:EditorConfig) {
        const commands = config.getCommands();
        const slot:HTMLSlotElement|null|undefined = this.shadowRoot?.querySelector('[name=toolbar]');
        slot?.assignedElements().forEach((elem) => {
            elem.querySelectorAll('[data-command]').forEach((btn) => {
                const cmdName = <string>(<HTMLElement>btn).dataset.command;
                const command = commands[cmdName];
                if (command) {
                    btn.addEventListener('click', () => command(<EditorView>this._editor));
                }
            });
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