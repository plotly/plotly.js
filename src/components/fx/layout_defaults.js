/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Lib = require('../../lib');
var layoutAttributes = require('./layout_attributes');

module.exports = function supplyLayoutDefaults(layoutIn, layoutOut, fullData) {
    function coerce(attr, dflt) {
        return Lib.coerce(layoutIn, layoutOut, layoutAttributes, attr, dflt);
    }

    coerce('dragmode');

    var hovermodeDflt;
    if(layoutOut._has('cartesian')) {
        // flag for 'horizontal' plots:
        // determines the state of the mode bar 'compare' hovermode button
        layoutOut._isHoriz = isHoriz(fullData);
        hovermodeDflt = layoutOut._isHoriz ? 'y' : 'x';
    }
    else hovermodeDflt = 'closest';

    coerce('hovermode', hovermodeDflt);

    // if only mapbox subplots is present on graph,
    // reset 'zoom' dragmode to 'pan' until 'zoom' is implemented,
    // so that the correct modebar button is active
    if(layoutOut._has('mapbox') && layoutOut._basePlotModules.length === 1 &&
       layoutOut.dragmode === 'zoom') {
        layoutOut.dragmode = 'pan';
    }
};

function isHoriz(fullData) {
    var out = true;

    for(var i = 0; i < fullData.length; i++) {
        var trace = fullData[i];

        if(trace.orientation !== 'h') {
            out = false;
            break;
        }
    }

    return out;
}
