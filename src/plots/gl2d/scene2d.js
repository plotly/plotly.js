/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Axes = require('../../plots/cartesian/axes');
var Fx = require('../../plots/cartesian/graph_interact');

var createPlot2D = require('gl-plot2d');
var createSpikes = require('gl-spikes2d');
var createSelectBox = require('gl-select-box');

var createOptions = require('./convert');
var createCamera = require('./camera');
var htmlToUnicode = require('../../lib/html2unicode');
var showNoWebGlMsg = require('../../lib/show_no_webgl_msg');

var AXES = ['xaxis', 'yaxis'];
var STATIC_CANVAS, STATIC_CONTEXT;


function Scene2D(options, fullLayout) {
    this.container = options.container;
    this.graphDiv = options.graphDiv;
    this.pixelRatio = options.plotGlPixelRatio || window.devicePixelRatio;
    this.id = options.id;
    this.staticPlot = !!options.staticPlot;

    this.fullLayout = fullLayout;
    this.updateAxes(fullLayout);

    this.makeFramework();

    // update options
    this.glplotOptions = createOptions(this);
    this.glplotOptions.merge(fullLayout);

    // create the plot
    this.glplot = createPlot2D(this.glplotOptions);

    // create camera
    this.camera = createCamera(this);

    // trace set
    this.traces = {};

    // create axes spikes
    this.spikes = createSpikes(this.glplot);

    this.selectBox = createSelectBox(this.glplot, {
        innerFill: false,
        outerFill: true
    });

    // last pick result
    this.pickResult = null;

    this.bounds = [Infinity, Infinity, -Infinity, -Infinity];

    // flag to stop render loop
    this.stopped = false;

    // redraw the plot
    this.redraw = this.draw.bind(this);
    this.redraw();
}

module.exports = Scene2D;

var proto = Scene2D.prototype;

proto.makeFramework = function() {

    // create canvas and gl context
    if(this.staticPlot) {
        if(!STATIC_CONTEXT) {
            STATIC_CANVAS = document.createElement('canvas');

            try {
                STATIC_CONTEXT = STATIC_CANVAS.getContext('webgl', {
                    preserveDrawingBuffer: true,
                    premultipliedAlpha: true,
                    antialias: true
                });
            } catch(e) {
                throw new Error([
                    'Error creating static canvas/context for image server'
                ].join(' '));
            }
        }

        this.canvas = STATIC_CANVAS;
        this.gl = STATIC_CONTEXT;
    }
    else {
        var liveCanvas = document.createElement('canvas'),
            glOpts = { premultipliedAlpha: true };
        var gl;

        try {
            gl = liveCanvas.getContext('webgl', glOpts);
        } catch(e) {
            //
        }

        if(!gl) {
            try {
                gl = liveCanvas.getContext('experimental-webgl', glOpts);
            } catch(e) {
                //
            }
        }

        if(!gl) showNoWebGlMsg(this);

        this.canvas = liveCanvas;
        this.gl = gl;
    }

    // position the canvas
    var canvas = this.canvas,
        pixelRatio = this.pixelRatio,
        fullLayout = this.fullLayout;

    canvas.width = Math.ceil(pixelRatio * fullLayout.width) |0;
    canvas.height = Math.ceil(pixelRatio * fullLayout.height) |0;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.position = 'absolute';
    canvas.style.top = '0px';
    canvas.style.left = '0px';
    canvas.style['pointer-events'] = 'none';

    // create SVG container for hover text
    var svgContainer = this.svgContainer = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'svg');
    svgContainer.style.position = 'absolute';
    svgContainer.style.top = svgContainer.style.left = '0px';
    svgContainer.style.width = svgContainer.style.height = '100%';
    svgContainer.style['z-index'] = 20;
    svgContainer.style['pointer-events'] = 'none';

    // create div to catch the mouse event
    var mouseContainer = this.mouseContainer = document.createElement('div');
    mouseContainer.style.position = 'absolute';

    // append canvas, hover svg and mouse div to container
    var container = this.container;
    container.appendChild(canvas);
    container.appendChild(svgContainer);
    container.appendChild(mouseContainer);
};

