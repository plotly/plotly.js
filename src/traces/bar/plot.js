/**
* Copyright 2012-2020, Plotly, Inc.
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
var Registry = require('../../registry');
var tickText = require('../../plots/cartesian/axes').tickText;

var uniformText = require('./uniform_text');
var recordMinTextSize = uniformText.recordMinTextSize;
var clearMinTextSize = uniformText.clearMinTextSize;

var style = require('./style');
var helpers = require('./helpers');
var constants = require('./constants');
var attributes = require('./attributes');

var attributeText = attributes.text;
var attributeTextPosition = attributes.textposition;

var appendArrayPointValue = require('../../components/fx/helpers').appendArrayPointValue;

var TEXTPAD = constants.TEXTPAD;

function keyFunc(d) {return d.id;}
function getKeyFunc(trace) {
    if(trace.ids) {
        return keyFunc;
    }
}

function dirSign(a, b) {
    return (a < b) ? 1 : -1;
}

function getXY(di, xa, ya, isHorizontal) {
    var s = [];
    var p = [];

    var sAxis = isHorizontal ? xa : ya;
    var pAxis = isHorizontal ? ya : xa;

    s[0] = sAxis.c2p(di.s0, true);
    p[0] = pAxis.c2p(di.p0, true);

    s[1] = sAxis.c2p(di.s1, true);
    p[1] = pAxis.c2p(di.p1, true);

    return isHorizontal ? [s, p] : [p, s];
}

function transition(selection, fullLayout, opts, makeOnCompleteCallback) {
    if(!fullLayout.uniformtext.mode && hasTransition(opts)) {
        var onComplete;
        if(makeOnCompleteCallback) {
            onComplete = makeOnCompleteCallback();
        }
        return selection
          .transition()
          .duration(opts.duration)
          .ease(opts.easing)
          .each('end', function() { onComplete && onComplete(); })
          .each('interrupt', function() { onComplete && onComplete(); });
    } else {
        return selection;
    }
}

function hasTransition(transitionOpts) {
    return transitionOpts && transitionOpts.duration > 0;
}

function plot(gd, plotinfo, cdModule, traceLayer, opts, makeOnCompleteCallback) {
    var xa = plotinfo.xaxis;
    var ya = plotinfo.yaxis;
    var fullLayout = gd._fullLayout;

    if(!opts) {
        opts = {
            mode: fullLayout.barmode,
            norm: fullLayout.barmode,
            gap: fullLayout.bargap,
            groupgap: fullLayout.bargroupgap
        };

        // don't clear bar when this is called from waterfall or funnel
        clearMinTextSize('bar', fullLayout);
    }

    var bartraces = Lib.makeTraceGroups(traceLayer, cdModule, 'trace bars').each(function(cd) {
        var plotGroup = d3.select(this);
        var trace = cd[0].trace;
        var isWaterfall = (trace.type === 'waterfall');
        var isFunnel = (trace.type === 'funnel');
        var isBar = (trace.type === 'bar');
        var shouldDisplayZeros = (isBar || isFunnel);

        var adjustPixel = 0;
        if(isWaterfall && trace.connector.visible && trace.connector.mode === 'between') {
            adjustPixel = trace.connector.line.width / 2;
        }

        var isHorizontal = (trace.orientation === 'h');
        var withTransition = hasTransition(opts);

        var pointGroup = Lib.ensureSingle(plotGroup, 'g', 'points');

        var keyFunc = getKeyFunc(trace);
        var bars = pointGroup.selectAll('g.point').data(Lib.identity, keyFunc);

        bars.enter().append('g')
            .classed('point', true);

        bars.exit().remove();

        bars.each(function(di, i) {
            var bar = d3.select(this);

            // now display the bar
            // clipped xf/yf (2nd arg true): non-positive
            // log values go off-screen by plotwidth
            // so you see them continue if you drag the plot
            var xy = getXY(di, xa, ya, isHorizontal);

            var x0 = xy[0][0];
            var x1 = xy[0][1];
            var y0 = xy[1][0];
            var y1 = xy[1][1];

            // empty bars
            var isBlank = (isHorizontal ? x1 - x0 : y1 - y0) === 0;

            // display zeros if line.width > 0
            if(isBlank && shouldDisplayZeros && helpers.getLineWidth(trace, di)) {
                isBlank = false;
            }

            // skip nulls
            if(!isBlank) {
                isBlank = (
                    !isNumeric(x0) ||
                    !isNumeric(x1) ||
                    !isNumeric(y0) ||
                    !isNumeric(y1)
                );
            }

            // record isBlank
            di.isBlank = isBlank;

            // for blank bars, ensure start and end positions are equal - important for smooth transitions
            if(isBlank) {
                if(isHorizontal) {
                    x1 = x0;
                } else {
                    y1 = y0;
                }
            }

            // in waterfall mode `between` we need to adjust bar end points to match the connector width
            if(adjustPixel && !isBlank) {
                if(isHorizontal) {
                    x0 -= dirSign(x0, x1) * adjustPixel;
                    x1 += dirSign(x0, x1) * adjustPixel;
                } else {
                    y0 -= dirSign(y0, y1) * adjustPixel;
                    y1 += dirSign(y0, y1) * adjustPixel;
                }
            }

            var lw;
            var mc;

            if(trace.type === 'waterfall') {
                if(!isBlank) {
                    var cont = trace[di.dir].marker;
                    lw = cont.line.width;
                    mc = cont.color;
                }
            } else {
                lw = helpers.getLineWidth(trace, di);
                mc = di.mc || trace.marker.color;
            }

            function roundWithLine(v) {
                var offset = d3.round((lw / 2) % 1, 2);

                // if there are explicit gaps, don't round,
                // it can make the gaps look crappy
                return (opts.gap === 0 && opts.groupgap === 0) ?
                    d3.round(Math.round(v) - offset, 2) : v;
            }

            function expandToVisible(v, vc, hideZeroSpan) {
                if(hideZeroSpan && v === vc) {
                    // should not expand zero span bars
                    // when start and end positions are identical
                    // i.e. for vertical when y0 === y1
                    // and for horizontal when x0 === x1
                    return v;
                }

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

                var op = Color.opacity(mc);
                var fixpx = (op < 1 || lw > 0.01) ? roundWithLine : expandToVisible;

                x0 = fixpx(x0, x1, isHorizontal);
                x1 = fixpx(x1, x0, isHorizontal);
                y0 = fixpx(y0, y1, !isHorizontal);
                y1 = fixpx(y1, y0, !isHorizontal);
            }

            var sel = transition(Lib.ensureSingle(bar, 'path'), fullLayout, opts, makeOnCompleteCallback);
            sel
                .style('vector-effect', 'non-scaling-stroke')
                .attr('d', (isNaN((x1 - x0) * (y1 - y0)) || (isBlank && gd._context.staticPlot)) ? 'M0,0Z' : 'M' + x0 + ',' + y0 + 'V' + y1 + 'H' + x1 + 'V' + y0 + 'Z')
                .call(Drawing.setClipUrl, plotinfo.layerClipId, gd);

            if(!fullLayout.uniformtext.mode && withTransition) {
                var styleFns = Drawing.makePointStyleFns(trace);
                Drawing.singlePointStyle(di, sel, trace, styleFns, gd);
            }

            appendBarText(gd, plotinfo, bar, cd, i, x0, x1, y0, y1, opts, makeOnCompleteCallback);

            if(plotinfo.layerClipId) {
                Drawing.hideOutsideRangePoint(di, bar.select('text'), xa, ya, trace.xcalendar, trace.ycalendar);
            }
        });

        // lastly, clip points groups of `cliponaxis !== false` traces
        // on `plotinfo._hasClipOnAxisFalse === true` subplots
        var hasClipOnAxisFalse = trace.cliponaxis === false;
        Drawing.setClipUrl(plotGroup, hasClipOnAxisFalse ? null : plotinfo.layerClipId, gd);
    });

    // error bars are on the top
    Registry.getComponentMethod('errorbars', 'plot')(gd, bartraces, plotinfo, opts);
}

function appendBarText(gd, plotinfo, bar, cd, i, x0, x1, y0, y1, opts, makeOnCompleteCallback) {
    var xa = plotinfo.xaxis;
    var ya = plotinfo.yaxis;

    var fullLayout = gd._fullLayout;
    var textPosition;

    function appendTextNode(bar, text, font) {
        var textSelection = Lib.ensureSingle(bar, 'text')
            .text(text)
            .attr({
                'class': 'bartext bartext-' + textPosition,
                'text-anchor': 'middle',
                // prohibit tex interpretation until we can handle
                // tex and regular text together
                'data-notex': 1
            })
            .call(Drawing.font, font)
            .call(svgTextUtils.convertToTspans, gd);

        return textSelection;
    }

    // get trace attributes
    var trace = cd[0].trace;
    var isHorizontal = (trace.orientation === 'h');

    var text = getText(fullLayout, cd, i, xa, ya);
    textPosition = getTextPosition(trace, i);

    // compute text position
    var inStackOrRelativeMode =
        opts.mode === 'stack' ||
        opts.mode === 'relative';

    var calcBar = cd[i];
    var isOutmostBar = !inStackOrRelativeMode || calcBar._outmost;

    if(!text ||
        textPosition === 'none' ||
        ((calcBar.isBlank || x0 === x1 || y0 === y1) && (
            textPosition === 'auto' ||
            textPosition === 'inside'))) {
        bar.select('text').remove();
        return;
    }

    var layoutFont = fullLayout.font;
    var barColor = style.getBarColor(cd[i], trace);
    var insideTextFont = style.getInsideTextFont(trace, i, layoutFont, barColor);
    var outsideTextFont = style.getOutsideTextFont(trace, i, layoutFont);

    // Special case: don't use the c2p(v, true) value on log size axes,
    // so that we can get correctly inside text scaling
    var di = bar.datum();
    if(isHorizontal) {
        if(xa.type === 'log' && di.s0 <= 0) {
            if(xa.range[0] < xa.range[1]) {
                x0 = 0;
            } else {
                x0 = xa._length;
            }
        }
    } else {
        if(ya.type === 'log' && di.s0 <= 0) {
            if(ya.range[0] < ya.range[1]) {
                y0 = ya._length;
            } else {
                y0 = 0;
            }
        }
    }

    // padding excluded
    var barWidth = Math.abs(x1 - x0) - 2 * TEXTPAD;
    var barHeight = Math.abs(y1 - y0) - 2 * TEXTPAD;

    var textSelection;
    var textBB;
    var textWidth;
    var textHeight;
    var font;

    if(textPosition === 'outside') {
        if(!isOutmostBar && !calcBar.hasB) textPosition = 'inside';
    }

    if(textPosition === 'auto') {
        if(isOutmostBar) {
            // draw text using insideTextFont and check if it fits inside bar
            textPosition = 'inside';

            font = Lib.ensureUniformFontSize(gd, insideTextFont);

            textSelection = appendTextNode(bar, text, font);

            textBB = Drawing.bBox(textSelection.node()),
            textWidth = textBB.width,
            textHeight = textBB.height;

            var textHasSize = (textWidth > 0 && textHeight > 0);
            var fitsInside = (textWidth <= barWidth && textHeight <= barHeight);
            var fitsInsideIfRotated = (textWidth <= barHeight && textHeight <= barWidth);
            var fitsInsideIfShrunk = (isHorizontal) ?
                (barWidth >= textWidth * (barHeight / textHeight)) :
                (barHeight >= textHeight * (barWidth / textWidth));

            if(textHasSize && (
                fitsInside ||
                fitsInsideIfRotated ||
                fitsInsideIfShrunk)
            ) {
                textPosition = 'inside';
            } else {
                textPosition = 'outside';
                textSelection.remove();
                textSelection = null;
            }
        } else {
            textPosition = 'inside';
        }
    }

    if(!textSelection) {
        font = Lib.ensureUniformFontSize(gd, (textPosition === 'outside') ? outsideTextFont : insideTextFont);

        textSelection = appendTextNode(bar, text, font);

        var currentTransform = textSelection.attr('transform');
        textSelection.attr('transform', '');
        textBB = Drawing.bBox(textSelection.node()),
        textWidth = textBB.width,
        textHeight = textBB.height;
        textSelection.attr('transform', currentTransform);

        if(textWidth <= 0 || textHeight <= 0) {
            textSelection.remove();
            return;
        }
    }

    var angle = trace.textangle;

    // compute text transform
    var transform, constrained;
    if(textPosition === 'outside') {
        constrained =
            trace.constraintext === 'both' ||
            trace.constraintext === 'outside';

        transform = toMoveOutsideBar(x0, x1, y0, y1, textBB, {
            isHorizontal: isHorizontal,
            constrained: constrained,
            angle: angle
        });
    } else {
        constrained =
            trace.constraintext === 'both' ||
            trace.constraintext === 'inside';

        transform = toMoveInsideBar(x0, x1, y0, y1, textBB, {
            isHorizontal: isHorizontal,
            constrained: constrained,
            angle: angle,
            anchor: trace.insidetextanchor
        });
    }

    transform.fontSize = font.size;
    recordMinTextSize(trace.type, transform, fullLayout);
    calcBar.transform = transform;

    transition(textSelection, fullLayout, opts, makeOnCompleteCallback)
        .attr('transform', Lib.getTextTransform(transform));
}

function getRotateFromAngle(angle) {
    return (angle === 'auto') ? 0 : angle;
}

function getRotatedTextSize(textBB, rotate) {
    var a = Math.PI / 180 * rotate;
    var absSin = Math.abs(Math.sin(a));
    var absCos = Math.abs(Math.cos(a));

    return {
        x: textBB.width * absCos + textBB.height * absSin,
        y: textBB.width * absSin + textBB.height * absCos
    };
}

function toMoveInsideBar(x0, x1, y0, y1, textBB, opts) {
    var isHorizontal = !!opts.isHorizontal;
    var constrained = !!opts.constrained;
    var angle = opts.angle || 0;
    var anchor = opts.anchor || 'end';
    var isEnd = anchor === 'end';
    var isStart = anchor === 'start';
    var leftToRight = opts.leftToRight || 0; // left: -1, center: 0, right: 1
    var toRight = (leftToRight + 1) / 2;
    var toLeft = 1 - toRight;

    var textWidth = textBB.width;
    var textHeight = textBB.height;
    var lx = Math.abs(x1 - x0);
    var ly = Math.abs(y1 - y0);

    // compute remaining space
    var textpad = (
        lx > (2 * TEXTPAD) &&
        ly > (2 * TEXTPAD)
    ) ? TEXTPAD : 0;

    lx -= 2 * textpad;
    ly -= 2 * textpad;

    var rotate = getRotateFromAngle(angle);
    if((angle === 'auto') &&
        !(textWidth <= lx && textHeight <= ly) &&
        (textWidth > lx || textHeight > ly) && (
        !(textWidth > ly || textHeight > lx) ||
        ((textWidth < textHeight) !== (lx < ly))
    )) {
        rotate += 90;
    }

    var t = getRotatedTextSize(textBB, rotate);

    var scale = 1;
    if(constrained) {
        scale = Math.min(
            1,
            lx / t.x,
            ly / t.y
        );
    }

    // compute text and target positions
    var textX = (
        textBB.left * toLeft +
        textBB.right * toRight
    );
    var textY = (textBB.top + textBB.bottom) / 2;
    var targetX = (
        (x0 + TEXTPAD) * toLeft +
        (x1 - TEXTPAD) * toRight
    );
    var targetY = (y0 + y1) / 2;
    var anchorX = 0;
    var anchorY = 0;
    if(isStart || isEnd) {
        var extrapad = (isHorizontal ? t.x : t.y) / 2;
        var dir = isHorizontal ? dirSign(x0, x1) : dirSign(y0, y1);

        if(isHorizontal) {
            if(isStart) {
                targetX = x0 + dir * textpad;
                anchorX = -dir * extrapad;
            } else {
                targetX = x1 - dir * textpad;
                anchorX = dir * extrapad;
            }
        } else {
            if(isStart) {
                targetY = y0 + dir * textpad;
                anchorY = -dir * extrapad;
            } else {
                targetY = y1 - dir * textpad;
                anchorY = dir * extrapad;
            }
        }
    }

    return {
        textX: textX,
        textY: textY,
        targetX: targetX,
        targetY: targetY,
        anchorX: anchorX,
        anchorY: anchorY,
        scale: scale,
        rotate: rotate
    };
}

function toMoveOutsideBar(x0, x1, y0, y1, textBB, opts) {
    var isHorizontal = !!opts.isHorizontal;
    var constrained = !!opts.constrained;
    var angle = opts.angle || 0;

    var textWidth = textBB.width;
    var textHeight = textBB.height;
    var lx = Math.abs(x1 - x0);
    var ly = Math.abs(y1 - y0);

    var textpad;
    // Keep the padding so the text doesn't sit right against
    // the bars, but don't factor it into barWidth
    if(isHorizontal) {
        textpad = (ly > 2 * TEXTPAD) ? TEXTPAD : 0;
    } else {
        textpad = (lx > 2 * TEXTPAD) ? TEXTPAD : 0;
    }

    // compute rotate and scale
    var scale = 1;
    if(constrained) {
        scale = (isHorizontal) ?
            Math.min(1, ly / textHeight) :
            Math.min(1, lx / textWidth);
    }

    var rotate = getRotateFromAngle(angle);
    var t = getRotatedTextSize(textBB, rotate);

    // compute text and target positions
    var extrapad = (isHorizontal ? t.x : t.y) / 2;
    var textX = (textBB.left + textBB.right) / 2;
    var textY = (textBB.top + textBB.bottom) / 2;
    var targetX = (x0 + x1) / 2;
    var targetY = (y0 + y1) / 2;
    var anchorX = 0;
    var anchorY = 0;

    var dir = isHorizontal ? dirSign(x1, x0) : dirSign(y0, y1);
    if(isHorizontal) {
        targetX = x1 - dir * textpad;
        anchorX = dir * extrapad;
    } else {
        targetY = y1 + dir * textpad;
        anchorY = -dir * extrapad;
    }

    return {
        textX: textX,
        textY: textY,
        targetX: targetX,
        targetY: targetY,
        anchorX: anchorX,
        anchorY: anchorY,
        scale: scale,
        rotate: rotate
    };
}

function getText(fullLayout, cd, index, xa, ya) {
    var trace = cd[0].trace;
    var texttemplate = trace.texttemplate;

    var value;
    if(texttemplate) {
        value = calcTexttemplate(fullLayout, cd, index, xa, ya);
    } else if(trace.textinfo) {
        value = calcTextinfo(cd, index, xa, ya);
    } else {
        value = helpers.getValue(trace.text, index);
    }

    return helpers.coerceString(attributeText, value);
}

function getTextPosition(trace, index) {
    var value = helpers.getValue(trace.textposition, index);
    return helpers.coerceEnumerated(attributeTextPosition, value);
}

function calcTexttemplate(fullLayout, cd, index, xa, ya) {
    var trace = cd[0].trace;
    var texttemplate = Lib.castOption(trace, index, 'texttemplate');
    if(!texttemplate) return '';
    var isWaterfall = (trace.type === 'waterfall');
    var isFunnel = (trace.type === 'funnel');

    var pLetter, pAxis;
    var vLetter, vAxis;
    if(trace.orientation === 'h') {
        pLetter = 'y';
        pAxis = ya;
        vLetter = 'x';
        vAxis = xa;
    } else {
        pLetter = 'x';
        pAxis = xa;
        vLetter = 'y';
        vAxis = ya;
    }

    function formatLabel(u) {
        return tickText(pAxis, u, true).text;
    }

    function formatNumber(v) {
        return tickText(vAxis, +v, true).text;
    }

    var cdi = cd[index];
    var obj = {};

    obj.label = cdi.p;
    obj.labelLabel = obj[pLetter + 'Label'] = formatLabel(cdi.p);

    var tx = Lib.castOption(trace, cdi.i, 'text');
    if(tx === 0 || tx) obj.text = tx;

    obj.value = cdi.s;
    obj.valueLabel = obj[vLetter + 'Label'] = formatNumber(cdi.s);

    var pt = {};
    appendArrayPointValue(pt, trace, cdi.i);

    if(isWaterfall) {
        obj.delta = +cdi.rawS || cdi.s;
        obj.deltaLabel = formatNumber(obj.delta);
        obj.final = cdi.v;
        obj.finalLabel = formatNumber(obj.final);
        obj.initial = obj.final - obj.delta;
        obj.initialLabel = formatNumber(obj.initial);
    }

    if(isFunnel) {
        obj.value = cdi.s;
        obj.valueLabel = formatNumber(obj.value);

        obj.percentInitial = cdi.begR;
        obj.percentInitialLabel = Lib.formatPercent(cdi.begR);
        obj.percentPrevious = cdi.difR;
        obj.percentPreviousLabel = Lib.formatPercent(cdi.difR);
        obj.percentTotal = cdi.sumR;
        obj.percenTotalLabel = Lib.formatPercent(cdi.sumR);
    }

    var customdata = Lib.castOption(trace, cdi.i, 'customdata');
    if(customdata) obj.customdata = customdata;
    return Lib.texttemplateString(texttemplate, obj, fullLayout._d3locale, pt, obj, trace._meta || {});
}

function calcTextinfo(cd, index, xa, ya) {
    var trace = cd[0].trace;
    var isHorizontal = (trace.orientation === 'h');
    var isWaterfall = (trace.type === 'waterfall');
    var isFunnel = (trace.type === 'funnel');

    function formatLabel(u) {
        var pAxis = isHorizontal ? ya : xa;
        return tickText(pAxis, u, true).text;
    }

    function formatNumber(v) {
        var sAxis = isHorizontal ? xa : ya;
        return tickText(sAxis, +v, true).text;
    }

    var textinfo = trace.textinfo;
    var cdi = cd[index];

    var parts = textinfo.split('+');
    var text = [];
    var tx;

    var hasFlag = function(flag) { return parts.indexOf(flag) !== -1; };

    if(hasFlag('label')) {
        text.push(formatLabel(cd[index].p));
    }

    if(hasFlag('text')) {
        tx = Lib.castOption(trace, cdi.i, 'text');
        if(tx === 0 || tx) text.push(tx);
    }

    if(isWaterfall) {
        var delta = +cdi.rawS || cdi.s;
        var final = cdi.v;
        var initial = final - delta;

        if(hasFlag('initial')) text.push(formatNumber(initial));
        if(hasFlag('delta')) text.push(formatNumber(delta));
        if(hasFlag('final')) text.push(formatNumber(final));
    }

    if(isFunnel) {
        if(hasFlag('value')) text.push(formatNumber(cdi.s));

        var nPercent = 0;
        if(hasFlag('percent initial')) nPercent++;
        if(hasFlag('percent previous')) nPercent++;
        if(hasFlag('percent total')) nPercent++;

        var hasMultiplePercents = nPercent > 1;

        if(hasFlag('percent initial')) {
            tx = Lib.formatPercent(cdi.begR);
            if(hasMultiplePercents) tx += ' of initial';
            text.push(tx);
        }
        if(hasFlag('percent previous')) {
            tx = Lib.formatPercent(cdi.difR);
            if(hasMultiplePercents) tx += ' of previous';
            text.push(tx);
        }
        if(hasFlag('percent total')) {
            tx = Lib.formatPercent(cdi.sumR);
            if(hasMultiplePercents) tx += ' of total';
            text.push(tx);
        }
    }

    return text.join('<br>');
}

module.exports = {
    plot: plot,
    toMoveInsideBar: toMoveInsideBar
};
