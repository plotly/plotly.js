'use strict';

var Lib = require('../../lib');

var handleSampleDefaults = require('../histogram2d/sample_defaults');
var handleContoursDefaults = require('../contour/contours_defaults');
var handleStyleDefaults = require('../contour/style_defaults');
var handleHeatmapLabelDefaults = require('../heatmap/label_defaults');
var attributes = require('./attributes');

module.exports = function supplyDefaults(traceIn, traceOut, defaultColor, layout) {
    function coerce(attr, dflt) {
        return Lib.coerce(traceIn, traceOut, attributes, attr, dflt);
    }

    function coerce2(attr) {
        return Lib.coerce2(traceIn, traceOut, attributes, attr);
    }

    handleSampleDefaults(traceIn, traceOut, coerce, layout);
    if (traceOut.visible === false) return;

    handleContoursDefaults(traceIn, traceOut, coerce, coerce2);
    handleStyleDefaults(traceIn, traceOut, coerce, layout);
    coerce('xhoverformat');
    coerce('yhoverformat');
    coerce('hovertemplate');
    coerce('hovertemplatefallback');
    if (traceOut.contours && traceOut.contours.coloring === 'heatmap') {
        handleHeatmapLabelDefaults(coerce, layout);
    }
};
