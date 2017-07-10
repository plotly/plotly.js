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

function plot(scene, data, cdscatter) {
    console.log(scene, data, cdscatter)

    var container = scene.querySelector('.gl-container')

    //FIXME: avoid forcing absolute style by disabling forced plotly background
    var canvas = container.appendChild(document.createElement('canvas'))
    canvas.style.position = 'absolute'

    var ctx = canvas.getContext('2d')

    ctx.fillStyle = 'black'
    ctx.fillRect(0,0,10,10)
    console.log(canvas)

    return plot;
}

module.exports = plot;
