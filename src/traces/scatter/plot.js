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


module.exports = function plot(gd, plotinfo, cdscatter, group, transitionOpts) {
    selectMarkers(gd, plotinfo, cdscatter);

    var transitionConfig = Lib.extendFlat({}, transitionOpts || {});
    transitionConfig = Lib.extendFlat({
        duration: 0,
        easing: 'in-out-cubic',
        cascade: 0,
        delay: 0,
    }, transitionConfig);

    var hasTransition = transitionConfig.duration > 0;

    function transition (selection) {
        return selection.transition()
            .duration(transitionConfig.duration)
            .ease(transitionConfig.easing);
    }

    var xa = plotinfo.x(),
        ya = plotinfo.y();

    var trace = cdscatter[0].trace,
        line = trace.line,
        tr = d3.select(group);

    console.log('start plot of ', trace.uid);
    tr.style('stroke-miterlimit', 2);

    // (so error bars can find them along with bars)
    // error bars are at the bottom
    tr.call(ErrorBars.plot, plotinfo);

    if(trace.visible !== true) return;

    // BUILD LINES AND FILLS
    var ownFillEl3, tonext, nexttonext;
    var ownFillDir = trace.fill.charAt(trace.fill.length - 1);
    if(ownFillDir !== 'x' && ownFillDir !== 'y') ownFillDir = '';

    // store node for tweaking by selectPoints
    cdscatter[0].node3 = tr;

    arraysToCalcdata(cdscatter);

    var prevpath = '';
    var prevtrace = trace._prevtrace;

    if (prevtrace) {
        prevpath = prevtrace._revpath || '';
        tonext = prevtrace._nexttonext;
    }
    console.log(trace.uid, trace._prevtrace && trace._prevtrace.uid, 'prevtrace:', prevtrace, tonext);

    var thispath,
        thisrevpath,
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
    if(trace.fill.substr(0, 6) === 'tozero' || trace.fill === 'toself' ||
            (trace.fill.substr(0, 2) === 'to' && !prevtrace)) {
        ownFillEl3 = tr.select('.js-fill.js-tozero');
        if (!ownFillEl3.size()) {
            ownFillEl3 = tr.append('path').attr('class', 'js-fill js-tozero');
        }
    } else {
        tr.selectAll('.js-fill.js-tozero').remove();
        ownFillEl3 = null;
    }

    // make the fill-to-next path now for the NEXT trace, so it shows
    // behind both lines.
    // nexttonext was created last time, but give it
    // this curve's data for fill color
    if (trace._nexttrace) {
        console.log(trace.uid, 'has nexttrace');
        trace._nexttonext = tr.select('.js-fill.js-tonext');
        if (!trace._nexttonext.size()) {
            trace._nexttonext = tr.append('path').attr('class', 'js-fill js-tonext');
        }
    } else {
        console.log(trace.uid, 'does not have nexttrace');
        tr.selectAll('.js-fill.js-tonext').remove();
        trace._nexttonext = null;
    }

    if(subTypes.hasLines(trace) || trace.fill !== 'none') {

        if (tonext) {
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

                    transition(lineJoin).attr('d', thispath);
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
                        transition(ownFillEl3).attr('d', fullpath + 'L' + pt1 + 'L' + pt0 + 'Z');
                    } else {
                        // fill to self: just join the path to itself
                        transition(ownFillEl3).attr('d', fullpath + 'Z');
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
                    transition(tonext).attr('d', fullpath + 'Z' + prevpath + 'Z');
                }
                else {
                    // tonextx/y: for now just connect endpoints with lines. This is
                    // the correct behavior if the endpoints are at the same value of
                    // y/x, but if they *aren't*, we should ideally do more complicated
                    // things depending on whether the new endpoint projects onto the
                    // existing curve or off the end of it
                    transition(tonext).attr('d', fullpath + 'L' + prevpath.substr(1) + 'Z');
                }
            }
        }

        trace._revpath = revpath;
    }


    // remove paths that didn't get used
    //tr.selectAll('path:not([d])').remove();

    function visFilter(d) {
        return d.filter(function(v) { return v.vis; });
    }

    function keyFunc (d) {
        return d.key;
    }

    function getKeyFunc(trace) {
        if (trace.key) {
            return keyFunc;
        }
    }


    function makePoints (d) {
        var trace = d[0].trace,
            s = d3.select(this),
            showMarkers = subTypes.hasMarkers(trace),
            showText = subTypes.hasText(trace);

        if((!showMarkers && !showText) || trace.visible !== true) s.remove();
        else {
            if(showMarkers) {
                var join = s.selectAll('path.point')
                    .data(trace.marker.maxdisplayed ? visFilter : Lib.identity, getKeyFunc(trace))

                join.enter().append('path')
                    .classed('point', true)
                    .call(Drawing.translatePoints, xa, ya, Lib.extendFlat(transitionConfig, {direction: 1}), trace)
                    .call(Drawing.pointStyle, trace)

                join.transition()
                    .duration(0)
                    .call(Drawing.translatePoints, xa, ya, Lib.extendFlat(transitionConfig, {direction: 0}), trace)
                    .call(Drawing.pointStyle, trace)

                join.exit().remove();
                    //.call(Drawing.translatePoints, xa, ya, Lib.extendFlat(transitionConfig, {direction: -1}), trace);
            }
            if(showText) {
                s.selectAll('g')
                    .data(trace.marker.maxdisplayed ? visFilter : Lib.identity)
                    // each text needs to go in its own 'g' in case
                    // it gets converted to mathjax
                    .enter().append('g')
                        .append('text')
                        .call(Drawing.translatePoints, xa, ya, Lib.extendFlat(transitionConfig, {direction: 1}), trace);
            }
        }
    }

    var pointJoin = tr.selectAll('.points').data([cdscatter]);

    pointJoin.enter().append('g')
        .classed('points', true)
        .each(makePoints);

    pointJoin.transition()
        .duration(0)
        .each(makePoints);

    pointJoin.exit().remove();
};

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
