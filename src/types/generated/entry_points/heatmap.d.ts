/**
 * Generated from lib/heatmap.js by tasks/generate_entry_point_types.mjs.
 * Do not edit by hand — run `npm run entry-point-types` to regenerate.
 */

import type { RegisterTraceModule } from '../../core/api';

/**
 * The `heatmap` trace module, for `Plotly.register`.
 *
 * @example
 * import * as Plotly from 'plotly.js/lib/core';
 * import * as heatmap from 'plotly.js/lib/heatmap';
 *
 * Plotly.register([heatmap]);
 */
declare const heatmap: RegisterTraceModule & { name: 'heatmap' };

export = heatmap;
