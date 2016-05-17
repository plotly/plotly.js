/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Lib = require('../../lib');
var Plots = require('../../plots/plots');

var attributes = require('./attributes');
var helpers = require('./helpers');


module.exports = function legendDefaults(layoutIn, layoutOut, fullData) {
    var containerIn = layoutIn.legend || {},
        containerOut = layoutOut.legend = {};

    var visibleTraces = 0,
        defaultOrder = 'normal',
        defaultX,
        defaultY,
        defaultXAnchor,
        defaultYAnchor;

    for(var i = 0; i < fullData.length; i++) {
        var trace = fullData[i];

        if(helpers.legendGetsTrace(trace)) {
            visibleTraces++;
            // always show the legend by default if there's a pie
            if(Plots.traceIs(trace, 'pie')) visibleTraces++;
        }

        if((Plots.traceIs(trace, 'bar') && layoutOut.barmode === 'stack') ||
                ['tonextx', 'tonexty'].indexOf(trace.fill) !== -1) {
            defaultOrder = helpers.isGrouped({traceorder: defaultOrder}) ?
                'grouped+reversed' : 'reversed';
        }

        if(trace.legendgroup !== undefined && trace.legendgroup !== '') {
            defaultOrder = helpers.isReversed({traceorder: defaultOrder}) ?
                'reversed+grouped' : 'grouped';
        }
    }

    function coerce(attr, dflt) {
        return Lib.coerce(containerIn, containerOut, attributes, attr, dflt);
    }

    var showLegend = Lib.coerce(layoutIn, layoutOut,
        Plots.layoutAttributes, 'showlegend', visibleTraces > 1);

    if(showLegend === false) return;

    coerce('bgcolor', layoutOut.paper_bgcolor);
    coerce('bordercolor');
    coerce('borderwidth');
    Lib.coerceFont(coerce, 'font', layoutOut.font);

    coerce('orientation');
    if(containerOut.orientation === 'h') {
        var xaxis = layoutIn.xaxis;
        if(xaxis && xaxis.rangeslider && xaxis.rangeslider.visible) {
            defaultX = 0;
            defaultXAnchor = 'left';
            defaultY = 1.1;
            defaultYAnchor = 'bottom';
        }
        else {
            defaultX = 0;
            defaultXAnchor = 'left';
            defaultY = -0.1;
            defaultYAnchor = 'top';
        }
    }

    coerce('traceorder', defaultOrder);
    if(helpers.isGrouped(layoutOut.legend)) coerce('tracegroupgap');

    coerce('x', defaultX);
    coerce('xanchor', defaultXAnchor);
    coerce('y', defaultY);
    coerce('yanchor', defaultYAnchor);
    Lib.noneOrAll(containerIn, containerOut, ['x', 'y']);
};
