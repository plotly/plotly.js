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
        values: ['month', 'year', 'day', 'hour', 'minute', 'second', 'all'],
        dflt: 'month',
        description: [
            'The unit of measurement that the `count` value will set the range by.'
        ].join(' ')
    },
    stepmode: {
        valType: 'enumerated',
        role: 'info',
        values: ['backward', 'to date'],
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
