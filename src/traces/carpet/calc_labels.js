/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Axes = require('../../plots/cartesian/axes');
var cheaterBasis = require('./cheater_basis');
var arrayMinmax = require('./array_minmax');
var search = require('../../lib/search').findBin;
var computeControlPoints = require('./compute_control_points');
var map2dArray = require('./map_2d_array');
var createSplineEvaluator = require('./create_spline_evaluator');
var setConvert = require('./set_convert');
var map2dArray = require('./map_2d_array');
var map1dArray = require('./map_1d_array');
var makepath = require('./makepath');
var extendFlat = require('../../lib/extend').extendFlat;

function normalize (x) {
    var x
}

module.exports = function calcLabels (trace, axis) {
    var i;

    var labels = axis._labels = [];
    var gridlines = axis._gridlines;

    for (i = 0; i < gridlines.length; i++) {
        var gridline = gridlines[i];

        if (['start', 'both'].indexOf(axis.showlabels) !== -1) {
            labels.push({
                text: gridline.value.toFixed(3),
                endAnchor: true,
                xy: gridline.xy(0),
                dxy: gridline.dxy(0, 0),
                axis: gridline.axis,
                length: gridline.crossAxis.length,
                font: gridline.crossAxis.startlabelfont,
                isFirst: i === 0,
                isLast: i === gridlines.length - 1
            });
        }

        if (['end', 'both'].indexOf(axis.showlabels) !== -1) {
            labels.push({
                text: gridline.value.toFixed(3),
                endAnchor: false,
                xy: gridline.xy(gridline.crossLength - 1),
                dxy: gridline.dxy(gridline.crossLength - 2, 1),
                axis: gridline.axis,
                length: gridline.crossAxis.length,
                font: gridline.crossAxis.endlabelfont,
                isFirst: i === 0,
                isLast: i === gridlines.length - 1
            });
        }
    }
};
