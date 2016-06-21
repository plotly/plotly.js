/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var d3 = require('d3');

var Lib = require('../../lib');
var Drawing = require('../../components/drawing');
var ErrorBars = require('../../components/errorbars');

var subTypes = require('./subtypes');
var arraysToCalcdata = require('./arrays_to_calcdata');
var linePoints = require('./line_points');
var linkTraces = require('./link_traces');

module.exports = function plot(gd, plotinfo, cdscatter, isFullReplot) {
    var i, uids, selection, join;

    var scatterlayer = plotinfo.plot.select('g.scatterlayer');

    selection = scatterlayer.selectAll('g.trace');

    join = selection.data(cdscatter, function(d) {return d[0].trace.uid;});

    // Append new traces:
    var traceEnter = join.enter().append('g')
        .attr('class', function (d) {
          return 'trace scatter trace' + d[0].trace.uid;
        })
        .style('stroke-miterlimit', 2);

    // After the elements are created but before they've been draw, we have to perform
    // this extra step of linking the traces. This allows appending of fill layers so that
    // the z-order of fill layers is correct.
    linkTraces(gd, plotinfo, cdscatter);

    createFills(gd, scatterlayer);

    traceEnter.each(function(d) {
        plotOne(gd, plotinfo, d, this);
    });

    // Before performing a data join, style existing traces. This avoid .transition() with
    // zero duration, which seems to still invoke a timing loop that's much slower than a
    // plain style:
    selection.each(function(d) {
        plotOne(gd, plotinfo, d, this);
    });

    if (isFullReplot) {
        join.exit().remove();
    }

    // Sort the traces, once created, so that the ordering is preserved even when traces
    // are shown and hidden. This is needed since we're not just wiping everything out
    // and recreating on every update.
    for(i = 0, uids = []; i < cdscatter.length; i++) {
        uids[i] = cdscatter[i][0].trace.uid;
    }

    scatterlayer.selectAll('g.trace').sort(function(a, b) {
        var idx1 = uids.indexOf(a[0].trace.uid);
        var idx2 = uids.indexOf(b[0].trace.uid);
        return idx1 > idx2 ? 1 : -1;
    });

    // remove paths that didn't get used
    scatterlayer.selectAll('path:not([d])').remove();
};

function createFills(gd, scatterlayer) {
    var trace;

    scatterlayer.selectAll('g.trace').each(function(d) {
        var tr = d3.select(this);

        // Loop only over the traces being redrawn:
        trace = d[0].trace;

        if(trace.fill.substr(0, 6) === 'tozero' || trace.fill === 'toself' ||
                (trace.fill.substr(0, 2) === 'to' && !trace._prevtrace)) {
            trace._ownFill = tr.select('.js-fill.js-tozero');
            if(!trace._ownFill.size()) {
                trace._ownFill = tr.insert('path', ':first-child').attr('class', 'js-fill js-tozero');
            }
        } else {
            tr.selectAll('.js-fill.js-tozero').remove();
            trace._ownFill = null;
        }

        // make the fill-to-next path now for the NEXT trace, so it shows
        // behind both lines.
        if(trace._nexttrace) {
            trace._nextFill = tr.select('.js-fill.js-tonext');
            if(!trace._nextFill.size()) {
                trace._nextFill = tr.insert('path', ':first-child').attr('class', 'js-fill js-tonext');
            }
        } else {
            tr.selectAll('.js-fill.js-tonext').remove();
            trace._nextFill = null;
        }
    });
}


