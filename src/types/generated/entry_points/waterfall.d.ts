/**
 * Generated from lib/waterfall.js by tasks/generate_entry_point_types.mjs.
 * Do not edit by hand — run `npm run entry-point-types` to regenerate.
 */

import type { RegisterTraceModule } from '../../core/api';

/**
 * The `waterfall` trace module, for `Plotly.register`.
 *
 * @example
 * import * as Plotly from 'plotly.js/lib/core';
 * import * as waterfall from 'plotly.js/lib/waterfall';
 *
 * Plotly.register([waterfall]);
 */
declare const waterfall: RegisterTraceModule & { name: 'waterfall' };

export = waterfall;