proto.toImage = function(format) {
    if(!format) format = 'png';

    this.stopped = true;
    if(this.staticPlot) this.container.appendChild(STATIC_CANVAS);

    // force redraw
    this.glplot.setDirty();
    this.glplot.draw();

    // grab context and yank out pixels
    var gl = this.glplot.gl,
        w = gl.drawingBufferWidth,
        h = gl.drawingBufferHeight;

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    var pixels = new Uint8Array(w * h * 4);
    gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

    // flip pixels
    for(var j = 0, k = h - 1; j < k; ++j, --k) {
        for(var i = 0; i < w; ++i) {
            for(var l = 0; l < 4; ++l) {
                var tmp = pixels[4 * (w * j + i) + l];
                pixels[4 * (w * j + i) + l] = pixels[4 * (w * k + i) + l];
                pixels[4 * (w * k + i) + l] = tmp;
            }
        }
    }

    var canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;

    var context = canvas.getContext('2d');
    var imageData = context.createImageData(w, h);
    imageData.data.set(pixels);
    context.putImageData(imageData, 0, 0);

    var dataURL;

    switch(format) {
        case 'jpeg':
            dataURL = canvas.toDataURL('image/jpeg');
            break;
        case 'webp':
            dataURL = canvas.toDataURL('image/webp');
            break;
        default:
            dataURL = canvas.toDataURL('image/png');
    }

    if(this.staticPlot) this.container.removeChild(STATIC_CANVAS);

    return dataURL;
};

proto.computeTickMarks = function() {
    this.xaxis._length =
        this.glplot.viewBox[2] - this.glplot.viewBox[0];
    this.yaxis._length =
        this.glplot.viewBox[3] - this.glplot.viewBox[1];

    var nextTicks = [
        Axes.calcTicks(this.xaxis),
        Axes.calcTicks(this.yaxis)
    ];

    for(var j = 0; j < 2; ++j) {
        for(var i = 0; i < nextTicks[j].length; ++i) {
            // TODO add support for '\n' in gl-plot2d,
            // For now, replace '\n' with ' '
            nextTicks[j][i].text = htmlToUnicode(nextTicks[j][i].text + '').replace(/\n/g, ' ');
        }
    }

    return nextTicks;
};

function compareTicks(a, b) {
    for(var i = 0; i < 2; ++i) {
        var aticks = a[i],
            bticks = b[i];

        if(aticks.length !== bticks.length) return true;

        for(var j = 0; j < aticks.length; ++j) {
            if(aticks[j].x !== bticks[j].x) return true;
        }
    }

    return false;
}

proto.updateAxes = function(options) {
    var spmatch = Axes.subplotMatch,
        xaxisName = 'xaxis' + this.id.match(spmatch)[1],
        yaxisName = 'yaxis' + this.id.match(spmatch)[2];

    this.xaxis = options[xaxisName];
    this.yaxis = options[yaxisName];
};

proto.updateFx = function(options) {
    var fullLayout = this.fullLayout;

    fullLayout.dragmode = options.dragmode;
    fullLayout.hovermode = options.hovermode;
};

var relayoutCallback = function(scene) {

    var xrange = scene.xaxis.range,
        yrange = scene.yaxis.range;

    // Update the layout on the DIV
    scene.graphDiv.layout.xaxis.range = xrange.slice(0);
    scene.graphDiv.layout.yaxis.range = yrange.slice(0);

    // Make a meaningful value to be passed on to the possible 'plotly_relayout' subscriber(s)
    var update = { // scene.camera has no many useful projection or scale information
        lastInputTime: scene.camera.lastInputTime // helps determine which one is the latest input (if async)
    };
    update[scene.xaxis._name] = xrange.slice();
    update[scene.yaxis._name] = yrange.slice();

    scene.graphDiv.emit('plotly_relayout', update);
};

