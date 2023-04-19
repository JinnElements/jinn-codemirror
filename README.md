<a href="https://www.npmjs.com/package/@jinntec/jinn-codemirror">
<img title="npm (scoped)" src="https://img.shields.io/npm/v/@jinntec/jinn-codemirror">
</a>

# Code Editor Webcomponent

A plain javascript web component based on [codemirror](https://codemirror.net/).

[Demo](https://jinnelements.github.io/jinn-codemirror/)

Features:

* Editing **modes** for: XML, HTML, CSS, TeX, XQuery, Leiden+ and other variants of the Leiden convention
* Configurable **toolbar** with support for snippets
* **Autocomplete** in XML mode based on a JSON representation of the schema
* Commands for **XML editing**: 
  * enclose in element
  * remove enclosing parent
  * select parent
* **Linting** for XML and XQuery
* Support for markup following the **Leiden+ convention**, backed by a grammar
* Conversion between EpiDoc XML fragments and Leiden+

The component comes in 3 flavours:

1. `jinn-codemirror`: the generic code editor webcomponent
2. `jinn-xml-editor`: extends `jinn-codemirror` with the option to specify an outer element which should wrap around the edited content. This is important if you want users to e.g. edit the contents of a `<div>` without seeing the wrapping element. The wrapper will be removed when a value is passed to the editor and added back when serializing the edited content.
3. `jinn-epidoc-editor`: combines an XML Editor with an option to import and convert a transcription following Leiden conventions. Leiden markup is automatically converted to the corresponding EpiDoc XML.

## API

### jinn-codemirror

Source code editor component based on [codemirror](https://codemirror.net/).
Features extended support for XML and Leiden+ code.

#### Attributes

| Attribute | Type     | Description                                      |
|-----------|----------|--------------------------------------------------|
| `code`    | `string` | specifies initial content to be inserted at startup for editing |

#### Properties

| Property      | Attribute     | Type                          | Description                                      |
|---------------|---------------|-------------------------------|--------------------------------------------------|
| `content`     |               | `string`                      | The content edited in the editor as a string.    |
| `linter`      | `linter`      | `string`                      | XQuery mode: the API endpoint to use for linting. |
| `mode`        | `mode`        | `string`                      | The mode to use. Currently supported are 'xml', 'xquery', 'css', 'html', 'tex', 'markdown', 'leiden_plus', 'edcs', 'phi' or 'default'. |
| `namespace`   |               | `string \| null \| undefined` | Default element namespace to enforce on the root element in XML mode |
| `placeholder` | `placeholder` | `string`                      | A placeholder string to be shown if the user has not yet entered anything. |
| `theme`       |               | `string \| null \| undefined` | Editor theme to use. Currently only `dark` is supported. |
| `valid`       |               | `boolean`                     |                                                  |
| `value`       |               |                               | The value edited in the editor as either an Element or string - depending on the mode set. |

#### Methods

| Method            | Type                                     | Description                       |
|-------------------|------------------------------------------|-----------------------------------|
| `clear`           | `(): void`                               |                                   |
| `emitUpdateEvent` | `(content: any): void`                   |                                   |
| `focus`           | `(): void`                               | Move keyboard focus to the editor |
| `setMode`         | `(mode: string, update?: boolean): void` |                                   |
| `styles`          | `(): string`                             |                                   |

#### Events

| Event     | Description                                      |
|-----------|--------------------------------------------------|
| `invalid` | fired if the content of the editor is invalid (requires a linter to be supported) |
| `update`  | fired when the content of the editor has changed |
| `valid`   | fired if the content of the editor is valid (requires a linter to be supported) |

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
| `unwrap`     | `unwrap`      | `string` | false   | If set, expects that a value passed in is a DOM element, which will serve as a wrapper for the content. The wrapper element itself will not be shown in the editor. |

#### Methods

| Method            | Type                     |
|-------------------|--------------------------|
| `configure`       | `(): void`               |
| `emitUpdateEvent` | `(content: string): any` |

### jinn-epidoc-editor

Combines an XML editor with an option to import and convert markup following variants of the Leiden convention.

#### Properties

| Property      | Attribute     | Type                   | Default       | Description                                      |
|---------------|---------------|------------------------|---------------|--------------------------------------------------|
| `mode`        |               | `string`               | "leiden_plus" | Syntax mode to use for the leiden editor, one of leiden_plus, edcs or petrae |
| `modeSelect`  | `mode-select` | `boolean`              | false         | if set, user may choose from the supported syntaxes |
| `placeholder` |               | `string`               | ""            |                                                  |
| `schema`      |               | `string \| null`       | null          | an optional schema description (JSON syntax) to load for the XML editor |
| `schemaRoot`  | `schema-root` | `string`               | null          | determines the root element for autocomplete     |
| `unwrap`      |               | `boolean \| undefined` | false         | If set, expects that a value passed in is a DOM element, which will serve as a wrapper for the content.<br />The wrapper element itself will not be shown in the editor. |
| `valid`       |               | `boolean \| undefined` | true          |                                                  |
| `value`       |               |                        |               | The value edited in the editor as either an Element or string -<br />depending on the mode set. |
| `xmlEditor`   |               |                        | null          |                                                  |

#### Events

| Event     |
|-----------|
| `invalid` |
| `valid`   |
