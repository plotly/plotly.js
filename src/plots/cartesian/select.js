/**
* Copyright 2012-2020, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var polybool = require('polybooljs');

var Registry = require('../../registry');
var dashStyle = require('../../components/drawing').dashStyle;
var Color = require('../../components/color');
var Fx = require('../../components/fx');
var makeEventData = require('../../components/fx/helpers').makeEventData;
var dragHelpers = require('../../components/dragelement/helpers');
var freeMode = dragHelpers.freeMode;
var rectMode = dragHelpers.rectMode;
var drawMode = dragHelpers.drawMode;
var openMode = dragHelpers.openMode;
var selectMode = dragHelpers.selectMode;

var displayOutlines = require('../../components/shapes/draw_newshape/display_outlines');
var handleEllipse = require('../../components/shapes/draw_newshape/helpers').handleEllipse;
var newShapes = require('../../components/shapes/draw_newshape/newshapes');

var Lib = require('../../lib');
var polygon = require('../../lib/polygon');
var throttle = require('../../lib/throttle');
var getFromId = require('./axis_ids').getFromId;
var clearGlCanvases = require('../../lib/clear_gl_canvases');

var redrawReglTraces = require('../../plot_api/subroutines').redrawReglTraces;

var constants = require('./constants');
var MINSELECT = constants.MINSELECT;

var filteredPolygon = polygon.filter;
var polygonTester = polygon.tester;

var clearSelect = require('./handle_outline').clearSelect;

var helpers = require('./helpers');
var p2r = helpers.p2r;
var axValue = helpers.axValue;
var getTransform = helpers.getTransform;

function prepSelect(e, startX, startY, dragOptions, mode) {
    var isFreeMode = freeMode(mode);
    var isRectMode = rectMode(mode);
    var isOpenMode = openMode(mode);
    var isDrawMode = drawMode(mode);
    var isSelectMode = selectMode(mode);

    var isLine = mode === 'drawline';
    var isEllipse = mode === 'drawcircle';
    var isLineOrEllipse = isLine || isEllipse; // cases with two start & end positions

    var gd = dragOptions.gd;
    var fullLayout = gd._fullLayout;
    var zoomLayer = fullLayout._zoomlayer;
    var dragBBox = dragOptions.element.getBoundingClientRect();
    var plotinfo = dragOptions.plotinfo;
    var transform = getTransform(plotinfo);
    var x0 = startX - dragBBox.left;
    var y0 = startY - dragBBox.top;

    fullLayout._calcInverseTransform(gd);
    var transformedCoords = Lib.apply3DTransform(fullLayout._invTransform)(x0, y0);
    x0 = transformedCoords[0];
    y0 = transformedCoords[1];
    var scaleX = fullLayout._invScaleX;
    var scaleY = fullLayout._invScaleY;

    var x1 = x0;
    var y1 = y0;
    var path0 = 'M' + x0 + ',' + y0;
    var pw = dragOptions.xaxes[0]._length;
    var ph = dragOptions.yaxes[0]._length;
    var allAxes = dragOptions.xaxes.concat(dragOptions.yaxes);
    var subtract = e.altKey &&
        !(drawMode(mode) && isOpenMode);

    var filterPoly, selectionTester, mergedPolygons, currentPolygon;
    var i, searchInfo, eventData;

    coerceSelectionsCache(e, gd, dragOptions);

    if(isFreeMode) {
        filterPoly = filteredPolygon([[x0, y0]], constants.BENDPX);
    }

    var outlines = zoomLayer.selectAll('path.select-outline-' + plotinfo.id).data(isDrawMode ? [0] : [1, 2]);
    var drwStyle = fullLayout.newshape;

    outlines.enter()
        .append('path')
        .attr('class', function(d) { return 'select-outline select-outline-' + d + ' select-outline-' + plotinfo.id; })
        .style(isDrawMode ? {
            opacity: drwStyle.opacity / 2,
            fill: isOpenMode ? undefined : drwStyle.fillcolor,
            stroke: drwStyle.line.color,
            'stroke-dasharray': dashStyle(drwStyle.line.dash, drwStyle.line.width),
            'stroke-width': drwStyle.line.width + 'px'
        } : {})
        .attr('fill-rule', drwStyle.fillrule)
        .classed('cursor-move', isDrawMode ? true : false)
        .attr('transform', transform)
        .attr('d', path0 + 'Z');

    var corners = zoomLayer.append('path')
        .attr('class', 'zoombox-corners')
        .style({
            fill: Color.background,
            stroke: Color.defaultLine,
            'stroke-width': 1
        })
        .attr('transform', transform)
        .attr('d', 'M0,0Z');


    var throttleID = fullLayout._uid + constants.SELECTID;
    var selection = [];

    // find the traces to search for selection points
    var searchTraces = determineSearchTraces(gd, dragOptions.xaxes,
      dragOptions.yaxes, dragOptions.subplot);

    function ascending(a, b) { return a - b; }

    // allow subplots to override fillRangeItems routine
    var fillRangeItems;

    if(plotinfo.fillRangeItems) {
        fillRangeItems = plotinfo.fillRangeItems;
    } else {
        if(isRectMode) {
            fillRangeItems = function(eventData, poly) {
                var ranges = eventData.range = {};

                for(i = 0; i < allAxes.length; i++) {
                    var ax = allAxes[i];
                    var axLetter = ax._id.charAt(0);

                    ranges[ax._id] = [
                        p2r(ax, poly[axLetter + 'min']),
                        p2r(ax, poly[axLetter + 'max'])
                    ].sort(ascending);
                }
            };
        } else { // case of isFreeMode
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
        x1 = Math.max(0, Math.min(pw, scaleX * dx0 + x0));
        y1 = Math.max(0, Math.min(ph, scaleY * dy0 + y0));

        var dx = Math.abs(x1 - x0);
        var dy = Math.abs(y1 - y0);

        if(isRectMode) {
            var direction;
            var start, end;

            if(isSelectMode) {
                var q = fullLayout.selectdirection;

                if(q === 'any') {
                    if(dy < Math.min(dx * 0.6, MINSELECT)) {
                        direction = 'h';
                    } else if(dx < Math.min(dy * 0.6, MINSELECT)) {
                        direction = 'v';
                    } else {
                        direction = 'd';
                    }
                } else {
                    direction = q;
                }

                switch(direction) {
                    case 'h':
                        start = isEllipse ? ph / 2 : 0;
                        end = ph;
                        break;
                    case 'v':
                        start = isEllipse ? pw / 2 : 0;
                        end = pw;
                        break;
                }
            }

            if(isDrawMode) {
                switch(fullLayout.newshape.drawdirection) {
                    case 'vertical':
                        direction = 'h';
                        start = isEllipse ? ph / 2 : 0;
                        end = ph;
                        break;
                    case 'horizontal':
                        direction = 'v';
                        start = isEllipse ? pw / 2 : 0;
                        end = pw;
                        break;
                    case 'ortho':
                        if(dx < dy) {
                            direction = 'h';
                            start = y0;
                            end = y1;
                        } else {
                            direction = 'v';
                            start = x0;
                            end = x1;
                        }
                        break;
                    default: // i.e. case of 'diagonal'
                        direction = 'd';
                }
            }

            if(direction === 'h') {
                // horizontal motion
                currentPolygon = isLineOrEllipse ?
                    handleEllipse(isEllipse, [x1, start], [x1, end]) : // using x1 instead of x0 allows adjusting the line while drawing
                    [[x0, start], [x0, end], [x1, end], [x1, start]]; // make a vertical box

                currentPolygon.xmin = isLineOrEllipse ? x1 : Math.min(x0, x1);
                currentPolygon.xmax = isLineOrEllipse ? x1 : Math.max(x0, x1);
                currentPolygon.ymin = Math.min(start, end);
                currentPolygon.ymax = Math.max(start, end);
                // extras to guide users in keeping a straight selection
                corners.attr('d', 'M' + currentPolygon.xmin + ',' + (y0 - MINSELECT) +
                    'h-4v' + (2 * MINSELECT) + 'h4Z' +
                    'M' + (currentPolygon.xmax - 1) + ',' + (y0 - MINSELECT) +
                    'h4v' + (2 * MINSELECT) + 'h-4Z');
            } else if(direction === 'v') {
                // vertical motion
                currentPolygon = isLineOrEllipse ?
                    handleEllipse(isEllipse, [start, y1], [end, y1]) : // using y1 instead of y0 allows adjusting the line while drawing
                    [[start, y0], [start, y1], [end, y1], [end, y0]]; // make a horizontal box

                currentPolygon.xmin = Math.min(start, end);
                currentPolygon.xmax = Math.max(start, end);
                currentPolygon.ymin = isLineOrEllipse ? y1 : Math.min(y0, y1);
                currentPolygon.ymax = isLineOrEllipse ? y1 : Math.max(y0, y1);
                corners.attr('d', 'M' + (x0 - MINSELECT) + ',' + currentPolygon.ymin +
                    'v-4h' + (2 * MINSELECT) + 'v4Z' +
                    'M' + (x0 - MINSELECT) + ',' + (currentPolygon.ymax - 1) +
                    'v4h' + (2 * MINSELECT) + 'v-4Z');
            } else if(direction === 'd') {
                // diagonal motion
                currentPolygon = isLineOrEllipse ?
                    handleEllipse(isEllipse, [x0, y0], [x1, y1]) :
                    [[x0, y0], [x0, y1], [x1, y1], [x1, y0]];

                currentPolygon.xmin = Math.min(x0, x1);
                currentPolygon.xmax = Math.max(x0, x1);
                currentPolygon.ymin = Math.min(y0, y1);
                currentPolygon.ymax = Math.max(y0, y1);
                corners.attr('d', 'M0,0Z');
            }
        } else if(isFreeMode) {
            filterPoly.addPt([x1, y1]);
            currentPolygon = filterPoly.filtered;
        }

        // create outline & tester
        if(dragOptions.selectionDefs && dragOptions.selectionDefs.length) {
            mergedPolygons = mergePolygons(dragOptions.mergedPolygons, currentPolygon, subtract);
            currentPolygon.subtract = subtract;
            selectionTester = multiTester(dragOptions.selectionDefs.concat([currentPolygon]));
        } else {
            mergedPolygons = [currentPolygon];
            selectionTester = polygonTester(currentPolygon);
        }

        // display polygons on the screen
        displayOutlines(convertPoly(mergedPolygons, isOpenMode), outlines, dragOptions);

        if(isSelectMode) {
            throttle.throttle(
                throttleID,
                constants.SELECTDELAY,
                function() {
                    selection = [];

                    var thisSelection;
                    var traceSelections = [];
                    var traceSelection;
                    for(i = 0; i < searchTraces.length; i++) {
                        searchInfo = searchTraces[i];

                        traceSelection = searchInfo._module.selectPoints(searchInfo, selectionTester);
                        traceSelections.push(traceSelection);

                        thisSelection = fillSelectionItem(traceSelection, searchInfo);

                        if(selection.length) {
                            for(var j = 0; j < thisSelection.length; j++) {
                                selection.push(thisSelection[j]);
                            }
                        } else selection = thisSelection;
                    }

                    eventData = {points: selection};
                    updateSelectedState(gd, searchTraces, eventData);
                    fillRangeItems(eventData, currentPolygon, filterPoly);
                    dragOptions.gd.emit('plotly_selecting', eventData);
                }
            );
        }
    };

    dragOptions.clickFn = function(numClicks, evt) {
        corners.remove();

        if(gd._fullLayout._activeShapeIndex >= 0) {
            gd._fullLayout._deactivateShape(gd);
            return;
        }
        if(isDrawMode) return;

        var clickmode = fullLayout.clickmode;

        throttle.done(throttleID).then(function() {
            throttle.clear(throttleID);
            if(numClicks === 2) {
                // clear selection on doubleclick
                outlines.remove();
                for(i = 0; i < searchTraces.length; i++) {
                    searchInfo = searchTraces[i];
                    searchInfo._module.selectPoints(searchInfo, false);
                }

                updateSelectedState(gd, searchTraces);

                clearSelectionsCache(dragOptions);

                gd.emit('plotly_deselect', null);
            } else {
                if(clickmode.indexOf('select') > -1) {
                    selectOnClick(evt, gd, dragOptions.xaxes, dragOptions.yaxes,
                      dragOptions.subplot, dragOptions, outlines);
                }

                if(clickmode === 'event') {
                    // TODO: remove in v2 - this was probably never intended to work as it does,
                    // but in case anyone depends on it we don't want to break it now.
                    // Note that click-to-select introduced pre v2 also emitts proper
                    // event data when clickmode is having 'select' in its flag list.
                    gd.emit('plotly_selected', undefined);
                }
            }

            Fx.click(gd, evt);
        }).catch(Lib.error);
    };

    dragOptions.doneFn = function() {
        corners.remove();

        throttle.done(throttleID).then(function() {
            throttle.clear(throttleID);
            dragOptions.gd.emit('plotly_selected', eventData);

            if(currentPolygon && dragOptions.selectionDefs) {
                // save last polygons
                currentPolygon.subtract = subtract;
                dragOptions.selectionDefs.push(currentPolygon);

                // we have to keep reference to arrays container
                dragOptions.mergedPolygons.length = 0;
                [].push.apply(dragOptions.mergedPolygons, mergedPolygons);
            }

            if(dragOptions.doneFnCompleted) {
                dragOptions.doneFnCompleted(selection);
            }
        }).catch(Lib.error);

        if(isDrawMode) {
            clearSelectionsCache(dragOptions);
        }
    };
}

function selectOnClick(evt, gd, xAxes, yAxes, subplot, dragOptions, polygonOutlines) {
    var hoverData = gd._hoverdata;
    var fullLayout = gd._fullLayout;
    var clickmode = fullLayout.clickmode;
    var sendEvents = clickmode.indexOf('event') > -1;
    var selection = [];
    var searchTraces, searchInfo, currentSelectionDef, selectionTester, traceSelection;
    var thisTracesSelection, pointOrBinSelected, subtract, eventData, i;

    if(isHoverDataSet(hoverData)) {
        coerceSelectionsCache(evt, gd, dragOptions);
        searchTraces = determineSearchTraces(gd, xAxes, yAxes, subplot);
        var clickedPtInfo = extractClickedPtInfo(hoverData, searchTraces);
        var isBinnedTrace = clickedPtInfo.pointNumbers.length > 0;


        // Note: potentially costly operation isPointOrBinSelected is
        // called as late as possible through the use of an assignment
        // in an if condition.
        if(isBinnedTrace ?
            isOnlyThisBinSelected(searchTraces, clickedPtInfo) :
            isOnlyOnePointSelected(searchTraces) &&
                (pointOrBinSelected = isPointOrBinSelected(clickedPtInfo))) {
            if(polygonOutlines) polygonOutlines.remove();
            for(i = 0; i < searchTraces.length; i++) {
                searchInfo = searchTraces[i];
                searchInfo._module.selectPoints(searchInfo, false);
            }

            updateSelectedState(gd, searchTraces);

            clearSelectionsCache(dragOptions);

            if(sendEvents) {
                gd.emit('plotly_deselect', null);
            }
        } else {
            subtract = evt.shiftKey &&
              (pointOrBinSelected !== undefined ?
                pointOrBinSelected :
                isPointOrBinSelected(clickedPtInfo));
            currentSelectionDef = newPointSelectionDef(clickedPtInfo.pointNumber, clickedPtInfo.searchInfo, subtract);

            var allSelectionDefs = dragOptions.selectionDefs.concat([currentSelectionDef]);
            selectionTester = multiTester(allSelectionDefs);

            for(i = 0; i < searchTraces.length; i++) {
                traceSelection = searchTraces[i]._module.selectPoints(searchTraces[i], selectionTester);
                thisTracesSelection = fillSelectionItem(traceSelection, searchTraces[i]);

                if(selection.length) {
                    for(var j = 0; j < thisTracesSelection.length; j++) {
                        selection.push(thisTracesSelection[j]);
                    }
                } else selection = thisTracesSelection;
            }

            eventData = {points: selection};
            updateSelectedState(gd, searchTraces, eventData);

            if(currentSelectionDef && dragOptions) {
                dragOptions.selectionDefs.push(currentSelectionDef);
            }

            if(polygonOutlines) {
                var polygons = dragOptions.mergedPolygons;
                var isOpenMode = openMode(dragOptions.dragmode);

                // display polygons on the screen
                displayOutlines(convertPoly(polygons, isOpenMode), polygonOutlines, dragOptions);
            }

            if(sendEvents) {
                gd.emit('plotly_selected', eventData);
            }
        }
    }
}

/**
 * Constructs a new point selection definition object.
 */
