/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var d3 = require('d3');
var Lib = require('../../lib');
var Plots = require('../plots');
var getModuleCalcData = require('../get_data').getModuleCalcData;

var axisIds = require('./axis_ids');
var constants = require('./constants');
var xmlnsNamespaces = require('../../constants/xmlns_namespaces');

var ensureSingle = Lib.ensureSingle;

function ensureSingleAndAddDatum(parent, nodeType, className) {
    return Lib.ensureSingle(parent, nodeType, className, function(s) {
        s.datum(className);
    });
}

exports.name = 'cartesian';

exports.attr = ['xaxis', 'yaxis'];

exports.idRoot = ['x', 'y'];

exports.idRegex = constants.idRegex;

exports.attrRegex = constants.attrRegex;

exports.attributes = require('./attributes');

exports.layoutAttributes = require('./layout_attributes');

exports.supplyLayoutDefaults = require('./layout_defaults');

exports.transitionAxes = require('./transition_axes');

exports.finalizeSubplots = function(layoutIn, layoutOut) {
    var subplots = layoutOut._subplots;
    var xList = subplots.xaxis;
    var yList = subplots.yaxis;
    var spSVG = subplots.cartesian;
    var spAll = spSVG.concat(subplots.gl2d || []);
    var allX = {};
    var allY = {};
    var i, xi, yi;

    for(i = 0; i < spAll.length; i++) {
        var parts = spAll[i].split('y');
        allX[parts[0]] = 1;
        allY['y' + parts[1]] = 1;
    }

    // check for x axes with no subplot, and make one from the anchor of that x axis
    for(i = 0; i < xList.length; i++) {
        xi = xList[i];
        if(!allX[xi]) {
            yi = (layoutIn[axisIds.id2name(xi)] || {}).anchor;
            if(!constants.idRegex.y.test(yi)) yi = 'y';
            spSVG.push(xi + yi);
            spAll.push(xi + yi);

            if(!allY[yi]) {
                allY[yi] = 1;
                Lib.pushUnique(yList, yi);
            }
        }
    }

    // same for y axes with no subplot
    for(i = 0; i < yList.length; i++) {
        yi = yList[i];
        if(!allY[yi]) {
            xi = (layoutIn[axisIds.id2name(yi)] || {}).anchor;
            if(!constants.idRegex.x.test(xi)) xi = 'x';
            spSVG.push(xi + yi);
            spAll.push(xi + yi);

            if(!allX[xi]) {
                allX[xi] = 1;
                Lib.pushUnique(xList, xi);
            }
        }
    }

    // finally, if we've gotten here we're supposed to show cartesian...
    // so if there are NO subplots at all, make one from the first
    // x & y axes in the input layout
    if(!spAll.length) {
        xi = '';
        yi = '';
        for(var ki in layoutIn) {
            if(constants.attrRegex.test(ki)) {
                var axLetter = ki.charAt(0);
                if(axLetter === 'x') {
                    if(!xi || (+ki.substr(5) < +xi.substr(5))) {
                        xi = ki;
                    }
                }
                else if(!yi || (+ki.substr(5) < +yi.substr(5))) {
                    yi = ki;
                }
            }
        }
        xi = xi ? axisIds.name2id(xi) : 'x';
        yi = yi ? axisIds.name2id(yi) : 'y';
        xList.push(xi);
        yList.push(yi);
        spSVG.push(xi + yi);
    }
};

