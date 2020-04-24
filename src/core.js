/**
* Copyright 2012-2020, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

exports.version = require('./version').version;

// inject promise polyfill
require('es6-promise').polyfill();

// inject plot css
require('../build/plotcss');

// inject default MathJax config
require('./fonts/mathjax_config')();

// include registry module and expose register method
var Registry = require('./registry');
var register = exports.register = Registry.register;

// expose plot api methods
var plotApi = require('./plot_api');
var methodNames = Object.keys(plotApi);
for(var i = 0; i < methodNames.length; i++) {
    var name = methodNames[i];
    // _ -> private API methods, but still registered for internal use
    if(name.charAt(0) !== '_') exports[name] = plotApi[name];
    register({
        moduleType: 'apiMethod',
        name: name,
        fn: plotApi[name]
    });
}

// scatter is the only trace included by default
register(require('./traces/scatter'));

// register all registrable components modules
register([
    require('./components/legend'),
    require('./components/fx'), // fx needs to come after legend
    require('./components/annotations'),
    require('./components/annotations3d'),
    require('./components/shapes'),
    require('./components/images'),
    require('./components/updatemenus'),
    require('./components/sliders'),
    require('./components/rangeslider'),
    require('./components/rangeselector'),
    require('./components/grid'),
    require('./components/errorbars'),
    require('./components/colorscale'),
    require('./components/colorbar')
]);

// locales en and en-US are required for default behavior
register([
    require('./locale-en'),
    require('./locale-en-us')
]);

// locales that are present in the window should be loaded
if(window.PlotlyLocales && Array.isArray(window.PlotlyLocales)) {
    register(window.PlotlyLocales);
    delete window.PlotlyLocales;
}

// plot icons
exports.Icons = require('./fonts/ploticon');

// unofficial 'beta' plot methods, use at your own risk
exports.Plots = require('./plots/plots');
exports.Fx = require('./components/fx');
exports.Snapshot = require('./snapshot');
exports.PlotSchema = require('./plot_api/plot_schema');
exports.Queue = require('./lib/queue');

// export d3 used in the bundle
exports.d3 = require('d3');
