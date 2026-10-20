/**
 * Generated from lib/candlestick.js by tasks/generate_entry_point_types.mjs.
 * Do not edit by hand — run `npm run entry-point-types` to regenerate.
 */

import type { RegisterTraceModule } from '../../core/api';

/**
 * The `candlestick` trace module, for `Plotly.register`.
 *
 * @example
 * import * as Plotly from 'plotly.js/lib/core';
 * import * as candlestick from 'plotly.js/lib/candlestick';
 *
 * Plotly.register([candlestick]);
 */
declare const candlestick: RegisterTraceModule & { name: 'candlestick' };

export = candlestick;
