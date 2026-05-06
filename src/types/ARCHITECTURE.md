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
│  src/types/components/   │  │  Derived from attributes.ts    │
│  src/types/traces/       │  │  via AttrsToType<T>            │
│  src/types/plots/        │  │                                │
└──────────────────────────┘  └────────────────────────────────┘
```

`lib/index.d.ts` deliberately omits internal types (`FullLayout`,
`GraphDiv`, the `AttributeMap`/`AttrsToType` machinery, `*Internal` shapes,
the `TraceModule` lifecycle interface, etc.) so consumers see a clean
public API. The internal types remain accessible to plotly.js's own code
through the `src/types/` re-exports.

The split:

- **Generated types** are the single source of truth for everything in
  Plotly's attribute schema. Layout, traces, components — anything you
  configure when calling `Plotly.newPlot`.
- **Hand-written types** cover everything the schema doesn't describe:
  events, internal runtime state, public API function signatures,
  utility types.

When an `attributes.ts` file is converted, its generated type **replaces**
the corresponding hand-written one. The hand-written file gets a re-export:

```ts
// src/types/core/layout.d.ts
// `ModeBar` is generated from src/components/modebar/attributes.ts.
export type { ModeBar } from '../generated/components/modebar';
```

Consumers don't notice — externally they still write
`import { type ModeBar } from 'plotly.js'`. Internal callers still
import from the same path inside `src/types/`.

## Public vs. private (the underscore convention)

Plotly's runtime stores two kinds of state on graph elements:

- **Public** — user-supplied, what `Plotly.newPlot(gd, data, layout)` accepts
- **Private** (`_` prefix) — fully-resolved versions Plotly computes after
  applying defaults, defined modules, and so on

This split is reflected in the types:

| User-facing | Internal | Where defined |
|---|---|---|
| `Layout` | `FullLayout` | `Layout` is generated; `FullLayout extends Layout` is hand-written |
| `PlotData` | `FullData` | Same pattern |
| (n/a) | `GraphDiv` (the `gd` param) | Hand-written — DOM element with `_fullLayout`, `_fullData`, `calcdata`, etc. |

Internal types use index signatures (`[key: string]: any`) liberally to
allow incremental migration without blocking. As `_` properties get
discovered during JS→TS conversion, add them to `FullLayout`/`FullData`/etc.

## Directory layout

```
src/types/
├── index.d.ts              # main re-export hub
├── core/                   # public + internal types for the core API
│   ├── layout.d.ts         # Layout, FullLayout, axis/annotation/shape types
│   ├── data.d.ts           # PlotData, FullData, marker/line types
│   ├── config.d.ts         # Config, Edits, ToImgopts
│   ├── events.d.ts         # PlotMouseEvent, PlotlyHTMLElement, etc.
│   ├── api.d.ts            # public API function signatures (newPlot, etc.)
│   ├── animation.d.ts      # Frame, Transition, AnimationOpts
│   ├── template.d.ts       # Template, ValidateTemplateResult
│   └── graph-div.d.ts      # GraphDiv (gd parameter), GraphContext
│
├── components/             # public types for layout components
│   ├── colorbar.d.ts
│   ├── slider.d.ts
│   ├── updatemenu.d.ts
│   ├── rangeselector.d.ts
│   └── common.d.ts
│
├── traces/                 # per-trace public types
│   ├── box.d.ts            # BoxPlotData, BoxPlotMarker
│   ├── pie.d.ts            # PieData, PieMarker, ...
│   ├── sankey.d.ts
│   ├── violin.d.ts
│   ├── ohlc.d.ts
│   ├── candlestick.d.ts
│   └── common.d.ts         # internal TraceModule lifecycle
│
├── plots/                  # internal subplot types (PlotInfo, etc.)
│   └── common.d.ts
│
├── lib/                    # primitives + the schema-extraction machinery
│   ├── common.d.ts         # Color, Datum, TypedArray, MarkerSymbol, ...
│   └── attributes.d.ts     # AttributeMap, AttrsToType<T>, ValTypeToTS
│
└── generated/              # output of `npm run gen:types`
    ├── index.d.ts          # auto-generated re-export aggregator
    ├── components/
    │   └── modebar.d.ts    # one .d.ts per converted attributes.ts
    └── (more as conversion proceeds)
```

## How the generation works

```
src/components/modebar/attributes.ts
    │
    │ const attributes = { ... } as const satisfies AttributeMap;
    │ export type ModeBarAttributes = AttrsToType<typeof attributes>;
    │ export default attributes;
    │
    ▼
[ tasks/generate_types.mjs walks attributes.ts files ]
    │
    │ Uses TS Compiler API: checker.typeToTypeNode(checker.getDeclaredTypeOfSymbol(...))
    │ Then ts.createPrinter().printNode() flattens the mapped type
    │
    ▼
src/types/generated/components/modebar.d.ts
    │ import type { Color } from '../../lib/common';
    │
    │ export interface ModeBar {
    │     orientation?: 'v' | 'h';
    │     bgcolor?: Color;
    │     ...
    │ }
    │
    ▼
src/types/core/layout.d.ts re-exports `ModeBar` from generated/.
src/types/index.d.ts re-exports from layout.d.ts (internal).
lib/index.d.ts re-exports `ModeBar` to consumers (public).
```

## What's hand-written and stays that way

The schema doesn't describe:

- **Events** — `PlotMouseEvent`, `PlotHoverEvent`, `LegendClickEvent`,
  `PlotlyHTMLElement` and its `on()` overloads. These are runtime contracts.
- **Public API function signatures** — `Plotly.newPlot`, `relayout`,
  `restyle`, etc. Live in `src/types/core/api.d.ts`.
- **Internal runtime state** — `FullLayout._modules`, `GraphDiv._fullData`,
  `_calcInverseTransform`, etc. Live alongside the public types but in
  separate `Full*`/`*Internal` interfaces.
- **Utility types the mapped type bottoms out on** — `Color`, `Datum`,
  `TypedArray`, `MarkerSymbol`, `Pattern`, `ErrorBar`, etc. Live in
  `src/types/lib/common.d.ts`. The generator emits `import("../../lib/common").Color`
  references that resolve to these hand-written primitives.

## Adding internal properties

When converting a JS file to TS and discovering an internal property like
`fullLayout._someFlag`, add it to the corresponding `Full*` interface:

```ts
// src/types/core/layout.d.ts
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
- [GENERATOR.md](GENERATOR.md) — internals of `tasks/generate_types.mjs`
