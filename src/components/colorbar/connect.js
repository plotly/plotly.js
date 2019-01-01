/**
* Copyright 2012-2019, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var drawColorbar = require('./draw');
var flipScale = require('../colorscale/helpers').flipScale;

/**
 * connectColorbar: create a colorbar from a trace, using its module to
 *   describe the connection.
 *
 * @param {DOM element} gd
 *
 * @param {Array} cd
 *   calcdata entry for this trace. cd[0].trace is the trace itself, and the
 *   colorbar object will be stashed in cd[0].t.cb
 *
 * @param {object|function} moduleOpts
 *   may be a function(gd, cd) to override the standard handling below. If
 *   an object, should have these keys:
 * @param {Optional(string)} moduleOpts.container
 *   name of the container inside the trace where the colorbar and colorscale
 *   attributes live (ie 'marker', 'line') - omit if they're at the trace root.
 * @param {string} moduleOpts.min
 *   name of the attribute holding the value of the minimum color
 * @param {string} moduleOpts.max
 *   name of the attribute holding the value of the maximum color
 * @param {Optional(string)} moduleOpts.vals
 *   name of the attribute holding the (numeric) color data
 *   used only if min/max fail. May be omitted if these are always
 *   pre-calculated.
 */
module.exports = function connectColorbar(gd, cd, moduleOpts) {
    if(typeof moduleOpts === 'function') return moduleOpts(gd, cd);

    var trace = cd[0].trace;
    var cbId = 'cb' + trace.uid;
    var containerName = moduleOpts.container;
    var container = containerName ? trace[containerName] : trace;

    gd._fullLayout._infolayer.selectAll('.' + cbId).remove();
    if(!container || !container.showscale) return;

    var cb = cd[0].t.cb = drawColorbar(gd, cbId);

    var scl = container.reversescale ?
        flipScale(container.colorscale) :
        container.colorscale;

    cb.fillgradient(scl)
        .zrange([container[moduleOpts.min], container[moduleOpts.max]])
        .options(container.colorbar)();
};
