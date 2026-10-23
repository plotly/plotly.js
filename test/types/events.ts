/**
 * Consumer-side checks for the `plotly_relayout` event payload.
 *
 * Nothing here runs. See `update_api.ts`.
 */

import type { PlotRelayoutEvent } from '../../lib/index';

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
