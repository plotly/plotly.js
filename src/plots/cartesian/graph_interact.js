/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var d3 = require('d3');
var tinycolor = require('tinycolor2');
var isNumeric = require('fast-isnumeric');

var Lib = require('../../lib');
var Events = require('../../lib/events');
var svgTextUtils = require('../../lib/svg_text_utils');
var Color = require('../../components/color');
var Drawing = require('../../components/drawing');
var dragElement = require('../../components/dragelement');
var overrideCursor = require('../../lib/override_cursor');
var Registry = require('../../registry');

var Axes = require('./axes');
var constants = require('./constants');
var dragBox = require('./dragbox');
var layoutAttributes = require('../layout_attributes');


var fx = module.exports = {};

// TODO remove this in version 2.0
// copy on Fx for backward compatible
fx.unhover = dragElement.unhover;

fx.supplyLayoutDefaults = function(layoutIn, layoutOut, fullData) {

    function coerce(attr, dflt) {
        return Lib.coerce(layoutIn, layoutOut, layoutAttributes, attr, dflt);
    }

    coerce('dragmode');

    var hovermodeDflt;
    if(layoutOut._has('cartesian')) {
        // flag for 'horizontal' plots:
        // determines the state of the mode bar 'compare' hovermode button
        var isHoriz = layoutOut._isHoriz = fx.isHoriz(fullData);
        hovermodeDflt = isHoriz ? 'y' : 'x';
    }
    else hovermodeDflt = 'closest';

    coerce('hovermode', hovermodeDflt);
};

fx.isHoriz = function(fullData) {
    var isHoriz = true;

    for(var i = 0; i < fullData.length; i++) {
        var trace = fullData[i];

        if(trace.orientation !== 'h') {
            isHoriz = false;
            break;
        }
    }

    return isHoriz;
};

fx.init = function(gd) {
    var fullLayout = gd._fullLayout;

    if(!fullLayout._has('cartesian') || gd._context.staticPlot) return;

    var subplots = Object.keys(fullLayout._plots || {}).sort(function(a, b) {
        // sort overlays last, then by x axis number, then y axis number
        if((fullLayout._plots[a].mainplot && true) ===
            (fullLayout._plots[b].mainplot && true)) {
            var aParts = a.split('y'),
                bParts = b.split('y');
            return (aParts[0] === bParts[0]) ?
                (Number(aParts[1] || 1) - Number(bParts[1] || 1)) :
                (Number(aParts[0] || 1) - Number(bParts[0] || 1));
        }
        return fullLayout._plots[a].mainplot ? 1 : -1;
    });

    subplots.forEach(function(subplot) {
        var plotinfo = fullLayout._plots[subplot];

        if(!fullLayout._has('cartesian')) return;

        var xa = plotinfo.xaxis,
            ya = plotinfo.yaxis,

            // the y position of the main x axis line
            y0 = (xa._linepositions[subplot] || [])[3],

            // the x position of the main y axis line
            x0 = (ya._linepositions[subplot] || [])[3];

        var DRAGGERSIZE = constants.DRAGGERSIZE;
        if(isNumeric(y0) && xa.side === 'top') y0 -= DRAGGERSIZE;
        if(isNumeric(x0) && ya.side !== 'right') x0 -= DRAGGERSIZE;

        // main and corner draggers need not be repeated for
        // overlaid subplots - these draggers drag them all
        if(!plotinfo.mainplot) {
            // main dragger goes over the grids and data, so we use its
            // mousemove events for all data hover effects
            var maindrag = dragBox(gd, plotinfo, 0, 0,
                xa._length, ya._length, 'ns', 'ew');

            maindrag.onmousemove = function(evt) {
                // This is on `gd._fullLayout`, *not* fullLayout because the reference
                // changes by the time this is called again.
                gd._fullLayout._rehover = function() {
                    if(gd._fullLayout._hoversubplot === subplot) {
                        fx.hover(gd, evt, subplot);
                    }
                };

                fx.hover(gd, evt, subplot);

                // Note that we have *not* used the cached fullLayout variable here
                // since that may be outdated when this is called as a callback later on
                gd._fullLayout._lasthover = maindrag;
                gd._fullLayout._hoversubplot = subplot;
            };

            /*
             * IMPORTANT:
             * We must check for the presence of the drag cover here.
             * If we don't, a 'mouseout' event is triggered on the
             * maindrag before each 'click' event, which has the effect
             * of clearing the hoverdata; thus, cancelling the click event.
             */
            maindrag.onmouseout = function(evt) {
                if(gd._dragging) return;

                // When the mouse leaves this maindrag, unset the hovered subplot.
                // This may cause problems if it leaves the subplot directly *onto*
                // another subplot, but that's a tiny corner case at the moment.
                gd._fullLayout._hoversubplot = null;

                dragElement.unhover(gd, evt);
            };

            maindrag.onclick = function(evt) {
                fx.click(gd, evt);
            };

            // corner draggers
            if(gd._context.showAxisDragHandles) {
                dragBox(gd, plotinfo, -DRAGGERSIZE, -DRAGGERSIZE,
                    DRAGGERSIZE, DRAGGERSIZE, 'n', 'w');
                dragBox(gd, plotinfo, xa._length, -DRAGGERSIZE,
                    DRAGGERSIZE, DRAGGERSIZE, 'n', 'e');
                dragBox(gd, plotinfo, -DRAGGERSIZE, ya._length,
                    DRAGGERSIZE, DRAGGERSIZE, 's', 'w');
                dragBox(gd, plotinfo, xa._length, ya._length,
                    DRAGGERSIZE, DRAGGERSIZE, 's', 'e');
            }
        }
        if(gd._context.showAxisDragHandles) {
            // x axis draggers - if you have overlaid plots,
            // these drag each axis separately
            if(isNumeric(y0)) {
                if(xa.anchor === 'free') y0 -= fullLayout._size.h * (1 - ya.domain[1]);
                dragBox(gd, plotinfo, xa._length * 0.1, y0,
                    xa._length * 0.8, DRAGGERSIZE, '', 'ew');
                dragBox(gd, plotinfo, 0, y0,
                    xa._length * 0.1, DRAGGERSIZE, '', 'w');
                dragBox(gd, plotinfo, xa._length * 0.9, y0,
                    xa._length * 0.1, DRAGGERSIZE, '', 'e');
            }
            // y axis draggers
            if(isNumeric(x0)) {
                if(ya.anchor === 'free') x0 -= fullLayout._size.w * xa.domain[0];
                dragBox(gd, plotinfo, x0, ya._length * 0.1,
                    DRAGGERSIZE, ya._length * 0.8, 'ns', '');
                dragBox(gd, plotinfo, x0, ya._length * 0.9,
                    DRAGGERSIZE, ya._length * 0.1, 's', '');
                dragBox(gd, plotinfo, x0, 0,
                    DRAGGERSIZE, ya._length * 0.1, 'n', '');
            }
        }
    });

    // In case you mousemove over some hovertext, send it to fx.hover too
    // we do this so that we can put the hover text in front of everything,
    // but still be able to interact with everything as if it isn't there
    var hoverLayer = fullLayout._hoverlayer.node();

    hoverLayer.onmousemove = function(evt) {
        evt.target = fullLayout._lasthover;
        fx.hover(gd, evt, fullLayout._hoversubplot);
    };

    hoverLayer.onclick = function(evt) {
        evt.target = fullLayout._lasthover;
        fx.click(gd, evt);
    };

    // also delegate mousedowns... TODO: does this actually work?
    hoverLayer.onmousedown = function(evt) {
        fullLayout._lasthover.onmousedown(evt);
    };
};

