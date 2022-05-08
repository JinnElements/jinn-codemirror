import { Tree, TreeCursor } from "@lezer/common";
import { parser } from "./parser.js";

export function leiden2epiDoc(input: string) {
    const tree = parser.parse(input);
    return syntax2epiDoc(tree, input);
}

export function syntax2epiDoc(root: Tree, input: string) {
    function text(node:TreeCursor) {
        return input.substring(node.from, node.to);
    }
    const stack:string[] = [];
    const xml:string[] = [];
    let value;
    root.iterate({
        enter: (node:TreeCursor) => {
            if (node.type.isError) {
                xml.push(`<!-- Error:${text(node)} -->`);
                return;
            }
            const name = node.name;
            switch (name) {
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
                case 'Document':
                    break;
                case 'Div':
                    xml.push('<ab>');
                    break;
                case 'Recto':
                    xml.push('<div n="r" type="textpart">');
                    break;
                case 'Verso':
                    xml.push('<div n="r" type="textpart">');
                    break;
                case 'Fragment':
                    node.firstChild();
                    value = /^([0-9]+)\..*$/.exec(text(node));
                    xml.push(`<div n="${value ? value[1] : ''}" subtype="fragment" type="textpart">`);
                    break;
                case 'Part':
                    node.firstChild();
                    value = /^([a-zA-Z0-9]+)\..*$/.exec(text(node));
                    xml.push(`<div n="${value ? value[1] : ''}" subtype="part" type="textpart">`);
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
                default:
                    xml.push(`<${name}>`);
                    break;
            }
        },
        leave: (node) => {
            switch (node.name) {
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
                    xml.push('</div>');
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
    return xml.join('');
}
