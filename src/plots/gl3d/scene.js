/**
* Copyright 2012-2020, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var glPlot3d = require('gl-plot3d');
var createCamera = glPlot3d.createCamera;
var createPlot = glPlot3d.createScene;

var getContext = require('webgl-context');
var passiveSupported = require('has-passive-events');

var Registry = require('../../registry');
var Lib = require('../../lib');
var preserveDrawingBuffer = Lib.preserveDrawingBuffer();

var Axes = require('../../plots/cartesian/axes');
var Fx = require('../../components/fx');

var str2RGBAarray = require('../../lib/str2rgbarray');
var showNoWebGlMsg = require('../../lib/show_no_webgl_msg');

var project = require('./project');
var createAxesOptions = require('./layout/convert');
var createSpikeOptions = require('./layout/spikes');
var computeTickMarks = require('./layout/tick_marks');

var STATIC_CANVAS, STATIC_CONTEXT;

function Scene(options, fullLayout) {
    // create sub container for plot
    var sceneContainer = document.createElement('div');
    var plotContainer = options.container;

    // keep a ref to the graph div to fire hover+click events
    this.graphDiv = options.graphDiv;

    // create SVG container for hover text
    var svgContainer = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'svg');
    svgContainer.style.position = 'absolute';
    svgContainer.style.top = svgContainer.style.left = '0px';
    svgContainer.style.width = svgContainer.style.height = '100%';
    svgContainer.style['z-index'] = 20;
    svgContainer.style['pointer-events'] = 'none';
    sceneContainer.appendChild(svgContainer);
    this.svgContainer = svgContainer;

    // Tag the container with the sceneID
    sceneContainer.id = options.id;
    sceneContainer.style.position = 'absolute';
    sceneContainer.style.top = sceneContainer.style.left = '0px';
    sceneContainer.style.width = sceneContainer.style.height = '100%';
    plotContainer.appendChild(sceneContainer);

    this.fullLayout = fullLayout;
    this.id = options.id || 'scene';
    this.fullSceneLayout = fullLayout[this.id];

    // Saved from last call to plot()
    this.plotArgs = [ [], {}, {} ];

    /*
     * Move this to calc step? Why does it work here?
     */
    this.axesOptions = createAxesOptions(fullLayout, fullLayout[this.id]);
    this.spikeOptions = createSpikeOptions(fullLayout[this.id]);
    this.container = sceneContainer;
    this.staticMode = !!options.staticPlot;
    this.pixelRatio = this.pixelRatio || options.plotGlPixelRatio || 2;

    // Coordinate rescaling
    this.dataScale = [1, 1, 1];

    this.contourLevels = [ [], [], [] ];

    this.convertAnnotations = Registry.getComponentMethod('annotations3d', 'convert');
    this.drawAnnotations = Registry.getComponentMethod('annotations3d', 'draw');

    this.initializeGLPlot();
}

var proto = Scene.prototype;

proto.prepareOptions = function() {
    var scene = this;

    var opts = {
        canvas: scene.canvas,
        gl: scene.gl,
        glOptions: {
            preserveDrawingBuffer: preserveDrawingBuffer,
            premultipliedAlpha: true,
            antialias: true
        },
        container: scene.container,
        axes: scene.axesOptions,
        spikes: scene.spikeOptions,
        pickRadius: 10,
        snapToData: true,
        autoScale: true,
        autoBounds: false,
        cameraObject: scene.camera,
        pixelRatio: scene.pixelRatio
    };

    // for static plots, we reuse the WebGL context
    //  as WebKit doesn't collect them reliably
    if(scene.staticMode) {
        if(!STATIC_CONTEXT) {
            STATIC_CANVAS = document.createElement('canvas');
            STATIC_CONTEXT = getContext({
                canvas: STATIC_CANVAS,
                preserveDrawingBuffer: true,
                premultipliedAlpha: true,
                antialias: true
            });
            if(!STATIC_CONTEXT) {
                throw new Error('error creating static canvas/context for image server');
            }
        }

        opts.gl = STATIC_CONTEXT;
        opts.canvas = STATIC_CANVAS;
    }

    return opts;
};

var firstInit = true;

proto.tryCreatePlot = function() {
    var scene = this;

    var opts = scene.prepareOptions();

    var success = true;

    try {
        scene.glplot = createPlot(opts);
    } catch(e) {
        if(scene.staticMode || !firstInit || preserveDrawingBuffer) {
            success = false;
        } else { // try second time
            // enable preserveDrawingBuffer setup
            // in case is-mobile not detecting the right device
            Lib.warn([
                'webgl setup failed possibly due to',
                'false preserveDrawingBuffer config.',
                'The mobile/tablet device may not be detected by is-mobile module.',
                'Enabling preserveDrawingBuffer in second attempt to create webgl scene...'
            ].join(' '));

            try {
                // invert preserveDrawingBuffer
                preserveDrawingBuffer = opts.glOptions.preserveDrawingBuffer = true;

                scene.glplot = createPlot(opts);
            } catch(e) {
                // revert changes to preserveDrawingBuffer
                preserveDrawingBuffer = opts.glOptions.preserveDrawingBuffer = false;

                success = false;
            }
        }
    }

    firstInit = false;

    return success;
};

