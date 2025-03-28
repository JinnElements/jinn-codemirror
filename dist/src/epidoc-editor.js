import "./xml-editor";
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
const ignoreKeys = [
  "Shift",
  "Alt",
  "Meta",
  "Control",
  "ArrowLeft",
  "ArrowRight",
  "ArrowDown",
  "ArrowUp",
  "PageDown",
  "PageUp",
  "Home",
  "End"
];
const EDITOR_MODES = {
  leiden_plus: "Leiden+",
  edcs: "EDCS/EDH",
  default: "Petrae"
};
function createModeSelect(mode) {
  const options = [];
  Object.entries(EDITOR_MODES).forEach(([key, value]) => {
    options.push(`<option value="${key}" ${key === mode ? "selected" : ""}>${value}</option>`);
  });
  return `<select name="modes">${options.join("\n")}</select>`;
}
class JinnEpidocEditor extends HTMLElement {
  constructor() {
    super();
    /**
     * Syntax mode to use for the leiden editor, one of leiden_plus, edcs or petrae
     */
    this.mode = "leiden_plus";
    this.placeholder = "";
    /**
     * Should the leiden editor be shown initially?
     */
    this.showLeiden = false;
    this.xmlEditor = null;
    this.valid = true;
    this.unwrap = false;
    this.schema = null;
    this.schemaRoot = null;
    this.modeSelect = false;
    this.attachShadow({ mode: "open" });
  }
  /**
   * The value edited in the editor as either an Element or string -
   * depending on the mode set.
   */
  set value(value) {
    this.xmlEditor.value = value;
  }
  get value() {
    return this.xmlEditor.value;
  }
  connectedCallback() {
    this.unwrap = this.hasAttribute("unwrap");
    this.schema = this.getAttribute("schema");
    this.schemaRoot = this.getAttribute("schema-root");
    this.modeSelect = this.hasAttribute("mode-select");
    this.mode = this.getAttribute("mode") || "leiden_plus";
    this.placeholder = this.getAttribute("placeholder") || "";
    this.showLeiden = this.hasAttribute("show-leiden");
    this.shadowRoot.innerHTML = `
            <style>
                ${style}
            </style>
            <jinn-codemirror id="leiden-editor" class="${this.showLeiden ? "" : "hidden"}" 
                mode="${this.mode}" ignore-blur>
                <div slot="header"><slot name="leiden-header"></slot></div>
                <div slot="toolbar">
                    ${this.modeSelect ? createModeSelect(this.mode) : ""}
                    <slot name="leiden-toolbar"></slot>
                    <button part="button" id="close-leiden">Close</button>
                </div>
            </jinn-codemirror>
            <jinn-xml-editor id="xml-editor" ${this.unwrap ? "unwrap" : ""} schema="${this.schema}"
                schema-root="${this.schemaRoot}" placeholder="${this.placeholder}" ignore-blur>
                <div slot="header"><slot name="xml-header"></slot></div>
                <div slot="toolbar">
                    <slot name="open-leiden" id="import" class="${this.showLeiden ? "hidden" : ""}">
                        <button part="button" title="Import from Leiden markup">Leiden Editor</button>
                    </slot>
                    <slot name="xml-toolbar"></slot>
                </div>
            </jinn-xml-editor>
        `;
    this.xmlEditor = this.shadowRoot?.querySelector("#xml-editor");
    const leidenEditor = this.shadowRoot?.querySelector("#leiden-editor");
    const openLeidenBtn = this.shadowRoot?.querySelector("#import");
    const closeLeidenBtn = this.shadowRoot?.querySelector("#close-leiden");
    if (!(this.xmlEditor && leidenEditor && openLeidenBtn && closeLeidenBtn)) {
      throw new Error("One or more components were not initialized");
    }
    let updateXML = true;
    let leidenEditorOpened = this.showLeiden;
    leidenEditor.addEventListener("update", (ev) => {
      ev.stopPropagation();
      this.showLeiden = false;
      if (updateXML) {
        this.xmlEditor.content = ev.detail.content;
      }
      updateXML = true;
    });
    this.xmlEditor.addEventListener("keyup", (ev) => {
      if (leidenEditorOpened) {
        if (ignoreKeys.indexOf(ev.key) > -1) {
          return;
        }
        hideLeiden();
      }
    });
    const showLeiden = () => {
      openLeidenBtn.classList.add("hidden");
      leidenEditor.classList.remove("hidden");
      leidenEditorOpened = true;
      leidenEditor.focus();
    };
    const hideLeiden = () => {
      leidenEditor.classList.add("hidden");
      openLeidenBtn.classList.remove("hidden");
      leidenEditorOpened = false;
      this.xmlEditor?.focus();
      updateXML = false;
      leidenEditor?.clear();
    };
    const initLeiden = () => {
      const hidden = leidenEditor.classList.contains("hidden");
      if (hidden || this.showLeiden) {
        if (this.xmlEditor.content.length > 0) {
          if (!this.valid) {
            alert("The XML contains errors. Cannot convert to Leiden+");
            return;
          }
          const value = this.xmlEditor?.value;
          updateXML = false;
          leidenEditor.setMode("leiden_plus", false);
          try {
            if (this.unwrap && value instanceof Element) {
              leidenEditor.value = value.childNodes;
            } else {
              leidenEditor.value = value;
            }
            this.xmlEditor.status = "";
            showLeiden();
          } catch (e) {
            this.xmlEditor.status = e.message;
            hideLeiden();
          }
        } else {
          showLeiden();
          leidenEditor.value = "";
        }
      } else {
        hideLeiden();
      }
    };
    openLeidenBtn.addEventListener("click", () => {
      initLeiden();
    });
    closeLeidenBtn.addEventListener("click", () => {
      hideLeiden();
    });
    this.xmlEditor.addEventListener("invalid", (ev) => {
      ev.stopPropagation();
      this.valid = false;
      this.setAttribute("valid", this.valid.toString());
      this.dispatchEvent(new CustomEvent("invalid", {
        detail: ev.detail,
        composed: true,
        bubbles: true
      }));
    });
    this.xmlEditor.addEventListener("valid", (ev) => {
      ev.stopPropagation();
      this.valid = true;
      this.setAttribute("valid", this.valid.toString());
      this.dispatchEvent(new CustomEvent("valid", {
        detail: ev.detail,
        composed: true,
        bubbles: true
      }));
    });
    this.xmlEditor.addEventListener("update", () => {
      if (this.showLeiden) {
        initLeiden();
      }
      this.showLeiden = false;
    }, {
      once: true
    });
    this.addEventListener("blur", (ev) => {
      if (!ev.relatedTarget || this.contains(ev.relatedTarget)) {
        return;
      }
      this.dispatchEvent(new CustomEvent("leave", {
        composed: true,
        bubbles: true
      }));
    });
  }
}
if (!customElements.get("jinn-epidoc-editor")) {
  window.customElements.define("jinn-epidoc-editor", JinnEpidocEditor);
}
export {
  JinnEpidocEditor
};
