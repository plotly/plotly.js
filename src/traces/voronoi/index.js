'use strict';

module.exports = {
    moduleType: 'trace',
    name: 'treemap',
    basePlotModule: require('./base_plot'),
    categories: [],
    animatable: true,

    attributes: require('./attributes'),
    layoutAttributes: require('./layout_attributes'),
    supplyDefaults: require('./defaults'),
    supplyLayoutDefaults: require('./layout_defaults'),

    calc: require('./calc').calc,
    crossTraceCalc: require('./calc').crossTraceCalc,

    plot: require('./plot'),
    style: require('./style').style,

    colorbar: require('../scatter/marker_colorbar'),

    meta: {
        description: [
            'Visualize hierarchal data from leaves (and/or outer branches) towards root',
            'with rectangles. The treemap sectors are determined by the entries in',
            '*labels* or *ids* and in *parents*.'
        ].join(' ')
    }
};