proto.initializeGLCamera = function() {
    var scene = this;
    var cameraData = scene.fullSceneLayout.camera;
    var isOrtho = (cameraData.projection.type === 'orthographic');

    scene.camera = createCamera(scene.container, {
        center: [cameraData.center.x, cameraData.center.y, cameraData.center.z],
        eye: [cameraData.eye.x, cameraData.eye.y, cameraData.eye.z],
        up: [cameraData.up.x, cameraData.up.y, cameraData.up.z],
        _ortho: isOrtho,
        zoomMin: 0.01,
        zoomMax: 100,
        mode: 'orbit'
    });
};

proto.initializeGLPlot = function() {
    var scene = this;

    scene.initializeGLCamera();

    var success = scene.tryCreatePlot();
    /*
    * createPlot will throw when webgl is not enabled in the client.
    * Lets return an instance of the module with all functions noop'd.
    * The destroy method - which will remove the container from the DOM
    * is overridden with a function that removes the container only.
    */
    if(!success) return showNoWebGlMsg(scene);

    // List of scene objects
    scene.traces = {};

    scene.make4thDimension();

    var gd = scene.graphDiv;
    var layout = gd.layout;

    var makeUpdate = function() {
        var update = {};

        if(scene.isCameraChanged(layout)) {
            // camera updates
            update[scene.id + '.camera'] = scene.getCamera();
        }

        if(scene.isAspectChanged(layout)) {
            // scene updates
            update[scene.id + '.aspectratio'] = scene.glplot.getAspectratio();

            if(layout[scene.id].aspectmode !== 'manual') {
                scene.fullSceneLayout.aspectmode =
                layout[scene.id].aspectmode =
                update[scene.id + '.aspectmode'] = 'manual';
            }
        }

        return update;
    };

    var relayoutCallback = function(scene) {
        if(scene.fullSceneLayout.dragmode === false) return;

        var update = makeUpdate();
        scene.saveLayout(layout);
        scene.graphDiv.emit('plotly_relayout', update);
    };

    if(scene.glplot.canvas) {
        scene.glplot.canvas.addEventListener('mouseup', function() {
            relayoutCallback(scene);
        });

        scene.glplot.canvas.addEventListener('wheel', function(e) {
            if(gd._context._scrollZoom.gl3d) {
                if(scene.camera._ortho) {
                    var s = (e.deltaX > e.deltaY) ? 1.1 : 1.0 / 1.1;
                    var o = scene.glplot.getAspectratio();
                    scene.glplot.setAspectratio({
                        x: s * o.x,
                        y: s * o.y,
                        z: s * o.z
                    });
                }

                relayoutCallback(scene);
            }
        }, passiveSupported ? {passive: false} : false);

        scene.glplot.canvas.addEventListener('mousemove', function() {
            if(scene.fullSceneLayout.dragmode === false) return;
            if(scene.camera.mouseListener.buttons === 0) return;

            var update = makeUpdate();
            scene.graphDiv.emit('plotly_relayouting', update);
        });

        if(!scene.staticMode) {
            scene.glplot.canvas.addEventListener('webglcontextlost', function(event) {
                if(gd && gd.emit) {
                    gd.emit('plotly_webglcontextlost', {
                        event: event,
                        layer: scene.id
                    });
                }
            }, false);
        }
    }

    scene.glplot.oncontextloss = function() {
        scene.recoverContext();
    };

    scene.glplot.onrender = function() {
        scene.render();
    };

    return true;
};

