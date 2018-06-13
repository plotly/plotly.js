/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Lib = require('../../lib');
var layoutAttributes = require('./layout_attributes');

module.exports = function handleTickLabelDefaults(containerIn, containerOut, coerce, axType, options) {
    var showAttrDflt = getShowAttrDflt(containerIn);

    var tickPrefix = coerce('tickprefix');
    if(tickPrefix) coerce('showtickprefix', showAttrDflt);

    var tickSuffix = coerce('ticksuffix', options.tickSuffixDflt);
    if(tickSuffix) coerce('showticksuffix', showAttrDflt);

    var showTickLabels = coerce('showticklabels');
    if(showTickLabels) {
        var font = options.font || {};
        // as with titlefont.color, inherit axis.color only if one was
        // explicitly provided
        var dfltFontColor = (containerOut.color === containerIn.color) ?
            containerOut.color : font.color;
        Lib.coerceFont(coerce, 'tickfont', {
            family: font.family,
            size: font.size,
            color: dfltFontColor
        });
        var tickangle = coerce('tickangle');

        var tickLabelAlignment = coerce('ticklabelalignment');
        // if tickangle is not 90, set ticklabelalignment back to default "outside"
        if (tickangle !== 90 && tickangle !== 'auto') {
            containerOut['ticklabelalignment'] = 'outside';
        }

        if(axType !== 'category') {
            var tickFormat = coerce('tickformat');
            tickformatstopsDefaults(containerIn, containerOut);
            if(!tickFormat && axType !== 'date') {
                coerce('showexponent', showAttrDflt);
                coerce('exponentformat');
                coerce('separatethousands');
            }
        }
    }
};

/*
 * Attributes 'showexponent', 'showtickprefix' and 'showticksuffix'
 * share values.
 *
 * If only 1 attribute is set,
 * the remaining attributes inherit that value.
 *
 * If 2 attributes are set to the same value,
 * the remaining attribute inherits that value.
 *
 * If 2 attributes are set to different values,
 * the remaining is set to its dflt value.
 *
 */
function getShowAttrDflt(containerIn) {
    var showAttrsAll = ['showexponent',
            'showtickprefix',
            'showticksuffix'],
        showAttrs = showAttrsAll.filter(function(a) {
            return containerIn[a] !== undefined;
        }),
        sameVal = function(a) {
            return containerIn[a] === containerIn[showAttrs[0]];
        };

    if(showAttrs.every(sameVal) || showAttrs.length === 1) {
        return containerIn[showAttrs[0]];
    }
}

function tickformatstopsDefaults(tickformatIn, tickformatOut) {
    var valuesIn = tickformatIn.tickformatstops;
    var valuesOut = tickformatOut.tickformatstops = [];

    if(!Array.isArray(valuesIn)) return;

    var valueIn, valueOut;

    function coerce(attr, dflt) {
        return Lib.coerce(valueIn, valueOut, layoutAttributes.tickformatstops, attr, dflt);
    }

    for(var i = 0; i < valuesIn.length; i++) {
        valueIn = valuesIn[i];
        valueOut = {};

        coerce('dtickrange');
        coerce('value');

        valuesOut.push(valueOut);
    }
}
