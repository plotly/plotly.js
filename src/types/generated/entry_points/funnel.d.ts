/**
 * Generated from lib/funnel.js by tasks/generate_entry_point_types.mjs.
 * Do not edit by hand — run `npm run entry-point-types` to regenerate.
 */

import type { RegisterTraceModule } from '../../core/api';

/**
 * The `funnel` trace module, for `Plotly.register`.
 *
 * @example
 * import * as Plotly from 'plotly.js/lib/core';
 * import * as funnel from 'plotly.js/lib/funnel';
 *
 * Plotly.register([funnel]);
 */
declare const funnel: RegisterTraceModule & { name: 'funnel' };

export = funnel;
