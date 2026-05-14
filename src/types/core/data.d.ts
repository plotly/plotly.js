/**
 * Data/Trace types
 *
 * Comprehensive trace data types covering all plot types, markers, lines,
 * and the Data union.
 */

import type {
    BoxData,
    CandlestickData,
    ColorBar,
    Font,
    HoverLabel,
    OhlcData,
    Pattern,
    PieData,
    SankeyData,
    ViolinData,
} from '../generated/schema';
import type { Color, ColorScale, Dash, Datum, ErrorBar, MarkerSymbol, TypedArray } from '../lib/common';

// ---------------------------------------------------------------------------
// Trace support types (used by PlotData)
// ---------------------------------------------------------------------------

export interface DataTitle {
    text: string;
    font: Partial<Font>;
    standoff: number;
    position:
        | 'top left'
        | 'top center'
        | 'top right'
        | 'middle center'
        | 'bottom left'
        | 'bottom center'
        | 'bottom right';
}

export interface PlotNumber {
    valueformat: string;
    font: Partial<Font>;
    prefix: string;
    suffix: string;
}

export interface Padding {
    t: number;
    r: number;
    b: number;
    l: number;
}

export interface GaugeLine {
    color: Color;
    width: number;
}

export interface Threshold {
    line: Partial<GaugeLine>;
    value: number;
    thickness: number;
}

export interface GaugeBar {
    color: Color;
    line: Partial<GaugeLine>;
    thickness: number;
}

export interface Gauge {
    shape: 'angular' | 'bullet';
    bar: Partial<GaugeBar>;
    bgcolor: Color;
    bordercolor: Color;
    borderwidth: number;
    steps: Array<{ range: number[]; color: Color }>;
    threshold: Partial<Threshold>;
}

export interface Delta {
    reference: number;
    position: 'top' | 'bottom' | 'left' | 'right';
    relative: boolean;
    valueformat: string;
    increasing: {
        symbol: string;
        color: Color;
    };
    decreasing: {
        symbol: string;
        color: Color;
    };
}

// ---------------------------------------------------------------------------
// PlotType
// ---------------------------------------------------------------------------

export type PlotType =
    | 'bar'
    | 'barpolar'
    | 'box'
    | 'candlestick'
    | 'carpet'
    | 'choropleth'
    | 'choroplethmap'
    | 'choroplethmapbox'
    | 'cone'
    | 'contour'
    | 'contourcarpet'
    | 'densitymap'
    | 'densitymapbox'
    | 'funnel'
    | 'funnelarea'
    | 'heatmap'
    | 'histogram'
    | 'histogram2d'
    | 'histogram2dcontour'
    | 'icicle'
    | 'image'
    | 'indicator'
    | 'isosurface'
    | 'mesh3d'
    | 'ohlc'
    | 'parcats'
    | 'parcoords'
    | 'pie'
    | 'sankey'
    | 'scatter'
    | 'scatter3d'
    | 'scattercarpet'
    | 'scattergeo'
    | 'scattergl'
    | 'scattermap'
    | 'scattermapbox'
    | 'scatterpolar'
    | 'scatterpolargl'
    | 'scattersmith'
    | 'scatterternary'
    | 'splom'
    | 'streamtube'
    | 'sunburst'
    | 'surface'
    | 'table'
    | 'treemap'
    | 'violin'
    | 'volume'
    | 'waterfall';

// ---------------------------------------------------------------------------
// Marker / Line types
// ---------------------------------------------------------------------------

export interface ScatterMarkerLine {
    width: number | number[];
    color: Color;
    cauto?: boolean | undefined;
    cmax?: number | undefined;
    cmin?: number | undefined;
    cmid?: number | undefined;
    colorscale?: ColorScale | undefined;
    autocolorscale?: boolean | undefined;
    reversescale?: boolean | undefined;
    coloraxis?: string | undefined;
}

export interface PlotMarker {
    symbol: MarkerSymbol;
    color?: Color | Color[] | undefined;
    colors?: Color[] | undefined;
    colorscale?: ColorScale | undefined;
    cauto?: boolean | undefined;
    cmax?: number | undefined;
    cmin?: number | undefined;
    autocolorscale?: boolean | undefined;
    reversescale?: boolean | undefined;
    opacity: number | number[];
    size: number | number[];
    maxdisplayed?: number | undefined;
    sizeref?: number | undefined;
    sizemax?: number | undefined;
    sizemin?: number | undefined;
    sizemode?: 'diameter' | 'area' | undefined;
    showscale?: boolean | undefined;
    line: Partial<ScatterMarkerLine>;
    pad?: Partial<Padding> | undefined;
    width?: number | undefined;
    colorbar?: Partial<ColorBar> | undefined;
    gradient?:
        | {
              type: 'radial' | 'horizontal' | 'vertical' | 'none';
              color: Color;
              typesrc: any;
              colorsrc: any;
          }
        | undefined;
    pattern?: Partial<Pattern>;
}

