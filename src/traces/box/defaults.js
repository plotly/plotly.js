/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Lib = require('../../lib');
var Color = require('../../components/color');

var attributes = require('./attributes');

module.exports = function supplyDefaults(traceIn, traceOut, defaultColor) {
    function coerce(attr, dflt) {
        return Lib.coerce(traceIn, traceOut, attributes, attr, dflt);
    }

    var y = coerce('y'),
        x = coerce('x'),
        defaultOrientation;

    if(y && y.length) {
        defaultOrientation = 'v';
        if(!x) coerce('x0');
    } else if(x && x.length) {
        defaultOrientation = 'h';
        coerce('y0');
    } else {
        traceOut.visible = false;
        return;
    }

    coerce('orientation', defaultOrientation);

    coerce('line.color', (traceIn.marker || {}).color || defaultColor);
    coerce('line.width', 2);
    coerce('fillcolor', Color.addOpacity(traceOut.line.color, 0.5));

    coerce('whiskerwidth');
    coerce('boxmean');

    var outlierColorDflt = Lib.coerce2(traceIn, traceOut, attributes, 'marker.outliercolor'),
        lineoutliercolor = coerce('marker.line.outliercolor'),
        boxpoints = outlierColorDflt ||
                    lineoutliercolor ? coerce('boxpoints', 'suspectedoutliers') :
                    coerce('boxpoints');

    if(boxpoints) {
        coerce('jitter', boxpoints === 'all' ? 0.3 : 0);
        coerce('pointpos', boxpoints === 'all' ? -1.5 : 0);

        coerce('marker.symbol');
        coerce('marker.opacity');
        coerce('marker.size');
        coerce('marker.color', traceOut.line.color);
        coerce('marker.line.color');
        coerce('marker.line.width');

        if(boxpoints === 'suspectedoutliers') {
            coerce('marker.line.outliercolor', traceOut.marker.color);
            coerce('marker.line.outlierwidth');
        }
    }
};
