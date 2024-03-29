import TomSelect from "tom-select";
function resolveURL(relPath) {
  const src = document.querySelector("script[src*=jinn-codemirror]");
  if (src) {
    return new URL(relPath, src.src).href;
  }
  return new URL(relPath, window.location.href).href;
}
class ZoteroPicker extends HTMLElement {
  constructor() {
    super();
    this._value = null;
    this.attachShadow({ mode: "open" });
  }
  static get observedAttributes() {
    return ["value"];
  }
  get value() {
    return this._value;
  }
  set value(value) {
    this._value = value;
    if (value && value.length > 0) {
      fetch(`https://api.zotero.org/groups/${this.group}/items/top?tag=${this._value}&format=bib&amp;style=digital-humanities-im-deutschsprachigen-raum`).then((response) => {
        if (response.ok) {
          return response.text();
        }
      }).then((text) => {
        const item = {
          label: text,
          tag: this._value
        };
        this._select.addOption(item);
        this._select.clear(true);
        this._select.sync();
        this._select.setValue(value, false);
        this._select.sync();
        this.setAttribute("value", value);
      });
    } else {
      this.setAttribute("value", value);
    }
  }
  connectedCallback() {
    var _a, _b;
    this.importTheme("default");
    this.group = this.getAttribute("group");
    const slot = document.createElement("slot");
    (_a = this.shadowRoot) == null ? void 0 : _a.appendChild(slot);
    let input = this.querySelector("input,select");
    if (!input) {
      input = document.createElement("input");
      input.setAttribute("autocomplete", "off");
      this.appendChild(input);
    }
    const output = document.createElement("div");
    output.className = "jinn-zotero-picker-output";
    (_b = this.shadowRoot) == null ? void 0 : _b.appendChild(output);
    let total = 0;
    const options = {
      load: (query, callback) => {
        if (query.length < 4) {
          return [];
        }
        fetch(`https://api.zotero.org/groups/${this.group}/items?q=${query}&sort=title&include=data,bib`).then((response) => {
          if (response.ok) {
            total = parseInt(response.headers.get("Total-Results") || "0");
            console.log(total);
            return response.json();
          }
        }).then((json) => {
          var _a2;
          (_a2 = this._select) == null ? void 0 : _a2.clearOptions();
          const data = [];
          if (total > 25) {
            data.push({
              label: `${total} matching entries. Showing first 25.`,
              tag: "invalid",
              disabled: true
            });
          }
          json.forEach((entry) => {
            if (entry.data.tags && entry.data.tags.length > 0) {
              data.push({
                label: entry.bib,
                tag: entry.data.tags[0].tag
              });
            }
          });
          callback(data);
        });
      },
      placeholder: "Zotero search",
      valueField: "tag",
      closeAfterSelect: true,
      searchField: [],
      create: false,
      maxItems: 1,
      loadThrottle: 500,
      render: {
        option: (data) => `<div>${data.label}</div>`,
        item: (data) => `<div>${data.tag}</div>`
      },
      onChange: (value) => {
        const label = this._select.getOption(value, true);
        if (label) {
          output.innerHTML = label.innerHTML;
        }
        if (this._value === value) {
          return;
        }
        this._value = value;
        this.setAttribute("value", this._value);
        this._select.clearOptions();
        this.dispatchEvent(new CustomEvent("change", {
          detail: this._value
        }));
      }
    };
    this._select = new TomSelect(input, options);
    this.value = this.getAttribute("value");
  }
  attributeChangedCallback(name, oldValue, newValue) {
    if (!oldValue || oldValue === newValue) {
      return;
    }
    if (name === "value") {
      this.value = newValue;
    }
  }
  importTheme(theme) {
    const context = this.getRootNode();
    if (context.getElementById("__jinn-zotero-picker-css")) {
      return;
    }
    const themes = resolveURL("../css");
    const link = document.createElement("link");
    link.id = "__jinn-zotero-picker-css";
    link.href = `${themes}/tom-select.${theme}.min.css`;
    link.rel = "stylesheet";
    if (context.nodeType === Node.DOCUMENT_NODE) {
      document.head.appendChild(link);
    } else {
      context.appendChild(link);
    }
  }
}
window.customElements.define("jinn-zotero-picker", ZoteroPicker);
export {
  ZoteroPicker
};
