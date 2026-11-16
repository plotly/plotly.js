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
    const responsive: boolean | undefined = event.config?.responsive;
    const autosize: boolean | undefined = event.layout?.autosize;

    // @ts-expect-error `config` is `undefined` if the `Plotly.react` call omitted it
    const unchecked: boolean | undefined = event.config.responsive;
});

gd.on('plotly_legendtitleclick', (event) => {
    const legendId: string = event.legendId;
    return false;
});

// A handler that only observes the event is valid
gd.on('plotly_legendclick', (event) => {
    console.log(event.curveNumber);
});

gd.on('plotly_legenddoubleclick', (event) => {
    console.log(event.curveNumber);
});

gd.on('plotly_beforeplot', (event) => {
    console.log(event.data.length);
});

gd.on('plotly_sunburstclick', (event) => {
    console.log(event.points.length);
});

gd.on('plotly_treemapclick', (event) => {
    console.log(event.points.length);
});

gd.on('plotly_icicleclick', (event) => {
    console.log(event.points.length);
});

// A handler can return `false` to cancel the default behavior
gd.on('plotly_legendclick', () => false);
gd.on('plotly_beforeplot', () => false);
gd.on('plotly_sunburstclick', () => false);
gd.on('plotly_treemapclick', () => false);

gd.on('plotly_legendtitleclick', (event) => {
    console.log(event.legendId);
});

gd.on('plotly_beforehover', (event) => {
    console.log(event.clientX);
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

    // @ts-expect-error `value` is absent unless the trace sets `values`
    const value: number = points[0].value;
    const optionalValue: number | undefined = points[0].value;
});

gd.on('plotly_animating', () => {});
gd.on('plotly_transitioned', () => {});
gd.on('plotly_exportfail', () => {});
