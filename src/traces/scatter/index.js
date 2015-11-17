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

var scatter = module.exports = {};

Plotly.Plots.register(scatter, 'scatter',
    ['cartesian', 'symbols', 'markerColorscale', 'errorBarsOK', 'showLegend'], {
    description: [
        'The scatter trace type encompasses line charts, scatter charts, text charts, and bubble charts.',
        'The data visualized as scatter point or lines is set in `x` and `y`.',
        'Text (appearing either on the chart or on hover only) is via `text`.',
        'Bubble charts are achieved by setting `marker.size` and/or `marker.color`',
        'to a numerical arrays.'
    ].join(' ')
});

// traces with < this many points are by default shown
// with points and lines, > just get lines
scatter.PTS_LINESONLY = 20;

scatter.attributes = require('./attributes');

scatter.handleXYDefaults = function(traceIn, traceOut, coerce) {
    var len,
        x = coerce('x'),
        y = coerce('y');

    if(x) {
        if(y) {
            len = Math.min(x.length, y.length);
            // TODO: not sure we should do this here... but I think
            // the way it works in calc is wrong, because it'll delete data
            // which could be a problem eg in streaming / editing if x and y
            // come in at different times
            // so we need to revisit calc before taking this out
            if(len<x.length) traceOut.x = x.slice(0, len);
            if(len<y.length) traceOut.y = y.slice(0, len);
        }
        else {
            len = x.length;
            coerce('y0');
            coerce('dy');
        }
    }
    else {
        if(!y) return 0;

        len = traceOut.y.length;
        coerce('x0');
        coerce('dx');
    }
    return len;
};

scatter.supplyDefaults = function(traceIn, traceOut, defaultColor, layout) {
    function coerce(attr, dflt) {
        return Plotly.Lib.coerce(traceIn, traceOut, scatter.attributes, attr, dflt);
    }

    var len = scatter.handleXYDefaults(traceIn, traceOut, coerce),
        // TODO: default mode by orphan points...
        defaultMode = len < scatter.PTS_LINESONLY ? 'lines+markers' : 'lines';
    if(!len) {
        traceOut.visible = false;
        return;
    }

    coerce('text');
    coerce('mode', defaultMode);

    if(scatter.hasLines(traceOut)) {
        scatter.lineDefaults(traceIn, traceOut, defaultColor, coerce);
        lineShapeDefaults(traceIn, traceOut, coerce);
        coerce('connectgaps');
    }

    if(scatter.hasMarkers(traceOut)) {
        scatter.markerDefaults(traceIn, traceOut, defaultColor, layout, coerce);
    }

    if(scatter.hasText(traceOut)) {
        scatter.textDefaults(traceIn, traceOut, layout, coerce);
    }

    if(scatter.hasMarkers(traceOut) || scatter.hasText(traceOut)) {
        coerce('marker.maxdisplayed');
    }

    coerce('fill');
    if(traceOut.fill !== 'none') {
        scatter.fillColorDefaults(traceIn, traceOut, defaultColor, coerce);
        if(!scatter.hasLines(traceOut)) lineShapeDefaults(traceIn, traceOut, coerce);
    }

    Plotly.ErrorBars.supplyDefaults(traceIn, traceOut, defaultColor, {axis: 'y'});
    Plotly.ErrorBars.supplyDefaults(traceIn, traceOut, defaultColor, {axis: 'x', inherit: 'y'});
};

// common to 'scatter', 'scatter3d', 'scattergeo' and 'scattergl'
scatter.lineDefaults = function(traceIn, traceOut, defaultColor, coerce) {
    var markerColor = (traceIn.marker || {}).color;

    // don't try to inherit a color array
    coerce('line.color', (Array.isArray(markerColor) ? false : markerColor) ||
                         defaultColor);
    coerce('line.width');
    coerce('line.dash');
};

function lineShapeDefaults(traceIn, traceOut, coerce) {
    var shape = coerce('line.shape');
    if(shape==='spline') coerce('line.smoothing');
}

