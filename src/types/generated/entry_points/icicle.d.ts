/**
 * Generated from lib/icicle.js by tasks/generate_entry_point_types.mjs.
 * Do not edit by hand — run `npm run entry-point-types` to regenerate.
 */

import type { RegisterTraceModule } from '../../core/api';

/**
 * The `icicle` trace module, for `Plotly.register`.
 *
 * @example
 * import * as Plotly from 'plotly.js/lib/core';
 * import * as icicle from 'plotly.js/lib/icicle';
 *
 * Plotly.register([icicle]);
 */
declare const icicle: RegisterTraceModule & { name: 'icicle' };

export = icicle;
