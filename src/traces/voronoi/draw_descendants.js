'use strict';

var d3 = require('@plotly/d3');
var Lib = require('../../lib');
var Drawing = require('../../components/drawing');
var svgTextUtils = require('../../lib/svg_text_utils');

var Offset = require('polygon-offset');
var voronoiTreemap = require('d3-voronoi-treemap').voronoiTreemap;
var styleOne = require('./style').styleOne;
var constants = require('../treemap/constants');
var helpers = require('../sunburst/helpers');
var attachFxHandlers = require('../sunburst/fx');
var formatSliceLabel = require('../sunburst/plot').formatSliceLabel;

var onPathbar = false; // for Descendants

module.exports = function drawDescendants(gd, cd, entry, slices, opts) {
    var width = opts.width;
    var height = opts.height;
    var viewX = opts.viewX;
    var viewY = opts.viewY;
    var pathSlice = opts.pathSlice;
    var toMoveInsideSlice = opts.toMoveInsideSlice;
    var strTransform = opts.strTransform;
    var hasTransition = opts.hasTransition;
    var handleSlicesExit = opts.handleSlicesExit;
    var makeUpdateSliceInterpolator = opts.makeUpdateSliceInterpolator;
    var makeUpdateTextInterpolator = opts.makeUpdateTextInterpolator;
    var prevEntry = opts.prevEntry;
    var refRect = {};

    var isStatic = gd._context.staticPlot;

    var fullLayout = gd._fullLayout;
    var cd0 = cd[0];
    var trace = cd0.trace;

    entry.each(function(pt) {
        pt.weight = pt.value;
    });


    var tiling = trace.tiling;

    Lib.seedPseudoRandom();
    for(var seed = 0; seed < tiling.seed; seed++) {
        Lib.pseudoRandom();
    }

    voronoiTreemap()
        .prng(Lib.pseudoRandom)
        .clip(createShape(
            tiling.shape,
            tiling.aspectratio,
            width,
            height
        ))(entry);

    entry.each(function(pt) {
        var offsetValue = trace.tiling.pad * (
            pt.height + 1
            // pt.depth // TODO: an option could be exposed
        );
        if(offsetValue) {
            var site = pt.polygon.site; // keep track of attached site

            // offset polygon
            var offset = new Offset();
            pt.polygon.push(pt.polygon[0]); // duplicate first vertex to close
            pt.polygon = offset.data(
                pt.polygon
            ).padding(offsetValue)[0];
            if(pt.polygon) {
                pt.polygon.pop(); // delete the vertex we added
            } else {
                pt.polygon = [];
            }

            pt.polygon.site = site;
        }

        var minX = Infinity;
        var minY = Infinity;
        var maxX = -Infinity;
        var maxY = -Infinity;

        var sumX = 0;
        var sumY = 0;
        var len = pt.polygon.length;
        for(var i = 0; i < len; i++) {
            var x = pt.polygon[i][0];
            var y = pt.polygon[i][1];
            minX = Math.min(minX, x);
            maxX = Math.max(maxX, x);
            minY = Math.min(minY, y);
            maxY = Math.max(maxY, y);
            sumX += x;
            sumY += y;
        }

        var ave = [sumX / len, sumY / len];
        var cen = getCentroid(pt.polygon);

        // Estimating a large orthogonal rectangle
        // TODO: improve me to find the largest inside the polygon
        var a = -1;
        var b = 2;
        var c = 2;
        pt.x0 = (a * ave[0] + b * minX + c * cen[0]) / (a + b + c);
        pt.x1 = (a * ave[0] + b * maxX + c * cen[0]) / (a + b + c);
        pt.y0 = (a * ave[1] + b * minY + c * cen[1]) / (a + b + c);
        pt.y1 = (a * ave[1] + b * maxY + c * cen[1]) / (a + b + c);
    });

    var sliceData = entry.descendants();

    var minVisibleDepth = Infinity;
    var maxVisibleDepth = -Infinity;
    sliceData.forEach(function(pt) {
        var depth = pt.depth;
        if(depth >= trace._maxDepth) {
            // hide slices that won't show up on graph
            pt.x0 = pt.x1 = (pt.x0 + pt.x1) / 2;
            pt.y0 = pt.y1 = (pt.y0 + pt.y1) / 2;
        } else {
            minVisibleDepth = Math.min(minVisibleDepth, depth);
            maxVisibleDepth = Math.max(maxVisibleDepth, depth);
        }
    });

    slices = slices.data(sliceData, helpers.getPtId);

    trace._maxVisibleLayers = isFinite(maxVisibleDepth) ? maxVisibleDepth - minVisibleDepth + 1 : 0;

    slices.enter().append('g')
        .classed('slice', true);

    handleSlicesExit(slices, onPathbar, refRect, [width, height], pathSlice);

    slices.order();

    // next coords of previous entry
    var nextOfPrevEntry = null;
    if(hasTransition && prevEntry) {
        var prevEntryId = helpers.getPtId(prevEntry);
        slices.each(function(pt) {
            if(nextOfPrevEntry === null && (helpers.getPtId(pt) === prevEntryId)) {
                nextOfPrevEntry = {
                    x0: pt.x0,
                    x1: pt.x1,
                    y0: pt.y0,
                    y1: pt.y1
                };
            }
        });
    }

    var getRefRect = function() {
        return nextOfPrevEntry || {
            x0: 0,
            x1: width,
            y0: 0,
            y1: height
        };
    };

    var updateSlices = slices;
    if(hasTransition) {
        updateSlices = updateSlices.transition().each('end', function() {
            // N.B. gd._transitioning is (still) *true* by the time
            // transition updates get here
            var sliceTop = d3.select(this);
            helpers.setSliceCursor(sliceTop, gd, {
                hideOnRoot: true,
                hideOnLeaves: false,
                isTransitioning: false
            });
        });
    }

    updateSlices.each(function(pt) {
        var isHeader = helpers.isHeader(pt, trace);

        // for bbox
        pt._x0 = viewX(pt.x0);
        pt._x1 = viewX(pt.x1);
        pt._y0 = viewY(pt.y0);
        pt._y1 = viewY(pt.y1);

        pt._hoverX = viewX(pt.x1);
        pt._hoverY = viewY(pt.y0);

        var sliceTop = d3.select(this);

        var slicePath = Lib.ensureSingle(sliceTop, 'path', 'surface', function(s) {
            s.style('pointer-events', isStatic ? 'none' : 'all');
        });

        if(hasTransition) {
            slicePath.transition().attrTween('d', function(pt2) {
                var interp = makeUpdateSliceInterpolator(pt2, onPathbar, getRefRect(), [width, height]);
                return function(t) { return pathSlice(interp(t)); };
            });
        } else {
            slicePath.attr('d', pathSlice);
        }

        sliceTop
            .call(attachFxHandlers, entry, gd, cd, {
                styleOne: styleOne,
                eventDataKeys: constants.eventDataKeys,
                transitionTime: constants.CLICK_TRANSITION_TIME,
                transitionEasing: constants.CLICK_TRANSITION_EASING
            })
            .call(helpers.setSliceCursor, gd, { isTransitioning: gd._transitioning });

        slicePath.call(styleOne, pt, trace, gd, {
            hovered: false
        });

        if(pt.x0 === pt.x1 || pt.y0 === pt.y1) {
            pt._text = '';
        } else {
            if(isHeader) {
                pt._text = '';
            } else {
                pt._text = formatSliceLabel(pt, entry, trace, cd, fullLayout) || '';
            }
        }

        var sliceTextGroup = Lib.ensureSingle(sliceTop, 'g', 'slicetext');
        var sliceText = Lib.ensureSingle(sliceTextGroup, 'text', '', function(s) {
            // prohibit tex interpretation until we can handle
            // tex and regular text together
            s.attr('data-notex', 1);
        });

        var font = Lib.ensureUniformFontSize(gd, helpers.determineTextFont(trace, pt, fullLayout.font));

        var text = pt._text || ' '; // use one space character instead of a blank string to avoid jumps during transition

        sliceText.text(text)
            .classed('slicetext', true)
            .attr('text-anchor', 'middle')
            .call(Drawing.font, font)
            .call(svgTextUtils.convertToTspans, gd);

        pt.textBB = Drawing.bBox(sliceText.node());
        pt.transform = toMoveInsideSlice(pt, {
            fontSize: font.size,
            isHeader: isHeader
        });
        pt.transform.fontSize = font.size;

        if(hasTransition) {
            sliceText.transition().attrTween('transform', function(pt2) {
                var interp = makeUpdateTextInterpolator(pt2, onPathbar, getRefRect(), [width, height]);
                return function(t) { return strTransform(interp(t)); };
            });
        } else {
            sliceText.attr('transform', strTransform(pt));
        }
    });

    return nextOfPrevEntry;
};

