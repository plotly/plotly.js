'use strict';

var camera = require('./scene-camera'),
    glm = require('gl-matrix'),
    createAxes = require('gl-axes'),
    getAxesPixelRange = require('gl-axes/properties'),
    arrtools = require('arraytools'),
    createSelect = require('gl-select-static'),
    createSpikes = require('gl-spikes'),
    pixelLength = require('./compute-tick-length'),
    project = require('./project'),
    tinycolor = require('tinycolor2'),
    arrayCopy1D = arrtools.copy1D,
    arrayCopy2D = arrtools.copy2D,
    mat4 = glm.mat4,
    util = require('util'),
    EventEmitter = require('events').EventEmitter,
    proto;

function str2RgbaArray(color) {
    color = tinycolor(color);
    return arrtools.str2RgbaArray(color.toRgbString());
}

function ticksChanged (ticksA, ticksB) {
    var nticks;
    for (var i = 0; i < 3; ++i) {
        if (ticksA[i].length !== ticksB[i].length) return true;
        nticks = Math.min(ticksA[i].length, ticksB[i].length);
        if (nticks === 0) continue;
        for (var j = 0; j < nticks; j++) {
            if (ticksA[i][j].x !== ticksB[i][j].x ||
                ticksA[i][j].text !== ticksB[i][j].text) {
                return true;
            }
        }
    }

    return false;
}

function contourLevelsFromTicks(ticks) {
    var result = new Array(3);
    for(var i=0; i<3; ++i) {
        var tlevel = ticks[i];
        var clevel = new Array(tlevel.length);
        for(var j=0; j<tlevel.length; ++j) {
            clevel[j] = tlevel[j].x;
        }
        result[i] = clevel
    }
    return result;
}


// Scene Constructor
function Scene (options) {

    EventEmitter.call(this);

    this.Plotly                  = options.Plotly;
    this.container               = options.container || null;
    this.sceneKey                = options.sceneKey || 'scene';
    this.sceneData               = options.sceneData || null;
    this.sceneLayout             = options.sceneLayout || null;
    this.fullLayout              = options.fullLayout || null;
    this.glOptions               = options.glOptions;

    this.initialized             = false;  // needs to go through .init()
    this.setProps();

}

module.exports = Scene;

util.inherits(Scene, EventEmitter);

proto = Scene.prototype;

