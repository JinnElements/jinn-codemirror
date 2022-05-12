import {ExternalTokenizer} from "@lezer/lr";
import { chars as lp_chars, Unclear, lostLinesStart } from "./leiden+/parser.terms.js";
import { chars, Abbreviation, Expan } from "./leiden/parser.terms.js";

// export const eofToken = new ExternalTokenizer(input => {
//     if (input.next < 0) input.acceptToken(eof)
// });

// export const sofToken = new ExternalTokenizer(input => {
//     if (input.pos === 0) input.acceptToken(sof)
// });

const skipped = '() <>?=.0123456789\[\]〚〛';

export const charsToken = new ExternalTokenizer(input => {
    let str = '';
    for(;;) {
        if (input.next < 0) {
            break;
        }
        if (input.next === 46 && str === 'lost') {
            input.advance();
            input.acceptToken(lostLinesStart);
            return;
        }
        const ch = String.fromCharCode(input.next);
        if (skipped.indexOf(ch) > -1) {
            break;
        }
        const nextChar = input.peek(1);
        if (nextChar === 0x0323) {
            break;
        }
        str += ch;
        input.advance();
    }
    if (str.length > 0) {
        input.acceptToken(lp_chars);
    }
});

export const unclearToken = new ExternalTokenizer(input => {
    let charCount = 0;
    for(;;) {
        if (input.next < 0 || skipped.indexOf(String.fromCharCode(input.next)) > -1) {
            break;
        }
        const nextChar = input.peek(1);
        if (nextChar === 0x0323) {
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

export const leidenCharsOrAbbreviation = new ExternalTokenizer(input => {
    let str = '';
    for(;;) {
        if (input.next < 0) {
            break;
        }
        str += String.fromCharCode(input.next);
        if (!/\S+/.test(str)) {
            break;
        }
        // check for '('
        if (input.peek(1) === 40) {
            input.acceptToken(Abbreviation);
            break;
        }
        input.advance();
    }
    console.log('chars: %s', str);
    if (str.length > 0) {
        input.acceptToken(chars);
    }
});

export const leidenExpan = new ExternalTokenizer(input => {
    if (input.next === 40) {
        let next;
        while ((next = input.advance()) > -1) {
            if (next === 41) {
                input.acceptToken(Expan);
                return;
            }
        }
    }
});