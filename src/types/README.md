# TypeScript in plotly.js

This directory documents the TypeScript conversion in progress.

| Doc | Audience |
|---|---|
| [SETUP.md](SETUP.md) | First-time contributor — toolchain overview, npm scripts |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Anyone working with types — directory layout, public/private split |
| [CONVERTING_ATTRIBUTES.md](CONVERTING_ATTRIBUTES.md) | **Contributor doing conversion work** — step-by-step recipe |
| [GENERATOR.md](GENERATOR.md) | Maintainer extending or debugging the type generator |

## Status

- TypeScript build infrastructure: ✅ done
- Public type surface in `src/types/`: ✅ done
- `AttributeMap` validation machinery: ✅ done
- **Schema-based type generator**: ✅ done — all 49 trace types + layout + shared interfaces
- Consumer entry point (`lib/index.d.ts`, wired via `package.json#types`): ✅ done
- CI gates (`typecheck` + `schema-typegen-diff-check`): ✅ done
- First attribute file converted (modebar): ✅ done
- Conversion of remaining component attribute files: 🚧 in progress

The published consumer surface lives at [`lib/index.d.ts`](../../lib/index.d.ts).
This `src/types/` directory is the authoring location — internal types live
here, public types are re-exported through `lib/index.d.ts` to consumers.

## Generated types

The following are **auto-generated from `plot-schema.json`** by
`tasks/generate_schema_types.mjs`:

- Common enum aliases (Calendar, Dash, AxisType, PatternShape, XRef, YRef,
  TransitionEasing, PlotType)
- All 49 per-trace data interfaces (BarData, ScatterData, IndicatorData, ...)
- Layout component interfaces (LayoutAxis, Legend, Scene, Annotation,
  Shape, Slider, UpdateMenu, etc.) and the Layout interface itself
- Shared sub-interfaces (Font, ColorBar, HoverLabel, LegendGroupTitle, etc.)
- Animation / frame / edits interfaces (AnimationOpts, Frame, Edits)
- An `_internal` namespace with helpers like `_internal.Marker`,
  `_internal.AutoRangeOptions` that aren't meant as direct public surface

Run `npm run schema` to regenerate. The output lives at
`src/types/generated/schema.d.ts`. See [GENERATOR.md](GENERATOR.md) for
the generator's internals.

## How to help

If you want to convert a component attribute file:

1. Read [CONVERTING_ATTRIBUTES.md](CONVERTING_ATTRIBUTES.md)
2. Pick a component file from the priority list at the bottom of that doc
3. Claim it in a PR description
4. Follow the recipe
5. Submit a PR

Each conversion is a single self-contained commit.
