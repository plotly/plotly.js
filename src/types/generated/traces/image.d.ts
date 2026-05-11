/**
 * Generated from src/traces/image/attributes.ts.
 * Do not edit by hand — run `npm run gen:types`.
 */

import type { Datum, TypedArray } from '../../lib/common';

export interface ImageTrace {
    source?: string;
    z?: Datum[] | TypedArray;
    colormodel?: 'rgb' | 'rgba' | 'rgba256' | 'hsl' | 'hsla';
    zsmooth?: false | 'fast';
    zmin?: unknown[];
    zmax?: unknown[];
    x0?: any;
    y0?: any;
    dx?: number;
    dy?: number;
    text?: Datum[] | TypedArray;
    hovertext?: Datum[] | TypedArray;
    hoverinfo?: any;
    hovertemplate?: any;
    hovertemplatefallback?: any;
    zorder?: any;
}
