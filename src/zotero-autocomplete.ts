import { Completion } from "@codemirror/autocomplete";
import { AutocompleteCallback } from "./attribute-autocomplete";
import { XMLAttributeAutocomplete } from "./xml-attribute-autocomplete";

/**
 * Abstract base class for creating XML attribute autocomplete instances.
 * Subclasses should implement the createAutocomplete method to provide
 * specific autocomplete configurations.
 */
export abstract class AttributeAutocompleteProvider {
    /**
     * Creates an XMLAttributeAutocomplete instance with the specific configuration.
     * 
     * @returns An XMLAttributeAutocomplete instance
     */
    abstract createAutocomplete(): XMLAttributeAutocomplete;
}

/**
 * Zotero-specific implementation of AttributeAutocompleteProvider.
 * Creates autocomplete for <ref type="biblio"> target attribute using Zotero API.
 */
export class ZoteroAutocomplete extends AttributeAutocompleteProvider {
    
    private baseUrl: string | null;
    
    constructor(baseUrl: string | null = null) {
        super();
        this.baseUrl = baseUrl;
    }

    createAutocomplete(): XMLAttributeAutocomplete {
        return new XMLAttributeAutocomplete({
            elementName: 'ref',
            attributeName: 'target',
            conditionAttribute: { name: 'type', value: 'biblio' },
            callback: this.createZoteroAutocompleteCallback()
        });
    }

    /**
     * Creates an AutocompleteCallback that fetches completions from the Zotero API.
     * 
     * @param baseUrl - Optional base URL for the API. Defaults to empty string (relative URL).
     * @returns A function that implements AutocompleteCallback
     */
    private createZoteroAutocompleteCallback(): AutocompleteCallback {
        return async (query?: string): Promise<Completion[]> => {
            try {
                // Build the URL with query parameter if provided
                let url = `${this.baseUrl || ''}/api/zotero/items/suggest`;
                if (query) {
                    url += `?q=${encodeURIComponent(query)}`;
                }

                const response = await fetch(url);

                if (!response.ok) {
                    console.error('Failed to fetch Zotero suggestions:', response.status, response.statusText);
                    return [];
                }

                const data = await response.json();
                let suggestions: Completion[] = [];
                // Convert the API response to Completion[] format
                if (Array.isArray(data)) {
                    suggestions = data.map((item: any) => {
                        return {
                            displayLabel: item.tag,
                            detail: item.title,
                            label: `#${item.tag}`,
                            type: 'text',
                            info: () => {
                                if (!item.bib) {
                                    return null;
                                }
                                const span = document.createElement('span');
                                span.innerHTML = item.bib;
                                return span;
                            }
                        };
                    });
                }
                console.log('Zotero suggestions:', suggestions);
                return suggestions;
            } catch (error) {
                console.error('Error fetching Zotero suggestions:', error);
                return [];
            }
        };
    }
}