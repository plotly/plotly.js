/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var colorscaleDefaults = require('../../components/colorscale/defaults');


module.exports = function handleStyleDefaults(traceIn, traceOut, coerce, layout) {
    var coloring = coerce('contours.coloring');

    var showLines;
    if(coloring === 'fill') showLines = coerce('contours.showlines');

    if(showLines !== false) {
        if(coloring !== 'lines') coerce('line.color', '#000');
        coerce('line.width', 0.5);
        coerce('line.dash');
    }

    coerce('line.smoothing');

    if((traceOut.contours || {}).coloring !== 'none') {
        colorscaleDefaults(
            traceIn, traceOut, layout, coerce, {prefix: '', cLetter: 'z'}
        );
    }
};
