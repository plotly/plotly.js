/**
 * Event types
 *
 * Plotly event payloads, the typed `on()` overloads on PlotlyHTMLElement,
 * and event-related supporting types.
 */

import type {
    AnimationFrameOpts,
    Annotation,
    Data,
    Frame,
    Layout,
    LayoutAxis,
    Slider,
    Transition,
    UpdateMenu
} from '../generated/schema';
import type { Datum } from '../lib/common';
import type { Config } from './config';
import type { LayoutUpdate } from './layout';

// ---------------------------------------------------------------------------
// Point / datum types in events
// ---------------------------------------------------------------------------

/**
 * Numeric point payload returned by some scatter events that only carry
 * coordinate values (no `Datum` widening, no `customdata`).
 */
export interface PlotScatterDataPoint {
    /** Index of the trace producing this point. */
    curveNumber: number;
    /** The trace this point belongs to. */
    data: Data;
    /** Index of the point within the trace's data arrays. */
    pointIndex: number;
    /** Point index after transforms (often equals `pointIndex`). */
    pointNumber: number;
    /** Numeric x coordinate. */
    x: number;
    /** Axis the point's x is plotted against. */
    xaxis: LayoutAxis;
    /** Numeric y coordinate. */
    y: number;
    /** Axis the point's y is plotted against. */
    yaxis: LayoutAxis;
}

/**
 * General point payload used by click/hover/selection events. Coordinates
 * are `Datum` because they may be strings, dates, or null in addition to
 * numbers.
 */
export interface PlotDatum {
    /** Normalized ternary component a. */
    a?: number;
    /** Normalized ternary component b. */
    b?: number;
    /** Normalized ternary component c. */
    c?: number;
    /** Index of the trace producing this point. */
    curveNumber: number;
    /** The trace this point belongs to. */
    data: Data;
    /** User-supplied `customdata` entry for this point. */
    customdata: Datum;
    /** Index of the point within the trace's data arrays. */
    pointIndex: number;
    /** Point index after transforms (often equals `pointIndex`). */
    pointNumber: number;
    /** x coordinate of the point. */
    x: Datum;
    /** Axis the point's x is plotted against. */
    xaxis: LayoutAxis;
    /** Point center x position in pixels from the graph div's top-left corner */
    xPixel?: number;
    /** y coordinate of the point. */
    y: Datum;
    /** Axis the point's y is plotted against. */
    yaxis: LayoutAxis;
    /** Point center y position in pixels from the graph div's top-left corner */
    yPixel?: number;
    /** Resolved hover/display text for the point. */
    text: string;
}

/** A 2-D coordinate plus point identifier, used by lasso/select shapes. */
export interface PlotCoordinate {
    /** x coordinate. */
    x: number;
    /** y coordinate. */
    y: number;
    /** Index of the point within its trace. */
    pointNumber: number;
}

/** Rectangular selection range in axis coordinates. */
export interface SelectionRange {
    /** `[xmin, xmax]`. */
    x: number[];
    /** `[ymin, ymax]`. */
    y: number[];
}

/** Snapshot of a single point in a selection — all `PlotDatum` fields optional. */
export type PlotSelectedData = Partial<PlotDatum>;

// ---------------------------------------------------------------------------
// Mouse / hover / selection events
// ---------------------------------------------------------------------------

/** Payload for `plotly_click` and `plotly_unhover` events. */
export interface PlotMouseEvent {
    /** Points under the cursor at the moment of the event. */
    points: PlotDatum[];
    /** The original DOM mouse event. */
    event: MouseEvent;
    /** Cursor x position in pixels from the graph div's top-left corner */
    xPixel?: number;
    /** Cursor y position in pixels from the graph div's top-left corner */
    yPixel?: number;
    /** Category constraints of the hovered or clicked path, set by `parcats` traces only. */
    constraints?: Record<string, any>;
}

/** Payload for `plotly_hover` — augments `PlotMouseEvent` with axis values. */
export interface PlotHoverEvent extends PlotMouseEvent {
    /** x values at the hover location, one per active axis. */
    xvals: Datum[];
    /** y values at the hover location, one per active axis. */
    yvals: Datum[];
}

