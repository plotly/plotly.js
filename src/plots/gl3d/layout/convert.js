/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var convertHTMLToUnicode = require('../../../lib/html2unicode');
var str2RgbaArray = require('../../../lib/str2rgbarray');

var AXES_NAMES = ['xaxis', 'yaxis', 'zaxis'];

function AxesOptions() {
    this.bounds = [
        [-10, -10, -10],
        [10, 10, 10]
    ];

    this.ticks = [ [], [], [] ];
    this.tickEnable = [ true, true, true ];
    this.tickFont = [ 'sans-serif', 'sans-serif', 'sans-serif' ];
    this.tickSize = [ 12, 12, 12 ];
    this.tickAngle = [ 0, 0, 0 ];
    this.tickColor = [ [0, 0, 0, 1], [0, 0, 0, 1], [0, 0, 0, 1] ];
    this.tickPad = [ 18, 18, 18 ];

    this.labels = [ 'x', 'y', 'z' ];
    this.labelEnable = [ true, true, true ];
    this.labelFont = ['Open Sans', 'Open Sans', 'Open Sans'];
    this.labelSize = [ 20, 20, 20 ];
    this.labelAngle = [ 0, 0, 0 ];
    this.labelColor = [ [0, 0, 0, 1], [0, 0, 0, 1], [0, 0, 0, 1] ];
    this.labelPad = [ 30, 30, 30 ];

    this.lineEnable = [ true, true, true ];
    this.lineMirror = [ false, false, false ];
    this.lineWidth = [ 1, 1, 1 ];
    this.lineColor = [ [0, 0, 0, 1], [0, 0, 0, 1], [0, 0, 0, 1] ];

    this.lineTickEnable = [ true, true, true ];
    this.lineTickMirror = [ false, false, false ];
    this.lineTickLength = [ 10, 10, 10 ];
    this.lineTickWidth = [ 1, 1, 1 ];
    this.lineTickColor = [ [0, 0, 0, 1], [0, 0, 0, 1], [0, 0, 0, 1] ];

    this.gridEnable = [ true, true, true ];
    this.gridWidth = [ 1, 1, 1 ];
    this.gridColor = [ [0, 0, 0, 1], [0, 0, 0, 1], [0, 0, 0, 1] ];

    this.zeroEnable = [ true, true, true ];
    this.zeroLineColor = [ [0, 0, 0, 1], [0, 0, 0, 1], [0, 0, 0, 1] ];
    this.zeroLineWidth = [ 2, 2, 2 ];

    this.backgroundEnable = [ true, true, true ];
    this.backgroundColor = [ [0.8, 0.8, 0.8, 0.5],
                              [0.8, 0.8, 0.8, 0.5],
                              [0.8, 0.8, 0.8, 0.5] ];

    // some default values are stored for applying model transforms
    this._defaultTickPad = this.tickPad.slice();
    this._defaultLabelPad = this.labelPad.slice();
    this._defaultLineTickLength = this.lineTickLength.slice();
}

var proto = AxesOptions.prototype;

proto.merge = function(sceneLayout) {
    var opts = this;
    for(var i = 0; i < 3; ++i) {
        var axes = sceneLayout[AXES_NAMES[i]];

        if(!axes.visible) {
            opts.tickEnable[i] = false;
            opts.labelEnable[i] = false;
            opts.lineEnable[i] = false;
            opts.lineTickEnable[i] = false;
            opts.gridEnable[i] = false;
            opts.zeroEnable[i] = false;
            opts.backgroundEnable[i] = false;
            continue;
        }

        // Axes labels
        opts.labels[i] = convertHTMLToUnicode(axes.title);
        if('titlefont' in axes) {
            if(axes.titlefont.color) opts.labelColor[i] = str2RgbaArray(axes.titlefont.color);
            if(axes.titlefont.family) opts.labelFont[i] = axes.titlefont.family;
            if(axes.titlefont.size) opts.labelSize[i] = axes.titlefont.size;
        }

        // Lines
        if('showline' in axes) opts.lineEnable[i] = axes.showline;
        if('linecolor' in axes) opts.lineColor[i] = str2RgbaArray(axes.linecolor);
        if('linewidth' in axes) opts.lineWidth[i] = axes.linewidth;

        if('showgrid' in axes) opts.gridEnable[i] = axes.showgrid;
        if('gridcolor' in axes) opts.gridColor[i] = str2RgbaArray(axes.gridcolor);
        if('gridwidth' in axes) opts.gridWidth[i] = axes.gridwidth;

        // Remove zeroline if axis type is log
        // otherwise the zeroline is incorrectly drawn at 1 on log axes
        if(axes.type === 'log') opts.zeroEnable[i] = false;
        else if('zeroline' in axes) opts.zeroEnable[i] = axes.zeroline;
        if('zerolinecolor' in axes) opts.zeroLineColor[i] = str2RgbaArray(axes.zerolinecolor);
        if('zerolinewidth' in axes) opts.zeroLineWidth[i] = axes.zerolinewidth;

        // tick lines
        if('ticks' in axes && !!axes.ticks) opts.lineTickEnable[i] = true;
        else opts.lineTickEnable[i] = false;

        if('ticklen' in axes) {
            opts.lineTickLength[i] = opts._defaultLineTickLength[i] = axes.ticklen;
        }
        if('tickcolor' in axes) opts.lineTickColor[i] = str2RgbaArray(axes.tickcolor);
        if('tickwidth' in axes) opts.lineTickWidth[i] = axes.tickwidth;
        if('tickangle' in axes) {
            opts.tickAngle[i] = (axes.tickangle === 'auto') ?
                0 :
                Math.PI * -axes.tickangle / 180;
        }
        // tick labels
        if('showticklabels' in axes) opts.tickEnable[i] = axes.showticklabels;
        if('tickfont' in axes) {
            if(axes.tickfont.color) opts.tickColor[i] = str2RgbaArray(axes.tickfont.color);
            if(axes.tickfont.family) opts.tickFont[i] = axes.tickfont.family;
            if(axes.tickfont.size) opts.tickSize[i] = axes.tickfont.size;
        }

        if('mirror' in axes) {
            if(['ticks', 'all', 'allticks'].indexOf(axes.mirror) !== -1) {
                opts.lineTickMirror[i] = true;
                opts.lineMirror[i] = true;
            } else if(axes.mirror === true) {
                opts.lineTickMirror[i] = false;
                opts.lineMirror[i] = true;
            } else {
                opts.lineTickMirror[i] = false;
                opts.lineMirror[i] = false;
            }
        } else opts.lineMirror[i] = false;

        // grid background
        if('showbackground' in axes && axes.showbackground !== false) {
            opts.backgroundEnable[i] = true;
            opts.backgroundColor[i] = str2RgbaArray(axes.backgroundcolor);
        } else opts.backgroundEnable[i] = false;
    }
};


function createAxesOptions(plotlyOptions) {
    var result = new AxesOptions();
    result.merge(plotlyOptions);
    return result;
}

module.exports = createAxesOptions;
