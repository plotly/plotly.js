/**
 * Public API function types for Plotly.js
 */

import type { AnimationOpts, Frame, Layout } from '../generated/schema';
import type { Config, DownloadImgopts, ToImgopts } from './config';
import type { Data } from './data';
import type { PlotlyHTMLElement } from './events';
import type { Icon, Template } from './layout';

// ---------------------------------------------------------------------------
// Roots and request shapes
// ---------------------------------------------------------------------------

/**
 * Target accepted by most `Plotly.*` calls — either a DOM id string or the
 * `HTMLElement` itself (typically the graph div).
 */
export type Root = string | HTMLElement;

/**
 * Figure-shaped object accepted by `toImage`/`downloadImage` when called
 * without an attached graph div.
 */
export interface PlotlyDataLayoutConfig {
    /** Trace data array. */
    data: Data[];
    /** Optional layout overrides. */
    layout?: Partial<Layout>;
    /** Optional config overrides. */
    config?: Partial<Config>;
}

/** Either a regular root target or a figure-shaped object. */
export type RootOrData = Root | PlotlyDataLayoutConfig;

// ---------------------------------------------------------------------------
// Static plots / icons
// ---------------------------------------------------------------------------

/** Namespace of static plot helpers (`Plotly.Plots`). */
export interface StaticPlots {
    /** Recompute layout/sizing for the given root. */
    resize(root: Root): void;
}

/** Names of icons bundled with Plotly's mode-bar. */
export type DefaultIcons =
    | 'undo'
    | 'home'
    | 'camera-retro'
    | 'zoombox'
    | 'pan'
    | 'zoom_plus'
    | 'zoom_minus'
    | 'autoscale'
    | 'tooltip_basic'
    | 'tooltip_compare'
    | 'plotlylogo'
    | 'z-axis'
    | '3d_rotate'
    | 'camera'
    | 'movie'
    | 'question'
    | 'disk'
    | 'drawopenpath'
    | 'drawclosedpath'
    | 'lasso'
    | 'selectbox'
    | 'drawline'
    | 'drawrect'
    | 'drawcircle'
    | 'eraseshape'
    | 'spikeline'
    | 'pencil'
    | 'newplotlylogo';

/** Map of built-in icon name → `Icon` definition. */
export type IconsMap = { [K in DefaultIcons]: Icon };

/** Static map of built-in icons (`Plotly.Icons`). */
export declare const Icons: IconsMap;
/** Static plot helpers namespace (`Plotly.Plots`). */
export declare const Plots: StaticPlots;

// ---------------------------------------------------------------------------
// Module registration
// ---------------------------------------------------------------------------

/** Module descriptor for a trace type (passed to `Plotly.register`). */
export interface RegisterTraceModule {
    /** Discriminator: trace module. */
    moduleType: 'trace';
    /** Trace type name (e.g. `'bar'`). */
    name: string;
    /** Categorical tags used by the schema and plot routing. */
    categories: string[];
    /** Module metadata shown in schema docs. */
    meta: {
        /** Free-form description of the trace. */
        description: string;
    };
}

/** Module descriptor for a locale bundle. */
export interface LocaleModule {
    /** Discriminator: locale module. */
    moduleType: 'locale';
    /** Locale id (e.g. `'fr'`, `'en-US'`). */
    name: string;
    /** Translation strings keyed by source phrase. */
    dictionary: Record<string, unknown>;
    /** d3-format-style number/date format spec for the locale. */
    format: Record<string, unknown>;
}

/** Module descriptor for a layout component (e.g. shapes, annotations). */
export interface RegisterComponentModule {
    /** Discriminator: component module. */
    moduleType: 'component';
    /** Component name. */
    name: string;
}

/** Module descriptor that registers an extra `Plotly.<name>` method. */
export interface ApiMethodModule {
    /** Discriminator: API method module. */
    moduleType: 'apiMethod';
    /** Name under which the function is exposed on `Plotly`. */
    name: string;
    /** Implementation function. */
    fn: any;
}

/** Union of all module descriptors accepted by `Plotly.register`. */
export type PlotlyModule = RegisterTraceModule | LocaleModule | RegisterComponentModule | ApiMethodModule;

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/** Validation issue returned by `Plotly.validate`. */
export interface ValidateResult {
    /** Issue code (e.g. `'invisible'`, `'unused'`). */
    code: string;
    /** Which container the issue is in. */
    container: 'data' | 'layout';
    /** Index into `data` (or `null` for layout issues). */
    trace: number | null;
    /** Path components leading to the offending attribute. */
    path: string | (string | number)[];
    /** Dot-joined attribute path string. */
    astr: string;
    /** Human-readable description of the issue. */
    msg: string;
}

/** Validation issue returned by `Plotly.validateTemplate`. */
export interface ValidateTemplateResult {
    /** Issue code. */
    code: string;
    /** Index of the offending template entry. */
    index?: number;
    /** Trace type of the offending entry. */
    traceType?: string;
    /** Count of matching template entries. */
    templateCount?: number;
    /** Count of matching data entries. */
    dataCount?: number;
    /** Attribute path string. */
    path?: string;
    /** `templateitemname` value involved in the issue. */
    templateitemname?: string;
    /** Human-readable description of the issue. */
    msg: string;
}

