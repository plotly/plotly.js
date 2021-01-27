'use strict';

module.exports = {
    attributes: require('./attributes'),
    supplyDefaults: require('./defaults'),

    // reuse the Scatter3D 'dummy' calc step so that legends know what to do
    calc: require('../scatter3d/calc'),
    plot: require('./convert'),

    moduleType: 'trace',
    name: 'pointcloud',
    basePlotModule: require('../../plots/gl2d'),
    categories: ['gl', 'gl2d', 'showLegend'],
    meta: {
        description: [
            'The data visualized as a point cloud set in `x` and `y`',
            'using the WebGl plotting engine.'
        ].join(' ')
    }
};
