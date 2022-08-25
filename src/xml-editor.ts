import { JinnCodemirror } from "./jinn-codemirror";
import { XMLConfig } from "./xml";

/**
 * Extends jinn-codemirror for XML editing: adds a boolean property "unwrap" to
 * indicate if the entire root node passed in as value should be edited or just its
 * content. Setting the property requires that a DOM element is passed via value.
 * 
 * @attr {boolean} unwrap - If set, expects that a value passed in is a DOM element, which will serve as a wrapper for the content.
 * The wrapper element itself will not be shown in the editor.
 * @attr {boolean} check-namespace - if enabled, a missing namespace will be reported as error 
 */
export class JinnXMLEditor extends JinnCodemirror {

    /**
     * Set to indicate that the content of the node should be edited rather
     * than the root node itself.
     */
    public unwrap: boolean | null = false;

    _wrapper?: Element | null;

    connectedCallback() {
        this.unwrap = this.hasAttribute('unwrap');
        super.connectedCallback();

        const wrapper = this.getAttribute('wrapper');
        if (wrapper) {
            const parser = new DOMParser();
            const parsed = parser.parseFromString(wrapper, 'application/xml');
            const errors = parsed.getElementsByTagName("parsererror")
            if (errors.length) {
                console.error('<jinn-xml-editor> Invalid XML for wrapper attribute: %s', new XMLSerializer().serializeToString(parsed));
            } else {
                this.setValue(parsed.firstElementChild);
            }
        }
    }

    configure() {
        const checkNamespace = this.hasAttribute('check-namespace');
        this._config = new XMLConfig(this, this.namespace, checkNamespace, this.unwrap);
    }

    emitUpdateEvent(content: string) {
        if (!this.unwrap) {
            return super.emitUpdateEvent(content);
        }
        this.updateValue();
        super.emitUpdateEvent(this._wrapper);
    }

    protected updateValue() {
        if (!this._wrapper) {
            console.log("no wrapper !!!");
            return null;
        }
        // remove old children
        this._wrapper.replaceChildren();
        if (!this._value) {
            // empty
            console.log("xml editor value is empty");
        } else if (this._value instanceof NodeList) {
            for (let i = 0; i < this._value.length; i++) {
                const child = this._wrapper.ownerDocument.importNode(this._value[i], true);
                this._wrapper?.appendChild(child);
            };
        } else if (!(this._value instanceof Node)) {
            console.error("<xml-editor> Value is not a node");
            throw new Error('value is not a node');
        } else {
            this._wrapper?.appendChild(this._value);
        }
    }

    protected setValue(value: Element | string | null | undefined): boolean {
        if (!this.unwrap) {
            return super.setValue(value);
        }

        if (this._config?.setFromValue(this._wrapper) === this._config?.setFromValue(value)) {
            return false;
        }
        if (!value) {
            this._wrapper = null;
        }
        if (!(value instanceof Element)) { 
            throw new Error("Value is not a node");
        }
        
        this._wrapper = value;
        this._value = value.childNodes;
        return true;
    }

    protected getValue(): Element | NodeListOf<ChildNode> | string | null {
        if (!this.unwrap) {
            return super.getValue();
        }

        if (!this._wrapper) {
            return null;
        }

        if (!(this._wrapper instanceof Element)) {
            throw new Error("Value is not a node");
        }
        this.updateValue();
        return this._wrapper;
    }
}

if (!customElements.get('jinn-xml-editor')) {
    window.customElements.define('jinn-xml-editor', JinnXMLEditor);
}