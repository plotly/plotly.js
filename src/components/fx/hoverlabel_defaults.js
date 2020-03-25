/**
* Copyright 2012-2020, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Lib = require('../../lib');
var isUnifiedHover = require('./helpers').isUnifiedHover;

module.exports = function handleHoverLabelDefaults(contIn, contOut, coerce, opts) {
    opts = opts || {};

    // In unified hover, inherit from legend if available
    if(contIn && isUnifiedHover(contIn.hovermode)) {
        if(!opts.bgcolor && contIn.legend) opts.bgcolor = contIn.legend.bgcolor;
        // Merge in decreasing order of importance layout.font, layout.legend.font and hoverlabel.font
        opts.font = Lib.extendFlat({}, contIn.font, contIn.legend ? contIn.legend.font : {}, opts.font);
    }

    coerce('hoverlabel.bgcolor', opts.bgcolor);
    coerce('hoverlabel.bordercolor', opts.bordercolor);
    coerce('hoverlabel.namelength', opts.namelength);
    Lib.coerceFont(coerce, 'hoverlabel.font', opts.font);
    coerce('hoverlabel.align', opts.align);
};