// ---------------------------------------------------------------------------
// Function declarations
// ---------------------------------------------------------------------------

/**
 * Create a new plot at `root`. Replaces any existing plot.
 *
 * @param root - graph div id or element
 * @param data - trace data array
 * @param layout - layout overrides
 * @param config - config overrides
 * @returns the graph div once the plot has rendered
 */
export function newPlot(
    root: Root,
    data: Data[],
    layout?: Partial<Layout>,
    config?: Partial<Config>
): Promise<PlotlyHTMLElement>;

/** Update layout properties on an existing plot. */
export function relayout(root: Root, layout: Partial<Layout>): Promise<PlotlyHTMLElement>;
/** Re-render the plot at `root` from its current data/layout. */
export function redraw(root: Root): Promise<PlotlyHTMLElement>;
/** Remove a plot and its event listeners from the DOM. */
export function purge(root: Root): void;
/**
 * Update trace properties (style) on the existing plot.
 *
 * @param aobj - update object whose keys are attribute paths
 * @param traces - trace index/indices to update (defaults to all)
 */
export function restyle(root: Root, aobj: Data, traces?: number[] | number): Promise<PlotlyHTMLElement>;

/**
 * Update both trace and layout properties in a single call.
 *
 * @param traceUpdate - per-trace updates
 * @param layoutUpdate - layout updates
 * @param traces - trace index/indices `traceUpdate` applies to
 */
export function update(
    root: Root,
    traceUpdate: Data,
    layoutUpdate: Partial<Layout>,
    traces?: number[] | number
): Promise<PlotlyHTMLElement>;

/**
 * Add one or more traces to an existing plot.
 *
 * @param traces - trace(s) to add
 * @param newIndices - position(s) in `data` where the traces should land
 */
export function addTraces(
    root: Root,
    traces: Data | Data[],
    newIndices?: number[] | number
): Promise<PlotlyHTMLElement>;

/** Remove trace(s) from a plot by index. */
export function deleteTraces(root: Root, indices: number[] | number): Promise<PlotlyHTMLElement>;

/**
 * Reorder existing traces.
 *
 * @param currentIndices - current trace indices to move
 * @param newIndices - destination indices; if omitted, traces move to the end
 */
export function moveTraces(
    root: Root,
    currentIndices: number[] | number,
    newIndices?: number[] | number
): Promise<PlotlyHTMLElement>;

/**
 * Append new data points to existing traces. Honors `maxPoints` to keep a
 * rolling window per trace.
 */
export function extendTraces(
    root: Root,
    update: Data | Data[],
    indices: number | number[],
    maxPoints?: number
): Promise<PlotlyHTMLElement>;

/** Like `extendTraces`, but prepends data instead of appending. */
export function prependTraces(
    root: Root,
    update: Data | Data[],
    indices: number | number[]
): Promise<PlotlyHTMLElement>;

/** Render the plot to a data URI or SVG string. */
export function toImage(root: RootOrData, opts?: ToImgopts): Promise<string>;
/** Render the plot and trigger a browser download. */
export function downloadImage(root: RootOrData, opts: DownloadImgopts): Promise<string>;

/**
 * Reconcile the plot's current state with the supplied figure. Comparable
 * to React's reconciliation: only changed attributes are reapplied.
 */
export function react(
    root: Root,
    data: Data[],
    layout?: Partial<Layout>,
    config?: Partial<Config>
): Promise<PlotlyHTMLElement>;

/** Add animation frames to the plot's frame store. */
export function addFrames(root: Root, frames: Array<Partial<Frame>>): Promise<PlotlyHTMLElement>;
/** Remove frames from the plot's frame store by index. */
export function deleteFrames(root: Root, frames: number[]): Promise<PlotlyHTMLElement>;
/** Register one or more Plotly modules (trace, locale, component, or apiMethod). */
export function register(modules: PlotlyModule | PlotlyModule[]): void;

/**
 * Animate to a frame, frame group, or sequence of frames.
 *
 * @param frameOrGroupNameOrFrameList - frame name, group name, or list of either
 * @param opts - animation options (frame timing, transition, mode, …)
 */
export function animate(
    root: Root,
    frameOrGroupNameOrFrameList?: string | string[] | Partial<Frame> | Array<Partial<Frame>>,
    opts?: Partial<AnimationOpts>
): Promise<void>;

/** Validate a figure and return a list of issues (empty array means OK). */
export function validate(data: Data[], layout: Partial<Layout>): ValidateResult[];
/** Apply config defaults globally to subsequently-created plots. */
export function setPlotConfig(config: Partial<Config>): void;

/** Figure passed to `makeTemplate`/`validateTemplate`. */
export type TemplateFigure = Root | { data: Data[]; layout: Partial<Layout> };
/** Build a `Template` object from a representative figure. */
export function makeTemplate(figure: TemplateFigure): Template;
/** Check whether `template` is correctly applied to `figure`. */
export function validateTemplate(figure: TemplateFigure, template: Template): ValidateTemplateResult[];