function newPointSelectionDef(pointNumber, searchInfo, subtract) {
    return {
        pointNumber: pointNumber,
        searchInfo: searchInfo,
        subtract: subtract
    };
}

function isPointSelectionDef(o) {
    return 'pointNumber' in o && 'searchInfo' in o;
}

/*
 * Constructs a new point number tester.
 */
function newPointNumTester(pointSelectionDef) {
    return {
        xmin: 0,
        xmax: 0,
        ymin: 0,
        ymax: 0,
        pts: [],
        contains: function(pt, omitFirstEdge, pointNumber, searchInfo) {
            var idxWantedTrace = pointSelectionDef.searchInfo.cd[0].trace._expandedIndex;
            var idxActualTrace = searchInfo.cd[0].trace._expandedIndex;
            return idxActualTrace === idxWantedTrace &&
              pointNumber === pointSelectionDef.pointNumber;
        },
        isRect: false,
        degenerate: false,
        subtract: pointSelectionDef.subtract
    };
}

/**
 * Wraps multiple selection testers.
 *
 * @param {Array} list - An array of selection testers.
 *
 * @return a selection tester object with a contains function
 * that can be called to evaluate a point against all wrapped
 * selection testers that were passed in list.
 */
function multiTester(list) {
    var testers = [];
    var xmin = isPointSelectionDef(list[0]) ? 0 : list[0][0][0];
    var xmax = xmin;
    var ymin = isPointSelectionDef(list[0]) ? 0 : list[0][0][1];
    var ymax = ymin;

    for(var i = 0; i < list.length; i++) {
        if(isPointSelectionDef(list[i])) {
            testers.push(newPointNumTester(list[i]));
        } else {
            var tester = polygon.tester(list[i]);
            tester.subtract = list[i].subtract;
            testers.push(tester);
            xmin = Math.min(xmin, tester.xmin);
            xmax = Math.max(xmax, tester.xmax);
            ymin = Math.min(ymin, tester.ymin);
            ymax = Math.max(ymax, tester.ymax);
        }
    }

    /**
     * Tests if the given point is within this tester.
     *
     * @param {Array} pt - [0] is the x coordinate, [1] is the y coordinate of the point.
     * @param {*} arg - An optional parameter to pass down to wrapped testers.
     * @param {number} pointNumber - The point number of the point within the underlying data array.
     * @param {number} searchInfo - An object identifying the trace the point is contained in.
     *
     * @return {boolean} true if point is considered to be selected, false otherwise.
     */
    function contains(pt, arg, pointNumber, searchInfo) {
        var contained = false;
        for(var i = 0; i < testers.length; i++) {
            if(testers[i].contains(pt, arg, pointNumber, searchInfo)) {
                // if contained by subtract tester - exclude the point
                contained = testers[i].subtract === false;
            }
        }

        return contained;
    }

    return {
        xmin: xmin,
        xmax: xmax,
        ymin: ymin,
        ymax: ymax,
        pts: [],
        contains: contains,
        isRect: false,
        degenerate: false
    };
}

