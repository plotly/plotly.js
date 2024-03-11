'use strict';

var Lib = require('../../lib');
var attributes = require('./attributes');
var handleDomainDefaults = require('../../plots/domain').defaults;
var handleText = require('../bar/defaults').handleText;
var handleLabelsAndValues = require('../pie/defaults').handleLabelsAndValues;
var handleMarkerDefaults = require('../pie/defaults').handleMarkerDefaults;

module.exports = function supplyDefaults(traceIn, traceOut, defaultColor, layout) {
    function coerce(attr, dflt) {
        return Lib.coerce(traceIn, traceOut, attributes, attr, dflt);
    }

    var labels = coerce('labels');
    var values = coerce('values');

    var res = handleLabelsAndValues(labels, values);
    var len = res.len;
    traceOut._hasLabels = res.hasLabels;
    traceOut._hasValues = res.hasValues;

    if(!traceOut._hasLabels &&
        traceOut._hasValues
    ) {
        coerce('label0');
        coerce('dlabel');
    }

    if(!len) {
        traceOut.visible = false;
        return;
    }
    traceOut._length = len;

    handleMarkerDefaults(traceIn, traceOut, layout, coerce);

    coerce('scalegroup');

    var textData = coerce('text');
    var textTemplate = coerce('texttemplate');
    var textInfo;
    if(!textTemplate) textInfo = coerce('textinfo', Array.isArray(textData) ? 'text+percent' : 'percent');

    coerce('hovertext');
    coerce('hovertemplate');

    if(textTemplate || (textInfo && textInfo !== 'none')) {
        var textposition = coerce('textposition');
        handleText(traceIn, traceOut, layout, coerce, textposition, {
            moduleHasSelected: false,
            moduleHasUnselected: false,
            moduleHasConstrain: false,
            moduleHasCliponaxis: false,
            moduleHasTextangle: false,
            moduleHasInsideanchor: false
        });
    } else if(textInfo === 'none') {
        coerce('textposition', 'none');
    }

    handleDomainDefaults(traceOut, layout, coerce);

    var title = coerce('title.text');
    if(title) {
        coerce('title.position');
        Lib.coerceFont(coerce, 'title.font', layout.font);
    }

    coerce('aspectratio');
    coerce('baseratio');
};
