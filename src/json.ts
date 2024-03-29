import { jsonLanguage, jsonParseLinter } from "@codemirror/lang-json";
import { LanguageSupport } from "@codemirror/language";
import { Extension } from "@codemirror/state";
import { EditorConfig } from "./config";
import { JinnCodemirror } from "./jinn-codemirror";
import { linter, lintGutter } from "@codemirror/lint";

export class JSONConfig extends EditorConfig {

    async getExtensions(editor: JinnCodemirror): Promise<Extension[]> {
        return [new LanguageSupport(jsonLanguage), linter(jsonParseLinter()), lintGutter()];
    }

    serialize(): string | Element | NodeListOf<ChildNode> | null | undefined {
        return this.editor.content;
    }
}