function coerceSelectionsCache(evt, gd, dragOptions) {
    gd._fullLayout._drawing = false;

    var fullLayout = gd._fullLayout;
    var plotinfo = dragOptions.plotinfo;
    var dragmode = dragOptions.dragmode;

    var selectingOnSameSubplot = (
        fullLayout._lastSelectedSubplot &&
        fullLayout._lastSelectedSubplot === plotinfo.id
    );

    var hasModifierKey = (evt.shiftKey || evt.altKey) &&
        !(drawMode(dragmode) && openMode(dragmode));

    if(selectingOnSameSubplot && hasModifierKey &&
      (plotinfo.selection && plotinfo.selection.selectionDefs) && !dragOptions.selectionDefs) {
        // take over selection definitions from prev mode, if any
        dragOptions.selectionDefs = plotinfo.selection.selectionDefs;
        dragOptions.mergedPolygons = plotinfo.selection.mergedPolygons;
    } else if(!hasModifierKey || !plotinfo.selection) {
        clearSelectionsCache(dragOptions);
    }

    // clear selection outline when selecting a different subplot
    if(!selectingOnSameSubplot) {
        clearSelect(gd);
        fullLayout._lastSelectedSubplot = plotinfo.id;
    }
}

function clearSelectionsCache(dragOptions) {
    var dragmode = dragOptions.dragmode;
    var plotinfo = dragOptions.plotinfo;

    var gd = dragOptions.gd;
    if(gd._fullLayout._activeShapeIndex >= 0) {
        gd._fullLayout._deactivateShape(gd);
    }

    if(drawMode(dragmode)) {
        var fullLayout = gd._fullLayout;
        var zoomLayer = fullLayout._zoomlayer;

        var outlines = zoomLayer.selectAll('.select-outline-' + plotinfo.id);
        if(outlines && gd._fullLayout._drawing) {
            // add shape
            var shapes = newShapes(outlines, dragOptions);
            if(shapes) {
                Registry.call('_guiRelayout', gd, {
                    shapes: shapes
                });
            }

            gd._fullLayout._drawing = false;
        }
    }

    plotinfo.selection = {};
    plotinfo.selection.selectionDefs = dragOptions.selectionDefs = [];
    plotinfo.selection.mergedPolygons = dragOptions.mergedPolygons = [];
}