/** Payload for `plotly_selected` / `plotly_selecting`. */
export interface PlotSelectionEvent {
    /** Points inside the selection region. */
    points: PlotDatum[];
    /** Rectangular range for box selection, when applicable. */
    range?: SelectionRange | undefined;
    /** Lasso polygon points, when applicable. */
    lassoPoints?: SelectionRange | undefined;
}

// ---------------------------------------------------------------------------
// Restyle / Relayout events
// ---------------------------------------------------------------------------

/**
 * `update` object emitted by `plotly_restyle`. Keys are attribute paths
 * (e.g. `'marker.color'`) and values are the new values being applied.
 */
export interface PlotRestyleEventUpdate {
    /** Attribute path → new value(s). */
    [key: string]: any;
}

/** Tuple emitted by `plotly_restyle`: the update object and the affected trace indices. */
export type PlotRestyleEvent = [PlotRestyleEventUpdate, number[]];

/**
 * Payload for `plotly_relayout`. The keys are layout properties or attribute
 * paths of the changed values, for example `'xaxis.range[0]'`. A value behind an
 * attribute path has the type `any`, because a range value can be a number or a
 * date string.
 */
export type PlotRelayoutEvent = LayoutUpdate;

/** Payload for `plotly_update`: the restyle and relayout payloads of one `Plotly.update` call. */
export interface PlotUpdateEvent {
    /** Restyle part of the update: the attribute changes and the affected trace indices. */
    data: PlotRestyleEvent;
    /** Relayout part of the update. */
    layout: PlotRelayoutEvent;
}

// ---------------------------------------------------------------------------
// 3D scene / annotation / animation / legend events
// ---------------------------------------------------------------------------

/** Local 3-D coordinate triple used by `PlotScene`. */
interface Point {
    /** x coordinate. */
    x: number;
    /** y coordinate. */
    y: number;
    /** z coordinate. */
    z: number;
}

/** Camera state of a 3-D scene (Plotly.js scene). */
export interface PlotScene {
    /** Point the camera is looking at. */
    center: Point;
    /** Position of the camera. */
    eye: Point;
    /** Up direction of the camera. */
    up: Point;
}

/** Payload for `plotly_clickannotation`. */
export interface ClickAnnotationEvent {
    /** Index of the annotation in `layout.annotations`. */
    index: number;
    /** User-supplied annotation object. */
    annotation: Annotation;
    /** Fully-resolved annotation with defaults applied. */
    fullAnnotation: Annotation;
    /** The original DOM mouse event. */
    event: MouseEvent;
}

/** Payload for `plotly_animatingframe`, emitted as each frame is rendered. */
export interface FrameAnimationEvent {
    /** Name of the active frame. */
    name: string;
    /** The frame being animated. */
    frame: Frame;
    /** Animation options applied for this frame. */
    animation: {
        /** Per-frame animation options (duration, redraw, etc.). */
        frame: AnimationFrameOpts;
        /** Transition options (duration, easing). */
        transition: Transition;
    };
}

/**
 * Payload for `plotly_legendclick` and `plotly_legenddoubleclick`. Return
 * `false` from the handler to suppress Plotly's default toggle behavior.
 */
export interface LegendClickEvent {
    /** The original DOM mouse event. */
    event: MouseEvent;
    /** The graph div element. */
    node: PlotlyHTMLElement;
    /** Trace index for the legend entry. */
    curveNumber: number;
    /** Expanded trace index (after array attribute expansion). */
    expandedIndex: number;
    /** User-supplied data array. */
    data: Data[];
    /** User-supplied layout object. */
    layout: Partial<Layout>;
    /** All animation frames defined on the graph. */
    frames: Frame[];
    /** User-supplied config object. */
    config: Partial<Config>;
    /** Fully-resolved data array (defaults applied). */
    fullData: Data[];
    /** Fully-resolved layout object (defaults applied). */
    fullLayout: Partial<Layout>;
}

/**
 * Payload for `plotly_legendtitleclick` and `plotly_legendtitledoubleclick`.
 * Return `false` from the handler to suppress Plotly's default title click behavior.
 */
