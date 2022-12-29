import { parser as leidenPlusParser } from "./parser/leiden+/parser.js";
import { LRLanguage, LanguageSupport } from "@codemirror/language";
import { styleTags, tags as t } from "@lezer/highlight";
const leidenPlusLanguage = LRLanguage.define({
  parser: leidenPlusParser.configure({
    props: [
      styleTags({
        Number: t.number,
        "LineBreak LineBreakWrapped": t.contentSeparator,
        "Div Recto Verso Part Fragment": t.keyword,
        "Abbrev!": t.integer,
        "( ) [ ]": t.paren,
        "Supplied!": t.comment,
        "SuppliedLost!": t.comment,
        "Unclear!": t.bool
      })
    ]
  }),
  languageData: {
    closeBrackets: { brackets: ["(", "[", "{", "<"] }
  }
});
function leiden() {
  return new LanguageSupport(leidenPlusLanguage);
}
export {
  leiden,
  leidenPlusLanguage
};
