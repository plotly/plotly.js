/**
* Copyright 2012-2020, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Lib = require('../../lib');
var geoJsonUtils = require('../../lib/geojson_utils');

var helpers = require('../scattermapbox/helpers');
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
        var circleOpts = helpers.makeCircleOpts(calcTrace);
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
