/**
* Copyright 2012-2019, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

module.exports = {
    attributes: require('./attributes'),
    supplyDefaults: require('./defaults'),
    calc: require('./calc'),
    plot: require('./plot').plot,
    style: require('./style'),
    hoverPoints: require('./hover'),
    eventData: require('./event_data'),

    moduleType: 'trace',
    name: 'image',
    basePlotModule: require('../../plots/cartesian'),
    categories: ['cartesian', 'svg', '2dMap', 'noSortingByValue'],
    animatable: false,
    meta: {
        description: [
            'Display an image, i.e. data on a 2D regular raster.',
            'If only images are displayed in a subplot,',
            'the y axis will be reversed (ie. `autorange: \'reversed\'`)',
            'and it will have the same scale as the x axis (ie. `scaleanchor: \'x\,`)',
            'in order for pixels to be rendered as squares and',
            'the y axis is constrained to the domain (ie. `constrain: \'domain\'`).'
        ].join(' ')
    }
};
