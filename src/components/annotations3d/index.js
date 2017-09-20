/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

module.exports = {
    moduleType: 'component',
    name: 'annotations3d',

    schema: {
        subplots: {
            scene: {annotations: require('./attributes')}
        }
    },

    layoutAttributes: require('./attributes'),
    handleDefaults: require('./defaults'),

    convert: require('./convert'),
    draw: require('./draw')
};