// Set Scene properties that are independent of 'options'
proto.setProps = function setProps() {

    this.renderQueue             = [];
    this.glDataMap               = {};
    this.sceneDataQueue          = [];

    this.dirty                   = true;  //Set if drawing buffer needs redraw
    this.selectDirty             = true;  //Set if selection buffer needs redraw
    this.moving                  = false; //Set if camera moving (don't draw select axes)


    this.selectBuffers           = [];
    this.pickRadius              = 10; //Number of pixels to search for closest point
    this.objectCount             = 0;

    this.baseRange               = [ [ Infinity,  Infinity,  Infinity],  // min (init opposite)
                                     [-Infinity, -Infinity, -Infinity] ];  // max (init opposite)

    this.range                   = [ [ 0, 0, 0],    // min (init opposite)
                                     [ 6, 6, 6] ];  // max (init opposite)

    //Computed contour levels
    this.contourLevels           = [[], [], []];

    ////////////// AXES OPTIONS DEFAULTS ////////////////
    this.axis                    = null;
    this.axesOpts                = {};

    this.axesOpts.bounds         = [ [-10, -10, -10],
                                     [ 10,  10,  10] ];

    this.axesOpts.ticks          = [ [], [], [] ];
    this.axesOpts.tickEnable     = [ true, true, true ];
    this.axesOpts.tickFont       = [ 'sans-serif', 'sans-serif', 'sans-serif' ];
    this.axesOpts.tickSize       = [ 12, 12, 12 ];
    this.axesOpts.tickAngle      = [ 0, 0, 0 ];
    this.axesOpts.tickColor      = [ [0,0,0,1], [0,0,0,1], [0,0,0,1] ];
    this.axesOpts.tickPad        = [ 18, 18, 18 ];

    this.axesOpts.labels         = [ 'x', 'y', 'z' ];
    this.axesOpts.labelEnable    = [ true, true, true ];
    this.axesOpts.labelFont      = ['Open Sans','Open Sans','Open Sans'];
    this.axesOpts.labelSize      = [ 20, 20, 20 ];
    this.axesOpts.labelAngle     = [ 0, 0, 0 ];
    this.axesOpts.labelColor     = [ [0,0,0,1], [0,0,0,1], [0,0,0,1] ];
    this.axesOpts.labelPad       = [ 30, 30, 30 ];

    this.axesOpts.lineEnable     = [ true, true, true ];
    this.axesOpts.lineMirror     = [ false, false, false ];
    this.axesOpts.lineWidth      = [ 1, 1, 1 ];
    this.axesOpts.lineColor      = [ [0,0,0,1], [0,0,0,1], [0,0,0,1] ];

    this.axesOpts.lineTickEnable = [ true, true, true ];
    this.axesOpts.lineTickMirror = [ false, false, false ];
    this.axesOpts.lineTickLength = [ 10, 10, 10 ];
    this.axesOpts.lineTickWidth  = [ 1, 1, 1 ];
    this.axesOpts.lineTickColor  = [ [0,0,0,1], [0,0,0,1], [0,0,0,1] ];

    this.axesOpts.gridEnable     = [ true, true, true ];
    this.axesOpts.gridWidth      = [ 1, 1, 1 ];
    this.axesOpts.gridColor      = [ [0,0,0,1], [0,0,0,1], [0,0,0,1] ];

    this.axesOpts.zeroEnable     = [ true, true, true ];
    this.axesOpts.zeroLineColor  = [ [0,0,0,1], [0,0,0,1], [0,0,0,1] ];
    this.axesOpts.zeroLineWidth  = [ 2, 2, 2 ];

    this.axesOpts.backgroundEnable = [ false, false, false ];
    this.axesOpts.backgroundColor  = [ [0.8, 0.8, 0.8, 0.5],
                                       [0.8, 0.8, 0.8, 0.5],
                                       [0.8, 0.8, 0.8, 0.5] ];

    // some default values are stored for applying model transforms
    this.axesOpts._defaultTickPad         = arrayCopy1D(this.axesOpts.tickPad);
    this.axesOpts._defaultLabelPad        = arrayCopy1D(this.axesOpts.labelPad);
    this.axesOpts._defaultLineTickLength  = arrayCopy1D(this.axesOpts.lineTickLength);

    ///////////////////////////////////////////

    this.axisSpikes      = null;
    this.spikeEnable     = true;
    this.spikeProperties = {
        enable:         [true, true, true],
        colors:         [[0,0,0,1],
                         [0,0,0,1],
                         [0,0,0,1]],
        sides:          [true, true, true],
        width:          [1,1,1]
    };

    this.axesNames       = ['xaxis', 'yaxis', 'zaxis'];

    this.model = new Float32Array([  // ?duplicate?
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
    ]);

    this.defaultView = [   // set default camera view matrix
        1.25, 1.25, 1.25,
        0,    0,    0,
        0,    0,    1
    ];

    this.selection = null;  // currently selected data point

};

// Takes care of all async stuff; needs to be call only once per scene
proto.init = function init() {

    this.intializing = true;  // keep track of initializing scene shell

    var container = this.container,
        glOptions = this.glOptions,
        self      = this;

    // Once scene is ready, plot!
    this.once('scene-ready', function () {
        self.plotDataQueue();
    });

    // Once iframe is loaded, init the shell!
    container.onload = function () {

        // Try initializing WebGl
        self.shell = container.contentWindow.glnow({
            clearFlags: 0,
            glOptions: glOptions,
            tickRate: 3
        });

        // contain all events within the iframe, necessary to
        // contain zoom events to prevent parent window scrolling.
        self.shell.preventDefaults = true;
        self.shell.stopPropagation = true;

        // Once gl is initialized, initialize the camera and let
        // Scene know about it with 'scene-ready'.
        self.shell.once('gl-init', function () {
            self.initCamera();
            self.emit('scene-ready', self);
            self.initializing = false;
            self.initialized = true;
        });

        /*
         * gl-render is triggered in the animation loop, we hook in
         * glcontext object into the loop here
         */
        self.shell.on('gl-render', self.onRender.bind(self));

        // Attached 'tick' and 'resize' events to shell
        self.shell.on('tick', self.onTick.bind(self));
        self.shell.on('resize', function() {
            self.dirty = true;
            self.selectDirty = true;
        });

        // If an error occur, clean up container.
        self.shell.on('gl-error', function () {

            self.container.style.background = '#FFFFFF';
            self.container.contentDocument.getElementById('no3D').style.display = 'block';
            self.container.contentDocument.body.onclick = function () {
                window.open("http://get.webgl.org");
            };

            // Clean up modebar, add flag in fullLayout (for graph_interact.js)
            var fullLayout = self.fullLayout;
            if ('_modebar' in fullLayout && fullLayout._modebar) {
                fullLayout._modebar.cleanup();
                fullLayout._modebar = null;
            }
            fullLayout._noGL3DSupport = true;

        });

    };

};

