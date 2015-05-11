'use strict';

var createPlot          = require('gl-plot3d'),
    m4FromQuat          = require('gl-mat4/fromQuat'),
    createAxesOptions   = require('./convert/axes'),
    createSpikeOptions  = require('./convert/spikes'),
    createScatterTrace  = require('./convert/scatter'),
    createSurfaceTrace  = require('./convert/surface'),
    computeTickMarks    = require('./lib/tick-marks'),
    createCamera        = require('./lib/camera'),
    str2RGBAarray       = require('./lib/str2rgbarray');

var STATIC_CANVAS, STATIC_CONTEXT

function render(scene) {
    computeTickMarks(scene);
    scene.glplot.axes.update(scene.axesOptions);

    var keys = Object.keys(scene.traces);
    for (var i = 0; i < keys.length; ++i) {
        var trace = scene.traces[keys[i]];
        trace.handlePick(scene.glplot.selection);

        if (trace.setContourLevels) trace.setContourLevels();
    }
}

function Scene(options) {

    //Create sub container for plot
    var sceneContainer = document.createElement('div');
    var plotContainer = options.container;

    /*
     * Tag the container with the sceneID
     */
    sceneContainer.id = options.sceneId;
    sceneContainer.style.position = 'absolute';
    sceneContainer.style.top = sceneContainer.style.left = '0px';
    sceneContainer.style.width = sceneContainer.style.height = '100%';

    plotContainer.appendChild(sceneContainer);

    this.Plotly           = options.Plotly;
    this.fullSceneLayout  = options.fullSceneLayout;
    this.fullLayout       = options.fullLayout;
    this.axesOptions      = createAxesOptions(options.fullSceneLayout);
    this.spikeOptions     = createSpikeOptions(options.fullSceneLayout);

    this.container    = sceneContainer;

    this.staticMode   = false;

    /*
     * WARNING!!!! Only set camera position on first call to plot!!!!
     * TODO remove this hack
     */
    this.hasPlotBeenCalled = false;
    this.sceneId = options.sceneId || 'scene';

    var glplotOptions = {
            container:  sceneContainer,
            axes:       this.axesOptions,
            spikes:     this.spikeOptions,
            pickRadius: 10,
            snapToData: true,
            autoScale:  true,
            autoBounds: false
    };

    //For static plots, we reuse the WebGL context as WebKit doesn't collect them
    //reliably
    if (options.imageServer) {
        if(!STATIC_CONTEXT) {
            STATIC_CANVAS = document.createElement('canvas');
            try {
                STATIC_CONTEXT = STATIC_CANVAS.getContext('webgl', {
                    preserveDrawingBuffer: true,
                    premultipliedAlpha: true
                });
            } catch(e) {
                throw new Error('error creating static canvas/context for image server')
            }
        }
        glplotOptions.pixelRatio = options.plot3dPixelRatio;
        glplotOptions.gl = STATIC_CONTEXT;
        glplotOptions.canvas = STATIC_CANVAS;
        this.staticMode = true;
    } else if(options.staticPlot) {
        glplotOptions.pixelRatio = options.plot3dPixelRatio;
        glplotOptions.glOptions = {
            preserveDrawingBuffer: true,
            premultipliedAlpha:true
        };
    }

    try {
        this.glplot = createPlot(glplotOptions);
    } catch (e) {

        /*
         * createPlot will throw when webgl is not enabled in the client.
         * Lets return an instance of the module with all functions noop'd.
         * The destroy method - which will remove the container from the DOM
         * is overridden with a function that removes the container only.
         */
        var noop = function () {};
        for (var prop in this) if (typeof this[prop] === 'function') this[prop] = noop;
        this.destroy = function () {
            this.container.parentNode.removeChild(this.container);
        };

        var div = document.createElement('div');
        div.textContent = 'Webgl is not supported by your browser - visit http://get.webgl.org for more info';
        div.style.cursor = 'pointer';
        div.style.fontSize = '24px';
        div.style.color = options.Plotly.Color.defaults[0];

        this.container.appendChild(div);
        this.container.style.background = '#FFFFFF';
        this.container.onclick = function () {
            window.open('http://get.webgl.org');
        };

        /*
         * return before setting up camera and onrender methods
         */
        return;
    }


    this.camera = createCamera(this.container, {
        center: [0, 0, 0],
        eye:    [1.25, 1.25, 1.25],
        up:     [0, 0, 1],
        zoomMin: 0.1,
        zoomMax: 100,
        mode:   'orbit'
    });

    this.glplot.camera = this.camera;

    this.glplot.onrender = render.bind(null, this);

    //List of scene objects
    this.traces = {};

    this.contourLevels = [ [], [], [] ];
}

