/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var createScatter = require('regl-scatter2d');
var createLine = require('regl-line2d');
var createError = require('regl-error2d');
var cluster = require('point-cluster');
var arrayRange = require('array-range');
var Text = require('@etpinard/gl-text');

var Registry = require('../../registry');
var Lib = require('../../lib');
var prepareRegl = require('../../lib/prepare_regl');
var AxisIDs = require('../../plots/cartesian/axis_ids');
var Color = require('../../components/color');

var subTypes = require('../scatter/subtypes');
var calcMarkerSize = require('../scatter/calc').calcMarkerSize;
var calcAxisExpansion = require('../scatter/calc').calcAxisExpansion;
var calcColorscales = require('../scatter/colorscale_calc');
var linkTraces = require('../scatter/link_traces');
var getTraceColor = require('../scatter/get_trace_color');
var fillHoverText = require('../scatter/fill_hover_text');
var convert = require('./convert');

var BADNUM = require('../../constants/numerical').BADNUM;
var TOO_MANY_POINTS = require('./constants').TOO_MANY_POINTS;
var DESELECTDIM = require('../../constants/interactions').DESELECTDIM;

function calc(gd, trace) {
    var fullLayout = gd._fullLayout;
    var xa = AxisIDs.getFromId(gd, trace.xaxis);
    var ya = AxisIDs.getFromId(gd, trace.yaxis);
    var subplot = fullLayout._plots[trace.xaxis + trace.yaxis];
    var count = trace._length;
    var count2 = count * 2;
    var stash = {};
    var i, xx, yy;

    var x = xa.makeCalcdata(trace, 'x');
    var y = ya.makeCalcdata(trace, 'y');

    // we need hi-precision for scatter2d,
    // regl-scatter2d uses NaNs for bad/missing values
    var positions = new Array(count2);
    for(i = 0; i < count; i++) {
        xx = x[i];
        yy = y[i];
        positions[i * 2] = xx === BADNUM ? NaN : xx;
        positions[i * 2 + 1] = yy === BADNUM ? NaN : yy;
    }

    if(xa.type === 'log') {
        for(i = 0; i < count2; i += 2) {
            positions[i] = xa.c2l(positions[i]);
        }
    }
    if(ya.type === 'log') {
        for(i = 1; i < count2; i += 2) {
            positions[i] = ya.c2l(positions[i]);
        }
    }

    // we don't build a tree for log axes since it takes long to convert log2px
    // and it is also
    if(xa.type !== 'log' && ya.type !== 'log') {
        // FIXME: delegate this to webworker
        stash.tree = cluster(positions);
    } else {
        var ids = stash.ids = new Array(count);
        for(i = 0; i < count; i++) {
            ids[i] = i;
        }
    }

    // create scene options and scene
    calcColorscales(trace);
    var opts = sceneOptions(gd, subplot, trace, positions, x, y);
    var scene = sceneUpdate(gd, subplot);

    // Re-use SVG scatter axis expansion routine except
    // for graph with very large number of points where it
    // performs poorly.
    // In big data case, fake Axes.expand outputs with data bounds,
    // and an average size for array marker.size inputs.
    var ppad;
    if(count < TOO_MANY_POINTS) {
        ppad = calcMarkerSize(trace, count);
    } else if(opts.marker) {
        ppad = 2 * (opts.marker.sizeAvg || Math.max(opts.marker.size, 3));
    }
    calcAxisExpansion(gd, trace, xa, ya, x, y, ppad);

    // set flags to create scene renderers
    if(opts.fill && !scene.fill2d) scene.fill2d = true;
    if(opts.marker && !scene.scatter2d) scene.scatter2d = true;
    if(opts.line && !scene.line2d) scene.line2d = true;
    if((opts.errorX || opts.errorY) && !scene.error2d) scene.error2d = true;
    if(opts.text && !scene.glText) scene.glText = true;

    // FIXME: organize it in a more appropriate manner, probably in sceneOptions
    // put point-cluster instance for optimized regl calc
    if(opts.marker && count >= TOO_MANY_POINTS) {
        opts.marker.cluster = stash.tree;
    }

    // save scene opts batch
    scene.lineOptions.push(opts.line);
    scene.errorXOptions.push(opts.errorX);
    scene.errorYOptions.push(opts.errorY);
    scene.fillOptions.push(opts.fill);
    scene.markerOptions.push(opts.marker);
    scene.markerSelectedOptions.push(opts.markerSel);
    scene.markerUnselectedOptions.push(opts.markerUnsel);
    scene.textOptions.push(opts.text);
    scene.textSelectedOptions.push(opts.textSel);
    scene.textUnselectedOptions.push(opts.textUnsel);

    // stash scene ref
    stash._scene = scene;
    stash.index = scene.count;
    stash.x = x;
    stash.y = y;
    stash.positions = positions;
    stash.count = count;

    scene.uid2batchIndex[trace.uid] = stash.index;
    scene.count++;

    gd.firstscatter = false;
    return [{x: false, y: false, t: stash, trace: trace}];
}


