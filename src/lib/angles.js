/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var PI = Math.PI;

exports.deg2rad = function(deg) {
    return deg / 180 * PI;
};

exports.rad2deg = function(rad) {
    return rad / PI * 180;
};

exports.wrap360 = function(deg) {
    var out = deg % 360;
    return out < 0 ? out + 360 : out;
};

exports.wrap180 = function(deg) {
    if(Math.abs(deg) > 180) deg -= Math.round(deg / 360) * 360;
    return deg;
};
