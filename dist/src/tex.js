import { StreamLanguage } from "@codemirror/language";
import { stex } from "@codemirror/legacy-modes/mode/stex";
import { EditorConfig } from "./config";
class TeXConfig extends EditorConfig {
  async getExtensions(editor) {
    return [
      StreamLanguage.define(stex)
    ];
  }
  serialize() {
    return this.editor.content;
  }
}
export {
  TeXConfig
};
