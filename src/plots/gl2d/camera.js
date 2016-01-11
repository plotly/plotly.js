/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var mouseChange = require('mouse-change');
var mouseWheel = require('mouse-wheel');

module.exports = createCamera;

function Camera2D(element, plot) {
    this.element = element;
    this.plot = plot;
    this.mouseListener = null;
    this.wheelListener = null;
    this.lastInputTime = Date.now();
    this.lastPos = [0, 0];
    this.boxEnabled = false;
    this.boxStart = [0, 0];
    this.boxEnd = [0, 0];
}


function createCamera(scene) {
    var element = scene.mouseContainer,
        plot = scene.glplot,
        result = new Camera2D(element, plot);

    result.mouseListener = mouseChange(element, function(buttons, x, y) {
        var xrange = scene.xaxis.range,
            yrange = scene.yaxis.range,
            viewBox = plot.viewBox;

        var lastX = result.lastPos[0],
            lastY = result.lastPos[1];

        x *= plot.pixelRatio;
        y *= plot.pixelRatio;

        // mouseChange gives y about top; convert to about bottom
        y = (viewBox[3] - viewBox[1]) - y;

        function updateRange(range, start, end) {
            var range0 = Math.min(start, end),
                range1 = Math.max(start, end);

            if(range0 !== range1) {
                range[0] = range0;
                range[1] = range1;
                result.dataBox = range;
            }
            else {
                scene.selectBox.selectBox = [0, 0, 1, 1];
                scene.glplot.setDirty();
            }
        }

        switch(scene.fullLayout.dragmode) {
            case 'zoom':
                if(buttons) {
                    var dataX = x /
                            (viewBox[2] - viewBox[0]) * (xrange[1] - xrange[0]) +
                        xrange[0];
                    var dataY = y /
                            (viewBox[3] - viewBox[1]) * (yrange[1] - yrange[0]) +
                        yrange[0];

                    if(!result.boxEnabled) {
                        result.boxStart[0] = dataX;
                        result.boxStart[1] = dataY;
                    }

                    result.boxEnd[0] = dataX;
                    result.boxEnd[1] = dataY;

                    result.boxEnabled = true;
                }
                else if(result.boxEnabled) {
                    updateRange(xrange, result.boxStart[0], result.boxEnd[0]);
                    updateRange(yrange, result.boxStart[1], result.boxEnd[1]);

                    result.boxEnabled = false;
                }
                break;

            case 'pan':
                result.boxEnabled = false;

                if(buttons) {
                    var dx = (lastX - x) * (xrange[1] - xrange[0]) /
                        (plot.viewBox[2] - plot.viewBox[0]);
                    var dy = (lastY - y) * (yrange[1] - yrange[0]) /
                        (plot.viewBox[3] - plot.viewBox[1]);

                    xrange[0] += dx;
                    xrange[1] += dx;
                    yrange[0] += dy;
                    yrange[1] += dy;

                    result.lastInputTime = Date.now();

                    scene.cameraChanged();
                }
                break;
        }

        result.lastPos[0] = x;
        result.lastPos[1] = y;
    });

    result.wheelListener = mouseWheel(element, function(dx, dy) {
        var xrange = scene.xaxis.range,
            yrange = scene.yaxis.range,
            viewBox = plot.viewBox;

        var lastX = result.lastPos[0],
            lastY = result.lastPos[1];

        switch(scene.fullLayout.dragmode) {
            case 'zoom':
                break;

            case 'pan':
                var scale = Math.exp(0.1 * dy / (viewBox[3] - viewBox[1]));

                var cx = lastX /
                        (viewBox[2] - viewBox[0]) * (xrange[1] - xrange[0]) +
                    xrange[0];
                var cy = lastY /
                        (viewBox[3] - viewBox[1]) * (yrange[1] - yrange[0]) +
                    yrange[0];

                xrange[0] = (xrange[0] - cx) * scale + cx;
                xrange[1] = (xrange[1] - cx) * scale + cx;
                yrange[0] = (yrange[0] - cy) * scale + cy;
                yrange[1] = (yrange[1] - cy) * scale + cy;

                result.lastInputTime = Date.now();
                scene.cameraChanged();
                break;
        }

        return true;
    });

    return result;
}
