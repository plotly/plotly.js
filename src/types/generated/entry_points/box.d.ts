/**
 * Generated from lib/box.js by tasks/generate_entry_point_types.mjs.
 * Do not edit by hand — run `npm run entry-point-types` to regenerate.
 */

import type { RegisterTraceModule } from '../../core/api';

/**
 * The `box` trace module, for `Plotly.register`.
 *
 * @example
 * import * as Plotly from 'plotly.js/lib/core';
 * import * as box from 'plotly.js/lib/box';
 *
 * Plotly.register([box]);
 */
declare const box: RegisterTraceModule & { name: 'box' };

export = box;
