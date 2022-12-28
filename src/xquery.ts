import {StreamLanguage} from "@codemirror/language";
import {xQuery} from "@codemirror/legacy-modes/mode/xquery";
import { Extension } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { Diagnostic, linter } from "@codemirror/lint";
import { EditorConfig } from "./config";
import { JinnCodemirror } from "./jinn-codemirror";

const eXistLinter = (editor: JinnCodemirror, uri: string|null) => (view: EditorView): Promise<Diagnostic[]> => {
    const diagnostics:Diagnostic[] = [];

    function emitEvent(valid: boolean) {
        editor.valid = valid;
        editor.dispatchEvent(new CustomEvent(valid ? 'valid' : 'invalid', {
            detail: diagnostics,
            composed: true,
            bubbles: true
        }));
    }
    
    if (!uri) {
        return Promise.resolve(diagnostics);
    }
    if (view.state.doc.length === 0) {
        emitEvent(true);
        return Promise.resolve(diagnostics);
    }

    return new Promise<Diagnostic[]>(resolve =>
        fetch(uri, {
            method: 'POST',
            headers: {
                "Content-type": "application/x-www-form-urlencoded"
            },
            body: new URLSearchParams({code: view.state.doc.toString() || ''}).toString()
        })
        .then(response => response.json())
        .then(json => {
            if (json.status === 'fail') {
                const line = view.state.doc.lineAt(json.line);

                diagnostics.push({
                    message: json.message,
                    severity: 'error',
                    from: line.from + json.column,
                    to: line.from + json.column + 3
                });
            }
            resolve(diagnostics);
            emitEvent(diagnostics.length === 0);
        })
    );
};

export class XQueryConfig extends EditorConfig {

    private linterUri: string|null;

    constructor(editor: JinnCodemirror, linterUri: string|null = null) {
        super(editor);
        
        this.linterUri = linterUri;
    }

    async getExtensions(editor: JinnCodemirror): Promise<Extension[]> {
        return [StreamLanguage.define(xQuery), linter(eXistLinter(editor, this.linterUri))];
    }

    setFromValue(value: string | Element | NodeListOf<ChildNode> | null | undefined): string {
        if (!value) { return '' }
        if (!(typeof value === 'string')) {
            throw new Error("cannot set value")
        }
        return value;
    }

    serialize(): string | Element | NodeListOf<ChildNode> | null | undefined {
        return this.editor.content;
    }
}