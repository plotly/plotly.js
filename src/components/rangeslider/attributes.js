/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var colorAttributes = require('../color/attributes');

module.exports = {
    bgcolor: {
        valType: 'color',
        dflt: colorAttributes.background,
        role: 'style',
        description: 'Sets the background color of the range slider.'
    },
    bordercolor: {
        valType: 'color',
        dflt: colorAttributes.defaultLine,
        role: 'style',
        description: 'Sets the border color of the range slider.'
    },
    borderwidth: {
        valType: 'integer',
        dflt: 0,
        role: 'style',
        description: 'Sets the border color of the range slider.'
    },
    thickness: {
        valType: 'number',
        dflt: 0.15,
        min: 0,
        max: 1,
        role: 'style',
        description: [
            'The height of the range slider as a fraction of the',
            'total plot area height.'
        ].join(' ')
    },
    visible: {
        valType: 'boolean',
        dflt: true,
        description: 'Determines whether or not the range slider will be visible.'
    }
};
