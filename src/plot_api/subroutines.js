/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Plotly = require('../plotly');
var Registry = require('../registry');
var Plots = require('../plots/plots');
var Lib = require('../lib');

var Color = require('../components/color');
var Drawing = require('../components/drawing');
var Titles = require('../components/titles');
var ModeBar = require('../components/modebar');


exports.layoutStyles = function(gd) {
    return Lib.syncOrAsync([Plots.doAutoMargin, exports.lsInner], gd);
};

exports.lsInner = function(gd) {
    var fullLayout = gd._fullLayout,
        gs = fullLayout._size,
        axList = Plotly.Axes.list(gd),
        i;

    // clear axis line positions, to be set in the subplot loop below
    for(i = 0; i < axList.length; i++) axList[i]._linepositions = {};

    fullLayout._paperdiv
        .style({
            width: fullLayout.width + 'px',
            height: fullLayout.height + 'px'
        })
        .selectAll('.main-svg')
            .call(Drawing.setSize, fullLayout.width, fullLayout.height);

    gd._context.setBackground(gd, fullLayout.paper_bgcolor);

    var freefinished = [];
    fullLayout._paper.selectAll('g.subplot').each(function(subplot) {
        var plotinfo = fullLayout._plots[subplot],
            xa = Plotly.Axes.getFromId(gd, subplot, 'x'),
            ya = Plotly.Axes.getFromId(gd, subplot, 'y');

        xa.setScale(); // this may already be done... not sure
        ya.setScale();

        if(plotinfo.bg) {
            plotinfo.bg
                .call(Drawing.setRect,
                    xa._offset - gs.p, ya._offset - gs.p,
                    xa._length + 2 * gs.p, ya._length + 2 * gs.p)
                .call(Color.fill, fullLayout.plot_bgcolor);
        }

        // Clip so that data only shows up on the plot area.
        plotinfo.clipId = 'clip' + fullLayout._uid + subplot + 'plot';

        var plotClip = fullLayout._defs.selectAll('g.clips')
            .selectAll('#' + plotinfo.clipId)
            .data([0]);

        plotClip.enter().append('clipPath')
            .attr({
                'class': 'plotclip',
                'id': plotinfo.clipId
            })
            .append('rect');

        plotClip.selectAll('rect')
            .attr({
                'width': xa._length,
                'height': ya._length
            });


        plotinfo.plot.call(Lib.setTranslate, xa._offset, ya._offset);
        plotinfo.plot.call(Drawing.setClipUrl, plotinfo.clipId);

        var xlw = Drawing.crispRound(gd, xa.linewidth, 1),
            ylw = Drawing.crispRound(gd, ya.linewidth, 1),
            xp = gs.p + ylw,
            xpathPrefix = 'M' + (-xp) + ',',
            xpathSuffix = 'h' + (xa._length + 2 * xp),
            showfreex = xa.anchor === 'free' &&
                freefinished.indexOf(xa._id) === -1,
            freeposx = gs.h * (1 - (xa.position||0)) + ((xlw / 2) % 1),
            showbottom =
                (xa.anchor === ya._id && (xa.mirror || xa.side !== 'top')) ||
                xa.mirror === 'all' || xa.mirror === 'allticks' ||
                (xa.mirrors && xa.mirrors[ya._id + 'bottom']),
            bottompos = ya._length + gs.p + xlw / 2,
            showtop =
                (xa.anchor === ya._id && (xa.mirror || xa.side === 'top')) ||
                xa.mirror === 'all' || xa.mirror === 'allticks' ||
                (xa.mirrors && xa.mirrors[ya._id + 'top']),
            toppos = -gs.p - xlw / 2,

            // shorten y axis lines so they don't overlap x axis lines
            yp = gs.p,
            // except where there's no x line
            // TODO: this gets more complicated with multiple x and y axes
            ypbottom = showbottom ? 0 : xlw,
            yptop = showtop ? 0 : xlw,
            ypathSuffix = ',' + (-yp - yptop) +
                'v' + (ya._length + 2 * yp + yptop + ypbottom),
            showfreey = ya.anchor === 'free' &&
                freefinished.indexOf(ya._id) === -1,
            freeposy = gs.w * (ya.position||0) + ((ylw / 2) % 1),
            showleft =
                (ya.anchor === xa._id && (ya.mirror || ya.side !== 'right')) ||
                ya.mirror === 'all' || ya.mirror === 'allticks' ||
                (ya.mirrors && ya.mirrors[xa._id + 'left']),
            leftpos = -gs.p - ylw / 2,
            showright =
                (ya.anchor === xa._id && (ya.mirror || ya.side === 'right')) ||
                ya.mirror === 'all' || ya.mirror === 'allticks' ||
                (ya.mirrors && ya.mirrors[xa._id + 'right']),
            rightpos = xa._length + gs.p + ylw / 2;

        // save axis line positions for ticks, draggers, etc to reference
        // each subplot gets an entry:
        //    [left or bottom, right or top, free, main]
        // main is the position at which to draw labels and draggers, if any
        xa._linepositions[subplot] = [
            showbottom ? bottompos : undefined,
            showtop ? toppos : undefined,
            showfreex ? freeposx : undefined
        ];
        if(xa.anchor === ya._id) {
            xa._linepositions[subplot][3] = xa.side === 'top' ?
                toppos : bottompos;
        }
        else if(showfreex) {
            xa._linepositions[subplot][3] = freeposx;
        }

        ya._linepositions[subplot] = [
            showleft ? leftpos : undefined,
            showright ? rightpos : undefined,
            showfreey ? freeposy : undefined
        ];
        if(ya.anchor === xa._id) {
            ya._linepositions[subplot][3] = ya.side === 'right' ?
                rightpos : leftpos;
        }
        else if(showfreey) {
            ya._linepositions[subplot][3] = freeposy;
        }

        // translate all the extra stuff to have the
        // same origin as the plot area or axes
        var origin = 'translate(' + xa._offset + ',' + ya._offset + ')',
            originx = origin,
            originy = origin;
        if(showfreex) {
            originx = 'translate(' + xa._offset + ',' + gs.t + ')';
            toppos += ya._offset - gs.t;
            bottompos += ya._offset - gs.t;
        }
        if(showfreey) {
            originy = 'translate(' + gs.l + ',' + ya._offset + ')';
            leftpos += xa._offset - gs.l;
            rightpos += xa._offset - gs.l;
        }

        plotinfo.xlines
            .attr('transform', originx)
            .attr('d', (
                (showbottom ? (xpathPrefix + bottompos + xpathSuffix) : '') +
                (showtop ? (xpathPrefix + toppos + xpathSuffix) : '') +
                (showfreex ? (xpathPrefix + freeposx + xpathSuffix) : '')) ||
                // so it doesn't barf with no lines shown
                'M0,0')
            .style('stroke-width', xlw + 'px')
            .call(Color.stroke, xa.showline ?
                xa.linecolor : 'rgba(0,0,0,0)');
        plotinfo.ylines
            .attr('transform', originy)
            .attr('d', (
                (showleft ? ('M' + leftpos + ypathSuffix) : '') +
                (showright ? ('M' + rightpos + ypathSuffix) : '') +
                (showfreey ? ('M' + freeposy + ypathSuffix) : '')) ||
                'M0,0')
            .attr('stroke-width', ylw + 'px')
            .call(Color.stroke, ya.showline ?
                ya.linecolor : 'rgba(0,0,0,0)');

        plotinfo.xaxislayer.attr('transform', originx);
        plotinfo.yaxislayer.attr('transform', originy);
        plotinfo.gridlayer.attr('transform', origin);
        plotinfo.zerolinelayer.attr('transform', origin);
        plotinfo.draglayer.attr('transform', origin);

        // mark free axes as displayed, so we don't draw them again
        if(showfreex) { freefinished.push(xa._id); }
        if(showfreey) { freefinished.push(ya._id); }
    });

    Plotly.Axes.makeClipPaths(gd);
    exports.drawMainTitle(gd);
    ModeBar.manage(gd);

    return gd._promises.length && Promise.all(gd._promises);
};

