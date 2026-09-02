/**
 * Generated from lib/streamtube.js by tasks/generate_entry_point_types.mjs.
 * Do not edit by hand — run `npm run entry-point-types` to regenerate.
 */

import type { RegisterTraceModule } from '../../core/api';

/**
 * The `streamtube` trace module, for `Plotly.register`.
 *
 * @example
 * import * as Plotly from 'plotly.js/lib/core';
 * import * as streamtube from 'plotly.js/lib/streamtube';
 *
 * Plotly.register([streamtube]);
 */
declare const streamtube: RegisterTraceModule & { name: 'streamtube' };

export = streamtube;
