/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';


module.exports = {
    visible: {
        valType: 'boolean',
        dflt: false,
        description: 'Determines whether or not the range slider will be visible.'
    },
    bordercolor: {
        valType: 'color',
        dflt: 'transparent',
        role: 'style',
        description: 'Sets the border color of the range slider.'
    },
    borderwidth: {
        valType: 'integer',
        dflt: 1,
        role: 'style',
        description: 'Sets the border color of the range slider.'
    },
    backgroundcolor: {
        valType: 'color',
        dflt: '#ffffff',
        role: 'style',
        description: 'Sets the background color of the range slider.'
    },
    initialrange: {
        valType: 'data_array',
        description: 'The starting range of the range slider, in data coordinates.'
    },
    height: {
        valType: 'number',
        dflt: 0.05,
        min: 0,
        max: 1,
        role: 'style',
        description: [
            'The height of the range slider as a fraction of the',
            'total plot height.'
        ].join(' ')
    }
};
