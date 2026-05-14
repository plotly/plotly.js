/**
 * Event types
 *
 * Plotly event payloads, the typed `on()` overloads on PlotlyHTMLElement,
 * and event-related supporting types.
 */

import type { Annotation, Layout, LayoutAxis, Slider } from '../generated/schema';
import type { Datum } from '../lib/common';
import type { AnimationFrameOpts, Frame, Transition } from './animation';
import type { Config } from './config';
import type { Data, PlotData } from './data';

// ---------------------------------------------------------------------------
// Point / datum types in events
// ---------------------------------------------------------------------------

export interface PlotScatterDataPoint {
    curveNumber: number;
    data: PlotData;
    pointIndex: number;
    pointNumber: number;
    x: number;
    xaxis: LayoutAxis;
    y: number;
    yaxis: LayoutAxis;
}

export interface PlotDatum {
    curveNumber: number;
    data: PlotData;
    customdata: Datum;
    pointIndex: number;
    pointNumber: number;
    x: Datum;
    xaxis: LayoutAxis;
    y: Datum;
    yaxis: LayoutAxis;
    text: string;
}

export interface PlotCoordinate {
    x: number;
    y: number;
    pointNumber: number;
}

export interface SelectionRange {
    x: number[];
    y: number[];
}

export type PlotSelectedData = Partial<PlotDatum>;

// ---------------------------------------------------------------------------
// Mouse / hover / selection events
// ---------------------------------------------------------------------------

export interface PlotMouseEvent {
    points: PlotDatum[];
    event: MouseEvent;
}

export interface PlotHoverEvent extends PlotMouseEvent {
    xvals: Datum[];
    yvals: Datum[];
}

export interface PlotSelectionEvent {
    points: PlotDatum[];
    range?: SelectionRange | undefined;
    lassoPoints?: SelectionRange | undefined;
}

// ---------------------------------------------------------------------------
// Restyle / Relayout events
// ---------------------------------------------------------------------------

export interface PlotRestyleEventUpdate {
    [key: string]: any;
}

export type PlotRestyleEvent = [PlotRestyleEventUpdate, number[]];

export interface PlotRelayoutEvent extends Partial<Layout> {
    'xaxis.range[0]'?: number;
    'xaxis.range[1]'?: number;
    'yaxis.range[0]'?: number;
    'yaxis.range[1]'?: number;
    'xaxis.autorange'?: boolean;
    'yaxis.autorange'?: boolean;
}

// ---------------------------------------------------------------------------
// 3D scene / annotation / animation / legend events
// ---------------------------------------------------------------------------

interface Point {
    x: number;
    y: number;
    z: number;
}

export interface PlotScene {
    center: Point;
    eye: Point;
    up: Point;
}

export interface ClickAnnotationEvent {
    index: number;
    annotation: Annotation;
    fullAnnotation: Annotation;
    event: MouseEvent;
}

export interface FrameAnimationEvent {
    name: string;
    frame: Frame;
    animation: {
        frame: AnimationFrameOpts;
        transition: Transition;
    };
}

export interface LegendClickEvent {
    event: MouseEvent;
    node: PlotlyHTMLElement;
    curveNumber: number;
    expandedIndex: number;
    data: Data[];
    layout: Partial<Layout>;
    frames: Frame[];
    config: Partial<Config>;
    fullData: Data[];
    fullLayout: Partial<Layout>;
}

// ---------------------------------------------------------------------------
// Slider events
// ---------------------------------------------------------------------------

type SliderStep = NonNullable<Slider['steps']>[number];

export interface SliderChangeEvent {
    slider: Slider;
    step: SliderStep;
    interaction: boolean;
    previousActive: number;
}

export interface SliderStartEvent {
    slider: Slider;
}

export interface SliderEndEvent {
    slider: Slider;
    step: SliderStep;
}

// ---------------------------------------------------------------------------
// Sunburst / before-plot
// ---------------------------------------------------------------------------

export interface SunburstPlotDatum {
    color: number;
    curveNumber: number;
    data: Data;
    entry: string;
    fullData: Data;
    hovertext: string;
    id: string;
    label: string;
    parent: string;
    percentEntry: number;
    percentParent: number;
    percentRoot: number;
    pointNumber: number;
    root: string;
    value: number;
}

export interface SunburstClickEvent {
    event: MouseEvent;
    nextLevel: string;
    points: SunburstPlotDatum[];
}

export interface BeforePlotEvent {
    data: Data[];
    layout: Partial<Layout>;
    config: Partial<Config>;
}

// ---------------------------------------------------------------------------
// PlotlyHTMLElement
// ---------------------------------------------------------------------------

export interface PlotlyHTMLElement extends HTMLElement {
    on(event: 'plotly_click' | 'plotly_unhover', callback: (event: PlotMouseEvent) => void): void;
    on(event: 'plotly_hover', callback: (event: PlotHoverEvent) => void): void;
    on(event: 'plotly_selecting' | 'plotly_selected', callback: (event: PlotSelectionEvent) => void): void;
    on(event: 'plotly_restyle', callback: (data: PlotRestyleEvent) => void): void;
    on(event: 'plotly_relayout' | 'plotly_relayouting', callback: (event: PlotRelayoutEvent) => void): void;
    on(event: 'plotly_clickannotation', callback: (event: ClickAnnotationEvent) => void): void;
    on(event: 'plotly_animatingframe', callback: (event: FrameAnimationEvent) => void): void;
    on(event: 'plotly_legendclick' | 'plotly_legenddoubleclick', callback: (event: LegendClickEvent) => boolean): void;
    on(event: 'plotly_sliderchange', callback: (event: SliderChangeEvent) => void): void;
    on(event: 'plotly_sliderend', callback: (event: SliderEndEvent) => void): void;
    on(event: 'plotly_sliderstart', callback: (event: SliderStartEvent) => void): void;
    on(event: 'plotly_sunburstclick', callback: (event: SunburstClickEvent) => void): void;
    on(event: 'plotly_event', callback: (data: any) => void): void;
    on(event: 'plotly_beforeplot', callback: (event: BeforePlotEvent) => boolean): void;
    on(
        event:
            | 'plotly_afterexport'
            | 'plotly_afterplot'
            | 'plotly_animated'
            | 'plotly_animationinterrupted'
            | 'plotly_autosize'
            | 'plotly_beforeexport'
            | 'plotly_deselect'
            | 'plotly_doubleclick'
            | 'plotly_framework'
            | 'plotly_redraw'
            | 'plotly_transitioning'
            | 'plotly_transitioninterrupted',
        callback: () => void
    ): void;
    removeAllListeners: (handler: string) => void;
    data: Data[];
    layout: Layout;
}

// ---------------------------------------------------------------------------
// Event name union (kept for convenience)
// ---------------------------------------------------------------------------

export type PlotlyEventName =
    | 'plotly_afterexport'
    | 'plotly_afterplot'
    | 'plotly_animated'
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
    | 'plotly_framework'
    | 'plotly_hover'
    | 'plotly_legendclick'
    | 'plotly_legenddoubleclick'
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
    | 'plotly_transitioning'
    | 'plotly_transitioninterrupted'
    | 'plotly_treemapclick'
    | 'plotly_unhover'
    | 'plotly_webglcontextlost';
