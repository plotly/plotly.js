/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

/* global PlotlyGeoAssets:false */

var d3 = require('d3');

var Color = require('../../components/color');
var Drawing = require('../../components/drawing');
var Plots = require('../plots');
var Axes = require('../cartesian/axes');
var Fx = require('../cartesian/graph_interact');

var addProjectionsToD3 = require('./projections');
var createGeoScale = require('./set_scale');
var createGeoZoom = require('./zoom');
var createGeoZoomReset = require('./zoom_reset');
var constants = require('./constants');

var topojsonUtils = require('../../lib/topojson_utils');
var topojsonFeature = require('topojson-client').feature;

// add a few projection types to d3.geo
addProjectionsToD3(d3);


function Geo(options) {
    this.id = options.id;
    this.graphDiv = options.graphDiv;
    this.container = options.container;
    this.topojsonURL = options.topojsonURL;

    this.topojsonName = null;
    this.topojson = null;

    this.projectionType = null;
    this.projection = null;

    this.clipAngle = null;
    this.setScale = null;
    this.path = null;

    this.zoom = null;
    this.zoomReset = null;

    this.makeFramework();

    this.traceHash = {};
}

module.exports = Geo;

var proto = Geo.prototype;

proto.plot = function(geoCalcData, fullLayout, promises) {
    var _this = this,
        geoLayout = fullLayout[_this.id],
        graphSize = fullLayout._size;

    var topojsonNameNew, topojsonPath;

    // N.B. 'geoLayout' is unambiguous, no need for 'user' geo layout here

    // TODO don't reset projection on all graph edits
    _this.projection = null;

    _this.setScale = createGeoScale(geoLayout, graphSize);
    _this.makeProjection(geoLayout);
    _this.makePath();
    _this.adjustLayout(geoLayout, graphSize);

    _this.zoom = createGeoZoom(_this, geoLayout);
    _this.zoomReset = createGeoZoomReset(_this, geoLayout);
    _this.mockAxis = createMockAxis(fullLayout);

    _this.framework
        .call(_this.zoom)
        .on('dblclick.zoom', _this.zoomReset);

    _this.framework.on('mousemove', function() {
        var mouse = d3.mouse(this),
            lonlat = _this.projection.invert(mouse);

        if(!lonlat || isNaN(lonlat[0]) || isNaN(lonlat[1])) return;

        var evt = {
            target: true,
            xpx: mouse[0],
            ypx: mouse[1]
        };

        _this.xaxis.c2p = function() { return mouse[0]; };
        _this.xaxis.p2c = function() { return lonlat[0]; };
        _this.yaxis.c2p = function() { return mouse[1]; };
        _this.yaxis.p2c = function() { return lonlat[1]; };

        Fx.hover(_this.graphDiv, evt, _this.id);
    });

    _this.framework.on('mouseout', function() {
        Fx.loneUnhover(fullLayout._toppaper);
    });

    _this.framework.on('click', function() {
        Fx.click(_this.graphDiv, { target: true });
    });

    topojsonNameNew = topojsonUtils.getTopojsonName(geoLayout);

    if(_this.topojson === null || topojsonNameNew !== _this.topojsonName) {
        _this.topojsonName = topojsonNameNew;

        if(PlotlyGeoAssets.topojson[_this.topojsonName] !== undefined) {
            _this.topojson = PlotlyGeoAssets.topojson[_this.topojsonName];
            _this.onceTopojsonIsLoaded(geoCalcData, geoLayout);
        }
        else {
            topojsonPath = topojsonUtils.getTopojsonPath(
                _this.topojsonURL,
                _this.topojsonName
            );

            promises.push(new Promise(function(resolve, reject) {
                d3.json(topojsonPath, function(error, topojson) {
                    if(error) {
                        if(error.status === 404) {
                            reject(new Error([
                                'plotly.js could not find topojson file at',
                                topojsonPath, '.',
                                'Make sure the *topojsonURL* plot config option',
                                'is set properly.'
                            ].join(' ')));
                        }
                        else {
                            reject(new Error([
                                'unexpected error while fetching topojson file at',
                                topojsonPath
                            ].join(' ')));
                        }
                        return;
                    }

                    _this.topojson = topojson;
                    PlotlyGeoAssets.topojson[_this.topojsonName] = topojson;

                    _this.onceTopojsonIsLoaded(geoCalcData, geoLayout);
                    resolve();
                });
            }));
        }
    }
    else _this.onceTopojsonIsLoaded(geoCalcData, geoLayout);

    // TODO handle topojson-is-loading case
    // to avoid making multiple request while streaming
};

proto.onceTopojsonIsLoaded = function(geoCalcData, geoLayout) {
    this.drawLayout(geoLayout);

    Plots.generalUpdatePerTraceModule(this, geoCalcData, geoLayout);

    this.render();
};

