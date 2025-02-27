'use strict';

var polybool = require('polybooljs');
var pointInPolygon = require('point-in-polygon/nested'); // could we use contains lib/polygon instead?

var Registry = require('../../registry');
var dashStyle = require('../drawing').dashStyle;
var Color = require('../color');
var Fx = require('../fx');
var makeEventData = require('../fx/helpers').makeEventData;
var dragHelpers = require('../dragelement/helpers');
var freeMode = dragHelpers.freeMode;
var rectMode = dragHelpers.rectMode;
var drawMode = dragHelpers.drawMode;
var openMode = dragHelpers.openMode;
var selectMode = dragHelpers.selectMode;

var shapeHelpers = require('../shapes/helpers');
var shapeConstants = require('../shapes/constants');

var displayOutlines = require('../shapes/display_outlines');
var clearOutline = require('../shapes/handle_outline').clearOutline;

var newShapeHelpers = require('../shapes/draw_newshape/helpers');
var handleEllipse = newShapeHelpers.handleEllipse;
var readPaths = newShapeHelpers.readPaths;

var newShapes = require('../shapes/draw_newshape/newshapes').newShapes;

var newSelections = require('./draw_newselection/newselections');
var activateLastSelection = require('./draw').activateLastSelection;

var Lib = require('../../lib');
var ascending = Lib.sorterAsc;
var libPolygon = require('../../lib/polygon');
var throttle = require('../../lib/throttle');
var getFromId = require('../../plots/cartesian/axis_ids').getFromId;
var clearGlCanvases = require('../../lib/clear_gl_canvases');

var redrawReglTraces = require('../../plot_api/subroutines').redrawReglTraces;

var constants = require('./constants');
var MINSELECT = constants.MINSELECT;

var filteredPolygon = libPolygon.filter;
var polygonTester = libPolygon.tester;

var helpers = require('./helpers');
var p2r = helpers.p2r;
var axValue = helpers.axValue;
var getTransform = helpers.getTransform;

function hasSubplot(dragOptions) {
    // N.B. subplot may be falsy e.g zero sankey index!
    return dragOptions.subplot !== undefined;
}

