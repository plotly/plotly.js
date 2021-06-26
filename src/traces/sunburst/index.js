'use strict';

module.exports = {
    moduleType: 'trace',
    name: 'sunburst',
    basePlotModule: require('./base_plot'),
    categories: [],
    animatable: true,

    attributes: require('./attributes'),
    layoutAttributes: require('./layout_attributes'),
    supplyDefaults: require('./defaults'),
    supplyLayoutDefaults: require('./layout_defaults'),

    calc: require('./calc').calc,
    crossTraceCalc: require('./calc').crossTraceCalc,

    plot: require('./plot').plot,
    style: require('./style').style,

    colorbar: require('../scatter/marker_colorbar'),

    meta: {
        description: [
            'Visualize hierarchal data spanning outward radially from root to leaves.',
            'The sunburst sectors are determined by the entries in *labels* or *ids*',
            'and in *parents*.'
        ].join(' ')
    }
};
