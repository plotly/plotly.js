/**
 * Generated from lib/indicator.js by tasks/generate_entry_point_types.mjs.
 * Do not edit by hand — run `npm run entry-point-types` to regenerate.
 */

import type { RegisterTraceModule } from '../../core/api';

/**
 * The `indicator` trace module, for `Plotly.register`.
 *
 * @example
 * import * as Plotly from 'plotly.js/lib/core';
 * import * as indicator from 'plotly.js/lib/indicator';
 *
 * Plotly.register([indicator]);
 */
declare const indicator: RegisterTraceModule & { name: 'indicator' };

export = indicator;
