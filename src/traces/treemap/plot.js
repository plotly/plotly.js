/**
* Copyright 2012-2019, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var d3 = require('d3');

var hasTransition = require('../sunburst/helpers').hasTransition;
var helpers = require('../sunburst/helpers');

var Lib = require('../../lib');
var TEXTPAD = require('../bar/constants').TEXTPAD;
var toMoveInsideBar = require('../bar/plot').toMoveInsideBar;

var drawDescendants = require('./draw_descendants');
var drawAncestors = require('./draw_ancestors');

module.exports = function(gd, cdmodule, transitionOpts, makeOnCompleteCallback) {
    var fullLayout = gd._fullLayout;
    var layer = fullLayout._treemaplayer;
    var join, onComplete;

    // If transition config is provided, then it is only a partial replot and traces not
    // updated are removed.
    var isFullReplot = !transitionOpts;

    join = layer.selectAll('g.trace.treemap')
        .data(cdmodule, function(cd) { return cd[0].trace.uid; });

    join.enter().append('g')
        .classed('trace', true)
        .classed('treemap', true);

    join.order();

    if(hasTransition(transitionOpts)) {
        if(makeOnCompleteCallback) {
            // If it was passed a callback to register completion, make a callback. If
            // this is created, then it must be executed on completion, otherwise the
            // pos-transition redraw will not execute:
            onComplete = makeOnCompleteCallback();
        }

        var transition = d3.transition()
            .duration(transitionOpts.duration)
            .ease(transitionOpts.easing)
            .each('end', function() { onComplete && onComplete(); })
            .each('interrupt', function() { onComplete && onComplete(); });

        transition.each(function() {
            // Must run the selection again since otherwise enters/updates get grouped together
            // and these get executed out of order. Except we need them in order!
            layer.selectAll('g.trace').each(function(cd) {
                plotOne(gd, cd, this, transitionOpts);
            });
        });
    } else {
        join.each(function(cd) {
            plotOne(gd, cd, this, transitionOpts);
        });
    }

    if(isFullReplot) {
        join.exit().remove();
    }
};

function plotOne(gd, cd, element, transitionOpts) {
    var fullLayout = gd._fullLayout;
    var cd0 = cd[0];
    var trace = cd0.trace;
    var hierarchy = cd0.hierarchy;
    var hasTransition = helpers.hasTransition(transitionOpts);

    // stash of 'previous' position data used by tweening functions
    var prevLookup = {};
    var prevLookdown = {};
    var getPrev = function(pt, upDown) {
        return (upDown) ?
            prevLookup[helpers.getPtId(pt)] :
            prevLookdown[helpers.getPtId(pt)];
    };

    var getOrigin = function(pt, upDown, refRect, size) {
        var clicked = trace._clickedInfo;
        if(!clicked) {
            return pt;
        }

        var width = size[0];
        var height = size[1];
        var x0, x1, y0, y1;

        if(upDown) {
            x0 = width; // always slide pathbar to the right, unless it is the root node
            x1 = width;
            y0 = 0;
            y1 = height;
        } else {
            var ref = clicked.zoomOut ? refRect : prevLookdown[clicked.id] || prevLookup[clicked.id];

            var e = trace.tiling.pad;
            var isLeftOfRect = function(x) { return x - e <= ref.x0; };
            var isRightOfRect = function(x) { return x + e >= ref.x1; };
            var isBottomOfRect = function(y) { return y - e <= ref.y0; };
            var isTopOfRect = function(y) { return y + e >= ref.y1; };

            x0 = isLeftOfRect(pt.x0 - e) ? 0 : isRightOfRect(pt.x0 - e) ? width : pt.x0;
            x1 = isLeftOfRect(pt.x1 + e) ? 0 : isRightOfRect(pt.x1 + e) ? width : pt.x1;
            y0 = isBottomOfRect(pt.y0 - e) ? 0 : isTopOfRect(pt.y0 - e) ? height : pt.y0;
            y1 = isBottomOfRect(pt.y1 + e) ? 0 : isTopOfRect(pt.y1 + e) ? height : pt.y1;
        }

        return {
            x0: x0,
            x1: x1,
            y0: y0,
            y1: y1
        };
    };

    var gs = fullLayout._size;
    var domain = trace.domain;
    var vpw = gs.w * (domain.x[1] - domain.x[0]);
    var vph = gs.h * (domain.y[1] - domain.y[0]);

    var entry = helpers.findEntryWithLevel(hierarchy, trace.level);
    var maxDepth = helpers.getMaxDepth(trace);
    // N.B. handle multiple-root special case
    var mvX = 0;
    var mvY = 0;
    if(cd0.hasMultipleRoots && helpers.isHierarchyRoot(entry)) {
        maxDepth++;
    }
    trace._maxDepth = maxDepth;

    var barW = vpw;
    var barH = trace.pathbar.thickness;
    var barPad = trace.marker.line.width + 1; // TODO: may expose this constant in future

    var barTop;
    var barBottom;
    if(trace.pathbar.visible) {
        barTop = trace.pathbar.side.indexOf('top') !== -1;
        barBottom = trace.pathbar.side.indexOf('bottom') !== -1;

        if(barTop) {
            mvY += (barH + barPad) / 2;
            vph -= (barH + barPad);
        } else if(barBottom) {
            mvY -= (barH + barPad) / 2;
            vph -= (barH + barPad);
        }
    }

    var domainMidX = (domain.x[1] + domain.x[0]) / 2;
    var domainMidY = (domain.y[1] + domain.y[0]) / 2;

    var cx = cd0.cx = mvX + gs.l + gs.w * domainMidX;
    var cy = cd0.cy = mvY + gs.t + gs.h * (1 - domainMidY);

    var cenX = cx - vpw / 2;
    var cenY = cy - vph / 2;

    var viewMapX = function(x) { return cenX + x; };
    var viewMapY = function(y) { return cenY + y; };

    var barDifY = barTop ? -(barH + barPad) : vph + barPad;
    var barY0 = viewMapY(0) + barDifY;
    var barX0 = viewMapX(0);

    var viewDirX = function(x) { return barX0 + x; };
    var viewDirY = function(y) { return barY0 + y; };

    function pos(x, y) {
        return x + ',' + y;
    }

    var xStart = viewDirX(0);
    var limitX0 = function(p) {
        p.x = Math.max(xStart, p.x);
    };

    var divider = trace.pathbar.divider;
    var hasExtraPoint = (divider !== '|');

    // pathbar(directory) path generation fn
    var pathAncestor = function(d) {
        var _x0 = viewDirX(Math.max(Math.min(d.x0, d.x0), 0));
        var _x1 = viewDirX(Math.min(Math.max(d.x1, d.x1), barW));
        var _y0 = viewDirY(d.y0);
        var _y1 = viewDirY(d.y1);

        var halfH = barH / 2;

        var pM = {};
        var midLeft;
        if(hasExtraPoint) {
            midLeft = true;
            pM.x = _x0;

            pM.y = (
                divider === '>' ||
                divider === '<'
            ) ? _y0 + halfH : _y0;
        }

        var pA = {x: _x0, y: _y0};
        var pB = {x: _x1, y: _y0};
        var pC = {x: _x1, y: _y1};
        var pD = {x: _x0, y: _y1};

        if(divider === '>') {
            pA.x -= halfH;
            pD.x -= halfH;
        } else if(divider === '/') {
            pD.x -= halfH;
        } else if(divider === '\\') {
            pM.x -= halfH;
        } else if(divider === '<') {
            pM.x -= halfH;
        }

        limitX0(pA);
        limitX0(pD);
        limitX0(pM);

        return (
           'M' + pos(pA.x, pA.y) +
           'L' + pos(pB.x, pB.y) +
           'L' + pos(pC.x, pC.y) +
           'L' + pos(pD.x, pD.y) +
           (midLeft ? 'L' + pos(pM.x, pM.y) : '') +
           'Z'
        );
    };

    // slice path generation fn
    var pathDescendant = function(d) {
        var _x0 = viewMapX(d.x0);
        var _x1 = viewMapX(d.x1);
        var _y0 = viewMapY(d.y0);
        var _y1 = viewMapY(d.y1);

        return (
           'M' + pos(_x0, _y0) +
           'L' + pos(_x1, _y0) +
           'L' + pos(_x1, _y1) +
           'L' + pos(_x0, _y1) + 'Z'
        );
    };

    var toMoveInsideSlice = function(x0, x1, y0, y1, textBB, opts) {
        var hasFlag = function(f) { return trace.textposition.indexOf(f) !== -1; };

        var hasBottom = hasFlag('bottom');
        var hasTop = hasFlag('top') || (opts.isHeader && !hasBottom);

        var anchor =
            hasTop ? 'start' :
            hasBottom ? 'end' : 'middle';

        var hasRight = hasFlag('right');
        var hasLeft = hasFlag('left') || opts.isMenu;

        var offsetDir =
            hasLeft ? 'left' :
            hasRight ? 'right' : 'center';

        if(opts.isMenu || !opts.isHeader) {
            x0 += hasLeft ? TEXTPAD : 0;
            x1 -= hasRight ? TEXTPAD : 0;
        }

        if(opts.isHeader) {
            x0 += trace.marker.pad.l - TEXTPAD;
            x1 -= trace.marker.pad.r - TEXTPAD;

            // limit the drawing area for headers
            var limY;
            if(hasBottom) {
                limY = y1 - trace.marker.pad.b;
                if(y0 < limY && limY < y1) y0 = limY;
            } else {
                limY = y0 + trace.marker.pad.t;
                if(y0 < limY && limY < y1) y1 = limY;
            }
        }

        // position the text relative to the slice
        var transform = toMoveInsideBar(x0, x1, y0, y1, textBB, {
            isHorizontal: false,
            constrained: true,
            angle: 0,
            anchor: anchor
        });

        if(offsetDir !== 'center') {
            var deltaX = (x1 - x0) / 2 - transform.scale * (textBB.right - textBB.left) / 2;
            if(opts.isHeader) deltaX -= TEXTPAD;

            if(offsetDir === 'left') transform.targetX -= deltaX;
            else if(offsetDir === 'right') transform.targetX += deltaX;
        }

        transform.targetX = viewMapX(transform.targetX);
        transform.targetY = viewMapY(transform.targetY);

        return {
            scale: transform.scale,
            rotate: transform.rotate,
            textX: transform.textX,
            textY: transform.textY,
            targetX: transform.targetX,
            targetY: transform.targetY
        };
    };

    var interpFromParent = function(pt, upDown) {
        var parentPrev;
        var i = 0;
        var Q = pt;
        while(!parentPrev && i < maxDepth) { // loop to find a parent/grandParent on the previous graph
            i++;
            Q = Q.parent;
            if(Q) {
                parentPrev = getPrev(Q, upDown);
            } else i = maxDepth;
        }
        var result = parentPrev || {};

        if(upDown && !isNaN(result.x1)) {
            // always slide pathbar from the right
            var difX = result.x1 - result.x0;
            if(result.transform) {
                result.transform.scale = 0;
                result.transform.targetX += difX;
            }
            result.x0 += difX;
        }
        return result;
    };

    var makeExitSliceInterpolator = function(pt, upDown, refRect, size) {
        var prev = getPrev(pt, upDown);

        return d3.interpolate(prev, getOrigin(pt, upDown, refRect, size));
    };

    var makeUpdateSliceIntepolator = function(pt, upDown, refRect, size) {
        var prev0 = getPrev(pt, upDown);
        var prev = {};
        var origin = getOrigin(pt, upDown, refRect, size);

        Lib.extendFlat(prev, origin);

        if(prev0) {
            // if pt already on graph, this is easy
            prev = prev0;
        } else {
            // for new pts:
            if(pt.parent) {
                Lib.extendFlat(prev, interpFromParent(pt, upDown));
            }
        }

        return d3.interpolate(prev, {
            x0: pt.x0,
            x1: pt.x1,
            y0: pt.y0,
            y1: pt.y1
        });
    };

    var makeUpdateTextInterpolar = function(pt, upDown, refRect, size) {
        var prev0 = getPrev(pt, upDown);
        var prev = {};
        var origin = getOrigin(pt, upDown, refRect, size);

        Lib.extendFlat(prev, {
            transform: toMoveInsideSlice(
                origin.x0,
                origin.x1,
                origin.y0,
                origin.y1,
                pt.textBB,
                {
                    isHeader: helpers.isHeader(pt, trace)
                }
            )
        });

        if(prev0) {
            // if pt already on graph, this is easy
            prev = prev0;
        } else {
            // for new pts:
            if(pt.parent) {
                Lib.extendFlat(prev, interpFromParent(pt, upDown));
            }
        }

        return d3.interpolate(prev, {
            transform: {
                scale: pt.transform.scale,
                rotate: pt.transform.rotate,
                textX: pt.transform.textX,
                textY: pt.transform.textY,
                targetX: pt.transform.targetX,
                targetY: pt.transform.targetY
            }
        });
    };

    var handleSlicesExit = function(slices, upDown, refRect, size, pathSlice) {
        var width = size[0];
        var height = size[1];

        if(hasTransition) {
            slices.exit().transition()
                .each(function() {
                    var sliceTop = d3.select(this);

                    var slicePath = sliceTop.select('path.surface');
                    slicePath.transition().attrTween('d', function(pt2) {
                        var interp = makeExitSliceInterpolator(pt2, upDown, refRect, [width, height]);
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

    var gTrace = d3.select(element);
    var selAncestors = gTrace.selectAll('g.pathbar');
    var selDescendants = gTrace.selectAll('g.slice');

    if(!entry) {
        return selDescendants.remove();
    }

    if(hasTransition) {
        // Important: do this before binding new sliceData!

        selAncestors.each(function(pt) {
            prevLookup[helpers.getPtId(pt)] = {
                x0: pt.x0,
                x1: pt.x1,
                y0: pt.y0,
                y1: pt.y1,
                transform: pt.transform
            };
        });

        selDescendants.each(function(pt) {
            prevLookdown[helpers.getPtId(pt)] = {
                x0: pt.x0,
                x1: pt.x1,
                y0: pt.y0,
                y1: pt.y1,
                transform: pt.transform
            };
        });
    }

    drawDescendants(gd, cd, entry, selDescendants, {
        width: vpw,
        height: vph,

        viewX: viewMapX,
        viewY: viewMapY,

        refRect: {
            x0: vpw / 2,
            x1: vpw / 2,
            y0: vph / 2,
            y1: vph / 2
        },

        pathSlice: pathDescendant,
        toMoveInsideSlice: toMoveInsideSlice,

        makeUpdateSliceIntepolator: makeUpdateSliceIntepolator,
        makeUpdateTextInterpolar: makeUpdateTextInterpolar,

        handleSlicesExit: handleSlicesExit,
        hasTransition: hasTransition
    });

    if(trace.pathbar.visible && trace.pathbar.position !== 'inside') {
        drawAncestors(gd, cd, entry, selAncestors, {
            barDifY: barDifY,
            width: barW,
            height: barH,

            viewX: viewDirX,
            viewY: viewDirY,

            refRect: {
                x0: barW / 2,
                x1: barW / 2,
                y0: barH / 2,
                y1: barH / 2
            },

            pathSlice: pathAncestor,
            toMoveInsideSlice: toMoveInsideSlice,

            makeUpdateSliceIntepolator: makeUpdateSliceIntepolator,
            makeUpdateTextInterpolar: makeUpdateTextInterpolar,

            handleSlicesExit: handleSlicesExit,
            hasTransition: hasTransition
        });
    }
}
