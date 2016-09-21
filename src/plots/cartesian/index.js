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

exports.transitionAxes = require('./transition_axes');

exports.plot = function(gd, traces, transitionOpts, makeOnCompleteCallback) {
    var cdSubplot, cd, trace, i, j, k;

    var fullLayout = gd._fullLayout,
        subplots = Plots.getSubplotIds(fullLayout, 'cartesian'),
        calcdata = gd.calcdata,
        modules = fullLayout._modules;

    if(!Array.isArray(traces)) {
      // If traces is not provided, then it's a complete replot and missing
      // traces are removed
        traces = [];
        for(i = 0; i < calcdata.length; i++) {
            traces.push(i);
        }
    }

    for(i = 0; i < subplots.length; i++) {
        var subplot = subplots[i],
            subplotInfo = fullLayout._plots[subplot];

        // Get all calcdata for this subplot:
        cdSubplot = [];
        var pcd;
        for(j = 0; j < calcdata.length; j++) {
            cd = calcdata[j];
            trace = cd[0].trace;

            // Skip trace if whitelist provided and it's not whitelisted:
            // if (Array.isArray(traces) && traces.indexOf(i) === -1) continue;
            if(trace.xaxis + trace.yaxis === subplot) {
                // If this trace is specifically requested, add it to the list:
                if(traces.indexOf(trace.index) !== -1) {
                    // Okay, so example: traces 0, 1, and 2 have fill = tonext. You animate
                    // traces 0 and 2. Trace 1 also needs to be updated, otherwise its fill
                    // is outdated. So this retroactively adds the previous trace if the
                    // traces are interdependent.
                    if(pcd &&
                            ['tonextx', 'tonexty', 'tonext'].indexOf(trace.fill) !== -1 &&
                            cdSubplot.indexOf(pcd) === -1) {
                        cdSubplot.push(pcd);
                    }

                    cdSubplot.push(cd);
                }

                // Track the previous trace on this subplot for the retroactive-add step
                // above:
                pcd = cd;
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

            _module.plot(gd, subplotInfo, cdModule, transitionOpts, makeOnCompleteCallback);
        }
    }
};

exports.clean = function(newFullData, newFullLayout, oldFullData, oldFullLayout) {
    var oldModules = oldFullLayout._modules || [],
        newModules = newFullLayout._modules || [];

    var hadScatter, hasScatter, i;

    for(i = 0; i < oldModules.length; i++) {
        if(oldModules[i].name === 'scatter') {
            hadScatter = true;
            break;
        }
    }

    for(i = 0; i < newModules.length; i++) {
        if(newModules[i].name === 'scatter') {
            hasScatter = true;
            break;
        }
    }

    if(hadScatter && !hasScatter) {
        var oldPlots = oldFullLayout._plots,
            ids = Object.keys(oldPlots || {});

        for(i = 0; i < ids.length; i++) {
            var subplotInfo = oldPlots[ids[i]];

            if(subplotInfo.plot) {
                subplotInfo.plot.select('g.scatterlayer')
                    .selectAll('g.trace')
                    .remove();
            }
        }
    }
};
