import { JinnCodemirror } from "./jinn-codemirror";

/**
 * Extends jinn-codemirror for XML editing: adds a boolean property "unwrap" to
 * indicate if the entire root node passed in as value should be edited or just its
 * content. Setting the property requires that a DOM element is passed via value.
 */
export class JinnXMLEditor extends JinnCodemirror {

    /**
     * Set to indicate that the content of the node should be edited rather
     * than the root node itself.
     */
    public unwrap: boolean | null = false;

    _wrapper?: Element | null;

    connectedCallback() {
        super.connectedCallback();
        this.unwrap = this.hasAttribute('unwrap');
    }

    protected emitUpdateEvent(content: string, serialized: string | Element | null) {
        if (!this.unwrap) {
            return super.emitUpdateEvent(content, serialized);
        }
        if (!this._wrapper) {
            console.log("no wrapper !!!");
            return null;
        }
        // remove old children
        const cl = this._wrapper?.children.length || 0;
        for (let i = 0; i < cl; i++) {
            this._wrapper?.removeChild(this._wrapper.children[i]);
        }
        if (!this._value) {
            // empty
            console.log("xml editor value is empty");
        }
        else  if (!(this._value instanceof Element)) {
            throw new Error("XML editor value is not a node");
        }
        else {
            console.log("appending", this._value)
            this._wrapper?.appendChild(this._value);
        }
        super.emitUpdateEvent(this._wrapper, serialized);
    }

    protected setValue(value: Element | string | null | undefined) {
        if (!this.unwrap) {
            return super.setValue(value);
        }

        if (this._wrapper === value) {
            console.debug("value unchanged");
            return;
        }
        if (!value) {
            this._wrapper = null;
        }
        if (!(value instanceof Element)) { 
            throw new Error("Value is not a node");
        }
    
        this._wrapper = value;
        this._value = value.firstElementChild;
    }

    protected getValue(): Element | string | null {
        if (!this.unwrap) {
            return super.getValue();
        }

        if (!this._wrapper) {
            return null;
        }

        if (!(this._wrapper instanceof Element)) {
            throw new Error("Value is not a node");
        }
        return this._wrapper;
    }
}

if (!customElements.get('jinn-xml-editor')) {
    window.customElements.define('jinn-xml-editor', JinnXMLEditor);
}