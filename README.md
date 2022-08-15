# Text Editor Webcomponent

A plain javascript web component based on [codemirror](https://codemirror.net/) with language definitions for XML and Leiden+.

[Demo](https://jinnelements.github.io/jinn-codemirror/)

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

| Method            | Type                   | Description                       |
|-------------------|------------------------|-----------------------------------|
| `emitUpdateEvent` | `(content: any): void` |                                   |
| `focus`           | `(): void`             | Move keyboard focus to the editor |
| `styles`          | `(): string`           |                                   |

#### Events

| Event     | Description                                      |
|-----------|--------------------------------------------------|
| `invalid` | fired if the content of the editor is invalid (requires a linting to be supported) |
| `update`  | fired when the content of the editor has changed |
| `valid`   | fired if the content of the editor is valid (requires a linting to be supported) |

### jinn-xml-editor

Extends jinn-codemirror for XML editing: adds a boolean property "unwrap" to
indicate if the entire root node passed in as value should be edited or just its
content. Setting the property requires that a DOM element is passed via value.

#### Attributes

| Attribute         | Type      | Description                                      |
|-------------------|-----------|--------------------------------------------------|
| `check-namespace` | `boolean` | if enabled, a missing namespace will be reported as error |
| `wrapper`         | `String`  | an XML fragment to specify an element which will be used as container |

#### Properties

| Property | Type              | Default | Description                                      |
|----------|-------------------|---------|--------------------------------------------------|
| `unwrap` | `boolean \| null` | false   | Set to indicate that the content of the node should be edited rather<br />than the root node itself. |

#### Methods

| Method      | Type       |
|-------------|------------|
| `configure` | `(): void` |

### jinn-epidoc-editor

#### Properties

| Property    | Type                   | Default | Description                                      |
|-------------|------------------------|---------|--------------------------------------------------|
| `valid`     | `boolean \| undefined` | true    |                                                  |
| `value`     |                        |         | The value edited in the editor as either an Element or string -<br />depending on the mode set. |
| `xmlEditor` |                        | null    |                                                  |

#### Events

| Event    |
|----------|
| `update` |
