/**
 * Consumer-side checks for the event payload types and the `on()` overloads.
 *
 * Nothing here runs. See `update_api.ts`.
 */

import type { PlotlyHTMLElement, PlotRelayoutEvent, TreemapPlotDatum } from '../../lib/index';

declare const gd: PlotlyHTMLElement;
declare const event: PlotRelayoutEvent;

// A range value can be a number or a date string
const numberRangeStart: number | undefined = event['xaxis.range[0]'];
const dateRangeStart: string | undefined = event['xaxis.range[0]'];

// Any other attribute path is readable
const secondAxisStart = event['xaxis2.range[0]'];
const shapeStart = event['shapes[0].x0'];

// Layout properties are still typed
const autosize: boolean | undefined = event.autosize;

// @ts-expect-error unknown top-level key
const typo = event.titl;

gd.on('plotly_update', (event) => {
    const attributes: Record<string, any> = event.data[0];
    const traces: number[] = event.data[1];
    const autosizeInUpdate: boolean | undefined = event.layout.autosize;
});

gd.on('plotly_webglcontextlost', (event) => {
    const domEvent: WebGLContextEvent = event.event;
    const layer: string = event.layer;
});

gd.on('plotly_react', (event) => {
    const dataLength: number = event.data.length;
});

gd.on('plotly_legendtitleclick', (event) => {
    const legendId: string = event.legendId;
    return false;
});

gd.on('plotly_buttonclicked', (event) => {
    const active: number = event.active;
});

gd.on('plotly_beforehover', (event) => {
    const x: number = event.clientX;
    return true;
});

gd.on('plotly_icicleclick', (event) => {
    const nextLevel: string | undefined = event.nextLevel;
});

gd.on('plotly_treemapclick', (event) => {
    const points: TreemapPlotDatum[] = event.points;
});

gd.on('plotly_animating', () => {});
gd.on('plotly_transitioned', () => {});
gd.on('plotly_exportfail', () => {});
