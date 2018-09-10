/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Lib = require('../../../lib');
var layoutAttributes = require('./axis_attributes');
var handleTickLabelDefaults = require('../../cartesian/tick_label_defaults');
var handleTickMarkDefaults = require('../../cartesian/tick_mark_defaults');
var handleTickValueDefaults = require('../../cartesian/tick_value_defaults');
var handleLineGridDefaults = require('../../cartesian/line_grid_defaults');

module.exports = function supplyLayoutDefaults(containerIn, containerOut, options) {
    function coerce(attr, dflt) {
        return Lib.coerce(containerIn, containerOut, layoutAttributes, attr, dflt);
    }

    containerOut.type = 'linear'; // no other types allowed for ternary

    var dfltColor = coerce('color');
    // if axis.color was provided, use it for fonts too; otherwise,
    // inherit from global font color in case that was provided.
    var dfltFontColor = (dfltColor !== layoutAttributes.color.dflt) ? dfltColor : options.font.color;

    var axName = containerOut._name,
        letterUpper = axName.charAt(0).toUpperCase(),
        dfltTitle = 'Component ' + letterUpper;

    var title = coerce('title', dfltTitle);
    containerOut._hovertitle = title === dfltTitle ? title : letterUpper;

    Lib.coerceFont(coerce, 'titlefont', {
        family: options.font.family,
        size: Math.round(options.font.size * 1.2),
        color: dfltFontColor
    });

    // range is just set by 'min' - max is determined by the other axes mins
    coerce('min');

    handleTickValueDefaults(containerIn, containerOut, coerce, 'linear');
    handleTickLabelDefaults(containerIn, containerOut, coerce, 'linear', {});
    handleTickMarkDefaults(containerIn, containerOut, coerce,
        { outerTicks: true });

    var showTickLabels = coerce('showticklabels');
    if(showTickLabels) {
        Lib.coerceFont(coerce, 'tickfont', {
            family: options.font.family,
            size: options.font.size,
            color: dfltFontColor
        });
        coerce('tickangle');
        coerce('tickformat');
    }

    handleLineGridDefaults(containerIn, containerOut, coerce, {
        dfltColor: dfltColor,
        bgColor: options.bgColor,
        // default grid color is darker here (60%, vs cartesian default ~91%)
        // because the grid is not square so the eye needs heavier cues to follow
        blend: 60,
        showLine: true,
        showGrid: true,
        noZeroLine: true,
        attributes: layoutAttributes
    });

    coerce('hoverformat');
    coerce('layer');
};
