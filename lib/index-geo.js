'use strict';

var Plotly = require('./core');

Plotly.register([
    // traces
    require('./scattergeo'),
    require('./choropleth'),

    // transforms
    require('./aggregate'),
    require('./filter'),
    require('./groupby'),
    require('./sort'),

    // components
    require('./calendars')
]);

// Using
// module.exports = Plotly;
// here often make unrecognized characters (from d3 - v3) in the bundles
// For now we use an IIFE https://developer.mozilla.org/en-US/docs/Glossary/IIFE
// to return the Plotly object.
// It’s a hack to fix encoding problems and we’ll remove it after we solve those.
module.exports = (function(_Plotly) { return _Plotly; })(Plotly);
