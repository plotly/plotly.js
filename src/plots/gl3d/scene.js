/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var createPlot = require('gl-plot3d');

var Lib = require('../../lib');

var Plots = require('../../plots/plots');
var Axes = require('../../plots/cartesian/axes');
var Fx = require('../../plots/cartesian/graph_interact');

var str2RGBAarray = require('../../lib/str2rgbarray');
var showNoWebGlMsg = require('../../lib/show_no_webgl_msg');

var createCamera = require('./camera');
var project = require('./project');
var setConvert = require('./set_convert');
var createAxesOptions = require('./layout/convert');
var createSpikeOptions = require('./layout/spikes');
var computeTickMarks = require('./layout/tick_marks');

var STATIC_CANVAS, STATIC_CONTEXT;

function render(scene) {

    var trace;

    // update size of svg container
    var svgContainer = scene.svgContainer;
    var clientRect = scene.container.getBoundingClientRect();
    var width = clientRect.width, height = clientRect.height;
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
        if(trace.handlePick(selection)) {
            lastPicked = trace;
        }

        if(trace.setContourLevels) trace.setContourLevels();
    }

    function formatter(axisName, val) {
        if(typeof val === 'string') return val;

        var axis = scene.fullSceneLayout[axisName];
        return Axes.tickText(axis, axis.c2l(val), 'hover').text;
    }

    var oldEventData;

    if(lastPicked !== null) {
        var pdata = project(scene.glplot.cameraParams, selection.dataCoordinate);
        trace = lastPicked.data;
        var hoverinfo = trace.hoverinfo;

        var xVal = formatter('xaxis', selection.traceCoordinate[0]),
            yVal = formatter('yaxis', selection.traceCoordinate[1]),
            zVal = formatter('zaxis', selection.traceCoordinate[2]);

        if(hoverinfo !== 'all') {
            var hoverinfoParts = hoverinfo.split('+');
            if(hoverinfoParts.indexOf('x') === -1) xVal = undefined;
            if(hoverinfoParts.indexOf('y') === -1) yVal = undefined;
            if(hoverinfoParts.indexOf('z') === -1) zVal = undefined;
            if(hoverinfoParts.indexOf('text') === -1) selection.textLabel = undefined;
            if(hoverinfoParts.indexOf('name') === -1) lastPicked.name = undefined;
        }

        if(scene.fullSceneLayout.hovermode) {
            Fx.loneHover({
                x: (0.5 + 0.5 * pdata[0] / pdata[3]) * width,
                y: (0.5 - 0.5 * pdata[1] / pdata[3]) * height,
                xLabel: xVal,
                yLabel: yVal,
                zLabel: zVal,
                text: selection.textLabel,
                name: lastPicked.name,
                color: lastPicked.color
            }, {
                container: svgContainer
            });
        }

        var eventData = {
            points: [{
                x: xVal,
                y: yVal,
                z: zVal,
                data: trace._input,
                fullData: trace,
                curveNumber: trace.index,
                pointNumber: selection.data.index
            }]
        };

        if(selection.buttons && selection.distance < 5) {
            scene.graphDiv.emit('plotly_click', eventData);
        }
        else {
            scene.graphDiv.emit('plotly_hover', eventData);
        }

        oldEventData = eventData;
    }
    else {
        Fx.loneUnhover(svgContainer);
        scene.graphDiv.emit('plotly_unhover', oldEventData);
    }
}