function determineSearchTraces(gd, xAxes, yAxes, subplot) {
    var searchTraces = [];
    var xAxisIds = xAxes.map(function(ax) { return ax._id; });
    var yAxisIds = yAxes.map(function(ax) { return ax._id; });
    var cd, trace, i;

    for(i = 0; i < gd.calcdata.length; i++) {
        cd = gd.calcdata[i];
        trace = cd[0].trace;

        if(trace.visible !== true || !trace._module || !trace._module.selectPoints) continue;

        if(subplot && (trace.subplot === subplot || trace.geo === subplot)) {
            searchTraces.push(createSearchInfo(trace._module, cd, xAxes[0], yAxes[0]));
        } else if(
          trace.type === 'splom' &&
          // FIXME: make sure we don't have more than single axis for splom
          trace._xaxes[xAxisIds[0]] && trace._yaxes[yAxisIds[0]]
        ) {
            var info = createSearchInfo(trace._module, cd, xAxes[0], yAxes[0]);
            info.scene = gd._fullLayout._splomScenes[trace.uid];
            searchTraces.push(info);
        } else if(
          trace.type === 'sankey'
        ) {
            var sankeyInfo = createSearchInfo(trace._module, cd, xAxes[0], yAxes[0]);
            searchTraces.push(sankeyInfo);
        } else {
            if(xAxisIds.indexOf(trace.xaxis) === -1) continue;
            if(yAxisIds.indexOf(trace.yaxis) === -1) continue;

            searchTraces.push(createSearchInfo(trace._module, cd,
              getFromId(gd, trace.xaxis), getFromId(gd, trace.yaxis)));
        }
    }

    return searchTraces;

    function createSearchInfo(module, calcData, xaxis, yaxis) {
        return {
            _module: module,
            cd: calcData,
            xaxis: xaxis,
            yaxis: yaxis
        };
    }
}

