'use strict';

var Lib = require('../../lib');
var contrast = require('../../components/color').contrast;
var layoutAttributes = require('./layout_attributes');
var handleArrayContainerDefaults = require('../array_container_defaults');

module.exports = function handleTickLabelDefaults(containerIn, containerOut, coerce, axType, options, config) {
    if(!config || config.pass === 1) {
        handlePrefixSuffix(containerIn, containerOut, coerce, axType, options);
    }

    if(!config || config.pass === 2) {
        handleOtherDefaults(containerIn, containerOut, coerce, axType, options);
    }
};

function handlePrefixSuffix(containerIn, containerOut, coerce, axType, options) {
    var showAttrDflt = getShowAttrDflt(containerIn);

    var tickPrefix = coerce('tickprefix');
    if(tickPrefix) coerce('showtickprefix', showAttrDflt);

    var tickSuffix = coerce('ticksuffix', options.tickSuffixDflt);
    if(tickSuffix) coerce('showticksuffix', showAttrDflt);
}

function handleOtherDefaults(containerIn, containerOut, coerce, axType, options) {
    var showAttrDflt = getShowAttrDflt(containerIn);

    var tickPrefix = coerce('tickprefix');
    if(tickPrefix) coerce('showtickprefix', showAttrDflt);

    var tickSuffix = coerce('ticksuffix', options.tickSuffixDflt);
    if(tickSuffix) coerce('showticksuffix', showAttrDflt);

    var showTickLabels = coerce('showticklabels');
    if(showTickLabels) {
        var font = options.font || {};
        var contColor = containerOut.color;
        var position = containerOut.ticklabelposition || '';
        var dfltFontColor = position.indexOf('inside') !== -1 ?
            contrast(options.bgColor) :
            // as with titlefont.color, inherit axis.color only if one was
            // explicitly provided
            (contColor && contColor !== layoutAttributes.color.dflt) ?
            contColor : font.color;

        Lib.coerceFont(coerce, 'tickfont', {
            family: font.family,
            size: font.size,
            color: dfltFontColor
        });
        coerce('tickangle');

        if(axType !== 'category') {
            var tickFormat = coerce('tickformat');

            handleArrayContainerDefaults(containerIn, containerOut, {
                name: 'tickformatstops',
                inclusionAttr: 'enabled',
                handleItemDefaults: tickformatstopDefaults
            });
            if(!containerOut.tickformatstops.length) {
                delete containerOut.tickformatstops;
            }

            if(!tickFormat && axType !== 'date') {
                coerce('showexponent', showAttrDflt);
                coerce('exponentformat');
                coerce('minexponent');
                coerce('separatethousands');
            }
        }
    }
}

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
    var showAttrsAll = ['showexponent', 'showtickprefix', 'showticksuffix'];
    var showAttrs = showAttrsAll.filter(function(a) {
        return containerIn[a] !== undefined;
    });
    var sameVal = function(a) {
        return containerIn[a] === containerIn[showAttrs[0]];
    };

    if(showAttrs.every(sameVal) || showAttrs.length === 1) {
        return containerIn[showAttrs[0]];
    }
}

function tickformatstopDefaults(valueIn, valueOut) {
    function coerce(attr, dflt) {
        return Lib.coerce(valueIn, valueOut, layoutAttributes.tickformatstops, attr, dflt);
    }

    var enabled = coerce('enabled');
    if(enabled) {
        coerce('dtickrange');
        coerce('value');
    }
}
