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
var colormap = require('colormap')
var rgba = require('color-rgba')

var createScatter = require('../../../../regl-scatter2d')

function plot(container, data, cdscatter) {
    // console.log(container, data, cd)

    var layout = container._fullLayout
    var data = container._fullData[0]
    var xa = layout.xaxis
    var ya = layout.yaxis
    var cd = cdscatter[0]
    var container = container.querySelector('.gl-container')

    //FIXME: find proper way to get plot holder
    //FIXME: handle multiple subplots
    var subplotObj = layout._plots.xy
    var scatter = subplotObj._scatter2d

    //create regl-scatter, if not defined
    if (scatter === undefined) {
        //TODO: enhance picking
        //TODO: decide whether we should share canvas or create it every scatter plot
        //TODO: decide if canvas should be the full-width with viewport or multiple instances
        //FIXME: avoid forcing absolute style by disabling forced plotly background
        //TODO: figure out if there is a way to detect only new passed options
        var canvas = container.appendChild(document.createElement('canvas'))
        canvas.style.position = 'absolute';
        canvas.style.transform = 'translate(' + xa._offset + 'px, ' + ya._offset + 'px)';
        canvas.style.pointerEvents = 'none';
        canvas.width = xa._length;
        canvas.height = ya._length;

        // scatter = subplotObj._scatter2d = {canvas: canvas}
        scatter = subplotObj._scatter2d = createScatter({canvas: canvas})
    }

    var len = cd.length
    var marker = data.marker
    var bounds = [xa._rl[0], ya._rl[0], xa._rl[1], ya._rl[1]];

    // get positions
    var positions = Array(cd.length*2);
    for (var i = 0; i < len; i++) {
        positions[i*2] = cd[i].x;
        positions[i*2+1] = cd[i].y;
    }

    // create colormap, if required
    var markerPalette, markerColor = marker.color
    if (marker.colorscale) {
        var cmax = marker.cmax, cmin = marker.cmin, range = cmax - cmin
        var cmap = [], cscale = marker.colorscale
        for (var i = 0; i < cscale.length; i++) {
            cmap.push({index: cscale[i][0], rgb: rgba(cscale[i][1], false).slice(0, 3)})
        }
        //FIXME: making direct palette generator would be faster
        markerPalette = colormap({
            colormap: cmap,
            nshades: cmax - cmin,
            format: 'rgbaString'
        })

        if (cmin !== 0) {
            markerColor = marker.color.map(function (v) {return v - cmin})
        }
    }

    // if (!Array.isArray(data.marker.size)) {
    //     size = markerSizeFunc(data.marker.size)
    // } else {
    //     var sizes = data.marker.sizes
    //     size = []
    //     for (var i = 0; i < sizes.length; i++) {
    //         size[i] = markerSizeFunc(sizes[i])
    //     }
    // }

    // redraw plot
    scatter({
        color: markerColor,
        borderColor: marker.line && marker.line.color,
        palette: markerPalette,
        size: marker.size,
        range: bounds,
        positions: positions
    })

    return plot;
}

module.exports = plot;
