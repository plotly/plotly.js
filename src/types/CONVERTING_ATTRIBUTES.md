# Converting Attribute Files to TypeScript

This is the **active workflow** for migrating Plotly's `attributes.js` files
to TypeScript. Each conversion turns one attribute file into the single
source of truth for both the runtime schema and the public TypeScript type.

## Why

Today, attribute metadata lives in `src/.../attributes.js` files and the
matching TypeScript types live separately in `src/types/`. They drift.

After conversion, the `attributes.ts` file IS the schema, and the TypeScript
type is *derived from it* via a mapped type. Both agree by construction.

## Recipe

Pick any `attributes.js` file. The recipe is the same for every one. A
small file takes ~10 minutes; a complex trace might take an hour.

### 1. Rename and stub the imports

Rename `src/<path>/attributes.js` → `src/<path>/attributes.ts`.

At the top of the file, add:

```ts
'use strict';

import type { AttributeMap, AttrsToType } from '../../types/lib/attributes';
// (adjust the relative path so it points at src/types/lib/attributes)
```

### 2. Convert the export

Replace `module.exports = { ... };` with:

```ts
/**
 * @generates ModeBar
 */
const attributes = {
    // ... existing attribute definitions go here
} as const satisfies AttributeMap;

export type ModeBarAttributes = AttrsToType<typeof attributes>;

export default attributes;
```

Three things to notice:

- **`@generates ModeBar`** — declares the canonical public type name. The
  `.d.ts` generator uses this to name the output.
- **`as const satisfies AttributeMap`** — `as const` preserves literal types
  like `values: ['v', 'h']`; `satisfies AttributeMap` validates structure
  without widening.
- **`export default`** — runtime consumers (`require('./attributes').default`)
  get the object. Co-existing `export type` exposes the derived TS type.

### 3. Fix array literals and string literals

Anywhere an attribute uses a literal-array of options, add `as const`:

```ts
// Before
values: ['v', 'h'],

// After
values: ['v', 'h'] as const,
```

Without this, TypeScript widens to `string[]` and you lose the union.

### 4. Update consumers' `require()` calls

Find every JS file that `require('./attributes')` (relative to the converted
file) and update to `.default`:

```js
// Before
var attributes = require('./attributes');

// After
var attributes = require('./attributes').default;
```

ESBuild handles the runtime; this update is just for the JS-level CommonJS
interop pattern the project already uses for converted files.

### 5. Run the type generator

```bash
npm run gen:types
```

This walks all `attributes.ts` files, resolves their derived types via the
TypeScript Compiler API, writes flattened declaration files into
`src/types/generated/`, and formats the output with biome (so single
quotes, line widths, and other style choices match the rest of the
codebase).

### 6. Replace the hand-written type in `src/types/`

Find the corresponding hand-written type (likely in
`src/types/core/layout.d.ts`, `src/types/core/data.d.ts`, or a component
file). Replace its `interface` or `type` definition with a re-export:

```ts
// Before
export interface ModeBar {
    activecolor: Color;
    add: ModeBarDefaultButtons | ModeBarDefaultButtons[];
    // ...
}

// After
// `ModeBar` is generated from src/components/modebar/attributes.ts.
export type { ModeBar } from '../generated/components/modebar';
```

If the hand-written type was richer than the schema (e.g. used a narrowed
union where the schema says `string`), document the gap in a comment or
file an issue. Do not silently lose ergonomics — either improve the schema
(add `values: [...]`) or layer a hand-written refinement on top.

### 7. Verify

```bash
npm run typecheck         # zero errors
npm run schema            # schema regenerates clean
git diff test/plot-schema.json
                          # the relevant section should be byte-identical
                          # to before the conversion
```

If the schema diff is non-empty, the attribute object's runtime shape
changed somewhere — most often a missed `as const` or a typo. Compare
character-by-character with the original `.js` file.

### 8. Commit

```bash
git add src/<path>/attributes.ts \
        src/<path>/index.js src/<path>/defaults.js  # (whichever consumers you updated) \
        src/types/core/<file>.d.ts \
        src/types/generated/
git commit -m "Convert <component> attributes to TypeScript"
```

