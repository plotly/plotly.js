'use strict';

var Lib = require('../../lib');

var handleXYZDefaults = require('../heatmap/xyz_defaults');
var handlePeriodDefaults = require('../scatter/period_defaults');
var handleConstraintDefaults = require('./constraint_defaults');
var handleContoursDefaults = require('./contours_defaults');
var handleStyleDefaults = require('./style_defaults');
var handleHeatmapLabelDefaults = require('../heatmap/label_defaults');
var attributes = require('./attributes');


module.exports = function supplyDefaults(traceIn, traceOut, defaultColor, layout) {
    function coerce(attr, dflt) {
        return Lib.coerce(traceIn, traceOut, attributes, attr, dflt);
    }

    function coerce2(attr) {
        return Lib.coerce2(traceIn, traceOut, attributes, attr);
    }

    var len = handleXYZDefaults(traceIn, traceOut, coerce, layout);
    if(!len) {
        traceOut.visible = false;
        return;
    }

    handlePeriodDefaults(traceIn, traceOut, layout, coerce);
    coerce('xhoverformat');
    coerce('yhoverformat');

    coerce('text');
    coerce('hovertext');
    coerce('hoverongaps');
    coerce('hovertemplate');

    var isConstraint = (coerce('contours.type') === 'constraint');
    coerce('connectgaps', Lib.isArray1D(traceOut.z));

    if(isConstraint) {
        handleConstraintDefaults(traceIn, traceOut, coerce, layout, defaultColor);
    } else {
        handleContoursDefaults(traceIn, traceOut, coerce, coerce2);
        handleStyleDefaults(traceIn, traceOut, coerce, layout);
    }

    if(
        traceOut.contours &&
        traceOut.contours.coloring === 'heatmap'
    ) {
        handleHeatmapLabelDefaults(coerce, layout);
    }
    coerce('zorder');
};
