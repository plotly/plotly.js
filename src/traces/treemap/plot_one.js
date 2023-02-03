'use strict';

var d3 = require('@plotly/d3');
var interpolate = require('d3-interpolate').interpolate;

var helpers = require('../sunburst/helpers');

var Lib = require('../../lib');
var TEXTPAD = require('../bar/constants').TEXTPAD;
var barPlot = require('../bar/plot');
var toMoveInsideBar = barPlot.toMoveInsideBar;
var uniformText = require('../bar/uniform_text');
var recordMinTextSize = uniformText.recordMinTextSize;
var constants = require('./constants');
var drawAncestors = require('./draw_ancestors');

function getKey(pt) {
    return helpers.isHierarchyRoot(pt) ?
        '' : // don't use the dummyId
        helpers.getPtId(pt);
}

module.exports = function plotOne(gd, cd, element, transitionOpts, drawDescendants) {
    var fullLayout = gd._fullLayout;
    var cd0 = cd[0];
    var trace = cd0.trace;
    var type = trace.type;
    var isIcicle = type === 'icicle';

    var hierarchy = cd0.hierarchy;
    var entry = helpers.findEntryWithLevel(hierarchy, trace.level);

    var gTrace = d3.select(element);
    var selAncestors = gTrace.selectAll('g.pathbar');
    var selDescendants = gTrace.selectAll('g.slice');

    if(!entry) {
        selAncestors.remove();
        selDescendants.remove();
        return;
    }

    var isRoot = helpers.isHierarchyRoot(entry);
    var hasTransition = !fullLayout.uniformtext.mode && helpers.hasTransition(transitionOpts);

    var maxDepth = helpers.getMaxDepth(trace);
    var hasVisibleDepth = function(pt) {
        return pt.data.depth - entry.data.depth < maxDepth;
    };

    var gs = fullLayout._size;
    var domain = trace.domain;

    var vpw = gs.w * (domain.x[1] - domain.x[0]);
    var vph = gs.h * (domain.y[1] - domain.y[0]);
    var barW = vpw;
    var barH = trace.pathbar.thickness;
    var barPad = trace.marker.line.width + constants.gapWithPathbar;
    var barDifY = !trace.pathbar.visible ? 0 :
        trace.pathbar.side.indexOf('bottom') > -1 ? vph + barPad : -(barH + barPad);

    var pathbarOrigin = {
        x0: barW, // slide to the right
        x1: barW,
        y0: barDifY,
        y1: barDifY + barH
    };

    var findClosestEdge = function(pt, ref, size) {
        var e = trace.tiling.pad;
        var isLeftOfRect = function(x) { return x - e <= ref.x0; };
        var isRightOfRect = function(x) { return x + e >= ref.x1; };
        var isBottomOfRect = function(y) { return y - e <= ref.y0; };
        var isTopOfRect = function(y) { return y + e >= ref.y1; };

        if(pt.x0 === ref.x0 && pt.x1 === ref.x1 && pt.y0 === ref.y0 && pt.y1 === ref.y1) {
            return {
                x0: pt.x0,
                x1: pt.x1,
                y0: pt.y0,
                y1: pt.y1
            };
        }

        return {
            x0: isLeftOfRect(pt.x0 - e) ? 0 : isRightOfRect(pt.x0 - e) ? size[0] : pt.x0,
            x1: isLeftOfRect(pt.x1 + e) ? 0 : isRightOfRect(pt.x1 + e) ? size[0] : pt.x1,
            y0: isBottomOfRect(pt.y0 - e) ? 0 : isTopOfRect(pt.y0 - e) ? size[1] : pt.y0,
            y1: isBottomOfRect(pt.y1 + e) ? 0 : isTopOfRect(pt.y1 + e) ? size[1] : pt.y1
        };
    };

    // stash of 'previous' position data used by tweening functions
    var prevEntry = null;
    var prevLookupPathbar = {};
    var prevLookupSlices = {};
    var nextOfPrevEntry = null;
    var getPrev = function(pt, onPathbar) {
        return onPathbar ?
            prevLookupPathbar[getKey(pt)] :
            prevLookupSlices[getKey(pt)];
    };

    var getOrigin = function(pt, onPathbar, refRect, size) {
        if(onPathbar) {
            return prevLookupPathbar[getKey(hierarchy)] || pathbarOrigin;
        } else {
            var ref = prevLookupSlices[trace.level] || refRect;

            if(hasVisibleDepth(pt)) { // case of an empty object - happens when maxdepth is set
                return findClosestEdge(pt, ref, size);
            }
        }
        return {};
    };

    // N.B. handle multiple-root special case
    if(cd0.hasMultipleRoots && isRoot) {
        maxDepth++;
    }

    trace._maxDepth = maxDepth;
    trace._backgroundColor = fullLayout.paper_bgcolor;
    trace._entryDepth = entry.data.depth;
    trace._atRootLevel = isRoot;

    var cenX = -vpw / 2 + gs.l + gs.w * (domain.x[1] + domain.x[0]) / 2;
    var cenY = -vph / 2 + gs.t + gs.h * (1 - (domain.y[1] + domain.y[0]) / 2);

    var viewMapX = function(x) { return cenX + x; };
    var viewMapY = function(y) { return cenY + y; };

    var barY0 = viewMapY(0);
    var barX0 = viewMapX(0);

    var viewBarX = function(x) { return barX0 + x; };
    var viewBarY = function(y) { return barY0 + y; };

    function pos(x, y) {
        return x + ',' + y;
    }

    var xStart = viewBarX(0);
    var limitX0 = function(p) { p.x = Math.max(xStart, p.x); };

    var edgeshape = trace.pathbar.edgeshape;

    // pathbar(directory) path generation fn
    var pathAncestor = function(d) {
        var _x0 = viewBarX(Math.max(Math.min(d.x0, d.x0), 0));
        var _x1 = viewBarX(Math.min(Math.max(d.x1, d.x1), barW));
        var _y0 = viewBarY(d.y0);
        var _y1 = viewBarY(d.y1);

        var halfH = barH / 2;

        var pL = {};
        var pR = {};

        pL.x = _x0;
        pR.x = _x1;

        pL.y = pR.y = (_y0 + _y1) / 2;

        var pA = {x: _x0, y: _y0};
        var pB = {x: _x1, y: _y0};
        var pC = {x: _x1, y: _y1};
        var pD = {x: _x0, y: _y1};

        if(edgeshape === '>') {
            pA.x -= halfH;
            pB.x -= halfH;
            pC.x -= halfH;
            pD.x -= halfH;
        } else if(edgeshape === '/') {
            pC.x -= halfH;
            pD.x -= halfH;
            pL.x -= halfH / 2;
            pR.x -= halfH / 2;
        } else if(edgeshape === '\\') {
            pA.x -= halfH;
            pB.x -= halfH;
            pL.x -= halfH / 2;
            pR.x -= halfH / 2;
        } else if(edgeshape === '<') {
            pL.x -= halfH;
            pR.x -= halfH;
        }

        limitX0(pA);
        limitX0(pD);
        limitX0(pL);

        limitX0(pB);
        limitX0(pC);
        limitX0(pR);

        return (
           'M' + pos(pA.x, pA.y) +
           'L' + pos(pB.x, pB.y) +
           'L' + pos(pR.x, pR.y) +
           'L' + pos(pC.x, pC.y) +
           'L' + pos(pD.x, pD.y) +
           'L' + pos(pL.x, pL.y) +
           'Z'
        );
    };

    // Note that `pad` is just an integer for `icicle`` traces where
    // `pad` is a hashmap for treemap: pad.t, pad.b, pad.l, and pad.r
    var pad = trace[isIcicle ? 'tiling' : 'marker'].pad;

    var hasFlag = function(f) { return trace.textposition.indexOf(f) !== -1; };

    var hasTop = hasFlag('top');
    var hasLeft = hasFlag('left');
    var hasRight = hasFlag('right');
    var hasBottom = hasFlag('bottom');

    // slice path generation fn
    var pathDescendant = function(d) {
        var _x0 = viewMapX(d.x0);
        var _x1 = viewMapX(d.x1);
        var _y0 = viewMapY(d.y0);
        var _y1 = viewMapY(d.y1);

        var dx = _x1 - _x0;
        var dy = _y1 - _y0;
        if(!dx || !dy) return '';

        var cornerradius = trace.marker.cornerradius || 0;
        var r = Math.min(cornerradius, dx / 2, dy / 2);
        if(
            r &&
            d.data &&
            d.data.data &&
            d.data.data.label
        ) {
            if(hasTop) r = Math.min(r, pad.t);
            if(hasLeft) r = Math.min(r, pad.l);
            if(hasRight) r = Math.min(r, pad.r);
            if(hasBottom) r = Math.min(r, pad.b);
        }

        var arc = function(rx, ry) { return r ? 'a' + pos(r, r) + ' 0 0 1 ' + pos(rx, ry) : ''; };

        return (
           'M' + pos(_x0, _y0 + r) +
           arc(r, -r) +
           'L' + pos(_x1 - r, _y0) +
           arc(r, r) +
           'L' + pos(_x1, _y1 - r) +
           arc(-r, r) +
           'L' + pos(_x0 + r, _y1) +
           arc(-r, -r) + 'Z'
        );
    };

    var toMoveInsideSlice = function(pt, opts) {
        var x0 = pt.x0;
        var x1 = pt.x1;
        var y0 = pt.y0;
        var y1 = pt.y1;
        var textBB = pt.textBB;

        var _hasTop = hasTop || (opts.isHeader && !hasBottom);

        var anchor =
            _hasTop ? 'start' :
            hasBottom ? 'end' : 'middle';

        var _hasRight = hasFlag('right');
        var _hasLeft = hasFlag('left') || opts.onPathbar;

        var leftToRight =
            _hasLeft ? -1 :
            _hasRight ? 1 : 0;

        if(opts.isHeader) {
            x0 += (isIcicle ? pad : pad.l) - TEXTPAD;
            x1 -= (isIcicle ? pad : pad.r) - TEXTPAD;
            if(x0 >= x1) {
                var mid = (x0 + x1) / 2;
                x0 = mid;
                x1 = mid;
            }

            // limit the drawing area for headers
            var limY;
            if(hasBottom) {
                limY = y1 - (isIcicle ? pad : pad.b);
                if(y0 < limY && limY < y1) y0 = limY;
            } else {
                limY = y0 + (isIcicle ? pad : pad.t);
                if(y0 < limY && limY < y1) y1 = limY;
            }
        }

        // position the text relative to the slice
        var transform = toMoveInsideBar(x0, x1, y0, y1, textBB, {
            isHorizontal: false,
            constrained: true,
            angle: 0,
            anchor: anchor,
            leftToRight: leftToRight
        });
        transform.fontSize = opts.fontSize;

        transform.targetX = viewMapX(transform.targetX);
        transform.targetY = viewMapY(transform.targetY);

        if(isNaN(transform.targetX) || isNaN(transform.targetY)) {
            return {};
        }

        if(x0 !== x1 && y0 !== y1) {
            recordMinTextSize(trace.type, transform, fullLayout);
        }

        return {
            scale: transform.scale,
            rotate: transform.rotate,
            textX: transform.textX,
            textY: transform.textY,
            anchorX: transform.anchorX,
            anchorY: transform.anchorY,
            targetX: transform.targetX,
            targetY: transform.targetY
        };
    };

    var interpFromParent = function(pt, onPathbar) {
        var parentPrev;
        var i = 0;
        var Q = pt;
        while(!parentPrev && i < maxDepth) { // loop to find a parent/grandParent on the previous graph
            i++;
            Q = Q.parent;
            if(Q) {
                parentPrev = getPrev(Q, onPathbar);
            } else i = maxDepth;
        }
        return parentPrev || {};
    };

    var makeExitSliceInterpolator = function(pt, onPathbar, refRect, size) {
        var prev = getPrev(pt, onPathbar);
        var next;

        if(onPathbar) {
            next = pathbarOrigin;
        } else {
            var entryPrev = getPrev(entry, onPathbar);
            if(entryPrev) {
                // 'entryPrev' is here has the previous coordinates of the entry
                // node, which corresponds to the last "clicked" node when zooming in
                next = findClosestEdge(pt, entryPrev, size);
            } else {
                // this happens when maxdepth is set, when leaves must
                // be removed and the entry is new (i.e. does not have a 'prev' object)
                next = {};
            }
        }

        return interpolate(prev, next);
    };

    var makeUpdateSliceInterpolator = function(pt, onPathbar, refRect, size, opts) {
        var prev0 = getPrev(pt, onPathbar);
        var prev;

        if(prev0) {
            // if pt already on graph, this is easy
            prev = prev0;
        } else {
            // for new pts:
            if(onPathbar) {
                prev = pathbarOrigin;
            } else {
                if(prevEntry) {
                    // if trace was visible before
                    if(pt.parent) {
                        var ref = nextOfPrevEntry || refRect;

                        if(ref && !onPathbar) {
                            prev = findClosestEdge(pt, ref, size);
                        } else {
                            // if new leaf (when maxdepth is set),
                            // grow it from its parent node
                            prev = {};
                            Lib.extendFlat(prev, interpFromParent(pt, onPathbar));
                        }
                    } else {
                        prev = Lib.extendFlat({}, pt);
                        if(isIcicle) {
                            if(opts.orientation === 'h') {
                                if(opts.flipX) prev.x0 = pt.x1;
                                else prev.x1 = 0;
                            } else {
                                if(opts.flipY) prev.y0 = pt.y1;
                                else prev.y1 = 0;
                            }
                        }
                    }
                } else {
                    prev = {};
                }
            }
        }

        return interpolate(prev, {
            x0: pt.x0,
            x1: pt.x1,
            y0: pt.y0,
            y1: pt.y1
        });
    };

    var makeUpdateTextInterpolator = function(pt, onPathbar, refRect, size) {
        var prev0 = getPrev(pt, onPathbar);
        var prev = {};
        var origin = getOrigin(pt, onPathbar, refRect, size);

        Lib.extendFlat(prev, {
            transform: toMoveInsideSlice({
                x0: origin.x0,
                x1: origin.x1,
                y0: origin.y0,
                y1: origin.y1,
                textBB: pt.textBB,
                _text: pt._text
            }, {
                isHeader: helpers.isHeader(pt, trace)
            })
        });

        if(prev0) {
            // if pt already on graph, this is easy
            prev = prev0;
        } else {
            // for new pts:
            if(pt.parent) {
                Lib.extendFlat(prev, interpFromParent(pt, onPathbar));
            }
        }

        var transform = pt.transform;
        if(pt.x0 !== pt.x1 && pt.y0 !== pt.y1) {
            recordMinTextSize(trace.type, transform, fullLayout);
        }

        return interpolate(prev, {
            transform: {
                scale: transform.scale,
                rotate: transform.rotate,
                textX: transform.textX,
                textY: transform.textY,
                anchorX: transform.anchorX,
                anchorY: transform.anchorY,
                targetX: transform.targetX,
                targetY: transform.targetY
            }
        });
    };

    var handleSlicesExit = function(slices, onPathbar, refRect, size, pathSlice) {
        var width = size[0];
        var height = size[1];

        if(hasTransition) {
            slices.exit().transition()
                .each(function() {
                    var sliceTop = d3.select(this);

                    var slicePath = sliceTop.select('path.surface');
                    slicePath.transition().attrTween('d', function(pt2) {
                        var interp = makeExitSliceInterpolator(pt2, onPathbar, refRect, [width, height]);
                        return function(t) { return pathSlice(interp(t)); };
                    });

                    var sliceTextGroup = sliceTop.select('g.slicetext');
                    sliceTextGroup.attr('opacity', 0);
                })
                .remove();
        } else {
            slices.exit().remove();
        }
    };

    var strTransform = function(d) {
        var transform = d.transform;

        if(d.x0 !== d.x1 && d.y0 !== d.y1) {
            recordMinTextSize(trace.type, transform, fullLayout);
        }

        return Lib.getTextTransform({
            textX: transform.textX,
            textY: transform.textY,
            anchorX: transform.anchorX,
            anchorY: transform.anchorY,
            targetX: transform.targetX,
            targetY: transform.targetY,
            scale: transform.scale,
            rotate: transform.rotate
        });
    };

    if(hasTransition) {
        // Important: do this before binding new sliceData!

        selAncestors.each(function(pt) {
            prevLookupPathbar[getKey(pt)] = {
                x0: pt.x0,
                x1: pt.x1,
                y0: pt.y0,
                y1: pt.y1
            };

            if(pt.transform) {
                prevLookupPathbar[getKey(pt)].transform = {
                    textX: pt.transform.textX,
                    textY: pt.transform.textY,
                    anchorX: pt.transform.anchorX,
                    anchorY: pt.transform.anchorY,
                    targetX: pt.transform.targetX,
                    targetY: pt.transform.targetY,
                    scale: pt.transform.scale,
                    rotate: pt.transform.rotate
                };
            }
        });

        selDescendants.each(function(pt) {
            prevLookupSlices[getKey(pt)] = {
                x0: pt.x0,
                x1: pt.x1,
                y0: pt.y0,
                y1: pt.y1
            };

            if(pt.transform) {
                prevLookupSlices[getKey(pt)].transform = {
                    textX: pt.transform.textX,
                    textY: pt.transform.textY,
                    anchorX: pt.transform.anchorX,
                    anchorY: pt.transform.anchorY,
                    targetX: pt.transform.targetX,
                    targetY: pt.transform.targetY,
                    scale: pt.transform.scale,
                    rotate: pt.transform.rotate
                };
            }

            if(!prevEntry && helpers.isEntry(pt)) {
                prevEntry = pt;
            }
        });
    }

    nextOfPrevEntry = drawDescendants(gd, cd, entry, selDescendants, {
        width: vpw,
        height: vph,

        viewX: viewMapX,
        viewY: viewMapY,

        pathSlice: pathDescendant,
        toMoveInsideSlice: toMoveInsideSlice,

        prevEntry: prevEntry,
        makeUpdateSliceInterpolator: makeUpdateSliceInterpolator,
        makeUpdateTextInterpolator: makeUpdateTextInterpolator,

        handleSlicesExit: handleSlicesExit,
        hasTransition: hasTransition,
        strTransform: strTransform
    });

    if(trace.pathbar.visible) {
        drawAncestors(gd, cd, entry, selAncestors, {
            barDifY: barDifY,
            width: barW,
            height: barH,

            viewX: viewBarX,
            viewY: viewBarY,

            pathSlice: pathAncestor,
            toMoveInsideSlice: toMoveInsideSlice,

            makeUpdateSliceInterpolator: makeUpdateSliceInterpolator,
            makeUpdateTextInterpolator: makeUpdateTextInterpolator,

            handleSlicesExit: handleSlicesExit,
            hasTransition: hasTransition,
            strTransform: strTransform
        });
    } else {
        selAncestors.remove();
    }
};
