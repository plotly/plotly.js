'use strict';

var d3 = require('@plotly/d3');
var isNumeric = require('fast-isnumeric');
var tinycolor = require('tinycolor2');

var Lib = require('../../lib');
var strTranslate = Lib.strTranslate;
var strRotate = Lib.strRotate;
var Events = require('../../lib/events');
var svgTextUtils = require('../../lib/svg_text_utils');
var overrideCursor = require('../../lib/override_cursor');
var Drawing = require('../drawing');
var Color = require('../color');
var dragElement = require('../dragelement');
var Axes = require('../../plots/cartesian/axes');
var Registry = require('../../registry');

var helpers = require('./helpers');
var constants = require('./constants');

var legendSupplyDefaults = require('../legend/defaults');
var legendDraw = require('../legend/draw');

// hover labels for multiple horizontal bars get tilted by some angle,
// then need to be offset differently if they overlap
var YANGLE = constants.YANGLE;
var YA_RADIANS = Math.PI * YANGLE / 180;

// expansion of projected height
var YFACTOR = 1 / Math.sin(YA_RADIANS);

// to make the appropriate post-rotation x offset,
// you need both x and y offsets
var YSHIFTX = Math.cos(YA_RADIANS);
var YSHIFTY = Math.sin(YA_RADIANS);

// size and display constants for hover text
var HOVERARROWSIZE = constants.HOVERARROWSIZE;
var HOVERTEXTPAD = constants.HOVERTEXTPAD;

var multipleHoverPoints = {
    box: true,
    ohlc: true,
    violin: true,
    candlestick: true
};

var cartesianScatterPoints = {
    scatter: true,
    scattergl: true,
    splom: true
};

// fx.hover: highlight data on hover
// evt can be a mousemove event, or an object with data about what points
//   to hover on
//      {xpx,ypx[,hovermode]} - pixel locations from top left
//          (with optional overriding hovermode)
//      {xval,yval[,hovermode]} - data values
//      [{curveNumber,(pointNumber|xval and/or yval)}] -
//              array of specific points to highlight
//          pointNumber is a single integer if gd.data[curveNumber] is 1D,
//              or a two-element array if it's 2D
//          xval and yval are data values,
//              1D data may specify either or both,
//              2D data must specify both
// subplot is an id string (default "xy")
// makes use of gl.hovermode, which can be:
//      x (find the points with the closest x values, ie a column),
//      closest (find the single closest point)
//    internally there are two more that occasionally get used:
//      y (pick out a row - only used for multiple horizontal bar charts)
//      array (used when the user specifies an explicit
//          array of points to hover on)
//
// We wrap the hovers in a timer, to limit their frequency.
// The actual rendering is done by private function _hover.
exports.hover = function hover(gd, evt, subplot, noHoverEvent) {
    gd = Lib.getGraphDiv(gd);

    Lib.throttle(
        gd._fullLayout._uid + constants.HOVERID,
        constants.HOVERMINTIME,
        function() { _hover(gd, evt, subplot, noHoverEvent); }
    );
};

/*
 * Draw a single hover item or an array of hover item in a pre-existing svg container somewhere
 * hoverItem should have keys:
 *    - x and y (or x0, x1, y0, and y1):
 *      the pixel position to mark, relative to opts.container
 *    - xLabel, yLabel, zLabel, text, and name:
 *      info to go in the label
 *    - color:
 *      the background color for the label.
 *    - idealAlign (optional):
 *      'left' or 'right' for which side of the x/y box to try to put this on first
 *    - borderColor (optional):
 *      color for the border, defaults to strongest contrast with color
 *    - fontFamily (optional):
 *      string, the font for this label, defaults to constants.HOVERFONT
 *    - fontSize (optional):
 *      the label font size, defaults to constants.HOVERFONTSIZE
 *    - fontColor (optional):
 *      defaults to borderColor
 * opts should have keys:
 *    - bgColor:
 *      the background color this is against, used if the trace is
 *      non-opaque, and for the name, which goes outside the box
 *    - container:
 *      a <svg> or <g> element to add the hover label to
 *    - outerContainer:
 *      normally a parent of `container`, sets the bounding box to use to
 *      constrain the hover label and determine whether to show it on the left or right
 * opts can have optional keys:
 *    - anchorIndex:
        the index of the hover item used as an anchor for positioning.
        The other hover items will be pushed up or down to prevent overlap.
 */
exports.loneHover = function loneHover(hoverItems, opts) {
    var multiHover = true;
    if(!Array.isArray(hoverItems)) {
        multiHover = false;
        hoverItems = [hoverItems];
    }

    var gd = opts.gd;
    var gTop = getTopOffset(gd);
    var gLeft = getLeftOffset(gd);

    var pointsData = hoverItems.map(function(hoverItem) {
        var _x0 = hoverItem._x0 || hoverItem.x0 || hoverItem.x || 0;
        var _x1 = hoverItem._x1 || hoverItem.x1 || hoverItem.x || 0;
        var _y0 = hoverItem._y0 || hoverItem.y0 || hoverItem.y || 0;
        var _y1 = hoverItem._y1 || hoverItem.y1 || hoverItem.y || 0;

        var eventData = hoverItem.eventData;
        if(eventData) {
            var x0 = Math.min(_x0, _x1);
            var x1 = Math.max(_x0, _x1);
            var y0 = Math.min(_y0, _y1);
            var y1 = Math.max(_y0, _y1);

            var trace = hoverItem.trace;
            if(Registry.traceIs(trace, 'gl3d')) {
                var container = gd._fullLayout[trace.scene]._scene.container;
                var dx = container.offsetLeft;
                var dy = container.offsetTop;
                x0 += dx;
                x1 += dx;
                y0 += dy;
                y1 += dy;
            } // TODO: handle heatmapgl

            eventData.bbox = {
                x0: x0 + gLeft,
                x1: x1 + gLeft,
                y0: y0 + gTop,
                y1: y1 + gTop
            };

            if(opts.inOut_bbox) {
                opts.inOut_bbox.push(eventData.bbox);
            }
        } else {
            eventData = false;
        }

        return {
            color: hoverItem.color || Color.defaultLine,
            x0: hoverItem.x0 || hoverItem.x || 0,
            x1: hoverItem.x1 || hoverItem.x || 0,
            y0: hoverItem.y0 || hoverItem.y || 0,
            y1: hoverItem.y1 || hoverItem.y || 0,
            xLabel: hoverItem.xLabel,
            yLabel: hoverItem.yLabel,
            zLabel: hoverItem.zLabel,
            text: hoverItem.text,
            name: hoverItem.name,
            idealAlign: hoverItem.idealAlign,

            // optional extra bits of styling
            borderColor: hoverItem.borderColor,
            fontFamily: hoverItem.fontFamily,
            fontSize: hoverItem.fontSize,
            fontColor: hoverItem.fontColor,
            nameLength: hoverItem.nameLength,
            textAlign: hoverItem.textAlign,

            // filler to make createHoverText happy
            trace: hoverItem.trace || {
                index: 0,
                hoverinfo: ''
            },
            xa: {_offset: 0},
            ya: {_offset: 0},
            index: 0,

            hovertemplate: hoverItem.hovertemplate || false,
            hovertemplateLabels: hoverItem.hovertemplateLabels || false,

            eventData: eventData
        };
    });

    var rotateLabels = false;

    var hoverLabel = createHoverText(pointsData, {
        gd: gd,
        hovermode: 'closest',
        rotateLabels: rotateLabels,
        bgColor: opts.bgColor || Color.background,
        container: d3.select(opts.container),
        outerContainer: opts.outerContainer || opts.container
    });

    // Fix vertical overlap
    var tooltipSpacing = 5;
    var lastBottomY = 0;
    var anchor = 0;
    hoverLabel
        .sort(function(a, b) {return a.y0 - b.y0;})
        .each(function(d, i) {
            var topY = d.y0 - d.by / 2;

            if((topY - tooltipSpacing) < lastBottomY) {
                d.offset = (lastBottomY - topY) + tooltipSpacing;
            } else {
                d.offset = 0;
            }

            lastBottomY = topY + d.by + d.offset;

            if(i === opts.anchorIndex || 0) anchor = d.offset;
        })
        .each(function(d) {
            d.offset -= anchor;
        });

    var scaleX = gd._fullLayout._invScaleX;
    var scaleY = gd._fullLayout._invScaleY;
    alignHoverText(hoverLabel, rotateLabels, scaleX, scaleY);

    return multiHover ? hoverLabel : hoverLabel.node();
};

