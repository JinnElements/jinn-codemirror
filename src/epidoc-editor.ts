import "./xml-editor";
import { JinnXMLEditor } from "./xml-editor";
import { JinnCodemirror } from "./jinn-codemirror";

interface LeidenEditorUpdateEvent extends Event {
    detail: { content: string } 
}

const style = `
    :host{
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


/**
 * Combines an XML editor with an option to import and convert markup following variants of the Leiden convention.
 * 
 * @attr {boolean} unwrap - If set, expects that a value passed in is a DOM element, which will serve as a wrapper for the content.
 * The wrapper element itself will not be shown in the editor.
 */
export class JinnEpidocEditor extends HTMLElement {

    xmlEditor: JinnXMLEditor | null | undefined;

    public valid?: boolean;
    public unwrap?: boolean;
    private schema: string | null;

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
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.unwrap = this.hasAttribute('unwrap');
        this.schema = this.getAttribute('schema');
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
            <jinn-xml-editor id="xml-editor" ${this.unwrap ? 'unwrap' : ''} schema="${this.schema}">
                <div slot="toolbar">
                    <button part="button" id="import" title="Import from Leiden markup">Leiden Editor</button>
                    <slot name="xml-toolbar"></slot>
                </div>
            </jinn-xml-editor>
        `;
         
        this.xmlEditor = this.shadowRoot?.querySelector('#xml-editor');
        const leidenEditor:JinnCodemirror | null | undefined = this.shadowRoot?.querySelector('#leiden-editor');
        const openLeiden:HTMLButtonElement | null | undefined = this.shadowRoot?.querySelector('#import');
        const closeLeiden:HTMLButtonElement | null | undefined = this.shadowRoot?.querySelector('#close-leiden');

        if (!(this.xmlEditor && leidenEditor && openLeiden && closeLeiden)) {
            throw new Error('One or more components were not initialized')
        }

        leidenEditor.addEventListener('update', (ev) => {
            ev.stopPropagation()
            this.xmlEditor.content = ev.detail.content;
        });

        openLeiden.addEventListener('click', () => {
            const hidden = leidenEditor.classList.contains('hidden');
            if (hidden) {
                if (this.xmlEditor.content.length > 0) {
                    leidenEditor.mode = 'leiden_plus';
                    const value = this.xmlEditor?.value;
                    if (this.unwrap && value instanceof Element) {
                        leidenEditor.value = value.childNodes;
                    } else {
                        leidenEditor.value = value;
                    }
                }
                leidenEditor.classList.remove('hidden');
                leidenEditor.focus();
                openLeiden.classList.add('hidden');
            } else {
                leidenEditor.classList.add('hidden');
                openLeiden.classList.remove('hidden');
                this.xmlEditor.focus();
            }
        });

        closeLeiden.addEventListener('click', () => {
            openLeiden.classList.remove('hidden');
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