function plotOne(gd, plotinfo, cdscatter, element) {
    var join;

    selectMarkers(gd, plotinfo, cdscatter);

    var xa = plotinfo.x(),
        ya = plotinfo.y();

    var trace = cdscatter[0].trace,
        line = trace.line,
        tr = d3.select(element);

    // (so error bars can find them along with bars)
    // error bars are at the bottom
    tr.call(ErrorBars.plot, plotinfo);

    if(trace.visible !== true) return;

    // BUILD LINES AND FILLS
    var ownFillEl3, tonext;
    var ownFillDir = trace.fill.charAt(trace.fill.length - 1);
    if(ownFillDir !== 'x' && ownFillDir !== 'y') ownFillDir = '';

    // store node for tweaking by selectPoints
    cdscatter[0].node3 = tr;

    arraysToCalcdata(cdscatter);

    var prevpath = '';
    var prevtrace = trace._prevtrace;

    if(prevtrace) {
        prevpath = prevtrace._revpath || '';
        tonext = prevtrace._nextFill;
    }

    var thispath,
        thisrevpath,
        // fullpath is all paths for this curve, joined together straight
        // across gaps, for filling
        fullpath = '',
        // revpath is fullpath reversed, for fill-to-next
        revpath = '',
        // functions for converting a point array to a path
        pathfn, revpathbase, revpathfn;

    ownFillEl3 = trace._ownFill;

    if(subTypes.hasLines(trace) || trace.fill !== 'none') {

        if(tonext) {
            // This tells .style which trace to use for fill information:
            tonext.datum(cdscatter);
        }

        if(['hv', 'vh', 'hvh', 'vhv'].indexOf(line.shape) !== -1) {
            pathfn = Drawing.steps(line.shape);
            revpathbase = Drawing.steps(
                line.shape.split('').reverse().join('')
            );
        }
        else if(line.shape === 'spline') {
            pathfn = revpathbase = function(pts) {
                var pLast = pts[pts.length - 1];
                if(pts[0][0] === pLast[0] && pts[0][1] === pLast[1]) {
                    // identical start and end points: treat it as a
                    // closed curve so we don't get a kink
                    return Drawing.smoothclosed(pts.slice(1), line.smoothing);
                }
                else {
                    return Drawing.smoothopen(pts, line.smoothing);
                }
            };
        }
        else {
            pathfn = revpathbase = function(pts) {
                return 'M' + pts.join('L');
            };
        }

        revpathfn = function(pts) {
            // note: this is destructive (reverses pts in place) so can't use pts after this
            return revpathbase(pts.reverse());
        };

        var segments = linePoints(cdscatter, {
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
                thisrevpath = revpathfn(pts);
                if(!fullpath) {
                    fullpath = thispath;
                    revpath = thisrevpath;
                }
                else if(ownFillDir) {
                    fullpath += 'L' + thispath.substr(1);
                    revpath = thisrevpath + ('L' + revpath.substr(1));
                }
                else {
                    fullpath += 'Z' + thispath;
                    revpath = thisrevpath + 'Z' + revpath;
                }
                if(subTypes.hasLines(trace) && pts.length > 1) {
                    var lineJoin = tr.selectAll('.js-line').data([cdscatter]);

                    lineJoin.enter()
                        .append('path').classed('js-line', true).attr('d', thispath);

                    lineJoin.attr('d', thispath);
                }
            }
            if(ownFillEl3) {
                if(pt0 && pt1) {
                    if(ownFillDir) {
                        if(ownFillDir === 'y') {
                            pt0[1] = pt1[1] = ya.c2p(0, true);
                        }
                        else if(ownFillDir === 'x') {
                            pt0[0] = pt1[0] = xa.c2p(0, true);
                        }

                        // fill to zero: full trace path, plus extension of
                        // the endpoints to the appropriate axis
                        ownFillEl3.attr('d', fullpath + 'L' + pt1 + 'L' + pt0 + 'Z');
                    } else {
                        // fill to self: just join the path to itself
                        ownFillEl3.attr('d', fullpath + 'Z');
                    }
                }
            }
            else if(trace.fill.substr(0, 6) === 'tonext' && fullpath && prevpath) {
                // fill to next: full trace path, plus the previous path reversed
                if(trace.fill === 'tonext') {
                    // tonext: for use by concentric shapes, like manually constructed
                    // contours, we just add the two paths closed on themselves.
                    // This makes strange results if one path is *not* entirely
                    // inside the other, but then that is a strange usage.
                    tonext.attr('d', fullpath + 'Z' + prevpath + 'Z');
                }
                else {
                    // tonextx/y: for now just connect endpoints with lines. This is
                    // the correct behavior if the endpoints are at the same value of
                    // y/x, but if they *aren't*, we should ideally do more complicated
                    // things depending on whether the new endpoint projects onto the
                    // existing curve or off the end of it
                    tonext.attr('d', fullpath + 'L' + prevpath.substr(1) + 'Z');
                }
            }
        }

        trace._revpath = revpath;
    }


    function visFilter(d) {
        return d.filter(function(v) { return v.vis; });
    }

    function keyFunc(d) {
        return d.key;
    }

    // Returns a function if the trace is keyed, otherwise returns
    function getKeyFunc(trace) {
        if(trace.key) {
            return keyFunc;
        }
    }

    function makePoints(d) {
        var join, selection;
        var trace = d[0].trace,
            s = d3.select(this),
            showMarkers = subTypes.hasMarkers(trace),
            showText = subTypes.hasText(trace);

        if((!showMarkers && !showText) || trace.visible !== true) s.remove();
        else {
            if(showMarkers) {
                selection = s.selectAll('path.point');

                join = selection
                    .data(trace.marker.maxdisplayed ? visFilter : Lib.identity, getKeyFunc(trace));

                join.enter().append('path')
                    .classed('point', true)
                    .call(Drawing.pointStyle, trace)
                    .call(Drawing.translatePoints, xa, ya);

                selection
                    .call(Drawing.translatePoints, xa, ya)
                    .call(Drawing.pointStyle, trace);

                join.exit().remove();
            }
            if(showText) {
                selection = s.selectAll('g');

                join = selection
                    .data(trace.marker.maxdisplayed ? visFilter : Lib.identity);

                    // each text needs to go in its own 'g' in case
                    // it gets converted to mathjax
                join.enter().append('g')
                    .append('text')
                    .call(Drawing.translatePoints, xa, ya);

                selection
                    .call(Drawing.translatePoints, xa, ya);

                join.exit().remove();
            }
        }
    }

    // NB: selectAll is evaluated on instantiation:
    var pointSelection = tr.selectAll('.points');

    // Join with new data
    join = pointSelection.data([cdscatter]);

    // Transition existing, but don't defer this to an async .transition since
    // there's no timing involved:
    pointSelection.each(makePoints);

    join.enter().append('g')
        .classed('points', true)
        .each(makePoints);

    join.exit().remove();
}