// common to 'scatter', 'scatter3d', 'scattergeo' and 'scattergl'
scatter.markerDefaults = function(traceIn, traceOut, defaultColor, layout, coerce) {
    var isBubble = scatter.isBubble(traceIn),
        lineColor = (traceIn.line || {}).color,
        defaultMLC;

    if(lineColor) defaultColor = lineColor;

    coerce('marker.symbol');
    coerce('marker.opacity', isBubble ? 0.7 : 1);
    coerce('marker.size');

    coerce('marker.color', defaultColor);
    if(Plotly.Colorscale.hasColorscale(traceIn, 'marker')) {
        Plotly.Colorscale.handleDefaults(
            traceIn, traceOut, layout, coerce, {prefix: 'marker.', cLetter: 'c'}
        );
    }

    // if there's a line with a different color than the marker, use
    // that line color as the default marker line color
    // mostly this is for transparent markers to behave nicely
    if(lineColor && traceOut.marker.color!==lineColor) {
        defaultMLC = lineColor;
    }
    else if(isBubble) defaultMLC = Plotly.Color.background;
    else defaultMLC = Plotly.Color.defaultLine;

    coerce('marker.line.color', defaultMLC);
    if(Plotly.Colorscale.hasColorscale(traceIn, 'marker.line')) {
        Plotly.Colorscale.handleDefaults(
            traceIn, traceOut, layout, coerce, {prefix: 'marker.line.', cLetter: 'c'}
        );
    }

    coerce('marker.line.width', isBubble ? 1 : 0);

    if(isBubble) {
        coerce('marker.sizeref');
        coerce('marker.sizemin');
        coerce('marker.sizemode');
    }
};

// common to 'scatter', 'scatter3d' and 'scattergeo'
scatter.textDefaults = function(traceIn, traceOut, layout, coerce) {
    coerce('textposition');
    Plotly.Lib.coerceFont(coerce, 'textfont', layout.font);
};

// common to 'scatter' and 'scattergl'
scatter.fillColorDefaults = function(traceIn, traceOut, defaultColor, coerce) {
    var inheritColorFromMarker = false;

    if(traceOut.marker) {
        // don't try to inherit a color array
        var markerColor = traceOut.marker.color,
            markerLineColor = (traceOut.marker.line || {}).color;

        if(markerColor && !Array.isArray(markerColor)) {
            inheritColorFromMarker = markerColor;
        }
        else if(markerLineColor && !Array.isArray(markerLineColor)) {
            inheritColorFromMarker = markerLineColor;
        }
    }

    coerce('fillcolor', Plotly.Color.addOpacity(
        (traceOut.line || {}).color ||
        inheritColorFromMarker ||
        defaultColor, 0.5
    ));
};

scatter.cleanData = function(fullData) {
    var i,
        tracei,
        filli,
        j,
        tracej;

    // remove opacity for any trace that has a fill or is filled to
    for(i = 0; i < fullData.length; i++) {
        tracei = fullData[i];
        filli = tracei.fill;
        if(filli==='none' || (tracei.type !== 'scatter')) continue;
        tracei.opacity = undefined;

        if(filli === 'tonexty' || filli === 'tonextx') {
            for(j = i - 1; j >= 0; j--) {
                tracej = fullData[j];
                if((tracej.type === 'scatter') &&
                        (tracej.xaxis === tracei.xaxis) &&
                        (tracej.yaxis === tracei.yaxis)) {
                    tracej.opacity = undefined;
                    break;
                }
            }
        }
    }
};

scatter.hasLines = function(trace) {
    return trace.visible && trace.mode &&
        trace.mode.indexOf('lines') !== -1;
};

scatter.hasMarkers = function(trace) {
    return trace.visible && trace.mode &&
        trace.mode.indexOf('markers') !== -1;
};

scatter.hasText = function(trace) {
    return trace.visible && trace.mode &&
        trace.mode.indexOf('text') !== -1;
};

scatter.isBubble = function(trace) {
    return (typeof trace.marker === 'object' &&
                Array.isArray(trace.marker.size));
};