export interface LegendTitleClickEvent {
    /** The original DOM mouse event. */
    event: MouseEvent;
    /** Id of the legend whose title was clicked, for example `'legend2'`. */
    legendId: string;
    /** User-supplied data array. */
    data: Data[];
    /** User-supplied layout object. */
    layout: Partial<Layout>;
    /** Fully-resolved data array (defaults applied). */
    fullData: Data[];
    /** Fully-resolved layout object (defaults applied). */
    fullLayout: Partial<Layout>;
}

/**
 * Payload for `plotly_react`. The event does not fire if the call changed the config.
 * The `config` and `layout` values are `undefined` if the `Plotly.react` call omitted them.
 */
export interface PlotReactEvent {
    /** User-supplied config object. */
    config: Partial<Config> | undefined;
    /** User-supplied data array. */
    data: Data[];
    /** User-supplied layout object. */
    layout: Partial<Layout> | undefined;
}

/** Payload for `plotly_buttonclicked`, emitted when a button of an updatemenu is clicked. */
export interface ButtonClickedEvent {
    /** The updatemenu that holds the button. */
    menu: UpdateMenu;
    /** The clicked button. */
    button: NonNullable<UpdateMenu['buttons']>[number];
    /** Index of the active button, or `-1` if none is active. */
    active: number;
}

// ---------------------------------------------------------------------------
// Slider events
// ---------------------------------------------------------------------------

/** Convenience alias for a single step entry on a `Slider`. */
type SliderStep = NonNullable<Slider['steps']>[number];

/** Payload for `plotly_sliderchange`, fired when the active step changes. */
export interface SliderChangeEvent {
    /** The slider whose state changed. */
    slider: Slider;
    /** The newly-active step. */
    step: SliderStep;
    /** True when triggered by user interaction (vs. programmatic). */
    interaction: boolean;
    /** Index of the previously-active step. */
    previousActive: number;
}

/** Payload for `plotly_sliderstart`, fired when slider interaction begins. */
export interface SliderStartEvent {
    /** The slider being interacted with. */
    slider: Slider;
}

/** Payload for `plotly_sliderend`, fired when slider interaction ends. */
export interface SliderEndEvent {
    /** The slider being interacted with. */
    slider: Slider;
    /** The step at which interaction ended. */
    step: SliderStep;
}

// ---------------------------------------------------------------------------
// WebGL context events
// ---------------------------------------------------------------------------

/** Payload for `plotly_webglcontextlost`, emitted when a WebGL context is lost. */
export interface WebGLContextLostEvent {
    /** The original DOM `webglcontextlost` event. */
    event: WebGLContextEvent;
    /** Identifier of the regl layer or the gl3d scene that lost its context. */
    layer: string;
}

// ---------------------------------------------------------------------------
// Sunburst / before-plot
// ---------------------------------------------------------------------------

/** Point payload for `plotly_sunburstclick`. Treemap and icicle traces emit the same point shape. */
export interface SunburstPlotDatum {
    /** Color value associated with the sector. Present only if the trace sets `marker.colors`. */
    color?: number | undefined;
    /** Index of the trace producing this sector. */
    curveNumber: number;
    /** The trace this sector belongs to. */
    data: Data;
    /** Entry sector id (the entry point of the sunburst hierarchy). */
    entry: string;
    /** Fully-resolved trace data. */
    fullData: Data;
    /** Hover text shown for this sector. Present only if the trace sets `hovertext`. */
    hovertext?: string | undefined;
    /** Hierarchical id of the sector. Present only if the trace sets `ids`. */
    id?: string | undefined;
    /** Display label of the sector. Present only if the trace sets `labels`. */
    label?: string | undefined;
    /** Parent sector id. Absent on the root sector. */
    parent?: string | undefined;
    /** Percentage of the immediate entry sector this sector represents. */
    percentEntry: number;
    /** Percentage of the parent sector this sector represents. */
    percentParent: number;
    /** Percentage of the root sector this sector represents. */
    percentRoot: number;
    /** Index of the sector within the trace. */
    pointNumber: number;
    /** Root sector id. */
    root: string;
    /** Numeric value of the sector. Present only if the trace sets `values`. */
    value?: number | undefined;
}

