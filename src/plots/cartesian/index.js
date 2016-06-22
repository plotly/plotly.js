/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Plots = require('../plots');

var constants = require('./constants');

exports.name = 'cartesian';

exports.attr = ['xaxis', 'yaxis'];

exports.idRoot = ['x', 'y'];

exports.idRegex = constants.idRegex;

exports.attrRegex = constants.attrRegex;

exports.attributes = require('./attributes');

exports.plot = function(gd, traces) {
    var cdSubplot, cd, trace, i, j, k, isFullReplot;

    var fullLayout = gd._fullLayout,
        subplots = Plots.getSubplotIds(fullLayout, 'cartesian'),
        calcdata = gd.calcdata,
        modules = fullLayout._modules;

    if(!Array.isArray(traces)) {
        // If traces is not provided, then it's a complete replot and missing
        // traces are removed
        isFullReplot = true;
        traces = [];
        for(i = 0; i < calcdata.length; i++) {
            traces.push(i);
        }
    } else {
        // If traces are explicitly specified, then it's a partial replot and
        // traces are not removed.
        isFullReplot = false;
    }

    for(i = 0; i < subplots.length; i++) {
        var subplot = subplots[i],
            subplotInfo = fullLayout._plots[subplot];

        // Get all calcdata for this subplot:
        cdSubplot = [];
        for(j = 0; j < calcdata.length; j++) {
            cd = calcdata[j];
            trace = cd[0].trace;

            // Skip trace if whitelist provided and it's not whitelisted:
            // if (Array.isArray(traces) && traces.indexOf(i) === -1) continue;

            if(trace.xaxis + trace.yaxis === subplot && traces.indexOf(trace.index) !== -1) {
                cdSubplot.push(cd);
            }
        }

        // remove old traces, then redraw everything
        // TODO: scatterlayer is manually excluded from this since it knows how
        // to update instead of fully removing and redrawing every time. The
        // remaining plot traces should also be able to do this. Once implemented,
        // we won't need this - which should sometimes be a big speedup.
        if(subplotInfo.plot) {
            subplotInfo.plot.selectAll('g:not(.scatterlayer)').selectAll('g.trace').remove();
        }

        // Plot all traces for each module at once:
        for(j = 0; j < modules.length; j++) {
            var _module = modules[j];

            // skip over non-cartesian trace modules
            if(_module.basePlotModule.name !== 'cartesian') continue;

            // plot all traces of this type on this subplot at once
            var cdModule = [];
            for(k = 0; k < cdSubplot.length; k++) {
                cd = cdSubplot[k];
                trace = cd[0].trace;

                if((trace._module === _module) && (trace.visible === true)) {
                    cdModule.push(cd);
                }
            }

            _module.plot(gd, subplotInfo, cdModule, isFullReplot);
        }
    }
};
