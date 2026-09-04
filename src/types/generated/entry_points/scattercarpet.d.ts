/**
 * Generated from lib/scattercarpet.js by tasks/generate_entry_point_types.mjs.
 * Do not edit by hand — run `npm run entry-point-types` to regenerate.
 */

import type { RegisterTraceModule } from '../../core/api';

/**
 * The `scattercarpet` trace module, for `Plotly.register`.
 *
 * @example
 * import * as Plotly from 'plotly.js/lib/core';
 * import * as scattercarpet from 'plotly.js/lib/scattercarpet';
 *
 * Plotly.register([scattercarpet]);
 */
declare const scattercarpet: RegisterTraceModule & { name: 'scattercarpet' };

export = scattercarpet;
