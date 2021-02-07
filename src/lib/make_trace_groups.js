'use strict';

var d3 = require('@plotly/d3');

/**
 * General helper to manage trace groups based on calcdata
 *
 * @param {d3.selection} traceLayer: a selection containing a single group
 *     to draw these traces into
 * @param {array} cdModule: array of calcdata items for this
 *     module and subplot combination. Assumes the calcdata item for each
 *     trace is an array with the fullData trace attached to the first item.
 * @param {string} cls: the class attribute to give each trace group
 *     so you can give multiple classes separated by spaces
 */
module.exports = function makeTraceGroups(traceLayer, cdModule, cls) {
    var traces = traceLayer.selectAll('g.' + cls.replace(/\s/g, '.'))
        .data(cdModule, function(cd) { return cd[0].trace.uid; });

    traces.exit().remove();

    traces.enter().append('g')
        .attr('class', cls);

    traces.order();

    // stash ref node to trace group in calcdata,
    // useful for (fast) styleOnSelect
    var k = traceLayer.classed('rangeplot') ? 'nodeRangePlot3' : 'node3';
    traces.each(function(cd) { cd[0][k] = d3.select(this); });

    return traces;
};
