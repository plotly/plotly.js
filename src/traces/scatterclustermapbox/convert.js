/**
* Copyright 2012-2020, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var isNumeric = require('fast-isnumeric');

var Lib = require('../../lib');
var BADNUM = require('../../constants/numerical').BADNUM;
var geoJsonUtils = require('../../lib/geojson_utils');

var Colorscale = require('../../components/colorscale');
var Drawing = require('../../components/drawing');
var makeBubbleSizeFn = require('../scatter/make_bubble_size_func');
var subTypes = require('../scatter/subtypes');

module.exports = function convert(gd, calcTrace) {
    var trace = calcTrace[0].trace;

    var isVisible = trace.visible === true && trace._length !== 0;
    var hasMarkers = subTypes.hasMarkers(trace);
    var hasCircles = hasMarkers && trace.marker.symbol === 'circle';

    var circle = initContainer();
    var circleCluster = initClusterContainer();
    var circleClusterCount = initClusterCountContainer();

    var opts = {
        circle: {
            circle: circle,
            cluster: circleCluster,
            clusterCount: circleClusterCount,
        },
    };

  // early return if not visible or placeholder
    if(!isVisible) return opts;

    if(hasCircles) {
        var circleOpts = makeCircleOpts(calcTrace);
        circle.geojson = circleOpts.geojson;
        circle.layout.visibility = 'visible';
        circleCluster.maxZoom = trace.cluster.maxZoom;
        circleCluster.radius = trace.cluster.radius;
        circleCluster.steps = trace.cluster.steps;
        circleCluster.stepColors = trace.cluster.stepColors;
        circleCluster.stepSize = trace.cluster.stepSize;
        circleCluster.layout.visibility = 'visible';
        circleClusterCount.layout.visibility = 'visible';

        Lib.extendFlat(circle.paint, {
            'circle-color': circleOpts.mcc,
            'circle-radius': circleOpts.mrc,
            'circle-opacity': circleOpts.mo,
        });

        Lib.extendFlat(circleCluster.paint, {
            'circle-color': createCircleColor(
        circleCluster.steps,
        circleCluster.stepColors
      ),
            'circle-radius': createRadius(
        circleCluster.steps,
        circleCluster.stepSize
      ),
        });
    }

    return opts;
};

function initContainer() {
    return {
        geojson: geoJsonUtils.makeBlank(),
        layout: { visibility: 'none' },
        paint: {},
        filter: ['!', ['has', 'point_count']],
    };
}

function initClusterContainer() {
    return {
        maxZoom: 14,
        radius: 50,
        paint: {
            'circle-color': '#51bbd6',
            'circle-radius': 20,
        },
        filter: ['has', 'point_count'],
        layout: { visibility: 'none' },
    };
}

function initClusterCountContainer() {
    return {
        filter: ['has', 'point_count'],
        layout: {
            'text-field': '{point_count_abbreviated}',
            'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
            'text-size': 12,
            visibility: 'none',
        },
    };
}

function createCircleColor(steps, stepColors) {
    var isArray =
    Lib.isArrayOrTypedArray(steps) && Lib.isArrayOrTypedArray(stepColors);

    if(isArray) {
        var colorArray = ['step', ['get', 'point_count'], stepColors[0]];
        for(var idx = 1; idx < stepColors.length; idx++) {
            colorArray.push(steps[idx - 1], stepColors[idx]);
        }
        return colorArray;
    } else {
        return stepColors;
    }
}
function createRadius(steps, stepSize) {
    var isArray =
    Lib.isArrayOrTypedArray(steps) && Lib.isArrayOrTypedArray(stepSize);

    if(isArray) {
        var sizeArray = ['step', ['get', 'point_count'], stepSize[0]];
        for(var idx = 1; idx < stepSize.length; idx++) {
            sizeArray.push(steps[idx - 1], stepSize[idx]);
        }
        return sizeArray;
    } else {
        return stepSize;
    }
}

function makeCircleOpts(calcTrace) {
    var trace = calcTrace[0].trace;
    var marker = trace.marker;
    var selectedpoints = trace.selectedpoints;
    var arrayColor = Lib.isArrayOrTypedArray(marker.color);
    var arraySize = Lib.isArrayOrTypedArray(marker.size);
    var arrayOpacity = Lib.isArrayOrTypedArray(marker.opacity);
    var i;

    function addTraceOpacity(o) {
        return trace.opacity * o;
    }

    function size2radius(s) {
        return s / 2;
    }

    var colorFn;
    if(arrayColor) {
        if(Colorscale.hasColorscale(trace, 'marker')) {
            colorFn = Colorscale.makeColorScaleFuncFromTrace(marker);
        } else {
            colorFn = Lib.identity;
        }
    }

    var sizeFn;
    if(arraySize) {
        sizeFn = makeBubbleSizeFn(trace);
    }

    var opacityFn;
    if(arrayOpacity) {
        opacityFn = function(mo) {
            var mo2 = isNumeric(mo) ? +Lib.constrain(mo, 0, 1) : 0;
            return addTraceOpacity(mo2);
        };
    }

    var features = [];

    for(i = 0; i < calcTrace.length; i++) {
        var calcPt = calcTrace[i];
        var lonlat = calcPt.lonlat;

        if(isBADNUM(lonlat)) continue;

        var props = {};
        if(colorFn) props.mcc = calcPt.mcc = colorFn(calcPt.mc);
        if(sizeFn) props.mrc = calcPt.mrc = sizeFn(calcPt.ms);
        if(opacityFn) props.mo = opacityFn(calcPt.mo);
        if(selectedpoints) props.selected = calcPt.selected || 0;

        features.push({
            id: i,
            type: 'Feature',
            geometry: { type: 'Point', coordinates: lonlat },
            properties: props,
        });
    }

    var fns;
    if(selectedpoints) {
        fns = Drawing.makeSelectedPointStyleFns(trace);

        for(i = 0; i < features.length; i++) {
            var d = features[i].properties;

            if(fns.selectedOpacityFn) {
                d.mo = addTraceOpacity(fns.selectedOpacityFn(d));
            }
            if(fns.selectedColorFn) {
                d.mcc = fns.selectedColorFn(d);
            }
            if(fns.selectedSizeFn) {
                d.mrc = fns.selectedSizeFn(d);
            }
        }
    }

    return {
        geojson: { type: 'FeatureCollection', features: features },
        mcc:
      arrayColor || (fns && fns.selectedColorFn) ?
        { type: 'identity', property: 'mcc' } :
        marker.color,
        mrc:
      arraySize || (fns && fns.selectedSizeFn) ?
        { type: 'identity', property: 'mrc' } :
        size2radius(marker.size),
        mo:
      arrayOpacity || (fns && fns.selectedOpacityFn) ?
        { type: 'identity', property: 'mo' } :
        addTraceOpacity(marker.opacity),
    };
}

// only need to check lon (OR lat)
function isBADNUM(lonlat) {
    return lonlat[0] === BADNUM;
}
