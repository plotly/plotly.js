'use strict';

var core = require('../src/core');

core.register([
    require('../src/traces/scatter3d'),
    require('../src/traces/surface'),
    require('../src/traces/isosurface'),
    require('../src/traces/volume'),
    require('../src/traces/mesh3d'),
    require('../src/traces/cone'),
    require('../src/traces/streamtube'),

    require('../src/transforms/aggregate'),
    require('../src/transforms/filter'),
    require('../src/transforms/groupby'),
    require('../src/transforms/sort'),
    require('../src/components/calendars')
]);

module.exports = (function(Plotly) { return Plotly; })(core);
