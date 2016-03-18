/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Lib = require('../../lib');
var attributes = require('./attributes');


module.exports = function supplyLayoutDefaults(layoutIn, layoutOut) {

    if(!layoutIn.xaxis || !layoutOut.xaxis) return;

    var containerIn = layoutIn.xaxis.rangeslider || {},
        containerOut = layoutOut.xaxis.rangeslider = {};

    if(!containerIn.visible) return;

    function coerce(attr, dflt) {
        return Lib.coerce(containerIn, containerOut,
            attributes, attr, dflt);
    }

    coerce('visible');
    coerce('height');
    coerce('backgroundcolor');
    coerce('bordercolor');
    coerce('borderwidth');

    if(containerOut.visible) {
        layoutOut.yaxis.fixedrange = true;
    }
};
