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
    .hidden {
        display: none;
    }
    [slot=toolbar] {
        display: block;
        width: 100%;
        margin-bottom: 0.75rem;
    }
    [slot=toolbar] * {
        font-size: .85rem;
        border: 1px solid transparent;
        background-color: inherit;
    }
    [slot=toolbar] *:hover {
        border: 1px solid orange;
    }`;


export class JinnEpidocEditor extends HTMLElement {
    
    _wrapper?: Element | null;
    _remote: boolean;

    xmlEditor: JinnCodemirror | null | undefined;
    // leidenEditor: JinnCodemirror | null | undefined;
    // toggle: HTMLButtonElement | null | undefined;

    public valid?: boolean;
    private schema: string | null;

    /**
     * The value edited in the editor as either an Element or string -
     * depending on the mode set.
     */
    set value(value: Element | null | undefined) {
        if (this._wrapper === value) {
            console.debug("value unchanged");
            return;
        }
        if (!value) {
            this._wrapper = null
        }
        if (!(value instanceof Element)) { 
            throw new Error("Value is not a node")
        }
    
        this._wrapper = value;
        this._remote = true;
        const node = value.firstElementChild
        if (!this.xmlEditor) {
            throw new Error("XML editor not initialized")
        }
        this.xmlEditor.value = node
    }
    
    get value(): Element | null | undefined {
        return this._wrapper;
    }
    
    constructor() {
        super()
        this._wrapper = null;
        this._remote = false;
        this.xmlEditor = null;
        this.valid = true;
        this.schema = null;
        this.attachShadow({ mode: 'open' });
    }
    connectedCallback() {
        this.schema = this.getAttribute('schema');
        this.shadowRoot.innerHTML = `
            <style>
                ${style}
            </style>
            <jinn-codemirror id="leiden-editor" class="leiden hidden">
                <div slot="toolbar">
                    <select name="modes">
                        <option value="edcs" selected>EDCS/EDH</option>
                        <option value="default">Petrae</option>
                        <option value="leiden_plus">Leiden+</option>
                    </select>
                    <button data-command="expan" class="leiden_plus">(a(bcd))</button>
                    <button data-command="erasure" class="leiden_plus">???abc???</button>
                    <button data-command="unclear" class="leiden_plus">a??</button>
                    <button data-command="div" class="leiden_plus">&lt;=...</button>
                    <!--button data-command="fragment" class="leiden_plus">&lt;D=.1.fragment...</button-->
                    <button data-command="part" class="leiden_plus">&lt;D=.A.part...</button>
                    <button data-command="recto" class="leiden_plus">&lt;D=.r...</button>
                    <button data-command="verso" class="leiden_plus">&lt;D=.v...</button>
                    <button data-command="erasure" class="edcs">???abc???</button>
                    <button data-command="gap" class="edcs">[...]</button>
                    <button data-command="convert" class="edcs">Leiden+</button>
                </div>
            </jinn-codemirror>
            <jinn-codemirror id="xml-editor" mode="xml" schema="${this.schema}"
                    namespace="http://www.tei-c.org/ns/1.0">
                <div slot="toolbar">
                    <button id="import" title="Import from Leiden markup">Import Leiden</button>
                    <button data-command="selectElement" title="Select element around current cursor position">&lt;|></button>
                    <button data-command="encloseWith" title="Enclose selection in new element">&lt;...&gt;</button>
                    <button data-command="removeEnclosing" title="Remove enclosing tags">&lt;X></button>
                </div>
            </jinn-codemirror>
        `;
         
        const xmlEditor:JinnCodemirror | null | undefined = this.shadowRoot?.querySelector('#xml-editor');
        const leidenEditor:JinnCodemirror | null | undefined = this.shadowRoot?.querySelector('#leiden-editor');
        const toggle:HTMLButtonElement | null | undefined = this.shadowRoot?.querySelector('#import');

        if (!(xmlEditor && leidenEditor && toggle)) {
            throw new Error('One or more components were not initialized')
        }

        toggle.addEventListener('click', () => {
            const hidden = leidenEditor.classList.toggle('hidden');
            if (!hidden) { 
                leidenEditor.focus();
            }
        });

        leidenEditor.addEventListener('update', (ev) => {
            ev.stopPropagation()
            xmlEditor.content = ev.detail.content;
        });

        this.xmlEditor = xmlEditor

        xmlEditor.addEventListener('update', (ev) => {
            ev.stopPropagation()
            if (!this._wrapper) { return null }
            if (this._remote) {
                return this._remote = false
            }
            // remove old children
            const cl = this._wrapper?.children.length || 0
            for (let i = 0; i < cl; i++) {
                this._wrapper?.removeChild(this._wrapper.children[i])
            }
            if (!xmlEditor.value) {
                // empty
            }
            else  if (!(xmlEditor.value instanceof Element)) {
                throw new Error("XML editor value is not a node")
            }
            else {
                this._wrapper?.appendChild(xmlEditor.value)
            }
            const content = this._wrapper

            this.dispatchEvent(new CustomEvent('update', {
                detail: { content },
                composed: true,
                bubbles: true
            }))
        })
        xmlEditor.addEventListener('invalid', (ev) => {
            ev.stopPropagation()
            this.valid = false
        });
        xmlEditor.addEventListener('valid', (ev) => {
            ev.stopPropagation()
            this.valid = true
        });
    }
}
    
if (!customElements.get('jinn-epidoc-editor')) {
    window.customElements.define('jinn-epidoc-editor', JinnEpidocEditor);
}
