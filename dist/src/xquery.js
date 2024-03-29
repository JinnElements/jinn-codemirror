import { StreamLanguage } from "@codemirror/language";
import { xQuery } from "@codemirror/legacy-modes/mode/xquery";
import { linter, lintGutter } from "@codemirror/lint";
import { EditorConfig } from "./config";
const eXistLinter = (editor, uri) => (view) => {
  const diagnostics = [];
  function emitEvent(valid) {
    editor.valid = valid;
    editor.dispatchEvent(new CustomEvent(valid ? "valid" : "invalid", {
      detail: diagnostics,
      composed: true,
      bubbles: true
    }));
  }
  if (!uri) {
    return Promise.resolve(diagnostics);
  }
  if (view.state.doc.length === 0) {
    emitEvent(true);
    return Promise.resolve(diagnostics);
  }
  return new Promise(
    (resolve) => fetch(uri, {
      method: "POST",
      headers: {
        "Content-type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({ code: view.state.doc.toString() || "" }).toString()
    }).then((response) => response.json()).then((json) => {
      if (json.status === "fail") {
        const line = view.state.doc.lineAt(json.line);
        diagnostics.push({
          message: json.message,
          severity: "error",
          from: line.from + json.column,
          to: line.from + line.length
        });
      }
      resolve(diagnostics);
      emitEvent(diagnostics.length === 0);
    })
  );
};
class XQueryConfig extends EditorConfig {
  constructor(editor, toolbar = [], linterUri = null) {
    super(editor, toolbar);
    this.linterUri = linterUri;
  }
  async getExtensions(editor) {
    return [
      StreamLanguage.define(xQuery),
      linter(eXistLinter(editor, this.linterUri)),
      lintGutter()
    ];
  }
  serialize() {
    return this.editor.content;
  }
}
export {
  XQueryConfig
};
