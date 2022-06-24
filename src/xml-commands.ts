import { EditorSelection, StateEffect, StateField } from "@codemirror/state";
import { Command, EditorView, showPanel } from "@codemirror/view";
import { syntaxTree } from "@codemirror/language";
import { EditorCommands, wrapCommand } from "./config";

const toggleInputPanel = StateEffect.define<boolean>();

const inputPanelState = StateField.define<boolean>({
  create: () => false,
  update(value, tr) {
    for (let e of tr.effects) {
        if (e.is(toggleInputPanel)) {
            value = e.value;
        }
    }
    return value;
  },
  provide: f => showPanel.from(f, on => on ? createInputPanel : null)
});

function createInputPanel(view: EditorView) {
    const dom = document.createElement("div");
    dom.className = "cm-input-panel";
    
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Name of element (enter to confirm, esc to abort)';
    input.addEventListener('keyup', (ev) => {
        switch (ev.key) {
            case 'Enter':
                ev.preventDefault();
                const tag = input.value;
                if (tag !== '') {
                    wrapCommand(`<${tag}>`, `</${tag}>`)(view);
                    view.focus();
                }
            case 'Esc':
            case 'Escape':
                view.dispatch({effects: toggleInputPanel.of(false)});
        }
    });
    dom.appendChild(input);
    return {top: false, dom, mount: () => input.focus() };
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

export function inputPanel() {
    return [inputPanelState, inputPanelTheme];
}

export const encloseWithCommand:Command = (editor) => {
    editor.dispatch({effects: toggleInputPanel.of(!editor.state.field(inputPanelState))})
    return true;
};

/**
 * Select the surrounding parent element.
 */
 export const selectElementCommand:Command = (editor) => {
    editor.dispatch(editor.state.changeByRange(range => {
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

export const removeEnclosingCommand:Command = (editor) => {
    editor.dispatch(editor.state.changeByRange(range => {
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
                if (startTag.name === 'SelfClosingTag') {
                    return {
                        range: EditorSelection.range(startTag.from, startTag.from),
                        changes: [
                            { from: startTag.from, to: startTag.to, insert: '' }
                        ]
                    }
                } else {
                    return {
                        range: EditorSelection.range(startTag.from, endTag.from - (startTag.to - startTag.from)),
                        changes: [
                            { from: startTag.from, to: startTag.to, insert: '' },
                            { from: endTag.from, to: endTag.to, insert: '' }
                        ]
                    }
                }
            }
        }
        return {
            range
        };
    }));
    return true;
}

export const commands:EditorCommands = {
    selectElement: selectElementCommand,
    removeEnclosing: removeEnclosingCommand,
    encloseWith: encloseWithCommand
};