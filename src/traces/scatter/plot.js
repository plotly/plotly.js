/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var d3 = require('d3');

var Registry = require('../../registry');
var Lib = require('../../lib');
var Drawing = require('../../components/drawing');

var subTypes = require('./subtypes');
var linePoints = require('./line_points');
var linkTraces = require('./link_traces');
var polygonTester = require('../../lib/polygon').tester;

module.exports = function plot(gd, plotinfo, cdscatter, scatterLayer, transitionOpts, makeOnCompleteCallback) {
    var i, uids, join, onComplete;

    // If transition config is provided, then it is only a partial replot and traces not
    // updated are removed.
    var isFullReplot = !transitionOpts;
    var hasTransition = !!transitionOpts && transitionOpts.duration > 0;

    join = scatterLayer.selectAll('g.trace')
        .data(cdscatter, function(d) { return d[0].trace.uid; });

    // Append new traces:
    join.enter().append('g')
        .attr('class', function(d) {
            return 'trace scatter trace' + d[0].trace.uid;
        })
        .style('stroke-miterlimit', 2);

    // After the elements are created but before they've been draw, we have to perform
    // this extra step of linking the traces. This allows appending of fill layers so that
    // the z-order of fill layers is correct.
    linkTraces(gd, plotinfo, cdscatter);

    createFills(gd, scatterLayer, plotinfo);

    // Sort the traces, once created, so that the ordering is preserved even when traces
    // are shown and hidden. This is needed since we're not just wiping everything out
    // and recreating on every update.
    for(i = 0, uids = {}; i < cdscatter.length; i++) {
        uids[cdscatter[i][0].trace.uid] = i;
    }

    scatterLayer.selectAll('g.trace').sort(function(a, b) {
        var idx1 = uids[a[0].trace.uid];
        var idx2 = uids[b[0].trace.uid];
        return idx1 > idx2 ? 1 : -1;
    });

    if(hasTransition) {
        if(makeOnCompleteCallback) {
            // If it was passed a callback to register completion, make a callback. If
            // this is created, then it must be executed on completion, otherwise the
            // pos-transition redraw will not execute:
            onComplete = makeOnCompleteCallback();
        }

        var transition = d3.transition()
            .duration(transitionOpts.duration)
            .ease(transitionOpts.easing)
            .each('end', function() {
                onComplete && onComplete();
            })
            .each('interrupt', function() {
                onComplete && onComplete();
            });

        transition.each(function() {
            // Must run the selection again since otherwise enters/updates get grouped together
            // and these get executed out of order. Except we need them in order!
            scatterLayer.selectAll('g.trace').each(function(d, i) {
                plotOne(gd, i, plotinfo, d, cdscatter, this, transitionOpts);
            });
        });
    } else {
        scatterLayer.selectAll('g.trace').each(function(d, i) {
            plotOne(gd, i, plotinfo, d, cdscatter, this, transitionOpts);
        });
    }

    if(isFullReplot) {
        join.exit().remove();
    }

    // remove paths that didn't get used
    scatterLayer.selectAll('path:not([d])').remove();
};

function createFills(gd, scatterLayer, plotinfo) {
    var trace;

    scatterLayer.selectAll('g.trace').each(function(d) {
        var tr = d3.select(this);

        // Loop only over the traces being redrawn:
        trace = d[0].trace;

        // make the fill-to-next path now for the NEXT trace, so it shows
        // behind both lines.
        if(trace._nexttrace) {
            trace._nextFill = tr.select('.js-fill.js-tonext');
            if(!trace._nextFill.size()) {

                // If there is an existing tozero fill, we must insert this *after* that fill:
                var loc = ':first-child';
                if(tr.select('.js-fill.js-tozero').size()) {
                    loc += ' + *';
                }

                trace._nextFill = tr.insert('path', loc).attr('class', 'js-fill js-tonext');
            }
        } else {
            tr.selectAll('.js-fill.js-tonext').remove();
            trace._nextFill = null;
        }

        if(trace.fill && (trace.fill.substr(0, 6) === 'tozero' || trace.fill === 'toself' ||
                (trace.fill.substr(0, 2) === 'to' && !trace._prevtrace))) {
            trace._ownFill = tr.select('.js-fill.js-tozero');
            if(!trace._ownFill.size()) {
                trace._ownFill = tr.insert('path', ':first-child').attr('class', 'js-fill js-tozero');
            }
        } else {
            tr.selectAll('.js-fill.js-tozero').remove();
            trace._ownFill = null;
        }

        tr.selectAll('.js-fill').call(Drawing.setClipUrl, plotinfo.layerClipId);
    });
}

