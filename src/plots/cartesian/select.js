/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var polybool = require('polybooljs');

var Registry = require('../../registry');
var Color = require('../../components/color');
var Fx = require('../../components/fx');

var difference = require('../../lib/set_operations').difference;
var polygon = require('../../lib/polygon');
var throttle = require('../../lib/throttle');
var makeEventData = require('../../components/fx/helpers').makeEventData;
var getFromId = require('./axis_ids').getFromId;
var sortModules = require('../sort_modules').sortModules;

var constants = require('./constants');
var MINSELECT = constants.MINSELECT;

var filteredPolygon = polygon.filter;
var polygonTester = polygon.tester;

function getAxId(ax) { return ax._id; }

function prepSelect(e, startX, startY, dragOptions, mode) {
    var gd = dragOptions.gd;
    var fullLayout = gd._fullLayout;
    var zoomLayer = fullLayout._zoomlayer;
    var dragBBox = dragOptions.element.getBoundingClientRect();
    var plotinfo = dragOptions.plotinfo;
    var xs = plotinfo.xaxis._offset;
    var ys = plotinfo.yaxis._offset;
    var x0 = startX - dragBBox.left;
    var y0 = startY - dragBBox.top;
    var x1 = x0;
    var y1 = y0;
    var path0 = 'M' + x0 + ',' + y0;
    var pw = dragOptions.xaxes[0]._length;
    var ph = dragOptions.yaxes[0]._length;
    var allAxes = dragOptions.xaxes.concat(dragOptions.yaxes);
    var subtract = e.altKey;

    var filterPoly, mergedPolygons, currentPolygon;
    var pointsInPolygon = [];
    var i, searchInfo, eventData;

    var selectingOnSameSubplot = (
        fullLayout._lastSelectedSubplot &&
        fullLayout._lastSelectedSubplot === plotinfo.id
    );

    if(
        selectingOnSameSubplot &&
        (e.shiftKey || e.altKey) &&
        (plotinfo.selection && plotinfo.selection.polygons) &&
        !dragOptions.polygons
    ) {
        // take over selection polygons from prev mode, if any
        dragOptions.polygons = plotinfo.selection.polygons;
        dragOptions.mergedPolygons = plotinfo.selection.mergedPolygons;
    } else if(
        (!e.shiftKey && !e.altKey) ||
        ((e.shiftKey || e.altKey) && !plotinfo.selection)
    ) {
        // create new polygons, if not shift mode or selecting across different subplots
        plotinfo.selection = {};
        plotinfo.selection.polygons = dragOptions.polygons = [];
        plotinfo.selection.mergedPolygons = dragOptions.mergedPolygons = [];
    }

    // clear selection outline when selecting a different subplot
    if(!selectingOnSameSubplot) {
        clearSelect(zoomLayer);
        fullLayout._lastSelectedSubplot = plotinfo.id;
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
            fill: Color.background,
            stroke: Color.defaultLine,
            'stroke-width': 1
        })
        .attr('transform', 'translate(' + xs + ', ' + ys + ')')
        .attr('d', 'M0,0Z');


    var throttleID = fullLayout._uid + constants.SELECTID;

    // find the traces to search for selection points
    var searchTraces = determineSearchTraces(gd, dragOptions.xaxes, dragOptions.yaxes, dragOptions.subplot);

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
            var direction = fullLayout.selectdirection;

            if(fullLayout.selectdirection === 'any') {
                if(dy < Math.min(dx * 0.6, MINSELECT)) direction = 'h';
                else if(dx < Math.min(dy * 0.6, MINSELECT)) direction = 'v';
                else direction = 'd';
            }
            else {
                direction = fullLayout.selectdirection;
            }

            if(direction === 'h') {
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
            else if(direction === 'v') {
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
            else if(direction === 'd') {
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
        }
        else {
            mergedPolygons = [currentPolygon];
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
                var selection = [],
                    retainSelection = shouldRetainSelection(e),
                    module,
                    searchInfo,
                    i;

                var thisSelection, traceSelection;
                for(i = 0; i < searchTraces.length; i++) {
                    searchInfo = searchTraces[i];
                    module = searchInfo._module;

                    if(!retainSelection) module.toggleSelected(searchInfo, false);

                    var currentPolygonTester = polygonTester(currentPolygon);
                    var pointsInCurrentPolygon = module.getPointsIn(searchInfo, currentPolygonTester);
                    module.toggleSelected(searchInfo, !subtract, pointsInCurrentPolygon);

                    var pointsNoLongerSelected = difference(pointsInPolygon[i], pointsInCurrentPolygon);

                    traceSelection = module.toggleSelected(searchInfo, false, pointsNoLongerSelected);
                    pointsInPolygon[i] = pointsInCurrentPolygon;

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
                for(i = 0; i < searchTraces.length; i++) {
                    searchInfo = searchTraces[i];
                    searchInfo._module.toggleSelected(searchInfo, false);
                }

                // clear visual boundaries of selection area if displayed
                outlines.remove();

                updateSelectedState(gd, searchTraces);

                gd.emit('plotly_deselect', null);
            }
            else {
                // TODO What to do with the code below because we now have behavior for a single click
                selectOnClick(gd, numClicks, evt, dragOptions.xaxes, dragOptions.yaxes, outlines, dragOptions.subplot);

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
}

// Missing features
// ----------------
// TODO handle clearing selection when no point is clicked (based on hoverData)
// TODO remove console.log statements
function selectOnClick(gd, numClicks, evt, xAxes, yAxes, outlines, subplot) {
    var hoverData = gd._hoverdata;
    var retainSelection = shouldRetainSelection(evt);
    var searchTraces;
    var searchInfo;
    var trace;
    var clearEntireSelection;
    var clickedPts;
    var clickedPt;
    var shouldSelect;
    var traceSelection;
    var allSelectionItems;
    var eventData;
    var i;
    var j;

    if(numClicks === 1 && isHoverDataSet(hoverData)) {
        allSelectionItems = [];

        searchTraces = determineSearchTraces(gd, xAxes, yAxes, subplot);
        clearEntireSelection = entireSelectionToBeCleared(searchTraces, hoverData);

        for(i = 0; i < searchTraces.length; i++) {
            searchInfo = searchTraces[i];
            trace = searchInfo.cd[0].trace;

            // Clear old selection if needed
            if(!retainSelection || clearEntireSelection) {
                searchInfo._module.toggleSelected(searchInfo, false);
                if(outlines) outlines.remove();

                if(clearEntireSelection) continue;
            }

            // Determine clicked points,
            // call selection modification functions of the trace's module
            // and collect the resulting set of selected points
            clickedPts = clickedPtsFor(searchInfo, hoverData);
            if(clickedPts.length > 0) {
                for(j = 0; j < clickedPts.length; j++) {
                    clickedPt = clickedPts[j];
                    var ptSelected = isPointSelected(trace, clickedPt);
                    shouldSelect = !ptSelected || (ptSelected && !clearEntireSelection && !retainSelection);
                    traceSelection = searchInfo._module.toggleSelected(searchInfo, shouldSelect, [clickedPt.pointNumber]);
                }
            } else {
                // If current trace has no pts clicked, we at least call toggleSelected
                // with an empty array to obtain currently selected points for this trace.
                traceSelection = searchInfo._module.toggleSelected(searchInfo, true, []);
            }

            // Merge this trace's selection with the other ones
            // to prepare the grand selection state update
            allSelectionItems = allSelectionItems.concat(fillSelectionItem(traceSelection, searchInfo));
        }

        // Grand selection state update needs to be done once for the entire plot
        // console.log('allSelItems '  + allSelectionItems.map(asi => asi.pointNumber));
        if(clearEntireSelection) {
            updateSelectedState(gd, searchTraces);
        } else {
            eventData = {points: allSelectionItems};
            updateSelectedState(gd, searchTraces, eventData);
        }
    }

    function isHoverDataSet(hoverData) {
        return hoverData &&
          Array.isArray(hoverData) &&
          hoverData[0].hoverOnBox !== true;
    }

    /**
     * Function to determine the clicked points for the given searchInfo (trace)
     * based on the passed hoverData.
     *
     * Function assumes the following about hoverData:
     * - when hoverData has more than one element (e.g. box trace),
     *   if a point is hovered upon, the clicked point is the first
     *   element in the array. It is assumed that fx/hover.js and satellite
     *   modules are doing that correctly.
     * - at the moment only one point at a time is considered to be selected
     *   upon one click.
     *
     * Function also encapsulates special knowledge about the slight
     * inconsistencies in what hoverData can look like for different
     * trace types. As hoverData will become more homogeneous, this
     * logic will become cleaner.
     *
     * See https://github.com/plotly/plotly.js/issues/1852 for the
     * respective discussion.
     */
    function clickedPtsFor(searchInfo, hoverData) {
        var clickedPts = [];
        var hoverDatum;

        if(hoverData.length > 0) {
            hoverDatum = hoverData[0];
            if(hoverDatum.fullData._expandedIndex === searchInfo.cd[0].trace._expandedIndex) {
                // Special case for box (and violin)
                if(hoverDatum.hoverOnBox === true) return clickedPts;

                // TODO hoverDatum not having a pointNumber but a binNumber seems to be an oddity of histogram only
                // Not deleting .pointNumber in histogram/event_data.js would simplify code here and in addition
                // would not break the hover event structure
                // documented at https://plot.ly/javascript/hover-events/
                if(hoverDatum.pointNumber !== undefined) {
                    clickedPts.push({
                        pointNumber: hoverDatum.pointNumber
                    });
                } else if(hoverDatum.binNumber !== undefined) {
                    clickedPts.push({
                        pointNumber: hoverDatum.binNumber,
                        pointNumbers: hoverDatum.pointNumbers
                    });
                }
            }
        }

        return clickedPts;
    }
}

function determineSearchTraces(gd, xAxes, yAxes, subplot) {
    var searchTraces = [];
    var xAxisIds = xAxes.map(getAxId);
    var yAxisIds = yAxes.map(getAxId);
    var cd;
    var trace;
    var i;

    for(i = 0; i < gd.calcdata.length; i++) {
        cd = gd.calcdata[i];
        trace = cd[0].trace;

        if(trace.visible !== true || !trace._module || !trace._module.selectable) continue;

        if(subplot && (trace.subplot === subplot || trace.geo === subplot)) {
            searchTraces.push(createSearchInfo(trace._module, cd, xAxes[0], yAxes[0]));
        } else if(
          trace.type === 'splom' &&
          // FIXME: make sure we don't have more than single axis for splom
          trace._xaxes[xAxisIds[0]] && trace._yaxes[yAxisIds[0]]
        ) {
            searchTraces.push(createSearchInfo(trace._module, cd, xAxes[0], yAxes[0]));
        } else {
            if(xAxisIds.indexOf(trace.xaxis) === -1) continue;
            if(yAxisIds.indexOf(trace.yaxis) === -1) continue;

            searchTraces.push(createSearchInfo(trace._module, cd,
              getFromId(gd, trace.xaxis), getFromId(gd, trace.yaxis)));
        }
    }

    return searchTraces;
}

function createSearchInfo(module, calcData, xaxis, yaxis) {
    return {
        _module: module,
        cd: calcData,
        xaxis: xaxis,
        yaxis: yaxis
    };
}

function shouldRetainSelection(evt) {
    return evt.shiftKey;
}

// TODO Clean up
function entireSelectionToBeCleared(searchTraces, hoverData) {
    var somePointsSelected = false;
    for(var i = 0; i < searchTraces.length; i++) {
        var searchInfo = searchTraces[i];
        var trace = searchInfo.cd[0].trace;
        if(trace.selectedpoints && trace.selectedpoints.length > 0) {
            somePointsSelected = true;
            var selectedPtsCopy = trace.selectedpoints.slice();

            for(var j = 0; j < hoverData.length; j++) {
                var hoverDatum = hoverData[j];
                if(hoverDatum.fullData._expandedIndex === trace._expandedIndex) {
                    selectedPtsCopy = difference(selectedPtsCopy, hoverDatum.pointNumbers || [hoverDatum.pointNumber]);
                }
            }

            if(selectedPtsCopy.length > 0) {
                return false;
            }
        }
    }
    return somePointsSelected ? true : false;
}

function isPointSelected(trace, point) {
    if(!trace.selectedpoints && !Array.isArray(trace.selectedpoints)) return false;
    if(point.pointNumbers) {
        for(var i = 0; i < point.pointNumbers.length; i++) {
            if(trace.selectedpoints.indexOf(point.pointNumbers[i]) < 0) return false;
        }
        return true;
    }
    return trace.selectedpoints.indexOf(point.pointNumber) > -1;
}

/**
 * Updates the selection state properties of the passed traces
 * and initiates proper selection styling.
 *
 * If no eventData is passed, the selection state is cleared
 * for the traces passed.
 *
 * @param gd
 * @param searchTraces
 * @param eventData
 */
function updateSelectedState(gd, searchTraces, eventData) {
    var i, j, searchInfo, trace;

    if(eventData) {
        // var pts = eventData.points || []; TODO remove eventually
        var pts = eventData.points;

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
        }
    }

    // group searchInfo traces by trace modules
    var lookup = {};

    for(i = 0; i < searchTraces.length; i++) {
        searchInfo = searchTraces[i];

        var name = searchInfo._module.name;
        if(lookup[name]) {
            lookup[name].push(searchInfo);
        } else {
            lookup[name] = [searchInfo];
        }
    }

    var keys = Object.keys(lookup).sort(sortModules);

    for(i = 0; i < keys.length; i++) {
        var items = lookup[keys[i]];
        var len = items.length;
        var item0 = items[0];
        var trace0 = item0.cd[0].trace;
        var _module = item0._module;
        var styleSelection = _module.styleOnSelect || _module.style;

        if(Registry.traceIs(trace0, 'regl')) {
            // plot regl traces per module
            var cds = new Array(len);
            for(j = 0; j < len; j++) {
                cds[j] = items[j].cd;
            }
            styleSelection(gd, cds);
        } else {
            // plot svg trace per trace
            for(j = 0; j < len; j++) {
                styleSelection(gd, items[j].cd);
            }
        }
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

function clearSelect(zoomlayer) {
    // until we get around to persistent selections, remove the outline
    // here. The selection itself will be removed when the plot redraws
    // at the end.
    zoomlayer.selectAll('.select-outline').remove();
}

module.exports = {
    prepSelect: prepSelect,
    clearSelect: clearSelect,
    selectOnClick: selectOnClick
};
