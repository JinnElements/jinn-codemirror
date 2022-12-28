# Text Editor Webcomponent

A plain javascript web component based on [codemirror](https://codemirror.net/) with language definitions for XML and Leiden+.

[Demo](https://jinnelements.github.io/jinn-codemirror/)

Features:

    * Configurable toolbar with support for snippets
    * Autocomplete based on a JSON representation of the schema (currently TEI only)
    * Commands for XML editing: 
      * enclose in element
      * remove enclosing parent
      * select parent
      
## API

### jinn-codemirror

Source code editor component based on [codemirror](https://codemirror.net/).
Features extended support for XML and Leiden+ code.

#### Properties

| Property    | Type                          | Description                                      |
|-------------|-------------------------------|--------------------------------------------------|
| `content`   | `string`                      | The content edited in the editor as a string.    |
| `linter`    | `string \| null \| undefined` | XQuery mode: the API endpoint to use for linting. |
| `mode`      | `string`                      | The mode to use. Currently supported are 'xml', 'leiden_plus', 'edcs', 'phi' or 'default'. |
| `namespace` | `string \| null \| undefined` | Default element namespace to enforce on the root element in<br />XML mode |
| `valid`     | `boolean`                     |                                                  |
| `value`     |                               | The value edited in the editor as either an Element or string -<br />depending on the mode set. |

#### Methods

| Method            | Type                                     | Description                       |
|-------------------|------------------------------------------|-----------------------------------|
| `emitUpdateEvent` | `(content: any): void`                   |                                   |
| `focus`           | `(): void`                               | Move keyboard focus to the editor |
| `setMode`         | `(mode: string, update?: boolean): void` |                                   |
| `styles`          | `(): string`                             |                                   |

#### Events

| Event     | Description                                      |
|-----------|--------------------------------------------------|
| `invalid` | fired if the content of the editor is invalid (requires a linting to be supported) |
| `update`  | fired when the content of the editor has changed |
| `valid`   | fired if the content of the editor is valid (requires a linting to be supported) |

#### Slots

| Name      | Description         |
|-----------|---------------------|
| `toolbar` | toolbar to be shown |

### jinn-xml-editor

Extends jinn-codemirror for XML editing: adds a boolean property "unwrap" to
indicate if the entire root node passed in as value should be edited or just its
content. Setting the property requires that a DOM element is passed via value.

#### Attributes

| Attribute         | Type      | Description                                      |
|-------------------|-----------|--------------------------------------------------|
| `check-namespace` | `boolean` | if enabled, a missing namespace will be reported as error |

#### Properties

| Property     | Attribute     | Type     | Default | Description                                      |
|--------------|---------------|----------|---------|--------------------------------------------------|
| `schema`     | `schema`      | `string` | null    | Schema to load for autocompletion.               |
| `schemaRoot` | `schema-root` | `string` | null    | Determines the root element to be used for autocomplete. |
| `unwrap`     | `unwrap`      | `string` | false   | If set, expects that a value passed in is a DOM element, which will serve as a wrapper for the content.<br />The wrapper element itself will not be shown in the editor. |

#### Methods

| Method            | Type                     |
|-------------------|--------------------------|
| `configure`       | `(): void`               |
| `emitUpdateEvent` | `(content: string): any` |

### jinn-epidoc-editor

Combines an XML editor with an option to import and convert markup following variants of the Leiden convention.

#### Properties

| Property     | Attribute     | Type                   | Default       | Description                                      |
|--------------|---------------|------------------------|---------------|--------------------------------------------------|
| `mode`       |               | `string`               | "leiden_plus" | Syntax mode to use for the leiden editor, one of leiden_plus, edcs or petrae |
| `modeSelect` | `mode-select` | `boolean`              | false         | if set, user may choose from the supported syntaxes |
| `schema`     |               | `string \| null`       | null          | an optional schema description (JSON syntax) to load for the XML editor |
| `schemaRoot` | `schema-root` | `string`               | null          | determines the root element for autocomplete     |
| `unwrap`     |               | `boolean \| undefined` | false         | If set, expects that a value passed in is a DOM element, which will serve as a wrapper for the content.<br />The wrapper element itself will not be shown in the editor. |
| `valid`      |               | `boolean \| undefined` | true          |                                                  |
| `value`      |               |                        |               | The value edited in the editor as either an Element or string -<br />depending on the mode set. |
| `xmlEditor`  |               |                        | null          |                                                  |

#### Events

| Event     |
|-----------|
| `invalid` |
| `valid`   |
