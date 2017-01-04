/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var d3 = require('d3');

var Plotly = require('../../plotly');
var Registry = require('../../registry');
var Lib = require('../../lib');
var Axes = require('./axes');
var axisRegex = /((x|y)([2-9]|[1-9][0-9]+)?)axis$/;

module.exports = function transitionAxes(gd, newLayout, transitionOpts, makeOnCompleteCallback) {
    var fullLayout = gd._fullLayout;
    var axes = [];

    function computeUpdates(layout) {
        var ai, attrList, match, axis, update;
        var updates = {};

        for(ai in layout) {
            attrList = ai.split('.');
            match = attrList[0].match(axisRegex);
            if(match) {
                var axisLetter = match[1];
                var axisName = axisLetter + 'axis';
                axis = fullLayout[axisName];
                update = {};

                if(Array.isArray(layout[ai])) {
                    update.to = layout[ai].slice(0);
                } else {
                    if(Array.isArray(layout[ai].range)) {
                        update.to = layout[ai].range.slice(0);
                    }
                }
                if(!update.to) continue;

                update.axisName = axisName;
                update.length = axis._length;

                axes.push(axisLetter);

                updates[axisLetter] = update;
            }
        }

        return updates;
    }

    function computeAffectedSubplots(fullLayout, updatedAxisIds, updates) {
        var plotName;
        var plotinfos = fullLayout._plots;
        var affectedSubplots = [];
        var toX, toY;

        for(plotName in plotinfos) {
            var plotinfo = plotinfos[plotName];

            if(affectedSubplots.indexOf(plotinfo) !== -1) continue;

            var x = plotinfo.xaxis._id;
            var y = plotinfo.yaxis._id;
            var fromX = plotinfo.xaxis.range;
            var fromY = plotinfo.yaxis.range;

            // Store the initial range at the beginning of this transition:
            plotinfo.xaxis._r = plotinfo.xaxis.range.slice();
            plotinfo.yaxis._r = plotinfo.yaxis.range.slice();

            if(updates[x]) {
                toX = updates[x].to;
            } else {
                toX = fromX;
            }
            if(updates[y]) {
                toY = updates[y].to;
            } else {
                toY = fromY;
            }

            if(fromX[0] === toX[0] && fromX[1] === toX[1] && fromY[0] === toY[0] && fromY[1] === toY[1]) continue;

            if(updatedAxisIds.indexOf(x) !== -1 || updatedAxisIds.indexOf(y) !== -1) {
                affectedSubplots.push(plotinfo);
            }
        }

        return affectedSubplots;
    }

    var updates = computeUpdates(newLayout);
    var updatedAxisIds = Object.keys(updates);
    var affectedSubplots = computeAffectedSubplots(fullLayout, updatedAxisIds, updates);

    if(!affectedSubplots.length) {
        return false;
    }

    function ticksAndAnnotations(xa, ya) {
        var activeAxIds = [],
            i;

        activeAxIds = [xa._id, ya._id];

        for(i = 0; i < activeAxIds.length; i++) {
            Axes.doTicks(gd, activeAxIds[i], true);
        }

        function redrawObjs(objArray, method) {
            for(i = 0; i < objArray.length; i++) {
                var obji = objArray[i];

                if((activeAxIds.indexOf(obji.xref) !== -1) ||
                    (activeAxIds.indexOf(obji.yref) !== -1)) {
                    method(gd, i);
                }
            }
        }

        // annotations and shapes 'draw' method is slow,
        // use the finer-grained 'drawOne' method instead

        redrawObjs(fullLayout.annotations || [], Registry.getComponentMethod('annotations', 'drawOne'));
        redrawObjs(fullLayout.shapes || [], Registry.getComponentMethod('shapes', 'drawOne'));
        redrawObjs(fullLayout.images || [], Registry.getComponentMethod('images', 'draw'));
    }

    function unsetSubplotTransform(subplot) {
        var xa2 = subplot.xaxis;
        var ya2 = subplot.yaxis;

        fullLayout._defs.selectAll('#' + subplot.clipId)
            .call(Lib.setTranslate, 0, 0)
            .call(Lib.setScale, 1, 1);

        subplot.plot
            .call(Lib.setTranslate, xa2._offset, ya2._offset)
            .call(Lib.setScale, 1, 1)

            // This is specifically directed at scatter traces, applying an inverse
            // scale to individual points to counteract the scale of the trace
            // as a whole:
            .selectAll('.points').selectAll('.point')
                .call(Lib.setPointGroupScale, 1, 1);

    }

    function updateSubplot(subplot, progress) {
        var axis, r0, r1;
        var xUpdate = updates[subplot.xaxis._id];
        var yUpdate = updates[subplot.yaxis._id];

        var viewBox = [];

        if(xUpdate) {
            axis = gd._fullLayout[xUpdate.axisName];
            r0 = axis._r;
            r1 = xUpdate.to;
            viewBox[0] = (r0[0] * (1 - progress) + progress * r1[0] - r0[0]) / (r0[1] - r0[0]) * subplot.xaxis._length;
            var dx1 = r0[1] - r0[0];
            var dx2 = r1[1] - r1[0];

            axis.range[0] = r0[0] * (1 - progress) + progress * r1[0];
            axis.range[1] = r0[1] * (1 - progress) + progress * r1[1];

            viewBox[2] = subplot.xaxis._length * ((1 - progress) + progress * dx2 / dx1);
        } else {
            viewBox[0] = 0;
            viewBox[2] = subplot.xaxis._length;
        }

        if(yUpdate) {
            axis = gd._fullLayout[yUpdate.axisName];
            r0 = axis._r;
            r1 = yUpdate.to;
            viewBox[1] = (r0[1] * (1 - progress) + progress * r1[1] - r0[1]) / (r0[0] - r0[1]) * subplot.yaxis._length;
            var dy1 = r0[1] - r0[0];
            var dy2 = r1[1] - r1[0];

            axis.range[0] = r0[0] * (1 - progress) + progress * r1[0];
            axis.range[1] = r0[1] * (1 - progress) + progress * r1[1];

            viewBox[3] = subplot.yaxis._length * ((1 - progress) + progress * dy2 / dy1);
        } else {
            viewBox[1] = 0;
            viewBox[3] = subplot.yaxis._length;
        }

        ticksAndAnnotations(subplot.xaxis, subplot.yaxis);


        var xa2 = subplot.xaxis;
        var ya2 = subplot.yaxis;

        var editX = !!xUpdate;
        var editY = !!yUpdate;

        var xScaleFactor = editX ? xa2._length / viewBox[2] : 1,
            yScaleFactor = editY ? ya2._length / viewBox[3] : 1;

        var clipDx = editX ? viewBox[0] : 0,
            clipDy = editY ? viewBox[1] : 0;

        var fracDx = editX ? (viewBox[0] / viewBox[2] * xa2._length) : 0,
            fracDy = editY ? (viewBox[1] / viewBox[3] * ya2._length) : 0;

        var plotDx = xa2._offset - fracDx,
            plotDy = ya2._offset - fracDy;

        fullLayout._defs.selectAll('#' + subplot.clipId)
            .call(Lib.setTranslate, clipDx, clipDy)
            .call(Lib.setScale, 1 / xScaleFactor, 1 / yScaleFactor);

        subplot.plot
            .call(Lib.setTranslate, plotDx, plotDy)
            .call(Lib.setScale, xScaleFactor, yScaleFactor)

            // This is specifically directed at scatter traces, applying an inverse
            // scale to individual points to counteract the scale of the trace
            // as a whole:
            .selectAll('.points').selectAll('.point')
                .call(Lib.setPointGroupScale, 1 / xScaleFactor, 1 / yScaleFactor);

    }

    var onComplete;
    if(makeOnCompleteCallback) {
        // This module makes the choice whether or not it notifies Plotly.transition
        // about completion:
        onComplete = makeOnCompleteCallback();
    }

    function transitionComplete() {
        var aobj = {};
        for(var i = 0; i < updatedAxisIds.length; i++) {
            var axi = gd._fullLayout[updates[updatedAxisIds[i]].axisName];
            var to = updates[updatedAxisIds[i]].to;
            aobj[axi._name + '.range[0]'] = to[0];
            aobj[axi._name + '.range[1]'] = to[1];

            axi.range = to.slice();
        }

        // Signal that this transition has completed:
        onComplete && onComplete();

        return Plotly.relayout(gd, aobj).then(function() {
            for(var i = 0; i < affectedSubplots.length; i++) {
                unsetSubplotTransform(affectedSubplots[i]);
            }
        });
    }

    function transitionInterrupt() {
        var aobj = {};
        for(var i = 0; i < updatedAxisIds.length; i++) {
            var axi = gd._fullLayout[updatedAxisIds[i] + 'axis'];
            aobj[axi._name + '.range[0]'] = axi.range[0];
            aobj[axi._name + '.range[1]'] = axi.range[1];

            axi.range = axi._r.slice();
        }

        return Plotly.relayout(gd, aobj).then(function() {
            for(var i = 0; i < affectedSubplots.length; i++) {
                unsetSubplotTransform(affectedSubplots[i]);
            }
        });
    }

    var t1, t2, raf;
    var easeFn = d3.ease(transitionOpts.easing);

    gd._transitionData._interruptCallbacks.push(function() {
        window.cancelAnimationFrame(raf);
        raf = null;
        return transitionInterrupt();
    });

    function doFrame() {
        t2 = Date.now();

        var tInterp = Math.min(1, (t2 - t1) / transitionOpts.duration);
        var progress = easeFn(tInterp);

        for(var i = 0; i < affectedSubplots.length; i++) {
            updateSubplot(affectedSubplots[i], progress);
        }

        if(t2 - t1 > transitionOpts.duration) {
            transitionComplete();
            raf = window.cancelAnimationFrame(doFrame);
        } else {
            raf = window.requestAnimationFrame(doFrame);
        }
    }

    t1 = Date.now();
    raf = window.requestAnimationFrame(doFrame);

    return Promise.resolve();
};
