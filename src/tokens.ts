import {ExternalTokenizer} from "@lezer/lr";
import { eof, sof } from "./parser.terms.js";

export const eofToken = new ExternalTokenizer(input => {
    if (input.next < 0) input.acceptToken(eof)
});

export const sofToken = new ExternalTokenizer(input => {
    if (input.pos === 0) input.acceptToken(sof)
});