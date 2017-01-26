/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

module.exports = ScrollBox;

var d3 = require('d3');

var Color = require('../color');
var Drawing = require('../drawing');

var Lib = require('../../lib');

/**
 * Helper class to setup a scroll box
 *
 * @class
 * @param           gd          Plotly's graph div
 * @param           container   Container to be scroll-boxed (as a D3 selection)
 * @param {Object}  position
 * @param {number}  position.l  Left side position (in pixels)
 * @param {number}  position.t  Top side (in pixels)
 * @param {number}  position.w  Width (in pixels)
 * @param {number}  position.h  Height (in pixels)
 * @param {string}  id          Id for the clip path to implement the scroll box
 */
function ScrollBox(gd, container, position, id) {
    this.gd = gd;
    this.container = container;
    this.position = position;
    this.id = id;
}

// scroll bar dimensions
ScrollBox.barWidth = 2;
ScrollBox.barLength = 20;
ScrollBox.barRadius = 2;
ScrollBox.barPad = 1;
ScrollBox.barColor = '#808BA4';

/**
 * If needed, setup a clip path and scrollbars
 *
 * @method
 */
ScrollBox.prototype.enable = function enable() {
    var fullLayout = this.gd._fullLayout,
        fullWidth = fullLayout.width,
        fullHeight = fullLayout.height;

    // compute position of scroll box
    var l = this.position.l,
        w = this.position.w,
        t = this.position.t,
        h = this.position.h,
        boxW = w,
        boxH = h,
        boxL, boxR,
        boxT, boxB;

    if(boxW > fullWidth) boxW = fullWidth / 4;
    if(boxH > fullHeight) boxH = fullHeight / 4;

    var minSize = 4 + (ScrollBox.barLength + 2 * ScrollBox.barPad);
    boxW = Math.max(boxW, minSize);
    boxH = Math.max(boxH, minSize);

    if(0 <= l && l <= fullWidth) {
        boxL = l;
        boxR = boxL + boxW;
    }
    else {
        // align left
        boxL = 0;
        boxR = boxL + boxW;
    }

    if(0 <= t && t <= fullHeight) {
        boxT = t;
        boxB = boxT + boxH;
    }
    else {
        // align top
        boxT = 0;
        boxB = boxT + boxH;
    }

    if(boxR > fullWidth) {
        // align right
        boxR = fullWidth;
        boxL = boxR - boxW;
    }

    if(boxB > fullHeight) {
        // align bottom
        boxB = fullHeight;
        boxT = boxB - boxH;
    }

    this._box = {
        l: boxL,
        t: boxT,
        w: boxW,
        h: boxH
    };

    // compute position of horizontal scroll bar
    var needsHorizontalScrollBar = (w > boxW),
        hbarW = ScrollBox.barLength + 2 * ScrollBox.barPad,
        hbarH = ScrollBox.barWidth + 2 * ScrollBox.barPad,
        hbarL = boxL,
        hbarT = (boxB + hbarH < fullHeight) ? boxB : fullHeight - hbarH;

    var hbar = this.container.selectAll('rect.scrollbar-horizontal').data(
            (needsHorizontalScrollBar) ? [0] : []);

    hbar.exit()
        .on('.drag', null)
        .remove();

    hbar.enter().append('rect')
        .classed('scrollbar-horizontal', true)
        .call(Color.fill, ScrollBox.barColor);

    if(needsHorizontalScrollBar) {
        this._hbar = hbar.attr({
            'rx': ScrollBox.barRadius,
            'ry': ScrollBox.barRadius,
            'x': hbarL,
            'y': hbarT,
            'width': hbarW,
            'height': hbarH
        });

        // hbar center moves between hbarXMin and hbarXMin + hbarTranslateMax
        this._hbarXMin = hbarL + hbarW / 2;
        this._hbarTranslateMax = boxW - hbarW;
    }
    else {
        delete this._hbar;
        delete this._hbarXMin;
        delete this._hbarTranslateMax;
    }

    // compute position of vertical scroll bar
    var needsVerticalScrollBar = (h > boxH),
        vbarW = ScrollBox.barWidth + 2 * ScrollBox.barPad,
        vbarH = ScrollBox.barLength + 2 * ScrollBox.barPad,
        vbarL = (boxR + vbarW < fullWidth) ? boxR : fullWidth - vbarW,
        vbarT = boxT;

    var vbar = this.container.selectAll('rect.scrollbar-vertical').data(
            (needsVerticalScrollBar) ? [0] : []);

    vbar.exit()
        .on('.drag', null)
        .remove();

    vbar.enter().append('rect')
        .classed('scrollbar-vertical', true)
        .call(Color.fill, ScrollBox.barColor);

    if(needsVerticalScrollBar) {
        this._vbar = vbar.attr({
            'rx': ScrollBox.barRadius,
            'ry': ScrollBox.barRadius,
            'x': vbarL,
            'y': vbarT,
            'width': vbarW,
            'height': vbarH
        });

        // vbar center moves between vbarYMin and vbarYMin + vbarTranslateMax
        this._vbarYMin = vbarT + vbarH / 2;
        this._vbarTranslateMax = boxH - vbarH;
    }
    else {
        delete this._vbar;
        delete this._vbarYMin;
        delete this._vbarTranslateMax;
    }

    // setup a clip path (if scroll bars are needed)
    var clipId = this.id,
        clipL = boxL - 0.5,
        clipR = (needsVerticalScrollBar) ? boxR + vbarW + 0.5 : boxR + 0.5,
        clipT = boxT - 0.5,
        clipB = (needsHorizontalScrollBar) ? boxB + hbarH + 0.5 : boxB + 0.5;

    var clipPath = fullLayout._topdefs.selectAll('#' + clipId)
        .data((needsHorizontalScrollBar || needsVerticalScrollBar) ? [0] : []);

    clipPath.exit().remove();

    clipPath.enter()
        .append('clipPath').attr('id', clipId)
        .append('rect');

    if(needsHorizontalScrollBar || needsVerticalScrollBar) {
        this._clipRect = clipPath.select('rect').attr({
            x: Math.floor(clipL),
            y: Math.floor(clipT),
            width: Math.ceil(clipR) - Math.floor(clipL),
            height: Math.ceil(clipB) - Math.floor(clipT)
        });
        this.container.call(Drawing.setClipUrl, clipId);
    }
    else {
        delete this._clipRect;
        this.container.call(Drawing.setClipUrl, null);
    }

    // set up drag listeners (if scroll bars are needed)
    if(needsHorizontalScrollBar || needsVerticalScrollBar) {
        var onBoxDrag = d3.behavior.drag()
            .on('dragstart', function() {
                d3.event.sourceEvent.preventDefault();
            })
            .on('drag', this._onBoxDrag.bind(this));

        this.container
            .on('.drag', null)
            .call(onBoxDrag);

        var onBarDrag = d3.behavior.drag()
            .on('dragstart', function() {
                d3.event.sourceEvent.preventDefault();
                d3.event.sourceEvent.stopPropagation();
            })
            .on('drag', this._onBarDrag.bind(this));

        if(needsHorizontalScrollBar) {
            this._hbar
                .on('.drag', null)
                .call(onBarDrag);
        }

        if(needsVerticalScrollBar) {
            this._vbar
                .on('.drag', null)
                .call(onBarDrag);
        }
    }

    // set initial position
    this._setTranslate(0, 0);
};

