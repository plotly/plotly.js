/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var ScatterGl = require('../scattergl');
var ScatterPolar = require('../scatterpolar');

function calc(gd, trace) {
    // trace.x = cd.map(function(d) { return cd.x; });
    // trace.y = cd.map(function(d) { return cd.y; });

    // trace.error_x = {};
    // trace.error_y = {};

    var layout = container._fullLayout;
    var positions;
    var stash = {};
    var markerOpts = trace.marker;

    var xaxis = {
        type: 'linear'
    };

    var yaxis = {
        type: 'linear'
    };

    // how to get subplot ref for non-cartesian traces!
    var subplot = layout[trace.subplot];

    var x = trace.x;
    var y = trace.y;

    var count = (x || y).length, i, l, xx, yy, ptrX = 0, ptrY = 0;

    if(!x) {
        x = Array(count);
        for(i = 0; i < count; i++) {
            x[i] = i;
        }
    }
    if(!y) {
        y = Array(count);
        for(i = 0; i < count; i++) {
            y[i] = i;
        }
    }

    // get log converted positions
    var rawx, rawy;
    if(xaxis.type === 'log') {
        rawx = Array(x.length);
        for(i = 0, l = x.length; i < l; i++) {
            rawx[i] = x[i];
            x[i] = xaxis.d2l(x[i]);
        }
    }
    else {
        rawx = x;
        for(i = 0, l = x.length; i < l; i++) {
            x[i] = parseFloat(x[i]);
        }
    }
    if(yaxis.type === 'log') {
        rawy = Array(y.length);
        for(i = 0, l = y.length; i < l; i++) {
            rawy[i] = y[i];
            y[i] = yaxis.d2l(y[i]);
        }
    }
    else {
        rawy = y;
        for(i = 0, l = y.length; i < l; i++) {
            y[i] = parseFloat(y[i]);
        }
    }

    // we need hi-precision for scatter2d
    positions = new Array(count * 2);

    for(i = 0; i < count; i++) {
        // if no x defined, we are creating simple int sequence (API)
        // we use parseFloat because it gives NaN (we need that for empty values to avoid drawing lines) and it is incredibly fast
        xx = isNumeric(x[i]) ? +x[i] : NaN;
        yy = isNumeric(y[i]) ? +y[i] : NaN;

        positions[i * 2] = xx;
        positions[i * 2 + 1] = yy;
    }

    // we don't build a tree for log axes since it takes long to convert log2px
    // and it is also
    if(xaxis.type !== 'log' && yaxis.type !== 'log') {
        // FIXME: delegate this to webworker
        stash.tree = kdtree(positions, 512);
    }
    else {
        var ids = stash.ids = Array(count);
        for(i = 0; i < count; i++) {
            ids[i] = i;
        }
    }


    calcColorscales(trace);



    var options = ScatterGl.sceneOptions(container, subplot, trace, positions)
    var scene = ScatterGl.scene(container, subplot, trace, positions);



    // save scene options batch
    scene.lineOptions.push(hasLines ? lineOptions : null);
    scene.errorXOptions.push(hasErrorX ? errorXOptions : null);
    scene.errorYOptions.push(hasErrorY ? errorYOptions : null);
    scene.fillOptions.push(hasFill ? fillOptions : null);
    scene.markerOptions.push(hasMarkers ? markerOptions : null);
    scene.selectedOptions.push(hasMarkers ? selectedOptions : null);
    scene.unselectedOptions.push(hasMarkers ? unselectedOptions : null);
    scene.count++;


    // stash scene ref
    stash.scene = scene;
    stash.index = scene.count - 1;
    stash.x = x;
    stash.y = y;
    stash.rawx = rawx;
    stash.rawy = rawy;
    stash.positions = positions;
    stash.count = count;

    return [{x: false, y: false, t: stash, trace: trace}];
}

function plot(container, subplot, cdata) {

    console.log(container.xaxis, container.yaxis)


    ScatterGl.plot(container, subplot, cdata);
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
    style: ScatterGl.style,
    hoverPoints: ScatterGl.hoverPoints,
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