// hover labels for multiple horizontal bars get tilted by some angle,
// then need to be offset differently if they overlap
var YANGLE = constants.YANGLE,
    YA_RADIANS = Math.PI * YANGLE / 180,

    // expansion of projected height
    YFACTOR = 1 / Math.sin(YA_RADIANS),

    // to make the appropriate post-rotation x offset,
    // you need both x and y offsets
    YSHIFTX = Math.cos(YA_RADIANS),
    YSHIFTY = Math.sin(YA_RADIANS);

// convenience functions for mapping all relevant axes
function flat(subplots, v) {
    var out = [];
    for(var i = subplots.length; i > 0; i--) out.push(v);
    return out;
}

function p2c(axArray, v) {
    var out = [];
    for(var i = 0; i < axArray.length; i++) out.push(axArray[i].p2c(v));
    return out;
}

function quadrature(dx, dy) {
    return function(di) {
        var x = dx(di),
            y = dy(di);
        return Math.sqrt(x * x + y * y);
    };
}

// size and display constants for hover text
var HOVERARROWSIZE = constants.HOVERARROWSIZE,
    HOVERTEXTPAD = constants.HOVERTEXTPAD,
    HOVERFONTSIZE = constants.HOVERFONTSIZE,
    HOVERFONT = constants.HOVERFONT;

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
// The actual rendering is done by private functions
// hover() and unhover().

fx.hover = function(gd, evt, subplot) {
    if(typeof gd === 'string') gd = document.getElementById(gd);
    if(gd._lastHoverTime === undefined) gd._lastHoverTime = 0;

    // If we have an update queued, discard it now
    if(gd._hoverTimer !== undefined) {
        clearTimeout(gd._hoverTimer);
        gd._hoverTimer = undefined;
    }
    // Is it more than 100ms since the last update?  If so, force
    // an update now (synchronously) and exit
    if(Date.now() > gd._lastHoverTime + constants.HOVERMINTIME) {
        hover(gd, evt, subplot);
        gd._lastHoverTime = Date.now();
        return;
    }
    // Queue up the next hover for 100ms from now (if no further events)
    gd._hoverTimer = setTimeout(function() {
        hover(gd, evt, subplot);
        gd._lastHoverTime = Date.now();
        gd._hoverTimer = undefined;
    }, constants.HOVERMINTIME);
};

// The actual implementation is here:

