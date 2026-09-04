/**
 * Layout types — hand-written supplements
 *
 * Schema-derived types (Layout, LayoutAxis, Legend, Scene, Shape, Annotation,
 * etc.) are generated into src/types/generated/schema.d.ts by
 * tasks/generate_schema_types.mjs. This file contains only types the schema
 * cannot express: internal runtime state, behavioral/event types, template
 * literal utilities, and deprecated aliases.
 */

import type { Data, Layout, TraceType } from '../generated/schema';
import type { PlotlyHTMLElement } from './events';

// ---------------------------------------------------------------------------
// Axis name types
// ---------------------------------------------------------------------------

export type { AxisName, CartesianSubplotId, XAxisName, YAxisName } from '../lib/common';

// ---------------------------------------------------------------------------
// ModeBar / Icon (behavioral types — not in schema)
// ---------------------------------------------------------------------------

/**
 * Identifiers for Plotly's built-in mode-bar buttons. Which of these a config
 * option accepts differs:
 *
 * - `config.modeBarButtonsToRemove` — any identifier below. Removal matches
 *   case-insensitively against each default button's `name` and its category.
 * - `config.modeBarButtons` — the button's registry key, resolved against
 *   Plotly's button table; an unknown key throws.
 * - `config.modeBarButtonsToAdd` — as a *string*, only the shape-drawing
 *   buttons (`drawline` … `eraseshape`), `downloadJson`, and the category
 *   aliases at the end of this union. Any other button has to be added as a
 *   `ModeBarButton` object; passing its name as a string does not resolve to
 *   the built-in button.
 */
export type ModeBarDefaultButtons =
    // Cartesian
    | 'zoom2d'
    | 'pan2d'
    | 'select2d'
    | 'lasso2d'
    | 'zoomIn2d'
    | 'zoomOut2d'
    | 'autoScale2d'
    | 'resetScale2d'
    // 3D
    | 'zoom3d'
    | 'pan3d'
    | 'orbitRotation'
    | 'tableRotation'
    | 'resetCameraDefault3d'
    | 'resetCameraLastSave3d'
    // Geo
    | 'zoomInGeo'
    | 'zoomOutGeo'
    | 'resetGeo'
    // Map
    | 'zoomInMap'
    | 'zoomOutMap'
    | 'resetViewMap'
    // Sankey. `resetViewSankey` is the button's object key (for `config.modeBarButtons`
    // custom groups); `resetSankeyGroup` is its `name` (for `modeBarButtonsToRemove`).
    | 'resetViewSankey'
    | 'resetSankeyGroup'
    // Hover
    | 'hoverClosestCartesian'
    | 'hoverCompareCartesian'
    | 'hoverClosest3d'
    | 'hoverClosestGeo'
    | 'hoverClosestPie'
    | 'toggleHover'
    | 'toggleSpikelines'
    // Shape drawing
    | 'drawline'
    | 'drawopenpath'
    | 'drawclosedpath'
    | 'drawcircle'
    | 'drawrect'
    | 'eraseshape'
    // Other
    | 'downloadJson'
    | 'toImage'
    | 'sendChartToCloud'
    | 'resetViews'
    // Category aliases. `modeBarButtonsToRemove` matches case-insensitively against a
    // button's `name` and its category, and `modeBarButtonsToAdd` accepts these strings
    // to re-enable the corresponding hover buttons.
    | 'v1hovermode'
    | 'hoverclosest'
    | 'hovercompare'
    | 'togglehover'
    | 'togglespikelines';

/** Click handler signature for custom mode-bar buttons. */
export type ButtonClickEvent = (gd: PlotlyHTMLElement, ev: MouseEvent) => void;

/**
 * SVG icon definition for a custom mode-bar button or modebar logo
 * (matches the format used by Plotly's bundled icon set).
 */
export interface Icon {
    /** Icon viewBox height. */
    height?: number | undefined;
    /** Icon viewBox width. */
    width?: number | undefined;
    /** SVG font-ascent value. */
    ascent?: number | undefined;
    /** SVG font-descent value. */
    descent?: number | undefined;
    /** Internal icon name (used by the bundled set). */
    name?: string | undefined;
    /** SVG `path` data for a single-path icon. */
    path?: string | undefined;
    /** Raw SVG markup for multi-element icons. */
    svg?: string | undefined;
    /** Optional SVG `transform` applied to the icon. */
    transform?: string | undefined;
}

/** Definition of a custom mode-bar button. */
export interface ModeBarButton {
    /** Unique identifier for this button. */
    name: string;
    /** Tooltip text shown on hover. */
    title: string;
    /** SVG icon — either a registered icon name or an `Icon` definition. */
    icon: string | Icon;
    /** Optional gravity hint controlling button placement. */
    gravity?: string | undefined;
    /** Handler invoked when the button is clicked. */
    click: ButtonClickEvent;
    /** Attribute path the button toggles (paired with `val`). */
    attr?: string | undefined;
    /** Value applied when the button activates (paired with `attr`). */
    val?: any;
    /** When true, the button can show an active/inactive state. */
    toggle?: boolean | undefined;
}

/** Union accepted by `config.modeBarButtons*`: a default name or a custom button. */
export type ModeBarButtonAny = ModeBarDefaultButtons | ModeBarButton;

// ---------------------------------------------------------------------------
// Template (circular reference — schema says `any`)
// ---------------------------------------------------------------------------

/**
 * A plot template — a partial figure (`data` and/or `layout`) that supplies
 * default styling. Hand-written because the schema's `valType: 'any'`
 * cannot self-reference.
 */
export interface Template {
    /** Template trace defaults, keyed by trace type. */
    data?: { [type in TraceType]?: Data[] } | undefined;
    /** Template layout defaults. */
    layout?: Partial<Layout> | undefined;
}
