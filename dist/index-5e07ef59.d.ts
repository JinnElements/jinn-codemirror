import { ExternalTokenizer } from "@lezer/lr";
import { Tree } from "@lezer/common";
declare const charsToken: ExternalTokenizer;
declare const unclearToken: ExternalTokenizer;
declare function leiden2epiDoc(input: string, root?: Tree): string;
declare function leidenPlus2epiDoc(input: string, root?: Tree): string;
export { charsToken, unclearToken, leiden2epiDoc, leidenPlus2epiDoc };
