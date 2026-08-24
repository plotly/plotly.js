# TypeScript Setup

Quick reference for the TypeScript toolchain in plotly.js.

## What's installed

The following dev dependencies are used for maintaining plotly.js types:

- `typescript` — used for type-checking only
- `ts-node` — used for running TS scripts (build helpers)
- `@types/node`, `@types/d3` — provide third-party type definitions

Note: esbuild handles `.ts` files natively for bundling, so no extra plugins are needed for the bundling process.

`tsconfig.json` sets `noEmit: true` so that tsc never writes files. esbuild is the build system; tsc is the verifier.

## Configuration

- [tsconfig.json](../../tsconfig.json) — type checker config
- [esbuild-config.js](../../esbuild-config.js) — bundler config

Both target ES2016. `strict: true` is on in `tsconfig.json` — the type system is fully strict for the `.d.ts` declarations and converted TypeScript sources. The remaining JS files coexist via `allowJs: true` and are type-checked loosely (no strict null checks etc. on the JS side).

## npm scripts

```bash
npm run typecheck         # tsc --noEmit, errors reported, no output
npm run typecheck-watch   # incremental rechecking on change

npm run schema            # rebuild test/plot-schema.json + regenerate types under src/types/generated/
npm run schema-typegen-diff-check      # regenerate + verify no changes to test/plot-schema.json or src/types/generated/schema.d.ts
npm run build             # full production build (regenerate all files under `dist/`)
```

## Workflows

**Editing during development:**

```bash
# Terminal 1
npm run typecheck-watch

# Terminal 2 — bundle/dev server
npm start
```

**Before commit:**

```bash
npm run typecheck
npm run schema          # if attribute files changed
```

**CI** runs both checks as separate jobs (see `.github/workflows/ci.yml`):

```bash
npm run typecheck                     # validates the type system is internally consistent
npm run schema-typegen-diff-check     # verifies generated types match the schema
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