exports.drawMainTitle = function(gd) {
    var fullLayout = gd._fullLayout;

    Titles.draw(gd, 'gtitle', {
        propContainer: fullLayout,
        propName: 'title',
        dfltName: 'Plot',
        attributes: {
            x: fullLayout.width / 2,
            y: fullLayout._size.t / 2,
            'text-anchor': 'middle'
        }
    });
};

// First, see if we need to do arraysToCalcdata
// call it regardless of what change we made, in case
// supplyDefaults brought in an array that was already
// in gd.data but not in gd._fullData previously
exports.doTraceStyle = function(gd) {
    for(var i = 0; i < gd.calcdata.length; i++) {
        var cdi = gd.calcdata[i],
            _module = ((cdi[0] || {}).trace || {})._module || {},
            arraysToCalcdata = _module.arraysToCalcdata;

        if(arraysToCalcdata) arraysToCalcdata(cdi);
    }

    Plots.style(gd);
    Registry.getComponentMethod('legend', 'draw')(gd);

    return Plots.previousPromises(gd);
};

exports.doColorBars = function(gd) {
    for(var i = 0; i < gd.calcdata.length; i++) {
        var cdi0 = gd.calcdata[i][0];

        if((cdi0.t || {}).cb) {
            var trace = cdi0.trace,
                cb = cdi0.t.cb;

            if(Registry.traceIs(trace, 'contour')) {
                cb.line({
                    width: trace.contours.showlines !== false ?
                        trace.line.width : 0,
                    dash: trace.line.dash,
                    color: trace.contours.coloring === 'line' ?
                        cb._opts.line.color : trace.line.color
                });
            }
            if(Registry.traceIs(trace, 'markerColorscale')) {
                cb.options(trace.marker.colorbar)();
            }
            else cb.options(trace.colorbar)();
        }
    }

    return Plots.previousPromises(gd);
};

