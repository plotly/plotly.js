/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var d3 = require('d3');
var isNumeric = require('fast-isnumeric');

var Lib = require('../../lib');

var Fx = require('../../plots/cartesian/graph_interact');
var Axes = require('../../plots/cartesian/axes');

var Color = require('../../components/color');
var Colorscale = require('../../components/colorscale');
var Drawing = require('../../components/drawing');
var ErrorBars = require('../../components/errorbars');

var subtypes = require('./subtypes');

var scatter = module.exports = {};

scatter.hasLines = subtypes.hasLines;
scatter.hasMarkers = subtypes.hasMarkers;
scatter.hasText = subtypes.hasText;
scatter.isBubble = subtypes.isBubble;

scatter.selectPoints = require('./select');

scatter.moduleType = 'trace';
scatter.name = 'scatter';
scatter.categories = ['cartesian', 'symbols', 'markerColorscale', 'errorBarsOK', 'showLegend'];
scatter.meta = {
Scatter.supplyDefaults = require('./defaults');
Scatter.hoverPoints = require('./hover');
    description: [
        'The scatter trace type encompasses line charts, scatter charts, text charts, and bubble charts.',
        'The data visualized as scatter point or lines is set in `x` and `y`.',
        'Text (appearing either on the chart or on hover only) is via `text`.',
        'Bubble charts are achieved by setting `marker.size` and/or `marker.color`',
        'to a numerical arrays.'
    ].join(' ')
};

scatter.attributes = require('./attributes');

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

scatter.colorbar = require('./colorbar');

scatter.calc = function(gd, trace) {
    var xa = Axes.getFromId(gd,trace.xaxis||'x'),
        ya = Axes.getFromId(gd,trace.yaxis||'y');
    Lib.markTime('in Scatter.calc');
    var x = xa.makeCalcdata(trace,'x');
    Lib.markTime('finished convert x');
    var y = ya.makeCalcdata(trace,'y');
    Lib.markTime('finished convert y');
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
            Axes.setConvert(ax);
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

    Lib.markTime('ready for Axes.expand');
    Axes.expand(xa, x, xOptions);
    Lib.markTime('done expand x');
    Axes.expand(ya, y, yOptions);
    Lib.markTime('done expand y');

    // create the "calculated data" to plot
    var cd = new Array(serieslen);
    for(i = 0; i < serieslen; i++) {
        cd[i] = (isNumeric(x[i]) && isNumeric(y[i])) ?
            {x: x[i], y: y[i]} : {x: false, y: false};
    }

    // this has migrated up from arraysToCalcdata as we have a reference to 's' here
    if (typeof s !== undefined) Lib.mergeArray(s, cd, 'ms');

    gd.firstscatter = false;
    return cd;
};

// common to 'scatter', 'scatter3d' and 'scattergeo'
scatter.calcMarkerColorscales = function(trace) {
    if(!scatter.hasMarkers(trace)) return;

    var marker = trace.marker;

    // auto-z and autocolorscale if applicable
    if(Colorscale.hasColorscale(trace, 'marker')) {
        Colorscale.calc(trace, marker.color, 'marker', 'c');
    }
    if(Colorscale.hasColorscale(trace, 'marker.line')) {
        Colorscale.calc(trace, marker.line.color, 'marker.line', 'c');
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

    Lib.mergeArray(trace.text, cd, 'tx');
    Lib.mergeArray(trace.textposition, cd, 'tp');
    if(trace.textfont) {
        Lib.mergeArray(trace.textfont.size, cd, 'ts');
        Lib.mergeArray(trace.textfont.color, cd, 'tc');
        Lib.mergeArray(trace.textfont.family, cd, 'tf');
    }

    if(marker && marker.line) {
        var markerLine = marker.line;
        Lib.mergeArray(marker.opacity, cd, 'mo');
        Lib.mergeArray(marker.symbol, cd, 'mx');
        Lib.mergeArray(marker.color, cd, 'mc');
        Lib.mergeArray(markerLine.color, cd, 'mlc');
        Lib.mergeArray(markerLine.width, cd, 'mlw');
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
            line = trace.line,
            tr = d3.select(this);
        if(trace.visible !== true) return;

        d[0].node3 = tr; // store node for tweaking by selectPoints

        scatter.arraysToCalcdata(d);

        if(!scatter.hasLines(trace) && trace.fill==='none') return;

        var thispath,
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
            pathfn = Drawing.steps(line.shape);
            revpathbase = Drawing.steps(
                line.shape.split('').reverse().join('')
            );
        }
        else if(line.shape==='spline') {
            pathfn = revpathbase = function(pts) {
                return Drawing.smoothopen(pts, line.smoothing);
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
                        .data(trace.marker.maxdisplayed ? visFilter : Lib.identity)
                        .enter().append('path')
                            .classed('point', true)
                            .call(Drawing.translatePoints, xa, ya);
                }
                if(showText) {
                    s.selectAll('g')
                        .data(trace.marker.maxdisplayed ? visFilter : Lib.identity)
                        // each text needs to go in its own 'g' in case
                        // it gets converted to mathjax
                        .enter().append('g')
                            .append('text')
                            .call(Drawing.translatePoints, xa, ya);
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
        badnum = Axes.BADNUM,
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
                .call(Drawing.pointStyle,d.trace||d[0].trace);
            d3.select(this).selectAll('text')
                .call(Drawing.textPointStyle,d.trace||d[0].trace);
        });

    s.selectAll('g.trace path.js-line')
        .call(Drawing.lineGroupStyle);

    s.selectAll('g.trace path.js-fill')
        .call(Drawing.fillGroupStyle);
};
