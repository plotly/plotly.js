/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Plotly = require('../../plotly');
var d3 = require('d3');

var Lib = require('../../lib');

var Plots = require('../../plots/plots');
var Fx = require('../../plots/cartesian/graph_interact');

var Color = require('../color');
var Drawing = require('../drawing');

var subTypes = require('../../traces/scatter/subtypes');
var styleOne = require('../../traces/pie/style_one');

var legend = module.exports = {};

var constants = require('./constants');
legend.layoutAttributes = require('./attributes');

legend.supplyLayoutDefaults = function(layoutIn, layoutOut, fullData) {
    var containerIn = layoutIn.legend || {},
        containerOut = layoutOut.legend = {};

    var visibleTraces = 0,
        defaultOrder = 'normal',
        trace;

    for(var i = 0; i < fullData.length; i++) {
        trace = fullData[i];

        if(legendGetsTrace(trace)) {
            visibleTraces++;
            // always show the legend by default if there's a pie
            if(Plots.traceIs(trace, 'pie')) visibleTraces++;
        }

        if((Plots.traceIs(trace, 'bar') && layoutOut.barmode==='stack') ||
                ['tonextx','tonexty'].indexOf(trace.fill)!==-1) {
            defaultOrder = isGrouped({traceorder: defaultOrder}) ?
                'grouped+reversed' : 'reversed';
        }

        if(trace.legendgroup !== undefined && trace.legendgroup !== '') {
            defaultOrder = isReversed({traceorder: defaultOrder}) ?
                'reversed+grouped' : 'grouped';
        }
    }

    function coerce(attr, dflt) {
        return Lib.coerce(containerIn, containerOut,
            legend.layoutAttributes, attr, dflt);
    }

    var showLegend = Lib.coerce(layoutIn, layoutOut,
        Plots.layoutAttributes, 'showlegend', visibleTraces > 1);

    if(showLegend === false) return;

    coerce('bgcolor', layoutOut.paper_bgcolor);
    coerce('bordercolor');
    coerce('borderwidth');
    Lib.coerceFont(coerce, 'font', layoutOut.font);

    coerce('traceorder', defaultOrder);
    if(isGrouped(layoutOut.legend)) coerce('tracegroupgap');

    coerce('x');
    coerce('xanchor');
    coerce('y');
    coerce('yanchor');
    Lib.noneOrAll(containerIn, containerOut, ['x', 'y']);
};

// -----------------------------------------------------
// styling functions for traces in legends.
// same functions for styling traces in the popovers
// -----------------------------------------------------

legend.lines = function(d){
    var trace = d[0].trace,
        showFill = trace.visible && trace.fill && trace.fill!=='none',
        showLine = subTypes.hasLines(trace);

    var fill = d3.select(this).select('.legendfill').selectAll('path')
        .data(showFill ? [d] : []);
    fill.enter().append('path').classed('js-fill',true);
    fill.exit().remove();
    fill.attr('d', 'M5,0h30v6h-30z')
        .call(Drawing.fillGroupStyle);

    var line = d3.select(this).select('.legendlines').selectAll('path')
        .data(showLine ? [d] : []);
    line.enter().append('path').classed('js-line',true)
        .attr('d', 'M5,0h30');
    line.exit().remove();
    line.call(Drawing.lineGroupStyle);
};