// force plot() to redo the layout and replot with the modified layout
exports.layoutReplot = function(gd) {
    var layout = gd.layout;
    gd.layout = undefined;
    return Plotly.plot(gd, '', layout);
};

exports.doLegend = function(gd) {
    Registry.getComponentMethod('legend', 'draw')(gd);
    return Plots.previousPromises(gd);
};

exports.doTicksRelayout = function(gd) {
    Plotly.Axes.doTicks(gd, 'redraw');
    exports.drawMainTitle(gd);
    return Plots.previousPromises(gd);
};

exports.doModeBar = function(gd) {
    var fullLayout = gd._fullLayout;
    var subplotIds, i;

    ModeBar.manage(gd);
    Plotly.Fx.supplyLayoutDefaults(gd.layout, gd._fullLayout, gd._fullData);
    Plotly.Fx.init(gd);

    subplotIds = Plots.getSubplotIds(fullLayout, 'gl3d');
    for(i = 0; i < subplotIds.length; i++) {
        var scene = fullLayout[subplotIds[i]]._scene;
        scene.updateFx(fullLayout.dragmode, fullLayout.hovermode);
    }

    subplotIds = Plots.getSubplotIds(fullLayout, 'gl2d');
    for(i = 0; i < subplotIds.length; i++) {
        var scene2d = fullLayout._plots[subplotIds[i]]._scene2d;
        scene2d.updateFx(fullLayout);
    }

    subplotIds = Plots.getSubplotIds(fullLayout, 'geo');
    for(i = 0; i < subplotIds.length; i++) {
        var geo = fullLayout[subplotIds[i]]._subplot;
        geo.updateFx(fullLayout.hovermode);
    }

    return Plots.previousPromises(gd);
};
