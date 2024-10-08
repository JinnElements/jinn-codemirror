function transformElem(elem, output) {
  for (let i = 0; i < elem.childNodes.length; i++) {
    transform(elem.childNodes[i], output);
  }
}
function transform(node, output) {
  if (!node) {
    return;
  }
  switch (node.nodeType) {
    case Node.DOCUMENT_NODE:
    case Node.DOCUMENT_FRAGMENT_NODE:
      transform(node.firstElementChild, output);
      break;
    case Node.ELEMENT_NODE:
      const elem = node;
      let n;
      switch (elem.localName) {
        case "ab":
          output.push("<=");
          transformElem(elem, output);
          output.push("=>");
          break;
        case "abbr":
          output.push("(|");
          transformElem(elem, output);
          output.push("|)");
          break;
        case "del":
          output.push("\u301A");
          transformElem(elem, output);
          output.push("\u301B");
          break;
        case "div":
          n = elem.getAttribute("n");
          const subtype = elem.getAttribute("subtype");
          switch (subtype) {
            case "column":
              output.push(`<D=.${n}.column`);
              break;
            case "part":
              output.push(`<D=.${n}.part`);
              break;
            default:
              output.push(`<D=.${n}`);
              break;
          }
          transformElem(elem, output);
          output.push(`=D>
`);
          break;
        case "expan":
        case "ex":
          const cert = elem.getAttribute("cert");
          output.push("(");
          transformElem(elem, output);
          if (cert === "low") {
            output.push("?");
          }
          output.push(")");
          break;
        case "gap":
          transformGap(elem, output);
          break;
        case "lb":
          n = elem.getAttribute("n");
          if (output.length > 0 && !/\n+$/.test(output[output.length - 1])) {
            output.push("\n");
          }
          const breakAttr = elem.getAttribute("break");
          output.push(`${n}.${breakAttr === "no" ? "- " : " "}`);
          break;
        case "supplied":
          transformSupplied(elem, output);
          break;
        case "unclear":
          const content = elem.textContent || "";
          let contentOut = "";
          for (let i = 0; i < content.length; i++) {
            const codepoint = content.codePointAt(i);
            if (codepoint) {
              contentOut += String.fromCodePoint(codepoint);
              contentOut += String.fromCodePoint(803);
            }
          }
          output.push(contentOut);
          break;
        case "foreign":
          output.push("~|");
          transformElem(elem, output);
          output.push(`|~${elem.getAttribute("xml:lang")}`);
          break;
        default:
          throw new Error(`Cannot transform element ${elem.localName} to Leiden`);
          break;
      }
      break;
    case Node.TEXT_NODE:
      output.push(node.nodeValue || "");
      break;
  }
}
function transformGap(elem, output) {
  const unit = elem.getAttribute("unit");
  const quantity = elem.getAttribute("quantity");
  const reason = elem.getAttribute("reason");
  if (reason) {
    switch (reason) {
      case "lost":
        switch (unit) {
          case "character":
            if (quantity) {
              output.push(`[.${quantity}]`);
            } else {
              output.push("[.?]");
            }
            break;
          case "line":
            if (quantity) {
              output.push(`lost.${quantity}lin`);
            } else {
              output.push("lost.?lin");
            }
            break;
        }
        break;
      case "illegible":
        switch (unit) {
          case "character":
            if (quantity) {
              output.push(`.${quantity}`);
            } else {
              output.push(".?");
            }
            break;
          case "line":
            if (quantity) {
              output.push(`.${quantity}lin`);
            }
            break;
        }
        break;
    }
  }
}
function transformSupplied(elem, output) {
  const reason = elem.getAttribute("reason");
  if (reason) {
    const cert = elem.getAttribute("cert");
    switch (reason) {
      case "omitted":
        output.push("<");
        transformElem(elem, output);
        if (cert && cert === "low") {
          output.push("(?)");
        }
        output.push(">");
        break;
      case "lost":
      default:
        output.push("[");
        transformElem(elem, output);
        if (cert && cert === "low") {
          output.push("(?)");
        }
        output.push("]");
        break;
    }
  }
}
function xml2leidenPlus(root) {
  if (!(root instanceof Element)) {
    return "";
  }
  const output = [];
  let columnBreaks = root.querySelectorAll("cb");
  if (columnBreaks.length > 0) {
    root = root.cloneNode(true);
    columnBreaks = root.querySelectorAll("cb");
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
      const columnDiv = document.createElement("div");
      columnDiv.setAttribute("type", "textpart");
      columnDiv.setAttribute("subtype", "column");
      columnDiv.setAttribute("n", (i + 1).toString());
      const ab = document.createElement("ab");
      columnDiv.appendChild(ab);
      ab.appendChild(range.extractContents());
      transform(columnDiv, output);
    }
  } else {
    transform(root, output);
  }
  return output.join("");
}
export {
  xml2leidenPlus
};
