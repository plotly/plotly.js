# Build and tooling

## Node

Node 22 and npm 10. The repository pins the version in `.nvmrc`.

Many machines here manage node with asdf. If a node command reports "command not found", put the shims on the path first.

```bash
export PATH="$HOME/.asdf/shims:$PATH"
```

## First-time setup

```bash
npm install && npm run pretest
```

## The local build

Use this. It builds `build/plotly.js`, which is the bundle the dev dashboard and the image tests load.

```bash
npm run schema
```

Do not run `npm run build` or `npm run bundle`. The full build empties and rewrites `dist/`, which no pull request may contain.

## The dev dashboard

```bash
npm start
```

The dashboard bundles the source and opens a browser tab. It exposes `Tabs.plotMock`, `Tabs.fresh`, `gd`, `fullData`, and `fullLayout`. See [CONTRIBUTING.md](../CONTRIBUTING.md) for the full list.

`npm run baseline`, `npm run test-image`, and `npm run test-export` do not bundle first. Keep `npm start` running in another terminal so the tests load current code.

## Generated output you must commit

| Command | Writes |
|---|---|
| `npm run schema` | `test/plot-schema.json`, `src/types/generated/schema.d.ts` |
| `npm run preprocess` | the js form of the css and svg sources |
| `npm run regl-codegen` | `src/generated/regl-codegen/`, four `regl_precompiled.js` files |

Check the drift before you hand the work back:

```bash
npm run schema-typegen-diff-check
```

## Regl shaders

Regl generates code at runtime, which breaks CSP compliance. So the repository precompiles the shaders. Regenerate them after an edit under:

- `src/traces/{scattergl,scatterpolargl,splom,parcoords}/`
- `src/lib/prepare_regl.js`
- `stackgl_modules/`
- `devtools/regl_codegen/`

The `check-regl-codegen` CI job uploads a `regl-codegen` artifact that holds the full desired state. Taking the artifact is easier than a local regeneration, because the local run needs a browser. See the regl section of [CONTRIBUTING.md](../CONTRIBUTING.md) for both paths.

## Generated files you must never hand-edit

- anything under `dist/`
- `test/plot-schema.json`
- `src/types/generated/schema.d.ts`
- `src/generated/regl-codegen/`
- the four `src/traces/*/regl_precompiled.js` files

Change the source and rerun the generator instead.
