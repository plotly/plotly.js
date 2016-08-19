/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Lib = require('../../lib');

exports.formatPiePercent = function formatPiePercent(v, separators) {
    var vRounded = (v * 100).toPrecision(3);
    if(vRounded.lastIndexOf('.') !== -1) {
        vRounded = vRounded.replace(/[.]?0+$/, '');
    }
    return Lib.numSeparate(vRounded, separators) + '%';
};

exports.formatPieValue = function formatPieValue(v, separators) {
    var vRounded = v.toPrecision(10);
    if(vRounded.lastIndexOf('.') !== -1) {
        vRounded = vRounded.replace(/[.]?0+$/, '');
    }
    return Lib.numSeparate(vRounded, separators);
};