legend.points = function(d){
    var d0 = d[0],
        trace = d0.trace,
        showMarkers = subTypes.hasMarkers(trace),
        showText = subTypes.hasText(trace),
        showLines = subTypes.hasLines(trace);

    var dMod, tMod;

    // 'scatter3d' and 'scattergeo' don't use gd.calcdata yet;
    // use d0.trace to infer arrayOk attributes

    function boundVal(attrIn, arrayToValFn, bounds) {
        var valIn = Lib.nestedProperty(trace, attrIn).get(),
            valToBound = (Array.isArray(valIn) && arrayToValFn) ?
                arrayToValFn(valIn) : valIn;

        if(bounds) {
            if(valToBound < bounds[0]) return bounds[0];
            else if(valToBound > bounds[1]) return bounds[1];
        }
        return valToBound;
    }

    function pickFirst(array) { return array[0]; }

    // constrain text, markers, etc so they'll fit on the legend
    if(showMarkers || showText || showLines) {
        var dEdit = {},
            tEdit = {};

        if(showMarkers) {
            dEdit.mc = boundVal('marker.color', pickFirst);
            dEdit.mo = boundVal('marker.opacity', Lib.mean, [0.2, 1]);
            dEdit.ms = boundVal('marker.size', Lib.mean, [2, 16]);
            dEdit.mlc = boundVal('marker.line.color', pickFirst);
            dEdit.mlw = boundVal('marker.line.width', Lib.mean, [0, 5]);
            tEdit.marker = {
                sizeref: 1,
                sizemin: 1,
                sizemode: 'diameter'
            };
        }

        if(showLines) {
            tEdit.line = {
                width: boundVal('line.width', pickFirst, [0, 10])
            };
        }

        if(showText) {
            dEdit.tx = 'Aa';
            dEdit.tp = boundVal('textposition', pickFirst);
            dEdit.ts = 10;
            dEdit.tc = boundVal('textfont.color', pickFirst);
            dEdit.tf = boundVal('textfont.family', pickFirst);
        }

        dMod = [Lib.minExtend(d0, dEdit)];
        tMod = Lib.minExtend(trace, tEdit);
    }

    var ptgroup = d3.select(this).select('g.legendpoints');

    var pts = ptgroup.selectAll('path.scatterpts')
        .data(showMarkers ? dMod : []);
    pts.enter().append('path').classed('scatterpts', true)
        .attr('transform', 'translate(20,0)');
    pts.exit().remove();
    pts.call(Drawing.pointStyle, tMod);

    // 'mrc' is set in pointStyle and used in textPointStyle:
    // constrain it here
    if(showMarkers) dMod[0].mrc = 3;

    var txt = ptgroup.selectAll('g.pointtext')
        .data(showText ? dMod : []);
    txt.enter()
        .append('g').classed('pointtext',true)
            .append('text').attr('transform', 'translate(20,0)');
    txt.exit().remove();
    txt.selectAll('text').call(Drawing.textPointStyle, tMod);

};

legend.bars = function(d){
    var trace = d[0].trace,
        marker = trace.marker||{},
        markerLine = marker.line||{},
        barpath = d3.select(this).select('g.legendpoints')
            .selectAll('path.legendbar')
            .data(Plots.traceIs(trace, 'bar') ? [d] : []);
    barpath.enter().append('path').classed('legendbar',true)
        .attr('d','M6,6H-6V-6H6Z')
        .attr('transform','translate(20,0)');
    barpath.exit().remove();
    barpath.each(function(d){
        var w = (d.mlw+1 || markerLine.width+1) - 1,
            p = d3.select(this);
        p.style('stroke-width',w+'px')
            .call(Color.fill, d.mc || marker.color);
        if(w) {
            p.call(Color.stroke, d.mlc || markerLine.color);
        }
    });
};

legend.boxes = function(d){
    var trace = d[0].trace,
        pts = d3.select(this).select('g.legendpoints')
            .selectAll('path.legendbox')
            .data(Plots.traceIs(trace, 'box') && trace.visible ? [d] : []);
    pts.enter().append('path').classed('legendbox', true)
        // if we want the median bar, prepend M6,0H-6
        .attr('d', 'M6,6H-6V-6H6Z')
        .attr('transform', 'translate(20,0)');
    pts.exit().remove();
    pts.each(function(d){
        var w = (d.lw+1 || trace.line.width+1) - 1,
            p = d3.select(this);
        p.style('stroke-width', w+'px')
            .call(Color.fill, d.fc || trace.fillcolor);
        if(w) {
            p.call(Color.stroke, d.lc || trace.line.color);
        }
    });
};

legend.pie = function(d) {
    var trace = d[0].trace,
        pts = d3.select(this).select('g.legendpoints')
            .selectAll('path.legendpie')
            .data(Plots.traceIs(trace, 'pie') && trace.visible ? [d] : []);
    pts.enter().append('path').classed('legendpie', true)
        .attr('d', 'M6,6H-6V-6H6Z')
        .attr('transform', 'translate(20,0)');
    pts.exit().remove();

    if(pts.size()) pts.call(styleOne, d[0], trace);
};

legend.style = function(s) {
    s.each(function(d){
        var traceGroup = d3.select(this);

        var fill = traceGroup
            .selectAll('g.legendfill')
                .data([d]);
        fill.enter().append('g')
            .classed('legendfill',true);

        var line = traceGroup
            .selectAll('g.legendlines')
                .data([d]);
        line.enter().append('g')
            .classed('legendlines',true);

        var symbol = traceGroup
            .selectAll('g.legendsymbols')
                .data([d]);
        symbol.enter().append('g')
            .classed('legendsymbols',true);
        symbol.style('opacity', d[0].trace.opacity);

        symbol.selectAll('g.legendpoints')
            .data([d])
          .enter().append('g')
            .classed('legendpoints',true);
    })
    .each(legend.bars)
    .each(legend.boxes)
    .each(legend.pie)
    .each(legend.lines)
    .each(legend.points);
};

