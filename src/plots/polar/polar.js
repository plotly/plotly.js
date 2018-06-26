/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var d3 = require('d3');
var tinycolor = require('tinycolor2');

var Registry = require('../../registry');
var Lib = require('../../lib');
var Color = require('../../components/color');
var Drawing = require('../../components/drawing');
var Plots = require('../plots');
var Axes = require('../cartesian/axes');
var doAutoRange = require('../cartesian/autorange').doAutoRange;
var dragElement = require('../../components/dragelement');
var dragBox = require('../cartesian/dragbox');
var Fx = require('../../components/fx');
var Titles = require('../../components/titles');
var prepSelect = require('../cartesian/select').prepSelect;
var clearSelect = require('../cartesian/select').clearSelect;
var setCursor = require('../../lib/setcursor');
var polygonTester = require('../../lib/polygon').tester;

var MID_SHIFT = require('../../constants/alignment').MID_SHIFT;

var _ = Lib._;
var deg2rad = Lib.deg2rad;
var rad2deg = Lib.rad2deg;
var wrap360 = Lib.wrap360;
var wrap180 = Lib.wrap180;

var setConvertAngular = require('./helpers').setConvertAngular;
var constants = require('./constants');

function Polar(gd, id) {
    this.id = id;
    this.gd = gd;

    this._hasClipOnAxisFalse = null;
    this.vangles = null;
    this.radialAxisAngle = null;
    this.traceHash = {};
    this.layers = {};
    this.clipPaths = {};
    this.clipIds = {};
    this.viewInitial = {};

    var fullLayout = gd._fullLayout;
    var clipIdBase = 'clip' + fullLayout._uid + id;

    this.clipIds.forTraces = clipIdBase + '-for-traces';
    this.clipPaths.forTraces = fullLayout._clips.append('clipPath')
        .attr('id', this.clipIds.forTraces);
    this.clipPaths.forTraces.append('path');

    this.framework = fullLayout._polarlayer.append('g')
        .attr('class', id);

    // unfortunately, we have to keep track of some axis tick settings
    // so that we don't have to call Axes.doTicksSingle with its special redraw flag
    this.radialTickLayout = null;
    this.angularTickLayout = null;
}

var proto = Polar.prototype;

module.exports = function createPolar(gd, id) {
    return new Polar(gd, id);
};

proto.plot = function(polarCalcData, fullLayout) {
    var _this = this;
    var polarLayout = fullLayout[_this.id];

    _this._hasClipOnAxisFalse = false;
    for(var i = 0; i < polarCalcData.length; i++) {
        var trace = polarCalcData[i][0].trace;
        if(trace.cliponaxis === false) {
            _this._hasClipOnAxisFalse = true;
            break;
        }
    }

    _this.updateLayers(fullLayout, polarLayout);
    _this.updateLayout(fullLayout, polarLayout);
    Plots.generalUpdatePerTraceModule(_this.gd, _this, polarCalcData, polarLayout);
    _this.updateFx(fullLayout, polarLayout);
};

proto.updateLayers = function(fullLayout, polarLayout) {
    var _this = this;
    var layers = _this.layers;
    var radialLayout = polarLayout.radialaxis;
    var angularLayout = polarLayout.angularaxis;
    var layerNames = constants.layerNames;

    var frontPlotIndex = layerNames.indexOf('frontplot');
    var layerData = layerNames.slice(0, frontPlotIndex);
    var isAngularAxisBelowTraces = angularLayout.layer === 'below traces';
    var isRadialAxisBelowTraces = radialLayout.layer === 'below traces';

    if(isAngularAxisBelowTraces) layerData.push('angular-axis');
    if(isRadialAxisBelowTraces) layerData.push('radial-axis');
    if(isAngularAxisBelowTraces) layerData.push('angular-line');
    if(isRadialAxisBelowTraces) layerData.push('radial-line');

    layerData.push('frontplot');

    if(!isAngularAxisBelowTraces) layerData.push('angular-axis');
    if(!isRadialAxisBelowTraces) layerData.push('radial-axis');
    if(!isAngularAxisBelowTraces) layerData.push('angular-line');
    if(!isRadialAxisBelowTraces) layerData.push('radial-line');

    var join = _this.framework.selectAll('.polarsublayer')
        .data(layerData, String);

    join.enter().append('g')
        .attr('class', function(d) { return 'polarsublayer ' + d;})
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
                    layers.bg = sel.append('path');
                    break;
                case 'radial-grid':
                    sel.style('fill', 'none');
                    sel.append('g').classed('x', 1);
                    break;
                case 'angular-grid':
                    sel.style('fill', 'none');
                    sel.append('g').classed('angular', 1);
                    break;
                case 'radial-line':
                    sel.append('line').style('fill', 'none');
                    break;
                case 'angular-line':
                    sel.append('path').style('fill', 'none');
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
    var sectorBBox = _this.sectorBBox = computeSectorBBox(sector);
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
    // circle center position in px
    var cx = _this.cx = xOffset2 - radius * sectorBBox[0];
    var cy = _this.cy = yOffset2 + radius * sectorBBox[3];
    // circle center in the coordinate system of plot area
    var cxx = _this.cxx = cx - xOffset2;
    var cyy = _this.cyy = cy - yOffset2;

    var mockOpts = {
        // to get _boundingBox computation right when showticklabels is false
        anchor: 'free',
        position: 0,
        // dummy truthy value to make Axes.doTicksSingle draw the grid
        _counteraxis: true,
        // don't use automargins routine for labels
        automargin: false
    };

    _this.radialAxis = Lib.extendFlat({}, polarLayout.radialaxis, mockOpts, {
        _axislayer: layers['radial-axis'],
        _gridlayer: layers['radial-grid'],
        // make this an 'x' axis to make positioning (especially rotation) easier
        _id: 'x',
        _pos: 0,
        // convert to 'x' axis equivalent
        side: {
            counterclockwise: 'top',
            clockwise: 'bottom'
        }[polarLayout.radialaxis.side],
        // spans length 1 radius
        domain: [0, radius / gs.w]
    });

    _this.angularAxis = Lib.extendFlat({}, polarLayout.angularaxis, mockOpts, {
        _axislayer: layers['angular-axis'],
        _gridlayer: layers['angular-grid'],
        // angular axes need *special* logic
        _id: 'angular',
        _pos: 0,
        side: 'right',
        // to get auto nticks right
        domain: [0, Math.PI],
        // don't pass through autorange logic
        autorange: false
    });

    _this.doAutoRange(fullLayout, polarLayout);
    // N.B. this sets _this.vangles
    _this.updateAngularAxis(fullLayout, polarLayout);
    // N.B. this sets _this.radialAxisAngle
    _this.updateRadialAxis(fullLayout, polarLayout);
    _this.updateRadialAxisTitle(fullLayout, polarLayout);

    var radialRange = _this.radialAxis.range;
    var rSpan = radialRange[1] - radialRange[0];

    var xaxis = _this.xaxis = {
        type: 'linear',
        _id: 'x',
        range: [sectorBBox[0] * rSpan, sectorBBox[2] * rSpan],
        domain: xDomain2
    };
    Axes.setConvert(xaxis, fullLayout);
    xaxis.setScale();

    var yaxis = _this.yaxis = {
        type: 'linear',
        _id: 'y',
        range: [sectorBBox[1] * rSpan, sectorBBox[3] * rSpan],
        domain: yDomain2
    };
    Axes.setConvert(yaxis, fullLayout);
    yaxis.setScale();

    xaxis.isPtWithinRange = function(d) { return _this.isPtWithinSector(d); };
    yaxis.isPtWithinRange = function() { return true; };

    _this.clipPaths.forTraces.select('path')
        .attr('d', pathSectorClosed(radius, sector, _this.vangles))
        .attr('transform', strTranslate(cxx, cyy));

    layers.frontplot
        .attr('transform', strTranslate(xOffset2, yOffset2))
        .call(Drawing.setClipUrl, _this._hasClipOnAxisFalse ? null : _this.clipIds.forTraces);

    layers.bg
        .attr('d', pathSectorClosed(radius, sector, _this.vangles))
        .attr('transform', strTranslate(cx, cy))
        .call(Color.fill, polarLayout.bgcolor);

    // remove crispEdges - all the off-square angles in polar plots
    // make these counterproductive.
    _this.framework.selectAll('.crisp').classed('crisp', 0);
};

