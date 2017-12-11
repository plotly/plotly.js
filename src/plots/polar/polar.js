/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var d3 = require('d3');

var Lib = require('../../lib');
var Color = require('../../components/color');
var Drawing = require('../../components/drawing');
var Plots = require('../plots');
var Axes = require('../cartesian/axes');

var MID_SHIFT = require('../../constants/alignment').MID_SHIFT;

var deg2rad = Lib.deg2rad;
var rad2deg = Lib.rad2deg;
var wrap360 = Lib.wrap360;

var constants = require('./constants');
var axisNames = constants.axisNames;

function Polar(gd, id) {
    this.id = id;
    this.gd = gd;

    this.hasClipOnAxisFalse = null;
    this.traceHash = {};
    this.layers = {};
    this.clipPaths = {};
    this.clipIds = {};

    var fullLayout = gd._fullLayout;
    var clipIdBase = 'clip' + fullLayout._uid + id;

    this.clipIds.circle = clipIdBase + '-circle';
    this.clipPaths.circle = fullLayout._clips.append('clipPath')
        .attr('id', this.clipIds.circle)
        .append('path');

    this.framework = fullLayout._polarlayer.append('g')
        .attr('class', id);
}

var proto = Polar.prototype;

module.exports = function createPolar(gd, id) {
    return new Polar(gd, id);
};

proto.plot = function(polarCalcData, fullLayout) {
    var _this = this;
    var polarLayout = fullLayout[_this.id];

    // TODO maybe move to generalUpdatePerTraceModule ?
    _this.hasClipOnAxisFalse = false;
    for(var i = 0; i < polarCalcData.length; i++) {
        var trace = polarCalcData[i][0].trace;

        if(trace.cliponaxis === false) {
            _this.hasClipOnAxisFalse = true;
            break;
        }
    }

    _this.updateLayers(fullLayout, polarLayout);
    _this.updateLayout(fullLayout, polarLayout);
    _this.updateFx(fullLayout, polarLayout);
    Plots.generalUpdatePerTraceModule(_this, polarCalcData, polarLayout);
};

proto.updateLayers = function() {
    var _this = this;
    var layers = _this.layers;

    // TODO sort to implement 'radialaxis.layer' & 'angularaxis.layer
    var layerData = constants.layerNames.slice();

    var join = _this.framework.selectAll('.polarlayer')
        .data(layerData, String);

    join.enter().append('g')
        .attr('class', function(d) { return 'polarlayer ' + d;})
        .each(function(d) {
            var sel = layers[d] = d3.select(this);

            switch(d) {
                case 'frontplot':
                    sel.append('g').classed('scatterlayer', true);
                    break;
                case 'backplot':
                    sel.append('g').classed('maplayer', true);
                    break;
                case 'plotbg':
                    layers.bgcircle = sel.append('path');
                    break;
                case 'grids':
                    axisNames.forEach(function(d) {
                        var k = d + 'grid';
                        layers[k] = sel.append('g')
                            .classed(k, true)
                            .attr('fill', 'none');
                    });
                    break;
                case 'axes':
                    axisNames.forEach(function(d) {
                        layers[d] = sel.append('g').classed(d, true);
                    });
                    break;
                case 'lines':
                    layers.radialline = sel.append('line')
                        .classed('radialline', true)
                        .attr('fill', 'none');
                    layers.angularline = sel.append('path')
                        .classed('angularline', true)
                        .attr('fill', 'none');
                    break;
            }
        });

    join.order();
};

