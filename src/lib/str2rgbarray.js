/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var rgba = require('color-rgba');

function str2RgbaArray(color) {
    var colorOut = rgba(color);
    return colorOut.length ? colorOut : [0, 0, 0, 1];
}

module.exports = str2RgbaArray;
