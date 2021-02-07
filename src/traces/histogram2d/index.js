'use strict';

module.exports = {
    attributes: require('./attributes'),
    supplyDefaults: require('./defaults'),
    crossTraceDefaults: require('../histogram/cross_trace_defaults'),
    calc: require('../heatmap/calc'),
    plot: require('../heatmap/plot'),
    layerName: 'heatmaplayer',
    colorbar: require('../heatmap/colorbar'),
    style: require('../heatmap/style'),
    hoverPoints: require('./hover'),
    eventData: require('../histogram/event_data'),

    moduleType: 'trace',
    name: 'histogram2d',
    basePlotModule: require('../../plots/cartesian'),
    categories: ['cartesian', 'svg', '2dMap', 'histogram', 'showLegend'],
    meta: {
        hrName: 'histogram_2d',
        description: [
            'The sample data from which statistics are computed is set in `x`',
            'and `y` (where `x` and `y` represent marginal distributions,',
            'binning is set in `xbins` and `ybins` in this case)',
            'or `z` (where `z` represent the 2D distribution and binning set,',
            'binning is set by `x` and `y` in this case).',
            'The resulting distribution is visualized as a heatmap.'
        ].join(' ')
    }
};
