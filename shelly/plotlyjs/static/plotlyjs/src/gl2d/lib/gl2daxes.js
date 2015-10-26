'use strict';

var htmlToUnicode = require('../../gl3d/lib/html2unicode');
var str2RGBArray = require('../../gl3d/lib/str2rgbarray');

function Axes2DOptions(scene) {
    this.gl = scene.gl;
    this.pixelRatio = scene.pixelRatio;

    this.screenBox = [0, 0, 1, 1];
    this.viewBox = [0 ,0, 1, 1];
    this.dataBox = [-1, -1, 1, 1];

    this.borderLineEnable = [false, false, false, false];
    this.borderLineWidth = [1, 1, 1, 1];
    this.borderLineColor = [
        [0, 0, 0, 1],
        [0, 0, 0, 1],
        [0, 0, 0, 1],
        [0, 0, 0, 1]
    ];

    this.ticks = [[], []];
    this.tickEnable = [true, true, false, false];
    this.tickPad = [15, 15, 15, 15];
    this.tickAngle = [0, 0, 0, 0];
    this.tickColor = [
        [0, 0, 0, 1],
        [0, 0, 0, 1],
        [0, 0, 0, 1],
        [0, 0, 0, 1]
    ];
    this.tickMarkLength = [0, 0, 0, 0];
    this.tickMarkWidth = [0, 0, 0, 0];
    this.tickMarkColor = [
        [0, 0, 0, 1],
        [0, 0, 0, 1],
        [0, 0, 0, 1],
        [0, 0, 0, 1]
    ];

    this.labels = ['x', 'y'];
    this.labelEnable = [true, true, false, false];
    this.labelAngle  = [0, Math.PI/2, 0, 3.0*Math.PI/2];
    this.labelPad = [15, 15, 15, 15];
    this.labelSize = [12, 12];
    this.labelFont = ['sans-serif', 'sans-serif'];
    this.labelColor = [
        [0, 0, 0, 1],
        [0, 0, 0, 1],
        [0, 0, 0, 1],
        [0, 0, 0, 1]
    ];

    this.title = '';
    this.titleEnable = true;
    this.titleCenter = [0, 0, 0, 0];
    this.titleAngle = 0;
    this.titleColor = [0, 0, 0, 1];
    this.titleFont = 'sans-serif';
    this.titleSize = 18;

    this.gridLineEnable = [true, true];
    this.gridLineColor = [
        [0, 0, 0, 0.5],
        [0, 0, 0, 0.5]
    ];
    this.gridLineWidth = [1, 1];

    this.zeroLineEnable = [true, true];
    this.zeroLineWidth = [1, 1];
    this.zeroLineColor = [
        [0, 0, 0, 1],
        [0, 0, 0, 1]
    ];

    this.borderColor = [0, 0, 0, 0];
    this.backgroundColor = [0, 0, 0, 0];
}

var proto = Axes2DOptions.prototype;

var AXES = ['xaxis', 'yaxis'];

