/**
 * Generated from lib/pie.js by tasks/generate_entry_point_types.mjs.
 * Do not edit by hand — run `npm run entry-point-types` to regenerate.
 */

import type { RegisterTraceModule } from '../../core/api';

/**
 * The `pie` trace module, for `Plotly.register`.
 *
 * @example
 * import * as Plotly from 'plotly.js/lib/core';
 * import * as pie from 'plotly.js/lib/pie';
 *
 * Plotly.register([pie]);
 */
declare const pie: RegisterTraceModule & { name: 'pie' };

export = pie;