// create scene options
function sceneOptions(gd, subplot, trace, positions, x, y) {
    var opts = convert.style(gd, trace);

    if(opts.marker) {
        opts.marker.positions = positions;
    }

    if(opts.line && positions.length > 1) {
        Lib.extendFlat(
            opts.line,
            convert.linePositions(gd, trace, positions)
        );
    }

    if(opts.errorX || opts.errorY) {
        var errors = convert.errorBarPositions(gd, trace, positions, x, y);

        if(opts.errorX) {
            Lib.extendFlat(opts.errorX, errors.x);
        }
        if(opts.errorY) {
            Lib.extendFlat(opts.errorY, errors.y);
        }
    }

    if(opts.text) {
        Lib.extendFlat(
            opts.text,
            {positions: positions},
            convert.textPosition(gd, trace, opts.text, opts.marker)
        );
        Lib.extendFlat(
            opts.textSel,
            {positions: positions},
            convert.textPosition(gd, trace, opts.text, opts.markerSel)
        );
        Lib.extendFlat(
            opts.textUnsel,
            {positions: positions},
            convert.textPosition(gd, trace, opts.text, opts.markerUnsel)
        );
    }

    return opts;
}


// make sure scene exists on subplot, return it
function sceneUpdate(gd, subplot) {
    var scene = subplot._scene;

    var resetOpts = {
        // number of traces in subplot, since scene:subplot → 1:1
        count: 0,
        // whether scene requires init hook in plot call (dirty plot call)
        dirty: true,
        // trace uid to batch index
        uid2batchIndex: {},
        // last used options
        lineOptions: [],
        fillOptions: [],
        markerOptions: [],
        markerSelectedOptions: [],
        markerUnselectedOptions: [],
        errorXOptions: [],
        errorYOptions: [],
        textOptions: [],
        textSelectedOptions: [],
        textUnselectedOptions: []
    };

    var initOpts = {
        visibleBatch: null,
        selectBatch: null,
        unselectBatch: null,
        // regl- component stubs, initialized in dirty plot call
        fill2d: false,
        scatter2d: false,
        error2d: false,
        line2d: false,
        glText: false,
        select2d: null
    };

    if(!subplot._scene) {
        scene = subplot._scene = {};

        scene.init = function init() {
            Lib.extendFlat(scene, initOpts, resetOpts);
        };

        scene.init();

        // apply new option to all regl components (used on drag)
        scene.update = function update(opt) {
            var opts = repeat(opt, scene.count);

            if(scene.fill2d) scene.fill2d.update(opts);
            if(scene.scatter2d) scene.scatter2d.update(opts);
            if(scene.line2d) scene.line2d.update(opts);
            if(scene.error2d) scene.error2d.update(opts.concat(opts));
            if(scene.select2d) scene.select2d.update(opts);
            if(scene.glText) {
                for(var i = 0; i < scene.count; i++) {
                    scene.glText[i].update(opt);
                }
            }

            scene.draw();
        };

        // draw traces in proper order
        scene.draw = function draw() {
            var visibleBatch = scene.visibleBatch;
            var selectBatch = scene.selectBatch;
            var unselectBatch = scene.unselectBatch;
            var i, b;

            // must do all fills first
            for(i = 0; i < visibleBatch.length; i++) {
                b = visibleBatch[i];
                if(scene.fill2d && scene.fillOptions[b]) {
                    scene.fill2d.draw(b);
                }
            }

            // traces in no-selection mode
            for(i = 0; i < visibleBatch.length; i++) {
                b = visibleBatch[i];
                if(scene.line2d && scene.lineOptions[b]) {
                    scene.line2d.draw(b);
                }
                if(scene.error2d && scene.errorXOptions[b]) {
                    scene.error2d.draw(b);
                }
                if(scene.error2d && scene.errorYOptions[b]) {
                    scene.error2d.draw(b + scene.count);
                }
                if(scene.scatter2d && scene.markerOptions[b] && (!selectBatch || !selectBatch[b])) {
                    scene.scatter2d.draw(b);
                }
            }

            // draw traces in selection mode
            if(scene.scatter2d && scene.select2d && selectBatch) {
                scene.select2d.draw(selectBatch);
                scene.scatter2d.draw(unselectBatch);
            }

            // draw text, including selected/unselected items
            for(i = 0; i < visibleBatch.length; i++) {
                b = visibleBatch[i];
                if(scene.glText[b] && scene.textOptions[b]) {
                    scene.glText[b].render();
                }
            }

            scene.dirty = false;
        };

        scene.clear = function clear() {
            var vp = getViewport(gd._fullLayout, subplot.xaxis, subplot.yaxis);

            if(scene.select2d) {
                clearViewport(scene.select2d, vp);
            }
            if(scene.scatter2d) {
                clearViewport(scene.scatter2d, vp);
            } else if(scene.glText) {
                clearViewport(scene.glText[0], vp);
            }
        };

        // remove scene resources
        scene.destroy = function destroy() {
            if(scene.fill2d) scene.fill2d.destroy();
            if(scene.scatter2d) scene.scatter2d.destroy();
            if(scene.error2d) scene.error2d.destroy();
            if(scene.line2d) scene.line2d.destroy();
            if(scene.select2d) scene.select2d.destroy();
            if(scene.glText) {
                scene.glText.forEach(function(text) { text.destroy(); });
            }

            scene.lineOptions = null;
            scene.fillOptions = null;
            scene.markerOptions = null;
            scene.markerSelectedOptions = null;
            scene.markerUnselectedOptions = null;
            scene.errorXOptions = null;
            scene.errorYOptions = null;
            scene.textOptions = null;
            scene.textSelectedOptions = null;
            scene.textUnselectedOptions = null;

            scene.selectBatch = null;
            scene.unselectBatch = null;

            // we can't just delete _scene, because `destroy` is called in the
            // middle of supplyDefaults, before relinkPrivateKeys which will put it back.
            subplot._scene = null;
        };
    }

    // In case if we have scene from the last calc - reset data
    if(!scene.dirty) {
        Lib.extendFlat(scene, resetOpts);
    }

    return scene;
}

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

