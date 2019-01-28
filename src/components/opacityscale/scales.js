/**
* Copyright 2012-2019, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

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

var min = 0.2;

var scales = {
    'max': [
        [0, min], [1, 1]
    ],

    'min': [
        [0, 1], [1, min]
    ],

    'extremes': createWave(1, min),

    'zigzag': createWave(8, min)
};

var defaultScale = scales.uniform;

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
    scales: scales,
    defaultScale: defaultScale,

    get: getScale,
    isValid: isValidScale
};
