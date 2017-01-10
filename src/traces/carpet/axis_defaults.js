/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var axisAttributes = require('./attributes');
var extendFlat = require('../../lib/extend').extendFlat;
var setConvert = require('../../plots/cartesian/set_convert');
var Lib = require('../../lib');
var handleCartesianAxisDefaults = require('../../plots/cartesian/axis_defaults');

var isNumeric = require('fast-isnumeric');
var colorMix = require('tinycolor2').mix;

var Registry = require('../../registry');
var Lib = require('../../lib');
var lightFraction = require('../../components/color/attributes').lightFraction;

var layoutAttributes = require('../../plots/cartesian/layout_attributes');
var handleTickValueDefaults = require('../../plots/cartesian/tick_value_defaults');
var handleTickMarkDefaults = require('../../plots/cartesian/tick_mark_defaults');
var handleTickLabelDefaults = require('../../plots/cartesian/tick_label_defaults');
var handleCategoryOrderDefaults = require('../../plots/cartesian/category_order_defaults');
var setConvert = require('../../plots/cartesian/set_convert');
var orderedCategories = require('../../plots/cartesian/ordered_categories');
var axisIds = require('../../plots/cartesian/axis_ids');
var autoType = require('../../plots/cartesian/axis_autotype');


/*module.exports = function handleAxisDefaults(traceIn, traceOut, axis) {
    var i;

    function coerce(attr, dflt) {
        return Lib.coerce(traceIn, traceOut, attributes, axis + 'axis.' + attr, dflt);
    }

    coerce('type');
    coerce('smoothing');
    traceOut.smoothing = traceOut.smoothing ? 1 : 0;
    coerce('cheatertype');

    coerce('showlabels');
    coerce('labelprefix', axis + ' = ');
    coerce('labelsuffix');
    coerce('showlabelprefix');
    coerce('showlabelsuffix');

    coerce('tickmode');
    coerce('tick0');
    coerce('dtick');
    coerce('arraytick0');
    coerce('arraydtick');
    //coerce('gridoffset');
    //coerce('gridstep');

    coerce('gridwidth');
    coerce('gridcolor');

    coerce('startline');
    coerce('startlinewidth', traceOut.gridwidth);
    coerce('startlinecolor', traceOut.gridcolor);
    coerce('endline');
    coerce('endlinewidth', traceOut.gridwidth);
    coerce('endlinecolor', traceOut.gridwidth);

    coerce('minorgridcount');
    coerce('minorgridwidth');
    coerce('minorgridcolor');

    coerce('showstartlabel');
    coerce('showendlabel');

    coerce('labelpadding');

    // We'll never draw this. We just need a couple category management functions.
    var ax = traceOut[axis + 'axis'] = extendFlat(traceOut[axis + 'axis'] || {}, {
        range: [],
        domain: [],
        _id: axis,
    });
    setConvert(traceOut[axis + 'axis']);

    Lib.coerceFont(coerce, 'startlabelfont', {
        size: 12,
        color: ax.startlinecolor
    });

    Lib.coerceFont(coerce, 'endlabelfont', {
        size: 12,
        color: ax.endlinecolor
    });

    ax._hovertitle = axis;
}*/


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
        attributes = axisAttributes[letter + 'axis'],
        defaultTitle = 'Click to enter ' +
            (options.title || (letter.toUpperCase() + ' axis')) +
            ' title';

    function coerce(attr, dflt) {
        return Lib.coerce(containerIn, containerOut, attributes, attr, dflt);
    }

    // I don't know what this does:
    function coerce2(attr, dflt) {
        return Lib.coerce2(containerIn, containerOut, attributes, attr, dflt);
    }

    // set up some private properties
    if(options.name) {
        containerOut._name = options.name;
        containerOut._id = options.name;
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

    coerce('smoothing');
    containerOut.smoothing = containerOut.smoothing ? 1 : 0;
    coerce('cheatertype');

    coerce('showlabels');
    coerce('labelprefix', letter + ' = ');
    coerce('labelsuffix');
    coerce('showlabelprefix');
    coerce('showlabelsuffix');

    coerce('tickmode');
    coerce('tick0');
    coerce('dtick');
    coerce('arraytick0');
    coerce('arraydtick');
    //coerce('gridoffset');
    //coerce('gridstep');

    coerce('gridwidth');
    coerce('gridcolor');

    coerce('startline');
    coerce('startlinewidth', containerOut.gridwidth);
    coerce('startlinecolor', containerOut.gridcolor);
    coerce('endline');
    coerce('endlinewidth', containerOut.gridwidth);
    coerce('endlinecolor', containerOut.gridwidth);

    coerce('minorgridcount');
    coerce('minorgridwidth');
    coerce('minorgridcolor');

    coerce('showstartlabel');
    coerce('showendlabel');

    coerce('labelpadding');

    // We'll never draw this. We just need a couple category management functions.
    Lib.coerceFont(coerce, 'startlabelfont', {
        size: 12,
        color: containerOut.startlinecolor
    });

    Lib.coerceFont(coerce, 'endlabelfont', {
        size: 12,
        color: containerOut.endlinecolor
    });

    containerOut._hovertitle = letter;







    if(axType === 'date') {
        var handleCalendarDefaults = Registry.getComponentMethod('calendars', 'handleDefaults');
        handleCalendarDefaults(containerIn, containerOut, 'calendar', options.calendar);
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
        isNumeric(containerOut.r2l(containerIn.range[0])) &&
        isNumeric(containerOut.r2l(containerIn.range[1]))
    );
    var autoRange = coerce('autorange', !validRange);

    if(autoRange) coerce('rangemode');

    coerce('range');
    containerOut.cleanRange();

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

    var calAttr = axLetter + 'calendar',
        calendar = ax[calAttr];

    ax.type = autoType(data, calendar);
}
