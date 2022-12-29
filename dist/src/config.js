var __async = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};
import { basicSetup } from "codemirror";
import { EditorView, placeholder } from "@codemirror/view";
import { ViewPlugin, keymap } from "@codemirror/view";
import { syntaxTree } from "@codemirror/language";
import { EditorSelection } from "@codemirror/state";
import { indentWithTab } from "@codemirror/commands";
import { snippet } from "@codemirror/autocomplete";
var SourceType = /* @__PURE__ */ ((SourceType2) => {
  SourceType2["xml"] = "xml";
  SourceType2["html"] = "html";
  SourceType2["leiden_plus"] = "leiden_plus";
  SourceType2["edcs"] = "edcs";
  SourceType2["phi"] = "phi";
  SourceType2["default"] = "default";
  SourceType2["xquery"] = "xquery";
  SourceType2["css"] = "css";
  return SourceType2;
})(SourceType || {});
;
class ParametrizedCommand {
}
const wrapCommand = (start, end) => (editor) => {
  editor.dispatch(editor.state.changeByRange((range) => {
    return {
      changes: [{ from: range.from, insert: start }, { from: range.to, insert: end }],
      range: EditorSelection.range(range.from + start.length, range.to + start.length)
    };
  }));
  return true;
};
const insertCommand = (insert) => (editor) => {
  editor.dispatch(editor.state.changeByRange((range) => {
    return {
      changes: [{ from: range.from, insert }],
      range: EditorSelection.range(range.from, range.from)
    };
  }));
  return true;
};
const snippetCommand = (template) => (editor) => {
  template = template.replace(/\$\|([^|]+)\|/g, "${$1}");
  editor.state.selection.ranges.forEach((range) => {
    const content = editor.state.doc.slice(range.from, range.to);
    const snip = snippet(template.replace(/\${_}/, `\${${content.toString()}}`));
    snip(editor, { label: "" }, range.from, range.to);
  });
  return true;
};
function initCommand(cmdName, cmd, control) {
  if (cmd.create) {
    const paramsAttr = control.dataset.params;
    if (paramsAttr) {
      let params;
      try {
        params = JSON.parse(paramsAttr);
      } catch (e) {
        params = [paramsAttr];
      }
      if (Array.isArray(params) && params.length === cmd.create.length) {
        return cmd.create.apply(null, params);
      } else {
        console.error("<jinn-codemirror> Expected %d arguments for command %s", cmd.create.length, cmdName);
        return null;
      }
    }
  }
  return cmd;
}
class EditorConfig {
  constructor(editor, commands = {}, toolbar = []) {
    this.editor = editor;
    this.commands = commands;
    this.keymap = [];
    if (toolbar) {
      toolbar.forEach((control) => {
        const cmdName = control.dataset.command;
        const cmd = commands[cmdName];
        if (cmd) {
          const shortcut = control.getAttribute("data-key");
          if (shortcut && shortcut.length > 0) {
            const command = initCommand(cmdName, cmd, control);
            if (command) {
              const binding = {
                key: shortcut,
                run: command
              };
              this.keymap.push(binding);
            }
          }
        }
      });
    }
  }
  getConfig() {
    return __async(this, null, function* () {
      const self = this;
      const updateListener = ViewPlugin.fromClass(class {
        update(update) {
          if (update.docChanged) {
            const tree = syntaxTree(update.state);
            const lines = update.state.doc.toJSON();
            const content = self.onUpdate(tree, lines.join("\n"));
            try {
              const serialized = self.serialize();
              if (serialized) {
                self.editor._value = serialized;
                self.editor.emitUpdateEvent(content);
              }
            } catch (e) {
            }
          }
        }
      });
      const customExtensions = yield this.getExtensions(this.editor);
      return {
        extensions: [
          basicSetup,
          EditorView.lineWrapping,
          keymap.of([indentWithTab, ...this.keymap]),
          placeholder(this.editor.placeholder),
          ...customExtensions,
          updateListener
        ]
      };
    });
  }
  getCommands() {
    return this.commands;
  }
  onUpdate(tree, content) {
    return content;
  }
}
export {
  EditorConfig,
  ParametrizedCommand,
  SourceType,
  initCommand,
  insertCommand,
  snippetCommand,
  wrapCommand
};
