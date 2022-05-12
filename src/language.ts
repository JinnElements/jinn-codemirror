import { parser as leidenPlusParser } from "./parser/leiden+/parser.js";
import { parser as leidenParser } from "./parser/leiden/parser.js";
import {LRLanguage, LanguageSupport} from "@codemirror/language";
import {styleTags, tags as t} from "@lezer/highlight";

export const leidenPlusLanguage = LRLanguage.define({
    parser: leidenPlusParser.configure({
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

export const leidenLanguage = LRLanguage.define({
    parser: leidenParser.configure({
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

export function leiden(mode:string = 'leiden+') {
    return new LanguageSupport(mode === 'leiden' ? leidenLanguage : leidenPlusLanguage);
}