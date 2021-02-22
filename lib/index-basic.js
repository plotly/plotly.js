'use strict';

var core = require('./core');

core.register([
    // traces
    require('./bar'),
    require('./pie'),

    // transforms
    require('./aggregate'),
    require('./filter'),
    require('./groupby'),
    require('./sort'),

    // components
    require('./calendars')
]);

module.exports = (function(Plotly) { return Plotly; })(core);
