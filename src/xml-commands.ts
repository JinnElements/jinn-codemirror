import { EditorSelection, StateEffect, StateField } from "@codemirror/state";
import { EditorView, showPanel } from "@codemirror/view";
import { syntaxTree } from "@codemirror/language";
import { wrapCommand, snippetCommand } from "./config";
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

function zoteroPanel() {
  return [zoteroState, zoteroTheme];
}

const toggleEncloseWith = StateEffect.define();
const encloseWithState = StateField.define({
  create: () => false,
  update(value, tr) {
    for (let e of tr.effects) {
      if (e.is(toggleEncloseWith
      )) {
        value = e.value;
      }
    }
    return value;
  },
  provide: (f) => showPanel.from(f, (on) => on ? createEncloseWithPanel : null)
});
function createEncloseWithPanel(view) {
  const dom = document.createElement("div");
  dom.className = "cm-input-panel";
  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "Name of element (enter to confirm, esc to abort)";
  input.addEventListener("keyup", (ev) => {
    switch (ev.key) {
      case "Enter":
        ev.preventDefault();
        const tag = input.value;
        if (tag !== "") {
          wrapCommand(`<${tag}>`, `</${tag}>`)(view);
          view.focus();
        }
      case "Esc":
      case "Escape":
        view.dispatch({ effects: toggleEncloseWith
        .of(false) });
    }
  });
  dom.appendChild(input);
  return { top: false, dom, mount: () => setTimeout(() => input.focus(), 50) };
}

const encloseWithTheme = EditorView.baseTheme({
  ".cm-input-panel": {
    padding: "5px 10px",
    fontFamily: "monospace"
  },
  ".cm-input-panel input": {
    width: "100%"
  }
});

function encloseWithPanel() {
  return [encloseWithState, encloseWithTheme];
}

const zoteroCommand = (group):Command => (editor) => {
  zoteroGroup = group;
  editor.dispatch({ effects: toggleZoteroPane.of(!editor.state.field(zoteroState)) });
  return true;
};

const encloseWithCommand = (editor) => {
  editor.dispatch({ effects: toggleEncloseWith
  .of(!editor.state.field(encloseWithState)) });
  return true;
};
const selectElementCommand = (editor) => {
  editor.dispatch(editor.state.changeByRange((range) => {
    const at = syntaxTree(editor.state).resolveInner(range.from);
    let inTag = null;
    for (let cur = at; !inTag && cur.parent; cur = cur.parent) {
      if (cur.name == "Element") {
        inTag = cur;
      }
    }
    if (inTag) {
      return {
        selection: EditorSelection.range(inTag.from, inTag.to),
        range: EditorSelection.range(inTag.from, inTag.to)
      };
    }
    return {
      range
    };
  }));
  return true;
};
const removeEnclosingCommand = (editor) => {
  editor.dispatch(editor.state.changeByRange((range) => {
    const at = syntaxTree(editor.state).resolveInner(range.from);
    let inTag = null;
    for (let cur = at; !inTag && cur.parent; cur = cur.parent) {
      if (cur.name == "Element") {
        inTag = cur;
      }
    }
    if (inTag) {
      const startTag = inTag.firstChild;
      const endTag = inTag.lastChild;
      if (startTag && endTag) {
        if (startTag.name === "SelfClosingTag") {
          return {
            range: EditorSelection.range(startTag.from, startTag.from),
            changes: [
              { from: startTag.from, to: startTag.to, insert: "" }
            ]
          };
        } else {
          return {
            range: EditorSelection.range(startTag.from, endTag.from - (startTag.to - startTag.from)),
            changes: [
              { from: startTag.from, to: startTag.to, insert: "" },
              { from: endTag.from, to: endTag.to, insert: "" }
            ]
          };
        }
      }
    }
    return {
      range
    };
  }));
  return true;
};
const commands = {
  selectElement: selectElementCommand,
  removeEnclosing: removeEnclosingCommand,
  encloseWith: encloseWithCommand,
  snippet: {
    create: (template) => snippetCommand(template)
  },
  zotero: {
    create: (group) => zoteroCommand(group)
  }
};
export {
  commands,
  encloseWithCommand,
  encloseWithPanel,
  zoteroCommand,
  zoteroPanel,
  removeEnclosingCommand,
  selectElementCommand
};