scatter.colorbar = function(gd, cd) {
    var trace = cd[0].trace,
        marker = trace.marker,
        cbId = 'cb' + trace.uid;

    gd._fullLayout._infolayer.selectAll('.' + cbId).remove();

    // TODO unify Scatter.colorbar and Heatmap.colorbar
    // TODO make Plotly[module].colorbar support multiple colorbar per trace

    if(marker===undefined || !marker.showscale){
        Plotly.Plots.autoMargin(gd, cbId);
        return;
    }

    var scl = Plotly.Colorscale.getScale(marker.colorscale),
        vals = marker.color,
        cmin = marker.cmin,
        cmax = marker.cmax;

    if(!isNumeric(cmin)) cmin = Plotly.Lib.aggNums(Math.min, null, vals);
    if(!isNumeric(cmax)) cmax = Plotly.Lib.aggNums(Math.max, null, vals);

    var cb = cd[0].t.cb = Plotly.Colorbar(gd, cbId);

    cb.fillcolor(d3.scale.linear()
            .domain(scl.map(function(v){ return cmin + v[0] * (cmax - cmin); }))
            .range(scl.map(function(v){ return v[1]; })))
        .filllevels({start: cmin, end: cmax, size: (cmax - cmin) / 254})
        .options(marker.colorbar)();

    Plotly.Lib.markTime('done colorbar');
};

// used in the drawing step for 'scatter' and 'scattegeo' and
// in the convert step for 'scatter3d'
scatter.getBubbleSizeFn = function(trace) {
    var marker = trace.marker,
        sizeRef = marker.sizeref || 1,
        sizeMin = marker.sizemin || 0;

    // for bubble charts, allow scaling the provided value linearly
    // and by area or diameter.
    // Note this only applies to the array-value sizes

    var baseFn = marker.sizemode==='area' ?
            function(v) { return Math.sqrt(v / sizeRef); } :
            function(v) { return v / sizeRef; };

    // TODO add support for position/negative bubbles?
    // TODO add 'sizeoffset' attribute?
    return function(v) {
        var baseSize = baseFn(v / 2);

        // don't show non-numeric and negative sizes
        return (isNumeric(baseSize) && baseSize>0) ?
            Math.max(baseSize, sizeMin) : 0;
    };
};

