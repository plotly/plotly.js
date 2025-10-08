'use strict';

var d3 = require('@plotly/d3');
var d3Hierarchy = require('d3-hierarchy');
var interpolate = require('d3-interpolate').interpolate;

var Drawing = require('../../components/drawing');
var Lib = require('../../lib');
var svgTextUtils = require('../../lib/svg_text_utils');
var uniformText = require('../bar/uniform_text');
var recordMinTextSize = uniformText.recordMinTextSize;
var clearMinTextSize = uniformText.clearMinTextSize;
var piePlot = require('../pie/plot');
var getRotationAngle = require('../pie/helpers').getRotationAngle;
var computeTransform = piePlot.computeTransform;
var transformInsideText = piePlot.transformInsideText;
var styleOne = require('./style').styleOne;
var resizeText = require('../bar/style').resizeText;
var attachFxHandlers = require('./fx');
var constants = require('./constants');
var helpers = require('./helpers');

exports.plot = function (gd, cdmodule, transitionOpts, makeOnCompleteCallback) {
    var fullLayout = gd._fullLayout;
    var layer = fullLayout._sunburstlayer;
    var join, onComplete;

    // If transition config is provided, then it is only a partial replot and traces not
    // updated are removed.
    var isFullReplot = !transitionOpts;
    var hasTransition = !fullLayout.uniformtext.mode && helpers.hasTransition(transitionOpts);

    clearMinTextSize('sunburst', fullLayout);

    join = layer.selectAll('g.trace.sunburst').data(cdmodule, function (cd) {
        return cd[0].trace.uid;
    });

    // using same 'stroke-linejoin' as pie traces
    join.enter().append('g').classed('trace', true).classed('sunburst', true).attr('stroke-linejoin', 'round');

    join.order();

    if (hasTransition) {
        if (makeOnCompleteCallback) {
            // If it was passed a callback to register completion, make a callback. If
            // this is created, then it must be executed on completion, otherwise the
            // pos-transition redraw will not execute:
            onComplete = makeOnCompleteCallback();
        }

        var transition = d3
            .transition()
            .duration(transitionOpts.duration)
            .ease(transitionOpts.easing)
            .each('end', function () {
                onComplete && onComplete();
            })
            .each('interrupt', function () {
                onComplete && onComplete();
            });

        transition.each(function () {
            // Must run the selection again since otherwise enters/updates get grouped together
            // and these get executed out of order. Except we need them in order!
            layer.selectAll('g.trace').each(function (cd) {
                plotOne(gd, cd, this, transitionOpts);
            });
        });
    } else {
        join.each(function (cd) {
            plotOne(gd, cd, this, transitionOpts);
        });

        if (fullLayout.uniformtext.mode) {
            resizeText(gd, fullLayout._sunburstlayer.selectAll('.trace'), 'sunburst');
        }
    }

    if (isFullReplot) {
        join.exit().remove();
    }
};

