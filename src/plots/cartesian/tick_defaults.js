/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Lib = require('../../lib');

var layoutAttributes = require('./layout_attributes');


/**
 * options: inherits font, outerTicks, noHover from axes.handleAxisDefaults
 */
module.exports = function handleTickDefaults(containerIn, containerOut, coerce, axType, options) {
    var tickLen = Lib.coerce2(containerIn, containerOut, layoutAttributes, 'ticklen'),
        tickWidth = Lib.coerce2(containerIn, containerOut, layoutAttributes, 'tickwidth'),
        tickColor = Lib.coerce2(containerIn, containerOut, layoutAttributes, 'tickcolor'),
        showTicks = coerce('ticks', (options.outerTicks || tickLen || tickWidth || tickColor) ? 'outside' : '');

    if(!showTicks) {
        delete containerOut.ticklen;
        delete containerOut.tickwidth;
        delete containerOut.tickcolor;
    }

    var showTickLabels = coerce('showticklabels');
    if(showTickLabels) {
        Lib.coerceFont(coerce, 'tickfont', options.font || {});
        coerce('tickangle');

        var showAttrDflt = getShowAttrDflt(containerIn);

        if(axType !== 'category') {
            var tickFormat = coerce('tickformat');
            if(!options.noHover) coerce('hoverformat');

            if(!tickFormat && axType !== 'date') {
                coerce('showexponent', showAttrDflt);

                var expBase = coerce('exponentbase'),
                    expFmtDflt = coerce('exponentformat');

                if (expBase !== 2 && expBase !== 10) expFmtDflt = 'power';
                if (expBase === 2 && expFmtDflt !== 'SI') expFmtDflt = 'power';
                if (expBase === 'e'){
                    containerOut.exponentbase = Math.E;
                    containerOut.type = 'log';
                }

                containerOut.exponentformat = expFmtDflt;
            }
        }

        var tickPrefix = coerce('tickprefix');
        if(tickPrefix) coerce('showtickprefix', showAttrDflt);

        var tickSuffix = coerce('ticksuffix');
        if(tickSuffix) coerce('showticksuffix', showAttrDflt);
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
        showAttrs = showAttrsAll.filter(function(a){
            return containerIn[a]!==undefined;
        }),
        sameVal = function(a){
            return containerIn[a]===containerIn[showAttrs[0]];
        };
    if (showAttrs.every(sameVal) || showAttrs.length===1) {
        return containerIn[showAttrs[0]];
    }
}
