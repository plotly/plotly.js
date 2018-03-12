/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var c = require('./constants');
var d3 = require('d3');
var keyFun = require('../../lib/gup').keyFun;
var repeat = require('../../lib/gup').repeat;

function addFilterBarDefs(defs) {
    var filterBarPattern = defs.selectAll('#' + c.id.filterBarPattern)
        .data(repeat, keyFun);

    filterBarPattern.enter()
        .append('pattern')
        .attr('id', c.id.filterBarPattern)
        .attr('patternUnits', 'userSpaceOnUse');

    filterBarPattern
        .attr('x', -c.bar.width)
        .attr('width', c.bar.captureWidth)
        .attr('height', function(d) {return d.model.height;});

    var filterBarPatternGlyph = filterBarPattern.selectAll('rect')
        .data(repeat, keyFun);

    filterBarPatternGlyph.enter()
        .append('rect')
        .attr('shape-rendering', 'crispEdges');

    filterBarPatternGlyph
        .attr('height', function(d) {return d.model.height;})
        .attr('width', c.bar.width)
        .attr('x', c.bar.width / 2)
        .attr('fill', c.bar.fillColor)
        .attr('fill-opacity', c.bar.fillOpacity)
        .attr('stroke', c.bar.strokeColor)
        .attr('stroke-opacity', c.bar.strokeOpacity)
        .attr('stroke-width', c.bar.strokeWidth);
}

var snapRatio = c.bar.snapRatio;
function snapOvershoot(v, vAdjacent) { return v * (1 - snapRatio) + vAdjacent * snapRatio; }

var snapClose = c.bar.snapClose;
function closeToCovering(v, vAdjacent) { return v * (1 - snapClose) + vAdjacent * snapClose; }

// snap for the low end of a range on an ordinal scale
// on an ordinal scale, always show some overshoot from the exact value,
// so it's clear we're covering it
// find the interval we're in, and snap to 1/4 the distance to the next
// these two could be unified at a slight loss of readability / perf
function ordinalScaleSnapLo(a, v, existingRanges) {
    if(overlappingExisting(v, existingRanges)) return v;

    var aPrev = a[0];
    var aPrevPrev = aPrev;
    for(var i = 1; i < a.length; i++) {
        var aNext = a[i];

        // very close to the previous - snap down to it
        if(v < closeToCovering(aPrev, aNext)) return snapOvershoot(aPrev, aPrevPrev);
        if(v < aNext || i === a.length - 1) return snapOvershoot(aNext, aPrev);

        aPrevPrev = aPrev;
        aPrev = aNext;
    }
}

function ordinalScaleSnapHi(a, v, existingRanges) {
    if(overlappingExisting(v, existingRanges)) return v;

    var aPrev = a[a.length - 1];
    var aPrevPrev = aPrev;
    for(var i = a.length - 2; i >= 0; i--) {
        var aNext = a[i];

        // very close to the previous - snap down to it
        if(v > closeToCovering(aPrev, aNext)) return snapOvershoot(aPrev, aPrevPrev);
        if(v > aNext || i === a.length - 1) return snapOvershoot(aNext, aPrev);

        aPrevPrev = aPrev;
        aPrev = aNext;
    }
}

function overlappingExisting(v, existingRanges) {
    for(var i = 0; i < existingRanges.length; i++) {
        if(v >= existingRanges[i][0] && v <= existingRanges[i][1]) return true;
    }
    return false;
}

function barHorizontalSetup(selection) {
    selection
        .attr('x', -c.bar.captureWidth / 2)
        .attr('width', c.bar.captureWidth);
}

function backgroundBarHorizontalSetup(selection) {
    selection
        .attr('visibility', 'visible')
        .style('visibility', 'visible')
        .attr('fill', 'yellow')
        .attr('opacity', 0);
}