function isHoverDataSet(hoverData) {
    return hoverData &&
      Array.isArray(hoverData) &&
      hoverData[0].hoverOnBox !== true;
}

function extractClickedPtInfo(hoverData, searchTraces) {
    var hoverDatum = hoverData[0];
    var pointNumber = -1;
    var pointNumbers = [];
    var searchInfo, i;

    for(i = 0; i < searchTraces.length; i++) {
        searchInfo = searchTraces[i];
        if(hoverDatum.fullData._expandedIndex === searchInfo.cd[0].trace._expandedIndex) {
            // Special case for box (and violin)
            if(hoverDatum.hoverOnBox === true) {
                break;
            }

            // Hint: in some traces like histogram, one graphical element
            // doesn't correspond to one particular data point, but to
            // bins of data points. Thus, hoverDatum can have a binNumber
            // property instead of pointNumber.
            if(hoverDatum.pointNumber !== undefined) {
                pointNumber = hoverDatum.pointNumber;
            } else if(hoverDatum.binNumber !== undefined) {
                pointNumber = hoverDatum.binNumber;
                pointNumbers = hoverDatum.pointNumbers;
            }

            break;
        }
    }

    return {
        pointNumber: pointNumber,
        pointNumbers: pointNumbers,
        searchInfo: searchInfo
    };
}

