'use strict';

/* global d3:false */

var Plotly = require('../plotly'),
    params = require('./lib/params'),
    getTopojsonPath = require('./lib/get-topojson-path'),
    createGeoScale = require('./lib/set-scale'),
    createGeoZoom = require('./lib/zoom'),
    plotScatterGeo = require('./plot/scattergeo'),
    plotChoropleth = require('./plot/choropleth'),
    topojsonPackage = require('topojson');

function Geo(options, fullLayout) {

    this.id = options.id;
    this.container = options.container;

    var geoLayout = fullLayout[this.id];

    this.framework = null;
    this.projection = null;
    this.path = null;
    this.topojsonPath = null;
    this.topojson = null;
    this.clipAngle = null;

    this.setScale = createGeoScale(geoLayout, fullLayout._size);
    this.zoom = createGeoZoom(geoLayout);
    this.makeFramework(geoLayout);
}

module.exports = Geo;

var proto = Geo.prototype;


proto.plot = function(geoData, fullLayout) {
    var _this = this,
        geoLayout = fullLayout[this.id];

    // 'geoLayout' is unambiguous, no need for 'user' geo layout here

    _this.topojsonPath = getTopojsonPath(geoLayout);
    _this.makeProjection(geoLayout);
    _this.makePath();

    // TODO skip if topojson is already loaded

    d3.json(_this.topojsonPath, function(error, topojson) {
        _this.topojson = topojson;
        _this.onceTopojsonIsLoaded(geoData, geoLayout);
    });

};

proto.onceTopojsonIsLoaded = function(geoData, geoLayout) {
    var scattergeoData = [],
        choroplethData = [],
        trace;

    this.drawLayout(geoLayout);

    for(var i = 0; i < geoData.length; i++) {
        trace = geoData[i];

        if(Plotly.Plots.traceIs(trace, 'scattergeo')) scattergeoData.push(trace);
        else if(Plotly.Plots.traceIs(trace, 'choropleth')) choroplethData.push(trace);
    }

    if(scattergeoData.length>0) plotScatterGeo.plot(this, scattergeoData);
    if(choroplethData.length>0) plotChoropleth.plot(this, choroplethData, geoLayout);

    this.render();
};

