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

var Plotly = require('../../plotly');
var Registry = require('../../registry');
var Lib = require('../../lib');
var svgTextUtils = require('../../lib/svg_text_utils');
var Color = require('../../components/color');
var Drawing = require('../../components/drawing');
var setCursor = require('../../lib/setcursor');
var dragElement = require('../../components/dragelement');
var FROM_TL = require('../../constants/alignment').FROM_TL;

var Plots = require('../plots');

var doTicks = require('./axes').doTicks;
var getFromId = require('./axis_ids').getFromId;
var prepSelect = require('./select');
var scaleZoom = require('./scale_zoom');

var constants = require('./constants');
var MINDRAG = constants.MINDRAG;
var MINZOOM = constants.MINZOOM;

// flag for showing "doubleclick to zoom out" only at the beginning
var SHOWZOOMOUTTIP = true;

// dragBox: create an element to drag one or more axis ends
// inputs:
//      plotinfo - which subplot are we making dragboxes on?
//      x,y,w,h - left, top, width, height of the box
//      ns - how does this drag the vertical axis?
//          'n' - top only
//          's' - bottom only
//          'ns' - top and bottom together, difference unchanged
//      ew - same for horizontal axis
module.exports = function dragBox(gd, plotinfo, x, y, w, h, ns, ew) {
    // mouseDown stores ms of first mousedown event in the last
    // DBLCLICKDELAY ms on the drag bars
    // numClicks stores how many mousedowns have been seen
    // within DBLCLICKDELAY so we can check for click or doubleclick events
    // dragged stores whether a drag has occurred, so we don't have to
    // redraw unnecessarily, ie if no move bigger than MINDRAG or MINZOOM px
    var fullLayout = gd._fullLayout,
        zoomlayer = gd._fullLayout._zoomlayer,
        isMainDrag = (ns + ew === 'nsew'),
        subplots,
        xa,
        ya,
        xs,
        ys,
        pw,
        ph,
        xActive,
        yActive,
        cursor,
        isSubplotConstrained,
        xaLinked,
        yaLinked;

    function recomputeAxisLists() {
        xa = [plotinfo.xaxis];
        ya = [plotinfo.yaxis];
        var xa0 = xa[0];
        var ya0 = ya[0];
        pw = xa0._length;
        ph = ya0._length;

        var constraintGroups = fullLayout._axisConstraintGroups;
        var xIDs = [xa0._id];
        var yIDs = [ya0._id];

        // if we're dragging two axes at once, also drag overlays
        subplots = [plotinfo].concat((ns && ew) ? plotinfo.overlays : []);

        for(var i = 1; i < subplots.length; i++) {
            var subplotXa = subplots[i].xaxis,
                subplotYa = subplots[i].yaxis;

            if(xa.indexOf(subplotXa) === -1) {
                xa.push(subplotXa);
                xIDs.push(subplotXa._id);
            }

            if(ya.indexOf(subplotYa) === -1) {
                ya.push(subplotYa);
                yIDs.push(subplotYa._id);
            }
        }

        xActive = isDirectionActive(xa, ew);
        yActive = isDirectionActive(ya, ns);
        cursor = getDragCursor(yActive + xActive, fullLayout.dragmode);
        xs = xa0._offset;
        ys = ya0._offset;

        var links = calcLinks(constraintGroups, xIDs, yIDs);
        isSubplotConstrained = links.xy;

        // finally make the list of axis objects to link
        xaLinked = [];
        for(var xLinkID in links.x) { xaLinked.push(getFromId(gd, xLinkID)); }
        yaLinked = [];
        for(var yLinkID in links.y) { yaLinked.push(getFromId(gd, yLinkID)); }
    }

    recomputeAxisLists();

    var dragger = makeDragger(plotinfo, ns + ew + 'drag', cursor, x, y, w, h);

    // still need to make the element if the axes are disabled
    // but nuke its events (except for maindrag which needs them for hover)
    // and stop there
    if(!yActive && !xActive && !isSelectOrLasso(fullLayout.dragmode)) {
        dragger.onmousedown = null;
        dragger.style.pointerEvents = isMainDrag ? 'all' : 'none';
        return dragger;
    }

    var dragOptions = {
        element: dragger,
        gd: gd,
        plotinfo: plotinfo,
        prepFn: function(e, startX, startY) {
            var dragModeNow = gd._fullLayout.dragmode;

            if(isMainDrag) {
                // main dragger handles all drag modes, and changes
                // to pan (or to zoom if it already is pan) on shift
                if(e.shiftKey) {
                    if(dragModeNow === 'pan') dragModeNow = 'zoom';
                    else dragModeNow = 'pan';
                }
            }
            // all other draggers just pan
            else dragModeNow = 'pan';

            if(dragModeNow === 'lasso') dragOptions.minDrag = 1;
            else dragOptions.minDrag = undefined;

            if(dragModeNow === 'zoom') {
                dragOptions.moveFn = zoomMove;
                dragOptions.doneFn = zoomDone;

                // zoomMove takes care of the threshold, but we need to
                // minimize this so that constrained zoom boxes will flip
                // orientation at the right place
                dragOptions.minDrag = 1;

                zoomPrep(e, startX, startY);
            }
            else if(dragModeNow === 'pan') {
                dragOptions.moveFn = plotDrag;
                dragOptions.doneFn = dragDone;
                clearSelect(zoomlayer);
            }
            else if(isSelectOrLasso(dragModeNow)) {
                dragOptions.xaxes = xa;
                dragOptions.yaxes = ya;
                prepSelect(e, startX, startY, dragOptions, dragModeNow);
            }
        }
    };

    dragElement.init(dragOptions);

    var x0,
        y0,
        box,
        lum,
        path0,
        dimmed,
        zoomMode,
        zb,
        corners;

    // collected changes to be made to the plot by relayout at the end
    var updates = {};

    function zoomPrep(e, startX, startY) {
        var dragBBox = dragger.getBoundingClientRect();
        x0 = startX - dragBBox.left;
        y0 = startY - dragBBox.top;
        box = {l: x0, r: x0, w: 0, t: y0, b: y0, h: 0};
        lum = gd._hmpixcount ?
            (gd._hmlumcount / gd._hmpixcount) :
            tinycolor(gd._fullLayout.plot_bgcolor).getLuminance();
        path0 = 'M0,0H' + pw + 'V' + ph + 'H0V0';
        dimmed = false;
        zoomMode = 'xy';

        zb = makeZoombox(zoomlayer, lum, xs, ys, path0);

        corners = makeCorners(zoomlayer, xs, ys);

        clearSelect(zoomlayer);
    }

    function zoomMove(dx0, dy0) {
        if(gd._transitioningWithDuration) {
            return false;
        }

        var x1 = Math.max(0, Math.min(pw, dx0 + x0)),
            y1 = Math.max(0, Math.min(ph, dy0 + y0)),
            dx = Math.abs(x1 - x0),
            dy = Math.abs(y1 - y0);

        box.l = Math.min(x0, x1);
        box.r = Math.max(x0, x1);
        box.t = Math.min(y0, y1);
        box.b = Math.max(y0, y1);

        function noZoom() {
            zoomMode = '';
            box.r = box.l;
            box.t = box.b;
            corners.attr('d', 'M0,0Z');
        }

        if(isSubplotConstrained) {
            if(dx > MINZOOM || dy > MINZOOM) {
                zoomMode = 'xy';
                if(dx / pw > dy / ph) {
                    dy = dx * ph / pw;
                    if(y0 > y1) box.t = y0 - dy;
                    else box.b = y0 + dy;
                }
                else {
                    dx = dy * pw / ph;
                    if(x0 > x1) box.l = x0 - dx;
                    else box.r = x0 + dx;
                }
                corners.attr('d', xyCorners(box));
            }
            else {
                noZoom();
            }
        }
        // look for small drags in one direction or the other,
        // and only drag the other axis
        else if(!yActive || dy < Math.min(Math.max(dx * 0.6, MINDRAG), MINZOOM)) {
            if(dx < MINDRAG) {
                noZoom();
            }
            else {
                box.t = 0;
                box.b = ph;
                zoomMode = 'x';
                corners.attr('d', xCorners(box, y0));
            }
        }
        else if(!xActive || dx < Math.min(dy * 0.6, MINZOOM)) {
            box.l = 0;
            box.r = pw;
            zoomMode = 'y';
            corners.attr('d', yCorners(box, x0));
        }
        else {
            zoomMode = 'xy';
            corners.attr('d', xyCorners(box));
        }
        box.w = box.r - box.l;
        box.h = box.b - box.t;

        updateZoombox(zb, corners, box, path0, dimmed, lum);
        dimmed = true;
    }

    function zoomDone(dragged, numClicks) {
        if(Math.min(box.h, box.w) < MINDRAG * 2) {
            if(numClicks === 2) doubleClick();

            return removeZoombox(gd);
        }

        // TODO: edit linked axes in zoomAxRanges and in dragTail
        if(zoomMode === 'xy' || zoomMode === 'x') zoomAxRanges(xa, box.l / pw, box.r / pw, updates, xaLinked);
        if(zoomMode === 'xy' || zoomMode === 'y') zoomAxRanges(ya, (ph - box.b) / ph, (ph - box.t) / ph, updates, yaLinked);

        removeZoombox(gd);
        dragTail(zoomMode);

        if(SHOWZOOMOUTTIP && gd.data && gd._context.showTips) {
            Lib.notifier('Double-click to<br>zoom back out', 'long');
            SHOWZOOMOUTTIP = false;
        }
    }

    function dragDone(dragged, numClicks) {
        var singleEnd = (ns + ew).length === 1;
        if(dragged) dragTail();
        else if(numClicks === 2 && !singleEnd) doubleClick();
        else if(numClicks === 1 && singleEnd) {
            var ax = ns ? ya[0] : xa[0],
                end = (ns === 's' || ew === 'w') ? 0 : 1,
                attrStr = ax._name + '.range[' + end + ']',
                initialText = getEndText(ax, end),
                hAlign = 'left',
                vAlign = 'middle';

            if(ax.fixedrange) return;

            if(ns) {
                vAlign = (ns === 'n') ? 'top' : 'bottom';
                if(ax.side === 'right') hAlign = 'right';
            }
            else if(ew === 'e') hAlign = 'right';

            if(gd._context.showAxisRangeEntryBoxes) {
                d3.select(dragger)
                    .call(svgTextUtils.makeEditable, {
                        gd: gd,
                        immediate: true,
                        background: fullLayout.paper_bgcolor,
                        text: String(initialText),
                        fill: ax.tickfont ? ax.tickfont.color : '#444',
                        horizontalAlign: hAlign,
                        verticalAlign: vAlign
                    })
                    .on('edit', function(text) {
                        var v = ax.d2r(text);
                        if(v !== undefined) {
                            Plotly.relayout(gd, attrStr, v);
                        }
                    });
            }
        }
    }

    // scroll zoom, on all draggers except corners
    var scrollViewBox = [0, 0, pw, ph];
    // wait a little after scrolling before redrawing
    var redrawTimer = null;
    var REDRAWDELAY = constants.REDRAWDELAY;
    var mainplot = plotinfo.mainplot ?
            fullLayout._plots[plotinfo.mainplot] : plotinfo;

    function zoomWheel(e) {
        // deactivate mousewheel scrolling on embedded graphs
        // devs can override this with layout._enablescrollzoom,
        // but _ ensures this setting won't leave their page
        if(!gd._context.scrollZoom && !fullLayout._enablescrollzoom) {
            return;
        }

        // If a transition is in progress, then disable any behavior:
        if(gd._transitioningWithDuration) {
            return Lib.pauseEvent(e);
        }

        var pc = gd.querySelector('.plotly');

        recomputeAxisLists();

        // if the plot has scrollbars (more than a tiny excess)
        // disable scrollzoom too.
        if(pc.scrollHeight - pc.clientHeight > 10 ||
                pc.scrollWidth - pc.clientWidth > 10) {
            return;
        }

        clearTimeout(redrawTimer);

        var wheelDelta = -e.deltaY;
        if(!isFinite(wheelDelta)) wheelDelta = e.wheelDelta / 10;
        if(!isFinite(wheelDelta)) {
            Lib.log('Did not find wheel motion attributes: ', e);
            return;
        }

        var zoom = Math.exp(-Math.min(Math.max(wheelDelta, -20), 20) / 100),
            gbb = mainplot.draglayer.select('.nsewdrag')
                .node().getBoundingClientRect(),
            xfrac = (e.clientX - gbb.left) / gbb.width,
            yfrac = (gbb.bottom - e.clientY) / gbb.height,
            i;

        function zoomWheelOneAxis(ax, centerFraction, zoom) {
            if(ax.fixedrange) return;

            var axRange = Lib.simpleMap(ax.range, ax.r2l),
                v0 = axRange[0] + (axRange[1] - axRange[0]) * centerFraction;
            function doZoom(v) { return ax.l2r(v0 + (v - v0) * zoom); }
            ax.range = axRange.map(doZoom);
        }

        if(ew || isSubplotConstrained) {
            // if we're only zooming this axis because of constraints,
            // zoom it about the center
            if(!ew) xfrac = 0.5;

            for(i = 0; i < xa.length; i++) zoomWheelOneAxis(xa[i], xfrac, zoom);

            scrollViewBox[2] *= zoom;
            scrollViewBox[0] += scrollViewBox[2] * xfrac * (1 / zoom - 1);
        }
        if(ns || isSubplotConstrained) {
            if(!ns) yfrac = 0.5;

            for(i = 0; i < ya.length; i++) zoomWheelOneAxis(ya[i], yfrac, zoom);

            scrollViewBox[3] *= zoom;
            scrollViewBox[1] += scrollViewBox[3] * (1 - yfrac) * (1 / zoom - 1);
        }

        // viewbox redraw at first
        updateSubplots(scrollViewBox);
        ticksAndAnnotations(ns, ew);

        // then replot after a delay to make sure
        // no more scrolling is coming
        redrawTimer = setTimeout(function() {
            scrollViewBox = [0, 0, pw, ph];

            var zoomMode;
            if(isSubplotConstrained) zoomMode = 'xy';
            else zoomMode = (ew ? 'x' : '') + (ns ? 'y' : '');

            dragTail(zoomMode);
        }, REDRAWDELAY);

        return Lib.pauseEvent(e);
    }

    // everything but the corners gets wheel zoom
    if(ns.length * ew.length !== 1) {
        // still seems to be some confusion about onwheel vs onmousewheel...
        if(dragger.onwheel !== undefined) dragger.onwheel = zoomWheel;
        else if(dragger.onmousewheel !== undefined) dragger.onmousewheel = zoomWheel;
    }

    // plotDrag: move the plot in response to a drag
    function plotDrag(dx, dy) {
        // If a transition is in progress, then disable any behavior:
        if(gd._transitioningWithDuration) {
            return;
        }

        recomputeAxisLists();

        if(xActive === 'ew' || yActive === 'ns') {
            if(xActive) dragAxList(xa, dx);
            if(yActive) dragAxList(ya, dy);
            updateSubplots([xActive ? -dx : 0, yActive ? -dy : 0, pw, ph]);
            ticksAndAnnotations(yActive, xActive);
            return;
        }

        // dz: set a new value for one end (0 or 1) of an axis array axArray,
        // and return a pixel shift for that end for the viewbox
        // based on pixel drag distance d
        // TODO: this makes (generally non-fatal) errors when you get
        // near floating point limits
        function dz(axArray, end, d) {
            var otherEnd = 1 - end,
                movedAx,
                newLinearizedEnd;
            for(var i = 0; i < axArray.length; i++) {
                var axi = axArray[i];
                if(axi.fixedrange) continue;
                movedAx = axi;
                newLinearizedEnd = axi._rl[otherEnd] +
                    (axi._rl[end] - axi._rl[otherEnd]) / dZoom(d / axi._length);
                var newEnd = axi.l2r(newLinearizedEnd);

                // if l2r comes back false or undefined, it means we've dragged off
                // the end of valid ranges - so stop.
                if(newEnd !== false && newEnd !== undefined) axi.range[end] = newEnd;
            }
            return movedAx._length * (movedAx._rl[end] - newLinearizedEnd) /
                (movedAx._rl[end] - movedAx._rl[otherEnd]);
        }

        if(isSubplotConstrained && xActive && yActive) {
            // dragging a corner of a constrained subplot:
            // respect the fixed corner, but harmonize dx and dy
            var dxySign = ((xActive === 'w') === (yActive === 'n')) ? 1 : -1;
            var dxyFraction = (dx / pw + dxySign * dy / ph) / 2;
            dx = dxyFraction * pw;
            dy = dxySign * dxyFraction * ph;
        }

        if(xActive === 'w') dx = dz(xa, 0, dx);
        else if(xActive === 'e') dx = dz(xa, 1, -dx);
        else if(!xActive) dx = 0;

        if(yActive === 'n') dy = dz(ya, 1, dy);
        else if(yActive === 's') dy = dz(ya, 0, -dy);
        else if(!yActive) dy = 0;

        var x0 = (xActive === 'w') ? dx : 0;
        var y0 = (yActive === 'n') ? dy : 0;

        if(isSubplotConstrained) {
            var i;
            if(!xActive && yActive.length === 1) {
                // dragging one end of the y axis of a constrained subplot
                // scale the other axis the same about its middle
                for(i = 0; i < xa.length; i++) {
                    xa[i].range = xa[i]._r.slice();
                    scaleZoom(xa[i], 1 - dy / ph);
                }
                dx = dy * pw / ph;
                x0 = dx / 2;
            }
            if(!yActive && xActive.length === 1) {
                for(i = 0; i < ya.length; i++) {
                    ya[i].range = ya[i]._r.slice();
                    scaleZoom(ya[i], 1 - dx / pw);
                }
                dy = dx * ph / pw;
                y0 = dy / 2;
            }
        }

        updateSubplots([x0, y0, pw - dx, ph - dy]);
        ticksAndAnnotations(yActive, xActive);
    }

    // Draw ticks and annotations (and other components) when ranges change.
    // Also records the ranges that have changed for use by update at the end.
    function ticksAndAnnotations(ns, ew) {
        var activeAxIds = [],
            i;

        function pushActiveAxIds(axList) {
            for(i = 0; i < axList.length; i++) {
                if(!axList[i].fixedrange) activeAxIds.push(axList[i]._id);
            }
        }

        if(ew || isSubplotConstrained) {
            pushActiveAxIds(xa);
            pushActiveAxIds(xaLinked);
        }
        if(ns || isSubplotConstrained) {
            pushActiveAxIds(ya);
            pushActiveAxIds(yaLinked);
        }

        updates = {};
        for(i = 0; i < activeAxIds.length; i++) {
            var axId = activeAxIds[i];
            doTicks(gd, axId, true);
            var ax = getFromId(gd, axId);
            updates[ax._name + '.range[0]'] = ax.range[0];
            updates[ax._name + '.range[1]'] = ax.range[1];
        }

        function redrawObjs(objArray, method, shortCircuit) {
            for(i = 0; i < objArray.length; i++) {
                var obji = objArray[i];

                if((ew && activeAxIds.indexOf(obji.xref) !== -1) ||
                    (ns && activeAxIds.indexOf(obji.yref) !== -1)) {
                    method(gd, i);
                    // once is enough for images (which doesn't use the `i` arg anyway)
                    if(shortCircuit) return;
                }
            }
        }

        // annotations and shapes 'draw' method is slow,
        // use the finer-grained 'drawOne' method instead

        redrawObjs(fullLayout.annotations || [], Registry.getComponentMethod('annotations', 'drawOne'));
        redrawObjs(fullLayout.shapes || [], Registry.getComponentMethod('shapes', 'drawOne'));
        redrawObjs(fullLayout.images || [], Registry.getComponentMethod('images', 'draw'), true);
    }

    function doubleClick() {
        if(gd._transitioningWithDuration) return;

        var doubleClickConfig = gd._context.doubleClick,
            axList = (xActive ? xa : []).concat(yActive ? ya : []),
            attrs = {};

        var ax, i, rangeInitial;

        // For reset+autosize mode:
        // If *any* of the main axes is not at its initial range
        // (or autoranged, if we have no initial range, to match the logic in
        // doubleClickConfig === 'reset' below), we reset.
        // If they are *all* at their initial ranges, then we autosize.
        if(doubleClickConfig === 'reset+autosize') {

            doubleClickConfig = 'autosize';

            for(i = 0; i < axList.length; i++) {
                ax = axList[i];
                if((ax._rangeInitial && (
                        ax.range[0] !== ax._rangeInitial[0] ||
                        ax.range[1] !== ax._rangeInitial[1]
                    )) ||
                    (!ax._rangeInitial && !ax.autorange)
                ) {
                    doubleClickConfig = 'reset';
                    break;
                }
            }
        }

        if(doubleClickConfig === 'autosize') {
            // don't set the linked axes here, so relayout marks them as shrinkable
            // and we autosize just to the requested axis/axes
            for(i = 0; i < axList.length; i++) {
                ax = axList[i];
                if(!ax.fixedrange) attrs[ax._name + '.autorange'] = true;
            }
        }
        else if(doubleClickConfig === 'reset') {
            // when we're resetting, reset all linked axes too, so we get back
            // to the fully-auto-with-constraints situation
            if(xActive || isSubplotConstrained) axList = axList.concat(xaLinked);
            if(yActive && !isSubplotConstrained) axList = axList.concat(yaLinked);

            if(isSubplotConstrained) {
                if(!xActive) axList = axList.concat(xa);
                else if(!yActive) axList = axList.concat(ya);
            }

            for(i = 0; i < axList.length; i++) {
                ax = axList[i];

                if(!ax._rangeInitial) {
                    attrs[ax._name + '.autorange'] = true;
                }
                else {
                    rangeInitial = ax._rangeInitial;
                    attrs[ax._name + '.range[0]'] = rangeInitial[0];
                    attrs[ax._name + '.range[1]'] = rangeInitial[1];
                }
            }
        }

        gd.emit('plotly_doubleclick', null);
        Plotly.relayout(gd, attrs);
    }

    // dragTail - finish a drag event with a redraw
    function dragTail(zoommode) {
        if(zoommode === undefined) zoommode = (ew ? 'x' : '') + (ns ? 'y' : '');

        // put the subplot viewboxes back to default (Because we're going to)
        // be repositioning the data in the relayout. But DON'T call
        // ticksAndAnnotations again - it's unnecessary and would overwrite `updates`
        updateSubplots([0, 0, pw, ph]);

        // since we may have been redrawing some things during the drag, we may have
        // accumulated MathJax promises - wait for them before we relayout.
        Lib.syncOrAsync([
            Plots.previousPromises,
            function() { Plotly.relayout(gd, updates); }
        ], gd);
    }

    // updateSubplots - find all plot viewboxes that should be
    // affected by this drag, and update them. look for all plots
    // sharing an affected axis (including the one being dragged)
    function updateSubplots(viewBox) {
        var plotinfos = fullLayout._plots;
        var subplots = Object.keys(plotinfos);
        var xScaleFactor = viewBox[2] / xa[0]._length;
        var yScaleFactor = viewBox[3] / ya[0]._length;
        var editX = ew || isSubplotConstrained;
        var editY = ns || isSubplotConstrained;

        var i, xScaleFactor2, yScaleFactor2, clipDx, clipDy;

        // Find the appropriate scaling for this axis, if it's linked to the
        // dragged axes by constraints. 0 is special, it means this axis shouldn't
        // ever be scaled (will be converted to 1 if the other axis is scaled)
        function getLinkedScaleFactor(ax) {
            if(ax.fixedrange) return 0;

            if(editX && xaLinked.indexOf(ax) !== -1) {
                return xScaleFactor;
            }
            if(editY && (isSubplotConstrained ? xaLinked : yaLinked).indexOf(ax) !== -1) {
                return yScaleFactor;
            }
            return 0;
        }

        function scaleAndGetShift(ax, scaleFactor) {
            if(scaleFactor) {
                ax.range = ax._r.slice();
                scaleZoom(ax, scaleFactor);
                return getShift(ax, scaleFactor);
            }
            return 0;
        }

        function getShift(ax, scaleFactor) {
            return ax._length * (1 - scaleFactor) * FROM_TL[ax.constraintoward || 'middle'];
        }

        for(i = 0; i < subplots.length; i++) {

            var subplot = plotinfos[subplots[i]],
                xa2 = subplot.xaxis,
                ya2 = subplot.yaxis,
                editX2 = editX && !xa2.fixedrange && (xa.indexOf(xa2) !== -1),
                editY2 = editY && !ya2.fixedrange && (ya.indexOf(ya2) !== -1);

            if(editX2) {
                xScaleFactor2 = xScaleFactor;
                clipDx = ew ? viewBox[0] : getShift(xa2, xScaleFactor2);
            }
            else {
                xScaleFactor2 = getLinkedScaleFactor(xa2);
                clipDx = scaleAndGetShift(xa2, xScaleFactor2);
            }

            if(editY2) {
                yScaleFactor2 = yScaleFactor;
                clipDy = ns ? viewBox[1] : getShift(ya2, yScaleFactor2);
            }
            else {
                yScaleFactor2 = getLinkedScaleFactor(ya2);
                clipDy = scaleAndGetShift(ya2, yScaleFactor2);
            }

            // don't scale at all if neither axis is scalable here
            if(!xScaleFactor2 && !yScaleFactor2) continue;

            // but if only one is, reset the other axis scaling
            if(!xScaleFactor2) xScaleFactor2 = 1;
            if(!yScaleFactor2) yScaleFactor2 = 1;

            var plotDx = xa2._offset - clipDx / xScaleFactor2,
                plotDy = ya2._offset - clipDy / yScaleFactor2;

            fullLayout._defs.select('#' + subplot.clipId + '> rect')
                .call(Drawing.setTranslate, clipDx, clipDy)
                .call(Drawing.setScale, xScaleFactor2, yScaleFactor2);

            var scatterPoints = subplot.plot.selectAll('.scatterlayer .points, .boxlayer .points');

            subplot.plot
                .call(Drawing.setTranslate, plotDx, plotDy)
                .call(Drawing.setScale, 1 / xScaleFactor2, 1 / yScaleFactor2);

            // This is specifically directed at scatter traces, applying an inverse
            // scale to individual points to counteract the scale of the trace
            // as a whole:
            scatterPoints.selectAll('.point')
                .call(Drawing.setPointGroupScale, xScaleFactor2, yScaleFactor2)
                .call(Drawing.hideOutsideRangePoints, subplot);

            scatterPoints.selectAll('.textpoint')
                .call(Drawing.setTextPointsScale, xScaleFactor2, yScaleFactor2)
                .call(Drawing.hideOutsideRangePoints, subplot);
        }
    }

    return dragger;
};

