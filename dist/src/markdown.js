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
import { markdown } from "@codemirror/lang-markdown";
class MarkdownConfig extends EditorConfig {
  constructor(editor, toolbar = []) {
    super(editor, toolbar);
  }
  getExtensions(editor) {
    return __async(this, null, function* () {
      return [markdown()];
    });
  }
  serialize() {
    return this.editor.content;
  }
}
export {
  MarkdownConfig
};