proto.initCamera = function initCamera() {

    // Attach camera onto scene
    this.camera = camera(this.shell, this);

    // Set initial camera position
    this.setCameraPositionInitial();

    // Focus the iframe removing need to double click for interactivity
    this.container.focus();

};

// ALL YOU NEED TO CALL FROM THE OUTSIDE (i.e. graph_obj.js)
proto.plot = function plot(sceneData, sceneLayout) {

    // Update data queue, sync layout and set frame position
    this.updateSceneDataQueue(sceneData);
    this.setAndSyncLayout(sceneLayout);
    this.setFramePosition();

    // If scene is initialized, plot!
    if (this.initialized) this.plotDataQueue();

    // It not initialized or not initializing, initialize it!
    if (!(this.initializing) && !(this.initialized)) this.init();

};

// Plot each trace in data queue
proto.plotDataQueue = function () {
    var sceneLayout = this.sceneLayout,
        sceneDataQueue = this.sceneDataQueue;

    while (sceneDataQueue.length) {
        var trace = sceneDataQueue.shift();
        this.plotTrace(trace, sceneLayout);
    }
};

proto.groupCount = function() {
    if(this.objectCount === 0) {
        return 0;
    }
    return (((this.objectCount-1)/255)|0) + 1;
};

//Allocates count pickIds.
// The result is an object with two fields:
//      * group is the group id for the object
//      * ids is an array of pickIds
proto.allocIds = function(count) {
    var prevGroup = ((this.objectCount-1)/255)|0;
    var nextGroup = ((this.objectCount+count-1)/255)|0;
    if(nextGroup !== prevGroup) {
        this.objectCount = nextGroup * 255;
    }
    var result = this.objectCount;
    this.objectCount += count;
    var array = new Array(count);
    for(var i=0; i<count; ++i) {
        array[i] = (result + i) % 255;
    }
    return {
        group: nextGroup,
        ids: array
    };
};

//Every tick query the select buffer and check for changes
proto.onTick = function() {
    if(this.moving) {
        return;
    }
    var pickResult = this.handlePick(this.shell.mouseX, this.shell.height-this.shell.mouseY);
    if(!pickResult) {
        if(this.selection) {
            this.dirty = true;
        }
    } else if(this.selection) {
        //Compare selections
        var prev = this.selection.mouseCoordinate;
        var next = pickResult.mouseCoordinate;
        if(prev[0] !== next[0] || prev[1] !== next[1]) {
            this.dirty = true;
        }
    } else {
        this.dirty = true;
    }
    this.selection = pickResult;
};

proto.handlePick = function(x, y) {
    if(this.moving) {
        return null;
    }
    if(!this._lastCamera) {
        return null;
    }

    var cameraParameters = this._lastCamera;
    var pickResult = null, pickData = null;

    //Do one pass for each group of objects, find the closest point in z
    for(var pass=0; pass<this.selectBuffers.length; ++pass) {

        //Run query
        var curResult = this.selectBuffers[pass].query(x,y,this.pickRadius);

        //Skip this pass if the result was not valid
        if(!curResult || (pickResult && curResult.distance > pickResult.distance)) {
            continue;
        }

        //Scan through objects and find the selected point
        for(var i = 0; i < this.renderQueue.length; ++i) {
            var glObject = this.renderQueue[i];
            if(glObject.groupId !== pass) {
                continue;
            }
            var curData = glObject.pick(curResult);
            if(curData) {
                curData.glObject  = glObject;

                var p = project(cameraParameters, curData.position);
                curData.zDistance = p[2]/p[3];

                //Only update selected value if it is closer than all other objects
                if(!pickData || pickData.zDistance > curData.zDistance) {
                    pickResult        = curResult;
                    pickData          = curData;
                }
            }
        }
    }

    //Compute data coordinate and screen location for pick result
    if(pickData) {
        var glObject = pickData.glObject;

        //Compute data coordinate for point
        switch(glObject.plotlyType) {
            case 'scatter3d':
                pickData.dataCoordinate = glObject.dataPoints[pickData.index];
            break;

            case 'surface':
                pickData.dataCoordinate = [
                    glObject._field[0].get(pickData.index[0], pickData.index[1]),
                    glObject._field[1].get(pickData.index[0], pickData.index[1]),
                    glObject._field[2].get(pickData.index[0], pickData.index[1])
                ];
            break;
        }

        //Compute screen coordinate
        var p = project(cameraParameters, pickData.dataCoordinate);
        pickData.screenCoordinate = [
            0.5 * this.shell.width  * (1.0+p[0]/p[3]),
            0.5 * this.shell.height * (1.0-p[1]/p[3]) ];

        //Send mouse coordinate
        pickData.mouseCoordinate = pickResult.coord;
    }

    return pickData;
};