function isPointOrBinSelected(clickedPtInfo) {
    var trace = clickedPtInfo.searchInfo.cd[0].trace;
    var ptNum = clickedPtInfo.pointNumber;
    var ptNums = clickedPtInfo.pointNumbers;
    var ptNumsSet = ptNums.length > 0;

    // When pointsNumbers is set (e.g. histogram's binning),
    // it is assumed that when the first point of
    // a bin is selected, all others are as well
    var ptNumToTest = ptNumsSet ? ptNums[0] : ptNum;

    // TODO potential performance improvement
    // Primarily we need this function to determine if a click adds
    // or subtracts from a selection.
    // In cases `trace.selectedpoints` is a huge array, indexOf
    // might be slow. One remedy would be to introduce a hash somewhere.
    return trace.selectedpoints ? trace.selectedpoints.indexOf(ptNumToTest) > -1 : false;
}

function isOnlyThisBinSelected(searchTraces, clickedPtInfo) {
    var tracesWithSelectedPts = [];
    var searchInfo, trace, isSameTrace, i;

    for(i = 0; i < searchTraces.length; i++) {
        searchInfo = searchTraces[i];
        if(searchInfo.cd[0].trace.selectedpoints && searchInfo.cd[0].trace.selectedpoints.length > 0) {
            tracesWithSelectedPts.push(searchInfo);
        }
    }

    if(tracesWithSelectedPts.length === 1) {
        isSameTrace = tracesWithSelectedPts[0] === clickedPtInfo.searchInfo;
        if(isSameTrace) {
            trace = clickedPtInfo.searchInfo.cd[0].trace;
            if(trace.selectedpoints.length === clickedPtInfo.pointNumbers.length) {
                for(i = 0; i < clickedPtInfo.pointNumbers.length; i++) {
                    if(trace.selectedpoints.indexOf(clickedPtInfo.pointNumbers[i]) < 0) {
                        return false;
                    }
                }
                return true;
            }
        }
    }

    return false;
}

