'use strict';

var Lib = require('../../lib');

var handleXYZDefaults = require('./xyz_defaults');
var handleHeatmapLabelDefaults = require('./label_defaults');
var handlePeriodDefaults = require('../scatter/period_defaults');
var handleStyleDefaults = require('./style_defaults');
var colorscaleDefaults = require('../../components/colorscale/defaults');
var attributes = require('./attributes');

module.exports = function supplyDefaults(traceIn, traceOut, defaultColor, layout) {
    function coerce(attr, dflt) {
        return Lib.coerce(traceIn, traceOut, attributes, attr, dflt);
    }

    var validData = handleXYZDefaults(traceIn, traceOut, coerce, layout);
    if (!validData) {
        traceOut.visible = false;
        return;
    }

    handlePeriodDefaults(traceIn, traceOut, layout, coerce);
    coerce('xhoverformat');
    coerce('yhoverformat');

    coerce('text');
    coerce('hovertext');
    coerce('hovertemplate');
    coerce('hovertemplatefallback');

    handleHeatmapLabelDefaults(coerce, layout);
    handleStyleDefaults(traceIn, traceOut, coerce, layout);

    coerce('hoverongaps');
    coerce('connectgaps', Lib.isArray1D(traceOut.z) && traceOut.zsmooth !== false);

    colorscaleDefaults(traceIn, traceOut, layout, coerce, { prefix: '', cLetter: 'z' });
    coerce('zorder');
};
