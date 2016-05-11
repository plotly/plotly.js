/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Axes = require('../../plots/cartesian/axes');
var Lib = require('../../lib');
var attributes = require('./attributes');


module.exports = function supplyLayoutDefaults(layoutIn, layoutOut) {

    if(!layoutIn.images || !Array.isArray(layoutIn.images)) return;


    var containerIn = layoutIn.images,
        containerOut = layoutOut.images = [];


    for(var i = 0; i < containerIn.length; i++) {
        var image = containerIn[i];

        if(!image.source) continue;

        var defaulted = imageDefaults(containerIn[i] || {}, containerOut[i] || {}, layoutOut);
        containerOut.push(defaulted);
    }
};


function imageDefaults(imageIn, imageOut, fullLayout) {

    imageOut = imageOut || {};

    function coerce(attr, dflt) {
        return Lib.coerce(imageIn, imageOut, attributes, attr, dflt);
    }

    coerce('source');
    coerce('layer');
    coerce('x');
    coerce('y');
    coerce('xanchor');
    coerce('yanchor');
    coerce('sizex');
    coerce('sizey');
    coerce('sizing');
    coerce('opacity');

    for(var i = 0; i < 2; i++) {
        var tdMock = { _fullLayout: fullLayout },
            axLetter = ['x', 'y'][i];

        // 'paper' is the fallback axref
        Axes.coerceRef(imageIn, imageOut, tdMock, axLetter, 'paper');
    }

    return imageOut;
}
