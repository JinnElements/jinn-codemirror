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
    this.mode = "leiden_plus";
    this.placeholder = "";
    this.xmlEditor = null;
    this.valid = true;
    this.unwrap = false;
    this.schema = null;
    this.schemaRoot = null;
    this.modeSelect = false;
    this.attachShadow({ mode: "open" });
  }
  set value(value) {
    this.xmlEditor.value = value;
  }
  get value() {
    return this.xmlEditor.value;
  }
  connectedCallback() {
    var _a, _b, _c, _d;
    this.unwrap = this.hasAttribute("unwrap");
    this.schema = this.getAttribute("schema");
    this.schemaRoot = this.getAttribute("schema-root");
    this.modeSelect = this.hasAttribute("mode-select");
    this.mode = this.getAttribute("mode") || "leiden_plus";
    this.placeholder = this.getAttribute("placeholder") || "";
    this.shadowRoot.innerHTML = `
            <style>
                ${style}
            </style>
            <jinn-codemirror id="leiden-editor" class="hidden" mode="${this.mode}">
                <div slot="toolbar">
                    ${this.modeSelect ? createModeSelect(this.mode) : ""}
                    <slot name="leiden-toolbar"></slot>
                    <button part="button" id="close-leiden">Close</button>
                </div>
            </jinn-codemirror>
            <jinn-xml-editor id="xml-editor" ${this.unwrap ? "unwrap" : ""} schema="${this.schema}"
                schema-root="${this.schemaRoot}" placeholder="${this.placeholder}">
                <div slot="toolbar">
                    <button part="button" id="import" title="Import from Leiden markup">Leiden Editor</button>
                    <slot name="xml-toolbar"></slot>
                </div>
            </jinn-xml-editor>
        `;
    this.xmlEditor = (_a = this.shadowRoot) == null ? void 0 : _a.querySelector("#xml-editor");
    const leidenEditor = (_b = this.shadowRoot) == null ? void 0 : _b.querySelector("#leiden-editor");
    const openLeidenBtn = (_c = this.shadowRoot) == null ? void 0 : _c.querySelector("#import");
    const closeLeidenBtn = (_d = this.shadowRoot) == null ? void 0 : _d.querySelector("#close-leiden");
    if (!(this.xmlEditor && leidenEditor && openLeidenBtn && closeLeidenBtn)) {
      throw new Error("One or more components were not initialized");
    }
    let updateXML = true;
    let leidenEditorOpened = false;
    leidenEditor.addEventListener("update", (ev) => {
      ev.stopPropagation();
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
      var _a2;
      leidenEditor.classList.add("hidden");
      openLeidenBtn.classList.remove("hidden");
      leidenEditorOpened = false;
      (_a2 = this.xmlEditor) == null ? void 0 : _a2.focus();
      updateXML = false;
      leidenEditor == null ? void 0 : leidenEditor.clear();
    };
    openLeidenBtn.addEventListener("click", () => {
      var _a2;
      const hidden = leidenEditor.classList.contains("hidden");
      if (hidden) {
        if (this.xmlEditor.content.length > 0) {
          if (!this.valid) {
            alert("The XML contains errors. Cannot convert to Leiden+");
            return;
          }
          const value = (_a2 = this.xmlEditor) == null ? void 0 : _a2.value;
          updateXML = false;
          leidenEditor.setMode("leiden_plus", false);
          showLeiden();
          if (this.unwrap && value instanceof Element) {
            leidenEditor.value = value.childNodes;
          } else {
            leidenEditor.value = value;
          }
        } else {
          showLeiden();
          leidenEditor.value = "";
        }
      } else {
        hideLeiden();
      }
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
  }
}
if (!customElements.get("jinn-epidoc-editor")) {
  window.customElements.define("jinn-epidoc-editor", JinnEpidocEditor);
}
export {
  JinnEpidocEditor
};