function hover(gd, evt, subplot) {
    if(subplot === 'pie') {
        gd.emit('plotly_hover', {
            points: [evt]
        });
        return;
    }

    if(!subplot) subplot = 'xy';

    // if the user passed in an array of subplots,
    // use those instead of finding overlayed plots
    var subplots = Array.isArray(subplot) ? subplot : [subplot];

    var fullLayout = gd._fullLayout,
        plots = fullLayout._plots || [],
        plotinfo = plots[subplot];

    // list of all overlaid subplots to look at
    if(plotinfo) {
        var overlayedSubplots = plotinfo.overlays.map(function(pi) {
            return pi.id;
        });

        subplots = subplots.concat(overlayedSubplots);
    }

    var len = subplots.length,
        xaArray = new Array(len),
        yaArray = new Array(len);

    for(var i = 0; i < len; i++) {
        var spId = subplots[i];

        // 'cartesian' case
        var plotObj = plots[spId];
        if(plotObj) {

            // TODO make sure that fullLayout_plots axis refs
            // get updated properly so that we don't have
            // to use Axes.getFromId in general.

            xaArray[i] = Axes.getFromId(gd, plotObj.xaxis._id);
            yaArray[i] = Axes.getFromId(gd, plotObj.yaxis._id);
            continue;
        }

        // other subplot types
        var _subplot = fullLayout[spId]._subplot;
        xaArray[i] = _subplot.xaxis;
        yaArray[i] = _subplot.yaxis;
    }

    var hovermode = evt.hovermode || fullLayout.hovermode;

    if(['x', 'y', 'closest'].indexOf(hovermode) === -1 || !gd.calcdata ||
            gd.querySelector('.zoombox') || gd._dragging) {
        return dragElement.unhoverRaw(gd, evt);
    }

        // hoverData: the set of candidate points we've found to highlight
    var hoverData = [],

        // searchData: the data to search in. Mostly this is just a copy of
        // gd.calcdata, filtered to the subplot and overlays we're on
        // but if a point array is supplied it will be a mapping
        // of indicated curves
        searchData = [],

        // [x|y]valArray: the axis values of the hover event
        // mapped onto each of the currently selected overlaid subplots
        xvalArray,
        yvalArray,

        // used in loops
        itemnum,
        curvenum,
        cd,
        trace,
        subplotId,
        subploti,
        mode,
        xval,
        yval,
        pointData,
        closedataPreviousLength;

    // Figure out what we're hovering on:
    // mouse location or user-supplied data

    if(Array.isArray(evt)) {
        // user specified an array of points to highlight
        hovermode = 'array';
        for(itemnum = 0; itemnum < evt.length; itemnum++) {
            cd = gd.calcdata[evt[itemnum].curveNumber||0];
            if(cd[0].trace.hoverinfo !== 'skip') {
                searchData.push(cd);
            }
        }
    }
    else {
        for(curvenum = 0; curvenum < gd.calcdata.length; curvenum++) {
            cd = gd.calcdata[curvenum];
            trace = cd[0].trace;
            if(trace.hoverinfo !== 'skip' && subplots.indexOf(getSubplot(trace)) !== -1) {
                searchData.push(cd);
            }
        }

        // [x|y]px: the pixels (from top left) of the mouse location
        // on the currently selected plot area
        var xpx, ypx;

        // mouse event? ie is there a target element with
        // clientX and clientY values?
        if(evt.target && ('clientX' in evt) && ('clientY' in evt)) {

            // fire the beforehover event and quit if it returns false
            // note that we're only calling this on real mouse events, so
            // manual calls to fx.hover will always run.
            if(Events.triggerHandler(gd, 'plotly_beforehover', evt) === false) {
                return;
            }

            var dbb = evt.target.getBoundingClientRect();

            xpx = evt.clientX - dbb.left;
            ypx = evt.clientY - dbb.top;

            // in case hover was called from mouseout into hovertext,
            // it's possible you're not actually over the plot anymore
            if(xpx < 0 || xpx > dbb.width || ypx < 0 || ypx > dbb.height) {
                return dragElement.unhoverRaw(gd, evt);
            }
        }
        else {
            if('xpx' in evt) xpx = evt.xpx;
            else xpx = xaArray[0]._length / 2;

            if('ypx' in evt) ypx = evt.ypx;
            else ypx = yaArray[0]._length / 2;
        }

        if('xval' in evt) xvalArray = flat(subplots, evt.xval);
        else xvalArray = p2c(xaArray, xpx);

        if('yval' in evt) yvalArray = flat(subplots, evt.yval);
        else yvalArray = p2c(yaArray, ypx);

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
    for(curvenum = 0; curvenum < searchData.length; curvenum++) {
        cd = searchData[curvenum];

        // filter out invisible or broken data
        if(!cd || !cd[0] || !cd[0].trace || cd[0].trace.visible !== true) continue;

        trace = cd[0].trace;
        subplotId = getSubplot(trace);
        subploti = subplots.indexOf(subplotId);

        // within one trace mode can sometimes be overridden
        mode = hovermode;

        // container for new point, also used to pass info into module.hoverPoints
        pointData = {
            // trace properties
            cd: cd,
            trace: trace,
            xa: xaArray[subploti],
            ya: yaArray[subploti],
            name: (gd.data.length > 1 || trace.hoverinfo.indexOf('name') !== -1) ? trace.name : undefined,
            // point properties - override all of these
            index: false, // point index in trace - only used by plotly.js hoverdata consumers
            distance: Math.min(distance, constants.MAXDIST), // pixel distance or pseudo-distance
            color: Color.defaultLine, // trace color
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

        closedataPreviousLength = hoverData.length;

        // for a highlighting array, figure out what
        // we're searching for with this element
        if(mode === 'array') {
            var selection = evt[curvenum];
            if('pointNumber' in selection) {
                pointData.index = selection.pointNumber;
                mode = 'closest';
            }
            else {
                mode = '';
                if('xval' in selection) {
                    xval = selection.xval;
                    mode = 'x';
                }
                if('yval' in selection) {
                    yval = selection.yval;
                    mode = mode ? 'closest' : 'y';
                }
            }
        }
        else {
            xval = xvalArray[subploti];
            yval = yvalArray[subploti];
        }

        // Now find the points.
        if(trace._module && trace._module.hoverPoints) {
            var newPoints = trace._module.hoverPoints(pointData, xval, yval, mode);
            if(newPoints) {
                var newPoint;
                for(var newPointNum = 0; newPointNum < newPoints.length; newPointNum++) {
                    newPoint = newPoints[newPointNum];
                    if(isNumeric(newPoint.x0) && isNumeric(newPoint.y0)) {
                        hoverData.push(cleanPoint(newPoint, hovermode));
                    }
                }
            }
        }
        else {
            Lib.log('Unrecognized trace type in hover:', trace);
        }

        // in closest mode, remove any existing (farther) points
        // and don't look any farther than this latest point (or points, if boxes)
        if(hovermode === 'closest' && hoverData.length > closedataPreviousLength) {
            hoverData.splice(0, closedataPreviousLength);
            distance = hoverData[0].distance;
        }
    }

    // nothing left: remove all labels and quit
    if(hoverData.length === 0) return dragElement.unhoverRaw(gd, evt);

    // if there's more than one horz bar trace,
    // rotate the labels so they don't overlap
    var rotateLabels = hovermode === 'y' && searchData.length > 1;

    hoverData.sort(function(d1, d2) { return d1.distance - d2.distance; });

    var bgColor = Color.combine(
        fullLayout.plot_bgcolor || Color.background,
        fullLayout.paper_bgcolor
    );

    var labelOpts = {
        hovermode: hovermode,
        rotateLabels: rotateLabels,
        bgColor: bgColor,
        container: fullLayout._hoverlayer,
        outerContainer: fullLayout._paperdiv
    };
    var hoverLabels = createHoverText(hoverData, labelOpts);

    hoverAvoidOverlaps(hoverData, rotateLabels ? 'xa' : 'ya');

    alignHoverText(hoverLabels, rotateLabels);

    // lastly, emit custom hover/unhover events
    var oldhoverdata = gd._hoverdata,
        newhoverdata = [];

    // pull out just the data that's useful to
    // other people and send it to the event
    for(itemnum = 0; itemnum < hoverData.length; itemnum++) {
        var pt = hoverData[itemnum];

        var out = {
            data: pt.trace._input,
            fullData: pt.trace,
            curveNumber: pt.trace.index,
            pointNumber: pt.index
        };

        if(pt.trace._module.eventData) out = pt.trace._module.eventData(out, pt);
        else {
            out.x = pt.xVal;
            out.y = pt.yVal;
            out.xaxis = pt.xa;
            out.yaxis = pt.ya;

            if(pt.zLabelVal !== undefined) out.z = pt.zLabelVal;
        }

        newhoverdata.push(out);
    }

    gd._hoverdata = newhoverdata;

    // TODO: tagName hack is needed to appease geo.js's hack of using evt.target=true
    // we should improve the "fx" API so other plots can use it without these hack.
    if(evt.target && evt.target.tagName) {
        var hasClickToShow = Registry.getComponentMethod('annotations', 'hasClickToShow')(gd, newhoverdata);
        overrideCursor(d3.select(evt.target), hasClickToShow ? 'pointer' : '');
    }

    if(!hoverChanged(gd, evt, oldhoverdata)) return;

    if(oldhoverdata) {
        gd.emit('plotly_unhover', { points: oldhoverdata });
    }

    gd.emit('plotly_hover', {
        points: gd._hoverdata,
        xaxes: xaArray,
        yaxes: yaArray,
        xvals: xvalArray,
        yvals: yvalArray
    });
}

// look for either .subplot (currently just ternary)
// or xaxis and yaxis attributes
function getSubplot(trace) {
    return trace.subplot || (trace.xaxis + trace.yaxis) || trace.geo;
}

fx.getDistanceFunction = function(mode, dx, dy, dxy) {
    if(mode === 'closest') return dxy || quadrature(dx, dy);
    return mode === 'x' ? dx : dy;
};

fx.getClosest = function(cd, distfn, pointData) {
    // do we already have a point number? (array mode only)
    if(pointData.index !== false) {
        if(pointData.index >= 0 && pointData.index < cd.length) {
            pointData.distance = 0;
        }
        else pointData.index = false;
    }
    else {
        // apply the distance function to each data point
        // this is the longest loop... if this bogs down, we may need
        // to create pre-sorted data (by x or y), not sure how to
        // do this for 'closest'
        for(var i = 0; i < cd.length; i++) {
            var newDistance = distfn(cd[i]);
            if(newDistance <= pointData.distance) {
                pointData.index = i;
                pointData.distance = newDistance;
            }
        }
    }
    return pointData;
};

function cleanPoint(d, hovermode) {
    d.posref = hovermode === 'y' ? (d.x0 + d.x1) / 2 : (d.y0 + d.y1) / 2;

    // then constrain all the positions to be on the plot
    d.x0 = Lib.constrain(d.x0, 0, d.xa._length);
    d.x1 = Lib.constrain(d.x1, 0, d.xa._length);
    d.y0 = Lib.constrain(d.y0, 0, d.ya._length);
    d.y1 = Lib.constrain(d.y1, 0, d.ya._length);

    // and convert the x and y label values into objects
    // formatted as text, with font info
    var logOffScale;
    if(d.xLabelVal !== undefined) {
        logOffScale = (d.xa.type === 'log' && d.xLabelVal <= 0);
        var xLabelObj = Axes.tickText(d.xa,
                d.xa.c2l(logOffScale ? -d.xLabelVal : d.xLabelVal), 'hover');
        if(logOffScale) {
            if(d.xLabelVal === 0) d.xLabel = '0';
            else d.xLabel = '-' + xLabelObj.text;
        }
        // TODO: should we do something special if the axis calendar and
        // the data calendar are different? Somehow display both dates with
        // their system names? Right now it will just display in the axis calendar
        // but users could add the other one as text.
        else d.xLabel = xLabelObj.text;
        d.xVal = d.xa.c2d(d.xLabelVal);
    }

    if(d.yLabelVal !== undefined) {
        logOffScale = (d.ya.type === 'log' && d.yLabelVal <= 0);
        var yLabelObj = Axes.tickText(d.ya,
                d.ya.c2l(logOffScale ? -d.yLabelVal : d.yLabelVal), 'hover');
        if(logOffScale) {
            if(d.yLabelVal === 0) d.yLabel = '0';
            else d.yLabel = '-' + yLabelObj.text;
        }
        // TODO: see above TODO
        else d.yLabel = yLabelObj.text;
        d.yVal = d.ya.c2d(d.yLabelVal);
    }

    if(d.zLabelVal !== undefined) d.zLabel = String(d.zLabelVal);

    // for box means and error bars, add the range to the label
    if(!isNaN(d.xerr) && !(d.xa.type === 'log' && d.xerr <= 0)) {
        var xeText = Axes.tickText(d.xa, d.xa.c2l(d.xerr), 'hover').text;
        if(d.xerrneg !== undefined) {
            d.xLabel += ' +' + xeText + ' / -' +
                Axes.tickText(d.xa, d.xa.c2l(d.xerrneg), 'hover').text;
        }
        else d.xLabel += ' ± ' + xeText;

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
        }
        else d.yLabel += ' ± ' + yeText;

        if(hovermode === 'y') d.distance += 1;
    }

    var infomode = d.trace.hoverinfo;
    if(infomode !== 'all') {
        infomode = infomode.split('+');
        if(infomode.indexOf('x') === -1) d.xLabel = undefined;
        if(infomode.indexOf('y') === -1) d.yLabel = undefined;
        if(infomode.indexOf('z') === -1) d.zLabel = undefined;
        if(infomode.indexOf('text') === -1) d.text = undefined;
        if(infomode.indexOf('name') === -1) d.name = undefined;
    }

    return d;
}

fx.loneHover = function(hoverItem, opts) {
    // draw a single hover item in a pre-existing svg container somewhere
    // hoverItem should have keys:
    //    - x and y (or x0, x1, y0, and y1):
    //      the pixel position to mark, relative to opts.container
    //    - xLabel, yLabel, zLabel, text, and name:
    //      info to go in the label
    //    - color:
    //      the background color for the label. text & outline color will
    //      be chosen black or white to contrast with this
    // opts should have keys:
    //    - bgColor:
    //      the background color this is against, used if the trace is
    //      non-opaque, and for the name, which goes outside the box
    //    - container:
    //      a dom <svg> element - must be big enough to contain the whole
    //      hover label
    var pointData = {
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

        // filler to make createHoverText happy
        trace: {
            index: 0,
            hoverinfo: ''
        },
        xa: {_offset: 0},
        ya: {_offset: 0},
        index: 0
    };

    var container3 = d3.select(opts.container),
        outerContainer3 = opts.outerContainer ?
            d3.select(opts.outerContainer) : container3;

    var fullOpts = {
        hovermode: 'closest',
        rotateLabels: false,
        bgColor: opts.bgColor || Color.background,
        container: container3,
        outerContainer: outerContainer3
    };

    var hoverLabel = createHoverText([pointData], fullOpts);
    alignHoverText(hoverLabel, fullOpts.rotateLabels);

    return hoverLabel.node();
};

fx.loneUnhover = function(containerOrSelection) {
    // duck type whether the arg is a d3 selection because ie9 doesn't
    // handle instanceof like modern browsers do.
    var selection = Lib.isD3Selection(containerOrSelection) ?
            containerOrSelection :
            d3.select(containerOrSelection);

    selection.selectAll('g.hovertext').remove();
};

function createHoverText(hoverData, opts) {
    var hovermode = opts.hovermode,
        rotateLabels = opts.rotateLabels,
        bgColor = opts.bgColor,
        container = opts.container,
        outerContainer = opts.outerContainer,

        c0 = hoverData[0],
        xa = c0.xa,
        ya = c0.ya,
        commonAttr = hovermode === 'y' ? 'yLabel' : 'xLabel',
        t0 = c0[commonAttr],
        t00 = (String(t0) || '').split(' ')[0],
        outerContainerBB = outerContainer.node().getBoundingClientRect(),
        outerTop = outerContainerBB.top,
        outerWidth = outerContainerBB.width,
        outerHeight = outerContainerBB.height;

    // show the common label, if any, on the axis
    // never show a common label in array mode,
    // even if sometimes there could be one
    var showCommonLabel = c0.distance <= constants.MAXDIST &&
                          (hovermode === 'x' || hovermode === 'y');

    // all hover traces hoverinfo must contain the hovermode
    // to have common labels
    var i, traceHoverinfo;
    for(i = 0; i < hoverData.length; i++) {
        traceHoverinfo = hoverData[i].trace.hoverinfo;
        var parts = traceHoverinfo.split('+');
        if(parts.indexOf('all') === -1 &&
            parts.indexOf(hovermode) === -1) {
            showCommonLabel = false;
            break;
        }
    }

    var commonLabel = container.selectAll('g.axistext')
        .data(showCommonLabel ? [0] : []);
    commonLabel.enter().append('g')
        .classed('axistext', true);
    commonLabel.exit().remove();

    commonLabel.each(function() {
        var label = d3.select(this),
            lpath = label.selectAll('path').data([0]),
            ltext = label.selectAll('text').data([0]);

        lpath.enter().append('path')
            .style({fill: Color.defaultLine, 'stroke-width': '1px', stroke: Color.background});
        ltext.enter().append('text')
            .call(Drawing.font, HOVERFONT, HOVERFONTSIZE, Color.background)
            // prohibit tex interpretation until we can handle
            // tex and regular text together
            .attr('data-notex', 1);

        ltext.text(t0)
            .call(svgTextUtils.convertToTspans)
            .call(Drawing.setPosition, 0, 0)
          .selectAll('tspan.line')
            .call(Drawing.setPosition, 0, 0);
        label.attr('transform', '');

        var tbb = ltext.node().getBoundingClientRect();
        if(hovermode === 'x') {
            ltext.attr('text-anchor', 'middle')
                .call(Drawing.setPosition, 0, (xa.side === 'top' ?
                    (outerTop - tbb.bottom - HOVERARROWSIZE - HOVERTEXTPAD) :
                    (outerTop - tbb.top + HOVERARROWSIZE + HOVERTEXTPAD)))
                .selectAll('tspan.line')
                    .attr({
                        x: ltext.attr('x'),
                        y: ltext.attr('y')
                    });

            var topsign = xa.side === 'top' ? '-' : '';
            lpath.attr('d', 'M0,0' +
                'L' + HOVERARROWSIZE + ',' + topsign + HOVERARROWSIZE +
                'H' + (HOVERTEXTPAD + tbb.width / 2) +
                'v' + topsign + (HOVERTEXTPAD * 2 + tbb.height) +
                'H-' + (HOVERTEXTPAD + tbb.width / 2) +
                'V' + topsign + HOVERARROWSIZE + 'H-' + HOVERARROWSIZE + 'Z');

            label.attr('transform', 'translate(' +
                (xa._offset + (c0.x0 + c0.x1) / 2) + ',' +
                (ya._offset + (xa.side === 'top' ? 0 : ya._length)) + ')');
        }
        else {
            ltext.attr('text-anchor', ya.side === 'right' ? 'start' : 'end')
                .call(Drawing.setPosition,
                    (ya.side === 'right' ? 1 : -1) * (HOVERTEXTPAD + HOVERARROWSIZE),
                    outerTop - tbb.top - tbb.height / 2)
                .selectAll('tspan.line')
                    .attr({
                        x: ltext.attr('x'),
                        y: ltext.attr('y')
                    });

            var leftsign = ya.side === 'right' ? '' : '-';
            lpath.attr('d', 'M0,0' +
                'L' + leftsign + HOVERARROWSIZE + ',' + HOVERARROWSIZE +
                'V' + (HOVERTEXTPAD + tbb.height / 2) +
                'h' + leftsign + (HOVERTEXTPAD * 2 + tbb.width) +
                'V-' + (HOVERTEXTPAD + tbb.height / 2) +
                'H' + leftsign + HOVERARROWSIZE + 'V-' + HOVERARROWSIZE + 'Z');

            label.attr('transform', 'translate(' +
                (xa._offset + (ya.side === 'right' ? xa._length : 0)) + ',' +
                (ya._offset + (c0.y0 + c0.y1) / 2) + ')');
        }
        // remove the "close but not quite" points
        // because of error bars, only take up to a space
        hoverData = hoverData.filter(function(d) {
            return (d.zLabelVal !== undefined) ||
                (d[commonAttr] || '').split(' ')[0] === t00;
        });
    });

    // show all the individual labels

    // first create the objects
    var hoverLabels = container.selectAll('g.hovertext')
        .data(hoverData, function(d) {
            return [d.trace.index, d.index, d.x0, d.y0, d.name, d.attr, d.xa, d.ya || ''].join(',');
        });
    hoverLabels.enter().append('g')
        .classed('hovertext', true)
        .each(function() {
            var g = d3.select(this);
            // trace name label (rect and text.name)
            g.append('rect')
                .call(Color.fill, Color.addOpacity(bgColor, 0.8));
            g.append('text').classed('name', true)
                .call(Drawing.font, HOVERFONT, HOVERFONTSIZE);
            // trace data label (path and text.nums)
            g.append('path')
                .style('stroke-width', '1px');
            g.append('text').classed('nums', true)
                .call(Drawing.font, HOVERFONT, HOVERFONTSIZE);
        });
    hoverLabels.exit().remove();

    // then put the text in, position the pointer to the data,
    // and figure out sizes
    hoverLabels.each(function(d) {
        var g = d3.select(this).attr('transform', ''),
            name = '',
            text = '',
            // combine possible non-opaque trace color with bgColor
            baseColor = Color.opacity(d.color) ?
                d.color : Color.defaultLine,
            traceColor = Color.combine(baseColor, bgColor),

            // find a contrasting color for border and text
            contrastColor = tinycolor(traceColor).getBrightness() > 128 ?
                '#000' : Color.background;

        // to get custom 'name' labels pass cleanPoint
        if(d.nameOverride !== undefined) d.name = d.nameOverride;

        if(d.name && d.zLabelVal === undefined) {
            // strip out our pseudo-html elements from d.name (if it exists at all)
            name = svgTextUtils.plainText(d.name || '');

            if(name.length > 15) name = name.substr(0, 12) + '...';
        }

        // used by other modules (initially just ternary) that
        // manage their own hoverinfo independent of cleanPoint
        // the rest of this will still apply, so such modules
        // can still put things in (x|y|z)Label, text, and name
        // and hoverinfo will still determine their visibility
        if(d.extraText !== undefined) text += d.extraText;

        if(d.zLabel !== undefined) {
            if(d.xLabel !== undefined) text += 'x: ' + d.xLabel + '<br>';
            if(d.yLabel !== undefined) text += 'y: ' + d.yLabel + '<br>';
            text += (text ? 'z: ' : '') + d.zLabel;
        }
        else if(showCommonLabel && d[hovermode + 'Label'] === t0) {
            text = d[(hovermode === 'x' ? 'y' : 'x') + 'Label'] || '';
        }
        else if(d.xLabel === undefined) {
            if(d.yLabel !== undefined) text = d.yLabel;
        }
        else if(d.yLabel === undefined) text = d.xLabel;
        else text = '(' + d.xLabel + ', ' + d.yLabel + ')';

        if(d.text && !Array.isArray(d.text)) text += (text ? '<br>' : '') + d.text;

        // if 'text' is empty at this point,
        // put 'name' in main label and don't show secondary label
        if(text === '') {
            // if 'name' is also empty, remove entire label
            if(name === '') g.remove();
            text = name;
        }

        // main label
        var tx = g.select('text.nums')
            .style('fill', contrastColor)
            .call(Drawing.setPosition, 0, 0)
            .text(text)
            .attr('data-notex', 1)
            .call(svgTextUtils.convertToTspans);
        tx.selectAll('tspan.line')
            .call(Drawing.setPosition, 0, 0);

        var tx2 = g.select('text.name'),
            tx2width = 0;

        // secondary label for non-empty 'name'
        if(name && name !== text) {
            tx2.style('fill', traceColor)
                .text(name)
                .call(Drawing.setPosition, 0, 0)
                .attr('data-notex', 1)
                .call(svgTextUtils.convertToTspans);
            tx2.selectAll('tspan.line')
                .call(Drawing.setPosition, 0, 0);
            tx2width = tx2.node().getBoundingClientRect().width + 2 * HOVERTEXTPAD;
        }
        else {
            tx2.remove();
            g.select('rect').remove();
        }

        g.select('path')
            .style({
                fill: traceColor,
                stroke: contrastColor
            });
        var tbb = tx.node().getBoundingClientRect(),
            htx = d.xa._offset + (d.x0 + d.x1) / 2,
            hty = d.ya._offset + (d.y0 + d.y1) / 2,
            dx = Math.abs(d.x1 - d.x0),
            dy = Math.abs(d.y1 - d.y0),
            txTotalWidth = tbb.width + HOVERARROWSIZE + HOVERTEXTPAD + tx2width,
            anchorStartOK,
            anchorEndOK;

        d.ty0 = outerTop - tbb.top;
        d.bx = tbb.width + 2 * HOVERTEXTPAD;
        d.by = tbb.height + 2 * HOVERTEXTPAD;
        d.anchor = 'start';
        d.txwidth = tbb.width;
        d.tx2width = tx2width;
        d.offset = 0;

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
        }
        else {
            d.pos = hty;
            anchorStartOK = htx + dx / 2 + txTotalWidth <= outerWidth;
            anchorEndOK = htx - dx / 2 - txTotalWidth >= 0;
            if((d.idealAlign === 'left' || !anchorStartOK) && anchorEndOK) {
                htx -= dx / 2;
                d.anchor = 'end';
            } else if(anchorStartOK) {
                htx += dx / 2;
                d.anchor = 'start';
            } else d.anchor = 'middle';
        }

        tx.attr('text-anchor', d.anchor);
        if(tx2width) tx2.attr('text-anchor', d.anchor);
        g.attr('transform', 'translate(' + htx + ',' + hty + ')' +
            (rotateLabels ? 'rotate(' + YANGLE + ')' : ''));
    });

    return hoverLabels;
}

