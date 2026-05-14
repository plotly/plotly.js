# Converting Attribute Files to TypeScript

This is the **active workflow** for migrating Plotly's `attributes.js` files
to TypeScript. Each conversion turns one attribute file into the single
source of truth for both the runtime schema and the public TypeScript type.

## Why

Today, attribute metadata lives in `src/.../attributes.js` files and the
matching TypeScript types live separately in `src/types/`. They drift.

After conversion, the `attributes.ts` file is validated against `AttributeMap`
at compile time, catching structural errors and typos before they reach the
runtime schema.

## Recipe

Pick any `attributes.js` file. The recipe is the same for every one. A
small file takes ~10 minutes; a complex trace might take an hour.

### 1. Rename and stub the imports

Rename `src/<path>/attributes.js` → `src/<path>/attributes.ts`.

At the top of the file, add:

```ts
import type { AttributeMap } from '../../types/lib/attributes';
// (adjust the relative path so it points at src/types/lib/attributes)
```

### 2. Convert the export

Replace `module.exports = { ... };` with:

```ts
const attributes = {
    // ... existing attribute definitions go here
} as const satisfies AttributeMap;

export default attributes;
```

Two things to notice:

- **`as const satisfies AttributeMap`** — `as const` preserves literal types
  like `values: ['v', 'h']`; `satisfies AttributeMap` validates structure
  without widening.
- **`export default`** — runtime consumers (`require('./attributes').default`)
  get the object.

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

### 5. Verify the schema generator covers the type

Consumer-facing types for traces and layout components are generated from
`plot-schema.json` by `tasks/generate_schema_types.mjs`. After converting
an `attributes.ts` file, verify the corresponding type already exists in
`src/types/generated/schema.d.ts`. If it does, no further action is needed
for the type — the conversion's main value is type-checking the source.

If the schema-generated type is missing properties that the hand-written
type had, those properties are likely runtime-only internal state and
should be added to the corresponding `Full*` interface instead.

### 6. Verify

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

### 7. Commit

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
  (with `as const satisfies AttributeMap`)
- `.default` added to `require('./attributes')` in `index.js` and `defaults.js`

Note: Consumer-facing types for modebar (and all other layout components)
are now generated from `plot-schema.json` by `tasks/generate_schema_types.mjs`,
not from the individual `attributes.ts` files. The `attributes.ts` conversion
still adds value by type-checking the source attribute definitions against
`AttributeMap`.

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

1. **Compare**. Look at the schema-generated type in `schema.d.ts` next to
   the hand-written one.
2. **If schema is too loose** (e.g. `string` where the hand-written type had
   a typed union of valid values), check whether the schema's `values` array
   could be expanded. The schema is the authoritative truth — fix it there.
3. **If the hand-written type had additional fields** not in the schema,
   they're probably internal/runtime-only and should stay hand-written
   (add them to the corresponding `.internal.d.ts` file, e.g. `FullLayout`
   in `layout.internal.d.ts`).
4. **If the schema has fields the hand-written type lacked**, that's a free
   coverage win — accept the generated type.

## Schema-generated types

All 49 trace data interfaces, layout component interfaces, and the Layout
interface itself are generated from `plot-schema.json` by
`tasks/generate_schema_types.mjs` (run via `npm run schema`). Individual
trace and layout `attributes.js` files do **not** need to be converted
for their types to appear in the public API — the schema generator
covers them automatically.

Converting an `attributes.js` file to TypeScript is still valuable because
it type-checks the source definitions against `AttributeMap`, catching
typos and structural errors at compile time.

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

### Tier 2: medium components
- Sliders, updatemenus, rangeselector, colorbar attribute files

### Tier 3: layout
- Layout itself

## Working in parallel

Multiple converters can work on different attribute files in parallel.
Merge conflicts are rare and limited to the hand-written type files when
removing types — manual conflict if two converters touch the same file.
