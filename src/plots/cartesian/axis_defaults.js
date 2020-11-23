/**
* Copyright 2012-2020, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var isNumeric = require('fast-isnumeric');

var Registry = require('../../registry');
var Lib = require('../../lib');

var handleArrayContainerDefaults = require('../array_container_defaults');

var layoutAttributes = require('./layout_attributes');
var handleTickValueDefaults = require('./tick_value_defaults');
var handleTickMarkDefaults = require('./tick_mark_defaults');
var handleTickLabelDefaults = require('./tick_label_defaults');
var handleCategoryOrderDefaults = require('./category_order_defaults');
var handleLineGridDefaults = require('./line_grid_defaults');
var setConvert = require('./set_convert');

var DAY_OF_WEEK = require('./constants').WEEKDAY_PATTERN;
var HOUR = require('./constants').HOUR_PATTERN;

/**
 * options: object containing:
 *
 *  letter: 'x' or 'y'
 *  title: name of the axis (ie 'Colorbar') to go in default title
 *  font: the default font to inherit
 *  outerTicks: boolean, should ticks default to outside?
 *  showGrid: boolean, should gridlines be shown by default?
 *  noHover: boolean, this axis doesn't support hover effects?
 *  noTickson: boolean, this axis doesn't support 'tickson'
 *  data: the plot data, used to manage categories
 *  bgColor: the plot background color, to calculate default gridline colors
 *  calendar:
 *  splomStash:
 *  visibleDflt: boolean
 *  reverseDflt: boolean
 *  automargin: boolean
 */
module.exports = function handleAxisDefaults(containerIn, containerOut, coerce, options, layoutOut) {
    var letter = options.letter;
    var font = options.font || {};
    var splomStash = options.splomStash || {};

    var visible = coerce('visible', !options.visibleDflt);

    var axTemplate = containerOut._template || {};
    var axType = containerOut.type || axTemplate.type || '-';

    var ticklabelmode;
    if(axType === 'date') {
        var handleCalendarDefaults = Registry.getComponentMethod('calendars', 'handleDefaults');
        handleCalendarDefaults(containerIn, containerOut, 'calendar', options.calendar);

        if(!options.noTicklabelmode) {
            ticklabelmode = coerce('ticklabelmode');
        }
    }

    if(!options.noTicklabelposition || axType === 'multicategory') {
        Lib.coerce(containerIn, containerOut, {
            ticklabelposition: {
                valType: 'enumerated',
                dflt: 'outside',
                values: ticklabelmode === 'period' ? ['outside', 'inside'] :
                letter === 'x' ? [
                    'outside', 'inside',
                    'outside left', 'inside left',
                    'outside right', 'inside right'
                ] : [
                    'outside', 'inside',
                    'outside top', 'inside top',
                    'outside bottom', 'inside bottom'
                ]
            }
        }, 'ticklabelposition');
    }

    setConvert(containerOut, layoutOut);

    var autorangeDflt = !containerOut.isValidRange(containerIn.range);
    if(autorangeDflt && options.reverseDflt) autorangeDflt = 'reversed';
    var autoRange = coerce('autorange', autorangeDflt);
    if(autoRange && (axType === 'linear' || axType === '-')) coerce('rangemode');

    coerce('range');
    containerOut.cleanRange();

    handleCategoryOrderDefaults(containerIn, containerOut, coerce, options);

    if(axType !== 'category' && !options.noHover) coerce('hoverformat');

    var dfltColor = coerce('color');
    // if axis.color was provided, use it for fonts too; otherwise,
    // inherit from global font color in case that was provided.
    // Compare to dflt rather than to containerIn, so we can provide color via
    // template too.
    var dfltFontColor = (dfltColor !== layoutAttributes.color.dflt) ? dfltColor : font.color;
    // try to get default title from splom trace, fallback to graph-wide value
    var dfltTitle = splomStash.label || layoutOut._dfltTitle[letter];

    handleTickLabelDefaults(containerIn, containerOut, coerce, axType, options, {pass: 1});
    if(!visible) return containerOut;

    coerce('title.text', dfltTitle);
    Lib.coerceFont(coerce, 'title.font', {
        family: font.family,
        size: Math.round(font.size * 1.2),
        color: dfltFontColor
    });

    handleTickValueDefaults(containerIn, containerOut, coerce, axType);
    handleTickLabelDefaults(containerIn, containerOut, coerce, axType, options, {pass: 2});
    handleTickMarkDefaults(containerIn, containerOut, coerce, options);
    handleLineGridDefaults(containerIn, containerOut, coerce, {
        dfltColor: dfltColor,
        bgColor: options.bgColor,
        showGrid: options.showGrid,
        attributes: layoutAttributes
    });

    if(containerOut.showline || containerOut.ticks) coerce('mirror');

    if(options.automargin) coerce('automargin');

    var isMultiCategory = axType === 'multicategory';

    if(!options.noTickson &&
        (axType === 'category' || isMultiCategory) &&
        (containerOut.ticks || containerOut.showgrid)
    ) {
        var ticksonDflt;
        if(isMultiCategory) ticksonDflt = 'boundaries';
        var tickson = coerce('tickson', ticksonDflt);
        if(tickson === 'boundaries') {
            delete containerOut.ticklabelposition;
        }
    }

    if(isMultiCategory) {
        var showDividers = coerce('showdividers');
        if(showDividers) {
            coerce('dividercolor');
            coerce('dividerwidth');
        }
    }

    if(axType === 'date') {
        handleArrayContainerDefaults(containerIn, containerOut, {
            name: 'rangebreaks',
            inclusionAttr: 'enabled',
            handleItemDefaults: rangebreaksDefaults
        });

        if(!containerOut.rangebreaks.length) {
            delete containerOut.rangebreaks;
        } else {
            for(var k = 0; k < containerOut.rangebreaks.length; k++) {
                if(containerOut.rangebreaks[k].pattern === DAY_OF_WEEK) {
                    containerOut._hasDayOfWeekBreaks = true;
                    break;
                }
            }

            setConvert(containerOut, layoutOut);

            if(layoutOut._has('scattergl') || layoutOut._has('splom')) {
                for(var i = 0; i < options.data.length; i++) {
                    var trace = options.data[i];
                    if(trace.type === 'scattergl' || trace.type === 'splom') {
                        trace.visible = false;
                        Lib.warn(trace.type +
                            ' traces do not work on axes with rangebreaks.' +
                            ' Setting trace ' + trace.index + ' to `visible: false`.');
                    }
                }
            }
        }
    }

    return containerOut;
};

