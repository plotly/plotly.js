/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Lib = require('../../../lib');
var lightColor = require('../../../components/color').lightColor;

var layoutAttributes = require('./axis_attributes');
var handleTickMarkDefaults = require('../../cartesian/tick_mark_defaults');

module.exports = function supplyLayoutDefaults(containerIn, containerOut, options) {

    function coerce(attr, dflt) {
        return Lib.coerce(containerIn, containerOut, layoutAttributes, attr, dflt);
    }

    function coerce2(attr, dflt) {
        return Lib.coerce2(containerIn, containerOut, layoutAttributes, attr, dflt);
    }

    containerOut.type = 'linear'; // no other types allowed for ternary

    var axName = containerOut._name;

    var dfltColor = coerce('color');

    coerce('title', 'Click to enter component ' +
        axName.charAt(0).toUpperCase() + ' title');
    Lib.coerceFont(coerce, 'titlefont', {
        family: options.font.family,
        size: Math.round(options.font.size * 1.2),
        color: dfltColor
    });

    // range is just set by 'min' - max is determined by the other axes mins
    coerce('min');

    coerce('nticks');

    handleTickMarkDefaults(containerIn, containerOut, coerce, 'linear',
        {outerticks: false});

    // TODO - below is a bit repetitious from cartesian still...

    var showTickLabels = coerce('showticklabels');
    if(showTickLabels) {
        Lib.coerceFont(coerce, 'tickfont', {
            family: options.font.family,
            size: options.font.size,
            color: containerOut.color
        });
        coerce('tickangle');
        coerce('tickformat');
    }

    coerce('hoverformat');

    var lineColor = coerce2('linecolor', dfltColor),
        lineWidth = coerce2('linewidth'),
        showLine = coerce('showline', !!lineColor || !!lineWidth);

    if(!showLine) {
        delete containerOut.linecolor;
        delete containerOut.linewidth;
    }

    // default grid color is darker here (backFraction 0.6, vs default 0.909)
    // because the grid is not square so the eye needs heavier cues to follow
    var gridColor = coerce2('gridcolor', lightColor(dfltColor, options.bgColor, 0.6)),
        gridWidth = coerce2('gridwidth'),
        showGridLines = coerce('showgrid', !!gridColor || !!gridWidth);

    if(!showGridLines) {
        delete containerOut.gridcolor;
        delete containerOut.gridwidth;
    }
};