proto.render = function() {
    var scene = this;
    var gd = scene.graphDiv;
    var trace;

    // update size of svg container
    var svgContainer = scene.svgContainer;
    var clientRect = scene.container.getBoundingClientRect();

    gd._fullLayout._calcInverseTransform(gd);
    var scaleX = gd._fullLayout._invScaleX;
    var scaleY = gd._fullLayout._invScaleY;
    var width = clientRect.width * scaleX;
    var height = clientRect.height * scaleY;
    svgContainer.setAttributeNS(null, 'viewBox', '0 0 ' + width + ' ' + height);
    svgContainer.setAttributeNS(null, 'width', width);
    svgContainer.setAttributeNS(null, 'height', height);

    computeTickMarks(scene);
    scene.glplot.axes.update(scene.axesOptions);

    // check if pick has changed
    var keys = Object.keys(scene.traces);
    var lastPicked = null;
    var selection = scene.glplot.selection;
    for(var i = 0; i < keys.length; ++i) {
        trace = scene.traces[keys[i]];
        if(trace.data.hoverinfo !== 'skip' && trace.handlePick(selection)) {
            lastPicked = trace;
        }

        if(trace.setContourLevels) trace.setContourLevels();
    }

    function formatter(axisName, val) {
        var axis = scene.fullSceneLayout[axisName];

        return Axes.tickText(axis, axis.d2l(val), 'hover').text;
    }

    var oldEventData;

    if(lastPicked !== null) {
        var pdata = project(scene.glplot.cameraParams, selection.dataCoordinate);
        trace = lastPicked.data;
        var traceNow = gd._fullData[trace.index];
        var ptNumber = selection.index;

        var labels = {
            xLabel: formatter('xaxis', selection.traceCoordinate[0]),
            yLabel: formatter('yaxis', selection.traceCoordinate[1]),
            zLabel: formatter('zaxis', selection.traceCoordinate[2])
        };

        var hoverinfo = Fx.castHoverinfo(traceNow, scene.fullLayout, ptNumber);
        var hoverinfoParts = (hoverinfo || '').split('+');
        var isHoverinfoAll = hoverinfo && hoverinfo === 'all';

        if(!traceNow.hovertemplate && !isHoverinfoAll) {
            if(hoverinfoParts.indexOf('x') === -1) labels.xLabel = undefined;
            if(hoverinfoParts.indexOf('y') === -1) labels.yLabel = undefined;
            if(hoverinfoParts.indexOf('z') === -1) labels.zLabel = undefined;
            if(hoverinfoParts.indexOf('text') === -1) selection.textLabel = undefined;
            if(hoverinfoParts.indexOf('name') === -1) lastPicked.name = undefined;
        }

        var tx;
        var vectorTx = [];

        if(trace.type === 'cone' || trace.type === 'streamtube') {
            labels.uLabel = formatter('xaxis', selection.traceCoordinate[3]);
            if(isHoverinfoAll || hoverinfoParts.indexOf('u') !== -1) {
                vectorTx.push('u: ' + labels.uLabel);
            }

            labels.vLabel = formatter('yaxis', selection.traceCoordinate[4]);
            if(isHoverinfoAll || hoverinfoParts.indexOf('v') !== -1) {
                vectorTx.push('v: ' + labels.vLabel);
            }

            labels.wLabel = formatter('zaxis', selection.traceCoordinate[5]);
            if(isHoverinfoAll || hoverinfoParts.indexOf('w') !== -1) {
                vectorTx.push('w: ' + labels.wLabel);
            }

            labels.normLabel = selection.traceCoordinate[6].toPrecision(3);
            if(isHoverinfoAll || hoverinfoParts.indexOf('norm') !== -1) {
                vectorTx.push('norm: ' + labels.normLabel);
            }
            if(trace.type === 'streamtube') {
                labels.divergenceLabel = selection.traceCoordinate[7].toPrecision(3);
                if(isHoverinfoAll || hoverinfoParts.indexOf('divergence') !== -1) {
                    vectorTx.push('divergence: ' + labels.divergenceLabel);
                }
            }
            if(selection.textLabel) {
                vectorTx.push(selection.textLabel);
            }
            tx = vectorTx.join('<br>');
        } else if(trace.type === 'isosurface' || trace.type === 'volume') {
            labels.valueLabel = Axes.tickText(scene._mockAxis, scene._mockAxis.d2l(selection.traceCoordinate[3]), 'hover').text;
            vectorTx.push('value: ' + labels.valueLabel);
            if(selection.textLabel) {
                vectorTx.push(selection.textLabel);
            }
            tx = vectorTx.join('<br>');
        } else {
            tx = selection.textLabel;
        }

        var pointData = {
            x: selection.traceCoordinate[0],
            y: selection.traceCoordinate[1],
            z: selection.traceCoordinate[2],
            data: traceNow._input,
            fullData: traceNow,
            curveNumber: traceNow.index,
            pointNumber: ptNumber
        };

        Fx.appendArrayPointValue(pointData, traceNow, ptNumber);

        if(trace._module.eventData) {
            pointData = traceNow._module.eventData(pointData, selection, traceNow, {}, ptNumber);
        }

        var eventData = {points: [pointData]};

        if(scene.fullSceneLayout.hovermode) {
            Fx.loneHover({
                trace: traceNow,
                x: (0.5 + 0.5 * pdata[0] / pdata[3]) * width,
                y: (0.5 - 0.5 * pdata[1] / pdata[3]) * height,
                xLabel: labels.xLabel,
                yLabel: labels.yLabel,
                zLabel: labels.zLabel,
                text: tx,
                name: lastPicked.name,
                color: Fx.castHoverOption(traceNow, ptNumber, 'bgcolor') || lastPicked.color,
                borderColor: Fx.castHoverOption(traceNow, ptNumber, 'bordercolor'),
                fontFamily: Fx.castHoverOption(traceNow, ptNumber, 'font.family'),
                fontSize: Fx.castHoverOption(traceNow, ptNumber, 'font.size'),
                fontColor: Fx.castHoverOption(traceNow, ptNumber, 'font.color'),
                nameLength: Fx.castHoverOption(traceNow, ptNumber, 'namelength'),
                textAlign: Fx.castHoverOption(traceNow, ptNumber, 'align'),
                hovertemplate: Lib.castOption(traceNow, ptNumber, 'hovertemplate'),
                hovertemplateLabels: Lib.extendFlat({}, pointData, labels),
                eventData: [pointData]
            }, {
                container: svgContainer,
                gd: gd
            });
        }

        if(selection.buttons && selection.distance < 5) {
            gd.emit('plotly_click', eventData);
        } else {
            gd.emit('plotly_hover', eventData);
        }

        oldEventData = eventData;
    } else {
        Fx.loneUnhover(svgContainer);
        gd.emit('plotly_unhover', oldEventData);
    }

    scene.drawAnnotations(scene);
};

