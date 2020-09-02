/**
* Copyright 2012-2020, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var cluster = require('@plotly/point-cluster');
var isNumeric = require('fast-isnumeric');

var scatterglPlot = require('../scattergl/plot');
var sceneUpdate = require('../scattergl/scene_update');
var convert = require('../scattergl/convert');

var Lib = require('../../lib');

var TOO_MANY_POINTS = require('../scattergl/constants').TOO_MANY_POINTS;

module.exports = function plot(gd, subplot, cdata) {
    if(!cdata.length) return;

    var radialAxis = subplot.radialAxis;
    var angularAxis = subplot.angularAxis;
    var scene = sceneUpdate(gd, subplot);

    cdata.forEach(function(cdscatter) {
        if(!cdscatter || !cdscatter[0] || !cdscatter[0].trace) return;
        var cd = cdscatter[0];
        var trace = cd.trace;
        var stash = cd.t;
        var len = trace._length;
        var rArray = stash.r;
        var thetaArray = stash.theta;
        var opts = stash.opts;
        var i;

        var subRArray = rArray.slice();
        var subThetaArray = thetaArray.slice();

        // filter out by range
        for(i = 0; i < rArray.length; i++) {
            if(!subplot.isPtInside({r: rArray[i], theta: thetaArray[i]})) {
                subRArray[i] = NaN;
                subThetaArray[i] = NaN;
            }
        }

        var positions = new Array(len * 2);
        var x = Array(len);
        var y = Array(len);

        for(i = 0; i < len; i++) {
            var r = subRArray[i];
            var xx, yy;

            if(isNumeric(r)) {
                var rg = radialAxis.c2g(r);
                var thetag = angularAxis.c2g(subThetaArray[i], trace.thetaunit);
                xx = rg * Math.cos(thetag);
                yy = rg * Math.sin(thetag);
            } else {
                xx = yy = NaN;
            }
            x[i] = positions[i * 2] = xx;
            y[i] = positions[i * 2 + 1] = yy;
        }

        stash.tree = cluster(positions);

        // FIXME: see scattergl.js#109
        if(opts.marker && len >= TOO_MANY_POINTS) {
            opts.marker.cluster = stash.tree;
        }

        if(opts.marker) {
            opts.markerSel.positions = opts.markerUnsel.positions = opts.marker.positions = positions;
        }

        if(opts.line && positions.length > 1) {
            Lib.extendFlat(
                opts.line,
                convert.linePositions(gd, trace, positions)
            );
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

        if(opts.fill && !scene.fill2d) scene.fill2d = true;
        if(opts.marker && !scene.scatter2d) scene.scatter2d = true;
        if(opts.line && !scene.line2d) scene.line2d = true;
        if(opts.text && !scene.glText) scene.glText = true;

        scene.lineOptions.push(opts.line);
        scene.fillOptions.push(opts.fill);
        scene.markerOptions.push(opts.marker);
        scene.markerSelectedOptions.push(opts.markerSel);
        scene.markerUnselectedOptions.push(opts.markerUnsel);
        scene.textOptions.push(opts.text);
        scene.textSelectedOptions.push(opts.textSel);
        scene.textUnselectedOptions.push(opts.textUnsel);
        scene.selectBatch.push([]);
        scene.unselectBatch.push([]);

        stash.x = x;
        stash.y = y;
        stash.rawx = x;
        stash.rawy = y;
        stash.r = rArray;
        stash.theta = thetaArray;
        stash.positions = positions;
        stash._scene = scene;
        stash.index = scene.count;
        scene.count++;
    });

    return scatterglPlot(gd, subplot, cdata);
};
