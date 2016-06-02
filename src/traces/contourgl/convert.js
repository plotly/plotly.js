/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var createContour2D = require('gl-contour2d');
var createHeatmap2D = require('gl-heatmap2d');

var makeColorMap = require('../contour/make_color_map');
var str2RGBArray = require('../../lib/str2rgbarray');


function Contour(scene, uid) {
    this.scene = scene;
    this.uid = uid;

    this.name = '';
    this.hoverinfo = 'all';

    this.xData = [];
    this.yData = [];
    this.zData = [];
    this.textLabels = [];

    this.idToIndex = [];
    this.bounds = [0, 0, 0, 0];

    this.contourOptions = {
        z: new Float32Array(0),
        x: [],
        y: [],
        shape: [0, 0],
        levels: [0],
        levelColors: [0, 0, 0, 1],
        lineWidth: 1
    };
    this.contour = createContour2D(scene.glplot, this.contourOptions);
    this.contour._trace = this;

    this.heatmapOptions = {
        z: new Float32Array(0),
        x: [],
        y: [],
        shape: [0, 0],
        colorLevels: [0],
        colorValues: [0, 0, 0, 0]
    };
    this.heatmap = createHeatmap2D(scene.glplot, this.heatmapOptions);
    this.heatmap._trace = this;
}

var proto = Contour.prototype;

proto.handlePick = function(pickResult) {
    var index = pickResult.pointId,
        options = this.heatmapOptions,
        shape = options.shape;

    return {
        trace: this,
        dataCoord: pickResult.dataCoord,
        traceCoord: [
            options.x[index % shape[0]],
            options.y[Math.floor(index / shape[0])],
            options.z[index]
        ],
        textLabel: this.textLabels[index],
        name: this.name,
        hoverinfo: this.hoverinfo
    };
};

proto.update = function(fullTrace, calcTrace) {
    var calcPt = calcTrace[0];

    this.name = fullTrace.name;
    this.hoverinfo = fullTrace.hoverinfo;

    // convert z from 2D -> 1D
    var z = calcPt.z,
        rowLen = z[0].length,
        colLen = z.length,
        colorOptions;

    this.contourOptions.z = flattenZ(z, rowLen, colLen);
    this.heatmapOptions.z = [].concat.apply([], z);

    this.contourOptions.shape = this.heatmapOptions.shape = [rowLen, colLen];

    this.contourOptions.x = this.heatmapOptions.x = calcPt.x;
    this.contourOptions.y = this.heatmapOptions.y = calcPt.y;


    // pass on fill information
    if(fullTrace.contours.coloring === 'fill') {
        colorOptions = convertColorScale(fullTrace, {fill: true});
        this.contourOptions.levels = colorOptions.levels.slice(1);
        // though gl-contour2d automatically defaults to a transparent layer for the last
        // band color, it's set manually here in case the gl-contour2 API changes
        this.contourOptions.fillColors = colorOptions.levelColors;
        this.contourOptions.levelColors = [].concat.apply([], this.contourOptions.levels.map(function() {
            return [0.25, 0.25, 0.25, 1.0];
        }));
    } else {
        colorOptions = convertColorScale(fullTrace, {fill: false});
        this.contourOptions.levels = colorOptions.levels;
        this.contourOptions.levelColors = colorOptions.levelColors;
    }

    // convert text from 2D -> 1D
    this.textLabels = [].concat.apply([], fullTrace.text);

    this.contour.update(this.contourOptions);
    this.heatmap.update(this.heatmapOptions);
};

proto.dispose = function() {
    this.contour.dispose();
    this.heatmap.dispose();
};

function flattenZ(zIn, rowLen, colLen) {
    var zOut = new Float32Array(rowLen * colLen);
    var pt = 0;

    for(var i = 0; i < rowLen; i++) {
        for(var j = 0; j < colLen; j++) {
            zOut[pt++] = zIn[j][i];
        }
    }

    return zOut;
}

function convertColorScale(fullTrace, options) {
    var contours = fullTrace.contours,
        start = contours.start,
        end = contours.end,
        cs = contours.size || 1,
        fill = options.fill;

    var colorMap = makeColorMap(fullTrace);

    var N = Math.floor((end - start) / cs) + (fill ? 2 : 1), // for K thresholds (contour linees) there are K+1 areas
        levels = new Array(N),
        levelColors = new Array(4 * N);

    for(var i = 0; i < N; i++) {
        var level = levels[i] = start + cs * (i) - (fill ? cs / 2 : 0); // in case of fill, use band midpoint
        var color = str2RGBArray(colorMap(level));

        for(var j = 0; j < 4; j++) {
            levelColors[(4 * i) + j] = color[j];
        }
    }

    return {
        levels: levels,
        levelColors: levelColors
    };
}

function createContour(scene, fullTrace, calcTrace) {
    var plot = new Contour(scene, fullTrace.uid);
    plot.update(fullTrace, calcTrace);

    return plot;
}

module.exports = createContour;
