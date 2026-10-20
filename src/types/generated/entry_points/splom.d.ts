/**
 * Generated from lib/splom.js by tasks/generate_entry_point_types.mjs.
 * Do not edit by hand — run `npm run entry-point-types` to regenerate.
 */

import type { RegisterTraceModule } from '../../core/api';

/**
 * The `splom` trace module, for `Plotly.register`.
 *
 * @example
 * import * as Plotly from 'plotly.js/lib/core';
 * import * as splom from 'plotly.js/lib/splom';
 *
 * Plotly.register([splom]);
 */
declare const splom: RegisterTraceModule & { name: 'splom' };

export = splom;
