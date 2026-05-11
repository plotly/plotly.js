/**
 * Layout types
 *
 * Comprehensive layout, axis, annotation, shape, scene, and supporting types.
 */

import type { Locale, Selection } from 'd3';
import type { TickFormatStop } from '../components/colorbar';
import type { RangeSelector } from '../components/rangeselector';
import type { Slider } from '../components/slider';
import type { UpdateMenu } from '../components/updatemenu';
import type { AxisType, Calendar, Color, Dash, Datum, DTickValue } from '../lib/common';
import type { Transition } from './animation';
import type { PlotData, PlotType } from './data';
import type { PlotlyHTMLElement } from './events';

// ---------------------------------------------------------------------------
// Font
// ---------------------------------------------------------------------------

export interface Font {
    color: Color;
    /**
     * HTML font family - the typeface that will be applied by the web browser.
     * Provide multiple font families, separated by commas, to indicate preference.
     * @default "Arial, sans-serif"
     */
    family: string;
    /**
     * Sets the shape and color of the shadow behind text.
     * "auto" places minimal shadow and applies contrast text font color.
     * @default "none"
     */
    shadow: string;
    /**
     * @default 13
     */
    size: number;
    /**
     * Sets the weight (or boldness) of the font.
     * @default "normal"
     */
    weight: number | 'normal' | 'bold';
    /**
     * Sets whether a font should be styled with a normal or italic face from its family.
     * @default "normal"
     */
    style: 'normal' | 'italic';
    /**
     * Sets capitalization of text.
     * @default "normal"
     */
    textcase: 'normal' | 'word caps' | 'upper' | 'lower';
    /**
     * Sets the variant of the font.
     * @default "normal"
     */
    variant: 'normal' | 'small-caps' | 'all-small-caps' | 'all-petite-caps' | 'petite-caps' | 'unicase';
    /**
     * Sets the kind of decoration line(s) with text.
     * @default "none"
     */
    lineposition:
        | 'none'
        | 'under'
        | 'over'
        | 'through'
        | 'under+over'
        | 'over+under'
        | 'over+through'
        | 'through+over'
        | 'through+under'
        | 'under+through'
        | 'under+over+through'
        | 'under+through+over'
        | 'over+under+through'
        | 'over+through+under'
        | 'through+under+over'
        | 'through+over+under';
}

// ---------------------------------------------------------------------------
// Padding / Margin / Domain
// ---------------------------------------------------------------------------

export interface Padding {
    t: number;
    r: number;
    b: number;
    l: number;
    editType: 'arraydraw';
}

export interface Margin {
    t: number;
    b: number;
    l: number;
    r: number;
    pad: number;
}

export interface Domain {
    x: number[];
    y: number[];
    row: number;
    column: number;
}

// ---------------------------------------------------------------------------
// Label / HoverLabel / Legend
// ---------------------------------------------------------------------------

export interface Label {
    bgcolor: string;
    bordercolor: string;
    font: Partial<Font>;
}

export interface HoverLabel extends Label {
    /**
     * Sets the horizontal alignment of the text content within hover label box.
     * @default "auto"
     */
    align: 'left' | 'right' | 'auto';
    /**
     * Sets the default length (in number of characters) of the trace name
     * in the hover labels for all traces. -1 shows the whole name.
     * @default 15
     */
    namelength: number;
}

export interface LegendTitle {
    font: Partial<Font>;
    side: 'top' | 'left' | 'top left' | 'top center' | 'top right';
    text: string;
}