function clearViewport(comp, vp) {
    var gl = comp.regl._gl;
    gl.enable(gl.SCISSOR_TEST);
    gl.scissor(vp[0], vp[1], vp[2] - vp[0], vp[3] - vp[1]);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
}

function repeat(opt, cnt) {
    var opts = new Array(cnt);
    for(var i = 0; i < cnt; i++) {
        opts[i] = opt;
    }
    return opts;
}

function plot(gd, subplot, cdata) {
    var i, j;

    var fullLayout = gd._fullLayout;
    var scene = subplot._scene;
    var xaxis = subplot.xaxis;
    var yaxis = subplot.yaxis;

    // we may have more subplots than initialized data due to Axes.getSubplots method
    if(!scene) return;

    var success = prepareRegl(gd, ['ANGLE_instanced_arrays', 'OES_element_index_uint']);
    if(!success) {
        scene.init();
        return;
    }

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
            scene.glText = new Array(scene.count);
            for(i = 0; i < scene.count; i++) {
                scene.glText[i] = new Text(regl);
            }
        }

        // update main marker options
        if(scene.glText) {
            for(i = 0; i < scene.count; i++) {
                scene.glText[i].update(scene.textOptions[i]);
            }
        }
        if(scene.line2d) {
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
        if(scene.fill2d) {
            scene.fillOptions = scene.fillOptions.map(function(fillOptions, i) {
                var cdscatter = cdata[i];
                if(!fillOptions || !cdscatter || !cdscatter[0] || !cdscatter[0].trace) return null;
                var cd = cdscatter[0];
                var trace = cd.trace;
                var stash = cd.t;
                var lineOptions = scene.lineOptions[i];
                var last, j;

                var pos = [], srcPos = (lineOptions && lineOptions.positions) || stash.positions;

                if(trace.fill === 'tozeroy') {
                    pos = [srcPos[0], 0];
                    pos = pos.concat(srcPos);
                    pos.push(srcPos[srcPos.length - 2]);
                    pos.push(0);
                }
                else if(trace.fill === 'tozerox') {
                    pos = [0, srcPos[1]];
                    pos = pos.concat(srcPos);
                    pos.push(0);
                    pos.push(srcPos[srcPos.length - 1]);
                }
                else if(trace.fill === 'toself' || trace.fill === 'tonext') {
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
                }
                else {
                    var nextTrace = trace._nexttrace;

                    if(nextTrace) {
                        var nextOptions = scene.lineOptions[i + 1];

                        if(nextOptions) {
                            var nextPos = nextOptions.positions;
                            if(trace.fill === 'tonexty') {
                                pos = srcPos.slice();

                                for(i = Math.floor(nextPos.length / 2); i--;) {
                                    var xx = nextPos[i * 2], yy = nextPos[i * 2 + 1];
                                    if(isNaN(xx) || isNaN(yy)) continue;
                                    pos.push(xx);
                                    pos.push(yy);
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

                fillOptions.opacity = trace.opacity;
                fillOptions.positions = pos;

                return fillOptions;
            });

            scene.fill2d.update(scene.fillOptions);
        }
    }

    // form batch arrays, and check for selected points
    scene.visibleBatch = [];
    scene.selectBatch = null;
    scene.unselectBatch = null;
    var dragmode = fullLayout.dragmode;
    var selectMode = dragmode === 'lasso' || dragmode === 'select';

    for(i = 0; i < cdata.length; i++) {
        var cd0 = cdata[i][0];
        var trace = cd0.trace;
        var stash = cd0.t;
        var batchIndex = scene.uid2batchIndex[trace.uid];
        var x = stash.x;
        var y = stash.y;

        scene.visibleBatch.push(batchIndex);

        if(trace.selectedpoints || selectMode) {
            if(!selectMode) selectMode = true;

            if(!scene.selectBatch) {
                scene.selectBatch = [];
                scene.unselectBatch = [];
            }

            // regenerate scene batch, if traces number changed during selection
            if(trace.selectedpoints) {
                var selPts = scene.selectBatch[batchIndex] = Lib.selIndices2selPoints(trace);

                var selDict = {};
                for(j = 0; j < selPts.length; j++) {
                    selDict[selPts[j]] = 1;
                }
                var unselPts = [];
                for(j = 0; j < stash.count; j++) {
                    if(!selDict[j]) unselPts.push(j);
                }
                scene.unselectBatch[batchIndex] = unselPts;
            }

            // precalculate px coords since we are not going to pan during select
            // TODO, could do better here e.g.
            // - spin that in a webworker
            // - compute selection from polygons in data coordinates
            //   (maybe just for linear axes)
            var xpx = stash.xpx = new Array(stash.count);
            var ypx = stash.ypx = new Array(stash.count);
            for(j = 0; j < stash.count; j++) {
                xpx[j] = xaxis.c2p(x[j]);
                ypx[j] = yaxis.c2p(y[j]);
            }
        } else {
            stash.xpx = stash.ypx = null;
        }
    }

    if(selectMode) {
        // create select2d
        if(!scene.select2d) {
            // create scatter instance by cloning scatter2d
            scene.select2d = createScatter(fullLayout._glcanvas.data()[1].regl);
        }

        if(scene.scatter2d && scene.selectBatch && scene.selectBatch.length) {
            // update only traces with selection
            scene.scatter2d.update(scene.markerUnselectedOptions.map(function(opts, i) {
                return scene.selectBatch[i] ? opts : null;
            }));
        }

        if(scene.select2d) {
            scene.select2d.update(scene.markerOptions);
            scene.select2d.update(scene.markerSelectedOptions);
        }

        if(scene.glText) {
            cdata.forEach(function(cdscatter) {
                if(cdscatter && cdscatter[0] && cdscatter[0].trace) {
                    styleTextSelection(cdscatter);
                }
            });
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
    var vpRange = repeat(vpRange0, scene.count);

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

    scene.draw();
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
        }
        else {
            ids = stash.tree.range(
                Math.min(xl, xr), Math.min(yl, yr),
                Math.max(xl, xr), Math.max(yl, yr)
            );
        }
    }
    else if(stash.ids) {
        ids = stash.ids;
    }
    else return [pointData];

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
    }
    else {
        for(i = 0; i < ids.length; i++) {
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
        spikeDistance: dxy
    });

    if(di.htx) pointData.text = di.htx;
    else if(di.tx) pointData.text = di.tx;
    else if(trace.text) pointData.text = trace.text;

    fillHoverText(di, trace, pointData);
    Registry.getComponentMethod('errorbars', 'hoverInfo')(di, trace, pointData);

    return pointData;
}


function selectPoints(searchInfo, polygon) {
    var cd = searchInfo.cd;
    var selection = [];
    var trace = cd[0].trace;
    var stash = cd[0].t;
    var x = stash.x;
    var y = stash.y;
    var scene = stash._scene;

    if(!scene) return selection;

    var hasText = subTypes.hasText(trace);
    var hasMarkers = subTypes.hasMarkers(trace);
    var hasOnlyLines = !hasMarkers && !hasText;
    if(trace.visible !== true || hasOnlyLines) return selection;

    // degenerate polygon does not enable selection
    // filter out points by visible scatter ones
    var els = null;
    var unels = null;
    // FIXME: clearing selection does not work here
    var i;
    if(polygon !== false && !polygon.degenerate) {
        els = [], unels = [];
        for(i = 0; i < stash.count; i++) {
            if(polygon.contains([stash.xpx[i], stash.ypx[i]])) {
                els.push(i);
                selection.push({
                    pointNumber: i,
                    x: x[i],
                    y: y[i]
                });
            }
            else {
                unels.push(i);
            }
        }
    } else {
        unels = arrayRange(stash.count);
    }

    // make sure selectBatch is created
    if(!scene.selectBatch) {
        scene.selectBatch = [];
        scene.unselectBatch = [];
    }

    if(!scene.selectBatch[stash.index]) {
        // enter every trace select mode
        for(i = 0; i < scene.count; i++) {
            scene.selectBatch[i] = [];
            scene.unselectBatch[i] = [];
        }
        // we should turn scatter2d into unselected once we have any points selected
        if(hasMarkers) {
            scene.scatter2d.update(scene.markerUnselectedOptions);
        }
    }

    scene.selectBatch[stash.index] = els;
    scene.unselectBatch[stash.index] = unels;

    // update text options
    if(hasText) {
        styleTextSelection(cd);
    }

    return selection;
}

function style(gd, cds) {
    if(!cds) return;

    var stash = cds[0][0].t;
    var scene = stash._scene;

    // don't clear the subplot if there are splom traces
    // on the graph
    if(!gd._fullLayout._has('splom')) {
        scene.clear();
    }

    scene.draw();
}

function styleTextSelection(cd) {
    var cd0 = cd[0];
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

    if(els && unels) {
        var stc = selOpts.color;
        var utc = unselOpts.color;
        var base = baseOpts.color;
        var hasArrayBase = Array.isArray(base);
        opts.color = new Array(stash.count);


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
    cleanData: require('../scatter/clean_data'),
    colorbar: require('../scatter/marker_colorbar'),
    calc: calc,
    plot: plot,
    hoverPoints: hoverPoints,
    style: style,
    selectPoints: selectPoints,

    sceneOptions: sceneOptions,
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
