/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

/* eslint-disable no-console */

var config = require('../plot_api/plot_config');

var loggers = module.exports = {};

/**
 * ------------------------------------------
 * debugging tools
 * ------------------------------------------
 */

loggers.log = function() {
    if(config.logging > 1) {
        var messages = ['LOG:'];

        for(var i = 0; i < arguments.length; i++) {
            messages.push(arguments[i]);
        }

        apply(console.trace || console.log, messages);
    }
};

loggers.warn = function() {
    if(config.logging > 0) {
        var messages = ['WARN:'];

        for(var i = 0; i < arguments.length; i++) {
            messages.push(arguments[i]);
        }

        apply(console.trace || console.log, messages);
    }
};

loggers.error = function() {
    if(config.logging > 0) {
        var messages = ['ERROR:'];

        for(var i = 0; i < arguments.length; i++) {
            messages.push(arguments[i]);
        }

        apply(console.error, messages);
    }
};

/*
 * Robust apply, for IE9 where console.log doesn't support
 * apply like other functions do
 */
function apply(f, args) {
    if(f.apply) {
        f.apply(f, args);
    }
    else {
        for(var i = 0; i < args.length; i++) {
            f(args[i]);
        }
    }
}