/**
 * If present, remove clip-path and scrollbars
 *
 * @method
 */
ScrollBox.prototype.disable = function disable() {
    if(this._hbar || this._vbar) {
        this.container.call(Drawing.setClipUrl, null);
        this.container.on('.drag', null);
        delete this._clipRect;
    }

    if(this._hbar) {
        this._hbar.on('.drag', null);
        this._hbar.remove();
        delete this._hbar;
        delete this._hbarXMin;
        delete this._hbarTranslateMax;
    }

    if(this._vbar) {
        this._vbar.on('.drag', null);
        this._vbar.remove();
        delete this._vbar;
        delete this._vbarYMin;
        delete this._vbarTranslateMax;
    }
};

/**
 * Handles scroll box drag events
 *
 * @method
 */
ScrollBox.prototype._onBoxDrag = function onBarDrag() {
    var xf = this._xf,
        yf = this._yf;

    if(this._hbar) {
        var translateXMax = this.position.w - this._box.w;

        xf = Lib.constrain(xf - d3.event.dx / translateXMax, 0, 1);
    }
    else xf = 0;

    if(this._vbar) {
        var translateYMax = this.position.h - this._box.h;

        yf = Lib.constrain(yf - d3.event.dy / translateYMax, 0, 1);
    }
    else yf = 0;

    this._setTranslate(xf, yf);
};

/**
 * Handles scroll bar drag events
 *
 * @method
 */
ScrollBox.prototype._onBarDrag = function onBarDrag() {
    var xf = this._xf,
        yf = this._yf;

    if(this._hbar) {
        var translateXMax = this.position.w - this._box.w,
            translateX = xf * translateXMax,
            xMin = translateX + this._hbarXMin,
            xMax = xMin + this._hbarTranslateMax,
            x = Lib.constrain(d3.event.x, xMin, xMax);

        xf = (x - xMin) / (xMax - xMin);
    }
    else xf = 0;

    if(this._vbar) {
        var translateYMax = this.position.h - this._box.h,
            translateY = yf * translateYMax,
            yMin = translateY + this._vbarYMin,
            yMax = yMin + this._vbarTranslateMax,
            y = Lib.constrain(d3.event.y, yMin, yMax);

        yf = (y - yMin) / (yMax - yMin);
    }
    else yf = 0;

    this._setTranslate(xf, yf);
};

/**
 * Set clip path and scroll bar translate transform
 *
 * @method
 * @param {number}  xf  Horizontal position as a container fraction
 * @param {number}  yf  Vertical position as a container fraction
 */
ScrollBox.prototype._setTranslate = function _setTranslate(xf, yf) {
    // store xf and yf (needed by ScrollBox.prototype._on*Drag)
    this._xf = xf;
    this._yf = yf;

    var translateXMax = this.position.w - this._box.w,
        translateYMax = this.position.h - this._box.h,
        translateX = xf * translateXMax,
        translateY = yf * translateYMax;

    this.container.call(Lib.setTranslate,
        this._box.l - this.position.l - translateX,
        this._box.t - this.position.t - translateY);

    if(this._clipRect) {
        this._clipRect.attr({
            x: Math.floor(this.position.l + translateX - 0.5),
            y: Math.floor(this.position.t + translateY - 0.5)
        });
    }

    if(this._hbar) {
        this._hbar.call(Lib.setTranslate,
            translateX + xf * this._hbarTranslateMax,
            0);
    }

    if(this._vbar) {
        this._vbar.call(Lib.setTranslate,
            0,
            translateY + yf * this._vbarTranslateMax);
    }
};
