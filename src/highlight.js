import {styleTags, tags as t} from "@lezer/highlight"

export const leidenHighlighting = styleTags({
  Text: t.content,
  Abbrev: t.definition,
  Gap: t.angleBracket,
  Number: t.number
});