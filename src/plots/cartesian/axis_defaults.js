/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Registry = require('../../registry');
var Lib = require('../../lib');

var layoutAttributes = require('./layout_attributes');
var handleTickValueDefaults = require('./tick_value_defaults');
var handleTickMarkDefaults = require('./tick_mark_defaults');
var handleTickLabelDefaults = require('./tick_label_defaults');
var handleCategoryOrderDefaults = require('./category_order_defaults');
var handleLineGridDefaults = require('./line_grid_defaults');
var setConvert = require('./set_convert');

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
    var letter = options.letter;
    var id = containerOut._id;
    var font = options.font || {};

    var visible = coerce('visible', !options.cheateronly);

    var axType = containerOut.type;

    if(axType === 'date') {
        var handleCalendarDefaults = Registry.getComponentMethod('calendars', 'handleDefaults');
        handleCalendarDefaults(containerIn, containerOut, 'calendar', options.calendar);
    }

    setConvert(containerOut, layoutOut);

    var autoRange = coerce('autorange', !containerOut.isValidRange(containerIn.range));

    // both x and y axes may need autorange done just for the range slider's purposes
    // the logic is complicated to figure this out later, particularly for y axes since
    // the settings can be spread out in the x axes... so instead we'll collect them
    // during supplyDefaults
    containerOut._rangesliderAutorange = false;

    if(autoRange) coerce('rangemode');

    coerce('range');
    containerOut.cleanRange();

    handleCategoryOrderDefaults(containerIn, containerOut, coerce, options);

    if(axType !== 'category' && !options.noHover) coerce('hoverformat');

    if(!visible) return containerOut;

    var dfltColor = coerce('color');
    // if axis.color was provided, use it for fonts too; otherwise,
    // inherit from global font color in case that was provided.
    // Compare to dflt rather than to containerIn, so we can provide color via
    // template too.
    var dfltFontColor = (dfltColor !== layoutAttributes.color.dflt) ? dfltColor : font.color;
    // try to get default title from splom trace, fallback to graph-wide value
    var dfltTitle = ((layoutOut._splomAxes || {})[letter] || {})[id] || layoutOut._dfltTitle[letter];

    coerce('title', dfltTitle);
    Lib.coerceFont(coerce, 'titlefont', {
        family: font.family,
        size: Math.round(font.size * 1.2),
        color: dfltFontColor
    });

    handleTickValueDefaults(containerIn, containerOut, coerce, axType);
    handleTickLabelDefaults(containerIn, containerOut, coerce, axType, options);
    handleTickMarkDefaults(containerIn, containerOut, coerce, options);
    handleLineGridDefaults(containerIn, containerOut, coerce, {
        dfltColor: dfltColor,
        bgColor: options.bgColor,
        showGrid: options.showGrid,
        attributes: layoutAttributes
    });

    if(containerOut.showline || containerOut.ticks) coerce('mirror');

    if(options.automargin) coerce('automargin');

    return containerOut;
};
