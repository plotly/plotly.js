'use strict';

var Lib = require('../../lib');

module.exports = function handleLabelDefaults(coerce, layout, lineColor, opts) {
    if(!opts) opts = {};
    var showLabels = coerce('contours.showlabels');
    if(showLabels) {
        var globalFont = layout.font;
        Lib.coerceFont(coerce, 'contours.labelfont', globalFont, { overrideDflt: {
            color: lineColor
        }});
        coerce('contours.labelformat');
    }

    if(opts.hasHover !== false) coerce('zhoverformat');
};
