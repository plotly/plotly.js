/**
 * Generated from lib/scatter.js by tasks/generate_entry_point_types.mjs.
 * Do not edit by hand — run `npm run entry-point-types` to regenerate.
 */

import type { RegisterTraceModule } from '../../core/api';

/**
 * The `scatter` trace module, for `Plotly.register`.
 *
 * @example
 * import * as Plotly from 'plotly.js/lib/core';
 * import * as scatter from 'plotly.js/lib/scatter';
 *
 * Plotly.register([scatter]);
 */
declare const scatter: RegisterTraceModule & { name: 'scatter' };

export = scatter;
