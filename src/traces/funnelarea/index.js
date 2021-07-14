'use strict';

module.exports = {
    moduleType: 'trace',
    name: 'funnelarea',
    basePlotModule: require('./base_plot'),
    categories: ['pie-like', 'funnelarea', 'showLegend'],

    attributes: require('./attributes'),
    layoutAttributes: require('./layout_attributes'),
    supplyDefaults: require('./defaults'),
    supplyLayoutDefaults: require('./layout_defaults'),

    calc: require('./calc').calc,
    crossTraceCalc: require('./calc').crossTraceCalc,

    plot: require('./plot'),
    style: require('./style'),
    styleOne: require('../pie/style_one'),

    meta: {
        description: [
            'Visualize stages in a process using area-encoded trapezoids. This trace can be used',
            'to show data in a part-to-whole representation similar to a "pie" trace, wherein',
            'each item appears in a single stage. See also the "funnel" trace type for a different',
            'approach to visualizing funnel data.'
        ].join(' ')
    }
};
