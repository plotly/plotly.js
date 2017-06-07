/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var d3 = require('d3');

var Drawing = require('../../components/drawing');
var Color = require('../../components/color');

var Lib = require('../../lib');
var BADNUM = require('../../constants/numerical').BADNUM;
var getTopojsonFeatures = require('../../lib/topojson_utils').getTopojsonFeatures;
var locationToFeature = require('../../lib/geo_location_utils').locationToFeature;
var geoJsonUtils = require('../../lib/geojson_utils');
var subTypes = require('../scatter/subtypes');


module.exports = function plot(geo, calcData) {

    function keyFunc(d) { return d[0].trace.uid; }

    function removeBADNUM(d, node) {
        if(d.lonlat[0] === BADNUM) {
            d3.select(node).remove();
        }
    }

    for(var i = 0; i < calcData.length; i++) {
        fillLocationLonLat(calcData[i], geo.topojson);
    }

    var gScatterGeoTraces = geo.framework.select('.scattergeolayer')
        .selectAll('g.trace.scattergeo')
        .data(calcData, keyFunc);

    gScatterGeoTraces.enter().append('g')
        .attr('class', 'trace scattergeo');

    gScatterGeoTraces.exit().remove();

    // TODO find a way to order the inner nodes on update
    gScatterGeoTraces.selectAll('*').remove();

    gScatterGeoTraces.each(function(calcTrace) {
        var s = d3.select(this);
        var trace = calcTrace[0].trace;

        if(subTypes.hasLines(trace) || trace.fill !== 'none') {
            var lineCoords = geoJsonUtils.calcTraceToLineCoords(calcTrace);

            var lineData = (trace.fill !== 'none') ?
                geoJsonUtils.makePolygon(lineCoords, trace) :
                geoJsonUtils.makeLine(lineCoords, trace);

            s.selectAll('path.js-line')
                .data([lineData])
              .enter().append('path')
                .classed('js-line', true);
        }

        if(subTypes.hasMarkers(trace)) {
            s.selectAll('path.point')
                .data(Lib.identity)
             .enter().append('path')
                .classed('point', true)
                .each(function(calcPt) { removeBADNUM(calcPt, this); });
        }

        if(subTypes.hasText(trace)) {
            s.selectAll('g')
                .data(Lib.identity)
              .enter().append('g')
                .append('text')
                .each(function(calcPt) { removeBADNUM(calcPt, this); });
        }
    });

    // call style here within topojson request callback
    style(geo);
};

function fillLocationLonLat(calcTrace, topojson) {
    var trace = calcTrace[0].trace;

    if(!Array.isArray(trace.locations)) return;

    var features = getTopojsonFeatures(trace, topojson);
    var locationmode = trace.locationmode;

    for(var i = 0; i < calcTrace.length; i++) {
        var calcPt = calcTrace[i];
        var feature = locationToFeature(locationmode, calcPt.loc, features);

        calcPt.lonlat = feature ? feature.properties.ct : [BADNUM, BADNUM];
    }
}

function style(geo) {
    var selection = geo.framework.selectAll('g.trace.scattergeo');

    selection.style('opacity', function(calcTrace) {
        return calcTrace[0].trace.opacity;
    });

    selection.each(function(calcTrace) {
        var trace = calcTrace[0].trace,
            group = d3.select(this);

        group.selectAll('path.point')
            .call(Drawing.pointStyle, trace, geo.graphDiv);
        group.selectAll('text')
            .call(Drawing.textPointStyle, trace, geo.graphDiv);
    });

    // this part is incompatible with Drawing.lineGroupStyle
    selection.selectAll('path.js-line')
        .style('fill', 'none')
        .each(function(d) {
            var path = d3.select(this),
                trace = d.trace,
                line = trace.line || {};

            path.call(Color.stroke, line.color)
                .call(Drawing.dashLine, line.dash || '', line.width || 0);

            if(trace.fill !== 'none') {
                path.call(Color.fill, trace.fillcolor);
            }
        });
}
