import { SourceType } from "../config";
function pointedCharacters2Epidoc(text) {
  return text;
}
;
function ancientText2XML(text, importSource) {
  const textImportMode = "newText";
  const startingLineNumber = 1;
  text = text.toString().replace(/\t+/g, "");
  text = text.replace(/\r/g, "");
  if (text.toString().length - text.toString().lastIndexOf(" ") == 1) {
    text = text.toString().substring(0, text.toString().lastIndexOf(" "));
  }
  if (textImportMode === "newText") {
    text = '<lb n="' + startingLineNumber.toString() + '"/>' + text;
    const regexLine = /(\-|-?|\=?)\s?\n/g;
    let index = startingLineNumber - 1;
    text = text.replace(regexLine, function(match, selection) {
      if (selection === "-" || selection === "=") {
        return '\n<lb n="' + (index++ + 2) + '" break="no"/>';
      } else {
        return '\n<lb n="' + (index++ + 2) + '"/>';
      }
    });
    text = text.replace(/(\<lb n=\"[0-9]*\"\/\>)\[(\s?—\s?){3,50}\]\n(\<lb n=\"[0-9]*\"\/\>)/g, '$1<gap reason="illegible" quantity="1" unit="line"/>\n$3');
    if (importSource == SourceType.edcs) {
      index = 0;
      text = text.replace(/(\s)?(\/\/)(?!\>)(\s)?/g, function(match) {
        if (match[0] === "/") {
          var breakNo = ' break="no"';
        } else {
          var breakNo = "";
        }
        ;
        return '\n<cb n="' + (index++ + 2) + '"' + breakNo + "/>";
      });
      const regexLine2 = /(\s)?(\/{1})(?!\>)(\s)?/g;
      index = 0;
      text = text.replace(regexLine2, function(match) {
        if (match[0] === "/") {
          var breakNo = ' break="no"';
        } else {
          var breakNo = "";
        }
        ;
        console.log("BreakNo = " + breakNo);
        console.log("Match 0= " + match[0]);
        return '\n<lb n="' + (index++ + 2) + '"' + breakNo + "/>";
      });
    }
    ;
    if (importSource == SourceType.phi) {
      text = text.replace(/#⁷/g, '<gap reason="illegible" quantity="1" unit="character"/>');
      text = text.replace(/#⁷#⁷#⁷/g, '<gap reason="illegible" quantity="3" unit="character"/>');
      text = text.replace(/#⁵⁶/g, '<g type="interpunct">\u25B4</g>');
    }
    ;
    const regexLines5 = /\n<lb n=\'([0-9])\'\/>\1\s/g;
    const substLines5 = '\n<lb n="$1"/>';
    text = text.replace(regexLines5, substLines5);
    const regexLineClean = /(\"[0-9]{1,3}\"\/>)([0-9]{1,3})/g;
    const substLineClean = "$1";
    text = text.replace(regexLineClean, substLineClean);
  }
  ;
  const regexCorrection = /\<([^\x00-\x7F]*[aA-zZ]*)(?!\=)(?!\/)\>/g;
  const substCorrection = '<supplied reason="omitted">$1</supplied>';
  text = text.replace(regexCorrection, substCorrection);
  const regexCorrectionOther = /⟨([^\x00-\x7F]*[aA-zZ]*)(?!\=)(?!\/)⟩/g;
  const substCorrectionOther = '<supplied reason="omitted">$1</supplied>';
  text = text.replace(regexCorrectionOther, substCorrectionOther);
  if (importSource == SourceType.edcs) {
    const regexCorrection2EDCS = /\<([^\x00-\x7F]*[aA-zZ]*)(\=)([^\x00-\x7F]*[aA-zZ]*)(?!\/)\>/g;
    const substCorrection2EDCS = "<choice><corr>$1</corr><sic>$3</sic></choice>";
    text = text.replace(regexCorrection2EDCS, substCorrection2EDCS);
    text = text.replace(
      /\[6\]/g,
      '<gap reason="lost" quantity="1" unit="line"/>'
    );
    text = text.replace(
      /\[3\]/g,
      '<gap reason="lost" extent="unknown" unit="character"/>'
    );
    text = text.replace(
      /\[3\s([^\x00-\x7F]*[aA-zZ]*)\]/g,
      '<gap reason="lost" extent="unknown" unit="character"/><supplied reason="lost">$1</supplied>'
    );
    text = text.replace(
      /\[3\s/g,
      '<gap reason="lost" extent="unknown" unit="character"/><supplied reason="lost">'
    );
    text = text.replace(
      /\s3\s/g,
      " - - - "
    );
    text = text.replace(
      /\s3\]/g,
      " - - -]"
    );
    text = text.replace(/a\(\)/g, "<abbr>a</abbr>");
  }
  ;
  text = text.replace(/\(\!\)/g, "<note>!</note>");
  text = text.replace(/\(sic\)/g, "<note>sic</note>");
  let regex = /\[(\–|\-)\s?(\–|\-)\s?(\–|\-)\]/g;
  text = text.replace(regex, function(match, selection) {
    return '<gap reason="lost" extent="unknown" unit="character"/>';
  });
  regex = /\[(?:(?:\s?\.\s?){1,99})([1-9][0-9]*)(?:(?:\s?\.\s?){1,99})\]/g;
  text = text.replace(regex, function(match, selection) {
    return '<gap reason="lost" quantity="' + selection + '" unit="character"/>';
  });
  regex = /\[(?:(?:\s?\.\s?){1,99})([1-9][0-9]*)(?:(?:\s?\.\s?){1,99})\s/g;
  text = text.replace(regex, function(match, selection) {
    const length = match.length - 2;
    return '<gap reason="lost" quantity="' + selection + '" unit="character"/><supplied reason="lost">';
  });
  regex = /\s(?:(?:\s?\.\s?){1,99})([1-9][0-9]*)(?:(?:\s?\.\s?){1,99})\]/g;
  text = text.replace(regex, function(match, selection) {
    const length = match.length - 2;
    return '</supplied><gap reason="lost" quantity="' + selection + '" unit="character"/>';
  });
  regex = /\s(?:(?:\s?\.\s?){1,99})([1-9][0-9]*)(?:(?:\s?\.\s?){1,99})\s/g;
  text = text.replace(regex, function(match, selection) {
    const length = match.length - 2;
    return '</supplied><gap reason="lost" quantity="' + selection + '" unit="character"/><supplied reason="lost">';
  });
  regex = /\[((\.){1,99})\]/g;
  text = text.replace(regex, function(match, selection) {
    const length = match.length - 2;
    return '<gap reason="lost" quantity="' + length + '" unit="character"/>';
  });
  regex = /\[((\.){1,99})\s/g;
  text = text.replace(regex, function(match, selection) {
    const length = match.length - 2;
    return '<gap reason="lost" quantity="' + length + '" unit="character"/><supplied reason="lost">';
  });
  regex = /\s((\.){1,99})\]/g;
  text = text.replace(regex, function(match, selection) {
    const length = match.length - 2;
    return '</supplied><gap reason="lost" quantity="' + length + '" unit="character"/>';
  });
  regex = /\s((\.){1,99})\s/g;
  text = text.replace(regex, function(match, selection) {
    const length = match.length - 2;
    return '</supplied><gap reason="lost" quantity="' + length + '" unit="character"/><supplied reason="lost">';
  });
  text = text.replace(
    /\[(-|–|\.\s?){1,20}ca\.(\s?)([1-9][0-9]*)((-)([1-9][0-9]*))(\s?)(-|–|\.\s?){1,20}\]/g,
    '<gap reason="lost" atLeast="$3" atMost="$6" unit="character"/>'
  );
  text = text.replace(
    /\[(-|–|\.\s?){1,20}ca\.(\s?)([1-9][0-9]*)(\s?)(-|–|\.\s?){1,20}\]/g,
    '<gap reason="lost" quantity="$3" unit="character" precision="low"/>'
  );
  text = text.replace(
    /\[(?:[\.․]){1,20}c(?:a?)\.(?:\s?)([1-9][0-9]*)(?:(?:-)([1-9][0-9]*))(?:\s?)(?:[\.․]){1,20}(?:\s?)\]/g,
    '<gap reason="lost" atLeast="$1" atMost="$2" unit="character"/>'
  );
  text = text.replace(
    /\[(?:[\.․]){1,20}c(?:a?)\.(?:\s?)([1-9][0-9]*)(?:\s?)(?:[\.․]){1,20}(?:\s?)\]/g,
    '<gap reason="lost" quantity="$1" unit="character" precision="low"/>'
  );
  text = text.replace(
    /\[(?:[\.․]){1,20}c(?:a?)\.(?:\s?)([1-9][0-9]*)(?:(?:-)([1-9][0-9]*))(?:\s?)(?:[\.․]){1,20}(?:\s)/g,
    '<gap reason="lost" atLeast="$1" atMost="$2" unit="character"/><supplied reason="lost">'
  );
  text = text.replace(
    /\[(?:[\.․]){1,20}c(?:a?)\.(?:\s?)([1-9][0-9]*)(?:\s?)(?:[\.․]){1,20}(?:\s)/g,
    '<gap reason="lost" quantity="$1" unit="character" precision="low"/><supplied reason="lost">'
  );
  text = text.replace(
    /\s(?:[\.․]){1,20}c(?:a?)\.(?:\s?)([1-9][0-9]*)(?:(?:-)([1-9][0-9]*))(?:\s?)(?:[\.․]){1,20}(?:\s?)\]/g,
    '</supplied><gap reason="lost" atLeast="$1" atMost="$2" unit="character"/>'
  );
  text = text.replace(
    /\s(?:[\.․]){1,20}c(?:a?)\.(?:\s?)([1-9][0-9]*)(?:\s?)(?:[\.․]){1,20}(?:\s?)\]/g,
    '</supplied><gap reason="lost" quantity="$1" unit="character" precision="low"/>'
  );
  text = text.replace(
    /\s(?:[\.․]){2,20}c(?:a?)\.(?:\s?)([1-9][0-9]*)(?:(?:-)([1-9][0-9]*))(?:\s?)(?:[\.․]){1,20}(?:\s)/g,
    '</supplied><gap reason="lost" atLeast="$1" atMost="$2" unit="character"/><supplied reason="lost">'
  );
  text = text.replace(
    /\s(?:[\.․]){2,20}c(?:a?)\.(?:\s?)([1-9][0-9]*)(?:\s?)(?:[\.․]){1,20}(?:\s)/g,
    '</supplied><gap reason="lost" quantity="$1" unit="character" precision="low"/><supplied reason="lost">'
  );
  text = text.replace(
    /(?:\s|\n)\(([^\x00-\x7F]*[aA-zZ]*)\)/g,
    " <expan><ex>$1</ex></expan>"
  );
  text = text.replace(/\[{2}/g, "\u27E6");
  text = text.replace(/\]{2}/g, "\u27E7");
  text = text.replace(
    /\[([^\x00-\x7F]*[aA-zZ]*[^\]])\]([^\x00-\x7F]*[aA-zZ]*[^\]])\(([^\x00-\x7F]*?[aA-zZ]*?)\)/g,
    '<expan><abbr><supplied reason="lost">$1</supplied>$2</abbr><ex>$3</ex></expan>'
  );
  text = text.replace(
    /(〚|⟦|\[\[)([^\x00-\x7F]*[aA-zZ]*[^\]])(〛|⟧|]])([^\x00-\x7F]*[aA-zZ]*[^\]])\(([^\x00-\x7F]*?[aA-zZ]*?)\)/g,
    '<expan><abbr><supplied reason="lost">$1</supplied>$2</abbr><ex>$3</ex></expan>'
  );
  text = text.replace(
    /\[(\w*?\s?)(?:(?:(?:\-|\–|\—)\s?){1,20})(\w*?)\](?![^\x00-\x7F]*?[aA-zZ]*?\()/g,
    '<supplied reason="lost">$1</supplied><gap reason="lost" extent="unknown" unit="character"/><supplied reason="lost">$2</supplied>'
  );
  text = text.replace(/<supplied reason=\"lost\"><\/supplied>/g, "");
  text = text.replace(
    /(?:⟦|〚)(.*?\s?)(?:(?:(?:\-|\–|\—)\s?){1,20})(.*?)(?:⟧|〛)(?![^\x00-\x7F]*?[aA-zZ]*?\()/g,
    '<del rend="erasure">$1</del><gap reason="lost" extent="unknown" unit="character"/><del rend="erasure">$2</del>'
  );
  text = text.replace(/(?:\s)\[(.*?)\](?:\n)/g, ' <supplied reason="lost">$1</supplied>\n');
  text = text.replace(/(?:\s)\[(.*)\](?:\s)/g, ' <supplied reason="lost">$1</supplied> ');
  text = text.replace(/(?:\s)(?:⟦|〚)(.*?)(?:⟧|〛)(?:\n)/g, ' <del rend="erasure">$1</del>\n');
  text = text.replace(/(?:\s)(?:⟦|〚)(.*?)(?:⟧|〛)(?:\s)/g, ' <del256 rend="erasure">$1</del> ');
  regex = /([^\x00-\x7F]*[aA-zZ]*)\[([^\x00-\x7F]*[aA-zZ]*)\(([^\x00-\x7F]*[aA-zZ]*)\)(\])/g;
  let subst = '<expan><abbr>$1<supplied reason="lost">$2</supplied></abbr><ex>$3</ex></expan>';
  text = text.replace(regex, subst);
  regex = /([^\x00-\x7F]*[aA-zZ]*)(?:⟦|〚)([^\x00-\x7F]*[aA-zZ]*)\(([^\x00-\x7F]*[aA-zZ]*)\)(?:⟧|〛)/g;
  subst = '<expan><abbr>$1<del rend="erasure">$2</del></abbr><ex>$3</ex></expan>';
  text = text.replace(regex, subst);
  text = text.replace(
    /([^\x00-\x7F]*?[aA-zZ]*?[^>])?\[([^\x00-\x7F]*?[aA-zZ]*?)\(([^\x00-\x7F]*?[aA-zZ]*?)\)(.*?[^\-\–\—])\](?![^\x00-\x7F]*?[aA-zZ]*\()/g,
    '<expan><abbr>$1<supplied reason="lost">$2</supplied></abbr><ex>$3</ex></expan> <supplied reason="lost">$4</supplied>'
  );
  text = text.replace(
    /([^\x00-\x7F]*?[aA-zZ]*?[^\s][^>])?(?:\s?)(?:⟦|〚)([^\x00-\x7F]*?[aA-zZ]*?)\(([^\x00-\x7F]*?[aA-zZ]*?)\)(.*?[^\-\–\—])(?:⟧|〛)(?![^\x00-\x7F]*?[aA-zZ]*\()/g,
    '<expan><abbr>$1<del rend="erasure">$2</del></abbr><ex>$3</ex></expan> <del rend="erasure">$4</del>'
  );
  text = text.replace(
    /([^\x00-\x7F]*?[aA-zZ]+)\[([^\x00-\x7F]*?[aA-zZ]*?)\(([^\x00-\x7F]*?[aA-zZ]*?)\)(.*?[^\-\–\—])([^\x00-\x7F]*?[aA-zZ]*?)\](?:([^\x00-\x7F]*?[aA-zZ]*?)\(([^\x00-\x7F]*?[aA-zZ]*?)\))/g,
    '<expan><abbr>$1<supplied reason="lost">$2</supplied></abbr><ex>$3</ex></expan> <supplied reason="lost">$4</supplied><expan><abbr><supplied reason="lost">$5</supplied>$6</abbr><ex>$7</ex></expan>'
  );
  text = text.replace(
    /([^\x00-\x7F]*?[aA-zZ]*?)(?:⟦|〚)([^\x00-\x7F]*?[aA-zZ]*?)\(([^\x00-\x7F]*?[aA-zZ]*?)\)(.*?[^\-\–\—])([^\x00-\x7F]*?[aA-zZ]*?)(?:⟧|〛)(?:([^\x00-\x7F]*?[aA-zZ]*?)\(([^\x00-\x7F]*?[aA-zZ]*?)\))/g,
    '<expan><abbr>$1<del rend="erasure">$2</del></abbr><ex>$3</ex></expan> <del rend="erasure">$4</del><expan><abbr><del rend="erasure">$5</del>$6</abbr><ex>$7</ex></expan>'
  );
  text = text.replace(
    /<supplied reason="lost"> (?:[\.․]){1,20}c(?:a?)\.(?:\s?)([1-9][0-9]*)(?:(?:-)([1-9][0-9]*))(?:\s?)(?:[\.․]){1,20} <\/supplied>/g,
    '<gap reason="lost" atLeast="$1" atMost="$2" unit="character"/>'
  );
  text = text.replace(
    /<supplied reason=\"lost\">(<gap reason=\"lost\" atLeast=\"[0-9]*\" atMost=\"[0-9]\" unit="character"\/>)<\/supplied>/g,
    "$1"
  );
  text = text.replace(/\[(.[^\[\-\–\—]*)\](?![^\x00-\x7F]*[aA-zZ]*\()/g, '<supplied reason="lost">$1</supplied>');
  text = text.replace(/(?:⟦|〚)(.[^\[]*)\](?![^\x00-\x7F]*[aA-zZ]*\()/g, '<del rend="erasure">$1</supplied>');
  text = text.replace(
    /(?:\s)\[((.[^\.<])*)\s/g,
    ' <supplied reason="lost"><expan><abbr>$1</abbr><ex>$2</ex></expan></supplied>'
  );
  text = text.replace(
    /(?!([^\x00-\x7F]*[aA-zZ]*))(\s)([^\x00-\x7F]*[aA-zZ]*)\(([^\x00-\x7F]*[aA-zZ]*)\)\]/g,
    '$1<supplied reason="lost"><expan><abbr>$2</abbr><ex>$3</ex></expan></supplied>'
  );
  text = text.replace(
    /(\s)([^\x00-\x7F]*?[aA-zZ]*?)\]([^\x00-\x7F]*?[aA-zZ]*?)\(([^\x00-\x7F]*[aA-zZ]*)\)/g,
    '$1</supplied><expan><abbr><supplied reason="lost">$2</supplied>$3</abbr><ex>$4</ex></expan>'
  );
  text = text.replace(
    /(\s)([^\x00-\x7F]+[aA-zZ]+)\[([^\x00-\x7F]*[aA-zZ]*)\(([^\x00-\x7F]*[aA-zZ]*)\)/g,
    ' <expan><abbr>$2<supplied reason="lost">$3</supplied></abbr><ex>$4</ex></expan> <supplied reason="lost">'
  );
  text = text.replace(
    /\[([^\x00-\x7F]*[aA-zZ]*)\(\?\)((\s?(\-|\–|\—)\s?){1,20})\]/g,
    '<supplied reason="lost" cert="low">$1</supplied><gap reason="lost" extent="unknown" unit="character"/>'
  );
  text = text.replace(
    /\[([^\x00-\x7F]*[aA-zZ]*)((\s?(\-|\–|\—)\s?){1,20})\]/g,
    '<supplied reason="lost">$1</supplied><gap reason="lost" extent="unknown" unit="character"/>'
  );
  regex = /([^\x00-\x7F]*[aA-zZ]*)\[([^\x00-\x7F]*[aA-zZ]*)\(([^\x00-\x7F]*[aA-zZ]*)\)(\s)?([^\x00-\x7F]*[aA-zZ]*)?(\s)?(\])/g;
  subst = '<expan><abbr>$1<supplied reason="lost">$2</supplied></abbr><ex>$3</ex></expan><supplied reason="lost">$4$5</supplied>';
  text = text.replace(regex, subst);
  regex = /(〚|⟦|\[\[)([^\x00-\x7F]*[aA-zZ]*)\(([^\x00-\x7F]*[aA-zZ]*)\)([^\x00-\x7F]*[aA-zZ]*)?(〛|⟧|]])/g;
  subst = '<del rend="erasure"><expan><abbr>$2</abbr><ex>$3</ex></expan>$4</del>';
  text = text.replace(regex, subst);
  regex = /\[([^\x00-\x7F]*[aA-zZ]*)\(([^\x00-\x7F]*[aA-zZ]*)\)(])/g;
  subst = '<supplied reason="lost"><expan><abbr>$1</abbr><ex>$2</ex></expan></supplied>';
  text = text.replace(regex, subst);
  regex = /([^\x00-\x7F]*[aA-zZ]*)\(([^\x00-\x7F]*[aA-zZ]*)\?\)/g;
  const substAbbrevInLac = '<expan><abbr>$1</abbr><ex cert="low">$2</ex></expan>';
  text = text.replace(regex, substAbbrevInLac);
  regex = /([^\x00-\x7F]*[aA-zZ]*)\(([^\x00-\x7F]*[aA-zZ]*)\)([^\x00-\x7F]*[aA-zZ]*)*\(([^\x00-\x7F]*[aA-zZ]*)\)/g;
  subst = "<expan><abbr>$1</abbr><ex>$2</ex><abbr>$3</abbr><ex>$4</ex></expan>";
  text = text.replace(regex, subst);
  regex = /([^\x00-\x7F]*[aA-zZ]*)\(([^\x00-\x7F]*[aA-zZ]*)\)([^\x00-\x7F]*[aA-zZ]*)*/g;
  subst = "<expan><abbr>$1</abbr><ex>$2</ex>$3</expan>";
  text = text.replace(regex, subst);
  text = text.replace("</expan><expan><abbr>", "<abbr>");
  text = text.replace("\n[------]", '<gap unit="line" />');
  text = text.replace(/(-){6}/g, '<gap unit="line" />');
  text = text.replace(/\[(—\s?)*\]/g, '<gap reason="lost" extent="unknown" unit="character"/>');
  text = text.replace(/\[---\]/g, '<gap reason="lost" extent="unknown" unit="character"/>');
  text = text.replace(/\[— — —ca\.([1-9][0-9]*)((-)([1-9][0-9]*))?— — —\]/g, '<gap reason="lost" quantity="$1" unit="character" precision="low"/>');
  text = text.replace(/\[— — — —ca\.([1-9][0-9]*)((-)([1-9][0-9]*))?— — — —\]/g, '<gap reason="lost" quantity="$1" unit="character" precision="low"/>');
  text = text.replace(/\[(-|–\s?){1,20}ca\.(\s?)([1-9][0-9]*)?(\s?)(-|–\s?){1,20}\]/g, '<gap reason="lost" quantity="$3" unit="character" precision="low"/>');
  text = text.replace(/\------\?/g, '<gap reason="lost" extent="unknown" unit="line"><certainty match=".." locus="name"/></gap>');
  text = text.replace(/\[\------\?\]/g, '<gap reason="lost" extent="unknown" unit="line"><certainty match=".." locus="name"/></gap>');
  text = text.replace(/\[\---\?\]/g, '<gap reason="lost" extent="unknown" unit="line"><certainty match=".." locus="name"/></gap>');
  text = text.replace(/\[(-|–|\—\s?){1,20}([^\x00-\x7F]*[aA-zZ]*)\]/g, '<gap reason="lost" extent="unknown" unit="character"/>');
  text = text.replace(/\[(-|–|\—\s?){1,20}([^\x00-\x7F]*[aA-zZ]*)\]/g, '<gap reason="lost" extent="unknown" unit="character"/><supplied reason="lost">$2</supplied>');
  text = text.replace(/(?:⟦|〚)(-|–|\—\s?){1,20}([^\x00-\x7F]*[aA-zZ]*)(?:⟧|〛)/g, '<gap reason="lost" extent="unknown" unit="character"/><del rend="erasure">$2</supplied>');
  text = text.replace(
    /*                                /\[(?!(\u2013|\u2014))([^\x00-\x7F]*[aA-zZ]*)((\s?)(\u2013|\u2014)\s?){1,20}\]/g,*/
    /*                                /\[(?!([\-\–\—]))([^\x00-\x7F]*[aA-zZ]*)((\s?)([\-\—\–])\s?){1,20}\]/g,                            //==>before 31/03/2020 and attempt to match [wor word - - -]*/
    /\[(?!([\-\–\—]))(((?!([\-\–\—\[\]]))[^\x00-\x7F]*[aA-zZ]*(\s?)){1,10})(([\-\—\–])\s?){1,20}\]/g,
    '<supplied reason="lost">$2</supplied><gap reason="lost" extent="unknown" unit="character"/>'
  );
  text = text.replace(
    /(([\-\—\–])\s?){1,20}\]/g,
    '<gap reason="lost" extent="unknown" unit="character"/>'
  );
  text = text.replace(/<expan><abbr>\[/g, '<supplied reason="lost"><expan><abbr>');
  text = text.replace(/<\/expan> <\/supplied></g, "</expan></supplied> <");
  text = text.replace(
    /<supplied reason=\"lost\"><expan><abbr>([^\x00-\x7F]*?[aA-zZ]*?)\]/g,
    '<expan><abbr><supplied reason="lost">$1</supplied>'
  );
  text = text.replace(/<expan><abbr><\/abbr><ex>/g, "<expan><ex>");
  const regexSuppliedClean = /\[/g;
  const substSuppliedClean = '<supplied reason="lost">';
  text = text.replace(regexSuppliedClean, substSuppliedClean);
  const regexSuppliedCleanClose = /\]/g;
  const substSuppliedCleanClose = "</supplied>";
  text = text.replace(regexSuppliedCleanClose, substSuppliedCleanClose);
  text = text.replace(/<\/ex><\/supplied><\/expan>/g, "</ex></expan></supplied>");
  text = text.replace(
    /((\s?(\-|\—|\–)\s?){1,20})<\/supplied>/g,
    '</supplied><gap reason="lost" extent="unknown" unit="character"/>'
  );
  text = text.replace(
    /((\s?(\-|\—|\–)\s?){1,20})<\/supplied>/g,
    '</supplied><gap reason="lost" extent="unknown" unit="character"/>'
  );
  text = text.replace(
    /<supplied reason=\"lost\">((\s?(\-|\—|\–)\s?){1,20})/g,
    '<gap reason="lost" extent="unknown" unit="character"/><supplied reason="lost">'
  );
  text = text.replace(
    /<supplied reason=\"lost\"><\/supplied><gap reason=\"lost\" extent=\"unknown\" unit=\"character\"\/><supplied reason=\"lost\"><\/supplied>/g,
    '</supplied><gap reason="lost" extent="unknown" unit="character"/><supplied reason="lost">'
  );
  text = text.replace(/<supplied reason=\"lost\"> <\/supplied>/g, "");
  text = text.replace(/<del rend=\"erasure\">\s?<\/del>/g, "");
  text = text.replace(/<\/supplied>\s?<\/supplied>/g, "</supplied>");
  text = text.replace(/\/><\/supplied><gap/g, "/><gap");
  text = text.replace(
    /\[(?!([\-\–\—]))((?:\s?(?:(?!(?:[\-\–\—\[\]]))[^\x00-\x7F]*[aA-zZ](?!\s)*)){1,10})(?:(?:\s?[\-\—\–])\s?){1,20}((?:(?!([\-\–\—\[\]]))[^\x00-\x7F]*[aA-zZ]*))\]/g,
    '<supplied reason="lost">$2</supplied><gap reason="lost" extent="unknown" unit="character"/><supplied reason="lost">$3</supplied>'
  );
  text = text.replace(
    /(\s?([\-\—\–])\s?){1,20}/g,
    '</supplied><gap reason="lost" extent="unknown" unit="character"/><supplied reason="lost">'
  );
  text = text.replace(
    /\[(.[^\[]*)(\s)([^\x00-\x7F]*[aA-zZ]*)\]([^\x00-\x7F]*[aA-zZ]*)\(([^\x00-\x7F]*[aA-zZ]*)\)/g,
    '<supplied reason="lost">$1</supplied><expan><abbr><supplied reason="lost">$3</supplied>$4</abbr><ex>$5</ex></expan>'
  );
  const regexIllegibleCharacter = /([+])+/g;
  text = text.replace(regexIllegibleCharacter, function(match) {
    console.log("Ici match:" + match.length);
    return '<gap reason="illegible" quantity="' + match.length + '" unit="character"/>';
  });
  const regexGapCharacter = /\[(․{1,20})\]/g;
  text = text.replace(regexGapCharacter, function(match) {
    console.log("Ici match:" + match.length);
    const length = match.length - 2;
    return '<gap reason="illegible" quantity="' + length + '" unit="character"/>';
  });
  text = text.replace(
    /<supplied reason=\"lost\"> <gap/g,
    " <gap"
  );
  const regexHed = /(hed\.)̣/gi;
  const substHed = '<g type="hedera">\u2766</g>';
  text = text.replace(regexHed, substHed);
  const regexVac = /vac\./gi;
  const substVac = '<space extent="unknown" unit="character"/>';
  text = text.replace(regexVac, substVac);
  const regexSuperfluous = /\{([^\x00-\x7F]*[aA-zZ]*)\}/g;
  const substSuperfluous = "<surplus>$1</surplus>";
  text = text.replace(regexSuperfluous, substSuperfluous);
  regex = /(〚)(([^\x00-\x7F]*[aA-zZ]*)([\s\,\.]([^\x00-\x7F]*[aA-zZ]*))*)(〛)/gm;
  subst = '<del rend="erasure">$2</del>';
  text = text.replace(regex, subst);
  regex = /(⟦)(([^\x00-\x7F]*[aA-zZ]*)([\s\,\.]([^\x00-\x7F]*[aA-zZ]*))*)(⟧)/gm;
  subst = '<del rend="erasure">$2</del>';
  text = text.replace(regex, subst);
  regex = /(\[){2}(([^\x00-\x7F]*[aA-zZ]*)([\s\,\.]([^\x00-\x7F]*[aA-zZ]*))*)(\]){2}/gm;
  subst = '<del rend="erasure">$2</del>';
  text = text.replace(regex, subst);
  const regexTextInLacuna = /(\[)(([^\x00-\x7F]*[aA-zZ]*)([\s\,\.]([^\x00-\x7F]*[aA-zZ]*))*)(\])/gm;
  const substTextInLacuna = '<supplied reason="lost">$2</supplied>';
  text = text.replace(regexTextInLacuna, substTextInLacuna);
  regex = new RegExp("a", "u");
  const regexTextandUnkInLacuna = /(\[)([^\x00-\x7F]*[aA-zZ]*\s?[^\x00-\x7F]*[aA-zZ]*)(---)?(\])/g;
  const substTextandUnkInLacuna = '<supplied reason="lost">$2</supplied><gap reason="lost" />';
  text = text.replace(regexTextandUnkInLacuna, substTextandUnkInLacuna);
  const regexDotted = /([^\x00-\x7F]?[aA-zZ]?)̣/g;
  const substDotted = "<unclear>$1</unclear>";
  text = text.replace(regexDotted, substDotted);
  const regexUnclearClean = /(\<\/unclear\>\<unclear\>)/g;
  const substUnclearClean = "";
  text = text.replace(regexUnclearClean, substUnclearClean);
  text = text.replace(
    /(<gap reason=\"lost\" atLeast=\"[0-9]*\" atMost=\"[0-9]\" unit=\"character\"\/>)<expan><abbr>((?:[^\x00-\x7F]*?[aA-zZ]*?)*)<\/supplied>/g,
    '$1<expan><abbr><supplied reason="lost">$2</supplied>'
  );
  text = text.replace(
    /(<gap reason=\"lost\" atLeast=\"[0-9]*\" atMost=\"[0-9]\" unit=\"character\"\/>)<\/supplied>/g,
    "$1"
  );
  text = text.replace(
    /(<gap reason=\"lost\" atLeast=\"[0-9]*\" atMost=\"[0-9]\" unit=\"character\"\/>)<expan><abbr>((?:[^\x00-\x7F]*?[aA-zZ]*?)*)<\/supplied>/g,
    '$1<expan><abbr><supplied reason="lost">$2</supplied>'
  );
  text = text.replace(
    /(<gap reason=\"lost\" quantity=\"[0-9]*\" unit=\"character\" precision=\"low\"\/>)<\/supplied>/g,
    "$1"
  );
  text = text.replace(/(\/\>)\s(\<lb n=\"[0-9]*\"\/\>)/g, "$1\n$2");
  text = text.replace(/unit=\"line\"\/>\s(\w)/g, 'unit="line"/>$1');
  text = text.replace(/ ?∙ ?/g, ' <g type="interpunct">\u25B4</g> ');
  text = text.replace(/ ?𐆖 ?/g, ' <g type="denarius"/> ');
  text = text.replace(/❦/g, ' <g type="hedera">\u2766</g> ');
  text = text.replace(/\s\s/g, " ");
  text = text.replace(/ {2,99}/g, "");
  return text;
}
;
export {
  ancientText2XML
};