proto.cameraChanged = function() {
    var camera = this.camera,
        xrange = this.xaxis.range,
        yrange = this.yaxis.range;

    this.glplot.setDataBox([
        xrange[0], yrange[0],
        xrange[1], yrange[1]
    ]);

    var nextTicks = this.computeTickMarks();
    var curTicks = this.glplotOptions.ticks;

    if(compareTicks(nextTicks, curTicks)) {
        this.glplotOptions.ticks = nextTicks;
        this.glplotOptions.dataBox = camera.dataBox;
        this.glplot.update(this.glplotOptions);
        relayoutCallback(this);
    }
};

proto.destroy = function() {
    this.glplot.dispose();

    if(!this.staticPlot) this.container.removeChild(this.canvas);
    this.container.removeChild(this.svgContainer);
    this.container.removeChild(this.mouseContainer);

    this.glplot = null;
    this.stopped = true;
};

proto.plot = function(fullData, calcData, fullLayout) {
    var glplot = this.glplot,
        pixelRatio = this.pixelRatio;

    var i, j, trace;

    this.fullLayout = fullLayout;
    this.updateAxes(fullLayout);

    var width = fullLayout.width,
        height = fullLayout.height,
        pixelWidth = Math.ceil(pixelRatio * width) |0,
        pixelHeight = Math.ceil(pixelRatio * height) |0;

    // check for resize
    var canvas = this.canvas;
    if(canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width = pixelWidth;
        canvas.height = pixelHeight;
    }

    // update traces
    for(i = 0; i < fullData.length; ++i) {
        var fullTrace = fullData[i],
            calcTrace = calcData[i];
        trace = this.traces[fullTrace.uid];

        if(trace) trace.update(fullTrace, calcTrace);
        else {
            trace = fullTrace._module.plot(this, fullTrace, calcTrace);
        }

        this.traces[fullTrace.uid] = trace;
    }

    // remove empty traces
    var traceIds = Object.keys(this.traces);

    trace_id_loop:
    for(i = 0; i < traceIds.length; ++i) {
        for(j = 0; j < calcData.length; ++j) {
            if(calcData[j][0].trace.uid === traceIds[i]) continue trace_id_loop;
        }

        trace = this.traces[traceIds[i]];
        trace.dispose();
        delete this.traces[traceIds[i]];
    }

    var options = this.glplotOptions;
    options.merge(fullLayout);
    options.screenBox = [0, 0, width, height];

    var size = fullLayout._size,
        domainX = this.xaxis.domain,
        domainY = this.yaxis.domain;

    options.viewBox = [
        size.l + domainX[0] * size.w,
        size.b + domainY[0] * size.h,
        (width - size.r) - (1 - domainX[1]) * size.w,
        (height - size.t) - (1 - domainY[1]) * size.h
    ];

    this.mouseContainer.style.width = size.w * (domainX[1] - domainX[0]) + 'px';
    this.mouseContainer.style.height = size.h * (domainY[1] - domainY[0]) + 'px';
    this.mouseContainer.height = size.h * (domainY[1] - domainY[0]);
    this.mouseContainer.style.left = size.l + domainX[0] * size.w + 'px';
    this.mouseContainer.style.top = size.t + (1 - domainY[1]) * size.h + 'px';

    var bounds = this.bounds;
    bounds[0] = bounds[1] = Infinity;
    bounds[2] = bounds[3] = -Infinity;

    traceIds = Object.keys(this.traces);
    for(i = 0; i < traceIds.length; ++i) {
        trace = this.traces[traceIds[i]];
        for(var k = 0; k < 2; ++k) {
            bounds[k] = Math.min(bounds[k], trace.bounds[k]);
            bounds[k + 2] = Math.max(bounds[k + 2], trace.bounds[k + 2]);
        }
    }

    var ax;
    for(i = 0; i < 2; ++i) {
        if(bounds[i] > bounds[i + 2]) {
            bounds[i] = -1;
            bounds[i + 2] = 1;
        }

        ax = this[AXES[i]];
        ax._length = options.viewBox[i + 2] - options.viewBox[i];

        Axes.doAutoRange(ax);
    }

    options.ticks = this.computeTickMarks();

    var xrange = this.xaxis.range;
    var yrange = this.yaxis.range;
    options.dataBox = [xrange[0], yrange[0], xrange[1], yrange[1]];

    options.merge(fullLayout);
    glplot.update(options);

    // force redraw so that promise is returned when rendering is completed
    this.glplot.draw();
};

