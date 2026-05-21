/**
 * Public API function types for Plotly.js
 */

import type { AnimationOpts, Frame } from '../generated/schema';
import type { Config, DownloadImgopts, ToImgopts } from './config';
import type { Data } from './data';
import type { PlotlyHTMLElement } from './events';
import type { Icon, Layout, Template } from './layout';

// ---------------------------------------------------------------------------
// Roots and request shapes
// ---------------------------------------------------------------------------

export type Root = string | HTMLElement;

export interface PlotlyDataLayoutConfig {
    data: Data[];
    layout?: Partial<Layout>;
    config?: Partial<Config>;
}

export type RootOrData = Root | PlotlyDataLayoutConfig;

// ---------------------------------------------------------------------------
// Static plots / icons
// ---------------------------------------------------------------------------

export interface StaticPlots {
    resize(root: Root): void;
}

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

export type IconsMap = { [K in DefaultIcons]: Icon };

export declare const Icons: IconsMap;
export declare const Plots: StaticPlots;

// ---------------------------------------------------------------------------
// Module registration
// ---------------------------------------------------------------------------

export interface RegisterTraceModule {
    moduleType: 'trace';
    name: string;
    categories: string[];
    meta: {
        description: string;
    };
}

export interface LocaleModule {
    moduleType: 'locale';
    name: string;
    dictionary: Record<string, unknown>;
    format: Record<string, unknown>;
}

export interface RegisterComponentModule {
    moduleType: 'component';
    name: string;
}

export interface ApiMethodModule {
    moduleType: 'apiMethod';
    name: string;
    fn: any;
}

export type PlotlyModule = RegisterTraceModule | LocaleModule | RegisterComponentModule | ApiMethodModule;

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export interface ValidateResult {
    code: string;
    container: 'data' | 'layout';
    trace: number | null;
    path: string | (string | number)[];
    astr: string;
    msg: string;
}

export interface ValidateTemplateResult {
    code: string;
    index?: number;
    traceType?: string;
    templateCount?: number;
    dataCount?: number;
    path?: string;
    templateitemname?: string;
    msg: string;
}

// ---------------------------------------------------------------------------
// Function declarations
// ---------------------------------------------------------------------------

export function newPlot(
    root: Root,
    data: Data[],
    layout?: Partial<Layout>,
    config?: Partial<Config>
): Promise<PlotlyHTMLElement>;

export function relayout(root: Root, layout: Partial<Layout>): Promise<PlotlyHTMLElement>;
export function redraw(root: Root): Promise<PlotlyHTMLElement>;
export function purge(root: Root): void;
export function restyle(root: Root, aobj: Data, traces?: number[] | number): Promise<PlotlyHTMLElement>;

export function update(
    root: Root,
    traceUpdate: Data,
    layoutUpdate: Partial<Layout>,
    traces?: number[] | number
): Promise<PlotlyHTMLElement>;

export function addTraces(
    root: Root,
    traces: Data | Data[],
    newIndices?: number[] | number
): Promise<PlotlyHTMLElement>;

export function deleteTraces(root: Root, indices: number[] | number): Promise<PlotlyHTMLElement>;

export function moveTraces(
    root: Root,
    currentIndices: number[] | number,
    newIndices?: number[] | number
): Promise<PlotlyHTMLElement>;

export function extendTraces(
    root: Root,
    update: Data | Data[],
    indices: number | number[],
    maxPoints?: number
): Promise<PlotlyHTMLElement>;

export function prependTraces(
    root: Root,
    update: Data | Data[],
    indices: number | number[]
): Promise<PlotlyHTMLElement>;

export function toImage(root: RootOrData, opts?: ToImgopts): Promise<string>;
export function downloadImage(root: RootOrData, opts: DownloadImgopts): Promise<string>;

export function react(
    root: Root,
    data: Data[],
    layout?: Partial<Layout>,
    config?: Partial<Config>
): Promise<PlotlyHTMLElement>;

export function addFrames(root: Root, frames: Array<Partial<Frame>>): Promise<PlotlyHTMLElement>;
export function deleteFrames(root: Root, frames: number[]): Promise<PlotlyHTMLElement>;
export function register(modules: PlotlyModule | PlotlyModule[]): void;

export function animate(
    root: Root,
    frameOrGroupNameOrFrameList?: string | string[] | Partial<Frame> | Array<Partial<Frame>>,
    opts?: Partial<AnimationOpts>
): Promise<void>;

export function validate(data: Data[], layout: Partial<Layout>): ValidateResult[];
export function setPlotConfig(config: Partial<Config>): void;

export type TemplateFigure = Root | { data: Data[]; layout: Partial<Layout> };
export function makeTemplate(figure: TemplateFigure): Template;
export function validateTemplate(figure: TemplateFigure, template: Template): ValidateTemplateResult[];