proto.doAutoRange = function(fullLayout, polarLayout) {
    var radialLayout = polarLayout.radialaxis;
    var ax = this.radialAxis;

    setScale(ax, radialLayout, fullLayout);
    doAutoRange(ax);

    radialLayout.range = ax.range.slice();
    radialLayout._input.range = ax.range.slice();
};

proto.updateRadialAxis = function(fullLayout, polarLayout) {
    var _this = this;
    var gd = _this.gd;
    var layers = _this.layers;
    var radius = _this.radius;
    var cx = _this.cx;
    var cy = _this.cy;
    var radialLayout = polarLayout.radialaxis;
    var sector = polarLayout.sector;
    var a0 = wrap360(sector[0]);
    var ax = _this.radialAxis;

    _this.fillViewInitialKey('radialaxis.angle', radialLayout.angle);
    _this.fillViewInitialKey('radialaxis.range', ax.range.slice());

    // rotate auto tick labels by 180 if in quadrant II and III to make them
    // readable from left-to-right
    //
    // TODO try moving deeper in doTicksSingle for better results?
    if(ax.tickangle === 'auto' && (a0 > 90 && a0 <= 270)) {
        ax.tickangle = 180;
    }

    // easier to set rotate angle with custom translate function
    ax._transfn = function(d) {
        return 'translate(' + ax.l2p(d.x) + ',0)';
    };

    // set special grid path function
    ax._gridpath = function(d) {
        var r = ax.r2p(d.x);
        return pathSector(r, sector, _this.vangles);
    };

    var newTickLayout = strTickLayout(radialLayout);
    if(_this.radialTickLayout !== newTickLayout) {
        layers['radial-axis'].selectAll('.xtick').remove();
        _this.radialTickLayout = newTickLayout;
    }

    Axes.doTicksSingle(gd, ax, true);

    // stash 'actual' radial axis angle for drag handlers (in degrees)
    var angle = _this.radialAxisAngle = _this.vangles ?
        rad2deg(snapToVertexAngle(deg2rad(radialLayout.angle), _this.vangles)) :
        radialLayout.angle;

    var trans = strTranslate(cx, cy) + strRotate(-angle);

    updateElement(layers['radial-axis'], radialLayout.showticklabels || radialLayout.ticks, {
        transform: trans
    });

    // move all grid paths to about circle center,
    // undo individual grid lines translations
    updateElement(layers['radial-grid'], radialLayout.showgrid, {
        transform: strTranslate(cx, cy)
    })
    .selectAll('path').attr('transform', null);

    updateElement(layers['radial-line'].select('line'), radialLayout.showline, {
        x1: 0,
        y1: 0,
        x2: radius,
        y2: 0,
        transform: trans
    })
    .attr('stroke-width', radialLayout.linewidth)
    .call(Color.stroke, radialLayout.linecolor);
};

proto.updateRadialAxisTitle = function(fullLayout, polarLayout, _angle) {
    var _this = this;
    var gd = _this.gd;
    var radius = _this.radius;
    var cx = _this.cx;
    var cy = _this.cy;
    var radialLayout = polarLayout.radialaxis;
    var titleClass = _this.id + 'title';

    var angle = _angle !== undefined ? _angle : _this.radialAxisAngle;
    var angleRad = deg2rad(angle);
    var cosa = Math.cos(angleRad);
    var sina = Math.sin(angleRad);

    var pad = 0;
    if(radialLayout.title) {
        var h = Drawing.bBox(_this.layers['radial-axis'].node()).height;
        var ts = radialLayout.titlefont.size;
        pad = radialLayout.side === 'counterclockwise' ?
            -h - ts * 0.4 :
            h + ts * 0.8;
    }

    _this.layers['radial-axis-title'] = Titles.draw(gd, titleClass, {
        propContainer: radialLayout,
        propName: _this.id + '.radialaxis.title',
        placeholder: _(gd, 'Click to enter radial axis title'),
        attributes: {
            x: cx + (radius / 2) * cosa + pad * sina,
            y: cy - (radius / 2) * sina + pad * cosa,
            'text-anchor': 'middle'
        },
        transform: {rotate: -angle}
    });
};

