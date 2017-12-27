/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var colorMix = require('tinycolor2').mix;

var Lib = require('../../lib');
var Color = require('../../components/color');
var Plots = require('../plots');
var Registry = require('../../registry');
var handleSubplotDefaults = require('../subplot_defaults');

var handleTickValueDefaults = require('../cartesian/tick_value_defaults');
var handleTickMarkDefaults = require('../cartesian/tick_mark_defaults');
var handleTickLabelDefaults = require('../cartesian/tick_label_defaults');
var handleCategoryOrderDefaults = require('../cartesian/category_order_defaults');
var autoType = require('../cartesian/axis_autotype');
var orderedCategories = require('../cartesian/ordered_categories');
var setConvert = require('../cartesian/set_convert');

var setConvertAngular = require('./helpers').setConvertAngular;
var layoutAttributes = require('./layout_attributes');
var constants = require('./constants');
var axisNames = constants.axisNames;

function handleDefaults(contIn, contOut, coerce, opts) {
    var bgColor = coerce('bgcolor');
    opts.bgColor = Color.combine(bgColor, opts.paper_bgcolor);

    // TODO sanitize sector similar to 'range'
    var sector = coerce('sector');

    // could optimize, subplotData is not always needed!
    var subplotData = Plots.getSubplotData(opts.fullData, constants.name, opts.id);
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
        var axOut = contOut[axName] = {};
        axOut._id = axOut._name = axName;

        var dataAttr = constants.axisName2dataArray[axName];
        var axType = handleAxisTypeDefaults(axIn, axOut, coerceAxis, subplotData, dataAttr);

        handleCategoryOrderDefaults(axIn, axOut, coerceAxis);
        axOut._initialCategories = axType === 'category' ?
            orderedCategories(dataAttr, axOut.categoryorder, axOut.categoryarray, subplotData) :
            [];

        if(axType === 'date') {
            var handleCalendarDefaults = Registry.getComponentMethod('calendars', 'handleDefaults');
            handleCalendarDefaults(axIn, axOut, 'calendar', layoutOut.calendar);
        }

        coerceAxis('visible');

        setConvert(axOut, layoutOut);

        // We don't want to make downstream code call ax.setScale,
        // as both radial and angular axes don't have a set domain.
        // Furthermore, angular axes don't have a set range.
        //
        // Mocked domains and ranges are set by the polar subplot instances.
        // By setting, _m to 1 here, we make Axes.expand think that range[1] > range[0].
        axOut._m = 1;

        switch(axName) {
            case 'radialaxis':
                var autoRange = coerceAxis('autorange', !axOut.isValidRange(axIn.range));
                if(autoRange) coerceAxis('rangemode');

                coerceAxis('range');
                axOut.cleanRange('range', {dfltRange: [0, 1]});

                if(axOut.visible) {
                    coerceAxis('side');
                    coerceAxis('position', sector[0]);
                }
                break;
            case 'angularaxis':
                if(axType === 'linear') {
                    coerceAxis('thetaunit');
                } else {
                    coerceAxis('period');
                }

                // TODO maybe non-linear axis
                // should get direction: 'clockwise' + position: 90
                // by default??
                coerceAxis('direction');
                coerceAxis('position');

                setConvertAngular(axOut);
                break;
        }

        if(axOut.visible) {
            handleAxisStyleDefaults(axIn, axOut, coerceAxis, opts);
        }

        axOut._input = axIn;
    }
}

function handleAxisTypeDefaults(axIn, axOut, coerce, subplotData, dataAttr) {
    var axType = coerce('type');

    if(axType === '-') {
        var trace;

        for(var i = 0; i < subplotData.length; i++) {
            if(subplotData[i].visible) {
                trace = subplotData[i];
                break;
            }
        }

        // TODO add trace input calendar support
        if(trace) {
            axOut.type = autoType(trace[dataAttr], 'gregorian');
        }

        if(axOut.type === '-') {
            axOut.type = 'linear';
        } else {
            // copy autoType back to input axis
            // note that if this object didn't exist
            // in the input layout, we have to put it in
            // this happens in the main supplyDefaults function
            axIn.type = axOut.type;
        }
    }

    return axOut.type;
}

function handleAxisStyleDefaults(axIn, axOut, coerce, opts) {
    var dfltColor = coerce('color');
    var dfltFontColor = (dfltColor === axIn.color) ? dfltColor : opts.font.color;

    handleTickValueDefaults(axIn, axOut, coerce, axOut.type);
    handleTickLabelDefaults(axIn, axOut, coerce, axOut.type, {
        noHover: false,
        tickSuffixDflt: axOut.thetaunit === 'degrees' ? '°' : undefined
    });
    handleTickMarkDefaults(axIn, axOut, coerce, {outerTicks: true});

    var showTickLabels = coerce('showticklabels');
    if(showTickLabels) {
        Lib.coerceFont(coerce, 'tickfont', {
            family: opts.font.family,
            size: opts.font.size,
            color: dfltFontColor
        });
        coerce('tickangle');
        coerce('tickformat');
    }

    // TODO should use coerce2 pattern !!

    var showLine = coerce('showline');
    if(showLine) {
        coerce('linecolor', dfltColor);
        coerce('linewidth');
    }

    var showGridLines = coerce('showgrid');
    if(showGridLines) {
        // default grid color is darker here (60%, vs cartesian default ~91%)
        // because the grid is not square so the eye needs heavier cues to follow
        coerce('gridcolor', colorMix(dfltColor, opts.bgColor, 60).toRgbString());
        coerce('gridwidth');
    }

    coerce('layer');
}

module.exports = function supplyLayoutDefaults(layoutIn, layoutOut, fullData) {
    handleSubplotDefaults(layoutIn, layoutOut, fullData, {
        type: constants.name,
        attributes: layoutAttributes,
        handleDefaults: handleDefaults,
        font: layoutOut.font,
        paper_bgcolor: layoutOut.paper_bgcolor,
        fullData: fullData,
        layoutOut: layoutOut
    });
};
