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

var name = 'images';

module.exports = function supplyLayoutDefaults(layoutIn, layoutOut) {
    var contIn = Array.isArray(layoutIn[name]) ? layoutIn[name] : [],
        contOut = layoutOut[name] = [];

    for(var i = 0; i < contIn.length; i++) {
        var itemIn = contIn[i] || {},
            itemOut = {};

        imageDefaults(itemIn, itemOut, layoutOut);

        contOut.push(itemOut);
    }
};


function imageDefaults(imageIn, imageOut, fullLayout) {

    function coerce(attr, dflt) {
        return Lib.coerce(imageIn, imageOut, attributes, attr, dflt);
    }

    var source = coerce('source');
    var visible = coerce('visible', !!source);

    if(!visible) return imageOut;

    coerce('layer');
    coerce('x');
    coerce('y');
    coerce('xanchor');
    coerce('yanchor');
    coerce('sizex');
    coerce('sizey');
    coerce('sizing');
    coerce('opacity');

    var gdMock = { _fullLayout: fullLayout },
        axLetters = ['x', 'y'];

    for(var i = 0; i < 2; i++) {
        // 'paper' is the fallback axref
        Axes.coerceRef(imageIn, imageOut, gdMock, axLetters[i], 'paper');
    }

    return imageOut;
}
