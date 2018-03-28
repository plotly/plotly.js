/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var createLine = require('regl-line2d');

var Registry = require('../../registry');
var Lib = require('../../lib');
var prepareRegl = require('../../lib/prepare_regl');
var getModuleCalcData = require('../../plots/get_data').getModuleCalcData;
var Cartesian = require('../../plots/cartesian');
var AxisIDs = require('../../plots/cartesian/axis_ids');

var SPLOM = 'splom';

function plot(gd) {
    var fullLayout = gd._fullLayout;
    var _module = Registry.getModule(SPLOM);
    var splomCalcData = getModuleCalcData(gd.calcdata, _module);

    prepareRegl(gd, ['ANGLE_instanced_arrays', 'OES_element_index_uint']);

    if(fullLayout._hasOnlyLargeSploms) {
        drawGrid(gd);
    }

    _module.plot(gd, {}, splomCalcData);
}

function drag(gd) {
    var cd = gd.calcdata;
    var fullLayout = gd._fullLayout;

    for(var i = 0; i < cd.length; i++) {
        var cd0 = cd[i][0];
        var trace = cd0.trace;
        var scene = cd0.t._scene;

        if(trace.type === 'splom' && scene && scene.matrix) {
            var dimLength = trace.dimensions.length;
            var ranges = new Array(dimLength);

            for(var j = 0; j < dimLength; j++) {
                var xrng = AxisIDs.getFromId(gd, trace.xaxes[j]).range;
                var yrng = AxisIDs.getFromId(gd, trace.yaxes[j]).range;
                ranges[j] = [xrng[0], yrng[0], xrng[1], yrng[1]];
            }

            scene.matrix.update({ranges: ranges});
            scene.matrix.draw();
        }
    }

    if(fullLayout._hasOnlyLargeSploms) {
        fullLayout._modules[0].basePlotModule.drawGrid(gd);
    }
}

function drawGrid(gd) {
    var fullLayout = gd._fullLayout;
    var regl = fullLayout._glcanvas.data()[0].regl;
    var splomGrid = fullLayout._splomGrid;

    if(!splomGrid) {
        splomGrid = fullLayout._splomGrid = createLine(regl);
    }
    splomGrid.update(makeGridData(gd));
    splomGrid.draw();
}

// this clocks in at ~30ms at 50x50 - we could perf this up!
function makeGridData(gd) {
    var fullLayout = gd._fullLayout;
    var gs = fullLayout._size;
    var fullView = [0, 0, fullLayout.width, fullLayout.height];
    var splomXa = Object.keys(fullLayout._splomAxes.x);
    var splomYa = Object.keys(fullLayout._splomAxes.y);
    var lookup = {};
    var k;

    function push(prefix, ax, x0, x1, y0, y1) {
        var lcolor = ax[prefix + 'color'];
        var lwidth = ax[prefix + 'width'];
        var key = String(lcolor + lwidth);

        if(key in lookup) {
            lookup[key].data.push(NaN, NaN, x0, x1, y0, y1);
        } else {
            lookup[key] = {
                data: [x0, x1, y0, y1],
                join: 'rect',
                thickness: lwidth,
                color: lcolor,
                viewport: fullView,
                range: fullView
            };
        }
    }

    for(var i = 0; i < splomXa.length; i++) {
        var xa = AxisIDs.getFromId(gd, splomXa[i]);
        var xVals = xa._vals;
        var xShowZl = showZeroLine(xa);

        for(var j = 0; j < splomYa.length; j++) {
            var ya = AxisIDs.getFromId(gd, splomYa[j]);
            var yVals = ya._vals;
            var yShowZl = showZeroLine(ya);

            // ya.l2p assumes top-to-bottom coordinate system (a la SVG),
            // we need to compute bottom-to-top offsets and slopes:
            var yOffset = gs.b + ya.domain[0] * gs.h;
            var ym = -ya._m;
            var yb = -ym * ya.r2l(ya.range[0], ya.calendar);

            var x, y;

            if(xa.showgrid) {
                for(k = 0; k < xVals.length; k++) {
                    x = xa._offset + xa.l2p(xVals[k].x);
                    push('grid', xa, x, yOffset, x, yOffset + ya._length);
                }
            }
            if(xShowZl) {
                x = xa._offset + xa.l2p(0);
                push('zeroline', xa, x, yOffset, x, yOffset + ya._length);
            }
            if(ya.showgrid) {
                for(k = 0; k < yVals.length; k++) {
                    y = yOffset + yb + ym * yVals[k].x;
                    push('grid', ya, xa._offset, y, xa._offset + xa._length, y);
                }
            }
            if(yShowZl) {
                y = yOffset + yb + 0;
                push('zeroline', ya, xa._offset, y, xa._offset + xa._length, y);
            }
        }
    }

    var gridBatches = [];
    for(k in lookup) {
        gridBatches.push(lookup[k]);
    }

    return gridBatches;
}

// just like in Axes.doTicks but without the loop over traces
// TODO dry this up
function showZeroLine(ax) {
    var rng = Lib.simpleMap(ax.range, ax.r2l);
    var p0 = ax.l2p(0);

    return (
        ax.zeroline &&
        ax._vals && ax._vals.length &&
        (rng[0] * rng[1] <= 0) &&
        (ax.type === 'linear' || ax.type === '-') &&
        ((p0 > 1 && p0 < ax._length - 1) || !ax.showline)
    );
}

function clean(newFullData, newFullLayout, oldFullData, oldFullLayout, oldCalcdata) {
    var oldModules = oldFullLayout._modules || [];
    var newModules = newFullLayout._modules || [];

    var hadSplom, hasSplom;
    var i;

    for(i = 0; i < oldModules.length; i++) {
        if(oldModules[i].name === 'splom') {
            hadSplom = true;
            break;
        }
    }
    for(i = 0; i < newModules.length; i++) {
        if(newModules[i].name === 'splom') {
            hasSplom = true;
            break;
        }
    }

    if(hadSplom && !hasSplom) {
        for(i = 0; i < oldCalcdata.length; i++) {
            var cd0 = oldCalcdata[i][0];
            var trace = cd0.trace;
            var scene = cd0.t._scene;

            if(trace.type === 'splom' && scene && scene.matrix) {
                // this below throws as error
                // scene.matrix.destroy();
            }
        }
    }

    if(oldFullLayout._splomGrid &&
        (!newFullLayout._hasOnlyLargeSploms && oldFullLayout._hasOnlyLargeSploms)) {
        oldFullLayout._splomGrid.destroy();
    }

    Cartesian.clean(newFullData, newFullLayout, oldFullData, oldFullLayout);
}

module.exports = {
    name: SPLOM,
    attrRegex: Cartesian.attrRegex,
    layoutAttributes: Cartesian.layoutAttributes,
    supplyLayoutDefaults: Cartesian.supplyLayoutDefaults,
    drawFramework: Cartesian.drawFramework,
    plot: plot,
    drag: drag,
    drawGrid: drawGrid,
    clean: clean,
    toSVG: Cartesian.toSVG
};
