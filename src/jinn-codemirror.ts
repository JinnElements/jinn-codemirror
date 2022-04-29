import {EditorState, EditorView, basicSetup} from "@codemirror/basic-setup";
import { lintGutter } from "@codemirror/lint";
import { ViewPlugin, ViewUpdate } from "@codemirror/view";
import {syntaxTree} from "@codemirror/language";
import { EditorStateConfig, Extension } from "@codemirror/state";
import {xml} from "@codemirror/lang-xml";
import { leiden } from "./language";
import { syntax2epiDoc } from "./index";
import { Tree } from "@lezer/common";

abstract class EditorConfig {

    getConfig(parent:JinnCodemirror): EditorStateConfig {
        const self = this;
        const updateListener = ViewPlugin.fromClass(class {
            update(update: ViewUpdate) {
                if (update.docChanged) {
                    const tree = syntaxTree(update.state);
                    const lines = update.state.doc.toJSON();
                    const content = self.onUpdate(tree, lines.join('\n'));

                    parent.dispatchEvent(new CustomEvent('update', {
                        detail: content,
                        composed: true,
                        bubbles: true
                    }));
                }
            }
        });

        return {extensions: [basicSetup, EditorView.lineWrapping, ...this.getExtensions(), updateListener]};
    }

    abstract getExtensions(): Extension[];

    onUpdate(tree:Tree, content:string) {
        return content;
    }
}

class XMLConfig extends EditorConfig {
    getExtensions(): Extension[] {
        return [xml()];
    }
}

class LeidenConfig extends EditorConfig {
    getExtensions(): Extension[] {
        return [leiden()];
    }

    onUpdate(tree: Tree, content: string): string {
        return syntax2epiDoc(tree, content);
    }
}

export class JinnCodemirror extends HTMLElement {

    public mode?: string;
    
    _editor?: EditorView;

    constructor() {
        super();
        this.attachShadow({mode: 'open'});

        const css = document.createElement('style');
        css.innerHTML = this.styles();
        this.shadowRoot?.appendChild(css);
    }

    connectedCallback() {
        this.mode = this.getAttribute('mode') || 'xml';
        console.log(`<jinn-codemirror> mode: ${this.mode}`);

        const initialContent = this.innerHTML;
        let config;
        switch(this.mode) {
            case 'leiden':
                config = new LeidenConfig();
                break;
            default:
                config = new XMLConfig();
                break;
        }

        const wrapper = document.createElement('div');
        this.shadowRoot?.appendChild(wrapper);
        this._editor = new EditorView({
            state: EditorState.create(config.getConfig(this)),
            parent: wrapper
        });
        this.content = initialContent;
    }

    set content(text:string) {
        if (!this._editor) {
            console.log('no editor');
            return;
        }
        this._editor.dispatch({
            changes: {from: 0, to: this._editor.state.doc.length, insert: text}
        });
    }

    styles() {
        return `
            > div, .cm-editor {
                height: 100%;
                width: 100%;
            }
        `;
    }
}

window.customElements.define('jinn-codemirror', JinnCodemirror);