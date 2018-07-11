/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var cluster = require('point-cluster');
var isNumeric = require('fast-isnumeric');

var ScatterGl = require('../scattergl');
var calcColorscales = require('../scatter/colorscale_calc');
var Axes = require('../../plots/cartesian/axes');
var makeHoverPointText = require('../scatterpolar/hover').makeHoverPointText;
var subTypes = require('../scatter/subtypes');

var TOO_MANY_POINTS = require('../scattergl/constants').TOO_MANY_POINTS;

function calc(container, trace) {
    var layout = container._fullLayout;
    var subplotId = trace.subplot;
    var radialAxis = layout[subplotId].radialaxis;
    var angularAxis = layout[subplotId].angularaxis;
    var rArray = radialAxis.makeCalcdata(trace, 'r');
    var thetaArray = angularAxis.makeCalcdata(trace, 'theta');
    var stash = {};

    if(trace._length < rArray.length) rArray = rArray.slice(0, trace._length);
    if(trace._length < thetaArray.length) thetaArray = thetaArray.slice(0, trace._length);

    calcColorscales(trace);

    stash.r = rArray;
    stash.theta = thetaArray;

    Axes.expand(radialAxis, rArray, {tozero: true});

    if(angularAxis.type !== 'linear') {
        angularAxis.autorange = true;
        Axes.expand(angularAxis, thetaArray);
        delete angularAxis.autorange;
    }

    return [{x: false, y: false, t: stash, trace: trace}];
}

function plot(container, subplot, cdata) {
    var radialAxis = subplot.radialAxis;
    var angularAxis = subplot.angularAxis;
    var rRange = radialAxis.range;

    var scene = ScatterGl.sceneUpdate(container, subplot);
    scene.clear();

    cdata.forEach(function(cdscatter, traceIndex) {
        if(!cdscatter || !cdscatter[0] || !cdscatter[0].trace) return;
        var cd = cdscatter[0];
        var trace = cd.trace;
        var stash = cd.t;
        var rArray = stash.r;
        var thetaArray = stash.theta;
        var i, r, rr, theta, rad;

        var subRArray = rArray.slice();
        var subThetaArray = thetaArray.slice();

        // filter out by range
        for(i = 0; i < rArray.length; i++) {
            r = rArray[i], theta = thetaArray[i];
            rad = angularAxis.c2rad(theta, trace.thetaunit);

            if(!subplot.isPtWithinSector({r: r, rad: rad})) {
                subRArray[i] = NaN;
                subThetaArray[i] = NaN;
            }
        }

        var count = rArray.length;
        var positions = new Array(count * 2), x = Array(count), y = Array(count);

        function c2rad(v) {
            return angularAxis.c2rad(v, trace.thetaunit);
        }

        for(i = 0; i < count; i++) {
            r = subRArray[i];
            theta = subThetaArray[i];

            if(isNumeric(r) && isNumeric(theta) && r >= 0) {
                rr = radialAxis.c2r(r) - rRange[0];
                rad = c2rad(theta);

                x[i] = positions[i * 2] = rr * Math.cos(rad);
                y[i] = positions[i * 2 + 1] = rr * Math.sin(rad);
            } else {
                x[i] = y[i] = positions[i * 2] = positions[i * 2 + 1] = NaN;
            }
        }

        var options = ScatterGl.sceneOptions(container, subplot, trace, positions);

        // set flags to create scene renderers
        if(options.fill && !scene.fill2d) scene.fill2d = true;
        if(options.marker && !scene.scatter2d) scene.scatter2d = true;
        if(options.line && !scene.line2d) scene.line2d = true;
        if((options.errorX || options.errorY) && !scene.error2d) scene.error2d = true;

        stash.tree = cluster(positions);

        // FIXME: see scattergl.js#109
        if(options.marker && count >= TOO_MANY_POINTS) {
            options.marker.cluster = stash.tree;
        }

        // bring positions to selected/unselected options
        if(subTypes.hasMarkers(trace)) {
            options.markerSel.positions = options.markerUnsel.positions = options.marker.positions;
        }

        // save scene options batch
        scene.lineOptions.push(options.line);
        scene.errorXOptions.push(options.errorX);
        scene.errorYOptions.push(options.errorY);
        scene.fillOptions.push(options.fill);
        scene.markerOptions.push(options.marker);
        scene.markerSelectedOptions.push(options.markerSel);
        scene.markerUnselectedOptions.push(options.markerUnsel);
        scene.count = cdata.length;

        // stash scene ref
        stash._scene = scene;
        stash.index = traceIndex;
        stash.x = x;
        stash.y = y;
        stash.rawx = x;
        stash.rawy = y;
        stash.r = rArray;
        stash.theta = thetaArray;
        stash.positions = positions;
        stash.count = count;
    });

    return ScatterGl.plot(container, subplot, cdata);
}

function hoverPoints(pointData, xval, yval, hovermode) {
    var cd = pointData.cd;
    var stash = cd[0].t;
    var rArray = stash.r;
    var thetaArray = stash.theta;

    var scatterPointData = ScatterGl.hoverPoints(pointData, xval, yval, hovermode);
    if(!scatterPointData || scatterPointData[0].index === false) return;

    var newPointData = scatterPointData[0];

    if(newPointData.index === undefined) {
        return scatterPointData;
    }

    var subplot = pointData.subplot;
    var angularAxis = subplot.angularAxis;
    var cdi = newPointData.cd[newPointData.index];
    var trace = newPointData.trace;

    // augment pointData with r/theta param
    cdi.r = rArray[newPointData.index];
    cdi.theta = thetaArray[newPointData.index];
    cdi.rad = angularAxis.c2rad(cdi.theta, trace.thetaunit);

    if(!subplot.isPtWithinSector(cdi)) return;

    newPointData.xLabelVal = undefined;
    newPointData.yLabelVal = undefined;
    newPointData.extraText = makeHoverPointText(cdi, trace, subplot);

    return scatterPointData;
}

module.exports = {
    moduleType: 'trace',
    name: 'scatterpolargl',
    basePlotModule: require('../../plots/polar'),
    categories: ['gl', 'regl', 'polar', 'symbols', 'showLegend', 'scatter-like'],

    attributes: require('./attributes'),
    supplyDefaults: require('./defaults'),
    colorbar: require('../scatter/marker_colorbar'),

    calc: calc,
    plot: plot,
    hoverPoints: hoverPoints,
    style: ScatterGl.style,
    selectPoints: ScatterGl.selectPoints,

    meta: {
        hrName: 'scatter_polar_gl',
        description: [
            'The scatterpolargl trace type encompasses line charts, scatter charts, and bubble charts',
            'in polar coordinates using the WebGL plotting engine.',
            'The data visualized as scatter point or lines is set in',
            '`r` (radial) and `theta` (angular) coordinates',
            'Bubble charts are achieved by setting `marker.size` and/or `marker.color`',
            'to numerical arrays.'
        ].join(' ')
    }
};
