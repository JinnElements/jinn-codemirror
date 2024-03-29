import { jsonLanguage, jsonParseLinter } from "@codemirror/lang-json";
import { LanguageSupport } from "@codemirror/language";
import { EditorConfig } from "./config";
import { linter, lintGutter } from "@codemirror/lint";
class JSONConfig extends EditorConfig {
  async getExtensions(editor) {
    return [new LanguageSupport(jsonLanguage), linter(jsonParseLinter()), lintGutter()];
  }
  serialize() {
    return this.editor.content;
  }
}
export {
  JSONConfig
};