function makeDragger(plotinfo, dragClass, cursor, x, y, w, h) {
    var dragger3 = plotinfo.draglayer.selectAll('.' + dragClass).data([0]);

    dragger3.enter().append('rect')
        .classed('drag', true)
        .classed(dragClass, true)
        .style({fill: 'transparent', 'stroke-width': 0})
        .attr('data-subplot', plotinfo.id);

    dragger3.call(Drawing.setRect, x, y, w, h)
        .call(setCursor, cursor);

    return dragger3.node();
}

function isDirectionActive(axList, activeVal) {
    for(var i = 0; i < axList.length; i++) {
        if(!axList[i].fixedrange) return activeVal;
    }
    return '';
}

function getEndText(ax, end) {
    var initialVal = ax.range[end],
        diff = Math.abs(initialVal - ax.range[1 - end]),
        dig;

    // TODO: this should basically be ax.r2d but we're doing extra
    // rounding here... can we clean up at all?
    if(ax.type === 'date') {
        return initialVal;
    }
    else if(ax.type === 'log') {
        dig = Math.ceil(Math.max(0, -Math.log(diff) / Math.LN10)) + 3;
        return d3.format('.' + dig + 'g')(Math.pow(10, initialVal));
    }
    else { // linear numeric (or category... but just show numbers here)
        dig = Math.floor(Math.log(Math.abs(initialVal)) / Math.LN10) -
            Math.floor(Math.log(diff) / Math.LN10) + 4;
        return d3.format('.' + String(dig) + 'g')(initialVal);
    }
}