proto.updateAngularAxis = function(fullLayout, polarLayout) {
    var _this = this;
    var gd = _this.gd;
    var layers = _this.layers;
    var radius = _this.radius;
    var cx = _this.cx;
    var cy = _this.cy;
    var angularLayout = polarLayout.angularaxis;
    var sector = polarLayout.sector;
    var sectorInRad = sector.map(deg2rad);
    var ax = _this.angularAxis;

    _this.fillViewInitialKey('angularaxis.rotation', angularLayout.rotation);

    // wrapper around c2rad from setConvertAngular
    // note that linear ranges are always set in degrees for Axes.doTicksSingle
    function c2rad(d) {
        return ax.c2rad(d.x, 'degrees');
    }

    // (x,y) at max radius
    function rad2xy(rad) {
        return [radius * Math.cos(rad), radius * Math.sin(rad)];
    }

    // Set the angular range in degrees to make auto-tick computation cleaner,
    // changing rotation/direction should not affect the angular tick labels.
    if(ax.type === 'linear') {
        if(isFullCircle(sector)) {
            ax.range = sector.slice();
        } else {
            ax.range = sectorInRad.map(ax.unTransformRad).map(rad2deg);
        }

        // run rad2deg on tick0 and ditck for thetaunit: 'radians' axes
        if(ax.thetaunit === 'radians') {
            ax.tick0 = rad2deg(ax.tick0);
            ax.dtick = rad2deg(ax.dtick);
        }

    }
    // Use tickval filter for category axes instead of tweaking
    // the range w.r.t sector, so that sectors that cross 360 can
    // show all their ticks.
    else if(ax.type === 'category') {
        var period = angularLayout.period ?
            Math.max(angularLayout.period, angularLayout._categories.length) :
            angularLayout._categories.length;

        ax.range = [0, period];
        ax._tickFilter = function(d) { return isAngleInSector(c2rad(d), sector); };
    }

    setScale(ax, angularLayout, fullLayout);

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

    var offset4fontsize = (angularLayout.ticks !== 'outside' ? 0.7 : 0.5);

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

    var newTickLayout = strTickLayout(angularLayout);
    if(_this.angularTickLayout !== newTickLayout) {
        layers['angular-axis'].selectAll('.angulartick').remove();
        _this.angularTickLayout = newTickLayout;
    }

    Axes.doTicksSingle(gd, ax, true);

    // angle of polygon vertices in radians (null means circles)
    // TODO what to do when ax.period > ax._categories ??
    var vangles;
    if(polarLayout.gridshape === 'linear') {
        vangles = ax._vals.map(c2rad);

        // ax._vals should be always ordered, make them
        // always turn counterclockwise for convenience here
        if(angleDelta(vangles[0], vangles[1]) < 0) {
            vangles = vangles.slice().reverse();
        }
    } else {
        vangles = null;
    }
    _this.vangles = vangles;

    updateElement(layers['angular-line'].select('path'), angularLayout.showline, {
        d: pathSectorClosed(radius, sector, vangles),
        transform: strTranslate(cx, cy)
    })
    .attr('stroke-width', angularLayout.linewidth)
    .call(Color.stroke, angularLayout.linecolor);
};

proto.updateFx = function(fullLayout, polarLayout) {
    if(!this.gd._context.staticPlot) {
        this.updateAngularDrag(fullLayout, polarLayout);
        this.updateRadialDrag(fullLayout, polarLayout);
        this.updateMainDrag(fullLayout, polarLayout);
    }
};

