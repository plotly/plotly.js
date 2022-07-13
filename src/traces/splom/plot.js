'use strict';

var createMatrix = require('regl-splom');

var Lib = require('../../lib');
var AxisIDs = require('../../plots/cartesian/axis_ids');
var selectMode = require('../../components/dragelement/helpers').selectMode;

module.exports = function plot(gd, _, splomCalcData) {
    if(!splomCalcData.length) return;

    for(var i = 0; i < splomCalcData.length; i++) {
        plotOne(gd, splomCalcData[i][0]);
    }
};

function plotOne(gd, cd0) {
    var fullLayout = gd._fullLayout;
    var gs = fullLayout._size;
    var trace = cd0.trace;
    var stash = cd0.t;
    var scene = fullLayout._splomScenes[trace.uid];
    var matrixOpts = scene.matrixOptions;
    var cdata = matrixOpts.cdata;
    var regl = fullLayout._glcanvas.data()[0].regl;
    var dragmode = fullLayout.dragmode;
    var xa, ya;
    var i, j, k;

    if(cdata.length === 0) return;

    // augment options with proper upper/lower halves
    // regl-splom's default grid starts from bottom-left
    matrixOpts.lower = trace.showupperhalf;
    matrixOpts.upper = trace.showlowerhalf;
    matrixOpts.diagonal = trace.diagonal.visible;

    var visibleDims = trace._visibleDims;
    var visibleLength = cdata.length;
    var viewOpts = scene.viewOpts = {};
    viewOpts.ranges = new Array(visibleLength);
    viewOpts.domains = new Array(visibleLength);

    for(k = 0; k < visibleDims.length; k++) {
        i = visibleDims[k];

        var rng = viewOpts.ranges[k] = new Array(4);
        var dmn = viewOpts.domains[k] = new Array(4);

        xa = AxisIDs.getFromId(gd, trace._diag[i][0]);
        if(xa) {
            rng[0] = xa._rl[0];
            rng[2] = xa._rl[1];
            dmn[0] = xa.domain[0];
            dmn[2] = xa.domain[1];
        }

        ya = AxisIDs.getFromId(gd, trace._diag[i][1]);
        if(ya) {
            rng[1] = ya._rl[0];
            rng[3] = ya._rl[1];
            dmn[1] = ya.domain[0];
            dmn[3] = ya.domain[1];
        }
    }

    var plotGlPixelRatio = gd._context.plotGlPixelRatio;
    var l = gs.l * plotGlPixelRatio;
    var b = gs.b * plotGlPixelRatio;
    var w = gs.w * plotGlPixelRatio;
    var h = gs.h * plotGlPixelRatio;

    viewOpts.viewport = [l, b, w + l, h + b];

    if(scene.matrix === true) {
        scene.matrix = createMatrix(regl);
    }

    var clickSelectEnabled = fullLayout.clickmode.indexOf('select') > -1;
    var isSelectMode = selectMode(dragmode) ||
      !!trace.selectedpoints || clickSelectEnabled;
    var needsBaseUpdate = true;

    if(isSelectMode) {
        var commonLength = trace._length;

        // regenerate scene batch, if traces number changed during selection
        if(trace.selectedpoints) {
            scene.selectBatch = trace.selectedpoints;

            var selPts = trace.selectedpoints;
            var selDict = {};
            for(i = 0; i < selPts.length; i++) {
                selDict[selPts[i]] = true;
            }
            var unselPts = [];
            for(i = 0; i < commonLength; i++) {
                if(!selDict[i]) unselPts.push(i);
            }
            scene.unselectBatch = unselPts;
        }

        // precalculate px coords since we are not going to pan during select
        var xpx = stash.xpx = new Array(visibleLength);
        var ypx = stash.ypx = new Array(visibleLength);

        for(k = 0; k < visibleDims.length; k++) {
            i = visibleDims[k];

            xa = AxisIDs.getFromId(gd, trace._diag[i][0]);
            if(xa) {
                xpx[k] = new Array(commonLength);
                for(j = 0; j < commonLength; j++) {
                    xpx[k][j] = xa.c2p(cdata[k][j]);
                }
            }

            ya = AxisIDs.getFromId(gd, trace._diag[i][1]);
            if(ya) {
                ypx[k] = new Array(commonLength);
                for(j = 0; j < commonLength; j++) {
                    ypx[k][j] = ya.c2p(cdata[k][j]);
                }
            }
        }

        if(scene.selectBatch.length || scene.unselectBatch.length) {
            var unselOpts = Lib.extendFlat({}, matrixOpts, scene.unselectedOptions, viewOpts);
            var selOpts = Lib.extendFlat({}, matrixOpts, scene.selectedOptions, viewOpts);
            scene.matrix.update(unselOpts, selOpts);
            needsBaseUpdate = false;
        }
    } else {
        stash.xpx = stash.ypx = null;
    }

    if(needsBaseUpdate) {
        var opts = Lib.extendFlat({}, matrixOpts, viewOpts);
        scene.matrix.update(opts, null);
    }
}
