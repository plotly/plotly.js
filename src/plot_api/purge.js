/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Plots = require('../plots/plots');
var Events = require('../lib/events');
var helpers = require('./helpers');

/**
 * Purge a graph container div back to its initial pre-Plotly.plot state
 *
 * This method is contained in its own file since it needs to be run internally
 * on things that may or may not be a plot, so that it's difficult to require
 * without creating a circular dependency. (see: plot_api/to_image.js)
 *
 * @param {string id or DOM element} gd
 *      the id or DOM element of the graph container div
 */
module.exports = function purge(gd) {
    gd = helpers.getGraphDiv(gd);

    var fullLayout = gd._fullLayout || {},
        fullData = gd._fullData || [];

    // remove gl contexts
    Plots.cleanPlot([], {}, fullData, fullLayout);

    // purge properties
    Plots.purge(gd);

    // purge event emitter methods
    Events.purge(gd);

    // remove plot container
    if(fullLayout._container) fullLayout._container.remove();

    delete gd._context;
    delete gd._replotPending;
    delete gd._mouseDownTime;
    delete gd._legendMouseDownTime;
    delete gd._hmpixcount;
    delete gd._hmlumcount;
    delete gd._plotAPI;

    return gd;
};