scatter.calc = function(gd, trace) {
    var xa = Plotly.Axes.getFromId(gd,trace.xaxis||'x'),
        ya = Plotly.Axes.getFromId(gd,trace.yaxis||'y');
    Plotly.Lib.markTime('in Scatter.calc');
    var x = xa.makeCalcdata(trace,'x');
    Plotly.Lib.markTime('finished convert x');
    var y = ya.makeCalcdata(trace,'y');
    Plotly.Lib.markTime('finished convert y');
    var serieslen = Math.min(x.length,y.length),
        marker,
        s,
        i;

    // cancel minimum tick spacings (only applies to bars and boxes)
    xa._minDtick = 0;
    ya._minDtick = 0;

    if(x.length>serieslen) x.splice(serieslen, x.length-serieslen);
    if(y.length>serieslen) y.splice(serieslen, y.length-serieslen);

    // check whether bounds should be tight, padded, extended to zero...
    // most cases both should be padded on both ends, so start with that.
    var xOptions = {padded:true},
        yOptions = {padded:true};

    if(scatter.hasMarkers(trace)) {

        // Treat size like x or y arrays --- Run d2c
        // this needs to go before ppad computation
        marker = trace.marker;
        s = marker.size;

        if (Array.isArray(s)) {
            // I tried auto-type but category and dates dont make much sense.
            var ax = {type: 'linear'};
            Plotly.Axes.setConvert(ax);
            s = ax.makeCalcdata(trace.marker, 'size');
            if(s.length>serieslen) s.splice(serieslen, s.length-serieslen);
        }

        var sizeref = 1.6*(trace.marker.sizeref||1),
            markerTrans;
        if(trace.marker.sizemode==='area') {
            markerTrans = function(v) {
                return Math.max(Math.sqrt((v||0)/sizeref),3);
            };
        }
        else {
            markerTrans = function(v) {
                return Math.max((v||0)/sizeref,3);
            };
        }
        xOptions.ppad = yOptions.ppad = Array.isArray(s) ?
            s.map(markerTrans) : markerTrans(s);
    }

    scatter.calcMarkerColorscales(trace);

    // TODO: text size

    // include zero (tight) and extremes (padded) if fill to zero
    // (unless the shape is closed, then it's just filling the shape regardless)
    if((trace.fill==='tozerox' || (trace.fill==='tonextx' && gd.firstscatter)) &&
            (x[0]!==x[serieslen-1] || y[0]!==y[serieslen-1])) {
        xOptions.tozero = true;
    }

    // if no error bars, markers or text, or fill to y=0 remove x padding
    else if(!trace.error_y.visible && (
            ['tonexty', 'tozeroy'].indexOf(trace.fill)!==-1 ||
            (!scatter.hasMarkers(trace) && !scatter.hasText(trace))
        )) {
        xOptions.padded = false;
        xOptions.ppad = 0;
    }

    // now check for y - rather different logic, though still mostly padded both ends
    // include zero (tight) and extremes (padded) if fill to zero
    // (unless the shape is closed, then it's just filling the shape regardless)
    if((trace.fill==='tozeroy' || (trace.fill==='tonexty' && gd.firstscatter)) &&
            (x[0]!==x[serieslen-1] || y[0]!==y[serieslen-1])) {
        yOptions.tozero = true;
    }

    // tight y: any x fill
    else if(['tonextx', 'tozerox'].indexOf(trace.fill)!==-1) {
        yOptions.padded = false;
    }

    Plotly.Lib.markTime('ready for Axes.expand');
    Plotly.Axes.expand(xa, x, xOptions);
    Plotly.Lib.markTime('done expand x');
    Plotly.Axes.expand(ya, y, yOptions);
    Plotly.Lib.markTime('done expand y');

    // create the "calculated data" to plot
    var cd = new Array(serieslen);
    for(i = 0; i < serieslen; i++) {
        cd[i] = (isNumeric(x[i]) && isNumeric(y[i])) ?
            {x: x[i], y: y[i]} : {x: false, y: false};
    }

    // this has migrated up from arraysToCalcdata as we have a reference to 's' here
    if (typeof s !== undefined) Plotly.Lib.mergeArray(s, cd, 'ms');

    gd.firstscatter = false;
    return cd;
};

// common to 'scatter', 'scatter3d' and 'scattergeo'
scatter.calcMarkerColorscales = function(trace) {
    if(!scatter.hasMarkers(trace)) return;

    var marker = trace.marker;

    // auto-z and autocolorscale if applicable
    if(Plotly.Colorscale.hasColorscale(trace, 'marker')) {
        Plotly.Colorscale.calc(trace, marker.color, 'marker', 'c');
    }
    if(Plotly.Colorscale.hasColorscale(trace, 'marker.line')) {
        Plotly.Colorscale.calc(trace, marker.line.color, 'marker.line', 'c');
    }
};

scatter.selectMarkers = function(gd, plotinfo, cdscatter) {
    var xa = plotinfo.x(),
        ya = plotinfo.y(),
        xr = d3.extent(xa.range.map(xa.l2c)),
        yr = d3.extent(ya.range.map(ya.l2c));

    cdscatter.forEach(function(d,i) {
        var trace = d[0].trace;
        if(!scatter.hasMarkers(trace)) return;
        // if marker.maxdisplayed is used, select a maximum of
        // mnum markers to show, from the set that are in the viewport
        var mnum = trace.marker.maxdisplayed;

        // TODO: remove some as we get away from the viewport?
        if(mnum===0) return;

        var cd = d.filter(function(v) {
                return v.x>=xr[0] && v.x<=xr[1] && v.y>=yr[0] && v.y<=yr[1];
            }),
            inc = Math.ceil(cd.length/mnum),
            tnum = 0;
        cdscatter.forEach(function(cdj, j) {
            var tracei = cdj[0].trace;
            if(scatter.hasMarkers(tracei) &&
                    tracei.marker.maxdisplayed>0 && j<i) {
                tnum++;
            }
        });

        // if multiple traces use maxdisplayed, stagger which markers we
        // display this formula offsets successive traces by 1/3 of the
        // increment, adding an extra small amount after each triplet so
        // it's not quite periodic
        var i0 = Math.round(tnum*inc/3 + Math.floor(tnum/3)*inc/7.1);

        // for error bars: save in cd which markers to show
        // so we don't have to repeat this
        d.forEach(function(v){ delete v.vis; });
        cd.forEach(function(v,i) {
            if(Math.round((i+i0)%inc)===0) v.vis = true;
        });
    });
};

