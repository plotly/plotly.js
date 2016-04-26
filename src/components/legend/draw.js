/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var d3 = require('d3');

var Plotly = require('../../plotly');
var Lib = require('../../lib');
var setCursor = require('../../lib/setcursor');
var Plots = require('../../plots/plots');
var dragElement = require('../dragelement');
var Drawing = require('../drawing');
var Color = require('../color');

var constants = require('./constants');
var getLegendData = require('./get_legend_data');
var style = require('./style');
var helpers = require('./helpers');
var anchorUtils = require('./anchor_utils');


module.exports = function draw(gd) {
    var fullLayout = gd._fullLayout;
    var clipId = 'legend' + fullLayout._uid;

    if(!fullLayout._infolayer || !gd.calcdata) return;

    var opts = fullLayout.legend,
        legendData = fullLayout.showlegend && getLegendData(gd.calcdata, opts),
        hiddenSlices = fullLayout.hiddenlabels || [];

    if(!fullLayout.showlegend || !legendData.length) {
        fullLayout._infolayer.selectAll('.legend').remove();
        fullLayout._topdefs.select('#' + clipId).remove();

        Plots.autoMargin(gd, 'legend');
        return;
    }

    if(typeof gd.firstRender === 'undefined') gd.firstRender = true;
    else if(gd.firstRender) gd.firstRender = false;

    var legend = createRootNode(),     // root element (sets legend position)
        clipPath = createClipPath(),   // legend clip path
        bg = createBackground(),       // legend background and border
        scrollBox = createScrollBox(), // contains all the legend traces
        scrollBar = createScrollBar(), // scroll bar (visible only if needed)
        groups = createGroups(),       // legend groups
        traces = createLegendTraces(); // legend traces

    positionLegend();

    function createRootNode() {
        var legend = fullLayout._infolayer.selectAll('g.legend')
            .data([0]);

        legend.enter().append('g')
            .attr({
                'class': 'legend',
                'pointer-events': 'all'
            });

        return legend;
    }

    function createClipPath() {
        var clipPath = fullLayout._topdefs.selectAll('#' + clipId)
            .data([0]);

        clipPath.enter().append('clipPath')
            .attr('id', clipId)
            .append('rect');

        return clipPath;
    }

    function createBackground() {
        var bg = legend.selectAll('rect.bg')
            .data([0]);

        bg.enter().append('rect')
            .attr({
                'class': 'bg',
                'shape-rendering': 'crispEdges'
            })
            .call(Color.stroke, opts.bordercolor)
            .call(Color.fill, opts.bgcolor)
            .style('stroke-width', opts.borderwidth + 'px');

        return bg;
    }

    function createScrollBox() {
        var scrollBox = legend.selectAll('g.scrollbox')
            .data([0]);

        scrollBox.enter().append('g')
            .attr('class', 'scrollbox');

        return scrollBox;
    }

    function createScrollBar() {
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

        return scrollBar;
    }

    function createGroups() {
        var groups = scrollBox.selectAll('g.groups')
            .data(legendData);

        groups.enter().append('g')
            .attr('class', 'groups');

        groups.exit().remove();

        if(helpers.isGrouped(opts)) {
            groups.attr('transform', function(d, i) {
                return 'translate(0,' + i * opts.tracegroupgap + ')';
            });
        }

        return groups;
    }

    function createLegendTraces() {
        var traces = groups.selectAll('g.traces')
            .data(Lib.identity);

        traces.enter().append('g').attr('class', 'traces');
        traces.exit().remove();

        traces.call(style)
            .style('opacity', function(d) {
                var trace = d[0].trace;
                if(Plots.traceIs(trace, 'pie')) {
                    return hiddenSlices.indexOf(d[0].label) !== -1 ? 0.5 : 1;
                } else {
                    return trace.visible === 'legendonly' ? 0.5 : 1;
                }
            })
            .each(function(d, i) {
                drawLegendTraces(this, gd, d, i, traces);
                setupTraceToggle(this, gd, d);
            });

        return traces;
    }

    function drawLegendTraces(context, gd, d, i, traces) {
        var fullLayout = gd._fullLayout,
            trace = d[0].trace,
            isPie = Plots.traceIs(trace, 'pie'),
            traceIndex = trace.index,
            name = isPie ? d[0].label : trace.name;

        var text = d3.select(context).selectAll('text.legendtext')
            .data([0]);
        text.enter().append('text').classed('legendtext', true);
        text.attr({
            x: 40,
            y: 0,
            'data-unformatted': name
        })
        .style('text-anchor', 'start')
        .classed('user-select-none', true)
        .call(Drawing.font, fullLayout.legend.font)
        .text(name);

        function textLayout(s) {
            Plotly.util.convertToTspans(s, function() {
                if(gd.firstRender) {
                    computeLegendSize(gd, traces);
                    expandMargin(gd);
                }
            });
            s.selectAll('tspan.line').attr({x: s.attr('x')});
        }

        if(gd._context.editable && !isPie) {
            text.call(Plotly.util.makeEditable)
                .call(textLayout)
                .on('edit', function(text) {
                    this.attr({'data-unformatted': text});
                    this.text(text)
                        .call(textLayout);
                    if(!this.text()) text = ' \u0020\u0020 ';
                    Plotly.restyle(gd, 'name', text, traceIndex);
                });
        }
        else text.call(textLayout);
    }

    function setupTraceToggle(context, gd, d) {
        var traceToggle = d3.select(context).selectAll('rect')
            .data([0]);

        traceToggle.enter().append('rect')
            .classed('legendtoggle', true)
            .style('cursor', 'pointer')
            .attr('pointer-events', 'all')
            .call(Color.fill, 'rgba(0,0,0,0)');

        traceToggle.on('click', function() {
            if(gd._dragged) return;

            var fullData = gd._fullData,
                trace = d[0].trace,
                legendgroup = trace.legendgroup,
                traceIndicesInGroup = [],
                tracei,
                newVisible;

            if(Plots.traceIs(trace, 'pie')) {
                var thisLabel = d[0].label,
                    newHiddenSlices = hiddenSlices.slice(),
                    thisLabelIndex = newHiddenSlices.indexOf(thisLabel);

                if(thisLabelIndex === -1) newHiddenSlices.push(thisLabel);
                else newHiddenSlices.splice(thisLabelIndex, 1);

                Plotly.relayout(gd, 'hiddenlabels', newHiddenSlices);
            } else {
                if(legendgroup === '') {
                    traceIndicesInGroup = [trace.index];
                } else {
                    for(var i = 0; i < fullData.length; i++) {
                        tracei = fullData[i];
                        if(tracei.legendgroup === legendgroup) {
                            traceIndicesInGroup.push(tracei.index);
                        }
                    }
                }

                newVisible = trace.visible === true ? 'legendonly' : true;
                Plotly.restyle(gd, 'visible', newVisible, traceIndicesInGroup);
            }
        });
    }

    function positionLegend() {
        computeLegendSize(gd, traces);  // updates opts

        // If the legend height doesn't fit in the plot area,
        // expand only the horizontal margin.
        if(opts.height > fullLayout.height) {
            expandHorizontalMargin(gd);
        } else {
            expandMargin(gd);
        }

        var lx,            // legend x coordinate
            ly,            // legend y coordinate
            legendHeight;  // legend visible height
        computeLegendPosition();  // updates lx, ly and legendHeight

        // Set size and position of all the elements that make up a legend:
        // legend, background and border, scroll box and scroll bar
        legend.attr('transform', 'translate(' + lx + ',' + ly + ')');

        // This attribute is only needed to help the jasmine tests
        legend.attr('data-height', legendHeight);

        bg.attr({
            width: opts.width - 2 * opts.borderwidth,
            height: legendHeight - 2 * opts.borderwidth,
            x: opts.borderwidth,
            y: opts.borderwidth
        });

        var dataScroll = scrollBox.attr('data-scroll') || 0;
        scrollBox.attr('transform', 'translate(0, ' + dataScroll + ')');

        clipPath.select('rect').attr({
            width: opts.width - 2 * opts.borderwidth,
            height: legendHeight - 2 * opts.borderwidth,
            x: opts.borderwidth,
            y: opts.borderwidth - dataScroll
        });

        scrollBox.call(Drawing.setClipUrl, clipId);

        if(opts.height - legendHeight > 0 && !gd._context.staticPlot) {
            // Show the scrollbar only if needed and requested
            positionScrollBar(legendHeight);
        }

        if(gd._context.editable) setupDragElement();

        function positionScrollBar(legendHeight) {
            bg.attr({
                width: opts.width -
                    2 * opts.borderwidth +
                    constants.scrollBarWidth +
                    constants.scrollBarMargin
            });

            clipPath.select('rect').attr({
                width: opts.width -
                    2 * opts.borderwidth +
                    constants.scrollBarWidth +
                    constants.scrollBarMargin
            });

            if(gd.firstRender) {
                // Move scrollbar to starting position
                scrollHandler(constants.scrollBarMargin, 0);
            }

            // Handle wheel and drag events
            var scrollBarYMax = legendHeight -
                    constants.scrollBarHeight -
                    2 * constants.scrollBarMargin,
                scrollBoxYMax = opts.height - legendHeight,
                scrollBarY = constants.scrollBarMargin,
                scrollBoxY = 0;

            scrollHandler(scrollBarY, scrollBoxY);

            legend.on('wheel',null);
            legend.on('wheel', function() {
                scrollBoxY = Lib.constrain(
                    scrollBox.attr('data-scroll') -
                        d3.event.deltaY / scrollBarYMax * scrollBoxYMax,
                    -scrollBoxYMax, 0);
                scrollBarY = constants.scrollBarMargin -
                    scrollBoxY / scrollBoxYMax * scrollBarYMax;
                scrollHandler(scrollBarY, scrollBoxY);
                d3.event.preventDefault();
            });

            scrollBar.on('.drag',null);
            scrollBox.on('.drag',null);
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

            function scrollHandler(scrollBarY, scrollBoxY) {
                scrollBox.attr('data-scroll', scrollBoxY);
                scrollBox.attr('transform', 'translate(0, ' + scrollBoxY + ')');
                scrollBar.call(
                    Drawing.setRect,
                    opts.width,
                    scrollBarY,
                    constants.scrollBarWidth,
                    constants.scrollBarHeight
                );
                clipPath.select('rect').attr({
                    y: opts.borderwidth - scrollBoxY
                });
            }
        }

        function setupDragElement() {
            var xf,
                yf,
                x0,
                y0,
                lw,
                lh;

            dragElement({
                element: legend.node(),
                prepFn: function() {
                    x0 = Number(legend.attr('x'));
                    y0 = Number(legend.attr('y'));
                    lw = Number(legend.attr('width'));
                    lh = Number(legend.attr('height'));
                    setCursor(legend);
                },
                moveFn: function(dx, dy) {
                    var gs = gd._fullLayout._size;

                    legend.call(Drawing.setPosition, x0+dx, y0+dy);

                    xf = dragElement.align(x0+dx, lw, gs.l, gs.l+gs.w,
                        opts.xanchor);
                    yf = dragElement.align(y0+dy+lh, -lh, gs.t+gs.h, gs.t,
                        opts.yanchor);

                    var csr = dragElement.getCursor(xf, yf,
                        opts.xanchor, opts.yanchor);
                    setCursor(legend, csr);
                },
                doneFn: function(dragged) {
                    setCursor(legend);
                    if(dragged && xf !== undefined && yf !== undefined) {
                        Plotly.relayout(gd, {'legend.x': xf, 'legend.y': yf});
                    }
                }
            });
        }

        function computeLegendPosition() {
            var gs = fullLayout._size;

            lx = gs.l + gs.w * opts.x,
            ly = gs.t + gs.h * (1-opts.y);

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

            // Make sure the legend top and bottom are visible
            // (legends with a scroll bar are not allowed to stretch beyond the
            // extended margins)
            legendHeight = opts.height;

            if(legendHeight > gs.h) {
                ly = gs.t;
                legendHeight = gs.h;
            }
            else {
                if(ly > fullLayout.height) {
                    ly = fullLayout.height - legendHeight;
                }
                if(ly < 0) ly = 0;
                legendHeight = Math.min(fullLayout.height - ly, opts.height);
            }
        }

    }
};

