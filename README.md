# Text Editor Webcomponent

A plain javascript web component based on [codemirror](https://codemirror.net/) with language definitions for XML and Leiden+.

## API

### jinn-codemirror

Source code editor component based on [codemirror](https://codemirror.net/).
Features extended support for XML and Leiden+ code.

#### Properties

| Property    | Type                          | Description                                      |
|-------------|-------------------------------|--------------------------------------------------|
| `content`   | `string`                      | The content edited in the editor as a string.    |
| `mode`      | `string`                      | The mode to use. Currently supported are 'xml', 'leiden_plus', 'edcs', 'phi' or 'default'. |
| `namespace` | `string \| null \| undefined` | Default element namespace to enforce on the root element in<br />XML mode |
| `valid`     | `boolean`                     |                                                  |
| `value`     |                               | The value edited in the editor as either an Element or string -<br />depending on the mode set. |

#### Methods

| Method   | Type         | Description                       |
|----------|--------------|-----------------------------------|
| `focus`  | `(): void`   | Move keyboard focus to the editor |
| `styles` | `(): string` |                                   |

#### Events

| Event     | Description                                      |
|-----------|--------------------------------------------------|
| `invalid` | fired if the content of the editor is invalid (requires a linting to be supported) |
| `update`  | fired when the content of the editor has changed |
| `valid`   | fired if the content of the editor is valid (requires a linting to be supported) |
