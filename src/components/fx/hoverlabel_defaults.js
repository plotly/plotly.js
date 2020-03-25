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

    function inheritFontAttr(attr) {
        if(!opts.font[attr]) {
            if(contIn.legend && contIn.legend.font && contIn.legend.font[attr]) {
                opts.font[attr] = contIn.legend.font[attr];
            } else if(contIn.font && contIn.font[attr]) {
                opts.font[attr] = contIn.font[attr];
            }
        }
    }

    // In unified hover, inherit from legend if available
    if(contIn && isUnifiedHover(contIn.hovermode)) {
        if(!opts.font) opts.font = {};
        inheritFontAttr('size');
        inheritFontAttr('family');
        inheritFontAttr('color');

        if(!opts.bgcolor && contIn.legend && contIn.legend.bgcolor) opts.bgcolor = contIn.legend.bgcolor;
        if(!opts.bordercolor && contIn.legend && contIn.legend.bordercolor) opts.bordercolor = contIn.legend.bordercolor;
    }

    coerce('hoverlabel.bgcolor', opts.bgcolor);
    coerce('hoverlabel.bordercolor', opts.bordercolor);
    coerce('hoverlabel.namelength', opts.namelength);
    Lib.coerceFont(coerce, 'hoverlabel.font', opts.font);
    coerce('hoverlabel.align', opts.align);
};
