/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var d3 = require('d3');
var isNumeric = require('fast-isnumeric');

var Plotly = require('../../plotly');
var Lib = require('../../lib');
var svgTextUtils = require('../../lib/svg_text_utils');
var Titles = require('../../components/titles');
var Color = require('../../components/color');
var Drawing = require('../../components/drawing');
var Axes = require('./axes');

var axisRegex = /((x|y)([2-9]|[1-9][0-9]+)?)axis$/;

module.exports = function transitionAxes(gd, newLayout, transitionConfig) {
    var fullLayout = gd._fullLayout;
    var axes = [];

    function computeUpdates (layout) {
        var ai, attrList, match, to, axis, update, i;
        var updates = {};

        for (ai in layout) {
            var attrList = ai.split('.');
            var match = attrList[0].match(axisRegex);
            if (match) {
                var axisName = match[1];
                axis = fullLayout[axisName + 'axis'];
                update = {};

                if (Array.isArray(layout[ai])) {
                    update.to = layout[ai].slice(0);
                } else {
                    if (Array.isArray(layout[ai].range)) {
                        update.to = layout[ai].range.slice(0);
                    }
                }
                if (!update.to) continue;

                update.axis = axis;
                update.length = axis._length;

                axes.push(axisName);

                updates[axisName] = update;
            }
        }

        return updates;
    }

    function computeAffectedSubplots (fullLayout, updatedAxisIds) {
        var plotName;
        var plotinfos = fullLayout._plots;
        var affectedSubplots = [];

        for (plotName in plotinfos) {
            var plotinfo = plotinfos[plotName];

            if (affectedSubplots.indexOf(plotinfo) !== -1) continue;

            var x = plotinfo.xaxis._id;
            var y = plotinfo.yaxis._id;

            if (updatedAxisIds.indexOf(x) !== -1 || updatedAxisIds.indexOf(y) !== -1) {
                affectedSubplots.push(plotinfo);
            }
        }

        return affectedSubplots;
    }

    var updates = computeUpdates(newLayout);
    var updatedAxisIds = Object.keys(updates);
    var affectedSubplots = computeAffectedSubplots(fullLayout, updatedAxisIds);
    var easeFn = d3.ease(transitionConfig.easing);

    function ticksAndAnnotations(xa, ya) {
        var activeAxIds = [],
            i;

        activeAxIds = [xa._id, ya._id];

        for(i = 0; i < activeAxIds.length; i++) {
            Axes.doTicks(gd, activeAxIds[i], true);
        }

        function redrawObjs(objArray, module) {
            var obji;
            for(i = 0; i < objArray.length; i++) {
                obji = objArray[i];
                if((activeAxIds.indexOf(obji.xref) !== -1) ||
                    (activeAxIds.indexOf(obji.yref) !== -1)) {
                    module.draw(gd, i);
                }
            }
        }

        redrawObjs(fullLayout.annotations || [], Plotly.Annotations);
        redrawObjs(fullLayout.shapes || [], Plotly.Shapes);
        redrawObjs(fullLayout.images || [], Plotly.Images);
    }

    function unsetSubplotTransform (subplot) {
        var xa2 = subplot.x();
        var ya2 = subplot.y();

        var viewBox = [0, 0, xa2._length, ya2._length];

        var editX = true;
        var editY = true;

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
            .call(Lib.setScale, xScaleFactor, yScaleFactor);

    }

    function updateSubplot (subplot, progress) {
        var axis, r0, r1;
        var xUpdate = updates[subplot.xaxis._id];
        var yUpdate = updates[subplot.yaxis._id];

        var viewBox = [];

        if (xUpdate) {
            axis = xUpdate.axis;
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

        if (yUpdate) {
            axis = yUpdate.axis;
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

        ticksAndAnnotations(subplot.x(), subplot.y());


        var xa2 = subplot.x();
        var ya2 = subplot.y();

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
            .call(Lib.setScale, xScaleFactor, yScaleFactor);
    }

    // transitionTail - finish a drag event with a redraw
    function transitionTail() {
        var attrs = {};
        // revert to the previous axis settings, then apply the new ones
        // through relayout - this lets relayout manage undo/redo
        for(var i = 0; i < updatedAxisIds.length; i++) {
            var axi = updates[updatedAxisIds[i]].axis;
            if(axi._r[0] !== axi.range[0]) attrs[axi._name + '.range[0]'] = axi.range[0];
            if(axi._r[1] !== axi.range[1]) attrs[axi._name + '.range[1]'] = axi.range[1];

            axi.range = axi._r.slice();
        }

        for (var i = 0; i < affectedSubplots.length; i++) {
            unsetSubplotTransform(affectedSubplots[i]);
        }

        Plotly.relayout(gd, attrs);
    }

    return new Promise(function (resolve, reject) {
        var t1, t2, raf;

        function doFrame () {
            t2 = Date.now();

            var tInterp = Math.min(1, (t2 - t1) / transitionConfig.duration);
            var progress = easeFn(tInterp);

            for (var i = 0; i < affectedSubplots.length; i++) {
                updateSubplot(affectedSubplots[i], progress);
            }

            if (t2 - t1 > transitionConfig.duration) {
                raf = cancelAnimationFrame(doFrame);
                transitionTail();
                resolve();
            } else {
                raf = requestAnimationFrame(doFrame);
                resolve();
            }
        }

        t1 = Date.now();
        raf = requestAnimationFrame(doFrame);
    });
}