// arrayOk attributes, merge them into calcdata array
scatter.arraysToCalcdata = function(cd) {
    var trace = cd[0].trace,
        marker = trace.marker;

    Plotly.Lib.mergeArray(trace.text, cd, 'tx');
    Plotly.Lib.mergeArray(trace.textposition, cd, 'tp');
    if(trace.textfont) {
        Plotly.Lib.mergeArray(trace.textfont.size, cd, 'ts');
        Plotly.Lib.mergeArray(trace.textfont.color, cd, 'tc');
        Plotly.Lib.mergeArray(trace.textfont.family, cd, 'tf');
    }

    if(marker && marker.line) {
        var markerLine = marker.line;
        Plotly.Lib.mergeArray(marker.opacity, cd, 'mo');
        Plotly.Lib.mergeArray(marker.symbol, cd, 'mx');
        Plotly.Lib.mergeArray(marker.color, cd, 'mc');
        Plotly.Lib.mergeArray(markerLine.color, cd, 'mlc');
        Plotly.Lib.mergeArray(markerLine.width, cd, 'mlw');
    }
};

scatter.plot = function(gd, plotinfo, cdscatter) {
    scatter.selectMarkers(gd, plotinfo, cdscatter);

    var xa = plotinfo.x(),
        ya = plotinfo.y();

    // make the container for scatter plots
    // (so error bars can find them along with bars)
    var scattertraces = plotinfo.plot.select('.scatterlayer')
        .selectAll('g.trace.scatter')
        .data(cdscatter);
    scattertraces.enter().append('g')
        .attr('class','trace scatter')
        .style('stroke-miterlimit',2);

    // BUILD LINES AND FILLS
    var prevpath='',
        tozero,tonext,nexttonext;
    scattertraces.each(function(d){
        var trace = d[0].trace,
            line = trace.line;
        if(trace.visible !== true) return;

        scatter.arraysToCalcdata(d);

        if(!scatter.hasLines(trace) && trace.fill==='none') return;

        var tr = d3.select(this),
            thispath,
            // fullpath is all paths for this curve, joined together straight
            // across gaps, for filling
            fullpath = '',
            // revpath is fullpath reversed, for fill-to-next
            revpath = '',
            // functions for converting a point array to a path
            pathfn, revpathbase, revpathfn;

        // make the fill-to-zero path now, so it shows behind the line
        // fill to next puts the fill associated with one trace
        // grouped with the previous
        if(trace.fill.substr(0,6)==='tozero' ||
                (trace.fill.substr(0,2)==='to' && !prevpath)) {
            tozero = tr.append('path')
                .classed('js-fill',true);
        }
        else tozero = null;

        // make the fill-to-next path now for the NEXT trace, so it shows
        // behind both lines.
        // nexttonext was created last time, but give it
        // this curve's data for fill color
        if(nexttonext) tonext = nexttonext.datum(d);

        // now make a new nexttonext for next time
        nexttonext = tr.append('path').classed('js-fill',true);

        if(['hv','vh','hvh','vhv'].indexOf(line.shape)!==-1) {
            pathfn = Plotly.Drawing.steps(line.shape);
            revpathbase = Plotly.Drawing.steps(
                line.shape.split('').reverse().join('')
            );
        }
        else if(line.shape==='spline') {
            pathfn = revpathbase = function(pts) {
                return Plotly.Drawing.smoothopen(pts, line.smoothing);
            };
        }
        else {
            pathfn = revpathbase = function(pts) {
                return 'M' + pts.join('L');
            };
        }

        revpathfn = function(pts) {
            // note: this is destructive (reverses pts in place) so can't use pts after this
            return 'L'+revpathbase(pts.reverse()).substr(1);
        };

        var segments = scatter.linePoints(d, {
                xaxis: xa,
                yaxis: ya,
                connectGaps: trace.connectgaps,
                baseTolerance: Math.max(line.width || 1, 3) / 4,
                linear: line.shape === 'linear'
            });
        if(segments.length) {
            var pt0 = segments[0][0],
                lastSegment = segments[segments.length - 1],
                pt1 = lastSegment[lastSegment.length - 1];

            for(var i = 0; i < segments.length; i++) {
                var pts = segments[i];
                thispath = pathfn(pts);
                fullpath += fullpath ? ('L'+thispath.substr(1)) : thispath;
                revpath = revpathfn(pts) + revpath;
                if(scatter.hasLines(trace) && pts.length > 1) {
                    tr.append('path').classed('js-line',true).attr('d', thispath);
                }
            }
            if(tozero) {
                if(pt0 && pt1) {
                    if(trace.fill.charAt(trace.fill.length-1)==='y') {
                        pt0[1]=pt1[1]=ya.c2p(0,true);
                    }
                    else pt0[0]=pt1[0]=xa.c2p(0,true);

                    // fill to zero: full trace path, plus extension of
                    // the endpoints to the appropriate axis
                    tozero.attr('d',fullpath+'L'+pt1+'L'+pt0+'Z');
                }
            }
            else if(trace.fill.substr(0,6)==='tonext' && fullpath && prevpath) {
                // fill to next: full trace path, plus the previous path reversed
                tonext.attr('d',fullpath+prevpath+'Z');
            }
            prevpath = revpath;
        }
    });

    // remove paths that didn't get used
    scattertraces.selectAll('path:not([d])').remove();

    function visFilter(d){
        return d.filter(function(v){ return v.vis; });
    }

    scattertraces.append('g')
        .attr('class','points')
        .each(function(d){
            var trace = d[0].trace,
                s = d3.select(this),
                showMarkers = scatter.hasMarkers(trace),
                showText = scatter.hasText(trace);

            if((!showMarkers && !showText) || trace.visible !== true) s.remove();
            else {
                if(showMarkers) {
                    s.selectAll('path.point')
                        .data(trace.marker.maxdisplayed ? visFilter : Plotly.Lib.identity)
                        .enter().append('path')
                            .classed('point', true)
                            .call(Plotly.Drawing.translatePoints, xa, ya);
                }
                if(showText) {
                    s.selectAll('g')
                        .data(trace.marker.maxdisplayed ? visFilter : Plotly.Lib.identity)
                        // each text needs to go in its own 'g' in case
                        // it gets converted to mathjax
                        .enter().append('g')
                            .append('text')
                            .call(Plotly.Drawing.translatePoints, xa, ya);
                }
            }
        });
};