function prepSelect(evt, startX, startY, dragOptions, mode) {
    var isCartesian = !hasSubplot(dragOptions);

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
    var immediateSelect = isSelectMode && fullLayout.newselection.mode === 'immediate' &&
        isCartesian; // N.B. only cartesian subplots have persistent selection

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
    var xAxis = dragOptions.xaxes[0];
    var yAxis = dragOptions.yaxes[0];
    var pw = xAxis._length;
    var ph = yAxis._length;

    var subtract = evt.altKey &&
        !(drawMode(mode) && isOpenMode);

    var filterPoly, selectionTesters, mergedPolygons, currentPolygon;
    var i, searchInfo, eventData;

    coerceSelectionsCache(evt, gd, dragOptions);

    if(isFreeMode) {
        filterPoly = filteredPolygon([[x0, y0]], constants.BENDPX);
    }

    var outlines = zoomLayer.selectAll('path.select-outline-' + plotinfo.id).data([1]);
    var newStyle = isDrawMode ?
        fullLayout.newshape :
        fullLayout.newselection;

    if(isDrawMode) {
        dragOptions.hasText = newStyle.label.text || newStyle.label.texttemplate;
    }

    var fillC = (isDrawMode && !isOpenMode) ? newStyle.fillcolor : 'rgba(0,0,0,0)';

    var strokeC = newStyle.line.color || (
        isCartesian ?
            Color.contrast(gd._fullLayout.plot_bgcolor) :
            '#7f7f7f' // non-cartesian subplot
    );

    outlines.enter()
        .append('path')
        .attr('class', 'select-outline select-outline-' + plotinfo.id)
        .style({
            opacity: isDrawMode ? newStyle.opacity / 2 : 1,
            'stroke-dasharray': dashStyle(newStyle.line.dash, newStyle.line.width),
            'stroke-width': newStyle.line.width + 'px',
            'shape-rendering': 'crispEdges'
        })
        .call(Color.stroke, strokeC)
        .call(Color.fill, fillC)
        .attr('fill-rule', 'evenodd')
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

    // create & style group for text label
    if(isDrawMode && dragOptions.hasText) {
        var shapeGroup = zoomLayer.select('.label-temp');
        if(shapeGroup.empty()) {
            shapeGroup = zoomLayer.append('g')
                .classed('label-temp', true)
                .classed('select-outline', true)
                .style({ opacity: 0.8 });
        }
    }

    var throttleID = fullLayout._uid + constants.SELECTID;
    var selection = [];

    // find the traces to search for selection points
    var searchTraces = determineSearchTraces(gd, dragOptions.xaxes,
      dragOptions.yaxes, dragOptions.subplot);

    if(immediateSelect && !evt.shiftKey) {
        dragOptions._clearSubplotSelections = function() {
            if(!isCartesian) return;

            var xRef = xAxis._id;
            var yRef = yAxis._id;
            deselectSubplot(gd, xRef, yRef, searchTraces);

            var selections = (gd.layout || {}).selections || [];
            var list = [];
            var selectionErased = false;
            for(var q = 0; q < selections.length; q++) {
                var s = fullLayout.selections[q];
                if(
                    !s ||
                    s.xref !== xRef ||
                    s.yref !== yRef
                ) {
                    list.push(selections[q]);
                } else {
                    selectionErased = true;
                }
            }

            if(selectionErased) {
                gd._fullLayout._noEmitSelectedAtStart = true;

                Registry.call('_guiRelayout', gd, {
                    selections: list
                });
            }
        };
    }

    var fillRangeItems = getFillRangeItems(dragOptions);

    dragOptions.moveFn = function(dx0, dy0) {
        if(dragOptions._clearSubplotSelections) {
            dragOptions._clearSubplotSelections();
            dragOptions._clearSubplotSelections = undefined;
        }

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
            selectionTesters = multiTester(dragOptions.selectionDefs.concat([currentPolygon]));
        } else {
            mergedPolygons = [currentPolygon];
            selectionTesters = polygonTester(currentPolygon);
        }

        // display polygons on the screen
        displayOutlines(convertPoly(mergedPolygons, isOpenMode), outlines, dragOptions);

        if(isSelectMode) {
            var _res = reselect(gd, false);
            var extraPoints = _res.eventData ? _res.eventData.points.slice() : [];

            _res = reselect(gd, false, selectionTesters, searchTraces, dragOptions);
            selectionTesters = _res.selectionTesters;
            eventData = _res.eventData;

            var poly;
            if(filterPoly) {
                poly = filterPoly.filtered;
            } else {
                poly = castMultiPolygon(mergedPolygons);
            }

            throttle.throttle(
                throttleID,
                constants.SELECTDELAY,
                function() {
                    selection = _doSelect(selectionTesters, searchTraces);

                    var newPoints = selection.slice();

                    for(var w = 0; w < extraPoints.length; w++) {
                        var p = extraPoints[w];
                        var found = false;
                        for(var u = 0; u < newPoints.length; u++) {
                            if(
                                newPoints[u].curveNumber === p.curveNumber &&
                                newPoints[u].pointNumber === p.pointNumber
                            ) {
                                found = true;
                                break;
                            }
                        }
                        if(!found) newPoints.push(p);
                    }

                    if(newPoints.length) {
                        if(!eventData) eventData = {};
                        eventData.points = newPoints;
                    }

                    fillRangeItems(eventData, poly);

                    emitSelecting(gd, eventData);
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

                emitDeselect(gd);

                if(searchTraces.length) {
                    var clickedXaxis = searchTraces[0].xaxis;
                    var clickedYaxis = searchTraces[0].yaxis;

                    if(clickedXaxis && clickedYaxis) {
                        // drop selections in the clicked subplot
                        var subSelections = [];
                        var allSelections = gd._fullLayout.selections;
                        for(var k = 0; k < allSelections.length; k++) {
                            var s = allSelections[k];
                            if(!s) continue; // also drop null selections if any

                            if(
                                s.xref !== clickedXaxis._id ||
                                s.yref !== clickedYaxis._id
                            ) {
                                subSelections.push(s);
                            }
                        }

                        if(subSelections.length < allSelections.length) {
                            gd._fullLayout._noEmitSelectedAtStart = true;

                            Registry.call('_guiRelayout', gd, {
                                selections: subSelections
                            });
                        }
                    }
                }
            } else {
                if(clickmode.indexOf('select') > -1) {
                    selectOnClick(evt, gd, dragOptions.xaxes, dragOptions.yaxes,
                      dragOptions.subplot, dragOptions, outlines);
                }

                if(clickmode === 'event') {
                    // TODO: remove in v3 - this was probably never intended to work as it does,
                    // but in case anyone depends on it we don't want to break it now.
                    // Note that click-to-select introduced pre v3 also emitts proper
                    // event data when clickmode is having 'select' in its flag list.
                    emitSelected(gd, undefined);
                }
            }

            Fx.click(gd, evt, plotinfo.id);
        }).catch(Lib.error);
    };

    dragOptions.doneFn = function() {
        corners.remove();

        throttle.done(throttleID).then(function() {
            throttle.clear(throttleID);

            if(!immediateSelect && currentPolygon && dragOptions.selectionDefs) {
                // save last polygons
                currentPolygon.subtract = subtract;
                dragOptions.selectionDefs.push(currentPolygon);

                // we have to keep reference to arrays container
                dragOptions.mergedPolygons.length = 0;
                [].push.apply(dragOptions.mergedPolygons, mergedPolygons);
            }

            if(immediateSelect || isDrawMode) {
                clearSelectionsCache(dragOptions, immediateSelect);
            }

            if(dragOptions.doneFnCompleted) {
                dragOptions.doneFnCompleted(selection);
            }

            if(isSelectMode) {
                emitSelected(gd, eventData);
            }
        }).catch(Lib.error);
    };
}