proto.renderPick = function(cameraParameters) {
    if(this.selectBuffers.length <= 0) {
        return null;
    }
    if(!this.selectDirty) {
        return;
    }
    this.selectDirty = false;
    var curObject = 0;
    for(var pass=0; pass<this.selectBuffers.length; ++pass) {
        var select = this.selectBuffers[pass];
        select.shape = [this.shell.width, this.shell.height];
        select.begin();
        for(var i=0; i<this.renderQueue.length; ++i) {
            var glObject = this.renderQueue[i];
            if(glObject.groupId === pass) {
                glObject.axesBounds = [
                  this.axis.bounds[0].slice(),
                  this.axis.bounds[1].slice()
                ];
                glObject.drawPick(cameraParameters);
            }
        }
        select.end();
    }
};

proto.onRender = function () {

    //Only draw if dirty
    if(!this.dirty) {
        return;
    }
    this.dirty = false;

    /*
     * On each render animation cycle reset camera parameters
     * in case view has changed.
     * This can probably be optimized
     */

    var cameraParameters = {
        view: this.camera.view(),
        projection: mat4.perspective(
            new Array(16),
            Math.PI/4.0,
            this.shell.width/this.shell.height,
            0.1, 10000.0
        ),
        model: this.model
    };

    this._lastCamera = cameraParameters;

    // render for point picking
    if(!this.moving) {
        this.renderPick(cameraParameters);
    } else {
        this.pickResult = null;
    }

    var i, glObject, ticks = [],
        gl = this.shell.gl,
        sceneLayout = this.sceneLayout,
        nticks, autoTickCached,
        glRange, axes,
        width = this.shell.width,
        height = this.shell.height,
        pickResult;

    //Clear buffer
    gl.clearColor(
        this.shell.clearColor[0],
        this.shell.clearColor[1],
        this.shell.clearColor[2],
        this.shell.clearColor[3]);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


    var centerPoint = [0,0,0];
    function solveLength(a, b) {
        for(var i=0; i<3; ++i) {
            a[i] = pixelLength(cameraParameters,
                        [width, height],
                        centerPoint,
                        i,
                        b[i]) / cameraParameters.model[5*i];
        }
    }

    // turns on depth rendering order.
    gl.enable(gl.DEPTH_TEST);

    //Draw picking axes
    pickResult = this.selection;

    if (this.axis) {
        glRange = getAxesPixelRange(this.axis,
                                    cameraParameters,
                                    width,
                                    height);

        for (i = 0; i < 3; ++i) {
            axes = sceneLayout[this.axesNames[i]];

            axes._length = (glRange[i].hi - glRange[i].lo) *
                glRange[i].pixelsPerDataUnit;

            if (Math.abs(axes._length) === Infinity) {
                ticks[i] = [];
            }

            else {
                axes.range[0] = glRange[i].lo;
                axes.range[1] = glRange[i].hi;
                axes._m = 1 / glRange[i].pixelsPerDataUnit;
                // this is necessary to short-circuit the 'y' handling
                // in autotick part of calcTicks... Treating all axes as 'y' in this case
                // running the autoticks here, then setting
                // autoticks to false to get around the 2D handling in calcTicks.
                autoTickCached = axes.autotick;
                if (axes.autotick) {
                    axes.autotick = false;
                    nticks = axes.nticks || this.Plotly.Lib.constrain((axes._length/40), 4, 9);
                    this.Plotly.Axes.autoTicks(axes, Math.abs(axes.range[1]-axes.range[0])/nticks);
                }
                ticks[i] = this.Plotly.Axes.calcTicks(axes);

                axes.autotick = autoTickCached;
            }
        }

        if (ticksChanged(this.axesOpts.ticks, ticks)) {
            this.axesOpts.ticks = ticks;

            //Update contour levels for all surfaces using new ticks
            this.contourLevels = contourLevelsFromTicks(ticks);
            for(i=0; i<this.renderQueue.length; ++i) {
                var glObject = this.renderQueue[i];
                if(glObject.plotlyType === 'surface') {
                    var nlevels = [ [], [], [] ];
                    for(var j=0; j<3; ++j) {
                        if(glObject.contourEnable[j]) {
                            nlevels[j] = this.contourLevels[j];
                        }
                    }
                    glObject.update({
                        levels: nlevels
                    });
                }
            }

            this.axis.update(this.axesOpts);
        }


        //Calculate tick lengths dynamically
        for(i=0; i<3; ++i) {
            centerPoint[i] = 0.5 * (this.axis.bounds[0][i] + this.axis.bounds[1][i]);
        }

        solveLength(this.axis.lineTickLength, this.axesOpts._defaultLineTickLength);
        solveLength(this.axis.tickPad, this.axesOpts._defaultTickPad);
        solveLength(this.axis.labelPad, this.axesOpts._defaultLabelPad);

        this.axis.draw(cameraParameters);
    }
    /*
     * Draw all objects in the render queue without transparency
     */
    for (i = 0; i < this.renderQueue.length; ++i) {
        glObject = this.renderQueue[i];

        //Update dynamic contours
        if(glObject.plotlyType === 'surface') {
            if(this.selection && this.selection.glObject === glObject) {
                var coords = [NaN, NaN, NaN];
                for(var j=0; j<3; ++j) {
                    if(glObject.highlightEnable[j]) {
                        coords[j] = this.selection.dataCoordinate[j];
                    }
                }
                glObject.dynamic.call(glObject, coords);
            } else {
                glObject.dynamic();
            }
        }

        glObject.axesBounds = [
          this.axis.bounds[0].slice(),
          this.axis.bounds[1].slice()
        ];

        if (glObject.supportsTransparency
            && glObject.plotlyType === 'surface') continue;

        glObject.draw(cameraParameters, false);
    }

    /*
     * Draw all objects in the render queue with transparency
     */
    gl.enable(gl.BLEND);
    gl.blendEquation(gl.FUNC_ADD);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    /*
     * Draw axes spikes for picking
     */
    if(pickResult && this.axisSpikes && this.spikeEnable) {
        if(!this.moving) {
            this.axisSpikes.update({
                position:       pickResult.dataCoordinate,
                bounds:         this.axis.bounds,
                colors:         this.spikeProperties.colors,
                drawSides:      this.spikeProperties.sides,
                enabled:        this.spikeProperties.enable,
                lineWidth:      this.spikeProperties.width
            });
            this.axisSpikes.draw(cameraParameters);
        }
    }

    for (i = 0; i < this.renderQueue.length; ++i) {
        glObject = this.renderQueue[i];
        if(glObject.supportsTransparency) {
            glObject.draw(cameraParameters, true);
        }
    }
    gl.disable(gl.BLEND);
};

