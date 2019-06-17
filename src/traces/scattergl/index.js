/**
* Copyright 2012-2019, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var createScatter = require('regl-scatter2d');
var createLine = require('regl-line2d');
var createError = require('regl-error2d');
var Text = require('gl-text');

var Registry = require('../../registry');
var Lib = require('../../lib');
var prepareRegl = require('../../lib/prepare_regl');
var Color = require('../../components/color');

var subTypes = require('../scatter/subtypes');
var linkTraces = require('../scatter/link_traces');
var getTraceColor = require('../scatter/get_trace_color');
var fillText = Lib.fillText;
var calc = require('./calc');
var sceneUpdate = require('./scene_update');

var DESELECTDIM = require('../../constants/interactions').DESELECTDIM;

function getViewport(fullLayout, xaxis, yaxis) {
    var gs = fullLayout._size;
    var width = fullLayout.width;
    var height = fullLayout.height;
    return [
        gs.l + xaxis.domain[0] * gs.w,
        gs.b + yaxis.domain[0] * gs.h,
        (width - gs.r) - (1 - xaxis.domain[1]) * gs.w,
        (height - gs.t) - (1 - yaxis.domain[1]) * gs.h
    ];
}

function plot(gd, subplot, cdata) {
    if(!cdata.length) return;

    var fullLayout = gd._fullLayout;
    var scene = subplot._scene;
    var xaxis = subplot.xaxis;
    var yaxis = subplot.yaxis;
    var i, j;

    // we may have more subplots than initialized data due to Axes.getSubplots method
    if(!scene) return;

    var success = prepareRegl(gd, ['ANGLE_instanced_arrays', 'OES_element_index_uint']);
    if(!success) {
        scene.init();
        return;
    }

    var count = scene.count;
    var regl = fullLayout._glcanvas.data()[0].regl;

    // that is needed for fills
    linkTraces(gd, subplot, cdata);

    if(scene.dirty) {
        // make sure scenes are created
        if(scene.error2d === true) {
            scene.error2d = createError(regl);
        }
        if(scene.line2d === true) {
            scene.line2d = createLine(regl);
        }
        if(scene.scatter2d === true) {
            scene.scatter2d = createScatter(regl);
        }
        if(scene.fill2d === true) {
            scene.fill2d = createLine(regl);
        }
        if(scene.glText === true) {
            scene.glText = new Array(count);
            for(i = 0; i < count; i++) {
                scene.glText[i] = new Text(regl);
            }
        }

        // update main marker options
        if(scene.glText) {
            if(count > scene.glText.length) {
                // add gl text marker
                var textsToAdd = count - scene.glText.length;
                for(i = 0; i < textsToAdd; i++) {
                    scene.glText.push(new Text(regl));
                }
            } else if(count < scene.glText.length) {
                // remove gl text marker
                var textsToRemove = scene.glText.length - count;
                var removedTexts = scene.glText.splice(count, textsToRemove);
                removedTexts.forEach(function(text) { text.destroy(); });
            }

            for(i = 0; i < count; i++) {
                scene.glText[i].update(scene.textOptions[i]);
            }
        }
        if(scene.line2d) {
            scene.line2d.update(scene.lineOptions);
            scene.lineOptions = scene.lineOptions.map(function(lineOptions) {
                if(lineOptions && lineOptions.positions) {
                    var srcPos = lineOptions.positions;

                    var firstptdef = 0;
                    while(firstptdef < srcPos.length && (isNaN(srcPos[firstptdef]) || isNaN(srcPos[firstptdef + 1]))) {
                        firstptdef += 2;
                    }
                    var lastptdef = srcPos.length - 2;
                    while(lastptdef > firstptdef && (isNaN(srcPos[lastptdef]) || isNaN(srcPos[lastptdef + 1]))) {
                        lastptdef -= 2;
                    }
                    lineOptions.positions = srcPos.slice(firstptdef, lastptdef + 2);
                }
                return lineOptions;
            });
            scene.line2d.update(scene.lineOptions);
        }
        if(scene.error2d) {
            var errorBatch = (scene.errorXOptions || []).concat(scene.errorYOptions || []);
            scene.error2d.update(errorBatch);
        }
        if(scene.scatter2d) {
            scene.scatter2d.update(scene.markerOptions);
        }

        // fill requires linked traces, so we generate it's positions here
        scene.fillOrder = Lib.repeat(null, count);
        if(scene.fill2d) {
            scene.fillOptions = scene.fillOptions.map(function(fillOptions, i) {
                var cdscatter = cdata[i];
                if(!fillOptions || !cdscatter || !cdscatter[0] || !cdscatter[0].trace) return;
                var cd = cdscatter[0];
                var trace = cd.trace;
                var stash = cd.t;
                var lineOptions = scene.lineOptions[i];
                var last, j;

                var fillData = [];
                if(trace._ownfill) fillData.push(i);
                if(trace._nexttrace) fillData.push(i + 1);
                if(fillData.length) scene.fillOrder[i] = fillData;

                var pos = [];
                var srcPos = (lineOptions && lineOptions.positions) || stash.positions;
                var firstptdef, lastptdef;

                if(trace.fill === 'tozeroy') {
                    firstptdef = 0;
                    while(firstptdef < srcPos.length && isNaN(srcPos[firstptdef + 1])) {
                        firstptdef += 2;
                    }
                    lastptdef = srcPos.length - 2;
                    while(lastptdef > firstptdef && isNaN(srcPos[lastptdef + 1])) {
                        lastptdef -= 2;
                    }
                    if(srcPos[firstptdef + 1] !== 0) {
                        pos = [srcPos[firstptdef], 0];
                    }
                    pos = pos.concat(srcPos.slice(firstptdef, lastptdef + 2));
                    if(srcPos[lastptdef + 1] !== 0) {
                        pos = pos.concat([srcPos[lastptdef], 0]);
                    }
                } else if(trace.fill === 'tozerox') {
                    firstptdef = 0;
                    while(firstptdef < srcPos.length && isNaN(srcPos[firstptdef])) {
                        firstptdef += 2;
                    }
                    lastptdef = srcPos.length - 2;
                    while(lastptdef > firstptdef && isNaN(srcPos[lastptdef])) {
                        lastptdef -= 2;
                    }
                    if(srcPos[firstptdef] !== 0) {
                        pos = [0, srcPos[firstptdef + 1]];
                    }
                    pos = pos.concat(srcPos.slice(firstptdef, lastptdef + 2));
                    if(srcPos[lastptdef] !== 0) {
                        pos = pos.concat([ 0, srcPos[lastptdef + 1]]);
                    }
                } else if(trace.fill === 'toself' || trace.fill === 'tonext') {
                    pos = [];
                    last = 0;
                    for(j = 0; j < srcPos.length; j += 2) {
                        if(isNaN(srcPos[j]) || isNaN(srcPos[j + 1])) {
                            pos = pos.concat(srcPos.slice(last, j));
                            pos.push(srcPos[last], srcPos[last + 1]);
                            last = j + 2;
                        }
                    }
                    pos = pos.concat(srcPos.slice(last));
                    if(last) {
                        pos.push(srcPos[last], srcPos[last + 1]);
                    }
                } else {
                    var nextTrace = trace._nexttrace;

                    if(nextTrace) {
                        var nextOptions = scene.lineOptions[i + 1];

                        if(nextOptions) {
                            var nextPos = nextOptions.positions;
                            if(trace.fill === 'tonexty') {
                                pos = srcPos.slice();

                                for(i = Math.floor(nextPos.length / 2); i--;) {
                                    var xx = nextPos[i * 2];
                                    var yy = nextPos[i * 2 + 1];
                                    if(isNaN(xx) || isNaN(yy)) continue;
                                    pos.push(xx, yy);
                                }
                                fillOptions.fill = nextTrace.fillcolor;
                            }
                        }
                    }
                }

                // detect prev trace positions to exclude from current fill
                if(trace._prevtrace && trace._prevtrace.fill === 'tonext') {
                    var prevLinePos = scene.lineOptions[i - 1].positions;

                    // FIXME: likely this logic should be tested better
                    var offset = pos.length / 2;
                    last = offset;
                    var hole = [last];
                    for(j = 0; j < prevLinePos.length; j += 2) {
                        if(isNaN(prevLinePos[j]) || isNaN(prevLinePos[j + 1])) {
                            hole.push(j / 2 + offset + 1);
                            last = j + 2;
                        }
                    }

                    pos = pos.concat(prevLinePos);
                    fillOptions.hole = hole;
                }
                fillOptions.fillmode = trace.fill;
                fillOptions.opacity = trace.opacity;
                fillOptions.positions = pos;

                return fillOptions;
            });

            scene.fill2d.update(scene.fillOptions);
        }
    }

    // form batch arrays, and check for selected points
    var dragmode = fullLayout.dragmode;
    var selectMode = dragmode === 'lasso' || dragmode === 'select';
    var clickSelectEnabled = fullLayout.clickmode.indexOf('select') > -1;

    for(i = 0; i < count; i++) {
        var cd0 = cdata[i][0];
        var trace = cd0.trace;
        var stash = cd0.t;
        var index = stash.index;
        var len = trace._length;
        var x = stash.x;
        var y = stash.y;

        if(trace.selectedpoints || selectMode || clickSelectEnabled) {
            if(!selectMode) selectMode = true;

            // regenerate scene batch, if traces number changed during selection
            if(trace.selectedpoints) {
                var selPts = scene.selectBatch[index] = Lib.selIndices2selPoints(trace);

                var selDict = {};
                for(j = 0; j < selPts.length; j++) {
                    selDict[selPts[j]] = 1;
                }
                var unselPts = [];
                for(j = 0; j < len; j++) {
                    if(!selDict[j]) unselPts.push(j);
                }
                scene.unselectBatch[index] = unselPts;
            }

            // precalculate px coords since we are not going to pan during select
            // TODO, could do better here e.g.
            // - spin that in a webworker
            // - compute selection from polygons in data coordinates
            //   (maybe just for linear axes)
            var xpx = stash.xpx = new Array(len);
            var ypx = stash.ypx = new Array(len);
            for(j = 0; j < len; j++) {
                xpx[j] = xaxis.c2p(x[j]);
                ypx[j] = yaxis.c2p(y[j]);
            }
        } else {
            stash.xpx = stash.ypx = null;
        }
    }

    if(selectMode) {
        // create scatter instance by cloning scatter2d
        if(!scene.select2d) {
            scene.select2d = createScatter(fullLayout._glcanvas.data()[1].regl);
        }

        // use unselected styles on 'context' canvas
        if(scene.scatter2d) {
            var unselOpts = new Array(count);
            for(i = 0; i < count; i++) {
                unselOpts[i] = scene.selectBatch[i].length || scene.unselectBatch[i].length ?
                    scene.markerUnselectedOptions[i] :
                    {};
            }
            scene.scatter2d.update(unselOpts);
        }

        // use selected style on 'focus' canvas
        if(scene.select2d) {
            scene.select2d.update(scene.markerOptions);
            scene.select2d.update(scene.markerSelectedOptions);
        }

        if(scene.glText) {
            cdata.forEach(function(cdscatter) {
                var trace = ((cdscatter || [])[0] || {}).trace || {};
                if(subTypes.hasText(trace)) {
                    styleTextSelection(cdscatter);
                }
            });
        }
    } else {
        // reset 'context' scatter2d opts to base opts,
        // thus unsetting markerUnselectedOptions from selection
        if(scene.scatter2d) {
            scene.scatter2d.update(scene.markerOptions);
        }
    }

    // provide viewport and range
    var vpRange0 = {
        viewport: getViewport(fullLayout, xaxis, yaxis),
        // TODO do we need those fallbacks?
        range: [
            (xaxis._rl || xaxis.range)[0],
            (yaxis._rl || yaxis.range)[0],
            (xaxis._rl || xaxis.range)[1],
            (yaxis._rl || yaxis.range)[1]
        ]
    };
    var vpRange = Lib.repeat(vpRange0, scene.count);

    // upload viewport/range data to GPU
    if(scene.fill2d) {
        scene.fill2d.update(vpRange);
    }
    if(scene.line2d) {
        scene.line2d.update(vpRange);
    }
    if(scene.error2d) {
        scene.error2d.update(vpRange.concat(vpRange));
    }
    if(scene.scatter2d) {
        scene.scatter2d.update(vpRange);
    }
    if(scene.select2d) {
        scene.select2d.update(vpRange);
    }
    if(scene.glText) {
        scene.glText.forEach(function(text) { text.update(vpRange0); });
    }
}

function hoverPoints(pointData, xval, yval, hovermode) {
    var cd = pointData.cd;
    var stash = cd[0].t;
    var trace = cd[0].trace;
    var xa = pointData.xa;
    var ya = pointData.ya;
    var x = stash.x;
    var y = stash.y;
    var xpx = xa.c2p(xval);
    var ypx = ya.c2p(yval);
    var maxDistance = pointData.distance;
    var ids;

    // FIXME: make sure this is a proper way to calc search radius
    if(stash.tree) {
        var xl = xa.p2c(xpx - maxDistance);
        var xr = xa.p2c(xpx + maxDistance);
        var yl = ya.p2c(ypx - maxDistance);
        var yr = ya.p2c(ypx + maxDistance);

        if(hovermode === 'x') {
            ids = stash.tree.range(
                Math.min(xl, xr), Math.min(ya._rl[0], ya._rl[1]),
                Math.max(xl, xr), Math.max(ya._rl[0], ya._rl[1])
            );
        } else {
            ids = stash.tree.range(
                Math.min(xl, xr), Math.min(yl, yr),
                Math.max(xl, xr), Math.max(yl, yr)
            );
        }
    } else if(stash.ids) {
        ids = stash.ids;
    } else return [pointData];

    // pick the id closest to the point
    // note that point possibly may not be found
    var id, ptx, pty, i, dx, dy, dist, dxy;

    var minDist = maxDistance;
    if(hovermode === 'x') {
        for(i = 0; i < ids.length; i++) {
            ptx = x[ids[i]];
            dx = Math.abs(xa.c2p(ptx) - xpx);
            if(dx < minDist) {
                minDist = dx;
                dy = ya.c2p(y[ids[i]]) - ypx;
                dxy = Math.sqrt(dx * dx + dy * dy);
                id = ids[i];
            }
        }
    } else {
        for(i = ids.length - 1; i > -1; i--) {
            ptx = x[ids[i]];
            pty = y[ids[i]];
            dx = xa.c2p(ptx) - xpx;
            dy = ya.c2p(pty) - ypx;

            dist = Math.sqrt(dx * dx + dy * dy);
            if(dist < minDist) {
                minDist = dxy = dist;
                id = ids[i];
            }
        }
    }

    pointData.index = id;
    pointData.distance = minDist;
    pointData.dxy = dxy;

    if(id === undefined) return [pointData];

    calcHover(pointData, x, y, trace);

    return [pointData];
}

function calcHover(pointData, x, y, trace) {
    var xa = pointData.xa;
    var ya = pointData.ya;
    var minDist = pointData.distance;
    var dxy = pointData.dxy;
    var id = pointData.index;

    // the closest data point
    var di = {
        pointNumber: id,
        x: x[id],
        y: y[id]
    };

    // that is single-item arrays_to_calcdata excerpt, since we are doing it for a single point and we don't have to do it beforehead for 1e6 points
    di.tx = Array.isArray(trace.text) ? trace.text[id] : trace.text;
    di.htx = Array.isArray(trace.hovertext) ? trace.hovertext[id] : trace.hovertext;
    di.data = Array.isArray(trace.customdata) ? trace.customdata[id] : trace.customdata;
    di.tp = Array.isArray(trace.textposition) ? trace.textposition[id] : trace.textposition;

    var font = trace.textfont;
    if(font) {
        di.ts = Array.isArray(font.size) ? font.size[id] : font.size;
        di.tc = Array.isArray(font.color) ? font.color[id] : font.color;
        di.tf = Array.isArray(font.family) ? font.family[id] : font.family;
    }

    var marker = trace.marker;
    if(marker) {
        di.ms = Lib.isArrayOrTypedArray(marker.size) ? marker.size[id] : marker.size;
        di.mo = Lib.isArrayOrTypedArray(marker.opacity) ? marker.opacity[id] : marker.opacity;
        di.mx = Array.isArray(marker.symbol) ? marker.symbol[id] : marker.symbol;
        di.mc = Lib.isArrayOrTypedArray(marker.color) ? marker.color[id] : marker.color;
    }

    var line = marker && marker.line;
    if(line) {
        di.mlc = Array.isArray(line.color) ? line.color[id] : line.color;
        di.mlw = Lib.isArrayOrTypedArray(line.width) ? line.width[id] : line.width;
    }

    var grad = marker && marker.gradient;
    if(grad && grad.type !== 'none') {
        di.mgt = Array.isArray(grad.type) ? grad.type[id] : grad.type;
        di.mgc = Array.isArray(grad.color) ? grad.color[id] : grad.color;
    }

    var xp = xa.c2p(di.x, true);
    var yp = ya.c2p(di.y, true);
    var rad = di.mrc || 1;

    var hoverlabel = trace.hoverlabel;

    if(hoverlabel) {
        di.hbg = Array.isArray(hoverlabel.bgcolor) ? hoverlabel.bgcolor[id] : hoverlabel.bgcolor;
        di.hbc = Array.isArray(hoverlabel.bordercolor) ? hoverlabel.bordercolor[id] : hoverlabel.bordercolor;
        di.hts = Array.isArray(hoverlabel.font.size) ? hoverlabel.font.size[id] : hoverlabel.font.size;
        di.htc = Array.isArray(hoverlabel.font.color) ? hoverlabel.font.color[id] : hoverlabel.font.color;
        di.htf = Array.isArray(hoverlabel.font.family) ? hoverlabel.font.family[id] : hoverlabel.font.family;
        di.hnl = Array.isArray(hoverlabel.namelength) ? hoverlabel.namelength[id] : hoverlabel.namelength;
    }
    var hoverinfo = trace.hoverinfo;
    if(hoverinfo) {
        di.hi = Array.isArray(hoverinfo) ? hoverinfo[id] : hoverinfo;
    }

    var hovertemplate = trace.hovertemplate;
    if(hovertemplate) {
        di.ht = Array.isArray(hovertemplate) ? hovertemplate[id] : hovertemplate;
    }

    var fakeCd = {};
    fakeCd[pointData.index] = di;

    Lib.extendFlat(pointData, {
        color: getTraceColor(trace, di),

        x0: xp - rad,
        x1: xp + rad,
        xLabelVal: di.x,

        y0: yp - rad,
        y1: yp + rad,
        yLabelVal: di.y,

        cd: fakeCd,
        distance: minDist,
        spikeDistance: dxy,

        hovertemplate: di.ht
    });

    if(di.htx) pointData.text = di.htx;
    else if(di.tx) pointData.text = di.tx;
    else if(trace.text) pointData.text = trace.text;

    fillText(di, trace, pointData);
    Registry.getComponentMethod('errorbars', 'hoverInfo')(di, trace, pointData);

    return pointData;
}

function selectPoints(searchInfo, selectionTester) {
    var cd = searchInfo.cd;
    var selection = [];
    var trace = cd[0].trace;
    var stash = cd[0].t;
    var len = trace._length;
    var x = stash.x;
    var y = stash.y;
    var scene = stash._scene;
    var index = stash.index;

    if(!scene) return selection;

    var hasText = subTypes.hasText(trace);
    var hasMarkers = subTypes.hasMarkers(trace);
    var hasOnlyLines = !hasMarkers && !hasText;

    if(trace.visible !== true || hasOnlyLines) return selection;

    var els = [];
    var unels = [];

    // degenerate polygon does not enable selection
    // filter out points by visible scatter ones
    if(selectionTester !== false && !selectionTester.degenerate) {
        for(var i = 0; i < len; i++) {
            if(selectionTester.contains([stash.xpx[i], stash.ypx[i]], false, i, searchInfo)) {
                els.push(i);
                selection.push({
                    pointNumber: i,
                    x: x[i],
                    y: y[i]
                });
            } else {
                unels.push(i);
            }
        }
    }

    if(hasMarkers) {
        var scatter2d = scene.scatter2d;

        if(!els.length && !unels.length) {
            // reset to base styles when clearing
            var baseOpts = new Array(scene.count);
            baseOpts[index] = scene.markerOptions[index];
            scatter2d.update.apply(scatter2d, baseOpts);
        } else if(!scene.selectBatch[index].length && !scene.unselectBatch[index].length) {
            // set unselected styles on 'context' canvas (if not done already)
            var unselOpts = new Array(scene.count);
            unselOpts[index] = scene.markerUnselectedOptions[index];
            scatter2d.update.apply(scatter2d, unselOpts);
        }
    }

    scene.selectBatch[index] = els;
    scene.unselectBatch[index] = unels;

    if(hasText) {
        styleTextSelection(cd);
    }

    return selection;
}

function styleTextSelection(cd) {
    var cd0 = cd[0];
    var trace = cd0.trace;
    var stash = cd0.t;
    var scene = stash._scene;
    var index = stash.index;
    var els = scene.selectBatch[index];
    var unels = scene.unselectBatch[index];
    var baseOpts = scene.textOptions[index];
    var selOpts = scene.textSelectedOptions[index] || {};
    var unselOpts = scene.textUnselectedOptions[index] || {};
    var opts = Lib.extendFlat({}, baseOpts);
    var i, j;

    if(els.length || unels.length) {
        var stc = selOpts.color;
        var utc = unselOpts.color;
        var base = baseOpts.color;
        var hasArrayBase = Array.isArray(base);
        opts.color = new Array(trace._length);

        for(i = 0; i < els.length; i++) {
            j = els[i];
            opts.color[j] = stc || (hasArrayBase ? base[j] : base);
        }
        for(i = 0; i < unels.length; i++) {
            j = unels[i];
            var basej = hasArrayBase ? base[j] : base;
            opts.color[j] = utc ? utc :
                stc ? basej : Color.addOpacity(basej, DESELECTDIM);
        }
    }

    scene.glText[index].update(opts);
}

module.exports = {
    moduleType: 'trace',
    name: 'scattergl',
    basePlotModule: require('../../plots/cartesian'),
    categories: ['gl', 'regl', 'cartesian', 'symbols', 'errorBarsOK', 'showLegend', 'scatter-like'],

    attributes: require('./attributes'),
    supplyDefaults: require('./defaults'),
    crossTraceDefaults: require('../scatter/cross_trace_defaults'),
    colorbar: require('../scatter/marker_colorbar'),
    calc: calc,
    plot: plot,
    hoverPoints: hoverPoints,
    selectPoints: selectPoints,

    sceneUpdate: sceneUpdate,
    calcHover: calcHover,

    meta: {
        hrName: 'scatter_gl',
        description: [
            'The data visualized as scatter point or lines is set in `x` and `y`',
            'using the WebGL plotting engine.',
            'Bubble charts are achieved by setting `marker.size` and/or `marker.color`',
            'to a numerical arrays.'
        ].join(' ')
    }
};
