/**
* Copyright 2012-2020, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Lib = require('../../lib');
var Color = require('../color');
var isUnifiedHover = require('./helpers').isUnifiedHover;

module.exports = function handleHoverLabelDefaults(contIn, contOut, coerce, opts) {
    opts = opts || {};

    function inheritFontAttr(attr) {
        if(!opts.font[attr]) {
            opts.font[attr] = contOut.legend ? contOut.legend.font[attr] : contOut.font[attr];
        }
    }

    // In unified hover, inherit from layout.legend if available or layout
    if(contOut && isUnifiedHover(contOut.hovermode)) {
        if(!opts.font) opts.font = {};
        inheritFontAttr('size');
        inheritFontAttr('family');
        inheritFontAttr('color');

        if(contOut.legend) {
            if(!opts.bgcolor) opts.bgcolor = Color.combine(contOut.legend.bgcolor, contOut.paper_bgcolor);
            if(!opts.bordercolor) opts.bordercolor = contOut.legend.bordercolor;
        } else {
            if(!opts.bgcolor) opts.bgcolor = contOut.paper_bgcolor;
        }
    }

    coerce('hoverlabel.bgcolor', opts.bgcolor);
    coerce('hoverlabel.bordercolor', opts.bordercolor);
    coerce('hoverlabel.namelength', opts.namelength);
    Lib.coerceFont(coerce, 'hoverlabel.font', opts.font);
    coerce('hoverlabel.align', opts.align);
};
