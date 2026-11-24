/**
 * Generated from lib/volume.js by tasks/generate_entry_point_types.mjs.
 * Do not edit by hand — run `npm run entry-point-types` to regenerate.
 */

import type { RegisterTraceModule } from '../../core/api';

/**
 * The `volume` trace module, for `Plotly.register`.
 *
 * @example
 * import * as Plotly from 'plotly.js/lib/core';
 * import * as volume from 'plotly.js/lib/volume';
 *
 * Plotly.register([volume]);
 */
declare const volume: RegisterTraceModule & { name: 'volume' };

export = volume;