proto.plotTrace = function (trace, sceneLayout) {

    this.dirty = true;
    this.selectDirty = true;

    for (var i = 0; i < 3; ++i) {

        var axes = sceneLayout[this.axesNames[i]];

        //////// configure Plotly axes functions
        this.Plotly.Axes.setConvert(axes);
        axes.setScale = function () {};
    }

    if (trace) {

        var glObject = this.glDataMap[trace.uid] || null;

        if (trace.visible === true) {
            glObject = trace._module.update(this, sceneLayout, trace, glObject);
            glObject.visible = true;
        }

        if (trace.visible!==true && glObject) glObject.visible = trace.visible;

        if (glObject) this.glDataMap[trace.uid] = glObject;

        // add to queue if visible, remove if not visible.
        this.updateRenderQueue(glObject);
    }

    // set manual range by clipping globjects, or calculate new auto-range
    this.setAxesRange();

    // uses internal range to set this.model to autoscale data
    this.setModelScale();

    // configues axes:
    this.configureAxes();

  // allocate any extra select buffers
    var bufferCount = this.groupCount();
    while(this.selectBuffers.length < bufferCount) {
        this.selectBuffers.push(
            createSelect(
                this.shell.gl,
                [this.shell.height,this.shell.width]));
    }

    if(!this.axisSpikes) {
        this.axisSpikes = createSpikes(this.shell.gl);
    }

};

proto.setAndSyncLayout = function setAndSyncLayout (sceneLayout) {
    this.sceneLayout = sceneLayout;

    // exception: set container color with layout bg color
    if (sceneLayout.bgcolor) {
        this.container.style.background = sceneLayout.bgcolor;
    }

    this.dirty = true;
    this.selectDirty = true;
};

proto.updateRenderQueue = function (glObject) {
    if (!glObject) return;

    // if visible === 'legendonly' -> don't render trace
    var visible = (glObject.visible === true);

    var idx = this.renderQueue.indexOf(glObject);

    if (visible && idx === -1) {

        // add glObject to the render-queue to be drawn
        this.renderQueue.push(glObject);

    } else if (!visible && idx > -1) {

        // item already exists in render-queue but is not hidden, remove.
        this.renderQueue.splice(idx, 1);

    } // other cases we don't need to do anything

    return;
};

