/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var ScatterGl = require('../scattergl');
var isNumeric = require('fast-isnumeric');
var calcColorscales = require('../scatter/colorscale_calc');
var Axes = require('../../plots/cartesian/axes');
var kdtree = require('kdgrass');
var Lib = require('../../lib');


function calc(container, trace) {
    var layout = container._fullLayout;
    var subplotId = trace.subplot;
    var radialAxis = layout[subplotId].radialaxis;
    var angularAxis = layout[subplotId].angularaxis;
    var rArray = radialAxis.makeCalcdata(trace, 'r');
    var thetaArray = angularAxis.makeCalcdata(trace, 'theta');
    var stash = {};

    calcColorscales(trace);

    stash.r = rArray;
    stash.theta = thetaArray;

    // FIXME: remove this once .plot API gets compatible w/others
    stash.container = container;

    Axes.expand(radialAxis, rArray, {tozero: true});

    if(angularAxis.type !== 'linear') {
        angularAxis.autorange = true;
        Axes.expand(angularAxis, thetaArray);
    }

    return [{x: false, y: false, t: stash, trace: trace}];
}


function plot(subplot, cdata) {
    var stash = cdata[0][0].t;
    var container = stash.container;
    var radialAxis = subplot.radialAxis;
    var angularAxis = subplot.angularAxis;
    var rRange = radialAxis.range;
    var thetaRange = angularAxis.range;

    var scene = ScatterGl.scene(container, subplot);
    scene.clear();

    cdata.forEach(function(cdscatter, traceIndex) {
        if(!cdscatter || !cdscatter[0] || !cdscatter[0].trace) return;
        var cd = cdscatter[0];
        var trace = cd.trace;
        var stash = cd.t;
        var rArray = stash.r;
        var thetaArray = stash.theta;
        var i, r, theta;

        // filter out by range
        var newRadialArray = [];
        var newThetaArray = [];

        for(i = 0; i < rArray.length; i++) {
            r = rArray[i], theta = thetaArray[i];

            var rad = angularAxis.c2rad(theta, trace.thetaunit)

            if(subplot.isPtWithinSector({r: r, rad: rad})) {
                newRadialArray.push(r);
                newThetaArray.push(theta);
            }
        }

        rArray = newRadialArray;
        thetaArray = newThetaArray;

        var count = rArray.length;
        var positions = new Array(count * 2), x = Array(count), y = Array(count);

        function c2rad(v) {
            return angularAxis.c2rad(v, trace.thetaunit);
        }

        for(i = 0; i < count; i++) {
            r = rArray[i] - rRange[0];
            theta = thetaArray[i];

            if(isNumeric(r) && isNumeric(theta) && r >= 0) {
                var rad = c2rad(theta);

                x[i] = positions[i * 2] = r * Math.cos(rad);
                y[i] = positions[i * 2 + 1] = r * Math.sin(rad);
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

        // save scene options batch
        scene.lineOptions.push(options.line);
        scene.errorXOptions.push(options.errorX);
        scene.errorYOptions.push(options.errorY);
        scene.fillOptions.push(options.fill);
        scene.markerOptions.push(options.marker);
        scene.selectedOptions.push(options.selected);
        scene.unselectedOptions.push(options.unselected);
        scene.count = cdata.length;

        // stash scene ref
        stash.scene = scene;
        stash.index = traceIndex;
        stash.x = x;
        stash.y = y;
        stash.rawx = x;
        stash.rawy = y;
        stash.r = rArray;
        stash.theta = thetaArray;
        stash.positions = positions;
        stash.count = count;
        stash.tree = kdtree(positions, 512);
        // var ids = stash.ids = Array(count);
        // for(i = 0; i < count; i++) {
        //     ids[i] = i;
        // }
    });

    return ScatterGl.plot(container, subplot, cdata);
}


function hover(pointData, xval, yval, hovermode) {
    var cd = pointData.cd,
        stash = cd[0].t,
        rArray = stash.r,
        thetaArray = stash.theta;

    var scatterPointData = ScatterGl.hoverPoints(pointData, xval, yval, hovermode);

    if(!scatterPointData || scatterPointData[0].index === false) return;

    var newPointData = scatterPointData[0];

    // hovering on fill case
    // TODO do we need to constrain the scatter point data further (like for
    // ternary subplots) or not?
    if(newPointData.index === undefined) {
        return scatterPointData;
    }

    var subplot = pointData.subplot;
    var cdi = newPointData.cd[newPointData.index];
    var trace = newPointData.trace;
    var radialAxis = subplot.radialAxis;
    var angularAxis = subplot.angularAxis;
    var hoverinfo = cdi.hi || trace.hoverinfo;
    var parts = hoverinfo.split('+');
    var text = [];
    var _rad = angularAxis.c2rad(cdi.theta, trace.thetaunit);

    // augment pointData with r/theta param
    cdi.r = rArray[newPointData.index];
    cdi.theta = thetaArray[newPointData.index];
    cdi.rad = angularAxis.c2rad(cdi.theta, trace.thetaunit);

    if(!subplot.isPtWithinSector(cdi)) return;

    newPointData.xLabelVal = undefined;
    newPointData.yLabelVal = undefined;


    radialAxis._hovertitle = 'r';
    angularAxis._hovertitle = 'θ';

    // show theta value in unit of angular axis
    var theta;
    if(angularAxis.type === 'linear' && trace.thetaunit !== angularAxis.thetaunit) {
        theta = angularAxis.thetaunit === 'degrees' ? Lib.rad2deg(_rad) : _rad;
    } else {
        theta = cdi.theta;
    }

    function textPart(ax, val) {
        text.push(ax._hovertitle + ': ' + Axes.tickText(ax, val, 'hover').text);
    }

    if(parts.indexOf('all') !== -1) parts = ['r', 'theta'];
    if(parts.indexOf('r') !== -1) textPart(radialAxis, cdi.r);
    if(parts.indexOf('theta') !== -1) textPart(angularAxis, theta);

    newPointData.extraText = text.join('<br>');

    return scatterPointData;
}


module.exports = {
    moduleType: 'trace',
    name: 'scatterpolargl',
    basePlotModule: require('../../plots/polar'),
    categories: ['gl', 'regl', 'polar', 'symbols', 'markerColorscale', 'showLegend', 'scatter-like'],

    // TODO scatterpolargl won't support text
    // should have its own attributes and defaults
    attributes: require('../scatterpolar/attributes'),
    supplyDefaults: require('../scatterpolar/defaults'),

    calc: calc,
    plot: plot,
    hoverPoints: hover,
    style: ScatterGl.style,
    selectPoints: ScatterGl.selectPoints,

    meta: {
        hrName: 'scatter_polar_gl',
        description: [
            '!!! GL VERSION OF SCATTERPOLAR !!!',

            'The scatterpolar trace type encompasses line charts, scatter charts, text charts, and bubble charts.',
            'in polar coordinates.',
            'The data visualized as scatter point or lines is set in',
            '`r` (radial) and `theta` (angular). coordintes',
            'Text (appearing either on the chart or on hover only) is via `text`.',
            'Bubble charts are achieved by setting `marker.size` and/or `marker.color`',
            'to numerical arrays.'
        ].join(' ')
    }
};
