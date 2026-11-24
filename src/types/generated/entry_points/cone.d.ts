/**
 * Generated from lib/cone.js by tasks/generate_entry_point_types.mjs.
 * Do not edit by hand — run `npm run entry-point-types` to regenerate.
 */

import type { RegisterTraceModule } from '../../core/api';

/**
 * The `cone` trace module, for `Plotly.register`.
 *
 * @example
 * import * as Plotly from 'plotly.js/lib/core';
 * import * as cone from 'plotly.js/lib/cone';
 *
 * Plotly.register([cone]);
 */
declare const cone: RegisterTraceModule & { name: 'cone' };

export = cone;