var proto = Scene.prototype;

var axisProperties = [ 'xaxis', 'yaxis', 'zaxis' ];

proto.plot = function(sceneData, fullSceneLayout, sceneLayout) {

    var data, trace;
    var i, j;

    if (fullSceneLayout.bgcolor) this.glplot.clearColor = str2RGBAarray(fullSceneLayout.bgcolor);
    else this.glplot.clearColor = [0, 0, 0, 0];

    //Update layout
    this.glplotLayout = fullSceneLayout;
    this.axesOptions.merge(fullSceneLayout);
    this.spikeOptions.merge(fullSceneLayout);

    //Update camera position
    if(!this.hasPlotBeenCalled) {
      this.hasPlotBeenCalled = true;
      var camera = fullSceneLayout.cameraposition;
      if (camera) this.setCameraPosition(camera);
    }

    //Update scene
    this.glplot.update({});

    //Update traces
    if (sceneData) {
        if(!Array.isArray(sceneData)) sceneData = [sceneData];

        for(i = 0; i < sceneData.length; ++i) {
            data = sceneData[i];
            if(data.visible!==true) {
                continue;
            }
            trace = this.traces[data.uid];
            if(trace) {
                trace.update(data);
            } else {
                switch(data.type) {
                    case 'scatter3d':
                        trace = createScatterTrace(this, data);
                    break;

                    case 'surface':
                        trace = createSurfaceTrace(this, data);
                    break;

                    default:
                }
                this.traces[data.uid] = trace;
            }
        }
    } else {
        sceneData = [];
    }

    var traceIds = Object.keys(this.traces);
trace_id_loop:
    for(i = 0; i<traceIds.length; ++i) {
        for(j = 0; j<sceneData.length; ++j) {
            if(sceneData[j].uid === traceIds[i] && sceneData[j].visible===true) {
                continue trace_id_loop;
            }
        }
        trace = this.traces[traceIds[i]];
        trace.dispose();
        delete this.traces[traceIds[i]];
    }

    //Update ranges (needs to be called *after* objects are added due to updates)
    var sceneBounds = this.glplot.bounds,
        axisDataRange = [];

    for(i = 0; i < 3; ++i) {
        var axis = fullSceneLayout[axisProperties[i]];
        if(axis.autorange) {
            sceneBounds[0][i] = Infinity;
            sceneBounds[1][i] = -Infinity;
            for(j = 0; j < this.glplot.objects.length; ++j) {
                var objBounds = this.glplot.objects[j].bounds;
                sceneBounds[0][i] = Math.min(sceneBounds[0][i], objBounds[0][i]);
                sceneBounds[1][i] = Math.max(sceneBounds[1][i], objBounds[1][i]);
            }
            if('rangemode' in axis && axis.rangemode === 'tozero') {
                sceneBounds[0][i] = Math.min(sceneBounds[0][i], 0);
                sceneBounds[1][i] = Math.max(sceneBounds[1][i], 0);
            }
            if(sceneBounds[0][i] > sceneBounds[1][i]) {
                sceneBounds[0][i] = -1;
                sceneBounds[1][i] =  1;
            } else {
                var d = sceneBounds[1][i] - sceneBounds[0][i];
                sceneBounds[0][i] -= d/32.0;
                sceneBounds[1][i] += d/32.0;
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
    }

    var axesScaleRatio = [],
        maxRange = Math.max.apply(null, axisDataRange);

    for (i = 0; i < 3; ++i) axesScaleRatio[i] = axisDataRange[i] / maxRange;

    /*
     * Dynamically set the aspect ratio depending on the users aspect settings
     */
    var axisAutoScaleFactor = 4;
    var aspectRatio;

    if (fullSceneLayout.aspectmode === 'auto') {
        if (Math.max.apply(null, axesScaleRatio)/Math.min.apply(null, axesScaleRatio) <= axisAutoScaleFactor) {

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

    } else if (fullSceneLayout.aspectmode === 'cube') {
        aspectRatio = [1, 1, 1];

    } else if (fullSceneLayout.aspectmode === 'data') {
        aspectRatio = axesScaleRatio;

    } else if (fullSceneLayout.aspectmode === 'manual') {
        var userRatio = fullSceneLayout.aspectratio;
        aspectRatio = [userRatio.x, userRatio.y, userRatio.z];

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
    this.glplot.aspect = aspectRatio;


    //Update frame position for multi plots
    var domain = this.fullSceneLayout.domain || null,
        size = this.fullLayout._size || null;

    if (domain && size) {
        var containerStyle = this.container.style;
        containerStyle.position = 'absolute';
        containerStyle.left     = (size.l + domain.x[0] * size.w) + 'px';
        containerStyle.top      = (size.t + (1 - domain.y[1]) * size.h) + 'px';
        containerStyle.width    = (size.w * (domain.x[1] - domain.x[0])) + 'px';
        containerStyle.height   = (size.h * (domain.y[1] - domain.y[0])) + 'px';
    }
};

proto.destroy = function() {
    this.glplot.dispose();
    this.container.parentNode.removeChild(this.container);

    //Remove reference to glplot
    this.glplot = null
};


// for reset camera button in modebar
proto.setCameraToDefault = function setCameraToDefault () {
    this.glplot.camera.lookAt(
        [1.25, 1.25, 1.25],
        [0   , 0   , 0   ],
        [0   , 0   , 1   ]
    );
};

// get camera position in plotly coords from 'orbit-camera' coords
proto.getCameraPosition = function getCameraPosition () {
    this.glplot.camera.view.recalcMatrix(this.camera.view.lastT());
    return [
        this.glplot.camera.view._active.computedRotation.slice(),
        this.glplot.camera.view._active.computedCenter.slice(),
        this.glplot.camera.distance
    ];
};

// set camera position with a set of plotly coords
proto.setCameraPosition = function setCameraPosition (camera) {
    if (Array.isArray(camera) && camera.length === 3) {
        var rotation = camera[0];
        var center   = camera[1];
        var radius   = camera[2];
        var mat = m4FromQuat([], rotation);
        var eye = [];
        for(var i=0; i<3; ++i) {
            eye[i] = center[i] + radius * mat[2+4*i];
        }
        this.glplot.camera.lookAt(eye, center, [mat[1],mat[5],mat[9]]);
    }
};

// save camera position to user layout (i.e. gd.layout)
proto.saveCamera = function saveCamera(layout) {
    var cameraposition = this.getCameraPosition();
    this.Plotly.Lib.nestedProperty(layout, this.sceneId + '.cameraposition')
        .set(cameraposition);
};

proto.toImage = function (format) {
    if (!format) format = 'png';

    if(this.staticMode) {
      this.container.appendChild(STATIC_CANVAS)
    }

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
    for(var j=0,k=h-1; j<k; ++j, --k) {
        for(var i=0; i<w; ++i) {
            for(var l=0; l<4; ++l) {
                var tmp = pixels[4*(w*j+i)+l];
                pixels[4*(w*j+i)+l] = pixels[4*(w*k+i)+l];
                pixels[4*(w*k+i)+l] = tmp;
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

    switch (format) {
        case 'jpeg':
            dataURL = canvas.toDataURL('image/jpeg');
            break;
        case 'webp':
            dataURL = canvas.toDataURL('image/webp');
            break;
        default:
        dataURL = canvas.toDataURL('image/png');
    }

    if(this.staticMode) {
      this.container.removeChild(STATIC_CANVAS)
    }

    return dataURL;
};

module.exports = Scene;