function rangebreaksDefaults(itemIn, itemOut, containerOut) {
    function coerce(attr, dflt) {
        return Lib.coerce(itemIn, itemOut, layoutAttributes.rangebreaks, attr, dflt);
    }

    var enabled = coerce('enabled');

    if(enabled) {
        var bnds = coerce('bounds');
        if(bnds && bnds.length >= 2) {
            var dfltPattern = '';
            var i, q;
            if(bnds.length === 2) {
                for(i = 0; i < 2; i++) {
                    q = indexOfDay(bnds[i]);
                    if(q) {
                        dfltPattern = DAY_OF_WEEK;
                        break;
                    }
                }
            }
            var pattern = coerce('pattern', dfltPattern);
            if(pattern === DAY_OF_WEEK) {
                for(i = 0; i < 2; i++) {
                    q = indexOfDay(bnds[i]);
                    if(q) {
                        // convert to integers i.e 'Sunday' --> 0
                        itemOut.bounds[i] = bnds[i] = q - 1;
                    }
                }
            }
            if(pattern) {
                // ensure types and ranges
                for(i = 0; i < 2; i++) {
                    q = bnds[i];
                    switch(pattern) {
                        case DAY_OF_WEEK :
                            if(!isNumeric(q)) {
                                itemOut.enabled = false;
                                return;
                            }
                            q = +q;

                            if(
                                q !== Math.floor(q) || // don't accept fractional days for mow
                                q < 0 || q >= 7
                            ) {
                                itemOut.enabled = false;
                                return;
                            }
                            // use number
                            itemOut.bounds[i] = bnds[i] = q;
                            break;

                        case HOUR :
                            if(!isNumeric(q)) {
                                itemOut.enabled = false;
                                return;
                            }
                            q = +q;

                            if(q < 0 || q > 24) { // accept 24
                                itemOut.enabled = false;
                                return;
                            }
                            // use number
                            itemOut.bounds[i] = bnds[i] = q;
                            break;
                    }
                }
            }

            if(containerOut.autorange === false) {
                var rng = containerOut.range;

                // if bounds are bigger than the (set) range, disable break
                if(rng[0] < rng[1]) {
                    if(bnds[0] < rng[0] && bnds[1] > rng[1]) {
                        itemOut.enabled = false;
                        return;
                    }
                } else if(bnds[0] > rng[0] && bnds[1] < rng[1]) {
                    itemOut.enabled = false;
                    return;
                }
            }
        } else {
            var values = coerce('values');

            if(values && values.length) {
                coerce('dvalue');
            } else {
                itemOut.enabled = false;
                return;
            }
        }
    }
}

// these numbers are one more than what bounds would be mapped to
var dayStrToNum = {
    sun: 1,
    mon: 2,
    tue: 3,
    wed: 4,
    thu: 5,
    fri: 6,
    sat: 7
};

function indexOfDay(v) {
    if(typeof v !== 'string') return;
    return dayStrToNum[
        v.substr(0, 3).toLowerCase()
    ];
}
