import TomSelect from "tom-select";

function resolveURL(relPath) {
    const src = document.querySelector('script[src*=jinn-codemirror]');
    if (src) {
        return new URL(relPath, src.src).href;
    }
    return new URL(relPath, window.location.href).href;
}

export class ZoteroPicker extends HTMLElement {

    public group?: string|null;

    _select?: TomSelect;
    _value: string|null = null;

    static get observedAttributes() { return ['value']; }

    constructor() {
        super();

        this.attachShadow({mode: 'open'});
    }

    get value() {
        return this._value;
    }

    set value(value:string) {
        this._value = value;
        if (value && value.length > 0) {
            fetch(`https://api.zotero.org/groups/${this.group}/items?tag=${this._value}&format=bib&amp;style=digital-humanities-im-deutschsprachigen-raum`)
            .then((response) => {
                if (response.ok) {
                    return response.text();
                }
            })
            .then((text) => {
                const item = {
                    label: text,
                    tag: this._value
                };
                this._select.addOption(item);
                this._select.clear(true);
                this._select.sync();

                this._select.setValue(value, false);
                this._select.sync();

                this.setAttribute('value', value);
            });
        } else {
            this.setAttribute('value', value);
        }
    }

    connectedCallback() {
        this.importTheme('default');

        this.group = this.getAttribute('group');

        const slot = document.createElement('slot');
        this.shadowRoot?.appendChild(slot);

        let input = this.querySelector('input,select');
        if (!input) {
            input = document.createElement('input');
            input.setAttribute('autocomplete', 'off');
            this.appendChild(input);
        }

        const output = document.createElement('div');
        output.className = 'jinn-zotero-picker-output';
        this.shadowRoot?.appendChild(output);

        let total:number = 0;
        const options = {
            load: (query: string, callback: Function) => {
                if (query.length < 4) {
                    return [];
                }
                fetch(`https://api.zotero.org/groups/${this.group}/items?q=${query}&sort=title&include=data,bib`)
                .then((response) => {
                    if (response.ok) {
                        total = parseInt(response.headers.get('Total-Results') || '0');
                        return response.json();
                    }
                })
                .then((json) => {
                    this._select?.clearOptions();
                    const data:any = [];
                    if (total > 25) {
                        data.push({
                            label: `${total} matching entries. Showing first 25.`,
                            tag: 'note',
                            disabled: true
                        })
                    }
                    json.forEach((entry, n) => {
                        if (entry.data.tags) {
                            const item = {
                                label: entry.bib
                            }
                            if (entry.data.tags.length > 0) {
                                item.tag = entry.data.tags[0].tag;
                            } else {
                                item.tag = `item-${n}`;
                                item.disabled = true;
                            }
                            data.push(item);
                        }
                    });
                    callback(data);
                })
                .catch(()=>{
					callback();
				});
            },
            placeholder: 'Zotero search',
            valueField: 'tag',
            closeAfterSelect: true,
            searchField: [],
            create: false,
            maxItems: 1,
            loadThrottle: 500,
            render: {
                option: (data) => `<div>${data.label}</div>`,
                item: (data) => `<div>${data.tag}</div>`,
            },
            onChange: (value:string) => {
                const label = this._select.getOption(value, true);
                if (label) {
                    output.innerHTML = label.innerHTML;
                }
                if (this._value === value) {
                    return;
                }
                this._value = value;
                this.setAttribute('value', this._value);
                this._select.clearOptions();
                this.dispatchEvent(new CustomEvent('change', {
                    detail: this._value
                }));
            }
        };
        this._select = new TomSelect(input, options);

        this.value = this.getAttribute('value');
    }

    attributeChangedCallback(name: string, oldValue: any, newValue: any) {
        if (!oldValue || oldValue === newValue) {
            return;
        }
        if (name === 'value') {
            this.value = newValue;
        }
    }

    importTheme(theme) {
        const context = this.getRootNode();
        if (context.getElementById('__jinn-zotero-picker-css')) {
            return;
        }
        const themes = resolveURL('../css');
        const link = document.createElement('link');
        link.id = '__jinn-zotero-picker-css';
        link.href = `${themes}/tom-select.${theme}.min.css`;
        link.rel = 'stylesheet';
        if (context.nodeType === Node.DOCUMENT_NODE) {
            document.head.appendChild(link);
        } else {
            context.appendChild(link);
        }
    }
}
window.customElements.define('jinn-zotero-picker', ZoteroPicker);