# Converting Attribute Files to TypeScript

This is the **active workflow** for migrating Plotly's `attributes.js` files
to TypeScript. Attribute files are the source of truth for the runtime
schema; the schema in turn drives the generated public TypeScript types.
Conversion doesn't change that chain — it adds compile-time validation on
top of it.

## Why

Without `as const satisfies AttributeMap`, malformed attribute objects
(missing `valType`, typo'd `values` arrays, wrong `dflt` shape, etc.) only
fail when the runtime tries to use them. Converted attribute files catch
those structural mistakes at TypeScript-compile time, before they ever
reach the schema.

Conversion is also a small step toward typing the rest of the file (and
eventually the rest of the source tree) in TypeScript, but the immediate
value is the compile-time structural check.

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
npm run typecheck                      # zero errors
npm run schema-typegen-diff-check      # regen + check test/plot-schema.json
                                       # and src/types/generated/ are unchanged
```

The `schema-typegen-diff-check` script regenerates both the runtime schema
and the generated `.d.ts`, then `git diff --exit-code`s them. A correct
conversion produces a byte-identical schema; CI fails otherwise. This is
the conversion's safety net — if either file diffs after the conversion,
the attribute object's runtime shape changed (most often a missed
`as const` or a typo). Compare character-by-character with the original
`.js` file.

### 7. Commit

```bash
git add src/<path>/attributes.ts \
        src/<path>/index.js src/<path>/defaults.js  # (whichever consumers you updated)
git commit -m "Convert <component> attributes to TypeScript"
```

The conversion is a single self-contained commit per file. There's
nothing to commit under `src/types/` for a correct conversion — the
generated types are byte-identical (which is exactly what
`schema-typegen-diff-check` confirmed in step 6).

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
- **Utility types** (`Color`, `Datum`, `TypedArray`, `MarkerSymbol`, etc.) —
  these are the primitives the generator's emitted types reference.

If you find yourself converting one of these, stop and ask.

## What if I need a type the schema doesn't describe well?

The schema-generated types are authoritative for everything in
`plot-schema.json`. If something is missing or too loose:

1. **Compare**. Look at the schema-generated type in `schema.d.ts`.
2. **If schema is too loose** (e.g. `string` where the schema should have
   a typed union of valid values, or `any` where a proper shape could be
   described), fix it at the JS attribute source so every language port
   benefits — not via a generator-side override.
3. **If the field is an internal runtime artifact** (not in the user-facing
   schema), add it to the appropriate `.internal.d.ts` file. For trace
   internal fields, that's `FullDataInternals` inside
   `core/data.internal.d.ts` (which `FullData` intersects with `Data`).
   For layout internal fields, it's `FullLayout` in `layout.internal.d.ts`.
4. **If the schema has fields and a generator-side override is the only
   path** (e.g. recursive references like `Frame.data` pointing back to the
   trace-data union), use the `fieldOverrides` parameter on
   `attrsToProperties` in the generator. See GENERATOR.md.

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
Each conversion is self-contained within one component's directory plus
its direct `require()`-callers, so merge conflicts are rare.
