/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

// N.B. HTML entities are listed without the leading '&' and trailing ';'
// https://www.freeformatter.com/html-entities.html

module.exports = {
    entityToUnicode: {
        'mu': 'μ',
        '#956': 'μ',

        'amp': '&',
        '#28': '&',

        'lt': '<',
        '#60': '<',

        'gt': '>',
        '#62': '>',

        'nbsp': ' ',
        '#160': ' ',

        'times': '×',
        '#215': '×',

        'plusmn': '±',
        '#177': '±',

        'deg': '°',
        '#176': '°'
    }
};
