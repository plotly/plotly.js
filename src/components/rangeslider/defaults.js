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


module.exports = function supplyLayoutDefaults(layoutIn, layoutOut, axName, counterAxes) {

    if(!layoutIn[axName].rangeslider) return;

    var containerIn = typeof layoutIn[axName].rangeslider === 'object' ?
            layoutIn[axName].rangeslider : {},
        containerOut = layoutOut[axName].rangeslider = {};

    function coerce(attr, dflt) {
        return Lib.coerce(containerIn, containerOut,
            attributes, attr, dflt);
    }

    coerce('bgcolor');
    coerce('bordercolor');
    coerce('borderwidth');
    coerce('thickness');
    coerce('visible');

    // If axis range not set, show all the data
    coerce('range', layoutIn[axName].range || [-Infinity, Infinity]);

    if(containerOut.visible) {
        counterAxes.forEach(function(ax) {
            var opposing = layoutOut[ax] || {};
            opposing.fixedrange = true;
            layoutOut[ax] = opposing;
        });
    }
};
