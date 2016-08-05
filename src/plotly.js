/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

/*
 * Pack internal modules unto an object.
 *
 * This object is require'ed in as 'Plotly' in numerous src and test files.
 * Require'ing 'Plotly' bypasses circular dependencies.
 *
 * Future development should move away from this pattern.
 *
 */

// promise polyfill
require('es6-promise').polyfill();

// lib functions
var Lib = exports.Lib = require('./lib');
exports.util = require('./lib/svg_text_utils');
exports.Queue = require('./lib/queue');

// plot css
require('../build/plotcss');

// configuration
exports.MathJaxConfig = require('./fonts/mathjax_config');
exports.defaultConfig = require('./plot_api/plot_config');

// plots
var Plots = exports.Plots = require('./plots/plots');

exports.Axes = require('./plots/cartesian/axes');
exports.Fx = require('./plots/cartesian/graph_interact');
exports.micropolar = require('./plots/polar/micropolar');

// components
exports.Color = require('./components/color');
exports.Drawing = require('./components/drawing');
exports.Colorscale = require('./components/colorscale');
exports.Colorbar = require('./components/colorbar');
exports.ErrorBars = require('./components/errorbars');
exports.Annotations = require('./components/annotations');
exports.Shapes = require('./components/shapes');
exports.Legend = require('./components/legend');
exports.Images = require('./components/images');
exports.UpdateMenus = require('./components/updatemenus');
exports.ModeBar = require('./components/modebar');

exports.register = function register(_modules) {
    if(!_modules) {
        throw new Error('No argument passed to Plotly.register.');
    }
    else if(_modules && !Array.isArray(_modules)) {
        _modules = [_modules];
    }

    for(var i = 0; i < _modules.length; i++) {
        var newModule = _modules[i];

        if(!newModule) {
            throw new Error('Invalid module was attempted to be registered!');
        }

        switch(newModule.moduleType) {
            case 'trace':
                Plots.register(newModule, newModule.name, newModule.categories, newModule.meta);

                if(!Plots.subplotsRegistry[newModule.basePlotModule.name]) {
                    Plots.registerSubplot(newModule.basePlotModule);
                }

                break;

            case 'transform':
                if(typeof newModule.name !== 'string') {
                    throw new Error('Transform module *name* must be a string.');
                }

                var prefix = 'Transform module ' + newModule.name;

                if(typeof newModule.transform !== 'function') {
                    throw new Error(prefix + ' is missing a *transform* function.');
                }
                if(!Lib.isPlainObject(newModule.attributes)) {
                    Lib.log(prefix + ' registered without an *attributes* object.');
                }
                if(typeof newModule.supplyDefaults !== 'function') {
                    Lib.log(prefix + ' registered without a *supplyDefaults* function.');
                }

                Plots.transformsRegistry[newModule.name] = newModule;

                break;

            default:
                throw new Error('Invalid module was attempted to be registered!');
        }
    }
};

// Scatter is the only trace included by default
exports.register(require('./traces/scatter'));

// plot api
require('./plot_api/plot_api');
exports.PlotSchema = require('./plot_api/plot_schema');

// imaging routines
exports.Snapshot = require('./snapshot');