exports.plot = function(gd, traces, transitionOpts, makeOnCompleteCallback) {
    var fullLayout = gd._fullLayout;
    var subplots = fullLayout._subplots.cartesian;
    var calcdata = gd.calcdata;
    var i;

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
                // XXX: Should trace carpet dependencies. Only replot all carpet plots if the carpet
                // axis has actually changed:
                //
                // If this trace is specifically requested, add it to the list:
                if(traces.indexOf(trace.index) !== -1 || trace.carpet) {
                    // Okay, so example: traces 0, 1, and 2 have fill = tonext. You animate
                    // traces 0 and 2. Trace 1 also needs to be updated, otherwise its fill
                    // is outdated. So this retroactively adds the previous trace if the
                    // traces are interdependent.
                    if(
                        pcd &&
                        pcd[0].trace.xaxis + pcd[0].trace.yaxis === subplot &&
                        ['tonextx', 'tonexty', 'tonext'].indexOf(trace.fill) !== -1 &&
                        cdSubplot.indexOf(pcd) === -1
                    ) {
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
        var cdModule = getModuleCalcData(cdSubplot, _module);

        if(_module.plot) _module.plot(gd, plotinfo, cdModule, transitionOpts, makeOnCompleteCallback);
    }
}

exports.clean = function(newFullData, newFullLayout, oldFullData, oldFullLayout) {
    var oldModules = oldFullLayout._modules || [];
    var newModules = newFullLayout._modules || [];
    var oldPlots = oldFullLayout._plots || {};

    var hadScatter, hasScatter;
    var hadGl, hasGl;
    var i, k, subplotInfo, moduleName;

    // when going from a large splom graph to something else,
    // we need to clear <g subplot> so that the new cartesian subplot
    // can have the correct layer ordering
    if(oldFullLayout._hasOnlyLargeSploms && !newFullLayout._hasOnlyLargeSploms) {
        for(k in oldPlots) {
            subplotInfo = oldPlots[k];
            if(subplotInfo.plotgroup) subplotInfo.plotgroup.remove();
        }
    }

    for(i = 0; i < oldModules.length; i++) {
        moduleName = oldModules[i].name;
        if(moduleName === 'scatter') hadScatter = true;
        else if(moduleName === 'scattergl') hadGl = true;
    }

    for(i = 0; i < newModules.length; i++) {
        moduleName = newModules[i].name;
        if(moduleName === 'scatter') hasScatter = true;
        else if(moduleName === 'scattergl') hasGl = true;
    }

    if(hadScatter && !hasScatter) {
        for(k in oldPlots) {
            subplotInfo = oldPlots[k];
            if(subplotInfo.plot) {
                subplotInfo.plot.select('g.scatterlayer')
                    .selectAll('g.trace')
                    .remove();
            }
        }

        oldFullLayout._infolayer.selectAll('g.rangeslider-container')
            .select('g.scatterlayer')
            .selectAll('g.trace')
            .remove();
    }

    if(hadGl && !hasGl) {
        for(k in oldPlots) {
            subplotInfo = oldPlots[k];

            if(subplotInfo._scene) {
                subplotInfo._scene.destroy();
            }
        }
    }

    var oldSubplotList = oldFullLayout._subplots || {};
    var newSubplotList = newFullLayout._subplots || {xaxis: [], yaxis: []};

    // delete any titles we don't need anymore
    // check if axis list has changed, and if so clear old titles
    if(oldSubplotList.xaxis && oldSubplotList.yaxis) {
        var oldAxIDs = oldSubplotList.xaxis.concat(oldSubplotList.yaxis);
        var newAxIDs = newSubplotList.xaxis.concat(newSubplotList.yaxis);

        for(i = 0; i < oldAxIDs.length; i++) {
            if(newAxIDs.indexOf(oldAxIDs[i]) === -1) {
                oldFullLayout._infolayer.selectAll('.g-' + oldAxIDs[i] + 'title').remove();
            }
        }
    }

    // if we've gotten rid of all cartesian traces, remove all the subplot svg items
    var hadCartesian = (oldFullLayout._has && oldFullLayout._has('cartesian'));
    var hasCartesian = (newFullLayout._has && newFullLayout._has('cartesian'));

    if(hadCartesian && !hasCartesian) {
        purgeSubplotLayers(oldFullLayout._cartesianlayer.selectAll('.subplot'), oldFullLayout);
        oldFullLayout._defs.selectAll('.axesclip').remove();
        delete oldFullLayout._axisConstraintGroups;
    }
    // otherwise look for subplots we need to remove
    else if(oldSubplotList.cartesian) {
        for(i = 0; i < oldSubplotList.cartesian.length; i++) {
            var oldSubplotId = oldSubplotList.cartesian[i];
            if(newSubplotList.cartesian.indexOf(oldSubplotId) === -1) {
                var selector = '.' + oldSubplotId + ',.' + oldSubplotId + '-x,.' + oldSubplotId + '-y';
                oldFullLayout._cartesianlayer.selectAll(selector).remove();
                removeSubplotExtras(oldSubplotId, oldFullLayout);
            }
        }
    }
};

exports.drawFramework = function(gd) {
    var fullLayout = gd._fullLayout;
    var subplotData = makeSubplotData(gd);

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

        makeSubplotLayer(gd, plotinfo);

        // fill in list of overlay subplots
        if(plotinfo.mainplot) {
            var mainplot = fullLayout._plots[plotinfo.mainplot];
            mainplot.overlays.push(plotinfo);
        }

        // make separate drag layers for each subplot,
        // but append them to paper rather than the plot groups,
        // so they end up on top of the rest
        plotinfo.draglayer = ensureSingle(fullLayout._draggers, 'g', name);
    });
};