proto.getCenter = function () {
    return [
        (this.range[1][0] + this.range[0][0]) / 2,
        (this.range[1][1] + this.range[0][1]) / 2,
        (this.range[1][2] + this.range[0][2]) / 2
    ];
};
/*
 * getDefaultPosition returns the point given by a vector which
 * extends from the center of the scene to the top front corner
 * plus some multiplier mult.
 */
proto.getDefaultPosition = function (mult) {
    var center = this.getCenter(),
        bounds = this.range,
        xtarg = center[0],
        ytarg = center[1],
        ztarg = center[2],
        xcam = (bounds[0][0] < 0) ? bounds[1][0] : bounds[0][0],
        ycam = (bounds[0][1] < 0) ? bounds[1][1] : bounds[0][1],
        zcam = bounds[1][2];

    if (!mult) mult = 1;
    return {
        eye: [
            mult*(xcam - xtarg) + xtarg,
            mult*(ycam - ytarg) + ytarg,
            mult*(zcam - ztarg) + ztarg
        ],
        target: [xtarg, ytarg, ztarg]
    };
};

/**
 * updates the internal maximum data ranges
 * currently being rendered.
 * -- need to add axes.expand for scatterers.
 *
 */
proto.setAxesRange = function () {

    // if glObj not already in renderQueue use this as the
    // starting default, else use the maximal minimal infinite
    // range when computing.
    var i, j, bounds, glObj;
    var axes, range;
    var sceneLayout = this.sceneLayout;

    if (this.renderQueue.length) {

        // lets calculate the new range over all gl-objects
        range = arrayCopy2D(this.baseRange);
    } else {

        // no gl-objects are in the renderQueue so we
        // use the last range or default
        range = arrayCopy2D(this.range);
    }

    for (j = 0; j < 3; ++j) {

        axes = sceneLayout[this.axesNames[j]];

        for (i = 0; i < this.renderQueue.length; ++i) {

            glObj = this.renderQueue[i];
            bounds = glObj.bounds;

            if (!axes.autorange) {
                bounds[0][j] = axes.range[0];
                bounds[1][j] = axes.range[1];
            }

            range[0][j] = Math.min(range[0][j], bounds[0][j]);
            range[1][j] = Math.max(range[1][j], bounds[1][j]);

            if('rangemode' in axes && axes.rangemode === 'tozero') {
                if (range[0][j] > 0 && range[1][j] > 0) range[0][j] = 0;
                if (range[0][j] < 0 && range[1][j] < 0) range[1][j] = 0;
            }

        }
    }

    //Fix up glitches on axes
    for(i=0; i<3; ++i) {
        if(range[0][i] === range[1][i]) {
            range[0][i] -= 1.0;
            range[1][i] += 1.0;
        } else if(range[0][i] > range[1][i]) {
            range[0][i] = -1.0;
            range[1][i] = 1.0;
        }

        axes = sceneLayout[this.axesNames[i]];

        // Assign range to layout
        axes.range[0] = range[0][i];
        axes.range[1] = range[1][i];

    }


    //Set clip bounds
    for(i=0; i<this.renderQueue.length; ++i) {
        glObj = this.renderQueue[i];
        glObj.clipBounds = range;
        glObj.axesBounds = range;
    }

    this.range = range;

    this.dirty = true;
    this.selectDirty = true;
};

/**
 * iterates through all surfaces and calculates
 * maximum containing bounds --- autoscale
 *
 */
proto.setModelScale = function () {

    var lo = this.range[0];
    var hi = this.range[1];
    var r0 = hi[0]-lo[0];
    var r1 = hi[1]-lo[1];
    var r2 = hi[2]-lo[2];
    var d0 = -0.5*(hi[0]+lo[0])/r0;
    var d1 = -0.5*(hi[1]+lo[1])/r1;
    var d2 = -0.5*(hi[2]+lo[2])/r2;

    this.model = new Float32Array([
        1.0/r0,  0,      0,    0,
        0,  1.0/r1,      0,    0,
        0,       0, 1.0/r2,    0,
        d0,     d1,     d2,    1
    ]);

    this.dirty = true;
    this.selectDirty = true;

};


/**
 * configure the axis of the scene.
 *
 * a seperate method setRange
 */
