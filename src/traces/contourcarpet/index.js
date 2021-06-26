'use strict';

module.exports = {
    attributes: require('./attributes'),
    supplyDefaults: require('./defaults'),
    colorbar: require('../contour/colorbar'),
    calc: require('./calc'),
    plot: require('./plot'),
    style: require('../contour/style'),

    moduleType: 'trace',
    name: 'contourcarpet',
    basePlotModule: require('../../plots/cartesian'),
    categories: ['cartesian', 'svg', 'carpet', 'contour', 'symbols', 'showLegend', 'hasLines', 'carpetDependent', 'noHover', 'noSortingByValue'],
    meta: {
        hrName: 'contour_carpet',
        description: [
            'Plots contours on either the first carpet axis or the',
            'carpet axis with a matching `carpet` attribute. Data `z`',
            'is interpreted as matching that of the corresponding carpet',
            'axis.'
        ].join(' ')
    }
};
