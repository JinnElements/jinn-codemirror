import { parser } from "./parser.js";

export function leiden2epiDoc(input) {
    
    const tree = parser.parse(input);
    return syntax2epiDoc(tree, input);
}

export function syntax2epiDoc(tree, input) {
    const xml = iterate(tree, input, false);
    return xml.join('');
}

function iterate(root, input, inExpan) {
    function text(node) {
        return input.substring(node.from, node.to);
    }

    const xml = [];
    let value;
    root.iterate({
        enter: (node) => {
            if (node.type.isError) {
                xml.push(`<!-- Error:${text(node)} -->`);
                return;
            }
            switch (node.name) {
                case 'Text':
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
                        if (codepoint !== 0x0323) {
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
                    value = /^\.([0-9?]+).*$/.exec(text(node));
                    if (value && value[1] === '?') {
                        xml.push(`<gap reason="illegible" extent="unkown" unit="character"/>`);
                    } else {
                        xml.push(`<gap reason="illegible" quantity="${value ? value[1]: ''}" unit="character"/>`);
                    }
                    return false;
                case 'Abbrev':
                    if (inExpan) {
                        node.lastChild();
                        value = text(node);
                        if (value.length > 0 && value.charAt(value.length - 1) === '?') {
                            xml.push(`<ex cert="low">`);
                        } else {
                            xml.push(`<ex>`);
                        }
                        node.parent();
                    } else {
                        inExpan = true;
                        xml.push('<expan>');
                    }
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
                    if (!inExpan) {
                        xml.push('?');
                    }
                    return false;
                default:
                    xml.push(`<${node.name}>`);
                    break;
            }
        },
        leave: (node) => {
            switch (node.name) {
                case 'Abbrev':
                    if (inExpan) {
                        const last = xml[xml.length - 1];
                        if (last.endsWith('?')) {
                            xml[xml.length - 1] = last.substring(0, last.length - 2);
                        }
                        xml.push('</ex>');
                        inExpan = false;
                    } else {
                        xml.push('</expan>');
                    }
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
            }
        }
    });
    return xml;
}