proto.configureAxes = function configureAxes () {
    /*jshint camelcase: false */

    var axes,
        opts        = this.axesOpts,
        sceneLayout = this.sceneLayout;

    for (var i = 0; i < 3; ++i) {

        axes = sceneLayout[this.axesNames[i]];

        /////// Axes labels //
        opts.labels[i] = axes.title;
        if ('titlefont' in axes) {
            if (axes.titlefont.color)  opts.labelColor[i] = str2RgbaArray(axes.titlefont.color);
            if (axes.titlefont.family) opts.labelFont[i]  = axes.titlefont.family;
            if (axes.titlefont.size)   opts.labelSize[i]  = axes.titlefont.size;
        }

        /////// LINES ////////
        if ('showline' in axes)  opts.lineEnable[i] = axes.showline;
        if ('linecolor' in axes) opts.lineColor[i]  = str2RgbaArray(axes.linecolor);
        if ('linewidth' in axes) opts.lineWidth[i]  = axes.linewidth;

        if ('showgrid' in axes)  opts.gridEnable[i] = axes.showgrid;
        if ('gridcolor' in axes) opts.gridColor[i]  = str2RgbaArray(axes.gridcolor);
        if ('gridwidth' in axes) opts.gridWidth[i]  = axes.gridwidth;

        if ('zeroline' in axes)      opts.zeroEnable[i]    = axes.zeroline;
        if ('zerolinecolor' in axes) opts.zeroLineColor[i] = str2RgbaArray(axes.zerolinecolor);
        if ('zerolinewidth' in axes) opts.zeroLineWidth[i] = axes.zerolinewidth;

        //////// TICKS /////////
        /// tick lines
        if ('ticks' in axes && !!axes.ticks) opts.lineTickEnable[i] = true;
        else                                 opts.lineTickEnable[i] = false;

        if ('ticklen' in axes) {
            opts.lineTickLength[i] = this.axesOpts._defaultLineTickLength[i] = axes.ticklen;
        }
        if ('tickcolor' in axes) opts.lineTickColor[i] = str2RgbaArray(axes.tickcolor);
        if ('tickwidth' in axes) opts.lineTickWidth[i] = axes.tickwidth;
        if ('tickangle' in axes) {
            opts.tickAngle[i] = axes.tickangle === 'auto' ? 0 : axes.tickangle;
        }
        //// tick labels
        if ('showticklabels' in axes) opts.tickEnable[i] = axes.showticklabels;
        if ('tickfont' in axes) {
            if (axes.tickfont.color)  opts.tickColor[i]  = str2RgbaArray(axes.tickfont.color);
            if (axes.tickfont.family) opts.tickFont[i]   = axes.tickfont.family;
            if (axes.tickfont.size)   opts.tickSize[i]   = axes.tickfont.size;
        }

        if ('mirror' in axes) {
            if (['ticks','all','allticks'].indexOf(axes.mirror) !== -1) {
                opts.lineTickMirror[i] = true;
                opts.lineMirror[i] = true;
            } else if (axes.mirror === true) {
                opts.lineTickMirror[i] = false;
                opts.lineMirror[i] = true;
            } else {
                opts.lineTickMirror[i] = false;
                opts.lineMirror[i] = false;
            }
        } else opts.lineMirror[i] = false;

        ////// grid background
        if ('showbackground' in axes && axes.showbackground !== false) {
            opts.backgroundEnable[i]    = true;
            opts.backgroundColor[i]     = str2RgbaArray(axes.backgroundcolor);
        } else opts.backgroundEnable[i] = false;


        ///// configure axes spikes
        this.spikeProperties.enable[i] = !!axes.showspikes;
        this.spikeProperties.sides[i]  = !!axes.spikesides;
        if(typeof axes.spikethickness !== 'number') {
            axes.spikethickness = 2;
        }
        this.spikeProperties.width[i] = axes.spikethickness;
        if(typeof axes.spikecolor === 'string') {
            this.spikeProperties.colors[i] = str2RgbaArray(axes.spikecolor);
        } else {
            this.spikeProperties.colors[i] = [0,0,0,1];
        }
    }

    this.axesOpts.bounds = this.range;

    if (this.axis) this.axis.update(this.axesOpts);
    else this.axis = createAxes(this.shell.gl, this.axesOpts);

    this.dirty = true;
    this.selectDirty = true;
};


