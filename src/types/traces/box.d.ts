/**
 * Box plot trace type
 */

import type { PlotData } from '../core/data';
import type { Color, MarkerSymbol } from '../lib/common';

export interface BoxPlotMarker {
    outliercolor: Color;
    symbol: MarkerSymbol;
    opacity: number;
    size: number;
    color: Color;
    line: Partial<{
        color: Color;
        width: number;
        outliercolor: Color;
        outlierwidth: number;
    }>;
}

export interface ScatterSelectedMarker {
    opacity?: number;
    color?: Color;
    size?: number;
}

export interface BoxPlotData extends PlotData {
    type: 'box';
    x0: any;
    y0: any;
    width: number;
    quartilemethod: 'linear' | 'exclusive' | 'inclusive';
    boxpoints: 'all' | 'outliers' | 'suspectedoutliers' | false;
    jitter: number;
    pointpos: number;
    marker: Partial<BoxPlotMarker>;
    offsetgroup: string;
    alignmentgroup: string;
    selected: ScatterSelectedMarker;
    unselected: ScatterSelectedMarker;
}
