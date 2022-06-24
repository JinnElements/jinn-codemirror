import { ExternalTokenizer } from "@lezer/lr";
import { Tree } from "@lezer/common";
declare const charsToken: ExternalTokenizer;
declare const unclearToken: ExternalTokenizer;
declare function leidenPlus2epiDoc(input: string, root?: Tree): string;
export { charsToken, unclearToken, leidenPlus2epiDoc };
