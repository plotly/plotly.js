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

var Plotly = require('../../plotly');
var Registry = require('../../registry');
var Lib = require('../../lib');
var Color = require('../../components/color');
var Drawing = require('../../components/drawing');
var Plots = require('../plots');
var Axes = require('../cartesian/axes');
var dragElement = require('../../components/dragelement');
var dragBox = require('../cartesian/dragbox');
var Fx = require('../../components/fx');
var Titles = require('../../components/titles');
var prepSelect = require('../cartesian/select');
var setCursor = require('../../lib/setcursor');

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
    this.traceHash = {};
    this.layers = {};
    this.clipPaths = {};
    this.clipIds = {};
    this.viewInitial = {};

    var fullLayout = gd._fullLayout;
    var clipIdBase = 'clip' + fullLayout._uid + id;

    this.clipIds.circle = clipIdBase + '-circle';
    this.clipPaths.circle = fullLayout._clips.append('clipPath')
        .attr('id', this.clipIds.circle);
    this.clipPaths.circle.append('path');

    this.framework = fullLayout._polarlayer.append('g')
        .attr('class', id);

    // unfortunately, we have to keep track of some axis tick settings
    // so that we don't have to call Axes.doTicks with its special redraw flag
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
    Plots.generalUpdatePerTraceModule(_this, polarCalcData, polarLayout);
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
                    layers.bgcircle = sel.append('path');
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

    _this.updateRadialAxis(fullLayout, polarLayout);
    _this.updateRadialAxisTitle(fullLayout, polarLayout);
    _this.updateAngularAxis(fullLayout, polarLayout);

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

    layers.frontplot
        .attr('transform', strTranslate(xOffset2, yOffset2))
        .call(Drawing.setClipUrl, _this._hasClipOnAxisFalse ? null : _this.clipIds.circle);

    layers.bgcircle.attr({
        d: pathSectorClosed(radius, sector),
        transform: strTranslate(cx, cy)
    })
    .call(Color.fill, polarLayout.bgcolor);

    _this.clipPaths.circle.select('path')
        .attr('d', pathSectorClosed(radius, sector))
        .attr('transform', strTranslate(cxx, cyy));

    // remove crispEdges - all the off-square angles in polar plots
    // make these counterproductive.
    _this.framework.selectAll('.crisp').classed('crisp', 0);
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

    _this.fillViewInitialKey('radialaxis.angle', radialLayout.angle);

    var ax = _this.radialAxis = Lib.extendFlat({}, radialLayout, {
        _axislayer: layers['radial-axis'],
        _gridlayer: layers['radial-grid'],

        // make this an 'x' axis to make positioning (especially rotation) easier
        _id: 'x',
        _pos: 0,

        // convert to 'x' axis equivalent
        side: {counterclockwise: 'top', clockwise: 'bottom'}[radialLayout.side],

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
    radialLayout.range = ax.range.slice();
    radialLayout._input.range = ax.range.slice();
    _this.fillViewInitialKey('radialaxis.range', ax.range.slice());

    // rotate auto tick labels by 180 if in quadrant II and III to make them
    // readable from left-to-right
    //
    // TODO try moving deeper in doTicks for better results?
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
        return pathSector(r, sector);
    };

    var newTickLayout = strTickLayout(radialLayout);
    if(_this.radialTickLayout !== newTickLayout) {
        layers['radial-axis'].selectAll('.xtick').remove();
        _this.radialTickLayout = newTickLayout;
    }

    Axes.doTicks(gd, ax, true);

    updateElement(layers['radial-axis'], radialLayout.showticklabels || radialLayout.ticks, {
        transform: strTranslate(cx, cy) + strRotate(-radialLayout.angle)
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
        transform: strTranslate(cx, cy) + strRotate(-radialLayout.angle)
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

    var angle = _angle !== undefined ? _angle : radialLayout.angle;
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

    _this.fillViewInitialKey('angularaxis.rotation', angularLayout.rotation);

    var ax = _this.angularAxis = Lib.extendFlat({}, angularLayout, {
        _axislayer: layers['angular-axis'],
        _gridlayer: layers['angular-grid'],

        // angular axes need *special* logic
        _id: 'angular',
        _pos: 0,
        side: 'right',

        // to get auto nticks right
        domain: [0, Math.PI],

        // to get _boundingBox computation right when showticklabels is false
        anchor: 'free',
        position: 0,

        // dummy truthy value to make Axes.doTicks draw the grid
        _counteraxis: true
    });

    // Set the angular range in degrees to make auto-tick computation cleaner,
    // changing rotation/direction should not affect the angular tick labels.
    if(ax.type === 'linear') {
        ax.autorange = false;

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
        ax._tickFilter = function(d) {
            return _this.isPtWithinSector({
                r: _this.radialAxis.range[1],
                rad: ax.c2rad(d.x)
            });
        };
    }

    setScale(ax, angularLayout, fullLayout);
    Axes.doAutoRange(ax);

    // wrapper around c2rad from setConvertAngular
    // note that linear ranges are always set in degrees for Axes.doTicks
    function c2rad(d) {
        return ax.c2rad(d.x, 'degrees');
    }

    // (x,y) at max radius
    function rad2xy(rad) {
        return [radius * Math.cos(rad), radius * Math.sin(rad)];
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

    Axes.doTicks(gd, ax, true);

    updateElement(layers['angular-line'].select('path'), angularLayout.showline, {
        d: pathSectorClosed(radius, sector),
        transform: strTranslate(cx, cy)
    })
    .attr('stroke-width', angularLayout.linewidth)
    .call(Color.stroke, angularLayout.linecolor);
};

proto.updateFx = function(fullLayout, polarLayout) {
    if(!this.gd._context.staticPlot) {
        this.updateMainDrag(fullLayout, polarLayout);
        this.updateAngularDrag(fullLayout, polarLayout);
        this.updateRadialDrag(fullLayout, polarLayout);
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

    var mainDrag = dragBox.makeDragger(layers, 'path', 'maindrag', 'crosshair');

    d3.select(mainDrag)
        .attr('d', pathSectorClosed(radius, sector))
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

    function xy2r(x, y) {
        var xx = x - cxx;
        var yy = y - cyy;
        return Math.sqrt(xx * xx + yy * yy);
    }

    function xy2a(x, y) {
        return Math.atan2(cyy - y, x - cxx);
    }

    function ra2xy(r, a) {
        return [r * Math.cos(a), r * Math.sin(-a)];
    }

    function pathCorner(r, a) {
        var clen = constants.cornerLen;
        var chw = constants.cornerHalfWidth;

        if(r === 0) return pathSectorClosed(2 * chw, sector);

        var da = clen / r / 2;
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

    function zoomPrep() {
        r0 = null;
        r1 = null;
        path0 = pathSectorClosed(radius, sector);
        dimmed = false;

        var polarLayoutNow = gd._fullLayout[_this.id];
        lum = tinycolor(polarLayoutNow.bgcolor).getLuminance();

        zb = dragBox.makeZoombox(zoomlayer, lum, cx, cy, path0);
        zb.attr('fill-rule', 'evenodd');
        corners = dragBox.makeCorners(zoomlayer, cx, cy);
        dragBox.clearSelect(zoomlayer);
    }

    function zoomMove(dx, dy) {
        var x1 = x0 + dx;
        var y1 = y0 + dy;
        var rr0 = xy2r(x0, y0);
        var rr1 = Math.min(xy2r(x1, y1), radius);
        var a0 = xy2a(x0, y0);
        var a1 = xy2a(x1, y1);

        // starting or ending drag near center (outer edge),
        // clamps radial distance at origin (at r=radius)
        if(rr0 < OFFEDGE) rr0 = 0;
        else if((radius - rr0) < OFFEDGE) rr0 = radius;
        else if(rr1 < OFFEDGE) rr1 = 0;
        else if((radius - rr1) < OFFEDGE) rr1 = radius;

        var path1;
        var cpath;

        if(Math.abs(rr1 - rr0) > MINZOOM) {
            // make sure r0 < r1,
            // to get correct fill pattern in path1 below
            if(rr0 < rr1) {
                r0 = rr0;
                r1 = rr1;
            } else {
                r0 = rr1;
                r1 = rr0;
                a1 = [a0, a0 = a1][0]; // swap a0 and a1
            }

            path1 = path0 + pathSectorClosed(r1, sector) + pathSectorClosed(r0, sector);
            cpath = pathCorner(r0, a0) + pathCorner(r1, a1);
        } else {
            r0 = null;
            r1 = null;
            path1 = path0;
            cpath = 'M0,0Z';
        }

        zb.attr('d', path1);
        corners.attr('d', cpath);
        dragBox.transitionZoombox(zb, corners, dimmed, lum);
        dimmed = true;
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

        Plotly.relayout(gd, updateObj);
    }

    dragOpts.prepFn = function(evt, startX, startY) {
        var dragModeNow = gd._fullLayout.dragmode;

        var bbox = mainDrag.getBoundingClientRect();
        x0 = startX - bbox.left;
        y0 = startY - bbox.top;

        switch(dragModeNow) {
            case 'zoom':
                dragOpts.moveFn = zoomMove;
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
            Plotly.relayout(gd, updateObj);
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
    var angle0 = deg2rad(radialLayout.angle);
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
            Plotly.relayout(gd, _this.id + '.radialaxis.angle', angle1);
        } else if(rng1 !== null) {
            Plotly.relayout(gd, _this.id + '.radialaxis.range[1]', rng1);
        }
    }

    function rotateMove(dx, dy) {
        var x1 = tx + dx;
        var y1 = ty + dy;

        angle1 = rad2deg(Math.atan2(cy - y1, x1 - cx));

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

        Axes.doTicks(gd, _this.radialAxis, true);
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

            _module.plot(_this, moduleCalcDataVisible, polarLayoutNow);

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

        dragBox.clearSelect(fullLayout._zoomlayer);
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

    var angularDrag = dragBox.makeDragger(layers, 'path', 'angulardrag', 'move');
    var dragOpts = {element: angularDrag, gd: gd};

    d3.select(angularDrag)
        .attr('d', pathAnnulus(radius, radius + constants.angularDragBoxSize, sector))
        .attr('transform', strTranslate(cx, cy))
        .call(setCursor, 'move');

    function xy2a(x, y) {
        return Math.atan2(cyy - y, x - cxx);
    }

    // scatter trace, points and textpoints selections
    var scatterTraces = layers.frontplot.select('.scatterlayer').selectAll('.trace');
    var scatterPoints = scatterTraces.selectAll('.point');
    var scatterTextPoints = scatterTraces.selectAll('.textpoint');

    // mouse px position at drag start (0), move (1)
    var x0, y0;
    // angular axis angle rotation at drag start (0), move (1)
    var rot0, rot1;
    // copy of polar sector value at drag start
    var sector0;
    // angle about circle center at drag start
    var a0;

    function moveFn(dx, dy) {
        var x1 = x0 + dx;
        var y1 = y0 + dy;
        var a1 = xy2a(x1, y1);
        var da = rad2deg(a1 - a0);
        rot1 = rot0 + da;

        layers.frontplot.attr('transform',
            strTranslate(_this.xOffset2, _this.yOffset2) + strRotate([-da, cxx, cyy])
        );

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
        Axes.doTicks(gd, angularAxis, true);

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
                var polarLayoutNow = gd._fullLayout[_this.id];

                _module.plot(_this, moduleCalcDataVisible, polarLayoutNow);
            }
        }
    }

    function doneFn() {
        scatterTextPoints.select('text').attr('transform', null);
        var updateObj = {};
        updateObj[_this.id + '.angularaxis.rotation'] = rot1;
        Plotly.relayout(gd, updateObj);
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

        dragBox.clearSelect(fullLayout._zoomlayer);
    };

    dragElement.init(dragOpts);
};

proto.isPtWithinSector = function(d) {
    var sector = this.sector;
    var radialAxis = this.radialAxis;
    var radialRange = radialAxis.range;
    var r = radialAxis.c2r(d.r);

    var s0 = wrap360(sector[0]);
    var s1 = wrap360(sector[1]);
    if(s0 > s1) s1 += 360;

    var deg = wrap360(rad2deg(d.rad));
    var nextTurnDeg = deg + 360;

    var r0, r1;
    if(radialRange[1] >= radialRange[0]) {
        r0 = radialRange[0];
        r1 = radialRange[1];
    } else {
        r0 = radialRange[1];
        r1 = radialRange[0];
    }

    return (
        (r >= r0 && r <= r1) &&
        (isFullCircle(sector) ||
            (deg >= s0 && deg <= s1) ||
            (nextTurnDeg >= s0 && nextTurnDeg <= s1)
        )
    );
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

// inspired by https://gist.github.com/buschtoens/4190516
function pathAnnulus(r0, r1, _sector) {
    var sector = _sector.slice();
    var s0 = deg2rad(sector[0]);
    var s1 = deg2rad(sector[1]);

    // make a small cut on full sectors so that the
    // inner region isn't filled
    if(isFullCircle(sector)) s1 -= 1e-3;

    var p00 = [r0 * Math.cos(s0), -r0 * Math.sin(s0)];
    var p01 = [r0 * Math.cos(s1), -r0 * Math.sin(s1)];
    var p10 = [r1 * Math.cos(s0), -r1 * Math.sin(s0)];
    var p11 = [r1 * Math.cos(s1), -r1 * Math.sin(s1)];

    var largeArc = Math.abs(sector[1] - sector[0]) <= 180 ? 0 : 1;

    return 'M' + p00 +
        'L' + p10 +
        'A' + [r1, r1] + ' ' + [0, largeArc, 0] + ' ' + p11 +
        'L' + p01 +
        'A' + [r0, r0] + ' ' + [0, largeArc, 1] + ' ' + p00 +
        'Z';
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