proto.recoverContext = function() {
    var scene = this;

    scene.glplot.dispose();

    var tryRecover = function() {
        if(scene.glplot.gl.isContextLost()) {
            requestAnimationFrame(tryRecover);
            return;
        }
        if(!scene.initializeGLPlot()) {
            Lib.error('Catastrophic and unrecoverable WebGL error. Context lost.');
            return;
        }
        scene.plot.apply(scene, scene.plotArgs);
    };

    requestAnimationFrame(tryRecover);
};

var axisProperties = [ 'xaxis', 'yaxis', 'zaxis' ];

function computeTraceBounds(scene, trace, bounds) {
    var fullSceneLayout = scene.fullSceneLayout;

    for(var d = 0; d < 3; d++) {
        var axisName = axisProperties[d];
        var axLetter = axisName.charAt(0);
        var ax = fullSceneLayout[axisName];
        var coords = trace[axLetter];
        var calendar = trace[axLetter + 'calendar'];
        var len = trace['_' + axLetter + 'length'];

        if(!Lib.isArrayOrTypedArray(coords)) {
            bounds[0][d] = Math.min(bounds[0][d], 0);
            bounds[1][d] = Math.max(bounds[1][d], len - 1);
        } else {
            var v;

            for(var i = 0; i < (len || coords.length); i++) {
                if(Lib.isArrayOrTypedArray(coords[i])) {
                    for(var j = 0; j < coords[i].length; ++j) {
                        v = ax.d2l(coords[i][j], 0, calendar);
                        if(!isNaN(v) && isFinite(v)) {
                            bounds[0][d] = Math.min(bounds[0][d], v);
                            bounds[1][d] = Math.max(bounds[1][d], v);
                        }
                    }
                } else {
                    v = ax.d2l(coords[i], 0, calendar);
                    if(!isNaN(v) && isFinite(v)) {
                        bounds[0][d] = Math.min(bounds[0][d], v);
                        bounds[1][d] = Math.max(bounds[1][d], v);
                    }
                }
            }
        }
    }
}

function computeAnnotationBounds(scene, bounds) {
    var fullSceneLayout = scene.fullSceneLayout;
    var annotations = fullSceneLayout.annotations || [];

    for(var d = 0; d < 3; d++) {
        var axisName = axisProperties[d];
        var axLetter = axisName.charAt(0);
        var ax = fullSceneLayout[axisName];

        for(var j = 0; j < annotations.length; j++) {
            var ann = annotations[j];

            if(ann.visible) {
                var pos = ax.r2l(ann[axLetter]);
                if(!isNaN(pos) && isFinite(pos)) {
                    bounds[0][d] = Math.min(bounds[0][d], pos);
                    bounds[1][d] = Math.max(bounds[1][d], pos);
                }
            }
        }
    }
}

