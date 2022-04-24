import { parser } from "./parser.js";

export function leiden2epiDoc(input) {
    const tree = parser.parse(input);

    const xml = [];
    let inExpan = false;
    tree.iterate({
        enter: (node) => {
            if (node.type.isError) {
                xml.push(`<!-- Error:${input.substring(node.from, node.to)} -->`);
                return;
            }
            switch (node.name) {
                case 'Text':
                    xml.push(input.substring(node.from, node.to));
                    break;
                case 'Line':
                    xml.push('<lb/>');
                    break;
                case 'NumberedLine':
                    node.firstChild();
                    xml.push(`<lb n="${input.substring(node.from, node.to)}"/>`);
                    break;
                case 'NumberedWrappedLine':
                    node.firstChild();
                    xml.push(`<lb n="${input.substring(node.from, node.to)}" break="no"/>`);
                    break;
                case 'Document':
                    break;
                case 'Div':
                    xml.push('<ab>');
                    break;
                case 'Recto':
                    xml.push('<div n="r" type="textpart">');
                    break;
                case 'Gap':
                    node.next(true);
                    xml.push(`<gap reason="lost" quantity="${input.substring(node.from, node.to)}" unit="character"/>`);
                    return false;
                case 'Abbrev':
                    if (inExpan) {
                        node.lastChild();
                        if (node && node.name === 'QuestionMark') {
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
                    xml.push('<supplied reason="lost">');
                    break;
                case 'CertLow':
                    return false;
                case 'QuestionMark':
                    if (!inExpan) {
                        xml.push('?');
                    }
                    break;
                default:
                    xml.push(`<${node.name}>`);
                    break;
            }
        },
        leave: (node) => {
            switch (node.name) {
                case 'Abbrev':
                    if (inExpan) {
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
                    xml.push('</div>');
                    break;
                case 'Supplied':
                case 'SuppliedLost':
                    xml.push('</supplied>');
                    break;
            }
        }
    });
    return xml.join('');
}