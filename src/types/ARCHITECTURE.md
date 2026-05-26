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

- **Generated types** are the authoritative TypeScript representation of
  the runtime schema. The schema itself is produced from Plotly's JS
  attribute files (`src/.../attributes.js`), which remain the source of
  truth: chain is **attribute files → `plot-schema.json` → generated
  types**.
  - **`src/types/generated/schema.d.ts`** contains:
    - **Common enum aliases** discovered from the schema (Calendar, Dash,
      AxisType, PatternShape, XRef, YRef, TransitionEasing, PlotType).
    - **Shared sub-interfaces** extracted from repeated subtrees (Font,
      FontArray, ColorBar, HoverLabel, Domain, Pattern, TickFormatStops,
      LegendGroupTitle).
    - **Per-trace data interfaces** — all 49 (BarData, ScatterData,
      IndicatorData, etc.).
    - **Layout component interfaces** (LayoutAxis, Legend, Scene,
      Annotation, Shape, Slider, UpdateMenu, etc.) and the Layout
      interface itself.
    - **Animation, frames, and config interfaces** (Transition,
      AnimationFrameOpts, AnimationOpts, Frame, Edits) generated from
      `schema.animation`, `schema.frames`, and `schema.config.edits`.
    - **`_internal` namespace** wrapping types whose direct names would
      mislead consumers (Marker is scatter-only, Line is the marker
      outline) or are schema-internal helpers (AutoRangeOptions,
      Lighting, Stream, ErrorY). Reachable as `_internal.Marker` etc.
      but not at the top level.

    Generated from `plot-schema.json` by `tasks/generate_schema_types.mjs`.
    Run `npm run schema` to regenerate.
- **Hand-written types** cover everything the schema doesn't describe:
  events, internal runtime state, public API function signatures,
  utility types (Color, Datum, MarkerSymbol, ErrorBar), behavioral types
  (ModeBarButton, Icon, etc.).

## Public vs. private (the underscore convention)

Plotly's runtime stores two kinds of state on graph elements:

- **Public** — user-supplied, what `Plotly.newPlot(gd, data, layout)` accepts
- **Private** (`_` prefix) — fully-resolved versions Plotly computes after
  applying defaults, defined modules, and so on

This split is reflected in the types:

| User-facing | Internal | Where defined |
|---|---|---|
| `Layout` | `FullLayout` | `Layout` in `generated/schema.d.ts`; `FullLayout` in `core/layout.internal.d.ts` |
| `Data` (union over `type`) | `FullData` | `Data` in `core/data.d.ts` (union of schema `*Data` interfaces); `FullData = Data & FullDataInternals` in `core/data.internal.d.ts` |
| (n/a) | `GraphDiv` (the `gd` param) | `core/graph-div.internal.d.ts` — DOM element with `_fullLayout`, `_fullData`, `calcdata`, etc. |

`FullData` is the discriminated union of schema trace types intersected with
the internal `_`-prefixed fields. Internal code that narrows on `trace.type`
gets trace-specific fields plus the internal state in the same expression.

Internal types use index signatures (`[key: string]: any`) liberally to
allow incremental migration without blocking. As `_` properties get
discovered during JS→TS conversion, add them to `FullLayout` or
`FullDataInternals` (the file-local intersection target inside
`data.internal.d.ts`).

## Directory layout

```
src/types/
├── index.d.ts                    # main re-export hub (public + internal)
├── core/                         # hand-written types for the core API
│   ├── api.d.ts                  # public API function signatures (newPlot, etc.)
│   ├── config.d.ts               # Config, ToImgopts (Edits re-exported from generated)
│   ├── data.d.ts                 # Data union (over all schema `*Data` interfaces)
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
test/plot-schema.json (runtime schema: traces + layout + animation + config)
    │
    ▼
[ tasks/generate_schema_types.mjs ]
    │
    │ 0. Discover common enum aliases via COMMON_TYPE_ANCHORS
    │    (Calendar/Dash/AxisType/PatternShape/XRef/YRef/TransitionEasing,
    │    plus PlotType derived from the trace-names list)
    │ 1. Fingerprint every container subtree across traces and layout
    │ 2. Extract shared interfaces (Font, ColorBar, HoverLabel, etc.).
    │    Inject Transition and AnimationFrameOpts as shared types
    │    (animation has < MIN_OCCURRENCES sites otherwise)
    │ 3. Emit per-trace interfaces referencing shared types
    │ 4. Emit layout component interfaces (LayoutAxis, Legend, Scene, etc.)
    │    and the Layout interface with subplot index signatures
    │ 5. Emit AnimationOpts (from schema.animation), Frame (from
    │    schema.frames with field overrides for the recursive data/layout
    │    fields), and Edits (from schema.config.edits)
    │ 6. Wrap names in INTERNAL_INTERFACES inside `export namespace _internal`
    │    and rewrite outside-namespace references to `_internal.X`
    │
    ▼
src/types/generated/schema.d.ts
    │ // Common enum aliases
    │ export type Calendar = 'chinese' | 'coptic' | ...;
    │ export type PlotType = 'bar' | 'scatter' | ...;
    │ // Shared interfaces (public)
    │ export interface Font { ... }
    │ export interface ColorBar { ... }
    │ // Internal namespace
    │ export namespace _internal {
    │     export interface Marker { ... }
    │     export interface Line { ... }
    │     // ...
    │ }
    │ // Trace interfaces
    │ export interface ScatterData { marker?: _internal.Marker; ... }
    │ export interface BarData { ... }
    │ // Layout
    │ export interface LayoutAxis { autorangeoptions?: _internal.AutoRangeOptions; ... }
    │ export interface Layout { ... }
    │ // Animation / config
    │ export interface AnimationOpts { transition?: Transition; ... }
    │ export interface Frame { data?: any[]; layout?: Partial<Layout>; ... }
    │ export interface Edits { ... }
    │
    ▼
src/types/index.d.ts re-exports all types (internal authoring index).
lib/index.d.ts uses `export type * from '.../generated/schema'` so every
public schema-derived type is automatically re-exported to consumers.
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
