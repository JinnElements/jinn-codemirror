import { cssLanguage } from "@codemirror/lang-css";
import { LanguageSupport } from "@codemirror/language";
import { EditorConfig } from "./config";
class CSSConfig extends EditorConfig {
  async getExtensions(editor) {
    return [new LanguageSupport(cssLanguage)];
  }
  serialize() {
    return this.editor.content;
  }
}
export {
  CSSConfig
};