function getCentroid(points) {
    var len = points.length;
    if(!len) return [];

    var A2 = 0;
    var Sx = 0;
    var Sy = 0;
    for(var i = 0; i < len; i++) {
        var p0 = points[i];
        var p1 = points[(i + 1) % len];

        var Q = p0[0] * p1[1] - p0[1] * p1[0];
        A2 += Q;

        Sx += (p0[0] + p1[0]) * Q;
        Sy += (p0[1] + p1[1]) * Q;
    }

    return [
        Sx / (A2 * 3),
        Sy / (A2 * 3)
    ];
}

var nShapes = {
    rectangle: 4,
    triangle: 3,
    square: 4,
    pentagon: 5,
    hexagon: 6,
    heptagon: 7,
    octagon: 8,
    nonagon: 9,
    decagon: 10,
    undecagon: 11,
    dodecagon: 12,

    // TODO: is this optimal for circles as well as ellipses?
    circle: 360,
    ellipse: 360,
};

function createShape(shape, aspectratio, width, height) {
    var points = [];
    var i;
    var n = nShapes[shape];
    var minX = Infinity;
    var minY = Infinity;
    var maxX = -Infinity;
    var maxY = -Infinity;
    var tStep = 2 * Math.PI / n;

    var tStart = Math.PI / 2 - tStep / 2; // so that the bottom edge stay horizontal
    for(i = 0; i < n; i++) {
        var t = i * tStep + tStart;
        var x = Math.cos(t);
        var y = Math.sin(t);
        points.push([x, y]);

        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
    }

    var scaleX = width / (maxX - minX);
    var scaleY = height / (maxY - minY);

    if(aspectratio === 1) {
        var minScale = Math.min(scaleX, scaleY);
        scaleX = minScale;
        scaleY = minScale;
    } else if(aspectratio > 1) {
        scaleY = scaleX / aspectratio;
    } else if(aspectratio > 0) {
        scaleX = scaleY * aspectratio;
    }

    var oX = ((-minX > maxX) ? 1 : -1) * (minX + maxX) / 2;
    var oY = ((-minY > maxY) ? -1 : 1) * (minY + maxY) / 2;

    for(i = 0; i < n; i++) {
        var p = points[i];
        p[0] = (p[0] + oX) * scaleX + width / 2;
        p[1] = (p[1] + oY) * scaleY + height / 2;
    }

    return points;
}
