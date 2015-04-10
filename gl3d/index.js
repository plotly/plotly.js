'use strict'


var createPlot          = require('gl-plot3d'),
    m4FromQuat          = require('gl-mat4/fromQuat'),
    m4Translate         = require('gl-mat4/translate'),
    Gl3dLayout          = require('./defaults/gl3dlayout'),
    Gl3dAxes            = require('./defaults/gl3daxes'),
    Scatter3D           = require('./defaults/scatter3d'),
    Surface             = require('./defaults/surface'),
    createAxesOptions   = require('./convert/axes'),
    createSpikeOptions  = require('./convert/spikes'),
    createScatterTrace  = require('./convert/scatter'),
    createSurfaceTrace  = require('./convert/surface'),
    computeTickMarks    = require('./lib/tick-marks'),
    createCamera        = require('./lib/camera');

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
    var glOptions = options.glOptions
    glOptions.premultipliedAlpha = true

    this.Plotly       = options.Plotly
    this.sceneLayout  = options.sceneLayout
    this.fullLayout   = options.fullLayout

    this.axesOptions  = createAxesOptions(options.sceneLayout)
    this.spikeOptions = createSpikeOptions(options.sceneLayout)

    this.container    = options.container

    this.scene        = createPlot({
        container:  options.container,
        glOptions:  glOptions,
        axes:       this.axesOptions,
        spikes:     this.spikeOptions,
        pickRadius: 10,
        snapToData: true,
        autoScale:  true,
        autoBounds: false
    })

    this.camera = createCamera(this.container, {
        center: [0,0,0],
        eye:    [1.25,1.25,1.25],
        up:     [0,0,1],
        zoomMin: 0.1,
        zoomMax: 100,
        mode:   'orbit'
    })

    this.scene.camera = this.camera;

    this.scene.onrender = render.bind(null, this)

    //List of scene objects
    this.traces = {};

    this.contourLevels = [ [], [], [] ];
}

var proto = Scene.prototype

var axisProperties = [ 'xaxis', 'yaxis', 'zaxis' ]

proto.plot = function(sceneData, sceneLayout) {
    //Update layout
    this.sceneLayout = sceneLayout;
    this.axesOptions.merge(sceneLayout);
    this.spikeOptions.merge(sceneLayout);

    //Update camera position
    var camera = sceneLayout.cameraposition
    if(camera) {
        this.setCameraPosition(camera)
    }

    //Update scene
    this.scene.update({});

    //Update traces
    if(sceneData) {
        if(!Array.isArray(sceneData)) {
            sceneData = [sceneData]
        }
        for(var i=0; i<sceneData.length; ++i) {
            var data = sceneData[i];
            var trace = this.traces[data.uid];
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
    }

    //Update ranges (needs to be called *after* objects are added due to updates)
    var sceneBounds = this.scene.bounds
    for(var i=0; i<3; ++i) {
        var axis = sceneLayout[axisProperties[i]]
        if(axis.autorange) {
            sceneBounds[0][i] = Infinity
            sceneBounds[1][i] = -Infinity
            for(var j=0; j<this.scene.objects.length; ++j) {
                var objBounds = this.scene.objects[j].bounds
                sceneBounds[0][i] = Math.min(sceneBounds[0][i], objBounds[0][i])
                sceneBounds[1][i] = Math.max(sceneBounds[1][i], objBounds[1][i])
            }
            if('rangemode' in axis && axis.rangemode === 'tozero') {
                sceneBounds[0][i] = Math.min(sceneBounds[0][i], 0)
                sceneBounds[1][i] = Math.max(sceneBounds[1][i], 0)
            }
            if(sceneBounds[0][i] > sceneBounds[1][i]) {
                sceneBounds[0][i] = -1
                sceneBounds[1][i] =  1
            }
        } else {
            var range = sceneLayout[axisProperties[i]].range
            sceneBounds[0][i] = range[0]
            sceneBounds[1][i] = range[1]
        }
        if(sceneBounds[0][i] === sceneBounds[1][i]) {
            sceneBounds[0][i] -= 1
            sceneBounds[1][i] += 1
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
}

proto.destroy = function() {
    this.scene.dispose();
    this.container.parentNode.removeChild(this.container);
}


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
    //Mik: This is a hack to get things to work with the legacy camera/quaternion api
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
        var matrix = m4FromQuat([], rotation);
        var eye = [];
        for(var i=0; i<3; ++i) {
            eye[i] = center[i] + radius * matrix[2+4*i];
        }
        this.scene.camera.lookAt(eye, center, [0,0,1]);
    }
};

// save camera position to user layout (i.e. gd.layout)
proto.saveCameraPositionToLayout = function saveCameraPositionToLayout (layout) {
    var lib = this.Plotly.Lib;
    var prop = lib.nestedProperty(layout, this.sceneKey + '.cameraposition');
    var cameraposition = this.getCameraPosition();
    prop.set(cameraposition);
};

function createScene(options) {
    options = options || {};
    
    //Create sub container for plot
    var container = document.createElement('div');
    var style = container.style;
    style.position = 'absolute';
    style.top = style.left = '0px';
    style.width = style.height = '100%';
    style.zIndex = '1000';
    
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


exports.modules = [
    {module: Gl3dAxes,   namespace: 'Gl3dAxes'},
    {module: Gl3dLayout, namespace: 'Gl3dLayout'},
    {module: Scatter3D,  namespace: 'Scatter3D'},
    {module: Surface,    namespace: 'Surface'}
];

exports.createScene = createScene