function plotOne(gd, cd, element, transitionOpts) {
    var isStatic = gd._context.staticPlot;

    var fullLayout = gd._fullLayout;
    var hasTransition = !fullLayout.uniformtext.mode && helpers.hasTransition(transitionOpts);

    var gTrace = d3.select(element);
    var slices = gTrace.selectAll('g.slice');

    var cd0 = cd[0];
    var trace = cd0.trace;
    var hierarchy = cd0.hierarchy;
    var entry = helpers.findEntryWithLevel(hierarchy, trace.level);
    var maxDepth = helpers.getMaxDepth(trace);

    var gs = fullLayout._size;
    var domain = trace.domain;
    var vpw = gs.w * (domain.x[1] - domain.x[0]);
    var vph = gs.h * (domain.y[1] - domain.y[0]);
    var rMax = 0.5 * Math.min(vpw, vph);
    var cx = (cd0.cx = gs.l + (gs.w * (domain.x[1] + domain.x[0])) / 2);
    var cy = (cd0.cy = gs.t + gs.h * (1 - domain.y[0]) - vph / 2);

    if (!entry) {
        return slices.remove();
    }

    // previous root 'pt' (can be empty)
    var prevEntry = null;
    // stash of 'previous' position data used by tweening functions
    var prevLookup = {};

    if (hasTransition) {
        // Important: do this before binding new sliceData!
        slices.each(function (pt) {
            prevLookup[helpers.getPtId(pt)] = {
                rpx0: pt.rpx0,
                rpx1: pt.rpx1,
                x0: pt.x0,
                x1: pt.x1,
                transform: pt.transform
            };

            if (!prevEntry && helpers.isEntry(pt)) {
                prevEntry = pt;
            }
        });
    }

    // N.B. slice data isn't the calcdata,
    // grab corresponding calcdata item in sliceData[i].data.data
    var sliceData = partition(entry).descendants();

    var maxHeight = entry.height + 1;
    var yOffset = 0;
    var cutoff = maxDepth;
    // N.B. handle multiple-root special case
    if (cd0.hasMultipleRoots && helpers.isHierarchyRoot(entry)) {
        sliceData = sliceData.slice(1);
        maxHeight -= 1;
        yOffset = 1;
        cutoff += 1;
    }

    // filter out slices that won't show up on graph
    sliceData = sliceData.filter(function (pt) {
        return pt.y1 <= cutoff;
    });

    var baseX = getRotationAngle(trace.rotation);
    if (baseX) {
        sliceData.forEach(function (pt) {
            pt.x0 += baseX;
            pt.x1 += baseX;
        });
    }

    // partition span ('y') to sector radial px value
    var maxY = Math.min(maxHeight, maxDepth);
    var y2rpx = function (y) {
        return ((y - yOffset) / maxY) * rMax;
    };
    // (radial px value, partition angle ('x'))  to px [x,y]
    var rx2px = function (r, x) {
        return [r * Math.cos(x), -r * Math.sin(x)];
    };
    // slice path generation fn
    var pathSlice = function (d) {
        return Lib.pathAnnulus(d.rpx0, d.rpx1, d.x0, d.x1, cx, cy);
    };
    // slice text translate x/y

    var getTargetX = function (d) {
        return cx + getTextXY(d)[0] * (d.transform.rCenter || 0) + (d.transform.x || 0);
    };
    var getTargetY = function (d) {
        return cy + getTextXY(d)[1] * (d.transform.rCenter || 0) + (d.transform.y || 0);
    };

    slices = slices.data(sliceData, helpers.getPtId);

    slices.enter().append('g').classed('slice', true);

    if (hasTransition) {
        slices
            .exit()
            .transition()
            .each(function () {
                var sliceTop = d3.select(this);

                var slicePath = sliceTop.select('path.surface');
                slicePath.transition().attrTween('d', function (pt2) {
                    var interp = makeExitSliceInterpolator(pt2);
                    return function (t) {
                        return pathSlice(interp(t));
                    };
                });

                var sliceTextGroup = sliceTop.select('g.slicetext');
                sliceTextGroup.attr('opacity', 0);
            })
            .remove();
    } else {
        slices.exit().remove();
    }

    slices.order();

    // next x1 (i.e. sector end angle) of previous entry
    var nextX1ofPrevEntry = null;
    if (hasTransition && prevEntry) {
        var prevEntryId = helpers.getPtId(prevEntry);
        slices.each(function (pt) {
            if (nextX1ofPrevEntry === null && helpers.getPtId(pt) === prevEntryId) {
                nextX1ofPrevEntry = pt.x1;
            }
        });
    }

    var updateSlices = slices;
    if (hasTransition) {
        updateSlices = updateSlices.transition().each('end', function () {
            // N.B. gd._transitioning is (still) *true* by the time
            // transition updates get here
            var sliceTop = d3.select(this);
            helpers.setSliceCursor(sliceTop, gd, {
                hideOnRoot: true,
                hideOnLeaves: true,
                isTransitioning: false
            });
        });
    }

    updateSlices.each(function (pt) {
        var sliceTop = d3.select(this);

        var slicePath = Lib.ensureSingle(sliceTop, 'path', 'surface', function (s) {
            s.style('pointer-events', isStatic ? 'none' : 'all');
        });

        pt.rpx0 = y2rpx(pt.y0);
        pt.rpx1 = y2rpx(pt.y1);
        pt.xmid = (pt.x0 + pt.x1) / 2;
        pt.pxmid = rx2px(pt.rpx1, pt.xmid);
        pt.midangle = -(pt.xmid - Math.PI / 2);
        pt.startangle = -(pt.x0 - Math.PI / 2);
        pt.stopangle = -(pt.x1 - Math.PI / 2);
        pt.halfangle = 0.5 * Math.min(Lib.angleDelta(pt.x0, pt.x1) || Math.PI, Math.PI);
        pt.ring = 1 - pt.rpx0 / pt.rpx1;
        pt.rInscribed = getInscribedRadiusFraction(pt, trace);

        if (hasTransition) {
            slicePath.transition().attrTween('d', function (pt2) {
                var interp = makeUpdateSliceInterpolator(pt2);
                return function (t) {
                    return pathSlice(interp(t));
                };
            });
        } else {
            slicePath.attr('d', pathSlice);
        }

        sliceTop
            .call(attachFxHandlers, entry, gd, cd, {
                eventDataKeys: constants.eventDataKeys,
                transitionTime: constants.CLICK_TRANSITION_TIME,
                transitionEasing: constants.CLICK_TRANSITION_EASING
            })
            .call(helpers.setSliceCursor, gd, {
                hideOnRoot: true,
                hideOnLeaves: true,
                isTransitioning: gd._transitioning
            });

        slicePath.call(styleOne, pt, trace, gd);

        var sliceTextGroup = Lib.ensureSingle(sliceTop, 'g', 'slicetext');
        var sliceText = Lib.ensureSingle(sliceTextGroup, 'text', '', function (s) {
            // prohibit tex interpretation until we can handle
            // tex and regular text together
            s.attr('data-notex', 1);
        });

        var font = Lib.ensureUniformFontSize(gd, helpers.determineTextFont(trace, pt, fullLayout.font));

        sliceText
            .text(exports.formatSliceLabel(pt, entry, trace, cd, fullLayout))
            .classed('slicetext', true)
            .attr('text-anchor', 'middle')
            .call(Drawing.font, font)
            .call(svgTextUtils.convertToTspans, gd);

        // position the text relative to the slice
        var textBB = Drawing.bBox(sliceText.node());
        pt.transform = transformInsideText(textBB, pt, cd0);
        pt.transform.targetX = getTargetX(pt);
        pt.transform.targetY = getTargetY(pt);

        var strTransform = function (d, textBB) {
            var transform = d.transform;
            computeTransform(transform, textBB);

            transform.fontSize = font.size;
            recordMinTextSize(trace.type, transform, fullLayout);

            return Lib.getTextTransform(transform);
        };

        if (hasTransition) {
            sliceText.transition().attrTween('transform', function (pt2) {
                var interp = makeUpdateTextInterpolator(pt2);
                return function (t) {
                    return strTransform(interp(t), textBB);
                };
            });
        } else {
            sliceText.attr('transform', strTransform(pt, textBB));
        }
    });

    function makeExitSliceInterpolator(pt) {
        var id = helpers.getPtId(pt);
        var prev = prevLookup[id];
        var entryPrev = prevLookup[helpers.getPtId(entry)];
        var next;

        if (entryPrev) {
            var a = (pt.x1 > entryPrev.x1 ? 2 * Math.PI : 0) + baseX;
            // if pt to remove:
            // - if 'below' where the root-node used to be: shrink it radially inward
            // - otherwise, collapse it clockwise or counterclockwise which ever is shortest to theta=0
            next =
                pt.rpx1 < entryPrev.rpx1
                    ? { x0: pt.x0, x1: pt.x1, rpx0: 0, rpx1: 0 }
                    : { x0: a, x1: a, rpx0: pt.rpx0, rpx1: pt.rpx1 };
        } else {
            // this happens when maxdepth is set, when leaves must
            // be removed and the rootPt is new (i.e. does not have a 'prev' object)
            var parent;
            var parentId = helpers.getPtId(pt.parent);
            slices.each(function (pt2) {
                if (helpers.getPtId(pt2) === parentId) {
                    return (parent = pt2);
                }
            });
            var parentChildren = parent.children;
            var ci;
            parentChildren.forEach(function (pt2, i) {
                if (helpers.getPtId(pt2) === id) {
                    return (ci = i);
                }
            });
            var n = parentChildren.length;
            var interp = interpolate(parent.x0, parent.x1);
            next = {
                rpx0: rMax,
                rpx1: rMax,
                x0: interp(ci / n),
                x1: interp((ci + 1) / n)
            };
        }

        return interpolate(prev, next);
    }

    function makeUpdateSliceInterpolator(pt) {
        var prev0 = prevLookup[helpers.getPtId(pt)];
        var prev;
        var next = { x0: pt.x0, x1: pt.x1, rpx0: pt.rpx0, rpx1: pt.rpx1 };

        if (prev0) {
            // if pt already on graph, this is easy
            prev = prev0;
        } else {
            // for new pts:
            if (prevEntry) {
                // if trace was visible before
                if (pt.parent) {
                    if (nextX1ofPrevEntry) {
                        // if new branch, twist it in clockwise or
                        // counterclockwise which ever is shorter to
                        // its final angle
                        var a = (pt.x1 > nextX1ofPrevEntry ? 2 * Math.PI : 0) + baseX;
                        prev = { x0: a, x1: a };
                    } else {
                        // if new leaf (when maxdepth is set),
                        // grow it radially and angularly from
                        // its parent node
                        prev = { rpx0: rMax, rpx1: rMax };
                        Lib.extendFlat(prev, interpX0X1FromParent(pt));
                    }
                } else {
                    // if new root-node, grow it radially
                    prev = { rpx0: 0, rpx1: 0 };
                }
            } else {
                // start sector of new traces from theta=0
                prev = { x0: baseX, x1: baseX };
            }
        }

        return interpolate(prev, next);
    }

    function makeUpdateTextInterpolator(pt) {
        var prev0 = prevLookup[helpers.getPtId(pt)];
        var prev;
        var transform = pt.transform;

        if (prev0) {
            prev = prev0;
        } else {
            prev = {
                rpx1: pt.rpx1,
                transform: {
                    textPosAngle: transform.textPosAngle,
                    scale: 0,
                    rotate: transform.rotate,
                    rCenter: transform.rCenter,
                    x: transform.x,
                    y: transform.y
                }
            };

            // for new pts:
            if (prevEntry) {
                // if trace was visible before
                if (pt.parent) {
                    if (nextX1ofPrevEntry) {
                        // if new branch, twist it in clockwise or
                        // counterclockwise which ever is shorter to
                        // its final angle
                        var a = pt.x1 > nextX1ofPrevEntry ? 2 * Math.PI : 0;
                        prev.x0 = prev.x1 = a;
                    } else {
                        // if leaf
                        Lib.extendFlat(prev, interpX0X1FromParent(pt));
                    }
                } else {
                    // if new root-node
                    prev.x0 = prev.x1 = baseX;
                }
            } else {
                // on new traces
                prev.x0 = prev.x1 = baseX;
            }
        }

        var textPosAngleFn = interpolate(prev.transform.textPosAngle, pt.transform.textPosAngle);
        var rpx1Fn = interpolate(prev.rpx1, pt.rpx1);
        var x0Fn = interpolate(prev.x0, pt.x0);
        var x1Fn = interpolate(prev.x1, pt.x1);
        var scaleFn = interpolate(prev.transform.scale, transform.scale);
        var rotateFn = interpolate(prev.transform.rotate, transform.rotate);

        // smooth out start/end from entry, to try to keep text inside sector
        // while keeping transition smooth
        var pow = transform.rCenter === 0 ? 3 : prev.transform.rCenter === 0 ? 1 / 3 : 1;
        var _rCenterFn = interpolate(prev.transform.rCenter, transform.rCenter);
        var rCenterFn = function (t) {
            return _rCenterFn(Math.pow(t, pow));
        };

        return function (t) {
            var rpx1 = rpx1Fn(t);
            var x0 = x0Fn(t);
            var x1 = x1Fn(t);
            var rCenter = rCenterFn(t);
            var pxmid = rx2px(rpx1, (x0 + x1) / 2);
            var textPosAngle = textPosAngleFn(t);

            var d = {
                pxmid: pxmid,
                rpx1: rpx1,
                transform: {
                    textPosAngle: textPosAngle,
                    rCenter: rCenter,
                    x: transform.x,
                    y: transform.y
                }
            };

            recordMinTextSize(trace.type, transform, fullLayout);
            return {
                transform: {
                    targetX: getTargetX(d),
                    targetY: getTargetY(d),
                    scale: scaleFn(t),
                    rotate: rotateFn(t),
                    rCenter: rCenter
                }
            };
        };
    }

    function interpX0X1FromParent(pt) {
        var parent = pt.parent;
        var parentPrev = prevLookup[helpers.getPtId(parent)];
        var out = {};

        if (parentPrev) {
            // if parent is visible
            var parentChildren = parent.children;
            var ci = parentChildren.indexOf(pt);
            var n = parentChildren.length;
            var interp = interpolate(parentPrev.x0, parentPrev.x1);
            out.x0 = interp(ci / n);
            out.x1 = interp(ci / n);
        } else {
            // w/o visible parent
            // TODO !!! HOW ???
            out.x0 = out.x1 = 0;
        }

        return out;
    }
}

