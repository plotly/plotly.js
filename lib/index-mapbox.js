'use strict';

var core = require('../src/core');

core.register([
    require('../src/traces/scattermapbox'),
    require('../src/traces/choroplethmapbox'),
    require('../src/traces/densitymapbox'),

    require('../src/transforms/aggregate'),
    require('../src/transforms/filter'),
    require('../src/transforms/groupby'),
    require('../src/transforms/sort'),
    require('../src/components/calendars')
]);

module.exports = (function(Plotly) { return Plotly; })(core);
