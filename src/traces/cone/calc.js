/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var cone2mesh = require('./helpers').cone2mesh;
var colorscaleCalc = require('../../components/colorscale/calc');

module.exports = function calc(gd, trace) {
    var fullLayout = gd._fullLayout;

    // TODO skip when 'cmin' and 'cmax' are set
    // TODO find way to "merge" this cone2mesh call with the one in convert.js
    //
    // TODO should show in absolute or normalize length?

    var meshData = cone2mesh(trace, fullLayout[trace.scene]);

    colorscaleCalc(trace, meshData.vertexIntensity, '', 'c');
};
