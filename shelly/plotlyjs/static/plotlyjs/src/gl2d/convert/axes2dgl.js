'use strict';

function Axes2DOptions(scene) {
  this.title = '';

  this.gl = scene.gl;
  this.pixelRatio = scene.pixelRatio;

  this.screenBox = [0,0,1,1];
  this.viewBox   = [0,0,1,1];
  this.dataBox   = [-1,-1,1,1];

  this.borderLineEnable = [false,false,false,false];

  this.ticks = [[], []];
  this.tickEnable = [true, true, false, false];
  this.tickPad   = [15,15,15,15];
  this.tickAngle = [0,0,0,0];
  this.tickColor = [
    [0,0,0,1],
    [0,0,0,1],
    [0,0,0,1],
    [0,0,0,1]
  ];
  this.tickMarkWidth = [1,1,1,1];
  this.tickMarkLength = [10,10,10,10];

  this.labels = ['x', 'y'];
  this.labelEnable = [true,true,false,false];
  this.labelAngle  = [0,Math.PI/2,0,3.0*Math.PI/2];
  this.labelPad    = [15,15,15,15];
  this.labelSize   = [12,12];
  this.labelFont   = ['sans-serif', 'sans-serif'];
  this.labelColor  = [
    [0,0,0,1],
    [0,0,0,1],
    [0,0,0,1],
    [0,0,0,1]
  ];

  this.title       = '';
  this.titleEnable = true;
  this.titleCenter = [0,0,0,0];
  this.titleAngle  = 0;
  this.titleColor  = [0,0,0,1];
  this.titleFont   = 'sans-serif';
  this.titleSize   = 18;

  this.gridLineEnable = [true,true];
  this.gridLineColor  = [
    [0,0,0,0.5],
    [0,0,0,0.5]
  ];
  this.gridLineWidth  = [1,1];

  this.zeroLineEnable = [true,true];
  this.zeroLineWidth  = [1,1];
  this.zeroLineColor  = [
    [0,0,0,1],
    [0,0,0,1]
  ];
}

var proto = Axes2DOptions.prototype;

proto.merge = function(options) {
}

function createAxes2D(scene) {
  return new Axes2DOptions(scene);
}

module.exports = createAxes2D;
