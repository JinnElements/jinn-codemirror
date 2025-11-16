class XMLAttributeAutocomplete {
  constructor(config) {
    this.config = config;
  }
  /**
   * Detects if we're in the configured element and attribute context.
   */
  detectContext(view, pos) {
    const textBefore = view.state.sliceDoc(Math.max(0, pos - 500), pos);
    const attrRegex = new RegExp(`${this.config.attributeName}\\s*=\\s*(["'])([^"']*)$`);
    const attrMatch = textBefore.match(attrRegex);
    if (!attrMatch) {
      return { isInAttribute: false, elementName: null, conditionValue: null };
    }
    const textUpToAttr = textBefore.substring(0, textBefore.length - attrMatch[0].length);
    const tagStartMatch = textUpToAttr.match(/<(\w+)([^>]*?)$/);
    if (!tagStartMatch) {
      return { isInAttribute: true, elementName: null, conditionValue: null };
    }
    const elementName = tagStartMatch[1];
    const attributesStr = tagStartMatch[2];
    let conditionValue = null;
    if (this.config.conditionAttribute) {
      const conditionRegex = new RegExp(
        `${this.config.conditionAttribute.name}\\s*=\\s*["']([^"']+)["']`
      );
      const conditionMatch = attributesStr.match(conditionRegex);
      conditionValue = conditionMatch ? conditionMatch[1] : null;
    }
    return {
      isInAttribute: true,
      elementName,
      conditionValue
    };
  }
  /**
   * Creates a completion source for the configured attribute.
   */
  createCompletionSource() {
    return async (context) => {
      const { state, pos, view } = context;
      if (!view) {
        return null;
      }
      const contextInfo = this.detectContext(view, pos);
      if (contextInfo.elementName !== this.config.elementName || !contextInfo.isInAttribute) {
        return null;
      }
      if (this.config.conditionAttribute) {
        if (contextInfo.conditionValue !== this.config.conditionAttribute.value) {
          return null;
        }
      }
      const textBefore = state.sliceDoc(Math.max(0, pos - 100), pos);
      const attrRegex = new RegExp(`${this.config.attributeName}\\s*=\\s*(["'])([^"']*)$`);
      const match = textBefore.match(attrRegex);
      if (!match) {
        return null;
      }
      const valueContent = match[2];
      const valueStart = pos - valueContent.length;
      const query = valueContent || "";
      const completions = await this.config.callback(query || void 0);
      return {
        from: valueStart,
        to: pos,
        options: completions,
        // Disable CodeMirror's default filtering since we're doing our own filtering server side
        filter: false
      };
    };
  }
}
export {
  XMLAttributeAutocomplete
};
