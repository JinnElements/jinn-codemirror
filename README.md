# Leiden+ Parser

A grammar and parser for Leiden+, based on the lezer parser generator. It also provides a language definition to be used with the codemirror editor.

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