proto.plot = function(sceneData, fullLayout, layout) {
    var scene = this;

    // Save parameters
    scene.plotArgs = [sceneData, fullLayout, layout];

    if(scene.glplot.contextLost) return;

    var data, trace;
    var i, j, axis, axisType;
    var fullSceneLayout = fullLayout[scene.id];
    var sceneLayout = layout[scene.id];

    // Update layout
    scene.fullLayout = fullLayout;
    scene.fullSceneLayout = fullSceneLayout;

    scene.axesOptions.merge(fullLayout, fullSceneLayout);
    scene.spikeOptions.merge(fullSceneLayout);

    // Update camera and camera mode
    scene.setViewport(fullSceneLayout);
    scene.updateFx(fullSceneLayout.dragmode, fullSceneLayout.hovermode);
    scene.camera.enableWheel = scene.graphDiv._context._scrollZoom.gl3d;

    // Update scene background
    scene.glplot.setClearColor(str2RGBAarray(fullSceneLayout.bgcolor));

    // Update axes functions BEFORE updating traces
    scene.setConvert(axis);

    // Convert scene data
    if(!sceneData) sceneData = [];
    else if(!Array.isArray(sceneData)) sceneData = [sceneData];

    // Compute trace bounding box
    var dataBounds = [
        [Infinity, Infinity, Infinity],
        [-Infinity, -Infinity, -Infinity]
    ];

    for(i = 0; i < sceneData.length; ++i) {
        data = sceneData[i];
        if(data.visible !== true || data._length === 0) continue;

        computeTraceBounds(this, data, dataBounds);
    }
    computeAnnotationBounds(this, dataBounds);

    var dataScale = [1, 1, 1];
    for(j = 0; j < 3; ++j) {
        if(dataBounds[1][j] === dataBounds[0][j]) {
            dataScale[j] = 1.0;
        } else {
            dataScale[j] = 1.0 / (dataBounds[1][j] - dataBounds[0][j]);
        }
    }

    // Save scale
    scene.dataScale = dataScale;

    // after computeTraceBounds where ax._categories are filled in
    scene.convertAnnotations(this);

    // Update traces
    for(i = 0; i < sceneData.length; ++i) {
        data = sceneData[i];
        if(data.visible !== true || data._length === 0) {
            continue;
        }
        trace = scene.traces[data.uid];
        if(trace) {
            if(trace.data.type === data.type) {
                trace.update(data);
            } else {
                trace.dispose();
                trace = data._module.plot(this, data);
                scene.traces[data.uid] = trace;
            }
        } else {
            trace = data._module.plot(this, data);
            scene.traces[data.uid] = trace;
        }
        trace.name = data.name;
    }

    // Remove empty traces
    var traceIds = Object.keys(scene.traces);

    traceIdLoop:
    for(i = 0; i < traceIds.length; ++i) {
        for(j = 0; j < sceneData.length; ++j) {
            if(sceneData[j].uid === traceIds[i] &&
                (sceneData[j].visible === true && sceneData[j]._length !== 0)) {
                continue traceIdLoop;
            }
        }
        trace = scene.traces[traceIds[i]];
        trace.dispose();
        delete scene.traces[traceIds[i]];
    }

    // order object per trace index
    scene.glplot.objects.sort(function(a, b) {
        return a._trace.data.index - b._trace.data.index;
    });

    // Update ranges (needs to be called *after* objects are added due to updates)
    var sceneBounds = [[0, 0, 0], [0, 0, 0]];
    var axisDataRange = [];
    var axisTypeRatios = {};

    for(i = 0; i < 3; ++i) {
        axis = fullSceneLayout[axisProperties[i]];
        axisType = axis.type;

        if(axisType in axisTypeRatios) {
            axisTypeRatios[axisType].acc *= dataScale[i];
            axisTypeRatios[axisType].count += 1;
        } else {
            axisTypeRatios[axisType] = {
                acc: dataScale[i],
                count: 1
            };
        }

        if(axis.autorange) {
            sceneBounds[0][i] = Infinity;
            sceneBounds[1][i] = -Infinity;

            var objects = scene.glplot.objects;
            var annotations = scene.fullSceneLayout.annotations || [];
            var axLetter = axis._name.charAt(0);

            for(j = 0; j < objects.length; j++) {
                var obj = objects[j];
                var objBounds = obj.bounds;
                var pad = obj._trace.data._pad || 0;

                if(obj.constructor.name === 'ErrorBars' && axis._lowerLogErrorBound) {
                    sceneBounds[0][i] = Math.min(sceneBounds[0][i], axis._lowerLogErrorBound);
                } else {
                    sceneBounds[0][i] = Math.min(sceneBounds[0][i], objBounds[0][i] / dataScale[i] - pad);
                }
                sceneBounds[1][i] = Math.max(sceneBounds[1][i], objBounds[1][i] / dataScale[i] + pad);
            }

            for(j = 0; j < annotations.length; j++) {
                var ann = annotations[j];

                // N.B. not taking into consideration the arrowhead
                if(ann.visible) {
                    var pos = axis.r2l(ann[axLetter]);
                    sceneBounds[0][i] = Math.min(sceneBounds[0][i], pos);
                    sceneBounds[1][i] = Math.max(sceneBounds[1][i], pos);
                }
            }

            if('rangemode' in axis && axis.rangemode === 'tozero') {
                sceneBounds[0][i] = Math.min(sceneBounds[0][i], 0);
                sceneBounds[1][i] = Math.max(sceneBounds[1][i], 0);
            }
            if(sceneBounds[0][i] > sceneBounds[1][i]) {
                sceneBounds[0][i] = -1;
                sceneBounds[1][i] = 1;
            } else {
                var d = sceneBounds[1][i] - sceneBounds[0][i];
                sceneBounds[0][i] -= d / 32.0;
                sceneBounds[1][i] += d / 32.0;
            }

            if(axis.autorange === 'reversed') {
                // swap bounds:
                var tmp = sceneBounds[0][i];
                sceneBounds[0][i] = sceneBounds[1][i];
                sceneBounds[1][i] = tmp;
            }
        } else {
            var range = axis.range;
            sceneBounds[0][i] = axis.r2l(range[0]);
            sceneBounds[1][i] = axis.r2l(range[1]);
        }
        if(sceneBounds[0][i] === sceneBounds[1][i]) {
            sceneBounds[0][i] -= 1;
            sceneBounds[1][i] += 1;
        }
        axisDataRange[i] = sceneBounds[1][i] - sceneBounds[0][i];

        // Update plot bounds
        scene.glplot.setBounds(i, {
            min: sceneBounds[0][i] * dataScale[i],
            max: sceneBounds[1][i] * dataScale[i]
        });
    }

    /*
     * Dynamically set the aspect ratio depending on the users aspect settings
     */
    var aspectRatio;
    var aspectmode = fullSceneLayout.aspectmode;
    if(aspectmode === 'cube') {
        aspectRatio = [1, 1, 1];
    } else if(aspectmode === 'manual') {
        var userRatio = fullSceneLayout.aspectratio;
        aspectRatio = [userRatio.x, userRatio.y, userRatio.z];
    } else if(aspectmode === 'auto' || aspectmode === 'data') {
        var axesScaleRatio = [1, 1, 1];
        // Compute axis scale per category
        for(i = 0; i < 3; ++i) {
            axis = fullSceneLayout[axisProperties[i]];
            axisType = axis.type;
            var axisRatio = axisTypeRatios[axisType];
            axesScaleRatio[i] = Math.pow(axisRatio.acc, 1.0 / axisRatio.count) / dataScale[i];
        }

        if(aspectmode === 'data') {
            aspectRatio = axesScaleRatio;
        } else { // i.e. 'auto' option
            if(
                Math.max.apply(null, axesScaleRatio) /
                Math.min.apply(null, axesScaleRatio) <= 4
            ) {
                // USE DATA MODE WHEN AXIS RANGE DIMENSIONS ARE RELATIVELY EQUAL
                aspectRatio = axesScaleRatio;
            } else {
                // USE EQUAL MODE WHEN AXIS RANGE DIMENSIONS ARE HIGHLY UNEQUAL
                aspectRatio = [1, 1, 1];
            }
        }
    } else {
        throw new Error('scene.js aspectRatio was not one of the enumerated types');
    }

    /*
     * Write aspect Ratio back to user data and fullLayout so that it is modifies as user
     * manipulates the aspectmode settings and the fullLayout is up-to-date.
     */
    fullSceneLayout.aspectratio.x = sceneLayout.aspectratio.x = aspectRatio[0];
    fullSceneLayout.aspectratio.y = sceneLayout.aspectratio.y = aspectRatio[1];
    fullSceneLayout.aspectratio.z = sceneLayout.aspectratio.z = aspectRatio[2];

    /*
     * Finally assign the computed aspecratio to the glplot module. This will have an effect
     * on the next render cycle.
     */
    scene.glplot.setAspectratio(fullSceneLayout.aspectratio);

    // save 'initial' aspectratio & aspectmode view settings for modebar buttons
    if(!scene.viewInitial.aspectratio) {
        scene.viewInitial.aspectratio = {
            x: fullSceneLayout.aspectratio.x,
            y: fullSceneLayout.aspectratio.y,
            z: fullSceneLayout.aspectratio.z
        };
    }
    if(!scene.viewInitial.aspectmode) {
        scene.viewInitial.aspectmode = fullSceneLayout.aspectmode;
    }

    // Update frame position for multi plots
    var domain = fullSceneLayout.domain || null;
    var size = fullLayout._size || null;

    if(domain && size) {
        var containerStyle = scene.container.style;
        containerStyle.position = 'absolute';
        containerStyle.left = (size.l + domain.x[0] * size.w) + 'px';
        containerStyle.top = (size.t + (1 - domain.y[1]) * size.h) + 'px';
        containerStyle.width = (size.w * (domain.x[1] - domain.x[0])) + 'px';
        containerStyle.height = (size.h * (domain.y[1] - domain.y[0])) + 'px';
    }

    // force redraw so that promise is returned when rendering is completed
    scene.glplot.redraw();
};

