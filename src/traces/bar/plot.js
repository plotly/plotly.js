/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var d3 = require('d3');
var isNumeric = require('fast-isnumeric');
var tinycolor = require('tinycolor2');

var Lib = require('../../lib');
var svgTextUtils = require('../../lib/svg_text_utils');

var Color = require('../../components/color');
var Drawing = require('../../components/drawing');
var ErrorBars = require('../../components/errorbars');

var attributes = require('./attributes'),
    attributeText = attributes.text,
    attributeTextPosition = attributes.textposition,
    attributeTextFont = attributes.textfont,
    attributeInsideTextFont = attributes.insidetextfont,
    attributeOutsideTextFont = attributes.outsidetextfont;

// padding in pixels around text
var TEXTPAD = 3;

module.exports = function plot(gd, plotinfo, cdbar) {
    var xa = plotinfo.xaxis,
        ya = plotinfo.yaxis,
        fullLayout = gd._fullLayout;

    var bartraces = plotinfo.plot.select('.barlayer')
        .selectAll('g.trace.bars')
        .data(cdbar);

    bartraces.enter().append('g')
        .attr('class', 'trace bars');

    bartraces.append('g')
        .attr('class', 'points')
        .each(function(d) {
            var t = d[0].t,
                trace = d[0].trace,
                poffset = t.poffset,
                poffsetIsArray = Array.isArray(poffset);

            d3.select(this).selectAll('g.point')
                .data(Lib.identity)
              .enter().append('g').classed('point', true)
                .each(function(di, i) {
                    // now display the bar
                    // clipped xf/yf (2nd arg true): non-positive
                    // log values go off-screen by plotwidth
                    // so you see them continue if you drag the plot
                    var p0 = di.p + ((poffsetIsArray) ? poffset[i] : poffset),
                        p1 = p0 + di.w,
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
    function appendTextNode(bar, text, textFont) {
        var textSelection = bar.append('text')
            .text(text)
            .attr({
                'class': 'bartext',
                transform: '',
                'text-anchor': 'middle',
                // prohibit tex interpretation until we can handle
                // tex and regular text together
                'data-notex': 1
            })
            .call(Drawing.font, textFont)
            .call(svgTextUtils.convertToTspans, gd);

        return textSelection;
    }

    // get trace attributes
    var trace = calcTrace[0].trace,
        orientation = trace.orientation;

    var text = getText(trace, i);
    if(!text) return;

    var textPosition = getTextPosition(trace, i);
    if(textPosition === 'none') return;

    var textFont = getTextFont(trace, i, gd._fullLayout.font),
        insideTextFont = getInsideTextFont(trace, i, textFont),
        outsideTextFont = getOutsideTextFont(trace, i, textFont);

    // compute text position
    var barmode = gd._fullLayout.barmode,
        inStackMode = (barmode === 'stack'),
        inRelativeMode = (barmode === 'relative'),
        inStackOrRelativeMode = inStackMode || inRelativeMode,

        calcBar = calcTrace[i],
        isOutmostBar = !inStackOrRelativeMode || calcBar._outmost,

        barWidth = Math.abs(x1 - x0) - 2 * TEXTPAD,  // padding excluded
        barHeight = Math.abs(y1 - y0) - 2 * TEXTPAD,  // padding excluded

        textSelection,
        textBB,
        textWidth,
        textHeight;

    if(textPosition === 'outside') {
        if(!isOutmostBar) textPosition = 'inside';
    }

    if(textPosition === 'auto') {
        if(isOutmostBar) {
            // draw text using insideTextFont and check if it fits inside bar
            textSelection = appendTextNode(bar, text, insideTextFont);

            textBB = Drawing.bBox(textSelection.node()),
            textWidth = textBB.width,
            textHeight = textBB.height;

            var textHasSize = (textWidth > 0 && textHeight > 0),
                fitsInside =
                    (textWidth <= barWidth && textHeight <= barHeight),
                fitsInsideIfRotated =
                    (textWidth <= barHeight && textHeight <= barWidth),
                fitsInsideIfShrunk = (orientation === 'h') ?
                    (barWidth >= textWidth * (barHeight / textHeight)) :
                    (barHeight >= textHeight * (barWidth / textWidth));
            if(textHasSize &&
                    (fitsInside || fitsInsideIfRotated || fitsInsideIfShrunk)) {
                textPosition = 'inside';
            }
            else {
                textPosition = 'outside';
                textSelection.remove();
                textSelection = null;
            }
        }
        else textPosition = 'inside';
    }

    if(!textSelection) {
        textSelection = appendTextNode(bar, text,
                (textPosition === 'outside') ?
                outsideTextFont : insideTextFont);

        textBB = Drawing.bBox(textSelection.node()),
        textWidth = textBB.width,
        textHeight = textBB.height;

        if(textWidth <= 0 || textHeight <= 0) {
            textSelection.remove();
            return;
        }
    }

    // compute text transform
    var transform;
    if(textPosition === 'outside') {
        transform = getTransformToMoveOutsideBar(x0, x1, y0, y1, textBB,
            orientation);
    }
    else {
        transform = getTransformToMoveInsideBar(x0, x1, y0, y1, textBB,
            orientation);
    }

    textSelection.attr('transform', transform);
}

function getTransformToMoveInsideBar(x0, x1, y0, y1, textBB, orientation) {
    // compute text and target positions
    var textWidth = textBB.width,
        textHeight = textBB.height,
        textX = (textBB.left + textBB.right) / 2,
        textY = (textBB.top + textBB.bottom) / 2,
        barWidth = Math.abs(x1 - x0),
        barHeight = Math.abs(y1 - y0),
        targetWidth,
        targetHeight,
        targetX,
        targetY;

    // apply text padding
    var textpad;
    if(barWidth > (2 * TEXTPAD) && barHeight > (2 * TEXTPAD)) {
        textpad = TEXTPAD;
        barWidth -= 2 * textpad;
        barHeight -= 2 * textpad;
    }
    else textpad = 0;

    // compute rotation and scale
    var rotate,
        scale;

    if(textWidth <= barWidth && textHeight <= barHeight) {
        // no scale or rotation is required
        rotate = false;
        scale = 1;
    }
    else if(textWidth <= barHeight && textHeight <= barWidth) {
        // only rotation is required
        rotate = true;
        scale = 1;
    }
    else if((textWidth < textHeight) === (barWidth < barHeight)) {
        // only scale is required
        rotate = false;
        scale = Math.min(barWidth / textWidth, barHeight / textHeight);
    }
    else {
        // both scale and rotation are required
        rotate = true;
        scale = Math.min(barHeight / textWidth, barWidth / textHeight);
    }

    if(rotate) rotate = 90;  // rotate clockwise

    // compute text and target positions
    if(rotate) {
        targetWidth = scale * textHeight;
        targetHeight = scale * textWidth;
    }
    else {
        targetWidth = scale * textWidth;
        targetHeight = scale * textHeight;
    }

    if(orientation === 'h') {
        if(x1 < x0) {
            // bar end is on the left hand side
            targetX = x1 + textpad + targetWidth / 2;
            targetY = (y0 + y1) / 2;
        }
        else {
            targetX = x1 - textpad - targetWidth / 2;
            targetY = (y0 + y1) / 2;
        }
    }
    else {
        if(y1 > y0) {
            // bar end is on the bottom
            targetX = (x0 + x1) / 2;
            targetY = y1 - textpad - targetHeight / 2;
        }
        else {
            targetX = (x0 + x1) / 2;
            targetY = y1 + textpad + targetHeight / 2;
        }
    }

    return getTransform(textX, textY, targetX, targetY, scale, rotate);
}

function getTransformToMoveOutsideBar(x0, x1, y0, y1, textBB, orientation) {
    var barWidth = (orientation === 'h') ?
            Math.abs(y1 - y0) :
            Math.abs(x1 - x0),
        textpad;

    // apply text padding if possible
    if(barWidth > 2 * TEXTPAD) {
        textpad = TEXTPAD;
        barWidth -= 2 * textpad;
    }

    // compute rotation and scale
    var rotate = false,
        scale = (orientation === 'h') ?
            Math.min(1, barWidth / textBB.height) :
            Math.min(1, barWidth / textBB.width);

    // compute text and target positions
    var textX = (textBB.left + textBB.right) / 2,
        textY = (textBB.top + textBB.bottom) / 2,
        targetWidth,
        targetHeight,
        targetX,
        targetY;
    if(rotate) {
        targetWidth = scale * textBB.height;
        targetHeight = scale * textBB.width;
    }
    else {
        targetWidth = scale * textBB.width;
        targetHeight = scale * textBB.height;
    }

    if(orientation === 'h') {
        if(x1 < x0) {
            // bar end is on the left hand side
            targetX = x1 - textpad - targetWidth / 2;
            targetY = (y0 + y1) / 2;
        }
        else {
            targetX = x1 + textpad + targetWidth / 2;
            targetY = (y0 + y1) / 2;
        }
    }
    else {
        if(y1 > y0) {
            // bar end is on the bottom
            targetX = (x0 + x1) / 2;
            targetY = y1 + textpad + targetHeight / 2;
        }
        else {
            targetX = (x0 + x1) / 2;
            targetY = y1 - textpad - targetHeight / 2;
        }
    }

    return getTransform(textX, textY, targetX, targetY, scale, rotate);
}

function getTransform(textX, textY, targetX, targetY, scale, rotate) {
    var transformScale,
        transformRotate,
        transformTranslate;

    if(scale < 1) transformScale = 'scale(' + scale + ') ';
    else {
        scale = 1;
        transformScale = '';
    }

    transformRotate = (rotate) ?
        'rotate(' + rotate + ' ' + textX + ' ' + textY + ') ' : '';

    // Note that scaling also affects the center of the text box
    var translateX = (targetX - scale * textX),
        translateY = (targetY - scale * textY);
    transformTranslate = 'translate(' + translateX + ' ' + translateY + ')';

    return transformTranslate + transformScale + transformRotate;
}

function getText(trace, index) {
    var value = getValue(trace.text, index);
    return coerceString(attributeText, value);
}

function getTextPosition(trace, index) {
    var value = getValue(trace.textposition, index);
    return coerceEnumerated(attributeTextPosition, value);
}

function getTextFont(trace, index, defaultValue) {
    return getFontValue(
        attributeTextFont, trace.textfont, index, defaultValue);
}

function getInsideTextFont(trace, index, defaultValue) {
    return getFontValue(
        attributeInsideTextFont, trace.insidetextfont, index, defaultValue);
}

function getOutsideTextFont(trace, index, defaultValue) {
    return getFontValue(
        attributeOutsideTextFont, trace.outsidetextfont, index, defaultValue);
}

function getFontValue(attributeDefinition, attributeValue, index, defaultValue) {
    attributeValue = attributeValue || {};

    var familyValue = getValue(attributeValue.family, index),
        sizeValue = getValue(attributeValue.size, index),
        colorValue = getValue(attributeValue.color, index);

    return {
        family: coerceString(
            attributeDefinition.family, familyValue, defaultValue.family),
        size: coerceNumber(
            attributeDefinition.size, sizeValue, defaultValue.size),
        color: coerceColor(
            attributeDefinition.color, colorValue, defaultValue.color)
    };
}

function getValue(arrayOrScalar, index) {
    var value;
    if(!Array.isArray(arrayOrScalar)) value = arrayOrScalar;
    else if(index < arrayOrScalar.length) value = arrayOrScalar[index];
    return value;
}

function coerceString(attributeDefinition, value, defaultValue) {
    if(typeof value === 'string') {
        if(value || !attributeDefinition.noBlank) return value;
    }
    else if(typeof value === 'number') {
        if(!attributeDefinition.strict) return String(value);
    }

    return (defaultValue !== undefined) ?
        defaultValue :
        attributeDefinition.dflt;
}

function coerceEnumerated(attributeDefinition, value, defaultValue) {
    if(attributeDefinition.coerceNumber) value = +value;

    if(attributeDefinition.values.indexOf(value) !== -1) return value;

    return (defaultValue !== undefined) ?
        defaultValue :
        attributeDefinition.dflt;
}

function coerceNumber(attributeDefinition, value, defaultValue) {
    if(isNumeric(value)) {
        value = +value;

        var min = attributeDefinition.min,
            max = attributeDefinition.max,
            isOutOfBounds = (min !== undefined && value < min) ||
                (max !== undefined && value > max);

        if(!isOutOfBounds) return value;
    }

    return (defaultValue !== undefined) ?
        defaultValue :
        attributeDefinition.dflt;
}

function coerceColor(attributeDefinition, value, defaultValue) {
    if(tinycolor(value).isValid()) return value;

    return (defaultValue !== undefined) ?
        defaultValue :
        attributeDefinition.dflt;
}
