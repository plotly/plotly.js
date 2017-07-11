/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Lib = require('../../lib');
var Axes = require('../../plots/cartesian/axes');
var autoType = require('../../plots/cartesian/axis_autotype');
var ErrorBars = require('../../components/errorbars');
var str2RGBArray = require('../../lib/str2rgbarray');
var truncate = require('../../lib/typed_array_truncate');
var formatColor = require('../../lib/gl_format_color');
var subTypes = require('../scatter/subtypes');
var makeBubbleSizeFn = require('../scatter/make_bubble_size_func');
var getTraceColor = require('../scatter/get_trace_color');
var MARKER_SYMBOLS = require('../../constants/gl2d_markers');
var DASHES = require('../../constants/gl2d_dashes');

// var createScatter = require('regl-scatter2d')

function plot(container, data, cdscatter) {
    // console.log(container, data, cdscatter)

    var layout = container._fullLayout
    var data = container._fullData[0]
    var xa = layout.xaxis
    var ya = layout.yaxis
    var container = container.querySelector('.gl-container')

    //FIXME: find proper way to get plot holder
    //FIXME: handle multiple subplots
    var subplotObj = layout._plots.xy
    var scatter = subplotObj._scatterplot

    //create regl-scatter, if not defined
    if (scatter === undefined) {
        //TODO: enhance picking
        //TODO: create PR with questions
        // if ()

        //FIXME: avoid forcing absolute style by disabling forced plotly background
        var canvas = container.appendChild(document.createElement('canvas'))
        canvas.style.position = 'absolute';
        canvas.style.transform = 'translate(' + xa._offset + 'px, ' + ya._offset + 'px)';
        canvas.style.pointerEvents = 'none';
        canvas.width = 700;
        canvas.height = 500;

        scatter = subplotObj._scatterplot = {canvas: canvas}
    }

    var canvas = scatter.canvas
    var ctx = canvas.getContext('2d')

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = 'rgba(100,200,255,.8)';

    for (var i = 0, l = data.x.length; i < l; i++) {
        ctx.fillRect(xa.c2p(data.x[i]),ya.c2p(data.y[i]),5,5)
    }

    return plot;
}

module.exports = plot;
