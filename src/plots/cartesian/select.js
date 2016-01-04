/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';
var polygon = require('../../lib/polygon');
var axes = require('./axes');
var filteredPolygon = polygon.filter;
var polygonTester = polygon.tester;
var BENDPX = 1.5; // max pixels off straight before a line counts as bent

function getAxId(ax) { return ax._id; }

module.exports = function prepSelect(e, startX, startY, dragOptions, mode) {
    var plot = dragOptions.plotinfo.plot,
        dragBBox = dragOptions.element.getBoundingClientRect(),
        x0 = startX - dragBBox.left,
        y0 = startY - dragBBox.top,
        x1 = x0,
        y1 = y0,
        path0 = 'M' + x0 + ',' + y0,
        pw = dragOptions.xaxes[0]._length,
        ph = dragOptions.yaxes[0]._length,
        xAxisIds = dragOptions.xaxes.map(getAxId),
        yAxisIds = dragOptions.yaxes.map(getAxId);

    if(mode === 'lasso') {
        var pts = filteredPolygon([[x0, y0]], BENDPX);
    }

    var outlines = plot.selectAll('path.select-outline').data([1,2]);

    outlines.enter()
        .append('path')
        .attr('class', function(d) { return 'select-outline select-outline-' + d; })
        .attr('d', path0 + 'Z');

    // find the traces to search for selection points
    var searchTraces = [],
        gd = dragOptions.gd,
        i,
        cd,
        trace,
        searchInfo,
        selection = [];
    for(i = 0; i < gd.calcdata.length; i++) {
        cd = gd.calcdata[i];
        trace = cd[0].trace;
        if(!trace._module || !trace._module.selectPoints) continue;

        if(xAxisIds.indexOf(trace.xaxis) === -1) continue;
        if(yAxisIds.indexOf(trace.yaxis) === -1) continue;

        searchTraces.push({
            selectPoints: trace._module.selectPoints,
            cd: cd,
            xaxis: axes.getFromId(gd, trace.xaxis),
            yaxis: axes.getFromId(gd, trace.yaxis)
        });
    }

    dragOptions.moveFn = function(dx0, dy0) {
        var poly;
        x1 = Math.max(0, Math.min(pw, dx0 + x0));
        y1 = Math.max(0, Math.min(ph, dy0 + y0));

        if(mode === 'select') {
            poly = polygonTester([[x0, y0], [x0, y1], [x1, y1], [x1, y0]]);
            outlines.attr('d', path0 + 'H' + x1 + 'V' + y1 + 'H' + x0 + 'Z');
        }
        else if(mode === 'lasso') {
            pts.addPt([x1, y1]);
            poly = polygonTester(pts.filtered);
            outlines.attr('d', 'M' + pts.filtered.join('L') + 'Z');
        }

        selection = [];
        for(i = 0; i < searchTraces.length; i++) {
            searchInfo = searchTraces[i];
            [].push.apply(selection, searchInfo.selectPoints(searchInfo, poly));
        }
        dragOptions.gd.emit('plotly_selecting', {points: selection});
    };

    dragOptions.doneFn = function(dragged, numclicks) {
        if(!dragged && numclicks === 2) dragOptions.doubleclick();
        else {
            dragOptions.gd.emit('plotly_selected', {points: selection});
        }
        outlines.remove();
        for(i = 0; i < searchTraces.length; i++) {
            searchInfo = searchTraces[i];
            searchInfo.selectPoints(searchInfo, false);
        }
    };
};