function selectOnClick(evt, gd, xAxes, yAxes, subplot, dragOptions, polygonOutlines) {
    var hoverData = gd._hoverdata;
    var fullLayout = gd._fullLayout;
    var clickmode = fullLayout.clickmode;
    var sendEvents = clickmode.indexOf('event') > -1;
    var selection = [];
    var searchTraces, searchInfo, currentSelectionDef, selectionTesters, traceSelection;
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
                emitDeselect(gd);
            }
        } else {
            subtract = evt.shiftKey &&
              (pointOrBinSelected !== undefined ?
                pointOrBinSelected :
                isPointOrBinSelected(clickedPtInfo));
            currentSelectionDef = newPointSelectionDef(clickedPtInfo.pointNumber, clickedPtInfo.searchInfo, subtract);

            var allSelectionDefs = dragOptions.selectionDefs.concat([currentSelectionDef]);
            selectionTesters = multiTester(allSelectionDefs, selectionTesters);

            for(i = 0; i < searchTraces.length; i++) {
                traceSelection = searchTraces[i]._module.selectPoints(searchTraces[i], selectionTesters);
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
                emitSelected(gd, eventData);
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
        subtract: !!subtract
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
            var idxWantedTrace = pointSelectionDef.searchInfo.cd[0].trace.index;
            var idxActualTrace = searchInfo.cd[0].trace.index;
            return idxActualTrace === idxWantedTrace &&
              pointNumber === pointSelectionDef.pointNumber;
        },
        isRect: false,
        degenerate: false,
        subtract: !!pointSelectionDef.subtract
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
    if(!list.length) return;

    var testers = [];
    var xmin = isPointSelectionDef(list[0]) ? 0 : list[0][0][0];
    var xmax = xmin;
    var ymin = isPointSelectionDef(list[0]) ? 0 : list[0][0][1];
    var ymax = ymin;

    for(var i = 0; i < list.length; i++) {
        if(isPointSelectionDef(list[i])) {
            testers.push(newPointNumTester(list[i]));
        } else {
            var tester = polygonTester(list[i]);
            tester.subtract = !!list[i].subtract;
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
                contained = !testers[i].subtract;
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
    var fullLayout = gd._fullLayout;
    var plotinfo = dragOptions.plotinfo;
    var dragmode = dragOptions.dragmode;

    var selectingOnSameSubplot = (
        fullLayout._lastSelectedSubplot &&
        fullLayout._lastSelectedSubplot === plotinfo.id
    );

    var hasModifierKey = (evt.shiftKey || evt.altKey) &&
        !(drawMode(dragmode) && openMode(dragmode));

    if(
        selectingOnSameSubplot &&
        hasModifierKey &&
        plotinfo.selection &&
        plotinfo.selection.selectionDefs &&
        !dragOptions.selectionDefs
    ) {
        // take over selection definitions from prev mode, if any
        dragOptions.selectionDefs = plotinfo.selection.selectionDefs;
        dragOptions.mergedPolygons = plotinfo.selection.mergedPolygons;
    } else if(!hasModifierKey || !plotinfo.selection) {
        clearSelectionsCache(dragOptions);
    }

    // clear selection outline when selecting a different subplot
    if(!selectingOnSameSubplot) {
        clearOutline(gd);
        fullLayout._lastSelectedSubplot = plotinfo.id;
    }
}

function hasActiveShape(gd) {
    return gd._fullLayout._activeShapeIndex >= 0;
}

function hasActiveSelection(gd) {
    return gd._fullLayout._activeSelectionIndex >= 0;
}

function clearSelectionsCache(dragOptions, immediateSelect) {
    var dragmode = dragOptions.dragmode;
    var plotinfo = dragOptions.plotinfo;

    var gd = dragOptions.gd;
    if(hasActiveShape(gd)) {
        gd._fullLayout._deactivateShape(gd);
    }
    if(hasActiveSelection(gd)) {
        gd._fullLayout._deactivateSelection(gd);
    }

    var fullLayout = gd._fullLayout;
    var zoomLayer = fullLayout._zoomlayer;

    var isDrawMode = drawMode(dragmode);
    var isSelectMode = selectMode(dragmode);

    if(isDrawMode || isSelectMode) {
        var outlines = zoomLayer.selectAll('.select-outline-' + plotinfo.id);
        if(outlines && gd._fullLayout._outlining) {
            // add shape
            var shapes;
            if(isDrawMode) {
                shapes = newShapes(outlines, dragOptions);
            }
            if(shapes) {
                Registry.call('_guiRelayout', gd, {
                    shapes: shapes
                });
            }

            // add selection
            var selections;
            if(
                isSelectMode &&
                !hasSubplot(dragOptions) // only allow cartesian - no maps for now
            ) {
                selections = newSelections(outlines, dragOptions);
            }
            if(selections) {
                gd._fullLayout._noEmitSelectedAtStart = true;

                Registry.call('_guiRelayout', gd, {
                    selections: selections
                }).then(function() {
                    if(immediateSelect) { activateLastSelection(gd); }
                });
            }

            gd._fullLayout._outlining = false;
        }
    }

    plotinfo.selection = {};
    plotinfo.selection.selectionDefs = dragOptions.selectionDefs = [];
    plotinfo.selection.mergedPolygons = dragOptions.mergedPolygons = [];
}

function getAxId(ax) {
    return ax._id;
}

function determineSearchTraces(gd, xAxes, yAxes, subplot) {
    if(!gd.calcdata) return [];

    var searchTraces = [];
    var xAxisIds = xAxes.map(getAxId);
    var yAxisIds = yAxes.map(getAxId);
    var cd, trace, i;

    for(i = 0; i < gd.calcdata.length; i++) {
        cd = gd.calcdata[i];
        trace = cd[0].trace;

        if(trace.visible !== true || !trace._module || !trace._module.selectPoints) continue;

        if(
            hasSubplot({subplot: subplot}) &&
            (trace.subplot === subplot || trace.geo === subplot)
        ) {
            searchTraces.push(createSearchInfo(trace._module, cd, xAxes[0], yAxes[0]));
        } else if(trace.type === 'splom') {
            // FIXME: make sure we don't have more than single axis for splom
            if(trace._xaxes[xAxisIds[0]] && trace._yaxes[yAxisIds[0]]) {
                var info = createSearchInfo(trace._module, cd, xAxes[0], yAxes[0]);
                info.scene = gd._fullLayout._splomScenes[trace.uid];
                searchTraces.push(info);
            }
        } else if(trace.type === 'sankey') {
            var sankeyInfo = createSearchInfo(trace._module, cd, xAxes[0], yAxes[0]);
            searchTraces.push(sankeyInfo);
        } else {
            if(xAxisIds.indexOf(trace.xaxis) === -1 && (!trace._xA || !trace._xA.overlaying)) continue;
            if(yAxisIds.indexOf(trace.yaxis) === -1 && (!trace._yA || !trace._yA.overlaying)) continue;

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
        if(hoverDatum.fullData.index === searchInfo.cd[0].trace.index) {
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
    var i;

    // before anything else, update preGUI if necessary
    for(i = 0; i < searchTraces.length; i++) {
        var fullInputTrace = searchTraces[i].cd[0].trace._fullInput;
        var tracePreGUI = gd._fullLayout._tracePreGUI[fullInputTrace.uid] || {};
        if(tracePreGUI.selectedpoints === undefined) {
            tracePreGUI.selectedpoints = fullInputTrace._input.selectedpoints || null;
        }
    }

    var trace;
    if(eventData) {
        var pts = eventData.points || [];
        for(i = 0; i < searchTraces.length; i++) {
            trace = searchTraces[i].cd[0].trace;
            trace._input.selectedpoints = trace._fullInput.selectedpoints = [];
            if(trace._fullInput !== trace) trace.selectedpoints = [];
        }

        for(var k = 0; k < pts.length; k++) {
            var pt = pts[k];
            var data = pt.data;
            var fullData = pt.fullData;
            var pointIndex = pt.pointIndex;
            var pointIndices = pt.pointIndices;
            if(pointIndices) {
                [].push.apply(data.selectedpoints, pointIndices);
                if(trace._fullInput !== trace) {
                    [].push.apply(fullData.selectedpoints, pointIndices);
                }
            } else {
                data.selectedpoints.push(pointIndex);
                if(trace._fullInput !== trace) {
                    fullData.selectedpoints.push(pointIndex);
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

    updateReglSelectedState(gd, searchTraces);
}

function updateReglSelectedState(gd, searchTraces) {
    var hasRegl = false;

    for(var i = 0; i < searchTraces.length; i++) {
        var searchInfo = searchTraces[i];
        var cd = searchInfo.cd;

        if(Registry.traceIs(cd[0].trace, 'regl')) {
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
    var fn = subtract ?
        polybool.difference :
        polybool.union;

    var res = fn({
        regions: list
    }, {
        regions: [poly]
    });

    var allPolygons = res.regions.reverse();

    for(var i = 0; i < allPolygons.length; i++) {
        var polygon = allPolygons[i];

        polygon.subtract = getSubtract(polygon, allPolygons.slice(0, i));
    }

    return allPolygons;
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

function _doSelect(selectionTesters, searchTraces) {
    var allSelections = [];

    var thisSelection;
    var traceSelections = [];
    var traceSelection;
    for(var i = 0; i < searchTraces.length; i++) {
        var searchInfo = searchTraces[i];

        traceSelection = searchInfo._module.selectPoints(searchInfo, selectionTesters);
        traceSelections.push(traceSelection);

        thisSelection = fillSelectionItem(traceSelection, searchInfo);

        allSelections = allSelections.concat(thisSelection);
    }

    return allSelections;
}

function reselect(gd, mayEmitSelected, selectionTesters, searchTraces, dragOptions) {
    var hadSearchTraces = !!searchTraces;
    var plotinfo, xRef, yRef;
    if(dragOptions) {
        plotinfo = dragOptions.plotinfo;
        xRef = dragOptions.xaxes[0]._id;
        yRef = dragOptions.yaxes[0]._id;
    }

    var allSelections = [];
    var allSearchTraces = [];

    // select layout.selection polygons
    var layoutPolygons = getLayoutPolygons(gd);

    // add draft outline polygons to layoutPolygons
    var fullLayout = gd._fullLayout;
    if(plotinfo) {
        var zoomLayer = fullLayout._zoomlayer;
        var mode = fullLayout.dragmode;
        var isDrawMode = drawMode(mode);
        var isSelectMode = selectMode(mode);
        if(isDrawMode || isSelectMode) {
            var xaxis = getFromId(gd, xRef, 'x');
            var yaxis = getFromId(gd, yRef, 'y');
            if(xaxis && yaxis) {
                var outlines = zoomLayer.selectAll('.select-outline-' + plotinfo.id);
                if(outlines && gd._fullLayout._outlining) {
                    if(outlines.length) {
                        var e = outlines[0][0]; // pick first
                        var d = e.getAttribute('d');
                        var outlinePolys = readPaths(d, gd, plotinfo);

                        var draftPolygons = [];
                        for(var u = 0; u < outlinePolys.length; u++) {
                            var p = outlinePolys[u];
                            var polygon = [];
                            for(var t = 0; t < p.length; t++) {
                                polygon.push([
                                    convert(xaxis, p[t][1]),
                                    convert(yaxis, p[t][2])
                                ]);
                            }

                            polygon.xref = xRef;
                            polygon.yref = yRef;
                            polygon.subtract = getSubtract(polygon, draftPolygons);

                            draftPolygons.push(polygon);
                        }

                        layoutPolygons = layoutPolygons.concat(draftPolygons);
                    }
                }
            }
        }
    }

    var subplots = (xRef && yRef) ? [xRef + yRef] :
        fullLayout._subplots.cartesian;

    epmtySplomSelectionBatch(gd);

    var seenSplom = {};

    for(var i = 0; i < subplots.length; i++) {
        var subplot = subplots[i];
        var yAt = subplot.indexOf('y');
        var _xRef = subplot.slice(0, yAt);
        var _yRef = subplot.slice(yAt);

        var _selectionTesters = (xRef && yRef) ? selectionTesters : undefined;
        _selectionTesters = addTester(layoutPolygons, _xRef, _yRef, _selectionTesters);

        if(_selectionTesters) {
            var _searchTraces = searchTraces;
            if(!hadSearchTraces) {
                var _xA = getFromId(gd, _xRef, 'x');
                var _yA = getFromId(gd, _yRef, 'y');

                _searchTraces = determineSearchTraces(
                    gd,
                    [_xA],
                    [_yA],
                    subplot
                );

                for(var w = 0; w < _searchTraces.length; w++) {
                    var s = _searchTraces[w];
                    var cd0 = s.cd[0];
                    var trace = cd0.trace;

                    if(s._module.name === 'scattergl' && !cd0.t.xpx) {
                        var x = trace.x;
                        var y = trace.y;
                        var len = trace._length;
                        // generate stash for scattergl
                        cd0.t.xpx = [];
                        cd0.t.ypx = [];
                        for(var j = 0; j < len; j++) {
                            cd0.t.xpx[j] = _xA.c2p(x[j]);
                            cd0.t.ypx[j] = _yA.c2p(y[j]);
                        }
                    }

                    if(s._module.name === 'splom') {
                        if(!seenSplom[trace.uid]) {
                            seenSplom[trace.uid] = true;
                        }
                    }
                }
            }
            var selection = _doSelect(_selectionTesters, _searchTraces);

            allSelections = allSelections.concat(selection);
            allSearchTraces = allSearchTraces.concat(_searchTraces);
        }
    }

    var eventData = {points: allSelections};
    updateSelectedState(gd, allSearchTraces, eventData);

    var clickmode = fullLayout.clickmode;
    var sendEvents = clickmode.indexOf('event') > -1 && mayEmitSelected;

    if(
        !plotinfo && // get called from plot_api & plots
        mayEmitSelected
    ) {
        var activePolygons = getLayoutPolygons(gd, true);

        if(activePolygons.length) {
            var xref = activePolygons[0].xref;
            var yref = activePolygons[0].yref;
            if(xref && yref) {
                var poly = castMultiPolygon(activePolygons);

                var fillRangeItems = makeFillRangeItems([
                    getFromId(gd, xref, 'x'),
                    getFromId(gd, yref, 'y')
                ]);

                fillRangeItems(eventData, poly);
            }
        }

        if(gd._fullLayout._noEmitSelectedAtStart) {
            gd._fullLayout._noEmitSelectedAtStart = false;
        } else {
            if(sendEvents) emitSelected(gd, eventData);
        }

        fullLayout._reselect = false;
    }

    if(
        !plotinfo && // get called from plot_api & plots
        fullLayout._deselect
    ) {
        var deselect = fullLayout._deselect;
        xRef = deselect.xref;
        yRef = deselect.yref;

        if(!subplotSelected(xRef, yRef, allSearchTraces)) {
            deselectSubplot(gd, xRef, yRef, searchTraces);
        }

        if(sendEvents) {
            if(eventData.points.length) {
                emitSelected(gd, eventData);
            } else {
                emitDeselect(gd);
            }
        }

        fullLayout._deselect = false;
    }

    return {
        eventData: eventData,
        selectionTesters: selectionTesters
    };
}

function epmtySplomSelectionBatch(gd) {
    var cd = gd.calcdata;
    if(!cd) return;

    for(var i = 0; i < cd.length; i++) {
        var cd0 = cd[i][0];
        var trace = cd0.trace;
        var splomScenes = gd._fullLayout._splomScenes;
        if(splomScenes) {
            var scene = splomScenes[trace.uid];
            if(scene) {
                scene.selectBatch = [];
            }
        }
    }
}

function subplotSelected(xRef, yRef, searchTraces) {
    for(var i = 0; i < searchTraces.length; i++) {
        var s = searchTraces[i];
        if(
            (s.xaxis && s.xaxis._id === xRef) &&
            (s.yaxis && s.yaxis._id === yRef)
        ) {
            return true;
        }
    }
    return false;
}

function deselectSubplot(gd, xRef, yRef, searchTraces) {
    searchTraces = determineSearchTraces(
        gd,
        [getFromId(gd, xRef, 'x')],
        [getFromId(gd, yRef, 'y')],
        xRef + yRef
    );

    for(var k = 0; k < searchTraces.length; k++) {
        var searchInfo = searchTraces[k];
        searchInfo._module.selectPoints(searchInfo, false);
    }

    updateSelectedState(gd, searchTraces);
}

function addTester(layoutPolygons, xRef, yRef, selectionTesters) {
    var mergedPolygons;

    for(var i = 0; i < layoutPolygons.length; i++) {
        var currentPolygon = layoutPolygons[i];
        if(xRef !== currentPolygon.xref || yRef !== currentPolygon.yref) continue;

        if(mergedPolygons) {
            var subtract = !!currentPolygon.subtract;
            mergedPolygons = mergePolygons(mergedPolygons, currentPolygon, subtract);
            selectionTesters = multiTester(mergedPolygons);
        } else {
            mergedPolygons = [currentPolygon];
            selectionTesters = polygonTester(currentPolygon);
        }
    }

    return selectionTesters;
}

function getLayoutPolygons(gd, onlyActiveOnes) {
    var allPolygons = [];

    var fullLayout = gd._fullLayout;
    var allSelections = fullLayout.selections;
    var len = allSelections.length;

    for(var i = 0; i < len; i++) {
        if(onlyActiveOnes && i !== fullLayout._activeSelectionIndex) continue;

        var selection = allSelections[i];
        if(!selection) continue;

        var xref = selection.xref;
        var yref = selection.yref;

        var xaxis = getFromId(gd, xref, 'x');
        var yaxis = getFromId(gd, yref, 'y');

        var xmin, xmax, ymin, ymax;

        var polygon;
        if(selection.type === 'rect') {
            polygon = [];

            var x0 = convert(xaxis, selection.x0);
            var x1 = convert(xaxis, selection.x1);
            var y0 = convert(yaxis, selection.y0);
            var y1 = convert(yaxis, selection.y1);
            polygon = [[x0, y0], [x0, y1], [x1, y1], [x1, y0]];

            xmin = Math.min(x0, x1);
            xmax = Math.max(x0, x1);
            ymin = Math.min(y0, y1);
            ymax = Math.max(y0, y1);

            polygon.xmin = xmin;
            polygon.xmax = xmax;
            polygon.ymin = ymin;
            polygon.ymax = ymax;

            polygon.xref = xref;
            polygon.yref = yref;

            polygon.subtract = false;
            polygon.isRect = true;

            allPolygons.push(polygon);
        } else if(selection.type === 'path') {
            var segments = selection.path.split('Z');

            var multiPolygons = [];
            for(var j = 0; j < segments.length; j++) {
                var path = segments[j];
                if(!path) continue;
                path += 'Z';

                var allX = shapeHelpers.extractPathCoords(path, shapeConstants.paramIsX, 'raw');
                var allY = shapeHelpers.extractPathCoords(path, shapeConstants.paramIsY, 'raw');

                xmin = Infinity;
                xmax = -Infinity;
                ymin = Infinity;
                ymax = -Infinity;

                polygon = [];

                for(var k = 0; k < allX.length; k++) {
                    var x = convert(xaxis, allX[k]);
                    var y = convert(yaxis, allY[k]);

                    polygon.push([x, y]);

                    xmin = Math.min(x, xmin);
                    xmax = Math.max(x, xmax);
                    ymin = Math.min(y, ymin);
                    ymax = Math.max(y, ymax);
                }

                polygon.xmin = xmin;
                polygon.xmax = xmax;
                polygon.ymin = ymin;
                polygon.ymax = ymax;

                polygon.xref = xref;
                polygon.yref = yref;
                polygon.subtract = getSubtract(polygon, multiPolygons);

                multiPolygons.push(polygon);
                allPolygons.push(polygon);
            }
        }
    }

    return allPolygons;
}

function getSubtract(polygon, previousPolygons) {
    var subtract = false;
    for(var i = 0; i < previousPolygons.length; i++) {
        var previousPolygon = previousPolygons[i];

        // find out if a point of polygon is inside previous polygons
        for(var k = 0; k < polygon.length; k++) {
            if(pointInPolygon(polygon[k], previousPolygon)) {
                subtract = !subtract;
                break;
            }
        }
    }
    return subtract;
}

function convert(ax, d) {
    if(ax.type === 'date') d = d.replace('_', ' ');
    return ax.type === 'log' ? ax.c2p(d) : ax.r2p(d, null, ax.calendar);
}

function castMultiPolygon(allPolygons) {
    var len = allPolygons.length;

    // descibe multi polygons in one polygon
    var p = [];
    for(var i = 0; i < len; i++) {
        var polygon = allPolygons[i];
        p = p.concat(polygon);

        // add starting vertex to close
        // which indicates next polygon
        p = p.concat([polygon[0]]);
    }

    return computeRectAndRanges(p);
}

function computeRectAndRanges(poly) {
    poly.isRect = poly.length === 5 &&
        poly[0][0] === poly[4][0] &&
        poly[0][1] === poly[4][1] &&
        (
            poly[0][0] === poly[1][0] &&
            poly[2][0] === poly[3][0] &&
            poly[0][1] === poly[3][1] &&
            poly[1][1] === poly[2][1]
        ) ||
        (
            poly[0][1] === poly[1][1] &&
            poly[2][1] === poly[3][1] &&
            poly[0][0] === poly[3][0] &&
            poly[1][0] === poly[2][0]
        );

    if(poly.isRect) {
        poly.xmin = Math.min(poly[0][0], poly[2][0]);
        poly.xmax = Math.max(poly[0][0], poly[2][0]);
        poly.ymin = Math.min(poly[0][1], poly[2][1]);
        poly.ymax = Math.max(poly[0][1], poly[2][1]);
    }

    return poly;
}

function makeFillRangeItems(allAxes) {
    return function(eventData, poly) {
        var range;
        var lassoPoints;

        for(var i = 0; i < allAxes.length; i++) {
            var ax = allAxes[i];
            var id = ax._id;
            var axLetter = id.charAt(0);

            if(poly.isRect) {
                if(!range) range = {};
                var min = poly[axLetter + 'min'];
                var max = poly[axLetter + 'max'];

                if(min !== undefined && max !== undefined) {
                    range[id] = [
                        p2r(ax, min),
                        p2r(ax, max)
                    ].sort(ascending);
                }
            } else {
                if(!lassoPoints) lassoPoints = {};
                lassoPoints[id] = poly.map(axValue(ax));
            }
        }

        if(range) {
            eventData.range = range;
        }

        if(lassoPoints) {
            eventData.lassoPoints = lassoPoints;
        }
    };
}

function getFillRangeItems(dragOptions) {
    var plotinfo = dragOptions.plotinfo;

    return (
        plotinfo.fillRangeItems || // allow subplots (i.e. geo, mapbox, map, sankey) to override fillRangeItems routine
        makeFillRangeItems(dragOptions.xaxes.concat(dragOptions.yaxes))
    );
}

function emitSelecting(gd, eventData) {
    gd.emit('plotly_selecting', eventData);
}

function emitSelected(gd, eventData) {
    if(eventData) {
        eventData.selections = (gd.layout || {}).selections || [];
    }

    gd.emit('plotly_selected', eventData);
}

function emitDeselect(gd) {
    gd.emit('plotly_deselect', null);
}

module.exports = {
    reselect: reselect,
    prepSelect: prepSelect,
    clearOutline: clearOutline,
    clearSelectionsCache: clearSelectionsCache,
    selectOnClick: selectOnClick
};