function setHighlight(d) {
    if(!filterActive(d.brush)) {
        return '0 ' + d.height;
    }
    var unitRanges = d.brush.filter.getConsolidated();
    var pixelRanges = unitRanges.map(function(pr) {return pr.map(d.unitScaleInOrder);});
    var dashArray = [0]; // we start with a 0 length selection as filter ranges are inclusive, not exclusive
    var p, sectionHeight, iNext;
    var currentGap = pixelRanges.length ? pixelRanges[0][0] : null;
    for(var i = 0; i < pixelRanges.length; i++) {
        p = pixelRanges[i];
        sectionHeight = p[1] - p[0];
        dashArray.push(currentGap);
        dashArray.push(sectionHeight);
        iNext = i + 1;
        if(iNext < pixelRanges.length) {
            currentGap = pixelRanges[iNext][0] - p[1];
        }
    }
    dashArray.push(d.height);
    // d.height is added at the end to ensure that (1) we have an even number of dasharray points, MDN page says
    // "If an odd number of values is provided, then the list of values is repeated to yield an even number of values."
    // and (2) it's _at least_ as long as the full height (even if range is minuscule and at the bottom) though this
    // may not be necessary, maybe duplicating the last point would do too. But no harm in a longer dasharray than line.
    return dashArray;
}

function differentInterval(int1) {
    // An interval is different if the extents don't match, which is a safe test only because the intervals
    // get consolidated anyway (ie. the identity of overlapping intervals won't be preserved; they get fused)
    return function(int2) {
        return int1[0] !== int2[0] || int1[1] !== int2[1];
    };
}

// is the cursor over the north, middle, or south of a bar?
// the end handles extend over the last 10% of the bar
function north(fPix, y) {
    return north90(fPix) <= y && y <= fPix[1] + c.bar.handleHeight;
}

function south(fPix, y) {
    return fPix[0] - c.bar.handleHeight <= y && y <= south90(fPix);
}

function middle(fPix, y) {
    return south90(fPix) < y && y < north90(fPix);
}

function north90(fPix) {
    return 0.9 * fPix[1] + 0.1 * fPix[0];
}

function south90(fPix) {
    return 0.9 * fPix[0] + 0.1 * fPix[1];
}

function clearCursor() {
    d3.select(document.body)
        .style('cursor', null);
}

function styleHighlight(selection) {
    // stroke-dasharray is used to minimize the number of created DOM nodes, because the requirement calls for up to
    // 1000 individual selections on an axis, and there can be 60 axes per parcoords, and multiple parcoords per
    // dashboard. The technique is similar to https://codepen.io/monfera/pen/rLYqWR and using a `polyline` with
    // multiple sections, or a `path` element via its `d` attribute would also be DOM-sparing alternatives.
    selection.attr('stroke-dasharray', setHighlight);
}

function renderHighlight(root, tweenCallback) {
    var bar = d3.select(root).selectAll('.highlight, .highlightShadow');
    var barToStyle = tweenCallback ? bar.transition().duration(c.bar.snapDuration).each('end', tweenCallback) : bar;
    styleHighlight(barToStyle);
}

function getInterval(b, unitScaleInOrder, y) {
    var intervals = b.filter.getConsolidated();
    var pixIntervals = intervals.map(function(interval) {return interval.map(unitScaleInOrder);});
    var hoveredInterval = NaN;
    var previousInterval = NaN;
    var nextInterval = NaN;
    for(var i = 0; i <= pixIntervals.length; i++) {
        var p = pixIntervals[i];
        if(p && p[0] <= y && y <= p[1]) {
            // over a bar
            hoveredInterval = i;
            break;
        } else {
            // between bars, or before/after the first/last bar
            previousInterval = i ? i - 1 : NaN;
            if(p && p[0] > y) {
                nextInterval = i;
                break; // no point continuing as intervals are non-overlapping and sorted; could use log search
            }
        }
    }
    // fixme consider refactoring this otherwise quite simple nested ternary
    var closestInterval = isNaN(hoveredInterval)
        ? ( // if we're South of the 1st interval, there's no previous interval
            isNaN(previousInterval)
                ? nextInterval
                : ( // if we're North of the last interval, there's no next interval
                    isNaN(nextInterval)
                        ? previousInterval
                        : ( // if we have both previous and subsequent intervals, which one is closer?
                            y - pixIntervals[previousInterval][1] < pixIntervals[nextInterval][0] - y
                                ? previousInterval
                                : nextInterval)))
        : hoveredInterval; // if we're hovering over an interval, that's trivially the closest interval
    var fPix = pixIntervals[closestInterval];

    return {
        interval: isNaN(closestInterval) ? null : intervals[closestInterval], // activated interval in domain terms
        intervalPix: isNaN(closestInterval) ? null : pixIntervals[closestInterval], // activated interval in pixel terms
        n: north(fPix, y), // do we hover over the northern resize hotspot
        s: south(fPix, y), // do we hover over the northern resize hotspot
        m: middle(fPix, y) // or over the bar section itself?
    };
}

