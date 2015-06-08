'use strict';

/* global d3:false */

var params = require('./lib/params'),
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
    this.topojson = null;
    this.topojsonPath = null;
    this.topojsonIsLoading = false;
    this.clipAngle = null;

    this.setScale = createGeoScale(geoLayout, fullLayout._size);
    this.makeProjection(geoLayout);
    this.zoom = createGeoZoom(this, geoLayout);
    this.makeFramework(geoLayout);

}

module.exports = Geo;

var proto = Geo.prototype;


proto.plot = function(geoData, fullLayout) {
    var _this = this,
        geoLayout = fullLayout[this.id];

    // 'geoLayout' is unambiguous, no need for 'user' geo layout here

    _this.topojsonPath = getTopojsonPath(geoLayout);
    _this.makePath();

    if(_this.topojson === null) {
        _this.topojsonIsLoading = true;
        d3.json(_this.topojsonPath, function(error, topojson) {
            _this.topojson = topojson;
            _this.onceTopojsonIsLoaded(geoData, geoLayout);
        });
    }
    else _this.onceTopojsonIsLoaded(geoData, geoLayout);

    // TODO handle topojsonIsLoading case
};

proto.onceTopojsonIsLoaded = function(geoData, geoLayout) {
    var scattergeoData = [],
        choroplethData = [];

    var trace, traceType;

    this.drawLayout(geoLayout);

    for(var i = 0; i < geoData.length; i++) {
        trace = geoData[i];
        traceType = trace.type;

        if(trace.type === 'scattergeo') scattergeoData.push(trace);
        else if(trace.type === 'choropleth') choroplethData.push(trace);
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
    var _this = this,
        projection = this.projection,
        zoom = this.zoom;

    var framework = _this.framework = d3.select(_this.container).append('svg');

    _this.container.style.position = 'absolute';
    _this.container.style.top   = _this.container.style.left   = '0px';
    _this.container.style.width = _this.container.style.height = '100%';
    _this.container.style['z-index'] = 20;

    // TODO use clip paths instead of nested SVG

    // TODO how to handle 'gs' (from figure size, domain and setScale)
    // TODO handle 'framelinewidth' also

    framework
        .attr('width', geoLayout._width)
        .attr('height', geoLayout._height);

    framework.append('g').attr('class', 'baselayer');
    framework.append('g').attr('class', 'graticulelayer');

    framework.append('g').attr('class', 'choroplethlayer');
    framework.append('g').attr('class', 'baselayeroverchoropleth');
    framework.append('g').attr('class', 'scattergeolayer');

    function handleDblClick() {
        _this.makeProjection(geoLayout);
        _this.makePath();

        // N.B. let the zoom event know!
        zoom.scale(projection.scale());
        zoom.translate(projection.translate());

        _this.render();
    }

    // attach zoom and dblclick event to svg container
    framework
        .call(zoom)
        .on('dblclick.zoom', null)  // N.B. disable dblclick zoom default
        .on('dblclick', handleDblClick);
};

proto.drawBaseLayer = function(selection, layerName, geoLayout) {
    if(geoLayout['show' + layerName] !== true) return;

    var topojson = this.topojson,
        datum = layerName==='frame' ?
            params.sphereSVG :
            topojsonPackage.feature(topojson, topojson.objects[layerName]);

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

    var scopeDefaults = params.scopeDefaults[geoLayout.scope],
        lonaxisRange = scopeDefaults.lonaxisRange,
        lataxisRange = scopeDefaults.lataxisRange,
        step = axisName==='lonaxis' ?
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
        gGraticuleLayer = this.framework.select('g.graticulelayer'),
        baseLayers = params.baseLayers,
        axesNames = params.axesNames,
        i;

    // TODO remove this hack!!!
    gBaseLayer.selectAll('*').remove();
    gGraticuleLayer.selectAll('*').remove();

    for(i = 0;  i < baseLayers.length; i++) {
        this.drawBaseLayer(gBaseLayer, baseLayers[i], geoLayout);
    }

    for(i = 0; i < axesNames.length; i++) {
        this.drawGraticule(gGraticuleLayer, axesNames[i], geoLayout);
    }

    this.styleLayout(geoLayout);
};

proto.styleLayout = function(geoLayout) {
    var gBaseLayer = this.framework.select('g.baselayer'),
        gGraticuleLayer = this.framework.select('g.graticulelayer'),
        fillLayers = params.fillLayers,
        lineLayers = params.lineLayers,
        axesNames = params.axesNames;
    
    var i, layer, layerAttr, axisName;

    for(i = 0;  i < fillLayers.length; i++) {
        layer = fillLayers[i];
        gBaseLayer.select('.' + layer)
            .selectAll('path')
                .attr('stroke', 'none')
                .attr('fill', geoLayout[layer + 'fillcolor']);
    }

    for(i = 0;  i < lineLayers.length; i++) {
        layer = lineLayers[i];
        layerAttr = layer!=='coastlines' ?  layer + 'line' : layer;

        gBaseLayer.select('.' + layer)
            .selectAll('path')
                .attr('fill', 'none')
                .attr('stroke', geoLayout[layerAttr + 'color'])
                .attr('stroke-width', geoLayout[layerAttr + 'width']);
    }

    for(i = 0;  i < axesNames.length; i++) {
        axisName = axesNames[i];
        gGraticuleLayer.select('.' + axisName + 'graticule')
            .selectAll('path')
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
    if(clipAngle !== null) {
        framework.selectAll('path.point')
            .attr('opacity', function(d) {
                var p = projection.rotate(),
                    angle = d3.geo.distance([d.lon, d.lat], [-p[0], -p[1]]),
                    maxAngle = clipAngle * Math.PI / 180;
                return (angle > maxAngle) ? '0' : '1.0';
            });
    }


    framework.selectAll('path.basepath').attr('d', path);
    framework.selectAll('path.graticulepath').attr('d', path);

    gChoropleth.selectAll('path.choroplethlocation').attr('d', path);
    gChoropleth.selectAll('g.baselayeroverchoropleth path').attr('d', path);

    gScatterGeo.selectAll('path.js-line').attr('d', path);
    gScatterGeo.selectAll('path.point').attr('transform', translatePoints);
    gScatterGeo.selectAll('text').attr('transform', translatePoints);
};