proto.updateLayout = function(fullLayout, polarLayout) {
    var _this = this;
    var layers = _this.layers;
    var gs = fullLayout._size;

    // layout domains
    var xDomain = polarLayout.domain.x;
    var yDomain = polarLayout.domain.y;
    // offsets from paper edge to layout domain box
    _this.xOffset = gs.l + gs.w * xDomain[0];
    _this.yOffset = gs.t + gs.h * (1 - yDomain[1]);
    // lengths of the layout domain box
    var xLength = _this.xLength = gs.w * (xDomain[1] - xDomain[0]);
    var yLength = _this.yLength = gs.h * (yDomain[1] - yDomain[0]);
    // sector to plot
    var sector = _this.sector = polarLayout.sector;
    var sectorBBox = computeSectorBBox(sector);
    var dxSectorBBox = sectorBBox[2] - sectorBBox[0];
    var dySectorBBox = sectorBBox[3] - sectorBBox[1];
    // aspect ratios
    var arDomain = yLength / xLength;
    var arSector = Math.abs(dySectorBBox / dxSectorBBox);
    // actual lengths and domains of subplot box
    var xLength2, yLength2;
    var xDomain2, yDomain2;
    var gap;
    if(arDomain > arSector) {
        xLength2 = xLength;
        yLength2 = xLength * arSector;
        gap = (yLength - yLength2) / gs.h / 2;
        xDomain2 = [xDomain[0], xDomain[1]];
        yDomain2 = [yDomain[0] + gap, yDomain[1] - gap];
    } else {
        xLength2 = yLength / arSector;
        yLength2 = yLength;
        gap = (xLength - xLength2) / gs.w / 2;
        xDomain2 = [xDomain[0] + gap, xDomain[1] - gap];
        yDomain2 = [yDomain[0], yDomain[1]];
    }
    _this.xLength2 = xLength2;
    _this.yLength2 = yLength2;
    _this.xDomain2 = xDomain2;
    _this.yDomain2 = yDomain2;
    // actual offsets from paper edge to the subplot box top-left corner
    var xOffset2 = _this.xOffset2 = gs.l + gs.w * xDomain2[0];
    var yOffset2 = _this.yOffset2 = gs.t + gs.h * (1 - yDomain2[1]);
    // circle radius in px
    var radius = _this.radius = xLength2 / dxSectorBBox;
    // circle center position x position in px
    var cx = _this.cx = xOffset2 - radius * sectorBBox[0];
    // circle center position y position in px
    var cy = _this.cy = yOffset2 + radius * sectorBBox[3];

    _this.updateRadialAxis(fullLayout, polarLayout);
    _this.updateAngularAxis(fullLayout, polarLayout);

    // TODO WAIT this does not work for radialaxis ranges that
    // do not start at 0 !!!

    var rMax = _this.rMax;

    var xaxis = _this.xaxis = {
        type: 'linear',
        _id: 'x',
        range: [sectorBBox[0] * rMax, sectorBBox[2] * rMax],
        domain: xDomain2
    };
    Axes.setConvert(xaxis, fullLayout);
    xaxis.setScale();

    var yaxis = _this.yaxis = {
        type: 'linear',
        _id: 'y',
        range: [sectorBBox[1] * rMax, sectorBBox[3] * rMax],
        domain: yDomain2
    };
    Axes.setConvert(yaxis, fullLayout);
    yaxis.setScale();

    layers.frontplot
        .call(Drawing.setTranslate, xOffset2, yOffset2)
        .call(Drawing.setClipUrl, _this.hasClipOnAxisFalse ? null : _this.clipIds.circle);

    layers.bgcircle.attr({
        d: pathSectorClosed(radius, sector),
        transform: strTranslate(cx, cy)
    })
    .call(Color.fill, polarLayout.bgcolor);

    _this.clipPaths.circle
        .attr('d', pathSectorClosed(radius, sector))
        .attr('transform', strTranslate(cx - xOffset2, cy - yOffset2));
};

proto.updateRadialAxis = function(fullLayout, polarLayout) {
    var _this = this;
    var gd = _this.gd;
    var layers = _this.layers;
    var radius = _this.radius;
    var cx = _this.cx;
    var cy = _this.cy;
    var gs = fullLayout._size;
    var radialLayout = polarLayout.radialaxis;
    var sector = polarLayout.sector;
    var a0 = wrap360(sector[0]);

    var ax = _this.radialAxis = Lib.extendFlat({}, radialLayout, {
        _axislayer: layers.radialaxis,
        _gridlayer: layers.radialaxisgrid,

        // make this an 'x' axis to make positioning (especially rotation) easier
        _id: 'x',
        _pos: 0,

        // radialaxis uses 'top'/'bottom' -> convert to 'x' axis equivalent
        side: {left: 'top', right: 'bottom'}[radialLayout.side],

        // spans length 1 radius
        domain: [0, radius / gs.w],

        // to get _boundingBox computation right when showticklabels is false
        anchor: 'free',
        position: 0,

        // dummy truthy value to make Axes.doTicks draw the grid
        _counteraxis: true
    });

    setScale(ax, radialLayout, fullLayout);
    Axes.doAutoRange(ax);

    // save the max radius after autorange (useful for drawing angular axes)
    _this.rMax = ax.range[1];

    // rotate auto tick labels by 180 if in quadrant II and III to make them
    // readable from left-to-right
    //
    // TODO try moving deeper in doTicks for better results?
    if(ax.tickangle === 'auto' && (a0 > 90 && a0 <= 270)) {
        ax.tickangle = 180;
    }

    // set special grid path function
    ax._gridpath = function(d) {
        var r = ax.c2p(d.x);
        return pathSector(r, sector);
    };

    Axes.doTicks(gd, ax, true);

    layers.radialaxis.attr(
        'transform',
        strTranslate(cx, cy) + strRotate(-radialLayout.position)
    );

    // move all grid paths to about circle center,
    // undo individual grid lines translations
    layers.radialaxisgrid
        .attr('transform', strTranslate(cx, cy))
        .selectAll('path').attr('transform', null);

    layers.radialline.attr({
        display: radialLayout.showline ? null : 'none',
        x1: 0,
        y1: 0,
        x2: radius,
        y2: 0,
        transform: strTranslate(cx, cy) + strRotate(-radialLayout.position)
    })
    .attr('stroke-width', radialLayout.linewidth)
    .call(Color.stroke, radialLayout.linecolor);
};

