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

All 49 trace data interfaces, layout component interfaces (LayoutAxis,
Legend, Scene, Annotation, Shape, Slider, UpdateMenu, etc.), the Layout
interface itself, and shared sub-interfaces (Font, ColorBar, HoverLabel,
etc.) are **auto-generated from `plot-schema.json`** by
`tasks/generate_schema_types.mjs`. Run `npm run schema` to regenerate.
The output lives at `src/types/generated/schema.d.ts`.

## How to help

If you want to convert a component attribute file:

1. Read [CONVERTING_ATTRIBUTES.md](CONVERTING_ATTRIBUTES.md)
2. Pick a component file from the priority list at the bottom of that doc
3. Claim it in a PR description
4. Follow the recipe
5. Submit a PR

Each conversion is a single self-contained commit.
