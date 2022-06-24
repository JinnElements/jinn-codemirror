import { lintGutter } from "@codemirror/lint";
import { Extension } from "@codemirror/state";
import { Tree } from "@lezer/common";
import { EditorCommands, EditorConfig, insertCommand, SourceType, wrapCommand } from "./config";
import { convertAncientText } from "./import/ancientText2xml.js";
import { JinnCodemirror } from "./jinn-codemirror";

const commands:EditorCommands = {
    erasure: wrapCommand('[[', ']]'),
    leiden_gap: insertCommand('[---]')
};

export class AncientTextConfig extends EditorConfig {
    
    _sourceType: SourceType;

    constructor(editor: JinnCodemirror, sourceType: SourceType) {
        super(editor);
        this._sourceType = sourceType;
    }
    
    async getExtensions(): Promise<Extension[]> {
        return [lintGutter()];
    }

    getCommands():EditorCommands {
        return commands;
    }

    onUpdate(tree: Tree, content: string): string {
        const converted = convertAncientText(content, this._sourceType);
        return `<ab xmlns="http://www.tei-c.org/ns/1.0">${converted}</ab>`
    }

    serialize(): Element | string | null {
        return this.editor.content;
    }

    setFromValue(value: Element | string | null|undefined): string {
        if (!value) { return '' }
        if (!(typeof value === 'string')) {
            throw new Error("cannot set value")
        }
        return value;
    }
}