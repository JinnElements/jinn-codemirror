import { EditorView } from "@codemirror/view";
import { CompletionContext, CompletionSource } from "@codemirror/autocomplete";
import { AttributeAutocompleteConfig } from "./attribute-autocomplete";

/**
 * Reusable class for XML attribute value autocompletion.
 * Can be configured for different element types, attributes, and conditions.
 */
export class XMLAttributeAutocomplete {
    
    private config: AttributeAutocompleteConfig;

    constructor(config: AttributeAutocompleteConfig) {
        this.config = config;
    }

    /**
     * Detects if we're in the configured element and attribute context.
     */
    private detectContext(view: EditorView, pos: number): { 
        isInAttribute: boolean; 
        elementName: string | null; 
        conditionValue: string | null 
    } {
        // Get text around cursor to find the current element tag
        const textBefore = view.state.sliceDoc(Math.max(0, pos - 500), pos);
        
        // Check if we're in the target attribute value (including empty values)
        const attrRegex = new RegExp(`${this.config.attributeName}\\s*=\\s*(["'])([^"']*)$`);
        const attrMatch = textBefore.match(attrRegex);
        if (!attrMatch) {
            return { isInAttribute: false, elementName: null, conditionValue: null };
        }

        // Find the opening tag by looking backwards from before the attribute
        const textUpToAttr = textBefore.substring(0, textBefore.length - attrMatch[0].length);
        
        // Find the most recent opening tag
        const tagStartMatch = textUpToAttr.match(/<(\w+)([^>]*?)$/);
        if (!tagStartMatch) {
            return { isInAttribute: true, elementName: null, conditionValue: null };
        }

        const elementName = tagStartMatch[1];
        const attributesStr = tagStartMatch[2];

        // Parse condition attribute value if configured
        let conditionValue: string | null = null;
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
    createCompletionSource(): CompletionSource {
        return async (context: CompletionContext) => {
            const { state, pos, view } = context;
            
            // View is optional in CompletionContext
            if (!view) {
                return null;
            }

            // Detect if we're in the right context
            const contextInfo = this.detectContext(view, pos);
            
            // Check if we're in the correct element
            if (contextInfo.elementName !== this.config.elementName || !contextInfo.isInAttribute) {
                return null;
            }

            // Check condition attribute if configured
            if (this.config.conditionAttribute) {
                if (contextInfo.conditionValue !== this.config.conditionAttribute.value) {
                    return null;
                }
            }

            // Find the start of the attribute value (after the opening quote)
            const textBefore = state.sliceDoc(Math.max(0, pos - 100), pos);
            const attrRegex = new RegExp(`${this.config.attributeName}\\s*=\\s*(["'])([^"']*)$`);
            const match = textBefore.match(attrRegex);
            if (!match) {
                return null;
            }

            // valueStart is right after the opening quote
            const valueContent = match[2];
            const valueStart = pos - valueContent.length;

            // Use empty string as query if value is empty, otherwise use the content
            const query = valueContent || '';

            // Get completions from callback
            const completions = await this.config.callback(query || undefined);

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

