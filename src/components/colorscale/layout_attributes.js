/**
 * Copyright 2012-2018, Plotly, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */


'use strict';

var scales = require('./scales');

module.exports = {
    editType: 'calc',
    sequential: {
        valType: 'colorscale',
        dflt: scales.Reds,
        role: 'style',
        editType: 'calc',
        description: 'Sets the default sequential colorscale for positive values.'
    },
    sequentialminus: {
        valType: 'colorscale',
        dflt: scales.Blues,
        role: 'style',
        editType: 'calc',
        description: 'Sets the default sequential colorscale for negative values.'
    },
    diverging: {
        valType: 'colorscale',
        dflt: scales.RdBu,
        role: 'style',
        editType: 'calc',
        description: 'Sets the default diverging colorscale.'
    }
};
