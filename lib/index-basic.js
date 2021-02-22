'use strict';

var core = require('../src/core');

core.register([
    require('../src/traces/bar'),
    require('../src/traces/pie'),

    require('../src/transforms/aggregate'),
    require('../src/transforms/filter'),
    require('../src/transforms/groupby'),
    require('../src/transforms/sort'),
    require('../src/components/calendars')
]);

module.exports = (function(Plotly) { return Plotly; })(core);