exports.rangePlot = function(gd, plotinfo, cdSubplot) {
    makeSubplotLayer(gd, plotinfo);
    plotOne(gd, plotinfo, cdSubplot);
    Plots.style(gd);
};

function makeSubplotData(gd) {
    var fullLayout = gd._fullLayout;
    var subplotData = [];
    var overlays = [];

    for(var k in fullLayout._plots) {
        var plotinfo = fullLayout._plots[k];
        var xa2 = plotinfo.xaxis._mainAxis;
        var ya2 = plotinfo.yaxis._mainAxis;
        var mainplot = xa2._id + ya2._id;

        if(mainplot !== k && fullLayout._plots[mainplot]) {
            plotinfo.mainplot = mainplot;
            plotinfo.mainplotinfo = fullLayout._plots[mainplot];
            overlays.push(k);
        } else {
            subplotData.push(k);
        }
    }

    // main subplots before overlays
    subplotData = subplotData.concat(overlays);

    return subplotData;
}

function makeSubplotLayer(gd, plotinfo) {
    var plotgroup = plotinfo.plotgroup;
    var id = plotinfo.id;
    var xLayer = constants.layerValue2layerClass[plotinfo.xaxis.layer];
    var yLayer = constants.layerValue2layerClass[plotinfo.yaxis.layer];
    var hasOnlyLargeSploms = gd._fullLayout._hasOnlyLargeSploms;

    if(!plotinfo.mainplot) {
        if(hasOnlyLargeSploms) {
            // TODO could do even better
            // - we don't need plot (but we would have to mock it in lsInner
            //   and other places
            // - we don't (x|y)lines and (x|y)axislayer for most subplots
            //   usually just the bottom x and left y axes.
            plotinfo.plot = ensureSingle(plotgroup, 'g', 'plot');
            plotinfo.xlines = ensureSingle(plotgroup, 'path', 'xlines-above');
            plotinfo.ylines = ensureSingle(plotgroup, 'path', 'ylines-above');
            plotinfo.xaxislayer = ensureSingle(plotgroup, 'g', 'xaxislayer-above');
            plotinfo.yaxislayer = ensureSingle(plotgroup, 'g', 'yaxislayer-above');
        }
        else {
            var backLayer = ensureSingle(plotgroup, 'g', 'layer-subplot');
            plotinfo.shapelayer = ensureSingle(backLayer, 'g', 'shapelayer');
            plotinfo.imagelayer = ensureSingle(backLayer, 'g', 'imagelayer');

            plotinfo.gridlayer = ensureSingle(plotgroup, 'g', 'gridlayer');
            plotinfo.zerolinelayer = ensureSingle(plotgroup, 'g', 'zerolinelayer');

            ensureSingle(plotgroup, 'path', 'xlines-below');
            ensureSingle(plotgroup, 'path', 'ylines-below');
            plotinfo.overlinesBelow = ensureSingle(plotgroup, 'g', 'overlines-below');

            ensureSingle(plotgroup, 'g', 'xaxislayer-below');
            ensureSingle(plotgroup, 'g', 'yaxislayer-below');
            plotinfo.overaxesBelow = ensureSingle(plotgroup, 'g', 'overaxes-below');

            plotinfo.plot = ensureSingle(plotgroup, 'g', 'plot');
            plotinfo.overplot = ensureSingle(plotgroup, 'g', 'overplot');

            plotinfo.xlines = ensureSingle(plotgroup, 'path', 'xlines-above');
            plotinfo.ylines = ensureSingle(plotgroup, 'path', 'ylines-above');
            plotinfo.overlinesAbove = ensureSingle(plotgroup, 'g', 'overlines-above');

            ensureSingle(plotgroup, 'g', 'xaxislayer-above');
            ensureSingle(plotgroup, 'g', 'yaxislayer-above');
            plotinfo.overaxesAbove = ensureSingle(plotgroup, 'g', 'overaxes-above');

            // set refs to correct layers as determined by 'axis.layer'
            plotinfo.xlines = plotgroup.select('.xlines-' + xLayer);
            plotinfo.ylines = plotgroup.select('.ylines-' + yLayer);
            plotinfo.xaxislayer = plotgroup.select('.xaxislayer-' + xLayer);
            plotinfo.yaxislayer = plotgroup.select('.yaxislayer-' + yLayer);
        }
    }
    else {
        var mainplotinfo = plotinfo.mainplotinfo;
        var mainplotgroup = mainplotinfo.plotgroup;
        var xId = id + '-x';
        var yId = id + '-y';

        // now make the components of overlaid subplots
        // overlays don't have backgrounds, and append all
        // their other components to the corresponding
        // extra groups of their main plots.

        plotinfo.gridlayer = mainplotinfo.gridlayer;
        plotinfo.zerolinelayer = mainplotinfo.zerolinelayer;

        ensureSingle(mainplotinfo.overlinesBelow, 'path', xId);
        ensureSingle(mainplotinfo.overlinesBelow, 'path', yId);
        ensureSingle(mainplotinfo.overaxesBelow, 'g', xId);
        ensureSingle(mainplotinfo.overaxesBelow, 'g', yId);

        plotinfo.plot = ensureSingle(mainplotinfo.overplot, 'g', id);

        ensureSingle(mainplotinfo.overlinesAbove, 'path', xId);
        ensureSingle(mainplotinfo.overlinesAbove, 'path', yId);
        ensureSingle(mainplotinfo.overaxesAbove, 'g', xId);
        ensureSingle(mainplotinfo.overaxesAbove, 'g', yId);

        // set refs to correct layers as determined by 'abovetraces'
        plotinfo.xlines = mainplotgroup.select('.overlines-' + xLayer).select('.' + xId);
        plotinfo.ylines = mainplotgroup.select('.overlines-' + yLayer).select('.' + yId);
        plotinfo.xaxislayer = mainplotgroup.select('.overaxes-' + xLayer).select('.' + xId);
        plotinfo.yaxislayer = mainplotgroup.select('.overaxes-' + yLayer).select('.' + yId);
    }

    // common attributes for all subplots, overlays or not

    if(!hasOnlyLargeSploms) {
        ensureSingleAndAddDatum(plotinfo.gridlayer, 'g', plotinfo.xaxis._id);
        ensureSingleAndAddDatum(plotinfo.gridlayer, 'g', plotinfo.yaxis._id);
        plotinfo.gridlayer.selectAll('g').sort(axisIds.idSort);

        for(var i = 0; i < constants.traceLayerClasses.length; i++) {
            ensureSingle(plotinfo.plot, 'g', constants.traceLayerClasses[i]);
        }
    }

    plotinfo.xlines
        .style('fill', 'none')
        .classed('crisp', true);

    plotinfo.ylines
        .style('fill', 'none')
        .classed('crisp', true);
}