// Make groups of touching points, and within each group
// move each point so that no labels overlap, but the average
// label position is the same as it was before moving. Indicentally,
// this is equivalent to saying all the labels are on equal linear
// springs about their initial position. Initially, each point is
// its own group, but as we find overlaps we will clump the points.
//
// Also, there are hard constraints at the edges of the graphs,
// that push all groups to the middle so they are visible. I don't
// know what happens if the group spans all the way from one edge to
// the other, though it hardly matters - there's just too much
// information then.
function hoverAvoidOverlaps(hoverData, ax) {
    var nummoves = 0,

        // make groups of touching points
        pointgroups = hoverData
            .map(function(d, i) {
                var axis = d[ax];
                return [{
                    i: i,
                    dp: 0,
                    pos: d.pos,
                    posref: d.posref,
                    size: d.by * (axis._id.charAt(0) === 'x' ? YFACTOR : 1) / 2,
                    pmin: axis._offset,
                    pmax: axis._offset + axis._length
                }];
            })
            .sort(function(a, b) { return a[0].posref - b[0].posref; }),
        donepositioning,
        topOverlap,
        bottomOverlap,
        i, j,
        pti,
        sumdp;

    function constrainGroup(grp) {
        var minPt = grp[0],
            maxPt = grp[grp.length - 1];

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
    while(!donepositioning && nummoves <= hoverData.length) {
        // to avoid infinite loops, don't move more times
        // than there are traces
        nummoves++;

        // assume nothing will move in this iteration,
        // reverse this if it does
        donepositioning = true;
        i = 0;
        while(i < pointgroups.length - 1) {
                // the higher (g0) and lower (g1) point group
            var g0 = pointgroups[i],
                g1 = pointgroups[i + 1],

                // the lowest point in the higher group (p0)
                // the highest point in the lower group (p1)
                p0 = g0[g0.length - 1],
                p1 = g1[0];
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
            }
            else i++;
        }

        // check if we're going off the plot on either side and fix
        pointgroups.forEach(constrainGroup);
    }

    // now put these offsets into hoverData
    for(i = pointgroups.length - 1; i >= 0; i--) {
        var grp = pointgroups[i];
        for(j = grp.length - 1; j >= 0; j--) {
            var pt = grp[j],
                hoverPt = hoverData[pt.i];
            hoverPt.offset = pt.dp;
            hoverPt.del = pt.del;
        }
    }
}