function zoomAxRanges(axList, r0Fraction, r1Fraction, updates, linkedAxes) {
    var i,
        axi,
        axRangeLinear0,
        axRangeLinearSpan;

    for(i = 0; i < axList.length; i++) {
        axi = axList[i];
        if(axi.fixedrange) continue;

        axRangeLinear0 = axi._rl[0];
        axRangeLinearSpan = axi._rl[1] - axRangeLinear0;
        axi.range = [
            axi.l2r(axRangeLinear0 + axRangeLinearSpan * r0Fraction),
            axi.l2r(axRangeLinear0 + axRangeLinearSpan * r1Fraction)
        ];
        updates[axi._name + '.range[0]'] = axi.range[0];
        updates[axi._name + '.range[1]'] = axi.range[1];
    }

    // zoom linked axes about their centers
    if(linkedAxes && linkedAxes.length) {
        var linkedR0Fraction = (r0Fraction + (1 - r1Fraction)) / 2;

        zoomAxRanges(linkedAxes, linkedR0Fraction, 1 - linkedR0Fraction, updates);
    }
}

function dragAxList(axList, pix) {
    for(var i = 0; i < axList.length; i++) {
        var axi = axList[i];
        if(!axi.fixedrange) {
            axi.range = [
                axi.l2r(axi._rl[0] - pix / axi._m),
                axi.l2r(axi._rl[1] - pix / axi._m)
            ];
        }
    }
}

