/**
* Copyright 2012-2015, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Color = require('../../components/color');
var Colorscale = require('../../components/colorscale');


module.exports = function handleStyleDefaults(traceIn, traceOut, coerce, defaultColor, layout) {
    coerce('marker.color', defaultColor);

    if(Colorscale.hasColorscale(traceIn, 'marker')) {
        Colorscale.handleDefaults(
            traceIn, traceOut, layout, coerce, {prefix: 'marker.', cLetter: 'c'}
        );
    }

    coerce('marker.line.color', Color.defaultLine);

    if(Colorscale.hasColorscale(traceIn, 'marker.line')) {
        Colorscale.handleDefaults(
            traceIn, traceOut, layout, coerce, {prefix: 'marker.line.', cLetter: 'c'}
        );
    }

    coerce('marker.line.width');
};
