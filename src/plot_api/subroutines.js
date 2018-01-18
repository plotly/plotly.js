/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var d3 = require('d3');
var Plotly = require('../plotly');
var Registry = require('../registry');
var Plots = require('../plots/plots');
var Lib = require('../lib');

var Color = require('../components/color');
var Drawing = require('../components/drawing');
var Titles = require('../components/titles');
var ModeBar = require('../components/modebar');
var initInteractions = require('../plots/cartesian/graph_interact');
var cartesianConstants = require('../plots/cartesian/constants');
var alignmentConstants = require('../constants/alignment');

exports.layoutStyles = function(gd) {
    return Lib.syncOrAsync([Plots.doAutoMargin, exports.lsInner], gd);
};

function overlappingDomain(xDomain, yDomain, domains) {
    for(var i = 0; i < domains.length; i++) {
        var existingX = domains[i][0],
            existingY = domains[i][1];

        if(existingX[0] >= xDomain[1] || existingX[1] <= xDomain[0]) {
            continue;
        }
        if(existingY[0] < yDomain[1] && existingY[1] > yDomain[0]) {
            return true;
        }
    }
    return false;
}

exports.lsInner = function(gd) {
    var fullLayout = gd._fullLayout;
    var gs = fullLayout._size;
    var pad = gs.p;
    var axList = Plotly.Axes.list(gd);

    // _has('cartesian') means SVG specifically, not GL2D - but GL2D
    // can still get here because it makes some of the SVG structure
    // for shared features like selections.
    var hasSVGCartesian = fullLayout._has('cartesian');
    var i;

    function getLinePosition(ax, counterAx, side) {
        var lwHalf = ax._lw / 2;

        if(ax._id.charAt(0) === 'x') {
            if(!counterAx) return gs.t + gs.h * (1 - (ax.position || 0)) + (lwHalf % 1);
            else if(side === 'top') return counterAx._offset - pad - lwHalf;
            return counterAx._offset + counterAx._length + pad + lwHalf;
        }

        if(!counterAx) return gs.l + gs.w * (ax.position || 0) + (lwHalf % 1);
        else if(side === 'right') return counterAx._offset + counterAx._length + pad + lwHalf;
        return counterAx._offset - pad - lwHalf;
    }

    // some preparation of axis position info
    for(i = 0; i < axList.length; i++) {
        var ax = axList[i];

        // reset scale in case the margins have changed
        ax.setScale();

        var counterAx = ax._anchorAxis;

        // clear axis line positions, to be set in the subplot loop below
        ax._linepositions = {};

        // stash crispRounded linewidth so we don't need to pass gd all over the place
        ax._lw = Drawing.crispRound(gd, ax.linewidth, 1);

        // figure out the main axis line and main mirror line position.
        // it's easier to follow the logic if we handle these separately from
        // ax._linepositions, which are really only used by mirror=allticks
        // for the non-main-subplot ticks.
        ax._mainLinePosition = getLinePosition(ax, counterAx, ax.side);
        ax._mainMirrorPosition = (ax.mirror && counterAx) ?
            getLinePosition(ax, counterAx,
                alignmentConstants.OPPOSITE_SIDE[ax.side]) : null;
    }

    fullLayout._paperdiv
        .style({
            width: fullLayout.width + 'px',
            height: fullLayout.height + 'px'
        })
        .selectAll('.main-svg')
            .call(Drawing.setSize, fullLayout.width, fullLayout.height);

    gd._context.setBackground(gd, fullLayout.paper_bgcolor);

    var subplotSelection = fullLayout._paper.selectAll('g.subplot');

    // figure out which backgrounds we need to draw, and in which layers
    // to put them
    var lowerBackgroundIDs = [];
    var lowerDomains = [];
    subplotSelection.each(function(subplot) {
        var plotinfo = fullLayout._plots[subplot];

        if(plotinfo.mainplot) {
            // mainplot is a reference to the main plot this one is overlaid on
            // so if it exists, this is an overlaid plot and we don't need to
            // give it its own background
            if(plotinfo.bg) {
                plotinfo.bg.remove();
            }
            plotinfo.bg = undefined;
            return;
        }

        var xDomain = plotinfo.xaxis.domain;
        var yDomain = plotinfo.yaxis.domain;
        var plotgroupBgData = [];

        if(overlappingDomain(xDomain, yDomain, lowerDomains)) {
            plotgroupBgData = [0];
        }
        else {
            lowerBackgroundIDs.push(subplot);
            lowerDomains.push([xDomain, yDomain]);
        }

        // create the plot group backgrounds now, since
        // they're all independent selections
        var plotgroupBg = plotinfo.plotgroup.selectAll('.bg')
            .data(plotgroupBgData);

        plotgroupBg.enter().append('rect')
            .classed('bg', true);

        plotgroupBg.exit().remove();

        plotgroupBg.each(function() {
            plotinfo.bg = plotgroupBg;
            var pgNode = plotinfo.plotgroup.node();
            pgNode.insertBefore(this, pgNode.childNodes[0]);
        });
    });

    // now create all the lower-layer backgrounds at once now that
    // we have the list of subplots that need them
    var lowerBackgrounds = fullLayout._bgLayer.selectAll('.bg')
        .data(lowerBackgroundIDs);

    lowerBackgrounds.enter().append('rect')
        .classed('bg', true);

    lowerBackgrounds.exit().remove();

    lowerBackgrounds.each(function(subplot) {
        fullLayout._plots[subplot].bg = d3.select(this);
    });

    subplotSelection.each(function(subplot) {
        var plotinfo = fullLayout._plots[subplot];
        var xa = plotinfo.xaxis;
        var ya = plotinfo.yaxis;

        if(plotinfo.bg && hasSVGCartesian) {
            plotinfo.bg
                .call(Drawing.setRect,
                    xa._offset - pad, ya._offset - pad,
                    xa._length + 2 * pad, ya._length + 2 * pad)
                .call(Color.fill, fullLayout.plot_bgcolor)
                .style('stroke-width', 0);
        }

        // Clip so that data only shows up on the plot area.
        plotinfo.clipId = 'clip' + fullLayout._uid + subplot + 'plot';

        var plotClip = fullLayout._clips.selectAll('#' + plotinfo.clipId)
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

        Drawing.setTranslate(plotinfo.plot, xa._offset, ya._offset);

        var plotClipId;
        var layerClipId;

        if(plotinfo._hasClipOnAxisFalse) {
            plotClipId = null;
            layerClipId = plotinfo.clipId;
        } else {
            plotClipId = plotinfo.clipId;
            layerClipId = null;
        }

        Drawing.setClipUrl(plotinfo.plot, plotClipId);

        for(i = 0; i < cartesianConstants.traceLayerClasses.length; i++) {
            var layer = cartesianConstants.traceLayerClasses[i];
            if(layer !== 'scatterlayer') {
                plotinfo.plot.selectAll('g.' + layer).call(Drawing.setClipUrl, layerClipId);
            }
        }

        // stash layer clipId value (null or same as clipId)
        // to DRY up Drawing.setClipUrl calls downstream
        plotinfo.layerClipId = layerClipId;

        // figure out extra axis line and tick positions as needed
        if(!hasSVGCartesian) return;

        var xLinesXLeft, xLinesXRight, xLinesYBottom, xLinesYTop,
            leftYLineWidth, rightYLineWidth;
        var yLinesYBottom, yLinesYTop, yLinesXLeft, yLinesXRight,
            connectYBottom, connectYTop;
        var extraSubplot;

        function xLinePath(y) {
            return 'M' + xLinesXLeft + ',' + y + 'H' + xLinesXRight;
        }

        function xLinePathFree(y) {
            return 'M' + xa._offset + ',' + y + 'h' + xa._length;
        }

        function yLinePath(x) {
            return 'M' + x + ',' + yLinesYTop + 'V' + yLinesYBottom;
        }

        function yLinePathFree(x) {
            return 'M' + x + ',' + ya._offset + 'v' + ya._length;
        }

        function mainPath(ax, pathFn, pathFnFree) {
            if(!ax.showline || subplot !== ax._mainSubplot) return '';
            if(!ax._anchorAxis) return pathFnFree(ax._mainLinePosition);
            var out = pathFn(ax._mainLinePosition);
            if(ax.mirror) out += pathFn(ax._mainMirrorPosition);
            return out;
        }

        /*
         * x lines get longer where they meet y lines, to make a crisp corner.
         * The x lines get the padding (margin.pad) plus the y line width to
         * fill up the corner nicely. Free x lines are excluded - they always
         * span exactly the data area of the plot
         *
         *  | XXXXX
         *  | XXXXX
         *  |
         *  +------
         *     x1
         *    -----
         *     x2
         */
        if(shouldShowLinesOrTicks(xa, subplot)) {
            leftYLineWidth = findCounterAxisLineWidth(xa, 'left', ya, axList);
            xLinesXLeft = xa._offset - (leftYLineWidth ? (pad + leftYLineWidth) : 0);
            rightYLineWidth = findCounterAxisLineWidth(xa, 'right', ya, axList);
            xLinesXRight = xa._offset + xa._length + (rightYLineWidth ? (pad + rightYLineWidth) : 0);
            xLinesYBottom = getLinePosition(xa, ya, 'bottom');
            xLinesYTop = getLinePosition(xa, ya, 'top');

            // save axis line positions for extra ticks to reference
            // each subplot that gets ticks from "allticks" gets an entry:
            //    [left or bottom, right or top]
            extraSubplot = (!xa._anchorAxis || subplot !== xa._mainSubplot);
            if(extraSubplot && xa.ticks && xa.mirror === 'allticks') {
                xa._linepositions[subplot] = [xLinesYBottom, xLinesYTop];
            }

            var xPath = mainPath(xa, xLinePath, xLinePathFree);
            if(extraSubplot && xa.showline && (xa.mirror === 'all' || xa.mirror === 'allticks')) {
                xPath += xLinePath(xLinesYBottom) + xLinePath(xLinesYTop);
            }

            plotinfo.xlines
                .attr('d', xPath || 'M0,0')
                .style('stroke-width', xa._lw + 'px')
                .call(Color.stroke, xa.showline ?
                    xa.linecolor : 'rgba(0,0,0,0)');
        }

        /*
         * y lines that meet x axes get longer only by margin.pad, because
         * the x axes fill in the corner space. Free y axes, like free x axes,
         * always span exactly the data area of the plot
         *
         *   |   | XXXX
         * y2| y1| XXXX
         *   |   | XXXX
         *       |
         *       +-----
         */
        if(shouldShowLinesOrTicks(ya, subplot)) {
            connectYBottom = findCounterAxisLineWidth(ya, 'bottom', xa, axList);
            yLinesYBottom = ya._offset + ya._length + (connectYBottom ? pad : 0);
            connectYTop = findCounterAxisLineWidth(ya, 'top', xa, axList);
            yLinesYTop = ya._offset - (connectYTop ? pad : 0);
            yLinesXLeft = getLinePosition(ya, xa, 'left');
            yLinesXRight = getLinePosition(ya, xa, 'right');

            extraSubplot = (!ya._anchorAxis || subplot !== xa._mainSubplot);
            if(extraSubplot && ya.ticks && ya.mirror === 'allticks') {
                ya._linepositions[subplot] = [yLinesXLeft, yLinesXRight];
            }

            var yPath = mainPath(ya, yLinePath, yLinePathFree);
            if(extraSubplot && ya.showline && (ya.mirror === 'all' || ya.mirror === 'allticks')) {
                yPath += yLinePath(yLinesXLeft) + yLinePath(yLinesXRight);
            }

            plotinfo.ylines
                .attr('d', yPath || 'M0,0')
                .style('stroke-width', ya._lw + 'px')
                .call(Color.stroke, ya.showline ?
                    ya.linecolor : 'rgba(0,0,0,0)');
        }
    });

    Plotly.Axes.makeClipPaths(gd);
    exports.drawMainTitle(gd);
    ModeBar.manage(gd);

    return gd._promises.length && Promise.all(gd._promises);
};

