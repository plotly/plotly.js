/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var d3 = require('d3');
var isNumeric = require('fast-isnumeric');

var Lib = require('../../lib');
var svgTextUtils = require('../../lib/svg_text_utils');

var Color = require('../../components/color');
var Drawing = require('../../components/drawing');
var ErrorBars = require('../../components/errorbars');

var arraysToCalcdata = require('./arrays_to_calcdata');


module.exports = function plot(gd, plotinfo, cdbar) {
    var xa = plotinfo.xaxis,
        ya = plotinfo.yaxis,
        fullLayout = gd._fullLayout;

    var bartraces = plotinfo.plot.select('.barlayer')
        .selectAll('g.trace.bars')
            .data(cdbar)
      .enter().append('g')
        .attr('class', 'trace bars');

    bartraces.append('g')
        .attr('class', 'points')
        .each(function(d) {
            var t = d[0].t,
                trace = d[0].trace,
                poffset = t.poffset,
                poffsetIsArray = Array.isArray(poffset),
                barwidth = t.barwidth,
                barwidthIsArray = Array.isArray(barwidth);

            arraysToCalcdata(d);

            d3.select(this).selectAll('g.point')
                .data(Lib.identity)
                .enter().append('g').classed('point', true)
                .each(function(di, i) {
                    // now display the bar
                    // clipped xf/yf (2nd arg true): non-positive
                    // log values go off-screen by plotwidth
                    // so you see them continue if you drag the plot
                    var p0 = di.p + ((poffsetIsArray) ? poffset[i] : poffset),
                        p1 = p0 + ((barwidthIsArray) ? barwidth[i] : barwidth),
                        s0 = di.b,
                        s1 = s0 + di.s;

                    var x0, x1, y0, y1;
                    if(trace.orientation === 'h') {
                        y0 = ya.c2p(p0, true);
                        y1 = ya.c2p(p1, true);
                        x0 = xa.c2p(s0, true);
                        x1 = xa.c2p(s1, true);
                    }
                    else {
                        x0 = xa.c2p(p0, true);
                        x1 = xa.c2p(p1, true);
                        y0 = ya.c2p(s0, true);
                        y1 = ya.c2p(s1, true);
                    }

                    if(!isNumeric(x0) || !isNumeric(x1) ||
                            !isNumeric(y0) || !isNumeric(y1) ||
                            x0 === x1 || y0 === y1) {
                        d3.select(this).remove();
                        return;
                    }

                    var lw = (di.mlw + 1 || trace.marker.line.width + 1 ||
                            (di.trace ? di.trace.marker.line.width : 0) + 1) - 1,
                        offset = d3.round((lw / 2) % 1, 2);

                    function roundWithLine(v) {
                        // if there are explicit gaps, don't round,
                        // it can make the gaps look crappy
                        return (fullLayout.bargap === 0 && fullLayout.bargroupgap === 0) ?
                            d3.round(Math.round(v) - offset, 2) : v;
                    }

                    function expandToVisible(v, vc) {
                        // if it's not in danger of disappearing entirely,
                        // round more precisely
                        return Math.abs(v - vc) >= 2 ? roundWithLine(v) :
                        // but if it's very thin, expand it so it's
                        // necessarily visible, even if it might overlap
                        // its neighbor
                        (v > vc ? Math.ceil(v) : Math.floor(v));
                    }

                    if(!gd._context.staticPlot) {
                        // if bars are not fully opaque or they have a line
                        // around them, round to integer pixels, mainly for
                        // safari so we prevent overlaps from its expansive
                        // pixelation. if the bars ARE fully opaque and have
                        // no line, expand to a full pixel to make sure we
                        // can see them
                        var op = Color.opacity(di.mc || trace.marker.color),
                            fixpx = (op < 1 || lw > 0.01) ?
                                roundWithLine : expandToVisible;
                        x0 = fixpx(x0, x1);
                        x1 = fixpx(x1, x0);
                        y0 = fixpx(y0, y1);
                        y1 = fixpx(y1, y0);
                    }

                    // append bar path and text
                    var bar = d3.select(this);

                    bar.append('path').attr('d',
                        'M' + x0 + ',' + y0 + 'V' + y1 + 'H' + x1 + 'V' + y0 + 'Z');

                    appendBarText(gd, bar, d, i, x0, x1, y0, y1);
                });
        });

    // error bars are on the top
    bartraces.call(ErrorBars.plot, plotinfo);

};

