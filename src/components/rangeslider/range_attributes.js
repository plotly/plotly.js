/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

module.exports = {
    rangemode: {
        valType: 'enumerated',
        values: ['auto', 'fixed', 'match'],
        dflt: 'auto',
        role: 'style',
        editType: 'calc',
        description: [
            'Determines whether or not the range of this axis in',
            'the rangeslider use the same value than in the main plot',
            'when zooming in/out.',
            'If *auto*, the autorange will be used.',
            'If *fixed*, the `rangesliderrange` is used.',
            'If *match*, the current range is used.'
        ].join(' ')
    },
    range: {
        valType: 'info_array',
        role: 'style',
        items: [
            {valType: 'any', editType: 'calc'},
            {valType: 'any', editType: 'calc'}
        ],
        editType: 'calc',
        description: [
            'Sets the range of this axis for the rangeslider.'
        ].join(' ')
    },
    editType: 'calc'
};
