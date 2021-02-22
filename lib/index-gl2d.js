'use strict';

var core = require('../src/core');

core.register([
    require('../src/traces/scattergl'),
    require('../src/traces/splom'),
    require('../src/traces/pointcloud'),
    require('../src/traces/heatmapgl'),
    require('../src/traces/parcoords'),

    require('../src/transforms/aggregate'),
    require('../src/transforms/filter'),
    require('../src/transforms/groupby'),
    require('../src/transforms/sort'),
    require('../src/components/calendars')
]);

module.exports = (function(Plotly) { return Plotly; })(core);
