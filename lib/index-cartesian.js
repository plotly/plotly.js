'use strict';

var core = require('../src/core');

core.register([
    require('../src/traces/bar'),
    require('../src/traces/box'),
    require('../src/traces/heatmap'),
    require('../src/traces/histogram'),
    require('../src/traces/histogram2d'),
    require('../src/traces/histogram2dcontour'),
    require('../src/traces/contour'),
    require('../src/traces/scatterternary'),
    require('../src/traces/violin'),
    require('../src/traces/image'),
    require('../src/traces/pie'),

    require('../src/transforms/aggregate'),
    require('../src/transforms/filter'),
    require('../src/transforms/groupby'),
    require('../src/transforms/sort'),
    require('../src/components/calendars')
]);

module.exports = (function(Plotly) { return Plotly; })(core);