function selectMarkers(gd, plotinfo, cdscatter) {
    var xa = plotinfo.x(),
        ya = plotinfo.y(),
        xr = d3.extent(xa.range.map(xa.l2c)),
        yr = d3.extent(ya.range.map(ya.l2c));

    // XXX: Not okay. Just makes it work for now.
    var i = 0;

    var trace = cdscatter[0].trace;
    if(!subTypes.hasMarkers(trace)) return;
    // if marker.maxdisplayed is used, select a maximum of
    // mnum markers to show, from the set that are in the viewport
    var mnum = trace.marker.maxdisplayed;

    // TODO: remove some as we get away from the viewport?
    if(mnum === 0) return;

    var cd = cdscatter.filter(function(v) {
            return v.x >= xr[0] && v.x <= xr[1] && v.y >= yr[0] && v.y <= yr[1];
        }),
        inc = Math.ceil(cd.length / mnum),
        tnum = 0;
    cdscatter.forEach(function(cdj, j) {
        var tracei = cdj[0].trace;
        if(subTypes.hasMarkers(tracei) &&
                tracei.marker.maxdisplayed > 0 && j < i) {
            tnum++;
        }
    });

    // if multiple traces use maxdisplayed, stagger which markers we
    // display this formula offsets successive traces by 1/3 of the
    // increment, adding an extra small amount after each triplet so
    // it's not quite periodic
    var i0 = Math.round(tnum * inc / 3 + Math.floor(tnum / 3) * inc / 7.1);

    // for error bars: save in cd which markers to show
    // so we don't have to repeat this
    cdscatter.forEach(function(v) { delete v.vis; });
    cd.forEach(function(v, i) {
        if(Math.round((i + i0) % inc) === 0) v.vis = true;
    });
}
