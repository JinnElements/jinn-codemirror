function transformElem(elem: Element, output: string[]) {
    for (let i = 0; i < elem.childNodes.length; i++) {
        transform(elem.childNodes[i], output);
    }
}

function transform(node: Node|null, output: string[]) {
    if (!node) {
        return;
    }
    
    switch (node.nodeType) {
        case Node.DOCUMENT_NODE:
        case Node.DOCUMENT_FRAGMENT_NODE:
            transform((<DocumentFragment>node).firstElementChild, output);
            break;
        case Node.ELEMENT_NODE:
            const elem = <Element>node;
            let n;
            switch (elem.localName) {
                case 'ab':
                    output.push('<=');
                    transformElem(elem, output);
                    output.push('=>');
                    break;
                case 'abbr':
                    transformElem(elem, output);
                    break;
                case 'del':
                    output.push('〚');
                    transformElem(elem, output);
                    output.push('〛');
                    break;
                case 'div':
                    n = elem.getAttribute('n');
                    output.push(`<D=.${n}.column`);
                    transformElem(elem, output);
                    output.push(`=D>`);
                    break;
                case 'expan':
                case 'ex':
                    const cert = elem.getAttribute('cert');
                    output.push('(');
                    transformElem(elem, output);
                    if (cert === 'low') {
                        output.push('?');
                    }
                    output.push(')');
                    break;
                case 'gap':
                    transformGap(elem, output);
                    break;
                case 'lb':
                    n = elem.getAttribute('n');
                    if (output.length > 0 && !/\n+$/.test(output[output.length - 1])) {
                        output.push('\n');
                    }
                    output.push(`${n}. `);
                    break;
                case 'supplied':
                    transformSupplied(elem, output);
                    break;
            }
            break;
        case Node.TEXT_NODE:
            output.push(node.nodeValue || '');
            break;
    }
}

function transformGap(elem: Element, output: string[]) {
    const unit = elem.getAttribute('unit');
    const quantity = elem.getAttribute('quantity');
    const reason = elem.getAttribute('reason');
    if (reason) {
        switch (reason) {
            case 'lost':
                switch (unit) {
                    case 'character':
                        if (quantity) {
                            output.push(`[.${quantity}]`);
                        } else {
                            output.push('[.?]');
                        }
                        break;
                    case 'line':
                        if (quantity) {
                            output.push(`lost.${quantity}lin`);
                        } else {
                            output.push('lost.?lin');
                        }
                        break;
                }
                break;
            case 'illegible':
                switch (unit) {
                    case 'character':
                        if (quantity) {
                            output.push(`.${quantity}`);
                        } else {
                            output.push('.?');
                        }
                        break;
                    case 'line':
                        if (quantity) {
                            output.push(`.${quantity}lin`);
                        }
                        break;
                }
                break;
        }
    }
}

function transformSupplied(elem: Element, output: string[]) {
    const reason = elem.getAttribute('reason');
    if (reason) {
        const cert = elem.getAttribute('cert');
        switch (reason) {
            case 'omitted':
                output.push('<');
                transformElem(elem, output);
                if (cert && cert === 'low') {
                    output.push('(?)');
                }
                output.push('>');
                break;
            case 'lost':
            default:
                output.push('[');
                transformElem(elem, output);
                if (cert && cert === 'low') {
                    output.push('(?)');
                }
                output.push(']');
                break;
        }
    }
}

export function xml2leidenPlus(root: Node): string {
    if (!(root instanceof Element)) {
        return '';
    }
    const output:string[] = [];
    const columnBreaks = root.querySelectorAll('cb');
    if (columnBreaks.length > 0) {
        for (let i = 0; i <= columnBreaks.length; i++) {
            const range = document.createRange();
            if (i === 0) {
                range.setStart(root, 0);
            } else {
                range.setStartAfter(columnBreaks[i - 1]);
            }
            if (i === columnBreaks.length) {
                root.lastChild && range.setEndAfter(root.lastChild);
            } else {
                range.setEndBefore(columnBreaks[i]);
            }
            console.log(range);
            const columnDiv = document.createElement('div');
            columnDiv.setAttribute('type', 'textpart');
            columnDiv.setAttribute('subtype', 'column');
            columnDiv.setAttribute('n', (i + 1).toString());
            range.surroundContents(columnDiv);
            console.log('column: %o', columnDiv);
            transform(columnDiv, output);
        }
    } else {
        transform(root, output);
    }
    return output.join('');
}