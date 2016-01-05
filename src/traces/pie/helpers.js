/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

exports.formatPiePercent = function formatPiePercent(v) {
    var vRounded = (v * 100).toPrecision(3);
    if(vRounded.indexOf('.') !== -1) return vRounded.replace(/[.]?0+$/,'') + '%';
    return vRounded + '%';
};

exports.formatPieValue = function formatPieValue(v) {
    var vRounded = v.toPrecision(10);
    if(vRounded.indexOf('.') !== -1) return vRounded.replace(/[.]?0+$/,'');
    return vRounded;
};
