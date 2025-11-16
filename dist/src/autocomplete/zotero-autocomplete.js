import { XMLAttributeAutocomplete } from "./xml-attribute-autocomplete";
class AttributeAutocompleteProvider {
}
class ZoteroAutocomplete extends AttributeAutocompleteProvider {
  constructor(baseUrl = null) {
    super();
    this.baseUrl = baseUrl;
  }
  createAutocomplete() {
    return new XMLAttributeAutocomplete({
      elementName: "ref",
      attributeName: "target",
      conditionAttribute: { name: "type", value: "biblio" },
      callback: this.createZoteroAutocompleteCallback()
    });
  }
  /**
   * Creates an AutocompleteCallback that fetches completions from the Zotero API.
   * 
   * @param baseUrl - Optional base URL for the API. Defaults to empty string (relative URL).
   * @returns A function that implements AutocompleteCallback
   */
  createZoteroAutocompleteCallback() {
    return async (query) => {
      try {
        let url = `${this.baseUrl || ""}/api/zotero/items/suggest`;
        if (query) {
          url += `?q=${encodeURIComponent(query)}`;
        }
        const response = await fetch(url);
        if (!response.ok) {
          console.error("Failed to fetch Zotero suggestions:", response.status, response.statusText);
          return [];
        }
        const data = await response.json();
        let suggestions = [];
        if (Array.isArray(data)) {
          suggestions = data.map((item) => {
            return {
              displayLabel: item.tag,
              detail: item.title,
              label: `#${item.tag}`,
              type: "text",
              info: () => {
                if (!item.bib) {
                  return null;
                }
                const span = document.createElement("span");
                span.innerHTML = item.bib;
                return span;
              }
            };
          });
        }
        console.log("Zotero suggestions:", suggestions);
        return suggestions;
      } catch (error) {
        console.error("Error fetching Zotero suggestions:", error);
        return [];
      }
    };
  }
}
export {
  AttributeAutocompleteProvider,
  ZoteroAutocomplete
};