/** Point payload for `plotly_treemapclick`. Same shape as `SunburstPlotDatum`. */
export type TreemapPlotDatum = SunburstPlotDatum;

/** Point payload for `plotly_icicleclick`. Same shape as `SunburstPlotDatum`. */
export type IciclePlotDatum = SunburstPlotDatum;

/** Payload for `plotly_sunburstclick`. Treemap and icicle traces emit the same payload, including the next-level entry. */
export interface SunburstClickEvent {
    /** The original DOM mouse event. */
    event: MouseEvent;
    /** Sector id that becomes the entry on click. Absent when the click does not change the entry, as on a sunburst root or leaf. */
    nextLevel?: string;
    /** Clicked sector(s). */
    points: SunburstPlotDatum[];
}

/** Payload for `plotly_treemapclick`. Same shape as `SunburstClickEvent`. */
export type TreemapClickEvent = SunburstClickEvent;

/** Payload for `plotly_icicleclick`. Same shape as `SunburstClickEvent`. */
export type IcicleClickEvent = SunburstClickEvent;

/**
 * Payload for `plotly_beforeplot`. Returning `false` from the handler
 * cancels the plot operation.
 */
export interface BeforePlotEvent {
    /** Data array about to be plotted. */
    data: Data[];
    /** Layout about to be applied. */
    layout: Partial<Layout>;
    /** Config about to be applied. */
    config: Partial<Config>;
}

// ---------------------------------------------------------------------------
// PlotlyHTMLElement
// ---------------------------------------------------------------------------

/**
 * The graph div returned by `Plotly.newPlot` and friends. Extends
 * `HTMLElement` with Plotly-specific event subscriptions, the resolved
 * data/layout, and lifecycle helpers.
 */
