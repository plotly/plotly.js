'use strict';

var Lib = require('../../lib');

module.exports = function handleLabelDefaults(coerce, layout, lineColor, opts) {
    if(!opts) opts = {};
    var showLabels = coerce('contours.showlabels');
    if(showLabels) {
        var globalFont = layout.font;
        Lib.coerceFont(coerce, 'contours.labelfont', {
            weight: globalFont.weight,
            style: globalFont.style,
            variant: globalFont.variant,
            family: globalFont.family,
            size: globalFont.size,
            color: lineColor
        });
        coerce('contours.labelformat');
    }

    if(opts.hasHover !== false) coerce('zhoverformat');
};
