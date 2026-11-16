/**
 * Generated from lib/bar.js by tasks/generate_entry_point_types.mjs.
 * Do not edit by hand — run `npm run entry-point-types` to regenerate.
 */

import type { RegisterTraceModule } from '../../core/api';

/**
 * The `bar` trace module, for `Plotly.register`.
 *
 * @example
 * import * as Plotly from 'plotly.js/lib/core';
 * import * as bar from 'plotly.js/lib/bar';
 *
 * Plotly.register([bar]);
 */
declare const bar: RegisterTraceModule & { name: 'bar' };

export = bar;
