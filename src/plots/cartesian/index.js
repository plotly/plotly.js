/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var d3 = require('d3');
var Lib = require('../../lib');
var Plots = require('../plots');
var Axes = require('./axes');
var constants = require('./constants');

exports.name = 'cartesian';

exports.attr = ['xaxis', 'yaxis'];

exports.idRoot = ['x', 'y'];

exports.idRegex = constants.idRegex;

exports.attrRegex = constants.attrRegex;

exports.attributes = require('./attributes');

exports.transitionAxes = require('./transition_axes');

exports.plot = function(gd, traces, transitionOpts, makeOnCompleteCallback) {
    var fullLayout = gd._fullLayout,
        subplots = Plots.getSubplotIds(fullLayout, 'cartesian'),
        calcdata = gd.calcdata,
        i;

    // If traces is not provided, then it's a complete replot and missing
    // traces are removed
    if(!Array.isArray(traces)) {
        traces = [];

        for(i = 0; i < calcdata.length; i++) {
            traces.push(i);
        }
    }

    for(i = 0; i < subplots.length; i++) {
        var subplot = subplots[i],
            subplotInfo = fullLayout._plots[subplot];

        // Get all calcdata for this subplot:
        var cdSubplot = [];
        var pcd;

        for(var j = 0; j < calcdata.length; j++) {
            var cd = calcdata[j],
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

        plotOne(gd, subplotInfo, cdSubplot, transitionOpts, makeOnCompleteCallback);
    }
};

function plotOne(gd, plotinfo, cdSubplot, transitionOpts, makeOnCompleteCallback) {
    var fullLayout = gd._fullLayout,
        modules = fullLayout._modules;

    // remove old traces, then redraw everything
    //
    // TODO: scatterlayer is manually excluded from this since it knows how
    // to update instead of fully removing and redrawing every time. The
    // remaining plot traces should also be able to do this. Once implemented,
    // we won't need this - which should sometimes be a big speedup.
    if(plotinfo.plot) {
        plotinfo.plot.selectAll('g:not(.scatterlayer)').selectAll('g.trace').remove();
    }

    // plot all traces for each module at once
    for(var j = 0; j < modules.length; j++) {
        var _module = modules[j];

        // skip over non-cartesian trace modules
        if(_module.basePlotModule.name !== 'cartesian') continue;

        // plot all traces of this type on this subplot at once
        var cdModule = [];
        for(var k = 0; k < cdSubplot.length; k++) {
            var cd = cdSubplot[k],
                trace = cd[0].trace;

            if((trace._module === _module) && (trace.visible === true)) {
                cdModule.push(cd);
            }
        }

        _module.plot(gd, plotinfo, cdModule, transitionOpts, makeOnCompleteCallback);
    }
}

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

    var hadCartesian = (oldFullLayout._has && oldFullLayout._has('cartesian'));
    var hasCartesian = (newFullLayout._has && newFullLayout._has('cartesian'));

    if(hadCartesian && !hasCartesian) {
        var subplotLayers = oldFullLayout._cartesianlayer.selectAll('.subplot');

        subplotLayers.call(purgeSubplotLayers, oldFullLayout);
        oldFullLayout._defs.selectAll('.axesclip').remove();
    }
};

exports.drawFramework = function(gd) {
    var fullLayout = gd._fullLayout,
        subplotData = makeSubplotData(gd);

    var subplotLayers = fullLayout._cartesianlayer.selectAll('.subplot')
        .data(subplotData, Lib.identity);

    subplotLayers.enter().append('g')
        .attr('class', function(name) { return 'subplot ' + name; });

    subplotLayers.order();

    subplotLayers.exit()
        .call(purgeSubplotLayers, fullLayout);

    subplotLayers.each(function(name) {
        var plotinfo = fullLayout._plots[name];

        // keep ref to plot group
        plotinfo.plotgroup = d3.select(this);

        // initialize list of overlay subplots
        plotinfo.overlays = [];

        makeSubplotLayer(plotinfo);

        // fill in list of overlay subplots
        if(plotinfo.mainplot) {
            var mainplot = fullLayout._plots[plotinfo.mainplot];
            mainplot.overlays.push(plotinfo);
        }

        // make separate drag layers for each subplot,
        // but append them to paper rather than the plot groups,
        // so they end up on top of the rest
        plotinfo.draglayer = joinLayer(fullLayout._draggers, 'g', name);
    });
};

exports.rangePlot = function(gd, plotinfo, cdSubplot) {
    makeSubplotLayer(plotinfo);
    plotOne(gd, plotinfo, cdSubplot);
    Plots.style(gd);
};