proto.updateMainDrag = function(fullLayout, polarLayout) {
    var _this = this;
    var gd = _this.gd;
    var layers = _this.layers;
    var zoomlayer = fullLayout._zoomlayer;
    var MINZOOM = constants.MINZOOM;
    var OFFEDGE = constants.OFFEDGE;
    var radius = _this.radius;
    var cx = _this.cx;
    var cy = _this.cy;
    var cxx = _this.cxx;
    var cyy = _this.cyy;
    var sector = polarLayout.sector;
    var vangles = _this.vangles;
    var chw = constants.cornerHalfWidth;
    var chl = constants.cornerLen / 2;

    var mainDrag = dragBox.makeDragger(layers, 'path', 'maindrag', 'crosshair');

    d3.select(mainDrag)
        .attr('d', pathSectorClosed(radius, sector, vangles))
        .attr('transform', strTranslate(cx, cy));

    var dragOpts = {
        element: mainDrag,
        gd: gd,
        subplot: _this.id,
        plotinfo: {
            xaxis: _this.xaxis,
            yaxis: _this.yaxis
        },
        xaxes: [_this.xaxis],
        yaxes: [_this.yaxis]
    };

    // mouse px position at drag start (0), move (1)
    var x0, y0;
    // radial distance from circle center at drag start (0), move (1)
    var r0, r1;
    // zoombox persistent quantities
    var path0, dimmed, lum;
    // zoombox, corners elements
    var zb, corners;

    function norm(x, y) {
        return Math.sqrt(x * x + y * y);
    }

    function xy2r(x, y) {
        return norm(x - cxx, y - cyy);
    }

    function xy2a(x, y) {
        return Math.atan2(cyy - y, x - cxx);
    }

    function ra2xy(r, a) {
        return [r * Math.cos(a), r * Math.sin(-a)];
    }

    function _pathSectorClosed(r) {
        return pathSectorClosed(r, sector, vangles);
    }

    function pathCorner(r, a) {
        if(r === 0) return _pathSectorClosed(2 * chw);

        var da = chl / r;
        var am = a - da;
        var ap = a + da;
        var rb = Math.max(0, Math.min(r, radius));
        var rm = rb - chw;
        var rp = rb + chw;

        return 'M' + ra2xy(rm, am) +
            'A' + [rm, rm] + ' 0,0,0 ' + ra2xy(rm, ap) +
            'L' + ra2xy(rp, ap) +
            'A' + [rp, rp] + ' 0,0,1 ' + ra2xy(rp, am) +
            'Z';
    }

    // (x,y) is the pt at middle of the va0 <-> va1 edge
    //
    // ... we could eventually add another mode for cursor
    // angles 'close to' enough to a particular vertex.
    function pathCornerForPolygons(r, va0, va1) {
        if(r === 0) return _pathSectorClosed(2 * chw);

        var xy0 = ra2xy(r, va0);
        var xy1 = ra2xy(r, va1);
        var x = clampTiny((xy0[0] + xy1[0]) / 2);
        var y = clampTiny((xy0[1] + xy1[1]) / 2);
        var innerPts, outerPts;

        if(x && y) {
            var m = y / x;
            var mperp = -1 / m;
            var midPts = findXYatLength(chw, m, x, y);
            innerPts = findXYatLength(chl, mperp, midPts[0][0], midPts[0][1]);
            outerPts = findXYatLength(chl, mperp, midPts[1][0], midPts[1][1]);
        } else {
            var dx, dy;
            if(y) {
                // horizontal handles
                dx = chl;
                dy = chw;
            } else {
                // vertical handles
                dx = chw;
                dy = chl;
            }
            innerPts = [[x - dx, y - dy], [x + dx, y - dy]];
            outerPts = [[x - dx, y + dy], [x + dx, y + dy]];
        }

        return 'M' + innerPts.join('L') +
            'L' + outerPts.reverse().join('L') + 'Z';
    }

    function zoomPrep() {
        r0 = null;
        r1 = null;
        path0 = _pathSectorClosed(radius);
        dimmed = false;

        var polarLayoutNow = gd._fullLayout[_this.id];
        lum = tinycolor(polarLayoutNow.bgcolor).getLuminance();

        zb = dragBox.makeZoombox(zoomlayer, lum, cx, cy, path0);
        zb.attr('fill-rule', 'evenodd');
        corners = dragBox.makeCorners(zoomlayer, cx, cy);
        clearSelect(zoomlayer);
    }

    // N.B. this sets scoped 'r0' and 'r1'
    // return true if 'valid' zoom distance, false otherwise
    function clampAndSetR0R1(rr0, rr1) {
        rr1 = Math.min(rr1, radius);

        // starting or ending drag near center (outer edge),
        // clamps radial distance at origin (at r=radius)
        if(rr0 < OFFEDGE) rr0 = 0;
        else if((radius - rr0) < OFFEDGE) rr0 = radius;
        else if(rr1 < OFFEDGE) rr1 = 0;
        else if((radius - rr1) < OFFEDGE) rr1 = radius;

        // make sure r0 < r1,
        // to get correct fill pattern in path1 below
        if(Math.abs(rr1 - rr0) > MINZOOM) {
            if(rr0 < rr1) {
                r0 = rr0;
                r1 = rr1;
            } else {
                r0 = rr1;
                r1 = rr0;
            }
            return true;
        } else {
            r0 = null;
            r1 = null;
            return false;
        }
    }

    function applyZoomMove(path1, cpath) {
        path1 = path1 || path0;
        cpath = cpath || 'M0,0Z';

        zb.attr('d', path1);
        corners.attr('d', cpath);
        dragBox.transitionZoombox(zb, corners, dimmed, lum);
        dimmed = true;
    }

    function zoomMove(dx, dy) {
        var x1 = x0 + dx;
        var y1 = y0 + dy;
        var rr0 = xy2r(x0, y0);
        var rr1 = Math.min(xy2r(x1, y1), radius);
        var a0 = xy2a(x0, y0);
        var path1;
        var cpath;

        if(clampAndSetR0R1(rr0, rr1)) {
            path1 = path0 + _pathSectorClosed(r1) + _pathSectorClosed(r0);
            // keep 'starting' angle
            cpath = pathCorner(r0, a0) + pathCorner(r1, a0);
        }
        applyZoomMove(path1, cpath);
    }

    function findEnclosingVertexAngles(a) {
        var i0 = findIndexOfMin(vangles, function(v) {
            var adelta = angleDelta(v, a);
            return adelta > 0 ? adelta : Infinity;
        });
        var i1 = Lib.mod(i0 + 1, vangles.length);
        return [vangles[i0], vangles[i1]];
    }

    function findPolygonRadius(x, y, va0, va1) {
        var xy = findIntersectionXY(va0, va1, va0, [x - cxx, cyy - y]);
        return norm(xy[0], xy[1]);
    }

    function zoomMoveForPolygons(dx, dy) {
        var x1 = x0 + dx;
        var y1 = y0 + dy;
        var a0 = xy2a(x0, y0);
        var a1 = xy2a(x1, y1);
        var vangles0 = findEnclosingVertexAngles(a0);
        var vangles1 = findEnclosingVertexAngles(a1);
        var rr0 = findPolygonRadius(x0, y0, vangles0[0], vangles0[1]);
        var rr1 = Math.min(findPolygonRadius(x1, y1, vangles1[0], vangles1[1]), radius);
        var path1;
        var cpath;

        if(clampAndSetR0R1(rr0, rr1)) {
            path1 = path0 + _pathSectorClosed(r1) + _pathSectorClosed(r0);
            // keep 'starting' angle here too
            cpath = [
                pathCornerForPolygons(r0, vangles0[0], vangles0[1]),
                pathCornerForPolygons(r1, vangles0[0], vangles0[1])
            ].join(' ');
        }
        applyZoomMove(path1, cpath);
    }

    function zoomDone() {
        dragBox.removeZoombox(gd);

        if(r0 === null || r1 === null) return;

        dragBox.showDoubleClickNotifier(gd);

        var radialAxis = _this.radialAxis;
        var radialRange = radialAxis.range;
        var drange = radialRange[1] - radialRange[0];
        var updateObj = {};
        updateObj[_this.id + '.radialaxis.range'] = [
            radialRange[0] + r0 * drange / radius,
            radialRange[0] + r1 * drange / radius
        ];

        Registry.call('relayout', gd, updateObj);
    }

    dragOpts.prepFn = function(evt, startX, startY) {
        var dragModeNow = gd._fullLayout.dragmode;

        var bbox = mainDrag.getBoundingClientRect();
        x0 = startX - bbox.left;
        y0 = startY - bbox.top;

        // need to offset x/y as bbox center does not
        // match origin for asymmetric polygons
        if(vangles) {
            var offset = findPolygonOffset(radius, sector, vangles);
            x0 += cxx + offset[0];
            y0 += cyy + offset[1];
        }

        switch(dragModeNow) {
            case 'zoom':
                if(vangles) {
                    dragOpts.moveFn = zoomMoveForPolygons;
                } else {
                    dragOpts.moveFn = zoomMove;
                }
                dragOpts.doneFn = zoomDone;
                zoomPrep(evt, startX, startY);
                break;
            case 'select':
            case 'lasso':
                prepSelect(evt, startX, startY, dragOpts, dragModeNow);
                break;
        }
    };

    dragOpts.clickFn = function(numClicks, evt) {
        dragBox.removeZoombox(gd);

        // TODO double once vs twice logic (autorange vs fixed range)
        if(numClicks === 2) {
            var updateObj = {};
            for(var k in _this.viewInitial) {
                updateObj[_this.id + '.' + k] = _this.viewInitial[k];
            }

            gd.emit('plotly_doubleclick', null);
            Registry.call('relayout', gd, updateObj);
        }

        Fx.click(gd, evt, _this.id);
    };

    mainDrag.onmousemove = function(evt) {
        Fx.hover(gd, evt, _this.id);
        gd._fullLayout._lasthover = mainDrag;
        gd._fullLayout._hoversubplot = _this.id;
    };

    mainDrag.onmouseout = function(evt) {
        if(gd._dragging) return;
        dragElement.unhover(gd, evt);
    };

    dragElement.init(dragOpts);
};

