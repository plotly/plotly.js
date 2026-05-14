# Type Generator Internals

The **schema-based generator** (`tasks/generate_schema_types.mjs`)
reads `plot-schema.json` and emits all 49 trace data interfaces,
layout component interfaces, the Layout interface, and shared
sub-interfaces into `src/types/generated/schema.d.ts`.
Run via `npm run schema`.

## How it works

`tasks/generate_schema_types.mjs` is called by `tasks/schema.mjs` after
writing `plot-schema.json`. It walks both `schema.traces` and
`schema.layout.layoutAttributes`, mapping each attribute's `valType`
metadata to TypeScript types.

### Phase 1: Fingerprinting

The generator fingerprints every container subtree across **all traces
and layout** simultaneously. Two containers are considered identical when
their sorted keys and leaf `valType`s produce the same fingerprint string.
Containers that appear in 2+ locations become shared interfaces (Font,
ColorBar, HoverLabel, etc.).

### Phase 2: Shared interface extraction

Shared containers are extracted as named interfaces. The generator uses
override maps to ensure correct PascalCase naming:

```js
const SHARED_NAME_OVERRIDES = new Map([
    ['colorbar', 'ColorBar'],
    ['hoverlabel', 'HoverLabel'],
    ['tickformatstops', 'TickFormatStops'],
    ['stream', 'Stream'],
    // ...
]);
```

Containers listed in `SHARED_NAME_OVERRIDES` bypass the `MIN_PROPERTIES`
threshold, so small containers like `Stream` (2 properties, 49 occurrences)
can be explicitly opted in as shared interfaces.

### Phase 3: Trace interfaces

Each trace gets an interface (`ScatterData`, `BarData`, etc.) whose
properties reference shared types where fingerprints match.

### Phase 4: Layout types

Layout generation handles three categories:

- **Subplot containers** (`_isSubplotObj` flag) — grouped by target name
  and merged into supersets. E.g., `xaxis` and `yaxis` both map to
  `LayoutAxis` with the union of all their keys.
- **Linked-to-array containers** (detected via `{items: {name: {...}}}`)
  — extracted as named interfaces (Annotation, Shape, Slider, etc.).
  In the Layout interface they appear as arrays: `annotations?: Annotation[]`.
- **Regular containers** — inlined or referenced as shared types.

The Layout interface includes subplot index signatures:
```ts
[key: `xaxis${number}`]: LayoutAxis;
[key: `yaxis${number}`]: LayoutAxis;
// etc.
```

### JSDoc descriptions

Every property with a `description` field in the schema gets a single-line
JSDoc comment in the output. Plotly's `*emphasis*` markers are preserved
as-is (they render as italics in IDE hover tooltips). Any `*/` sequences
in descriptions are escaped to prevent prematurely closing the comment.

### Output structure

```
src/types/generated/schema.d.ts
├── Shared interfaces (Font, FontArray, ColorBar, HoverLabel, etc.)
├── Trace interfaces (ScatterData, BarData, ... — 49 traces)
├── Layout component interfaces (LayoutAxis, Legend, Scene, Annotation, etc.)
└── Layout interface (references all of the above)
```

Regenerate with `npm run schema`.

## valType → TypeScript mapping

Summary:

| valType | TS produced |
|---|---|
| `data_array` | `Datum[] \| TypedArray` |
| `number`, `integer` | `number` (or `number \| number[]` if `arrayOk`) |
| `string` | `string`, narrowed to `values[number]` if `values` provided |
| `boolean` | `boolean` |
| `color` | `Color` |
| `colorscale` | `ColorScale` |
| `colorlist` | `Color[]` |
| `angle` | `number \| 'auto'` |
| `subplotid` | `string` |
| `enumerated` | `values[number]` (literal union) |
| `flaglist` | `string` (combinatorial expansion not yet implemented) |
| `info_array` | `unknown[]` |
| `any` | `any` |

`arrayOk: true` wraps the result in `T | T[]`.

Reserved keys stripped from the output: `editType`, `role`,
`_isLinkedToArray`, `_isSubplotObj`, `_arrayAttrRegexps`, `_deprecated`.

## Extending the schema generator

### Adding a new layout container

If a new subplot type or array container is added to the schema:

1. Add an entry to `LAYOUT_CONTAINER_NAMES` (for subplots) or
   `LAYOUT_ARRAY_NAMES` (for linked-to-array containers) in
   `generate_schema_types.mjs`
2. Run `npm run schema` to regenerate
3. Run `npm run typecheck` to ensure no regressions

### Improving flaglist support

Currently flag lists like `hoverinfo` map to `string`. To produce a
combinatorial union of valid `+`-joined combinations:

```ts
type Combinations<T extends readonly string[]> = ... // template literal magic
```

This is doable but produces large unions (15+ members for `hoverinfo`).
Consider whether the type-check cost is worth the autocomplete win.

## Debugging

If the schema generator emits unexpected types:

```bash
npm run schema    # regenerate and inspect schema.d.ts
npm run typecheck # see what tsc thinks
```

Inspect the schema directly:

```js
const s = require("test/plot-schema.json");
console.log(s.layout.layoutAttributes.xaxis);  // inspect layout attrs
console.log(s.traces.scatter.attributes);       // inspect trace attrs
```

## Public API re-export check

After generation, `tasks/schema.mjs` compares the exported interface
names against `lib/index.d.ts`. Any generated type not re-exported
triggers a warning in the console output. Types that are intentionally
internal-only are listed in `PUBLIC_API_EXEMPTIONS` and shown separately
as exempted rather than warned about.

## CI integration

`npm run schema-typegen-diff-check` runs the generator and then verifies the output
hasn't drifted via `git diff --exit-code`. If the working tree differs,
exit code 1 — meaning a developer changed the schema but didn't commit
the regenerated declarations.