function appendBarText(gd, bar, calcTrace, i, x0, x1, y0, y1) {
    var trace = calcTrace[0].trace;

    // get bar text
    var traceText = trace.text;
    if(!traceText) return;

    var text;
    if(Array.isArray(traceText)) {
        if(i >= traceText.length) return;
        text = traceText[i];
    }
    else {
        text = traceText;
    }

    // get text position
    var traceTextPosition = trace.textposition,
        textPosition;
    if(Array.isArray(traceTextPosition)) {
        if(i >= traceTextPosition.length) return;
        textPosition = traceTextPosition[i];
    }
    else {
        textPosition = traceTextPosition;
    }

    if(textPosition === 'none') return;

    var barWidth = Math.abs(x1 - x0),
        barHeight = Math.abs(y1 - y0),
        barIsTooSmall = (barWidth < 8 || barHeight < 8),

        barmode = gd._fullLayout.barmode,
        inStackMode = (barmode === 'stack'),
        inRelativeMode = (barmode === 'relative'),
        inStackOrRelativeMode = inStackMode || inRelativeMode,

        calcBar = calcTrace[i],
        isOutmostBar = !inStackOrRelativeMode || calcBar._outmost;

    if(textPosition === 'auto') {
        textPosition = (barIsTooSmall && isOutmostBar) ? 'outside' : 'inside';
    }

    if(textPosition === 'outside') {
        if(!isOutmostBar) textPosition = 'inside';
    }

    if(textPosition === 'inside') {
        if(barIsTooSmall) return;
    }


    // get text font
    var textFont;

    if(textPosition === 'outside') {
        var traceOutsideTextFont = trace.outsidetextfont;
        if(Array.isArray(traceOutsideTextFont)) {
            if(i >= traceOutsideTextFont.length) return;
            textFont = traceOutsideTextFont[i];
        }
        else {
            textFont = traceOutsideTextFont;
        }
    }
    else {
        var traceInsideTextFont = trace.insidetextfont;
        if(Array.isArray(traceInsideTextFont)) {
            if(i >= traceInsideTextFont.length) return;
            textFont = traceInsideTextFont[i];
        }
        else {
            textFont = traceInsideTextFont;
        }
    }

    if(!textFont) {
        var traceTextFont = trace.textfont;
        if(Array.isArray(traceTextFont)) {
            if(i >= traceTextFont.length) return;
            textFont = traceTextFont[i];
        }
        else {
            textFont = traceTextFont;
        }
    }

    if(!textFont) {
        textFont = gd._fullLayout.font;
    }

    // append bar text
    var textSelection = bar.append('text')
        // prohibit tex interpretation until we can handle
        // tex and regular text together
        .attr('data-notex', 1)
        .text(text)
        .attr({
            'class': 'bartext',
            transform: '',
            'data-bb': '',
            'text-anchor': 'middle',
            x: 0,
            y: 0
        })
        .call(Drawing.font, textFont);

    textSelection.call(svgTextUtils.convertToTspans);
    textSelection.selectAll('tspan.line').attr({x: 0, y: 0});

    // position bar text
    var textBB = Drawing.bBox(textSelection.node()),
        textWidth = textBB.width,
        textHeight = textBB.height;
    if(!textWidth || !textHeight) {
        textSelection.remove();
        return;
    }

    // compute translate transform
    var transform;
    if(textPosition === 'outside') {
        transform = getTransformToMoveOutsideBar(x0, x1, y0, y1, textBB,
            trace.orientation);
    }
    else {
        transform = getTransformToMoveInsideBar(x0, x1, y0, y1, textBB);
    }

    textSelection.attr('transform', transform);
}

