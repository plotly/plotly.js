/**
 * Generated from lib/sankey.js by tasks/generate_entry_point_types.mjs.
 * Do not edit by hand — run `npm run entry-point-types` to regenerate.
 */

import type { RegisterTraceModule } from '../../core/api';

/**
 * The `sankey` trace module, for `Plotly.register`.
 *
 * @example
 * import * as Plotly from 'plotly.js/lib/core';
 * import * as sankey from 'plotly.js/lib/sankey';
 *
 * Plotly.register([sankey]);
 */
declare const sankey: RegisterTraceModule & { name: 'sankey' };

export = sankey;
