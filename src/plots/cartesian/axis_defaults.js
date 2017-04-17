/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var colorMix = require('tinycolor2').mix;

var Registry = require('../../registry');
var Lib = require('../../lib');
var lightFraction = require('../../components/color/attributes').lightFraction;

var layoutAttributes = require('./layout_attributes');
var handleTickValueDefaults = require('./tick_value_defaults');
var handleTickMarkDefaults = require('./tick_mark_defaults');
var handleTickLabelDefaults = require('./tick_label_defaults');
var handleCategoryOrderDefaults = require('./category_order_defaults');
var setConvert = require('./set_convert');
var orderedCategories = require('./ordered_categories');


/**
 * options: object containing:
 *
 *  letter: 'x' or 'y'
 *  title: name of the axis (ie 'Colorbar') to go in default title
 *  font: the default font to inherit
 *  outerTicks: boolean, should ticks default to outside?
 *  showGrid: boolean, should gridlines be shown by default?
 *  noHover: boolean, this axis doesn't support hover effects?
 *  data: the plot data, used to manage categories
 *  bgColor: the plot background color, to calculate default gridline colors
 */
module.exports = function handleAxisDefaults(containerIn, containerOut, coerce, options, layoutOut) {
    var letter = options.letter,
        font = options.font || {},
        defaultTitle = 'Click to enter ' +
            (options.title || (letter.toUpperCase() + ' axis')) +
            ' title';

    function coerce2(attr, dflt) {
        return Lib.coerce2(containerIn, containerOut, layoutAttributes, attr, dflt);
    }

    var visible = coerce('visible', !options.cheateronly);

    var axType = containerOut.type;

    if(axType === 'date') {
        var handleCalendarDefaults = Registry.getComponentMethod('calendars', 'handleDefaults');
        handleCalendarDefaults(containerIn, containerOut, 'calendar', options.calendar);
    }

    setConvert(containerOut, layoutOut);

    var autoRange = coerce('autorange', !containerOut.isValidRange(containerIn.range));

    if(autoRange) coerce('rangemode');

    coerce('range');
    containerOut.cleanRange();

    handleCategoryOrderDefaults(containerIn, containerOut, coerce);
    containerOut._initialCategories = axType === 'category' ?
        orderedCategories(letter, containerOut.categoryorder, containerOut.categoryarray, options.data) :
        [];

    if(!visible) return containerOut;

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

    handleTickValueDefaults(containerIn, containerOut, coerce, axType);
    handleTickLabelDefaults(containerIn, containerOut, coerce, axType, options);
    handleTickMarkDefaults(containerIn, containerOut, coerce, options);

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

    return containerOut;
};