proto.updateRadialDrag = function(fullLayout, polarLayout) {
    var _this = this;
    var gd = _this.gd;
    var layers = _this.layers;
    var radius = _this.radius;
    var cx = _this.cx;
    var cy = _this.cy;
    var radialAxis = _this.radialAxis;
    var radialLayout = polarLayout.radialaxis;
    var angle0 = deg2rad(_this.radialAxisAngle);
    var range0 = radialAxis.range.slice();
    var drange = range0[1] - range0[0];
    var bl = constants.radialDragBoxSize;
    var bl2 = bl / 2;

    if(!radialLayout.visible) return;

    var radialDrag = dragBox.makeRectDragger(layers, 'radialdrag', 'crosshair', -bl2, -bl2, bl, bl);
    var dragOpts = {element: radialDrag, gd: gd};
    var tx = cx + (radius + bl2) * Math.cos(angle0);
    var ty = cy - (radius + bl2) * Math.sin(angle0);

    d3.select(radialDrag)
        .attr('transform', strTranslate(tx, ty));

    // move function (either rotate or re-range flavor)
    var moveFn2;
    // rotate angle on done
    var angle1;
    // re-range range[1] on done
    var rng1;

    function moveFn(dx, dy) {
        if(moveFn2) {
            moveFn2(dx, dy);
        } else {
            var dvec = [dx, -dy];
            var rvec = [Math.cos(angle0), Math.sin(angle0)];
            var comp = Math.abs(Lib.dot(dvec, rvec) / Math.sqrt(Lib.dot(dvec, dvec)));

            // mostly perpendicular motions rotate,
            // mostly parallel motions re-range
            if(!isNaN(comp)) {
                moveFn2 = comp < 0.5 ? rotateMove : rerangeMove;
            }
        }
    }

    function doneFn() {
        if(angle1 !== null) {
            Registry.call('relayout', gd, _this.id + '.radialaxis.angle', angle1);
        } else if(rng1 !== null) {
            Registry.call('relayout', gd, _this.id + '.radialaxis.range[1]', rng1);
        }
    }

    function rotateMove(dx, dy) {
        var x1 = tx + dx;
        var y1 = ty + dy;

        angle1 = Math.atan2(cy - y1, x1 - cx);
        if(_this.vangles) angle1 = snapToVertexAngle(angle1, _this.vangles);
        angle1 = rad2deg(angle1);

        var transform = strTranslate(cx, cy) + strRotate(-angle1);
        layers['radial-axis'].attr('transform', transform);
        layers['radial-line'].select('line').attr('transform', transform);

        var fullLayoutNow = _this.gd._fullLayout;
        var polarLayoutNow = fullLayoutNow[_this.id];
        _this.updateRadialAxisTitle(fullLayoutNow, polarLayoutNow, angle1);
    }

    function rerangeMove(dx, dy) {
        // project (dx, dy) unto unit radial axis vector
        var dr = Lib.dot([dx, -dy], [Math.cos(angle0), Math.sin(angle0)]);
        var rprime = range0[1] - drange * dr / radius * 0.75;

        // make sure new range[1] does not change the range[0] -> range[1] sign
        if((drange > 0) !== (rprime > range0[0])) return;
        rng1 = radialAxis.range[1] = rprime;

        Axes.doTicksSingle(gd, _this.radialAxis, true);
        layers['radial-grid']
            .attr('transform', strTranslate(cx, cy))
            .selectAll('path').attr('transform', null);

        var rSpan = rng1 - range0[0];
        var sectorBBox = _this.sectorBBox;
        _this.xaxis.range = [sectorBBox[0] * rSpan, sectorBBox[2] * rSpan];
        _this.yaxis.range = [sectorBBox[1] * rSpan, sectorBBox[3] * rSpan];
        _this.xaxis.setScale();
        _this.yaxis.setScale();

        for(var k in _this.traceHash) {
            var moduleCalcData = _this.traceHash[k];
            var moduleCalcDataVisible = Lib.filterVisible(moduleCalcData);
            var _module = moduleCalcData[0][0].trace._module;
            var polarLayoutNow = gd._fullLayout[_this.id];

            _module.plot(gd, _this, moduleCalcDataVisible, polarLayoutNow);

            if(!Registry.traceIs(k, 'gl')) {
                for(var i = 0; i < moduleCalcDataVisible.length; i++) {
                    _module.style(gd, moduleCalcDataVisible[i]);
                }
            }
        }
    }

    dragOpts.prepFn = function() {
        moveFn2 = null;
        angle1 = null;
        rng1 = null;

        dragOpts.moveFn = moveFn;
        dragOpts.doneFn = doneFn;

        clearSelect(fullLayout._zoomlayer);
    };

    dragOpts.clampFn = function(dx, dy) {
        if(Math.sqrt(dx * dx + dy * dy) < constants.MINDRAG) {
            dx = 0;
            dy = 0;
        }
        return [dx, dy];
    };

    dragElement.init(dragOpts);
};

