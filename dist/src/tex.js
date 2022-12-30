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
import { StreamLanguage } from "@codemirror/language";
import { stex } from "@codemirror/legacy-modes/mode/stex";
import { EditorConfig } from "./config";
class TeXConfig extends EditorConfig {
  getExtensions(editor) {
    return __async(this, null, function* () {
      return [
        StreamLanguage.define(stex)
      ];
    });
  }
  serialize() {
    return this.editor.content;
  }
}
export {
  TeXConfig
};
