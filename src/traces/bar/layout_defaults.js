/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Plots = require('../../plots/plots');
var Axes = require('../../plots/cartesian/axes');
var Lib = require('../../lib');

var layoutAttributes = require('./layout_attributes');


module.exports = function(layoutIn, layoutOut, fullData) {
    function coerce(attr, dflt) {
        return Lib.coerce(layoutIn, layoutOut, layoutAttributes, attr, dflt);
    }

    var hasBars = false,
        shouldBeGapless = false,
        gappedAnyway = false,
        usedSubplots = {};

    for(var i = 0; i < fullData.length; i++) {
        var trace = fullData[i];
        if(Plots.traceIs(trace, 'bar')) hasBars = true;
        else continue;

        // if we have at least 2 grouped bar traces on the same subplot,
        // we should default to a gap anyway, even if the data is histograms
        if(layoutIn.barmode !== 'overlay' && layoutIn.barmode !== 'stack') {
            var subploti = trace.xaxis + trace.yaxis;
            if(usedSubplots[subploti]) gappedAnyway = true;
            usedSubplots[subploti] = true;
        }

        if(trace.visible && trace.type === 'histogram') {
            var pa = Axes.getFromId({_fullLayout: layoutOut},
                        trace[trace.orientation === 'v' ? 'xaxis' : 'yaxis']);
            if(pa.type !== 'category') shouldBeGapless = true;
        }
    }

    if(!hasBars) return;

    var mode = coerce('barmode');
    if(mode !== 'overlay') coerce('barnorm');

    coerce('bargap', (shouldBeGapless && !gappedAnyway) ? 0 : 0.2);
    coerce('bargroupgap');
};
