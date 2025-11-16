import { JinnCodemirror } from "./jinn-codemirror";
import { XMLConfig } from "./xml";
import { ZoteroAutocomplete } from "./autocomplete/zotero-autocomplete";
class JinnXMLEditor extends JinnCodemirror {
  constructor() {
    super();
    /**
     * If set, expects that a value passed in is a DOM element, which will serve as a wrapper for the content. The wrapper element itself will not be shown in the editor.
     * 
     * @attr {string} unwrap
     */
    this.unwrap = false;
    this.autocompleteProviders = [];
    this.schema = null;
    this.schemaRoot = null;
    this.baseUrl = null;
  }
  connectedCallback() {
    this.schema = this.getAttribute("schema");
    this.schemaRoot = this.getAttribute("schema-root");
    this.baseUrl = this.getAttribute("base-url");
    this.unwrap = this.hasAttribute("unwrap");
    this.autocompleteProviders = this.getAttribute("providers")?.split(",").map((provider) => {
      if (provider === "zotero") {
        return new ZoteroAutocomplete(this.baseUrl);
      }
      throw new Error(`Unknown autocomplete provider: ${provider}`);
    }) || [];
    super.connectedCallback();
    const wrapper = this.getAttribute("wrapper");
    if (wrapper) {
      const parser = new DOMParser();
      let parsed = parser.parseFromString(wrapper, "application/xml");
      let errors = parsed.getElementsByTagName("parsererror");
      let root = null;
      if (errors.length) {
        console.error("<jinn-xml-editor> Invalid XML for wrapper attribute: %s", new XMLSerializer().serializeToString(parsed));
      } else {
        root = parsed.firstElementChild;
        if (root && this.hasAttribute("code")) {
          const code = this.getAttribute("code") || "";
          parsed = parser.parseFromString(code, "application/xml");
          errors = parsed.getElementsByTagName("parsererror");
          if (errors.length) {
            console.error("<jinn-xml-editor> Invalid XML for code attribute: %s", new XMLSerializer().serializeToString(parsed));
          } else if (parsed.firstElementChild) {
            root.appendChild(parsed.firstElementChild);
          }
        }
        this.setValue(root);
      }
    }
  }
  configure() {
    const toolbar = this.getToolbarControls(this.shadowRoot?.querySelector("[name=toolbar]"));
    const checkNamespace = this.hasAttribute("check-namespace");
    this._config = new XMLConfig(
      this,
      toolbar,
      this.namespace,
      checkNamespace,
      this.unwrap,
      this.autocompleteProviders.map((provider) => provider.createAutocomplete())
    );
  }
  emitUpdateEvent(content) {
    if (!this.unwrap) {
      return super.emitUpdateEvent(content);
    }
    this.updateValue();
    super.emitUpdateEvent(this._wrapper);
  }
  updateValue() {
    if (!this._wrapper) {
      console.log("no wrapper !!!");
      return null;
    }
    this._wrapper.replaceChildren();
    if (!this._value) {
      console.log("xml editor value is empty");
    } else if (this._value instanceof NodeList) {
      for (let i = 0; i < this._value.length; i++) {
        const child = this._wrapper.ownerDocument.importNode(this._value[i], true);
        this._wrapper?.appendChild(child);
      }
      ;
    } else if (!(this._value instanceof Node)) {
      console.error("<xml-editor> Value is not a node");
      throw new Error("value is not a node");
    } else {
      this._wrapper?.appendChild(this._value);
    }
  }
  setValue(value) {
    if (!this.unwrap) {
      return super.setValue(value);
    }
    if (this._config?.setFromValue(this._wrapper) === this._config?.setFromValue(value)) {
      return false;
    }
    if (!value) {
      this._wrapper = null;
    }
    if (typeof value === "string") {
      const parser = new DOMParser();
      const fragment = parser.parseFromString(value, "application/xml");
      if (!fragment.firstElementChild) {
        return false;
      }
      value = fragment.firstElementChild;
    }
    this._wrapper = value;
    this._value = value?.childNodes;
    return true;
  }
  getValue() {
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
if (!customElements.get("jinn-xml-editor")) {
  window.customElements.define("jinn-xml-editor", JinnXMLEditor);
}
export {
  JinnXMLEditor
};
