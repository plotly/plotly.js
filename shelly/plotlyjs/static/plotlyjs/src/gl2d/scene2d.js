'use strict';

var Plotly = require('../plotly');
var createPlot2D = require('gl-plot2d');
var createLineWithMarkers = require('./convert/scattergl');
var createOptions = require('./convert/axes2dgl');
var createCamera  = require('./lib/camera');

var AXES = [ 'xaxis', 'yaxis' ];

function Scene2D(options, fullLayout) {

    console.log('Instantiating Scene2d', options);

    var container = this.container = options.container;
    this.fullLayout = fullLayout;

    var width       = fullLayout.width;
    var height      = fullLayout.height;

    //Get pixel ratio
    var pixelRatio = this.pixelRatio = options.pixelRatio || window.devicePixelRatio;

    //Create canvas and append to container
    var canvas = this.canvas = document.createElement('canvas');
    canvas.width        = Math.ceil(pixelRatio * width) |0;
    canvas.height       = Math.ceil(pixelRatio * height)|0;
    canvas.style.width  = '100%';
    canvas.style.height = '100%';
    canvas.style.position = 'absolute';
    canvas.style.top    = '0px';
    canvas.style.left   = '0px';
    canvas.style['z-index'] = '100';

    //Get webgl context
    var gl;
    try {
      gl = canvas.getContext('webgl', options.glOptions);
    } catch(e) {}
    if(!gl) {
      try {
        gl = canvas.getContext('experimental-webgl', options.glOptions);
      } catch(e) {}
    }
    if(!gl) {
      throw new Error('webgl not supported!');
    }
    this.gl = gl;

    //Append canvas to conatiner
    container.appendChild(canvas);


    //Update options
    this.glplotOptions = createOptions(this);
    this.glplotOptions.merge(fullLayout);

    //Create the plot
    this.glplot = createPlot2D(this.glplotOptions);

    //Create camera
    this.camera = createCamera(this);

    //Redraw the plot
    this.redraw = this.draw.bind(this);
    this.redraw();

    //Trace set
    this.traces = [];
}

module.exports = Scene2D;

var proto = Scene2D.prototype;

proto.computeTickMarks = function() {
  this.fullLayout.scene2d.xaxis._length =
      this.glplot.viewBox[2] - this.glplot.viewBox[0];
  this.fullLayout.scene2d.yaxis._length =
      this.glplot.viewBox[3] - this.glplot.viewBox[1];
  return [
      Plotly.Axes.calcTicks(this.fullLayout.scene2d.xaxis),
      Plotly.Axes.calcTicks(this.fullLayout.scene2d.yaxis)
  ];
};

function compareTicks(a, b) {
  for(var i=0; i<2; ++i) {
    var aticks = a[i];
    var bticks = b[i];
    if(aticks.length !== bticks.length) {
      return true;
    }
    for(var j=0; j<aticks.length; ++j) {
      if(aticks[j].x !== bticks[j].x) {
        return true;
      }
    }
  }
  return false;
}

proto.cameraChanged = function() {
  var fullLayout = this.fullLayout;
  var camera = this.camera;
  fullLayout.scene2d.xaxis.range[0] = camera.dataBox[0];
  fullLayout.scene2d.yaxis.range[0] = camera.dataBox[1];
  fullLayout.scene2d.xaxis.range[1] = camera.dataBox[2];
  fullLayout.scene2d.yaxis.range[1] = camera.dataBox[3];

  this.glplot.setDataBox(camera.dataBox);

  var nextTicks = this.computeTickMarks();
  var curTicks = this.glplotOptions.ticks;

  if(compareTicks(nextTicks, curTicks)) {
      this.glplotOptions.ticks = nextTicks;
      this.glplotOptions.dataBox = camera.dataBox;
      this.glplot.update(this.glplotOptions);
  }
};

proto.plot = function(fullData, fullLayout) {
    //Check for resize
    var glplot     = this.glplot;
    var pixelRatio = this.pixelRatio;
    var i, j;

    this.fullLayout = fullLayout;

    var width       = fullLayout.width;
    var height      = fullLayout.height;
    var pixelWidth  = Math.ceil(pixelRatio * width) |0;
    var pixelHeight = Math.ceil(pixelRatio * height)|0;

    var canvas = this.canvas;
    if(canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width        = pixelWidth;
        canvas.height       = pixelHeight;
    }

    for(i=0; i<2; ++i) {
        Plotly.Axes.doAutoRange(fullLayout.scene2d[AXES[i]]);
    }

    var camera = this.camera;
    camera.dataBox[0] = fullLayout.scene2d.xaxis.range[0];
    camera.dataBox[1] = fullLayout.scene2d.yaxis.range[0];
    camera.dataBox[2] = fullLayout.scene2d.xaxis.range[1];
    camera.dataBox[3] = fullLayout.scene2d.yaxis.range[1];

    //Update plot
    var options       = this.glplotOptions;
    options.merge(fullLayout);
    options.screenBox = [0,0,width,height];
    options.viewBox   = [0.125*width,0.125*height,0.875*width,0.875*height];
    options.ticks     = this.computeTickMarks();
    options.dataBox   = camera.dataBox;

    glplot.update(options);

    if(!fullData) {
        fullData = [];
    } else if(!Array.isArray(fullData)) {
        fullData = [fullData];
    }

i_loop:
    for(i=0; i<fullData.length; ++i) {
        for(j=0; j<this.traces.length; ++j) {
            if(this.traces[j].uid === fullData[i].uid) {
                this.traces[j].update(fullData[i]);
                continue i_loop;
            }
        }
        var newTrace = null;
        switch(fullData[i].type) {
          case 'scattergl':
              newTrace = createLineWithMarkers(this, fullData[i]);
          break;
        }
        if(newTrace) {
            this.traces.push(newTrace);
        }
    }

j_loop:
    for(j=this.traces.length-1; j>=0; --j) {
        for(i=0; i<fullData.length; ++i) {
            if(this.traces[j].uid === fullData[i].uid) {
                continue j_loop;
            }
        }
        var trace = this.traces[j];
        trace.dispose();
        this.traces.splice(j, 1);
    }
};

proto.draw = function() {
    requestAnimationFrame(this.redraw);

    //Check for resize
    var glplot = this.glplot;

    //Draw plot
    glplot.draw();
};
