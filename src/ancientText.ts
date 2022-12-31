import { lintGutter } from "@codemirror/lint";
import { Extension } from "@codemirror/state";
import { Command } from "@codemirror/view";
import { Tree } from "@lezer/common";
import { EditorCommands, EditorConfig, insertCommand, SourceType, wrapCommand } from "./config";
import { ancientText2XML } from "./import/ancientText2xml.js";
import { xml2leidenPlus } from "./import/xml2leiden+";
import { JinnCodemirror } from "./jinn-codemirror";

export function convertToLeidenPlus(text: string, type: SourceType): string | null {
    const converted = ancientText2XML(text, type);
    const xml = `<ab>${converted}\n</ab>`
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'application/xml');
    if (!doc.firstElementChild) {
        return '';
    }
    const errorNode = doc.querySelector('parsererror');
    if (errorNode) {
        return null;
    }
    return xml2leidenPlus(doc.firstElementChild);
}

export const convertToLeidenPlusCommand = (component: JinnCodemirror, type:SourceType):Command => (editor) => {
    const lines = editor.state.doc.toJSON();
    const leiden = convertToLeidenPlus(lines.join('\n'), type);
    if (leiden) {
        component._value = leiden;
        component.mode = 'leiden_plus';
    } else {
        alert('Conversion failed due to invalid XML!');
    }
    return true;
};

const commands:EditorCommands = {
    erasure: wrapCommand('[[', ']]'),
    gap: insertCommand('[---]')
};

export class AncientTextConfig extends EditorConfig {
    
    _sourceType: SourceType;

    constructor(editor: JinnCodemirror, toolbar: HTMLElement[]|undefined = [], sourceType: SourceType) {
        super(editor, toolbar, {
            ...commands, 
            convert: convertToLeidenPlusCommand(editor, sourceType)
        });
        this._sourceType = sourceType;
    }
    
    async getExtensions(): Promise<Extension[]> {
        return [lintGutter()];
    }

    onUpdate(tree: Tree, content: string): string {
        const converted = ancientText2XML(content, this._sourceType);
        return `<ab>\n${converted}\n</ab>`
    }

    serialize(): Element | string | null {
        return this.editor.content;
    }
}