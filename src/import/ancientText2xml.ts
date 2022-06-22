import { SourceType } from "../config";

function pointedCharacters2Epidoc(text) {
    // var text = text.replace(/([aA-zZ])\x{323}/g, '<unclear>$1</unclear>');    //a
    //text = text.replace(/\u1E5B\/u/g, '<unclear>r</unclear>');    //r
    /*        console.log("Texte dot ---:" + text);*/
    return text;

};

/**
 * Convert an input text using different variants of the Leiden conventions.
 * Adopted from the [Ausohnum Library](https://gitlab.huma-num.fr/estudium/ausohnum-library/-/blob/master/resources/scripts/teiEditor/ancientTextImportRules.js).
 * 
 * @param text content to convert
 * @param importSource the type of the input
 * @returns resulting epiDoc XML
 */
export function convertAncientText(text: string, importSource: SourceType): string {
    const textImportMode = 'newText';
    const startingLineNumber = 1;

    //Clean tabs
    text = text.toString().replace(/\t+/g, '')
    ///r to /n
    text = text.replace(/\r/g, '');


    if (text.toString().length - text.toString().lastIndexOf(" ") == 1) {
        text = text.toString().substring(0, text.toString().lastIndexOf(" "));
    }

    //First Line
    if (textImportMode === "newText") {
        text = '<lb n="' + startingLineNumber.toString() + '"/>' + text;

        /*
         *****************************
         *        Line breaks        *
         *****************************/

        //New lines no word break
        const regexLine = /(\-|-?|\=?)\s?\n/g;
        let index = startingLineNumber - 1;
        text = text.replace(regexLine, function (match, selection) {
            if ((selection === "-") || (selection === "=")) { 
                return '\n<lb n="' + (index++ + 2) + '" break="no"/>'; 
            } else { 
                return '\n<lb n="' + (index++ + 2) + '"/>'; 
            }
        });

        //All line in lacuna [— — — — — — — — — — —] 
        text = text.replace(/(\<lb n=\"[0-9]*\"\/\>)\[(\s?—\s?){3,50}\]\n(\<lb n=\"[0-9]*\"\/\>)/g, '$1<gap reason="illegible" quantity="1" unit="line"/>\n$3');

        if (importSource == SourceType.edcs) {
            index = 0;
            text = text.replace(/(\s)?(\/\/)(?!\>)(\s)?/g, function (match) {
                if (match[0] === "/") { var breakNo = ' break="no"' }
                else { var breakNo = "" };
                return '\n<cb n="' + (index++ + 2) + '"' + breakNo + '/>';
            });

            //Line breaks
            const regexLine = /(\s)?(\/{1})(?!\>)(\s)?/g;
            index = 0;
            text = text.replace(regexLine, function (match) {
                if (match[0] === "/") { var breakNo = ' break="no"' }
                else { var breakNo = "" };
                console.log("BreakNo = " + breakNo);
                console.log("Match 0= " + match[0]);
                return '\n<lb n="' + (index++ + 2) + '"' + breakNo + '/>';
            });

        };

        if (importSource == SourceType.phi) {
            text = text.replace(/#⁷/g, '<gap reason="illegible" quantity="1" unit="character"/>');
            text = text.replace(/#⁷#⁷#⁷/g, '<gap reason="illegible" quantity="3" unit="character"/>');
            text = text.replace(/#⁵⁶/g, '<g type="interpunct">▴</g>');

        }; //End of features specific to PHI
        //Lines 5, 10, 15, etc.
        const regexLines5 = /\n<lb n=\'([0-9])\'\/>\1\s/g;
        const substLines5 = '\n<lb n="$1"/>';
        text = text.replace(regexLines5, substLines5);

        /* Removing original line number*/
        const regexLineClean = /(\"[0-9]{1,3}\"\/>)([0-9]{1,3})/g;
        const substLineClean = "$1";
        text = text.replace(regexLineClean, substLineClean);
    }; //End of line breaks if insertMode is newText

    /*
     *****************************
     *       Corrections         *
     *****************************/
    const regexCorrection = /\<([^\x00-\x7F]*[aA-zZ]*)(?!\=)(?!\/)\>/g;
    const substCorrection = '<supplied reason="omitted">$1</supplied>';
    text = text.replace(regexCorrection, substCorrection);

    const regexCorrectionOther = /⟨([^\x00-\x7F]*[aA-zZ]*)(?!\=)(?!\/)⟩/g;
    const substCorrectionOther = '<supplied reason="omitted">$1</supplied>';
    text = text.replace(regexCorrectionOther, substCorrectionOther);

    /****************************/
    /*      EDCS <x=Y>*/
    /******************************/
    if (importSource == SourceType.edcs) {
        /*        console.log("in EDCS2 for " + text);*/

        const regexCorrection2EDCS = /\<([^\x00-\x7F]*[aA-zZ]*)(\=)([^\x00-\x7F]*[aA-zZ]*)(?!\/)\>/g;
        const substCorrection2EDCS = "<choice>"
            + "<corr>$1</corr>"
            + "<sic>$3</sic></choice>"

        text = text.replace(regexCorrection2EDCS, substCorrection2EDCS);

        /* Line in lacuna [6]*/
        text = text.replace(/\[6\]/g,
            '<gap reason="lost" quantity="1" unit="line"/>');
        text = text.replace(/\[3\]/g,
            '<gap reason="lost" extent="unknown" unit="character"/>');
        text = text.replace(/\[3\s([^\x00-\x7F]*[aA-zZ]*)\]/g,
            '<gap reason="lost" extent="unknown" unit="character"/>'
            + '<supplied reason="lost">$1</supplied>');

        text = text.replace(/\[3\s/g,
            '<gap reason="lost" extent="unknown" unit="character"/>'
            + '<supplied reason="lost">');

        text = text.replace(/\s3\s/g,
            ' - - - '
        );
        text = text.replace(/\s3\]/g,
            ' - - -]'
        );
        text = text.replace(/a\(\)/g, '<abbr>a</abbr>');


    };
    /*    End of EDCS-specific features*/

    /*<note> (!), (sic)...*/
    text = text.replace(/\(\!\)/g, '<note>!</note>');
    text = text.replace(/\(sic\)/g, '<note>sic</note>');

    //Lacunae  [.....10.....]

    //[– – –]
    let regex = /\[(\–|\-)\s?(\–|\-)\s?(\–|\-)\]/g
    text = text.replace(regex, function (match, selection) {
        return '<gap reason="lost" extent="unknown" unit="character"/>';
    });


    //Lacunae with precise number of letters [...6...]
    regex = /\[(?:(?:\s?\.\s?){1,99})([1-9][0-9]*)(?:(?:\s?\.\s?){1,99})\]/g
    text = text.replace(regex, function (match, selection) {
        return '<gap reason="lost" quantity="' + selection + '" unit="character"/>';
    });

    //Lacunae with precise number of letters   [...6...SPACEtext
    regex = /\[(?:(?:\s?\.\s?){1,99})([1-9][0-9]*)(?:(?:\s?\.\s?){1,99})\s/g
    text = text.replace(regex, function (match, selection) {
        const length = match.length - 2;
        return '<gap reason="lost" quantity="' + selection + '" unit="character"/><supplied reason="lost">';
    });


    //Lacunae with precise number of letters   textSPACE...6...]
    regex = /\s(?:(?:\s?\.\s?){1,99})([1-9][0-9]*)(?:(?:\s?\.\s?){1,99})\]/g
    text = text.replace(regex, function (match, selection) {
        const length = match.length - 2;
        return '</supplied><gap reason="lost" quantity="' + selection + '" unit="character"/>';
    });

    //Lacunae with precise number of letters   textSPACE...SPACEtext
    regex = /\s(?:(?:\s?\.\s?){1,99})([1-9][0-9]*)(?:(?:\s?\.\s?){1,99})\s/g
    text = text.replace(regex, function (match, selection) {
        const length = match.length - 2;
        return '</supplied><gap reason="lost" quantity="' + selection + '" unit="character"/><supplied reason="lost">';
    });


    //Lacunae with precise number of letters [....]
    regex = /\[((\.){1,99})\]/g
    text = text.replace(regex, function (match, selection) {
        const length = match.length - 2;
        return '<gap reason="lost" quantity="' + length + '" unit="character"/>';
    });

    //Lacunae with precise number of letters   [...SPACEtext
    regex = /\[((\.){1,99})\s/g
    text = text.replace(regex, function (match, selection) {
        const length = match.length - 2;
        return '<gap reason="lost" quantity="' + length + '" unit="character"/><supplied reason="lost">';
    });


    //Lacunae with precise number of letters   textSPACE...]
    regex = /\s((\.){1,99})\]/g
    text = text.replace(regex, function (match, selection) {
        const length = match.length - 2;
        return '</supplied><gap reason="lost" quantity="' + length + '" unit="character"/>';
    });
    //Lacunae with precise number of letters   textSPACE...SPACEtext
    regex = /\s((\.){1,99})\s/g
    text = text.replace(regex, function (match, selection) {
        const length = match.length - 2;
        return '</supplied><gap reason="lost" quantity="' + length + '" unit="character"/><supplied reason="lost">';
    });

    //[ca. 5-7]
    text = text.replace(/\[(-|–|\.\s?){1,20}ca\.(\s?)([1-9][0-9]*)((-)([1-9][0-9]*))(\s?)(-|–|\.\s?){1,20}\]/g,
        '<gap reason="lost" atLeast="$3" atMost="$6" '
        + 'unit="character"/>');
    //[ca. 5]
    text = text.replace(/\[(-|–|\.\s?){1,20}ca\.(\s?)([1-9][0-9]*)(\s?)(-|–|\.\s?){1,20}\]/g,
        '<gap reason="lost" quantity="$3" '
        + 'unit="character" precision="low"/>');

    //[...c.5-7...] 
    text = text.replace(
        /\[(?:[\.․]){1,20}c(?:a?)\.(?:\s?)([1-9][0-9]*)(?:(?:-)([1-9][0-9]*))(?:\s?)(?:[\.․]){1,20}(?:\s?)\]/g,
        '<gap reason="lost" atLeast="$1" atMost="$2" unit="character"/>');
    //[...c.5...] 
    text = text.replace(
        /\[(?:[\.․]){1,20}c(?:a?)\.(?:\s?)([1-9][0-9]*)(?:\s?)(?:[\.․]){1,20}(?:\s?)\]/g,
        '<gap reason="lost" quantity="$1" unit="character" precision="low"/>');

    //[...c.5-7... 
    text = text.replace(
        /\[(?:[\.․]){1,20}c(?:a?)\.(?:\s?)([1-9][0-9]*)(?:(?:-)([1-9][0-9]*))(?:\s?)(?:[\.․]){1,20}(?:\s)/g,
        '<gap reason="lost" atLeast="$1" atMost="$2" unit="character"/><supplied reason="lost">');
    //[...c.5... 
    text = text.replace(
        /\[(?:[\.․]){1,20}c(?:a?)\.(?:\s?)([1-9][0-9]*)(?:\s?)(?:[\.․]){1,20}(?:\s)/g,
        '<gap reason="lost" quantity="$1" unit="character" precision="low"/><supplied reason="lost">');

    //[text ...c.5-7...] 
    text = text.replace(
        /\s(?:[\.․]){1,20}c(?:a?)\.(?:\s?)([1-9][0-9]*)(?:(?:-)([1-9][0-9]*))(?:\s?)(?:[\.․]){1,20}(?:\s?)\]/g,
        '</supplied><gap reason="lost" atLeast="$1" atMost="$2" unit="character"/>');
    //[text ...c.5...] 
    text = text.replace(
        /\s(?:[\.․]){1,20}c(?:a?)\.(?:\s?)([1-9][0-9]*)(?:\s?)(?:[\.․]){1,20}(?:\s?)\]/g,
        '</supplied><gap reason="lost" quantity="$1" unit="character" precision="low"/>');

    //...c.5-7... 
    text = text.replace(
        /\s(?:[\.․]){2,20}c(?:a?)\.(?:\s?)([1-9][0-9]*)(?:(?:-)([1-9][0-9]*))(?:\s?)(?:[\.․]){1,20}(?:\s)/g,
        '</supplied><gap reason="lost" atLeast="$1" atMost="$2" unit="character"/><supplied reason="lost">');

    //...c.5... 
    text = text.replace(
        /\s(?:[\.․]){2,20}c(?:a?)\.(?:\s?)([1-9][0-9]*)(?:\s?)(?:[\.․]){1,20}(?:\s)/g,
        '</supplied><gap reason="lost" quantity="$1" unit="character" precision="low"/><supplied reason="lost">');
    //Symbol (centurio)
    text = text.replace(/(?:\s|\n)\(([^\x00-\x7F]*[aA-zZ]*)\)/g,
        ' <expan><ex>$1</ex></expan>');


    //Replacing double [[ with ⟦
    text = text.replace(/\[{2}/g, '⟦');
    //Replacing double ]] with ⟧
    text = text.replace(/\]{2}/g, '⟧');


    /* Abbreviation with [] [Q]ui(ina) */
    text = text.replace(/\[([^\x00-\x7F]*[aA-zZ]*[^\]])\]([^\x00-\x7F]*[aA-zZ]*[^\]])\(([^\x00-\x7F]*?[aA-zZ]*?)\)/g,
        '<expan><abbr><supplied reason="lost">$1</supplied>$2</abbr><ex>$3</ex></expan>');
    /* Abbreviation with Rasura [Q]ui(ina) */
    text = text.replace(/(〚|⟦|\[\[)([^\x00-\x7F]*[aA-zZ]*[^\]])(〛|⟧|]])([^\x00-\x7F]*[aA-zZ]*[^\]])\(([^\x00-\x7F]*?[aA-zZ]*?)\)/g,
        '<expan><abbr><supplied reason="lost">$1</supplied>$2</abbr><ex>$3</ex></expan>');


    /*        Hermes [Augusti - - - lib(ertus)]   ==> straitgh supplied with a gap inside (supplied not starting or ending in abbreviation */
    text = text.replace(/\[(\w*?\s?)(?:(?:(?:\-|\–|\—)\s?){1,20})(\w*?)\](?![^\x00-\x7F]*?[aA-zZ]*?\()/g,
        '<supplied reason="lost">$1</supplied><gap reason="lost" extent="unknown" unit="character"/><supplied reason="lost">$2</supplied>');
    //CLEANING </supplied>\s?</supplied>
    text = text.replace(/<supplied reason=\"lost\"><\/supplied>/g, '');

    /*        Hermes [Augusti - - - lib(ertus)]   ==> straitgh RASURA with a gap inside (supplied not starting or ending in abbreviation */
    text = text.replace(/(?:⟦|〚)(.*?\s?)(?:(?:(?:\-|\–|\—)\s?){1,20})(.*?)(?:⟧|〛)(?![^\x00-\x7F]*?[aA-zZ]*?\()/g,
        '<del rend="erasure">$1</del><gap reason="lost" extent="unknown" unit="character"/><del rend="erasure">$2</del>');


    //Supplied: BLANK[szs szsz sszss(f) sss]CARRIAGE : if [] are preceded and followed by space, means can be replaced by <supplied>
    text = text.replace(/(?:\s)\[(.*?)\](?:\n)/g, ' <supplied reason="lost">$1</supplied>\n');
    //Supplied: BLANK[szs szsz s sss]BLANK : if [] are preceded and followed by space, means can be replaced by <supplied>
    text = text.replace(/(?:\s)\[(.*)\](?:\s)/g, ' <supplied reason="lost">$1</supplied> ');
    //DEL: BLANK[szs szsz sszss(f) sss]CARRIAGE : if [] are preceded and followed by space, means can be replaced by <supplied>
    text = text.replace(/(?:\s)(?:⟦|〚)(.*?)(?:⟧|〛)(?:\n)/g, ' <del rend="erasure">$1</del>\n');
    //DEL: BLANK[szs szsz s sss]BLANK : if [] are preceded and followed by space, means can be replaced by <supplied>
    text = text.replace(/(?:\s)(?:⟦|〚)(.*?)(?:⟧|〛)(?:\s)/g, ' <del256 rend="erasure">$1</del> ');




    /*//Supplied: BLANK[szs szsz sszss(f) sss]BLANK : if [] are preceded and followed by space, means can be replaced by <supplied>
         text = text.replace(/(?:\s)\[(.*?)\](?!(.*?))(?:\s)/g, ' <supplied262 reason="lost">$1</supplied> '); 
    */


    /*Abbreviation partly in lacuna without text after )*/
    regex = /([^\x00-\x7F]*[aA-zZ]*)\[([^\x00-\x7F]*[aA-zZ]*)\(([^\x00-\x7F]*[aA-zZ]*)\)(\])/g;
    let subst = '<expan><abbr>$1<supplied reason="lost">$2</supplied></abbr><ex>$3</ex></expan>'
    text = text.replace(regex, subst);
    /*Abbreviation partly in RASURA without text after )*/
    regex = /([^\x00-\x7F]*[aA-zZ]*)(?:⟦|〚)([^\x00-\x7F]*[aA-zZ]*)\(([^\x00-\x7F]*[aA-zZ]*)\)(?:⟧|〛)/g;
    subst = '<expan><abbr>$1<del rend="erasure">$2</del></abbr><ex>$3</ex></expan>'
    text = text.replace(regex, subst);


    /*      SUPPLIED: Au[g(usti) followed by words even ABBREV but ] not in inside an abbreviation        */
    text = text.replace(/([^\x00-\x7F]*?[aA-zZ]*?[^>])?\[([^\x00-\x7F]*?[aA-zZ]*?)\(([^\x00-\x7F]*?[aA-zZ]*?)\)(.*?[^\-\–\—])\](?![^\x00-\x7F]*?[aA-zZ]*\()/g,
        '<expan><abbr>$1<supplied reason="lost">$2</supplied></abbr><ex>$3</ex></expan> <supplied reason="lost">$4</supplied>');
    /*  Before Chnage on 7/4/20 10:38: text = text.replace(/([^\x00-\x7F]*?[aA-zZ]*?[^\s][^>])?\[([^\x00-\x7F]*?[aA-zZ]*?)\(([^\x00-\x7F]*?[aA-zZ]*?)\)(.*?[^\-\–\—])\](?![^\x00-\x7F]*?[aA-zZ]*\()/g,*/

    /*   text = text.replace(/([^\x00-\x7F]*?[aA-zZ]*?[^\s][^>])?(?:\s)(?:⟦|〚)([^\x00-\x7F]*?[aA-zZ]*?)\(([^\x00-\x7F]*?[aA-zZ]*?)\)(.*?[^\-\–\—])(?:⟧|〛)(?![^\x00-\x7F]*?[aA-zZ]*\()/g,*/


    /*      DEL: Au[[g(usti) followed by words even ABBREV but ]] not in inside an abbreviation        */
    text = text.replace(/([^\x00-\x7F]*?[aA-zZ]*?[^\s][^>])?(?:\s?)(?:⟦|〚)([^\x00-\x7F]*?[aA-zZ]*?)\(([^\x00-\x7F]*?[aA-zZ]*?)\)(.*?[^\-\–\—])(?:⟧|〛)(?![^\x00-\x7F]*?[aA-zZ]*\()/g,
        '<expan><abbr>$1<del rend="erasure">$2</del></abbr><ex>$3</ex></expan> <del rend="erasure">$4</del>');


    /*        SUPPLIED: Hermes Au[g(usti) libertus pr]oc(urator)  [ starting and ending in a abbreviation*/
    text = text.replace(/([^\x00-\x7F]*?[aA-zZ]+)\[([^\x00-\x7F]*?[aA-zZ]*?)\(([^\x00-\x7F]*?[aA-zZ]*?)\)(.*?[^\-\–\—])([^\x00-\x7F]*?[aA-zZ]*?)\](?:([^\x00-\x7F]*?[aA-zZ]*?)\(([^\x00-\x7F]*?[aA-zZ]*?)\))/g,
        '<expan><abbr>$1<supplied reason="lost">$2</supplied></abbr><ex>$3</ex></expan> <supplied reason="lost">$4</supplied><expan><abbr><supplied reason="lost">$5</supplied>$6</abbr><ex>$7</ex></expan>');
    /*        DEL: Hermes Au[[g(usti) libertus pr]]oc(urator)  [ starting and ending in a abbreviation*/
    text = text.replace(/([^\x00-\x7F]*?[aA-zZ]*?)(?:⟦|〚)([^\x00-\x7F]*?[aA-zZ]*?)\(([^\x00-\x7F]*?[aA-zZ]*?)\)(.*?[^\-\–\—])([^\x00-\x7F]*?[aA-zZ]*?)(?:⟧|〛)(?:([^\x00-\x7F]*?[aA-zZ]*?)\(([^\x00-\x7F]*?[aA-zZ]*?)\))/g,
        '<expan><abbr>$1<del rend="erasure">$2</del></abbr><ex>$3</ex></expan> <del rend="erasure">$4</del><expan><abbr><del rend="erasure">$5</del>$6</abbr><ex>$7</ex></expan>');

    // <supplied reason="lost"> ․․․c.5-7․․․ </supplied>
    text = text.replace(/<supplied reason="lost"> (?:[\.․]){1,20}c(?:a?)\.(?:\s?)([1-9][0-9]*)(?:(?:-)([1-9][0-9]*))(?:\s?)(?:[\.․]){1,20} <\/supplied>/g,
        '<gap reason="lost" atLeast="$1" atMost="$2" unit="character"/>');
    //Cleaning <supplied reason="lost"><gap reason="lost" atLeast="5" atMost="7" unit="character"/></supplied>
    text = text.replace(/<supplied reason=\"lost\">(<gap reason=\"lost\" atLeast=\"[0-9]*\" atMost=\"[0-9]\" unit="character"\/>)<\/supplied>/g,
        '$1');

    //Supplied: [szs szsz sszss(f) sss]                      
    text = text.replace(/\[(.[^\[\-\–\—]*)\](?![^\x00-\x7F]*[aA-zZ]*\()/g, '<supplied reason="lost">$1</supplied>');
    //DEL: [[]szs szsz sszss(f) sss]]                     
    text = text.replace(/(?:⟦|〚)(.[^\[]*)\](?![^\x00-\x7F]*[aA-zZ]*\()/g, '<del rend="erasure">$1</supplied>');



    /*
     * THIS regex is making everything slow
    /\*        SUPPLIED: Herm[es Aug(usti) libertus pr]oc(urator)  ending in a abbreviation*\/
    text = text.replace(/(?:([^\x00-\x7F]*?[aA-zZ]*?[^\s])*)\[([^\x00-\x7F]*?[aA-zZ]*?)\s(.*?)([^\x00-\x7F]*?[aA-zZ]*?)\](?:([^\x00-\x7F]*?[aA-zZ]*?)\(([^\x00-\x7F]*?[aA-zZ]*?)\))/g,
                                    '$1<supplied reason="lost">$3</supplied> <expan><abbr><supplied reason="lost">$4$5</supplied>$6</abbr><ex>$7</ex></expan>');
    */




    /*      SUPPLIED: [Aug(usti)         */
    text = text.replace(/(?:\s)\[((.[^\.<])*)\s/g,
        ' <supplied reason="lost"><expan><abbr>$1</abbr><ex>$2</ex></expan></supplied>');
    /*Was before: text = text.replace(/(?:\s)\[([^\x00-\x7F]*[aA-zZ]*)\(([^\x00-\x7F]*[aA-zZ]*)\)/g,*/

    /*         SUPPLIED   ddd(t)]        */
    text = text.replace(/(?!([^\x00-\x7F]*[aA-zZ]*))(\s)([^\x00-\x7F]*[aA-zZ]*)\(([^\x00-\x7F]*[aA-zZ]*)\)\]/g,
        '$1<supplied reason="lost"><expan><abbr>$2</abbr><ex>$3</ex></expan></supplied>');



    /*         SUPPLIED   dd]d(t)        */
    text = text.replace(/(\s)([^\x00-\x7F]*?[aA-zZ]*?)\]([^\x00-\x7F]*?[aA-zZ]*?)\(([^\x00-\x7F]*[aA-zZ]*)\)/g,
        '$1</supplied><expan><abbr><supplied reason="lost">$2</supplied>$3</abbr><ex>$4</ex></expan>');


    /*      SUPPLIED:  A[ug(usti)         */

    text = text.replace(/(\s)([^\x00-\x7F]+[aA-zZ]+)\[([^\x00-\x7F]*[aA-zZ]*)\(([^\x00-\x7F]*[aA-zZ]*)\)/g,
        ' <expan><abbr>$2<supplied reason="lost">$3</supplied></abbr><ex>$4</ex></expan> <supplied reason="lost">');


    //SUPPLIED:      xx[frfrfrf(?) - - - - - - ]
    text = text.replace(/\[([^\x00-\x7F]*[aA-zZ]*)\(\?\)((\s?(\-|\–|\—)\s?){1,20})\]/g,
        '<supplied reason="lost" cert="low">$1</supplied><gap reason="lost" extent="unknown" unit="character"/>');

    //SUPPLIED:      xx[frfrfrf - - - - - - frf]
    text = text.replace(/\[([^\x00-\x7F]*[aA-zZ]*)((\s?(\-|\–|\—)\s?){1,20})\]/g,
        '<supplied reason="lost">$1</supplied><gap reason="lost" extent="unknown" unit="character"/>');



    /*
    *****************************
    *      Abbreviations        *
    *****************************/

    /*Word with multiple abbreviations*/

    /*  var regex= /\[(․{1,20})\]/g;
         index =0;
         text = text.replace(regex, function(match){
                console.log('Ici match:' + match.length );
                var length = parseInt(match.length) -2; 
                return '<gap reason="illegible" quantity="' + length + '" unit="character"/>' ;
                });
   */


    /*Abbreviation partly in lacuna with text after )*/
    regex = /([^\x00-\x7F]*[aA-zZ]*)\[([^\x00-\x7F]*[aA-zZ]*)\(([^\x00-\x7F]*[aA-zZ]*)\)(\s)?([^\x00-\x7F]*[aA-zZ]*)?(\s)?(\])/g;
    subst = '<expan><abbr>$1<supplied reason="lost">$2</supplied></abbr><ex>$3</ex></expan><supplied reason="lost">$4$5</supplied>'
    text = text.replace(regex, subst);

    /*    Abbreviation in Rasura*/
    regex = /(〚|⟦|\[\[)([^\x00-\x7F]*[aA-zZ]*)\(([^\x00-\x7F]*[aA-zZ]*)\)([^\x00-\x7F]*[aA-zZ]*)?(〛|⟧|]])/g;
    subst = '<del rend="erasure"><expan><abbr>$2</abbr><ex>$3</ex></expan>$4</del>';
    text = text.replace(regex, subst);

    /*    Abbreviation in Lacuna*/
    regex = /\[([^\x00-\x7F]*[aA-zZ]*)\(([^\x00-\x7F]*[aA-zZ]*)\)(])/g;
    subst = '<supplied reason="lost"><expan><abbr>$1</abbr><ex>$2</ex></expan></supplied>';
    text = text.replace(regex, subst);


    /*    Abbreviation with uncertain resolution*/
    regex = /([^\x00-\x7F]*[aA-zZ]*)\(([^\x00-\x7F]*[aA-zZ]*)\?\)/g;
    const substAbbrevInLac = '<expan><abbr>$1</abbr><ex cert="low">$2</ex></expan>';
    text = text.replace(regex, substAbbrevInLac);


    /*Double abbreviation*/
    regex = /([^\x00-\x7F]*[aA-zZ]*)\(([^\x00-\x7F]*[aA-zZ]*)\)([^\x00-\x7F]*[aA-zZ]*)*\(([^\x00-\x7F]*[aA-zZ]*)\)/g;
    subst = "<expan><abbr>$1</abbr><ex>$2</ex><abbr>$3</abbr><ex>$4</ex></expan>";
    text = text.replace(regex, subst);


    /*Basic abbreviation*/
    regex = /([^\x00-\x7F]*[aA-zZ]*)\(([^\x00-\x7F]*[aA-zZ]*)\)([^\x00-\x7F]*[aA-zZ]*)*/g;
    subst = "<expan><abbr>$1</abbr><ex>$2</ex>$3</expan>";
    text = text.replace(regex, subst);
    //cleaning wrong closing of expan
    text = text.replace("\<\/expan\>\<expan\>\<abbr\>", "<abbr>");


    /*
     *****************************
     *        Line in lacuna     *
     *****************************/
    //Line in lacuna [------]
    text = text.replace('\n\[------\]', '<gap unit="line" />');
    //Line in lacuna ------
    text = text.replace(/(-){6}/g, '<gap unit="line" />');

    /*//All line [— — — — — — — — — — — 
  text = text.replace(/(\<lb n=\"[0-9]*\"\/\>)\[(—\s?)*\]/g, '$1<gap reason="lost" quantity="1" unit="line"/>');
*/
    //text = text.replace(/(\<lb n=\"[0-9]*\"\/\>)\[(\s?—\s?)*\]/g, '$1<gap reason="lost" quantity="1" unit="line"/>\n');

    //Part of line [— — — — — — — — — — — 
    text = text.replace(/\[(—\s?)*\]/g, '<gap reason="lost" extent="unknown" unit="character"/>');

    //gap of 3?
    text = text.replace(/\[---\]/g, '<gap reason="lost" extent="unknown" unit="character"/>');

    //[— — —ca.x-y— — —]
    text = text.replace(/\[— — —ca\.([1-9][0-9]*)((-)([1-9][0-9]*))?— — —\]/g, '<gap reason="lost" quantity="$1" '
        + 'unit="character" precision="low"/>');

    //[— — — —ca.x-y— — — —]
    text = text.replace(/\[— — — —ca\.([1-9][0-9]*)((-)([1-9][0-9]*))?— — — —\]/g, '<gap reason="lost" quantity="$1" '
        + 'unit="character" precision="low"/>');


    //[—ca. x— ]
    text = text.replace(/\[(-|–\s?){1,20}ca\.(\s?)([1-9][0-9]*)?(\s?)(-|–\s?){1,20}\]/g, '<gap reason="lost" quantity="$3" '
        + 'unit="character" precision="low"/>');


    //Line lost of unknown extent ; ------? 
    text = text.replace(/\------\?/g, '<gap reason="lost" extent="unknown" '
        + 'unit="line"><certainty match=".." locus="name"/></gap>');
    //Line lost of unknown extent ; [------?] 
    text = text.replace(/\[\------\?\]/g, '<gap reason="lost" extent="unknown" '
        + 'unit="line"><certainty match=".." locus="name"/></gap>');
    //Line lost of unknown extent ; [------?] 
    text = text.replace(/\[\---\?\]/g, '<gap reason="lost" extent="unknown" '
        + 'unit="line"><certainty match=".." locus="name"/></gap>');

    //beginning lost
    text = text.replace(/\[(-|–|\—\s?){1,20}([^\x00-\x7F]*[aA-zZ]*)\]/g, '<gap reason="lost" extent="unknown" unit="character"/>');

    //Beginning of line lost, unknown extent ; with restition of word at end   [------word]
    //[- - - - - - - - - - γυμνα]-
    text = text.replace(/\[(-|–|\—\s?){1,20}([^\x00-\x7F]*[aA-zZ]*)\]/g, '<gap reason="lost" extent="unknown" '
        + 'unit="character"/><supplied reason="lost">$2</supplied>');

    //Beginning of line lost, unknown extent ; with RASURA of word at end   [------word]
    //[- - - - - - - - - - γυμνα]-
    text = text.replace(/(?:⟦|〚)(-|–|\—\s?){1,20}([^\x00-\x7F]*[aA-zZ]*)(?:⟧|〛)/g, '<gap reason="lost" extent="unknown" '
        + 'unit="character"/><del rend="erasure">$2</supplied>');

    //End of line lost, unknown extent ; with restition of word at beginning   [word ---]
    text = text.replace(
        /*                                /\[(?!(\u2013|\u2014))([^\x00-\x7F]*[aA-zZ]*)((\s?)(\u2013|\u2014)\s?){1,20}\]/g,*/
        /*                                /\[(?!([\-\–\—]))([^\x00-\x7F]*[aA-zZ]*)((\s?)([\-\—\–])\s?){1,20}\]/g,                            //==>before 31/03/2020 and attempt to match [wor word - - -]*/
        /\[(?!([\-\–\—]))(((?!([\-\–\—\[\]]))[^\x00-\x7F]*[aA-zZ]*(\s?)){1,10})(([\-\—\–])\s?){1,20}\]/g,
        '<supplied reason="lost">$2</supplied><gap reason="lost" extent="unknown" '
        + 'unit="character"/>');
    //End of line lost, unknown extent ; ---]
    text = text.replace(
        /(([\-\—\–])\s?){1,20}\]/g,
        '<gap reason="lost" extent="unknown" '
        + 'unit="character"/>');
    //Cleaning <expan><abbr>[   
    text = text.replace(/<expan><abbr>\[/g, '<supplied reason="lost"><expan><abbr>');
    //CLeaning </expan> </supplied><
    text = text.replace(/<\/expan> <\/supplied></g, '</expan></supplied> <');
    //Cleaning <supplied reason="lost"><expan><abbr>TEXT[
    text = text.replace(/<supplied reason=\"lost\"><expan><abbr>([^\x00-\x7F]*?[aA-zZ]*?)\]/g,
        '<expan><abbr><supplied reason="lost">$1</supplied>');
    //Cleaning <expan><abbr></abbr><ex>
    text = text.replace(/<expan><abbr><\/abbr><ex>/g, '<expan><ex>')
    //Cleaning restitutions not dealt with by previous regex
    //text + ---- in lacuna
    const regexSuppliedClean = /\[/g;
    const substSuppliedClean = '<supplied reason="lost">';
    text = text.replace(regexSuppliedClean, substSuppliedClean);
    const regexSuppliedCleanClose = /\]/g;
    const substSuppliedCleanClose = '</supplied>';
    text = text.replace(regexSuppliedCleanClose, substSuppliedCleanClose);

    //Cleaning </ex></supplied></expan>
    text = text.replace(/<\/ex><\/supplied><\/expan>/g, '</ex></expan></supplied>');
    /*//Cleaning <expan><abbr>gt</supplied>gt</abbr>
            text = text.replace(/<expan><abbr>gt<\/supplied>gt<\/abbr>/g,
                                          , '<expan><abbr><supplied reason="lost">$1</supplied>gt</abbr>');
    */

    // CLEANING  - - - </supplied>
    text = text.replace(/((\s?(\-|\—|\–)\s?){1,20})<\/supplied>/g,
        '</supplied><gap reason="lost" extent="unknown" unit="character"/>')

    text = text.replace(/((\s?(\-|\—|\–)\s?){1,20})<\/supplied>/g,
        '</supplied><gap reason="lost" extent="unknown" unit="character"/>')
    //CLEAING <supplied reason="lost">- - -
    text = text.replace(/<supplied reason=\"lost\">((\s?(\-|\—|\–)\s?){1,20})/g,
        '<gap reason="lost" extent="unknown" unit="character"/><supplied reason="lost">')
    //Cleaning: <supplied reason="lost"></supplied223><gapzz reason="lost" extent="unknown" unit="character"/><supplied224 reason="lost"></supplied>
    text = text.replace(/<supplied reason=\"lost\"><\/supplied><gap reason=\"lost\" extent=\"unknown\" unit=\"character\"\/><supplied reason=\"lost\"><\/supplied>/g
        , '</supplied><gap reason="lost" extent="unknown" unit="character"/><supplied reason="lost">');
    //CLEANING <supplied reason="lost"> </supplied>
    text = text.replace(/<supplied reason=\"lost\"> <\/supplied>/g, '');

    //CLEANING <del rend="erasure">\s?</supplied>
    text = text.replace(/<del rend=\"erasure\">\s?<\/del>/g, '');

    //CLEANING </supplied>\s?</supplied>
    text = text.replace(/<\/supplied>\s?<\/supplied>/g, '</supplied>');
    //CLEANING <lb /></supplied><gap
    text = text.replace(/\/><\/supplied><gap/g, '/><gap');
    //Supplied: [szs - - - sss]
    text = text.replace(/\[(?!([\-\–\—]))((?:\s?(?:(?!(?:[\-\–\—\[\]]))[^\x00-\x7F]*[aA-zZ](?!\s)*)){1,10})(?:(?:\s?[\-\—\–])\s?){1,20}((?:(?!([\-\–\—\[\]]))[^\x00-\x7F]*[aA-zZ]*))\]/g,
        '<supplied reason="lost">$2</supplied><gap reason="lost" extent="unknown" unit="character"/><supplied reason="lost">$3</supplied>');
    //Cleaning not processed - - - in middle lacuna
    text = text.replace(
        /(\s?([\-\—\–])\s?){1,20}/g,
        '</supplied><gap reason="lost" extent="unknown" '
        + 'unit="character"/><supplied reason="lost">');

    //Supplied with ] in an abbreviation
    text = text.replace(/\[(.[^\[]*)(\s)([^\x00-\x7F]*[aA-zZ]*)\]([^\x00-\x7F]*[aA-zZ]*)\(([^\x00-\x7F]*[aA-zZ]*)\)/g,
        '<supplied reason="lost">$1</supplied><expan><abbr><supplied reason="lost">$3</supplied>$4</abbr><ex>$5</ex></expan>');




    /*//Equivalent to previous but on ending
     text = text.replace(/\[([^\x00-\x7F]*[aA-zZ]*)\s?(-|–\s?){1,20}\]/g, '<supplied reason="lost">$1</supplied><gap reason="lost" extent="unknown" ' 
     + 'unit="character"/>');
    */
    //illegible charactes +++
    const regexIllegibleCharacter = /([+])+/g;
    text = text.replace(regexIllegibleCharacter, function (match) {
        console.log('Ici match:' + match.length);
        return '<gap reason="illegible" quantity="' + match.length + '" unit="character"/>';
    });

    //gap charachter with dot
    const regexGapCharacter = /\[(․{1,20})\]/g;
    text = text.replace(regexGapCharacter, function (match) {
        console.log('Ici match:' + match.length);
        const length = match.length - 2;
        return '<gap reason="illegible" quantity="' + length + '" unit="character"/>';
    });


    /*        CLEANING opening supplied followed by GAP*/
    text = text.replace(/<supplied reason=\"lost\"> <gap/g,
        ' <gap');



    //Hedera as hed.
    const regexHed = /(hed\.)̣/gi;
    const substHed = '<g type="hedera">❦</g>';
    text = text.replace(regexHed, substHed);

    //vac
    const regexVac = /vac\./gi;
    const substVac = '<space extent="unknown" unit="character"/>';
    text = text.replace(regexVac, substVac);



    /*
     *****************************
     *       superfluous         *
     *****************************/

    const regexSuperfluous = /\{([^\x00-\x7F]*[aA-zZ]*)\}/g;
    const substSuperfluous = '<surplus>$1</surplus>';
    text = text.replace(regexSuperfluous, substSuperfluous);
    /*
    *******************************
    *              Erased               *
    *******************************
    */
    /* 〚 U+301A  and U+301B*/
    regex = /(〚)(([^\x00-\x7F]*[aA-zZ]*)([\s\,\.]([^\x00-\x7F]*[aA-zZ]*))*)(〛)/gm;
    subst = '<del rend="erasure">$2</del>';
    text = text.replace(regex, subst);

    /*With  ⟦ U+27E6 U+27E7*/
    regex = /(⟦)(([^\x00-\x7F]*[aA-zZ]*)([\s\,\.]([^\x00-\x7F]*[aA-zZ]*))*)(⟧)/gm;
    subst = '<del rend="erasure">$2</del>';
    text = text.replace(regex, subst);

    regex = /(\[){2}(([^\x00-\x7F]*[aA-zZ]*)([\s\,\.]([^\x00-\x7F]*[aA-zZ]*))*)(\]){2}/gm;
    subst = '<del rend="erasure">$2</del>';
    text = text.replace(regex, subst);


    /*
     *****************************
     *       Restitutions        *
     *****************************/

    //restituted text
    /*    var regexTextInLacuna = /(\[)(\w*\s?\w*)(])/g;*/


    const regexTextInLacuna = /(\[)(([^\x00-\x7F]*[aA-zZ]*)([\s\,\.]([^\x00-\x7F]*[aA-zZ]*))*)(\])/gm;
    const substTextInLacuna = '<supplied reason="lost">$2</supplied>';
    text = text.replace(regexTextInLacuna, substTextInLacuna);
    regex = new RegExp('\u{61}', 'u');

    //text + ---- in lacuna
    const regexTextandUnkInLacuna = /(\[)([^\x00-\x7F]*[aA-zZ]*\s?[^\x00-\x7F]*[aA-zZ]*)(---)?(\])/g;
    const substTextandUnkInLacuna = '<supplied reason="lost">$2</supplied><gap reason="lost" />';
    text = text.replace(regexTextandUnkInLacuna, substTextandUnkInLacuna);




    //text = text.replace('extent=\"8\" unit=\"letter\"', 'class="gap8letters"');

    //Dotted characters
    const regexDotted = /([^\x00-\x7F]?[aA-zZ]?)̣/g;
    const substDotted = '<unclear>$1</unclear>';
    text = text.replace(regexDotted, substDotted);
    //Cleaning consecutive unclear
    const regexUnclearClean = /(\<\/unclear\>\<unclear\>)/g;
    const substUnclearClean = '';
    text = text.replace(regexUnclearClean, substUnclearClean);



    /* //Cleaning supplied ending with ? — —]
     var regexSuppliedCleanClose2 = /(\? — —\])/g;
     var substSuppliedCleanClose2 = '</supplied>';
     var text = text.replace(regexSuppliedCleanClose2, substSuppliedCleanClose2);
     */
    //Cleaning <gap reason="lost" atLeast="5" atMost="7" unit="character"/><expan><abbr>li</supplied>
    text = text.replace(/(<gap reason=\"lost\" atLeast=\"[0-9]*\" atMost=\"[0-9]\" unit=\"character\"\/>)<expan><abbr>((?:[^\x00-\x7F]*?[aA-zZ]*?)*)<\/supplied>/g,
        '$1<expan><abbr><supplied reason="lost">$2</supplied>');
    //Cleaning <gap reason="lost" atLeast="5" atMost="7" unit="character"/></supplied>
    text = text.replace(/(<gap reason=\"lost\" atLeast=\"[0-9]*\" atMost=\"[0-9]\" unit=\"character\"\/>)<\/supplied>/g,
        '$1');
    //Cleaning <gap reason="lost" quantity="5" unit="character" precision="low"/><expan><abbr>li</supplied>
    text = text.replace(/(<gap reason=\"lost\" atLeast=\"[0-9]*\" atMost=\"[0-9]\" unit=\"character\"\/>)<expan><abbr>((?:[^\x00-\x7F]*?[aA-zZ]*?)*)<\/supplied>/g,
        '$1<expan><abbr><supplied reason="lost">$2</supplied>');
    //Cleaning <gap reason="lost" quantity="5" atMost="7" unit="character" precision="low"/></supplied>
    text = text.replace(/(<gap reason=\"lost\" quantity=\"[0-9]*\" unit=\"character\" precision=\"low\"\/>)<\/supplied>/g,
        '$1');
    //Cleaning lb not preceded by a carraige
    text = text.replace(/(\/\>)\s(\<lb n=\"[0-9]*\"\/\>)/g, "$1\n$2")
    //Cleaning not full line in lacuna
    text = text.replace(/unit=\"line\"\/>\s(\w)/g, 'unit="line"/>$1');


    //∙
    text = text.replace(/ ?∙ ?/g, ' <g type="interpunct">▴</g> ');
    /*    text = text.replace(/ ?❦ ?/g, '<g type="hedera">❦</g>');*/
    text = text.replace(/ ?𐆖 ?/g, ' <g type="denarius"/> ');

    text = text.replace(/❦/g, ' <g type="hedera">❦</g> ');
    //Cleaning double space
    text = text.replace(/\s\s/g, ' ');

    /*    Centered WORDS*/
    /*TODO: check if space after lb*/

    //    var text = text.replace(/<lb n= {2,99}/g, "");

    text = text.replace(/ {2,99}/g, "");

    /*    console.log("Converted text for preview: " + text);*/
    return text;




};