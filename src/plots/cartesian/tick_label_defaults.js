'use strict';

var Lib = require('../../lib');
var contrast = require('../../components/color').contrast;
var layoutAttributes = require('./layout_attributes');
var getShowAttrDflt = require('./show_dflt');
var handleArrayContainerDefaults = require('../array_container_defaults');

module.exports = function handleTickLabelDefaults(containerIn, containerOut, coerce, axType, options) {
    if(!options) options = {};

    var labelalias = coerce('labelalias');
    if(!Lib.isPlainObject(labelalias)) delete containerOut.labelalias;

    var showAttrDflt = getShowAttrDflt(containerIn);

    var showTickLabels = coerce('showticklabels');
    if(showTickLabels) {
        if(!options.noTicklabelshift) {
            coerce('ticklabelshift');
        }
        if(!options.noTicklabelstandoff) {
            coerce('ticklabelstandoff');
        }
        var font = options.font || {};
        var contColor = containerOut.color;
        var position = containerOut.ticklabelposition || '';
        var dfltFontColor = position.indexOf('inside') !== -1 ?
            contrast(options.bgColor) :
            // as with titlefont.color, inherit axis.color only if one was
            // explicitly provided
            (contColor && contColor !== layoutAttributes.color.dflt) ?
            contColor : font.color;

        Lib.coerceFont(coerce, 'tickfont', font, { overrideDflt: {
            color: dfltFontColor
        }});

        if(
            !options.noTicklabelstep &&
            axType !== 'multicategory' &&
            axType !== 'log'
        ) {
            coerce('ticklabelstep');
        }

        if(!options.noAng) {
            var tickAngle = coerce('tickangle');
            if(!options.noAutotickangles && tickAngle === 'auto') {
                coerce('autotickangles');
            }
        }

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

            if(!options.noExp && !tickFormat && axType !== 'date') {
                coerce('showexponent', showAttrDflt);
                coerce('exponentformat');
                coerce('minexponent');
                coerce('separatethousands');
            }
        }
    }
};

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
