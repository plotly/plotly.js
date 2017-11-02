/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var mouseOffset = require('mouse-event-offset');
var hasHover = require('has-hover');

var Plotly = require('../../plotly');
var Lib = require('../../lib');

var constants = require('../../plots/cartesian/constants');
var interactConstants = require('../../constants/interactions');

var dragElement = module.exports = {};

dragElement.align = require('./align');
dragElement.getCursor = require('./cursor');

var unhover = require('./unhover');
dragElement.unhover = unhover.wrapped;
dragElement.unhoverRaw = unhover.raw;

/**
 * Abstracts click & drag interactions
 *
 * During the interaction, a "coverSlip" element - a transparent
 * div covering the whole page - is created, which has two key effects:
 * - Lets you drag beyond the boundaries of the plot itself without
 *   dropping (but if you drag all the way out of the browser window the
 *   interaction will end)
 * - Freezes the cursor: whatever mouse cursor the drag element had when the
 *   interaction started gets copied to the coverSlip for use until mouseup
 *
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
 *      doneFn (optional) function(dragged, numClicks, e)
 *          executed on mouseup, or mouseout of window since
 *          we don't get events after that
 *          dragged is as in moveFn
 *          numClicks is how many clicks we've registered within
 *          a doubleclick time
 *          e is the original event
 */
dragElement.init = function init(options) {
    var gd = options.gd;
    var numClicks = 1;
    var DBLCLICKDELAY = interactConstants.DBLCLICKDELAY;
    var element = options.element;

    var startX,
        startY,
        newMouseDownTime,
        cursor,
        dragCover,
        initialTarget;

    if(!gd._mouseDownTime) gd._mouseDownTime = 0;

    element.style.pointerEvents = 'all';

    element.onmousedown = onStart;
    element.ontouchstart = onStart;

    function onStart(e) {
        if(e.buttons && e.buttons === 2) {    // right click
            return;
        }

        // make dragging and dragged into properties of gd
        // so that others can look at and modify them
        gd._dragged = false;
        gd._dragging = true;
        var offset = pointerOffset(e);
        startX = offset[0];
        startY = offset[1];
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

        if(hasHover) {
            dragCover = coverSlip();
            dragCover.style.cursor = window.getComputedStyle(element).cursor;
        }
        else {
            // document acts as a dragcover for mobile, bc we can't create dragcover dynamically
            dragCover = document;
            cursor = window.getComputedStyle(document.documentElement).cursor;
            document.documentElement.style.cursor = window.getComputedStyle(element).cursor;
        }

        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onDone);
        document.addEventListener('touchmove', onMove);
        document.addEventListener('touchend', onDone);

        return Lib.pauseEvent(e);
    }

    function onMove(e) {
        var offset = pointerOffset(e);
        var dx = offset[0] - startX;
        var dy = offset[1] - startY;
        var minDrag = options.minDrag || constants.MINDRAG;

        if(Math.abs(dx) < minDrag) dx = 0;
        if(Math.abs(dy) < minDrag) dy = 0;
        if(dx || dy) {
            gd._dragged = true;
            dragElement.unhover(gd);
        }

        if(options.moveFn) options.moveFn(dx, dy, gd._dragged);

        return Lib.pauseEvent(e);
    }

    function onDone(e) {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onDone);
        document.removeEventListener('touchmove', onMove);
        document.removeEventListener('touchend', onDone);

        if(hasHover) {
            Lib.removeElement(dragCover);
        }
        else if(cursor) {
            dragCover.documentElement.style.cursor = cursor;
            cursor = null;
        }

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

        if(options.doneFn) options.doneFn(gd._dragged, numClicks, e);

        if(!gd._dragged) {
            var e2;

            try {
                e2 = new MouseEvent('click', e);
            }
            catch(err) {
                var offset = pointerOffset(e);
                e2 = document.createEvent('MouseEvents');
                e2.initMouseEvent('click',
                    e.bubbles, e.cancelable,
                    e.view, e.detail,
                    e.screenX, e.screenY,
                    offset[0], offset[1],
                    e.ctrlKey, e.altKey, e.shiftKey, e.metaKey,
                    e.button, e.relatedTarget);
            }

            initialTarget.dispatchEvent(e2);
        }

        finishDrag(gd);

        gd._dragged = false;

        return Lib.pauseEvent(e);
    }
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

dragElement.coverSlip = coverSlip;

function finishDrag(gd) {
    gd._dragging = false;
    if(gd._replotPending) Plotly.plot(gd);
}

function pointerOffset(e) {
    return mouseOffset(
        e.changedTouches ? e.changedTouches[0] : e,
        document.body
    );
}
