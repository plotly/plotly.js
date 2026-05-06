# Type Generator Internals

`tasks/generate_types.mjs` walks `src/**/attributes.ts` files and emits
flat `.d.ts` declarations into `src/types/generated/`. This document
describes how it works for maintainers who want to extend or debug it.

## Pipeline

```
1. Discover    find all src/**/attributes.ts files
2. Parse       create a TS Program with the project's tsconfig
3. Extract     for each file, find `export type *Attributes = ...`
4. Resolve     use TypeChecker to compute the concrete type
5. Print       use ts.createPrinter to render members
6. Rewrite     turn absolute import("...") paths into relative
7. Hoist       inline import("...").Name → top-of-file `import type`
8. Decide      object-literal type → `interface`, otherwise `type` alias
9. Emit        write per-file .d.ts files + an aggregator index
10. Format     `biome format --write` (chained from npm script, not the script itself)
```

## Key TypeScript Compiler API calls

The trick to flattening a mapped type like `AttrsToType<typeof attributes>`
is to convert the resolved `Type` back to a `TypeNode` (an AST node), then
print that node:

```js
const sym = checker.getSymbolAtLocation(typeAliasDecl.name);
const type = checker.getDeclaredTypeOfSymbol(sym);

const typeNode = checker.typeToTypeNode(type, typeAliasDecl, nodeBuilderFlags);
const text = printer.printNode(ts.EmitHint.Unspecified, typeNode, dummySourceFile);
```

Without `typeToTypeNode`, you'd get `checker.typeToString` output which is
single-line and harder to format.

## Node builder flags

```js
ts.NodeBuilderFlags.NoTruncation
| ts.NodeBuilderFlags.MultilineObjectLiterals
| ts.NodeBuilderFlags.WriteClassExpressionAsTypeLiteral
| ts.NodeBuilderFlags.UseFullyQualifiedType
| ts.NodeBuilderFlags.InTypeAlias
```

- **NoTruncation** — print full union/intersection without `...` ellipsis
- **MultilineObjectLiterals** — one property per line
- **UseFullyQualifiedType** — emit `import("/abs/path").TypeName` for
  external references, which we then rewrite to relative paths
- **InTypeAlias** — render as if writing a type alias body

## The `@generates` marker

Each `attributes.ts` declares its canonical public type name via JSDoc:

```ts
/**
 * @generates ModeBar
 */
const attributes = { ... } as const satisfies AttributeMap;
export type ModeBarAttributes = AttrsToType<typeof attributes>;
```

The generator regex-greps each source file for `@generates X` and uses `X`
as the canonical name. This lets the generated type take a different name
from the local `*Attributes` alias, which matters because the public API
type names (`ModeBar`, `Slider`, `Layout`) follow a different convention
than the per-attribute-file naming.

## Import path rewriting

`UseFullyQualifiedType` produces output like
`import("/abs/path/src/types/lib/common").Color`. The generator rewrites
these to relative paths from the output file's directory:

```js
text = text.replace(/import\("([^"]+)"\)/g, (_, absPath) => {
    let rel = path.relative(outputDir, absPath);
    if (!rel.startsWith('.')) rel = './' + rel;
    rel = rel.replace(/\.d\.ts$|\.ts$/, '');
    return `import("${rel}")`;
});
```

Result: `import("../../lib/common").Color` — portable across machines.

## Import hoisting

Inline `import("path").Name` references are valid TypeScript but read
poorly. After path rewriting, the generator collects every reference and
emits a single `import type` block at the top of the file:

```ts
// Before hoisting (TS Compiler default):
export interface ModeBar {
    bgcolor?: import("../../lib/common").Color;
    color?: import("../../lib/common").Color;
}

// After hoisting:
import type { Color } from '../../lib/common';

export interface ModeBar {
    bgcolor?: Color;
    color?: Color;
}
```

The hoister deduplicates names, groups by path, and sorts alphabetically
within each import statement. A self-reference (where the imported name
matches the type being declared) is left as inline `import("...")` to
avoid colliding with the local declaration.

## interface vs type alias

When the resolved type is an object shape (`TypeLiteralNode`), the
generator emits an `interface`:

```ts
export interface ModeBar { ... }
```

For unions, intersections, tuples, or primitives — anything that isn't
an object literal — it falls back to a `type` alias:

```ts
export type ScatterMode = 'lines' | 'markers' | 'lines+markers';
```

Interfaces give better error messages, support declaration merging, and
match the project's hand-written types. The discrimination happens via
`ts.isTypeLiteralNode(typeNode)` before printing.

## Why generated types are mutable

The source attribute objects use `as const` for literal-type preservation,
which makes `typeof attributes` deeply `Readonly<...>`. To prevent that
`readonly` from leaking into the user-facing type, `AttrsToType<T>` uses
the `-readonly` modifier in its mapped type:

```ts
export type AttrsToType<T> = {
    -readonly [K in keyof T as K extends ReservedKey ? never : K]?: ...
};
```

So consumers get plain mutable properties even though the source is
locked-in literal types. This happens at the type level — the generator
itself doesn't manipulate readonly modifiers.

## Output structure

```
src/types/generated/
├── index.d.ts                      # aggregator (re-exports each canonical name)
└── components/
    └── modebar.d.ts                # one file per converted attribute file
```

The output directory mirrors the source: `src/components/modebar/attributes.ts`
becomes `src/types/generated/components/modebar.d.ts`.

## Aggregator

The aggregator (`src/types/generated/index.d.ts`) is a one-line-per-type
re-export:

```ts
export type { ModeBar } from './components/modebar';
export type { Slider } from './components/sliders';
// ... one line per canonical name, sorted alphabetically
```

It exists so consumers can `import type { ModeBar, Slider } from '../types/generated'`
without knowing the file structure. In practice, the hand-written
`src/types/core/*.d.ts` files re-export from the per-file generated
declarations directly, so the aggregator is mostly for ad-hoc consumers.

## valType → TypeScript

The leaf-type mapping lives in `src/types/lib/attributes.d.ts` as the
`ValTypeToTS<A>` mapped type. Summary:

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

## Extending the generator

### Adding a new valType

1. Add an interface to `src/types/lib/attributes.d.ts` (e.g. `interface FooAttr extends BaseAttrInfo { valType: 'foo'; ... }`)
2. Add it to the `AttrInfo` union
3. Add a branch to `ValTypeToTS<A>` mapping it to the desired TS type
4. Run `npm run gen:types` to verify output
5. Run `npm run typecheck` to ensure no regressions

### Improving flaglist support

Currently flag lists like `hoverinfo` map to `string`. To produce a
combinatorial union of valid `+`-joined combinations:

```ts
type Combinations<T extends readonly string[]> = ... // template literal magic
```

This is doable but produces large unions (15+ members for `hoverinfo`).
Consider whether the type-check cost is worth the autocomplete win.

### Supporting nested attribute objects with metadata

Some attribute files have shapes like:

```ts
{
    role: 'object',
    editType: 'calc',
    foo: { valType: 'number', ... },
    bar: { valType: 'string', ... },
}
```

The mapped type's reserved-key stripping handles `role`/`editType` at the
top level via `ReservedKey`. If a new metadata key gets introduced,
add it to the `ReservedKey` union in `src/types/lib/attributes.d.ts`.

## Debugging

If the generator emits `unknown` for a type that should be concrete:

```bash
node tasks/generate_types.mjs   # see the generated output
npm run typecheck               # see what tsc thinks the type is
```

Inspect with the TS Compiler API directly:

```js
node -e '
const ts = require("typescript");
const program = ts.createProgram(["path/to/attributes.ts"], { /* tsconfig opts */ });
const checker = program.getTypeChecker();
// ... probe symbols and types
'
```

The `formatDeclaration` function in `tasks/generate_types.mjs` can be
invoked on any `TypeAliasDeclaration` to see what would be emitted.

## CI integration

`npm run gen:types:check` runs the generator and then
`git diff --exit-code src/types/generated/`. If the working tree differs,
exit code 1 — meaning a developer changed an attributes.ts file but
didn't commit the regenerated declarations.

This is wired into `.github/workflows/ci.yml` as the `generated-types-drift`
job, alongside a sibling `typecheck` job. Both gate on the root
`install-and-cibuild` job and run in parallel on every PR.

A drift failure typically means one of:

- An `attributes.ts` file was edited without re-running `npm run gen:types`
- Biome's formatter config changed and existing generated files would re-format
- The generator itself changed in a way that affects existing output

All three are legitimate signals worth investigating.