function attachDragBehavior(selection) {
    // There's some fiddling with pointer cursor styling so that the cursor preserves its shape while dragging a brush
    // even if the cursor strays from the interacting bar, which is bound to happen as bars are thin and the user
    // will inevitably leave the hotspot strip. In this regard, it does something similar to what the D3 brush would do.
    selection
        .on('mousemove', function(d) {
            d3.event.preventDefault();
            var b = d.brush;
            if(d.parent.inBrushDrag) {
                return;
            }
            var y = d.unitScaleInOrder(d.unitScale.invert(d3.mouse(this)[1] + c.verticalPadding));
            var interval = getInterval(b, d.unitScaleInOrder, y);
            d3.select(document.body)
                .style('cursor', interval.n ? 'n-resize' : interval.s ? 's-resize' : !interval.m ? 'crosshair' : filterActive(b) ? 'ns-resize' : 'crosshair');
        })
        .on('mouseleave', function(d) {
            if(d.parent.inBrushDrag) {
                return;
            }
            clearCursor();
        })
        .call(d3.behavior.drag()
            .on('dragstart', function(d) {
                var e = d3.event;
                e.sourceEvent.stopPropagation();
                var y = d.unitScaleInOrder(d.unitScale.invert(d3.mouse(this)[1] + c.verticalPadding));
                var unitLocation = d.unitScaleInOrder.invert(y);
                var b = d.brush;
                var intData = getInterval(b, d.unitScaleInOrder, y);
                var unitRange = intData.interval;
                var pixelRange = unitRange.map(d.unitScaleInOrder);
                var s = b.svgBrush;
                var active = filterActive(b);
                var barInteraction = unitRange && (intData.m || intData.s || intData.n);
                s.wasDragged = false; // we start assuming there won't be a drag - useful for reset
                s.grabPoint = d.unitScaleInOrder(unitLocation) - pixelRange[0] - c.verticalPadding;
                s.barLength = pixelRange[1] - pixelRange[0];
                s.grabbingBar = active && intData.m && unitRange;
                s.stayingIntervals = !d.multiselect ? [] :
                    barInteraction
                    ? b.filter.get().filter(differentInterval(unitRange))
                    : b.filter.get(); // keep all preexisting bars if interaction wasn't a barInteraction
                var grabbingBarNorth = intData.n;
                var grabbingBarSouth = intData.s;
                var newBrushing = !s.grabbingBar && !grabbingBarNorth && !grabbingBarSouth;
                s.startExtent = newBrushing
                    ? d.unitScaleInOrder.invert(y)
                    : grabbingBarSouth
                        ? unitRange[1]
                        : unitRange[0];
                d.parent.inBrushDrag = true;
                s.brushStartCallback();
            })
            .on('drag', function(d) {
                var e = d3.event;
                var y = d.unitScaleInOrder(d.unitScale.invert(e.y + c.verticalPadding));
                var s = d.brush.svgBrush;
                s.wasDragged = true;
                e.sourceEvent.stopPropagation();

                if(s.grabbingBar) { // moving the bar
                    s.newExtent = [y - s.grabPoint, y + s.barLength - s.grabPoint].map(d.unitScaleInOrder.invert);
                } else { // south/north drag or new bar creation
                    var endExtent = d.unitScaleInOrder.invert(y);
                    s.newExtent = s.startExtent < endExtent ?
                        [s.startExtent, endExtent] :
                        [endExtent, s.startExtent];
                }

                // take care of the parcoords axis height constraint: bar can't breach it
                var bottomViolation = Math.max(0, -s.newExtent[0]);
                var topViolation = Math.max(0, s.newExtent[1] - 1);
                s.newExtent[0] += bottomViolation;
                s.newExtent[1] -= topViolation;
                if(s.grabbingBar) {
                    // in case of bar dragging (non-resizing interaction, unlike north/south resize or new bar creation)
                    // the constraint adjustment must apply to the other end of the bar as well, otherwise it'd
                    // shorten or lengthen
                    s.newExtent[1] += bottomViolation;
                    s.newExtent[0] -= topViolation;
                }

                d.brush.filterSpecified = true;
                s.extent = s.stayingIntervals.concat([s.newExtent]);
                s.brushCallback(d);
                renderHighlight(this.parentElement);
            })
            .on('dragend', function(d) {
                var e = d3.event;
                e.sourceEvent.stopPropagation();
                var brush = d.brush;
                var filter = brush.filter;
                var s = brush.svgBrush;
                var grabbingBar = s.grabbingBar;
                s.grabbingBar = false;
                s.grabLocation = undefined;
                d.parent.inBrushDrag = false;
                clearCursor(); // instead of clearing, a nicer thing would be to set it according to current location
                if(!s.wasDragged) { // a click+release on the same spot (ie. w/o dragging) means a bar or full reset
                    s.wasDragged = undefined; // logic-wise unneded, just shows `wasDragged` has no longer a meaning
                    if(grabbingBar) {
                        s.extent = s.stayingIntervals;
                        if(s.extent.length === 0) {
                            brushClear(brush);
                        }
                    } else {
                        brushClear(brush);
                    }
                    s.brushCallback(d);
                    renderHighlight(this.parentElement);
                    s.brushEndCallback(filter.get());
                    return; // no need to fuse intervals or snap to ordinals, so we can bail early
                }
                var mergeIntervals = function() {
                    // Key piece of logic: once the button is released, possibly overlapping intervals will be fused:
                    // Here it's done immediately on click release while on ordinal snap transition it's done at the end
                    filter.set(filter.getConsolidated());
                };
                if(d.ordinal) {
                    var a = d.ordinalScale.range();
                    s.newExtent = [
                        ordinalScaleSnapLo(a, s.newExtent[0], s.stayingIntervals),
                        ordinalScaleSnapHi(a, s.newExtent[1], s.stayingIntervals)
                    ];
                    s.extent = s.stayingIntervals.concat(s.newExtent[1] > s.newExtent[0] ? [s.newExtent] : []);
                    if(!s.extent.length) {
                        brushClear(brush);
                    }
                    s.brushCallback(d);
                    renderHighlight(this.parentElement, mergeIntervals); // merging intervals post the snap tween
                } else {
                    mergeIntervals(); // merging intervals immediately
                }
                s.brushEndCallback(filter.get());
            })
        );
}

