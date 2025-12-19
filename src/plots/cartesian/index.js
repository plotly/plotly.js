'use strict';

var d3 = require('@plotly/d3');

var Registry = require('../../registry');
var Lib = require('../../lib');
var Plots = require('../plots');
var Drawing = require('../../components/drawing');

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

var zindexSeparator = constants.zindexSeparator;

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
    var spAll = spSVG;
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
                    if(!xi || (+ki.slice(5) < +xi.slice(5))) {
                        xi = ki;
                    }
                } else if(!yi || (+ki.slice(5) < +yi.slice(5))) {
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

/**
 * Cartesian.plot
 *
 * @param {DOM div | object} gd
 * @param {array (optional)} traces
 *  array of traces indices to plot
 *  if undefined, plots all cartesian traces,
 * @param {object} (optional) transitionOpts
 *  transition option object
 * @param {function} (optional) makeOnCompleteCallback
 *  transition make callback function from Plots.transition
 */
exports.plot = function(gd, traces, transitionOpts, makeOnCompleteCallback) {
    var fullLayout = gd._fullLayout;
    var subplots = fullLayout._subplots.cartesian;
    var calcdata = gd.calcdata;
    var i;

    // Traces is a list of trace indices to (re)plot. If it's not provided,
    // then it's a complete replot so we create a new list and add all trace indices
    // which are in calcdata.

    if(!Array.isArray(traces)) {
        // If traces is not provided, then it's a complete replot and missing
        // traces are removed
        traces = [];
        for(i = 0; i < calcdata.length; i++) traces.push(i);
    }

    var zindices = fullLayout._zindices;
    // Plot each zorder group in ascending order
    for(var z = 0; z < zindices.length; z++) {
        var zorder = zindices[z];

        // For each subplot
        for(i = 0; i < subplots.length; i++) {
            var subplot = subplots[i];
            var subplotInfo = fullLayout._plots[subplot];

            if(z > 0) {
                var idWithZ = subplotInfo.id;
                if(idWithZ.indexOf(zindexSeparator) !== -1) continue;
                idWithZ += zindexSeparator + (z + 1);
                subplotInfo = Lib.extendFlat({}, subplotInfo, {
                    id: idWithZ,
                    plot: fullLayout._cartesianlayer.selectAll('.subplot').select('.' + idWithZ)
                });
            }

            // Get all calcdata (traces) for this subplot:
            var cdSubplot = [];
            var pcd;

            // For each trace
            for(var j = 0; j < calcdata.length; j++) {
                var cd = calcdata[j];
                var trace = cd[0].trace;

                if(zorder !== (trace.zorder || 0)) continue;

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
            // Plot the traces for this subplot
            plotOne(gd, subplotInfo, cdSubplot, transitionOpts, makeOnCompleteCallback);
        }
    }
};

function plotOne(gd, plotinfo, cdSubplot, transitionOpts, makeOnCompleteCallback) {
    var traceLayerClasses = constants.traceLayerClasses;
    var fullLayout = gd._fullLayout;
    var zindices = fullLayout._zindices;

    var modules = fullLayout._modules;
    var _module, cdModuleAndOthers, cdModule;

    var layerData = [];
    var zoomScaleQueryParts = [];

    // Plot each zorder group in ascending order
    for(var z = 0; z < zindices.length; z++) {
        var zorder = zindices[z];
        // For each "module" (trace type)
        for(var i = 0; i < modules.length; i++) {
            _module = modules[i];
            var name = _module.name;
            var categories = Registry.modules[name].categories;

            if(categories.svg) {
                var classBaseName = (_module.layerName || name + 'layer');
                var className = classBaseName + (z ? Number(z) + 1 : '');
                var plotMethod = _module.plot;

                // plot all visible traces of this type on this subplot at once
                cdModuleAndOthers = getModuleCalcData(cdSubplot, plotMethod, zorder);
                cdModule = cdModuleAndOthers[0];
                // don't need to search the found traces again - in fact we need to NOT
                // so that if two modules share the same plotter we don't double-plot
                cdSubplot = cdModuleAndOthers[1];

                if(cdModule.length) {
                    layerData.push({
                        i: traceLayerClasses.indexOf(classBaseName),
                        zindex: z,
                        className: className,
                        plotMethod: plotMethod,
                        cdModule: cdModule
                    });
                }

                if(categories.zoomScale) {
                    zoomScaleQueryParts.push('.' + className);
                }
            }
        }
    }
    // Sort the layers primarily by zindex, then by i
    layerData.sort(function(a, b) {
        return (
            (a.zindex || 0) - (b.zindex || 0) ||
            (a.i - b.i)
        );
    });

    var layers = plotinfo.plot.selectAll('g.mlayer')
        .data(layerData, function(d) { return d.className; });

    layers.enter().append('g')
        .attr('class', function(d) { return d.className; })
        .classed('mlayer', true)
        .classed('rangeplot', plotinfo.isRangePlot);

    layers.exit().remove();

    layers.order();

    layers.each(function(d) {
        var sel = d3.select(this);
        var className = d.className;

        d.plotMethod(
            gd, plotinfo, d.cdModule, sel,
            transitionOpts, makeOnCompleteCallback
        );

        // layers that allow `cliponaxis: false`
        if(constants.clipOnAxisFalseQuery.indexOf('.' + className) === -1) {
            Drawing.setClipUrl(sel, plotinfo.layerClipId, gd);
        }
    });

    // call Scattergl.plot separately
    if(fullLayout._has('scattergl')) {
        _module = Registry.getModule('scattergl');
        cdModule = getModuleCalcData(cdSubplot, _module)[0];
        _module.plot(gd, plotinfo, cdModule);
    }

    // stash "hot" selections for faster interaction on drag and scroll
    if(!gd._context.staticPlot) {
        if(plotinfo._hasClipOnAxisFalse) {
            plotinfo.clipOnAxisFalseTraces = plotinfo.plot
                .selectAll(constants.clipOnAxisFalseQuery.join(','))
                .selectAll('.trace');
        }

        if(zoomScaleQueryParts.length) {
            var traces = plotinfo.plot
                .selectAll(zoomScaleQueryParts.join(','))
                .selectAll('.trace');

            plotinfo.zoomScalePts = traces.selectAll('path.point');
            plotinfo.zoomScaleTxt = traces.selectAll('.textpoint');
        }
    }
}

exports.clean = function(newFullData, newFullLayout, oldFullData, oldFullLayout) {
    var oldPlots = oldFullLayout._plots || {};
    var newPlots = newFullLayout._plots || {};
    var oldSubplotList = oldFullLayout._subplots || {};
    var plotinfo;
    var i, k;

    // when going from a large splom graph to something else,
    // we need to clear <g subplot> so that the new cartesian subplot
    // can have the correct layer ordering
    if(oldFullLayout._hasOnlyLargeSploms && !newFullLayout._hasOnlyLargeSploms) {
        for(k in oldPlots) {
            plotinfo = oldPlots[k];
            if(plotinfo.plotgroup) plotinfo.plotgroup.remove();
        }
    }

    var hadGl = (oldFullLayout._has && oldFullLayout._has('gl'));
    var hasGl = (newFullLayout._has && newFullLayout._has('gl'));

    if(hadGl && !hasGl) {
        for(k in oldPlots) {
            plotinfo = oldPlots[k];
            if(plotinfo._scene) plotinfo._scene.destroy();
        }
    }

    // delete any titles we don't need anymore
    // check if axis list has changed, and if so clear old titles
    if(oldSubplotList.xaxis && oldSubplotList.yaxis) {
        var oldAxIDs = axisIds.listIds({_fullLayout: oldFullLayout});
        for(i = 0; i < oldAxIDs.length; i++) {
            var oldAxId = oldAxIDs[i];
            if(!newFullLayout[axisIds.id2name(oldAxId)]) {
                oldFullLayout._infolayer.selectAll('.g-' + oldAxId + 'title').remove();
            }
        }
    }

    var hadCartesian = (oldFullLayout._has && oldFullLayout._has('cartesian'));
    var hasCartesian = (newFullLayout._has && newFullLayout._has('cartesian'));

    if(hadCartesian && !hasCartesian) {
        // if we've gotten rid of all cartesian traces, remove all the subplot svg items

        purgeSubplotLayers(oldFullLayout._cartesianlayer.selectAll('.subplot'), oldFullLayout);
        oldFullLayout._defs.selectAll('.axesclip').remove();
        delete oldFullLayout._axisConstraintGroups;
        delete oldFullLayout._axisMatchGroups;
    } else if(oldSubplotList.cartesian) {
        // otherwise look for subplots we need to remove

        for(i = 0; i < oldSubplotList.cartesian.length; i++) {
            var oldSubplotId = oldSubplotList.cartesian[i];

            // skip zindex layes in this process
            if(oldSubplotId.indexOf(zindexSeparator) !== -1) continue;

            if(!newPlots[oldSubplotId]) {
                var selector = '.' + oldSubplotId + ',.' + oldSubplotId + '-x,.' + oldSubplotId + '-y';
                oldFullLayout._cartesianlayer.selectAll(selector).remove();
                removeSubplotExtras(oldSubplotId, oldFullLayout);
            }
        }
    }
};

exports.drawFramework = function(gd) {
    var fullLayout = gd._fullLayout;
    var calcdata = gd.calcdata;
    var i;

    // Separate traces by zorder and plot each zorder group separately
    var traceZorderGroups = {};
    for(i = 0; i < calcdata.length; i++) {
        var cdi = calcdata[i][0];
        var trace = cdi.trace;

        var zi = trace.zorder || 0;
        if(!traceZorderGroups[zi]) traceZorderGroups[zi] = [];
        traceZorderGroups[zi].push(cdi);
    }

    // Group by zorder group in ascending order
    var zindices = Object.keys(traceZorderGroups)
        .map(Number)
        .sort(Lib.sorterAsc);

    if(!zindices.length) zindices = [0];

    fullLayout._zindices = zindices;

    var initialSubplotData = makeSubplotData(gd);

    var len = initialSubplotData.length;
    var subplotData = [];
    for(i = 0; i < len; i++) {
        subplotData[i] = initialSubplotData[i].slice();
    }

    for(var z = 1; z < zindices.length; z++) {
        var newSubplotData = [];
        for(i = 0; i < len; i++) {
            newSubplotData[i] = initialSubplotData[i].slice();
            newSubplotData[i][0] += zindexSeparator + (z + 1);
        }
        subplotData = subplotData.concat(newSubplotData);
    }

    var subplotLayers = fullLayout._cartesianlayer.selectAll('.subplot')
        .data(subplotData, String);


    subplotLayers.enter().append('g')
        .attr('class', function(d) { return 'subplot ' + d[0]; });

    subplotLayers.order();

    subplotLayers.exit()
        .call(purgeSubplotLayers, fullLayout);

    subplotLayers.each(function(d) {
        var id = d[0];
        var posZ = id.indexOf(zindexSeparator);
        var hasZ = posZ !== -1;
        var idWithoutZ = hasZ ?
            id.slice(0, posZ) :
            id;

        var plotinfo = fullLayout._plots[id];
        if(!plotinfo) {
            plotinfo = Lib.extendFlat({}, fullLayout._plots[idWithoutZ]);

            if(plotinfo) {
                plotinfo.id = id;
                fullLayout._plots[id] = plotinfo;
                fullLayout._subplots.cartesian.push(id);
            }
        }

        if(plotinfo) {
            plotinfo.plotgroup = d3.select(this);
            makeSubplotLayer(gd, plotinfo);

            if(!hasZ) {
                // make separate drag layers for each subplot,
                // but append them to paper rather than the plot groups,
                // so they end up on top of the rest
                plotinfo.draglayer = ensureSingle(fullLayout._draggers, 'g', id);
            }
        }
    });
};

exports.rangePlot = function(gd, plotinfo, cdSubplot) {
    makeSubplotLayer(gd, plotinfo);
    plotOne(gd, plotinfo, cdSubplot);
    Plots.style(gd);
};

function makeSubplotData(gd) {
    var fullLayout = gd._fullLayout;
    var numZ = fullLayout._zindices.length;

    var ids = fullLayout._subplots.cartesian;
    var len = ids.length;
    var i, j, id, plotinfo, xa, ya;

    // split 'regular' and 'overlaying' subplots
    var regulars = [];
    var overlays = [];

    for(i = 0; i < len; i++) {
        id = ids[i];
        plotinfo = fullLayout._plots[id];
        xa = plotinfo.xaxis;
        ya = plotinfo.yaxis;

        var xa2 = xa._mainAxis;
        var ya2 = ya._mainAxis;
        var mainplot = xa2._id + ya2._id;
        var mainplotinfo = fullLayout._plots[mainplot];
        plotinfo.overlays = [];

        if(mainplot !== id && mainplotinfo) {
            plotinfo.mainplot = mainplot;
            plotinfo.mainplotinfo = mainplotinfo;
            overlays.push(id);
        } else {
            plotinfo.mainplot = undefined;
            plotinfo.mainplotinfo = undefined;
            regulars.push(id);
        }
    }

    // fill in list of overlaying subplots in 'main plot'
    for(i = 0; i < overlays.length; i++) {
        id = overlays[i];
        plotinfo = fullLayout._plots[id];
        plotinfo.mainplotinfo.overlays.push(plotinfo);
    }

    // put 'regular' subplot data before 'overlaying'
    var subplotIds = regulars.concat(overlays);
    var subplotData = [];

    for(i = 0; i < len; i++) {
        id = subplotIds[i];
        plotinfo = fullLayout._plots[id];
        xa = plotinfo.xaxis;
        ya = plotinfo.yaxis;

        var d = [];

        for(var z = 1; z <= numZ; z++) {
            var zStr = '';
            if(z > 1) zStr += zindexSeparator + z;

            // use info about axis layer and overlaying pattern
            // to clean what need to be cleaned up in exit selection
            d.push(id + zStr);
            for(j = 0; j < plotinfo.overlays.length; j++) {
                d.push(plotinfo.overlays[j].id + zStr);
            }
        }

        d = d.concat([
            xa.layer,
            ya.layer,
            xa.overlaying || '',
            ya.overlaying || ''
        ]);

        subplotData.push(d);
    }
    return subplotData;
}

function makeSubplotLayer(gd, plotinfo) {
    var fullLayout = gd._fullLayout;
    var plotgroup = plotinfo.plotgroup;
    var id = plotinfo.id;

    var posZ = id.indexOf(zindexSeparator);
    var hasZ = posZ !== -1;

    var xLayer = constants.layerValue2layerClass[plotinfo.xaxis.layer];
    var yLayer = constants.layerValue2layerClass[plotinfo.yaxis.layer];
    var hasOnlyLargeSploms = fullLayout._hasOnlyLargeSploms;

    var hasMultipleZ = fullLayout._zindices.length > 1;
    var mainplotinfo = plotinfo.mainplotinfo;

    if(!plotinfo.mainplot || hasMultipleZ) {
        if(hasOnlyLargeSploms) {
            // TODO could do even better
            // - we don't need plot (but we would have to mock it in lsInner
            //   and other places
            // - we don't (x|y)lines and (x|y)axislayer for most subplots
            //   usually just the bottom x and left y axes.
            plotinfo.xlines = ensureSingle(plotgroup, 'path', 'xlines-above');
            plotinfo.ylines = ensureSingle(plotgroup, 'path', 'ylines-above');
            plotinfo.xaxislayer = ensureSingle(plotgroup, 'g', 'xaxislayer-above');
            plotinfo.yaxislayer = ensureSingle(plotgroup, 'g', 'yaxislayer-above');
        } else {
            if(!hasZ) {
                var backLayer = ensureSingle(plotgroup, 'g', 'layer-subplot');
                plotinfo.shapelayer = ensureSingle(backLayer, 'g', 'shapelayer');
                plotinfo.imagelayer = ensureSingle(backLayer, 'g', 'imagelayer');

                if(mainplotinfo && hasMultipleZ) {
                    plotinfo.minorGridlayer = mainplotinfo.minorGridlayer;
                    plotinfo.gridlayer = mainplotinfo.gridlayer;
                    plotinfo.zerolinelayer = mainplotinfo.zerolinelayer;
                } else {
                    plotinfo.minorGridlayer = ensureSingle(plotgroup, 'g', 'minor-gridlayer');
                    plotinfo.gridlayer = ensureSingle(plotgroup, 'g', 'gridlayer');
                    plotinfo.zerolinelayer = ensureSingle(plotgroup, 'g', 'zerolinelayer');
                }

                var betweenLayer = ensureSingle(plotgroup, 'g', 'layer-between');
                plotinfo.shapelayerBetween = ensureSingle(betweenLayer, 'g', 'shapelayer');
                plotinfo.imagelayerBetween = ensureSingle(betweenLayer, 'g', 'imagelayer');

                ensureSingle(plotgroup, 'path', 'xlines-below');
                ensureSingle(plotgroup, 'path', 'ylines-below');
                plotinfo.overlinesBelow = ensureSingle(plotgroup, 'g', 'overlines-below');

                ensureSingle(plotgroup, 'g', 'xaxislayer-below');
                ensureSingle(plotgroup, 'g', 'yaxislayer-below');
                plotinfo.overaxesBelow = ensureSingle(plotgroup, 'g', 'overaxes-below');
            }

            plotinfo.overplot = ensureSingle(plotgroup, 'g', 'overplot');
            plotinfo.plot = ensureSingle(plotinfo.overplot, 'g', id);

            if(mainplotinfo && hasMultipleZ) {
                plotinfo.zerolinelayerAbove = mainplotinfo.zerolinelayerAbove;
            } else {
                plotinfo.zerolinelayerAbove = ensureSingle(plotgroup, 'g', 'zerolinelayer-above');
            }

            if(!hasZ) {
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
    } else {
        var mainplotgroup = mainplotinfo.plotgroup;
        var xId = id + '-x';
        var yId = id + '-y';

        // now make the components of overlaid subplots
        // overlays don't have backgrounds, and append all
        // their other components to the corresponding
        // extra groups of their main plots.

        plotinfo.minorGridlayer = mainplotinfo.minorGridlayer;
        plotinfo.gridlayer = mainplotinfo.gridlayer;
        plotinfo.zerolinelayer = mainplotinfo.zerolinelayer;
        plotinfo.zerolinelayerAbove = mainplotinfo.zerolinelayerAbove;

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

    if(!hasZ) {
        // common attributes for all subplots, overlays or not

        if(!hasOnlyLargeSploms) {
            ensureSingleAndAddDatum(plotinfo.minorGridlayer, 'g', plotinfo.xaxis._id);
            ensureSingleAndAddDatum(plotinfo.minorGridlayer, 'g', plotinfo.yaxis._id);
            plotinfo.minorGridlayer.selectAll('g')
                .map(function(d) { return d[0]; })
                .sort(axisIds.idSort);

            ensureSingleAndAddDatum(plotinfo.gridlayer, 'g', plotinfo.xaxis._id);
            ensureSingleAndAddDatum(plotinfo.gridlayer, 'g', plotinfo.yaxis._id);
            plotinfo.gridlayer.selectAll('g')
                .map(function(d) { return d[0]; })
                .sort(axisIds.idSort);
        }

        plotinfo.xlines
            .style('fill', 'none')
            .classed('crisp', true);

        plotinfo.ylines
            .style('fill', 'none')
            .classed('crisp', true);
    }
}

function purgeSubplotLayers(layers, fullLayout) {
    if(!layers) return;

    var overlayIdsToRemove = {};

    layers.each(function(d) {
        var id = d[0];
        var plotgroup = d3.select(this);

        plotgroup.remove();
        removeSubplotExtras(id, fullLayout);
        overlayIdsToRemove[id] = true;

        // do not remove individual axis <clipPath>s here
        // as other subplots may need them
    });

    // must remove overlaid subplot trace layers 'manually'

    for(var k in fullLayout._plots) {
        var subplotInfo = fullLayout._plots[k];
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
            width: canvas.style.width,
            height: canvas.style.height
        });
    }

    canvases.each(canvasToImage);
};

exports.updateFx = require('./graph_interact').updateFx;