scatter.linePoints = function(d, opts) {
    var xa = opts.xaxis,
        ya = opts.yaxis,
        connectGaps = opts.connectGaps,
        baseTolerance = opts.baseTolerance,
        linear = opts.linear,
        segments = [],
        badnum = Plotly.Axes.BADNUM,
        minTolerance = 0.2, // fraction of tolerance "so close we don't even consider it a new point"
        pts = new Array(d.length),
        pti = 0,
        i,

        // pt variables are pixel coordinates [x,y] of one point
        clusterStartPt, // these four are the outputs of clustering on a line
        clusterEndPt,
        clusterHighPt,
        clusterLowPt,
        thisPt, // "this" is the next point we're considering adding to the cluster

        clusterRefDist,
        clusterHighFirst, // did we encounter the high point first, then a low point, or vice versa?
        clusterUnitVector, // the first two points in the cluster determine its unit vector
                           // so the second is always in the "High" direction
        thisVector, // the pixel delta from clusterStartPt

        // val variables are (signed) pixel distances along the cluster vector
        clusterHighVal,
        clusterLowVal,
        thisVal,

        // deviation variables are (signed) pixel distances normal to the cluster vector
        clusterMinDeviation,
        clusterMaxDeviation,
        thisDeviation;

    // turn one calcdata point into pixel coordinates
    function getPt(index) {
        var x = xa.c2p(d[index].x),
            y = ya.c2p(d[index].y);
        if(x === badnum || y === badnum) return false;
        return [x, y];
    }

    // if we're off-screen, increase tolerance over baseTolerance
    function getTolerance(pt) {
        var xFrac = pt[0] / xa._length,
            yFrac = pt[1] / ya._length;
        return (1 + 10 * Math.max(0, -xFrac, xFrac - 1, -yFrac, yFrac - 1)) * baseTolerance;
    }

    function ptDist(pt1, pt2) {
        var dx = pt1[0] - pt2[0],
            dy = pt1[1] - pt2[1];
        return Math.sqrt(dx * dx + dy * dy);
    }

    // loop over ALL points in this trace
    for(i = 0; i < d.length; i++) {
        clusterStartPt = getPt(i);
        if(!clusterStartPt) continue;

        pti = 0;
        pts[pti++] = clusterStartPt;

        // loop over one segment of the trace
        for(i++; i < d.length; i++) {
            clusterHighPt = getPt(i);
            if(!clusterHighPt) {
                if(connectGaps) continue;
                else break;
            }

            // can't decimate if nonlinear line shape
            // TODO: we *could* decimate [hv]{2,3} shapes if we restricted clusters to horz or vert again
            // but spline would be verrry awkward to decimate
            if(!linear) {
                pts[pti++] = clusterHighPt;
                continue;
            }

            clusterRefDist = ptDist(clusterHighPt, clusterStartPt);

            if(clusterRefDist < getTolerance(clusterHighPt) * minTolerance) continue;

            clusterUnitVector = [
                (clusterHighPt[0] - clusterStartPt[0]) / clusterRefDist,
                (clusterHighPt[1] - clusterStartPt[1]) / clusterRefDist
            ];

            clusterLowPt = clusterStartPt;
            clusterHighVal = clusterRefDist;
            clusterLowVal = clusterMinDeviation = clusterMaxDeviation = 0;
            clusterHighFirst = false;
            clusterEndPt = clusterHighPt;

            // loop over one cluster of points that collapse onto one line
            for(i++; i < d.length; i++) {
                thisPt = getPt(i);
                if(!thisPt) {
                    if(connectGaps) continue;
                    else break;
                }
                thisVector = [
                    thisPt[0] - clusterStartPt[0],
                    thisPt[1] - clusterStartPt[1]
                ];
                // cross product (or dot with normal to the cluster vector)
                thisDeviation = thisVector[0] * clusterUnitVector[1] - thisVector[1] * clusterUnitVector[0];
                clusterMinDeviation = Math.min(clusterMinDeviation, thisDeviation);
                clusterMaxDeviation = Math.max(clusterMaxDeviation, thisDeviation);

                if(clusterMaxDeviation - clusterMinDeviation > getTolerance(thisPt)) break;

                clusterEndPt = thisPt;
                thisVal = thisVector[0] * clusterUnitVector[0] + thisVector[1] * clusterUnitVector[1];

                if(thisVal > clusterHighVal) {
                    clusterHighVal = thisVal;
                    clusterHighPt = thisPt;
                    clusterHighFirst = false;
                } else if(thisVal < clusterLowVal) {
                    clusterLowVal = thisVal;
                    clusterLowPt = thisPt;
                    clusterHighFirst = true;
                }
            }

            // insert this cluster into pts
            // we've already inserted the start pt, now check if we have high and low pts
            if(clusterHighFirst) {
                pts[pti++] = clusterHighPt;
                if(clusterEndPt !== clusterLowPt) pts[pti++] = clusterLowPt;
            } else {
                if(clusterLowPt !== clusterStartPt) pts[pti++] = clusterLowPt;
                if(clusterEndPt !== clusterHighPt) pts[pti++] = clusterHighPt;
            }
            // and finally insert the end pt
            pts[pti++] = clusterEndPt;

            // have we reached the end of this segment?
            if(i >= d.length || !thisPt) break;

            // otherwise we have an out-of-cluster point to insert as next clusterStartPt
            pts[pti++] = thisPt;
            clusterStartPt = thisPt;
        }

        segments.push(pts.slice(0, pti));
    }

    return segments;
};

