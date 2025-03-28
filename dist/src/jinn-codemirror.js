import { EditorView } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { XMLConfig } from "./xml";
import { LeidenConfig } from "./leiden+";
import { AncientTextConfig } from "./ancientText";
import { XQueryConfig } from "./xquery";
import { CSSConfig } from "./css";
import { JSONConfig } from "./json";
import { PlainConfig } from "./plain";
import { TeXConfig } from "./tex";
import { SourceType, initCommand } from "./config";
import { HTMLConfig } from "./html";
import { MarkdownConfig } from "./markdown";
class JinnCodemirror extends HTMLElement {
  constructor() {
    super();
    this._mode = SourceType.xml;
    this._placeholder = "";
    this.attachShadow({ mode: "open" });
    this.ignoreBlur = true;
  }
  static get observedAttributes() {
    return ["placeholder", "mode", "code"];
  }
  connectedCallback() {
    const css = document.createElement("style");
    css.innerHTML = this.styles();
    this.shadowRoot?.appendChild(css);
    const headerSlot = document.createElement("slot");
    headerSlot.name = "header";
    this.shadowRoot?.appendChild(headerSlot);
    const toolbarSlot = document.createElement("slot");
    toolbarSlot.name = "toolbar";
    this.shadowRoot?.appendChild(toolbarSlot);
    const wrapper = document.createElement("div");
    wrapper.id = "editor";
    this.shadowRoot?.appendChild(wrapper);
    this.registerToolbar(this.shadowRoot?.querySelector("[name=toolbar]"));
    this._placeholder = this.getAttribute("placeholder") || "";
    this.namespace = this.getAttribute("namespace");
    this.linter = this.getAttribute("linter");
    this.mode = this.initModes() || this.getAttribute("mode") || "xml";
    if (!this.hasAttribute("mode")) {
      this.setAttribute("mode", this._mode);
    }
    if (this.hasAttribute("code")) {
      this.value = this.getAttribute("code");
    }
    if (this.hasAttribute("theme")) {
      this.theme = this.getAttribute("theme");
    }
    this.ignoreBlur = this.hasAttribute("ignore-blur");
    if (!this.ignoreBlur) {
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
  attributeChangedCallback(name, oldValue, newValue) {
    if (!oldValue || oldValue === newValue) {
      return;
    }
    switch (name) {
      case "placeholder":
        this.placeholder = newValue;
        break;
      case "mode":
        this.mode = newValue;
        break;
      case "code":
        this.value = newValue;
    }
  }
  /**
   * Move keyboard focus to the editor
   */
  focus() {
    if (this._editor) {
      this._editor.focus();
    }
  }
  get placeholder() {
    return this._placeholder;
  }
  /**
   * A placeholder string to be shown if the user has not yet entered anything.
   * 
   * @attr {string} placeholder
   */
  set placeholder(label) {
    this._placeholder = label;
    this.setMode(this.mode);
  }
  /**
   * The mode to use. Currently supported are 'xml', 'xquery', 'css', 'html', 'tex', 'markdown', 'leiden_plus', 'edcs', 'phi' or 'default'.
   * 
   * @attr {string} mode
   */
  set mode(mode) {
    this.setMode(mode);
  }
  setMode(mode, update = true) {
    const wrapper = this.shadowRoot?.getElementById("editor");
    if (!wrapper) {
      return;
    }
    if (this._editor) {
      this._editor.destroy();
      wrapper.innerHTML = "";
    }
    this._mode = SourceType[mode];
    console.log(`<jinn-codemirror> mode: ${this.mode}`);
    this.activateToolbar(this.shadowRoot?.querySelector("[name=toolbar]"));
    this.configure();
    const select = this.querySelector("[name=modes]");
    if (select && select instanceof HTMLSelectElement) {
      select.value = this._mode;
    }
    this._config?.getConfig().then((stateConfig) => {
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
    const toolbar = this.getToolbarControls(this.shadowRoot?.querySelector("[name=toolbar]"));
    switch (this._mode) {
      case SourceType.edcs:
      case SourceType.phi:
        this._config = new AncientTextConfig(this, toolbar, this._mode);
        break;
      case SourceType.leiden_plus:
        this._config = new LeidenConfig(this, toolbar);
        break;
      case SourceType.xquery:
        this._config = new XQueryConfig(this, toolbar, this.linter);
        break;
      case SourceType.css:
        this._config = new CSSConfig(this, toolbar);
        break;
      case SourceType.json:
        this._config = new JSONConfig(this, toolbar);
        break;
      case SourceType.tex:
        this._config = new TeXConfig(this, toolbar);
        break;
      case SourceType.html:
        this._config = new HTMLConfig(this, toolbar);
        break;
      case SourceType.xml:
        this._config = new XMLConfig(this, toolbar, this.namespace);
        break;
      case SourceType.markdown:
        this._config = new MarkdownConfig(this, toolbar);
        break;
      default:
        this._config = new PlainConfig(this, toolbar);
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
  /**
   * Show a status message below the editor.
   */
  set status(msg) {
    this._config.status = msg;
  }
  /**
   * The content edited in the editor as a string.
   */
  set content(text) {
    if (!this._editor) {
      console.log("no editor");
      return;
    }
    setTimeout(
      () => this._editor.dispatch({
        changes: { from: 0, to: this._editor.state.doc.length, insert: text }
      })
    );
  }
  get content() {
    return this._editor?.state.doc.toString() || "";
  }
  /**
   * The value edited in the editor as either an Element or string - depending on the mode set.
   */
  set value(value) {
    const updated = this.setValue(value);
    if (updated && this._editor && this._config) {
      this.content = this._config?.setFromValue(this._value);
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
  set code(text) {
    this.value = text;
  }
  clear() {
    this._value = "";
    this._editor.dispatch({
      changes: { from: 0, to: this._editor.state.doc.length, insert: "" }
    });
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
    slot?.assignedElements().forEach((elem) => {
      elem.querySelectorAll("slot").forEach((sl) => this.registerToolbar(sl));
      elem.querySelectorAll("[data-command]").forEach((btn) => {
        const cmdName = btn.dataset.command;
        if (btn.hasAttribute("data-key")) {
          btn.title = `${btn.title} (${btn.getAttribute("data-key")})`;
        }
        btn.addEventListener("click", () => {
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
                this._editor?.focus();
              }
            }
          }
        });
      });
    });
  }
  activateToolbar(slot) {
    slot?.assignedElements().forEach((elem) => {
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
    slot?.assignedElements().forEach((elem) => {
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

            .cm-cursor {
                min-height: 1rem;
            }

            .status {
                padding-left: .5rem;
            }
        `;
  }
}
if (!customElements.get("jinn-codemirror")) {
  window.customElements.define("jinn-codemirror", JinnCodemirror);
}
export {
  JinnCodemirror
};
