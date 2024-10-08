import * as chai from 'chai';
import chaiXml from "chai-xml";
import {leidenPlus2epiDoc} from "../dist/src/import/leiden+2xml.js";

chai.use(chaiXml);

function testTransform(name, input, output) {
    input = input.split(/\n\s+/).join('\n');
    it(name, () => {
        const xml = leidenPlus2epiDoc(input);
        chai.expect(xml, xml).xml.to.be.valid();
        chai.expect(xml).xml.to.equal(output);
    });
}

describe('inline', () => {
    testTransform(
        'expands abbreviations',
        `(T(itus)) (Fl(avius)) Severus`,
        '<ab>\n<expan>T<ex>itus</ex></expan> <expan>Fl<ex>avius</ex></expan> Severus\n</ab>'
    );
    testTransform(
        'wraps ab around inline elements',
        `Titus Antonius`,
        '<ab>\nTitus Antonius\n</ab>'
    );
    testTransform(
        'expands abbreviation in nested supplied',
        `<=(ab<cdef(ghi?)>)=>`,
        '<ab><expan>ab<supplied reason="omitted">cdef<ex cert="low">ghi</ex></supplied></expan></ab>'
    );
    testTransform(
        'expands multiple abbreviations',
        `<=([(Ἑπτα)]κ̣ω̣μ̣[(ίας)])=>`,
        '<ab><expan><supplied reason="lost"><ex>Ἑπτα</ex></supplied><unclear>κωμ</unclear><supplied reason="lost"><ex>ίας</ex></supplied></expan></ab>'
    );
    testTransform(
        'expansion of whole word',
        `<=((ἔτους))=>`,
        '<ab><expan><ex>ἔτους</ex></expan></ab>'
    );
    testTransform(
        'expansion of whole word, uncertain',
        `<=((ἔτους?))=>`,
        '<ab><expan><ex cert="low">ἔτους</ex></expan></ab>'
    );
    testTransform(
        'expansion of whole word, unresolved',
        '(|ομυο|)',
        '<ab><abbr>ομυο</abbr></ab>'
    );
    testTransform(
        'expansion of whole word, unresolved, with gap',
        '(|[.8]χυρι̣ο|)',
        '<ab><abbr><gap reason="lost" quantity="8" unit="character"/>χυρ<unclear>ι</unclear>ο</abbr></ab>'
    );
    testTransform(
        'expands lines',
        `<=1. (T(itus)) (Fl(avius)) Severus 2. (b(ene))(f(iciarius)) (co(n))(s(ularis))=>`,
        '<ab><lb n="1"/><expan>T<ex>itus</ex></expan> <expan>Fl<ex>avius</ex></expan> Severus <lb n="2"/><expan>b<ex>ene</ex></expan><expan>f<ex>iciarius</ex></expan> <expan>co<ex>n</ex></expan><expan>s<ex>ularis</ex></expan></ab>'
    );
    testTransform('handles line wrap',
        `<=1. et Successi 2.- nia Tita pro=>`,
        `<ab><lb n="1"/>et Successi <lb n="2" break="no"/>nia Tita pro</ab>`
    );
    testTransform('handles supplied',
        `<=1. <ἀπεγραψάμην>=>`,
        `<ab><lb n="1"/><supplied reason="omitted">ἀπεγραψάμην</supplied></ab>`
    );
    testTransform('handles uncertain supplied',
        `<=1. <οὐκ(?)>=>`,
        `<ab><lb n="1"/><supplied reason="omitted" cert="low">οὐκ</supplied></ab>`
    );
    testTransform('handles supplied inline',
        `<=1. ἀπ<ε>γραψάμην=>`,
        `<ab><lb n="1"/>ἀπ<supplied reason="omitted">ε</supplied>γραψάμην</ab>`
    );
    testTransform('lost characters',
        `<=[.8]ἀπεγραψάμην=>`,
        '<ab><gap reason="lost" quantity="8" unit="character"/>ἀπεγραψάμην</ab>'
    );
    testTransform('lost characters unknown',
        `<=[.?]ἀπεγραψάμην=>`,
        '<ab><gap reason="lost" extent="unknown" unit="character"/>ἀπεγραψάμην</ab>'
    );
    testTransform('lost lines',
        `<=1. ἀπεγραψάμην lost.3lin=>`,
        '<ab><lb n="1"/>ἀπεγραψάμην <gap reason="lost" quantity="3" unit="line"/></ab>'
    );
    testTransform('lost lines unknown',
        `<=1. ἀπεγραψάμην lost.?lin=>`,
        '<ab><lb n="1"/>ἀπεγραψάμην <gap reason="lost" extent="unknown" unit="line"/></ab>'
    );
    testTransform('gap in expan',
        `<=(Α[.2]ωνο(ς))=>`,
        '<ab><expan>Α<gap reason="lost" quantity="2" unit="character"/>ωνο<ex>ς</ex></expan></ab>'
    );
    testTransform('supplied lost',
        `<=(ab[cdef(ghi)])=>`,
        '<ab><expan>ab<supplied reason="lost">cdef<ex>ghi</ex></supplied></expan></ab>'
    );
    testTransform('supplied lost cert low', 
        `<=ἡμετέρ[α μήτηρ (?)] [.?]=>`,
        '<ab>ἡμετέρ<supplied reason="lost" cert="low">α μήτηρ </supplied> <gap reason="lost" extent="unknown" unit="character"/></ab>'
    );
    testTransform('illegible, nested',
        `<=([.?].1λινοκ(αλάμης))=>`,
        '<ab><expan><gap reason="lost" extent="unknown" unit="character"/><gap reason="illegible" quantity="1" unit="character"/>λινοκ<ex>αλάμης</ex></expan></ab>'
    );
    testTransform('illegible lines',
        `<=1. (λινοκ(αλάμης)) .3lin=>`,
        '<ab><lb n="1"/><expan>λινοκ<ex>αλάμης</ex></expan> <gap reason="illegible" quantity="3" unit="line"/></ab>'
    );
    testTransform('illegible lines, extent unknown',
        `<=1. (λινοκ(αλάμης)) .?lin=>`,
        '<ab><lb n="1"/><expan>λινοκ<ex>αλάμης</ex></expan> <gap reason="illegible" quantity="?" unit="line"/></ab>'
    );
    testTransform('unclear',
        `<=ạ=>`,
        '<ab><unclear>a</unclear></ab>'
    );
    testTransform('unclear in word',
        `<=abc̣ḍẹfg=>`,
        '<ab>ab<unclear>cde</unclear>fg</ab>'
    );
    testTransform('unclear with supplied',
        `<=(ἀ[κ ρ̣ό̣δ̣(ρυα)])=>`,
        '<ab><expan>ἀ<supplied reason="lost">κ <unclear>ρόδ</unclear><ex>ρυα</ex></supplied></expan></ab>'
    );
    testTransform('erasure', `<=ab〚c def g〛hi=>`, '<ab>ab<del rend="erasure">c def g</del>hi</ab>');
    testTransform('erasure with expan and gap', `<=〚(Ψε.2λως) 〛=>`, '<ab><del rend="erasure"><expan>Ψε<gap reason="illegible" quantity="2" unit="character"/>λως</expan> </del></ab>');
    testTransform('language switch',
        `<=~|1. Ὑψίστῳ Σερά2.- πιδι σὺν γάστ3.- ρᾳ καὶ μυστα4.- ρίοις|~gr 5. (G(aius)) C(Calp(urnius)) 6. Rufinus (v(ir))=>`,
        '<ab><foreign xml:lang="gr"><lb n="1"/>Ὑψίστῳ Σερά<lb n="2" break="no"/>πιδι σὺν γάστ<lb n="3" break="no"/>ρᾳ καὶ μυστα<lb n="4" break="no"/>ρίοις</foreign> <lb n="5"/><expan>G<ex>aius</ex></expan> C<expan>Calp<ex>urnius</ex></expan> <lb n="6"/>Rufinus <expan>v<ex>ir</ex></expan></ab>'
    );
});