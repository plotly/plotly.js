'use strict';

module.exports = {
    attributes: require('./attributes'),
    supplyDefaults: require('./defaults').supplyDefaults,
    supplyLayoutDefaults: require('./layout_defaults'),
    layoutAttributes: require('./layout_attributes'),

    calc: require('./calc').calc,
    crossTraceCalc: require('./calc').crossTraceCalc,

    plot: require('./plot').plot,
    style: require('./style'),
    styleOne: require('./style_one'),

    moduleType: 'trace',
    name: 'pie',
    basePlotModule: require('./base_plot'),
    categories: ['pie-like', 'pie', 'showLegend'],
    meta: {
        description: [
            'A data visualized by the sectors of the pie is set in `values`.',
            'The sector labels are set in `labels`.',
            'The sector colors are set in `marker.colors`'
        ].join(' ')
    }
};