proto.destroy = function() {
    var scene = this;

    if(!scene.glplot) return;
    scene.camera.mouseListener.enabled = false;
    scene.container.removeEventListener('wheel', scene.camera.wheelListener);
    scene.camera = null;
    scene.glplot.dispose();
    scene.container.parentNode.removeChild(scene.container);
    scene.glplot = null;
};

// getCameraArrays :: plotly_coords -> gl-plot3d_coords
// inverse of getLayoutCamera
function getCameraArrays(camera) {
    return [
        [camera.eye.x, camera.eye.y, camera.eye.z],
        [camera.center.x, camera.center.y, camera.center.z],
        [camera.up.x, camera.up.y, camera.up.z]
    ];
}

// getLayoutCamera :: gl-plot3d_coords -> plotly_coords
// inverse of getCameraArrays
function getLayoutCamera(camera) {
    return {
        up: {x: camera.up[0], y: camera.up[1], z: camera.up[2]},
        center: {x: camera.center[0], y: camera.center[1], z: camera.center[2]},
        eye: {x: camera.eye[0], y: camera.eye[1], z: camera.eye[2]},
        projection: {type: (camera._ortho === true) ? 'orthographic' : 'perspective'}
    };
}

// get camera position in plotly coords from 'gl-plot3d' coords
proto.getCamera = function() {
    var scene = this;
    scene.camera.view.recalcMatrix(scene.camera.view.lastT());
    return getLayoutCamera(scene.camera);
};

