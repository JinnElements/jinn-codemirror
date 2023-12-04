import { StateEffect, StateField } from "@codemirror/state";
import { EditorView, showPanel } from "@codemirror/view";
import { wrapCommand } from "./config";
import './zotero-picker';

let zoteroGroup = null;

const toggleZoteroPane = StateEffect.define();

const zoteroState = StateField.define({
  create: () => false,
  update(value, tr) {
    for (let e of tr.effects) {
      if (e.is(toggleZoteroPane
      )) {
        value = e.value;
      }
    }
    return value;
  },
  provide: (f) => showPanel.from(f, (on) => on ? createZoteroPanel : null)
});

function createZoteroPanel(view) {
  const dom = document.createElement("div");
  dom.className = "cm-input-panel";
  const input = document.createElement("jinn-zotero-picker");
  if (zoteroGroup) {
    input.setAttribute('group', zoteroGroup);
  }
  input.placeholder = "Zotero reference";
  input.addEventListener("change", (ev) => {
    view.dispatch({ effects: toggleZoteroPane
        .of(false) });
    if (ev.detail) {
        wrapCommand(`<ref key="${ev.detail}">`, `</ref>`)(view);
    }
    view.focus();
  });
  dom.appendChild(input);
  return { top: false, dom, mount: () => setTimeout(() => input.focus(), 50) };
}

const zoteroTheme = EditorView.baseTheme({
  ".cm-input-panel": {
    padding: "5px 10px",
    display: "block"
  },
  ".cm-input-panel jinn-zotero-picker": {
    width: "100%",
    height: "auto"
  }
});

export function zoteroPanel() {
  return [zoteroState, zoteroTheme];
}

export const zoteroCommand = (group):Command => (editor) => {
    zoteroGroup = group;
    editor.dispatch({ effects: toggleZoteroPane.of(!editor.state.field(zoteroState)) });
    return true;
};