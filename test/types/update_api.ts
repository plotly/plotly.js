/**
 * Consumer-side checks for the `relayout`, `restyle` and `update` types.
 *
 * Nothing here runs. `npm run test-types` compiles this file against the public entry point.
 * A line marked `@ts-expect-error` must fail to compile, so the build breaks if a type becomes too permissive.
 */

import * as Plotly from '../../lib/index';

declare const gd: HTMLElement;

// ---------------------------------------------------------------------------
// relayout
// ---------------------------------------------------------------------------

Plotly.relayout(gd, { 'xaxis.autorange': true });
Plotly.relayout(gd, { 'xaxis.range[0]': 0, 'xaxis.range[1]': 5 });
Plotly.relayout(gd, { 'xaxis.title.font.size': 14 });
Plotly.relayout(gd, { 'annotations[0].text': 'hello' });
Plotly.relayout(gd, { 'updatemenus[0].buttons[1].label': 'hello' });
Plotly.relayout(gd, { xaxis: { autorange: true } });
Plotly.relayout(gd, { autosize: true });
Plotly.relayout(gd, 'xaxis.autorange', true);
Plotly.relayout(gd, 'annotations[0].text', 'hello');

// @ts-expect-error top-level typo
Plotly.relayout(gd, { titl: 'abc' });
// @ts-expect-error wrong value type on a known top-level key
Plotly.relayout(gd, { autosize: 'yes' });

// A wrapper that reads the parameter types must see both call forms
type RelayoutArg = Parameters<typeof Plotly.relayout>[1];
export const relayoutObject: RelayoutArg = { autosize: true };
export const relayoutPath: RelayoutArg = 'xaxis.autorange';

// ---------------------------------------------------------------------------
// restyle
// ---------------------------------------------------------------------------

Plotly.restyle(gd, { 'marker.color': 'red' });
Plotly.restyle(gd, { 'marker.color': 'red' }, [0]);
Plotly.restyle(gd, { 'line.width': 2, 'marker.size[0]': 10 }, 1);
Plotly.restyle(gd, { visible: false });
Plotly.restyle(gd, 'marker.color', 'red');
Plotly.restyle(gd, 'marker.color', ['red', 'blue'], [0, 1]);

// @ts-expect-error top-level typo
Plotly.restyle(gd, { colr: 'red' });
// @ts-expect-error wrong value type on a known top-level key
Plotly.restyle(gd, { visible: 'maybe' });

type RestyleArg = Parameters<typeof Plotly.restyle>[1];
export const restyleObject: RestyleArg = { visible: false };
export const restylePath: RestyleArg = 'marker.color';

// ---------------------------------------------------------------------------
// update
// ---------------------------------------------------------------------------

Plotly.update(gd, { 'marker.color': 'red' }, { 'xaxis.range[0]': 0 });
Plotly.update(gd, { 'marker.color': 'red' }, { 'xaxis.range[0]': 0 }, [0]);
Plotly.update(gd, { visible: false }, { autosize: true });

// @ts-expect-error top-level typo in the trace update
Plotly.update(gd, { colr: 'red' }, { autosize: true });
// @ts-expect-error top-level typo in the layout update
Plotly.update(gd, { visible: false }, { titl: 'abc' });

// ---------------------------------------------------------------------------
// APIs that take a full figure must stay strict about unknown keys
// ---------------------------------------------------------------------------

Plotly.newPlot(gd, [], { autosize: true });
Plotly.validate([], { autosize: true });

// @ts-expect-error a dotted path is not a valid key in a full layout
Plotly.newPlot(gd, [], { 'xaxis.autorange': true });
// @ts-expect-error a dotted typo must not pass in a full layout
Plotly.newPlot(gd, [], { 'xaxis.autrange': true });
// @ts-expect-error a dotted path is not a valid key when validating a layout
Plotly.validate([], { 'xaxis.autorange': true });
// @ts-expect-error a dotted path is not a valid key in a template layout
const template: Plotly.Template = { layout: { 'xaxis.autorange': true } };
