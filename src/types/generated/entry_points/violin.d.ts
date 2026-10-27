/**
 * Generated from lib/violin.js by tasks/generate_entry_point_types.mjs.
 * Do not edit by hand — run `npm run entry-point-types` to regenerate.
 */

import type { RegisterTraceModule } from '../../core/api';

/**
 * The `violin` trace module, for `Plotly.register`.
 *
 * @example
 * import * as Plotly from 'plotly.js/lib/core';
 * import * as violin from 'plotly.js/lib/violin';
 *
 * Plotly.register([violin]);
 */
declare const violin: RegisterTraceModule & { name: 'violin' };

export = violin;
