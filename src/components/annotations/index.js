/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Plotly = require('../../plotly');

exports.moduleType = 'component';

exports.name = 'annotations';

exports.ARROWPATHS = require('./arrow_paths');

exports.layoutAttributes = require('./attributes');

exports.supplyLayoutDefaults = require('./defaults');

exports.calcAutorange = require('./calc_autorange');

exports.arrowhead = require('./draw_arrow_head');

var drawModule = require('./draw');
exports.draw = drawModule.draw;
exports.drawOne = drawModule.drawOne;

exports.add = function(gd) {
    var nextAnn = gd._fullLayout.annotations.length;

    Plotly.relayout(gd, 'annotations[' + nextAnn + ']', 'add');
};
