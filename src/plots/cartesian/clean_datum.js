/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var isNumeric = require('fast-isnumeric');

var Lib = require('../../lib');


/**
 * cleanDatum: removes characters
 * same replace criteria used in the grid.js:scrapeCol
 * but also handling dates, numbers, and NaN, null, Infinity etc
 */
module.exports = function cleanDatum(c) {
    try {
        if(typeof c === 'object' && c !== null && c.getTime) {
            return Lib.ms2DateTime(c);
        }
        if(typeof c !== 'string' && !isNumeric(c)) {
            return '';
        }
        c = c.toString().replace(/['"%,$# ]/g, '');
    }
    catch(e) {
        console.log(e, c);
    }

    return c;
};