export interface Legend extends Label {
    borderwidth: number;
    groupclick: 'toggleitem' | 'togglegroup';
    grouptitlefont: Partial<Font>;
    itemclick: 'toggle' | 'toggleothers' | false;
    itemdoubleclick: 'toggle' | 'toggleothers' | false;
    itemsizing: 'trace' | 'constant';
    itemwidth: number;
    orientation: 'v' | 'h';
    title: Partial<LegendTitle>;
    tracegroupgap: number;
    traceorder: 'grouped' | 'normal' | 'reversed' | 'reversed+grouped';
    uirevision: number | string;
    uid: string;
    valign: 'top' | 'middle' | 'bottom';
    x: number;
    xanchor: 'auto' | 'left' | 'center' | 'right';
    xref: 'container' | 'paper';
    y: number;
    yanchor: 'auto' | 'top' | 'middle' | 'bottom';
    yref: 'container' | 'paper';
}

// ---------------------------------------------------------------------------
// DataTitle / PlotNumber
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

// ---------------------------------------------------------------------------
// Axis name types
// ---------------------------------------------------------------------------

type xYAxisNames = `${
    | ''
    | `${2 | 3 | 4 | 5 | 6 | 7 | 8 | 9}`
    | `${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9}${0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9}`}${'' | ' domain'}`;

export type XAxisName = `x${xYAxisNames}`;
export type YAxisName = `y${xYAxisNames}`;
export type AxisName = XAxisName | YAxisName;

// ---------------------------------------------------------------------------
// Axis support types
// ---------------------------------------------------------------------------

export interface AutoRangeOptions {
    clipmax: DTickValue;
    clipmin: DTickValue;
    include: DTickValue;
    maxallowed: DTickValue;
    minallowed: DTickValue;
}

export interface MinorAxisLayout {
    dtick: DTickValue;
    gridcolor: Color;
    griddash: Dash;
    gridwidth: number;
    nticks: number;
    showgrid: boolean;
    tick0: DTickValue;
    tickcolor: Color;
    ticklen: number;
    tickmode: 'auto' | 'linear' | 'array';
    ticks: 'outside' | 'inside' | '';
    tickvals: any[];
    tickwidth: number;
}

export interface RangeBreak {
    bounds: any[];
    dvalue: number;
    enabled: boolean;
    name: string;
    pattern: 'day of week' | 'hour' | '';
    templateitemname: string;
    values: any[];
}

export interface RangeSlider {
    visible: boolean;
    thickness: number;
    range: [Datum, Datum];
    borderwidth: number;
    bordercolor: string;
    bgcolor: string;
}

// ---------------------------------------------------------------------------
// Axis (base)
// ---------------------------------------------------------------------------

export interface Axis {
    visible: boolean;
    color: Color;
    title: Partial<DataTitle>;
    type: AxisType;
    autorange: true | false | 'reversed' | 'min reversed' | 'max reversed' | 'min' | 'max';
    autorangeoptions: Partial<AutoRangeOptions>;
    rangemode: 'normal' | 'tozero' | 'nonnegative';
    range: any[];
    fixedrange: boolean;

    // Ticks
    tickmode: 'auto' | 'linear' | 'array' | 'sync';
    nticks: number;
    tick0: number | string;
    dtick: DTickValue;
    tickvals: any[];
    ticktext: string[];
    ticks: 'outside' | 'inside' | '';
    mirror: true | 'ticks' | false | 'all' | 'allticks';
    ticklen: number;
    tickwidth: number;
    tickcolor: Color;
    showticklabels: boolean;
    showspikes: boolean;
    spikecolor: Color;
    spikethickness: number;
    categoryorder:
        | 'trace'
        | 'category ascending'
        | 'category descending'
        | 'array'
        | 'total ascending'
        | 'total descending'
        | 'min ascending'
        | 'min descending'
        | 'max ascending'
        | 'max descending'
        | 'sum ascending'
        | 'sum descending'
        | 'mean ascending'
        | 'mean descending'
        | 'median ascending'
        | 'median descending';
    categoryarray: any[];
    tickfont: Partial<Font>;
    tickangle: 'auto' | number;
    tickprefix: string;
    showtickprefix: 'all' | 'first' | 'last' | 'none';
    ticksuffix: string;
    showticksuffix: 'all' | 'first' | 'last' | 'none';
    showexponent: 'all' | 'first' | 'last' | 'none';
    exponentformat: 'none' | 'e' | 'E' | 'power' | 'SI' | 'B';
    minexponent: number;
    separatethousands: boolean;
    tickformat: string;
    hoverformat: string;
    calendar: Calendar;
    tickformatstops: Array<Partial<TickFormatStop>>;
    spikedash: string;
    spikemode:
        | 'toaxis'
        | 'across'
        | 'marker'
        | 'toaxis+across'
        | 'toaxis+across+marker'
        | 'across+marker'
        | 'toaxis+marker';
    spikesnap: 'data' | 'cursor' | 'hovered data';