function initializeGLPlot(scene, fullLayout, canvas, gl) {
    var glplotOptions = {
        canvas: canvas,
        gl: gl,
        container: scene.container,
        axes: scene.axesOptions,
        spikes: scene.spikeOptions,
        pickRadius: 10,
        snapToData: true,
        autoScale: true,
        autoBounds: false
    };

    // for static plots, we reuse the WebGL context
    //  as WebKit doesn't collect them reliably
    if(scene.staticMode) {
        if(!STATIC_CONTEXT) {
            STATIC_CANVAS = document.createElement('canvas');
            try {
                STATIC_CONTEXT = STATIC_CANVAS.getContext('webgl', {
                    preserveDrawingBuffer: true,
                    premultipliedAlpha: true,
                    antialias: true
                });
            } catch(e) {
                throw new Error('error creating static canvas/context for image server');
            }
        }
        glplotOptions.pixelRatio = scene.pixelRatio;
        glplotOptions.gl = STATIC_CONTEXT;
        glplotOptions.canvas = STATIC_CANVAS;
    }

    try {
        scene.glplot = createPlot(glplotOptions);
    }
    catch(e) {
        /*
        * createPlot will throw when webgl is not enabled in the client.
        * Lets return an instance of the module with all functions noop'd.
        * The destroy method - which will remove the container from the DOM
        * is overridden with a function that removes the container only.
        */
        showNoWebGlMsg(scene);
    }

    var relayoutCallback = function(scene) {
        var update = {};
        update[scene.id] = getLayoutCamera(scene.camera);
        scene.saveCamera(scene.graphDiv.layout);
        scene.graphDiv.emit('plotly_relayout', update);
    };

    scene.glplot.canvas.addEventListener('mouseup', relayoutCallback.bind(null, scene));
    scene.glplot.canvas.addEventListener('wheel', relayoutCallback.bind(null, scene));

    if(!scene.staticMode) {
        scene.glplot.canvas.addEventListener('webglcontextlost', function(ev) {
            Lib.warn('Lost WebGL context.');
            ev.preventDefault();
        });
    }

    if(!scene.camera) {
        var cameraData = scene.fullSceneLayout.camera;
        scene.camera = createCamera(scene.container, {
            center: [cameraData.center.x, cameraData.center.y, cameraData.center.z],
            eye: [cameraData.eye.x, cameraData.eye.y, cameraData.eye.z],
            up: [cameraData.up.x, cameraData.up.y, cameraData.up.z],
            zoomMin: 0.1,
            zoomMax: 100,
            mode: 'orbit'
        });
    }

    scene.glplot.mouseListener.enabled = false;
    scene.glplot.camera = scene.camera;

    scene.glplot.oncontextloss = function() {
        scene.recoverContext();
    };

    scene.glplot.onrender = render.bind(null, scene);

    //List of scene objects
    scene.traces = {};

    return true;
}

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

    //Saved from last call to plot()
    this.plotArgs = [ [], {}, {} ];

    /*
     * Move this to calc step? Why does it work here?
     */
    this.axesOptions = createAxesOptions(fullLayout[this.id]);
    this.spikeOptions = createSpikeOptions(fullLayout[this.id]);
    this.container = sceneContainer;
    this.staticMode = !!options.staticPlot;
    this.pixelRatio = options.plotGlPixelRatio || 2;

    //Coordinate rescaling
    this.dataScale = [1, 1, 1];

    this.contourLevels = [ [], [], [] ];

    if(!initializeGLPlot(this, fullLayout)) return; // todo check the necessity for this line
}

var proto = Scene.prototype;

proto.recoverContext = function() {
    var scene = this;
    var gl = this.glplot.gl;
    var canvas = this.glplot.canvas;
    this.glplot.dispose();

    function tryRecover() {
        if(gl.isContextLost()) {
            requestAnimationFrame(tryRecover);
            return;
        }
        if(!initializeGLPlot(scene, scene.fullLayout, canvas, gl)) {
            Lib.error('Catastrophic and unrecoverable WebGL error. Context lost.');
            return;
        }
        scene.plot.apply(scene, scene.plotArgs);
    }
    requestAnimationFrame(tryRecover);
};

var axisProperties = [ 'xaxis', 'yaxis', 'zaxis' ];

function coordinateBound(axis, coord, d, bounds) {
    var x;
    for(var i = 0; i < coord.length; ++i) {
        if(Array.isArray(coord[i])) {
            for(var j = 0; j < coord[i].length; ++j) {
                x = axis.d2l(coord[i][j]);
                if(!isNaN(x) && isFinite(x)) {
                    bounds[0][d] = Math.min(bounds[0][d], x);
                    bounds[1][d] = Math.max(bounds[1][d], x);
                }
            }
        }
        else {
            x = axis.d2l(coord[i]);
            if(!isNaN(x) && isFinite(x)) {
                bounds[0][d] = Math.min(bounds[0][d], x);
                bounds[1][d] = Math.max(bounds[1][d], x);
            }
        }
    }
}

