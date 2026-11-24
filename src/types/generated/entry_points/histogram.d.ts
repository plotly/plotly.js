/**
 * Generated from lib/histogram.js by tasks/generate_entry_point_types.mjs.
 * Do not edit by hand — run `npm run entry-point-types` to regenerate.
 */

import type { RegisterTraceModule } from '../../core/api';

/**
 * The `histogram` trace module, for `Plotly.register`.
 *
 * @example
 * import * as Plotly from 'plotly.js/lib/core';
 * import * as histogram from 'plotly.js/lib/histogram';
 *
 * Plotly.register([histogram]);
 */
declare const histogram: RegisterTraceModule & { name: 'histogram' };

export = histogram;
