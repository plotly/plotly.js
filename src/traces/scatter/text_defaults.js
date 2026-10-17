'use strict';

var Lib = require('../../lib');

/*
 * opts: object of flags to control features not all text users support
 *   noSelect: caller does not support selected/unselected attribute containers
 */
module.exports = function(traceIn, traceOut, layout, coerce, opts) {
    opts = opts || {};

    var textposition = coerce('textposition');
    if (textposition === 'auto' || (Lib.isArrayOrTypedArray(textposition) && textposition.indexOf('auto') !== -1)) {
        coerce('textpriority');
    }
    Lib.coerceFont(coerce, 'textfont', opts.font || layout.font, opts);

    if(!opts.noSelect) {
        coerce('selected.textfont.color');
        coerce('unselected.textfont.color');
    }
};
