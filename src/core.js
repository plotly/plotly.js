'use strict';

exports.version = require('./version').version;

// inject promise polyfill
require('native-promise-only');

// inject plot css
require('../build/plotcss');

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
    require('./components/annotations'),
    require('./components/annotations3d'),
    require('./components/selections'),
    require('./components/shapes'),
    require('./components/images'),
    require('./components/updatemenus'),
    require('./components/sliders'),
    require('./components/rangeslider'),
    require('./components/rangeselector'),
    require('./components/grid'),
    require('./components/errorbars'),
    require('./components/colorscale'),
    require('./components/colorbar'),
    require('./components/legend'), // legend needs to come after shape | legend defaults depends on shapes
    require('./components/fx'), // fx needs to come after legend | unified hover defaults depends on legends
    require('./components/modebar')
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
var Fx = require('./components/fx');
var Plots = require('./plots/plots');

exports.Plots = {
    resize: Plots.resize,
    graphJson: Plots.graphJson,
    sendDataToCloud: Plots.sendDataToCloud
};
exports.Fx = {
    hover: Fx.hover,
    unhover: Fx.unhover,
    loneHover: Fx.loneHover,
    loneUnhover: Fx.loneUnhover
};
exports.Snapshot = require('./snapshot');
exports.PlotSchema = require('./plot_api/plot_schema');
