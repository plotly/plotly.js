# Type System Architecture

How TypeScript types are organized in plotly.js.

## Three layers

```
┌──────────────────────────────────────────────────────────────┐
│  Consumer surface (what `npm install plotly.js` exposes)     │
│  lib/index.d.ts — wired via package.json#types               │
│  Curated re-exports of public types + 'export as namespace   │
│  Plotly' for namespace and global usage.                     │
└──────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────────┐
│  Internal authoring surface                                  │
│  src/types/index.d.ts — re-exports everything (internal)     │
└──────────────────────────────────────────────────────────────┘
              │                        │
              ▼                        ▼
┌──────────────────────────┐  ┌────────────────────────────────┐
│  Hand-written types      │  │  Generated types               │
│  src/types/core/*.d.ts   │  │  src/types/generated/...       │
│  src/types/lib/*.d.ts    │  │                                │
│                          │  │  schema.d.ts — from schema     │
│                          │  │  (traces + layout + shared)    │
└──────────────────────────┘  └────────────────────────────────┘
```

`lib/index.d.ts` deliberately omits internal types (`FullLayout`,
`FullData`, `GraphDiv`, the `AttributeMap` machinery, etc.) so consumers
see a clean public API. Internal types live in `.internal.d.ts` files and
remain accessible to plotly.js's own code through the `src/types/`
re-exports.

The split:

- **Generated types** are the single source of truth for everything in
  Plotly's attribute schema.
  - **`src/types/generated/schema.d.ts`** — all 49 trace data interfaces,
    layout component interfaces (LayoutAxis, Legend, Scene, Annotation,
    Shape, Slider, UpdateMenu, etc.), the Layout interface itself, plus
    shared sub-interfaces (Font, ColorBar, HoverLabel, etc.).
    Generated from `plot-schema.json` by `tasks/generate_schema_types.mjs`.
    Run `npm run schema` to regenerate.
- **Hand-written types** cover everything the schema doesn't describe:
  events, internal runtime state, public API function signatures,
  utility types, behavioral types (ModeBarButton, Icon, etc.).

## Public vs. private (the underscore convention)

Plotly's runtime stores two kinds of state on graph elements:

- **Public** — user-supplied, what `Plotly.newPlot(gd, data, layout)` accepts
- **Private** (`_` prefix) — fully-resolved versions Plotly computes after
  applying defaults, defined modules, and so on

This split is reflected in the types:

| User-facing | Internal | Where defined |
|---|---|---|
| `Layout` | `FullLayout` | `Layout` in `generated/schema.d.ts`; `FullLayout` in `core/layout.internal.d.ts` |
| `PlotData` | `FullData` | `PlotData` in `core/data.d.ts`; `FullData` in `core/data.internal.d.ts` |
| (n/a) | `GraphDiv` (the `gd` param) | `core/graph-div.internal.d.ts` — DOM element with `_fullLayout`, `_fullData`, `calcdata`, etc. |

Internal types use index signatures (`[key: string]: any`) liberally to
allow incremental migration without blocking. As `_` properties get
discovered during JS→TS conversion, add them to `FullLayout`/`FullData`/etc.

## Directory layout

```
src/types/
├── index.d.ts                    # main re-export hub (public + internal)
├── core/                         # hand-written types for the core API
│   ├── api.d.ts                  # public API function signatures (newPlot, etc.)
│   ├── animation.d.ts            # Frame, Transition, AnimationOpts
│   ├── config.d.ts               # Config, Edits, ToImgopts
│   ├── data.d.ts                 # PlotData, PlotMarker, ScatterLine, Data union
│   ├── data.internal.d.ts        # CalcData, FullData
│   ├── events.d.ts               # PlotMouseEvent, PlotlyHTMLElement, etc.
│   ├── graph-div.internal.d.ts   # GraphDiv, GraphContext
│   ├── layout.d.ts               # AxisName, ModeBar behavioral types, Template
│   └── layout.internal.d.ts      # FullLayout, LayoutSize, SubplotInfo
│
├── lib/                          # primitives + the schema-extraction machinery
│   ├── common.d.ts               # Color, Datum, TypedArray, MarkerSymbol, ...
│   └── attributes.d.ts           # AttributeMap, AttrInfo (compile-time validation)
│
└── generated/                    # machine-generated types
    └── schema.d.ts               # all traces + layout + shared types (from plot-schema.json)
```

### The `.internal.d.ts` convention

Files with the `.internal.d.ts` suffix contain types that are **not** part of the
public API (not re-exported in `lib/index.d.ts`). These are internal runtime types
used only within plotly.js itself — `FullLayout`, `FullData`, `GraphDiv`, etc.

If a file has no `.internal` suffix, all its exports are public.

## How schema type generation works

```
test/plot-schema.json (runtime schema with all 49 traces + full layout)
    │
    ▼
[ tasks/generate_schema_types.mjs ]
    │
    │ 1. Fingerprint every container subtree across ALL traces AND layout
    │ 2. Extract shared interfaces (Font, ColorBar, HoverLabel, etc.)
    │ 3. Emit per-trace interfaces referencing shared types
    │ 4. Emit layout component interfaces (LayoutAxis, Legend, Scene, etc.)
    │ 5. Emit the Layout interface with subplot index signatures
    │
    ▼
src/types/generated/schema.d.ts
    │ export interface Font { ... }
    │ export interface ColorBar { ... }
    │ export interface ScatterData { ... }
    │ export interface BarData { ... }
    │ export interface LayoutAxis { ... }
    │ export interface Legend { ... }
    │ export interface Layout { ... }
    │ // ... 49 traces + layout types + shared interfaces
    │
    ▼
src/types/index.d.ts re-exports all types (internal).
lib/index.d.ts re-exports public types to consumers.
```

Regenerate with `npm run schema` (which rebuilds plot-schema.json
and then runs the schema type generator).

## What's hand-written and stays that way

The schema doesn't describe:

- **Events** — `PlotMouseEvent`, `PlotHoverEvent`, `LegendClickEvent`,
  `PlotlyHTMLElement` and its `on()` overloads. These are runtime contracts.
- **Public API function signatures** — `Plotly.newPlot`, `relayout`,
  `restyle`, etc. Live in `src/types/core/api.d.ts`.
- **Internal runtime state** — `FullLayout._modules`, `GraphDiv._fullData`,
  `_calcInverseTransform`, etc. Live in `.internal.d.ts` files in `src/types/core/`.
- **Behavioral types** — `ModeBarButton`, `ModeBarDefaultButtons`, `Icon`,
  `ButtonClickEvent`, `Template`. These describe runtime behavior patterns
  not captured in the attribute schema.
- **Utility types** — `Color`, `Datum`, `TypedArray`, `MarkerSymbol`, etc.
  Live in `src/types/lib/common.d.ts`. The generator references these types.

## Adding internal properties

When converting a JS file to TS and discovering an internal property like
`fullLayout._someFlag`, add it to the corresponding `Full*` interface:

```ts
// src/types/core/layout.internal.d.ts
export interface FullLayout extends Layout {
    _modules?: any[];
    _someFlag?: boolean;   // add new ones here
    [key: string]: any;
}
```

The `[key: string]: any` index signature is intentional — it absorbs
unknown internal properties so JS code can be migrated piecewise without
type errors.

## See also

- [SETUP.md](SETUP.md) — toolchain and npm scripts
- [CONVERTING_ATTRIBUTES.md](CONVERTING_ATTRIBUTES.md) — the conversion recipe
- [GENERATOR.md](GENERATOR.md) — internals of the type generators
