/**
* Copyright 2012-2016, Plotly, Inc.
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
var getTopojsonFeatures = require('../../lib/topojson_utils').getTopojsonFeatures;
var locationToFeature = require('../../lib/geo_location_utils').locationToFeature;
var geoJsonUtils = require('../../lib/geojson_utils');
var arrayToCalcItem = require('../../lib/array_to_calc_item');
var subTypes = require('../scatter/subtypes');


module.exports = function plot(geo, calcData) {

    function keyFunc(d) { return d[0].trace.uid; }

    var gScatterGeoTraces = geo.framework.select('.scattergeolayer')
        .selectAll('g.trace.scattergeo')
        .data(calcData, keyFunc);

    gScatterGeoTraces.enter().append('g')
        .attr('class', 'trace scattergeo');

    gScatterGeoTraces.exit().remove();

    // TODO find a way to order the inner nodes on update
    gScatterGeoTraces.selectAll('*').remove();

    gScatterGeoTraces.each(function(calcTrace) {
        var s = d3.select(this),
            trace = calcTrace[0].trace,
            convertToLonLatFn = makeConvertToLonLatFn(trace, geo.topojson);

        // skip over placeholder traces
        if(calcTrace[0].placeholder) s.remove();

        // just like calcTrace but w/o not-found location datum
        var _calcTrace = [];

        for(var i = 0; i < calcTrace.length; i++) {
            var _calcPt = convertToLonLatFn(calcTrace[i]);

            if(_calcPt) {
                arrayItemToCalcdata(trace, calcTrace[i], i);
                _calcTrace.push(_calcPt);
            }
        }

        if(subTypes.hasLines(trace) || trace.fill !== 'none') {
            var lineCoords = geoJsonUtils.calcTraceToLineCoords(_calcTrace);

            var lineData = (trace.fill !== 'none') ?
                geoJsonUtils.makePolygon(lineCoords, trace) :
                geoJsonUtils.makeLine(lineCoords, trace);

            s.selectAll('path.js-line')
                .data([lineData])
              .enter().append('path')
                .classed('js-line', true);
        }

        if(subTypes.hasMarkers(trace)) {
            s.selectAll('path.point').data(_calcTrace)
              .enter().append('path')
                .classed('point', true);
        }

        if(subTypes.hasText(trace)) {
            s.selectAll('g').data(_calcTrace)
              .enter().append('g')
              .append('text');
        }
    });

    // call style here within topojson request callback
    style(geo);
};

function makeConvertToLonLatFn(trace, topojson) {
    if(!Array.isArray(trace.locations)) return Lib.identity;

    var features = getTopojsonFeatures(trace, topojson),
        locationmode = trace.locationmode;

    return function(calcPt) {
        var feature = locationToFeature(locationmode, calcPt.loc, features);

        if(feature) {
            calcPt.lonlat = feature.properties.ct;
            return calcPt;
        }
        else {
            // mutate gd.calcdata so that hoverPoints knows to skip this datum
            calcPt.lonlat = [null, null];
            return false;
        }
    };
}

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

function style(geo) {
    var selection = geo.framework.selectAll('g.trace.scattergeo');

    selection.style('opacity', function(calcTrace) {
        return calcTrace[0].trace.opacity;
    });

    selection.each(function(calcTrace) {
        var trace = calcTrace[0].trace,
            group = d3.select(this);

        group.selectAll('path.point')
            .call(Drawing.pointStyle, trace);
        group.selectAll('text')
            .call(Drawing.textPointStyle, trace);
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
