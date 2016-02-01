/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Lib = require('../../lib');
var handleTickValueDefaults = require('../../plots/cartesian/tick_value_defaults');
var handleTickDefaults = require('../../plots/cartesian/tick_defaults');

var attributes = require('./attributes');


module.exports = function colorbarDefaults(containerIn, containerOut, layout) {
    var colorbarOut = containerOut.colorbar = {},
        colorbarIn = containerIn.colorbar || {};

    function coerce(attr, dflt) {
        return Lib.coerce(colorbarIn, colorbarOut, attributes, attr, dflt);
    }

    var thicknessmode = coerce('thicknessmode');
    coerce('thickness', (thicknessmode === 'fraction') ?
        30 / (layout.width - layout.margin.l - layout.margin.r) :
        30
    );

    var lenmode = coerce('lenmode');
    coerce('len', (lenmode === 'fraction') ?
        1 :
        layout.height - layout.margin.t - layout.margin.b
    );

    coerce('x');
    coerce('xanchor');
    coerce('xpad');
    coerce('y');
    coerce('yanchor');
    coerce('ypad');
    Lib.noneOrAll(colorbarIn, colorbarOut, ['x', 'y']);

    coerce('outlinecolor');
    coerce('outlinewidth');
    coerce('bordercolor');
    coerce('borderwidth');
    coerce('bgcolor');

    handleTickValueDefaults(colorbarIn, colorbarOut, coerce, 'linear');

    handleTickDefaults(colorbarIn, colorbarOut, coerce, 'linear',
        {outerTicks: false, font: layout.font, noHover: true});

    coerce('title');
    Lib.coerceFont(coerce, 'titlefont', layout.font);
    coerce('titleside');
};
