/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var isNumeric = require('fast-isnumeric');
var colorMix = require('tinycolor2').mix;

var Lib = require('../../lib');
var Plots = require('../plots');
var lightFraction = require('../../components/color/attributes').lightFraction;

var layoutAttributes = require('./layout_attributes');
var handleTickValueDefaults = require('./tick_value_defaults');
var handleTickMarkDefaults = require('./tick_mark_defaults');
var handleTickLabelDefaults = require('./tick_label_defaults');
var handleCategoryOrderDefaults = require('./category_order_defaults');
var setConvert = require('./set_convert');
var orderedCategories = require('./ordered_categories');
var cleanDatum = require('./clean_datum');
var axisIds = require('./axis_ids');


/**
 * options: object containing:
 *
 *  letter: 'x' or 'y'
 *  title: name of the axis (ie 'Colorbar') to go in default title
 *  name: axis object name (ie 'xaxis') if one should be stored
 *  font: the default font to inherit
 *  outerTicks: boolean, should ticks default to outside?
 *  showGrid: boolean, should gridlines be shown by default?
 *  noHover: boolean, this axis doesn't support hover effects?
 *  data: the plot data to use in choosing auto type
 *  bgColor: the plot background color, to calculate default gridline colors
 */
module.exports = function handleAxisDefaults(containerIn, containerOut, coerce, options) {
    var letter = options.letter,
        font = options.font || {},
        defaultTitle = 'Click to enter ' +
            (options.title || (letter.toUpperCase() + ' axis')) +
            ' title';

    function coerce2(attr, dflt) {
        return Lib.coerce2(containerIn, containerOut, layoutAttributes, attr, dflt);
    }

    // set up some private properties
    if(options.name) {
        containerOut._name = options.name;
        containerOut._id = axisIds.name2id(options.name);
    }

    // now figure out type and do some more initialization
    var axType = coerce('type');
    if(axType === '-') {
        setAutoType(containerOut, options.data);

        if(containerOut.type === '-') {
            containerOut.type = 'linear';
        }
        else {
            // copy autoType back to input axis
            // note that if this object didn't exist
            // in the input layout, we have to put it in
            // this happens in the main supplyDefaults function
            axType = containerIn.type = containerOut.type;
        }
    }

    setConvert(containerOut);

    var dfltColor = coerce('color');
    // if axis.color was provided, use it for fonts too; otherwise,
    // inherit from global font color in case that was provided.
    var dfltFontColor = (dfltColor === containerIn.color) ? dfltColor : font.color;

    coerce('title', defaultTitle);
    Lib.coerceFont(coerce, 'titlefont', {
        family: font.family,
        size: Math.round(font.size * 1.2),
        color: dfltFontColor
    });

    var validRange = (
        (containerIn.range || []).length === 2 &&
        isNumeric(containerIn.range[0]) &&
        isNumeric(containerIn.range[1])
    );
    var autoRange = coerce('autorange', !validRange);

    if(autoRange) coerce('rangemode');
    var range = coerce('range', [-1, letter === 'x' ? 6 : 4]);
    if(range[0] === range[1]) {
        containerOut.range = [range[0] - 1, range[0] + 1];
    }
    Lib.noneOrAll(containerIn.range, containerOut.range, [0, 1]);

    coerce('fixedrange');

    handleTickValueDefaults(containerIn, containerOut, coerce, axType);
    handleTickLabelDefaults(containerIn, containerOut, coerce, axType, options);
    handleTickMarkDefaults(containerIn, containerOut, coerce, options);
    handleCategoryOrderDefaults(containerIn, containerOut, coerce);

    var lineColor = coerce2('linecolor', dfltColor),
        lineWidth = coerce2('linewidth'),
        showLine = coerce('showline', !!lineColor || !!lineWidth);

    if(!showLine) {
        delete containerOut.linecolor;
        delete containerOut.linewidth;
    }

    if(showLine || containerOut.ticks) coerce('mirror');

    var gridColor = coerce2('gridcolor', colorMix(dfltColor, options.bgColor, lightFraction).toRgbString()),
        gridWidth = coerce2('gridwidth'),
        showGridLines = coerce('showgrid', options.showGrid || !!gridColor || !!gridWidth);

    if(!showGridLines) {
        delete containerOut.gridcolor;
        delete containerOut.gridwidth;
    }

    var zeroLineColor = coerce2('zerolinecolor', dfltColor),
        zeroLineWidth = coerce2('zerolinewidth'),
        showZeroLine = coerce('zeroline', options.showGrid || !!zeroLineColor || !!zeroLineWidth);

    if(!showZeroLine) {
        delete containerOut.zerolinecolor;
        delete containerOut.zerolinewidth;
    }

    // fill in categories
    containerOut._initialCategories = axType === 'category' ?
        orderedCategories(letter, containerOut.categoryorder, containerOut.categoryarray, options.data) :
        [];

    return containerOut;
};

