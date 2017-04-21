/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var extendFlat = require('../../lib/extend').extendFlat;
var fontAttrs = require('../../plots/font_attributes');

module.exports = {
    hoverlabel: {
        bgcolor: {
            valType: 'color',
            role: 'style',
            arrayOk: true,
            description: [
                'Sets the background color of the hover labels for this trace'
            ].join(' ')
        },
        bordercolor: {
            valType: 'color',
            role: 'style',
            arrayOk: true,
            description: [
                'Sets the border color of the hover labels for this trace.'
            ].join(' ')
        },
        font: {
            family: extendFlat({}, fontAttrs.family, { arrayOk: true }),
            size: extendFlat({}, fontAttrs.size, { arrayOk: true }),
            color: extendFlat({}, fontAttrs.color, { arrayOk: true })
        }
    }
};
