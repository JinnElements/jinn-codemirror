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
import { cssLanguage } from "@codemirror/lang-css";
import { LanguageSupport } from "@codemirror/language";
import { EditorConfig } from "./config";
class CSSConfig extends EditorConfig {
  getExtensions(editor) {
    return __async(this, null, function* () {
      return [new LanguageSupport(cssLanguage)];
    });
  }
  serialize() {
    return this.editor.content;
  }
}
export {
  CSSConfig
};
