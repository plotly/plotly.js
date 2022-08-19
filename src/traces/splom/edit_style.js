'use strict';

var Lib = require('../../lib');
var calcColorscale = require('../scatter/colorscale_calc');
var convertMarkerStyle = require('../scattergl/convert').markerStyle;

module.exports = function editStyle(gd, cd0) {
    var trace = cd0.trace;
    var scene = gd._fullLayout._splomScenes[trace.uid];

    if(scene) {
        calcColorscale(gd, trace);

        Lib.extendFlat(scene.matrixOptions, convertMarkerStyle(gd, trace));
        // TODO [un]selected styles?

        var opts = Lib.extendFlat({}, scene.matrixOptions, scene.viewOpts);

        // TODO this is too long for arrayOk attributes!
        scene.matrix.update(opts, null);
    }
};
