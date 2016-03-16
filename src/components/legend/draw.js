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
var Plots = require('../../plots/plots');
var Fx = require('../../plots/cartesian/graph_interact');
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

    var legend = fullLayout._infolayer.selectAll('g.legend')
        .data([0]);

    legend.enter().append('g')
        .attr({
            'class': 'legend',
            'pointer-events': 'all'
        });

    var clipPath = fullLayout._topdefs.selectAll('#' + clipId)
        .data([0])
      .enter().append('clipPath')
        .attr('id', clipId)
        .append('rect');

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

    if(helpers.isGrouped(opts)) {
        groups.attr('transform', function(d, i) {
            return 'translate(0,' + i * opts.tracegroupgap + ')';
        });
    }

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
            drawTexts(this, gd, d, i, traces);

            var traceToggle = d3.select(this).selectAll('rect')
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
        });

    // Position and size the legend
    repositionLegend(gd, traces);

    // Scroll section must be executed after repositionLegend.
    // It requires the legend width, height, x and y to position the scrollbox
    // and these values are mutated in repositionLegend.
    var gs = fullLayout._size,
        lx = gs.l + gs.w * opts.x,
        ly = gs.t + gs.h * (1-opts.y);

    if(anchorUtils.isRightAnchor(opts)) {
        lx -= opts.width;
    }
    if(anchorUtils.isCenterAnchor(opts)) {
        lx -= opts.width / 2;
    }

    if(anchorUtils.isBottomAnchor(opts)) {
        ly -= opts.height;
    }
    if(anchorUtils.isMiddleAnchor(opts)) {
        ly -= opts.height / 2;
    }

    // Deal with scrolling
    var plotHeight = fullLayout.height - fullLayout.margin.b,
        scrollheight = Math.min(plotHeight - ly, opts.height),
        scrollPosition = scrollBox.attr('data-scroll') ? scrollBox.attr('data-scroll') : 0;

    scrollBox.attr('transform', 'translate(0, ' + scrollPosition + ')');

    bg.attr({
        width: opts.width - 2 * opts.borderwidth,
        height: scrollheight - 2 * opts.borderwidth,
        x: opts.borderwidth,
        y: opts.borderwidth
    });

    legend.attr('transform', 'translate(' + lx + ',' + ly + ')');

    clipPath.attr({
        width: opts.width,
        height: scrollheight,
        x: 0,
        y: 0
    });

    legend.call(Drawing.setClipUrl, clipId);

    // If scrollbar should be shown.
    if(gd.firstRender && opts.height - scrollheight > 0 && !gd._context.staticPlot) {
        bg.attr({
            width: opts.width - 2 * opts.borderwidth + constants.scrollBarWidth
        });

        clipPath.attr({
            width: opts.width + constants.scrollBarWidth
        });

        legend.node().addEventListener('wheel', function(e) {
            e.preventDefault();
            scrollHandler(e.deltaY / 20);
        });

        scrollBar.node().addEventListener('mousedown', function(e) {
            e.preventDefault();

            function mMove(e) {
                if(e.buttons === 1) {
                    scrollHandler(e.movementY);
                }
            }

            function mUp() {
                scrollBar.node().removeEventListener('mousemove', mMove);
                window.removeEventListener('mouseup', mUp);
            }

            window.addEventListener('mousemove', mMove);
            window.addEventListener('mouseup', mUp);
        });

        // Move scrollbar to starting position on the first render
        scrollBar.call(
            Drawing.setRect,
            opts.width - (constants.scrollBarWidth + constants.scrollBarMargin),
            constants.scrollBarMargin,
            constants.scrollBarWidth,
            constants.scrollBarHeight
        );
    }

    function scrollHandler(delta) {

        var scrollBarTrack = scrollheight - constants.scrollBarHeight - 2 * constants.scrollBarMargin,
            translateY = scrollBox.attr('data-scroll'),
            scrollBoxY = Lib.constrain(translateY - delta, Math.min(scrollheight - opts.height, 0), 0),
            scrollBarY = -scrollBoxY / (opts.height - scrollheight) * scrollBarTrack + constants.scrollBarMargin;

        scrollBox.attr('data-scroll', scrollBoxY);
        scrollBox.attr('transform', 'translate(0, ' + scrollBoxY + ')');
        scrollBar.call(
            Drawing.setRect,
            opts.width - (constants.scrollBarWidth + constants.scrollBarMargin),
            scrollBarY,
            constants.scrollBarWidth,
            constants.scrollBarHeight
        );
    }

    if(gd._context.editable) {
        var xf,
            yf,
            x0,
            y0,
            lw,
            lh;

        Fx.dragElement({
            element: legend.node(),
            prepFn: function() {
                x0 = Number(legend.attr('x'));
                y0 = Number(legend.attr('y'));
                lw = Number(legend.attr('width'));
                lh = Number(legend.attr('height'));
                Fx.setCursor(legend);
            },
            moveFn: function(dx, dy) {
                var gs = gd._fullLayout._size;

                legend.call(Drawing.setPosition, x0+dx, y0+dy);

                xf = Fx.dragAlign(x0+dx, lw, gs.l, gs.l+gs.w,
                    opts.xanchor);
                yf = Fx.dragAlign(y0+dy+lh, -lh, gs.t+gs.h, gs.t,
                    opts.yanchor);

                var csr = Fx.dragCursors(xf, yf,
                    opts.xanchor, opts.yanchor);
                Fx.setCursor(legend, csr);
            },
            doneFn: function(dragged) {
                Fx.setCursor(legend);
                if(dragged && xf !== undefined && yf !== undefined) {
                    Plotly.relayout(gd, {'legend.x': xf, 'legend.y': yf});
                }
            }
        });
    }
};

function drawTexts(context, gd, d, i, traces) {
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
            if(gd.firstRender) repositionLegend(gd, traces);
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

function repositionLegend(gd, traces) {
    var fullLayout = gd._fullLayout,
        gs = fullLayout._size,
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
            mathjaxGroup.attr('transform','translate(0,' + (tHeight / 4) + ')');
        }
        else {
            // approximation to height offset to center the font
            // to avoid getBoundingClientRect
            textY = tHeight * (0.3 + (1-tLines) / 2);
            text.attr('y',textY);
            tspans.attr('y',textY);
        }

        tHeightFull = Math.max(tHeight*tLines, 16) + 3;

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

    // now position the legend. for both x,y the positions are recorded as
    // fractions of the plot area (left, bottom = 0,0). Outside the plot
    // area is allowed but position will be clipped to the page.
    // values <1/3 align the low side at that fraction, 1/3-2/3 align the
    // center at that fraction, >2/3 align the right at that fraction

    var lx = gs.l + gs.w * opts.x,
        ly = gs.t + gs.h * (1-opts.y);

    var xanchor = 'left';
    if(anchorUtils.isRightAnchor(opts)) {
        lx -= opts.width;
        xanchor = 'right';
    }
    if(anchorUtils.isCenterAnchor(opts)) {
        lx -= opts.width / 2;
        xanchor = 'center';
    }

    var yanchor = 'top';
    if(anchorUtils.isBottomAnchor(opts)) {
        ly -= opts.height;
        yanchor = 'bottom';
    }
    if(anchorUtils.isMiddleAnchor(opts)) {
        ly -= opts.height / 2;
        yanchor = 'middle';
    }

    // make sure we're only getting full pixels
    opts.width = Math.ceil(opts.width);
    opts.height = Math.ceil(opts.height);
    lx = Math.round(lx);
    ly = Math.round(ly);

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