proto.updateAngularDrag = function(fullLayout, polarLayout) {
    var _this = this;
    var gd = _this.gd;
    var layers = _this.layers;
    var radius = _this.radius;
    var cx = _this.cx;
    var cy = _this.cy;
    var cxx = _this.cxx;
    var cyy = _this.cyy;
    var sector = polarLayout.sector;
    var dbs = constants.angularDragBoxSize;

    var angularDrag = dragBox.makeDragger(layers, 'path', 'angulardrag', 'move');
    var dragOpts = {element: angularDrag, gd: gd};
    var angularDragPath;

    if(_this.vangles) {
        // use evenodd svg rule
        var outer = invertY(makePolygon(radius + dbs, sector, _this.vangles));
        var inner = invertY(makePolygon(radius, sector, _this.vangles));
        angularDragPath = 'M' + outer.reverse().join('L') + 'M' + inner.join('L');
    } else {
        angularDragPath = pathAnnulus(radius, radius + dbs, sector);
    }

    d3.select(angularDrag)
        .attr('d', angularDragPath)
        .attr('transform', strTranslate(cx, cy))
        .call(setCursor, 'move');

    function xy2a(x, y) {
        return Math.atan2(cyy + dbs - y, x - cxx - dbs);
    }

    // scatter trace, points and textpoints selections
    var scatterTraces = layers.frontplot.select('.scatterlayer').selectAll('.trace');
    var scatterPoints = scatterTraces.selectAll('.point');
    var scatterTextPoints = scatterTraces.selectAll('.textpoint');

    // mouse px position at drag start (0), move (1)
    var x0, y0;
    // angular axis angle rotation at drag start (0), move (1)
    var rot0, rot1;
    // induced radial axis rotation (only used on polygon grids)
    var rrot1;
    // copy of polar sector value at drag start
    var sector0;
    // angle about circle center at drag start
    var a0;

    function moveFn(dx, dy) {
        var fullLayoutNow = _this.gd._fullLayout;
        var polarLayoutNow = fullLayoutNow[_this.id];
        var x1 = x0 + dx;
        var y1 = y0 + dy;
        var a1 = xy2a(x1, y1);
        var da = rad2deg(a1 - a0);
        rot1 = rot0 + da;

        layers.frontplot.attr('transform',
            strTranslate(_this.xOffset2, _this.yOffset2) + strRotate([-da, cxx, cyy])
        );

        if(_this.vangles) {
            rrot1 = _this.radialAxisAngle + da;

            var trans = strTranslate(cx, cy) + strRotate(-da);
            var trans2 = strTranslate(cx, cy) + strRotate(-rrot1);

            layers.bg.attr('transform', trans);
            layers['radial-grid'].attr('transform', trans);
            layers['angular-line'].select('path').attr('transform', trans);
            layers['radial-axis'].attr('transform', trans2);
            layers['radial-line'].select('line').attr('transform', trans2);
            _this.updateRadialAxisTitle(fullLayoutNow, polarLayoutNow, rrot1);
        } else {
            _this.clipPaths.forTraces.select('path').attr('transform',
                strTranslate(cxx, cyy) + strRotate(da)
            );
        }

        // 'un-rotate' marker and text points
        scatterPoints.each(function() {
            var sel = d3.select(this);
            var xy = Drawing.getTranslate(sel);
            sel.attr('transform', strTranslate(xy.x, xy.y) + strRotate([da]));
        });
        scatterTextPoints.each(function() {
            var sel = d3.select(this);
            var tx = sel.select('text');
            var xy = Drawing.getTranslate(sel);
            // N.B rotate -> translate ordering matters
            sel.attr('transform', strRotate([da, tx.attr('x'), tx.attr('y')]) + strTranslate(xy.x, xy.y));
        });

        var angularAxis = _this.angularAxis;
        angularAxis.rotation = wrap180(rot1);

        if(angularAxis.type === 'linear' && !isFullCircle(sector)) {
            angularAxis.range = sector0
                .map(deg2rad)
                .map(angularAxis.unTransformRad)
                .map(rad2deg);
        }

        setConvertAngular(angularAxis);
        Axes.doTicksSingle(gd, angularAxis, true);

        if(_this._hasClipOnAxisFalse && !isFullCircle(sector)) {
            // mutate sector to trick isPtWithinSector
            _this.sector = [sector0[0] - da, sector0[1] - da];
            scatterTraces.call(Drawing.hideOutsideRangePoints, _this);
        }

        for(var k in _this.traceHash) {
            if(Registry.traceIs(k, 'gl')) {
                var moduleCalcData = _this.traceHash[k];
                var moduleCalcDataVisible = Lib.filterVisible(moduleCalcData);
                var _module = moduleCalcData[0][0].trace._module;
                _module.plot(gd, _this, moduleCalcDataVisible, polarLayoutNow);
            }
        }
    }

    function doneFn() {
        scatterTextPoints.select('text').attr('transform', null);

        var updateObj = {};
        updateObj[_this.id + '.angularaxis.rotation'] = rot1;

        if(_this.vangles) {
            updateObj[_this.id + '.radialaxis.angle'] = rrot1;
        }

        Registry.call('relayout', gd, updateObj);
    }

    dragOpts.prepFn = function(evt, startX, startY) {
        var polarLayoutNow = fullLayout[_this.id];
        sector0 = polarLayoutNow.sector.slice();
        rot0 = polarLayoutNow.angularaxis.rotation;

        var bbox = angularDrag.getBoundingClientRect();
        x0 = startX - bbox.left;
        y0 = startY - bbox.top;
        a0 = xy2a(x0, y0);

        dragOpts.moveFn = moveFn;
        dragOpts.doneFn = doneFn;

        clearSelect(fullLayout._zoomlayer);
    };

    // I don't what we should do in this case, skip we now
    if(_this.vangles && !isFullCircle(sector)) {
        dragOpts.prepFn = Lib.noop;
        setCursor(d3.select(angularDrag), null);
    }

    dragElement.init(dragOpts);
};

