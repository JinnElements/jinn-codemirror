import { ExternalTokenizer } from "@lezer/lr";
import { Tree } from "@lezer/common";
declare const charsToken: ExternalTokenizer;
declare const unclearToken: ExternalTokenizer;
declare const leidenCharsOrAbbreviation: ExternalTokenizer;
declare const leidenExpan: ExternalTokenizer;
declare function leiden2epiDoc(input: string, root?: Tree): string;
declare function leidenPlus2epiDoc(input: string, root?: Tree): string;
export { charsToken, unclearToken, leidenCharsOrAbbreviation, leidenExpan, leiden2epiDoc, leidenPlus2epiDoc };
