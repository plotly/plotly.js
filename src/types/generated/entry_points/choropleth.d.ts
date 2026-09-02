/**
 * Generated from lib/choropleth.js by tasks/generate_entry_point_types.mjs.
 * Do not edit by hand — run `npm run entry-point-types` to regenerate.
 */

import type { RegisterTraceModule } from '../../core/api';

/**
 * The `choropleth` trace module, for `Plotly.register`.
 *
 * @example
 * import * as Plotly from 'plotly.js/lib/core';
 * import * as choropleth from 'plotly.js/lib/choropleth';
 *
 * Plotly.register([choropleth]);
 */
declare const choropleth: RegisterTraceModule & { name: 'choropleth' };

export = choropleth;
