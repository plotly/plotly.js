/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Lib = require('../../lib');
var Color = require('../../components/color');

var boxDefaults = require('../box/defaults');
var attributes = require('./attributes');

module.exports = function supplyDefaults(traceIn, traceOut, defaultColor, layout) {
    function coerce(attr, dflt) {
        return Lib.coerce(traceIn, traceOut, attributes, attr, dflt);
    }
    function coerce2(attr, dflt) {
        return Lib.coerce2(traceIn, traceOut, attributes, attr, dflt);
    }

    boxDefaults.handleSampleDefaults(traceIn, traceOut, coerce, layout);
    if(traceOut.visible === false) return;

    coerce('kernel');
    coerce('bandwidth');
    coerce('scalegroup', traceOut.name);
    coerce('scalemode');
    coerce('side');

    var span = coerce('span');
    var spanmodeDflt;
    if(Array.isArray(span)) spanmodeDflt = 'manual';
    coerce('spanmode', spanmodeDflt);

    var lineColor = coerce('line.color', (traceIn.marker || {}).color || defaultColor);
    var lineWidth = coerce('line.width');
    var fillColor = coerce('fillcolor', Color.addOpacity(traceOut.line.color, 0.5));

    boxDefaults.handlePointsDefaults(traceIn, traceOut, coerce, {prefix: ''});

    var show;

    var innerBoxWidth = coerce2('innerboxwidth');
    var innerBoxFillColor = coerce2('innerboxfillcolor', fillColor);
    var innerBoxLineColor = coerce2('innerboxlinecolor', lineColor);
    var innerBoxLineWidth = coerce2('innerboxlinewidth', lineWidth);
    show = coerce('showinnerbox', Boolean(innerBoxWidth || innerBoxFillColor || innerBoxLineColor || innerBoxLineWidth));
    if(!show) {
        delete traceOut.innerboxwidth;
        delete traceOut.innerboxfillcolor;
        delete traceOut.innerboxlinecolor;
        delete traceOut.innerboxlinewidth;
    }

    var meanLineColor = coerce2('meanlinecolor', lineColor);
    var meanLineWidth = coerce2('meanlinewidth', lineWidth);
    show = coerce('showmeanline', Boolean(meanLineColor || meanLineWidth));
    if(!show) {
        delete traceOut.meanlinecolor;
        delete traceOut.meanlinewidth;
    }
};
