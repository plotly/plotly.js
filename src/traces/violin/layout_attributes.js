/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var boxLayoutAttrs = require('../box/layout_attributes');
var extendFlat = require('../../lib').extendFlat;

module.exports = {
    violinmode: extendFlat({}, boxLayoutAttrs.boxmode, {
        description: [
            'Determines how violins at the same location coordinate',
            'are displayed on the graph.',
            'If *group*, the violins are plotted next to one another',
            'centered around the shared location.',
            'If *overlay*, the violins are plotted over one another,',
            'you might need to set *opacity* to see them multiple violins.'
        ].join(' ')
    }),
    violingap: extendFlat({}, boxLayoutAttrs.boxgap, {
        description: [
            'Sets the gap (in plot fraction) between violins of',
            'adjacent location coordinates.'
        ].join(' ')
    }),
    violingroupgap: extendFlat({}, boxLayoutAttrs.boxgroupgap, {
        description: [
            'Sets the gap (in plot fraction) between violins of',
            'the same location coordinate.'
        ].join(' ')
    })
};
