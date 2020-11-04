/**
* Copyright 2012-2020, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var d3 = require('d3');

var Lib = require('../../lib');
var Plots = require('../../plots/plots');
var Registry = require('../../registry');
var Events = require('../../lib/events');
var dragElement = require('../dragelement');
var Drawing = require('../drawing');
var Color = require('../color');
var svgTextUtils = require('../../lib/svg_text_utils');
var handleClick = require('./handle_click');

var constants = require('./constants');
var alignmentConstants = require('../../constants/alignment');
var LINE_SPACING = alignmentConstants.LINE_SPACING;
var FROM_TL = alignmentConstants.FROM_TL;
var FROM_BR = alignmentConstants.FROM_BR;

var getLegendData = require('./get_legend_data');
var style = require('./style');
var helpers = require('./helpers');

module.exports = function draw(gd, opts) {
    var fullLayout = gd._fullLayout;
    var clipId = 'legend' + fullLayout._uid;
    var layer;

    // Check whether this is the main legend (ie. called without any opts)
    if(!opts) {
        opts = fullLayout.legend || {};
        opts._main = true;
        layer = fullLayout._infolayer;
    } else {
        layer = opts.layer;
        clipId += '-hover';
    }

    if(!layer) return;

    if(!gd._legendMouseDownTime) gd._legendMouseDownTime = 0;

    var legendData;
    if(opts._main) {
        if(!gd.calcdata) return;
        legendData = fullLayout.showlegend && getLegendData(gd.calcdata, opts);
    } else {
        if(!opts.entries) return;
        legendData = getLegendData(opts.entries, opts);
    }

    var hiddenSlices = fullLayout.hiddenlabels || [];

    if(opts._main && (!fullLayout.showlegend || !legendData.length)) {
        layer.selectAll('.legend').remove();
        fullLayout._topdefs.select('#' + clipId).remove();
        return Plots.autoMargin(gd, 'legend');
    }

    var legend = Lib.ensureSingle(layer, 'g', 'legend', function(s) {
        if(opts._main) s.attr('pointer-events', 'all');
    });

    var clipPath = Lib.ensureSingleById(fullLayout._topdefs, 'clipPath', clipId, function(s) {
        s.append('rect');
    });

    var bg = Lib.ensureSingle(legend, 'rect', 'bg', function(s) {
        s.attr('shape-rendering', 'crispEdges');
    });
    bg.call(Color.stroke, opts.bordercolor)
        .call(Color.fill, opts.bgcolor)
        .style('stroke-width', opts.borderwidth + 'px');

    var scrollBox = Lib.ensureSingle(legend, 'g', 'scrollbox');

    var title = opts.title;
    opts._titleWidth = 0;
    opts._titleHeight = 0;
    if(title.text) {
        var titleEl = Lib.ensureSingle(scrollBox, 'text', 'legendtitletext');
        titleEl.attr('text-anchor', 'start')
            .call(Drawing.font, title.font)
            .text(title.text);

        textLayout(titleEl, scrollBox, gd, opts); // handle mathjax or multi-line text and compute title height
    } else {
        scrollBox.selectAll('.legendtitletext').remove();
    }

    var scrollBar = Lib.ensureSingle(legend, 'rect', 'scrollbar', function(s) {
        s.attr(constants.scrollBarEnterAttrs)
         .call(Color.fill, constants.scrollBarColor);
    });

    var groups = scrollBox.selectAll('g.groups').data(legendData);
    groups.enter().append('g').attr('class', 'groups');
    groups.exit().remove();

    var traces = groups.selectAll('g.traces').data(Lib.identity);
    traces.enter().append('g').attr('class', 'traces');
    traces.exit().remove();

    traces.style('opacity', function(d) {
        var trace = d[0].trace;
        if(Registry.traceIs(trace, 'pie-like')) {
            return hiddenSlices.indexOf(d[0].label) !== -1 ? 0.5 : 1;
        } else {
            return trace.visible === 'legendonly' ? 0.5 : 1;
        }
    })
    .each(function() { d3.select(this).call(drawTexts, gd, opts); })
    .call(style, gd, opts)
    .each(function() { if(opts._main) d3.select(this).call(setupTraceToggle, gd); });

    Lib.syncOrAsync([
        Plots.previousPromises,
        function() { return computeLegendDimensions(gd, groups, traces, opts); },
        function() {
            // IF expandMargin return a Promise (which is truthy),
            // we're under a doAutoMargin redraw, so we don't have to
            // draw the remaining pieces below
            if(opts._main && expandMargin(gd)) return;

            var gs = fullLayout._size;
            var bw = opts.borderwidth;

            var lx = gs.l + gs.w * opts.x - FROM_TL[getXanchor(opts)] * opts._width;
            var ly = gs.t + gs.h * (1 - opts.y) - FROM_TL[getYanchor(opts)] * opts._effHeight;

            if(opts._main && fullLayout.margin.autoexpand) {
                var lx0 = lx;
                var ly0 = ly;

                lx = Lib.constrain(lx, 0, fullLayout.width - opts._width);
                ly = Lib.constrain(ly, 0, fullLayout.height - opts._effHeight);

                if(lx !== lx0) {
                    Lib.log('Constrain legend.x to make legend fit inside graph');
                }
                if(ly !== ly0) {
                    Lib.log('Constrain legend.y to make legend fit inside graph');
                }
            }

            // Set size and position of all the elements that make up a legend:
            // legend, background and border, scroll box and scroll bar as well as title
            if(opts._main) Drawing.setTranslate(legend, lx, ly);

            // to be safe, remove previous listeners
            scrollBar.on('.drag', null);
            legend.on('wheel', null);

            if(!opts._main || opts._height <= opts._maxHeight || gd._context.staticPlot) {
                // if scrollbar should not be shown.
                var height = opts._effHeight;

                // if not the main legend, let it be its full size
                if(!opts._main) height = opts._height;

                bg.attr({
                    width: opts._width - bw,
                    height: height - bw,
                    x: bw / 2,
                    y: bw / 2
                });

                Drawing.setTranslate(scrollBox, 0, 0);

                clipPath.select('rect').attr({
                    width: opts._width - 2 * bw,
                    height: height - 2 * bw,
                    x: bw,
                    y: bw
                });

                Drawing.setClipUrl(scrollBox, clipId, gd);

                Drawing.setRect(scrollBar, 0, 0, 0, 0);
                delete opts._scrollY;
            } else {
                var scrollBarHeight = Math.max(constants.scrollBarMinHeight,
                    opts._effHeight * opts._effHeight / opts._height);
                var scrollBarYMax = opts._effHeight -
                    scrollBarHeight -
                    2 * constants.scrollBarMargin;
                var scrollBoxYMax = opts._height - opts._effHeight;
                var scrollRatio = scrollBarYMax / scrollBoxYMax;

                var scrollBoxY = Math.min(opts._scrollY || 0, scrollBoxYMax);

                // increase the background and clip-path width
                // by the scrollbar width and margin
                bg.attr({
                    width: opts._width -
                        2 * bw +
                        constants.scrollBarWidth +
                        constants.scrollBarMargin,
                    height: opts._effHeight - bw,
                    x: bw / 2,
                    y: bw / 2
                });

                clipPath.select('rect').attr({
                    width: opts._width -
                        2 * bw +
                        constants.scrollBarWidth +
                        constants.scrollBarMargin,
                    height: opts._effHeight - 2 * bw,
                    x: bw,
                    y: bw + scrollBoxY
                });

                Drawing.setClipUrl(scrollBox, clipId, gd);

                scrollHandler(scrollBoxY, scrollBarHeight, scrollRatio);

                // scroll legend by mousewheel or touchpad swipe up/down
                legend.on('wheel', function() {
                    scrollBoxY = Lib.constrain(
                        opts._scrollY +
                            ((d3.event.deltaY / scrollBarYMax) * scrollBoxYMax),
                        0, scrollBoxYMax);
                    scrollHandler(scrollBoxY, scrollBarHeight, scrollRatio);
                    if(scrollBoxY !== 0 && scrollBoxY !== scrollBoxYMax) {
                        d3.event.preventDefault();
                    }
                });

                var eventY0, eventY1, scrollBoxY0;

                var getScrollBarDragY = function(scrollBoxY0, eventY0, eventY1) {
                    var y = ((eventY1 - eventY0) / scrollRatio) + scrollBoxY0;
                    return Lib.constrain(y, 0, scrollBoxYMax);
                };

                var getNaturalDragY = function(scrollBoxY0, eventY0, eventY1) {
                    var y = ((eventY0 - eventY1) / scrollRatio) + scrollBoxY0;
                    return Lib.constrain(y, 0, scrollBoxYMax);
                };

                // scroll legend by dragging scrollBAR
                var scrollBarDrag = d3.behavior.drag()
                .on('dragstart', function() {
                    var e = d3.event.sourceEvent;
                    if(e.type === 'touchstart') {
                        eventY0 = e.changedTouches[0].clientY;
                    } else {
                        eventY0 = e.clientY;
                    }
                    scrollBoxY0 = scrollBoxY;
                })
                .on('drag', function() {
                    var e = d3.event.sourceEvent;
                    if(e.buttons === 2 || e.ctrlKey) return;
                    if(e.type === 'touchmove') {
                        eventY1 = e.changedTouches[0].clientY;
                    } else {
                        eventY1 = e.clientY;
                    }
                    scrollBoxY = getScrollBarDragY(scrollBoxY0, eventY0, eventY1);
                    scrollHandler(scrollBoxY, scrollBarHeight, scrollRatio);
                });
                scrollBar.call(scrollBarDrag);

                // scroll legend by touch-dragging scrollBOX
                var scrollBoxTouchDrag = d3.behavior.drag()
                .on('dragstart', function() {
                    var e = d3.event.sourceEvent;
                    if(e.type === 'touchstart') {
                        eventY0 = e.changedTouches[0].clientY;
                        scrollBoxY0 = scrollBoxY;
                    }
                })
                .on('drag', function() {
                    var e = d3.event.sourceEvent;
                    if(e.type === 'touchmove') {
                        eventY1 = e.changedTouches[0].clientY;
                        scrollBoxY = getNaturalDragY(scrollBoxY0, eventY0, eventY1);
                        scrollHandler(scrollBoxY, scrollBarHeight, scrollRatio);
                    }
                });
                scrollBox.call(scrollBoxTouchDrag);
            }

            function scrollHandler(scrollBoxY, scrollBarHeight, scrollRatio) {
                opts._scrollY = gd._fullLayout.legend._scrollY = scrollBoxY;
                Drawing.setTranslate(scrollBox, 0, -scrollBoxY);

                Drawing.setRect(
                    scrollBar,
                    opts._width,
                    constants.scrollBarMargin + scrollBoxY * scrollRatio,
                    constants.scrollBarWidth,
                    scrollBarHeight
                );
                clipPath.select('rect').attr('y', bw + scrollBoxY);
            }

            if(gd._context.edits.legendPosition) {
                var xf, yf, x0, y0;

                legend.classed('cursor-move', true);

                dragElement.init({
                    element: legend.node(),
                    gd: gd,
                    prepFn: function() {
                        var transform = Drawing.getTranslate(legend);
                        x0 = transform.x;
                        y0 = transform.y;
                    },
                    moveFn: function(dx, dy) {
                        var newX = x0 + dx;
                        var newY = y0 + dy;

                        Drawing.setTranslate(legend, newX, newY);

                        xf = dragElement.align(newX, 0, gs.l, gs.l + gs.w, opts.xanchor);
                        yf = dragElement.align(newY, 0, gs.t + gs.h, gs.t, opts.yanchor);
                    },
                    doneFn: function() {
                        if(xf !== undefined && yf !== undefined) {
                            Registry.call('_guiRelayout', gd, {'legend.x': xf, 'legend.y': yf});
                        }
                    },
                    clickFn: function(numClicks, e) {
                        var clickedTrace = layer.selectAll('g.traces').filter(function() {
                            var bbox = this.getBoundingClientRect();
                            return (
                                e.clientX >= bbox.left && e.clientX <= bbox.right &&
                                e.clientY >= bbox.top && e.clientY <= bbox.bottom
                            );
                        });
                        if(clickedTrace.size() > 0) {
                            clickOrDoubleClick(gd, legend, clickedTrace, numClicks, e);
                        }
                    }
                });
            }
        }], gd);
};

function clickOrDoubleClick(gd, legend, legendItem, numClicks, evt) {
    var trace = legendItem.data()[0][0].trace;
    var evtData = {
        event: evt,
        node: legendItem.node(),
        curveNumber: trace.index,
        expandedIndex: trace._expandedIndex,
        data: gd.data,
        layout: gd.layout,
        frames: gd._transitionData._frames,
        config: gd._context,
        fullData: gd._fullData,
        fullLayout: gd._fullLayout
    };

    if(trace._group) {
        evtData.group = trace._group;
    }
    if(Registry.traceIs(trace, 'pie-like')) {
        evtData.label = legendItem.datum()[0].label;
    }

    var clickVal = Events.triggerHandler(gd, 'plotly_legendclick', evtData);
    if(clickVal === false) return;

    if(numClicks === 1) {
        legend._clickTimeout = setTimeout(function() {
            handleClick(legendItem, gd, numClicks);
        }, gd._context.doubleClickDelay);
    } else if(numClicks === 2) {
        if(legend._clickTimeout) clearTimeout(legend._clickTimeout);
        gd._legendMouseDownTime = 0;

        var dblClickVal = Events.triggerHandler(gd, 'plotly_legenddoubleclick', evtData);
        if(dblClickVal !== false) handleClick(legendItem, gd, numClicks);
    }
}

function drawTexts(g, gd, opts) {
    var legendItem = g.data()[0][0];
    var trace = legendItem.trace;
    var isPieLike = Registry.traceIs(trace, 'pie-like');
    var traceIndex = trace.index;
    var isEditable = opts._main && gd._context.edits.legendText && !isPieLike;
    var maxNameLength = opts._maxNameLength;

    var name;
    if(!opts.entries) {
        name = isPieLike ? legendItem.label : trace.name;
        if(trace._meta) {
            name = Lib.templateString(name, trace._meta);
        }
    } else {
        name = legendItem.text;
    }

    var textEl = Lib.ensureSingle(g, 'text', 'legendtext');

    textEl.attr('text-anchor', 'start')
        .call(Drawing.font, opts.font)
        .text(isEditable ? ensureLength(name, maxNameLength) : name);

    var textGap = opts.itemwidth + constants.itemGap * 2;
    svgTextUtils.positionText(textEl, textGap, 0);

    if(isEditable) {
        textEl.call(svgTextUtils.makeEditable, {gd: gd, text: name})
            .call(textLayout, g, gd, opts)
            .on('edit', function(newName) {
                this.text(ensureLength(newName, maxNameLength))
                    .call(textLayout, g, gd, opts);

                var fullInput = legendItem.trace._fullInput || {};
                var update = {};

                if(Registry.hasTransform(fullInput, 'groupby')) {
                    var groupbyIndices = Registry.getTransformIndices(fullInput, 'groupby');
                    var index = groupbyIndices[groupbyIndices.length - 1];

                    var kcont = Lib.keyedContainer(fullInput, 'transforms[' + index + '].styles', 'target', 'value.name');

                    kcont.set(legendItem.trace._group, newName);

                    update = kcont.constructUpdate();
                } else {
                    update.name = newName;
                }

                return Registry.call('_guiRestyle', gd, update, traceIndex);
            });
    } else {
        textLayout(textEl, g, gd, opts);
    }
}

/*
 * Make sure we have a reasonably clickable region.
 * If this string is missing or very short, pad it with spaces out to at least
 * 4 characters, up to the max length of other labels, on the assumption that
 * most characters are wider than spaces so a string of spaces will usually be
 * no wider than the real labels.
 */
