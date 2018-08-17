/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var d3 = require('d3');

/**
 * helper for cartesian trace types to manage trace groups and plot traces
 * into them
 *
 * @param {div} gd: plot div
 * @param {object} plotinfo: the cartesian subplot info object
 * @param {array} cdModule: array of calcdata items for this
 *     module and subplot combination
 * @param {d3.selection} traceLayer: a selection containing a single group
 *     to draw these traces into
 * @param {string} cls: the class attribute to give each trace group
 *     so you can give multiple classes separated by spaces
 * @param {function} plotOneFn: a function that will plot one trace
 *     takes arguments:
 *         gd
 *         plotinfo
 *         cd: calcdata array for this one trace
 *         plotGroup: d3 selection of the single group to draw into
 */
module.exports = function makeTraceGroups(gd, plotinfo, cdModule, traceLayer, cls, plotOneFn) {
    var traces = traceLayer.selectAll('g.' + cls.replace(/\s/g, '.'))
        .data(cdModule, function(cd) { return cd[0].trace.uid; });

    traces.exit().remove();

    traces.enter().append('g')
        .attr('class', cls);

    traces.each(function(cd) {
        plotOneFn(gd, plotinfo, cd, d3.select(this));
    })
    .order();

    return traces;
};