function makeSubplotData(gd) {
    var fullLayout = gd._fullLayout,
        subplots = Axes.getSubplots(gd);

    var subplotData = [],
        overlays = [];

    for(var i = 0; i < subplots.length; i++) {
        var subplot = subplots[i],
            plotinfo = fullLayout._plots[subplot];

        var xa = plotinfo.xaxis,
            ya = plotinfo.yaxis;

        // is this subplot overlaid on another?
        // ax.overlaying is the id of another axis of the same
        // dimension that this one overlays to be an overlaid subplot,
        // the main plot must exist make sure we're not trying to
        // overlay on an axis that's already overlaying another
        var xa2 = Axes.getFromId(gd, xa.overlaying) || xa;
        if(xa2 !== xa && xa2.overlaying) {
            xa2 = xa;
            xa.overlaying = false;
        }

        var ya2 = Axes.getFromId(gd, ya.overlaying) || ya;
        if(ya2 !== ya && ya2.overlaying) {
            ya2 = ya;
            ya.overlaying = false;
        }

        var mainplot = xa2._id + ya2._id;
        if(mainplot !== subplot && subplots.indexOf(mainplot) !== -1) {
            plotinfo.mainplot = mainplot;
            plotinfo.mainplotinfo = fullLayout._plots[mainplot];
            overlays.push(subplot);

            // for now force overlays to overlay completely... so they
            // can drag together correctly and share backgrounds.
            // Later perhaps we make separate axis domain and
            // tick/line domain or something, so they can still share
            // the (possibly larger) dragger and background but don't
            // have to both be drawn over that whole domain
            xa.domain = xa2.domain.slice();
            ya.domain = ya2.domain.slice();
        }
        else {
            subplotData.push(subplot);
        }
    }

    // main subplots before overlays
    subplotData = subplotData.concat(overlays);

    return subplotData;
}

function makeSubplotLayer(plotinfo) {
    var plotgroup = plotinfo.plotgroup,
        id = plotinfo.id;

    // Layers to keep plot types in the right order.
    // from back to front:
    // 1. heatmaps, 2D histos and contour maps
    // 2. bars / 1D histos
    // 3. errorbars for bars and scatter
    // 4. scatter
    // 5. box plots
    function joinPlotLayers(parent) {
        joinLayer(parent, 'g', 'imagelayer');
        joinLayer(parent, 'g', 'maplayer');
        joinLayer(parent, 'g', 'barlayer');
        joinLayer(parent, 'g', 'boxlayer');
        joinLayer(parent, 'g', 'scatterlayer');
    }

    if(!plotinfo.mainplot) {
        plotinfo.bg = joinLayer(plotgroup, 'rect', 'bg');
        plotinfo.bg.style('stroke-width', 0);

        var backLayer = joinLayer(plotgroup, 'g', 'layer-subplot');
        plotinfo.shapelayer = joinLayer(backLayer, 'g', 'shapelayer');
        plotinfo.imagelayer = joinLayer(backLayer, 'g', 'imagelayer');

        plotinfo.gridlayer = joinLayer(plotgroup, 'g', 'gridlayer');
        plotinfo.overgrid = joinLayer(plotgroup, 'g', 'overgrid');

        plotinfo.zerolinelayer = joinLayer(plotgroup, 'g', 'zerolinelayer');
        plotinfo.overzero = joinLayer(plotgroup, 'g', 'overzero');

        plotinfo.plot = joinLayer(plotgroup, 'g', 'plot');
        plotinfo.overplot = joinLayer(plotgroup, 'g', 'overplot');

        plotinfo.xlines = joinLayer(plotgroup, 'path', 'xlines');
        plotinfo.ylines = joinLayer(plotgroup, 'path', 'ylines');
        plotinfo.overlines = joinLayer(plotgroup, 'g', 'overlines');

        plotinfo.xaxislayer = joinLayer(plotgroup, 'g', 'xaxislayer');
        plotinfo.yaxislayer = joinLayer(plotgroup, 'g', 'yaxislayer');
        plotinfo.overaxes = joinLayer(plotgroup, 'g', 'overaxes');
    }
    else {
        var mainplotinfo = plotinfo.mainplotinfo;

        // now make the components of overlaid subplots
        // overlays don't have backgrounds, and append all
        // their other components to the corresponding
        // extra groups of their main plots.

        plotinfo.gridlayer = joinLayer(mainplotinfo.overgrid, 'g', id);
        plotinfo.zerolinelayer = joinLayer(mainplotinfo.overzero, 'g', id);

        plotinfo.plot = joinLayer(mainplotinfo.overplot, 'g', id);
        plotinfo.xlines = joinLayer(mainplotinfo.overlines, 'path', id);
        plotinfo.ylines = joinLayer(mainplotinfo.overlines, 'path', id);
        plotinfo.xaxislayer = joinLayer(mainplotinfo.overaxes, 'g', id);
        plotinfo.yaxislayer = joinLayer(mainplotinfo.overaxes, 'g', id);
    }

    // common attributes for all subplots, overlays or not
    plotinfo.plot.call(joinPlotLayers);

    plotinfo.xlines
        .style('fill', 'none')
        .classed('crisp', true);

    plotinfo.ylines
        .style('fill', 'none')
        .classed('crisp', true);
}

function purgeSubplotLayers(layers, fullLayout) {
    if(!layers) return;

    layers.each(function(subplot) {
        var plotgroup = d3.select(this),
            clipId = 'clip' + fullLayout._uid + subplot + 'plot';

        plotgroup.remove();
        fullLayout._draggers.selectAll('g.' + subplot).remove();
        fullLayout._defs.select('#' + clipId).remove();

        // do not remove individual axis <clipPath>s here
        // as other subplots may need them
    });
}

function joinLayer(parent, nodeType, className) {
    var layer = parent.selectAll('.' + className)
        .data([0]);

    layer.enter().append(nodeType)
        .classed(className, true);

    return layer;
}
