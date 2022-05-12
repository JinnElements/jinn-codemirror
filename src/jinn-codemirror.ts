import {EditorState, EditorView} from "@codemirror/basic-setup";
import { XMLConfig } from "./xml";
import { LeidenConfig } from "./leiden+";
import { EditorConfig } from "./config";

export class JinnCodemirror extends HTMLElement {

    public mode?: string;

    _value?: Element | string | null;
    _editor?: EditorView;
    _config?: EditorConfig;
    _remote?: boolean;

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

        switch(this.mode) {
            case 'leiden':
            case 'leiden+':
                this._config = new LeidenConfig(this);
                break;
            default:
                this._config = new XMLConfig(this);
                break;
        }

        const wrapper = document.createElement('div');
        this.shadowRoot?.appendChild(wrapper);
        this._config.getConfig()
        .then((stateConfig) => {
            this._editor = new EditorView({
                state: EditorState.create(stateConfig),
                parent: wrapper
            });
            this.renderToolbar(this._config);
            if (!this._config) {
                return
            }
            this.content = this._config.setFromValue(this._value);
        });
    }

    set valid(value:boolean) {
        this.setAttribute('valid', value.toString());
    }
      
    get valid():boolean {
        return Boolean(this.hasAttribute('valid'))
    }

    set content(text:string) {
        if (!this._editor) {
            console.log('no editor');
            return;
        }
        const tx = this._editor.state.update({
            changes: {from: 0, to: this._editor.state.doc.length, insert: text}
        });

        this._editor.dispatch(tx);
    }

    get content(): string {
        return this._editor?.state.doc.toString() || '';
    }

    set value(value: Element | string | null | undefined) {
        if (!this._config) {
            return;
        }
        const newContent = this._config.setFromValue(value)
        if (this.content === newContent) {
            console.debug("value unchanged");
            return;
        }
        this._remote = true;
        this._value = value;
        this.content = newContent;
    }

    get value(): Element | string | null {
        if (!this._value) { return null }
        return this._value;
    }

    private renderToolbar(config?:EditorConfig) {
        if (!config) {
            return;
        }
        const commands = config.getCommands();
        const slot:HTMLSlotElement|null|undefined = this.shadowRoot?.querySelector('[name=toolbar]');
        slot?.assignedElements().forEach((elem) => {
            elem.querySelectorAll('[data-command]').forEach((btn) => {
                const cmdName = <string>(<HTMLElement>btn).dataset.command;
                const command = commands[cmdName];
                if (command) {
                    btn.addEventListener('click', () => {
                        command(<EditorView>this._editor)
                        this._editor?.focus();
                    });
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