export interface ScatterLine {
    color: Color;
    width: number;
    dash: Dash;
    shape: 'linear' | 'spline' | 'hv' | 'vh' | 'hvh' | 'vhv';
    smoothing: number;
    simplify: boolean;
}

// ---------------------------------------------------------------------------
// PlotData
// ---------------------------------------------------------------------------

export interface PlotData {
    type: PlotType;
    x: Datum[] | Datum[][] | TypedArray;
    y: Datum[] | Datum[][] | TypedArray;
    z: Datum[] | Datum[][] | Datum[][][] | TypedArray;
    i: TypedArray;
    j: TypedArray;
    k: TypedArray;
    xy: Float32Array;
    error_x: ErrorBar;
    error_y: ErrorBar;
    xaxis: string;
    yaxis: string;
    text: string | string[];
    lat: Datum[];
    lon: Datum[];
    line: Partial<ScatterLine>;
    'line.color': Color;
    'line.width': number;
    'line.dash': Dash;
    'line.shape': 'linear' | 'spline' | 'hv' | 'vh' | 'hvh' | 'vhv';
    'line.smoothing': number;
    'line.simplify': boolean;
    marker: Partial<PlotMarker>;
    'marker.symbol': MarkerSymbol | MarkerSymbol[];
    'marker.color': Color;
    'marker.colorscale': ColorScale | ColorScale[];
    'marker.opacity': number | number[];
    'marker.size': number | number[] | number[][];
    'marker.maxdisplayed': number;
    'marker.sizeref': number;
    'marker.sizemax': number;
    'marker.sizemin': number;
    'marker.sizemode': 'diameter' | 'area';
    'marker.showscale': boolean;
    'marker.line': Partial<ScatterMarkerLine>;
    'marker.line.color': Color;
    'marker.line.colorscale': ColorScale | ColorScale[];
    'marker.colorbar': {};
    'marker.pad.t': number;
    'marker.pad.b': number;
    'marker.pad.l': number;
    'marker.pad.r': number;
    mode:
        | 'lines'
        | 'markers'
        | 'text'
        | 'lines+markers'
        | 'text+markers'
        | 'text+lines'
        | 'text+lines+markers'
        | 'none'
        | 'gauge'
        | 'number'
        | 'delta'
        | 'number+delta'
        | 'gauge+number'
        | 'gauge+number+delta'
        | 'gauge+delta';
    histfunc: 'count' | 'sum' | 'avg' | 'min' | 'max';
    histnorm: '' | 'percent' | 'probability' | 'density' | 'probability density';
    hoveron: 'points' | 'fills';
    hoverinfo:
        | 'all'
        | 'name'
        | 'none'
        | 'skip'
        | 'text'
        | 'x'
        | 'x+text'
        | 'x+name'
        | 'x+y'
        | 'x+y+text'
        | 'x+y+name'
        | 'x+y+z'
        | 'x+y+z+text'
        | 'x+y+z+name'
        | 'y'
        | 'y+name'
        | 'y+x'
        | 'y+text'
        | 'y+x+text'
        | 'y+x+name'
        | 'y+z'
        | 'y+z+text'
        | 'y+z+name'
        | 'y+x+z'
        | 'y+x+z+text'
        | 'y+x+z+name'
        | 'z'
        | 'z+x'
        | 'z+x+text'
        | 'z+x+name'
        | 'z+y+x'
        | 'z+y+x+text'
        | 'z+y+x+name'
        | 'z+x+y'
        | 'z+x+y+text'
        | 'z+x+y+name';
    hoverlabel: Partial<HoverLabel>;
    hovertemplate: string | string[];
    hovertext: string | string[];
    hoverongaps: boolean;
    xhoverformat: string;
    yhoverformat: string;
    zhoverformat: string;
    texttemplate: string | string[];
    textinfo:
        | 'label'
        | 'label+text'
        | 'label+value'
        | 'label+percent'
        | 'label+text+value'
        | 'label+text+percent'
        | 'label+value+percent'
        | 'text'
        | 'text+value'
        | 'text+percent'
        | 'text+value+percent'
        | 'value'
        | 'value+percent'
        | 'percent'
        | 'none';
    textposition:
        | 'top left'
        | 'top center'
        | 'top right'
        | 'middle left'
        | 'middle center'
        | 'middle right'
        | 'bottom left'
        | 'bottom center'
        | 'bottom right'
        | 'inside'
        | 'outside'
        | 'auto'
        | 'none';
    textfont: Partial<Font>;
    textangle: 'auto' | number;
    insidetextanchor: 'end' | 'middle' | 'start';
    constraintext: 'inside' | 'outside' | 'both' | 'none';
    fill: 'none' | 'tozeroy' | 'tozerox' | 'tonexty' | 'tonextx' | 'toself' | 'tonext';
    fillcolor: string;
    fillpattern: Partial<Pattern>;
    showlegend: boolean;
    legendgroup: string;
    legendgrouptitle: {
        text: string;
        font?: Partial<Font>;
    };
    legendrank: number;
    parents: string[];
    name: string;
    stackgroup: string;
    groupnorm: '' | 'fraction' | 'percent';
    stackgaps: 'infer zero' | 'interpolate';
    connectgaps: boolean;
    visible: boolean | 'legendonly';
    delta: Partial<Delta>;
    gauge: Partial<Gauge>;
    number: Partial<PlotNumber>;
    orientation: 'v' | 'h';
    width: number | number[];
    boxmean: boolean | 'sd';
    boxpoints: 'all' | 'outliers' | 'suspectedoutliers' | false;
    jitter: number;
    pointpos: number;
    opacity: number;
    showscale: boolean;
    colorscale: ColorScale;
    zsmooth: 'fast' | 'best' | false;
    zmin: number;
    zmax: number;
    zorder: number;
    ygap: number;
    xgap: number;
    transpose: boolean;
    autobinx: boolean;
    xbins: {
        start: number | string;
        end: number | string;
        size: number | string;
    };
    value: number;
    values: Datum[];
    labels: Datum[];
    direction: 'clockwise' | 'counterclockwise';
    hole: number;
    rotation: number;
    theta: Datum[];
    r: Datum[];
    customdata: Datum[] | Datum[][];
    selectedpoints: Datum[];
    domain: Partial<{
        row: number;
        column: number;
        x: number[];
        y: number[];
    }>;
    title: Partial<DataTitle>;
    branchvalues: 'total' | 'remainder';
    ids: string[];
    level: string;
    cliponaxis: boolean;
    automargin: boolean;
    locationmode: 'ISO-3' | 'USA-states' | 'country names' | 'geojson-id';
    locations: Datum[];
    reversescale: boolean;
    colorbar: Partial<ColorBar>;
    offset: number | number[];
    contours: Partial<{
        coloring: 'fill' | 'heatmap' | 'lines' | 'none';
        end: number;
        labelfont: Partial<Font>;
        labelformat: string;
        operation: '=' | '<' | '>=' | '>' | '<=' | '[]' | '()' | '[)' | '(]' | '][' | ')(' | '](' | ')[';
        showlabels: boolean;
        showlines: boolean;
        size: number;
        start: number;
        type: 'levels' | 'constraint';
        value: number | [lowerBound: number, upperBound: number];
    }>;
    autocontour: boolean;
    ncontours: number;
    maxdepth: number;
    uirevision: string | number;
    uid: string;
}

// ---------------------------------------------------------------------------
// Data union — re-exports specialized trace types from traces/
// ---------------------------------------------------------------------------

export type Data =
    | Partial<PlotData>
    | Partial<BoxData>
    | Partial<ViolinData>
    | Partial<OhlcData>
    | Partial<CandlestickData>
    | Partial<PieData>
    | Partial<SankeyData>;

// ---------------------------------------------------------------------------
// Internal types (not in public API)
// ---------------------------------------------------------------------------

/**
 * Calculated trace data (internal)
 */
export interface CalcData {
    i?: number;
    t?: any;
    trace?: FullData;
    x?: any;
    y?: any;
    z?: any;
    [key: string]: any;
}

/**
 * Fully processed plot data with defaults applied (internal use)
 */
export interface FullData extends Partial<PlotData> {
    _arrayAttrs?: string[];
    _expandedIndex?: number;
    _extremes?: Record<string, any>;
    _fullInput?: any;
    _hasCalcTransform?: boolean;
    _indexToPoints?: { [key: number]: number[] };
    _input?: any;
    _length?: number;
    _meta?: { meta?: any; layout?: { meta?: any } };
    _module?: any;
    _template?: any;
    index?: number;
    [key: string]: any;
}