    // Lines and Grids
    showline: boolean;
    linecolor: Color;
    linewidth: number;
    showgrid: boolean;
    gridcolor: Color;
    gridwidth: number;
    zeroline: boolean;
    zerolinecolor: Color;
    zerolinewidth: number;
    showdividers: boolean;
    dividercolor: Color;
    dividerwidth: number;

    autotypenumbers: 'convert types' | 'strict';
    labelalias: DTickValue;
    maxallowed: DTickValue;
    minallowed: DTickValue;
}

// ---------------------------------------------------------------------------
// LayoutAxis
// ---------------------------------------------------------------------------

export interface LayoutAxis extends Axis {
    fixedrange: boolean;
    scaleanchor: AxisName;
    scaleratio: number;
    constrain: 'range' | 'domain';
    constraintoward: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom';
    anchor: 'free' | AxisName;
    side: 'top' | 'bottom' | 'left' | 'right' | 'clockwise' | 'counterclockwise';
    overlaying: 'free' | AxisName;
    layer: 'above traces' | 'below traces';
    domain: number[];
    position: number;
    rotation: number;
    direction: 'counterclockwise' | 'clockwise';
    rangeslider: Partial<RangeSlider>;
    rangeselector: Partial<RangeSelector>;
    automargin: boolean;
    angle: any;
    griddash: Dash;
    l2p: (v: Datum) => number;

    autotickangles: number[];
    insiderange: any[];
    matches: AxisName;
    minor: Partial<MinorAxisLayout>;
    rangebreaks: Array<Partial<RangeBreak>>;
    ticklabelmode: 'instant' | 'period';
    ticklabeloverflow: 'allow' | 'hide past div' | 'hide past domain';
    ticklabelposition:
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
    ticklabelstep: number;
    tickson: 'labels' | 'boundaries';
    uirevision: DTickValue;
}

// ---------------------------------------------------------------------------
// SceneAxis (extends Axis for 3D scenes)
// ---------------------------------------------------------------------------

export interface SceneAxis extends Axis {
    spikesides: boolean;
    showbackground: boolean;
    backgroundcolor: Color;
    showaxeslabels: boolean;
}

// ---------------------------------------------------------------------------
// Camera / Scene
// ---------------------------------------------------------------------------

export interface Point {
    x: number;
    y: number;
    z: number;
}

export interface Camera {
    up: Partial<Point>;
    center: Partial<Point>;
    eye: Partial<Point>;
}

export interface Scene {
    bgcolor: string;
    camera: Partial<Camera>;
    domain: Partial<Domain>;
    aspectmode: 'auto' | 'cube' | 'data' | 'manual';
    aspectratio: Partial<Point>;
    xaxis: Partial<SceneAxis>;
    yaxis: Partial<SceneAxis>;
    zaxis: Partial<SceneAxis>;
    dragmode: 'orbit' | 'turntable' | 'zoom' | 'pan' | false;
    hovermode: 'closest' | false;
    annotations: Partial<Annotations> | Array<Partial<Annotations>>;
    captureevents: boolean;
}

// ---------------------------------------------------------------------------
// Shape / ShapeLine / ShapeLabel
// ---------------------------------------------------------------------------

export interface ShapeLine {
    color: string;
    width: number;
    dash: Dash;
}

