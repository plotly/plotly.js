'use strict';

var Lib = require('../../lib');
var handleOHLC = require('./ohlc_defaults');
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
    coerce('line.dash');

    handleDirection(traceIn, traceOut, coerce, 'increasing');
    handleDirection(traceIn, traceOut, coerce, 'decreasing');

    coerce('text');
    coerce('hovertext');
    coerce('hovertemplate');
    coerce('hovertemplatefallback');

    coerce('tickwidth');

    layout._requestRangeslider[traceOut.xaxis] = true;

    coerce('zorder');
};

function handleDirection(traceIn, traceOut, coerce, direction) {
    coerce(direction + '.line.color');
    coerce(direction + '.line.width', traceOut.line.width);
    coerce(direction + '.line.dash', traceOut.line.dash);
}
