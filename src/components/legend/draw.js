/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var d3 = require('d3');

var Plotly = require('../../plotly');
var Lib = require('../../lib');
var Plots = require('../../plots/plots');
var Registry = require('../../registry');
var dragElement = require('../dragelement');
var Drawing = require('../drawing');
var Color = require('../color');
var svgTextUtils = require('../../lib/svg_text_utils');

var constants = require('./constants');
var interactConstants = require('../../constants/interactions');
var LINE_SPACING = require('../../constants/alignment').LINE_SPACING;

var getLegendData = require('./get_legend_data');
var style = require('./style');
var helpers = require('./helpers');
var anchorUtils = require('./anchor_utils');

var SHOWISOLATETIP = true;
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

    var legend = fullLayout._infolayer.selectAll('g.legend')
        .data([0]);

    legend.enter().append('g')
        .attr({
            'class': 'legend',
            'pointer-events': 'all'
        });

    var clipPath = fullLayout._topdefs.selectAll('#' + clipId)
        .data([0]);

    clipPath.enter().append('clipPath')
        .attr('id', clipId)
        .append('rect');

    var bg = legend.selectAll('rect.bg')
        .data([0]);

    bg.enter().append('rect').attr({
        'class': 'bg',
        'shape-rendering': 'crispEdges'
    });

    bg.call(Color.stroke, opts.bordercolor);
    bg.call(Color.fill, opts.bgcolor);
    bg.style('stroke-width', opts.borderwidth + 'px');

    var scrollBox = legend.selectAll('g.scrollbox')
        .data([0]);

    scrollBox.enter().append('g')
        .attr('class', 'scrollbox');

    var scrollBar = legend.selectAll('rect.scrollbar')
        .data([0]);

    scrollBar.enter().append('rect')
        .attr({
            'class': 'scrollbar',
            'rx': 20,
            'ry': 2,
            'width': 0,
            'height': 0
        })
        .call(Color.fill, '#808BA4');

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

    var firstRender = legend.enter().size() !== 0;
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

    if(opts.height > lyMax) {
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
        lx -= opts.width;
    }
    else if(anchorUtils.isCenterAnchor(opts)) {
        lx -= opts.width / 2;
    }

    if(anchorUtils.isBottomAnchor(opts)) {
        ly -= opts.height;
    }
    else if(anchorUtils.isMiddleAnchor(opts)) {
        ly -= opts.height / 2;
    }

    // Make sure the legend left and right sides are visible
    var legendWidth = opts.width,
        legendWidthMax = gs.w;

    if(legendWidth > legendWidthMax) {
        lx = gs.l;
        legendWidth = legendWidthMax;
    }
    else {
        if(lx + legendWidth > lxMax) lx = lxMax - legendWidth;
        if(lx < lxMin) lx = lxMin;
        legendWidth = Math.min(lxMax - lx, opts.width);
    }

    // Make sure the legend top and bottom are visible
    // (legends with a scroll bar are not allowed to stretch beyond the extended
    // margins)
    var legendHeight = opts.height,
        legendHeightMax = gs.h;

    if(legendHeight > legendHeightMax) {
        ly = gs.t;
        legendHeight = legendHeightMax;
    }
    else {
        if(ly + legendHeight > lyMax) ly = lyMax - legendHeight;
        if(ly < lyMin) ly = lyMin;
        legendHeight = Math.min(lyMax - ly, opts.height);
    }

    // Set size and position of all the elements that make up a legend:
    // legend, background and border, scroll box and scroll bar
    Drawing.setTranslate(legend, lx, ly);

    var scrollBarYMax = legendHeight -
            constants.scrollBarHeight -
            2 * constants.scrollBarMargin,
        scrollBoxYMax = opts.height - legendHeight,
        scrollBarY,
        scrollBoxY;

    if(opts.height <= legendHeight || gd._context.staticPlot) {
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

        scrollBox.call(Drawing.setClipUrl, clipId);
    }
    else {
        scrollBarY = constants.scrollBarMargin,
        scrollBoxY = scrollBox.attr('data-scroll') || 0;

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
            y: opts.borderwidth - scrollBoxY
        });

        scrollBox.call(Drawing.setClipUrl, clipId);

        if(firstRender) scrollHandler(scrollBarY, scrollBoxY);

        legend.on('wheel', null);  // to be safe, remove previous listeners
        legend.on('wheel', function() {
            scrollBoxY = Lib.constrain(
                scrollBox.attr('data-scroll') -
                    d3.event.deltaY / scrollBarYMax * scrollBoxYMax,
                -scrollBoxYMax, 0);
            scrollBarY = constants.scrollBarMargin -
                scrollBoxY / scrollBoxYMax * scrollBarYMax;
            scrollHandler(scrollBarY, scrollBoxY);
            if(scrollBoxY !== 0 && scrollBoxY !== -scrollBoxYMax) {
                d3.event.preventDefault();
            }
        });

        // to be safe, remove previous listeners
        scrollBar.on('.drag', null);
        scrollBox.on('.drag', null);

        var drag = d3.behavior.drag().on('drag', function() {
            scrollBarY = Lib.constrain(
                d3.event.y - constants.scrollBarHeight / 2,
                constants.scrollBarMargin,
                constants.scrollBarMargin + scrollBarYMax);
            scrollBoxY = - (scrollBarY - constants.scrollBarMargin) /
                scrollBarYMax * scrollBoxYMax;
            scrollHandler(scrollBarY, scrollBoxY);
        });

        scrollBar.call(drag);
        scrollBox.call(drag);
    }


    function scrollHandler(scrollBarY, scrollBoxY) {
        scrollBox
            .attr('data-scroll', scrollBoxY)
            .call(Drawing.setTranslate, 0, scrollBoxY);

        scrollBar.call(
            Drawing.setRect,
            legendWidth,
            scrollBarY,
            constants.scrollBarWidth,
            constants.scrollBarHeight
        );
        clipPath.select('rect').attr({
            y: opts.borderwidth - scrollBoxY
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
            doneFn: function(dragged, numClicks, e) {
                if(dragged && xf !== undefined && yf !== undefined) {
                    Plotly.relayout(gd, {'legend.x': xf, 'legend.y': yf});
                } else {
                    var clickedTrace =
                        fullLayout._infolayer.selectAll('g.traces').filter(function() {
                            var bbox = this.getBoundingClientRect();
                            return (e.clientX >= bbox.left && e.clientX <= bbox.right &&
                                e.clientY >= bbox.top && e.clientY <= bbox.bottom);
                        });
                    if(clickedTrace.size() > 0) {
                        if(numClicks === 1) {
                            legend._clickTimeout = setTimeout(function() { handleClick(clickedTrace, gd, numClicks); }, DBLCLICKDELAY);
                        } else if(numClicks === 2) {
                            if(legend._clickTimeout) {
                                clearTimeout(legend._clickTimeout);
                            }
                            handleClick(clickedTrace, gd, numClicks);
                        }
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

    var text = g.selectAll('text.legendtext')
        .data([0]);

    text.enter().append('text').classed('legendtext', true);

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

                if(!this.text()) text = ' \u0020\u0020 ';

                var fullInput = legendItem.trace._fullInput || {},
                    astr;

                // N.B. this block isn't super clean,
                // is unfortunately untested at the moment,
                // and only works for for 'ohlc' and 'candlestick',
                // but should be generalized for other one-to-many transforms
                if(['ohlc', 'candlestick'].indexOf(fullInput.type) !== -1) {
                    var transforms = legendItem.trace.transforms,
                        direction = transforms[transforms.length - 1].direction;

                    astr = direction + '.name';
                }
                else astr = 'name';

                Plotly.restyle(gd, astr, text, traceIndex);
            });
    }
    else text.call(textLayout);
}

function setupTraceToggle(g, gd) {
    var newMouseDownTime,
        numClicks = 1;

    var traceToggle = g.selectAll('rect')
        .data([0]);

    traceToggle.enter().append('rect')
        .classed('legendtoggle', true)
        .style('cursor', 'pointer')
        .attr('pointer-events', 'all')
        .call(Color.fill, 'rgba(0,0,0,0)');


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

function handleClick(g, gd, numClicks) {
    if(gd._dragged || gd._editing) return;
    var hiddenSlices = gd._fullLayout.hiddenlabels ?
        gd._fullLayout.hiddenlabels.slice() :
        [];

    var legendItem = g.data()[0][0],
        fullData = gd._fullData,
        trace = legendItem.trace,
        legendgroup = trace.legendgroup,
        traceIndicesInGroup = [],
        tracei,
        newVisible;


    if(numClicks === 1 && SHOWISOLATETIP && gd.data && gd._context.showTips) {
        Lib.notifier('Double click on legend to isolate individual trace', 'long');
        SHOWISOLATETIP = false;
    } else {
        SHOWISOLATETIP = false;
    }
    if(Registry.traceIs(trace, 'pie')) {
        var thisLabel = legendItem.label,
            thisLabelIndex = hiddenSlices.indexOf(thisLabel);

        if(numClicks === 1) {
            if(thisLabelIndex === -1) hiddenSlices.push(thisLabel);
            else hiddenSlices.splice(thisLabelIndex, 1);
        } else if(numClicks === 2) {
            hiddenSlices = [];
            gd.calcdata[0].forEach(function(d) {
                if(thisLabel !== d.label) {
                    hiddenSlices.push(d.label);
                }
            });
            if(gd._fullLayout.hiddenlabels && gd._fullLayout.hiddenlabels.length === hiddenSlices.length && thisLabelIndex === -1) {
                hiddenSlices = [];
            }
        }

        Plotly.relayout(gd, 'hiddenlabels', hiddenSlices);
    } else {
        var allTraces = [],
            traceVisibility = [],
            i;

        for(i = 0; i < fullData.length; i++) {
            allTraces.push(i);
            // Allow the legendonly state through for *all* trace types (including
            // carpet for which it's overridden with true/false in supplyDefaults)
            traceVisibility.push(
                Registry.traceIs(fullData[i], 'notLegendIsolatable') ? true : 'legendonly'
            );
        }

        if(legendgroup === '') {
            traceIndicesInGroup = [trace.index];
            traceVisibility[trace.index] = true;
        } else {
            for(i = 0; i < fullData.length; i++) {
                tracei = fullData[i];
                if(tracei.legendgroup === legendgroup) {
                    traceIndicesInGroup.push(tracei.index);
                    traceVisibility[allTraces.indexOf(i)] = true;
                }
            }
        }

        if(numClicks === 1) {
            newVisible = trace.visible === true ? 'legendonly' : true;
            Plotly.restyle(gd, 'visible', newVisible, traceIndicesInGroup);
        } else if(numClicks === 2) {
            var sameAsLast = true;
            for(i = 0; i < fullData.length; i++) {
                if(fullData[i].visible !== traceVisibility[i]) {
                    sameAsLast = false;
                    break;
                }
            }
            if(sameAsLast) {
                traceVisibility = true;
            }
            var visibilityUpdates = [];
            for(i = 0; i < fullData.length; i++) {
                visibilityUpdates.push(allTraces[i]);
            }
            Plotly.restyle(gd, 'visible', traceVisibility, visibilityUpdates);
        }
    }
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

    opts.width = 0;
    opts.height = 0;

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
                (5 + borderwidth + opts.height + textHeight / 2));

            opts.height += textHeight;
            opts.width = Math.max(opts.width, textWidth);
        });

        opts.width += 45 + borderwidth * 2;
        opts.height += 10 + borderwidth * 2;

        if(isGrouped) {
            opts.height += (opts._lgroupsLength - 1) * opts.tracegroupgap;
        }

        extraWidth = 40;
    }
    else if(isGrouped) {
        var groupXOffsets = [opts.width],
            groupData = groups.data();

        for(var i = 0, n = groupData.length; i < n; i++) {
            var textWidths = groupData[i].map(function(legendItemArray) {
                return legendItemArray[0].width;
            });

            var groupWidth = 40 + Math.max.apply(null, textWidths);

            opts.width += opts.tracegroupgap + groupWidth;

            groupXOffsets.push(opts.width);
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

            opts.height = Math.max(opts.height, groupHeight);
        });

        opts.height += 10 + borderwidth * 2;
        opts.width += borderwidth * 2;
    }
    else {
        var rowHeight = 0,
            maxTraceHeight = 0,
            maxTraceWidth = 0,
            offsetX = 0;

        // calculate largest width for traces and use for width of all legend items
        traces.each(function(d) {
            maxTraceWidth = Math.max(40 + d[0].width, maxTraceWidth);
        });

        traces.each(function(d) {
            var legendItem = d[0],
                traceWidth = maxTraceWidth,
                traceGap = opts.tracegroupgap || 5;

            if((borderwidth + offsetX + traceGap + traceWidth) > (fullLayout.width - (fullLayout.margin.r + fullLayout.margin.l))) {
                offsetX = 0;
                rowHeight = rowHeight + maxTraceHeight;
                opts.height = opts.height + maxTraceHeight;
                // reset for next row
                maxTraceHeight = 0;
            }

            Drawing.setTranslate(this,
                (borderwidth + offsetX),
                (5 + borderwidth + legendItem.height / 2) + rowHeight);

            opts.width += traceGap + traceWidth;
            opts.height = Math.max(opts.height, legendItem.height);

            // keep track of tallest trace in group
            offsetX += traceGap + traceWidth;
            maxTraceHeight = Math.max(legendItem.height, maxTraceHeight);
        });

        opts.width += borderwidth * 2;
        opts.height += 10 + borderwidth * 2;

    }

    // make sure we're only getting full pixels
    opts.width = Math.ceil(opts.width);
    opts.height = Math.ceil(opts.height);

    traces.each(function(d) {
        var legendItem = d[0],
            bg = d3.select(this).select('.legendtoggle');

        bg.call(Drawing.setRect,
            0,
            -legendItem.height / 2,
            (gd._context.edits.legendText ? 0 : opts.width) + extraWidth,
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
        l: opts.width * ({right: 1, center: 0.5}[xanchor] || 0),
        r: opts.width * ({left: 1, center: 0.5}[xanchor] || 0),
        b: opts.height * ({top: 1, middle: 0.5}[yanchor] || 0),
        t: opts.height * ({bottom: 1, middle: 0.5}[yanchor] || 0)
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
        l: opts.width * ({right: 1, center: 0.5}[xanchor] || 0),
        r: opts.width * ({left: 1, center: 0.5}[xanchor] || 0),
        b: 0,
        t: 0
    });
}
