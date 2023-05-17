'use strict';

module.exports = {
    attributes: require('./attributes'),
    layoutAttributes: require('./layout_attributes'),
    supplyDefaults: require('./defaults').supplyDefaults,
    crossTraceDefaults: require('./defaults').crossTraceDefaults,
    supplyLayoutDefaults: require('./layout_defaults'),
    calc: require('./calc'),
    crossTraceCalc: require('./cross_trace_calc'),
    plot: require('./plot'),
    style: require('./style').style,
    hoverPoints: require('./hover'),
    eventData: require('./event_data'),

    selectPoints: require('../bar/select'),

    moduleType: 'trace',
    name: 'waterfall',
    basePlotModule: require('../../plots/cartesian'),
    categories: ['bar-like', 'cartesian', 'svg', 'oriented', 'showLegend', 'zoomScale'],
    meta: {
        description: [
            'Draws waterfall trace which is useful graph to displays the',
            'contribution of various elements (either positive or negative)',
            'in a bar chart. The data visualized by the span of the bars is',
            'set in `y` if `orientation` is set to *v* (the default) and the',
            'labels are set in `x`.',
            'By setting `orientation` to *h*, the roles are interchanged.'
        ].join(' ')
    }
};
