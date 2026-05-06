/**
 * ColorBar types
 *
 * Defines the structure of ColorBar configuration.
 */

import type { Font } from '../core/layout';
import type { Color, Datum, DTickValue, XAnchor, XRef, YAnchor, YRef } from '../lib/common';

/**
 * Exponent format type
 */
export type ExponentFormat = 'none' | 'e' | 'E' | 'power' | 'SI' | 'B';

/**
 * Show prefix/suffix type
 */
export type ShowTickLabel = 'all' | 'first' | 'last' | 'none';

/**
 * Tick label position type
 */
export type TickLabelPosition =
    | 'outside'
    | 'inside'
    | 'outside top'
    | 'inside top'
    | 'outside left'
    | 'inside left'
    | 'outside right'
    | 'inside right'
    | 'outside bottom'
    | 'inside bottom';

/**
 * Tick label overflow type
 */
export type TickLabelOverflow = 'allow' | 'hide past div' | 'hide past domain';

/**
 * Length mode type
 */
export type LengthMode = 'fraction' | 'pixels';

/**
 * ColorBar title configuration
 */
export interface ColorBarTitle {
    text?: string;
    font?: Partial<Font>;
    side?: 'right' | 'top' | 'bottom';
}

/**
 * Tick format stop configuration
 */
export interface TickFormatStop {
    enabled?: boolean;
    dtickrange?: [DTickValue | null, DTickValue | null];
    value?: string;
    name?: string;
    templateitemname?: string;
}

/**
 * ColorBar configuration
 */
export interface ColorBar {
    orientation?: 'h' | 'v';
    thicknessmode?: LengthMode;
    thickness?: number;
    lenmode?: LengthMode;
    len?: number;
    x?: number;
    xref?: XRef;
    xanchor?: XAnchor;
    xpad?: number;
    y?: number;
    yref?: YRef;
    yanchor?: YAnchor;
    ypad?: number;
    outlinecolor?: Color;
    outlinewidth?: number;
    bordercolor?: Color;
    borderwidth?: number;
    bgcolor?: Color;
    tickmode?: 'auto' | 'linear' | 'array';
    nticks?: number;
    tick0?: number | string;
    dtick?: DTickValue;
    tickvals?: Datum[] | Datum[][];
    ticktext?: Datum[] | Datum[][];
    ticks?: 'outside' | 'inside' | '';
    ticklabeloverflow?: TickLabelOverflow;
    ticklabelposition?: TickLabelPosition;
    ticklen?: number;
    tickwidth?: number;
    tickcolor?: Color;
    ticklabelstep?: number;
    showticklabels?: boolean;
    labelalias?: DTickValue;
    tickfont?: Partial<Font>;
    tickangle?: 'auto' | number;
    tickformat?: string;
    tickformatstops?: Array<Partial<TickFormatStop>>;
    tickprefix?: string;
    showtickprefix?: ShowTickLabel;
    ticksuffix?: string;
    showticksuffix?: ShowTickLabel;
    separatethousands?: boolean;
    exponentformat?: ExponentFormat;
    minexponent?: number;
    showexponent?: ShowTickLabel;
    title?: Partial<ColorBarTitle>;
}