function ensureLength(str, maxLength) {
    var targetLength = Math.max(4, maxLength);
    if(str && str.trim().length >= targetLength / 2) return str;
    str = str || '';
    for(var i = targetLength - str.length; i > 0; i--) str += ' ';
    return str;
}

function setupTraceToggle(g, gd) {
    var doubleClickDelay = gd._context.doubleClickDelay;
    var newMouseDownTime;
    var numClicks = 1;

    var traceToggle = Lib.ensureSingle(g, 'rect', 'legendtoggle', function(s) {
        if(!gd._context.staticPlot) {
            s.style('cursor', 'pointer').attr('pointer-events', 'all');
        }
        s.call(Color.fill, 'rgba(0,0,0,0)');
    });

    if(gd._context.staticPlot) return;

    traceToggle.on('mousedown', function() {
        newMouseDownTime = (new Date()).getTime();
        if(newMouseDownTime - gd._legendMouseDownTime < doubleClickDelay) {
            // in a click train
            numClicks += 1;
        } else {
            // new click train
            numClicks = 1;
            gd._legendMouseDownTime = newMouseDownTime;
        }
    });
    traceToggle.on('mouseup', function() {
        if(gd._dragged || gd._editing) return;
        var legend = gd._fullLayout.legend;

        if((new Date()).getTime() - gd._legendMouseDownTime > doubleClickDelay) {
            numClicks = Math.max(numClicks - 1, 1);
        }

        clickOrDoubleClick(gd, legend, g, numClicks, d3.event);
    });
}

