# Type Generator Internals

The **schema-based generator** (`tasks/generate_schema_types.mjs`)
reads `plot-schema.json` and emits all the schema-derived TypeScript
types into `src/types/generated/schema.d.ts`:

- Common enum aliases (Calendar, Dash, AxisType, PatternShape, XRef, YRef,
  TransitionEasing, PlotType)
- Shared sub-interfaces (Font, ColorBar, HoverLabel, etc.)
- 49 per-trace data interfaces (BarData, ScatterData, IndicatorData, ...)
- Layout component interfaces (LayoutAxis, Legend, Scene, Annotation, etc.)
  and the Layout interface itself
- Animation / frame / edits interfaces (AnimationOpts, Frame, Edits)
- An `_internal` namespace wrapping types whose direct names would mislead
  consumers or are schema-internal helpers

Run via `npm run schema`.

## How it works

`tasks/generate_schema_types.mjs` is called by `tasks/schema.mjs` after
writing `plot-schema.json`. The generator walks `schema.traces`,
`schema.layout.layoutAttributes`, `schema.animation`, `schema.frames`, and
`schema.config.edits`, mapping each attribute's `valType` metadata to a
TypeScript type.

### Phase 0: Common enum discovery

`discoverCommonTypes(schema)` walks the schema looking for enumerated
attributes whose key/path/values match an entry in `COMMON_TYPE_ANCHORS`:

```js
const COMMON_TYPE_ANCHORS = [
    { name: 'Calendar', match: (key) => /^[xyz]?calendar$/.test(key) },
    { name: 'Dash', match: (key) => key === 'dash' },
    { name: 'AxisType', match: (key, path) => key === 'type' && /[xyz]axis\.type$/.test(path) },
    // ...
];
```

When multiple sites match an anchor (e.g. 3D scene axes vs cartesian axes
both have `xaxis.type` enumerations), the generator picks the largest
value set — the superset — so the alias is always permissive enough.
`PlotType` is special-cased: derived from `Object.keys(schema.traces)`
rather than from an attribute.

Each discovered alias is emitted as `export type Name = 'a' | 'b' | ...`
and registered in `VALUES_TO_COMMON_TYPE` so subsequent emission of any
attribute whose `values` array matches an anchor produces a reference
to the alias instead of an inlined literal union.

### Phase 1: Fingerprinting

The generator fingerprints every container subtree across all traces and
layout. Two containers are considered identical when their sorted keys
and leaf `valType`s produce the same fingerprint string.

### Phase 2: Shared interface extraction

Containers that appear at least `MIN_OCCURRENCES` (= 5) times AND have at
least `MIN_PROPERTIES` (= 4) properties become shared interfaces (Font,
ColorBar, HoverLabel, etc.). PascalCase naming is controlled by
`SHARED_NAME_OVERRIDES` so e.g. `colorbar` becomes `ColorBar` rather than
`Colorbar`:

```js
const SHARED_NAME_OVERRIDES = new Map([
    ['colorbar', 'ColorBar'],
    ['hoverlabel', 'HoverLabel'],
    ['tickformatstops', 'TickFormatStops'],
    ['autorangeoptions', 'AutoRangeOptions'],
    ['legendgrouptitle', 'LegendGroupTitle'],
    ['error_y', 'ErrorY'],
    ['error_x', 'ErrorX'],
    ['stream', 'Stream'],
]);
```

Names in `SHARED_NAME_OVERRIDES` bypass `MIN_PROPERTIES`, so small
containers like `Stream` (2 properties) can be opted in as shared.

After fingerprinting completes, the generator **injects** the `transition`
and `frame` subtrees from `schema.animation` as shared types (`Transition`
and `AnimationFrameOpts`). These occur fewer than `MIN_OCCURRENCES` times
so the automatic extractor skips them, but they need to be named for
`AnimationOpts` to reference them cleanly.

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

### Phase 5: Animation, frame, and edits interfaces

`AnimationOpts` is emitted from `schema.animation` (references the
injected `Transition` and `AnimationFrameOpts` shared types). `Frame` is
emitted from `schema.frames.items.frames_entry` with **field overrides**
for the recursively-typed fields the schema describes as `valType: any`:

```js
attrsToProperties(frameEntry, '    ', 'frame', sharedTypes, {
    data: 'any[]',
    layout: 'Partial<Layout>'
});
```

The override mechanism is the `fieldOverrides` param on `attrsToProperties`
— useful for any field whose schema description is too loose because the
schema can't self-reference. `Edits` is emitted from `schema.config.edits`
without overrides (all fields are concrete booleans).

### Phase 6: Internal namespace

Names in `INTERNAL_INTERFACES` are wrapped in `export namespace _internal {
... }` rather than emitted at the top level:

```js
const INTERNAL_INTERFACES = new Set([
    'AutoRangeOptions', 'ErrorY', 'Lighting', 'Line', 'Marker', 'Stream'
]);
```

When emitting a reference to one of these types from outside the namespace
(e.g. `ScatterData.marker?: _internal.Marker`), the generator calls
`refName(name, /*inInternalNamespace=*/false)` which adds the `_internal.`
prefix. Inside the namespace, the same helper returns the bare name so
sibling references stay clean (`Marker.line?: Line`).

This pattern makes the names module-private to consumers: `import {
Marker }` from `plotly.js` fails because `Marker` isn't a top-level
declaration. The names are only reachable via `_internal.Marker` (or via
indexed access on the parent type — `ScatterData['marker']`, which is the
preferred path).

Why a namespace and not just dropping `export`? TypeScript's `.d.ts` file
semantics let non-exported top-level declarations leak through `export *`
re-exports — a long-standing quirk for backwards compatibility with
hand-written DefinitelyTyped declarations. Wrapping the names in a
namespace makes them non-top-level, so the leak doesn't apply.

### JSDoc descriptions and metadata

`formatJSDoc(attr, indent)` emits a multi-line JSDoc block for each leaf
attribute. The block contains the schema's `description` plus `@default`,
numeric bounds (`min`/`max`), and any `impliedEdits` lines when present.
Containers (no `valType`) only carry a description, so the metadata
branches no-op. Plotly's `*emphasis*` markers are preserved as-is (they
render as italics in IDE hover tooltips). Any `*/` sequences in
descriptions are escaped to prevent prematurely closing the comment.

### Output structure

```
src/types/generated/schema.d.ts
├── import { Color, ColorScale, Datum, MarkerSymbol, TypedArray } from '../lib/common'
├── Common enum types (Calendar, Dash, AxisType, PatternShape, XRef, YRef,
│                      TransitionEasing, PlotType)
├── Shared interfaces — public (Font, FontArray, ColorBar, HoverLabel, Domain,
│                                Pattern, TickFormatStops, LegendGroupTitle, ...)
├── Internal shared interfaces in `namespace _internal` (Marker, Line,
│                                                        AutoRangeOptions,
│                                                        Lighting, Stream, ErrorY)
├── Trace interfaces (ScatterData, BarData, ... — 49 traces)
├── Layout component interfaces (LayoutAxis, Legend, Scene, Annotation, etc.)
├── Layout interface
└── Animation / frames / config (AnimationOpts, Frame, Edits)
```

Regenerate with `npm run schema`.

## valType → TypeScript mapping

Summary:

| valType | TS produced |
|---|---|
| `data_array` | `Datum[] \| TypedArray` |
| `number`, `integer` | `number` (with `extras` appended as literals; `number \| 'auto'` style) |
| `string` | literal union if `values` provided; matches a common-enum alias when applicable; otherwise `string` |
| `boolean` | `boolean` |
| `color` | `Color` |
| `colorscale` | `ColorScale` |
| `colorlist` | `Color[]` |
| `angle` | `number \| 'auto'` |
| `subplotid` | `string` |
| `enumerated` | literal union of `values`; matches a common-enum alias when applicable |
| `flaglist` | union of flags + extras + `(string & {})` to allow `+`-joined combinations while preserving autocomplete |
| `info_array` | tuple of element `valType`s when fixed-length; `T[]` when `freeLength`; `any[]` fallback |
| `any` | `any` |

`arrayOk: true` wraps the result in `T | T[]`.

