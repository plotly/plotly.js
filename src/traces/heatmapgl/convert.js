'use strict';

var createHeatmap2D = require('gl-heatmap2d');
var Axes = require('../../plots/cartesian/axes');
var str2RGBArray = require('../../lib/str2rgbarray');


function Heatmap(scene, uid) {
    this.scene = scene;
    this.uid = uid;
    this.type = 'heatmapgl';

    this.name = '';
    this.hoverinfo = 'all';

    this.xData = [];
    this.yData = [];
    this.zData = [];
    this.textLabels = [];

    this.idToIndex = [];
    this.bounds = [0, 0, 0, 0];

    this.options = {
        zsmooth: 'fast',
        z: [],
        x: [],
        y: [],
        shape: [0, 0],
        colorLevels: [0],
        colorValues: [0, 0, 0, 1]
    };

    this.heatmap = createHeatmap2D(scene.glplot, this.options);
    this.heatmap._trace = this;
}

var proto = Heatmap.prototype;

proto.handlePick = function(pickResult) {
    var options = this.options;
    var shape = options.shape;
    var index = pickResult.pointId;
    var xIndex = index % shape[0];
    var yIndex = Math.floor(index / shape[0]);
    var zIndex = index;

    return {
        trace: this,
        dataCoord: pickResult.dataCoord,
        traceCoord: [
            options.x[xIndex],
            options.y[yIndex],
            options.z[zIndex]
        ],
        textLabel: this.textLabels[index],
        name: this.name,
        pointIndex: [yIndex, xIndex],
        hoverinfo: this.hoverinfo
    };
};

proto.update = function(fullTrace, calcTrace) {
    var calcPt = calcTrace[0];

    this.index = fullTrace.index;
    this.name = fullTrace.name;
    this.hoverinfo = fullTrace.hoverinfo;

    // convert z from 2D -> 1D
    var z = calcPt.z;
    this.options.z = [].concat.apply([], z);

    var rowLen = z[0].length;
    var colLen = z.length;
    this.options.shape = [rowLen, colLen];

    this.options.x = calcPt.x;
    this.options.y = calcPt.y;
    this.options.zsmooth = fullTrace.zsmooth;

    var colorOptions = convertColorscale(fullTrace);
    this.options.colorLevels = colorOptions.colorLevels;
    this.options.colorValues = colorOptions.colorValues;

    // convert text from 2D -> 1D
    this.textLabels = [].concat.apply([], fullTrace.text);

    this.heatmap.update(this.options);

    var xa = this.scene.xaxis;
    var ya = this.scene.yaxis;

    var xOpts, yOpts;
    if(fullTrace.zsmooth === false) {
        // increase padding for discretised heatmap as suggested by Louise Ord
        xOpts = { ppad: calcPt.x[1] - calcPt.x[0] };
        yOpts = { ppad: calcPt.y[1] - calcPt.y[0] };
    }

    fullTrace._extremes[xa._id] = Axes.findExtremes(xa, calcPt.x, xOpts);
    fullTrace._extremes[ya._id] = Axes.findExtremes(ya, calcPt.y, yOpts);
};

proto.dispose = function() {
    this.heatmap.dispose();
};

function convertColorscale(fullTrace) {
    var scl = fullTrace.colorscale;
    var zmin = fullTrace.zmin;
    var zmax = fullTrace.zmax;

    var N = scl.length;
    var domain = new Array(N);
    var range = new Array(4 * N);

    for(var i = 0; i < N; i++) {
        var si = scl[i];
        var color = str2RGBArray(si[1]);

        domain[i] = zmin + si[0] * (zmax - zmin);

        for(var j = 0; j < 4; j++) {
            range[(4 * i) + j] = color[j];
        }
    }

    return {
        colorLevels: domain,
        colorValues: range
    };
}

function createHeatmap(scene, fullTrace, calcTrace) {
    var plot = new Heatmap(scene, fullTrace.uid);
    plot.update(fullTrace, calcTrace);
    return plot;
}

module.exports = createHeatmap;
