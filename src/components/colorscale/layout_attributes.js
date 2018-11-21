/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var msg = 'Note that `autocolorscale` must be true for this attribute to work.';
module.exports = {
    editType: 'calc',
    sequential: {
        valType: 'colorscale',
        dflt: 'Reds',
        role: 'style',
        editType: 'calc',
        description: [
            'Sets the default sequential colorscale for positive values.',
            msg
        ].join(' ')
    },
    sequentialminus: {
        valType: 'colorscale',
        dflt: 'Blues',
        role: 'style',
        editType: 'calc',
        description: [
            'Sets the default sequential colorscale for negative values.',
            msg
        ].join(' ')
    },
    diverging: {
        valType: 'colorscale',
        dflt: 'RdBu',
        role: 'style',
        editType: 'calc',
        description: [
            'Sets the default diverging colorscale.',
            msg
        ].join(' ')
    }
};
