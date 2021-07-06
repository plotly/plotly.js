'use strict';

module.exports = {
    moduleType: 'component',
    name: 'images',

    layoutAttributes: require('./attributes'),
    supplyLayoutDefaults: require('./defaults'),
    includeBasePlot: require('../../plots/cartesian/include_components')('images'),

    draw: require('./draw'),

    convertCoords: require('./convert_coords')
};