function computeTraceBounds(scene, trace, bounds) {
    var sceneLayout = scene.fullSceneLayout;
    coordinateBound(sceneLayout.xaxis, trace.x, 0, bounds);
    coordinateBound(sceneLayout.yaxis, trace.y, 1, bounds);
    coordinateBound(sceneLayout.zaxis, trace.z, 2, bounds);
}

proto.plot = function(sceneData, fullLayout, layout) {
    //Save parameters
    this.plotArgs = [sceneData, fullLayout, layout];

    if(this.glplot.contextLost) return;

    var data, trace;
    var i, j, axis, axisType;
    var fullSceneLayout = fullLayout[this.id];
    var sceneLayout = layout[this.id];

    if(fullSceneLayout.bgcolor) this.glplot.clearColor = str2RGBAarray(fullSceneLayout.bgcolor);
    else this.glplot.clearColor = [0, 0, 0, 0];

    this.glplot.snapToData = true;

    //Update layout
    this.fullSceneLayout = fullSceneLayout;

    this.glplotLayout = fullSceneLayout;
    this.axesOptions.merge(fullSceneLayout);
    this.spikeOptions.merge(fullSceneLayout);

    // Update camera mode
    this.updateFx(fullSceneLayout.dragmode, fullSceneLayout.hovermode);

    //Update scene
    this.glplot.update({});

    // Update axes functions BEFORE updating traces
    for(i = 0; i < 3; ++i) {
        axis = fullSceneLayout[axisProperties[i]];
        setConvert(axis);
    }

    //Convert scene data
    if(!sceneData) sceneData = [];
    else if(!Array.isArray(sceneData)) sceneData = [sceneData];

    //Compute trace bounding box
    var dataBounds = [
        [Infinity, Infinity, Infinity],
        [-Infinity, -Infinity, -Infinity]
    ];
    for(i = 0; i < sceneData.length; ++i) {
        data = sceneData[i];
        if(data.visible !== true) continue;

        computeTraceBounds(this, data, dataBounds);
    }
    var dataScale = [1, 1, 1];
    for(j = 0; j < 3; ++j) {
        if(dataBounds[0][j] > dataBounds[1][j]) {
            dataScale[j] = 1.0;
        }
        else {
            if(dataBounds[1][j] === dataBounds[0][j]) {
                dataScale[j] = 1.0;
            }
            else {
                dataScale[j] = 1.0 / (dataBounds[1][j] - dataBounds[0][j]);
            }
        }
    }

    //Save scale
    this.dataScale = dataScale;

    //Update traces
    for(i = 0; i < sceneData.length; ++i) {
        data = sceneData[i];
        if(data.visible !== true) {
            continue;
        }
        trace = this.traces[data.uid];
        if(trace) {
            trace.update(data);
        } else {
            var traceModule = Plots.getModule(data.type);
            trace = traceModule.plot(this, data);
            this.traces[data.uid] = trace;
        }
        trace.name = data.name;
    }

    //Remove empty traces
    var traceIds = Object.keys(this.traces);

    trace_id_loop:
    for(i = 0; i < traceIds.length; ++i) {
        for(j = 0; j < sceneData.length; ++j) {
            if(sceneData[j].uid === traceIds[i] && sceneData[j].visible === true) {
                continue trace_id_loop;
            }
        }
        trace = this.traces[traceIds[i]];
        trace.dispose();
        delete this.traces[traceIds[i]];
    }

    //Update ranges (needs to be called *after* objects are added due to updates)
    var sceneBounds = [[0, 0, 0], [0, 0, 0]],
        axisDataRange = [],
        axisTypeRatios = {};

    for(i = 0; i < 3; ++i) {
        axis = fullSceneLayout[axisProperties[i]];
        axisType = axis.type;

        if(axisType in axisTypeRatios) {
            axisTypeRatios[axisType].acc *= dataScale[i];
            axisTypeRatios[axisType].count += 1;
        }
        else {
            axisTypeRatios[axisType] = {
                acc: dataScale[i],
                count: 1
            };
        }

        if(axis.autorange) {
            sceneBounds[0][i] = Infinity;
            sceneBounds[1][i] = -Infinity;
            for(j = 0; j < this.glplot.objects.length; ++j) {
                var objBounds = this.glplot.objects[j].bounds;
                sceneBounds[0][i] = Math.min(sceneBounds[0][i],
                  objBounds[0][i] / dataScale[i]);
                sceneBounds[1][i] = Math.max(sceneBounds[1][i],
                  objBounds[1][i] / dataScale[i]);
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
        } else {
            var range = fullSceneLayout[axisProperties[i]].range;
            sceneBounds[0][i] = range[0];
            sceneBounds[1][i] = range[1];
        }
        if(sceneBounds[0][i] === sceneBounds[1][i]) {
            sceneBounds[0][i] -= 1;
            sceneBounds[1][i] += 1;
        }
        axisDataRange[i] = sceneBounds[1][i] - sceneBounds[0][i];

        //Update plot bounds
        this.glplot.bounds[0][i] = sceneBounds[0][i] * dataScale[i];
        this.glplot.bounds[1][i] = sceneBounds[1][i] * dataScale[i];
    }

    var axesScaleRatio = [1, 1, 1];

    //Compute axis scale per category
    for(i = 0; i < 3; ++i) {
        axis = fullSceneLayout[axisProperties[i]];
        axisType = axis.type;
        var axisRatio = axisTypeRatios[axisType];
        axesScaleRatio[i] = Math.pow(axisRatio.acc, 1.0 / axisRatio.count) / dataScale[i];
    }

    /*
     * Dynamically set the aspect ratio depending on the users aspect settings
     */
    var axisAutoScaleFactor = 4;
    var aspectRatio;

    if(fullSceneLayout.aspectmode === 'auto') {

        if(Math.max.apply(null, axesScaleRatio) / Math.min.apply(null, axesScaleRatio) <= axisAutoScaleFactor) {

            /*
             * USE DATA MODE WHEN AXIS RANGE DIMENSIONS ARE RELATIVELY EQUAL
             */

            aspectRatio = axesScaleRatio;
        } else {

            /*
             * USE EQUAL MODE WHEN AXIS RANGE DIMENSIONS ARE HIGHLY UNEQUAL
             */
            aspectRatio = [1, 1, 1];
        }

    } else if(fullSceneLayout.aspectmode === 'cube') {
        aspectRatio = [1, 1, 1];

    } else if(fullSceneLayout.aspectmode === 'data') {
        aspectRatio = axesScaleRatio;

    } else if(fullSceneLayout.aspectmode === 'manual') {
        var userRatio = fullSceneLayout.aspectratio;
        aspectRatio = [userRatio.x, userRatio.y, userRatio.z];

    } else {
        throw new Error('scene.js aspectRatio was not one of the enumerated types');
    }

    /*
     * Write aspect Ratio back to user data and fullLayout so that it is modified as user
     * manipulates the aspectmode settings and the fullLayout is up-to-date.
     */
    fullSceneLayout.aspectratio.x = sceneLayout.aspectratio.x = aspectRatio[0];
    fullSceneLayout.aspectratio.y = sceneLayout.aspectratio.y = aspectRatio[1];
    fullSceneLayout.aspectratio.z = sceneLayout.aspectratio.z = aspectRatio[2];

    /*
     * Finally assign the computed aspecratio to the glplot module. This will have an effect
     * on the next render cycle.
     */
    this.glplot.aspect = aspectRatio;


    //Update frame position for multi plots
    var domain = fullSceneLayout.domain || null,
        size = fullLayout._size || null;

    if(domain && size) {
        var containerStyle = this.container.style;
        containerStyle.position = 'absolute';
        containerStyle.left = (size.l + domain.x[0] * size.w) + 'px';
        containerStyle.top = (size.t + (1 - domain.y[1]) * size.h) + 'px';
        containerStyle.width = (size.w * (domain.x[1] - domain.x[0])) + 'px';
        containerStyle.height = (size.h * (domain.y[1] - domain.y[0])) + 'px';
    }

    // force redraw so that promise is returned when rendering is completed
    this.glplot.redraw();
};

proto.destroy = function() {
    this.glplot.dispose();
    this.container.parentNode.removeChild(this.container);

    //Remove reference to glplot
    this.glplot = null;
};


// for reset camera button in mode bar
proto.setCameraToDefault = function setCameraToDefault() {
    // as in Gl3d.layoutAttributes

    this.setCamera({
        eye: { x: 1.25, y: 1.25, z: 1.25 },
        center: { x: 0, y: 0, z: 0 },
        up: { x: 0, y: 0, z: 1 }
    });
};

// getOrbitCamera :: plotly_coords -> orbit_camera_coords
// inverse of getLayoutCamera
function getOrbitCamera(camera) {
    return [
        [camera.eye.x, camera.eye.y, camera.eye.z],
        [camera.center.x, camera.center.y, camera.center.z],
        [camera.up.x, camera.up.y, camera.up.z]
    ];
}

// getLayoutCamera :: orbit_camera_coords -> plotly_coords
// inverse of getOrbitCamera
function getLayoutCamera(camera) {
    return {
        up: {x: camera.up[0], y: camera.up[1], z: camera.up[2]},
        center: {x: camera.center[0], y: camera.center[1], z: camera.center[2]},
        eye: {x: camera.eye[0], y: camera.eye[1], z: camera.eye[2]}
    };
}

// get camera position in plotly coords from 'orbit-camera' coords
proto.getCamera = function getCamera() {
    this.glplot.camera.view.recalcMatrix(this.camera.view.lastT());
    return getLayoutCamera(this.glplot.camera);
};

// set camera position with a set of plotly coords
proto.setCamera = function setCamera(cameraData) {

    var update = {};

    update[this.id] = cameraData;

    this.glplot.camera.lookAt.apply(this, getOrbitCamera(cameraData));
    this.graphDiv.emit('plotly_relayout', update);
};

// save camera to user layout (i.e. gd.layout)
proto.saveCamera = function saveCamera(layout) {
    var cameraData = this.getCamera(),
        cameraNestedProp = Lib.nestedProperty(layout, this.id + '.camera'),
        cameraDataLastSave = cameraNestedProp.get(),
        hasChanged = false;

    function same(x, y, i, j) {
        var vectors = ['up', 'center', 'eye'],
            components = ['x', 'y', 'z'];
        return y[vectors[i]] && (x[vectors[i]][components[j]] === y[vectors[i]][components[j]]);
    }

    if(cameraDataLastSave === undefined) hasChanged = true;
    else {
        for(var i = 0; i < 3; i++) {
            for(var j = 0; j < 3; j++) {
                if(!same(cameraData, cameraDataLastSave, i, j)) {
                    hasChanged = true;
                    break;
                }
            }
        }
    }

    if(hasChanged) cameraNestedProp.set(cameraData);

    return hasChanged;
};

proto.updateFx = function(dragmode, hovermode) {
    var camera = this.camera;

    if(camera) {
        // rotate and orbital are synonymous
        if(dragmode === 'orbit') {
            camera.mode = 'orbit';
            camera.keyBindingMode = 'rotate';

        } else if(dragmode === 'turntable') {
            camera.up = [0, 0, 1];
            camera.mode = 'turntable';
            camera.keyBindingMode = 'rotate';

        } else {

            // none rotation modes [pan or zoom]
            camera.keyBindingMode = dragmode;
        }
    }

    // to put dragmode and hovermode on the same grounds from relayout
    this.fullSceneLayout.hovermode = hovermode;
};

proto.toImage = function(format) {
    if(!format) format = 'png';

    if(this.staticMode) this.container.appendChild(STATIC_CANVAS);

    //Force redraw
    this.glplot.redraw();

    //Grab context and yank out pixels
    var gl = this.glplot.gl;
    var w = gl.drawingBufferWidth;
    var h = gl.drawingBufferHeight;

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    var pixels = new Uint8Array(w * h * 4);
    gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

    //Flip pixels
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

    if(this.staticMode) this.container.removeChild(STATIC_CANVAS);

    return dataURL;
};

module.exports = Scene;