proto.isPtWithinSector = function(d) {
    var sector = this.sector;

    if(!isAngleInSector(d.rad, sector)) {
        return false;
    }

    var vangles = this.vangles;
    var radialAxis = this.radialAxis;
    var radialRange = radialAxis.range;
    var r = radialAxis.c2r(d.r);

    var r0, r1;
    if(radialRange[1] >= radialRange[0]) {
        r0 = radialRange[0];
        r1 = radialRange[1];
    } else {
        r0 = radialRange[1];
        r1 = radialRange[0];
    }

    if(vangles) {
        var polygonIn = polygonTester(makePolygon(r0, sector, vangles));
        var polygonOut = polygonTester(makePolygon(r1, sector, vangles));
        var xy = [r * Math.cos(d.rad), r * Math.sin(d.rad)];
        return polygonOut.contains(xy) && !polygonIn.contains(xy);
    }

    return r >= r0 && r <= r1;
};

proto.fillViewInitialKey = function(key, val) {
    if(!(key in this.viewInitial)) {
        this.viewInitial[key] = val;
    }
};

function setScale(ax, axLayout, fullLayout) {
    Axes.setConvert(ax, fullLayout);

    // _min and _max are filled in during Axes.expand
    // and cleared during Axes.setConvert
    ax._min = axLayout._min;
    ax._max = axLayout._max;

    ax.setScale();
}

