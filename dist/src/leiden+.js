import { EditorSelection } from "@codemirror/state";
import { keymap } from "@codemirror/view";
import { syntaxTree } from "@codemirror/language";
import { linter, lintGutter } from "@codemirror/lint";
import { snippet } from "@codemirror/autocomplete";
import { leidenPlus2epiDoc } from "./import/leiden+2xml";
import { EditorConfig, snippetCommand, wrapCommand } from "./config";
import { leiden } from "./language";
import { xml2leidenPlus } from "./import/xml2leiden+";
const fixAbbrevAction = (node) => {
  return {
    name: "Fix",
    apply: (view, from, to) => {
      const word = view.state.wordAt(from);
      if (word) {
        from = word.from;
      }
      const content = view.state.doc.sliceString(from, to);
      const tx = view.state.update({
        changes: { from, to, insert: `(${content.toString()})` }
      });
      view.dispatch(tx);
    }
  };
};
const leidenParseLinter = (editor) => (view) => {
  function emitEvent(valid) {
    editor.valid = valid;
    editor.dispatchEvent(new CustomEvent(valid ? "valid" : "invalid", {
      detail: diagnostics,
      composed: true,
      bubbles: true
    }));
  }
  const diagnostics = [];
  const tree = syntaxTree(view.state);
  let abbrevs = 0;
  let hasInnerAbbrev = false;
  tree.iterate({
    enter: (node) => {
      if (node.name === "Abbrev") {
        abbrevs += 1;
      } else if (node.type.isError) {
        diagnostics.push({
          message: "Syntaxfehler",
          severity: "error",
          from: node.from,
          to: node.to
        });
      }
    },
    leave: (node) => {
      if (node.name === "Abbrev") {
        if (abbrevs === 2) {
          hasInnerAbbrev = true;
        } else if (!hasInnerAbbrev) {
          diagnostics.push({
            message: 'Invalid abbreviation. Abbreviations must\nuse double parenthesis, e.g. "(C(aesar))"',
            severity: "error",
            from: node.from,
            to: node.to,
            actions: [fixAbbrevAction(node)]
          });
        }
        abbrevs -= 1;
        if (abbrevs === 0) {
          hasInnerAbbrev = false;
        }
      }
    }
  });
  emitEvent(diagnostics.length === 0);
  return diagnostics;
};
const toggleUnclearCommand = (editor) => {
  editor.dispatch(editor.state.changeByRange((range) => {
    const content = editor.state.doc.slice(range.from, range.to).toString();
    let newContent = "";
    for (let i = 0; i < content.length; i++) {
      if (i + 1 < content.length && content.charCodeAt(i + 1) === 803) {
        newContent += content.charAt(i);
        i++;
      } else {
        newContent += `${content.charAt(i)}\u0323`;
      }
    }
    return {
      changes: [{ from: range.from, to: range.to, insert: newContent }],
      range: EditorSelection.range(range.from, range.from + newContent.length)
    };
  }));
  return true;
};
const fixNewlinesCommand = (editor) => {
  const content = editor.state.doc.toString();
  let fixed;
  if (content.indexOf("/") !== -1) {
    const lines = content.split(/(?<!\/)\/\/?/);
    const split = lines.map((line, idx) => {
      if (/^\s+/.test(line) || idx === 0) {
        return `${idx + 1}. ${line.replace(/^\s+/, "")}`;
      }
      return `${idx + 1}.- ${line.replace(/^\s+/, "")}`;
    });
    fixed = split.join("\n");
  } else {
    let matchCount = 0;
    fixed = content.replace(/^(?!\d+\.)/gm, () => {
      matchCount += 1;
      return `${matchCount}. `;
    });
  }
  editor.dispatch({
    changes: [{ from: 0, to: editor.state.doc.length, insert: fixed }]
  });
  return true;
};
const expansionCommand = (editor) => {
  editor.state.selection.ranges.forEach((range) => {
    const content = editor.state.doc.slice(range.from, range.to).toString();
    let abbrev = "", expan = "";
    if (content.length > 0) {
      abbrev = content.charAt(0);
      expan = content.substring(1);
    }
    const template = `(\${1:${abbrev}}(\${2:${expan}}))\${3}`;
    const snip = snippet(template);
    snip(editor, { label: "" }, range.from, range.to);
  });
  return true;
};
const commands = {
  expan: expansionCommand,
  div: wrapCommand("<=\n", "\n=>"),
  fragment: snippetCommand("<D=.${1:1}.fragment<=\n${2:_}\n=>=D>${3}"),
  part: snippetCommand("<D=.${1:A}.part<=\n${2:_}\n=>=D>${3}"),
  recto: wrapCommand("<D=.r<=\n", "\n=>=D>"),
  verso: wrapCommand("<D=.v<=\n", "\n=>=D>"),
  erasure: wrapCommand("\u301A", "\u301B"),
  foreign: snippetCommand("~|${1:_}|~${2:gr}${3}"),
  unclear: toggleUnclearCommand,
  fixNewlines: fixNewlinesCommand,
  snippet: {
    create: (template) => snippetCommand(template)
  }
};
const leidenKeymap = [
  { key: "Ctrl-Shift-e", mac: "Cmd-Shift-e", run: commands.expan },
  { key: "Ctrl-Shift-a", mac: "Cmd-Shift-a", run: commands.div },
  { key: "Ctrl-Shift-f", mac: "Cmd-Shift-f", run: commands.fragment },
  { key: "Ctrl-Shift-p", mac: "Cmd-Shift-p", run: commands.part },
  { key: "Ctrl-Shift-r", mac: "Cmd-Shift-r", run: commands.recto },
  { key: "Ctrl-Shift-v", mac: "Cmd-Shift-v", run: commands.verso },
  { key: "Ctrl-Shift-d", mac: "Cmd-Shift-d", run: commands.erasure },
  { key: "Ctrl-Shift-u", mac: "Cmd-Shift-u", run: commands.unclear },
  { key: "Ctrl-Shift-f", mac: "Cmd-Shift-f", run: commands.foreign }
];
class LeidenConfig extends EditorConfig {
  constructor(editor, toolbar) {
    super(editor, toolbar, commands);
  }
  async getExtensions() {
    return [
      leiden(),
      linter(leidenParseLinter(this.editor)),
      keymap.of(leidenKeymap),
      lintGutter()
    ];
  }
  getCommands() {
    return commands;
  }
  onUpdate(tree, content) {
    return leidenPlus2epiDoc(content, tree);
  }
  serialize() {
    return this.editor.content;
  }
  setFromValue(value) {
    if (!value) {
      return "";
    }
    if (value instanceof NodeList) {
      const result = [];
      value.forEach((node) => result.push(xml2leidenPlus(node)));
      return result.join("");
    }
    if (value instanceof Element) {
      return xml2leidenPlus(value);
    }
    return super.setFromValue(value);
  }
}
export {
  LeidenConfig,
  expansionCommand,
  fixNewlinesCommand,
  toggleUnclearCommand
};
