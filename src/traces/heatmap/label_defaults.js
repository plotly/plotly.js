'use strict';

var Lib = require('../../lib');

module.exports = function handleHeatmapLabelDefaults(coerce, layout) {
    coerce('texttemplate');

    var fontDflt = Lib.extendFlat({}, layout.font);
    fontDflt.color = undefined; // color contrast by default
    Lib.coerceFont(coerce, 'textfont', fontDflt);
};
