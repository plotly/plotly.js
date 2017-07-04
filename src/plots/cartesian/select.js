/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var polybool = require('poly-bool');
var polygon = require('../../lib/polygon');
var color = require('../../components/color');
var appendArrayPointValue = require('../../components/fx/helpers').appendArrayPointValue;

var axes = require('./axes');
var constants = require('./constants');

var filteredPolygon = polygon.filter;
var polygonTester = polygon.tester;
var multipolygonTester = polygon.multitester;
var MINSELECT = constants.MINSELECT;

function getAxId(ax) { return ax._id; }


module.exports = function prepSelect(e, startX, startY, dragOptions, mode) {
    var plot = dragOptions.gd._fullLayout._zoomlayer,
        dragBBox = dragOptions.element.getBoundingClientRect(),
        xs = dragOptions.plotinfo.xaxis._offset,
        ys = dragOptions.plotinfo.yaxis._offset,
        x0 = startX - dragBBox.left,
        y0 = startY - dragBBox.top,
        x1 = x0,
        y1 = y0,
        path0 = 'M' + x0 + ',' + y0,
        pw = dragOptions.xaxes[0]._length,
        ph = dragOptions.yaxes[0]._length,
        xAxisIds = dragOptions.xaxes.map(getAxId),
        yAxisIds = dragOptions.yaxes.map(getAxId),
        allAxes = dragOptions.xaxes.concat(dragOptions.yaxes),
        filterPoly, testPoly, mergedPolygons, currentPolygon;

    if(mode === 'lasso') {
        filterPoly = filteredPolygon([[x0, y0]], constants.BENDPX);
    }

    var outlines = plot.selectAll('path.select-outline').data([1, 2]);

    outlines.enter()
        .append('path')
        .attr('class', function(d) { return 'select-outline select-outline-' + d; })
        .attr('transform', 'translate(' + xs + ', ' + ys + ')')
        .attr('d', path0 + 'Z');

    var corners = plot.append('path')
        .attr('class', 'zoombox-corners')
        .style({
            fill: color.background,
            stroke: color.defaultLine,
            'stroke-width': 1
        })
        .attr('transform', 'translate(' + xs + ', ' + ys + ')')
        .attr('d', 'M0,0Z');


    // find the traces to search for selection points
    var searchTraces = [],
        gd = dragOptions.gd,
        i,
        cd,
        trace,
        searchInfo,
        selection = [],
        eventData;
    for(i = 0; i < gd.calcdata.length; i++) {
        cd = gd.calcdata[i];
        trace = cd[0].trace;
        if(!trace._module || !trace._module.selectPoints) continue;

        if(dragOptions.subplot) {
            if(trace.subplot !== dragOptions.subplot) continue;

            searchTraces.push({
                selectPoints: trace._module.selectPoints,
                cd: cd,
                xaxis: dragOptions.xaxes[0],
                yaxis: dragOptions.yaxes[0]
            });
        }
        else {
            if(xAxisIds.indexOf(trace.xaxis) === -1) continue;
            if(yAxisIds.indexOf(trace.yaxis) === -1) continue;

            searchTraces.push({
                selectPoints: trace._module.selectPoints,
                cd: cd,
                xaxis: axes.getFromId(gd, trace.xaxis),
                yaxis: axes.getFromId(gd, trace.yaxis)
            });
        }
    }

    function axValue(ax) {
        var index = (ax._id.charAt(0) === 'y') ? 1 : 0;
        return function(v) { return ax.p2d(v[index]); };
    }

    function ascending(a, b) { return a - b; }

    dragOptions.moveFn = function(dx0, dy0) {
        var ax;
        x1 = Math.max(0, Math.min(pw, dx0 + x0));
        y1 = Math.max(0, Math.min(ph, dy0 + y0));

        var dx = Math.abs(x1 - x0),
            dy = Math.abs(y1 - y0);

        if(mode === 'select') {
            if(dy < Math.min(dx * 0.6, MINSELECT)) {
                // horizontal motion: make a vertical box
                currentPolygon = [[x0, 0], [x0, ph], [x1, ph], [x1, 0]];
                // extras to guide users in keeping a straight selection
                corners.attr('d', 'M' + Math.min(x0, x1) + ',' + (y0 - MINSELECT) +
                    'h-4v' + (2 * MINSELECT) + 'h4Z' +
                    'M' + (Math.max(x0, x1) - 1) + ',' + (y0 - MINSELECT) +
                    'h4v' + (2 * MINSELECT) + 'h-4Z');

            }
            else if(dx < Math.min(dy * 0.6, MINSELECT)) {
                // vertical motion: make a horizontal box
                currentPolygon = [[0, y0], [0, y1], [pw, y1], [pw, y0]];
                corners.attr('d', 'M' + (x0 - MINSELECT) + ',' + Math.min(y0, y1) +
                    'v-4h' + (2 * MINSELECT) + 'v4Z' +
                    'M' + (x0 - MINSELECT) + ',' + (Math.max(y0, y1) - 1) +
                    'v4h' + (2 * MINSELECT) + 'v-4Z');
            }
            else {
                // diagonal motion
                currentPolygon = [[x0, y0], [x0, y1], [x1, y1], [x1, y0]];
                corners.attr('d', 'M0,0Z');
            }
        }
        else if(mode === 'lasso') {
            filterPoly.addPt([x1, y1]);
            currentPolygon = filterPoly.filtered;
        }

        // create outline & tester
        if(dragOptions.polygons.length) {
            mergedPolygons = polybool(dragOptions.mergedPolygons, [currentPolygon], 'or');
            testPoly = multipolygonTester(dragOptions.polygons.concat([currentPolygon]));
            var mergedPaths = [];
            for(i = 0; i < mergedPolygons.length; i++) {
                var ppts = mergedPolygons[i];
                mergedPaths.push(ppts.join('L') + 'L' + ppts[0]);
            }
            outlines.attr('d', 'M' + mergedPaths.join('M') + 'Z');
        }
        else {
            mergedPolygons = [currentPolygon];
            testPoly = polygonTester(currentPolygon);
            outlines.attr('d', 'M' + mergedPolygons[0].join('L') + 'Z');
        }

        selection = [];
        for(i = 0; i < searchTraces.length; i++) {
            searchInfo = searchTraces[i];
            [].push.apply(selection, fillSelectionItem(
                searchInfo.selectPoints(searchInfo, testPoly), searchInfo
            ));
        }

        eventData = {points: selection};

        if(mode === 'select') {
            var ranges = eventData.range = {},
                axLetter;

            for(i = 0; i < allAxes.length; i++) {
                ax = allAxes[i];
                axLetter = ax._id.charAt(0);
                ranges[ax._id] = [
                    ax.p2d(testPoly[axLetter + 'min']),
                    ax.p2d(testPoly[axLetter + 'max'])].sort(ascending);
            }
        }
        else {
            var dataPts = eventData.lassoPoints = {};

            for(i = 0; i < allAxes.length; i++) {
                ax = allAxes[i];
                dataPts[ax._id] = filterPoly.filtered.map(axValue(ax));
            }
        }
        dragOptions.gd.emit('plotly_selecting', eventData);
    };

    dragOptions.doneFn = function(dragged, numclicks) {
        corners.remove();
        if(!dragged && numclicks === 2) {
            // clear selection on doubleclick
            outlines.remove();
            for(i = 0; i < searchTraces.length; i++) {
                searchInfo = searchTraces[i];
                searchInfo.selectPoints(searchInfo, false);
            }

            gd.emit('plotly_deselect', null);
        }
        else {
            dragOptions.gd.emit('plotly_selected', eventData);
        }

        // save last polygons
        dragOptions.polygons.push(currentPolygon);

        // we have to keep reference to arrays, therefore just replace items
        dragOptions.mergedPolygons.splice.apply(dragOptions.mergedPolygons, [0, dragOptions.mergedPolygons].concat(mergedPolygons));
    };
};

function fillSelectionItem(selection, searchInfo) {
    if(Array.isArray(selection)) {
        var trace = searchInfo.cd[0].trace;

        for(var i = 0; i < selection.length; i++) {
            var sel = selection[i];

            sel.curveNumber = trace.index;
            sel.data = trace._input;
            sel.fullData = trace;
            appendArrayPointValue(sel, trace, sel.pointNumber);
        }
    }

    return selection;
}
