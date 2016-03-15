/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var d3 = require('d3');

var Fx = require('../../plots/cartesian/graph_interact');
var Axes = require('../../plots/cartesian/axes');

var getTopojsonFeatures = require('../../lib/topojson_utils').getTopojsonFeatures;
var locationToFeature = require('../../lib/geo_location_utils').locationToFeature;
var arrayToCalcItem = require('../../lib/array_to_calc_item');

var Color = require('../../components/color');
var Drawing = require('../../components/drawing');
var subTypes = require('../scatter/subtypes');

var attributes = require('./attributes');

var plotScatterGeo = module.exports = {};


plotScatterGeo.calcGeoJSON = function(trace, topojson) {
    var cdi = [],
        hasLocationData = Array.isArray(trace.locations);

    var len, features, getLonLat, locations;

    if(hasLocationData) {
        locations = trace.locations;
        len = locations.length;
        features = getTopojsonFeatures(trace, topojson);
        getLonLat = function(trace, i) {
            var feature = locationToFeature(trace.locationmode, locations[i], features);

            return (feature !== undefined) ?
                feature.properties.ct :
                undefined;
        };
    }
    else {
        len = trace.lon.length;
        getLonLat = function(trace, i) {
            return [trace.lon[i], trace.lat[i]];
        };
    }

    for(var i = 0; i < len; i++) {
        var lonlat = getLonLat(trace, i);

        if(!lonlat) continue;  // filter the blank points here

        var calcItem = {
            lon: lonlat[0],
            lat: lonlat[1],
            location: hasLocationData ? trace.locations[i] : null
        };

        arrayItemToCalcdata(trace, calcItem, i);

        cdi.push(calcItem);
    }

    if(cdi.length > 0) cdi[0].trace = trace;

    return cdi;
};

// similar Scatter.arraysToCalcdata but inside a filter loop
function arrayItemToCalcdata(trace, calcItem, i) {
    var marker = trace.marker;

    function merge(traceAttr, calcAttr) {
        arrayToCalcItem(traceAttr, calcItem, calcAttr, i);
    }

    merge(trace.text, 'tx');
    merge(trace.textposition, 'tp');
    if(trace.textfont) {
        merge(trace.textfont.size, 'ts');
        merge(trace.textfont.color, 'tc');
        merge(trace.textfont.family, 'tf');
    }

    if(marker && marker.line) {
        var markerLine = marker.line;
        merge(marker.opacity, 'mo');
        merge(marker.symbol, 'mx');
        merge(marker.color, 'mc');
        merge(marker.size, 'ms');
        merge(markerLine.color, 'mlc');
        merge(markerLine.width, 'mlw');
    }
}

function makeLineGeoJSON(trace) {
    var N = trace.lon.length,
        coordinates = new Array(N);

    for(var i = 0; i < N; i++) {
        coordinates[i] = [trace.lon[i], trace.lat[i]];
    }

    return {
        type: 'LineString',
        coordinates: coordinates,
        trace: trace
    };
}

