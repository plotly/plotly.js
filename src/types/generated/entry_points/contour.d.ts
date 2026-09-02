/**
 * Generated from lib/contour.js by tasks/generate_entry_point_types.mjs.
 * Do not edit by hand — run `npm run entry-point-types` to regenerate.
 */

import type { RegisterTraceModule } from '../../core/api';

/**
 * The `contour` trace module, for `Plotly.register`.
 *
 * @example
 * import * as Plotly from 'plotly.js/lib/core';
 * import * as contour from 'plotly.js/lib/contour';
 *
 * Plotly.register([contour]);
 */
declare const contour: RegisterTraceModule & { name: 'contour' };

export = contour;
