/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';


module.exports = {
    step: {
        valType: 'enumerated',
        role: 'info',
        values: ['month', 'year', 'day', 'all'],
        dflt: 'month',
        description: [
            ''
        ].join(' ')
    },
    stepmode: {
        valType: 'enumerated',
        role: 'info',
        values: ['backward', 'to day'],
        dflt: 'backward',
        description: [
            ''
        ].join(' ')
    },
    count: {
        valType: 'number',
        role: 'info',
        dflt: 1,
        description: [
            ''
        ].join(' ')
    },
    label: {
        valType: 'string',
        role: 'info',
        description: ''
    }
};