function setAutoType(ax, data) {
    // new logic: let people specify any type they want,
    // only autotype if type is '-'
    if(ax.type !== '-') return;

    var id = ax._id,
        axLetter = id.charAt(0);

    // support 3d
    if(id.indexOf('scene') !== -1) id = axLetter;

    var d0 = getFirstNonEmptyTrace(data, id, axLetter);
    if(!d0) return;

    // first check for histograms, as the count direction
    // should always default to a linear axis
    if(d0.type === 'histogram' &&
            axLetter === {v: 'y', h: 'x'}[d0.orientation || 'v']) {
        ax.type = 'linear';
        return;
    }

    // check all boxes on this x axis to see
    // if they're dates, numbers, or categories
    if(isBoxWithoutPositionCoords(d0, axLetter)) {
        var posLetter = getBoxPosLetter(d0),
            boxPositions = [],
            trace;

        for(var i = 0; i < data.length; i++) {
            trace = data[i];
            if(!Plots.traceIs(trace, 'box') ||
               (trace[axLetter + 'axis'] || axLetter) !== id) continue;

            if(trace[posLetter] !== undefined) boxPositions.push(trace[posLetter][0]);
            else if(trace.name !== undefined) boxPositions.push(trace.name);
            else boxPositions.push('text');
        }

        ax.type = autoType(boxPositions);
    }
    else {
        ax.type = autoType(d0[axLetter] || [d0[axLetter + '0']]);
    }
}

function getBoxPosLetter(trace) {
    return {v: 'x', h: 'y'}[trace.orientation || 'v'];
}

function isBoxWithoutPositionCoords(trace, axLetter) {
    var posLetter = getBoxPosLetter(trace);

    return (
        Plots.traceIs(trace, 'box') &&
        axLetter === posLetter &&
        trace[posLetter] === undefined &&
        trace[posLetter + '0'] === undefined
    );
}

function autoType(array) {
    if(moreDates(array)) return 'date';
    if(category(array)) return 'category';
    if(linearOK(array)) return 'linear';
    else return '-';
}

function getFirstNonEmptyTrace(data, id, axLetter) {
    for(var i = 0; i < data.length; i++) {
        var trace = data[i];

        if((trace[axLetter + 'axis'] || axLetter) === id) {
            if(isBoxWithoutPositionCoords(trace, axLetter)) {
                return trace;
            }
            else if((trace[axLetter] || []).length || trace[axLetter + '0']) {
                return trace;
            }
        }
    }
}

// is there at least one number in array? If not, we should leave
// ax.type empty so it can be autoset later
function linearOK(array) {
    if(!array) return false;

    for(var i = 0; i < array.length; i++) {
        if(isNumeric(array[i])) return true;
    }

    return false;
}

// does the array a have mostly dates rather than numbers?
// note: some values can be neither (such as blanks, text)
// 2- or 4-digit integers can be both, so require twice as many
// dates as non-dates, to exclude cases with mostly 2 & 4 digit
// numbers and a few dates
function moreDates(a) {
    var dcnt = 0,
        ncnt = 0,
        // test at most 1000 points, evenly spaced
        inc = Math.max(1, (a.length - 1) / 1000),
        ai;

    for(var i = 0; i < a.length; i += inc) {
        ai = a[Math.round(i)];
        if(Lib.isDateTime(ai)) dcnt += 1;
        if(isNumeric(ai)) ncnt += 1;
    }

    return (dcnt > ncnt * 2);
}

// are the (x,y)-values in td.data mostly text?
// require twice as many categories as numbers
function category(a) {
    // test at most 1000 points
    var inc = Math.max(1, (a.length - 1) / 1000),
        curvenums = 0,
        curvecats = 0,
        ai;

    for(var i = 0; i < a.length; i += inc) {
        ai = cleanDatum(a[Math.round(i)]);
        if(isNumeric(ai)) curvenums++;
        else if(typeof ai === 'string' && ai !== '' && ai !== 'None') curvecats++;
    }

    return curvecats > curvenums * 2;
}
