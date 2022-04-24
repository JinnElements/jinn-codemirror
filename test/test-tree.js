import chai from 'chai';
import chaiXml from "chai-xml";
import {leiden2epiDoc} from "../src/index.js";

chai.use(chaiXml);

function testTransform(name, input, output) {
    input = input.split(/\n\s+/).join('\n');
    it(name, () => {
        const xml = leiden2epiDoc(input);
        chai.expect(xml).xml.to.be.valid();
        chai.expect(xml).xml.to.equal(output);
    });
}

describe('inline', () => {
    testTransform(
        'expands abbreviations',
        `<=
        (T(itus)) (Fl(avius)) Severus
        =>`,
        '<ab><lb/><expan>T<ex>itus</ex></expan> <expan>Fl<ex>avius</ex></expan> Severus</ab>'
    );

    testTransform(
        'expands abbreviation in nested supplied',
        `<=
        (ab<cdef(ghi?)>)
        =>`,
        '<ab><lb/><expan>ab<supplied reason="omitted">cdef<ex cert="low">ghi</ex></supplied></expan></ab>'
    );
    testTransform(
        'expands lines',
        `<=
        1. (T(itus)) (Fl(avius)) Severus
        2. (b(ene))(f(iciarius)) (co(n))(s(ularis))
        =>`,
        '<ab><lb n="1"/><expan>T<ex>itus</ex></expan> <expan>Fl<ex>avius</ex></expan> Severus<lb n="2"/><expan>b<ex>ene</ex></expan><expan>f<ex>iciarius</ex></expan> <expan>co<ex>n</ex></expan><expan>s<ex>ularis</ex></expan></ab>'
    );
    testTransform('handles line wrap',
        `<=
        1. et Successi
        2.- nia Tita pro
        =>`,
        `<ab><lb n="1"/>et Successi<lb n="2" break="no"/>nia Tita pro</ab>`
    );
    testTransform('handles supplied',
        `<=
        1. <ἀπεγραψάμην>
        =>`,
        `<ab><lb n="1"/><supplied reason="omitted">ἀπεγραψάμην</supplied></ab>`
    );
    testTransform('handles uncertain supplied',
        `<=
        1. <οὐκ(?)>
        =>`,
        `<ab><lb n="1"/><supplied reason="omitted" cert="low">οὐκ</supplied></ab>`
    );
    testTransform('handles supplied inline',
        `<=
        1. ἀπ<ε>γραψάμην
        =>`,
        `<ab><lb n="1"/>ἀπ<supplied reason="omitted">ε</supplied>γραψάμην</ab>`
    );
    testTransform('lost',
        `<=
        [.8]ἀπεγραψάμην
        =>`,
        '<ab><lb/><gap reason="lost" quantity="8" unit="character"/>ἀπεγραψάμην</ab>'
    );
    testTransform('gap in expan',
        `<=
        (Α[.2]ωνο(ς))
        =>`,
        '<ab><lb/><expan>Α<gap reason="lost" quantity="2" unit="character"/>ωνο<ex>ς</ex></expan></ab>'
    );
    testTransform('supplied lost',
        `<=
        (ab[cdef(ghi)])
        =>`,
        '<ab><lb/><expan>ab<supplied reason="lost">cdef<ex>ghi</ex></supplied></expan></ab>'
    );
});