proto.updateAngularAxis = function(fullLayout, polarLayout) {
    var _this = this;
    var gd = _this.gd;
    var layers = _this.layers;
    var radius = _this.radius;
    var radialAxis = _this.radialAxis;
    var rMax = _this.rMax;
    var cx = _this.cx;
    var cy = _this.cy;
    var angularLayout = polarLayout.angularaxis;
    var sector = polarLayout.sector;

    var ax = _this.angularAxis = Lib.extendFlat({}, angularLayout, {
        _axislayer: layers.angularaxis,
        _gridlayer: layers.angularaxisgrid,

        // angular axes need *special* logic
        _id: 'angular',
        _pos: 0,
        side: 'right',

        // to get auto nticks right!
        // TODO should be function of polar.sector ??
        domain: [0, Math.PI],

        // to get _boundingBox computation right when showticklabels is false
        anchor: 'free',
        position: 0,

        // dummy truthy value to make Axes.doTicks draw the grid
        _counteraxis: true
    });

    // run rad2deg on tick0 and ditck for thetaunit: 'radians' axes
    if(ax.type === 'linear' && ax.thetaunit === 'radians') {
        ax.tick0 = rad2deg(ax.tick0);
        ax.dtick = rad2deg(ax.dtick);
    }

    // Set the angular range in degrees to make auto-tick computation cleaner,
    // changing position/direction should not affect the angular tick labels.
    if(ax.type === 'linear') {
        ax.autorange = false;

        if(isFullCircle(sector)) {
            ax.range = sector.slice();
        } else {
            ax.range = sector.map(deg2rad).map(ax.unTransformRad).map(rad2deg);
        }
    } else {
        // TODO
        // will have to do an autorange for date (and maybe category) axes
        // Axes.doAutoRange(ax);
    }

    setScale(ax, angularLayout, fullLayout);

    // wrapper around c2rad from setConvertAngular
    // note that linear ranges are always set in degrees for Axes.doTicks
    function c2rad(d) {
        return ax.c2rad(d.x, 'degrees');
    }

    // (x,y) at max radius
    function rad2xy(rad) {
        return [
            radialAxis.c2p(rMax * Math.cos(rad)),
            radialAxis.c2p(rMax * Math.sin(rad))
        ];
    }

    ax._transfn = function(d) {
        var rad = c2rad(d);
        var xy = rad2xy(rad);
        var out = strTranslate(cx + xy[0], cy - xy[1]);

        // must also rotate ticks, but don't rotate labels and grid lines
        var sel = d3.select(this);
        if(sel && sel.node() && sel.classed('ticks')) {
            out += strRotate(-rad2deg(rad));
        }

        return out;
    };

    ax._gridpath = function(d) {
        var rad = c2rad(d);
        var xy = rad2xy(rad);
        return 'M0,0L' + (-xy[0]) + ',' + xy[1];
    };

    var offset4fontsize = (angularLayout.ticks !== 'outside' ? 1 : 0.5);

    ax._labelx = function(d) {
        var rad = c2rad(d);
        var labelStandoff = ax._labelStandoff;
        var pad = ax._pad;

        var offset4tx = signSin(rad) === 0 ?
            0 :
            Math.cos(rad) * (labelStandoff + pad + offset4fontsize * d.fontSize);
        var offset4tick = signCos(rad) * (d.dx + labelStandoff + pad);

        return offset4tx + offset4tick;
    };

    ax._labely = function(d) {
        var rad = c2rad(d);
        var labelStandoff = ax._labelStandoff;
        var labelShift = ax._labelShift;
        var pad = ax._pad;

        var offset4tx = d.dy + d.fontSize * MID_SHIFT - labelShift;
        var offset4tick = -Math.sin(rad) * (labelStandoff + pad + offset4fontsize * d.fontSize);

        return offset4tx + offset4tick;
    };

    ax._labelanchor = function(angle, d) {
        var rad = c2rad(d);
        return signSin(rad) === 0 ?
            (signCos(rad) > 0 ? 'start' : 'end') :
            'middle';
    };

    Axes.doTicks(gd, ax, true);

    layers.angularline.attr({
        display: angularLayout.showline ? null : 'none',
        d: pathSectorClosed(radius, sector),
        transform: strTranslate(cx, cy)
    })
    .attr('stroke-width', angularLayout.linewidth)
    .call(Color.stroke, angularLayout.linecolor);
};

