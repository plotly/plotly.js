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

        var axIn = contIn[axName] || {};
        var axOut = contOut[axName] = {};
        axOut._name = axName;

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
        if(!axOut.visible) continue;

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
                axOut.cleanRange();

                coerceAxis('side');
                coerceAxis('position', sector[0]);
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

        handleAxisStyleDefaults(axIn, axOut, coerceAxis, opts);
        axOut._input = axIn;
    }
}

function handleAxisTypeDefaults(axIn, axOut, coerce, subplotData, dataAttr) {
    var axType = coerce('type');

    if(axType === '-') {
        var trace;

        for(var i = 0; i < subplotData.length; i++) {
            trace = subplotData[i];
            if(trace.visible) break;
        }

        // TODO add trace input calendar support
        axOut.type = autoType(trace[dataAttr], 'gregorian');

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

    coerce('hoverformat');

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
}

function setConvertAngular(ax) {
    var dir = {clockwise: -1, counterclockwise: 1}[ax.direction];
    var pos = Lib.deg2rad(ax.position);
    var _c2rad;
    var _rad2c;

    if(ax.type === 'linear') {
        _c2rad = function(v, unit) {
            if(unit === 'degrees') return Lib.deg2rad(v);
            return v;
        };
        _rad2c = function(v, unit) {
            if(unit === 'degrees') return Lib.rad2deg(v);
            return v;
        };
    }
    else if(ax.type === 'category') {
        _c2rad = function(v) {
            return v * 2 * Math.PI / ax._categories.length;
        };
        _rad2c = function(v) {
            return v * ax._categories.length / Math.PI / 2;
        };
    }
    else if(ax.type === 'date') {
        var period = ax.period || 365 * 24 * 60 * 60 * 1000;

        _c2rad = function(v) {
            return (v % period) * 2 * Math.PI / period;
        };
        _rad2c = function(v) {
            return v * period / Math.PI / 2;
        };
    }

    function transformRad(v) { return dir * v + pos; }
    function unTransformRad(v) { return (v - pos) / dir; }

    // use the shift 'sector' to get right tick labels for non-default
    // angularaxis 'position' and/or 'direction'
    ax.unTransformRad = unTransformRad;

    // this version is used on hover
    ax._c2rad = _c2rad;

    ax.c2rad = function(v, unit) { return transformRad(_c2rad(v, unit)); };
    ax.rad2c = function(v, unit) { return _rad2c(unTransformRad(v), unit); };

    ax.c2deg = function(v, unit) { return Lib.rad2deg(ax.c2rad(v, unit)); };
    ax.deg2c = function(v, unit) { return ax.rad2c(Lib.deg2rad(v), unit); };
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