proto.makeProjection = function(geoLayout) {
    var projLayout = geoLayout.projection,
        isNew = this.projection===null;

    if(isNew) this.projection = d3.geo[params.projNames[projLayout.type]]();
    var projection = this.projection;

    projection
        .translate(projLayout._translate0)
        .precision(params.precision);

    if(!geoLayout._isAlbersUsa) {
        projection
            .rotate(projLayout._rotate)
            .center(projLayout._center);
    }

    if(geoLayout._isClipped) {
        projection
            .clipAngle(geoLayout._clipAngle - params.clippad);
        this.clipAngle = geoLayout.clipAngle;
    }

    if(geoLayout.parallels) {
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

proto.makeFramework = function(geoLayout) {
    var framework = this.framework = d3.select(this.container).append('svg');

    // TODO use clip paths instead of nested SVG

    // TODO how to handle 'gs' (from figure size, domain and setScale)

    framework
        .attr('width', geoLayout._width)
        .attr('height', geoLayout._height);

    framework.append('g').attr('class', 'baselayer');
    framework.append('g').attr('class', 'graticule');

    framework.append('g').attr('class', 'choroplethlayer');
    framework.append('g').attr('class', 'baselayeroverchoropleth');
    framework.append('g').attr('class', 'scattergeolayer');

    // attach zoom and dblclick event to svg container
    framework
        .call(this.zoom)
        .on('dblclick.zoom', null)  // N.B. disable dblclick zoom default
        .on('dblclick', this.handleDblclick(geoLayout));
};

proto.handleDblClick = function(geoLayout) {
    var projection = this.projection;

    this.makeProjection(geoLayout);
    this.makePath();

    // N.B. let the zoom event know!
    this.zoom.scale(projection.scale());
    this.zoom.translate(projection.translate());

    this.render();
};

proto.drawBaseLayer = function(selection, layerName, geoLayout) {
    if(geoLayout['show' + layerName] !== true) return;

    var topojson = this.topojson,
        datum = layerName==='frame' ?
            params.sphereSVG :
            topojsonPackage.feature(topojson, topojson.objects[layerName]);

    selection.append('g').datum(datum)
        .attr('class', layerName)
      .append('path')
        .attr('class', layerName);
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

    var scopeDefaults = params.scopeDefaults[geoLayout.scope],
        lonaxisRange = scopeDefaults.lonaxisRange,
        lataxisRange = scopeDefaults.lataxisRange,
        step = axisName==='lonaxis' ?
            [axisLayout.dtick] :
            [0, axisLayout.dtick],
        graticule = makeGraticule(lonaxisRange, lataxisRange, step);

    selection.append('path')
        .datum(graticule)
        .attr('class', axisName + 'graticule');
};

proto.drawLayout = function(geoLayout) {
    var gBaseLayer = this.framework.select('g.baselayer'),
        baseLayers = params.baseLayers,
        axesNames = params.axesNames,
        i;

    for(i = 0;  i < baseLayers.length; i++) {
        this.drawBaseLayer(gBaseLayer, baseLayers[i], geoLayout);
    }

    for(i = 0; i < axesNames.length; i++) {
        this.drawGraticule(gBaseLayer, axesNames[i], geoLayout);
    }

    this.styleLayout(geoLayout);
};

proto.styleLayout = function(geoLayout) {
    var gBaseLayer = this.framework.select('g.baselayer'),
        fillLayers = params.fillLayers,
        lineLayers = params.lineLayers,
        axesNames = params.axesNames;
    
    var i, layer, axisName;

    for(i = 0;  i < fillLayers.length; i++) {
        layer = fillLayers[i];
        gBaseLayer.select('path.' + layer)
            .attr('stroke', 'none')
            .attr('fill', geoLayout[layer + 'fillcolor']);
    }

    for(i = 0;  i < lineLayers.length; i++) {
        layer = lineLayers[i];
        if(layer !== 'coastlines') layer += 'line'; 

        gBaseLayer.select('path.' + layer)
            .attr('fill', 'none')
            .attr('stroke', geoLayout[layer + 'color'])
            .attr('stroke-width', geoLayout[layer + 'width']);
    }

    for(i = 0;  i < axesNames.length; i++) {
        axisName = axesNames[i];
        gBaseLayer.select('path.' + axisName + 'graticule')
            .attr('fill', 'none')
            .attr('stroke', geoLayout[axisName].gridcolor)
            .attr('stroke-width', geoLayout[axisName].gridwidth)
            .attr('stroke-opacity', 0.5);  // TODO generalize
    }

};

// [hot code path] (re)draw all paths which depend on the projection
proto.render = function() {
    var framework = this.framework,
        gChoropleth = framework.select('g.choroplethlayer'),
        gScatterGeo = framework.select('g.scattergeolayer'),
        projection = this.projection,
        path = this.path,
        clipAngle = this.clipAngle;

    function translatePoints(d) {
        var lonlat = projection([d.lon, d.lat]);
        if(!lonlat) return null;
        return 'translate(' + lonlat[0] + ',' + lonlat[1] + ')';
    }

    // hide paths over edges of clipped projections
    if(clipAngle) {
        framework.selectAll('path.point')
            .attr('opacity', function(d) {
                var p = projection.rotate(),
                    angle = d3.geo.distance([d.lon, d.lat], [-p[0], -p[1]]),
                    maxAngle = clipAngle * Math.PI / 180;
                return (angle > maxAngle) ? '0' : '1.0';
            });
    }

    framework.selectAll('g.baselayer path').attr('d', path);
    framework.selectAll('g.graticule path').attr('d', path);

    gChoropleth.selectAll('path.choroplethlocation').attr('d', path);
    gChoropleth.selectAll('g.baselayeroverchoropleth path').attr('d', path);

    gScatterGeo.selectAll('path.js-line').attr('d', path);
    gScatterGeo.selectAll('path.point').attr('transform', translatePoints);
    gScatterGeo.selectAll('text').attr('transform', translatePoints);
};