// common transform for dragging one end of an axis
// d>0 is compressing scale (cursor is over the plot,
//  the axis end should move with the cursor)
// d<0 is expanding (cursor is off the plot, axis end moves
//  nonlinearly so you can expand far)
function dZoom(d) {
    return 1 - ((d >= 0) ? Math.min(d, 0.9) :
        1 / (1 / Math.max(d, -0.3) + 3.222));
}

function getDragCursor(nsew, dragmode) {
    if(!nsew) return 'pointer';
    if(nsew === 'nsew') {
        if(dragmode === 'pan') return 'move';
        return 'crosshair';
    }
    return nsew.toLowerCase() + '-resize';
}

function makeZoombox(zoomlayer, lum, xs, ys, path0) {
    return zoomlayer.append('path')
        .attr('class', 'zoombox')
        .style({
            'fill': lum > 0.2 ? 'rgba(0,0,0,0)' : 'rgba(255,255,255,0)',
            'stroke-width': 0
        })
        .attr('transform', 'translate(' + xs + ', ' + ys + ')')
        .attr('d', path0 + 'Z');
}

function makeCorners(zoomlayer, xs, ys) {
    return zoomlayer.append('path')
        .attr('class', 'zoombox-corners')
        .style({
            fill: Color.background,
            stroke: Color.defaultLine,
            'stroke-width': 1,
            opacity: 0
        })
        .attr('transform', 'translate(' + xs + ', ' + ys + ')')
        .attr('d', 'M0,0Z');
}