proto.makeProjection = function(geoLayout) {
    var projLayout = geoLayout.projection,
        projType = projLayout.type,
        isNew = this.projection === null || projType !== this.projectionType,
        projection;

    if(isNew) {
        this.projectionType = projType;
        projection = this.projection = d3.geo[constants.projNames[projType]]();
    }
    else projection = this.projection;

    projection
        .translate(projLayout._translate0)
        .precision(constants.precision);

    if(!geoLayout._isAlbersUsa) {
        projection
            .rotate(projLayout._rotate)
            .center(projLayout._center);
    }

    if(geoLayout._clipAngle) {
        this.clipAngle = geoLayout._clipAngle;  // needed in proto.render
        projection
            .clipAngle(geoLayout._clipAngle - constants.clipPad);
    }
    else this.clipAngle = null;  // for graph edits

    if(projLayout.parallels) {
        projection
            .parallels(projLayout.parallels);
    }

    if(isNew) this.setScale(projection);

    projection
        .translate(projLayout._translate)
        .scale(projLayout._scale);
};

proto.makePath = function() {
    this.path = d3.geo.path().projection(this.projection);
};

proto.makeFramework = function() {
    var fullLayout = this.graphDiv._fullLayout;
    var clipId = 'clip' + fullLayout._uid + this.id;

    var defGroup = fullLayout._defs.selectAll('g.clips')
        .data([0]);
    defGroup.enter().append('g')
        .classed('clips', true);

    var clipDef = this.clipDef = defGroup.selectAll('#' + clipId)
        .data([0]);

    clipDef.enter().append('clipPath').attr('id', clipId)
        .append('rect');

    var framework = this.framework = d3.select(this.container).append('g');

    framework
        .attr('class', 'geo ' + this.id)
        .style('pointer-events', 'all')
        .call(Drawing.setClipUrl, clipId);

    framework.append('g')
        .attr('class', 'bglayer')
        .append('rect');

    framework.append('g').attr('class', 'baselayer');
    framework.append('g').attr('class', 'choroplethlayer');
    framework.append('g').attr('class', 'baselayeroverchoropleth');
    framework.append('g').attr('class', 'scattergeolayer');

    // N.B. disable dblclick zoom default
    framework.on('dblclick.zoom', null);

    this.xaxis = { _id: 'x' };
    this.yaxis = { _id: 'y' };
};

proto.adjustLayout = function(geoLayout, graphSize) {
    var domain = geoLayout.domain;

    var left = graphSize.l + graphSize.w * domain.x[0] + geoLayout._marginX,
        top = graphSize.t + graphSize.h * (1 - domain.y[1]) + geoLayout._marginY;

    Drawing.setTranslate(this.framework, left, top);

    var dimsAttrs = {
        x: 0,
        y: 0,
        width: geoLayout._width,
        height: geoLayout._height
    };

    this.clipDef.select('rect')
        .attr(dimsAttrs);

    this.framework.select('.bglayer').select('rect')
        .attr(dimsAttrs)
        .call(Color.fill, geoLayout.bgcolor);

    this.xaxis._offset = left;
    this.xaxis._length = geoLayout._width;

    this.yaxis._offset = top;
    this.yaxis._length = geoLayout._height;
};

proto.drawTopo = function(selection, layerName, geoLayout) {
    if(geoLayout['show' + layerName] !== true) return;

    var topojson = this.topojson,
        datum = layerName === 'frame' ?
            constants.sphereSVG :
            topojsonFeature(topojson, topojson.objects[layerName]);

    selection.append('g')
        .datum(datum)
        .attr('class', layerName)
          .append('path')
            .attr('class', 'basepath');
};

function makeGraticule(lonaxisRange, lataxisRange, step) {
    return d3.geo.graticule()
        .extent([
            [lonaxisRange[0], lataxisRange[0]],
            [lonaxisRange[1], lataxisRange[1]]
        ])
        .step(step);
}

proto.drawGraticule = function(selection, axisName, geoLayout) {
    var axisLayout = geoLayout[axisName];

    if(axisLayout.showgrid !== true) return;

    var scopeDefaults = constants.scopeDefaults[geoLayout.scope],
        lonaxisRange = scopeDefaults.lonaxisRange,
        lataxisRange = scopeDefaults.lataxisRange,
        step = axisName === 'lonaxis' ?
            [axisLayout.dtick] :
            [0, axisLayout.dtick],
        graticule = makeGraticule(lonaxisRange, lataxisRange, step);

    selection.append('g')
        .datum(graticule)
        .attr('class', axisName + 'graticule')
            .append('path')
                .attr('class', 'graticulepath');
};