// x[0-1] keys are angles [radians]
// y[0-1] keys are hierarchy heights [integers]
function partition(entry) {
    return d3Hierarchy.partition().size([2 * Math.PI, entry.height + 1])(entry);
}

exports.formatSliceLabel = function (pt, entry, trace, cd, fullLayout) {
    var texttemplate = trace.texttemplate;
    var textinfo = trace.textinfo;

    if (!texttemplate && (!textinfo || textinfo === 'none')) {
        return '';
    }

    var separators = fullLayout.separators;
    var cd0 = cd[0];
    var cdi = pt.data.data;
    var hierarchy = cd0.hierarchy;
    var isRoot = helpers.isHierarchyRoot(pt);
    var parent = helpers.getParent(hierarchy, pt);
    var val = helpers.getValue(pt);

    if (!texttemplate) {
        var parts = textinfo.split('+');
        var hasFlag = function (flag) {
            return parts.indexOf(flag) !== -1;
        };
        var thisText = [];
        var tx;

        if (hasFlag('label') && cdi.label) {
            thisText.push(cdi.label);
        }

        if (cdi.hasOwnProperty('v') && hasFlag('value')) {
            thisText.push(helpers.formatValue(cdi.v, separators));
        }

        if (!isRoot) {
            if (hasFlag('current path')) {
                thisText.push(helpers.getPath(pt.data));
            }

            var nPercent = 0;
            if (hasFlag('percent parent')) nPercent++;
            if (hasFlag('percent entry')) nPercent++;
            if (hasFlag('percent root')) nPercent++;
            var hasMultiplePercents = nPercent > 1;

            if (nPercent) {
                var percent;
                var addPercent = function (key) {
                    tx = helpers.formatPercent(percent, separators);

                    if (hasMultiplePercents) tx += ' of ' + key;
                    thisText.push(tx);
                };

                if (hasFlag('percent parent') && !isRoot) {
                    percent = val / helpers.getValue(parent);
                    addPercent('parent');
                }
                if (hasFlag('percent entry')) {
                    percent = val / helpers.getValue(entry);
                    addPercent('entry');
                }
                if (hasFlag('percent root')) {
                    percent = val / helpers.getValue(hierarchy);
                    addPercent('root');
                }
            }
        }

        if (hasFlag('text')) {
            tx = Lib.castOption(trace, cdi.i, 'text');
            if (Lib.isValidTextValue(tx)) thisText.push(tx);
        }

        return thisText.join('<br>');
    }

    var txt = Lib.castOption(trace, cdi.i, 'texttemplate');
    if (!txt) return '';
    var obj = {};
    if (cdi.label) obj.label = cdi.label;
    if (cdi.hasOwnProperty('v')) {
        obj.value = cdi.v;
        obj.valueLabel = helpers.formatValue(cdi.v, separators);
    }

    obj.currentPath = helpers.getPath(pt.data);

    if (!isRoot) {
        obj.percentParent = val / helpers.getValue(parent);
        obj.percentParentLabel = helpers.formatPercent(obj.percentParent, separators);
        obj.parent = helpers.getPtLabel(parent);
    }

    obj.percentEntry = val / helpers.getValue(entry);
    obj.percentEntryLabel = helpers.formatPercent(obj.percentEntry, separators);
    obj.entry = helpers.getPtLabel(entry);

    obj.percentRoot = val / helpers.getValue(hierarchy);
    obj.percentRootLabel = helpers.formatPercent(obj.percentRoot, separators);
    obj.root = helpers.getPtLabel(hierarchy);

    if (cdi.hasOwnProperty('color')) {
        obj.color = cdi.color;
    }
    var ptTx = Lib.castOption(trace, cdi.i, 'text');
    if (Lib.isValidTextValue(ptTx) || ptTx === '') obj.text = ptTx;
    obj.customdata = Lib.castOption(trace, cdi.i, 'customdata');
    return Lib.texttemplateString({
        data: [obj, trace._meta],
        fallback: trace.texttemplatefallback,
        labels: obj,
        locale: fullLayout._d3locale,
        template: txt
    });
};

function getInscribedRadiusFraction(pt) {
    if (pt.rpx0 === 0 && Lib.isFullCircle([pt.x0, pt.x1])) {
        // special case of 100% with no hole
        return 1;
    } else {
        return Math.max(0, Math.min(1 / (1 + 1 / Math.sin(pt.halfangle)), pt.ring / 2));
    }
}

function getTextXY(d) {
    return getCoords(d.rpx1, d.transform.textPosAngle);
}

function getCoords(r, angle) {
    return [r * Math.sin(angle), -r * Math.cos(angle)];
}