function clearSelect(zoomlayer) {
    // until we get around to persistent selections, remove the outline
    // here. The selection itself will be removed when the plot redraws
    // at the end.
    zoomlayer.selectAll('.select-outline').remove();
}

function updateZoombox(zb, corners, box, path0, dimmed, lum) {
    zb.attr('d',
        path0 + 'M' + (box.l) + ',' + (box.t) + 'v' + (box.h) +
        'h' + (box.w) + 'v-' + (box.h) + 'h-' + (box.w) + 'Z');
    if(!dimmed) {
        zb.transition()
            .style('fill', lum > 0.2 ? 'rgba(0,0,0,0.4)' :
                'rgba(255,255,255,0.3)')
            .duration(200);
        corners.transition()
            .style('opacity', 1)
            .duration(200);
    }
}

function removeZoombox(gd) {
    d3.select(gd)
        .selectAll('.zoombox,.js-zoombox-backdrop,.js-zoombox-menu,.zoombox-corners')
        .remove();
}

function isSelectOrLasso(dragmode) {
    var modes = ['lasso', 'select'];

    return modes.indexOf(dragmode) !== -1;
}

function xCorners(box, y0) {
    return 'M' +
        (box.l - 0.5) + ',' + (y0 - MINZOOM - 0.5) +
        'h-3v' + (2 * MINZOOM + 1) + 'h3ZM' +
        (box.r + 0.5) + ',' + (y0 - MINZOOM - 0.5) +
        'h3v' + (2 * MINZOOM + 1) + 'h-3Z';
}

