/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var toSuperScript = require('superscript-text');
var stringMappings = require('../constants/string_mappings');

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

function fixEntities(x) {
    var entityToUnicode = stringMappings.entityToUnicode;
    var idx = 0;

    while((idx = x.indexOf('&', idx)) >= 0) {
        var nidx = x.indexOf(';', idx);
        if(nidx < idx) {
            idx += 1;
            continue;
        }

        var entity = entityToUnicode[x.slice(idx + 1, nidx)];
        if(entity) {
            x = x.slice(0, idx) + entity + x.slice(nidx + 1);
        } else {
            x = x.slice(0, idx) + x.slice(nidx + 1);
        }
    }

    return x;
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
