import "./xml-editor";
import { JinnXMLEditor } from "./xml-editor";
import { JinnCodemirror } from "./jinn-codemirror";

interface LeidenEditorUpdateEvent extends Event {
    detail: { content: string } 
}

const style = `
    :host {
        display: block;
        width: 100%;
    }
    jinn-codemirror {
        font-size: 1rem;
        display:block;
        width:100%;
    }
    jinn-codemirror[valid="true"] {
        outline: thin solid green;
    }
    jinn-codemirror[valid="false"] {
        outline: thin solid red;
    }
    #leiden-editor {
        margin-bottom:0.5rem;
    }
    [slot=toolbar] {
        display: flex;
    }
    .hidden {
        display: none;
    }
    #close-leiden {
        margin-left: .75rem;
        font-weight: bold;
    }`;

const ignoreKeys = ['Shift', 'Alt', 'Meta', 'Control', 'ArrowLeft', 'ArrowRight', 'ArrowDown',
    'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End'];

const EDITOR_MODES = {
    leiden_plus: 'Leiden+',
    edcs: 'EDCS/EDH',
    default: 'Petrae'
};

function createModeSelect(mode: string) {
    const options:string[] = [];
    Object.entries(EDITOR_MODES).forEach(([key, value]) => {
        options.push(`<option value="${key}" ${key === mode ? 'selected': ''}>${value}</option>`);
    });
    return `<select name="modes">${options.join('\n')}</select>`;
}

/**
 * Combines an XML editor with an option to import and convert markup following variants of the Leiden convention.
 * 
 */
export class JinnEpidocEditor extends HTMLElement {

    xmlEditor: JinnXMLEditor | null | undefined;

    /**
     * Syntax mode to use for the leiden editor, one of leiden_plus, edcs or petrae
     */
    public mode: string = 'leiden_plus';
    /**
     * if set, user may choose from the supported syntaxes
     * 
     * @attr {boolean} mode-select
     */
    public modeSelect: boolean;
    public valid?: boolean;
    /**
     * If set, expects that a value passed in is a DOM element, which will serve as a wrapper for the content.
     * The wrapper element itself will not be shown in the editor.
     */
    public unwrap?: boolean;
    /**
     * an optional schema description (JSON syntax) to load for the XML editor
     */
    public schema: string | null;
    /**
     * determines the root element for autocomplete
     * 
     * @attr {string} schema-root
     */
    public schemaRoot: string | null;

    public placeholder: string = '';

    /**
     * Should the leiden editor be shown initially?
     */
    public showLeiden: boolean = false;

    /**
     * The value edited in the editor as either an Element or string -
     * depending on the mode set.
     */
    set value(value: Element | string | null | undefined) {
        this.xmlEditor.value = value;
    }
    
    get value(): Element | null | undefined {
        return this.xmlEditor.value;
    }
    
