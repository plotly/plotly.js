/**
* Copyright 2012-2018, Plotly, Inc.
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
var dragElement = require('../dragelement');
var Drawing = require('../drawing');
var Color = require('../color');
var svgTextUtils = require('../../lib/svg_text_utils');
var handleClick = require('./handle_click');

var constants = require('./constants');
var interactConstants = require('../../constants/interactions');
var alignmentConstants = require('../../constants/alignment');
var LINE_SPACING = alignmentConstants.LINE_SPACING;
var FROM_TL = alignmentConstants.FROM_TL;
var FROM_BR = alignmentConstants.FROM_BR;

var getLegendData = require('./get_legend_data');
var style = require('./style');
var helpers = require('./helpers');
var anchorUtils = require('./anchor_utils');

var DBLCLICKDELAY = interactConstants.DBLCLICKDELAY;

module.exports = function draw(gd) {
    var fullLayout = gd._fullLayout;
    var clipId = 'legend' + fullLayout._uid;

    if(!fullLayout._infolayer || !gd.calcdata) return;

    if(!gd._legendMouseDownTime) gd._legendMouseDownTime = 0;

    var opts = fullLayout.legend,
        legendData = fullLayout.showlegend && getLegendData(gd.calcdata, opts),
        hiddenSlices = fullLayout.hiddenlabels || [];

    if(!fullLayout.showlegend || !legendData.length) {
        fullLayout._infolayer.selectAll('.legend').remove();
        fullLayout._topdefs.select('#' + clipId).remove();

        Plots.autoMargin(gd, 'legend');
        return;
    }

    var firstRender = false;
    var legend = Lib.ensureSingle(fullLayout._infolayer, 'g', 'legend', function(s) {
        s.attr('pointer-events', 'all');
        firstRender = true;
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

    var scrollBar = Lib.ensureSingle(legend, 'rect', 'scrollbar', function(s) {
        s.attr({
            rx: 20,
            ry: 3,
            width: 0,
            height: 0
        })
        .call(Color.fill, '#808BA4');
    });

    var groups = scrollBox.selectAll('g.groups')
        .data(legendData);

    groups.enter().append('g')
        .attr('class', 'groups');

    groups.exit().remove();

    var traces = groups.selectAll('g.traces')
        .data(Lib.identity);

    traces.enter().append('g').attr('class', 'traces');
    traces.exit().remove();

    traces.call(style, gd)
        .style('opacity', function(d) {
            var trace = d[0].trace;
            if(Registry.traceIs(trace, 'pie')) {
                return hiddenSlices.indexOf(d[0].label) !== -1 ? 0.5 : 1;
            } else {
                return trace.visible === 'legendonly' ? 0.5 : 1;
            }
        })
        .each(function() {
            d3.select(this)
                .call(drawTexts, gd)
                .call(setupTraceToggle, gd);
        });

    if(firstRender) {
        computeLegendDimensions(gd, groups, traces);
        expandMargin(gd);
    }

    // Position and size the legend
    var lxMin = 0,
        lxMax = fullLayout.width,
        lyMin = 0,
        lyMax = fullLayout.height;

    computeLegendDimensions(gd, groups, traces);

    if(opts._height > lyMax) {
        // If the legend doesn't fit in the plot area,
        // do not expand the vertical margins.
        expandHorizontalMargin(gd);
    } else {
        expandMargin(gd);
    }

    // Scroll section must be executed after repositionLegend.
    // It requires the legend width, height, x and y to position the scrollbox
    // and these values are mutated in repositionLegend.
    var gs = fullLayout._size,
        lx = gs.l + gs.w * opts.x,
        ly = gs.t + gs.h * (1 - opts.y);

    if(anchorUtils.isRightAnchor(opts)) {
        lx -= opts._width;
    }
    else if(anchorUtils.isCenterAnchor(opts)) {
        lx -= opts._width / 2;
    }

    if(anchorUtils.isBottomAnchor(opts)) {
        ly -= opts._height;
    }
    else if(anchorUtils.isMiddleAnchor(opts)) {
        ly -= opts._height / 2;
    }

    // Make sure the legend left and right sides are visible
    var legendWidth = opts._width,
        legendWidthMax = gs.w;

    if(legendWidth > legendWidthMax) {
        lx = gs.l;
        legendWidth = legendWidthMax;
    }
    else {
        if(lx + legendWidth > lxMax) lx = lxMax - legendWidth;
        if(lx < lxMin) lx = lxMin;
        legendWidth = Math.min(lxMax - lx, opts._width);
    }

    // Make sure the legend top and bottom are visible
    // (legends with a scroll bar are not allowed to stretch beyond the extended
    // margins)
    var legendHeight = opts._height,
        legendHeightMax = gs.h;

    if(legendHeight > legendHeightMax) {
        ly = gs.t;
        legendHeight = legendHeightMax;
    }
    else {
        if(ly + legendHeight > lyMax) ly = lyMax - legendHeight;
        if(ly < lyMin) ly = lyMin;
        legendHeight = Math.min(lyMax - ly, opts._height);
    }

    // Set size and position of all the elements that make up a legend:
    // legend, background and border, scroll box and scroll bar
    Drawing.setTranslate(legend, lx, ly);

    // to be safe, remove previous listeners
    scrollBar.on('.drag', null);
    legend.on('wheel', null);

    if(opts._height <= legendHeight || gd._context.staticPlot) {
        // if scrollbar should not be shown.
        bg.attr({
            width: legendWidth - opts.borderwidth,
            height: legendHeight - opts.borderwidth,
            x: opts.borderwidth / 2,
            y: opts.borderwidth / 2
        });

        Drawing.setTranslate(scrollBox, 0, 0);

        clipPath.select('rect').attr({
            width: legendWidth - 2 * opts.borderwidth,
            height: legendHeight - 2 * opts.borderwidth,
            x: opts.borderwidth,
            y: opts.borderwidth
        });

        Drawing.setClipUrl(scrollBox, clipId);

        Drawing.setRect(scrollBar, 0, 0, 0, 0);
        delete opts._scrollY;
    }
    else {
        var scrollBarHeight = Math.max(constants.scrollBarMinHeight,
            legendHeight * legendHeight / opts._height);
        var scrollBarYMax = legendHeight -
            scrollBarHeight -
            2 * constants.scrollBarMargin;
        var scrollBoxYMax = opts._height - legendHeight;
        var scrollRatio = scrollBarYMax / scrollBoxYMax;

        var scrollBoxY = Math.min(opts._scrollY || 0, scrollBoxYMax);

        // increase the background and clip-path width
        // by the scrollbar width and margin
        bg.attr({
            width: legendWidth -
                2 * opts.borderwidth +
                constants.scrollBarWidth +
                constants.scrollBarMargin,
            height: legendHeight - opts.borderwidth,
            x: opts.borderwidth / 2,
            y: opts.borderwidth / 2
        });

        clipPath.select('rect').attr({
            width: legendWidth -
                2 * opts.borderwidth +
                constants.scrollBarWidth +
                constants.scrollBarMargin,
            height: legendHeight - 2 * opts.borderwidth,
            x: opts.borderwidth,
            y: opts.borderwidth + scrollBoxY
        });

        Drawing.setClipUrl(scrollBox, clipId);

        scrollHandler(scrollBoxY, scrollBarHeight, scrollRatio);

        legend.on('wheel', function() {
            scrollBoxY = Lib.constrain(
                opts._scrollY +
                    d3.event.deltaY / scrollBarYMax * scrollBoxYMax,
                0, scrollBoxYMax);
            scrollHandler(scrollBoxY, scrollBarHeight, scrollRatio);
            if(scrollBoxY !== 0 && scrollBoxY !== scrollBoxYMax) {
                d3.event.preventDefault();
            }
        });

        var eventY0, scrollBoxY0;

        var drag = d3.behavior.drag()
        .on('dragstart', function() {
            eventY0 = d3.event.sourceEvent.clientY;
            scrollBoxY0 = scrollBoxY;
        })
        .on('drag', function() {
            var e = d3.event.sourceEvent;
            if(e.buttons === 2 || e.ctrlKey) return;

            scrollBoxY = Lib.constrain(
                (e.clientY - eventY0) / scrollRatio + scrollBoxY0,
                0, scrollBoxYMax);
            scrollHandler(scrollBoxY, scrollBarHeight, scrollRatio);
        });

        scrollBar.call(drag);
    }


    function scrollHandler(scrollBoxY, scrollBarHeight, scrollRatio) {
        opts._scrollY = gd._fullLayout.legend._scrollY = scrollBoxY;
        Drawing.setTranslate(scrollBox, 0, -scrollBoxY);

        Drawing.setRect(
            scrollBar,
            legendWidth,
            constants.scrollBarMargin + scrollBoxY * scrollRatio,
            constants.scrollBarWidth,
            scrollBarHeight
        );
        clipPath.select('rect').attr({
            y: opts.borderwidth + scrollBoxY
        });
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
                var newX = x0 + dx,
                    newY = y0 + dy;

                Drawing.setTranslate(legend, newX, newY);

                xf = dragElement.align(newX, 0, gs.l, gs.l + gs.w, opts.xanchor);
                yf = dragElement.align(newY, 0, gs.t + gs.h, gs.t, opts.yanchor);
            },
            doneFn: function() {
                if(xf !== undefined && yf !== undefined) {
                    Registry.call('relayout', gd, {'legend.x': xf, 'legend.y': yf});
                }
            },
            clickFn: function(numClicks, e) {
                var clickedTrace =
                    fullLayout._infolayer.selectAll('g.traces').filter(function() {
                        var bbox = this.getBoundingClientRect();
                        return (e.clientX >= bbox.left && e.clientX <= bbox.right &&
                            e.clientY >= bbox.top && e.clientY <= bbox.bottom);
                    });
                if(clickedTrace.size() > 0) {
                    if(numClicks === 1) {
                        legend._clickTimeout = setTimeout(function() {
                            handleClick(clickedTrace, gd, numClicks);
                        }, DBLCLICKDELAY);
                    } else if(numClicks === 2) {
                        if(legend._clickTimeout) {
                            clearTimeout(legend._clickTimeout);
                        }
                        handleClick(clickedTrace, gd, numClicks);
                    }
                }
            }
        });
    }
};

function drawTexts(g, gd) {
    var legendItem = g.data()[0][0],
        fullLayout = gd._fullLayout,
        trace = legendItem.trace,
        isPie = Registry.traceIs(trace, 'pie'),
        traceIndex = trace.index,
        name = isPie ? legendItem.label : trace.name;

    var text = Lib.ensureSingle(g, 'text', 'legendtext');

    text.attr('text-anchor', 'start')
        .classed('user-select-none', true)
        .call(Drawing.font, fullLayout.legend.font)
        .text(name);

    function textLayout(s) {
        svgTextUtils.convertToTspans(s, gd, function() {
            computeTextDimensions(g, gd);
        });
    }

    if(gd._context.edits.legendText && !isPie) {
        text.call(svgTextUtils.makeEditable, {gd: gd})
            .call(textLayout)
            .on('edit', function(text) {
                this.text(text)
                    .call(textLayout);

                var origText = text;

                if(!this.text()) text = ' \u0020\u0020 ';

                var transforms, direction;
                var fullInput = legendItem.trace._fullInput || {};
                var update = {};

                // N.B. this block isn't super clean,
                // is unfortunately untested at the moment,
                // and only works for for 'ohlc' and 'candlestick',
                // but should be generalized for other one-to-many transforms
                if(['ohlc', 'candlestick'].indexOf(fullInput.type) !== -1) {
                    transforms = legendItem.trace.transforms;
                    direction = transforms[transforms.length - 1].direction;

                    update[direction + '.name'] = text;
                } else if(Registry.hasTransform(fullInput, 'groupby')) {
                    var groupbyIndices = Registry.getTransformIndices(fullInput, 'groupby');
                    var index = groupbyIndices[groupbyIndices.length - 1];

                    var kcont = Lib.keyedContainer(fullInput, 'transforms[' + index + '].styles', 'target', 'value.name');

                    if(origText === '') {
                        kcont.remove(legendItem.trace._group);
                    } else {
                        kcont.set(legendItem.trace._group, text);
                    }

                    update = kcont.constructUpdate();
                } else {
                    update.name = text;
                }

                return Registry.call('restyle', gd, update, traceIndex);
            });
    } else {
        textLayout(text);
    }
}

function setupTraceToggle(g, gd) {
    var newMouseDownTime,
        numClicks = 1;

    var traceToggle = Lib.ensureSingle(g, 'rect', 'legendtoggle', function(s) {
        s.style('cursor', 'pointer')
            .attr('pointer-events', 'all')
            .call(Color.fill, 'rgba(0,0,0,0)');
    });

    traceToggle.on('mousedown', function() {
        newMouseDownTime = (new Date()).getTime();
        if(newMouseDownTime - gd._legendMouseDownTime < DBLCLICKDELAY) {
            // in a click train
            numClicks += 1;
        }
        else {
            // new click train
            numClicks = 1;
            gd._legendMouseDownTime = newMouseDownTime;
        }
    });
    traceToggle.on('mouseup', function() {
        if(gd._dragged || gd._editing) return;
        var legend = gd._fullLayout.legend;

        if((new Date()).getTime() - gd._legendMouseDownTime > DBLCLICKDELAY) {
            numClicks = Math.max(numClicks - 1, 1);
        }

        if(numClicks === 1) {
            legend._clickTimeout = setTimeout(function() { handleClick(g, gd, numClicks); }, DBLCLICKDELAY);
        } else if(numClicks === 2) {
            if(legend._clickTimeout) {
                clearTimeout(legend._clickTimeout);
            }
            gd._legendMouseDownTime = 0;
            handleClick(g, gd, numClicks);
        }
    });
}

function computeTextDimensions(g, gd) {
    var legendItem = g.data()[0][0];

    if(!legendItem.trace.showlegend) {
        g.remove();
        return;
    }

    var mathjaxGroup = g.select('g[class*=math-group]');
    var mathjaxNode = mathjaxGroup.node();
    var opts = gd._fullLayout.legend;
    var lineHeight = opts.font.size * LINE_SPACING;
    var height, width;

    if(mathjaxNode) {
        var mathjaxBB = Drawing.bBox(mathjaxNode);

        height = mathjaxBB.height;
        width = mathjaxBB.width;

        Drawing.setTranslate(mathjaxGroup, 0, (height / 4));
    }
    else {
        var text = g.select('.legendtext');
        var textLines = svgTextUtils.lineCount(text);
        var textNode = text.node();

        height = lineHeight * textLines;
        width = textNode ? Drawing.bBox(textNode).width : 0;

        // approximation to height offset to center the font
        // to avoid getBoundingClientRect
        var textY = lineHeight * (0.3 + (1 - textLines) / 2);
        // TODO: this 40 should go in a constants file (along with other
        // values related to the legend symbol size)
        svgTextUtils.positionText(text, 40, textY);
    }

    height = Math.max(height, 16) + 3;

    legendItem.height = height;
    legendItem.width = width;
}

function computeLegendDimensions(gd, groups, traces) {
    var fullLayout = gd._fullLayout;
    var opts = fullLayout.legend;
    var borderwidth = opts.borderwidth;
    var isGrouped = helpers.isGrouped(opts);

    var extraWidth = 0;

    opts._width = 0;
    opts._height = 0;

    if(helpers.isVertical(opts)) {
        if(isGrouped) {
            groups.each(function(d, i) {
                Drawing.setTranslate(this, 0, i * opts.tracegroupgap);
            });
        }

        traces.each(function(d) {
            var legendItem = d[0],
                textHeight = legendItem.height,
                textWidth = legendItem.width;

            Drawing.setTranslate(this,
                borderwidth,
                (5 + borderwidth + opts._height + textHeight / 2));

            opts._height += textHeight;
            opts._width = Math.max(opts._width, textWidth);
        });

        opts._width += 45 + borderwidth * 2;
        opts._height += 10 + borderwidth * 2;

        if(isGrouped) {
            opts._height += (opts._lgroupsLength - 1) * opts.tracegroupgap;
        }

        extraWidth = 40;
    }
    else if(isGrouped) {
        var groupXOffsets = [opts._width],
            groupData = groups.data();

        for(var i = 0, n = groupData.length; i < n; i++) {
            var textWidths = groupData[i].map(function(legendItemArray) {
                return legendItemArray[0].width;
            });

            var groupWidth = 40 + Math.max.apply(null, textWidths);

            opts._width += opts.tracegroupgap + groupWidth;

            groupXOffsets.push(opts._width);
        }

        groups.each(function(d, i) {
            Drawing.setTranslate(this, groupXOffsets[i], 0);
        });

        groups.each(function() {
            var group = d3.select(this),
                groupTraces = group.selectAll('g.traces'),
                groupHeight = 0;

            groupTraces.each(function(d) {
                var legendItem = d[0],
                    textHeight = legendItem.height;

                Drawing.setTranslate(this,
                    0,
                    (5 + borderwidth + groupHeight + textHeight / 2));

                groupHeight += textHeight;
            });

            opts._height = Math.max(opts._height, groupHeight);
        });

        opts._height += 10 + borderwidth * 2;
        opts._width += borderwidth * 2;
    }
    else {
        var rowHeight = 0,
            maxTraceHeight = 0,
            maxTraceWidth = 0,
            offsetX = 0,
            fullTracesWidth = 0,
            traceGap = opts.tracegroupgap || 5,
            oneRowLegend;

        // calculate largest width for traces and use for width of all legend items
        traces.each(function(d) {
            maxTraceWidth = Math.max(40 + d[0].width, maxTraceWidth);
            fullTracesWidth += 40 + d[0].width + traceGap;
        });

        // check if legend fits in one row
        oneRowLegend = (fullLayout.width - (fullLayout.margin.r + fullLayout.margin.l)) > borderwidth + fullTracesWidth - traceGap;
        traces.each(function(d) {
            var legendItem = d[0],
                traceWidth = oneRowLegend ? 40 + d[0].width : maxTraceWidth;

            if((borderwidth + offsetX + traceGap + traceWidth) > (fullLayout.width - (fullLayout.margin.r + fullLayout.margin.l))) {
                offsetX = 0;
                rowHeight = rowHeight + maxTraceHeight;
                opts._height = opts._height + maxTraceHeight;
                // reset for next row
                maxTraceHeight = 0;
            }

            Drawing.setTranslate(this,
                (borderwidth + offsetX),
                (5 + borderwidth + legendItem.height / 2) + rowHeight);

            opts._width += traceGap + traceWidth;
            opts._height = Math.max(opts._height, legendItem.height);

            // keep track of tallest trace in group
            offsetX += traceGap + traceWidth;
            maxTraceHeight = Math.max(legendItem.height, maxTraceHeight);
        });

        opts._width += borderwidth * 2;
        opts._height += 10 + borderwidth * 2;

    }

    // make sure we're only getting full pixels
    opts._width = Math.ceil(opts._width);
    opts._height = Math.ceil(opts._height);

    traces.each(function(d) {
        var legendItem = d[0],
            bg = d3.select(this).select('.legendtoggle');

        Drawing.setRect(bg,
            0,
            -legendItem.height / 2,
            (gd._context.edits.legendText ? 0 : opts._width) + extraWidth,
            legendItem.height
        );
    });
}

function expandMargin(gd) {
    var fullLayout = gd._fullLayout,
        opts = fullLayout.legend;

    var xanchor = 'left';
    if(anchorUtils.isRightAnchor(opts)) {
        xanchor = 'right';
    }
    else if(anchorUtils.isCenterAnchor(opts)) {
        xanchor = 'center';
    }

    var yanchor = 'top';
    if(anchorUtils.isBottomAnchor(opts)) {
        yanchor = 'bottom';
    }
    else if(anchorUtils.isMiddleAnchor(opts)) {
        yanchor = 'middle';
    }

    // lastly check if the margin auto-expand has changed
    Plots.autoMargin(gd, 'legend', {
        x: opts.x,
        y: opts.y,
        l: opts._width * (FROM_TL[xanchor]),
        r: opts._width * (FROM_BR[xanchor]),
        b: opts._height * (FROM_BR[yanchor]),
        t: opts._height * (FROM_TL[yanchor])
    });
}

function expandHorizontalMargin(gd) {
    var fullLayout = gd._fullLayout,
        opts = fullLayout.legend;

    var xanchor = 'left';
    if(anchorUtils.isRightAnchor(opts)) {
        xanchor = 'right';
    }
    else if(anchorUtils.isCenterAnchor(opts)) {
        xanchor = 'center';
    }

    // lastly check if the margin auto-expand has changed
    Plots.autoMargin(gd, 'legend', {
        x: opts.x,
        y: 0.5,
        l: opts._width * (FROM_TL[xanchor]),
        r: opts._width * (FROM_BR[xanchor]),
        b: 0,
        t: 0
    });
}