scatter.style = function(gd) {
    var s = d3.select(gd).selectAll('g.trace.scatter');

    s.style('opacity',function(d){ return d[0].trace.opacity; });

    s.selectAll('g.points')
        .each(function(d){
            d3.select(this).selectAll('path.point')
                .call(Plotly.Drawing.pointStyle,d.trace||d[0].trace);
            d3.select(this).selectAll('text')
                .call(Plotly.Drawing.textPointStyle,d.trace||d[0].trace);
        });

    s.selectAll('g.trace path.js-line')
        .call(Plotly.Drawing.lineGroupStyle);

    s.selectAll('g.trace path.js-fill')
        .call(Plotly.Drawing.fillGroupStyle);
};

scatter.getTraceColor = function(trace, di) {
    var lc, tc;

    // TODO: text modes

    if(trace.mode === 'lines') {
        lc = trace.line.color;
        return (lc && Plotly.Color.opacity(lc)) ?
            lc : trace.fillcolor;
    }
    else if(trace.mode === 'none') {
        return trace.fill ? trace.fillcolor : '';
    }
    else {
        var mc = di.mcc || (trace.marker || {}).color,
            mlc = di.mlcc || ((trace.marker || {}).line || {}).color;

        tc = (mc && Plotly.Color.opacity(mc)) ? mc :
            (mlc && Plotly.Color.opacity(mlc) &&
                (di.mlw || ((trace.marker || {}).line || {}).width)) ? mlc : '';

        if(tc) {
            // make sure the points aren't TOO transparent
            if(Plotly.Color.opacity(tc) < 0.3) {
                return Plotly.Color.addOpacity(tc, 0.3);
            }
            else return tc;
        }
        else {
            lc = (trace.line || {}).color;
            return (lc && Plotly.Color.opacity(lc) &&
                scatter.hasLines(trace) && trace.line.width) ?
                    lc : trace.fillcolor;
        }
    }
};

