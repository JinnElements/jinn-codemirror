import { Tree, TreeCursor } from "@lezer/common";
import { parser } from "../parser/leiden+/parser.js";

const blockElements = ['Recto', 'Verso', 'Fragment', 'Part', 'Div'];

function text(input: string, node:TreeCursor) {
    return input.substring(node.from, node.to);
}

export function debugLeidenTree(input: string, root: Tree = parser.parse(input)) {
    root.iterate({
        enter: (node: TreeCursor) => {
            console.log(`> ${node.name}`);
            if (node.name === 'Text') {
                console.log(text(input, node));
            }
        },
        leave: (node) => {
            console.log(`< ${node.name}`);
        }
    })
}

export function leidenPlus2epiDoc(input: string, root: Tree = parser.parse(input)) {
    const stack:string[] = [];
    const xml:string[] = [];
    let needsWrap = false;
    let wrapper = 'ab';
    let value;
    root.iterate({
        enter: (node:TreeCursor) => {
            if (node.type.isError) {
                xml.push(`<!-- Error:${text(input, node)} -->`);
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
                        xml.push(`<${wrapper}>\n`);
                    }
                    node.parent();
                    break;
                case 'Text':
                case 'Number':
                    xml.push(text(input, node));
                    break;
                case 'LineBreak':
                    node.firstChild();
                    value = /^([0-9]+)\..*$/.exec(text(input, node));
                    xml.push(`<lb n="${value ? value[1] : ''}"/>`);
                    break;
                case 'LineBreakWrapped':
                    node.firstChild();
                    value = /^([0-9]+)\..*$/.exec(text(input, node));
                    xml.push(`<lb n="${value ? value[1] : ''}" break="no"/>`);
                    break;
                case 'Div':
                    xml.push("<ab>")
                    break;
                case 'Recto':
                case 'Verso':
                    xml.push('<div n="r" type="textpart">');
                    break;
                case 'Fragment':
                    node.firstChild();
                    value = /^([0-9]+)\..*$/.exec(text(input, node));
                    xml.push(`<div n="${value ? value[1] : ''}" subtype="fragment" type="textpart">`);
                    break;
                case 'Part':
                    node.firstChild();
                    value = /^([a-zA-Z0-9]+)\..*$/.exec(text(input, node));
                    xml.push(`<div n="${value ? value[1] : ''}" subtype="part" type="textpart">`)
                    break;
                case 'Column':
                    node.firstChild();
                    value = /^([a-zA-Z0-9]+)\..*$/.exec(text(input, node));
                    xml.push(`<div n="${value ? value[1] : ''}" subtype="column" type="textpart">`)
                    break;
                case 'Foreign':
                    node.lastChild();
                    value = /^\|\~(.*)$/.exec(text(input, node));
                    xml.push(`<foreign xml:lang="${value ? value[1] : ''}">`);
                    node.parent();
                    break;
                case 'Unclear':
                    const content = text(input, node);
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
                    xml.push(`<gap reason="lost" quantity="${text(input, node)}" unit="character"/>`);
                    return false;
                case 'GapUnknown':
                    xml.push(`<gap reason="lost" extent="unknown" unit="character"/>`);
                    return false;
                case 'Illegible':
                    value = /^\.([0-9?]+)(lin)?$/.exec(text(input, node));
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
                    value = /^lost\.([0-9?]+)lin$/.exec(text(input, node));
                    if (value) {
                        if (value[1] === '?') {
                            xml.push(`<gap reason="lost" extent="unknown" unit="line"/>`);
                        } else {
                            xml.push(`<gap reason="lost" quantity="${value ? value[1]: ''}" unit="line"/>`);
                        }
                    }
                    return false;
                case 'AbbrevUnresolved':
                    xml.push('<abbr>');
                    break;
                case 'Abbrev':
                    if (stack.length > 0) {
                        node.lastChild();
                        value = text(input, node);
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
                case 'ForeignEnd':
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
                        xml.push(`\n</${wrapper}>`);
                    }
                    break;
                case 'AbbrevUnresolved':
                    xml.push('</abbr>');
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
                case 'Foreign':
                    xml.push('</foreign>');
                    break;
            }
        }
    });
    if (root.type.name === 'Inline') {
        xml.push('</ab>');
    }
    return xml.join('');
}
