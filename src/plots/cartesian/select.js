/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var polybool = require('polybooljs');
var polygon = require('../../lib/polygon');
var throttle = require('../../lib/throttle');
var color = require('../../components/color');
var makeEventData = require('../../components/fx/helpers').makeEventData;
var Fx = require('../../components/fx');

var axes = require('./axes');
var constants = require('./constants');

var filteredPolygon = polygon.filter;
var polygonTester = polygon.tester;
var multipolygonTester = polygon.multitester;
var MINSELECT = constants.MINSELECT;

function getAxId(ax) { return ax._id; }

module.exports = function prepSelect(e, startX, startY, dragOptions, mode) {
    var gd = dragOptions.gd,
        fullLayout = gd._fullLayout,
        zoomLayer = fullLayout._zoomlayer,
        dragBBox = dragOptions.element.getBoundingClientRect(),
        plotinfo = dragOptions.plotinfo,
        xs = plotinfo.xaxis._offset,
        ys = plotinfo.yaxis._offset,
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
        filterPoly, testPoly, mergedPolygons, currentPolygon,
        subtract = e.altKey;


    // take over selection polygons from prev mode, if any
    if((e.shiftKey || e.altKey) && (plotinfo.selection && plotinfo.selection.polygons) && !dragOptions.polygons) {
        dragOptions.polygons = plotinfo.selection.polygons;
        dragOptions.mergedPolygons = plotinfo.selection.mergedPolygons;
    }
    // create new polygons, if shift mode
    else if((!e.shiftKey && !e.altKey) || ((e.shiftKey || e.altKey) && !plotinfo.selection)) {
        plotinfo.selection = {};
        plotinfo.selection.polygons = dragOptions.polygons = [];
        plotinfo.selection.mergedPolygons = dragOptions.mergedPolygons = [];
    }

    if(mode === 'lasso') {
        filterPoly = filteredPolygon([[x0, y0]], constants.BENDPX);
    }
    var outlines = zoomLayer.selectAll('path.select-outline-' + plotinfo.id).data([1, 2]);

    outlines.enter()
        .append('path')
        .attr('class', function(d) { return 'select-outline select-outline-' + d + ' select-outline-' + plotinfo.id; })
        .attr('transform', 'translate(' + xs + ', ' + ys + ')')
        .attr('d', path0 + 'Z');

    var corners = zoomLayer.append('path')
        .attr('class', 'zoombox-corners')
        .style({
            fill: color.background,
            stroke: color.defaultLine,
            'stroke-width': 1
        })
        .attr('transform', 'translate(' + xs + ', ' + ys + ')')
        .attr('d', 'M0,0Z');


    // find the traces to search for selection points
    var searchTraces = [];
    var throttleID = fullLayout._uid + constants.SELECTID;
    var selection = [];
    var i, cd, trace, searchInfo, eventData;

    for(i = 0; i < gd.calcdata.length; i++) {
        cd = gd.calcdata[i];
        trace = cd[0].trace;
        if(trace.visible !== true || !trace._module || !trace._module.selectPoints) continue;

        if(dragOptions.subplot) {
            if(
                trace.subplot === dragOptions.subplot ||
                trace.geo === dragOptions.subplot
            ) {
                searchTraces.push({
                    selectPoints: trace._module.selectPoints,
                    style: trace._module.style,
                    cd: cd,
                    xaxis: dragOptions.xaxes[0],
                    yaxis: dragOptions.yaxes[0]
                });
            }
        } else {
            if(xAxisIds.indexOf(trace.xaxis) === -1) continue;
            if(yAxisIds.indexOf(trace.yaxis) === -1) continue;

            searchTraces.push({
                selectPoints: trace._module.selectPoints,
                style: trace._module.style,
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

    // allow subplots to override fillRangeItems routine
    var fillRangeItems;

    if(plotinfo.fillRangeItems) {
        fillRangeItems = plotinfo.fillRangeItems;
    } else {
        if(mode === 'select') {
            fillRangeItems = function(eventData, poly) {
                var ranges = eventData.range = {};

                for(i = 0; i < allAxes.length; i++) {
                    var ax = allAxes[i];
                    var axLetter = ax._id.charAt(0);

                    ranges[ax._id] = [
                        ax.p2d(poly[axLetter + 'min']),
                        ax.p2d(poly[axLetter + 'max'])
                    ].sort(ascending);
                }
            };
        } else {
            fillRangeItems = function(eventData, poly, filterPoly) {
                var dataPts = eventData.lassoPoints = {};

                for(i = 0; i < allAxes.length; i++) {
                    var ax = allAxes[i];
                    dataPts[ax._id] = filterPoly.filtered.map(axValue(ax));
                }
            };
        }
    }

    dragOptions.moveFn = function(dx0, dy0) {
        x1 = Math.max(0, Math.min(pw, dx0 + x0));
        y1 = Math.max(0, Math.min(ph, dy0 + y0));

        var dx = Math.abs(x1 - x0),
            dy = Math.abs(y1 - y0);

        if(mode === 'select') {
            if(dy < Math.min(dx * 0.6, MINSELECT)) {
                // horizontal motion: make a vertical box
                currentPolygon = [[x0, 0], [x0, ph], [x1, ph], [x1, 0]];
                currentPolygon.xmin = Math.min(x0, x1);
                currentPolygon.xmax = Math.max(x0, x1);
                currentPolygon.ymin = Math.min(0, ph);
                currentPolygon.ymax = Math.max(0, ph);
                // extras to guide users in keeping a straight selection
                corners.attr('d', 'M' + currentPolygon.xmin + ',' + (y0 - MINSELECT) +
                    'h-4v' + (2 * MINSELECT) + 'h4Z' +
                    'M' + (currentPolygon.xmax - 1) + ',' + (y0 - MINSELECT) +
                    'h4v' + (2 * MINSELECT) + 'h-4Z');

            }
            else if(dx < Math.min(dy * 0.6, MINSELECT)) {
                // vertical motion: make a horizontal box
                currentPolygon = [[0, y0], [0, y1], [pw, y1], [pw, y0]];
                currentPolygon.xmin = Math.min(0, pw);
                currentPolygon.xmax = Math.max(0, pw);
                currentPolygon.ymin = Math.min(y0, y1);
                currentPolygon.ymax = Math.max(y0, y1);
                corners.attr('d', 'M' + (x0 - MINSELECT) + ',' + currentPolygon.ymin +
                    'v-4h' + (2 * MINSELECT) + 'v4Z' +
                    'M' + (x0 - MINSELECT) + ',' + (currentPolygon.ymax - 1) +
                    'v4h' + (2 * MINSELECT) + 'v-4Z');
            }
            else {
                // diagonal motion
                currentPolygon = [[x0, y0], [x0, y1], [x1, y1], [x1, y0]];
                currentPolygon.xmin = Math.min(x0, x1);
                currentPolygon.xmax = Math.max(x0, x1);
                currentPolygon.ymin = Math.min(y0, y1);
                currentPolygon.ymax = Math.max(y0, y1);
                corners.attr('d', 'M0,0Z');
            }
        }
        else if(mode === 'lasso') {
            filterPoly.addPt([x1, y1]);
            currentPolygon = filterPoly.filtered;
        }

        // create outline & tester
        if(dragOptions.polygons && dragOptions.polygons.length) {
            mergedPolygons = mergePolygons(dragOptions.mergedPolygons, currentPolygon, subtract);
            currentPolygon.subtract = subtract;
            testPoly = multipolygonTester(dragOptions.polygons.concat([currentPolygon]));
        }
        else {
            mergedPolygons = [currentPolygon];
            testPoly = polygonTester(currentPolygon);
        }

        // draw selection
        var paths = [];
        for(i = 0; i < mergedPolygons.length; i++) {
            var ppts = mergedPolygons[i];
            paths.push(ppts.join('L') + 'L' + ppts[0]);
        }
        outlines
            .attr('d', 'M' + paths.join('M') + 'Z');

        throttle.throttle(
            throttleID,
            constants.SELECTDELAY,
            function() {
                selection = [];

                var thisSelection, traceSelections = [], traceSelection;
                for(i = 0; i < searchTraces.length; i++) {
                    searchInfo = searchTraces[i];

                    traceSelection = searchInfo.selectPoints(searchInfo, testPoly);
                    traceSelections.push(traceSelection);

                    thisSelection = fillSelectionItem(traceSelection, searchInfo);

                    if(selection.length) {
                        for(var j = 0; j < thisSelection.length; j++) {
                            selection.push(thisSelection[j]);
                        }
                    }
                    else selection = thisSelection;
                }

                eventData = {points: selection};
                updateSelectedState(gd, searchTraces, eventData);
                fillRangeItems(eventData, currentPolygon, filterPoly);
                dragOptions.gd.emit('plotly_selecting', eventData);
            }
        );
    };

    dragOptions.clickFn = function(numClicks, evt) {
        corners.remove();

        throttle.done(throttleID).then(function() {
            throttle.clear(throttleID);
            if(numClicks === 2) {
                // clear selection on doubleclick
                outlines.remove();
                for(i = 0; i < searchTraces.length; i++) {
                    searchInfo = searchTraces[i];
                    searchInfo.selectPoints(searchInfo, false);
                }

                updateSelectedState(gd, searchTraces);
                gd.emit('plotly_deselect', null);
            }
            else {
                // TODO: remove in v2 - this was probably never intended to work as it does,
                // but in case anyone depends on it we don't want to break it now.
                gd.emit('plotly_selected', undefined);
            }

            Fx.click(gd, evt);
        });
    };

    dragOptions.doneFn = function() {
        corners.remove();

        throttle.done(throttleID).then(function() {
            throttle.clear(throttleID);
            dragOptions.gd.emit('plotly_selected', eventData);

            if(currentPolygon && dragOptions.polygons) {
                // save last polygons
                currentPolygon.subtract = subtract;
                dragOptions.polygons.push(currentPolygon);

                // we have to keep reference to arrays container
                dragOptions.mergedPolygons.length = 0;
                [].push.apply(dragOptions.mergedPolygons, mergedPolygons);
            }
        });
    };
};

function updateSelectedState(gd, searchTraces, eventData) {
    var i, searchInfo, trace;

    if(eventData) {
        var pts = eventData.points || [];

        for(i = 0; i < searchTraces.length; i++) {
            trace = searchTraces[i].cd[0].trace;
            trace.selectedpoints = [];
            trace._input.selectedpoints = [];
        }

        for(i = 0; i < pts.length; i++) {
            var pt = pts[i];
            var data = pt.data;
            var fullData = pt.fullData;

            if(pt.pointIndices) {
                [].push.apply(data.selectedpoints, pt.pointIndices);
                [].push.apply(fullData.selectedpoints, pt.pointIndices);
            } else {
                data.selectedpoints.push(pt.pointIndex);
                fullData.selectedpoints.push(pt.pointIndex);
            }
        }
    }
    else {
        for(i = 0; i < searchTraces.length; i++) {
            trace = searchTraces[i].cd[0].trace;
            delete trace.selectedpoints;
            delete trace._input.selectedpoints;

            // delete scattergl selection
            if(searchTraces[i].cd[0].t && searchTraces[i].cd[0].t.scene) {
                searchTraces[i].cd[0].t.scene.clearSelect();
            }
        }
    }

    for(i = 0; i < searchTraces.length; i++) {
        searchInfo = searchTraces[i];
        if(searchInfo.style) searchInfo.style(gd, searchInfo.cd);
    }
}

function mergePolygons(list, poly, subtract) {
    var res;

    if(subtract) {
        res = polybool.difference({
            regions: list,
            inverted: false
        }, {
            regions: [poly],
            inverted: false
        });

        return res.regions;
    }

    res = polybool.union({
        regions: list,
        inverted: false
    }, {
        regions: [poly],
        inverted: false
    });

    return res.regions;
}

function fillSelectionItem(selection, searchInfo) {
    if(Array.isArray(selection)) {
        var cd = searchInfo.cd;
        var trace = searchInfo.cd[0].trace;

        for(var i = 0; i < selection.length; i++) {
            selection[i] = makeEventData(selection[i], trace, cd);
        }
    }

    return selection;
}
