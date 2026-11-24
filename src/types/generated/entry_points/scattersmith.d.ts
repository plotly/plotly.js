/**
 * Generated from lib/scattersmith.js by tasks/generate_entry_point_types.mjs.
 * Do not edit by hand — run `npm run entry-point-types` to regenerate.
 */

import type { RegisterTraceModule } from '../../core/api';

/**
 * The `scattersmith` trace module, for `Plotly.register`.
 *
 * @example
 * import * as Plotly from 'plotly.js/lib/core';
 * import * as scattersmith from 'plotly.js/lib/scattersmith';
 *
 * Plotly.register([scattersmith]);
 */
declare const scattersmith: RegisterTraceModule & { name: 'scattersmith' };

export = scattersmith;
