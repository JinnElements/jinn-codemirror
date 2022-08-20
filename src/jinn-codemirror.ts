import { EditorState, EditorView } from "@codemirror/basic-setup";
import { XMLConfig } from "./xml";
import { LeidenConfig } from "./leiden+";
import { AncientTextConfig } from "./ancientText";
import { EditorConfig, SourceType } from "./config";

/**
 * Source code editor component based on [codemirror](https://codemirror.net/).
 * Features extended support for XML and Leiden+ code.
 * 
 * @slot toolbar - toolbar to be shown
 * @fires update - fired when the content of the editor has changed
 * @fires valid - fired if the content of the editor is valid (requires a linting to be supported)
 * @fires invalid - fired if the content of the editor is invalid (requires a linting to be supported)
 */
export class JinnCodemirror extends HTMLElement {

    _mode: SourceType = SourceType.xml;
    _value?: Element | NodeListOf<ChildNode> | string | null;

    /**
     * Default element namespace to enforce on the root element in
     * XML mode
     */
    public namespace?: string | null;

    _editor?: EditorView;
    _config?: EditorConfig;

    constructor() {
        super();
        this.attachShadow({mode: 'open'});
    }

    connectedCallback() {
        const css = document.createElement('style');
        css.innerHTML = this.styles();
        this.shadowRoot?.appendChild(css);

        const toolbarSlot = document.createElement('slot');
        toolbarSlot.name = 'toolbar';
        this.shadowRoot?.appendChild(toolbarSlot);
        const wrapper = document.createElement('div');
        wrapper.id = 'editor';
        this.shadowRoot?.appendChild(wrapper);
        this.registerToolbar(this.shadowRoot?.querySelector('[name=toolbar]'));

        this.namespace = this.getAttribute('namespace');
        this.mode = this.initModes() || this.getAttribute('mode') || 'xml';

        this.addEventListener('blur', (ev) => {
            const target = ev.relatedTarget;
            if (target) {
                let parent = (<Element>target).parentNode;
                while (parent) {
                    if (parent === this) {
                        ev.preventDefault();
                        ev.stopPropagation();
                        return;
                    }
                    parent = parent.parentNode;
                }
            }
        });
    }

    /**
     * Move keyboard focus to the editor
     */
    focus() {
        if (this._editor) {
            this._editor.focus();
        }
    }

    /**
     * The mode to use. Currently supported are 'xml', 'leiden_plus', 'edcs', 'phi' or 'default'.
     */
    set mode(mode:string) {
        const wrapper = this.shadowRoot?.getElementById('editor');
        if (!wrapper) {
            return;
        }

        if (this._editor) {
            this._editor.destroy();
        }

        this._mode = SourceType[mode as keyof typeof SourceType];
        console.log(`<jinn-codemirror> mode: ${this.mode}`);
        this.activateToolbar(this.shadowRoot?.querySelector('[name=toolbar]'));
        this.configure();

        const select = this.querySelector('[name=modes]');
        if (select && select instanceof HTMLSelectElement) {
            select.value = this._mode;
        }

        const stateConfig = this._config?.getConfig();
        
        this._editor = new EditorView({
            state: EditorState.create(stateConfig),
            parent: wrapper
        });
        if (!this._config) {
            return
        }
        this.content = this._config.setFromValue(this._value);
    }

    protected configure() {
        switch(this._mode) {
            case SourceType.default:
            case SourceType.edcs:
            case SourceType.phi:
                this._config = new AncientTextConfig(this, this._mode);
                break;
            case SourceType.leiden_plus:
                this._config = new LeidenConfig(this);
                break;
            default:
                this._config = new XMLConfig(this, this.namespace);
                break;
        }
    }

    get mode(): string {
        return this._mode;
    }

    set valid(value:boolean) {
        this.setAttribute('valid', value.toString());
    }
      
    get valid():boolean {
        return Boolean(this.hasAttribute('valid'))
    }

    /**
     * The content edited in the editor as a string.
     */
    set content(text:string) {
        if (!this._editor) {
            console.log('no editor');
            return;
        }
        this._editor.dispatch({
            changes: {from: 0, to: this._editor.state.doc.length, insert: text}
        });
    }

    get content(): string {
        return this._editor?.state.doc.toString() || '';
    }

    /**
     * The value edited in the editor as either an Element or string -
     * depending on the mode set.
     */
    set value(value: Element | NodeListOf<ChildNode> | string | null | undefined) {
        const updated = this.setValue(value);

        if (updated && this._editor && this._config) {
            this.content = this._config?.setFromValue(this._value);
        }
    }

    get value(): Element | NodeListOf<ChildNode> | string | null {
        return this.getValue();
    }

    protected setValue(value: Element | NodeListOf<ChildNode> | string | null | undefined): boolean {
        if (!this._config) {
            return false;
        }
        const _val = this._config.setFromValue(value);
        if (this._value === _val) {
            return false;
        }
        this._value = value;
        return true;
    }

    protected getValue(): Element | NodeListOf<ChildNode> | string | null {
        if (!this._value) { return null }
        return this._value;
    }

    emitUpdateEvent(content: string | NodeListOf<ChildNode> | Element | null | undefined) {
        this.dispatchEvent(new CustomEvent('update', {
            detail: {content},
            composed: true,
            bubbles: true
        }));
    }

    private initModes(): string | null {
        const select = this.querySelector('[name=modes]');

        if (select && select instanceof HTMLSelectElement) {
            select.addEventListener('change', () => {
                this.mode = select.value;
            });
            return select.value;
        }
        
        return null;
    }

    private registerToolbar(slot:HTMLSlotElement|null|undefined) {
        slot?.assignedElements().forEach((elem) => {
            elem.querySelectorAll('slot').forEach(sl => this.registerToolbar(sl));
            elem.querySelectorAll('[data-command]').forEach((btn) => {
                const cmdName = <string>(<HTMLElement>btn).dataset.command;

                btn.addEventListener('click', () => {
                    if (!this._config) {
                        return;
                    }
                    const commands = this._config.getCommands();
                    const command = commands[cmdName];
                    if (command) {
                        if (command instanceof Function) {
                            command(<EditorView>this._editor);
                            if (command.name !== 'encloseWithCommand') {
                                this._editor?.focus();
                            }
                        } else {
                            const paramsAttr = (<HTMLElement>btn).dataset.params;
                            const create = (<{create: Function}>command).create;
                            if (paramsAttr) {
                                let params;
                                try {
                                    params = JSON.parse(paramsAttr);
                                } catch (e) {
                                    params = [paramsAttr];
                                }
                                if (Array.isArray(params) && params.length === create.length) {
                                    create.apply(null, params)(<EditorView>this._editor);
                                } else {
                                    console.error('<jinn-codemirror> Expected %d arguments for command %s', create.length, cmdName);
                                }
                            } else {
                                console.error('<jinn-codemirror> No arguments specified for command %s', cmdName);
                            }
                            this._editor?.focus();
                        }
                    }
                });
            });
        });
    }

    private activateToolbar(slot:HTMLSlotElement|null|undefined) {
        slot?.assignedElements().forEach((elem) => {
            elem.querySelectorAll('slot').forEach(sl => this.activateToolbar(sl));
            elem.querySelectorAll('[data-command]').forEach((elem) => {
                const btn = <HTMLElement>elem;
                if (!btn.dataset.mode || btn.dataset.mode === this._mode) {
                    (<HTMLElement>btn).style.display = 'inline';
                } else {
                    (<HTMLElement>btn).style.display = 'none';
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