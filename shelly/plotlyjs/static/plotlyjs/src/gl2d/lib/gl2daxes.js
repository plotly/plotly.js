'use strict';

var htmlToUnicode = require('../../gl3d/lib/html2unicode');
var str2RGBArray = require('../../gl3d/lib/str2rgbarray');

function Axes2DOptions(scene) {
  this.title = '';

  this.gl = scene.gl;
  this.pixelRatio = scene.pixelRatio;

  this.screenBox = [0,0,1,1];
  this.viewBox   = [0,0,1,1];
  this.dataBox   = [-1,-1,1,1];

  this.borderLineEnable = [false,false,false,false];
  this.borderLineWidth = [1,1,1,1];
  this.borderLineColor = [
    [0,0,0,1],
    [0,0,0,1],
    [0,0,0,1],
    [0,0,0,1]
  ];

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
  this.tickMarkWidth = [0,0,0,0];
  this.tickMarkLength = [0,0,0,0];

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

  this.borderColor      = [0,0,0,0];
  this.backgroundColor  = [0,0,0,0];
}

var proto = Axes2DOptions.prototype;

var AXES = [ 'xaxis', 'yaxis' ];

proto.merge = function(options) {

  //Titles are rendered in SVG
  this.titleEnable = false;
  this.backgroundColor = str2RGBArray(options.plot_bgcolor);

  for(var i=0; i<2; ++i) {
    var ax = options[AXES[i]];
    var axTitle = /Click to enter .+ title/.test(ax.title) ?
        '' :
        ax.title;

    for(var j=0; j<=2; j+=2) {
      this.labels[i+j]     = htmlToUnicode(axTitle);
      this.labelEnable[i+j] = false;
      this.labelColor[i+j] = str2RGBArray(ax.titlefont.color);
      this.labelFont[i+j]  = ax.titlefont.family;
      this.labelSize[i+j]  = ax.titlefont.size;

      this.tickColor[i+j] = str2RGBArray(ax.tickcolor);

      if(ax.tickangle === 'auto') {
        this.tickAngle[i+j] = 0;
      } else {
        this.tickAngle[i+j] = -ax.tickangle;
      }

      this.borderLineEnable[i+j] = ax.showline;
      this.borderLineColor[i+j] = str2RGBArray(ax.linecolor);
      this.borderLineWidth[i+j] = ax.linewidth;
    }

    this.tickEnable[i]     = ax.showticklabels;
    this.labelEnable[i]    = ax.showticklabels;
    this.tickMarkLength[i] = ax.ticklen;
    this.tickMarkWidth[i]  = ax.tickwidth;

    this.gridLineEnable[i]  = ax.showgrid;
    this.gridLineColor[i]   = str2RGBArray(ax.gridcolor);
    this.gridLineWidth[i]   = ax.gridwidth;

    this.zeroLineEnable[i]  = ax.zeroline;
    this.zeroLineColor[i]   = str2RGBArray(ax.zerolinecolor);
    this.zeroLineWidth[i]   = ax.zerolinewidth;
  }
};

function createAxes2D(scene) {
  return new Axes2DOptions(scene);
}

module.exports = createAxes2D;
