/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Lib = require('../../lib');


/**
 * options: inherits font, outerTicks, noHover from axes.handleAxisDefaults
 */
module.exports = function handleTickLabelDefaults(containerIn, containerOut, coerce, axType, options) {
    var showAttrDflt = getShowAttrDflt(containerIn);

    var tickPrefix = coerce('tickprefix');
    if(tickPrefix) coerce('showtickprefix', showAttrDflt);

    var tickSuffix = coerce('ticksuffix');
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
        coerce('tickangle');

        if(axType !== 'category') {
            var tickFormat = coerce('tickformat');
            if(!tickFormat && axType !== 'date') {
                coerce('showexponent', showAttrDflt);
                coerce('exponentformat');
                coerce('separatethousands');
            }
        }
    }

    if(axType !== 'category' && !options.noHover) coerce('hoverformat');
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
