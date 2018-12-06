/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

exports.moduleType = 'component';

exports.name = 'colorscale';

exports.scales = require('./scales');

exports.defaultScale = require('./default_scale');

exports.attributes = require('./attributes');

exports.layoutAttributes = require('./layout_attributes');

exports.supplyLayoutDefaults = require('./layout_defaults');

exports.handleDefaults = require('./defaults');

exports.calc = require('./calc');

exports.hasColorscale = require('./has_colorscale');

exports.isValidScale = require('./is_valid_scale');

exports.getScale = require('./get_scale');

exports.flipScale = require('./flip_scale');

exports.extractScale = require('./extract_scale');

exports.makeColorScaleFunc = require('./make_color_scale_func');
