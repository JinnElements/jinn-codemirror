import { parser } from "./parser.js";
import {LRLanguage, LanguageSupport} from "@codemirror/language";
import {styleTags, tags as t} from "@lezer/highlight";

export const leidenLanguage = LRLanguage.define({
    parser: parser.configure({
        props: [
            styleTags({
                Number: t.number,
                "LineBreak LineBreakWrapped": t.contentSeparator,
                "Illegible GapUnknown Gap SuppliedLost Supplied Unclear": t.comment,
                "Div Recto Verso Part Fragment": t.keyword,
                "( )": t.paren
            })
        ]
    }),
    languageData: {
        closeBrackets: {brackets: ["(", "[", "{", "<"]}
    }
});

export function leiden() {
    return new LanguageSupport(leidenLanguage);
}