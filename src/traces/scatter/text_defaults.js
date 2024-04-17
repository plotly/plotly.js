'use strict';

var Lib = require('../../lib');

/*
 * opts: object of flags to control features not all text users support
 *   noSelect: caller does not support selected/unselected attribute containers
 */
module.exports = function(traceIn, traceOut, layout, coerce, opts) {
    opts = opts || {};

    coerce('textposition');
    Lib.coerceFont(coerce, 'textfont', opts.font || layout.font, {
        noWeight: opts.noFontWeight,
        noStyle: opts.noFontStyle,
        noVariant: opts.noFontVariant
    });

    if(!opts.noSelect) {
        coerce('selected.textfont.color');
        coerce('unselected.textfont.color');
    }
};
