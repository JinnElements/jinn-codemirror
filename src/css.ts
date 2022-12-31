import { cssLanguage } from "@codemirror/lang-css";
import { LanguageSupport } from "@codemirror/language";
import { Extension } from "@codemirror/state";
import { EditorConfig } from "./config";
import { JinnCodemirror } from "./jinn-codemirror";

export class CSSConfig extends EditorConfig {

    async getExtensions(editor: JinnCodemirror): Promise<Extension[]> {
        return [new LanguageSupport(cssLanguage)];
    }

    serialize(): string | Element | NodeListOf<ChildNode> | null | undefined {
        return this.editor.content;
    }
}