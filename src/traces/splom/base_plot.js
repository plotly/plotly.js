/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var createRegl = require('regl');

var Registry = require('../../registry');
var getModuleCalcData = require('../../plots/get_data').getModuleCalcData;
var Cartesian = require('../../plots/cartesian');
var AxisIDs = require('../../plots/cartesian/axis_ids');

var SPLOM = 'splom';

function plot(gd) {
    var fullLayout = gd._fullLayout;
    var _module = Registry.getModule(SPLOM);
    var splomCalcData = getModuleCalcData(gd.calcdata, _module);

    // clear gl frame, if any, since we preserve drawing buffer
    if(fullLayout._glcanvas && fullLayout._glcanvas.size()) {
        fullLayout._glcanvas.each(function(d) {
            if(d.regl) d.regl.clear({color: true});
        });
    }

    // make sure proper regl instances are created
    fullLayout._glcanvas.each(function(d) {
        if(d.regl || d.pick) return;
        d.regl = createRegl({
            canvas: this,
            attributes: {
                antialias: !d.pick,
                preserveDrawingBuffer: true
            },
            extensions: ['ANGLE_instanced_arrays', 'OES_element_index_uint'],
            pixelRatio: gd._context.plotGlPixelRatio || global.devicePixelRatio
        });
    });

    _module.plot(gd, {}, splomCalcData);
}

function drag(gd) {
    var cd = gd.calcdata;

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
}

function clean(newFullData, newFullLayout, oldFullData, oldFullLayout) {
    // TODO clear regl-splom instances
    // TODO clear regl-line2d grid instance!

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
    clean: clean,
    toSVG: Cartesian.toSVG
};
