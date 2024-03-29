import { EditorConfig } from "./config";
import { html } from "@codemirror/lang-html";
import { commands, encloseWithPanel } from "./xml-commands";
class HTMLConfig extends EditorConfig {
  constructor(editor, toolbar = []) {
    super(editor, toolbar, commands);
  }
  async getExtensions(editor) {
    return [html({ selfClosingTags: false }), encloseWithPanel()];
  }
  serialize() {
    return this.editor.content;
  }
}
export {
  HTMLConfig
};
