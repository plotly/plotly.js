/**
 * Generated from lib/ohlc.js by tasks/generate_entry_point_types.mjs.
 * Do not edit by hand — run `npm run entry-point-types` to regenerate.
 */

import type { RegisterTraceModule } from '../../core/api';

/**
 * The `ohlc` trace module, for `Plotly.register`.
 *
 * @example
 * import * as Plotly from 'plotly.js/lib/core';
 * import * as ohlc from 'plotly.js/lib/ohlc';
 *
 * Plotly.register([ohlc]);
 */
declare const ohlc: RegisterTraceModule & { name: 'ohlc' };

export = ohlc;
