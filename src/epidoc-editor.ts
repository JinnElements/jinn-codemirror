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

/**
 * Combines an XML editor with an option to import and convert markup following variants of the Leiden convention.
 * 
 * @attr {boolean} unwrap - If set, expects that a value passed in is a DOM element, which will serve as a wrapper for the content.
 * The wrapper element itself will not be shown in the editor.
 * @attr {string} schema - an optional schema description (JSON syntax) to load
 * @attr {string} schema-root - determines the root element
 */
export class JinnEpidocEditor extends HTMLElement {

    xmlEditor: JinnXMLEditor | null | undefined;

    public valid?: boolean;
    public unwrap?: boolean;
    public schema: string | null;
    public schemaRoot: string | null;

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
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.unwrap = this.hasAttribute('unwrap');
        this.schema = this.getAttribute('schema');
        this.schemaRoot = this.getAttribute('schema-root');

        this.shadowRoot.innerHTML = `
            <style>
                ${style}
            </style>
            <jinn-codemirror id="leiden-editor" class="hidden">
                <div slot="toolbar">
                    <select name="modes">
                        <option value="edcs" selected>EDCS/EDH</option>
                        <option value="default">Petrae</option>
                        <option value="leiden_plus">Leiden+</option>
                    </select>
                    <slot name="leiden-toolbar"></slot>
                    <button part="button" id="close-leiden">Close</button>
                </div>
            </jinn-codemirror>
            <jinn-xml-editor id="xml-editor" ${this.unwrap ? 'unwrap' : ''} schema="${this.schema}"
                schema-root="${this.schemaRoot}">
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
        let leidenEditorOpened = false;
        // update XML when Leiden editor changes
        leidenEditor.addEventListener('update', (ev) => {
            ev.stopPropagation();
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
                
                openLeidenBtn.classList.remove('hidden');
                leidenEditor.classList.add('hidden');
                leidenEditorOpened = false;
            }
        });

        openLeidenBtn.addEventListener('click', () => {
            const hidden = leidenEditor.classList.contains('hidden');
            if (hidden) {
                leidenEditor.classList.remove('hidden');
                leidenEditorOpened = true;
                leidenEditor.focus();
                openLeidenBtn.classList.add('hidden');
                if (this.xmlEditor.content.length > 0) {
                    updateXML = false;
                    leidenEditor.setMode('leiden_plus', false);
                    const value = this.xmlEditor?.value;
                    if (this.unwrap && value instanceof Element) {
                        leidenEditor.value = value.childNodes;
                    } else {
                        leidenEditor.value = value;
                    }
                } else {
                    leidenEditor.value = '';
                }
            } else {
                leidenEditor.classList.add('hidden');
                openLeidenBtn.classList.remove('hidden');
                leidenEditorOpened = false;
                this.xmlEditor.focus();
            }
        });

        closeLeidenBtn.addEventListener('click', () => {
            openLeidenBtn.classList.remove('hidden');
            leidenEditor.classList.add('hidden');
            this.xmlEditor.focus();
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
    }
}
    
if (!customElements.get('jinn-epidoc-editor')) {
    window.customElements.define('jinn-epidoc-editor', JinnEpidocEditor);
}
