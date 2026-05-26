/**
 * Layout types — hand-written supplements
 *
 * Schema-derived types (Layout, LayoutAxis, Legend, Scene, Shape, Annotation,
 * etc.) are generated into src/types/generated/schema.d.ts by
 * tasks/generate_schema_types.mjs. This file contains only types the schema
 * cannot express: internal runtime state, behavioral/event types, template
 * literal utilities, and deprecated aliases.
 */

import type { Layout } from '../generated/schema';
import type { Data, PlotType } from './data';
import type { PlotlyHTMLElement } from './events';

// ---------------------------------------------------------------------------
// Axis name types (template literal utilities — not in schema)
// ---------------------------------------------------------------------------

/**
 * Numeric axis suffix plus the optional ` domain` qualifier. The suffix is
 * empty for the first axis (`x` / `y`) and `2` through `99` otherwise.
 */
type xYAxisNames = `${
    | ''
    | `${2 | 3 | 4 | 5 | 6 | 7 | 8 | 9}`
    | `${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9}${0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9}`}${'' | ' domain'}`;

/** Any valid x-axis reference: `'x'`, `'x2'`, …, `'x99'`, optionally `' domain'`. */
export type XAxisName = `x${xYAxisNames}`;
/** Any valid y-axis reference: `'y'`, `'y2'`, …, `'y99'`, optionally `' domain'`. */
export type YAxisName = `y${xYAxisNames}`;
/** Any valid axis reference (x or y, numbered or not, domain-qualified or not). */
export type AxisName = XAxisName | YAxisName;

// ---------------------------------------------------------------------------
// ModeBar / Icon (behavioral types — not in schema)
// ---------------------------------------------------------------------------

/**
 * Names of built-in mode-bar buttons. Used by `config.modeBarButtonsToAdd`
 * and `config.modeBarButtonsToRemove` to reference Plotly's defaults.
 */
export type ModeBarDefaultButtons =
    | 'lasso2d'
    | 'select2d'
    | 'sendDataToCloud'
    | 'zoom2d'
    | 'pan2d'
    | 'zoomIn2d'
    | 'zoomOut2d'
    | 'autoScale2d'
    | 'resetScale2d'
    | 'hoverClosestCartesian'
    | 'hoverCompareCartesian'
    | 'zoom3d'
    | 'pan3d'
    | 'orbitRotation'
    | 'tableRotation'
    | 'handleDrag3d'
    | 'resetCameraDefault3d'
    | 'resetCameraLastSave3d'
    | 'hoverClosest3d'
    | 'zoomInGeo'
    | 'zoomOutGeo'
    | 'resetGeo'
    | 'hoverClosestGeo'
    | 'hoverClosestGl2d'
    | 'hoverClosestPie'
    | 'toggleHover'
    | 'toImage'
    | 'resetViews'
    | 'toggleSpikelines'
    | 'zoomInMap'
    | 'zoomInMapbox'
    | 'zoomOutMap'
    | 'zoomOutMapbox'
    | 'resetViewMap'
    | 'resetViewMapbox'
    | 'togglespikelines'
    | 'togglehover'
    | 'hovercompare'
    | 'hoverclosest'
    | 'v1hovermode';

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
    data?: { [type in PlotType]?: Data[] } | undefined;
    /** Template layout defaults. */
    layout?: Partial<Layout> | undefined;
}

// ---------------------------------------------------------------------------
// Deprecated aliases
// ---------------------------------------------------------------------------

/** @deprecated `Mapbox` traces are deprecated; use the unified `Map`/`MapLayout` types. */
export type { MapLayout as Mapbox } from '../generated/schema';
