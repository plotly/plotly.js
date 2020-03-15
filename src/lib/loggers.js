/**
* Copyright 2012-2020, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

/* eslint-disable no-console */

var dfltConfig = require('../plot_api/plot_config').dfltConfig;

var notifier = require('./notifier');

var loggers = module.exports = {};

/**
 * ------------------------------------------
 * debugging tools
 * ------------------------------------------
 */

loggers.log = function() {
    var i;

    if(dfltConfig.logging > 1) {
        var messages = ['LOG:'];
        for(i = 0; i < arguments.length; i++) {
            messages.push(arguments[i]);
        }
        apply(console.trace || console.log, messages);
    }

    if(dfltConfig.notifyOnLogging > 1) {
        var lines = [];
        for(i = 0; i < arguments.length; i++) {
            lines.push(arguments[i]);
        }
        notifier(lines.join('<br>'), 'long');
    }
};

loggers.warn = function() {
    var i;

    if(dfltConfig.logging > 0) {
        var messages = ['WARN:'];
        for(i = 0; i < arguments.length; i++) {
            messages.push(arguments[i]);
        }
        apply(console.trace || console.log, messages);
    }

    if(dfltConfig.notifyOnLogging > 0) {
        var lines = [];
        for(i = 0; i < arguments.length; i++) {
            lines.push(arguments[i]);
        }
        notifier(lines.join('<br>'), 'stick');
    }
};

loggers.error = function() {
    var i;

    if(dfltConfig.logging > 0) {
        var messages = ['ERROR:'];
        for(i = 0; i < arguments.length; i++) {
            messages.push(arguments[i]);
        }
        apply(console.error, messages);
    }

    if(dfltConfig.notifyOnLogging > 0) {
        var lines = [];
        for(i = 0; i < arguments.length; i++) {
            lines.push(arguments[i]);
        }
        notifier(lines.join('<br>'), 'stick');
    }
};

/*
 * Robust apply, for IE9 where console.log doesn't support
 * apply like other functions do
 */
function apply(f, args) {
    if(f && f.apply) {
        try {
            // `this` should always be console, since here we're always
            // applying a method of the console object.
            f.apply(console, args);
            return;
        } catch(e) { /* in case apply failed, fall back on the code below */ }
    }

    // no apply - just try calling the function on each arg independently
    for(var i = 0; i < args.length; i++) {
        try {
            f(args[i]);
        } catch(e) {
            // still fails - last resort simple console.log
            console.log(args[i]);
        }
    }
}