function renderAxisBrush(axisBrush) {

    var background = axisBrush.selectAll('.background').data(repeat);

    background.enter()
        .append('rect')
        .classed('background', true)
        .call(barHorizontalSetup)
        .call(backgroundBarHorizontalSetup)
        .style('pointer-events', 'auto') // parent pointer events are disabled; we must have it to register events
        .attr('transform', 'translate(0 ' + c.verticalPadding + ')');

    background
        .call(attachDragBehavior)
        .attr('height', function(d) {
            return d.height - c.verticalPadding;
        });

    var highlightShadow = axisBrush.selectAll('.highlightShadow').data(repeat); // we have a set here, can't call it `extent`

    highlightShadow.enter()
        .append('line')
        .classed('highlightShadow', true)
        .attr('x', -c.bar.width / 2)
        .attr('stroke-width', c.bar.width + c.bar.strokeWidth)
        .attr('stroke', c.bar.strokeColor)
        .attr('opacity', c.bar.strokeOpacity)
        .attr('stroke-linecap', 'butt');

    highlightShadow
        .attr('y1', function(d) {return d.height;})
        .call(styleHighlight);

    var highlight = axisBrush.selectAll('.highlight').data(repeat); // we have a set here, can't call it `extent`

    highlight.enter()
        .append('line')
        .classed('highlight', true)
        .attr('x', -c.bar.width / 2)
        .attr('stroke-width', c.bar.width - c.bar.strokeWidth)
        .attr('stroke', c.bar.fillColor)
        .attr('opacity', c.bar.fillOpacity)
        .attr('stroke-linecap', 'butt');

    highlight
        .attr('y1', function(d) {return d.height;})
        .call(styleHighlight);
}

