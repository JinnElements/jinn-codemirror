var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b ||= {})
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
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
    super(editor, toolbar, __spreadProps(__spreadValues({}, commands), {
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
