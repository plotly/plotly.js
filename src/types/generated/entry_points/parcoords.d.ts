/**
 * Generated from lib/parcoords.js by tasks/generate_entry_point_types.mjs.
 * Do not edit by hand — run `npm run entry-point-types` to regenerate.
 */

import type { RegisterTraceModule } from '../../core/api';

/**
 * The `parcoords` trace module, for `Plotly.register`.
 *
 * @example
 * import * as Plotly from 'plotly.js/lib/core';
 * import * as parcoords from 'plotly.js/lib/parcoords';
 *
 * Plotly.register([parcoords]);
 */
declare const parcoords: RegisterTraceModule & { name: 'parcoords' };

export = parcoords;