The conversion is a single self-contained commit per file.

## Worked example: modebar

See [`src/components/modebar/attributes.ts`](../components/modebar/attributes.ts)
for the canonical example. The full conversion changed:

- `src/components/modebar/attributes.js` → `src/components/modebar/attributes.ts`
  (with `as const satisfies AttributeMap` and `@generates ModeBar`)
- `.default` added to `require('./attributes')` in `index.js` and `defaults.js`
- The hand-written `ModeBar` interface in `src/types/core/layout.d.ts` was
  removed and replaced with
  `export type { ModeBar } from '../generated/components/modebar';`

Schema output verified byte-identical (2547 bytes) before and after the
conversion.

## What stays hand-written

The schema does not describe these — they remain in `src/types/`:

- **Events** (`PlotMouseEvent`, `LegendClickEvent`, etc.)
- **Public API function signatures** (`Plotly.newPlot`, `relayout`, ...)
- **Internal types** (`FullLayout._modules`, `GraphDiv._fullData`, ...)
- **Utility types** the mapped type bottoms out on (`Color`, `Datum`,
  `TypedArray`, `MarkerSymbol`, ...)

If you find yourself converting one of these, stop and ask.

## What if my type doesn't match the hand-written one?

Almost certainly the hand-written one was wrong, narrowed for ergonomics, or
based on an older schema. Order of operations:

1. **Compare**. Print both: `npm run gen:types`, then look at the generated
   `.d.ts` next to the hand-written one.
2. **If schema is too loose** (e.g. `string` where the hand-written type had
   a typed union of valid values), check whether the schema's `values` array
   could be expanded. The schema is the authoritative truth — fix it there.
3. **If the hand-written type had additional fields** not in the schema,
   they're probably internal/runtime-only and should stay hand-written
   (move them to a separate `*Internal.d.ts` file or a parallel interface).
4. **If the schema has fields the hand-written type lacked**, that's a free
   coverage win — accept the generated type.

## Order of conversion (for parallel work)

Pick from this priority list. Lower-numbered items are smaller / simpler.

### Tier 1: small components (good first conversions)
- `src/components/modebar/attributes.js` — **DONE** (canonical example)
- `src/components/rangeslider/attributes.js` — small, self-contained
- `src/plots/gl3d/layout/attributes.js` — tiny (one `subplotid`)
- `src/plots/cartesian/attributes.js` — small
- `src/components/fx/attributes.js` — uses helpers (`fontAttrs`, shared sub-objects)

> Note: `src/components/color/attributes.js` is named like an attribute file
> but actually just exports color constants. It doesn't follow the schema
> pattern and shouldn't be converted with this recipe.

### Tier 2: small traces
- `src/traces/scatterpolargl/attributes.js`
- `src/traces/histogram2dcontour/attributes.js`
- `src/traces/candlestick/attributes.js`
- `src/traces/funnelarea/attributes.js`
- `src/traces/barpolar/attributes.js`

### Tier 3: medium components and traces
- Sliders, updatemenus, rangeselector, colorbar attribute files
- `scatter3d`, `scattergl`, `surface`, `mesh3d`

### Tier 4: large traces
- `scatter` (the big one — many modes and shared subobjects)
- `bar`, `histogram`, `box`, `violin`
- Layout itself

### Tier 5: shared subobject attributes
- `font_attributes`, `hover_label_attributes`, etc.
- These are imported by many trace files; conversion needs care so the
  imported types remain compatible.

## Working in parallel

Multiple converters can work on different attribute files in parallel. The
generator is idempotent — every run produces the same output for the same
inputs — so merge conflicts are rare and limited to:

- `src/types/generated/index.d.ts` (the aggregator) — auto-resolved by
  rerunning `npm run gen:types` after merge
- The hand-written type files when removing types — manual conflict if two
  converters touch the same file

Coordinate: claim a file in PR description before starting. Use Tier 1
files for first-time converters to learn the recipe; reserve Tier 4 for
experienced contributors.