function yCorners(box, x0) {
    return 'M' +
        (x0 - MINZOOM - 0.5) + ',' + (box.t - 0.5) +
        'v-3h' + (2 * MINZOOM + 1) + 'v3ZM' +
        (x0 - MINZOOM - 0.5) + ',' + (box.b + 0.5) +
        'v3h' + (2 * MINZOOM + 1) + 'v-3Z';
}

function xyCorners(box) {
    var clen = Math.floor(Math.min(box.b - box.t, box.r - box.l, MINZOOM) / 2);
    return 'M' +
        (box.l - 3.5) + ',' + (box.t - 0.5 + clen) + 'h3v' + (-clen) +
            'h' + clen + 'v-3h-' + (clen + 3) + 'ZM' +
        (box.r + 3.5) + ',' + (box.t - 0.5 + clen) + 'h-3v' + (-clen) +
            'h' + (-clen) + 'v-3h' + (clen + 3) + 'ZM' +
        (box.r + 3.5) + ',' + (box.b + 0.5 - clen) + 'h-3v' + clen +
            'h' + (-clen) + 'v3h' + (clen + 3) + 'ZM' +
        (box.l - 3.5) + ',' + (box.b + 0.5 - clen) + 'h3v' + clen +
            'h' + clen + 'v3h-' + (clen + 3) + 'Z';
}