export interface ShapeLabel {
    font: Partial<Font>;
    padding: number;
    text: string;
    textangle: 'auto' | number;
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
        | 'start'
        | 'middle'
        | 'end';
    texttemplate: string;
    xanchor: 'auto' | 'left' | 'center' | 'right';
    yanchor: 'top' | 'middle' | 'bottom';
}

export interface Shape {
    visible: boolean | 'legendonly';
    layer: 'below' | 'above';
    type: 'rect' | 'circle' | 'line' | 'path';
    path: string;
    xref: 'paper' | XAxisName;
    xsizemode: 'scaled' | 'pixel';
    xanchor: number | string;
    yref: 'paper' | YAxisName;
    ysizemode: 'scaled' | 'pixel';
    yanchor: number | string;
    x0: Datum;
    y0: Datum;
    x1: Datum;
    y1: Datum;
    fillcolor: string;
    name: string;
    templateitemname: string;
    opacity: number;
    line: Partial<ShapeLine>;
    label: Partial<ShapeLabel>;
    showlegend: boolean;
    legendgroup: string;
    legendgrouptitle: {
        text: string;
        font?: Partial<Font>;
    };
    legendrank: number;
}

// ---------------------------------------------------------------------------
// Annotations
// ---------------------------------------------------------------------------

export interface Annotations extends Label {
    visible: boolean;
    text: string;
    textangle: string;
    width: number;
    height: number;
    opacity: number;
    align: 'left' | 'center' | 'right';
    valign: 'top' | 'middle' | 'bottom';
    borderpad: number;
    borderwidth: number;
    showarrow: boolean;
    arrowcolor: string;
    arrowhead: number;
    startarrowhead: number;
    arrowside: 'end' | 'start';
    arrowsize: number;
    startarrowsize: number;
    arrowwidth: number;
    standoff: number;
    startstandoff: number;
    ax: number;
    ay: number;
    axref: 'pixel' | XAxisName;
    ayref: 'pixel' | YAxisName;
    xref: 'paper' | XAxisName;
    x: number | string;
    xanchor: 'auto' | 'left' | 'center' | 'right';
    xshift: number;
    yref: 'paper' | YAxisName;
    y: number | string;
    yanchor: 'auto' | 'top' | 'middle' | 'bottom';
    yshift: number;
    clicktoshow: false | 'onoff' | 'onout';
    xclick: any;
    yclick: any;
    hovertext: string;
    hoverlabel: Partial<HoverLabel>;
    captureevents: boolean;
}

// ---------------------------------------------------------------------------
// Image
// ---------------------------------------------------------------------------

export interface Image {
    visible: boolean;
    source: string;
    layer: 'above' | 'below';
    sizex: number;
    sizey: number;
    sizing: 'fill' | 'contain' | 'stretch';
    opacity: number;
    x: number | string;
    y: number | string;
    xanchor: 'left' | 'center' | 'right';
    yanchor: 'top' | 'middle' | 'bottom';
    xref: 'paper' | XAxisName;
    yref: 'paper' | YAxisName;
}

// ---------------------------------------------------------------------------
// ModeBar / Icon
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

// `ModeBar` is generated from src/components/modebar/attributes.ts.
// See src/types/generated/components/modebar.d.ts.
import type { ModeBar } from '../generated/components/modebar';
export type { ModeBar };

// ---------------------------------------------------------------------------
// Gauge / Delta / Indicator types
// ---------------------------------------------------------------------------

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
    axis: Partial<Axis>;
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
// Map types
// ---------------------------------------------------------------------------

export interface MapCenter {
    lon: number;
    lat: number;
}

export interface MapSymbol {
    icon: string;
    iconsize: number;
    text: string;
    placement: 'point' | 'line' | 'line-center';
    textfont: Partial<Font>;
    textposition:
        | 'top left'
        | 'top center'
        | 'top right'
        | 'middle center'
        | 'bottom left'
        | 'bottom center'
        | 'bottom right';
}