function computeLegendSize(gd, traces) {
    var fullLayout = gd._fullLayout,
        opts = fullLayout.legend,
        borderwidth = opts.borderwidth;

    opts.width = 0;
    opts.height = 0;

    traces.each(function(d) {
        var trace = d[0].trace,
            g = d3.select(this),
            bg = g.selectAll('.legendtoggle'),
            text = g.selectAll('.legendtext'),
            tspans = g.selectAll('.legendtext>tspan'),
            tHeight = opts.font.size * 1.3,
            tLines = tspans[0].length || 1,
            tWidth = text.node() && Drawing.bBox(text.node()).width,
            mathjaxGroup = g.select('g[class*=math-group]'),
            textY,
            tHeightFull;

        if(!trace.showlegend) {
            g.remove();
            return;
        }

        if(mathjaxGroup.node()) {
            var mathjaxBB = Drawing.bBox(mathjaxGroup.node());
            tHeight = mathjaxBB.height;
            tWidth = mathjaxBB.width;
            mathjaxGroup.attr('transform',
                'translate(0,' + (tHeight / 4) + ')');
        }
        else {
            // approximation to height offset to center the font
            // to avoid getBoundingClientRect
            textY = tHeight * (0.3 + (1 - tLines) / 2);
            text.attr('y', textY);
            tspans.attr('y', textY);
        }

        tHeightFull = Math.max(tHeight * tLines, 16) + 3;

        g.attr('transform',
            'translate(' + borderwidth + ',' +
                (5 + borderwidth + opts.height + tHeightFull / 2) +
            ')'
        );
        bg.attr({x: 0, y: -tHeightFull / 2, height: tHeightFull});

        opts.height += tHeightFull;
        opts.width = Math.max(opts.width, tWidth || 0);
    });

    opts.width += 45 + borderwidth * 2;
    opts.height += 10 + borderwidth * 2;

    if(helpers.isGrouped(opts)) {
        opts.height += (opts._lgroupsLength-1) * opts.tracegroupgap;
    }

    traces.selectAll('.legendtoggle')
        .attr('width', (gd._context.editable ? 0 : opts.width) + 40);

    // make sure we're only getting full pixels
    opts.width = Math.ceil(opts.width);
    opts.height = Math.ceil(opts.height);
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