function getTransformToMoveInsideBar(x0, x1, y0, y1, textBB) {
    // compute text and target positions
    var barWidth = Math.abs(x1 - x0),
        barHeight = Math.abs(y1 - y0),
        textWidth = textBB.width,
        textHeight = textBB.height,
        barX = (x0 + x1) / 2,
        barY = (y0 + y1) / 2,
        textX = (textBB.left + textBB.right) / 2,
        textY = (textBB.top + textBB.bottom) / 2;

    // apply target padding
    var targetWidth = 0.95 * barWidth,
        targetHeight = 0.95 * barHeight;

    return getTransform(
        textX, textY, textWidth, textHeight,
        barX, barY, targetWidth, targetHeight);
}

function getTransformToMoveOutsideBar(x0, x1, y0, y1, textBB, orientation) {

    // compute text and target positions
    var textWidth = textBB.width,
        textHeight = textBB.height,
        textX = (textBB.left + textBB.right) / 2,
        textY = (textBB.top + textBB.bottom) / 2;

    var targetWidth, targetHeight,
        targetX, targetY;
    if(orientation === 'h') {
        if(x1 < x0) {
            // bar end is on the left hand side
            targetWidth = 2 + textWidth; // padding included
            targetHeight = Math.abs(y1 - y0);
            targetX = x1 - targetWidth / 2;
            targetY = (y0 + y1) / 2;
        }
        else {
            targetWidth = 2 + textWidth; // padding included
            targetHeight = Math.abs(y1 - y0);
            targetX = x1 + targetWidth / 2;
            targetY = (y0 + y1) / 2;
        }
    }
    else {
        if(y1 > y0) {
            // bar end is on the bottom
            targetWidth = Math.abs(x1 - x0);
            targetHeight = 2 + textHeight; // padding included
            targetX = (x0 + x1) / 2;
            targetY = y1 + targetHeight / 2;
        }
        else {
            targetWidth = Math.abs(x1 - x0);
            targetHeight = 2 + textHeight; // padding included
            targetX = (x0 + x1) / 2;
            targetY = y1 - targetHeight / 2;
        }
    }

    return getTransform(
        textX, textY, textWidth, textHeight,
        targetX, targetY, targetWidth, targetHeight);
}

/**
 * Compute SVG transform to move a text box into a target box
 *
 * @param {number} textX         X pixel coord of the text box center
 * @param {number} textY         Y pixel coord of the text box center
 * @param {number} textWidth     text box width
 * @param {number} textHeight    text box height
 * @param {number} targetX       X pixel coord of the target box center
 * @param {number} targetY       Y pixel coord of the target box center
 * @param {number} targetWidth   target box width
 * @param {number} targetHeight  target box height
 *
 * @returns {string} SVG transform
 */
function getTransform(
    textX, textY, textWidth, textHeight,
    targetX, targetY, targetWidth, targetHeight) {

    // compute translate transform
    var translateX = targetX - textX,
        translateY = targetY - textY,
        translate = 'translate(' + translateX + ' ' + translateY + ')';

    // if bar text doesn't fit, compute rotate and scale transforms
    var doesntFit = (textWidth > targetWidth || textHeight > targetHeight),
        rotate, scale, scaleX, scaleY;

    if(doesntFit) {
        var textIsHorizontal = (textWidth > textHeight),
            targetIsHorizontal = (targetWidth > targetHeight);
        if(textIsHorizontal !== targetIsHorizontal) {
            rotate = 'rotate(-90 ' + textX + ' ' + textY + ')';
            scaleX = targetWidth / textHeight;
            scaleY = targetHeight / textWidth;
        }
        else {
            scaleX = targetWidth / textWidth;
            scaleY = targetHeight / textHeight;
        }

        if(scaleX > 1) scaleX = 1;
        if(scaleY > 1) scaleY = 1;

        if(scaleX !== 1 || scaleY !== 1) {
            scale = 'scale(' + scaleX + ' ' + scaleY + ')';
        }
    }

    // compute transform
    var transform = translate;
    if(scale) transform += ' ' + scale;
    if(rotate) transform += ' ' + rotate;

    return transform;
}
