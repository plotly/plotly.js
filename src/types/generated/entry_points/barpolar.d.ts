/**
 * Generated from lib/barpolar.js by tasks/generate_entry_point_types.mjs.
 * Do not edit by hand — run `npm run entry-point-types` to regenerate.
 */

import type { RegisterTraceModule } from '../../core/api';

/**
 * The `barpolar` trace module, for `Plotly.register`.
 *
 * @example
 * import * as Plotly from 'plotly.js/lib/core';
 * import * as barpolar from 'plotly.js/lib/barpolar';
 *
 * Plotly.register([barpolar]);
 */
declare const barpolar: RegisterTraceModule & { name: 'barpolar' };

export = barpolar;