export interface MapLayers {
    visible: boolean;
    sourcetype: 'geojson' | 'vector' | 'raster' | 'image';
    source: any;
    sourcelayer: string;
    sourceattribution: string;
    type: 'circle' | 'line' | 'fill' | 'symbol' | 'raster';
    coordinates: number | string;
    below: string;
    color: Color;
    opacity: number;
    minzoom: number;
    maxzoom: number;
    circle: {
        radius: number;
    };
    line: Partial<ShapeLine>;
    fill: {
        outlinecolor: Color;
    };
    symbol: Partial<MapSymbol>;
    name: string;
    templateitemname: string;
}

export interface MapBounds {
    east: number;
    north: number;
    south: number;
    west: number;
}

export interface MapLayout {
    domain: Partial<Domain>;
    accesstoken: string;
    style: number | string;
    center: Partial<MapCenter>;
    zoom: number;
    bearing: number;
    bounds: MapBounds;
    pitch: number;
    layers: Array<Partial<MapLayers>>;
    uirevision: number | string;
    uid: string;
}

/** @deprecated Use {@link MapCenter} instead */
export type MapboxCenter = MapCenter;
/** @deprecated Use {@link MapSymbol} instead */
export type MapboxSymbol = MapSymbol;
/** @deprecated Use {@link MapLayers} instead */
export type MapboxLayers = MapLayers;
/** @deprecated Use {@link MapBounds} instead */
export type MapboxBounds = MapBounds;
/** @deprecated Use {@link MapLayout} instead */
export type Mapbox = MapLayout;

// ---------------------------------------------------------------------------
// PolarLayout
// ---------------------------------------------------------------------------

export interface PolarLayout {
    domain: Partial<Domain>;
    sector: number[];
    hole: number;
    bgcolor: Color;
    radialaxis: Partial<LayoutAxis>;
    angularaxis: Partial<LayoutAxis>;
    gridshape: 'circular' | 'linear';
    uirevision: string | number;
    uid: string;
}

// ---------------------------------------------------------------------------
// Template
// ---------------------------------------------------------------------------

export interface Template {
    data?: { [type in PlotType]?: Array<Partial<PlotData>> } | undefined;
    layout?: Partial<Layout> | undefined;
}

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

export interface Layout {
    colorway: string[];
    title: Partial<{
        text: string;
        font: Partial<Font>;
        xref: 'container' | 'paper';
        yref: 'container' | 'paper';
        x: number;
        y: number;
        xanchor: 'auto' | 'left' | 'center' | 'right';
        yanchor: 'auto' | 'top' | 'middle' | 'bottom';
        pad: Partial<Padding>;
        subtitle:
            | string
            | Partial<{
                  text: string;
                  font: Partial<Font>;
              }>;
    }>;
    autosize: boolean;
    showlegend: boolean;
    paper_bgcolor: Color;
    plot_bgcolor: Color;
    separators: string;
    hidesources: boolean;
    xaxis: Partial<LayoutAxis>;
    [key: `xaxis${number}`]: Partial<LayoutAxis>;
    yaxis: Partial<LayoutAxis>;
    [key: `yaxis${number}`]: Partial<LayoutAxis>;
    margin: Partial<Margin>;
    height: number;
    width: number;
    hovermode: 'closest' | 'x' | 'y' | 'x unified' | 'y unified' | false;
    hoverdistance: number;
    hoverlabel: Partial<HoverLabel>;
    /**
     * Determines expansion of hover effects to other subplots.
     * @default "overlaying"
     */
    hoversubplots: 'single' | 'overlaying' | 'axis';
    calendar: Calendar;

    // Dotted property paths for Plotly.relayout convenience
    'xaxis.range': [Datum, Datum];
    'xaxis.range[0]': Datum;
    'xaxis.range[1]': Datum;
    'yaxis.range': [Datum, Datum];
    'yaxis.range[0]': Datum;
    'yaxis.range[1]': Datum;
    'yaxis.type': AxisType;
    'xaxis.type': AxisType;
    'xaxis.autorange': boolean;
    'yaxis.autorange': boolean;
    'xaxis.title': Partial<DataTitle>;
    'yaxis.title': Partial<DataTitle>;