function shouldShowLinesOrTicks(ax, subplot) {
    return (ax.ticks || ax.showline) &&
        (subplot === ax._mainSubplot || ax.mirror === 'all' || ax.mirror === 'allticks');
}

/*
 * should we draw a line on counterAx at this side of ax?
 * It's assumed that counterAx is known to overlay the subplot we're working on
 * but it may not be its main axis.
 */
function shouldShowLineThisSide(ax, side, counterAx) {
    // does counterAx get a line at all?
    if(!counterAx.showline || !counterAx._lw) return false;

    // are we drawing *all* lines for counterAx?
    if(counterAx.mirror === 'all' || counterAx.mirror === 'allticks') return true;

    var anchorAx = counterAx._anchorAxis;

    // is this a free axis? free axes can only have a subplot side-line with all(ticks)? mirroring
    if(!anchorAx) return false;

    // in order to handle cases where the user forgot to anchor this axis correctly
    // (because its default anchor has the same domain on the relevant end)
    // check whether the relevant position is the same.
    var sideIndex = alignmentConstants.FROM_BL[side];
    if(counterAx.side === side) {
        return anchorAx.domain[sideIndex] === ax.domain[sideIndex];
    }
    return counterAx.mirror && anchorAx.domain[1 - sideIndex] === ax.domain[1 - sideIndex];
}

