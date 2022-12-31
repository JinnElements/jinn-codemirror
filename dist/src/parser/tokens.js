import { ExternalTokenizer } from "@lezer/lr";
import { chars as lp_chars, Unclear, lostLinesStart } from "./leiden+/parser.terms.js";
const skipped = "() <>|?=.0123456789[]\u301A\u301B";
const charsToken = new ExternalTokenizer((input) => {
  let str = "";
  for (; ; ) {
    if (input.next < 0) {
      break;
    }
    if (input.next === 46 && str === "lost") {
      input.advance();
      input.acceptToken(lostLinesStart);
      return;
    }
    const ch = String.fromCharCode(input.next);
    if (ch === "~" && String.fromCharCode(input.peek(1)) === "|" || skipped.indexOf(ch) > -1) {
      break;
    }
    const nextChar = input.peek(1);
    if (nextChar === 803) {
      break;
    }
    str += ch;
    input.advance();
  }
  if (str.length > 0) {
    input.acceptToken(lp_chars);
  }
});
const unclearToken = new ExternalTokenizer((input) => {
  let charCount = 0;
  for (; ; ) {
    if (input.next < 0 || skipped.indexOf(String.fromCharCode(input.next)) > -1) {
      break;
    }
    const nextChar = input.peek(1);
    if (nextChar === 803) {
      charCount++;
      input.advance(2);
    } else {
      break;
    }
  }
  if (charCount > 0) {
    input.acceptToken(Unclear);
  }
});
export {
  charsToken,
  unclearToken
};
