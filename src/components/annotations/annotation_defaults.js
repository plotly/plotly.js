/**
* Copyright 2012-2017, Plotly, Inc.
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


module.exports = function handleAnnotationDefaults(annIn, annOut, fullLayout, opts, itemOpts) {
    opts = opts || {};
    itemOpts = itemOpts || {};

    function coerce(attr, dflt) {
        return Lib.coerce(annIn, annOut, attributes, attr, dflt);
    }

    var visible = coerce('visible', !itemOpts.itemIsNotPlainObject);
    var clickToShow = coerce('clicktoshow');

    if(!(visible || clickToShow)) return annOut;

    coerce('opacity');
    coerce('align');
    coerce('bgcolor');

    var borderColor = coerce('bordercolor'),
        borderOpacity = Color.opacity(borderColor);

    coerce('borderpad');

    var borderWidth = coerce('borderwidth');
    var showArrow = coerce('showarrow');

    coerce('text', showArrow ? ' ' : 'new text');
    coerce('textangle');
    Lib.coerceFont(coerce, 'font', fullLayout.font);

    // positioning
    var axLetters = ['x', 'y'],
        arrowPosDflt = [-10, -30],
        gdMock = {_fullLayout: fullLayout};
    for(var i = 0; i < 2; i++) {
        var axLetter = axLetters[i];

        // xref, yref
        var axRef = Axes.coerceRef(annIn, annOut, gdMock, axLetter, '', 'paper');

        // x, y
        Axes.coercePosition(annOut, gdMock, coerce, axRef, axLetter, 0.5);

        if(showArrow) {
            var arrowPosAttr = 'a' + axLetter,
                // axref, ayref
                aaxRef = Axes.coerceRef(annIn, annOut, gdMock, arrowPosAttr, 'pixel');

            // for now the arrow can only be on the same axis or specified as pixels
            // TODO: sometime it might be interesting to allow it to be on *any* axis
            // but that would require updates to drawing & autorange code and maybe more
            if(aaxRef !== 'pixel' && aaxRef !== axRef) {
                aaxRef = annOut[arrowPosAttr] = 'pixel';
            }

            // ax, ay
            var aDflt = (aaxRef === 'pixel') ? arrowPosDflt[i] : 0.4;
            Axes.coercePosition(annOut, gdMock, coerce, aaxRef, arrowPosAttr, aDflt);
        }

        // xanchor, yanchor
        coerce(axLetter + 'anchor');
    }

    // if you have one coordinate you should have both
    Lib.noneOrAll(annIn, annOut, ['x', 'y']);

    if(showArrow) {
        coerce('arrowcolor', borderOpacity ? annOut.bordercolor : Color.defaultLine);
        coerce('arrowhead');
        coerce('arrowsize');
        coerce('arrowwidth', ((borderOpacity && borderWidth) || 1) * 2);
        coerce('standoff');

        // if you have one part of arrow length you should have both
        Lib.noneOrAll(annIn, annOut, ['ax', 'ay']);
    }

    if(clickToShow) {
        var xClick = coerce('xclick');
        var yClick = coerce('yclick');

        // put the actual click data to bind to into private attributes
        // so we don't have to do this little bit of logic on every hover event
        annOut._xclick = (xClick === undefined) ? annOut.x : xClick;
        annOut._yclick = (yClick === undefined) ? annOut.y : yClick;
    }

    return annOut;
};