proto.merge = function(options) {

    // titles are rendered in SVG
    this.titleEnable = false;
    this.backgroundColor = str2RGBArray(options.plot_bgcolor);

    var axisName, ax, axTitle;
    var hasAxisInDfltPos, hasAxisInAltrPos, mirrorLines, mirrorTicks;
    var i, j;

    for(i = 0; i < 2; ++i) {
        axisName = AXES[i];
        ax = options[axisName];

        axTitle = /Click to enter .+ title/.test(ax.title) ?  '' : ax.title;

        for(j = 0; j <= 2; j += 2) {
            this.labelEnable[i+j] = false;
            this.labels[i+j] = htmlToUnicode(axTitle);
            this.labelColor[i+j] = str2RGBArray(ax.titlefont.color);
            this.labelFont[i+j] = ax.titlefont.family;
            this.labelSize[i+j] = ax.titlefont.size;
            this.labelPad[i+j] = this.getLabelPad(axisName, ax);

            this.tickEnable[i+j] = false;
            this.tickColor[i+j] = str2RGBArray((ax.tickfont || {}).color);
            this.tickAngle[i+j] = (ax.tickangle === 'auto') ? 0 : -ax.tickangle;
            this.tickPad[i+j] = this.getTickPad(ax);

            this.tickMarkLength[i+j] = 0;
            this.tickMarkWidth[i+j] = ax.tickwidth || 0;
            this.tickMarkColor[i+j] = str2RGBArray(ax.tickcolor);

            this.borderLineEnable[i+j] = false;
            this.borderLineColor[i+j] = str2RGBArray(ax.linecolor);
            this.borderLineWidth[i+j] = ax.linewidth || 0;
        }

        hasAxisInDfltPos = this.hasAxisInDfltPos(axisName, ax);
        hasAxisInAltrPos = this.hasAxisInAltrPos(axisName, ax);
        mirrorLines = (ax.mirror);
        mirrorTicks = (ax.mirror === 'ticks') || (ax.mirror === 'allticks');

        // axis title and tick label can only appear of one side of the scene
        // grid lines and ticks can appear on both sides of the scene

        if(hasAxisInDfltPos) this.labelEnable[i] = true;
        else if(hasAxisInAltrPos) this.labelEnable[i+2] = true;

        if(hasAxisInDfltPos) this.tickEnable[i] = ax.showticklabels;
        else if(hasAxisInAltrPos) this.tickEnable[i+2] = ax.showticklabels;

        if(hasAxisInDfltPos || mirrorLines) this.borderLineEnable[i] = ax.showline;
        if(hasAxisInAltrPos || mirrorLines) this.borderLineEnable[i+2] = ax.showline;

        if(hasAxisInDfltPos || mirrorTicks) this.tickMarkLength[i] = this.getTickMarkLength(ax);
        if(hasAxisInAltrPos || mirrorTicks) this.tickMarkLength[i+2] = this.getTickMarkLength(ax);

        this.gridLineEnable[i] = ax.showgrid;
        this.gridLineColor[i] = str2RGBArray(ax.gridcolor);
        this.gridLineWidth[i] = ax.gridwidth;

        this.zeroLineEnable[i] = ax.zeroline;
        this.zeroLineColor[i] = str2RGBArray(ax.zerolinecolor);
        this.zeroLineWidth[i] = ax.zerolinewidth;
    }

    // TODO fix this in gl-plot2d
    var optionsToReFormat = ['tickMarkLength', 'tickMarkWidth'];
    for(i = 0; i < optionsToReFormat.length; i++) {
        this.reFormatOption(optionsToReFormat[i]);
    }
};

proto.getLabelPad = function(axisName, ax) {
    var offsetBase = 1.5,
        fontSize = ax.titlefont.size,
        showticklabels = ax.showticklabels;

    return {
        xaxis: (ax.side === 'top') ?
            -10 + fontSize * (offsetBase + (showticklabels ? 1 : 0)) :
            -10 + fontSize * (offsetBase + (showticklabels ? 0.5 : 0)),
        yaxis: (ax.side === 'right') ?
            10 + fontSize * (offsetBase + (showticklabels ? 1 : 0.5)) :
            10 + fontSize * (offsetBase + (showticklabels ? 0.5 : 0))
    }[axisName];
};

// has an axis in default position (i.e. bottom/left) ?
proto.hasAxisInDfltPos = function(axisName, ax) {
    var axSide = ax.side;
    return {
        xaxis: (axSide === 'bottom'),
        yaxis: (axSide === 'left')
    }[axisName];
};

// has an axis in alternate position (i.e. top/right) ?
proto.hasAxisInAltrPos = function(axisName, ax) {
    var axSide = ax.side;
    return {
        xaxis: (axSide === 'top'),
        yaxis: (axSide === 'right')
    }[axisName];
};

proto.getTickPad = function(ax) {
    return (ax.ticks === 'outside') ? 10 + ax.ticklen : 15;
};

proto.getTickMarkLength = function(ax) {
    if(!ax.ticks) return 0;

    var ticklen = ax.ticklen;
    return (ax.ticks === 'inside') ? -ticklen : ticklen;
};

// rotate some gl-vis options by 90 degree to be on-par cartesian
proto.reFormatOption = function(optName) {
    var val = this[optName];
    this[optName] = [ val[1], val[0], val[3], val[2] ];
};


function createAxes2D(scene) {
    return new Axes2DOptions(scene);
}

module.exports = createAxes2D;
