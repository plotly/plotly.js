/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

/* eslint-disable no-console */

var config = require('../plot_api/plot_config');
var loggingDflt = config.dflt;

var loggers = module.exports = {};

/**
 * ------------------------------------------
 * debugging tools
 * ------------------------------------------
 */

loggers.log = function() {
    if(loggingDflt > 1) {
        var messages = ['LOG:'];

        for(var i = 0; i < arguments.length; i++) {
            messages.push(arguments[i]);
        }

        if(console.trace) {
            console.trace.apply(console, messages);
        } else {
            console.log.apply(console, messages);
        }
    }
};

loggers.warn = function() {
    if(loggingDflt > 0) {
        var messages = ['WARN:'];

        for(var i = 0; i < arguments.length; i++) {
            messages.push(arguments[i]);
        }

        if(console.trace) {
            console.trace.apply(console, messages);
        } else {
            console.log.apply(console, messages);
        }
    }
};

loggers.error = function() {
    if(loggingDflt > 0) {
        var messages = ['ERROR:'];

        for(var i = 0; i < arguments.length; i++) {
            messages.push(arguments[i]);
        }

        console.error.apply(console, arguments);
    }
};
