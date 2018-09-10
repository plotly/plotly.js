/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var toSuperScript = require('superscript-text');
var fixEntities = require('./svg_text_utils').convertEntities;

function fixSuperScript(x) {
    var idx = 0;

    while((idx = x.indexOf('<sup>', idx)) >= 0) {
        var nidx = x.indexOf('</sup>', idx);
        if(nidx < idx) break;

        x = x.slice(0, idx) + toSuperScript(x.slice(idx + 5, nidx)) + x.slice(nidx + 6);
    }

    return x;
}

function fixBR(x) {
    return x.replace(/\<br\>/g, '\n');
}

function stripTags(x) {
    return x.replace(/\<.*\>/g, '');
}

function convertHTMLToUnicode(html) {
    return '' +
        fixEntities(
        stripTags(
        fixSuperScript(
        fixBR(
          html))));
}

module.exports = convertHTMLToUnicode;
