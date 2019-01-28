/**
* Copyright 2012-2019, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var palettes = require('./scales.js').scales;
var paletteStr = Object.keys(palettes);

/**
 * Make opacityscale attribute declarations for
 *
 * - opacityscale,
 *
 * @param {string} context (dflt: '', i.e. from trace root):
 *     the container this is in ('', *marker*, *marker.line* etc)
 *
 * @param {object} opts:
 *   - opacityscaleDflt {string}:
 *     overrides the opacityscale dflt
 *
 *   - editTypeOverride {boolean} (dflt: ''):
 *     most of these attributes already require a recalc, but the ones that do not
 *     have editType *style* or *plot* unless you override (presumably with *calc*)
 *
 * @return {object}
 */
module.exports = function opacityScaleAttrs(context, opts) {
    context = context || '';
    opts = opts || {};

    var opacityscaleDflt = typeof opts.opacityscaleDflt === 'string' ? palettes[opts.opacityscaleDflt] : null;

    var attrs = {};

    attrs.opacityscale = {
        valType: 'opacityscale',
        role: 'style',
        editType: 'calc',
        dflt: opacityscaleDflt,
        description: [
            'Sets the opacityscale.',
            ' The opacityscale must be an array containing',
            ' arrays mapping a normalized value to an opacity value.',
            ' At minimum, a mapping for the lowest (0) and highest (1)',
            ' values are required. For example,',
            ' `[[0, 1], [0.5, 0.2], [1, 1]]` means that higher/lower values would have',
            ' higher opacity values and those in the middle would be more transparent',
            ' Alternatively, `opacityscale` may be a palette name string',
            ' of the following list: ' + paletteStr + '.'
        ].join('')
    };

    return attrs;
};
