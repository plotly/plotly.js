'use strict';

var d3 = require('@plotly/d3');

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

var MAIN_TITLE = 1;

module.exports = function draw(gd, opts) {
    if(!opts) opts = gd._fullLayout.legend || {};
    return _draw(gd, opts);
};

function _draw(gd, legendObj) {
    var fullLayout = gd._fullLayout;
    var clipId = 'legend' + fullLayout._uid;
    var layer;

    var inHover = legendObj._inHover;
    if(inHover) {
        layer = legendObj.layer;
        clipId += '-hover';
    } else {
        layer = fullLayout._infolayer;
    }

    if(!layer) return;

    if(!gd._legendMouseDownTime) gd._legendMouseDownTime = 0;

    var legendData;
    if(!inHover) {
        if(!gd.calcdata) return;
        legendData = fullLayout.showlegend && getLegendData(gd.calcdata, legendObj);
    } else {
        if(!legendObj.entries) return;
        legendData = getLegendData(legendObj.entries, legendObj);
    }

    var hiddenSlices = fullLayout.hiddenlabels || [];

    if(!inHover && (!fullLayout.showlegend || !legendData.length)) {
        layer.selectAll('.legend').remove();
        fullLayout._topdefs.select('#' + clipId).remove();
        return Plots.autoMargin(gd, 'legend');
    }

    var legend = Lib.ensureSingle(layer, 'g', 'legend', function(s) {
        if(!inHover) s.attr('pointer-events', 'all');
    });

    var clipPath = Lib.ensureSingleById(fullLayout._topdefs, 'clipPath', clipId, function(s) {
        s.append('rect');
    });

    var bg = Lib.ensureSingle(legend, 'rect', 'bg', function(s) {
        s.attr('shape-rendering', 'crispEdges');
    });
    bg.call(Color.stroke, legendObj.bordercolor)
        .call(Color.fill, legendObj.bgcolor)
        .style('stroke-width', legendObj.borderwidth + 'px');

    var scrollBox = Lib.ensureSingle(legend, 'g', 'scrollbox');

    var title = legendObj.title;
    legendObj._titleWidth = 0;
    legendObj._titleHeight = 0;
    if(title.text) {
        var titleEl = Lib.ensureSingle(scrollBox, 'text', 'legendtitletext');
        titleEl.attr('text-anchor', 'start')
            .call(Drawing.font, title.font)
            .text(title.text);

        textLayout(titleEl, scrollBox, gd, legendObj, MAIN_TITLE); // handle mathjax or multi-line text and compute title height
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
    .each(function() { d3.select(this).call(drawTexts, gd, legendObj); })
    .call(style, gd, legendObj)
    .each(function() { if(!inHover) d3.select(this).call(setupTraceToggle, gd); });

    Lib.syncOrAsync([
        Plots.previousPromises,
        function() { return computeLegendDimensions(gd, groups, traces, legendObj); },
        function() {
            var gs = fullLayout._size;
            var bw = legendObj.borderwidth;

            if(!inHover) {
                var expMargin = expandMargin(gd);

                // IF expandMargin return a Promise (which is truthy),
                // we're under a doAutoMargin redraw, so we don't have to
                // draw the remaining pieces below
                if(expMargin) return;

                var lx = gs.l + gs.w * legendObj.x - FROM_TL[getXanchor(legendObj)] * legendObj._width;
                var ly = gs.t + gs.h * (1 - legendObj.y) - FROM_TL[getYanchor(legendObj)] * legendObj._effHeight;

                if(fullLayout.margin.autoexpand) {
                    var lx0 = lx;
                    var ly0 = ly;

                    lx = Lib.constrain(lx, 0, fullLayout.width - legendObj._width);
                    ly = Lib.constrain(ly, 0, fullLayout.height - legendObj._effHeight);

                    if(lx !== lx0) {
                        Lib.log('Constrain legend.x to make legend fit inside graph');
                    }
                    if(ly !== ly0) {
                        Lib.log('Constrain legend.y to make legend fit inside graph');
                    }
                }

                // Set size and position of all the elements that make up a legend:
                // legend, background and border, scroll box and scroll bar as well as title
                Drawing.setTranslate(legend, lx, ly);
            }

            // to be safe, remove previous listeners
            scrollBar.on('.drag', null);
            legend.on('wheel', null);

            if(inHover || legendObj._height <= legendObj._maxHeight || gd._context.staticPlot) {
                // if scrollbar should not be shown.
                var height = legendObj._effHeight;

                // if unified hover, let it be its full size
                if(inHover) height = legendObj._height;

                bg.attr({
                    width: legendObj._width - bw,
                    height: height - bw,
                    x: bw / 2,
                    y: bw / 2
                });

                Drawing.setTranslate(scrollBox, 0, 0);

                clipPath.select('rect').attr({
                    width: legendObj._width - 2 * bw,
                    height: height - 2 * bw,
                    x: bw,
                    y: bw
                });

                Drawing.setClipUrl(scrollBox, clipId, gd);

                Drawing.setRect(scrollBar, 0, 0, 0, 0);
                delete legendObj._scrollY;
            } else {
                var scrollBarHeight = Math.max(constants.scrollBarMinHeight,
                    legendObj._effHeight * legendObj._effHeight / legendObj._height);
                var scrollBarYMax = legendObj._effHeight -
                    scrollBarHeight -
                    2 * constants.scrollBarMargin;
                var scrollBoxYMax = legendObj._height - legendObj._effHeight;
                var scrollRatio = scrollBarYMax / scrollBoxYMax;

                var scrollBoxY = Math.min(legendObj._scrollY || 0, scrollBoxYMax);

                // increase the background and clip-path width
                // by the scrollbar width and margin
                bg.attr({
                    width: legendObj._width -
                        2 * bw +
                        constants.scrollBarWidth +
                        constants.scrollBarMargin,
                    height: legendObj._effHeight - bw,
                    x: bw / 2,
                    y: bw / 2
                });

                clipPath.select('rect').attr({
                    width: legendObj._width -
                        2 * bw +
                        constants.scrollBarWidth +
                        constants.scrollBarMargin,
                    height: legendObj._effHeight - 2 * bw,
                    x: bw,
                    y: bw + scrollBoxY
                });

                Drawing.setClipUrl(scrollBox, clipId, gd);

                scrollHandler(scrollBoxY, scrollBarHeight, scrollRatio);

                // scroll legend by mousewheel or touchpad swipe up/down
                legend.on('wheel', function() {
                    scrollBoxY = Lib.constrain(
                        legendObj._scrollY +
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
                legendObj._scrollY = gd._fullLayout.legend._scrollY = scrollBoxY;
                Drawing.setTranslate(scrollBox, 0, -scrollBoxY);

                Drawing.setRect(
                    scrollBar,
                    legendObj._width,
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

                        xf = dragElement.align(newX, 0, gs.l, gs.l + gs.w, legendObj.xanchor);
                        yf = dragElement.align(newY, 0, gs.t + gs.h, gs.t, legendObj.yanchor);
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
}

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
            if(!gd._fullLayout) return;
            handleClick(legendItem, gd, numClicks);
        }, gd._context.doubleClickDelay);
    } else if(numClicks === 2) {
        if(legend._clickTimeout) clearTimeout(legend._clickTimeout);
        gd._legendMouseDownTime = 0;

        var dblClickVal = Events.triggerHandler(gd, 'plotly_legenddoubleclick', evtData);
        if(dblClickVal !== false) handleClick(legendItem, gd, numClicks);
    }
}

function drawTexts(g, gd, legendObj) {
    var legendItem = g.data()[0][0];
    var trace = legendItem.trace;
    var isPieLike = Registry.traceIs(trace, 'pie-like');
    var isEditable = !legendObj._inHover && gd._context.edits.legendText && !isPieLike;
    var maxNameLength = legendObj._maxNameLength;

    var name, font;
    if(legendItem.groupTitle) {
        name = legendItem.groupTitle.text;
        font = legendItem.groupTitle.font;
    } else {
        font = legendObj.font;
        if(!legendObj.entries) {
            name = isPieLike ? legendItem.label : trace.name;
            if(trace._meta) {
                name = Lib.templateString(name, trace._meta);
            }
        } else {
            name = legendItem.text;
        }
    }

    var textEl = Lib.ensureSingle(g, 'text', 'legendtext');

    textEl.attr('text-anchor', 'start')
        .call(Drawing.font, font)
        .text(isEditable ? ensureLength(name, maxNameLength) : name);

    var textGap = legendObj.itemwidth + constants.itemGap * 2;
    svgTextUtils.positionText(textEl, textGap, 0);

    if(isEditable) {
        textEl.call(svgTextUtils.makeEditable, {gd: gd, text: name})
            .call(textLayout, g, gd, legendObj)
            .on('edit', function(newName) {
                this.text(ensureLength(newName, maxNameLength))
                    .call(textLayout, g, gd, legendObj);

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

                return Registry.call('_guiRestyle', gd, update, trace.index);
            });
    } else {
        textLayout(textEl, g, gd, legendObj);
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

function textLayout(s, g, gd, legendObj, aTitle) {
    if(legendObj._inHover) s.attr('data-notex', true); // do not process MathJax for unified hover
    svgTextUtils.convertToTspans(s, gd, function() {
        computeTextDimensions(g, gd, legendObj, aTitle);
    });
}

function computeTextDimensions(g, gd, legendObj, aTitle) {
    var legendItem = g.data()[0][0];
    if(!legendObj._inHover && legendItem && !legendItem.trace.showlegend) {
        g.remove();
        return;
    }

    var mathjaxGroup = g.select('g[class*=math-group]');
    var mathjaxNode = mathjaxGroup.node();
    if(!legendObj) legendObj = gd._fullLayout.legend;
    var bw = legendObj.borderwidth;
    var font;
    if(aTitle === MAIN_TITLE) {
        font = legendObj.title.font;
    } else if(legendItem.groupTitle) {
        font = legendItem.groupTitle.font;
    } else {
        font = legendObj.font;
    }
    var lineHeight = font.size * LINE_SPACING;
    var height, width;

    if(mathjaxNode) {
        var mathjaxBB = Drawing.bBox(mathjaxNode);

        height = mathjaxBB.height;
        width = mathjaxBB.width;

        if(aTitle === MAIN_TITLE) {
            Drawing.setTranslate(mathjaxGroup, bw, bw + height * 0.75);
        } else { // legend item
            Drawing.setTranslate(mathjaxGroup, 0, height * 0.25);
        }
    } else {
        var textEl = g.select(aTitle === MAIN_TITLE ?
            '.legendtitletext' : '.legendtext'
        );
        var textLines = svgTextUtils.lineCount(textEl);
        var textNode = textEl.node();

        height = lineHeight * textLines;
        width = textNode ? Drawing.bBox(textNode).width : 0;

        // approximation to height offset to center the font
        // to avoid getBoundingClientRect
        if(aTitle === MAIN_TITLE) {
            if(legendObj.title.side === 'left') {
                // add extra space between legend title and itmes
                width += constants.itemGap * 2;
            }

            svgTextUtils.positionText(textEl,
                bw + constants.titlePad,
                bw + lineHeight
            );
        } else { // legend item
            var x = constants.itemGap * 2 + legendObj.itemwidth;
            if(legendItem.groupTitle) {
                x = constants.itemGap;
                width -= legendObj.itemwidth;
            }

            svgTextUtils.positionText(textEl,
                x,
                -lineHeight * ((textLines - 1) / 2 - 0.3)
            );
        }
    }

    if(aTitle === MAIN_TITLE) {
        legendObj._titleWidth = width;
        legendObj._titleHeight = height;
    } else { // legend item
        legendItem.lineHeight = lineHeight;
        legendItem.height = Math.max(height, 16) + 3;
        legendItem.width = width;
    }
}

function getTitleSize(legendObj) {
    var w = 0;
    var h = 0;

    var side = legendObj.title.side;
    if(side) {
        if(side.indexOf('left') !== -1) {
            w = legendObj._titleWidth;
        }
        if(side.indexOf('top') !== -1) {
            h = legendObj._titleHeight;
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
function computeLegendDimensions(gd, groups, traces, legendObj) {
    var fullLayout = gd._fullLayout;
    if(!legendObj) legendObj = fullLayout.legend;
    var gs = fullLayout._size;

    var isVertical = helpers.isVertical(legendObj);
    var isGrouped = helpers.isGrouped(legendObj);

    var bw = legendObj.borderwidth;
    var bw2 = 2 * bw;
    var itemGap = constants.itemGap;
    var textGap = legendObj.itemwidth + itemGap * 2;
    var endPad = 2 * (bw + itemGap);

    var yanchor = getYanchor(legendObj);
    var isBelowPlotArea = legendObj.y < 0 || (legendObj.y === 0 && yanchor === 'top');
    var isAbovePlotArea = legendObj.y > 1 || (legendObj.y === 1 && yanchor === 'bottom');

    var traceGroupGap = legendObj.tracegroupgap;

    // - if below/above plot area, give it the maximum potential margin-push value
    // - otherwise, extend the height of the plot area
    legendObj._maxHeight = Math.max(
        (isBelowPlotArea || isAbovePlotArea) ? fullLayout.height / 2 : gs.h,
        30
    );

    var toggleRectWidth = 0;
    legendObj._width = 0;
    legendObj._height = 0;
    var titleSize = getTitleSize(legendObj);

    if(isVertical) {
        traces.each(function(d) {
            var h = d[0].height;
            Drawing.setTranslate(this,
                bw + titleSize[0],
                bw + titleSize[1] + legendObj._height + h / 2 + itemGap
            );
            legendObj._height += h;
            legendObj._width = Math.max(legendObj._width, d[0].width);
        });

        toggleRectWidth = textGap + legendObj._width;
        legendObj._width += itemGap + textGap + bw2;
        legendObj._height += endPad;

        if(isGrouped) {
            groups.each(function(d, i) {
                Drawing.setTranslate(this, 0, i * legendObj.tracegroupgap);
            });
            legendObj._height += (legendObj._lgroupsLength - 1) * legendObj.tracegroupgap;
        }
    } else {
        var xanchor = getXanchor(legendObj);
        var isLeftOfPlotArea = legendObj.x < 0 || (legendObj.x === 0 && xanchor === 'right');
        var isRightOfPlotArea = legendObj.x > 1 || (legendObj.x === 1 && xanchor === 'left');
        var isBeyondPlotAreaY = isAbovePlotArea || isBelowPlotArea;
        var hw = fullLayout.width / 2;

        // - if placed within x-margins, extend the width of the plot area
        // - else if below/above plot area and anchored in the margin, extend to opposite margin,
        // - otherwise give it the maximum potential margin-push value
        legendObj._maxWidth = Math.max(
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
                    var w = d[0].width;
                    var h = d[0].height;

                    Drawing.setTranslate(this,
                        titleSize[0],
                        titleSize[1] + bw + itemGap + h / 2 + offsetY
                    );
                    offsetY += h;
                    maxWidthInGroup = Math.max(maxWidthInGroup, textGap + w);
                });

                var next = maxWidthInGroup + itemGap;

                // horizontal_wrapping
                if(
                    // not on the first column already
                    groupOffsetX > 0 &&

                    // goes beyound limit
                    next + bw + groupOffsetX > legendObj._maxWidth
                ) {
                    maxRowWidth = Math.max(maxRowWidth, groupOffsetX);
                    groupOffsetX = 0;
                    groupOffsetY += maxGroupHeightInRow + traceGroupGap;
                    maxGroupHeightInRow = offsetY;
                } else {
                    maxGroupHeightInRow = Math.max(maxGroupHeightInRow, offsetY);
                }

                Drawing.setTranslate(this, groupOffsetX, groupOffsetY);

                groupOffsetX += next;
            });

            legendObj._width = Math.max(maxRowWidth, groupOffsetX) + bw;
            legendObj._height = groupOffsetY + maxGroupHeightInRow + endPad;
        } else {
            var nTraces = traces.size();
            var oneRowLegend = (combinedItemWidth + bw2 + (nTraces - 1) * itemGap) < legendObj._maxWidth;

            var maxItemHeightInRow = 0;
            var offsetX = 0;
            var offsetY = 0;
            var rowWidth = 0;
            traces.each(function(d) {
                var h = d[0].height;
                var w = textGap + d[0].width;
                var next = (oneRowLegend ? w : maxItemWidth) + itemGap;

                if((next + bw + offsetX - itemGap) >= legendObj._maxWidth) {
                    maxRowWidth = Math.max(maxRowWidth, rowWidth);
                    offsetX = 0;
                    offsetY += maxItemHeightInRow;
                    legendObj._height += maxItemHeightInRow;
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
                legendObj._width = offsetX + bw2;
                legendObj._height = maxItemHeightInRow + endPad;
            } else {
                legendObj._width = Math.max(maxRowWidth, rowWidth) + bw2;
                legendObj._height += maxItemHeightInRow + endPad;
            }
        }
    }

    legendObj._width = Math.ceil(
        Math.max(
            legendObj._width + titleSize[0],
            legendObj._titleWidth + 2 * (bw + constants.titlePad)
        )
    );

    legendObj._height = Math.ceil(
        Math.max(
            legendObj._height + titleSize[1],
            legendObj._titleHeight + 2 * (bw + constants.itemGap)
        )
    );

    legendObj._effHeight = Math.min(legendObj._height, legendObj._maxHeight);

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
    var legendObj = fullLayout.legend;
    var xanchor = getXanchor(legendObj);
    var yanchor = getYanchor(legendObj);

    return Plots.autoMargin(gd, 'legend', {
        x: legendObj.x,
        y: legendObj.y,
        l: legendObj._width * (FROM_TL[xanchor]),
        r: legendObj._width * (FROM_BR[xanchor]),
        b: legendObj._effHeight * (FROM_BR[yanchor]),
        t: legendObj._effHeight * (FROM_TL[yanchor])
    });
}

function getXanchor(legendObj) {
    return Lib.isRightAnchor(legendObj) ? 'right' :
        Lib.isCenterAnchor(legendObj) ? 'center' :
        'left';
}

function getYanchor(legendObj) {
    return Lib.isBottomAnchor(legendObj) ? 'bottom' :
        Lib.isMiddleAnchor(legendObj) ? 'middle' :
        'top';
}