function plotOne(gd, idx, plotinfo, cdscatter, cdscatterAll, element, transitionOpts) {
    var join, i;

    // Since this has been reorganized and we're executing this on individual traces,
    // we need to pass it the full list of cdscatter as well as this trace's index (idx)
    // since it does an internal n^2 loop over comparisons with other traces:
    selectMarkers(gd, idx, plotinfo, cdscatter, cdscatterAll);

    var hasTransition = !!transitionOpts && transitionOpts.duration > 0;

    function transition(selection) {
        return hasTransition ? selection.transition() : selection;
    }

    var xa = plotinfo.xaxis,
        ya = plotinfo.yaxis;

    var trace = cdscatter[0].trace,
        line = trace.line,
        tr = d3.select(element);

    // error bars are at the bottom
    Registry.getComponentMethod('errorbars', 'plot')(tr, plotinfo, transitionOpts);

    if(trace.visible !== true) return;

    transition(tr).style('opacity', trace.opacity);

    // BUILD LINES AND FILLS
    var ownFillEl3, tonext;
    var ownFillDir = trace.fill.charAt(trace.fill.length - 1);
    if(ownFillDir !== 'x' && ownFillDir !== 'y') ownFillDir = '';

    // store node for tweaking by selectPoints
    if(!plotinfo.isRangePlot) cdscatter[0].node3 = tr;

    var prevRevpath = '';
    var prevPolygons = [];
    var prevtrace = trace._prevtrace;

    if(prevtrace) {
        prevRevpath = prevtrace._prevRevpath || '';
        tonext = prevtrace._nextFill;
        prevPolygons = prevtrace._polygons;
    }

    var thispath,
        thisrevpath,
        // fullpath is all paths for this curve, joined together straight
        // across gaps, for filling
        fullpath = '',
        // revpath is fullpath reversed, for fill-to-next
        revpath = '',
        // functions for converting a point array to a path
        pathfn, revpathbase, revpathfn,
        // variables used before and after the data join
        pt0, lastSegment, pt1, thisPolygons;

    // initialize line join data / method
    var segments = [],
        makeUpdate = Lib.noop;

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
                if(pts.length > 1 && pts[0][0] === pLast[0] && pts[0][1] === pLast[1]) {
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

        segments = linePoints(cdscatter, {
            xaxis: xa,
            yaxis: ya,
            connectGaps: trace.connectgaps,
            baseTolerance: Math.max(line.width || 1, 3) / 4,
            shape: line.shape,
            simplify: line.simplify
        });

        // since we already have the pixel segments here, use them to make
        // polygons for hover on fill
        // TODO: can we skip this if hoveron!=fills? That would mean we
        // need to redraw when you change hoveron...
        thisPolygons = trace._polygons = new Array(segments.length);
        for(i = 0; i < segments.length; i++) {
            trace._polygons[i] = polygonTester(segments[i]);
        }

        if(segments.length) {
            pt0 = segments[0][0];
            lastSegment = segments[segments.length - 1];
            pt1 = lastSegment[lastSegment.length - 1];
        }

        makeUpdate = function(isEnter) {
            return function(pts) {
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
                    var el = d3.select(this);

                    // This makes the coloring work correctly:
                    el.datum(cdscatter);

                    if(isEnter) {
                        transition(el.style('opacity', 0)
                            .attr('d', thispath)
                            .call(Drawing.lineGroupStyle))
                                .style('opacity', 1);
                    } else {
                        var sel = transition(el);
                        sel.attr('d', thispath);
                        Drawing.singleLineStyle(cdscatter, sel);
                    }
                }
            };
        };
    }

    var lineJoin = tr.selectAll('.js-line').data(segments);

    transition(lineJoin.exit())
        .style('opacity', 0)
        .remove();

    lineJoin.each(makeUpdate(false));

    lineJoin.enter().append('path')
        .classed('js-line', true)
        .style('vector-effect', 'non-scaling-stroke')
        .call(Drawing.lineGroupStyle)
        .each(makeUpdate(true));

    Drawing.setClipUrl(lineJoin, plotinfo.layerClipId);

    function clearFill(selection) {
        transition(selection).attr('d', 'M0,0Z');
    }

    if(segments.length) {
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
                    // For the sake of animations, wrap the points around so that
                    // the points on the axes are the first two points. Otherwise
                    // animations get a little crazy if the number of points changes.
                    transition(ownFillEl3).attr('d', 'M' + pt1 + 'L' + pt0 + 'L' + fullpath.substr(1))
                        .call(Drawing.singleFillStyle);
                } else {
                    // fill to self: just join the path to itself
                    transition(ownFillEl3).attr('d', fullpath + 'Z')
                        .call(Drawing.singleFillStyle);
                }
            }
        }
        else if(tonext) {
            if(trace.fill.substr(0, 6) === 'tonext' && fullpath && prevRevpath) {
                // fill to next: full trace path, plus the previous path reversed
                if(trace.fill === 'tonext') {
                    // tonext: for use by concentric shapes, like manually constructed
                    // contours, we just add the two paths closed on themselves.
                    // This makes strange results if one path is *not* entirely
                    // inside the other, but then that is a strange usage.
                    transition(tonext).attr('d', fullpath + 'Z' + prevRevpath + 'Z')
                        .call(Drawing.singleFillStyle);
                }
                else {
                    // tonextx/y: for now just connect endpoints with lines. This is
                    // the correct behavior if the endpoints are at the same value of
                    // y/x, but if they *aren't*, we should ideally do more complicated
                    // things depending on whether the new endpoint projects onto the
                    // existing curve or off the end of it
                    transition(tonext).attr('d', fullpath + 'L' + prevRevpath.substr(1) + 'Z')
                        .call(Drawing.singleFillStyle);
                }
                trace._polygons = trace._polygons.concat(prevPolygons);
            }
            else {
                clearFill(tonext);
                trace._polygons = null;
            }
        }
        trace._prevRevpath = revpath;
        trace._prevPolygons = thisPolygons;
    }
    else {
        if(ownFillEl3) clearFill(ownFillEl3);
        else if(tonext) clearFill(tonext);
        trace._polygons = trace._prevRevpath = trace._prevPolygons = null;
    }


    function visFilter(d) {
        return d.filter(function(v) { return v.vis; });
    }

    function keyFunc(d) {
        return d.id;
    }

    // Returns a function if the trace is keyed, otherwise returns undefined
    function getKeyFunc(trace) {
        if(trace.ids) {
            return keyFunc;
        }
    }

    function hideFilter() {
        return false;
    }

    function makePoints(d) {
        var join, selection, hasNode;

        var trace = d[0].trace;
        var s = d3.select(this);
        var showMarkers = subTypes.hasMarkers(trace);
        var showText = subTypes.hasText(trace);

        var keyFunc = getKeyFunc(trace);
        var markerFilter = hideFilter;
        var textFilter = hideFilter;

        if(showMarkers) {
            markerFilter = (trace.marker.maxdisplayed || trace._needsCull) ? visFilter : Lib.identity;
        }

        if(showText) {
            textFilter = (trace.marker.maxdisplayed || trace._needsCull) ? visFilter : Lib.identity;
        }

        // marker points

        selection = s.selectAll('path.point');

        join = selection.data(markerFilter, keyFunc);

        var enter = join.enter().append('path')
            .classed('point', true);

        if(hasTransition) {
            enter
                .call(Drawing.pointStyle, trace, gd)
                .call(Drawing.translatePoints, xa, ya)
                .style('opacity', 0)
                .transition()
                .style('opacity', 1);
        }

        join.order();

        var styleFns;
        if(showMarkers) {
            styleFns = Drawing.makePointStyleFns(trace);
        }

        join.each(function(d) {
            var el = d3.select(this);
            var sel = transition(el);
            hasNode = Drawing.translatePoint(d, sel, xa, ya);

            if(hasNode) {
                Drawing.singlePointStyle(d, sel, trace, styleFns, gd);

                if(plotinfo.layerClipId) {
                    Drawing.hideOutsideRangePoint(d, sel, xa, ya, trace.xcalendar, trace.ycalendar);
                }

                if(trace.customdata) {
                    el.classed('plotly-customdata', d.data !== null && d.data !== undefined);
                }
            } else {
                sel.remove();
            }
        });

        if(hasTransition) {
            join.exit().transition()
                .style('opacity', 0)
                .remove();
        } else {
            join.exit().remove();
        }

        // text points
        selection = s.selectAll('g');
        join = selection.data(textFilter, keyFunc);

        // each text needs to go in its own 'g' in case
        // it gets converted to mathjax
        join.enter().append('g').classed('textpoint', true).append('text');

        join.order();

        join.each(function(d) {
            var g = d3.select(this);
            var sel = transition(g.select('text'));
            hasNode = Drawing.translatePoint(d, sel, xa, ya);

            if(hasNode) {
                if(plotinfo.layerClipId) {
                    Drawing.hideOutsideRangePoint(d, g, xa, ya, trace.xcalendar, trace.ycalendar);
                }
            } else {
                g.remove();
            }
        });

        join.selectAll('text')
            .call(Drawing.textPointStyle, trace, gd)
            .each(function(d) {
                // This just *has* to be totally custom becuase of SVG text positioning :(
                // It's obviously copied from translatePoint; we just can't use that
                var x = xa.c2p(d.x);
                var y = ya.c2p(d.y);

                d3.select(this).selectAll('tspan.line').each(function() {
                    transition(d3.select(this)).attr({x: x, y: y});
                });
            });

        join.exit().remove();
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

    // lastly, clip points groups of `cliponaxis !== false` traces
    // on `plotinfo._hasClipOnAxisFalse === true` subplots
    join.each(function(d) {
        var hasClipOnAxisFalse = d[0].trace.cliponaxis === false;
        Drawing.setClipUrl(d3.select(this), hasClipOnAxisFalse ? null : plotinfo.layerClipId);
    });
}

function selectMarkers(gd, idx, plotinfo, cdscatter, cdscatterAll) {
    var xa = plotinfo.xaxis,
        ya = plotinfo.yaxis,
        xr = d3.extent(Lib.simpleMap(xa.range, xa.r2c)),
        yr = d3.extent(Lib.simpleMap(ya.range, ya.r2c));

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
    cdscatterAll.forEach(function(cdj, j) {
        var tracei = cdj[0].trace;
        if(subTypes.hasMarkers(tracei) &&
                tracei.marker.maxdisplayed > 0 && j < idx) {
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
