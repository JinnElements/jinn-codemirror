import { EditorConfig } from "./config";
class PlainConfig extends EditorConfig {
  async getExtensions(editor) {
    return [];
  }
  serialize() {
    return this.editor.content;
  }
}
export {
  PlainConfig
};
