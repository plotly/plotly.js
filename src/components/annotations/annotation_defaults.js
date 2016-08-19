/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Lib = require('../../lib');
var Color = require('../color');
var Axes = require('../../plots/cartesian/axes');

var attributes = require('./attributes');


module.exports = function handleAnnotationDefaults(annIn, fullLayout) {
    var annOut = {};

    function coerce(attr, dflt) {
        return Lib.coerce(annIn, annOut, attributes, attr, dflt);
    }

    coerce('opacity');
    coerce('align');
    coerce('bgcolor');

    var borderColor = coerce('bordercolor'),
        borderOpacity = Color.opacity(borderColor);

    coerce('borderpad');

    var borderWidth = coerce('borderwidth');
    var showArrow = coerce('showarrow');

    if(showArrow) {
        coerce('arrowcolor', borderOpacity ? annOut.bordercolor : Color.defaultLine);
        coerce('arrowhead');
        coerce('arrowsize');
        coerce('arrowwidth', ((borderOpacity && borderWidth) || 1) * 2);
        coerce('ax');
        coerce('ay');
        coerce('axref');
        coerce('ayref');

        // if you have one part of arrow length you should have both
        Lib.noneOrAll(annIn, annOut, ['ax', 'ay']);
    }

    coerce('text', showArrow ? ' ' : 'new text');
    coerce('textangle');
    Lib.coerceFont(coerce, 'font', fullLayout.font);

    // positioning
    var axLetters = ['x', 'y'];
    for(var i = 0; i < 2; i++) {
        var axLetter = axLetters[i],
            tdMock = {_fullLayout: fullLayout};

        // xref, yref
        var axRef = Axes.coerceRef(annIn, annOut, tdMock, axLetter);

        // TODO: should be refactored in conjunction with Axes axref, ayref
        var aaxRef = Axes.coerceARef(annIn, annOut, tdMock, axLetter);

        // x, y
        var defaultPosition = 0.5;
        if(axRef !== 'paper') {
            var ax = Axes.getFromId(tdMock, axRef);
            defaultPosition = ax.range[0] + defaultPosition * (ax.range[1] - ax.range[0]);

            // convert date or category strings to numbers
            if(['date', 'category'].indexOf(ax.type) !== -1 &&
                    typeof annIn[axLetter] === 'string') {
                var newval;
                if(ax.type === 'date') {
                    newval = Lib.dateTime2ms(annIn[axLetter]);
                    if(newval !== false) annIn[axLetter] = newval;

                    if(aaxRef === axRef) {
                        var newvalB = Lib.dateTime2ms(annIn['a' + axLetter]);
                        if(newvalB !== false) annIn['a' + axLetter] = newvalB;
                    }
                }
                else if((ax._categories || []).length) {
                    newval = ax._categories.indexOf(annIn[axLetter]);
                    if(newval !== -1) annIn[axLetter] = newval;
                }
            }
        }
        coerce(axLetter, defaultPosition);

        // xanchor, yanchor
        if(!showArrow) coerce(axLetter + 'anchor');
    }

    // if you have one coordinate you should have both
    Lib.noneOrAll(annIn, annOut, ['x', 'y']);

    return annOut;
};