Attribute name overrides via `ATTR_NAME_OVERRIDES` map specific attribute
paths to a type alias regardless of valType (e.g. `marker.symbol` →
`MarkerSymbol`).

Reserved keys stripped from the output: `editType`, `role`, `description`,
`impliedEdits`, `_isSubplotObj`, `_isLinkedToArray`, `_arrayAttrRegexps`,
`_deprecated`.

## Extending the schema generator

### Adding a new common enum alias (Calendar/Dash style)

If the schema repeats the same enumerated value-set in multiple places and
you want a named alias for it:

1. Add an entry to `COMMON_TYPE_ANCHORS` with a `name` and a
   `match(key, path, values)` predicate that uniquely identifies the
   anchor attribute. The discovery walker picks the largest matching
   value set as the canonical alias body.
2. Run `npm run schema`. The generator emits `export type <Name> = ...`
   and rewrites matching enumerated attributes to reference the alias.
3. Run `npm run typecheck` to verify.

`PlotType` is a special case derived from `Object.keys(schema.traces)`
rather than from an enumerated attribute; it doesn't follow the anchor
mechanism.

### Adding a new layout container

If a new subplot type or array container is added to the schema:

1. Add an entry to `LAYOUT_CONTAINER_NAMES` (for subplots marked
   `_isSubplotObj`) or `LAYOUT_ARRAY_NAMES` (for linked-to-array
   containers).
2. Run `npm run schema` to regenerate.
3. Run `npm run typecheck` to ensure no regressions.

### Hiding a type inside `_internal`

Add the name to `INTERNAL_INTERFACES`. The generator will wrap it in the
`_internal` namespace and rewrite all external references to the
`_internal.X` form. Use this when:

- The name would mislead consumers (it's only one trace's variant, or the
  semantics don't match the bare name).
- The type is a schema-internal helper that consumers rarely construct
  directly.
- A hand-written type supersedes it (e.g. `ErrorY` is hidden because
  `ErrorBar` is the preferred public type).

### Adding a field override

If a schema attribute is `valType: 'any'` because it's recursively
self-referential (e.g. `Frame.data` is "the same shape as the trace
data"), pass a `fieldOverrides` map to `attrsToProperties`:

```js
attrsToProperties(frameEntry, '    ', 'frame', sharedTypes, {
    data: 'any[]',
    layout: 'Partial<Layout>'
});
```

The override bypasses the schema-derived type for those field names. Use
this sparingly — when the schema CAN be improved at the source (in the
JS attribute file), prefer that.

### Improving flaglist support

Flag lists like `hoverinfo` currently emit a union with `(string & {})`
to allow flag combinations while preserving autocomplete for individual
flags. A fully combinatorial union (`'x' | 'x+y' | 'x+y+text' | ...`)
would produce huge types — 15+ members for `hoverinfo` — and slow down
type checking. Not implemented today; consider whether the autocomplete
win is worth the cost before changing this.

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

`lib/index.d.ts` uses `export type * from '../src/types/generated/schema'`,
so every top-level exported type from `schema.d.ts` is automatically
re-exported to consumers. Types inside the `_internal` namespace are still
reachable via `_internal.X` (the namespace itself is exported by the
wildcard) but their bare names are not.

`tasks/schema.mjs` short-circuits its per-name re-export verification
when the wildcard is detected. If you ever replace the wildcard with an
explicit allowlist, the per-name check runs and warns about any
exported-but-not-re-exported types.

## CI integration

`npm run schema-typegen-diff-check` runs the generator and then verifies that
both `test/plot-schema.json` and `src/types/generated/` are unchanged via
`git diff --exit-code`. If either differs, exit code 1 — meaning either a
developer changed the source schema but didn't commit the regenerated
artifacts, or an attribute-file conversion silently altered the runtime
schema and the change wasn't intentionally committed.

This is what makes the JS-to-TS conversion workflow safe: a correct
conversion produces a byte-identical schema, so the check passes; an
incorrect conversion (typo in a `values` array, missed default, wrong
`valType`) changes the schema and CI fails until the developer fixes the
source or commits a deliberate change.
