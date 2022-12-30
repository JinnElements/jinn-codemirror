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
import { EditorConfig } from "./config";
import { html } from "@codemirror/lang-html";
class HTMLConfig extends EditorConfig {
  constructor(editor) {
    super(editor);
  }
  getExtensions(editor) {
    return __async(this, null, function* () {
      return [html({ selfClosingTags: false })];
    });
  }
  serialize() {
    return this.editor.content;
  }
}
export {
  HTMLConfig
};
