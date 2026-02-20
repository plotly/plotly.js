/**
 * Data/Trace types
 *
 * Defines the structure of Plotly data traces.
 * This is a union of all possible trace types.
 */

import type { Dash, ColorScale } from '../lib/common';

/**
 * All supported plot/trace types in plotly.js
 */
export type PlotType =
    | "bar"
    | "barpolar"
    | "box"
    | "candlestick"
    | "carpet"
    | "choropleth"
    | "choroplethmap"
    | "choroplethmapbox"
    | "cone"
    | "contour"
    | "contourcarpet"
    | "densitymap"
    | "densitymapbox"
    | "funnel"
    | "funnelarea"
    | "heatmap"
    | "histogram"
    | "histogram2d"
    | "histogram2dcontour"
    | "icicle"
    | "image"
    | "indicator"
    | "isosurface"
    | "mesh3d"
    | "ohlc"
    | "parcats"
    | "parcoords"
    | "pie"
    | "sankey"
    | "scatter"
    | "scatter3d"
    | "scattercarpet"
    | "scattergeo"
    | "scattergl"
    | "scattermap"
    | "scattermapbox"
    | "scatterpolar"
    | "scatterpolargl"
    | "scattersmith"
    | "scatterternary"
    | "splom"
    | "streamtube"
    | "sunburst"
    | "surface"
    | "table"
    | "treemap"
    | "violin"
    | "volume"
    | "waterfall";

/**
 * Common properties shared by all trace types
 */
export interface TraceBase {
    customdata?: any[];
    hoverinfo?: string;
    hoverlabel?: Partial<HoverLabel>;
    hovertemplate?: string | string[];
    ids?: string[];
    legendgroup?: string;
    legendgrouptitle?: any;
    meta?: any;
    name?: string;
    opacity?: number;
    selectedpoints?: any;
    showlegend?: boolean;
    type?: PlotType;
    uid?: string;
    visible?: boolean | 'legendonly';
    xaxis?: string;
    yaxis?: string;
    [key: string]: any;
}

/**
 * User-provided plot data (trace)
 * This will be a union of all specific trace types
 */
export type PlotData = TraceBase & (
    | BarTrace
    | LineTrace
    | ScatterTrace
    // Add more trace types as you convert them
    | GenericTrace
);

/**
 * Fully processed plot data with defaults applied (internal use)
 */
export interface FullData extends PlotData {
    _expandedIndex?: number;
    _fullInput?: any;
    _indexToPoints?: { [key: number]: number[] };
    _input?: any;
    _length?: number;
    _module?: any;
    index?: number;
}

/**
 * Generic trace for gradual migration
 * Use specific trace types when available
 */
export interface GenericTrace extends TraceBase {
    x?: any[];
    y?: any[];
    z?: any[];
    [key: string]: any;
}

/**
 * Scatter trace
 */
export interface ScatterTrace extends TraceBase {
    connectgaps?: boolean;
    fill?: 'none' | 'tozeroy' | 'tozerox' | 'tonexty' | 'tonextx' | 'toself' | 'tonext';
    fillcolor?: string;
    line?: Partial<Line>;
    marker?: Partial<Marker>;
    mode?: 'lines' | 'markers' | 'lines+markers' | 'none' | 'text' | 'lines+text' | 'markers+text' | 'lines+markers+text';
    text?: string | string[];
    textfont?: any;
    textposition?: string | string[];
    type: 'scatter';
    x?: number[] | string[];
    y?: number[] | string[];
}

/**
 * Bar trace
 */
export interface BarTrace extends TraceBase {
    base?: number | number[];
    marker?: Partial<Marker>;
    offset?: number | number[];
    orientation?: 'v' | 'h';
    text?: string | string[];
    textangle?: number;
    textposition?: string;
    type: 'bar';
    width?: number | number[];
    x?: number[] | string[];
    y?: number[] | string[];
}

/**
 * Line-only trace (simplified scatter)
 */
export interface LineTrace extends TraceBase {
    line?: Partial<Line>;
    mode: 'lines';
    type: 'scatter';
    x?: number[] | string[];
    y?: number[] | string[];
}

/**
 * Marker configuration (used by many traces)
 */
export interface Marker {
    autocolorscale?: boolean;
    cauto?: boolean;
    cmax?: number;
    cmid?: number;
    cmin?: number;
    color?: string | string[] | number[];
    coloraxis?: string;
    colorbar?: any;
    colorscale?: string | any[][];
    line?: Partial<MarkerLine>;
    opacity?: number | number[];
    reversescale?: boolean;
    showscale?: boolean;
    size?: number | number[];
    symbol?: string | string[];
}

/**
 * Marker line (outline)
 */
export interface MarkerLine {
    autocolorscale?: boolean;
    cauto?: boolean;
    cmax?: number;
    cmid?: number;
    cmin?: number;
    color?: string | string[];
    colorscale?: string | any[][];
    reversescale?: boolean;
    width?: number | number[];
}

/**
 * Line configuration (used by many traces)
 */
export interface Line {
    color?: string;
    dash?: Dash;
    shape?: 'linear' | 'spline' | 'hv' | 'vh' | 'hvh' | 'vhv';
    simplify?: boolean;
    smoothing?: number;
    width?: number;
}

/**
 * Hover label configuration
 */
export interface HoverLabel {
    align?: 'left' | 'right' | 'auto';
    bgcolor?: string | string[];
    bordercolor?: string | string[];
    font?: any;
    namelength?: number | number[];
}