function textLayout(s, g, gd, opts) {
    if(!opts._main) s.attr('data-notex', true); // do not process MathJax if not main
    svgTextUtils.convertToTspans(s, gd, function() {
        computeTextDimensions(g, gd, opts);
    });
}

function computeTextDimensions(g, gd, opts) {
    var legendItem = g.data()[0][0];
    if(opts._main && legendItem && !legendItem.trace.showlegend) {
        g.remove();
        return;
    }

    var mathjaxGroup = g.select('g[class*=math-group]');
    var mathjaxNode = mathjaxGroup.node();
    if(!opts) opts = gd._fullLayout.legend;
    var bw = opts.borderwidth;
    var lineHeight = (legendItem ? opts : opts.title).font.size * LINE_SPACING;
    var height, width;

    if(mathjaxNode) {
        var mathjaxBB = Drawing.bBox(mathjaxNode);

        height = mathjaxBB.height;
        width = mathjaxBB.width;

        if(legendItem) {
            Drawing.setTranslate(mathjaxGroup, 0, height * 0.25);
        } else { // case of title
            Drawing.setTranslate(mathjaxGroup, bw, height * 0.75 + bw);
        }
    } else {
        var textEl = g.select(legendItem ?
            '.legendtext' : '.legendtitletext'
        );
        var textLines = svgTextUtils.lineCount(textEl);
        var textNode = textEl.node();

        height = lineHeight * textLines;
        width = textNode ? Drawing.bBox(textNode).width : 0;

        // approximation to height offset to center the font
        // to avoid getBoundingClientRect
        var textY = lineHeight * ((textLines - 1) / 2 - 0.3);
        if(legendItem) {
            var textGap = opts.itemwidth + constants.itemGap * 2;
            svgTextUtils.positionText(textEl, textGap, -textY);
        } else { // case of title
            svgTextUtils.positionText(textEl, constants.titlePad + bw, lineHeight + bw);
        }
    }

    if(legendItem) {
        legendItem.lineHeight = lineHeight;
        legendItem.height = Math.max(height, 16) + 3;
        legendItem.width = width;
    } else { // case of title
        opts._titleWidth = width;
        opts._titleHeight = height;
    }
}

