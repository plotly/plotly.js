'use strict';

var core = require('../src/core');

core.register([
    require('../src/traces/bar'),
    require('../src/traces/histogram'),
    require('../src/traces/funnel'),
    require('../src/traces/waterfall'),
    require('../src/traces/pie'),
    require('../src/traces/funnelarea'),
    require('../src/traces/indicator'),
    require('../src/traces/ohlc'),
    require('../src/traces/candlestick'),

    require('../src/transforms/aggregate'),
    require('../src/transforms/filter'),
    require('../src/transforms/groupby'),
    require('../src/transforms/sort'),
    require('../src/components/calendars')
]);

module.exports = (function(Plotly) { return Plotly; })(core);