proto.isPtWithinSector = function() {
    var sector = this.sector;

    if(isFullCircle(sector)) return true;

    // check out https://stackoverflow.com/a/13675772/4068492
    // for possible solution
    // var deg = wrap360(rad2deg(d.rad));
    return true;
};

function setScale(ax, axLayout, fullLayout) {
    Axes.setConvert(ax, fullLayout);

    // _min and _max are filled in during Axes.expand
    // and cleared during Axes.setConvert
    ax._min = axLayout._min;
    ax._max = axLayout._max;

    ax.setScale();
}

// Finds the bounding box of a given circle sector,
// inspired by https://math.stackexchange.com/q/1852703
//
// assumes:
// - sector[1] < sector[0]
// - counterclockwise rotation
function computeSectorBBox(sector) {
    var s0 = sector[0];
    var s1 = sector[1];
    var arc = s1 - s0;
    var a0 = wrap360(s0);
    var a1 = a0 + arc;

    var ax0 = Math.cos(deg2rad(a0));
    var ay0 = Math.sin(deg2rad(a0));
    var ax1 = Math.cos(deg2rad(a1));
    var ay1 = Math.sin(deg2rad(a1));

    var x0, y0, x1, y1;

    if((a0 <= 90 && a1 >= 90) || (a0 > 90 && a1 >= 450)) {
        y1 = 1;
    } else if(ay0 <= 0 && ay1 <= 0) {
        y1 = 0;
    } else {
        y1 = Math.max(ay0, ay1);
    }

    if((a0 <= 180 && a1 >= 180) || (a0 > 180 && a1 >= 540)) {
        x0 = -1;
    } else if(ax0 >= 0 && ax1 >= 0) {
        x0 = 0;
    } else {
        x0 = Math.min(ax0, ax1);
    }

    if((a0 <= 270 && a1 >= 270) || (a0 > 270 && a1 >= 630)) {
        y0 = -1;
    } else if(ay0 >= 0 && ay1 >= 0) {
        y0 = 0;
    } else {
        y0 = Math.min(ay0, ay1);
    }

    if(a1 >= 360) {
        x1 = 1;
    } else if(ax0 <= 0 && ax1 <= 0) {
        x1 = 0;
    } else {
        x1 = Math.max(ax0, ax1);
    }

    return [x0, y0, x1, y1];
}

function pathSector(r, sector) {
    if(isFullCircle(sector)) {
        return Drawing.symbolFuncs[0](r);
    }

    var xs = r * Math.cos(deg2rad(sector[0]));
    var ys = -r * Math.sin(deg2rad(sector[0]));
    var xe = r * Math.cos(deg2rad(sector[1]));
    var ye = -r * Math.sin(deg2rad(sector[1]));

    var arc = Math.abs(sector[1] - sector[0]);
    var flags = arc <= 180 ? [0, 0, 0] : [0, 1, 0];

    return 'M' + [xs, ys] +
        'A' + [r, r] + ' ' + flags + ' ' + [xe, ye];
}

function pathSectorClosed(r, sector) {
    return pathSector(r, sector) +
        (isFullCircle(sector) ? '' : 'L0,0Z');
}

function isFullCircle(sector) {
    var arc = Math.abs(sector[1] - sector[0]);
    return arc === 360;
}

function strTranslate(x, y) {
    return 'translate(' + x + ',' + y + ')';
}

function strRotate(angle) {
    return 'rotate(' + angle + ')';
}

// because Math.sign(Math.cos(Math.PI / 2)) === 1
// oh javascript ;)
function sign(v) {
    return Math.abs(v) < 1e-10 ? 0 :
        v > 0 ? 1 : -1;
}

function signCos(v) {
    return sign(Math.cos(v));
}

function signSin(v) {
    return sign(Math.sin(v));
}
