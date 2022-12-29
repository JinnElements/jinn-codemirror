import { EditorSelection, StateEffect, StateField } from "@codemirror/state";
import { EditorView, showPanel } from "@codemirror/view";
import { syntaxTree } from "@codemirror/language";
import { wrapCommand, snippetCommand } from "./config";
const toggleInputPanel = StateEffect.define();
const inputPanelState = StateField.define({
  create: () => false,
  update(value, tr) {
    for (let e of tr.effects) {
      if (e.is(toggleInputPanel)) {
        value = e.value;
      }
    }
    return value;
  },
  provide: (f) => showPanel.from(f, (on) => on ? createInputPanel : null)
});
function createInputPanel(view) {
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
        view.dispatch({ effects: toggleInputPanel.of(false) });
    }
  });
  dom.appendChild(input);
  return { top: false, dom, mount: () => setTimeout(() => input.focus(), 50) };
}
const inputPanelTheme = EditorView.baseTheme({
  ".cm-input-panel": {
    padding: "5px 10px",
    fontFamily: "monospace"
  },
  ".cm-input-panel input": {
    width: "100%"
  }
});
function inputPanel() {
  return [inputPanelState, inputPanelTheme];
}
const encloseWithCommand = (editor) => {
  editor.dispatch({ effects: toggleInputPanel.of(!editor.state.field(inputPanelState)) });
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
  }
};
export {
  commands,
  encloseWithCommand,
  inputPanel,
  removeEnclosingCommand,
  selectElementCommand
};
