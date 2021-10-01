'use strict';

var Lib = require('../../lib');
var Color = require('../../components/color');
var Template = require('../../plot_api/plot_template');

var handleSubplotDefaults = require('../subplot_defaults');
var getSubplotData = require('../get_data').getSubplotData;

var handlePrefixSuffixDefaults = require('../cartesian/prefix_suffix_defaults');
var handleTickLabelDefaults = require('../cartesian/tick_label_defaults');
var handleLineGridDefaults = require('../cartesian/line_grid_defaults');

var layoutAttributes = require('./layout_attributes');
var setConvert = require('./set_convert');
var constants = require('./constants');
var axisNames = constants.axisNames;

function handleDefaults(contIn, contOut, coerce, opts) {
    var bgColor = coerce('bgcolor');
    opts.bgColor = Color.combine(bgColor, opts.paper_bgcolor);

    // could optimize, subplotData is not always needed!
    var subplotData = getSubplotData(opts.fullData, constants.name, opts.id);
    var layoutOut = opts.layoutOut;
    var axName;

    function coerceAxis(attr, dflt) {
        return coerce(axName + '.' + attr, dflt);
    }

    for(var i = 0; i < axisNames.length; i++) {
        axName = axisNames[i];

        if(!Lib.isPlainObject(contIn[axName])) {
            contIn[axName] = {};
        }

        var axIn = contIn[axName];
        var axOut = Template.newContainer(contOut, axName);
        axOut._id = axOut._name = axName;
        axOut._attr = opts.id + '.' + axName;
        axOut._traceIndices = subplotData.map(function(t) { return t._expandedIndex; });

        var visible = coerceAxis('visible');

        axOut.type = 'linear';
        setConvert(axOut, contOut, layoutOut);

        var dfltColor;
        var dfltFontColor;

        if(visible) {
            dfltColor = coerceAxis('color');
            dfltFontColor = (dfltColor === axIn.color) ? dfltColor : opts.font.color;
        }

        // We don't want to make downstream code call ax.setScale,
        // as both real and imaginary axes don't have a set domain.
        // Furthermore, imaginary axes don't have a set range.
        //
        // Mocked domains and ranges are set by the smith subplot instances,
        // but Axes.findExtremes uses the sign of _m to determine which padding value
        // to use.
        //
        // By setting, _m to 1 here, we make Axes.findExtremes think that
        // range[1] > range[0], and vice-versa for `autorange: 'reversed'` below.
        axOut._m = 1;

        handlePrefixSuffixDefaults(axIn, axOut, coerceAxis, axOut.type);

        if(visible) {
            if(axName === 'realaxis') {
                coerceAxis('side');
            }

            coerceAxis('tickvals');

            handleTickLabelDefaults(axIn, axOut, coerceAxis, axOut.type);

            Lib.coerce2(contIn, contOut, layoutAttributes, axName + '.ticklen');
            Lib.coerce2(contIn, contOut, layoutAttributes, axName + '.tickwidth');
            Lib.coerce2(contIn, contOut, layoutAttributes, axName + '.tickcolor', contOut.color);
            var showTicks = coerceAxis('ticks');
            if(!showTicks) {
                delete contOut[axName].ticklen;
                delete contOut[axName].tickwidth;
                delete contOut[axName].tickcolor;
            }

            var showTickLabels = coerceAxis('showticklabels');
            if(showTickLabels) {
                Lib.coerceFont(coerceAxis, 'tickfont', {
                    family: opts.font.family,
                    size: opts.font.size,
                    color: dfltFontColor
                });
                coerceAxis('tickangle');
                coerceAxis('tickformat');
            }

            handleLineGridDefaults(axIn, axOut, coerceAxis, {
                dfltColor: dfltColor,
                bgColor: opts.bgColor,
                // default grid color is darker here (60%, vs cartesian default ~91%)
                // because the grid is not square so the eye needs heavier cues to follow
                blend: 60,
                showLine: true,
                showGrid: true,
                noZeroLine: true,
                attributes: layoutAttributes[axName]
            });

            coerceAxis('layer');
        }

        coerceAxis('hoverformat');

        delete axOut.type;

        axOut._input = axIn;
    }
}

module.exports = function supplyLayoutDefaults(layoutIn, layoutOut, fullData) {
    handleSubplotDefaults(layoutIn, layoutOut, fullData, {
        noUirevision: true,
        type: constants.name,
        attributes: layoutAttributes,
        handleDefaults: handleDefaults,
        font: layoutOut.font,
        paper_bgcolor: layoutOut.paper_bgcolor,
        fullData: fullData,
        layoutOut: layoutOut
    });
};
