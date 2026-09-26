import { counter as counterRegex } from '../../lib/regex';
import type { LayoutAxis, TraceType } from '../../types/generated/schema';

export const idRegex = {
    x: counterRegex('x', '( domain)?'),
    y: counterRegex('y', '( domain)?')
} as const;

export const attrRegex = counterRegex('[xy]axis');

// Axis match regular expression
export const xAxisMatch = counterRegex('xaxis');
export const yAxisMatch = counterRegex('yaxis');

// Pattern matching axis ids and names
// note that this is more permissive than counterRegex, as
// id2name, name2id, and cleanId accept "x1" etc
export const AX_ID_PATTERN = /^[xyz][0-9]*( domain)?$/;
export const AX_NAME_PATTERN = /^[xyz]axis[0-9]*$/;

// And for 2D subplots
export const SUBPLOT_PATTERN = /^x([0-9]*)y([0-9]*)$/;

// These two become the `rangebreaks.pattern` values in the schema
export const HOUR_PATTERN = 'hour';
export const WEEKDAY_PATTERN = 'day of week';

// Pixels to move mouse before you stop clamping to starting point
export const MINDRAG = 8;

// Smallest dimension allowed for a zoombox
export const MINZOOM = 20;

// Width of axis drag regions
export const DRAGGERSIZE = 20;

// Delay before a redraw (relayout) after smooth panning and zooming
export const REDRAWDELAY = 50;

// Last resort axis ranges for x and y axes if we have no data
export const DFLTRANGEX = [-1, 6] as const;
export const DFLTRANGEY = [-1, 4] as const;

// Layers to keep trace types in the right order
// N.B. each  'unique' plot method must have its own layer
export const traceLayerClasses = [
    'imagelayer',
    'heatmaplayer',
    'contourcarpetlayer',
    'contourlayer',
    'funnellayer',
    'waterfalllayer',
    'barlayer',
    'carpetlayer',
    'violinlayer',
    'boxlayer',
    'ohlclayer',
    'scattercarpetlayer',
    'scatterlayer'
] as const satisfies readonly `${TraceType}layer`[];

/** An SVG layer class holding one trace type, such as `barlayer` */
export type TraceLayerClass = (typeof traceLayerClasses)[number];

export const clipOnAxisFalseQuery = [
    '.scatterlayer',
    '.barlayer',
    '.funnellayer',
    '.waterfalllayer'
] as const satisfies readonly `.${TraceLayerClass}`[];

export const layerValue2layerClass = {
    'above traces': 'above',
    'below traces': 'below'
} as const satisfies Record<NonNullable<LayoutAxis['layer']>, string>;

// Used for zindex of cartesian subplots e.g. xy, xyz2, xyz3, etc.
export const zindexSeparator = 'z';
