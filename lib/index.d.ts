/**
 * TypeScript type definitions for plotly.js.
 *
 * Public API surface for consumers installing plotly.js as a dependency.
 *
 * Usage:
 *
 *     import Plotly from 'plotly.js';
 *     // or
 *     import * as Plotly from 'plotly.js';
 *     // or
 *     import { newPlot, Layout, Data } from 'plotly.js';
 *
 *     const data: Data[] = [{ type: 'scatter', x: [1, 2, 3], y: [4, 5, 6] }];
 *     const layout: Partial<Layout> = { title: { text: 'Demo' } };
 *     await Plotly.newPlot(div, data, layout);
 *
 * Internal types (FullLayout, GraphDiv internals, the AttrsToType machinery,
 * etc.) live alongside the source under src/types/ but are intentionally not
 * re-exported from this entry point.
 */

export as namespace Plotly;

// ---------------------------------------------------------------------------
// Primitives & utility types
// ---------------------------------------------------------------------------

export type {
    AxisType,
    Calendar,
    Color,
    ColorScale,
    Dash,
    Datum,
    DTickValue,
    ErrorBar,
    ErrorOptions,
    MarkerSymbol,
    Pattern,
    PatternShape,
    TypedArray,
    XAnchor,
    XRef,
    YAnchor,
    YRef,
} from '../src/types/lib/common';

// ---------------------------------------------------------------------------
// Layout, axes, components, and supporting shapes
// ---------------------------------------------------------------------------

export type {
    Annotations,
    AutoRangeOptions,
    Axis,
    AxisName,
    ButtonClickEvent,
    Camera,
    DataTitle,
    Delta,
    Domain,
    Font,
    Gauge,
    GaugeBar,
    GaugeLine,
    HoverLabel,
    Icon,
    Image,
    Label,
    Layout,
    LayoutAxis,
    Legend,
    LegendTitle,
    MapLayout,
    Mapbox,
    MapBounds,
    MapboxBounds,
    MapCenter,
    MapboxCenter,
    MapLayers,
    MapboxLayers,
    MapSymbol,
    MapboxSymbol,
    Margin,
    MinorAxisLayout,
    ModeBar,
    ModeBarButton,
    ModeBarButtonAny,
    ModeBarDefaultButtons,
    Padding,
    PlotNumber,
    Point,
    PolarLayout,
    RangeBreak,
    RangeSlider,
    Scene,
    SceneAxis,
    Shape,
    ShapeLabel,
    ShapeLine,
    Template,
    Threshold,
    XAxisName,
    YAxisName,
} from '../src/types/core/layout';

// ---------------------------------------------------------------------------
// Trace data
// ---------------------------------------------------------------------------

export type {
    Data,
    PlotData,
    PlotMarker,
    PlotType,
    ScatterData,
    ScatterLine,
    ScatterMarker,
    ScatterMarkerLine,
} from '../src/types/core/data';

// ---------------------------------------------------------------------------
// Specialized trace types
// ---------------------------------------------------------------------------

export type { BoxPlotData, BoxPlotMarker } from '../src/types/traces/box';
export type { CandlestickData } from '../src/types/traces/candlestick';
export type { OhlcData } from '../src/types/traces/ohlc';
export type {
    PieData,
    PieDataTitle,
    PieDomain,
    PieFont,
    PieHoverInfo,
    PieHoverLabel,
    PieInsideTextOrientation,
    PieLine,
    PieMarker,
    PieTextPosition,
} from '../src/types/traces/pie';
export type {
    SankeyData,
    SankeyColorscale,
    SankeyDataTitle,
    SankeyDomain,
    SankeyFont,
    SankeyHoverLabel,
    SankeyLink,
    SankeyNode,
    SankeyOrientation,
} from '../src/types/traces/sankey';
export type { ViolinData } from '../src/types/traces/violin';

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

export type {
    ColorBar,
    ColorBarTitle,
    ExponentFormat,
    LengthMode,
    ShowTickLabel,
    TickFormatStop,
    TickLabelOverflow,
    TickLabelPosition,
} from '../src/types/components/colorbar';

export type { CurrentValue, Slider, SliderStep } from '../src/types/components/slider';

export type {
    UpdateMenu,
    UpdateMenuButton,
    UpdateMenuDirection,
    UpdateMenuType,
} from '../src/types/components/updatemenu';

export type {
    RangeSelector,
    RangeSelectorButton,
    RangeSelectorStep,
} from '../src/types/components/rangeselector';

// ---------------------------------------------------------------------------
// Animation & template
// ---------------------------------------------------------------------------

export type {
    AnimationFrameOpts,
    AnimationOpts,
    Frame,
    Transition,
    TransitionEasing,
} from '../src/types/core/animation';

export type {
    TemplateFigure,
    ValidateTemplateResult,
} from '../src/types/core/template';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

export type {
    Config,
    ConfigEdits,
    DownloadImgopts,
    Edits,
    ToImageButtonOptions,
    ToImgopts,
} from '../src/types/core/config';

// ---------------------------------------------------------------------------
// Events & runtime DOM types
// ---------------------------------------------------------------------------

export type {
    BeforePlotEvent,
    ClickAnnotationEvent,
    FrameAnimationEvent,
    LegendClickEvent,
    PlotCoordinate,
    PlotDatum,
    PlotHoverEvent,
    PlotlyEventName,
    PlotlyHTMLElement,
    PlotMouseEvent,
    PlotRelayoutEvent,
    PlotRestyleEvent,
    PlotRestyleEventUpdate,
    PlotScatterDataPoint,
    PlotScene,
    PlotSelectedData,
    PlotSelectionEvent,
    SelectionRange,
    SliderChangeEvent,
    SliderEndEvent,
    SliderStartEvent,
    SunburstClickEvent,
    SunburstPlotDatum,
} from '../src/types/core/events';

// ---------------------------------------------------------------------------
// Public API functions
// ---------------------------------------------------------------------------

export {
    addFrames,
    addTraces,
    animate,
    deleteFrames,
    deleteTraces,
    downloadImage,
    extendTraces,
    makeTemplate,
    moveTraces,
    newPlot,
    prependTraces,
    purge,
    react,
    redraw,
    register,
    relayout,
    restyle,
    setPlotConfig,
    toImage,
    update,
    validate,
} from '../src/types/core/api';

export type {
    DefaultIcons,
    PlotlyDataLayoutConfig,
    PlotlyModule,
    Root,
    RootOrData,
    StaticPlots,
    ValidateResult,
} from '../src/types/core/api';

// ---------------------------------------------------------------------------
// Default export — matches the runtime CommonJS shape
// ---------------------------------------------------------------------------

import * as PlotlyAPI from '../src/types/core/api';
declare const Plotly: typeof PlotlyAPI;
export default Plotly;
