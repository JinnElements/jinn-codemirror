import { Completion } from "@codemirror/autocomplete";

/**
 * Type for the callback function that fetches attribute value completions.
 * Should return a Promise that resolves to an array of completion options.
 */
export type AutocompleteCallback = (query?: string) => Promise<Completion[]>;

/**
 * Configuration for attribute value condition (e.g., type="biblio")
 */
export interface AttributeCondition {
    name: string;
    value: string;
}

/**
 * Configuration for XML attribute value autocompletion.
 */
export interface AttributeAutocompleteConfig {
    /** The element name (e.g., "ref") */
    elementName: string;
    /** The attribute name to complete (e.g., "target") */
    attributeName: string;
    /** Optional condition attribute that must match (e.g., { name: "type", value: "biblio" }) */
    conditionAttribute?: AttributeCondition;
    /** Callback function that provides completions */
    callback: AutocompleteCallback;
}