legend.texts = function(context, td, d, i, traces){
    var fullLayout = td._fullLayout,
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
    .style({
        'text-anchor': 'start',
        '-webkit-user-select': 'none',
        '-moz-user-select': 'none',
        '-ms-user-select': 'none',
        'user-select': 'none'
    })
    .call(Drawing.font, fullLayout.legend.font)
    .text(name);

    function textLayout(s){
        Plotly.util.convertToTspans(s, function(){
            if(td.firstRender) legend.repositionLegend(td, traces);
        });
        s.selectAll('tspan.line').attr({x: s.attr('x')});
    }

    if(td._context.editable && !isPie){
        text.call(Plotly.util.makeEditable)
            .call(textLayout)
            .on('edit', function(text){
                this.attr({'data-unformatted': text});
                this.text(text)
                    .call(textLayout);
                if(!this.text()) text = ' \u0020\u0020 ';
                Plotly.restyle(td, 'name', text, traceIndex);
            });
    }
    else text.call(textLayout);
};

// -----------------------------------------------------
// legend drawing
// -----------------------------------------------------

function legendGetsTrace(trace) {
    return trace.visible && Plots.traceIs(trace, 'showLegend');
}

function isGrouped(legendLayout) {
    return (legendLayout.traceorder || '').indexOf('grouped') !== -1;
}

function isReversed(legendLayout) {
    return (legendLayout.traceorder || '').indexOf('reversed') !== -1;
}

legend.getLegendData = function(calcdata, opts) {

    // build an { legendgroup: [cd0, cd0], ... } object
    var lgroupToTraces = {},
        lgroups = [],
        hasOneNonBlankGroup = false,
        slicesShown = {},
        lgroupi = 0;

    var cd, cd0, trace, lgroup, i, j, labelj;

    function addOneItem(legendGroup, legendItem) {
        // each '' legend group is treated as a separate group
        if(legendGroup==='' || !isGrouped(opts)) {
            var uniqueGroup = '~~i' + lgroupi; // TODO: check this against fullData legendgroups?
            lgroups.push(uniqueGroup);
            lgroupToTraces[uniqueGroup] = [[legendItem]];
            lgroupi++;
        }
        else if(lgroups.indexOf(legendGroup) === -1) {
            lgroups.push(legendGroup);
            hasOneNonBlankGroup = true;
            lgroupToTraces[legendGroup] = [[legendItem]];
        }
        else lgroupToTraces[legendGroup].push([legendItem]);
    }

    for(i = 0; i < calcdata.length; i++) {
        cd = calcdata[i];
        cd0 = cd[0];
        trace = cd0.trace;
        lgroup = trace.legendgroup;

        if(!legendGetsTrace(trace) || !trace.showlegend) continue;

        if(Plots.traceIs(trace, 'pie')) {
            if(!slicesShown[lgroup]) slicesShown[lgroup] = {};
            for(j = 0; j < cd.length; j++) {
                labelj = cd[j].label;
                if(!slicesShown[lgroup][labelj]) {
                    addOneItem(lgroup, {
                        label: labelj,
                        color: cd[j].color,
                        i: cd[j].i,
                        trace: trace
                    });

                    slicesShown[lgroup][labelj] = true;
                }
            }
        }

        else addOneItem(lgroup, cd0);
    }

    // won't draw a legend in this case
    if(!lgroups.length) return [];

    // rearrange lgroupToTraces into a d3-friendly array of arrays
    var lgroupsLength = lgroups.length,
        ltraces,
        legendData;

    if(hasOneNonBlankGroup && isGrouped(opts)) {
        legendData = new Array(lgroupsLength);
        for(i = 0; i < lgroupsLength; i++) {
            ltraces = lgroupToTraces[lgroups[i]];
            legendData[i] = isReversed(opts) ? ltraces.reverse() : ltraces;
        }
    }
    else {
        // collapse all groups into one if all groups are blank
        legendData = [new Array(lgroupsLength)];
        for(i = 0; i < lgroupsLength; i++) {
            ltraces = lgroupToTraces[lgroups[i]][0];
            legendData[0][isReversed(opts) ? lgroupsLength-i-1 : i] = ltraces;
        }
        lgroupsLength = 1;
    }

    // needed in repositionLegend
    opts._lgroupsLength = lgroupsLength;
    return legendData;
};