function alignHoverText(hoverLabels, rotateLabels) {
    // finally set the text positioning relative to the data and draw the
    // box around it
    hoverLabels.each(function(d) {
        var g = d3.select(this);
        if(d.del) {
            g.remove();
            return;
        }
        var horzSign = d.anchor === 'end' ? -1 : 1,
            tx = g.select('text.nums'),
            alignShift = {start: 1, end: -1, middle: 0}[d.anchor],
            txx = alignShift * (HOVERARROWSIZE + HOVERTEXTPAD),
            tx2x = txx + alignShift * (d.txwidth + HOVERTEXTPAD),
            offsetX = 0,
            offsetY = d.offset;
        if(d.anchor === 'middle') {
            txx -= d.tx2width / 2;
            tx2x -= d.tx2width / 2;
        }
        if(rotateLabels) {
            offsetY *= -YSHIFTY;
            offsetX = d.offset * YSHIFTX;
        }

        g.select('path').attr('d', d.anchor === 'middle' ?
            // middle aligned: rect centered on data
            ('M-' + (d.bx / 2) + ',-' + (d.by / 2) + 'h' + d.bx + 'v' + d.by + 'h-' + d.bx + 'Z') :
            // left or right aligned: side rect with arrow to data
            ('M0,0L' + (horzSign * HOVERARROWSIZE + offsetX) + ',' + (HOVERARROWSIZE + offsetY) +
                'v' + (d.by / 2 - HOVERARROWSIZE) +
                'h' + (horzSign * d.bx) +
                'v-' + d.by +
                'H' + (horzSign * HOVERARROWSIZE + offsetX) +
                'V' + (offsetY - HOVERARROWSIZE) +
                'Z'));

        tx.call(Drawing.setPosition,
                txx + offsetX, offsetY + d.ty0 - d.by / 2 + HOVERTEXTPAD)
            .selectAll('tspan.line')
                .attr({
                    x: tx.attr('x'),
                    y: tx.attr('y')
                });

        if(d.tx2width) {
            g.select('text.name, text.name tspan.line')
                .call(Drawing.setPosition,
                    tx2x + alignShift * HOVERTEXTPAD + offsetX,
                    offsetY + d.ty0 - d.by / 2 + HOVERTEXTPAD);
            g.select('rect')
                .call(Drawing.setRect,
                    tx2x + (alignShift - 1) * d.tx2width / 2 + offsetX,
                    offsetY - d.by / 2 - 1,
                    d.tx2width, d.by + 2);
        }
    });
}

