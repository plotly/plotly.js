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


module.exports = function plot(gd, plotinfo, cdscatter) {
    selectMarkers(gd, plotinfo, cdscatter);

    var xa = plotinfo.x(),
        ya = plotinfo.y();

    // make the container for scatter plots
    // (so error bars can find them along with bars)
    var scattertraces = plotinfo.plot.select('.scatterlayer')
        .selectAll('g.trace.scatter')
        .data(cdscatter);

    scattertraces.enter().append('g')
        .attr('class', 'trace scatter')
        .style('stroke-miterlimit', 2);

    // error bars are at the bottom
    scattertraces.call(ErrorBars.plot, plotinfo);

    // BUILD LINES AND FILLS
    var prevpath = '',
        tozero, tonext, nexttonext;

    scattertraces.each(function(d) {
        var trace = d[0].trace,
            line = trace.line,
            tr = d3.select(this);
        if(trace.visible !== true) return;

        d[0].node3 = tr; // store node for tweaking by selectPoints

        arraysToCalcdata(d);

        if(!subTypes.hasLines(trace) && trace.fill === 'none') return;

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
        if(trace.fill.substr(0, 6) === 'tozero' ||
                (trace.fill.substr(0, 2) === 'to' && !prevpath)) {
            tozero = tr.append('path')
                .classed('js-fill', true);
        }
        else tozero = null;

        // make the fill-to-next path now for the NEXT trace, so it shows
        // behind both lines.
        // nexttonext was created last time, but give it
        // this curve's data for fill color
        if(nexttonext) tonext = nexttonext.datum(d);

        // now make a new nexttonext for next time
        nexttonext = tr.append('path').classed('js-fill', true);

        if(['hv', 'vh', 'hvh', 'vhv'].indexOf(line.shape) !== -1) {
            pathfn = Drawing.steps(line.shape);
            revpathbase = Drawing.steps(
                line.shape.split('').reverse().join('')
            );
        }
        else if(line.shape === 'spline') {
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
            return 'L' + revpathbase(pts.reverse()).substr(1);
        };

        var segments = linePoints(d, {
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
                fullpath += fullpath ? ('L' + thispath.substr(1)) : thispath;
                revpath = revpathfn(pts) + revpath;
                if(subTypes.hasLines(trace) && pts.length > 1) {
                    tr.append('path').classed('js-line', true).attr('d', thispath);
                }
            }
            if(tozero) {
                if(pt0 && pt1) {
                    if(trace.fill.charAt(trace.fill.length - 1) === 'y') {
                        pt0[1] = pt1[1] = ya.c2p(0, true);
                    }
                    else pt0[0] = pt1[0] = xa.c2p(0, true);

                    // fill to zero: full trace path, plus extension of
                    // the endpoints to the appropriate axis
                    tozero.attr('d', fullpath + 'L' + pt1 + 'L' + pt0 + 'Z');
                }
            }
            else if(trace.fill.substr(0, 6) === 'tonext' && fullpath && prevpath) {
                // fill to next: full trace path, plus the previous path reversed
                tonext.attr('d', fullpath + prevpath + 'Z');
            }
            prevpath = revpath;
        }
    });

    // remove paths that didn't get used
    scattertraces.selectAll('path:not([d])').remove();

    function visFilter(d) {
        return d.filter(function(v) { return v.vis; });
    }

    scattertraces.append('g')
        .attr('class', 'points')
        .each(function(d) {
            var trace = d[0].trace,
                s = d3.select(this),
                showMarkers = subTypes.hasMarkers(trace),
                showText = subTypes.hasText(trace);

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

function selectMarkers(gd, plotinfo, cdscatter) {
    var xa = plotinfo.x(),
        ya = plotinfo.y(),
        xr = d3.extent(xa.range.map(xa.l2c)),
        yr = d3.extent(ya.range.map(ya.l2c));

    cdscatter.forEach(function(d, i) {
        var trace = d[0].trace;
        if(!subTypes.hasMarkers(trace)) return;
        // if marker.maxdisplayed is used, select a maximum of
        // mnum markers to show, from the set that are in the viewport
        var mnum = trace.marker.maxdisplayed;

        // TODO: remove some as we get away from the viewport?
        if(mnum === 0) return;

        var cd = d.filter(function(v) {
                return v.x>=xr[0] && v.x<=xr[1] && v.y>=yr[0] && v.y<=yr[1];
            }),
            inc = Math.ceil(cd.length / mnum),
            tnum = 0;
        cdscatter.forEach(function(cdj, j) {
            var tracei = cdj[0].trace;
            if(subTypes.hasMarkers(tracei) &&
                    tracei.marker.maxdisplayed>0 && j<i) {
                tnum++;
            }
        });

        // if multiple traces use maxdisplayed, stagger which markers we
        // display this formula offsets successive traces by 1/3 of the
        // increment, adding an extra small amount after each triplet so
        // it's not quite periodic
        var i0 = Math.round(tnum*inc/3 + Math.floor(tnum/3) * inc/7.1);

        // for error bars: save in cd which markers to show
        // so we don't have to repeat this
        d.forEach(function(v) { delete v.vis; });
        cd.forEach(function(v, i) {
            if(Math.round((i + i0) % inc) === 0) v.vis = true;
        });
    });
}
