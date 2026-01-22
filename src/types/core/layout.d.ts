/**
 * Layout types
 *
 * Defines the structure of Plotly layout objects.
 * Start with common properties and expand as needed.
 */

import type { Selection } from '@types/d3'
import type { AxisType, Dash } from '../lib/common';

/**
 * User-provided layout configuration
 */
export interface Layout {
    autosize?: boolean;
    dragmode?: 'zoom' | 'pan' | 'select' | 'lasso' | 'orbit' | 'turntable' | false;
    font?: Partial<Font>;
    height?: number;
    hovermode?: 'closest' | 'x' | 'y' | 'x unified' | 'y unified' | false;
    legend?: Partial<Legend>;
    margin?: Partial<LayoutMargin>;
    paper_bgcolor?: string;
    plot_bgcolor?: string;
    showlegend?: boolean;
    template?: any;
    title?: string | Partial<LayoutTitle>;
    width?: number;
    xaxis?: Partial<LayoutAxis>;
    yaxis?: Partial<LayoutAxis>;

    // Multiple axes support (xaxis2, yaxis3, etc.)
    [key: string]: any;
}

/**
 * Fully processed layout with all defaults applied (internal use)
 */
export interface FullLayout extends Layout {
    _modules?: any[];
    _basePlotModules?: any[];
    _plots?: { [key: string]: any };
    _subplot?: any[];
    _subplots?: SubplotInfo;
    _size?: LayoutSize;
    _legends?: string[];
    _infolayer?: Selection;
    _zoomlayer?: Selection;
    _paperdiv?: Selection;
    _glcontainer?: Selection;
    _calcInverseTransform?: (gd: any) => void;
    _invTransform?: any;
    _uid?: string;
    _initialAutoSizeIsDone?: boolean;

    // Hover state
    _hoverlayer?: any;
    _hoverdata?: any[];

    // Modebar
    _modeBar?: any;

    // Grid
    grid?: any;

    // Computed properties
    _pushmargin?: { [key: string]: any };
    _basePlotModules?: any[];

    [key: string]: any;
}

/**
 * Layout title configuration
 */
export interface LayoutTitle {
    text: string;
    font?: Partial<Font>;
    xref?: 'container' | 'paper';
    yref?: 'container' | 'paper';
    x?: number;
    y?: number;
    xanchor?: 'auto' | 'left' | 'center' | 'right';
    yanchor?: 'auto' | 'top' | 'middle' | 'bottom';
    pad?: Partial<Padding>;
}

/**
 * Layout margin configuration
 */
export interface LayoutMargin {
    l: number;
    r: number;
    t: number;
    b: number;
    pad: number;
    autoexpand?: boolean;
}

/**
 * Font configuration (used throughout)
 */
export interface Font {
    color: string;
    family: string;
    size: number;
    style?: 'normal' | 'italic';
    variant?: string;
    weight?: number | string;
}

/**
 * Legend configuration
 */
export interface Legend {
    bgcolor?: string;
    bordercolor?: string;
    borderwidth?: number;
    font?: Partial<Font>;
    itemclick?: 'toggle' | 'toggleothers' | false;
    itemdoubleclick?: 'toggle' | 'toggleothers' | false;
    itemsizing?: 'trace' | 'constant';
    itemwidth?: number;
    orientation?: 'v' | 'h';
    title?: Partial<LegendTitle>;
    tracegroupgap?: number;
    traceorder?: string;
    valign?: 'top' | 'middle' | 'bottom';
    x?: number;
    xanchor?: 'auto' | 'left' | 'center' | 'right';
    y?: number;
    yanchor?: 'auto' | 'top' | 'middle' | 'bottom';
}

/**
 * Legend title configuration
 */
export interface LegendTitle {
    font?: Partial<Font>;
    side?: 'top' | 'left' | 'top left';
    text: string;
}

/**
 * Layout axis configuration
 */
export interface LayoutAxis {
    title?: string | Partial<AxisTitle>;
    type?: AxisType;
    autorange?: boolean | 'reversed';
    range?: [number | string, number | string];
    fixedrange?: boolean;
    showgrid?: boolean;
    showline?: boolean;
    showticklabels?: boolean;
    ticks?: '' | 'outside' | 'inside';
    tickmode?: 'auto' | 'linear' | 'array';
    tickvals?: any[];
    ticktext?: string[];
    tickangle?: number;
    tickfont?: Partial<Font>;
    zeroline?: boolean;
    zerolinecolor?: string;
    zerolinewidth?: number;
    gridcolor?: string;
    gridwidth?: number;
    linecolor?: string;
    linewidth?: number;
    mirror?: boolean | 'ticks' | 'all' | 'allticks';
    anchor?: string;
    side?: 'top' | 'bottom' | 'left' | 'right';
    overlaying?: string;
    domain?: [number, number];
    position?: number;

    // Internal properties
    _id?: string;
    _name?: string;
    _mainAxis?: boolean;
    _anchorAxis?: any;

    [key: string]: any;
}

/**
 * Axis title configuration
 */
export interface AxisTitle {
    font?: Partial<Font>;
    standoff?: number;
    text: string;
}

/**
 * Padding configuration
 */
export interface Padding {
    b: number;
    l: number;
    r: number;
    t: number;
}

/**
 * Layout size information (internal)
 */
export interface LayoutSize {
    b: number;
    h: number;
    l: number;
    p: number;
    r: number;
    t: number;
    w: number;
}

/**
 * Subplot information (internal)
 */
export interface SubplotInfo {
    [key: string]: string[] | undefined;
    cartesian?: string[];
    geo?: string[];
    gl2d?: string[];
    map?: string[];
    mapbox?: string[];
    pie?: string[];
    polar?: string[];
    sankey?: string[];
    ternary?: string[];
}