function calcLinks(constraintGroups, xIDs, yIDs) {
    var isSubplotConstrained = false;
    var xLinks = {};
    var yLinks = {};
    var i, j, k;

    var group, xLinkID, yLinkID;
    for(i = 0; i < constraintGroups.length; i++) {
        group = constraintGroups[i];
        // check if any of the x axes we're dragging is in this constraint group
        for(j = 0; j < xIDs.length; j++) {
            if(group[xIDs[j]]) {
                // put the rest of these axes into xLinks, if we're not already
                // dragging them, so we know to scale these axes automatically too
                // to match the changes in the dragged x axes
                for(xLinkID in group) {
                    if((xLinkID.charAt(0) === 'x' ? xIDs : yIDs).indexOf(xLinkID) === -1) {
                        xLinks[xLinkID] = 1;
                    }
                }

                // check if the x and y axes of THIS drag are linked
                for(k = 0; k < yIDs.length; k++) {
                    if(group[yIDs[k]]) isSubplotConstrained = true;
                }
            }
        }

        // now check if any of the y axes we're dragging is in this constraint group
        // only look for outside links, as we've already checked for links within the dragger
        for(j = 0; j < yIDs.length; j++) {
            if(group[yIDs[j]]) {
                for(yLinkID in group) {
                    if((yLinkID.charAt(0) === 'x' ? xIDs : yIDs).indexOf(yLinkID) === -1) {
                        yLinks[yLinkID] = 1;
                    }
                }
            }
        }
    }

    if(isSubplotConstrained) {
        // merge xLinks and yLinks if the subplot is constrained,
        // since we'll always apply both anyway and the two will contain
        // duplicates
        Lib.extendFlat(xLinks, yLinks);
        yLinks = {};
    }
    return {
        x: xLinks,
        y: yLinks,
        xy: isSubplotConstrained
    };
}
