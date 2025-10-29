'use strict';

var Lib = require('../../lib');

module.exports = function handleHeatmapLabelDefaults(coerce, layout) {
    coerce('texttemplate');
    coerce('texttemplatefallback');

    var fontDflt = Lib.extendFlat({}, layout.font, {
        color: 'auto',
        size: 'auto'
    });
    Lib.coerceFont(coerce, 'textfont', fontDflt);
};
