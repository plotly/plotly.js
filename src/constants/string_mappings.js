/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

// N.B. HTML entities are listed without the leading '&' and trailing ';'
// https://www.freeformatter.com/html-entities.html

// FWIW if we wanted to support the full set, it has 2261 entries:
// https://www.w3.org/TR/html5/entities.json
// though I notice that some of these are duplicates and/or are missing ";"
// eg: "&amp;", "&amp", "&AMP;", and "&AMP" all map to "&"
// We no longer need to include numeric entities here, these are now handled
// by String.fromCodePoint/fromCharCode in svg_text_utils
module.exports = {
    entityToUnicode: {
        mu: 'μ',
        amp: '&',
        lt: '<',
        gt: '>',
        nbsp: ' ',
        times: '×',
        plusmn: '±',
        deg: '°'
    }
};
