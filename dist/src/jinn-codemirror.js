import { EditorView } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { XMLConfig } from "./xml";
import { LeidenConfig } from "./leiden+";
import { AncientTextConfig } from "./ancientText";
import { XQueryConfig } from "./xquery";
import { CSSConfig } from "./css";
import { PlainConfig } from "./plain";
import { TeXConfig } from "./tex";
import { SourceType, initCommand } from "./config";
import { HTMLConfig } from "./html";
class JinnCodemirror extends HTMLElement {
  constructor() {
    super();
    this._mode = SourceType.xml;
    this._placeholder = "";
    this.attachShadow({ mode: "open" });
  }
  static get observedAttributes() {
    return ["placeholder"];
  }
  connectedCallback() {
    var _a, _b, _c, _d;
    const css = document.createElement("style");
    css.innerHTML = this.styles();
    (_a = this.shadowRoot) == null ? void 0 : _a.appendChild(css);
    const toolbarSlot = document.createElement("slot");
    toolbarSlot.name = "toolbar";
    (_b = this.shadowRoot) == null ? void 0 : _b.appendChild(toolbarSlot);
    const wrapper = document.createElement("div");
    wrapper.id = "editor";
    (_c = this.shadowRoot) == null ? void 0 : _c.appendChild(wrapper);
    this.registerToolbar((_d = this.shadowRoot) == null ? void 0 : _d.querySelector("[name=toolbar]"));
    this._placeholder = this.getAttribute("placeholder") || "";
    this.namespace = this.getAttribute("namespace");
    this.linter = this.getAttribute("linter");
    this.mode = this.initModes() || this.getAttribute("mode") || "xml";
    if (this.hasAttribute("code")) {
      this.value = this.getAttribute("code");
    }
    this.addEventListener("blur", (ev) => {
      const target = ev.relatedTarget;
      if (target) {
        let parent = target.parentNode;
        while (parent) {
          if (parent === this) {
            ev.preventDefault();
            ev.stopPropagation();
            return;
          }
          parent = parent.parentNode;
        }
      }
    });
  }
  attributeChangedCallback(name, oldValue, newValue) {
    if (!oldValue || oldValue === newValue) {
      return;
    }
    switch (name) {
      case "placeholder":
        this._placeholder = newValue;
        this.setMode(this.mode, false);
        break;
    }
  }
  focus() {
    if (this._editor) {
      this._editor.focus();
    }
  }
  get placeholder() {
    return this._placeholder;
  }
  set placeholder(label) {
    this._placeholder = label;
    this.setMode(this.mode);
  }
  set mode(mode) {
    this.setMode(mode);
  }
  setMode(mode, update = true) {
    var _a, _b, _c;
    const wrapper = (_a = this.shadowRoot) == null ? void 0 : _a.getElementById("editor");
    if (!wrapper) {
      return;
    }
    if (this._editor) {
      this._editor.destroy();
      wrapper.innerHTML = "";
    }
    this._mode = SourceType[mode];
    console.log(`<jinn-codemirror> mode: ${this.mode}`);
    this.activateToolbar((_b = this.shadowRoot) == null ? void 0 : _b.querySelector("[name=toolbar]"));
    this.configure();
    const select = this.querySelector("[name=modes]");
    if (select && select instanceof HTMLSelectElement) {
      select.value = this._mode;
    }
    (_c = this._config) == null ? void 0 : _c.getConfig().then((stateConfig) => {
      this._editor = new EditorView({
        state: EditorState.create(stateConfig),
        parent: wrapper
      });
      if (!this._config) {
        return;
      }
      if (update) {
        this.content = this._config.setFromValue(this._value);
      }
    });
  }
  configure() {
    var _a;
    const toolbar = this.getToolbarControls((_a = this.shadowRoot) == null ? void 0 : _a.querySelector("[name=toolbar]"));
    switch (this._mode) {
      case SourceType.default:
        this._config = new PlainConfig(this);
        break;
      case SourceType.edcs:
      case SourceType.phi:
        this._config = new AncientTextConfig(this, toolbar, this._mode);
        break;
      case SourceType.leiden_plus:
        this._config = new LeidenConfig(this, toolbar);
        break;
      case SourceType.xquery:
        this._config = new XQueryConfig(this, this.linter);
        break;
      case SourceType.css:
        this._config = new CSSConfig(this);
        break;
      case SourceType.tex:
        this._config = new TeXConfig(this);
        break;
      case SourceType.html:
        this._config = new HTMLConfig(this);
        break;
      default:
        this._config = new XMLConfig(this, toolbar, this.namespace);
        break;
    }
  }
  get mode() {
    return this._mode;
  }
  set valid(value) {
    this.setAttribute("valid", value.toString());
  }
  get valid() {
    return Boolean(this.hasAttribute("valid"));
  }
  set content(text) {
    if (!this._editor) {
      console.log("no editor");
      return;
    }
    setTimeout(() => this._editor.dispatch({
      changes: { from: 0, to: this._editor.state.doc.length, insert: text }
    }));
  }
  get content() {
    var _a;
    return ((_a = this._editor) == null ? void 0 : _a.state.doc.toString()) || "";
  }
  set value(value) {
    var _a;
    const updated = this.setValue(value);
    if (updated && this._editor && this._config) {
      this.content = (_a = this._config) == null ? void 0 : _a.setFromValue(this._value);
    }
  }
  get value() {
    return this.getValue();
  }
  setValue(value) {
    if (!this._config) {
      return false;
    }
    const _val = this._config.setFromValue(value);
    if (this._value === _val) {
      return false;
    }
    this._value = value;
    return true;
  }
  getValue() {
    if (!this._value) {
      return null;
    }
    return this._value;
  }
  emitUpdateEvent(content) {
    this.dispatchEvent(new CustomEvent("update", {
      detail: { content },
      composed: true,
      bubbles: true
    }));
  }
  initModes() {
    const select = this.querySelector("[name=modes]");
    if (select && select instanceof HTMLSelectElement) {
      select.addEventListener("change", () => {
        this.mode = select.value;
      });
      return select.value;
    }
    return null;
  }
  registerToolbar(slot) {
    slot == null ? void 0 : slot.assignedElements().forEach((elem) => {
      elem.querySelectorAll("slot").forEach((sl) => this.registerToolbar(sl));
      elem.querySelectorAll("[data-command]").forEach((btn) => {
        const cmdName = btn.dataset.command;
        if (btn.hasAttribute("data-key")) {
          btn.title = `${btn.title} (${btn.getAttribute("data-key")})`;
        }
        btn.addEventListener("click", () => {
          var _a;
          if (!this._config) {
            return;
          }
          const commands = this._config.getCommands();
          const command = commands[cmdName];
          if (command) {
            const func = initCommand(cmdName, command, btn);
            if (func) {
              func(this._editor);
              if (cmdName !== "encloseWithCommand") {
                (_a = this._editor) == null ? void 0 : _a.focus();
              }
            }
          }
        });
      });
    });
  }
  activateToolbar(slot) {
    slot == null ? void 0 : slot.assignedElements().forEach((elem) => {
      elem.querySelectorAll("slot").forEach((sl) => this.activateToolbar(sl));
      elem.querySelectorAll("[data-command]").forEach((elem2) => {
        const btn = elem2;
        if (!btn.dataset.mode || btn.dataset.mode === this._mode) {
          btn.style.display = "inline";
        } else {
          btn.style.display = "none";
        }
      });
    });
  }
  getToolbarControls(slot, toolbar = []) {
    slot == null ? void 0 : slot.assignedElements().forEach((elem) => {
      elem.querySelectorAll("[data-command]").forEach((btn) => {
        toolbar.push(btn);
      });
      elem.querySelectorAll("slot").forEach((sl) => this.getToolbarControls(sl, toolbar));
    });
    return toolbar;
  }
  styles() {
    return `
            :host > div {
                width: 100%;
                background-color: var(--jinn-codemirror-background-color, #fff);
            }
        `;
  }
}
window.customElements.define("jinn-codemirror", JinnCodemirror);
export {
  JinnCodemirror
};