proto.drawLayout = function(geoLayout) {
    var gBaseLayer = this.framework.select('g.baselayer'),
        baseLayers = constants.baseLayers,
        axesNames = constants.axesNames,
        layerName;

    // TODO move to more d3-idiomatic pattern (that's work on replot)
    // N.B. html('') does not work in IE11
    gBaseLayer.selectAll('*').remove();

    for(var i = 0; i < baseLayers.length; i++) {
        layerName = baseLayers[i];

        if(axesNames.indexOf(layerName) !== -1) {
            this.drawGraticule(gBaseLayer, layerName, geoLayout);
        }
        else this.drawTopo(gBaseLayer, layerName, geoLayout);
    }

    this.styleLayout(geoLayout);
};

function styleFillLayer(selection, layerName, geoLayout) {
    var layerAdj = constants.layerNameToAdjective[layerName];

    selection.select('.' + layerName)
        .selectAll('path')
            .attr('stroke', 'none')
            .call(Color.fill, geoLayout[layerAdj + 'color']);
}

function styleLineLayer(selection, layerName, geoLayout) {
    var layerAdj = constants.layerNameToAdjective[layerName];

    selection.select('.' + layerName)
        .selectAll('path')
            .attr('fill', 'none')
            .call(Color.stroke, geoLayout[layerAdj + 'color'])
            .call(Drawing.dashLine, '', geoLayout[layerAdj + 'width']);
}

function styleGraticule(selection, axisName, geoLayout) {
    selection.select('.' + axisName + 'graticule')
        .selectAll('path')
            .attr('fill', 'none')
            .call(Color.stroke, geoLayout[axisName].gridcolor)
            .call(Drawing.dashLine, '', geoLayout[axisName].gridwidth);
}

proto.styleLayer = function(selection, layerName, geoLayout) {
    var fillLayers = constants.fillLayers,
        lineLayers = constants.lineLayers;

    if(fillLayers.indexOf(layerName) !== -1) {
        styleFillLayer(selection, layerName, geoLayout);
    }
    else if(lineLayers.indexOf(layerName) !== -1) {
        styleLineLayer(selection, layerName, geoLayout);
    }
};

proto.styleLayout = function(geoLayout) {
    var gBaseLayer = this.framework.select('g.baselayer'),
        baseLayers = constants.baseLayers,
        axesNames = constants.axesNames,
        layerName;

    for(var i = 0; i < baseLayers.length; i++) {
        layerName = baseLayers[i];

        if(axesNames.indexOf(layerName) !== -1) {
            styleGraticule(gBaseLayer, layerName, geoLayout);
        }
        else this.styleLayer(gBaseLayer, layerName, geoLayout);
    }
};

proto.isLonLatOverEdges = function(lonlat) {
    var clipAngle = this.clipAngle;

    if(clipAngle === null) return false;

    var p = this.projection.rotate(),
        angle = d3.geo.distance(lonlat, [-p[0], -p[1]]),
        maxAngle = clipAngle * Math.PI / 180;

    return angle > maxAngle;
};

// [hot code path] (re)draw all paths which depend on the projection
proto.render = function() {
    var _this = this,
        framework = _this.framework,
        gChoropleth = framework.select('g.choroplethlayer'),
        gScatterGeo = framework.select('g.scattergeolayer'),
        path = _this.path;

    function translatePoints(d) {
        var lonlatPx = _this.projection(d.lonlat);
        if(!lonlatPx) return null;

        return 'translate(' + lonlatPx[0] + ',' + lonlatPx[1] + ')';
    }

    // hide paths over edges of clipped projections
    function hideShowPoints(d) {
        return _this.isLonLatOverEdges(d.lonlat) ? '0' : '1.0';
    }

    framework.selectAll('path.basepath').attr('d', path);
    framework.selectAll('path.graticulepath').attr('d', path);

    gChoropleth.selectAll('path.choroplethlocation').attr('d', path);
    gChoropleth.selectAll('path.basepath').attr('d', path);

    gScatterGeo.selectAll('path.js-line').attr('d', path);

    if(_this.clipAngle !== null) {
        gScatterGeo.selectAll('path.point')
            .style('opacity', hideShowPoints)
            .attr('transform', translatePoints);
        gScatterGeo.selectAll('text')
            .style('opacity', hideShowPoints)
            .attr('transform', translatePoints);
    }
    else {
        gScatterGeo.selectAll('path.point')
            .attr('transform', translatePoints);
        gScatterGeo.selectAll('text')
            .attr('transform', translatePoints);
    }
};

// create a mock axis used to format hover text
function createMockAxis(fullLayout) {
    var mockAxis = {
        type: 'linear',
        showexponent: 'all',
        exponentformat: Axes.layoutAttributes.exponentformat.dflt
    };

    Axes.setConvert(mockAxis, fullLayout);
    return mockAxis;
}
