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
    Color,
    ColorScale,
    Datum,
    DTickValue,
    ErrorBar,
    ErrorOptions,
    MarkerSymbol,
    TypedArray,
    XAnchor,
    YAnchor
} from '../src/types/lib/common';

// ---------------------------------------------------------------------------
// Schema-generated types (traces, layout, shared interfaces)
// ---------------------------------------------------------------------------

export type * from '../src/types/generated/schema';

// ---------------------------------------------------------------------------
// Hand-written layout types (not in schema)
// ---------------------------------------------------------------------------

export type {
    AxisName,
    ButtonClickEvent,
    Icon,
    Mapbox,
    ModeBarButton,
    ModeBarButtonAny,
    ModeBarDefaultButtons,
    Template,
    XAxisName,
    YAxisName
} from '../src/types/core/layout';

// ---------------------------------------------------------------------------
// Trace data
// ---------------------------------------------------------------------------

export type { Data } from '../src/types/core/data';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

export type {
    Config,
    DownloadImgopts,
    ToImageButtonOptions,
    ToImgopts
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
    SunburstPlotDatum
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
    Icons,
    makeTemplate,
    moveTraces,
    newPlot,
    Plots,
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
    validateTemplate
} from '../src/types/core/api';

export type {
    DefaultIcons,
    IconsMap,
    PlotlyDataLayoutConfig,
    PlotlyModule,
    Root,
    RootOrData,
    StaticPlots,
    TemplateFigure,
    ValidateResult,
    ValidateTemplateResult
} from '../src/types/core/api';

// ---------------------------------------------------------------------------
// Default export — matches the runtime CommonJS shape
// ---------------------------------------------------------------------------

import * as PlotlyAPI from '../src/types/core/api';
declare const Plotly: typeof PlotlyAPI;
export default Plotly;
