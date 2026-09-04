/**
 * Generated from lib/image.js by tasks/generate_entry_point_types.mjs.
 * Do not edit by hand — run `npm run entry-point-types` to regenerate.
 */

import type { RegisterTraceModule } from '../../core/api';

/**
 * The `image` trace module, for `Plotly.register`.
 *
 * @example
 * import * as Plotly from 'plotly.js/lib/core';
 * import * as image from 'plotly.js/lib/image';
 *
 * Plotly.register([image]);
 */
declare const image: RegisterTraceModule & { name: 'image' };

export = image;