/*
 * Is there another axis intersecting `side` end of `ax`?
 * First look at `counterAx` (the axis for this subplot),
 * then at all other potential counteraxes on or overlaying this subplot.
 * Take the line width from the first one that has a line.
 */
function findCounterAxisLineWidth(ax, side, counterAx, axList) {
    if(shouldShowLineThisSide(ax, side, counterAx)) {
        return counterAx._lw;
    }
    for(var i = 0; i < axList.length; i++) {
        var axi = axList[i];
        if(axi._mainAxis === counterAx._mainAxis && shouldShowLineThisSide(ax, side, axi)) {
            return axi._lw;
        }
    }
    return 0;
}

exports.drawMainTitle = function(gd) {
    var fullLayout = gd._fullLayout;

    Titles.draw(gd, 'gtitle', {
        propContainer: fullLayout,
        propName: 'title',
        placeholder: fullLayout._dfltTitle.plot,
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

        if(arraysToCalcdata) arraysToCalcdata(cdi, cdi[0].trace);
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

    ModeBar.manage(gd);
    initInteractions(gd);

    for(var i = 0; i < fullLayout._basePlotModules.length; i++) {
        var updateFx = fullLayout._basePlotModules[i].updateFx;
        if(updateFx) updateFx(fullLayout);
    }

    return Plots.previousPromises(gd);
};

exports.doCamera = function(gd) {
    var fullLayout = gd._fullLayout;
    var sceneIds = fullLayout._subplots.gl3d;

    for(var i = 0; i < sceneIds.length; i++) {
        var sceneLayout = fullLayout[sceneIds[i]];
        var scene = sceneLayout._scene;

        scene.setCamera(sceneLayout.camera);
    }
};
