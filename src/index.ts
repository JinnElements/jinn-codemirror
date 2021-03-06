import { Tree, TreeCursor } from "@lezer/common";
import { parser } from "./parser/leiden+/parser.js";

const blockElements = ['Recto', 'Verso', 'Fragment', 'Part', 'Div'];
const teiNS = 'xmlns="http://www.tei-c.org/ns/1.0"'

export function leidenPlus2epiDoc(input: string, root: Tree = parser.parse(input)) {
    function text(node:TreeCursor) {
        return input.substring(node.from, node.to);
    }

    const stack:string[] = [];
    const xml:string[] = [];
    let needsWrap = false;
    let needsNS = true;
    let wrapper = 'ab';
    let value;
    root.iterate({
        enter: (node:TreeCursor) => {
            if (node.type.isError) {
                xml.push(`<!-- Error:${text(node)} -->`);
                return;
            }
            const name = node.name;
            switch (name) {
                case 'Document':
                    let count = 0;
                    if (node.firstChild()) {
                        do {
                            count++;
                            if (blockElements.includes(node.type.name)) {
                                wrapper = 'div';
                            }
                            needsWrap = needsWrap || node.type.name === 'Inline';
                        } while (node.nextSibling());
                    }
                    needsWrap = count > 1 || needsWrap;
                    if (needsWrap) {
                        needsNS = false;
                        xml.push(`<${wrapper} ${teiNS}>`);
                    }
                    node.parent();
                    break;
                case 'Text':
                case 'Number':
                    xml.push(text(node));
                    break;
                case 'LineBreak':
                    node.firstChild();
                    value = /^([0-9]+)\..*$/.exec(text(node));
                    xml.push(`<lb n="${value ? value[1] : ''}"/>`);
                    break;
                case 'LineBreakWrapped':
                    node.firstChild();
                    value = /^([0-9]+)\..*$/.exec(text(node));
                    xml.push(`<lb n="${value ? value[1] : ''}" break="no"/>`);
                    break;
                case 'Div':
                    let abStr = "<ab";
                    if (needsNS) {
                        abStr += " " + teiNS;
                        needsNS = false;
                    }
                    abStr += '>';
                    xml.push(abStr)
                    break;
                case 'Recto':
                case 'Verso':
                    let rectoVersoStr = '<div n="r" type="textpart"'
                    if (needsNS) {
                        rectoVersoStr += " " + teiNS;
                        needsNS = false
                    }
                    rectoVersoStr += ">";
                    xml.push(rectoVersoStr)
                    break;
                case 'Fragment':
                    node.firstChild();
                    value = /^([0-9]+)\..*$/.exec(text(node));
                    let fragStr = `<div n="${value ? value[1] : ''}" subtype="fragment" type="textpart"`;                    
                    if (needsNS) {
                        fragStr += " " + teiNS;
                        needsNS = false;
                    }
                    fragStr += ">";
                    xml.push(fragStr)
                    break;
                case 'Part':
                    node.firstChild();
                    value = /^([a-zA-Z0-9]+)\..*$/.exec(text(node));
                    let partStr = `<div n="${value ? value[1] : ''}" subtype="part" type="textpart"`;
                    if (needsNS) {
                        partStr += " " + teiNS;
                        needsNS = false;
                    }
                    partStr += ">";
                    xml.push(partStr)
                    break;
                case 'Column':
                    node.firstChild();
                    value = /^([a-zA-Z0-9]+)\..*$/.exec(text(node));
                    let columnStr = `<div n="${value ? value[1] : ''}" subtype="column" type="textpart"`;
                    if (needsNS) {
                        columnStr += " " + teiNS;
                        needsNS = false;
                    }
                    columnStr += ">";
                    xml.push(columnStr)
                    break;
                case 'Unclear':
                    const content = text(node);
                    let stripped = '';
                    for (let i = 0; i < content.length; i++) {
                        const codepoint = content.codePointAt(i);
                        if (codepoint && codepoint !== 0x0323) {
                            stripped += String.fromCodePoint(codepoint);
                        }
                    }
                    xml.push(`<unclear>${stripped}</unclear>`);
                    return false;
                case 'Gap':
                    node.next(true);
                    xml.push(`<gap reason="lost" quantity="${text(node)}" unit="character"/>`);
                    return false;
                case 'GapUnknown':
                    xml.push(`<gap reason="lost" extent="unknown" unit="character"/>`);
                    return false;
                case 'Illegible':
                    value = /^\.([0-9?]+)(lin)?$/.exec(text(node));
                    if (value) {
                        if (value[2] === 'lin') {
                            xml.push(`<gap reason="illegible" quantity="${value ? value[1]: ''}" unit="line"/>`);
                        } else if (value[1] === '?') {
                            xml.push(`<gap reason="illegible" extent="unkown" unit="character"/>`);
                        } else {
                            xml.push(`<gap reason="illegible" quantity="${value ? value[1]: ''}" unit="character"/>`);
                        }
                    }
                    return false;
                case 'Erasure':
                    xml.push('<del rend="erasure">');
                    break;
                case 'LostLines':
                    value = /^lost\.([0-9?]+)lin$/.exec(text(node));
                    if (value) {
                        if (value[1] === '?') {
                            xml.push(`<gap reason="lost" extent="unknown" unit="line"/>`);
                        } else {
                            xml.push(`<gap reason="lost" quantity="${value ? value[1]: ''}" unit="line"/>`);
                        }
                    }
                    return false;
                case 'Abbrev':
                    if (stack.length > 0) {
                        node.lastChild();
                        value = text(node);
                        if (value.length > 0 && value.charAt(value.length - 1) === '?') {
                            xml.push(`<ex cert="low">`);
                        } else {
                            xml.push(`<ex>`);
                        }
                        node.parent();
                    } else {
                        xml.push('<expan>');
                    }
                    stack.push('expan');
                    break;
                case 'Supplied':
                    node.lastChild();
                    if (node.name === 'CertLow') {
                        xml.push('<supplied reason="omitted" cert="low">');
                    } else {
                        xml.push('<supplied reason="omitted">');
                    }
                    node.parent();
                    break;
                case 'SuppliedLost':
                    node.lastChild();
                    if (node.name === 'CertLow') {
                        xml.push('<supplied reason="lost" cert="low">');
                    } else {
                        xml.push('<supplied reason="lost">');
                    }
                    node.parent();
                    break;
                case 'CertLow':
                    return false;
                case 'QuestionMark':
                    if (stack.length < 2) {
                        xml.push('?');
                    }
                    return false;
                case 'Inline':
                    break;
                default:
                    xml.push(`<${name}>`);
                    break;
            }
        },
        leave: (node) => {
            switch (node.name) {
                case 'Document':
                    if (needsWrap) {
                        xml.push(`</${wrapper}>`);
                    }
                    break;
                case 'Abbrev':
                    if (stack.length > 1) {
                        const last = xml[xml.length - 1];
                        if (last.endsWith('?')) {
                            xml[xml.length - 1] = last.substring(0, last.length - 2);
                        }
                        xml.push('</ex>');
                    } else {
                        xml.push('</expan>');
                    }
                    stack.pop();
                    break;
                case 'Div':
                    xml.push('</ab>');
                    break;
                case 'Recto':
                case 'Verso':
                case 'Fragment':
                case 'Part':
                case 'Column':
                    xml.push('</div>\n');
                    break;
                case 'Supplied':
                case 'SuppliedLost':
                    xml.push('</supplied>');
                    break;
                case 'Erasure':
                    xml.push('</del>');
                    break;
            }
        }
    });
    if (root.type.name === 'Inline') {
        xml.push('</ab>');
    }
    return xml.join('');
}
