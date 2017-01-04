/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

// N.B. HTML entities are listed without the leading '&' and trailing ';'

module.exports = {

    entityToUnicode: {
        'mu': 'μ',
        'amp': '&',
        'lt': '<',
        'gt': '>',
        'nbsp': ' ',
        'times': '×',
        'plusmn': '±',
        'deg': '°'
    },

    unicodeToEntity: {
        '&': 'amp',
        '<': 'lt',
        '>': 'gt',
        '"': 'quot',
        '\'': '#x27',
        '\/': '#x2F'
    }

};