    constructor() {
        super()
        this.xmlEditor = null;
        this.valid = true;
        this.unwrap = false;
        this.schema = null;
        this.schemaRoot = null;
        this.modeSelect = false;
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.unwrap = this.hasAttribute('unwrap');
        this.schema = this.getAttribute('schema');
        this.schemaRoot = this.getAttribute('schema-root');
        this.modeSelect = this.hasAttribute('mode-select');
        this.mode = this.getAttribute('mode') || 'leiden_plus';
        this.placeholder = this.getAttribute('placeholder') || '';
        this.showLeiden = this.hasAttribute('show-leiden');

        this.shadowRoot.innerHTML = `
            <style>
                ${style}
            </style>
            <jinn-codemirror id="leiden-editor" class="${this.showLeiden ? '' : 'hidden'}" mode="${this.mode}">
                <div slot="toolbar">
                    ${ this.modeSelect ? createModeSelect(this.mode) : '' }
                    <slot name="leiden-toolbar"></slot>
                    <button part="button" id="close-leiden">Close</button>
                </div>
            </jinn-codemirror>
            <jinn-xml-editor id="xml-editor" ${this.unwrap ? 'unwrap' : ''} schema="${this.schema}"
                schema-root="${this.schemaRoot}" placeholder="${this.placeholder}">
                <div slot="toolbar">
                    <button part="button" id="import" title="Import from Leiden markup">Leiden Editor</button>
                    <slot name="xml-toolbar"></slot>
                </div>
            </jinn-xml-editor>
        `;
         
        this.xmlEditor = this.shadowRoot?.querySelector('#xml-editor');
        const leidenEditor:JinnCodemirror | null | undefined = this.shadowRoot?.querySelector('#leiden-editor');
        const openLeidenBtn:HTMLButtonElement | null | undefined = this.shadowRoot?.querySelector('#import');
        const closeLeidenBtn:HTMLButtonElement | null | undefined = this.shadowRoot?.querySelector('#close-leiden');

        if (!(this.xmlEditor && leidenEditor && openLeidenBtn && closeLeidenBtn)) {
            throw new Error('One or more components were not initialized')
        }

        let updateXML = true;
        let leidenEditorOpened = this.showLeiden;
        // update XML when Leiden editor changes
        leidenEditor.addEventListener('update', (ev) => {
            ev.stopPropagation();
            this.showLeiden = false;
            // avoid XML to be overwritten after conversion to Leiden+
            if (updateXML) {
                this.xmlEditor.content = ev.detail.content;
            }
            updateXML = true;
        });
        this.xmlEditor.addEventListener('keyup', (ev) => {
            if (leidenEditorOpened) {
                if (ignoreKeys.indexOf(ev.key) > -1) {
                    return;
                }
                
                hideLeiden();
            }
        });

        const showLeiden = () => {
            openLeidenBtn.classList.add('hidden');
            leidenEditor.classList.remove('hidden');
            leidenEditorOpened = true;
            leidenEditor.focus();
        }

        const hideLeiden = () => {
            leidenEditor.classList.add('hidden');
            openLeidenBtn.classList.remove('hidden');
            leidenEditorOpened = false;
            this.xmlEditor?.focus();

            updateXML = false;
            leidenEditor?.clear();
        }
        
        const initLeiden = () => {
            const hidden = leidenEditor.classList.contains('hidden');
            if (hidden || this.showLeiden) {
                if (this.xmlEditor.content.length > 0) {
                    if (!this.valid) {
                        alert('The XML contains errors. Cannot convert to Leiden+');
                        return;
                    }
                    const value = this.xmlEditor?.value;
                    updateXML = false;
                    leidenEditor.setMode('leiden_plus', false);
                    showLeiden();
                    if (this.unwrap && value instanceof Element) {
                        leidenEditor.value = value.childNodes;
                    } else {
                        leidenEditor.value = value;
                    }
                } else {
                    showLeiden();
                    leidenEditor.value = '';
                }
            } else {
                hideLeiden();
            }
        }
        openLeidenBtn.addEventListener('click', () => {
            initLeiden();
        });

        closeLeidenBtn.addEventListener('click', () => {
            hideLeiden();
        });

        this.xmlEditor.addEventListener('invalid', (ev) => {
            ev.stopPropagation();
            this.valid = false;
            this.setAttribute('valid', this.valid.toString());
            this.dispatchEvent(new CustomEvent('invalid', {
                detail: ev.detail,
                composed: true,
                bubbles: true
            }));
        });
        this.xmlEditor.addEventListener('valid', (ev) => {
            ev.stopPropagation()
            this.valid = true;
            this.setAttribute('valid', this.valid.toString());
            this.dispatchEvent(new CustomEvent('valid', {
                detail: ev.detail,
                composed: true,
                bubbles: true
            }));
        });
        this.xmlEditor.addEventListener('update', () => {
            if (this.showLeiden) {
                initLeiden();
            }
            this.showLeiden = false;
        }, {
            once: true
        });
    }
}
    
if (!customElements.get('jinn-epidoc-editor')) {
    window.customElements.define('jinn-epidoc-editor', JinnEpidocEditor);
}