scatter.hoverPoints = function(pointData, xval, yval, hovermode) {
    var cd = pointData.cd,
        trace = cd[0].trace,
        xa = pointData.xa,
        ya = pointData.ya,
        dx = function(di){
            // scatter points: d.mrc is the calculated marker radius
            // adjust the distance so if you're inside the marker it
            // always will show up regardless of point size, but
            // prioritize smaller points
            var rad = Math.max(3, di.mrc||0);
            return Math.max(Math.abs(xa.c2p(di.x)-xa.c2p(xval))-rad, 1-3/rad);
        },
        dy = function(di){
            var rad = Math.max(3, di.mrc||0);
            return Math.max(Math.abs(ya.c2p(di.y)-ya.c2p(yval))-rad, 1-3/rad);
        },
        dxy = function(di) {
            var rad = Math.max(3, di.mrc||0),
                dx = Math.abs(xa.c2p(di.x)-xa.c2p(xval)),
                dy = Math.abs(ya.c2p(di.y)-ya.c2p(yval));
            return Math.max(Math.sqrt(dx*dx + dy*dy)-rad, 1-3/rad);
        },
        distfn = Plotly.Fx.getDistanceFunction(hovermode, dx, dy, dxy);

    Plotly.Fx.getClosest(cd, distfn, pointData);

    // skip the rest (for this trace) if we didn't find a close point
    if(pointData.index===false) return;

    // the closest data point
    var di = cd[pointData.index],
        xc = xa.c2p(di.x, true),
        yc = ya.c2p(di.y, true),
        rad = di.mrc||1;

    pointData.color = scatter.getTraceColor(trace, di);

    pointData.x0 = xc - rad;
    pointData.x1 = xc + rad;
    pointData.xLabelVal = di.x;

    pointData.y0 = yc - rad;
    pointData.y1 = yc + rad;
    pointData.yLabelVal = di.y;

    if(di.tx) pointData.text = di.tx;
    else if(trace.text) pointData.text = trace.text;

    Plotly.ErrorBars.hoverInfo(di, trace, pointData);

    return [pointData];
};
