import { ExternalTokenizer } from "@lezer/lr";
import { Tree } from "@lezer/common";
declare const charsToken: ExternalTokenizer;
declare const unclearToken: ExternalTokenizer;
declare function leiden2epiDoc(input: string): string;
declare function syntax2epiDoc(root: Tree, input: string): string;
export { charsToken, unclearToken, leiden2epiDoc, syntax2epiDoc };
