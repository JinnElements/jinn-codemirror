import {parser} from "./parser.js";
import {LRLanguage, LanguageSupport} from "@codemirror/language";

export const leidenLanguage = LRLanguage.define({
    parser,
    languageData: {
        closeBrackets: {brackets: ["(", "[", "{", "<"]}
    }
});

export function leiden() {
    return new LanguageSupport(leidenLanguage);
}