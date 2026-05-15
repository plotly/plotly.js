'use strict';

var isNumeric = require('fast-isnumeric');
var Lib = require('../../lib');
var attributes = require('./attributes');
var handleDomainDefaults = require('../../plots/domain').defaults;
var handleText = require('../bar/defaults').handleText;
var coercePattern = require('../../lib').coercePattern;

function handleLabelsAndValues(labels, values) {
    var hasLabels = Lib.isArrayOrTypedArray(labels);
    var hasValues = Lib.isArrayOrTypedArray(values);
    var len = Math.min(hasLabels ? labels.length : Infinity, hasValues ? values.length : Infinity);

    if (!isFinite(len)) len = 0;

    if (len && hasValues) {
        var hasPositive;
        for (var i = 0; i < len; i++) {
            var v = values[i];
            if (isNumeric(v) && v > 0) {
                hasPositive = true;
                break;
            }
        }
        if (!hasPositive) len = 0;
    }

    return {
        hasLabels: hasLabels,
        hasValues: hasValues,
        len: len
    };
}

function handleMarkerDefaults(traceIn, traceOut, layout, coerce, isPie) {
    var lineWidth = coerce('marker.line.width');
    if (lineWidth) {
        coerce(
            'marker.line.color',
            isPie ? undefined : layout.paper_bgcolor // case of funnelarea, sunburst, icicle, treemap
        );
    }

    var markerColors = coerce('marker.colors');
    coercePattern(coerce, 'marker.pattern', markerColors);
    // push the marker colors (with s) to the foreground colors, to work around logic in the drawing pattern code on marker.color (without s, which is okay for a bar trace)
    if (traceIn.marker && !traceOut.marker.pattern.fgcolor) traceOut.marker.pattern.fgcolor = traceIn.marker.colors;
    if (!traceOut.marker.pattern.bgcolor) traceOut.marker.pattern.bgcolor = layout.paper_bgcolor;
}

function supplyDefaults(traceIn, traceOut, defaultColor, layout) {
    function coerce(attr, dflt) {
        return Lib.coerce(traceIn, traceOut, attributes, attr, dflt);
    }

    var labels = coerce('labels');
    var values = coerce('values');

    var res = handleLabelsAndValues(labels, values);
    var len = res.len;
    traceOut._hasLabels = res.hasLabels;
    traceOut._hasValues = res.hasValues;

    if (!traceOut._hasLabels && traceOut._hasValues) {
        coerce('label0');
        coerce('dlabel');
    }

    if (!len) {
        traceOut.visible = false;
        return;
    }
    traceOut._length = len;

    handleMarkerDefaults(traceIn, traceOut, layout, coerce, true);

    coerce('scalegroup');
    // TODO: hole needs to be coerced to the same value within a scaleegroup

    var textData = coerce('text');
    var textTemplate = coerce('texttemplate');
    coerce('texttemplatefallback');
    var textInfo;
    if (!textTemplate) textInfo = coerce('textinfo', Lib.isArrayOrTypedArray(textData) ? 'text+percent' : 'percent');

    coerce('hovertext');
    coerce('hovertemplate');
    coerce('hovertemplatefallback');

    if (textTemplate || (textInfo && textInfo !== 'none')) {
        var textposition = coerce('textposition');
        handleText(traceIn, traceOut, layout, coerce, textposition, {
            moduleHasSelected: false,
            moduleHasUnselected: false,
            moduleHasConstrain: false,
            moduleHasCliponaxis: false,
            moduleHasTextangle: false,
            moduleHasInsideanchor: false
        });

        var hasBoth = Array.isArray(textposition) || textposition === 'auto';
        var hasOutside = hasBoth || textposition === 'outside';
        if (hasOutside) {
            coerce('automargin');
        }

        if (textposition === 'inside' || textposition === 'auto' || Array.isArray(textposition)) {
            coerce('insidetextorientation');
        }
    } else if (textInfo === 'none') {
        coerce('textposition', 'none');
    }

    handleDomainDefaults(traceOut, layout, coerce);

    var hole = coerce('hole');
    var title = coerce('title.text');
    if (title) {
        var titlePosition = coerce('title.position', hole ? 'middle center' : 'top center');
        if (!hole && titlePosition === 'middle center') traceOut.title.position = 'top center';
        Lib.coerceFont(coerce, 'title.font', layout.font);
    }

    coerce('sort');
    coerce('direction');
    coerce('rotation');
    coerce('pull');
}

module.exports = {
    handleLabelsAndValues: handleLabelsAndValues,
    handleMarkerDefaults: handleMarkerDefaults,
    supplyDefaults: supplyDefaults
};