plotScatterGeo.plot = function(geo, scattergeoData) {
    var gScatterGeoTraces = geo.framework.select('.scattergeolayer')
        .selectAll('g.trace.scattergeo')
        .data(scattergeoData, function(trace) { return trace.uid; });

    gScatterGeoTraces.enter().append('g')
        .attr('class', 'trace scattergeo');

    gScatterGeoTraces.exit().remove();

    // TODO find a way to order the inner nodes on update
    gScatterGeoTraces.selectAll('*').remove();

    gScatterGeoTraces.each(function(trace) {
        var s = d3.select(this);

        if(!subTypes.hasLines(trace)) return;

        s.selectAll('path.js-line')
            .data([makeLineGeoJSON(trace)])
          .enter().append('path')
            .classed('js-line', true);

        // TODO add hover - how?
    });

    gScatterGeoTraces.each(function(trace) {
        var s = d3.select(this),
            showMarkers = subTypes.hasMarkers(trace),
            showText = subTypes.hasText(trace);

        if(!showMarkers && !showText) return;

        var cdi = plotScatterGeo.calcGeoJSON(trace, geo.topojson),
            cleanHoverLabelsFunc = makeCleanHoverLabelsFunc(geo, trace),
            eventDataFunc = makeEventDataFunc(trace);

        var hoverinfo = trace.hoverinfo,
            hasNameLabel = (
                hoverinfo === 'all' ||
                hoverinfo.indexOf('name') !== -1
            );

        function handleMouseOver(pt, ptIndex) {
            if(!geo.showHover) return;

            var xy = geo.projection([pt.lon, pt.lat]);
            cleanHoverLabelsFunc(pt);

            Fx.loneHover({
                x: xy[0],
                y: xy[1],
                name: hasNameLabel ? trace.name : undefined,
                text: pt.textLabel,
                color: pt.mc || (trace.marker || {}).color
            }, {
                container: geo.hoverContainer.node()
            });

            geo.graphDiv.emit('plotly_hover', eventDataFunc(pt, ptIndex));
        }

        function handleClick(pt, ptIndex) {
            geo.graphDiv.emit('plotly_click', eventDataFunc(pt, ptIndex));
        }

        if(showMarkers) {
            s.selectAll('path.point').data(cdi)
              .enter().append('path')
                .classed('point', true)
                .on('mouseover', handleMouseOver)
                .on('click', handleClick)
                .on('mouseout', function() {
                    Fx.loneUnhover(geo.hoverContainer);
                })
                .on('mousedown', function() {
                    // to simulate the 'zoomon' event
                    Fx.loneUnhover(geo.hoverContainer);
                })
                .on('mouseup', handleMouseOver);  // ~ 'zoomend'
        }

        if(showText) {
            s.selectAll('g').data(cdi)
              .enter().append('g')
              .append('text');
        }
    });

    plotScatterGeo.style(geo);
};

plotScatterGeo.style = function(geo) {
    var selection = geo.framework.selectAll('g.trace.scattergeo');

    selection.style('opacity', function(trace) {
        return trace.opacity;
    });

    selection.each(function(trace) {
        d3.select(this).selectAll('path.point')
            .call(Drawing.pointStyle, trace);
        d3.select(this).selectAll('text')
            .call(Drawing.textPointStyle, trace);
    });

    // GeoJSON calc data is incompatible with Drawing.lineGroupStyle
    selection.selectAll('path.js-line')
        .style('fill', 'none')
        .each(function(d) {
            var trace = d.trace,
                line = trace.line || {};

            d3.select(this)
                .call(Color.stroke, line.color)
                .call(Drawing.dashLine, line.dash || '', line.width || 0);
        });
};

function makeCleanHoverLabelsFunc(geo, trace) {
    var hoverinfo = trace.hoverinfo;

    if(hoverinfo === 'none') {
        return function cleanHoverLabelsFunc(d) { delete d.textLabel; };
    }

    var hoverinfoParts = (hoverinfo === 'all') ?
            attributes.hoverinfo.flags :
            hoverinfo.split('+');

    var hasLocation = (
            hoverinfoParts.indexOf('location') !== -1 &&
            Array.isArray(trace.locations)
        ),
        hasLon = (hoverinfoParts.indexOf('lon') !== -1),
        hasLat = (hoverinfoParts.indexOf('lat') !== -1),
        hasText = (hoverinfoParts.indexOf('text') !== -1);

    function formatter(val) {
        var axis = geo.mockAxis;
        return Axes.tickText(axis, axis.c2l(val), 'hover').text + '\u00B0';
    }

    return function cleanHoverLabelsFunc(pt) {
        var thisText = [];

        if(hasLocation) thisText.push(pt.location);
        else if(hasLon && hasLat) {
            thisText.push('(' + formatter(pt.lon) + ', ' + formatter(pt.lat) + ')');
        }
        else if(hasLon) thisText.push('lon: ' + formatter(pt.lon));
        else if(hasLat) thisText.push('lat: ' + formatter(pt.lat));

        if(hasText) thisText.push(pt.tx || trace.text);

        pt.textLabel = thisText.join('<br>');
    };
}

function makeEventDataFunc(trace) {
    var hasLocation = Array.isArray(trace.locations);

    return function(pt, ptIndex) {
        return {points: [{
            data: trace._input,
            fullData: trace,
            curveNumber: trace.index,
            pointNumber: ptIndex,
            lon: pt.lon,
            lat: pt.lat,
            location: hasLocation ? pt.location : null
        }]};
    };
}