function ensureAxisBrush(axisOverlays) {
    var axisBrush = axisOverlays.selectAll('.' + c.cn.axisBrush)
        .data(repeat, keyFun);

    axisBrush.enter()
        .append('g')
        .classed(c.cn.axisBrush, true);

    renderAxisBrush(axisBrush);
}

function getBrushExtent(brush) {
    return brush.svgBrush.extent.map(function(e) {return e.slice();});
}

function brushClear(brush) {
    brush.filterSpecified = false;
    brush.svgBrush.extent = [[0, 1]];
}


function filterActive(brush) {
    return brush.filterSpecified;
}

function axisBrushMoved(callback) {
    return function axisBrushMoved(dimension) {
        var brush = dimension.brush;
        var extent = getBrushExtent(brush);
        var newExtent = extent.slice();
        brush.filter.set(newExtent);
        callback();
    };
}

function dedupeRealRanges(intervals) {
    // Fuses elements of intervals if they overlap, yielding discontiguous intervals, results.length <= intervals.length
    // Currently uses closed intervals, ie. dedupeRealRanges([[400, 800], [300, 400]]) -> [300, 800]
    var queue = intervals.slice().sort(function(a, b) {return a[0] - b[0];}); // ordered by interval start
    var result = [];
    var currentInterval;
    var current = queue.shift();
    while(current) { // [].shift === undefined, so we don't descend into an empty array
        currentInterval = current.slice();
        while((current = queue.shift()) && current[0] <= /* right-open interval would need `<` */ currentInterval[1]) {
            currentInterval[1] = Math.max(currentInterval[1], current[1]);
        }
        result.push(currentInterval);
    }
    return result;
}

function makeFilter() {
    var filter = [];
    var consolidated;
    return {
        set: function(a) {
            filter = a.slice().map(function(d) {return d.slice();});
            consolidated = dedupeRealRanges(a);
        },
        get: function() {return filter.slice();},
        getConsolidated: function() {return consolidated;}, // would be nice if slow to slice in two layers...
        getBounds: function() {return filter.reduce(function(p, n) {return [Math.min(p[0], n[0]), Math.max(p[1], n[1])];}, [Infinity, -Infinity]);}
    };
}

function makeBrush(state, rangeSpecified, initialRange, brushStartCallback, brushCallback, brushEndCallback) {
    var filter = makeFilter();
    filter.set(initialRange);
    return {
        filter: filter,
        filterSpecified: rangeSpecified, // there's a difference between not filtering and filtering a non-proper subset
        svgBrush: {
            extent: [], // this is where the svgBrush writes contents into
            brushStartCallback: brushStartCallback,
            brushCallback: axisBrushMoved(brushCallback),
            brushEndCallback: brushEndCallback
        }
    };
}

module.exports = {
    addFilterBarDefs: addFilterBarDefs,
    makeBrush: makeBrush,
    ensureAxisBrush: ensureAxisBrush,
    filterActive: filterActive
};