// The actual implementation is here:
function _hover(gd, evt, subplot, noHoverEvent) {
    if(!subplot) subplot = 'xy';

    // if the user passed in an array of subplots,
    // use those instead of finding overlayed plots
    var subplots = Array.isArray(subplot) ? subplot : [subplot];

    var fullLayout = gd._fullLayout;
    var plots = fullLayout._plots || [];
    var plotinfo = plots[subplot];
    var hasCartesian = fullLayout._has('cartesian');

    // list of all overlaid subplots to look at
    if(plotinfo) {
        var overlayedSubplots = plotinfo.overlays.map(function(pi) {
            return pi.id;
        });

        subplots = subplots.concat(overlayedSubplots);
    }

    var len = subplots.length;
    var xaArray = new Array(len);
    var yaArray = new Array(len);
    var supportsCompare = false;

    for(var i = 0; i < len; i++) {
        var spId = subplots[i];

        if(plots[spId]) {
            // 'cartesian' case
            supportsCompare = true;
            xaArray[i] = plots[spId].xaxis;
            yaArray[i] = plots[spId].yaxis;
        } else if(fullLayout[spId] && fullLayout[spId]._subplot) {
            // other subplot types
            var _subplot = fullLayout[spId]._subplot;
            xaArray[i] = _subplot.xaxis;
            yaArray[i] = _subplot.yaxis;
        } else {
            Lib.warn('Unrecognized subplot: ' + spId);
            return;
        }
    }

    var hovermode = evt.hovermode || fullLayout.hovermode;

    if(hovermode && !supportsCompare) hovermode = 'closest';

    if(['x', 'y', 'closest', 'x unified', 'y unified'].indexOf(hovermode) === -1 || !gd.calcdata ||
            gd.querySelector('.zoombox') || gd._dragging) {
        return dragElement.unhoverRaw(gd, evt);
    }

    var hoverdistance = fullLayout.hoverdistance;
    if(hoverdistance === -1) hoverdistance = Infinity;

    var spikedistance = fullLayout.spikedistance;
    if(spikedistance === -1) spikedistance = Infinity;

    // hoverData: the set of candidate points we've found to highlight
    var hoverData = [];

    // searchData: the data to search in. Mostly this is just a copy of
    // gd.calcdata, filtered to the subplot and overlays we're on
    // but if a point array is supplied it will be a mapping
    // of indicated curves
    var searchData = [];

    // [x|y]valArray: the axis values of the hover event
    // mapped onto each of the currently selected overlaid subplots
    var xvalArray, yvalArray;

    var itemnum, curvenum, cd, trace, subplotId, subploti, _mode,
        xval, yval, pointData, closedataPreviousLength;

    // spikePoints: the set of candidate points we've found to draw spikes to
    var spikePoints = {
        hLinePoint: null,
        vLinePoint: null
    };

    // does subplot have one (or more) horizontal traces?
    // This is used to determine whether we rotate the labels or not
    var hasOneHorizontalTrace = false;

    // Figure out what we're hovering on:
    // mouse location or user-supplied data

    if(Array.isArray(evt)) {
        // user specified an array of points to highlight
        hovermode = 'array';
        for(itemnum = 0; itemnum < evt.length; itemnum++) {
            cd = gd.calcdata[evt[itemnum].curveNumber || 0];
            if(cd) {
                trace = cd[0].trace;
                if(cd[0].trace.hoverinfo !== 'skip') {
                    searchData.push(cd);
                    if(trace.orientation === 'h') {
                        hasOneHorizontalTrace = true;
                    }
                }
            }
        }
    } else {
        for(curvenum = 0; curvenum < gd.calcdata.length; curvenum++) {
            cd = gd.calcdata[curvenum];
            trace = cd[0].trace;
            if(trace.hoverinfo !== 'skip' && helpers.isTraceInSubplots(trace, subplots)) {
                searchData.push(cd);
                if(trace.orientation === 'h') {
                    hasOneHorizontalTrace = true;
                }
            }
        }

        // [x|y]px: the pixels (from top left) of the mouse location
        // on the currently selected plot area
        // add pointerX|Y property for drawing the spikes in spikesnap 'cursor' situation
        var hasUserCalledHover = !evt.target;
        var xpx, ypx;

        if(hasUserCalledHover) {
            if('xpx' in evt) xpx = evt.xpx;
            else xpx = xaArray[0]._length / 2;

            if('ypx' in evt) ypx = evt.ypx;
            else ypx = yaArray[0]._length / 2;
        } else {
            // fire the beforehover event and quit if it returns false
            // note that we're only calling this on real mouse events, so
            // manual calls to fx.hover will always run.
            if(Events.triggerHandler(gd, 'plotly_beforehover', evt) === false) {
                return;
            }

            // Discover event target, traversing open shadow roots.
            var target = evt.composedPath && evt.composedPath()[0];
            if(!target) {
                // Fallback for browsers not supporting composedPath
                target = evt.target;
            }
            var dbb = target.getBoundingClientRect();

            xpx = evt.clientX - dbb.left;
            ypx = evt.clientY - dbb.top;

            fullLayout._calcInverseTransform(gd);
            var transformedCoords = Lib.apply3DTransform(fullLayout._invTransform)(xpx, ypx);

            xpx = transformedCoords[0];
            ypx = transformedCoords[1];

            // in case hover was called from mouseout into hovertext,
            // it's possible you're not actually over the plot anymore
            if(xpx < 0 || xpx > xaArray[0]._length || ypx < 0 || ypx > yaArray[0]._length) {
                return dragElement.unhoverRaw(gd, evt);
            }
        }

        evt.pointerX = xpx + xaArray[0]._offset;
        evt.pointerY = ypx + yaArray[0]._offset;

        if('xval' in evt) xvalArray = helpers.flat(subplots, evt.xval);
        else xvalArray = helpers.p2c(xaArray, xpx);

        if('yval' in evt) yvalArray = helpers.flat(subplots, evt.yval);
        else yvalArray = helpers.p2c(yaArray, ypx);

        if(!isNumeric(xvalArray[0]) || !isNumeric(yvalArray[0])) {
            Lib.warn('Fx.hover failed', evt, gd);
            return dragElement.unhoverRaw(gd, evt);
        }
    }

    // the pixel distance to beat as a matching point
    // in 'x' or 'y' mode this resets for each trace
    var distance = Infinity;

    // find the closest point in each trace
    // this is minimum dx and/or dy, depending on mode
    // and the pixel position for the label (labelXpx, labelYpx)
    function findHoverPoints(customXVal, customYVal) {
        for(curvenum = 0; curvenum < searchData.length; curvenum++) {
            cd = searchData[curvenum];

            // filter out invisible or broken data
            if(!cd || !cd[0] || !cd[0].trace) continue;

            trace = cd[0].trace;

            if(trace.visible !== true || trace._length === 0) continue;

            // Explicitly bail out for these two. I don't know how to otherwise prevent
            // the rest of this function from running and failing
            if(['carpet', 'contourcarpet'].indexOf(trace._module.name) !== -1) continue;

            if(trace.type === 'splom') {
                // splom traces do not generate overlay subplots,
                // it is safe to assume here splom traces correspond to the 0th subplot
                subploti = 0;
                subplotId = subplots[subploti];
            } else {
                subplotId = helpers.getSubplot(trace);
                subploti = subplots.indexOf(subplotId);
            }

            // within one trace mode can sometimes be overridden
            _mode = hovermode;
            if(helpers.isUnifiedHover(_mode)) {
                _mode = _mode.charAt(0);
            }

            // container for new point, also used to pass info into module.hoverPoints
            pointData = {
                // trace properties
                cd: cd,
                trace: trace,
                xa: xaArray[subploti],
                ya: yaArray[subploti],

                // max distances for hover and spikes - for points that want to show but do not
                // want to override other points, set distance/spikeDistance equal to max*Distance
                // and it will not get filtered out but it will be guaranteed to have a greater
                // distance than any point that calculated a real distance.
                maxHoverDistance: hoverdistance,
                maxSpikeDistance: spikedistance,

                // point properties - override all of these
                index: false, // point index in trace - only used by plotly.js hoverdata consumers
                distance: Math.min(distance, hoverdistance), // pixel distance or pseudo-distance

                // distance/pseudo-distance for spikes. This distance should always be calculated
                // as if in "closest" mode, and should only be set if this point should
                // generate a spike.
                spikeDistance: Infinity,

                // in some cases the spikes have different positioning from the hover label
                // they don't need x0/x1, just one position
                xSpike: undefined,
                ySpike: undefined,

                // where and how to display the hover label
                color: Color.defaultLine, // trace color
                name: trace.name,
                x0: undefined,
                x1: undefined,
                y0: undefined,
                y1: undefined,
                xLabelVal: undefined,
                yLabelVal: undefined,
                zLabelVal: undefined,
                text: undefined
            };

            // add ref to subplot object (non-cartesian case)
            if(fullLayout[subplotId]) {
                pointData.subplot = fullLayout[subplotId]._subplot;
            }
            // add ref to splom scene
            if(fullLayout._splomScenes && fullLayout._splomScenes[trace.uid]) {
                pointData.scene = fullLayout._splomScenes[trace.uid];
            }

            closedataPreviousLength = hoverData.length;

            // for a highlighting array, figure out what
            // we're searching for with this element
            if(_mode === 'array') {
                var selection = evt[curvenum];
                if('pointNumber' in selection) {
                    pointData.index = selection.pointNumber;
                    _mode = 'closest';
                } else {
                    _mode = '';
                    if('xval' in selection) {
                        xval = selection.xval;
                        _mode = 'x';
                    }
                    if('yval' in selection) {
                        yval = selection.yval;
                        _mode = _mode ? 'closest' : 'y';
                    }
                }
            } else if(customXVal !== undefined && customYVal !== undefined) {
                xval = customXVal;
                yval = customYVal;
            } else {
                xval = xvalArray[subploti];
                yval = yvalArray[subploti];
            }

            // Now if there is range to look in, find the points to hover.
            if(hoverdistance !== 0) {
                if(trace._module && trace._module.hoverPoints) {
                    var newPoints = trace._module.hoverPoints(pointData, xval, yval, _mode, {
                        finiteRange: true,
                        hoverLayer: fullLayout._hoverlayer
                    });

                    if(newPoints) {
                        var newPoint;
                        for(var newPointNum = 0; newPointNum < newPoints.length; newPointNum++) {
                            newPoint = newPoints[newPointNum];
                            if(isNumeric(newPoint.x0) && isNumeric(newPoint.y0)) {
                                hoverData.push(cleanPoint(newPoint, hovermode));
                            }
                        }
                    }
                } else {
                    Lib.log('Unrecognized trace type in hover:', trace);
                }
            }

            // in closest mode, remove any existing (farther) points
            // and don't look any farther than this latest point (or points, some
            // traces like box & violin make multiple hover labels at once)
            if(hovermode === 'closest' && hoverData.length > closedataPreviousLength) {
                hoverData.splice(0, closedataPreviousLength);
                distance = hoverData[0].distance;
            }

            // Now if there is range to look in, find the points to draw the spikelines
            // Do it only if there is no hoverData
            if(hasCartesian && (spikedistance !== 0)) {
                if(hoverData.length === 0) {
                    pointData.distance = spikedistance;
                    pointData.index = false;
                    var closestPoints = trace._module.hoverPoints(pointData, xval, yval, 'closest', {
                        hoverLayer: fullLayout._hoverlayer
                    });
                    if(closestPoints) {
                        closestPoints = closestPoints.filter(function(point) {
                            // some hover points, like scatter fills, do not allow spikes,
                            // so will generate a hover point but without a valid spikeDistance
                            return point.spikeDistance <= spikedistance;
                        });
                    }
                    if(closestPoints && closestPoints.length) {
                        var tmpPoint;
                        var closestVPoints = closestPoints.filter(function(point) {
                            return point.xa.showspikes && point.xa.spikesnap !== 'hovered data';
                        });
                        if(closestVPoints.length) {
                            var closestVPt = closestVPoints[0];
                            if(isNumeric(closestVPt.x0) && isNumeric(closestVPt.y0)) {
                                tmpPoint = fillSpikePoint(closestVPt);
                                if(!spikePoints.vLinePoint || (spikePoints.vLinePoint.spikeDistance > tmpPoint.spikeDistance)) {
                                    spikePoints.vLinePoint = tmpPoint;
                                }
                            }
                        }

                        var closestHPoints = closestPoints.filter(function(point) {
                            return point.ya.showspikes && point.ya.spikesnap !== 'hovered data';
                        });
                        if(closestHPoints.length) {
                            var closestHPt = closestHPoints[0];
                            if(isNumeric(closestHPt.x0) && isNumeric(closestHPt.y0)) {
                                tmpPoint = fillSpikePoint(closestHPt);
                                if(!spikePoints.hLinePoint || (spikePoints.hLinePoint.spikeDistance > tmpPoint.spikeDistance)) {
                                    spikePoints.hLinePoint = tmpPoint;
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    findHoverPoints();

    function selectClosestPoint(pointsData, spikedistance, spikeOnWinning) {
        var resultPoint = null;
        var minDistance = Infinity;
        var thisSpikeDistance;

        for(var i = 0; i < pointsData.length; i++) {
            thisSpikeDistance = pointsData[i].spikeDistance;
            if(spikeOnWinning && i === 0) thisSpikeDistance = -Infinity;

            if(thisSpikeDistance <= minDistance && thisSpikeDistance <= spikedistance) {
                resultPoint = pointsData[i];
                minDistance = thisSpikeDistance;
            }
        }
        return resultPoint;
    }

    function fillSpikePoint(point) {
        if(!point) return null;
        return {
            xa: point.xa,
            ya: point.ya,
            x: point.xSpike !== undefined ? point.xSpike : (point.x0 + point.x1) / 2,
            y: point.ySpike !== undefined ? point.ySpike : (point.y0 + point.y1) / 2,
            distance: point.distance,
            spikeDistance: point.spikeDistance,
            curveNumber: point.trace.index,
            color: point.color,
            pointNumber: point.index
        };
    }

    var spikelineOpts = {
        fullLayout: fullLayout,
        container: fullLayout._hoverlayer,
        event: evt
    };
    var oldspikepoints = gd._spikepoints;
    var newspikepoints = {
        vLinePoint: spikePoints.vLinePoint,
        hLinePoint: spikePoints.hLinePoint
    };
    gd._spikepoints = newspikepoints;

    var sortHoverData = function() {
        hoverData.sort(function(d1, d2) { return d1.distance - d2.distance; });

        // move period positioned points and box/bar-like traces to the end of the list
        hoverData = orderRangePoints(hoverData, hovermode);
    };
    sortHoverData();

    var axLetter = hovermode.charAt(0);
    var spikeOnWinning = (axLetter === 'x' || axLetter === 'y') && hoverData[0] && cartesianScatterPoints[hoverData[0].trace.type];

    // Now if it is not restricted by spikedistance option, set the points to draw the spikelines
    if(hasCartesian && (spikedistance !== 0)) {
        if(hoverData.length !== 0) {
            var tmpHPointData = hoverData.filter(function(point) {
                return point.ya.showspikes;
            });
            var tmpHPoint = selectClosestPoint(tmpHPointData, spikedistance, spikeOnWinning);
            spikePoints.hLinePoint = fillSpikePoint(tmpHPoint);

            var tmpVPointData = hoverData.filter(function(point) {
                return point.xa.showspikes;
            });
            var tmpVPoint = selectClosestPoint(tmpVPointData, spikedistance, spikeOnWinning);
            spikePoints.vLinePoint = fillSpikePoint(tmpVPoint);
        }
    }

    // if hoverData is empty check for the spikes to draw and quit if there are none
    if(hoverData.length === 0) {
        var result = dragElement.unhoverRaw(gd, evt);
        if(hasCartesian && ((spikePoints.hLinePoint !== null) || (spikePoints.vLinePoint !== null))) {
            if(spikesChanged(oldspikepoints)) {
                createSpikelines(gd, spikePoints, spikelineOpts);
            }
        }
        return result;
    }

    if(hasCartesian) {
        if(spikesChanged(oldspikepoints)) {
            createSpikelines(gd, spikePoints, spikelineOpts);
        }
    }

    if(
        helpers.isXYhover(_mode) &&
        hoverData[0].length !== 0 &&
        hoverData[0].trace.type !== 'splom' // TODO: add support for splom
    ) {
        // pick winning point
        var winningPoint = hoverData[0];
        // discard other points
        if(multipleHoverPoints[winningPoint.trace.type]) {
            hoverData = hoverData.filter(function(d) {
                return d.trace.index === winningPoint.trace.index;
            });
        } else {
            hoverData = [winningPoint];
        }
        var initLen = hoverData.length;

        var winX = getCoord('x', winningPoint, fullLayout);
        var winY = getCoord('y', winningPoint, fullLayout);

        // in compare mode, select every point at position
        findHoverPoints(winX, winY);

        var finalPoints = [];
        var seen = {};
        var id = 0;
        var insert = function(newHd) {
            var key = multipleHoverPoints[newHd.trace.type] ? hoverDataKey(newHd) : newHd.trace.index;
            if(!seen[key]) {
                id++;
                seen[key] = id;
                finalPoints.push(newHd);
            } else {
                var oldId = seen[key] - 1;
                var oldHd = finalPoints[oldId];
                if(oldId > 0 &&
                    Math.abs(newHd.distance) <
                    Math.abs(oldHd.distance)
                ) {
                    // replace with closest
                    finalPoints[oldId] = newHd;
                }
            }
        };

        var k;
        // insert the winnig point(s) first
        for(k = 0; k < initLen; k++) {
            insert(hoverData[k]);
        }
        // override from the end
        for(k = hoverData.length - 1; k > initLen - 1; k--) {
            insert(hoverData[k]);
        }
        hoverData = finalPoints;
        sortHoverData();
    }

    // lastly, emit custom hover/unhover events
    var oldhoverdata = gd._hoverdata;
    var newhoverdata = [];

    var gTop = getTopOffset(gd);
    var gLeft = getLeftOffset(gd);

    // pull out just the data that's useful to
    // other people and send it to the event
    for(itemnum = 0; itemnum < hoverData.length; itemnum++) {
        var pt = hoverData[itemnum];
        var eventData = helpers.makeEventData(pt, pt.trace, pt.cd);

        if(pt.hovertemplate !== false) {
            var ht = false;
            if(pt.cd[pt.index] && pt.cd[pt.index].ht) {
                ht = pt.cd[pt.index].ht;
            }
            pt.hovertemplate = ht || pt.trace.hovertemplate || false;
        }

        if(pt.xa && pt.ya) {
            var _x0 = pt.x0 + pt.xa._offset;
            var _x1 = pt.x1 + pt.xa._offset;
            var _y0 = pt.y0 + pt.ya._offset;
            var _y1 = pt.y1 + pt.ya._offset;

            var x0 = Math.min(_x0, _x1);
            var x1 = Math.max(_x0, _x1);
            var y0 = Math.min(_y0, _y1);
            var y1 = Math.max(_y0, _y1);

            eventData.bbox = {
                x0: x0 + gLeft,
                x1: x1 + gLeft,
                y0: y0 + gTop,
                y1: y1 + gTop
            };
        }

        pt.eventData = [eventData];
        newhoverdata.push(eventData);
    }

    gd._hoverdata = newhoverdata;

    var rotateLabels = (
        (hovermode === 'y' && (searchData.length > 1 || hoverData.length > 1)) ||
        (hovermode === 'closest' && hasOneHorizontalTrace && hoverData.length > 1)
    );

    var bgColor = Color.combine(
        fullLayout.plot_bgcolor || Color.background,
        fullLayout.paper_bgcolor
    );

    var hoverLabels = createHoverText(hoverData, {
        gd: gd,
        hovermode: hovermode,
        rotateLabels: rotateLabels,
        bgColor: bgColor,
        container: fullLayout._hoverlayer,
        outerContainer: fullLayout._paper.node(),
        commonLabelOpts: fullLayout.hoverlabel,
        hoverdistance: fullLayout.hoverdistance
    });

    if(!helpers.isUnifiedHover(hovermode)) {
        hoverAvoidOverlaps(hoverLabels, rotateLabels ? 'xa' : 'ya', fullLayout);
        alignHoverText(hoverLabels, rotateLabels, fullLayout._invScaleX, fullLayout._invScaleY);
    }    // TODO: tagName hack is needed to appease geo.js's hack of using evt.target=true
    // we should improve the "fx" API so other plots can use it without these hack.
    if(evt.target && evt.target.tagName) {
        var hasClickToShow = Registry.getComponentMethod('annotations', 'hasClickToShow')(gd, newhoverdata);
        overrideCursor(d3.select(evt.target), hasClickToShow ? 'pointer' : '');
    }

    // don't emit events if called manually
    if(!evt.target || noHoverEvent || !hoverChanged(gd, evt, oldhoverdata)) return;

    if(oldhoverdata) {
        gd.emit('plotly_unhover', {
            event: evt,
            points: oldhoverdata
        });
    }

    gd.emit('plotly_hover', {
        event: evt,
        points: gd._hoverdata,
        xaxes: xaArray,
        yaxes: yaArray,
        xvals: xvalArray,
        yvals: yvalArray
    });
}

function hoverDataKey(d) {
    return [d.trace.index, d.index, d.x0, d.y0, d.name, d.attr, d.xa ? d.xa._id : '', d.ya ? d.ya._id : ''].join(',');
}

var EXTRA_STRING_REGEX = /<extra>([\s\S]*)<\/extra>/;

function createHoverText(hoverData, opts) {
    var gd = opts.gd;
    var fullLayout = gd._fullLayout;
    var hovermode = opts.hovermode;
    var rotateLabels = opts.rotateLabels;
    var bgColor = opts.bgColor;
    var container = opts.container;
    var outerContainer = opts.outerContainer;
    var commonLabelOpts = opts.commonLabelOpts || {};

    // opts.fontFamily/Size are used for the common label
    // and as defaults for each hover label, though the individual labels
    // can override this.
    var fontFamily = opts.fontFamily || constants.HOVERFONT;
    var fontSize = opts.fontSize || constants.HOVERFONTSIZE;

    var c0 = hoverData[0];
    var xa = c0.xa;
    var ya = c0.ya;
    var axLetter = hovermode.charAt(0);
    var t0 = c0[axLetter + 'Label'];
    var outerContainerBB = getBoundingClientRect(gd, outerContainer);
    var outerTop = outerContainerBB.top;
    var outerWidth = outerContainerBB.width;
    var outerHeight = outerContainerBB.height;

    // show the common label, if any, on the axis
    // never show a common label in array mode,
    // even if sometimes there could be one
    var showCommonLabel = (
        (t0 !== undefined) &&
        (c0.distance <= opts.hoverdistance) &&
        (hovermode === 'x' || hovermode === 'y')
    );

    // all hover traces hoverinfo must contain the hovermode
    // to have common labels
    if(showCommonLabel) {
        var allHaveZ = true;
        var i, traceHoverinfo;
        for(i = 0; i < hoverData.length; i++) {
            if(allHaveZ && hoverData[i].zLabel === undefined) allHaveZ = false;

            traceHoverinfo = hoverData[i].hoverinfo || hoverData[i].trace.hoverinfo;
            if(traceHoverinfo) {
                var parts = Array.isArray(traceHoverinfo) ? traceHoverinfo : traceHoverinfo.split('+');
                if(parts.indexOf('all') === -1 &&
                    parts.indexOf(hovermode) === -1) {
                    showCommonLabel = false;
                    break;
                }
            }
        }

        // xyz labels put all info in their main label, so have no need of a common label
        if(allHaveZ) showCommonLabel = false;
    }

    var commonLabel = container.selectAll('g.axistext')
        .data(showCommonLabel ? [0] : []);
    commonLabel.enter().append('g')
        .classed('axistext', true);
    commonLabel.exit().remove();

    commonLabel.each(function() {
        var label = d3.select(this);
        var lpath = Lib.ensureSingle(label, 'path', '', function(s) {
            s.style({'stroke-width': '1px'});
        });
        var ltext = Lib.ensureSingle(label, 'text', '', function(s) {
            // prohibit tex interpretation until we can handle
            // tex and regular text together
            s.attr('data-notex', 1);
        });

        var commonBgColor = commonLabelOpts.bgcolor || Color.defaultLine;
        var commonStroke = commonLabelOpts.bordercolor || Color.contrast(commonBgColor);
        var contrastColor = Color.contrast(commonBgColor);
        var commonLabelFont = {
            family: commonLabelOpts.font.family || fontFamily,
            size: commonLabelOpts.font.size || fontSize,
            color: commonLabelOpts.font.color || contrastColor
        };

        lpath.style({
            fill: commonBgColor,
            stroke: commonStroke
        });

        ltext.text(t0)
            .call(Drawing.font, commonLabelFont)
            .call(svgTextUtils.positionText, 0, 0)
            .call(svgTextUtils.convertToTspans, gd);

        label.attr('transform', '');

        var tbb = getBoundingClientRect(gd, ltext.node());
        var lx, ly;

        if(hovermode === 'x') {
            var topsign = xa.side === 'top' ? '-' : '';

            ltext.attr('text-anchor', 'middle')
                .call(svgTextUtils.positionText, 0, (xa.side === 'top' ?
                    (outerTop - tbb.bottom - HOVERARROWSIZE - HOVERTEXTPAD) :
                    (outerTop - tbb.top + HOVERARROWSIZE + HOVERTEXTPAD)));

            lx = xa._offset + (c0.x0 + c0.x1) / 2;
            ly = ya._offset + (xa.side === 'top' ? 0 : ya._length);

            var halfWidth = tbb.width / 2 + HOVERTEXTPAD;

            if(lx < halfWidth) {
                lx = halfWidth;

                lpath.attr('d', 'M-' + (halfWidth - HOVERARROWSIZE) + ',0' +
                    'L-' + (halfWidth - HOVERARROWSIZE * 2) + ',' + topsign + HOVERARROWSIZE +
                    'H' + (HOVERTEXTPAD + tbb.width / 2) +
                    'v' + topsign + (HOVERTEXTPAD * 2 + tbb.height) +
                    'H-' + halfWidth +
                    'V' + topsign + HOVERARROWSIZE +
                    'Z');
            } else if(lx > (fullLayout.width - halfWidth)) {
                lx = fullLayout.width - halfWidth;

                lpath.attr('d', 'M' + (halfWidth - HOVERARROWSIZE) + ',0' +
                    'L' + halfWidth + ',' + topsign + HOVERARROWSIZE +
                    'v' + topsign + (HOVERTEXTPAD * 2 + tbb.height) +
                    'H-' + halfWidth +
                    'V' + topsign + HOVERARROWSIZE +
                    'H' + (halfWidth - HOVERARROWSIZE * 2) + 'Z');
            } else {
                lpath.attr('d', 'M0,0' +
                    'L' + HOVERARROWSIZE + ',' + topsign + HOVERARROWSIZE +
                    'H' + (HOVERTEXTPAD + tbb.width / 2) +
                    'v' + topsign + (HOVERTEXTPAD * 2 + tbb.height) +
                    'H-' + (HOVERTEXTPAD + tbb.width / 2) +
                    'V' + topsign + HOVERARROWSIZE +
                    'H-' + HOVERARROWSIZE + 'Z');
            }
        } else {
            var anchor;
            var sgn;
            var leftsign;
            if(ya.side === 'right') {
                anchor = 'start';
                sgn = 1;
                leftsign = '';
                lx = xa._offset + xa._length;
            } else {
                anchor = 'end';
                sgn = -1;
                leftsign = '-';
                lx = xa._offset;
            }

            ly = ya._offset + (c0.y0 + c0.y1) / 2;

            ltext.attr('text-anchor', anchor);

            lpath.attr('d', 'M0,0' +
                'L' + leftsign + HOVERARROWSIZE + ',' + HOVERARROWSIZE +
                'V' + (HOVERTEXTPAD + tbb.height / 2) +
                'h' + leftsign + (HOVERTEXTPAD * 2 + tbb.width) +
                'V-' + (HOVERTEXTPAD + tbb.height / 2) +
                'H' + leftsign + HOVERARROWSIZE + 'V-' + HOVERARROWSIZE + 'Z');

            var halfHeight = tbb.height / 2;
            var lty = outerTop - tbb.top - halfHeight;
            var clipId = 'clip' + fullLayout._uid + 'commonlabel' + ya._id;
            var clipPath;

            if(lx < (tbb.width + 2 * HOVERTEXTPAD + HOVERARROWSIZE)) {
                clipPath = 'M-' + (HOVERARROWSIZE + HOVERTEXTPAD) + '-' + halfHeight +
                    'h-' + (tbb.width - HOVERTEXTPAD) +
                    'V' + halfHeight +
                    'h' + (tbb.width - HOVERTEXTPAD) + 'Z';

                var ltx = tbb.width - lx + HOVERTEXTPAD;
                svgTextUtils.positionText(ltext, ltx, lty);

                // shift each line (except the longest) so that start-of-line
                // is always visible
                if(anchor === 'end') {
                    ltext.selectAll('tspan').each(function() {
                        var s = d3.select(this);
                        var dummy = Drawing.tester.append('text')
                            .text(s.text())
                            .call(Drawing.font, commonLabelFont);
                        var dummyBB = getBoundingClientRect(gd, dummy.node());
                        if(Math.round(dummyBB.width) < Math.round(tbb.width)) {
                            s.attr('x', ltx - dummyBB.width);
                        }
                        dummy.remove();
                    });
                }
            } else {
                svgTextUtils.positionText(ltext, sgn * (HOVERTEXTPAD + HOVERARROWSIZE), lty);
                clipPath = null;
            }

            var textClip = fullLayout._topclips.selectAll('#' + clipId).data(clipPath ? [0] : []);
            textClip.enter().append('clipPath').attr('id', clipId).append('path');
            textClip.exit().remove();
            textClip.select('path').attr('d', clipPath);
            Drawing.setClipUrl(ltext, clipPath ? clipId : null, gd);
        }

        label.attr('transform', strTranslate(lx, ly));
    });

    // Show a single hover label
    if(helpers.isUnifiedHover(hovermode)) {
        // Delete leftover hover labels from other hovermodes
        container.selectAll('g.hovertext').remove();

        // Return early if nothing is hovered on
        if(hoverData.length === 0) return;

        // mock legend
        var hoverlabel = fullLayout.hoverlabel;
        var font = hoverlabel.font;
        var mockLayoutIn = {
            showlegend: true,
            legend: {
                title: {text: t0, font: font},
                font: font,
                bgcolor: hoverlabel.bgcolor,
                bordercolor: hoverlabel.bordercolor,
                borderwidth: 1,
                tracegroupgap: 7,
                traceorder: fullLayout.legend ? fullLayout.legend.traceorder : undefined,
                orientation: 'v'
            }
        };
        var mockLayoutOut = {};
        legendSupplyDefaults(mockLayoutIn, mockLayoutOut, gd._fullData);
        var mockLegend = mockLayoutOut.legend;

        // prepare items for the legend
        mockLegend.entries = [];
        for(var j = 0; j < hoverData.length; j++) {
            var texts = getHoverLabelText(hoverData[j], true, hovermode, fullLayout, t0);
            var text = texts[0];
            var name = texts[1];
            var pt = hoverData[j];
            pt.name = name;
            if(name !== '') {
                pt.text = name + ' : ' + text;
            } else {
                pt.text = text;
            }

            // pass through marker's calcdata to style legend items
            var cd = pt.cd[pt.index];
            if(cd) {
                if(cd.mc) pt.mc = cd.mc;
                if(cd.mcc) pt.mc = cd.mcc;
                if(cd.mlc) pt.mlc = cd.mlc;
                if(cd.mlcc) pt.mlc = cd.mlcc;
                if(cd.mlw) pt.mlw = cd.mlw;
                if(cd.mrc) pt.mrc = cd.mrc;
                if(cd.dir) pt.dir = cd.dir;
            }
            pt._distinct = true;

            mockLegend.entries.push([pt]);
        }
        mockLegend.entries.sort(function(a, b) { return a[0].trace.index - b[0].trace.index;});
        mockLegend.layer = container;

        // Draw unified hover label
        mockLegend._inHover = true;
        mockLegend._groupTitleFont = font;
        legendDraw(gd, mockLegend);

        // Position the hover
        var legendContainer = container.select('g.legend');
        var tbb = getBoundingClientRect(gd, legendContainer.node());
        var tWidth = tbb.width + 2 * HOVERTEXTPAD;
        var tHeight = tbb.height + 2 * HOVERTEXTPAD;
        var winningPoint = hoverData[0];
        var avgX = (winningPoint.x0 + winningPoint.x1) / 2;
        var avgY = (winningPoint.y0 + winningPoint.y1) / 2;
        // When a scatter (or e.g. heatmap) point wins, it's OK for the hovelabel to occlude the bar and other points.
        var pointWon = !(
            Registry.traceIs(winningPoint.trace, 'bar-like') ||
            Registry.traceIs(winningPoint.trace, 'box-violin')
        );

        var lyBottom, lyTop;
        if(axLetter === 'y') {
            if(pointWon) {
                lyTop = avgY - HOVERTEXTPAD;
                lyBottom = avgY + HOVERTEXTPAD;
            } else {
                lyTop = Math.min.apply(null, hoverData.map(function(c) { return Math.min(c.y0, c.y1); }));
                lyBottom = Math.max.apply(null, hoverData.map(function(c) { return Math.max(c.y0, c.y1); }));
            }
        } else {
            lyTop = lyBottom = Lib.mean(hoverData.map(function(c) { return (c.y0 + c.y1) / 2; })) - tHeight / 2;
        }

        var lxRight, lxLeft;
        if(axLetter === 'x') {
            if(pointWon) {
                lxRight = avgX + HOVERTEXTPAD;
                lxLeft = avgX - HOVERTEXTPAD;
            } else {
                lxRight = Math.max.apply(null, hoverData.map(function(c) { return Math.max(c.x0, c.x1); }));
                lxLeft = Math.min.apply(null, hoverData.map(function(c) { return Math.min(c.x0, c.x1); }));
            }
        } else {
            lxRight = lxLeft = Lib.mean(hoverData.map(function(c) { return (c.x0 + c.x1) / 2; })) - tWidth / 2;
        }

        var xOffset = xa._offset;
        var yOffset = ya._offset;
        lyBottom += yOffset;
        lxRight += xOffset;
        lxLeft += xOffset - tWidth;
        lyTop += yOffset - tHeight;

        var lx, ly; // top and left positions of the hover box

        // horizontal alignment to end up on screen
        if(lxRight + tWidth < outerWidth && lxRight >= 0) {
            lx = lxRight;
        } else if(lxLeft + tWidth < outerWidth && lxLeft >= 0) {
            lx = lxLeft;
        } else if(xOffset + tWidth < outerWidth) {
            lx = xOffset; // subplot left corner
        } else {
            // closest left or right side of the paper
            if(lxRight - avgX < avgX - lxLeft + tWidth) {
                lx = outerWidth - tWidth;
            } else {
                lx = 0;
            }
        }
        lx += HOVERTEXTPAD;

        // vertical alignement to end up on screen
        if(lyBottom + tHeight < outerHeight && lyBottom >= 0) {
            ly = lyBottom;
        } else if(lyTop + tHeight < outerHeight && lyTop >= 0) {
            ly = lyTop;
        } else if(yOffset + tHeight < outerHeight) {
            ly = yOffset; // subplot top corner
        } else {
            // closest top or bottom side of the paper
            if(lyBottom - avgY < avgY - lyTop + tHeight) {
                ly = outerHeight - tHeight;
            } else {
                ly = 0;
            }
        }
        ly += HOVERTEXTPAD;

        legendContainer.attr('transform', strTranslate(lx - 1, ly - 1));
        return legendContainer;
    }

    // show all the individual labels

    // first create the objects
    var hoverLabels = container.selectAll('g.hovertext')
        .data(hoverData, function(d) {
            // N.B. when multiple items have the same result key-function value,
            // only the first of those items in hoverData gets rendered
            return hoverDataKey(d);
        });
    hoverLabels.enter().append('g')
        .classed('hovertext', true)
        .each(function() {
            var g = d3.select(this);
            // trace name label (rect and text.name)
            g.append('rect')
                .call(Color.fill, Color.addOpacity(bgColor, 0.8));
            g.append('text').classed('name', true);
            // trace data label (path and text.nums)
            g.append('path')
                .style('stroke-width', '1px');
            g.append('text').classed('nums', true)
                .call(Drawing.font, fontFamily, fontSize);
        });
    hoverLabels.exit().remove();

    // then put the text in, position the pointer to the data,
    // and figure out sizes
    hoverLabels.each(function(d) {
        var g = d3.select(this).attr('transform', '');

        var dColor = d.color;
        if(Array.isArray(dColor)) {
            dColor = dColor[d.eventData[0].pointNumber];
        }

        // combine possible non-opaque trace color with bgColor
        var color0 = d.bgcolor || dColor;
        // color for 'nums' part of the label
        var numsColor = Color.combine(
            Color.opacity(color0) ? color0 : Color.defaultLine,
            bgColor
        );
        // color for 'name' part of the label
        var nameColor = Color.combine(
            Color.opacity(dColor) ? dColor : Color.defaultLine,
            bgColor
        );
        // find a contrasting color for border and text
        var contrastColor = d.borderColor || Color.contrast(numsColor);

        var texts = getHoverLabelText(d, showCommonLabel, hovermode, fullLayout, t0, g);
        var text = texts[0];
        var name = texts[1];

        // main label
        var tx = g.select('text.nums')
            .call(Drawing.font,
                d.fontFamily || fontFamily,
                d.fontSize || fontSize,
                d.fontColor || contrastColor)
            .text(text)
            .attr('data-notex', 1)
            .call(svgTextUtils.positionText, 0, 0)
            .call(svgTextUtils.convertToTspans, gd);

        var tx2 = g.select('text.name');
        var tx2width = 0;
        var tx2height = 0;

        // secondary label for non-empty 'name'
        if(name && name !== text) {
            tx2.call(Drawing.font,
                    d.fontFamily || fontFamily,
                    d.fontSize || fontSize,
                    nameColor)
                .text(name)
                .attr('data-notex', 1)
                .call(svgTextUtils.positionText, 0, 0)
                .call(svgTextUtils.convertToTspans, gd);

            var t2bb = getBoundingClientRect(gd, tx2.node());
            tx2width = t2bb.width + 2 * HOVERTEXTPAD;
            tx2height = t2bb.height + 2 * HOVERTEXTPAD;
        } else {
            tx2.remove();
            g.select('rect').remove();
        }

        g.select('path').style({
            fill: numsColor,
            stroke: contrastColor
        });

        var htx = d.xa._offset + (d.x0 + d.x1) / 2;
        var hty = d.ya._offset + (d.y0 + d.y1) / 2;
        var dx = Math.abs(d.x1 - d.x0);
        var dy = Math.abs(d.y1 - d.y0);

        var tbb = getBoundingClientRect(gd, tx.node());
        var tbbWidth = tbb.width / fullLayout._invScaleX;
        var tbbHeight = tbb.height / fullLayout._invScaleY;

        d.ty0 = (outerTop - tbb.top) / fullLayout._invScaleY;
        d.bx = tbbWidth + 2 * HOVERTEXTPAD;
        d.by = Math.max(tbbHeight + 2 * HOVERTEXTPAD, tx2height);
        d.anchor = 'start';
        d.txwidth = tbbWidth;
        d.tx2width = tx2width;
        d.offset = 0;

        var txTotalWidth = (tbbWidth + HOVERARROWSIZE + HOVERTEXTPAD + tx2width) * fullLayout._invScaleX;
        var anchorStartOK, anchorEndOK;

        if(rotateLabels) {
            d.pos = htx;
            anchorStartOK = hty + dy / 2 + txTotalWidth <= outerHeight;
            anchorEndOK = hty - dy / 2 - txTotalWidth >= 0;
            if((d.idealAlign === 'top' || !anchorStartOK) && anchorEndOK) {
                hty -= dy / 2;
                d.anchor = 'end';
            } else if(anchorStartOK) {
                hty += dy / 2;
                d.anchor = 'start';
            } else d.anchor = 'middle';
        } else {
            d.pos = hty;
            anchorStartOK = htx + dx / 2 + txTotalWidth <= outerWidth;
            anchorEndOK = htx - dx / 2 - txTotalWidth >= 0;

            if((d.idealAlign === 'left' || !anchorStartOK) && anchorEndOK) {
                htx -= dx / 2;
                d.anchor = 'end';
            } else if(anchorStartOK) {
                htx += dx / 2;
                d.anchor = 'start';
            } else {
                d.anchor = 'middle';

                var txHalfWidth = txTotalWidth / 2;
                var overflowR = htx + txHalfWidth - outerWidth;
                var overflowL = htx - txHalfWidth;
                if(overflowR > 0) htx -= overflowR;
                if(overflowL < 0) htx += -overflowL;
            }
        }

        tx.attr('text-anchor', d.anchor);
        if(tx2width) tx2.attr('text-anchor', d.anchor);
        g.attr('transform', strTranslate(htx, hty) +
            (rotateLabels ? strRotate(YANGLE) : ''));
    });

    return hoverLabels;
}

function getHoverLabelText(d, showCommonLabel, hovermode, fullLayout, t0, g) {
    var name = '';
    var text = '';
    // to get custom 'name' labels pass cleanPoint
    if(d.nameOverride !== undefined) d.name = d.nameOverride;

    if(d.name) {
        if(d.trace._meta) {
            d.name = Lib.templateString(d.name, d.trace._meta);
        }
        name = plainText(d.name, d.nameLength);
    }

    var h0 = hovermode.charAt(0);
    var h1 = h0 === 'x' ? 'y' : 'x';

    if(d.zLabel !== undefined) {
        if(d.xLabel !== undefined) text += 'x: ' + d.xLabel + '<br>';
        if(d.yLabel !== undefined) text += 'y: ' + d.yLabel + '<br>';
        if(d.trace.type !== 'choropleth' && d.trace.type !== 'choroplethmapbox') {
            text += (text ? 'z: ' : '') + d.zLabel;
        }
    } else if(showCommonLabel && d[h0 + 'Label'] === t0) {
        text = d[h1 + 'Label'] || '';
    } else if(d.xLabel === undefined) {
        if(d.yLabel !== undefined && d.trace.type !== 'scattercarpet') {
            text = d.yLabel;
        }
    } else if(d.yLabel === undefined) text = d.xLabel;
    else text = '(' + d.xLabel + ', ' + d.yLabel + ')';

    if((d.text || d.text === 0) && !Array.isArray(d.text)) {
        text += (text ? '<br>' : '') + d.text;
    }

    // used by other modules (initially just ternary) that
    // manage their own hoverinfo independent of cleanPoint
    // the rest of this will still apply, so such modules
    // can still put things in (x|y|z)Label, text, and name
    // and hoverinfo will still determine their visibility
    if(d.extraText !== undefined) text += (text ? '<br>' : '') + d.extraText;

    // if 'text' is empty at this point,
    // and hovertemplate is not defined,
    // put 'name' in main label and don't show secondary label
    if(g && text === '' && !d.hovertemplate) {
        // if 'name' is also empty, remove entire label
        if(name === '') g.remove();
        text = name;
    }

    // hovertemplate
    var hovertemplate = d.hovertemplate || false;
    if(hovertemplate) {
        var labels = d.hovertemplateLabels || d;

        if(d[h0 + 'Label'] !== t0) {
            labels[h0 + 'other'] = labels[h0 + 'Val'];
            labels[h0 + 'otherLabel'] = labels[h0 + 'Label'];
        }

        text = Lib.hovertemplateString(
            hovertemplate,
            labels,
            fullLayout._d3locale,
            d.eventData[0] || {},
            d.trace._meta
        );

        text = text.replace(EXTRA_STRING_REGEX, function(match, extra) {
            // assign name for secondary text label
            name = plainText(extra, d.nameLength);
            // remove from main text label
            return '';
        });
    }
    return [text, name];
}

// Make groups of touching points, and within each group
// move each point so that no labels overlap, but the average
// label position is the same as it was before moving. Incidentally,
// this is equivalent to saying all the labels are on equal linear
// springs about their initial position. Initially, each point is
// its own group, but as we find overlaps we will clump the points.
//
// Also, there are hard constraints at the edges of the graphs,
// that push all groups to the middle so they are visible. I don't
// know what happens if the group spans all the way from one edge to
// the other, though it hardly matters - there's just too much
// information then.
function hoverAvoidOverlaps(hoverLabels, axKey, fullLayout) {
    var nummoves = 0;
    var axSign = 1;
    var nLabels = hoverLabels.size();

    // make groups of touching points
    var pointgroups = new Array(nLabels);
    var k = 0;

    hoverLabels.each(function(d) {
        var ax = d[axKey];
        var axIsX = ax._id.charAt(0) === 'x';
        var rng = ax.range;

        if(k === 0 && rng && ((rng[0] > rng[1]) !== axIsX)) {
            axSign = -1;
        }
        pointgroups[k++] = [{
            datum: d,
            traceIndex: d.trace.index,
            dp: 0,
            pos: d.pos,
            posref: d.posref,
            size: d.by * (axIsX ? YFACTOR : 1) / 2,
            pmin: 0,
            pmax: (axIsX ? fullLayout.width : fullLayout.height)
        }];
    });

    pointgroups.sort(function(a, b) {
        return (a[0].posref - b[0].posref) ||
            // for equal positions, sort trace indices increasing or decreasing
            // depending on whether the axis is reversed or not... so stacked
            // traces will generally keep their order even if one trace adds
            // nothing to the stack.
            (axSign * (b[0].traceIndex - a[0].traceIndex));
    });

    var donepositioning, topOverlap, bottomOverlap, i, j, pti, sumdp;

    function constrainGroup(grp) {
        var minPt = grp[0];
        var maxPt = grp[grp.length - 1];

        // overlap with the top - positive vals are overlaps
        topOverlap = minPt.pmin - minPt.pos - minPt.dp + minPt.size;

        // overlap with the bottom - positive vals are overlaps
        bottomOverlap = maxPt.pos + maxPt.dp + maxPt.size - minPt.pmax;

        // check for min overlap first, so that we always
        // see the largest labels
        // allow for .01px overlap, so we don't get an
        // infinite loop from rounding errors
        if(topOverlap > 0.01) {
            for(j = grp.length - 1; j >= 0; j--) grp[j].dp += topOverlap;
            donepositioning = false;
        }
        if(bottomOverlap < 0.01) return;
        if(topOverlap < -0.01) {
            // make sure we're not pushing back and forth
            for(j = grp.length - 1; j >= 0; j--) grp[j].dp -= bottomOverlap;
            donepositioning = false;
        }
        if(!donepositioning) return;

        // no room to fix positioning, delete off-screen points

        // first see how many points we need to delete
        var deleteCount = 0;
        for(i = 0; i < grp.length; i++) {
            pti = grp[i];
            if(pti.pos + pti.dp + pti.size > minPt.pmax) deleteCount++;
        }

        // start by deleting points whose data is off screen
        for(i = grp.length - 1; i >= 0; i--) {
            if(deleteCount <= 0) break;
            pti = grp[i];

            // pos has already been constrained to [pmin,pmax]
            // so look for points close to that to delete
            if(pti.pos > minPt.pmax - 1) {
                pti.del = true;
                deleteCount--;
            }
        }
        for(i = 0; i < grp.length; i++) {
            if(deleteCount <= 0) break;
            pti = grp[i];

            // pos has already been constrained to [pmin,pmax]
            // so look for points close to that to delete
            if(pti.pos < minPt.pmin + 1) {
                pti.del = true;
                deleteCount--;

                // shift the whole group minus into this new space
                bottomOverlap = pti.size * 2;
                for(j = grp.length - 1; j >= 0; j--) grp[j].dp -= bottomOverlap;
            }
        }
        // then delete points that go off the bottom
        for(i = grp.length - 1; i >= 0; i--) {
            if(deleteCount <= 0) break;
            pti = grp[i];
            if(pti.pos + pti.dp + pti.size > minPt.pmax) {
                pti.del = true;
                deleteCount--;
            }
        }
    }

    // loop through groups, combining them if they overlap,
    // until nothing moves
    while(!donepositioning && nummoves <= nLabels) {
        // to avoid infinite loops, don't move more times
        // than there are traces
        nummoves++;

        // assume nothing will move in this iteration,
        // reverse this if it does
        donepositioning = true;
        i = 0;
        while(i < pointgroups.length - 1) {
            // the higher (g0) and lower (g1) point group
            var g0 = pointgroups[i];
            var g1 = pointgroups[i + 1];

            // the lowest point in the higher group (p0)
            // the highest point in the lower group (p1)
            var p0 = g0[g0.length - 1];
            var p1 = g1[0];
            topOverlap = p0.pos + p0.dp + p0.size - p1.pos - p1.dp + p1.size;

            // Only group points that lie on the same axes
            if(topOverlap > 0.01 && (p0.pmin === p1.pmin) && (p0.pmax === p1.pmax)) {
                // push the new point(s) added to this group out of the way
                for(j = g1.length - 1; j >= 0; j--) g1[j].dp += topOverlap;

                // add them to the group
                g0.push.apply(g0, g1);
                pointgroups.splice(i + 1, 1);

                // adjust for minimum average movement
                sumdp = 0;
                for(j = g0.length - 1; j >= 0; j--) sumdp += g0[j].dp;
                bottomOverlap = sumdp / g0.length;
                for(j = g0.length - 1; j >= 0; j--) g0[j].dp -= bottomOverlap;
                donepositioning = false;
            } else i++;
        }

        // check if we're going off the plot on either side and fix
        pointgroups.forEach(constrainGroup);
    }

    // now put these offsets into hoverData
    for(i = pointgroups.length - 1; i >= 0; i--) {
        var grp = pointgroups[i];
        for(j = grp.length - 1; j >= 0; j--) {
            var pt = grp[j];
            var hoverPt = pt.datum;
            hoverPt.offset = pt.dp;
            hoverPt.del = pt.del;
        }
    }
}

function alignHoverText(hoverLabels, rotateLabels, scaleX, scaleY) {
    var pX = function(x) { return x * scaleX; };
    var pY = function(y) { return y * scaleY; };

    // finally set the text positioning relative to the data and draw the
    // box around it
    hoverLabels.each(function(d) {
        var g = d3.select(this);
        if(d.del) return g.remove();

        var tx = g.select('text.nums');
        var anchor = d.anchor;
        var horzSign = anchor === 'end' ? -1 : 1;
        var alignShift = {start: 1, end: -1, middle: 0}[anchor];
        var txx = alignShift * (HOVERARROWSIZE + HOVERTEXTPAD);
        var tx2x = txx + alignShift * (d.txwidth + HOVERTEXTPAD);
        var offsetX = 0;
        var offsetY = d.offset;

        var isMiddle = anchor === 'middle';
        if(isMiddle) {
            txx -= d.tx2width / 2;
            tx2x += d.txwidth / 2 + HOVERTEXTPAD;
        }
        if(rotateLabels) {
            offsetY *= -YSHIFTY;
            offsetX = d.offset * YSHIFTX;
        }

        g.select('path')
            .attr('d', isMiddle ?
            // middle aligned: rect centered on data
            ('M-' + pX(d.bx / 2 + d.tx2width / 2) + ',' + pY(offsetY - d.by / 2) +
              'h' + pX(d.bx) + 'v' + pY(d.by) + 'h-' + pX(d.bx) + 'Z') :
            // left or right aligned: side rect with arrow to data
            ('M0,0L' + pX(horzSign * HOVERARROWSIZE + offsetX) + ',' + pY(HOVERARROWSIZE + offsetY) +
                'v' + pY(d.by / 2 - HOVERARROWSIZE) +
                'h' + pX(horzSign * d.bx) +
                'v-' + pY(d.by) +
                'H' + pX(horzSign * HOVERARROWSIZE + offsetX) +
                'V' + pY(offsetY - HOVERARROWSIZE) +
                'Z'));

        var posX = offsetX + txx;
        var posY = offsetY + d.ty0 - d.by / 2 + HOVERTEXTPAD;
        var textAlign = d.textAlign || 'auto';

        if(textAlign !== 'auto') {
            if(textAlign === 'left' && anchor !== 'start') {
                tx.attr('text-anchor', 'start');
                posX = isMiddle ?
                    -d.bx / 2 - d.tx2width / 2 + HOVERTEXTPAD :
                    -d.bx - HOVERTEXTPAD;
            } else if(textAlign === 'right' && anchor !== 'end') {
                tx.attr('text-anchor', 'end');
                posX = isMiddle ?
                    d.bx / 2 - d.tx2width / 2 - HOVERTEXTPAD :
                    d.bx + HOVERTEXTPAD;
            }
        }

        tx.call(svgTextUtils.positionText, pX(posX), pY(posY));

        if(d.tx2width) {
            g.select('text.name')
                .call(svgTextUtils.positionText,
                    pX(tx2x + alignShift * HOVERTEXTPAD + offsetX),
                    pY(offsetY + d.ty0 - d.by / 2 + HOVERTEXTPAD));
            g.select('rect')
                .call(Drawing.setRect,
                    pX(tx2x + (alignShift - 1) * d.tx2width / 2 + offsetX),
                    pY(offsetY - d.by / 2 - 1),
                    pX(d.tx2width), pY(d.by + 2));
        }
    });
}

function cleanPoint(d, hovermode) {
    var index = d.index;
    var trace = d.trace || {};
    var cd0 = d.cd[0];
    var cd = d.cd[index] || {};

    function pass(v) {
        return v || (isNumeric(v) && v === 0);
    }

    var getVal = Array.isArray(index) ?
        function(calcKey, traceKey) {
            var v = Lib.castOption(cd0, index, calcKey);
            return pass(v) ? v : Lib.extractOption({}, trace, '', traceKey);
        } :
        function(calcKey, traceKey) {
            return Lib.extractOption(cd, trace, calcKey, traceKey);
        };

    function fill(key, calcKey, traceKey) {
        var val = getVal(calcKey, traceKey);
        if(pass(val)) d[key] = val;
    }

    fill('hoverinfo', 'hi', 'hoverinfo');
    fill('bgcolor', 'hbg', 'hoverlabel.bgcolor');
    fill('borderColor', 'hbc', 'hoverlabel.bordercolor');
    fill('fontFamily', 'htf', 'hoverlabel.font.family');
    fill('fontSize', 'hts', 'hoverlabel.font.size');
    fill('fontColor', 'htc', 'hoverlabel.font.color');
    fill('nameLength', 'hnl', 'hoverlabel.namelength');
    fill('textAlign', 'hta', 'hoverlabel.align');

    d.posref = (hovermode === 'y' || (hovermode === 'closest' && trace.orientation === 'h')) ?
        (d.xa._offset + (d.x0 + d.x1) / 2) :
        (d.ya._offset + (d.y0 + d.y1) / 2);

    // then constrain all the positions to be on the plot
    d.x0 = Lib.constrain(d.x0, 0, d.xa._length);
    d.x1 = Lib.constrain(d.x1, 0, d.xa._length);
    d.y0 = Lib.constrain(d.y0, 0, d.ya._length);
    d.y1 = Lib.constrain(d.y1, 0, d.ya._length);

    // and convert the x and y label values into formatted text
    if(d.xLabelVal !== undefined) {
        d.xLabel = ('xLabel' in d) ? d.xLabel : Axes.hoverLabelText(d.xa, d.xLabelVal, trace.xhoverformat);
        d.xVal = d.xa.c2d(d.xLabelVal);
    }
    if(d.yLabelVal !== undefined) {
        d.yLabel = ('yLabel' in d) ? d.yLabel : Axes.hoverLabelText(d.ya, d.yLabelVal, trace.yhoverformat);
        d.yVal = d.ya.c2d(d.yLabelVal);
    }

    // Traces like heatmaps generate the zLabel in their hoverPoints function
    if(d.zLabelVal !== undefined && d.zLabel === undefined) {
        d.zLabel = String(d.zLabelVal);
    }

    // for box means and error bars, add the range to the label
    if(!isNaN(d.xerr) && !(d.xa.type === 'log' && d.xerr <= 0)) {
        var xeText = Axes.tickText(d.xa, d.xa.c2l(d.xerr), 'hover').text;
        if(d.xerrneg !== undefined) {
            d.xLabel += ' +' + xeText + ' / -' +
                Axes.tickText(d.xa, d.xa.c2l(d.xerrneg), 'hover').text;
        } else d.xLabel += ' ± ' + xeText;

        // small distance penalty for error bars, so that if there are
        // traces with errors and some without, the error bar label will
        // hoist up to the point
        if(hovermode === 'x') d.distance += 1;
    }
    if(!isNaN(d.yerr) && !(d.ya.type === 'log' && d.yerr <= 0)) {
        var yeText = Axes.tickText(d.ya, d.ya.c2l(d.yerr), 'hover').text;
        if(d.yerrneg !== undefined) {
            d.yLabel += ' +' + yeText + ' / -' +
                Axes.tickText(d.ya, d.ya.c2l(d.yerrneg), 'hover').text;
        } else d.yLabel += ' ± ' + yeText;

        if(hovermode === 'y') d.distance += 1;
    }

    var infomode = d.hoverinfo || d.trace.hoverinfo;

    if(infomode && infomode !== 'all') {
        infomode = Array.isArray(infomode) ? infomode : infomode.split('+');
        if(infomode.indexOf('x') === -1) d.xLabel = undefined;
        if(infomode.indexOf('y') === -1) d.yLabel = undefined;
        if(infomode.indexOf('z') === -1) d.zLabel = undefined;
        if(infomode.indexOf('text') === -1) d.text = undefined;
        if(infomode.indexOf('name') === -1) d.name = undefined;
    }

    return d;
}

function createSpikelines(gd, closestPoints, opts) {
    var container = opts.container;
    var fullLayout = opts.fullLayout;
    var gs = fullLayout._size;
    var evt = opts.event;
    var showY = !!closestPoints.hLinePoint;
    var showX = !!closestPoints.vLinePoint;

    var xa, ya;

    // Remove old spikeline items
    container.selectAll('.spikeline').remove();

    if(!(showX || showY)) return;

    var contrastColor = Color.combine(fullLayout.plot_bgcolor, fullLayout.paper_bgcolor);

    // Horizontal line (to y-axis)
    if(showY) {
        var hLinePoint = closestPoints.hLinePoint;
        var hLinePointX, hLinePointY;

        xa = hLinePoint && hLinePoint.xa;
        ya = hLinePoint && hLinePoint.ya;
        var ySnap = ya.spikesnap;

        if(ySnap === 'cursor') {
            hLinePointX = evt.pointerX;
            hLinePointY = evt.pointerY;
        } else {
            hLinePointX = xa._offset + hLinePoint.x;
            hLinePointY = ya._offset + hLinePoint.y;
        }
        var dfltHLineColor = tinycolor.readability(hLinePoint.color, contrastColor) < 1.5 ?
            Color.contrast(contrastColor) : hLinePoint.color;
        var yMode = ya.spikemode;
        var yThickness = ya.spikethickness;
        var yColor = ya.spikecolor || dfltHLineColor;
        var xEdge = Axes.getPxPosition(gd, ya);
        var xBase, xEndSpike;

        if(yMode.indexOf('toaxis') !== -1 || yMode.indexOf('across') !== -1) {
            if(yMode.indexOf('toaxis') !== -1) {
                xBase = xEdge;
                xEndSpike = hLinePointX;
            }
            if(yMode.indexOf('across') !== -1) {
                var xAcross0 = ya._counterDomainMin;
                var xAcross1 = ya._counterDomainMax;
                if(ya.anchor === 'free') {
                    xAcross0 = Math.min(xAcross0, ya.position);
                    xAcross1 = Math.max(xAcross1, ya.position);
                }
                xBase = gs.l + xAcross0 * gs.w;
                xEndSpike = gs.l + xAcross1 * gs.w;
            }

            // Foreground horizontal line (to y-axis)
            container.insert('line', ':first-child')
                .attr({
                    x1: xBase,
                    x2: xEndSpike,
                    y1: hLinePointY,
                    y2: hLinePointY,
                    'stroke-width': yThickness,
                    stroke: yColor,
                    'stroke-dasharray': Drawing.dashStyle(ya.spikedash, yThickness)
                })
                .classed('spikeline', true)
                .classed('crisp', true);

            // Background horizontal Line (to y-axis)
            container.insert('line', ':first-child')
                .attr({
                    x1: xBase,
                    x2: xEndSpike,
                    y1: hLinePointY,
                    y2: hLinePointY,
                    'stroke-width': yThickness + 2,
                    stroke: contrastColor
                })
                .classed('spikeline', true)
                .classed('crisp', true);
        }
        // Y axis marker
        if(yMode.indexOf('marker') !== -1) {
            container.insert('circle', ':first-child')
                .attr({
                    cx: xEdge + (ya.side !== 'right' ? yThickness : -yThickness),
                    cy: hLinePointY,
                    r: yThickness,
                    fill: yColor
                })
                .classed('spikeline', true);
        }
    }

    if(showX) {
        var vLinePoint = closestPoints.vLinePoint;
        var vLinePointX, vLinePointY;

        xa = vLinePoint && vLinePoint.xa;
        ya = vLinePoint && vLinePoint.ya;
        var xSnap = xa.spikesnap;

        if(xSnap === 'cursor') {
            vLinePointX = evt.pointerX;
            vLinePointY = evt.pointerY;
        } else {
            vLinePointX = xa._offset + vLinePoint.x;
            vLinePointY = ya._offset + vLinePoint.y;
        }
        var dfltVLineColor = tinycolor.readability(vLinePoint.color, contrastColor) < 1.5 ?
            Color.contrast(contrastColor) : vLinePoint.color;
        var xMode = xa.spikemode;
        var xThickness = xa.spikethickness;
        var xColor = xa.spikecolor || dfltVLineColor;
        var yEdge = Axes.getPxPosition(gd, xa);
        var yBase, yEndSpike;

        if(xMode.indexOf('toaxis') !== -1 || xMode.indexOf('across') !== -1) {
            if(xMode.indexOf('toaxis') !== -1) {
                yBase = yEdge;
                yEndSpike = vLinePointY;
            }
            if(xMode.indexOf('across') !== -1) {
                var yAcross0 = xa._counterDomainMin;
                var yAcross1 = xa._counterDomainMax;
                if(xa.anchor === 'free') {
                    yAcross0 = Math.min(yAcross0, xa.position);
                    yAcross1 = Math.max(yAcross1, xa.position);
                }
                yBase = gs.t + (1 - yAcross1) * gs.h;
                yEndSpike = gs.t + (1 - yAcross0) * gs.h;
            }

            // Foreground vertical line (to x-axis)
            container.insert('line', ':first-child')
                .attr({
                    x1: vLinePointX,
                    x2: vLinePointX,
                    y1: yBase,
                    y2: yEndSpike,
                    'stroke-width': xThickness,
                    stroke: xColor,
                    'stroke-dasharray': Drawing.dashStyle(xa.spikedash, xThickness)
                })
                .classed('spikeline', true)
                .classed('crisp', true);

            // Background vertical line (to x-axis)
            container.insert('line', ':first-child')
                .attr({
                    x1: vLinePointX,
                    x2: vLinePointX,
                    y1: yBase,
                    y2: yEndSpike,
                    'stroke-width': xThickness + 2,
                    stroke: contrastColor
                })
                .classed('spikeline', true)
                .classed('crisp', true);
        }

        // X axis marker
        if(xMode.indexOf('marker') !== -1) {
            container.insert('circle', ':first-child')
                .attr({
                    cx: vLinePointX,
                    cy: yEdge - (xa.side !== 'top' ? xThickness : -xThickness),
                    r: xThickness,
                    fill: xColor
                })
                .classed('spikeline', true);
        }
    }
}

function hoverChanged(gd, evt, oldhoverdata) {
    // don't emit any events if nothing changed
    if(!oldhoverdata || oldhoverdata.length !== gd._hoverdata.length) return true;

    for(var i = oldhoverdata.length - 1; i >= 0; i--) {
        var oldPt = oldhoverdata[i];
        var newPt = gd._hoverdata[i];

        if(oldPt.curveNumber !== newPt.curveNumber ||
            String(oldPt.pointNumber) !== String(newPt.pointNumber) ||
            String(oldPt.pointNumbers) !== String(newPt.pointNumbers)
        ) {
            return true;
        }
    }
    return false;
}

function spikesChanged(gd, oldspikepoints) {
    // don't relayout the plot because of new spikelines if spikelines points didn't change
    if(!oldspikepoints) return true;
    if(oldspikepoints.vLinePoint !== gd._spikepoints.vLinePoint ||
        oldspikepoints.hLinePoint !== gd._spikepoints.hLinePoint
    ) return true;
    return false;
}

function plainText(s, len) {
    return svgTextUtils.plainText(s || '', {
        len: len,
        allowedTags: ['br', 'sub', 'sup', 'b', 'i', 'em']
    });
}

function orderRangePoints(hoverData, hovermode) {
    var axLetter = hovermode.charAt(0);

    var first = [];
    var second = [];
    var last = [];

    for(var i = 0; i < hoverData.length; i++) {
        var d = hoverData[i];

        if(
            Registry.traceIs(d.trace, 'bar-like') ||
            Registry.traceIs(d.trace, 'box-violin')
        ) {
            last.push(d);
        } else if(d.trace[axLetter + 'period']) {
            second.push(d);
        } else {
            first.push(d);
        }
    }

    return first.concat(second).concat(last);
}

function getCoord(axLetter, winningPoint, fullLayout) {
    var ax = winningPoint[axLetter + 'a'];
    var val = winningPoint[axLetter + 'Val'];

    var cd0 = winningPoint.cd[0];

    if(ax.type === 'category') val = ax._categoriesMap[val];
    else if(ax.type === 'date') {
        var periodalignment = winningPoint.trace[axLetter + 'periodalignment'];
        if(periodalignment) {
            var d = winningPoint.cd[winningPoint.index];

            var start = d[axLetter + 'Start'];
            if(start === undefined) start = d[axLetter];

            var end = d[axLetter + 'End'];
            if(end === undefined) end = d[axLetter];

            var diff = end - start;

            if(periodalignment === 'end') {
                val += diff;
            } else if(periodalignment === 'middle') {
                val += diff / 2;
            }
        }

        val = ax.d2c(val);
    }

    if(cd0 && cd0.t && cd0.t.posLetter === ax._id) {
        if(
            fullLayout.boxmode === 'group' ||
            fullLayout.violinmode === 'group'
        ) {
            val += cd0.t.dPos;
        }
    }

    return val;
}

// Top/left hover offsets relative to graph div. As long as hover content is
// a sibling of the graph div, it will be positioned correctly relative to
// the offset parent, whatever that may be.
function getTopOffset(gd) { return gd.offsetTop + gd.clientTop; }
function getLeftOffset(gd) { return gd.offsetLeft + gd.clientLeft; }

function getBoundingClientRect(gd, node) {
    var fullLayout = gd._fullLayout;

    var rect = node.getBoundingClientRect();

    var x0 = rect.x;
    var y0 = rect.y;
    var x1 = x0 + rect.width;
    var y1 = y0 + rect.height;

    var A = Lib.apply3DTransform(fullLayout._invTransform)(x0, y0);
    var B = Lib.apply3DTransform(fullLayout._invTransform)(x1, y1);

    var Ax = A[0];
    var Ay = A[1];
    var Bx = B[0];
    var By = B[1];

    return {
        x: Ax,
        y: Ay,
        width: Bx - Ax,
        height: By - Ay,
        top: Math.min(Ay, By),
        left: Math.min(Ax, Bx),
        right: Math.max(Ax, Bx),
        bottom: Math.max(Ay, By),
    };
}
