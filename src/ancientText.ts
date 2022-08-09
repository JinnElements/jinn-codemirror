import { lintGutter } from "@codemirror/lint";
import { Extension } from "@codemirror/state";
import { Command, KeyBinding, keymap } from "@codemirror/view";
import { Tree } from "@lezer/common";
import { EditorCommands, EditorConfig, insertCommand, SourceType, wrapCommand } from "./config";
import { ancientText2XML } from "./import/ancientText2xml.js";
import { xml2leidenPlus } from "./import/xml2leiden+";
import { JinnCodemirror } from "./jinn-codemirror";

export function convertToLeidenPlus(text: string, type: SourceType): string {
    const converted = ancientText2XML(text, type);
    const xml = `<ab xmlns="http://www.tei-c.org/ns/1.0">${converted}\n</ab>`
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'application/xml');
    
    if (!doc.firstElementChild) {
        return '';
    }
    return xml2leidenPlus(doc.firstElementChild);
}

export const convertToLeidenPlusCommand = (component: JinnCodemirror, type:SourceType):Command => (editor) => {
    const lines = editor.state.doc.toJSON();
    const leiden = convertToLeidenPlus(lines.join('\n'), type);
    component.content = leiden;
    component.mode = 'leiden_plus';

    return true;
};

const commands:EditorCommands = {
    erasure: wrapCommand('[[', ']]'),
    gap: insertCommand('[---]')
};

const leidenKeymap: readonly KeyBinding[] = [
    { key: "Ctrl-Shift-d", mac: "Cmd-Shift-d", run: commands.erasure },
    { key: "Ctrl-Shift-l", mac: "Cmd-Shift-l", run: commands.gap }
];

export class AncientTextConfig extends EditorConfig {
    
    _sourceType: SourceType;

    constructor(editor: JinnCodemirror, sourceType: SourceType) {
        super(editor);
        this._sourceType = sourceType;
    }
    
    async getExtensions(): Promise<Extension[]> {
        return [keymap.of(leidenKeymap), lintGutter()];
    }

    getCommands():EditorCommands {
        return {
            ...commands, 
            convert: convertToLeidenPlusCommand(this.editor, this._sourceType)
        };
    }

    onUpdate(tree: Tree, content: string): string {
        const converted = ancientText2XML(content, this._sourceType);
        return `<ab xmlns="http://www.tei-c.org/ns/1.0">\n${converted}\n</ab>`
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