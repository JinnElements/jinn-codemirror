import { EditorConfig } from "./config";
import { markdown } from "@codemirror/lang-markdown";
class MarkdownConfig extends EditorConfig {
  constructor(editor, toolbar = []) {
    super(editor, toolbar);
  }
  async getExtensions(editor) {
    return [markdown()];
  }
  serialize() {
    return this.editor.content;
  }
}
export {
  MarkdownConfig
};