proto.draw = function() {
    if(this.stopped) return;

    requestAnimationFrame(this.redraw);

    var glplot = this.glplot,
        camera = this.camera,
        mouseListener = camera.mouseListener,
        fullLayout = this.fullLayout;

    this.cameraChanged();

    var x = mouseListener.x * glplot.pixelRatio;
    var y = this.canvas.height - glplot.pixelRatio * mouseListener.y;

    if(camera.boxEnabled && fullLayout.dragmode === 'zoom') {
        this.selectBox.enabled = true;

        this.selectBox.selectBox = [
            Math.min(camera.boxStart[0], camera.boxEnd[0]),
            Math.min(camera.boxStart[1], camera.boxEnd[1]),
            Math.max(camera.boxStart[0], camera.boxEnd[0]),
            Math.max(camera.boxStart[1], camera.boxEnd[1])
        ];

        glplot.setDirty();
    }
    else {
        this.selectBox.enabled = false;

        var size = fullLayout._size,
            domainX = this.xaxis.domain,
            domainY = this.yaxis.domain;

        var result = glplot.pick(
            (x / glplot.pixelRatio) + size.l + domainX[0] * size.w,
            (y / glplot.pixelRatio) - (size.t + (1 - domainY[1]) * size.h)
        );

        if(result && fullLayout.hovermode) {
            var nextSelection = result.object._trace.handlePick(result);

            if(nextSelection && (
                !this.lastPickResult ||
                this.lastPickResult.trace !== nextSelection.trace ||
                this.lastPickResult.dataCoord[0] !== nextSelection.dataCoord[0] ||
                this.lastPickResult.dataCoord[1] !== nextSelection.dataCoord[1])
            ) {
                var selection = this.lastPickResult = nextSelection;
                this.spikes.update({ center: result.dataCoord });

                selection.screenCoord = [
                    ((glplot.viewBox[2] - glplot.viewBox[0]) *
                    (result.dataCoord[0] - glplot.dataBox[0]) /
                        (glplot.dataBox[2] - glplot.dataBox[0]) + glplot.viewBox[0]) /
                            glplot.pixelRatio,
                    (this.canvas.height - (glplot.viewBox[3] - glplot.viewBox[1]) *
                    (result.dataCoord[1] - glplot.dataBox[1]) /
                        (glplot.dataBox[3] - glplot.dataBox[1]) - glplot.viewBox[1]) /
                            glplot.pixelRatio
                ];

                var hoverinfo = selection.hoverinfo;
                if(hoverinfo !== 'all') {
                    var parts = hoverinfo.split('+');
                    if(parts.indexOf('x') === -1) selection.traceCoord[0] = undefined;
                    if(parts.indexOf('y') === -1) selection.traceCoord[1] = undefined;
                    if(parts.indexOf('z') === -1) selection.traceCoord[2] = undefined;
                    if(parts.indexOf('text') === -1) selection.textLabel = undefined;
                    if(parts.indexOf('name') === -1) selection.name = undefined;
                }

                Fx.loneHover({
                    x: selection.screenCoord[0],
                    y: selection.screenCoord[1],
                    xLabel: this.hoverFormatter('xaxis', selection.traceCoord[0]),
                    yLabel: this.hoverFormatter('yaxis', selection.traceCoord[1]),
                    zLabel: selection.traceCoord[2],
                    text: selection.textLabel,
                    name: selection.name,
                    color: selection.color
                }, {
                    container: this.svgContainer
                });

                this.lastPickResult = { dataCoord: result.dataCoord };
            }
        }
        else if(!result && this.lastPickResult) {
            this.spikes.update({});
            this.lastPickResult = null;
            Fx.loneUnhover(this.svgContainer);
        }
    }

    glplot.draw();
};

proto.hoverFormatter = function(axisName, val) {
    if(val === undefined) return undefined;

    var axis = this[axisName];
    return Axes.tickText(axis, axis.c2l(val), 'hover').text;
};
