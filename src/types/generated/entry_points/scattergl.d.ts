/**
 * Generated from lib/scattergl.js by tasks/generate_entry_point_types.mjs.
 * Do not edit by hand — run `npm run entry-point-types` to regenerate.
 */

import type { RegisterTraceModule } from '../../core/api';

/**
 * The `scattergl` trace module, for `Plotly.register`.
 *
 * @example
 * import * as Plotly from 'plotly.js/lib/core';
 * import * as scattergl from 'plotly.js/lib/scattergl';
 *
 * Plotly.register([scattergl]);
 */
declare const scattergl: RegisterTraceModule & { name: 'scattergl' };

export = scattergl;