// set gl-plot3d camera position and scene aspects with a set of plotly coords
proto.setViewport = function(sceneLayout) {
    var scene = this;
    var cameraData = sceneLayout.camera;

    scene.camera.lookAt.apply(this, getCameraArrays(cameraData));
    scene.glplot.setAspectratio(sceneLayout.aspectratio);

    var newOrtho = (cameraData.projection.type === 'orthographic');
    var oldOrtho = scene.camera._ortho;

    if(newOrtho !== oldOrtho) {
        scene.glplot.redraw(); // TODO: figure out why we need to redraw here?
        scene.glplot.clearRGBA();
        scene.glplot.dispose();
        scene.initializeGLPlot();
    }
};

proto.isCameraChanged = function(layout) {
    var scene = this;
    var cameraData = scene.getCamera();
    var cameraNestedProp = Lib.nestedProperty(layout, scene.id + '.camera');
    var cameraDataLastSave = cameraNestedProp.get();

    function same(x, y, i, j) {
        var vectors = ['up', 'center', 'eye'];
        var components = ['x', 'y', 'z'];
        return y[vectors[i]] && (x[vectors[i]][components[j]] === y[vectors[i]][components[j]]);
    }

    var changed = false;
    if(cameraDataLastSave === undefined) {
        changed = true;
    } else {
        for(var i = 0; i < 3; i++) {
            for(var j = 0; j < 3; j++) {
                if(!same(cameraData, cameraDataLastSave, i, j)) {
                    changed = true;
                    break;
                }
            }
        }

        if(!cameraDataLastSave.projection || (
            cameraData.projection &&
            cameraData.projection.type !== cameraDataLastSave.projection.type)) {
            changed = true;
        }
    }

    return changed;
};

proto.isAspectChanged = function(layout) {
    var scene = this;
    var aspectData = scene.glplot.getAspectratio();
    var aspectNestedProp = Lib.nestedProperty(layout, scene.id + '.aspectratio');
    var aspectDataLastSave = aspectNestedProp.get();

    return (
        aspectDataLastSave === undefined || (
        aspectDataLastSave.x !== aspectData.x ||
        aspectDataLastSave.y !== aspectData.y ||
        aspectDataLastSave.z !== aspectData.z
    ));
};