legend.draw = function(td) {
    var fullLayout = td._fullLayout;

    if(!fullLayout._infolayer || !td.calcdata) return;

    var opts = fullLayout.legend,
        legendData = fullLayout.showlegend && legend.getLegendData(td.calcdata, opts),
        hiddenSlices = fullLayout.hiddenlabels || [];

    if(!fullLayout.showlegend || !legendData.length) {
        fullLayout._infolayer.selectAll('.legend').remove();
        Plots.autoMargin(td, 'legend');
        return;
    }

    if(typeof td.firstRender === 'undefined') td.firstRender = true;
    else if(td.firstRender) td.firstRender = false;

    var legendsvg = fullLayout._infolayer.selectAll('svg.legend')
        .data([0]);
    legendsvg.enter().append('svg')
        .attr({
            'class': 'legend',
            'pointer-events': 'all'
        });

    var bg = legendsvg.selectAll('rect.bg')
        .data([0]);
    bg.enter().append('rect')
        .attr({
            'class': 'bg',
            'shape-rendering': 'crispEdges'
        })
        .call(Color.stroke, opts.bordercolor)
        .call(Color.fill, opts.bgcolor)
        .style('stroke-width', opts.borderwidth + 'px');

    var scrollBox = legendsvg.selectAll('g.scrollbox')
        .data([0]);
    scrollBox.enter().append('g')
        .attr('class', 'scrollbox');
    scrollBox.exit().remove();

    var scrollBar = legendsvg.selectAll('rect.scrollbar')
        .data([0]);
    scrollBar.enter().append('rect')
        .attr({
            'class': 'scrollbar',
            'rx': 20,
            'ry': 2
        })
        .call(Color.fill, '#808BA4');

    var groups = scrollBox.selectAll('g.groups')
        .data(legendData);
    groups.enter().append('g')
        .attr('class', 'groups');
    groups.exit().remove();

    if(isGrouped(opts)) {
        groups.attr('transform', function(d, i) {
            return 'translate(0,' + i * opts.tracegroupgap + ')';
        });
    }

    var traces = groups.selectAll('g.traces')
        .data(Lib.identity);

    traces.enter().append('g').attr('class', 'traces');
    traces.exit().remove();

    traces.call(legend.style)
        .style('opacity', function(d) {
            var trace = d[0].trace;
            if(Plots.traceIs(trace, 'pie')) {
                return hiddenSlices.indexOf(d[0].label) !== -1 ? 0.5 : 1;
            } else {
                return trace.visible === 'legendonly' ? 0.5 : 1;
            }
        })
        .each(function(d, i) {
            legend.texts(this, td, d, i, traces);

            var traceToggle = d3.select(this).selectAll('rect')
                .data([0]);
            traceToggle.enter().append('rect')
                .classed('legendtoggle', true)
                .style('cursor', 'pointer')
                .attr('pointer-events', 'all')
                .call(Color.fill, 'rgba(0,0,0,0)');
            traceToggle.on('click', function() {
                if(td._dragged) return;

                var fullData = td._fullData,
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

                    Plotly.relayout(td, 'hiddenlabels', newHiddenSlices);
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
                    Plotly.restyle(td, 'visible', newVisible, traceIndicesInGroup);
                }
            });
        });

    // Position and size the legend
    legend.repositionLegend(td, traces);

    // Scroll section must be executed after repositionLegend.
    // It requires the legend width, height, x and y to position the scrollbox
    // and these values are mutated in repositionLegend.
    var gs = fullLayout._size,
        lx = gs.l + gs.w * opts.x,
        ly = gs.t + gs.h * (1-opts.y);

    if(opts.xanchor === 'right' || (opts.xanchor === 'auto' && opts.x >= 2 / 3)) {
        lx -= opts.width;
    }
    else if(opts.xanchor === 'center' || (opts.xanchor === 'auto' && opts.x > 1 / 3)) {
        lx -= opts.width / 2;
    }

    if(opts.yanchor === 'bottom' || (opts.yanchor === 'auto' && opts.y <= 1 / 3)) {
        ly -= opts.height;
    }
    else if(opts.yanchor === 'middle' || (opts.yanchor === 'auto' && opts.y < 2 / 3)) {
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

    legendsvg.call(Drawing.setRect, lx, ly, opts.width, scrollheight);

    // If scrollbar should be shown.
    if(td.firstRender && opts.height - scrollheight > 0 && !td._context.staticPlot){

        bg.attr({ width: opts.width - 2 * opts.borderwidth + constants.scrollBarWidth });

        legendsvg.node().addEventListener('wheel', function(e){
            e.preventDefault();
            scrollHandler(e.deltaY / 20);
        });

        scrollBar.node().addEventListener('mousedown', function(e) {
            e.preventDefault();

            function mMove(e) {
                if(e.buttons === 1){
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

    function scrollHandler(delta){

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

    if(td._context.editable) {
        var xf,
            yf,
            x0,
            y0,
            lw,
            lh;

        Fx.dragElement({
            element: legendsvg.node(),
            prepFn: function() {
                x0 = Number(legendsvg.attr('x'));
                y0 = Number(legendsvg.attr('y'));
                lw = Number(legendsvg.attr('width'));
                lh = Number(legendsvg.attr('height'));
                Fx.setCursor(legendsvg);
            },
            moveFn: function(dx, dy) {
                var gs = td._fullLayout._size;

                legendsvg.call(Drawing.setPosition, x0+dx, y0+dy);

                xf = Fx.dragAlign(x0+dx, lw, gs.l, gs.l+gs.w,
                    opts.xanchor);
                yf = Fx.dragAlign(y0+dy+lh, -lh, gs.t+gs.h, gs.t,
                    opts.yanchor);

                var csr = Fx.dragCursors(xf, yf,
                    opts.xanchor, opts.yanchor);
                Fx.setCursor(legendsvg, csr);
            },
            doneFn: function(dragged) {
                Fx.setCursor(legendsvg);
                if(dragged && xf !== undefined && yf !== undefined) {
                    Plotly.relayout(td, {'legend.x': xf, 'legend.y': yf});
                }
            }
        });
    }
};

legend.repositionLegend = function(td, traces){
    var fullLayout = td._fullLayout,
        gs = fullLayout._size,
        opts = fullLayout.legend,
        borderwidth = opts.borderwidth;

    opts.width = 0,
    opts.height = 0,

    traces.each(function(d){
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

    if(isGrouped(opts)) opts.height += (opts._lgroupsLength-1) * opts.tracegroupgap;

    traces.selectAll('.legendtoggle')
        .attr('width', (td._context.editable ? 0 : opts.width) + 40);

    // now position the legend. for both x,y the positions are recorded as
    // fractions of the plot area (left, bottom = 0,0). Outside the plot
    // area is allowed but position will be clipped to the page.
    // values <1/3 align the low side at that fraction, 1/3-2/3 align the
    // center at that fraction, >2/3 align the right at that fraction

    var lx = gs.l + gs.w * opts.x,
        ly = gs.t + gs.h * (1-opts.y);

    var xanchor = 'left';
    if(opts.xanchor === 'right' || (opts.xanchor === 'auto' && opts.x >= 2 / 3)) {
        lx -= opts.width;
        xanchor = 'right';
    }
    else if(opts.xanchor === 'center' || (opts.xanchor === 'auto' && opts.x > 1 / 3)) {
        lx -= opts.width / 2;
        xanchor = 'center';
    }

    var yanchor = 'top';
    if(opts.yanchor === 'bottom' || (opts.yanchor === 'auto' && opts.y <= 1 / 3)) {
        ly -= opts.height;
        yanchor = 'bottom';
    }
    else if(opts.yanchor === 'middle' || (opts.yanchor === 'auto' && opts.y < 2 / 3)) {
        ly -= opts.height / 2;
        yanchor = 'middle';
    }

    // make sure we're only getting full pixels
    opts.width = Math.ceil(opts.width);
    opts.height = Math.ceil(opts.height);
    lx = Math.round(lx);
    ly = Math.round(ly);

    // lastly check if the margin auto-expand has changed
    Plots.autoMargin(td,'legend',{
        x: opts.x,
        y: opts.y,
        l: opts.width * ({right:1, center:0.5}[xanchor] || 0),
        r: opts.width * ({left:1, center:0.5}[xanchor] || 0),
        b: opts.height * ({top:1, middle:0.5}[yanchor] || 0),
        t: opts.height * ({bottom:1, middle:0.5}[yanchor] || 0)
    });
};
