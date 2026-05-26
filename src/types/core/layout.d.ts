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

type xYAxisNames = `${
    | ''
    | `${2 | 3 | 4 | 5 | 6 | 7 | 8 | 9}`
    | `${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9}${0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9}`}${'' | ' domain'}`;

export type XAxisName = `x${xYAxisNames}`;
export type YAxisName = `y${xYAxisNames}`;
export type AxisName = XAxisName | YAxisName;

// ---------------------------------------------------------------------------
// ModeBar / Icon (behavioral types — not in schema)
// ---------------------------------------------------------------------------

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

export type ButtonClickEvent = (gd: PlotlyHTMLElement, ev: MouseEvent) => void;

export interface Icon {
    height?: number | undefined;
    width?: number | undefined;
    ascent?: number | undefined;
    descent?: number | undefined;
    name?: string | undefined;
    path?: string | undefined;
    svg?: string | undefined;
    transform?: string | undefined;
}

export interface ModeBarButton {
    name: string;
    title: string;
    icon: string | Icon;
    gravity?: string | undefined;
    click: ButtonClickEvent;
    attr?: string | undefined;
    val?: any;
    toggle?: boolean | undefined;
}

export type ModeBarButtonAny = ModeBarDefaultButtons | ModeBarButton;

// ---------------------------------------------------------------------------
// Template (circular reference — schema says `any`)
// ---------------------------------------------------------------------------

export interface Template {
    data?: { [type in PlotType]?: Data[] } | undefined;
    layout?: Partial<Layout> | undefined;
}

// ---------------------------------------------------------------------------
// Deprecated aliases
// ---------------------------------------------------------------------------

export type { MapLayout as Mapbox } from '../generated/schema';