// save camera to user layout (i.e. gd.layout)
proto.saveLayout = function(layout) {
    var scene = this;
    var fullLayout = scene.fullLayout;

    var cameraData;
    var cameraNestedProp;
    var cameraDataLastSave;

    var aspectData;
    var aspectNestedProp;
    var aspectDataLastSave;

    var cameraChanged = scene.isCameraChanged(layout);
    var aspectChanged = scene.isAspectChanged(layout);

    var hasChanged = cameraChanged || aspectChanged;
    if(hasChanged) {
        var preGUI = {};
        if(cameraChanged) {
            cameraData = scene.getCamera();
            cameraNestedProp = Lib.nestedProperty(layout, scene.id + '.camera');
            cameraDataLastSave = cameraNestedProp.get();

            preGUI[scene.id + '.camera'] = cameraDataLastSave;
        }
        if(aspectChanged) {
            aspectData = scene.glplot.getAspectratio();
            aspectNestedProp = Lib.nestedProperty(layout, scene.id + '.aspectratio');
            aspectDataLastSave = aspectNestedProp.get();

            preGUI[scene.id + '.aspectratio'] = aspectDataLastSave;
        }
        Registry.call('_storeDirectGUIEdit', layout, fullLayout._preGUI, preGUI);

        if(cameraChanged) {
            cameraNestedProp.set(cameraData);

            var cameraFullNP = Lib.nestedProperty(fullLayout, scene.id + '.camera');
            cameraFullNP.set(cameraData);
        }

        if(aspectChanged) {
            aspectNestedProp.set(aspectData);

            var aspectFullNP = Lib.nestedProperty(fullLayout, scene.id + '.aspectratio');
            aspectFullNP.set(aspectData);

            scene.glplot.redraw();
        }
    }

    return hasChanged;
};

proto.updateFx = function(dragmode, hovermode) {
    var scene = this;
    var camera = scene.camera;
    if(camera) {
        // rotate and orbital are synonymous
        if(dragmode === 'orbit') {
            camera.mode = 'orbit';
            camera.keyBindingMode = 'rotate';
        } else if(dragmode === 'turntable') {
            camera.up = [0, 0, 1];
            camera.mode = 'turntable';
            camera.keyBindingMode = 'rotate';

            // The setter for camera.mode animates the transition to z-up,
            // but only if we *don't* explicitly set z-up earlier via the
            // relayout. So push `up` back to layout & fullLayout manually now.
            var gd = scene.graphDiv;
            var fullLayout = gd._fullLayout;
            var fullCamera = scene.fullSceneLayout.camera;
            var x = fullCamera.up.x;
            var y = fullCamera.up.y;
            var z = fullCamera.up.z;
            // only push `up` back to (full)layout if it's going to change
            if(z / Math.sqrt(x * x + y * y + z * z) < 0.999) {
                var attr = scene.id + '.camera.up';
                var zUp = {x: 0, y: 0, z: 1};
                var edits = {};
                edits[attr] = zUp;
                var layout = gd.layout;
                Registry.call('_storeDirectGUIEdit', layout, fullLayout._preGUI, edits);
                fullCamera.up = zUp;
                Lib.nestedProperty(layout, attr).set(zUp);
            }
        } else {
            // none rotation modes [pan or zoom]
            camera.keyBindingMode = dragmode;
        }
    }

    // to put dragmode and hovermode on the same grounds from relayout
    scene.fullSceneLayout.hovermode = hovermode;
};

function flipPixels(pixels, w, h) {
    for(var i = 0, q = h - 1; i < q; ++i, --q) {
        for(var j = 0; j < w; ++j) {
            for(var k = 0; k < 4; ++k) {
                var a = 4 * (w * i + j) + k;
                var b = 4 * (w * q + j) + k;
                var tmp = pixels[a];
                pixels[a] = pixels[b];
                pixels[b] = tmp;
            }
        }
    }
}

function correctRGB(pixels, w, h) {
    for(var i = 0; i < h; ++i) {
        for(var j = 0; j < w; ++j) {
            var k = 4 * (w * i + j);

            var a = pixels[k + 3]; // alpha
            if(a > 0) {
                var q = 255 / a;

                for(var l = 0; l < 3; ++l) { // RGB
                    pixels[k + l] = Math.min(q * pixels[k + l], 255);
                }
            }
        }
    }
}

proto.toImage = function(format) {
    var scene = this;

    if(!format) format = 'png';
    if(scene.staticMode) scene.container.appendChild(STATIC_CANVAS);

    // Force redraw
    scene.glplot.redraw();

    // Grab context and yank out pixels
    var gl = scene.glplot.gl;
    var w = gl.drawingBufferWidth;
    var h = gl.drawingBufferHeight;

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    var pixels = new Uint8Array(w * h * 4);
    gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    flipPixels(pixels, w, h);
    correctRGB(pixels, w, h);

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

    if(scene.staticMode) scene.container.removeChild(STATIC_CANVAS);

    return dataURL;
};

proto.setConvert = function() {
    var scene = this;
    for(var i = 0; i < 3; i++) {
        var ax = scene.fullSceneLayout[axisProperties[i]];
        Axes.setConvert(ax, scene.fullLayout);
        ax.setScale = Lib.noop;
    }
};

proto.make4thDimension = function() {
    var scene = this;
    var gd = scene.graphDiv;
    var fullLayout = gd._fullLayout;

    // mock axis for hover formatting
    scene._mockAxis = {
        type: 'linear',
        showexponent: 'all',
        exponentformat: 'B'
    };
    Axes.setConvert(scene._mockAxis, fullLayout);
};

module.exports = Scene;
