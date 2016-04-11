/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Plotly = require('../../plotly');
var Lib = require('../../lib');

var constants = require('../../plots/cartesian/constants');


var dragElement = module.exports = {};

dragElement.align = require('./align');
dragElement.getCursor = require('./cursor');

var unhover = require('./unhover');
dragElement.unhover = unhover.wrapped;
dragElement.unhoverRaw = unhover.raw;

/**
 * Abstracts click & drag interactions
 * @param {object} options with keys:
 *      element (required) the DOM element to drag
 *      prepFn (optional) function(event, startX, startY)
 *          executed on mousedown
 *          startX and startY are the clientX and clientY pixel position
 *          of the mousedown event
 *      moveFn (optional) function(dx, dy, dragged)
 *          executed on move
 *          dx and dy are the net pixel offset of the drag,
 *          dragged is true/false, has the mouse moved enough to
 *          constitute a drag
 *      doneFn (optional) function(dragged, numClicks)
 *          executed on mouseup, or mouseout of window since
 *          we don't get events after that
 *          dragged is as in moveFn
 *          numClicks is how many clicks we've registered within
 *          a doubleclick time
 */
dragElement.init = function init(options) {
    var gd = Lib.getPlotDiv(options.element) || {},
        numClicks = 1,
        DBLCLICKDELAY = constants.DBLCLICKDELAY,
        startX,
        startY,
        newMouseDownTime,
        dragCover,
        initialTarget;

    if(!gd._mouseDownTime) gd._mouseDownTime = 0;

    function onStart(e) {
        // make dragging and dragged into properties of gd
        // so that others can look at and modify them
        gd._dragged = false;
        gd._dragging = true;
        startX = e.clientX;
        startY = e.clientY;
        initialTarget = e.target;

        newMouseDownTime = (new Date()).getTime();
        if(newMouseDownTime - gd._mouseDownTime < DBLCLICKDELAY) {
            // in a click train
            numClicks += 1;
        }
        else {
            // new click train
            numClicks = 1;
            gd._mouseDownTime = newMouseDownTime;
        }

        if(options.prepFn) options.prepFn(e, startX, startY);

        dragCover = coverSlip();

        dragCover.onmousemove = onMove;
        dragCover.onmouseup = onDone;
        dragCover.onmouseout = onDone;

        dragCover.style.cursor = window.getComputedStyle(options.element).cursor;

        return Lib.pauseEvent(e);
    }

    function onMove(e) {
        var dx = e.clientX - startX,
            dy = e.clientY - startY,
            minDrag = options.minDrag || constants.MINDRAG;

        if(Math.abs(dx) < minDrag) dx = 0;
        if(Math.abs(dy) < minDrag) dy = 0;
        if(dx||dy) {
            gd._dragged = true;
            dragElement.unhover(gd);
        }

        if(options.moveFn) options.moveFn(dx, dy, gd._dragged);

        return Lib.pauseEvent(e);
    }

    function onDone(e) {
        dragCover.onmousemove = null;
        dragCover.onmouseup = null;
        dragCover.onmouseout = null;
        Lib.removeElement(dragCover);

        if(!gd._dragging) {
            gd._dragged = false;
            return;
        }
        gd._dragging = false;

        // don't count as a dblClick unless the mouseUp is also within
        // the dblclick delay
        if((new Date()).getTime() - gd._mouseDownTime > DBLCLICKDELAY) {
            numClicks = Math.max(numClicks - 1, 1);
        }

        if(options.doneFn) options.doneFn(gd._dragged, numClicks);

        if(!gd._dragged) {
            var e2 = document.createEvent('MouseEvents');
            e2.initEvent('click', true, true);
            initialTarget.dispatchEvent(e2);
        }

        finishDrag(gd);

        gd._dragged = false;

        return Lib.pauseEvent(e);
    }

    options.element.onmousedown = onStart;
    options.element.style.pointerEvents = 'all';
};

function coverSlip() {
    var cover = document.createElement('div');

    cover.className = 'dragcover';
    var cStyle = cover.style;
    cStyle.position = 'fixed';
    cStyle.left = 0;
    cStyle.right = 0;
    cStyle.top = 0;
    cStyle.bottom = 0;
    cStyle.zIndex = 999999999;
    cStyle.background = 'none';

    document.body.appendChild(cover);

    return cover;
}

function finishDrag(gd) {
    gd._dragging = false;
    if(gd._replotPending) Plotly.plot(gd);
}