    ternary: {};
    geo: {};
    map: Partial<MapLayout>;
    mapbox: Partial<MapLayout>;
    subplot: string;
    radialaxis: Partial<Axis>;
    angularaxis: {};
    dragmode:
        | 'zoom'
        | 'pan'
        | 'select'
        | 'lasso'
        | 'drawclosedpath'
        | 'drawopenpath'
        | 'drawline'
        | 'drawrect'
        | 'drawcircle'
        | 'orbit'
        | 'turntable'
        | false;
    orientation: number;
    annotations: Array<Partial<Annotations>>;
    shapes: Array<Partial<Shape>>;
    images: Array<Partial<Image>>;
    updatemenus: Array<Partial<UpdateMenu>>;
    sliders: Array<Partial<Slider>>;
    legend: Partial<Legend>;
    font: Partial<Font>;
    scene: Partial<Scene>;
    [key: `scene${number}`]: Partial<Scene>;
    barmode: 'stack' | 'group' | 'overlay' | 'relative';
    barnorm: '' | 'fraction' | 'percent';
    bargap: number;
    bargroupgap: number;
    boxmode: 'group' | 'overlay';
    selectdirection: 'h' | 'v' | 'd' | 'any';
    hiddenlabels: string[];
    grid: Partial<{
        rows: number;
        roworder: 'top to bottom' | 'bottom to top';
        columns: number;
        subplots: string[];
        xaxes: string[];
        yaxes: string[];
        pattern: 'independent' | 'coupled';
        xgap: number;
        ygap: number;
        domain: Partial<{
            x: number[];
            y: number[];
        }>;
        xside: 'bottom' | 'bottom plot' | 'top plot' | 'top';
        yside: 'left' | 'left plot' | 'right plot' | 'right';
    }>;
    polar: Partial<PolarLayout>;
    [key: `polar${number}`]: Partial<PolarLayout>;
    transition: Transition;
    template: Template;
    clickmode: 'event' | 'select' | 'event+select' | 'none';
    uirevision: number | string;
    uid: string;
    datarevision: number | string;
    editrevision: number | string;
    selectionrevision: number | string;
    modebar: Partial<ModeBar>;
}

// ---------------------------------------------------------------------------
// Internal types (not in public API types)
// ---------------------------------------------------------------------------

/**
 * Fully processed layout with all defaults applied (internal use)
 */
export interface FullLayout extends Layout {
    // Core internal state
    _basePlotModules?: any[];
    _calcInverseTransform?: (gd: any) => void;
    _initialAutoSizeIsDone?: boolean;
    _invTransform?: any;
    _legends?: string[];
    _meta?: { meta?: any; layout?: { meta?: any } };
    _modules?: any[];
    _plots?: { [key: string]: any };
    _pushmargin?: { [key: string]: any };
    _size?: LayoutSize;
    _subplots?: SubplotInfo;
    _template?: any;
    _uid?: string;

    // SVG layers
    _bgLayer?: Selection<any>;
    _cartesianlayer?: Selection<any>;
    _clips?: Selection<any>;
    _container?: Selection<any>;
    _defs?: Selection<any>;
    _dragCover?: Selection<any>;
    _draggers?: Selection<any>;
    _funnelarealayer?: Selection<any>;
    _geolayer?: Selection<any>;
    _glcanvas?: Selection<any>;
    _glcontainer?: Selection<any>;
    _glimages?: Selection<any>;
    _iciclelayer?: Selection<any>;
    _imageLowerLayer?: Selection<any>;
    _imageUpperLayer?: Selection<any>;
    _indicatorlayer?: Selection<any>;
    _infolayer?: Selection<any>;
    _menulayer?: Selection<any>;
    _modebardiv?: Selection<any>;
    _paper?: Selection<any>;
    _paperdiv?: Selection<any>;
    _pielayer?: Selection<any>;
    _polarlayer?: Selection<any>;
    _selectionLayer?: Selection<any>;
    _shapeLowerLayer?: Selection<any>;
    _shapeUpperLayer?: Selection<any>;
    _smithlayer?: Selection<any>;
    _sunburstlayer?: Selection<any>;
    _ternarylayer?: Selection<any>;
    _topdefs?: Selection<any>;
    _topclips?: Selection<any>;
    _toppaper?: Selection<any>;
    _treemaplayer?: Selection<any>;
    _zoomlayer?: Selection<any>;