export interface PlotlyHTMLElement extends HTMLElement {
    /** Subscribe to click or unhover events. */
    on(event: 'plotly_click' | 'plotly_unhover', callback: (event: PlotMouseEvent) => void): void;
    /** Subscribe to hover events. */
    on(event: 'plotly_hover', callback: (event: PlotHoverEvent) => void): void;
    /** Subscribe to selection events (in-progress and finalized). */
    on(event: 'plotly_selecting' | 'plotly_selected', callback: (event: PlotSelectionEvent) => void): void;
    /** Subscribe to restyle events (trace attribute updates). */
    on(event: 'plotly_restyle', callback: (data: PlotRestyleEvent) => void): void;
    /** Subscribe to relayout events (layout updates, including in-progress). */
    on(event: 'plotly_relayout' | 'plotly_relayouting', callback: (event: PlotRelayoutEvent) => void): void;
    /** Subscribe to update events (`Plotly.update` calls). */
    on(event: 'plotly_update', callback: (event: PlotUpdateEvent) => void): void;
    /** Subscribe to WebGL context loss events. */
    on(event: 'plotly_webglcontextlost', callback: (event: WebGLContextLostEvent) => void): void;
    /** Subscribe to annotation click events. */
    on(event: 'plotly_clickannotation', callback: (event: ClickAnnotationEvent) => void): void;
    /** Subscribe to per-frame animation events. */
    on(event: 'plotly_animatingframe', callback: (event: FrameAnimationEvent) => void): void;
    /** Subscribe to legend click events; return `false` to suppress default toggle. */
    on(
        event: 'plotly_legendclick' | 'plotly_legenddoubleclick',
        callback: (event: LegendClickEvent) => boolean | void
    ): void;
    /** Subscribe to legend title click events; return `false` to suppress default behavior. */
    on(
        event: 'plotly_legendtitleclick' | 'plotly_legendtitledoubleclick',
        callback: (event: LegendTitleClickEvent) => boolean | void
    ): void;
    /** Subscribe to react events. */
    on(event: 'plotly_react', callback: (event: PlotReactEvent) => void): void;
    /** Subscribe to updatemenu button click events. */
    on(event: 'plotly_buttonclicked', callback: (event: ButtonClickedEvent) => void): void;
    /** Subscribe to pre-hover events; return `false` to cancel the hover. */
    on(event: 'plotly_beforehover', callback: (event: MouseEvent) => boolean | void): void;
    /** Subscribe to slider change events. */
    on(event: 'plotly_sliderchange', callback: (event: SliderChangeEvent) => void): void;
    /** Subscribe to slider end-of-interaction events. */
    on(event: 'plotly_sliderend', callback: (event: SliderEndEvent) => void): void;
    /** Subscribe to slider start-of-interaction events. */
    on(event: 'plotly_sliderstart', callback: (event: SliderStartEvent) => void): void;
    /** Subscribe to sunburst sector click events; return `false` to suppress the default zoom. */
    on(event: 'plotly_sunburstclick', callback: (event: SunburstClickEvent) => boolean | void): void;
    /** Subscribe to treemap sector click events; return `false` to suppress the default zoom. */
    on(event: 'plotly_treemapclick', callback: (event: TreemapClickEvent) => boolean | void): void;
    /** Subscribe to icicle sector click events; return `false` to suppress the default zoom. */
    on(event: 'plotly_icicleclick', callback: (event: IcicleClickEvent) => boolean | void): void;
    /** Subscribe to generic plotly events (low-level catch-all). */
    on(event: 'plotly_event', callback: (data: any) => void): void;
    /** Subscribe to pre-plot events; return `false` to cancel plotting. */
    on(event: 'plotly_beforeplot', callback: (event: BeforePlotEvent) => boolean | void): void;
    /** Subscribe to bare lifecycle events that carry no payload. */
    on(
        event:
            | 'plotly_afterexport'
            | 'plotly_afterplot'
            | 'plotly_animated'
            | 'plotly_animating'
            | 'plotly_animationinterrupted'
            | 'plotly_autosize'
            | 'plotly_beforeexport'
            | 'plotly_deselect'
            | 'plotly_doubleclick'
            | 'plotly_exportfail'
            | 'plotly_framework'
            | 'plotly_redraw'
            | 'plotly_transitioned'
            | 'plotly_transitioning'
            | 'plotly_transitioninterrupted',
        callback: () => void
    ): void;
    /** Remove all listeners for the named event. */
    removeAllListeners: (handler: string) => void;
    /** Resolved data array currently rendered on the graph. */
    data: Data[];
    /** Resolved layout currently applied to the graph. */
    layout: Layout;
}

// ---------------------------------------------------------------------------
// Event name union (kept for convenience)
// ---------------------------------------------------------------------------

/** Union of every plotly event name. Use to constrain `event` parameters. */
export type PlotlyEventName =
    | 'plotly_afterexport'
    | 'plotly_afterplot'
    | 'plotly_animated'
    | 'plotly_animating'
    | 'plotly_animatingframe'
    | 'plotly_animationinterrupted'
    | 'plotly_autosize'
    | 'plotly_beforeexport'
    | 'plotly_beforehover'
    | 'plotly_beforeplot'
    | 'plotly_buttonclicked'
    | 'plotly_click'
    | 'plotly_clickannotation'
    | 'plotly_deselect'
    | 'plotly_doubleclick'
    | 'plotly_exportfail'
    | 'plotly_framework'
    | 'plotly_hover'
    | 'plotly_icicleclick'
    | 'plotly_legendclick'
    | 'plotly_legenddoubleclick'
    | 'plotly_legendtitleclick'
    | 'plotly_legendtitledoubleclick'
    | 'plotly_react'
    | 'plotly_redraw'
    | 'plotly_relayout'
    | 'plotly_relayouting'
    | 'plotly_restyle'
    | 'plotly_selected'
    | 'plotly_selecting'
    | 'plotly_sliderchange'
    | 'plotly_sliderend'
    | 'plotly_sliderstart'
    | 'plotly_sunburstclick'
    | 'plotly_transitioned'
    | 'plotly_transitioning'
    | 'plotly_transitioninterrupted'
    | 'plotly_treemapclick'
    | 'plotly_unhover'
    | 'plotly_update'
    | 'plotly_webglcontextlost';
