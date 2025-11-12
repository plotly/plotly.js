'use strict';

var Lib = require('../../lib');
var Color = require('../../components/color');
var handleOHLC = require('../ohlc/ohlc_defaults');
var handlePeriodDefaults = require('../scatter/period_defaults');
var attributes = require('./attributes');

module.exports = function supplyDefaults(traceIn, traceOut, defaultColor, layout) {
    function coerce(attr, dflt) {
        return Lib.coerce(traceIn, traceOut, attributes, attr, dflt);
    }

    var len = handleOHLC(traceIn, traceOut, coerce, layout);
    if (!len) {
        traceOut.visible = false;
        return;
    }

    handlePeriodDefaults(traceIn, traceOut, layout, coerce, { x: true });
    coerce('xhoverformat');
    coerce('yhoverformat');

    coerce('line.width');

    handleDirection(traceIn, traceOut, coerce, 'increasing');
    handleDirection(traceIn, traceOut, coerce, 'decreasing');

    coerce('text');
    coerce('hovertext');
    coerce('hovertemplate');
    coerce('hovertemplatefallback');

    coerce('whiskerwidth');

    layout._requestRangeslider[traceOut.xaxis] = true;
    coerce('zorder');
};

function handleDirection(traceIn, traceOut, coerce, direction) {
    var lineColor = coerce(direction + '.line.color');
    coerce(direction + '.line.width', traceOut.line.width);
    coerce(direction + '.fillcolor', Color.addOpacity(lineColor, 0.5));
}