    // Hover state
    _hoverlayer?: Selection<any>;
    _hoverpaper?: Selection<any>;
    _hoversubplot?: string | null;
    _lasthover?: Selection<any> | null;
    _rehover?: (() => void) | null;

    // Modebar
    _modeBar?: any;

    // Cross-trace computation state
    _alignmentOpts?: Record<string, any>;
    _axisConstraintGroups?: any[];
    _axisMatchGroups?: any[];
    _colorAxes?: Record<string, any>;
    _dataTemplate?: Record<string, any>;
    _extraFormat?: Record<string, any>;
    _firstScatter?: Record<string, any>;
    _funnelareacolormap?: Record<string, Color>;
    _histogramBinOpts?: Record<string, any>;
    _iciclecolormap?: Record<string, Color>;
    _numBoxes?: number;
    _numViolins?: number;
    _piecolormap?: Record<string, Color>;
    _rangeSliderData?: any[];
    _requestRangeslider?: Record<string, boolean>;
    _roundFnOpts?: Record<string, any>;
    _scatterStackOpts?: Record<string, any>;
    _splomAxes?: { x: Record<string, any>; y: Record<string, any> };
    _splomGrid?: any;
    _splomGridDflt?: Record<string, any>;
    _splomScenes?: Record<string, any>;
    _splomSubplots?: Record<string, any>;
    _sunburstcolormap?: Record<string, Color>;
    _transformModules?: any[];
    _treemapcolormap?: Record<string, Color>;
    _violinScaleGroupStats?: Record<string, any>;
    _visibleModules?: any[];

    // Scalar flags and values
    _cartesianSpikesEnabled?: 'on' | 'off';
    _currentFrame?: string;
    _d3locale?: Locale;
    _dataLength?: number;
    _enablescrollzoom?: boolean;
    _dfltTitle?: Record<string, string>;
    _guiEditing?: boolean;
    _has?: (category: string) => boolean;
    _hasOnlyLargeSploms?: boolean;
    _insideTickLabelsUpdaterange?: Record<string, any>;
    _invScaleX?: number;
    _invScaleY?: number;
    _lastBBox?: DOMRect;
    _mapboxAccessToken?: string;
    _pushmarginIds?: Record<string, number>;
    _redrawFromAutoMarginCount?: number;
    _replotting?: boolean;
    _reservedMargin?: Record<string, number>;
    _shouldCreateBgLayer?: boolean;
    _skipDefaults?: boolean;
    _traceUids?: string[];
    _traceWord?: string;
    _zindices?: number[];

    // Interaction state
    _activeSelectionIndex?: number;
    _activeShapeIndex?: number;
    _deactivateSelection?: (gd: any) => void;
    _deactivateShape?: (gd: any) => void;
    _deselect?: any;
    _hColorbarMoveCBTitle?: number;
    _hColorbarMoveTitle?: number;
    _lastSelectedSubplot?: string;
    _noEmitSelectedAtStart?: boolean;
    _outlining?: boolean;
    _preGUI?: Record<string, any>;
    _previousSelections?: any[];
    _redrag?: (() => void) | null;
    _reselect?: (() => void) | null;
    _tracePreGUI?: Record<string, Record<string, any>>;

    [key: string]: any;
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
