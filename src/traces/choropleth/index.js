'use strict';

var Plotly = require('../../plotly');

var Choropleth = module.exports = {};

Plotly.Plots.register(Choropleth, 'choropleth', ['geo', 'noOpacity'], {
    description: [
        'The data that describes the choropleth value-to-color mapping',
        'is set in `z`.',
        'The geographic locations corresponding to each value in `z`',
        'are set in `locations`.'
    ].join(' ')
});

Choropleth.attributes = require('./attributes');

Choropleth.supplyDefaults = require('./defaults');

Choropleth.colorbar = Plotly.Colorbar.traceColorbar;

Choropleth.calc = function(gd, trace) {

    Plotly.Colorscale.calc(trace, trace.z, '', 'z');

};
