/**
* Copyright 2012-2020, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Lib = require('../../lib');
var layoutAttributes = require('./layout_attributes');

module.exports = function handleHoverModeDefaults(layoutIn, layoutOut, fullData) {
    function coerce(attr, dflt) {
        // don't coerce if it is already coerced in other place e.g. in cartesian defaults
        if(layoutOut[attr] !== undefined) return layoutOut[attr];

        return Lib.coerce(layoutIn, layoutOut, layoutAttributes, attr, dflt);
    }

    var clickmode = coerce('clickmode');

    var hovermodeDflt;
    if(layoutOut._has('cartesian')) {
        if(clickmode.indexOf('select') > -1) {
            hovermodeDflt = 'closest';
        } else {
            // flag for 'horizontal' plots:
            // determines the state of the mode bar 'compare' hovermode button
            layoutOut._isHoriz = isHoriz(fullData, layoutOut);
            hovermodeDflt = layoutOut._isHoriz ? 'y' : 'x';
        }
    } else hovermodeDflt = 'closest';

    return coerce('hovermode', hovermodeDflt);
};

function isHoriz(fullData, fullLayout) {
    var stackOpts = fullLayout._scatterStackOpts || {};

    for(var i = 0; i < fullData.length; i++) {
        var trace = fullData[i];
        var subplot = trace.xaxis + trace.yaxis;
        var subplotStackOpts = stackOpts[subplot] || {};
        var groupOpts = subplotStackOpts[trace.stackgroup] || {};

        if(trace.orientation !== 'h' && groupOpts.orientation !== 'h') {
            return false;
        }
    }

    return true;
}
