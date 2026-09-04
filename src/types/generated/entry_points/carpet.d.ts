/**
 * Generated from lib/carpet.js by tasks/generate_entry_point_types.mjs.
 * Do not edit by hand — run `npm run entry-point-types` to regenerate.
 */

import type { RegisterTraceModule } from '../../core/api';

/**
 * The `carpet` trace module, for `Plotly.register`.
 *
 * @example
 * import * as Plotly from 'plotly.js/lib/core';
 * import * as carpet from 'plotly.js/lib/carpet';
 *
 * Plotly.register([carpet]);
 */
declare const carpet: RegisterTraceModule & { name: 'carpet' };

export = carpet;