proto.toPNG = function () {
    var shell = this.shell;
    var gl = shell.gl;
    var pixels = new Uint8Array(shell.width * shell.height * 4);

    gl.readPixels(0, 0, shell.width, shell.height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

    //Flip pixels
    var w = shell.width;
    var h = shell.height;
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
    canvas.width = shell.width;
    canvas.height = shell.height;
    var context = canvas.getContext('2d');
    var imageData = context.createImageData(shell.width, shell.height);
    imageData.data.set(pixels);
    context.putImageData(imageData, 0, 0);

    var dataURL = canvas.toDataURL('image/png');
    return dataURL;
};

// for reset camera button in modebar
proto.setCameraToDefault = function setCameraToDefault () {
    this.camera.lookAt(
        this.defaultView.slice(0,3),
        this.defaultView.slice(3,6),
        this.defaultView.slice(6,9)
    );
    this.dirty = true;
    this.selectDirty = true;
    return;
};

// get camera position in plotly coords from 'orbit-camera' coords
proto.getCameraPosition = function getCameraPosition () {
    return [
        arrayCopy1D(this.camera.rotation),
        arrayCopy1D(this.camera.center),
        this.camera.distance
   ];
};

// set camera position with a set of plotly coords
proto.setCameraPosition = function setCameraPosition (cameraPosition) {
    if (Array.isArray(cameraPosition) && cameraPosition.length === 3) {
        this.camera.rotation = arrayCopy1D(cameraPosition[0]);
        this.camera.center = arrayCopy1D(cameraPosition[1]);
        this.camera.distance = cameraPosition[2];
    }
    this.dirty = true;
    this.selectDirty = true;
    return;
};

// save camera position to user layout (i.e. gd.layout)
proto.saveCameraPositionToLayout = function saveCameraPositionToLayout (layout) {
    var lib = this.Plotly.Lib;
    var prop = lib.nestedProperty(layout, this.sceneKey + '.cameraposition');
    var cameraposition = this.getCameraPosition();
    prop.set(cameraposition);
    this.dirty = true;
    this.selectDirty = true;
    return;
};

// Set camera position upon Scene instantiation
proto.setCameraPositionInitial = function setCameraPositionInitial () {
    var sceneLayout = this.sceneLayout,
        cameraPosition = sceneLayout ? sceneLayout.cameraposition : null;

    if (cameraPosition && cameraPosition.length) {
        // Set camera to provided position, save a copy
        this.setCameraPosition(cameraPosition);
        this.cameraPositionLastSave = this.getCameraPosition();
    } else {
        // Set camera to default, save a copy in plotly coords
        this.setCameraToDefault();
        this.cameraPositionDefault = this.getCameraPosition();
        this.cameraPositionLastSave = this.cameraPositionDefault;
    }
};

// Set the frame position of the scene (i.e. its 'domain')
proto.setFramePosition = function setFramePosition () {
    var containerStyle = this.container.style,
        domain = this.sceneLayout.domain || null,
        size = this.fullLayout._size || null;

    function sizeToPosition(size, domain) {
        return {
            left: size.l + domain.x[0] * size.w,
            top: size.t + (1 - domain.y[1]) * size.h,
            width: size.w * (domain.x[1] - domain.x[0]),
            height: size.h * (domain.y[1] - domain.y[0])
        };
    }

    if (domain && size) {
        var position = sizeToPosition(size, domain);
        containerStyle.position = 'absolute';
        containerStyle.left = position.left + 'px';
        containerStyle.top = position.top + 'px';
        containerStyle.width = position.width + 'px';
        containerStyle.height = position.height + 'px';
    }
};

// Update the data queue
proto.updateSceneDataQueue = function updateSceneDataQueue(sceneData) {
    var newSceneData = sceneData || this.sceneData,
        sceneDataQueue = this.sceneDataQueue,
        sceneDataQueueUIDS = [],
        sceneDataNotInQueue = [],
        i = null;

    // Get uids of traces in data queue
    for (i = 0; i < sceneDataQueue.length; ++i) {
        sceneDataQueueUIDS.push(sceneDataQueue[i].uid);
    }

    // Filter out new traces that are already in the queue
    for (i = 0; i < newSceneData.length; ++i) {
        var trace = newSceneData[i];
        if (sceneDataQueueUIDS.indexOf(trace.uid) === -1) {
            sceneDataNotInQueue.push(trace);
        }
    }

    // Append scene data queue
    this.sceneDataQueue = sceneDataQueue.concat(sceneDataNotInQueue);
};

proto.disposeAll = function disposeAll () {

    this.renderQueue.forEach( function (glo) {
        glo.dispose();
    });

    this.renderQueue = [];
    this.glDataMap = {};

    if (this.axis) {
        this.axis.dispose();
        this.axis = null;
    }
    if(this.axisSpikes) {
        this.axisSpikes.dispose();
        this.axisSpikes = null;
    }
    for(var i=0; i<this.selectBuffers.length; ++i) {
        this.selectBuffers[i].dispose();
    }
};

proto.destroy = function destroy () {

    this.disposeAll();
    this.container.parentNode.removeChild(this.container);

};
