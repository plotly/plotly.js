/**
* Copyright 2012-2020, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Lib = require('../../lib');
var calcColorscale = require('../scatter/colorscale_calc');
var convertMarkerStyle = require('../scattergl/convert').markerStyle;

module.exports = function editStyle(gd, cd0) {
    var trace = cd0.trace;
    var scene = gd._fullLayout._splomScenes[trace.uid];

    if(scene) {
        calcColorscale(gd, trace);

        Lib.extendFlat(scene.matrixOptions, convertMarkerStyle(trace));
        // TODO [un]selected styles?

        var opts = Lib.extendFlat({}, scene.matrixOptions, scene.viewOpts);

        // TODO this is too long for arrayOk attributes!
        scene.matrix.update(opts, null);
    }
};
