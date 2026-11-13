'use strict';

const Lib = require('../../lib');

/*
 * opts: object of flags to control features not all text users support
 *   noSelect: caller does not support selected/unselected attribute containers
 *   noAutoPosition: caller has no *auto* textposition, so no textrank
 */
module.exports = (traceIn, traceOut, layout, coerce, opts = {}) => {
    const textposition = coerce('textposition');
    // An array can hold *auto* even where `textposition` does not accept it, because its items are not checked
    const hasAuto = textposition === 'auto' || (Lib.isArrayOrTypedArray(textposition) && textposition.includes('auto'));
    if (hasAuto && !opts.noAutoPosition) coerce('textrank');
    Lib.coerceFont(coerce, 'textfont', opts.font || layout.font, opts);

    if (!opts.noSelect) {
        coerce('selected.textfont.color');
        coerce('unselected.textfont.color');
    }
};
