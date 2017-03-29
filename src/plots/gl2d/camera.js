/**
* Copyright 2012-2017, Plotly, Inc.
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

    function unSetAutoRange() {
        scene.xaxis.autorange = false;
        scene.yaxis.autorange = false;
    }

    result.mouseListener = mouseChange(element, function(buttons, x, y) {
        var dataBox = scene.calcDataBox(),
            viewBox = plot.viewBox;

        var lastX = result.lastPos[0],
            lastY = result.lastPos[1];

        x *= plot.pixelRatio;
        y *= plot.pixelRatio;

        // mouseChange gives y about top; convert to about bottom
        y = (viewBox[3] - viewBox[1]) - y;

        function updateRange(i0, start, end) {
            var range0 = Math.min(start, end),
                range1 = Math.max(start, end);

            if(range0 !== range1) {
                dataBox[i0] = range0;
                dataBox[i0 + 2] = range1;
                result.dataBox = dataBox;
                scene.setRanges(dataBox);
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
                            (viewBox[2] - viewBox[0]) * (dataBox[2] - dataBox[0]) +
                        dataBox[0];
                    var dataY = y /
                            (viewBox[3] - viewBox[1]) * (dataBox[3] - dataBox[1]) +
                        dataBox[1];

                    if(!result.boxEnabled) {
                        result.boxStart[0] = dataX;
                        result.boxStart[1] = dataY;
                    }

                    result.boxEnd[0] = dataX;
                    result.boxEnd[1] = dataY;

                    result.boxEnabled = true;
                }
                else if(result.boxEnabled) {
                    updateRange(0, result.boxStart[0], result.boxEnd[0]);
                    updateRange(1, result.boxStart[1], result.boxEnd[1]);
                    unSetAutoRange();
                    result.boxEnabled = false;
                    scene.relayoutCallback();
                }
                break;

            case 'pan':
                result.boxEnabled = false;

                if(buttons) {
                    var dx = (lastX - x) * (dataBox[2] - dataBox[0]) /
                        (plot.viewBox[2] - plot.viewBox[0]);
                    var dy = (lastY - y) * (dataBox[3] - dataBox[1]) /
                        (plot.viewBox[3] - plot.viewBox[1]);

                    dataBox[0] += dx;
                    dataBox[2] += dx;
                    dataBox[1] += dy;
                    dataBox[3] += dy;

                    scene.setRanges(dataBox);

                    result.panning = true;
                    result.lastInputTime = Date.now();
                    unSetAutoRange();
                    scene.cameraChanged();
                    scene.handleAnnotations();
                }
                else if(result.panning) {
                    result.panning = false;
                    scene.relayoutCallback();
                }
                break;
        }

        result.lastPos[0] = x;
        result.lastPos[1] = y;
    });

    result.wheelListener = mouseWheel(element, function(dx, dy) {
        var dataBox = scene.calcDataBox(),
            viewBox = plot.viewBox;

        var lastX = result.lastPos[0],
            lastY = result.lastPos[1];

        switch(scene.fullLayout.dragmode) {
            case 'zoom':
                break;

            case 'pan':
                var scale = Math.exp(0.1 * dy / (viewBox[3] - viewBox[1]));

                var cx = lastX /
                        (viewBox[2] - viewBox[0]) * (dataBox[2] - dataBox[0]) +
                    dataBox[0];
                var cy = lastY /
                        (viewBox[3] - viewBox[1]) * (dataBox[3] - dataBox[1]) +
                    dataBox[1];

                dataBox[0] = (dataBox[0] - cx) * scale + cx;
                dataBox[2] = (dataBox[2] - cx) * scale + cx;
                dataBox[1] = (dataBox[1] - cy) * scale + cy;
                dataBox[3] = (dataBox[3] - cy) * scale + cy;

                scene.setRanges(dataBox);

                result.lastInputTime = Date.now();
                unSetAutoRange();
                scene.cameraChanged();
                scene.handleAnnotations();
                scene.relayoutCallback();
                break;
        }

        return true;
    });

    return result;
}
