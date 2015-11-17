/**
* Copyright 2012-2015, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Plotly = require('../../plotly');
var d3 = require('d3');
var isNumeric = require('fast-isnumeric');

var bars = module.exports = {};

Plotly.Plots.register(bars, 'bar',
    ['cartesian', 'bar', 'oriented', 'markerColorscale', 'errorBarsOK', 'showLegend'], {
    description: [
        'The data visualized by the span of the bars is set in `y`',
        'if `orientation` is set th *v* (the default)',
        'and the labels are set in `x`.',

        'By setting `orientation` to *h*, the roles are interchanged.'
    ].join(' ')
});


bars.attributes = require('./attributes');

bars.layoutAttributes = require('./layout_attributes');

bars.supplyDefaults = function(traceIn, traceOut, defaultColor, layout) {
    function coerce(attr, dflt) {
        return Plotly.Lib.coerce(traceIn, traceOut, bars.attributes, attr, dflt);
    }

    if(traceOut.type==='histogram') {
        // x, y, and orientation are coerced in Histogram.supplyDefaults
        // (along with histogram-specific attributes)
        Plotly.Histogram.supplyDefaults(traceIn, traceOut);
        if(!traceOut.visible) return;
    }
    else {
        var len = Plotly.Scatter.handleXYDefaults(traceIn, traceOut, coerce);
        if(!len) {
            traceOut.visible = false;
            return;
        }

        coerce('orientation', (traceOut.x && !traceOut.y) ? 'h' : 'v');
    }

    coerce('marker.color', defaultColor);
    if(Plotly.Colorscale.hasColorscale(traceIn, 'marker')) {
        Plotly.Colorscale.handleDefaults(
            traceIn, traceOut, layout, coerce, {prefix: 'marker.', cLetter: 'c'}
        );
    }

    coerce('marker.line.color', Plotly.Color.defaultLine);
    if(Plotly.Colorscale.hasColorscale(traceIn, 'marker.line')) {
        Plotly.Colorscale.handleDefaults(
            traceIn, traceOut, layout, coerce, {prefix: 'marker.line.', cLetter: 'c'}
        );
    }

    coerce('marker.line.width', 0);
    coerce('text');

    // override defaultColor for error bars with defaultLine
    Plotly.ErrorBars.supplyDefaults(traceIn, traceOut, Plotly.Color.defaultLine, {axis: 'y'});
    Plotly.ErrorBars.supplyDefaults(traceIn, traceOut, Plotly.Color.defaultLine, {axis: 'x', inherit: 'y'});
};

bars.supplyLayoutDefaults = function(layoutIn, layoutOut, fullData) {
    function coerce(attr, dflt) {
        return Plotly.Lib.coerce(layoutIn, layoutOut, bars.layoutAttributes, attr, dflt);
    }

    var hasBars = false,
        shouldBeGapless = false,
        gappedAnyway = false,
        usedSubplots = {},
        i,
        trace,
        subploti;
    for(i = 0; i < fullData.length; i++) {
        trace = fullData[i];
        if(Plotly.Plots.traceIs(trace, 'bar')) hasBars = true;
        else continue;

        // if we have at least 2 grouped bar traces on the same subplot,
        // we should default to a gap anyway, even if the data is histograms
        if(layoutIn.barmode !== 'overlay' && layoutIn.barmode !== 'stack') {
            subploti = trace.xaxis + trace.yaxis;
            if(usedSubplots[subploti]) gappedAnyway = true;
            usedSubplots[subploti] = true;
        }

        if(trace.visible && trace.type==='histogram') {
            var pa = Plotly.Axes.getFromId({_fullLayout:layoutOut},
                        trace[trace.orientation==='v' ? 'xaxis' : 'yaxis']);
            if(pa.type!=='category') shouldBeGapless = true;
        }
    }

    if(!hasBars) return;

    var mode = coerce('barmode');
    if(mode!=='overlay') coerce('barnorm');

    coerce('bargap', shouldBeGapless && !gappedAnyway ? 0 : 0.2);
    coerce('bargroupgap');
};

bars.colorbar = Plotly.Scatter.colorbar;

bars.calc = function(gd, trace) {
    if(trace.type==='histogram') return Plotly.Histogram.calc(gd,trace);

    // depending on bar direction, set position and size axes
    // and data ranges
    // note: this logic for choosing orientation is
    // duplicated in graph_obj->setstyles
    var xa = Plotly.Axes.getFromId(gd, trace.xaxis||'x'),
        ya = Plotly.Axes.getFromId(gd, trace.yaxis||'y'),
        orientation = trace.orientation || ((trace.x && !trace.y) ? 'h' : 'v'),
        pos, size, i;
    if(orientation==='h') {
        size = xa.makeCalcdata(trace, 'x');
        pos = ya.makeCalcdata(trace, 'y');
    }
    else {
        size = ya.makeCalcdata(trace, 'y');
        pos = xa.makeCalcdata(trace, 'x');
    }

    // create the "calculated data" to plot
    var serieslen = Math.min(pos.length, size.length),
        cd = [];
    for(i=0; i<serieslen; i++) {
        if((isNumeric(pos[i]) && isNumeric(size[i]))) {
            cd.push({p: pos[i], s: size[i], b: 0});
        }
    }

    // auto-z and autocolorscale if applicable
    if(Plotly.Colorscale.hasColorscale(trace, 'marker')) {
        Plotly.Colorscale.calc(trace, trace.marker.color, 'marker', 'c');
    }
    if(Plotly.Colorscale.hasColorscale(trace, 'marker.line')) {
        Plotly.Colorscale.calc(trace, trace.marker.line.color, 'marker.line', 'c');
    }

    return cd;
};

// bar chart stacking/grouping positioning and autoscaling calculations
// for each direction separately calculate the ranges and positions
// note that this handles histograms too
// now doing this one subplot at a time
bars.setPositions = function(gd, plotinfo) {
    var fullLayout = gd._fullLayout,
        xa = plotinfo.x(),
        ya = plotinfo.y(),
        i, j;

    ['v','h'].forEach(function(dir){
        var bl = [],
            pLetter = {v:'x',h:'y'}[dir],
            sLetter = {v:'y',h:'x'}[dir],
            pa = plotinfo[pLetter](),
            sa = plotinfo[sLetter]();

        gd._fullData.forEach(function(trace,i) {
            if(trace.visible === true &&
                    Plotly.Plots.traceIs(trace, 'bar') &&
                    trace.orientation === dir &&
                    trace.xaxis === xa._id &&
                    trace.yaxis === ya._id) {
                bl.push(i);
            }
        });
        if(!bl.length) return;

        // bar position offset and width calculation
        // bl1 is a list of traces (in calcdata) to look at together
        // to find the maximum size bars that won't overlap
        // for stacked or grouped bars, this is all vertical or horizontal
        // bars for overlaid bars, call this individually on each trace.
        function barposition(bl1) {
            // find the min. difference between any points
            // in any traces in bl1
            var pvals=[];
            bl1.forEach(function(i){
                gd.calcdata[i].forEach(function(v){ pvals.push(v.p); });
            });
            var dv = Plotly.Lib.distinctVals(pvals),
                pv2 = dv.vals,
                barDiff = dv.minDiff;

            // check if all the traces have only independent positions
            // if so, let them have full width even if mode is group
            var overlap = false,
                comparelist = [];
            if(fullLayout.barmode==='group') {
                bl1.forEach(function(i) {
                    if(overlap) return;
                    gd.calcdata[i].forEach(function(v) {
                        if(overlap) return;
                        comparelist.forEach(function(cp) {
                            if(Math.abs(v.p-cp) < barDiff) overlap = true;
                        });
                    });
                    if(overlap) return;
                    gd.calcdata[i].forEach(function(v) {
                        comparelist.push(v.p);
                    });
                });
            }

            // check forced minimum dtick
            Plotly.Axes.minDtick(pa, barDiff, pv2[0], overlap);

            // position axis autorange - always tight fitting
            Plotly.Axes.expand(pa, pv2, {vpad: barDiff/2});

            // bar widths and position offsets
            barDiff *= 1-fullLayout.bargap;
            if(overlap) barDiff/=bl.length;

            var barCenter;
            function setBarCenter(v) { v[pLetter] = v.p + barCenter; }

            for(var i=0; i<bl1.length; i++){
                var t = gd.calcdata[bl1[i]][0].t;
                t.barwidth = barDiff*(1-fullLayout.bargroupgap);
                t.poffset = ((overlap ? (2*i+1-bl1.length)*barDiff : 0 ) -
                    t.barwidth)/2;
                t.dbar = dv.minDiff;

                // store the bar center in each calcdata item
                barCenter = t.poffset + t.barwidth/2;
                gd.calcdata[bl1[i]].forEach(setBarCenter);
            }
        }
        if(fullLayout.barmode==='overlay') {
            bl.forEach(function(bli){ barposition([bli]); });
        }
        else barposition(bl);

        var stack = fullLayout.barmode==='stack',
            norm = fullLayout.barnorm;

        // bar size range and stacking calculation
        if(stack || norm){
            // for stacked bars, we need to evaluate every step in every
            // stack, because negative bars mean the extremes could be
            // anywhere
            // also stores the base (b) of each bar in calcdata
            // so we don't have to redo this later
            var sMax = sa.l2c(sa.c2l(0)),
                sMin = sMax,
                sums={},

                // make sure if p is different only by rounding,
                // we still stack
                sumround = gd.calcdata[bl[0]][0].t.barwidth/100,
                sv = 0,
                padded = true,
                barEnd,
                ti,
                scale;

            for(i=0; i<bl.length; i++){ // trace index
                ti = gd.calcdata[bl[i]];
                for(j=0; j<ti.length; j++) {
                    sv = Math.round(ti[j].p/sumround);
                    var previousSum = sums[sv]||0;
                    if(stack) ti[j].b = previousSum;
                    barEnd = ti[j].b+ti[j].s;
                    sums[sv] = previousSum + ti[j].s;

                    // store the bar top in each calcdata item
                    if(stack) {
                        ti[j][sLetter] = barEnd;
                        if(!norm && isNumeric(sa.c2l(barEnd))) {
                            sMax = Math.max(sMax,barEnd);
                            sMin = Math.min(sMin,barEnd);
                        }
                    }
                }
            }

            if(norm) {
                padded = false;
                var top = norm==='fraction' ? 1 : 100,
                    tiny = top/1e9; // in case of rounding error in sum
                sMin = 0;
                sMax = stack ? top : 0;
                for(i=0; i<bl.length; i++){ // trace index
                    ti = gd.calcdata[bl[i]];
                    for(j=0; j<ti.length; j++) {
                        scale = top / sums[Math.round(ti[j].p/sumround)];
                        ti[j].b *= scale;
                        ti[j].s *= scale;
                        barEnd = ti[j].b + ti[j].s;
                        ti[j][sLetter] = barEnd;

                        if(isNumeric(sa.c2l(barEnd))) {
                            if(barEnd < sMin - tiny) {
                                padded = true;
                                sMin = barEnd;
                            }
                            if(barEnd > sMax + tiny) {
                                padded = true;
                                sMax = barEnd;
                            }
                        }
                    }
                }
            }

            Plotly.Axes.expand(sa, [sMin, sMax], {tozero: true, padded: padded});
        }
        else {
            // for grouped or overlaid bars, just make sure zero is
            // included, along with the tops of each bar, and store
            // these bar tops in calcdata
            var fs = function(v){ v[sLetter] = v.s; return v.s; };

            for(i=0; i<bl.length; i++){
                Plotly.Axes.expand(sa, gd.calcdata[bl[i]].map(fs),
                    {tozero: true, padded: true});
            }
        }
    });
};

// arrayOk attributes, merge them into calcdata array
bars.arraysToCalcdata = function(cd) {
    var trace = cd[0].trace,
        marker = trace.marker,
        markerLine = marker.line;

    Plotly.Lib.mergeArray(trace.text, cd, 'tx');
    Plotly.Lib.mergeArray(marker.opacity, cd, 'mo');
    Plotly.Lib.mergeArray(marker.color, cd, 'mc');
    Plotly.Lib.mergeArray(markerLine.color, cd, 'mlc');
    Plotly.Lib.mergeArray(markerLine.width, cd, 'mlw');
};

bars.plot = function(gd, plotinfo, cdbar) {
    var xa = plotinfo.x(),
        ya = plotinfo.y(),
        fullLayout = gd._fullLayout;

    var bartraces = plotinfo.plot.select('.barlayer')
        .selectAll('g.trace.bars')
            .data(cdbar)
      .enter().append('g')
        .attr('class','trace bars');

    bartraces.append('g')
        .attr('class','points')
        .each(function(d){
            var t = d[0].t,
                trace = d[0].trace;

            bars.arraysToCalcdata(d);

            d3.select(this).selectAll('path')
                .data(Plotly.Lib.identity)
              .enter().append('path')
                .each(function(di){
                    // now display the bar
                    // clipped xf/yf (2nd arg true): non-positive
                    // log values go off-screen by plotwidth
                    // so you see them continue if you drag the plot
                    var x0,x1,y0,y1;
                    if(trace.orientation==='h') {
                        y0 = ya.c2p(t.poffset+di.p, true);
                        y1 = ya.c2p(t.poffset+di.p+t.barwidth, true);
                        x0 = xa.c2p(di.b, true);
                        x1 = xa.c2p(di.s+di.b, true);
                    }
                    else {
                        x0 = xa.c2p(t.poffset+di.p, true);
                        x1 = xa.c2p(t.poffset+di.p+t.barwidth, true);
                        y1 = ya.c2p(di.s+di.b, true);
                        y0 = ya.c2p(di.b, true);
                    }

                    if(!isNumeric(x0) || !isNumeric(x1) ||
                            !isNumeric(y0) || !isNumeric(y1) ||
                            x0===x1 || y0===y1) {
                        d3.select(this).remove();
                        return;
                    }
                    var lw = (di.mlw+1 || trace.marker.line.width+1 ||
                            (di.trace ? di.trace.marker.line.width : 0)+1)-1,
                        offset = d3.round((lw/2)%1,2);
                    function roundWithLine(v) {
                        // if there are explicit gaps, don't round,
                        // it can make the gaps look crappy
                        return (fullLayout.bargap===0 && fullLayout.bargroupgap===0) ?
                            d3.round(Math.round(v)-offset, 2) : v;
                    }
                    function expandToVisible(v,vc) {
                        // if it's not in danger of disappearing entirely,
                        // round more precisely
                        return Math.abs(v-vc)>=2 ? roundWithLine(v) :
                        // but if it's very thin, expand it so it's
                        // necessarily visible, even if it might overlap
                        // its neighbor
                        (v>vc ? Math.ceil(v) : Math.floor(v));
                    }
                    if(!gd._context.staticPlot) {
                        // if bars are not fully opaque or they have a line
                        // around them, round to integer pixels, mainly for
                        // safari so we prevent overlaps from its expansive
                        // pixelation. if the bars ARE fully opaque and have
                        // no line, expand to a full pixel to make sure we
                        // can see them
                        var op = Plotly.Color.opacity(
                                di.mc || trace.marker.color),
                            fixpx = (op<1 || lw>0.01) ?
                                roundWithLine : expandToVisible;
                        x0 = fixpx(x0,x1);
                        x1 = fixpx(x1,x0);
                        y0 = fixpx(y0,y1);
                        y1 = fixpx(y1,y0);
                    }
                    d3.select(this).attr('d',
                        'M'+x0+','+y0+'V'+y1+'H'+x1+'V'+y0+'Z');
                });
        });
};

bars.style = function(gd) {
    var s = d3.select(gd).selectAll('g.trace.bars'),
        barcount = s.size(),
        fullLayout = gd._fullLayout;

    // trace styling
    s.style('opacity',function(d){ return d[0].trace.opacity; })

    // for gapless (either stacked or neighboring grouped) bars use
    // crispEdges to turn off antialiasing so an artificial gap
    // isn't introduced.
    .each(function(d){
        if((fullLayout.barmode==='stack' && barcount>1) ||
                (fullLayout.bargap===0 &&
                 fullLayout.bargroupgap===0 &&
                 !d[0].trace.marker.line.width)){
            d3.select(this).attr('shape-rendering','crispEdges');
        }
    });

    // then style the individual bars
    s.selectAll('g.points').each(function(d){
        var trace = d[0].trace,
            marker = trace.marker,
            markerLine = marker.line,
            markerIn = (trace._input||{}).marker||{},
            markerScale = Plotly.Drawing.tryColorscale(marker, markerIn, ''),
            lineScale = Plotly.Drawing.tryColorscale(marker, markerIn, 'line.');

        d3.select(this).selectAll('path').each(function(d) {
            // allow all marker and marker line colors to be scaled
            // by given max and min to colorscales
            var fillColor,
                lineColor,
                lineWidth = (d.mlw+1 || markerLine.width+1) - 1,
                p = d3.select(this);

            if('mc' in d) fillColor = d.mcc = markerScale(d.mc);
            else if(Array.isArray(marker.color)) fillColor = Plotly.Color.defaultLine;
            else fillColor = marker.color;

            p.style('stroke-width', lineWidth + 'px')
                .call(Plotly.Color.fill, fillColor);
            if(lineWidth) {
                if('mlc' in d) lineColor = d.mlcc = lineScale(d.mlc);
                // weird case: array wasn't long enough to apply to every point
                else if(Array.isArray(markerLine.color)) lineColor = Plotly.Color.defaultLine;
                else lineColor = markerLine.color;

                p.call(Plotly.Color.stroke, lineColor);
            }
        });
        // TODO: text markers on bars, either extra text or just bar values
        // d3.select(this).selectAll('text')
        //     .call(Plotly.Drawing.textPointStyle,d.t||d[0].t);
    });
};

bars.hoverPoints = function(pointData, xval, yval, hovermode) {
    var cd = pointData.cd,
        trace = cd[0].trace,
        t = cd[0].t,
        xa = pointData.xa,
        ya = pointData.ya,
        barDelta = (hovermode==='closest') ?
            t.barwidth/2 : t.dbar*(1-xa._td._fullLayout.bargap)/2,
        barPos;
    if(hovermode!=='closest') barPos = function(di) { return di.p; };
    else if(trace.orientation==='h') barPos = function(di) { return di.y; };
    else barPos = function(di) { return di.x; };

    var dx, dy;
    if(trace.orientation==='h') {
        dx = function(di){
            // add a gradient so hovering near the end of a
            // bar makes it a little closer match
            return Plotly.Fx.inbox(di.b-xval, di.x-xval) + (di.x-xval)/(di.x-di.b);
        };
        dy = function(di){
            var centerPos = barPos(di) - yval;
            return Plotly.Fx.inbox(centerPos - barDelta, centerPos + barDelta);
        };
    }
    else {
        dy = function(di){
            return Plotly.Fx.inbox(di.b-yval, di.y-yval) + (di.y-yval)/(di.y-di.b);
        };
        dx = function(di){
            var centerPos = barPos(di) - xval;
            return Plotly.Fx.inbox(centerPos - barDelta, centerPos + barDelta);
        };
    }

    var distfn = Plotly.Fx.getDistanceFunction(hovermode, dx, dy);
    Plotly.Fx.getClosest(cd, distfn, pointData);

    // skip the rest (for this trace) if we didn't find a close point
    if(pointData.index===false) return;

    // the closest data point
    var di = cd[pointData.index],
        mc = di.mcc || trace.marker.color,
        mlc = di.mlcc || trace.marker.line.color,
        mlw = di.mlw || trace.marker.line.width;
    if(Plotly.Color.opacity(mc)) pointData.color = mc;
    else if(Plotly.Color.opacity(mlc) && mlw) pointData.color = mlc;

    if(trace.orientation==='h') {
        pointData.x0 = pointData.x1 = xa.c2p(di.x, true);
        pointData.xLabelVal = di.s;

        pointData.y0 = ya.c2p(barPos(di) - barDelta, true);
        pointData.y1 = ya.c2p(barPos(di) + barDelta, true);
        pointData.yLabelVal = di.p;
    }
    else {
        pointData.y0 = pointData.y1 = ya.c2p(di.y,true);
        pointData.yLabelVal = di.s;

        pointData.x0 = xa.c2p(barPos(di) - barDelta, true);
        pointData.x1 = xa.c2p(barPos(di) + barDelta, true);
        pointData.xLabelVal = di.p;
    }

    if(di.tx) pointData.text = di.tx;

    Plotly.ErrorBars.hoverInfo(di, trace, pointData);

    return [pointData];
};