function strTickLayout(axLayout) {
    var out = axLayout.ticks + String(axLayout.ticklen) + String(axLayout.showticklabels);
    if('side' in axLayout) out += axLayout.side;
    return out;
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

function isAngleInSector(rad, sector) {
    if(isFullCircle(sector)) return true;

    var s0 = wrap360(sector[0]);
    var s1 = wrap360(sector[1]);
    if(s0 > s1) s1 += 360;

    var deg = wrap360(rad2deg(rad));
    var nextTurnDeg = deg + 360;

    return (deg >= s0 && deg <= s1) ||
        (nextTurnDeg >= s0 && nextTurnDeg <= s1);
}

function snapToVertexAngle(a, vangles) {
    function angleDeltaAbs(va) {
        return Math.abs(angleDelta(a, va));
    }

    var ind = findIndexOfMin(vangles, angleDeltaAbs);
    return vangles[ind];
}

// taken from https://stackoverflow.com/a/2007279
function angleDelta(a, b) {
    var d = b - a;
    return Math.atan2(Math.sin(d), Math.cos(d));
}

function findIndexOfMin(arr, fn) {
    fn = fn || Lib.identity;

    var min = Infinity;
    var ind;

    for(var i = 0; i < arr.length; i++) {
        var v = fn(arr[i]);
        if(v < min) {
            min = v;
            ind = i;
        }
    }
    return ind;
}

// find intersection of 'v0' <-> 'v1' edge with a ray at angle 'a'
// (i.e. a line that starts from the origin at angle 'a')
// given an (xp,yp) pair on the 'v0' <-> 'v1' line
// (N.B. 'v0' and 'v1' are angles in radians)
function findIntersectionXY(v0, v1, a, xpyp) {
    var xstar, ystar;

    var xp = xpyp[0];
    var yp = xpyp[1];
    var dsin = clampTiny(Math.sin(v1) - Math.sin(v0));
    var dcos = clampTiny(Math.cos(v1) - Math.cos(v0));
    var tanA = Math.tan(a);
    var cotanA = clampTiny(1 / tanA);
    var m = dsin / dcos;
    var b = yp - m * xp;

    if(cotanA) {
        if(dsin && dcos) {
            // given
            //  g(x) := v0 -> v1 line = m*x + b
            //  h(x) := ray at angle 'a' = m*x = tanA*x
            // solve g(xstar) = h(xstar)
            xstar = b / (tanA - m);
            ystar = tanA * xstar;
        } else if(dcos) {
            // horizontal v0 -> v1
            xstar = yp * cotanA;
            ystar = yp;
        } else {
            // vertical v0 -> v1
            xstar = xp;
            ystar = xp * tanA;
        }
    } else {
        // vertical ray
        if(dsin && dcos) {
            xstar = 0;
            ystar = b;
        } else if(dcos) {
            xstar = 0;
            ystar = yp;
        } else {
            // does this case exists?
            xstar = ystar = NaN;
        }
    }

    return [xstar, ystar];
}

// solves l^2 = (f(x)^2 - yp)^2 + (x - xp)^2
// rearranged into 0 = a*x^2 + b * x + c
//
// where f(x) = m*x + t + yp
// and   (x0, x1) = (-b +/- del) / (2*a)
function findXYatLength(l, m, xp, yp) {
    var t = -m * xp;
    var a = m * m + 1;
    var b = 2 * (m * t - xp);
    var c = t * t + xp * xp - l * l;
    var del = Math.sqrt(b * b - 4 * a * c);
    var x0 = (-b + del) / (2 * a);
    var x1 = (-b - del) / (2 * a);
    return [
        [x0, m * x0 + t + yp],
        [x1, m * x1 + t + yp]
    ];
}

function makeRegularPolygon(r, vangles) {
    var len = vangles.length;
    var vertices = new Array(len + 1);
    var i;
    for(i = 0; i < len; i++) {
        var va = vangles[i];
        vertices[i] = [r * Math.cos(va), r * Math.sin(va)];
    }
    vertices[i] = vertices[0].slice();
    return vertices;
}

function makeClippedPolygon(r, sector, vangles) {
    var len = vangles.length;
    var vertices = [];
    var i, j;

    function a2xy(a) {
        return [r * Math.cos(a), r * Math.sin(a)];
    }

    function findXY(va0, va1, s) {
        return findIntersectionXY(va0, va1, s, a2xy(va0));
    }

    function cycleIndex(ind) {
        return Lib.mod(ind, len);
    }

    var s0 = deg2rad(sector[0]);
    var s1 = deg2rad(sector[1]);

    // find index in sector closest to sector[0],
    // use it to find intersection of v[i0] <-> v[i0-1] edge with sector radius
    var i0 = findIndexOfMin(vangles, function(v) {
        return isAngleInSector(v, sector) ? Math.abs(angleDelta(v, s0)) : Infinity;
    });
    var xy0 = findXY(vangles[i0], vangles[cycleIndex(i0 - 1)], s0);
    vertices.push(xy0);

    // fill in in-sector vertices
    for(i = i0, j = 0; j < len; i++, j++) {
        var va = vangles[cycleIndex(i)];
        if(!isAngleInSector(va, sector)) break;
        vertices.push(a2xy(va));
    }

    // find index in sector closest to sector[1],
    // use it to find intersection of v[iN] <-> v[iN+1] edge with sector radius
    var iN = findIndexOfMin(vangles, function(v) {
        return isAngleInSector(v, sector) ? Math.abs(angleDelta(v, s1)) : Infinity;
    });
    var xyN = findXY(vangles[iN], vangles[cycleIndex(iN + 1)], s1);
    vertices.push(xyN);

    vertices.push([0, 0]);
    vertices.push(vertices[0].slice());

    return vertices;
}

function makePolygon(r, sector, vangles) {
    return isFullCircle(sector) ?
        makeRegularPolygon(r, vangles) :
        makeClippedPolygon(r, sector, vangles);
}

function findPolygonOffset(r, sector, vangles) {
    var minX = Infinity;
    var minY = Infinity;
    var vertices = makePolygon(r, sector, vangles);

    for(var i = 0; i < vertices.length; i++) {
        var v = vertices[i];
        minX = Math.min(minX, v[0]);
        minY = Math.min(minY, -v[1]);
    }
    return [minX, minY];
}

function invertY(pts0) {
    var len = pts0.length;
    var pts1 = new Array(len);
    for(var i = 0; i < len; i++) {
        var pt = pts0[i];
        pts1[i] = [pt[0], -pt[1]];
    }
    return pts1;
}

function pathSector(r, sector, vangles) {
    var d;

    if(vangles) {
        d = 'M' + invertY(makePolygon(r, sector, vangles)).join('L');
    } else if(isFullCircle(sector)) {
        d = Drawing.symbolFuncs[0](r);
    } else {
        var arc = Math.abs(sector[1] - sector[0]);
        var flags = arc <= 180 ? [0, 0, 0] : [0, 1, 0];
        var xs = r * Math.cos(deg2rad(sector[0]));
        var ys = -r * Math.sin(deg2rad(sector[0]));
        var xe = r * Math.cos(deg2rad(sector[1]));
        var ye = -r * Math.sin(deg2rad(sector[1]));

        d = 'M' + [xs, ys] +
            'A' + [r, r] + ' ' + flags + ' ' + [xe, ye];
    }

    return d;
}

function pathSectorClosed(r, sector, vangles) {
    var d = pathSector(r, sector, vangles);
    if(isFullCircle(sector) || vangles) return d;
    return d + 'L0,0Z';
}

// TODO recycle this routine with the ones used for pie traces.
function pathAnnulus(r0, r1, sector) {
    var largeArc = Math.abs(sector[1] - sector[0]) <= 180 ? 0 : 1;
    // sector angle at [s]tart, [m]iddle and [e]nd
    var ss, sm, se;

    function pt(r, s) {
        return [r * Math.cos(s), -r * Math.sin(s)];
    }

    function arc(r, s, cw) {
        return 'A' + [r, r] + ' ' + [0, largeArc, cw] + ' ' + pt(r, s);
    }

    if(isFullCircle(sector)) {
        ss = 0;
        se = 2 * Math.PI;
        sm = Math.PI;
        return 'M' + pt(r0, ss) +
            arc(r0, sm, 0) +
            arc(r0, se, 0) +
            'Z' +
            'M' + pt(r1, ss) +
            arc(r1, sm, 1) +
            arc(r1, se, 1) +
            'Z';
    } else {
        ss = deg2rad(sector[0]);
        se = deg2rad(sector[1]);
        return 'M' + pt(r0, ss) +
            'L' + pt(r1, ss) +
            arc(r1, se, 0) +
            'L' + pt(r0, se) +
            arc(r0, ss, 1) +
            'Z';
    }
}

function isFullCircle(sector) {
    var arc = Math.abs(sector[1] - sector[0]);
    return arc === 360;
}

function updateElement(sel, showAttr, attrs) {
    if(showAttr) {
        sel.attr('display', null);
        sel.attr(attrs);
    } else if(sel) {
        sel.attr('display', 'none');
    }
    return sel;
}

function strTranslate(x, y) {
    return 'translate(' + x + ',' + y + ')';
}

function strRotate(angle) {
    return 'rotate(' + angle + ')';
}

// to more easily catch 'almost zero' numbers in if-else blocks
function clampTiny(v) {
    return Math.abs(v) > 1e-10 ? v : 0;
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
