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
        if(!opts.bordercolor && contIn.legend) opts.bordercolor = contIn.legend.bordercolor;
        // Merge in decreasing order of importance layout.font, layout.legend.font and hoverlabel.font

        var l = contIn.legend;
        if(!opts.font) opts.font = {};
        if(!opts.font.size) opts.font.size = l && l.size ? l.size : contIn.font.size;
        if(!opts.font.family) opts.font.family = l && l.family ? l.family : contIn.font.family;
        if(!opts.font.color) opts.font.color = l && l.color ? l.color : contIn.font.color;
    }

    coerce('hoverlabel.bgcolor', opts.bgcolor);
    coerce('hoverlabel.bordercolor', opts.bordercolor);
    coerce('hoverlabel.namelength', opts.namelength);
    Lib.coerceFont(coerce, 'hoverlabel.font', opts.font);
    coerce('hoverlabel.align', opts.align);
};