function hoverChanged(gd, evt, oldhoverdata) {
    // don't emit any events if nothing changed or
    // if fx.hover was called manually
    if(!evt.target) return false;
    if(!oldhoverdata || oldhoverdata.length !== gd._hoverdata.length) return true;

    for(var i = oldhoverdata.length - 1; i >= 0; i--) {
        var oldPt = oldhoverdata[i],
            newPt = gd._hoverdata[i];
        if(oldPt.curveNumber !== newPt.curveNumber ||
                String(oldPt.pointNumber) !== String(newPt.pointNumber)) {
            return true;
        }
    }
    return false;
}

// on click
fx.click = function(gd, evt) {
    var annotationsDone = Registry.getComponentMethod('annotations', 'onClick')(gd, gd._hoverdata);

    function emitClick() { gd.emit('plotly_click', {points: gd._hoverdata}); }

    if(gd._hoverdata && evt && evt.target) {
        if(annotationsDone && annotationsDone.then) {
            annotationsDone.then(emitClick);
        }
        else emitClick();

        // why do we get a double event without this???
        if(evt.stopImmediatePropagation) evt.stopImmediatePropagation();
    }
};


// for bar charts and others with finite-size objects: you must be inside
// it to see its hover info, so distance is infinite outside.
// But make distance inside be at least 1/4 MAXDIST, and a little bigger
// for bigger bars, to prioritize scatter and smaller bars over big bars

// note that for closest mode, two inbox's will get added in quadrature
// args are (signed) difference from the two opposite edges
// count one edge as in, so that over continuous ranges you never get a gap
fx.inbox = function(v0, v1) {
    if(v0 * v1 < 0 || v0 === 0) {
        return constants.MAXDIST * (0.6 - 0.3 / Math.max(3, Math.abs(v0 - v1)));
    }
    return Infinity;
};
