import { xml, completeFromSchema } from "@codemirror/lang-xml";
import { EditorConfig } from "./config";
import { linter, lintGutter } from "@codemirror/lint";
import { syntaxTree } from "@codemirror/language";
import { commands, encloseWithPanel } from "./xml-commands";
import { autocompletion } from "@codemirror/autocomplete";
const isNamespaceNode = (view, node) => {
  return node.type.name === "AttributeName" && view.state.sliceDoc(node.from, node.to) === "xmlns";
};
const isErrorComment = (view, node) => {
  return node.type.name === "Comment" && /\<\!\-\- Error\:([^ ])* \-\-\>/.test(view.state.sliceDoc(node.from, node.to));
};
const delay = 300;
const markerFilter = (dias) => dias.filter((dia) => dia.severity !== "info");
const fixNamespaceAction = (namespace) => {
  return {
    name: "Fix",
    apply: (view, from, to) => {
      const tx = view.state.update({
        changes: { from, to, insert: namespace }
      });
      view.dispatch(tx);
    }
  };
};
const teiFragmentLinter = (editor, namespace) => (view) => {
  function emitEvent(valid) {
    editor.valid = valid;
    editor.dispatchEvent(new CustomEvent(valid ? "valid" : "invalid", {
      detail: diagnostics,
      composed: true,
      bubbles: true
    }));
  }
  const diagnostics = [];
  if (view.state.doc.length === 0) {
    emitEvent(true);
    return diagnostics;
  }
  const tree = syntaxTree(view.state);
  let hasNamespace = false;
  const stack = [];
  tree.iterate({
    enter: (node) => {
      if (node.type.isError) {
        diagnostics.push({
          message: "Syntax error",
          severity: "error",
          from: node.from,
          to: node.to
        });
      }
      if (node.type.name === "StartTag") {
        node.nextSibling();
        stack.push(view.state.sliceDoc(node.from, node.to));
      } else if (node.type.name === "StartCloseTag") {
        node.nextSibling();
        const closeTag = view.state.sliceDoc(node.from, node.to);
        const openTag = stack.pop();
        if (closeTag !== openTag) {
          diagnostics.push({
            message: `Expected closing tag for ${openTag}`,
            severity: "error",
            from: node.from,
            to: node.to
          });
        }
      } else if (node.type.name === "SelfCloseEndTag") {
        stack.pop();
      } else if (isNamespaceNode(view, node)) {
        hasNamespace = true;
        node.nextSibling();
        node.nextSibling();
        const ns = view.state.sliceDoc(node.from + 1, node.to - 1);
        if (namespace && ns !== namespace) {
          diagnostics.push({
            message: "Wrong Namespace",
            severity: "error",
            from: node.from + 1,
            to: node.to - 1,
            actions: [fixNamespaceAction(namespace)]
          });
        }
      } else if (isErrorComment(view, node)) {
        diagnostics.push({
          message: "Syntax error in source input",
          severity: "warning",
          from: node.from,
          to: node.to
        });
      }
    },
    leave: (node) => {
      if (node.type.name === "Document" && namespace && !hasNamespace) {
        diagnostics.push({
          message: "Missing TEI namespace",
          severity: "error",
          from: node.from,
          to: node.to
        });
      }
      if (node.type.isError) {
        diagnostics.push({
          message: "Syntax error in input",
          severity: "error",
          from: node.from,
          to: node.to
        });
      }
    }
  });
  emitEvent(diagnostics.length === 0);
  return diagnostics;
};
const completeAttribute = (view, completion, from, to) => {
  const tx = view.state.update({
    changes: { from, to, insert: `${completion.label}=""` },
    selection: { anchor: from + completion.label.length + 2 }
  });
  view.dispatch(tx);
};
class XMLConfig extends EditorConfig {
  constructor(editor, toolbar = [], namespace = null, checkNamespace = false, unwrap = false, attributeAutocomplete = []) {
    super(editor, toolbar, commands);
    this.namespace = namespace;
    this.checkNamespace = checkNamespace;
    this.unwrap = unwrap;
    this.attributeAutocomplete = attributeAutocomplete;
  }
  getDefaultExtensions() {
    return [
      encloseWithPanel(),
      linter(teiFragmentLinter(this.editor, this.checkNamespace ? this.namespace : null), { delay, markerFilter }),
      lintGutter({ markerFilter })
    ];
  }
  async getExtensions() {
    const schemaUrl = this.editor.schema;
    const defaultExtensions = this.getDefaultExtensions();
    const completionSources = [];
    this.attributeAutocomplete.forEach((autocomplete) => {
      const source = autocomplete.createCompletionSource();
      if (source) {
        completionSources.push(source);
      }
    });
    if (schemaUrl) {
      const schema = await this.loadSchema(schemaUrl);
      completionSources.push(completeFromSchema(schema.elements, []));
      const xmlSupport = xml(schema);
      return defaultExtensions.concat(
        xmlSupport,
        autocompletion({
          override: completionSources
        })
      );
    } else {
      const xmlSupport = xml();
      return defaultExtensions.concat(
        xmlSupport,
        autocompletion({
          override: completionSources
        })
      );
    }
  }
  async loadSchema(url) {
    const json = await fetch(url).then((response) => response.json());
    let elements = json.elements;
    const entryPoint = this.editor.schemaRoot;
    if (entryPoint) {
      const root = json.elements.find((elem) => elem.name === entryPoint);
      if (root) {
        const filtered = /* @__PURE__ */ new Map();
        const elemMap = /* @__PURE__ */ new Map();
        json.elements.forEach((elem) => elemMap.set(elem.name, elem));
        this.filterSchema(root, elemMap, filtered);
        elements = Array.from(filtered.values());
      }
    }
    this.extendSchema(elements);
    return { elements };
  }
  filterSchema(elem, elemList, result, level = 0) {
    elem.children.forEach((child) => {
      const existingEntry = result.get(child);
      if (existingEntry) {
        existingEntry.top = level === 0;
        return;
      }
      const entry = elemList.get(child);
      if (entry) {
        entry.top = level === 0;
        result.set(child, entry);
        this.filterSchema(entry, elemList, result, level + 1);
      }
    });
  }
  extendSchema(elements) {
    elements.forEach((elem) => {
      elem.completion.type = "keyword";
      elem.attributes.forEach((attr) => {
        attr.completion.type = "property";
        attr.completion.apply = completeAttribute;
      });
    });
  }
  serialize() {
    const parser = new DOMParser();
    const content = this.unwrap ? `<R xmlns="${this.namespace || ""}">${this.editor.content}</R>` : this.editor.content;
    const parsed = parser.parseFromString(content, "application/xml");
    const errors = parsed.getElementsByTagName("parsererror");
    if (errors.length) {
      return null;
    }
    return this.unwrap ? parsed.firstElementChild?.childNodes : parsed.firstElementChild;
  }
}
export {
  XMLConfig
};