function getTitleSize(opts) {
    var w = 0;
    var h = 0;

    var side = opts.title.side;
    if(side) {
        if(side.indexOf('left') !== -1) {
            w = opts._titleWidth;
        }
        if(side.indexOf('top') !== -1) {
            h = opts._titleHeight;
        }
    }

    return [w, h];
}

/*
 * Computes in fullLayout.legend:
 *
 *  - _height: legend height including items past scrollbox height
 *  - _maxHeight: maximum legend height before scrollbox is required
 *  - _effHeight: legend height w/ or w/o scrollbox
 *
 *  - _width: legend width
 *  - _maxWidth (for orientation:h only): maximum width before starting new row
 */
function computeLegendDimensions(gd, groups, traces, opts) {
    var fullLayout = gd._fullLayout;
    if(!opts) opts = fullLayout.legend;
    var gs = fullLayout._size;

    var isVertical = helpers.isVertical(opts);
    var isGrouped = helpers.isGrouped(opts);

    var bw = opts.borderwidth;
    var bw2 = 2 * bw;
    var itemGap = constants.itemGap;
    var textGap = opts.itemwidth + itemGap * 2;
    var endPad = 2 * (bw + itemGap);

    var yanchor = getYanchor(opts);
    var isBelowPlotArea = opts.y < 0 || (opts.y === 0 && yanchor === 'top');
    var isAbovePlotArea = opts.y > 1 || (opts.y === 1 && yanchor === 'bottom');

    // - if below/above plot area, give it the maximum potential margin-push value
    // - otherwise, extend the height of the plot area
    opts._maxHeight = Math.max(
        (isBelowPlotArea || isAbovePlotArea) ? fullLayout.height / 2 : gs.h,
        30
    );

    var toggleRectWidth = 0;
    opts._width = 0;
    opts._height = 0;
    var titleSize = getTitleSize(opts);

    if(isVertical) {
        traces.each(function(d) {
            var h = d[0].height;
            Drawing.setTranslate(this,
                bw + titleSize[0],
                bw + titleSize[1] + opts._height + h / 2 + itemGap
            );
            opts._height += h;
            opts._width = Math.max(opts._width, d[0].width);
        });

        toggleRectWidth = textGap + opts._width;
        opts._width += itemGap + textGap + bw2;
        opts._height += endPad;

        if(isGrouped) {
            groups.each(function(d, i) {
                Drawing.setTranslate(this, 0, i * opts.tracegroupgap);
            });
            opts._height += (opts._lgroupsLength - 1) * opts.tracegroupgap;
        }
    } else {
        var xanchor = getXanchor(opts);
        var isLeftOfPlotArea = opts.x < 0 || (opts.x === 0 && xanchor === 'right');
        var isRightOfPlotArea = opts.x > 1 || (opts.x === 1 && xanchor === 'left');
        var isBeyondPlotAreaY = isAbovePlotArea || isBelowPlotArea;
        var hw = fullLayout.width / 2;

        // - if placed within x-margins, extend the width of the plot area
        // - else if below/above plot area and anchored in the margin, extend to opposite margin,
        // - otherwise give it the maximum potential margin-push value
        opts._maxWidth = Math.max(
            isLeftOfPlotArea ? ((isBeyondPlotAreaY && xanchor === 'left') ? gs.l + gs.w : hw) :
            isRightOfPlotArea ? ((isBeyondPlotAreaY && xanchor === 'right') ? gs.r + gs.w : hw) :
            gs.w,
        2 * textGap);
        var maxItemWidth = 0;
        var combinedItemWidth = 0;
        traces.each(function(d) {
            var w = d[0].width + textGap;
            maxItemWidth = Math.max(maxItemWidth, w);
            combinedItemWidth += w;
        });

        toggleRectWidth = null;
        var maxRowWidth = 0;

        if(isGrouped) {
            var maxGroupHeightInRow = 0;
            var groupOffsetX = 0;
            var groupOffsetY = 0;
            groups.each(function() {
                var maxWidthInGroup = 0;
                var offsetY = 0;
                d3.select(this).selectAll('g.traces').each(function(d) {
                    var h = d[0].height;
                    Drawing.setTranslate(this,
                        titleSize[0],
                        titleSize[1] + bw + itemGap + h / 2 + offsetY
                    );
                    offsetY += h;
                    maxWidthInGroup = Math.max(maxWidthInGroup, textGap + d[0].width);
                });
                maxGroupHeightInRow = Math.max(maxGroupHeightInRow, offsetY);

                var next = maxWidthInGroup + itemGap;

                if((next + bw + groupOffsetX) > opts._maxWidth) {
                    maxRowWidth = Math.max(maxRowWidth, groupOffsetX);
                    groupOffsetX = 0;
                    groupOffsetY += maxGroupHeightInRow + opts.tracegroupgap;
                    maxGroupHeightInRow = offsetY;
                }

                Drawing.setTranslate(this, groupOffsetX, groupOffsetY);

                groupOffsetX += next;
            });

            opts._width = Math.max(maxRowWidth, groupOffsetX) + bw;
            opts._height = groupOffsetY + maxGroupHeightInRow + endPad;
        } else {
            var nTraces = traces.size();
            var oneRowLegend = (combinedItemWidth + bw2 + (nTraces - 1) * itemGap) < opts._maxWidth;

            var maxItemHeightInRow = 0;
            var offsetX = 0;
            var offsetY = 0;
            var rowWidth = 0;
            traces.each(function(d) {
                var h = d[0].height;
                var w = textGap + d[0].width;
                var next = (oneRowLegend ? w : maxItemWidth) + itemGap;

                if((next + bw + offsetX - itemGap) >= opts._maxWidth) {
                    maxRowWidth = Math.max(maxRowWidth, rowWidth);
                    offsetX = 0;
                    offsetY += maxItemHeightInRow;
                    opts._height += maxItemHeightInRow;
                    maxItemHeightInRow = 0;
                }

                Drawing.setTranslate(this,
                    titleSize[0] + bw + offsetX,
                    titleSize[1] + bw + offsetY + h / 2 + itemGap
                );

                rowWidth = offsetX + w + itemGap;
                offsetX += next;
                maxItemHeightInRow = Math.max(maxItemHeightInRow, h);
            });

            if(oneRowLegend) {
                opts._width = offsetX + bw2;
                opts._height = maxItemHeightInRow + endPad;
            } else {
                opts._width = Math.max(maxRowWidth, rowWidth) + bw2;
                opts._height += maxItemHeightInRow + endPad;
            }
        }
    }

    opts._width = Math.ceil(
        Math.max(
            opts._width + titleSize[0],
            opts._titleWidth + 2 * (bw + constants.titlePad)
        )
    );

    opts._height = Math.ceil(
        Math.max(
            opts._height + titleSize[1],
            opts._titleHeight + 2 * (bw + constants.itemGap)
        )
    );

    opts._effHeight = Math.min(opts._height, opts._maxHeight);

    var edits = gd._context.edits;
    var isEditable = edits.legendText || edits.legendPosition;
    traces.each(function(d) {
        var traceToggle = d3.select(this).select('.legendtoggle');
        var h = d[0].height;
        var w = isEditable ? textGap : (toggleRectWidth || (textGap + d[0].width));
        if(!isVertical) w += itemGap / 2;
        Drawing.setRect(traceToggle, 0, -h / 2, w, h);
    });
}

function expandMargin(gd) {
    var fullLayout = gd._fullLayout;
    var opts = fullLayout.legend;
    var xanchor = getXanchor(opts);
    var yanchor = getYanchor(opts);

    return Plots.autoMargin(gd, 'legend', {
        x: opts.x,
        y: opts.y,
        l: opts._width * (FROM_TL[xanchor]),
        r: opts._width * (FROM_BR[xanchor]),
        b: opts._effHeight * (FROM_BR[yanchor]),
        t: opts._effHeight * (FROM_TL[yanchor])
    });
}

function getXanchor(opts) {
    return Lib.isRightAnchor(opts) ? 'right' :
        Lib.isCenterAnchor(opts) ? 'center' :
        'left';
}

function getYanchor(opts) {
    return Lib.isBottomAnchor(opts) ? 'bottom' :
        Lib.isMiddleAnchor(opts) ? 'middle' :
        'top';
}
