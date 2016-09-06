/**
* Copyright 2012-2016, Plotly, Inc.
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

var Axes = require('./axes');
var prepSelect = require('./select');
var constants = require('./constants');


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
        // if we're dragging two axes at once, also drag overlays
        subplots = [plotinfo].concat((ns && ew) ? plotinfo.overlays : []),
        xa = [plotinfo.x()],
        ya = [plotinfo.y()],
        pw = xa[0]._length,
        ph = ya[0]._length,
        MINDRAG = constants.MINDRAG,
        MINZOOM = constants.MINZOOM,
        isMainDrag = (ns + ew === 'nsew');

    for(var i = 1; i < subplots.length; i++) {
        var subplotXa = subplots[i].x(),
            subplotYa = subplots[i].y();
        if(xa.indexOf(subplotXa) === -1) xa.push(subplotXa);
        if(ya.indexOf(subplotYa) === -1) ya.push(subplotYa);
    }

    function isDirectionActive(axList, activeVal) {
        for(var i = 0; i < axList.length; i++) {
            if(!axList[i].fixedrange) return activeVal;
        }
        return '';
    }

    var allaxes = xa.concat(ya),
        xActive = isDirectionActive(xa, ew),
        yActive = isDirectionActive(ya, ns),
        cursor = getDragCursor(yActive + xActive, fullLayout.dragmode),
        dragClass = ns + ew + 'drag';

    var dragger3 = plotinfo.draglayer.selectAll('.' + dragClass).data([0]);

    dragger3.enter().append('rect')
        .classed('drag', true)
        .classed(dragClass, true)
        .style({fill: 'transparent', 'stroke-width': 0})
        .attr('data-subplot', plotinfo.id);

    dragger3.call(Drawing.setRect, x, y, w, h)
        .call(setCursor, cursor);

    var dragger = dragger3.node();

    // still need to make the element if the axes are disabled
    // but nuke its events (except for maindrag which needs them for hover)
    // and stop there
    if(!yActive && !xActive && !isSelectOrLasso(fullLayout.dragmode)) {
        dragger.onmousedown = null;
        dragger.style.pointerEvents = isMainDrag ? 'all' : 'none';
        return dragger;
    }

    function forceNumbers(axRange) {
        axRange[0] = Number(axRange[0]);
        axRange[1] = Number(axRange[1]);
    }

    var dragOptions = {
        element: dragger,
        gd: gd,
        plotinfo: plotinfo,
        xaxes: xa,
        yaxes: ya,
        doubleclick: doubleClick,
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
                zoomPrep(e, startX, startY);
            }
            else if(dragModeNow === 'pan') {
                dragOptions.moveFn = plotDrag;
                dragOptions.doneFn = dragDone;
                clearSelect();
            }
            else if(isSelectOrLasso(dragModeNow)) {
                prepSelect(e, startX, startY, dragOptions, dragModeNow);
            }
        }
    };

    dragElement.init(dragOptions);

    var zoomlayer = gd._fullLayout._zoomlayer,
        xs = plotinfo.x()._offset,
        ys = plotinfo.y()._offset,
        x0,
        y0,
        box,
        lum,
        path0,
        dimmed,
        zoomMode,
        zb,
        corners;

    function recomputeAxisLists() {
        xa = [plotinfo.x()];
        ya = [plotinfo.y()];
        pw = xa[0]._length;
        ph = ya[0]._length;

        for(var i = 1; i < subplots.length; i++) {
            var subplotXa = subplots[i].x(),
                subplotYa = subplots[i].y();
            if(xa.indexOf(subplotXa) === -1) xa.push(subplotXa);
            if(ya.indexOf(subplotYa) === -1) ya.push(subplotYa);
        }
        allaxes = xa.concat(ya);
        xActive = isDirectionActive(xa, ew);
        yActive = isDirectionActive(ya, ns);
        cursor = getDragCursor(yActive + xActive, fullLayout.dragmode);
        xs = plotinfo.x()._offset;
        ys = plotinfo.y()._offset;
        dragOptions.xa = xa;
        dragOptions.ya = ya;
    }

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

        zb = zoomlayer.append('path')
            .attr('class', 'zoombox')
            .style({
                'fill': lum > 0.2 ? 'rgba(0,0,0,0)' : 'rgba(255,255,255,0)',
                'stroke-width': 0
            })
            .attr('transform', 'translate(' + xs + ', ' + ys + ')')
            .attr('d', path0 + 'Z');

        corners = zoomlayer.append('path')
            .attr('class', 'zoombox-corners')
            .style({
                fill: Color.background,
                stroke: Color.defaultLine,
                'stroke-width': 1,
                opacity: 0
            })
            .attr('transform', 'translate(' + xs + ', ' + ys + ')')
            .attr('d', 'M0,0Z');

        clearSelect();
        for(var i = 0; i < allaxes.length; i++) forceNumbers(allaxes[i].range);
    }

    function clearSelect() {
        // until we get around to persistent selections, remove the outline
        // here. The selection itself will be removed when the plot redraws
        // at the end.
        zoomlayer.selectAll('.select-outline').remove();
    }

    function zoomMove(dx0, dy0) {
        if(gd._transitioningWithDuration) {
            return false;
        }

        var x1 = Math.max(0, Math.min(pw, dx0 + x0)),
            y1 = Math.max(0, Math.min(ph, dy0 + y0)),
            dx = Math.abs(x1 - x0),
            dy = Math.abs(y1 - y0),
            clen = Math.floor(Math.min(dy, dx, MINZOOM) / 2);

        box.l = Math.min(x0, x1);
        box.r = Math.max(x0, x1);
        box.t = Math.min(y0, y1);
        box.b = Math.max(y0, y1);

        // look for small drags in one direction or the other,
        // and only drag the other axis
        if(!yActive || dy < Math.min(Math.max(dx * 0.6, MINDRAG), MINZOOM)) {
            if(dx < MINDRAG) {
                zoomMode = '';
                box.r = box.l;
                box.t = box.b;
                corners.attr('d', 'M0,0Z');
            }
            else {
                box.t = 0;
                box.b = ph;
                zoomMode = 'x';
                corners.attr('d',
                    'M' + (box.l - 0.5) + ',' + (y0 - MINZOOM - 0.5) +
                    'h-3v' + (2 * MINZOOM + 1) + 'h3ZM' +
                    (box.r + 0.5) + ',' + (y0 - MINZOOM - 0.5) +
                    'h3v' + (2 * MINZOOM + 1) + 'h-3Z');
            }
        }
        else if(!xActive || dx < Math.min(dy * 0.6, MINZOOM)) {
            box.l = 0;
            box.r = pw;
            zoomMode = 'y';
            corners.attr('d',
                'M' + (x0 - MINZOOM - 0.5) + ',' + (box.t - 0.5) +
                'v-3h' + (2 * MINZOOM + 1) + 'v3ZM' +
                (x0 - MINZOOM - 0.5) + ',' + (box.b + 0.5) +
                'v3h' + (2 * MINZOOM + 1) + 'v-3Z');
        }
        else {
            zoomMode = 'xy';
            corners.attr('d',
                'M' + (box.l - 3.5) + ',' + (box.t - 0.5 + clen) + 'h3v' + (-clen) +
                        'h' + clen + 'v-3h-' + (clen + 3) + 'ZM' +
                    (box.r + 3.5) + ',' + (box.t - 0.5 + clen) + 'h-3v' + (-clen) +
                        'h' + (-clen) + 'v-3h' + (clen + 3) + 'ZM' +
                    (box.r + 3.5) + ',' + (box.b + 0.5 - clen) + 'h-3v' + clen +
                        'h' + (-clen) + 'v3h' + (clen + 3) + 'ZM' +
                    (box.l - 3.5) + ',' + (box.b + 0.5 - clen) + 'h3v' + clen +
                        'h' + clen + 'v3h-' + (clen + 3) + 'Z');
        }
        box.w = box.r - box.l;
        box.h = box.b - box.t;

        // Not sure about the addition of window.scrollX/Y...
        // seems to work but doesn't seem robust.
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
            dimmed = true;
        }
    }

    function zoomAxRanges(axList, r0Fraction, r1Fraction) {
        var i,
            axi,
            axRange;

        for(i = 0; i < axList.length; i++) {
            axi = axList[i];
            if(axi.fixedrange) continue;

            axRange = axi.range;
            axi.range = [
                axRange[0] + (axRange[1] - axRange[0]) * r0Fraction,
                axRange[0] + (axRange[1] - axRange[0]) * r1Fraction
            ];
        }
    }

    function zoomDone(dragged, numClicks) {
        if(Math.min(box.h, box.w) < MINDRAG * 2) {
            if(numClicks === 2) doubleClick();

            return removeZoombox(gd);
        }

        if(zoomMode === 'xy' || zoomMode === 'x') zoomAxRanges(xa, box.l / pw, box.r / pw);
        if(zoomMode === 'xy' || zoomMode === 'y') zoomAxRanges(ya, (ph - box.b) / ph, (ph - box.t) / ph);

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

            dragger3
                .call(svgTextUtils.makeEditable, null, {
                    immediate: true,
                    background: fullLayout.paper_bgcolor,
                    text: String(initialText),
                    fill: ax.tickfont ? ax.tickfont.color : '#444',
                    horizontalAlign: hAlign,
                    verticalAlign: vAlign
                })
                .on('edit', function(text) {
                    var v = ax.type === 'category' ? ax.c2l(text) : ax.d2l(text);
                    if(v !== undefined) {
                        Plotly.relayout(gd, attrStr, v);
                    }
                });
        }
    }

    // scroll zoom, on all draggers except corners
    var scrollViewBox = [0, 0, pw, ph],
        // wait a little after scrolling before redrawing
        redrawTimer = null,
        REDRAWDELAY = constants.REDRAWDELAY,
        mainplot = plotinfo.mainplot ?
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
            vbx0 = scrollViewBox[0] + scrollViewBox[2] * xfrac,
            yfrac = (gbb.bottom - e.clientY) / gbb.height,
            vby0 = scrollViewBox[1] + scrollViewBox[3] * (1 - yfrac),
            i;

        function zoomWheelOneAxis(ax, centerFraction, zoom) {
            if(ax.fixedrange) return;
            forceNumbers(ax.range);
            var axRange = ax.range,
                v0 = axRange[0] + (axRange[1] - axRange[0]) * centerFraction;
            ax.range = [v0 + (axRange[0] - v0) * zoom, v0 + (axRange[1] - v0) * zoom];
        }

        if(ew) {
            for(i = 0; i < xa.length; i++) zoomWheelOneAxis(xa[i], xfrac, zoom);
            scrollViewBox[2] *= zoom;
            scrollViewBox[0] = vbx0 - scrollViewBox[2] * xfrac;
        }
        if(ns) {
            for(i = 0; i < ya.length; i++) zoomWheelOneAxis(ya[i], yfrac, zoom);
            scrollViewBox[3] *= zoom;
            scrollViewBox[1] = vby0 - scrollViewBox[3] * (1 - yfrac);
        }

        // viewbox redraw at first
        updateSubplots(scrollViewBox);
        ticksAndAnnotations(ns, ew);

        // then replot after a delay to make sure
        // no more scrolling is coming
        redrawTimer = setTimeout(function() {
            scrollViewBox = [0, 0, pw, ph];
            dragTail();
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

        function dragAxList(axList, pix) {
            for(var i = 0; i < axList.length; i++) {
                var axi = axList[i];
                if(!axi.fixedrange) {
                    axi.range = [axi._r[0] - pix / axi._m, axi._r[1] - pix / axi._m];
                }
            }
        }

        if(xActive === 'ew' || yActive === 'ns') {
            if(xActive) dragAxList(xa, dx);
            if(yActive) dragAxList(ya, dy);
            updateSubplots([xActive ? -dx : 0, yActive ? -dy : 0, pw, ph]);
            ticksAndAnnotations(yActive, xActive);
            return;
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

        // dz: set a new value for one end (0 or 1) of an axis array ax,
        // and return a pixel shift for that end for the viewbox
        // based on pixel drag distance d
        // TODO: this makes (generally non-fatal) errors when you get
        // near floating point limits
        function dz(ax, end, d) {
            var otherEnd = 1 - end,
                movedi = 0;
            for(var i = 0; i < ax.length; i++) {
                var axi = ax[i];
                if(axi.fixedrange) continue;
                movedi = i;
                axi.range[end] = axi._r[otherEnd] +
                    (axi._r[end] - axi._r[otherEnd]) / dZoom(d / axi._length);
            }
            return ax[movedi]._length * (ax[movedi]._r[end] - ax[movedi].range[end]) /
                (ax[movedi]._r[end] - ax[movedi]._r[otherEnd]);
        }

        if(xActive === 'w') dx = dz(xa, 0, dx);
        else if(xActive === 'e') dx = dz(xa, 1, -dx);
        else if(!xActive) dx = 0;

        if(yActive === 'n') dy = dz(ya, 1, dy);
        else if(yActive === 's') dy = dz(ya, 0, -dy);
        else if(!yActive) dy = 0;

        updateSubplots([
            (xActive === 'w') ? dx : 0,
            (yActive === 'n') ? dy : 0,
            pw - dx,
            ph - dy
        ]);
        ticksAndAnnotations(yActive, xActive);
    }

    function ticksAndAnnotations(ns, ew) {
        var activeAxIds = [],
            i;

        function pushActiveAxIds(axList) {
            for(i = 0; i < axList.length; i++) {
                if(!axList[i].fixedrange) activeAxIds.push(axList[i]._id);
            }
        }

        if(ew) pushActiveAxIds(xa);
        if(ns) pushActiveAxIds(ya);

        for(i = 0; i < activeAxIds.length; i++) {
            Axes.doTicks(gd, activeAxIds[i], true);
        }

        function redrawObjs(objArray, method) {
            for(i = 0; i < objArray.length; i++) {
                var obji = objArray[i];

                if((ew && activeAxIds.indexOf(obji.xref) !== -1) ||
                    (ns && activeAxIds.indexOf(obji.yref) !== -1)) {
                    method(gd, i);
                }
            }
        }

        // annotations and shapes 'draw' method is slow,
        // use the finer-grained 'drawOne' method instead

        redrawObjs(fullLayout.annotations || [], Registry.getComponentMethod('annotations', 'drawOne'));
        redrawObjs(fullLayout.shapes || [], Registry.getComponentMethod('shapes', 'drawOne'));
        redrawObjs(fullLayout.images || [], Registry.getComponentMethod('images', 'draw'));
    }

    function doubleClick() {
        if(gd._transitioningWithDuration) return;

        var doubleClickConfig = gd._context.doubleClick,
            axList = (xActive ? xa : []).concat(yActive ? ya : []),
            attrs = {};

        var ax, i, rangeInitial;

        if(doubleClickConfig === 'autosize') {
            for(i = 0; i < axList.length; i++) {
                ax = axList[i];
                if(!ax.fixedrange) attrs[ax._name + '.autorange'] = true;
            }
        }
        else if(doubleClickConfig === 'reset') {
            for(i = 0; i < axList.length; i++) {
                ax = axList[i];

                if(!ax._rangeInitial) {
                    attrs[ax._name + '.autorange'] = true;
                }
                else {
                    rangeInitial = ax._rangeInitial.slice();
                    attrs[ax._name + '.range[0]'] = rangeInitial[0];
                    attrs[ax._name + '.range[1]'] = rangeInitial[1];
                }
            }
        }
        else if(doubleClickConfig === 'reset+autosize') {
            for(i = 0; i < axList.length; i++) {
                ax = axList[i];

                if(ax.fixedrange) continue;
                if(ax._rangeInitial === undefined ||
                    ax.range[0] === ax._rangeInitial[0] &&
                    ax.range[1] === ax._rangeInitial[1]
                ) {
                    attrs[ax._name + '.autorange'] = true;
                }
                else {
                    rangeInitial = ax._rangeInitial.slice();
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
        var attrs = {};
        // revert to the previous axis settings, then apply the new ones
        // through relayout - this lets relayout manage undo/redo
        for(var i = 0; i < allaxes.length; i++) {
            var axi = allaxes[i];
            if(zoommode && zoommode.indexOf(axi._id.charAt(0)) === -1) {
                continue;
            }
            if(axi._r[0] !== axi.range[0]) attrs[axi._name + '.range[0]'] = axi.range[0];
            if(axi._r[1] !== axi.range[1]) attrs[axi._name + '.range[1]'] = axi.range[1];

            axi.range = axi._r.slice();
        }

        updateSubplots([0, 0, pw, ph]);
        Plotly.relayout(gd, attrs);
    }

    // updateSubplots - find all plot viewboxes that should be
    // affected by this drag, and update them. look for all plots
    // sharing an affected axis (including the one being dragged)
    function updateSubplots(viewBox) {
        var j;
        var plotinfos = fullLayout._plots,
            subplots = Object.keys(plotinfos);

        for(var i = 0; i < subplots.length; i++) {

            var subplot = plotinfos[subplots[i]],
                xa2 = subplot.x(),
                ya2 = subplot.y(),
                editX = ew && !xa2.fixedrange,
                editY = ns && !ya2.fixedrange;

            if(editX) {
                var isInX = false;
                for(j = 0; j < xa.length; j++) {
                    if(xa[j]._id === xa2._id) {
                        isInX = true;
                        break;
                    }
                }
                editX = editX && isInX;
            }

            if(editY) {
                var isInY = false;
                for(j = 0; j < ya.length; j++) {
                    if(ya[j]._id === ya2._id) {
                        isInY = true;
                        break;
                    }
                }
                editY = editY && isInY;
            }

            var xScaleFactor = editX ? xa2._length / viewBox[2] : 1,
                yScaleFactor = editY ? ya2._length / viewBox[3] : 1;

            var clipDx = editX ? viewBox[0] : 0,
                clipDy = editY ? viewBox[1] : 0;

            var fracDx = editX ? (viewBox[0] / viewBox[2] * xa2._length) : 0,
                fracDy = editY ? (viewBox[1] / viewBox[3] * ya2._length) : 0;

            var plotDx = xa2._offset - fracDx,
                plotDy = ya2._offset - fracDy;


            fullLayout._defs.selectAll('#' + subplot.clipId)
                .call(Lib.setTranslate, clipDx, clipDy)
                .call(Lib.setScale, 1 / xScaleFactor, 1 / yScaleFactor);

            subplot.plot
                .call(Lib.setTranslate, plotDx, plotDy)
                .call(Lib.setScale, xScaleFactor, yScaleFactor)

                // This is specifically directed at scatter traces, applying an inverse
                // scale to individual points to counteract the scale of the trace
                // as a whole:
                .selectAll('.points').selectAll('.point')
                    .call(Lib.setPointGroupScale, 1 / xScaleFactor, 1 / yScaleFactor);
        }
    }

    return dragger;
};

function getEndText(ax, end) {
    var initialVal = ax.range[end],
        diff = Math.abs(initialVal - ax.range[1 - end]),
        dig;

    if(ax.type === 'date') {
        return Lib.ms2DateTime(initialVal, diff);
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

function getDragCursor(nsew, dragmode) {
    if(!nsew) return 'pointer';
    if(nsew === 'nsew') {
        if(dragmode === 'pan') return 'move';
        return 'crosshair';
    }
    return nsew.toLowerCase() + '-resize';
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
