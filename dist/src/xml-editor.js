import { JinnCodemirror } from "./jinn-codemirror";
import { XMLConfig } from "./xml";
class JinnXMLEditor extends JinnCodemirror {
  constructor() {
    super();
    this.unwrap = false;
    this.schema = null;
    this.schemaRoot = null;
  }
  connectedCallback() {
    this.schema = this.getAttribute("schema");
    this.schemaRoot = this.getAttribute("schema-root");
    this.unwrap = this.hasAttribute("unwrap");
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
    var _a;
    const toolbar = this.getToolbarControls((_a = this.shadowRoot) == null ? void 0 : _a.querySelector("[name=toolbar]"));
    const checkNamespace = this.hasAttribute("check-namespace");
    this._config = new XMLConfig(this, toolbar, this.namespace, checkNamespace, this.unwrap);
  }
  emitUpdateEvent(content) {
    if (!this.unwrap) {
      return super.emitUpdateEvent(content);
    }
    this.updateValue();
    super.emitUpdateEvent(this._wrapper);
  }
  updateValue() {
    var _a, _b;
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
        (_a = this._wrapper) == null ? void 0 : _a.appendChild(child);
      }
      ;
    } else if (!(this._value instanceof Node)) {
      console.error("<xml-editor> Value is not a node");
      throw new Error("value is not a node");
    } else {
      (_b = this._wrapper) == null ? void 0 : _b.appendChild(this._value);
    }
  }
  setValue(value) {
    var _a, _b;
    if (!this.unwrap) {
      return super.setValue(value);
    }
    if (((_a = this._config) == null ? void 0 : _a.setFromValue(this._wrapper)) === ((_b = this._config) == null ? void 0 : _b.setFromValue(value))) {
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
    this._value = value == null ? void 0 : value.childNodes;
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
