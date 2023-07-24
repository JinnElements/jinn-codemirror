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
import { lintGutter } from "@codemirror/lint";
import { EditorConfig, insertCommand, wrapCommand } from "./config";
import { ancientText2XML } from "./import/ancientText2xml.js";
import { xml2leidenPlus } from "./import/xml2leiden+";
function convertToLeidenPlus(text, type) {
  const converted = ancientText2XML(text, type);
  const xml = `<ab>${converted}
</ab>`;
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, "application/xml");
  if (!doc.firstElementChild) {
    return "";
  }
  const errorNode = doc.querySelector("parsererror");
  if (errorNode) {
    return null;
  }
  return xml2leidenPlus(doc.firstElementChild);
}
const convertToLeidenPlusCommand = (component, type) => (editor) => {
  const lines = editor.state.doc.toJSON();
  const leiden = convertToLeidenPlus(lines.join("\n"), type);
  if (leiden) {
    component._value = leiden;
    component.mode = "leiden_plus";
  } else {
    alert("Conversion failed due to invalid XML!");
  }
  return true;
};
const commands = {
  erasure: wrapCommand("[[", "]]"),
  gap: insertCommand("[---]")
};
class AncientTextConfig extends EditorConfig {
  constructor(editor, toolbar = [], sourceType) {
    super(editor, toolbar, Object.assign(commands, {
      convert: convertToLeidenPlusCommand(editor, sourceType)
    }));
    this._sourceType = sourceType;
  }
  getExtensions() {
    return __async(this, null, function* () {
      return [lintGutter()];
    });
  }
  onUpdate(tree, content) {
    const converted = ancientText2XML(content, this._sourceType);
    return `<ab>
${converted}
</ab>`;
  }
  serialize() {
    return this.editor.content;
  }
}
export {
  AncientTextConfig,
  convertToLeidenPlus,
  convertToLeidenPlusCommand
};
