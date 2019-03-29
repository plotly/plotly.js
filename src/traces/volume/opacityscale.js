/**
* Copyright 2012-2019, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var MIN = 0.1; // Note: often we don't want the data cube to be disappeared
var scales = {
    'uniform': [
        [0, 1], [1, 1]
    ],
    'max': [
        [0, MIN], [1, 1]
    ],
    'min': [
        [0, 1], [1, MIN]
    ],
    'extremes': createWave(1, MIN)
};

function createWave(n, minOpacity) {
    var arr = [];
    var steps = 32; // Max: 256
    for(var i = 0; i < steps; i++) {
        var u = i / (steps - 1);
        var v = minOpacity + (1 - minOpacity) * (1 - Math.pow(Math.sin(n * u * Math.PI), 2));
        arr.push([
            u,
            Math.max(1, Math.min(0, v))
        ]);
    }
    return arr;
}
var defaultScale = scales.uniform;
var scaleKeys = Object.keys(scales);

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

function attributes(context, opts) {
    context = context || '';
    opts = opts || {};

    var opacityscaleDflt = typeof opts.opacityscaleDflt === 'string' ? scales[opts.opacityscaleDflt] : null;

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
            ' of the following list: ' + scaleKeys + '.'
        ].join('')
    };

    return attrs;
}

function defaults(traceIn, traceOut, layout, coerce, opts) {
    var prefix = opts.prefix;

    coerce(prefix + 'opacityscale');
}

function getScale(scl, dflt) {
    if(!dflt) dflt = defaultScale;
    if(!scl) return dflt;

    function parseScale() {
        try {
            scl = scales[scl] || JSON.parse(scl);
        } catch(e) {
            scl = dflt;
        }
    }

    if(typeof scl === 'string') {
        parseScale();
        // occasionally scl is double-JSON encoded...
        if(typeof scl === 'string') parseScale();
    }

    if(!isValidScaleArray(scl)) return dflt;
    return scl;
}

function isValidScaleArray(scl) {
    var highestVal = 0;

    if(!Array.isArray(scl) || scl.length < 2) return false;

    if(!scl[0] || !scl[scl.length - 1]) return false;

    if(+scl[0][0] !== 0 || +scl[scl.length - 1][0] !== 1) return false;

    for(var i = 0; i < scl.length; i++) {
        var si = scl[i];

        if(si.length !== 2 || +si[0] < highestVal) {
            return false;
        }

        highestVal = +si[0];
    }

    return true;
}

function isValidScale(scl) {
    if(scales[scl] !== undefined) return true;
    else return isValidScaleArray(scl);
}

module.exports = {
    attributes: attributes,
    defaults: defaults,
    scales: scales,
    get: getScale,
    isValid: isValidScale
};
