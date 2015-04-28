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

function render(scene) {
    computeTickMarks(scene);
    scene.scene.axes.update(scene.axesOptions);

    var keys = Object.keys(scene.traces);
    for(var i=0; i<keys.length; ++i) {
        var trace = scene.traces[keys[i]];
        trace.handlePick(scene.scene.selection);
        if(trace.setContourLevels) {
            trace.setContourLevels();
        }
    }
}

function Scene(options) {
    var glOptions = options.glOptions;
    if(glOptions.preserveDrawingBuffer) {
        glOptions.premultipliedAlpha = true;
    }

    this.Plotly       = options.Plotly;
    this.sceneLayout  = options.sceneLayout;
    this.fullLayout   = options.fullLayout;

    this.axesOptions  = createAxesOptions(options.sceneLayout);
    this.spikeOptions = createSpikeOptions(options.sceneLayout);

    this.container    = options.container;

    //WARNING!!!! Only set camera position on first call to plot!!!!
    this.hasPlotBeenCalled = false;

    this.sceneKey     = options.sceneKey || 'scene';

    this.scene        = createPlot({
        container:  options.container,
        glOptions:  glOptions,
        axes:       this.axesOptions,
        spikes:     this.spikeOptions,
        pickRadius: 10,
        snapToData: true,
        autoScale:  true,
        autoBounds: false
    });

    this.camera = createCamera(this.container, {
        center: [0,0,0],
        eye:    [1.25,1.25,1.25],
        up:     [0,0,1],
        zoomMin: 0.1,
        zoomMax: 100,
        mode:   'orbit'
    });

    this.scene.camera = this.camera;

    this.scene.onrender = render.bind(null, this);

    //List of scene objects
    this.traces = {};

    this.contourLevels = [ [], [], [] ];
}

var proto = Scene.prototype;

var axisProperties = [ 'xaxis', 'yaxis', 'zaxis' ];

proto.plot = function(sceneData, sceneLayout) {

    var data, trace;

    if(sceneLayout.bgcolor) {
        this.scene.clearColor = str2RGBAarray(sceneLayout.bgcolor);
    } else {
        this.scene.clearColor = [0,0,0,0];
    }

    //Update layout
    this.sceneLayout = sceneLayout;
    this.axesOptions.merge(sceneLayout);
    this.spikeOptions.merge(sceneLayout);

    //Update camera position
    if(!this.hasPlotBeenCalled) {
      this.hasPlotBeenCalled = true;
      var camera = sceneLayout.cameraposition;
      if(camera) {
          this.setCameraPosition(camera);
      }
    }

    //Update scene
    this.scene.update({});

    //Update traces
    if(sceneData) {
        if(!Array.isArray(sceneData)) {
            sceneData = [sceneData];
        }
        for(var i=0; i<sceneData.length; ++i) {
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
    for(var i=0; i<traceIds.length; ++i) {
        for(var j=0; j<sceneData.length; ++j) {
            if(sceneData[j].uid === traceIds[i] && sceneData[j].visible===true) {
                continue trace_id_loop;
            }
        }
        trace = this.traces[traceIds[i]];
        trace.dispose();
        delete this.traces[traceIds[i]];
    }

    //Update ranges (needs to be called *after* objects are added due to updates)
    var sceneBounds = this.scene.bounds;
    for(var i=0; i<3; ++i) {
        var axis = sceneLayout[axisProperties[i]];
        if(axis.autorange) {
            sceneBounds[0][i] = Infinity;
            sceneBounds[1][i] = -Infinity;
            for(var j=0; j<this.scene.objects.length; ++j) {
                var objBounds = this.scene.objects[j].bounds;
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
            var range = sceneLayout[axisProperties[i]].range;
            sceneBounds[0][i] = range[0];
            sceneBounds[1][i] = range[1];
        }
        if(sceneBounds[0][i] === sceneBounds[1][i]) {
            sceneBounds[0][i] -= 1;
            sceneBounds[1][i] += 1;
        }
    }

    //Update frame position for multi plots
    var domain = this.sceneLayout.domain || null,
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
    this.scene.dispose();
    this.container.parentNode.removeChild(this.container);
};


// for reset camera button in modebar
proto.setCameraToDefault = function setCameraToDefault () {
    this.scene.camera.lookAt(
        [1.25, 1.25, 1.25],
        [0,0,0],
        [0,0,1]
    );
};

// get camera position in plotly coords from 'orbit-camera' coords
proto.getCameraPosition = function getCameraPosition () {
    this.scene.camera.view.recalcMatrix(this.camera.view.lastT());
    return [
        this.scene.camera.view._active.computedRotation.slice(),
        this.scene.camera.view._active.computedCenter.slice(),
        this.scene.camera.distance
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
        this.scene.camera.lookAt(eye, center, [mat[1],mat[5],mat[9]]);
    }
};

// save camera position to user layout (i.e. gd.layout)
proto.saveCameraPositionToLayout = function saveCameraPositionToLayout (layout) {
    var lib = this.Plotly.Lib;
    var prop = lib.nestedProperty(layout, this.sceneKey + '.cameraposition');
    var cameraposition = this.getCameraPosition();
    prop.set(cameraposition);
};

proto.toImage = function (format) {
    if (!format) format = 'png';

    var scene = this.scene;
    var gl = scene.gl;
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

    return dataURL;
};

function createScene(options) {
    options = options || {};

    //Create sub container for plot
    var container = document.createElement('div');
    var style = container.style;
    style.position = 'absolute';
    style.top = style.left = '0px';
    style.width = style.height = '100%';
    //style['z-index'] = '0';

    options.container.appendChild(container);
    options.container = container;

    var result;
    try {
        result = new Scene(options);
    } catch(e) {
        style.background = '#FFFFFF';
        container.onclick = function () {
            window.open('http://get.webgl.org');
        };

        // Clean up modebar, add flag in fullLayout (for graph_interact.js)
        var fullLayout = options.fullLayout;
        if ('_modebar' in fullLayout && fullLayout._modebar) {
            fullLayout._modebar.cleanup();
            fullLayout._modebar = null;
        }
        fullLayout._noGL3DSupport = true;
    }

    return result;
}


module.exports = createScene;
