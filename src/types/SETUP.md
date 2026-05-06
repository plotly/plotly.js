# TypeScript Setup

Quick reference for the TypeScript toolchain in plotly.js.

## What's installed

- **TypeScript** (`typescript ^5.9.3`) — type checker only, never emits JS
- **ts-node** (`^10.9.2`) — runs TS scripts directly (build helpers, generator)
- **@types/node**, **@types/d3** — third-party type definitions
- esbuild handles `.ts` natively for bundling — no plugins needed

## Two tools, two jobs

| Tool | Job |
|---|---|
| **esbuild** | Bundle for production. Strips types, transpiles to ES2016, emits `dist/plotly.js`. Fast (~450ms full build). Does **not** check types. |
| **tsc** | Type-check only. Reads `.ts` and `.js` (with `allowJs: true`), reports errors, no output. Slower (~2-5s) but catches bugs. |

`tsconfig.json` sets `noEmit: true` so tsc never writes files. esbuild is the build system; tsc is the verifier.

## Configuration

- [tsconfig.json](../../tsconfig.json) — type checker config
- [esbuild-config.js](../../esbuild-config.js) — bundler config

Both target ES2016. Strict mode is currently **off** (`strict: false`) for incremental adoption — types tighten over time as files convert.

## npm scripts

```bash
npm run typecheck         # tsc --noEmit, errors reported, no output
npm run typecheck:watch   # incremental rechecking on change

npm run gen:types         # walk attributes.ts files → src/types/generated/, then biome format
npm run gen:types:check   # generate then `git diff --exit-code` (CI drift check)

npm run schema            # rebuild test/plot-schema.json from source attributes
npm run bundle            # esbuild → dist/plotly.js
npm run build             # full production build
```

## Workflows

**Editing during development:**

```bash
# Terminal 1
npm run typecheck:watch

# Terminal 2 — bundle/dev server
npm start
```

**Before commit:**

```bash
npm run typecheck
npm run gen:types       # if you converted an attribute file
npm run schema          # if attribute files changed
```

**CI** runs both checks as separate jobs (see `.github/workflows/ci.yml`):

```bash
npm run typecheck         # validates the type system is internally consistent
npm run gen:types:check   # fails if generated types are stale or unformatted
```

## How esbuild handles `.ts`

esbuild has built-in TypeScript support — it strips types and transpiles, no extra config. The catch: when a JS file `require()`s a TS file with a default export, esbuild's CommonJS interop wraps it in `{ default: ... }`. Existing project pattern is to update consumers:

```js
// Before (JS importing JS)
var attributes = require('./attributes');

// After (JS importing TS with `export default`)
var attributes = require('./attributes').default;
```

This shows up when converting `attributes.js` → `attributes.ts`. See [CONVERTING_ATTRIBUTES.md](CONVERTING_ATTRIBUTES.md) step 4.

## Performance

For a codebase of ~750 source files:

| Operation | Time |
|---|---|
| `tsc --noEmit` cold | ~2-5s |
| `tsc --noEmit --watch` incremental | ~100ms |
| esbuild full bundle | ~450ms |
| `npm run gen:types` | <1s for current converted set |