function purgeSubplotLayers(layers, fullLayout) {
    if(!layers) return;

    var overlayIdsToRemove = {};

    layers.each(function(subplotId) {
        var plotgroup = d3.select(this);

        plotgroup.remove();
        removeSubplotExtras(subplotId, fullLayout);

        overlayIdsToRemove[subplotId] = true;

        // do not remove individual axis <clipPath>s here
        // as other subplots may need them
    });

    // must remove overlaid subplot trace layers 'manually'

    var subplots = fullLayout._plots;
    var subplotIds = Object.keys(subplots);

    for(var i = 0; i < subplotIds.length; i++) {
        var subplotInfo = subplots[subplotIds[i]];
        var overlays = subplotInfo.overlays || [];

        for(var j = 0; j < overlays.length; j++) {
            var overlayInfo = overlays[j];

            if(overlayIdsToRemove[overlayInfo.id]) {
                overlayInfo.plot.selectAll('.trace').remove();
            }
        }
    }
}

function removeSubplotExtras(subplotId, fullLayout) {
    fullLayout._draggers.selectAll('g.' + subplotId).remove();
    fullLayout._defs.select('#clip' + fullLayout._uid + subplotId + 'plot').remove();
}

exports.toSVG = function(gd) {
    var imageRoot = gd._fullLayout._glimages;
    var root = d3.select(gd).selectAll('.svg-container');
    var canvases = root.filter(function(d, i) {return i === root.size() - 1;})
        .selectAll('.gl-canvas-context, .gl-canvas-focus');

    function canvasToImage() {
        var canvas = this;
        var imageData = canvas.toDataURL('image/png');
        var image = imageRoot.append('svg:image');

        image.attr({
            xmlns: xmlnsNamespaces.svg,
            'xlink:href': imageData,
            preserveAspectRatio: 'none',
            x: 0,
            y: 0,
            width: canvas.width,
            height: canvas.height
        });
    }

    canvases.each(canvasToImage);
};

exports.updateFx = require('./graph_interact').updateFx;
