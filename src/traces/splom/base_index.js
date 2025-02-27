'use strict';

var Registry = require('../../registry');
var Grid = require('../../components/grid');

module.exports = {
    moduleType: 'trace',
    name: 'splom',

    categories: ['gl', 'regl', 'cartesian', 'symbols', 'showLegend', 'scatter-like'],

    attributes: require('./attributes'),
    supplyDefaults: require('./defaults'),
    colorbar: require('../scatter/marker_colorbar'),

    calc: require('./calc'),
    plot: require('./plot'),
    hoverPoints: require('./hover').hoverPoints,
    selectPoints: require('./select'),
    editStyle: require('./edit_style'),

    meta: {
        description: [
            'Splom traces generate scatter plot matrix visualizations.',
            'Each splom `dimensions` items correspond to a generated axis.',
            'Values for each of those dimensions are set in `dimensions[i].values`.',
            'Splom traces support all `scattergl` marker style attributes.',
            'Specify `layout.grid` attributes and/or layout x-axis and y-axis attributes',
            'for more control over the axis positioning and style. '
        ].join(' ')
    }
};

// splom traces use the 'grid' component to generate their axes,
// register it here
Registry.register(Grid);