function isOnlyOnePointSelected(searchTraces) {
    var len = 0;
    var searchInfo, trace, i;

    for(i = 0; i < searchTraces.length; i++) {
        searchInfo = searchTraces[i];
        trace = searchInfo.cd[0].trace;
        if(trace.selectedpoints) {
            if(trace.selectedpoints.length > 1) return false;

            len += trace.selectedpoints.length;
            if(len > 1) return false;
        }
    }

    return len === 1;
}

function updateSelectedState(gd, searchTraces, eventData) {
    var i, searchInfo, cd, trace;

    // before anything else, update preGUI if necessary
    for(i = 0; i < searchTraces.length; i++) {
        var fullInputTrace = searchTraces[i].cd[0].trace._fullInput;
        var tracePreGUI = gd._fullLayout._tracePreGUI[fullInputTrace.uid] || {};
        if(tracePreGUI.selectedpoints === undefined) {
            tracePreGUI.selectedpoints = fullInputTrace._input.selectedpoints || null;
        }
    }

    if(eventData) {
        var pts = eventData.points || [];

        for(i = 0; i < searchTraces.length; i++) {
            trace = searchTraces[i].cd[0].trace;
            trace._input.selectedpoints = trace._fullInput.selectedpoints = [];
            if(trace._fullInput !== trace) trace.selectedpoints = [];
        }

        for(i = 0; i < pts.length; i++) {
            var pt = pts[i];
            var data = pt.data;
            var fullData = pt.fullData;

            if(pt.pointIndices) {
                [].push.apply(data.selectedpoints, pt.pointIndices);
                if(trace._fullInput !== trace) {
                    [].push.apply(fullData.selectedpoints, pt.pointIndices);
                }
            } else {
                data.selectedpoints.push(pt.pointIndex);
                if(trace._fullInput !== trace) {
                    fullData.selectedpoints.push(pt.pointIndex);
                }
            }
        }
    } else {
        for(i = 0; i < searchTraces.length; i++) {
            trace = searchTraces[i].cd[0].trace;
            delete trace.selectedpoints;
            delete trace._input.selectedpoints;
            if(trace._fullInput !== trace) {
                delete trace._fullInput.selectedpoints;
            }
        }
    }

    var hasRegl = false;

    for(i = 0; i < searchTraces.length; i++) {
        searchInfo = searchTraces[i];
        cd = searchInfo.cd;
        trace = cd[0].trace;

        if(Registry.traceIs(trace, 'regl')) {
            hasRegl = true;
        }

        var _module = searchInfo._module;
        var fn = _module.styleOnSelect || _module.style;
        if(fn) {
            fn(gd, cd, cd[0].node3);
            if(cd[0].nodeRangePlot3) fn(gd, cd, cd[0].nodeRangePlot3);
        }
    }

    if(hasRegl) {
        clearGlCanvases(gd);
        redrawReglTraces(gd);
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

function convertPoly(polygonsIn, isOpenMode) { // add M and L command to draft positions
    var polygonsOut = [];
    for(var i = 0; i < polygonsIn.length; i++) {
        polygonsOut[i] = [];
        for(var j = 0; j < polygonsIn[i].length; j++) {
            polygonsOut[i][j] = [];
            polygonsOut[i][j][0] = j ? 'L' : 'M';
            for(var k = 0; k < polygonsIn[i][j].length; k++) {
                polygonsOut[i][j].push(
                    polygonsIn[i][j][k]
                );
            }
        }

        if(!isOpenMode) {
            polygonsOut[i].push([
                'Z',
                polygonsOut[i][0][1], // initial x
                polygonsOut[i][0][2]  // initial y
            ]);
        }
    }

    return polygonsOut;
}

module.exports = {
    prepSelect: prepSelect,
    clearSelect: clearSelect,
    clearSelectionsCache: clearSelectionsCache,
    selectOnClick: selectOnClick
};
