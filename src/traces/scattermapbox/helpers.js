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
var Colorscale = require('../../components/colorscale');
var Drawing = require('../../components/drawing');
var makeBubbleSizeFn = require('../scatter/make_bubble_size_func');

function makeCircleOpts(calcTrace) {
    var trace = calcTrace[0].trace;
    var marker = trace.marker;
    var selectedpoints = trace.selectedpoints;
    var arrayColor = Lib.isArrayOrTypedArray(marker.color);
    var arraySize = Lib.isArrayOrTypedArray(marker.size);
    var arrayOpacity = Lib.isArrayOrTypedArray(marker.opacity);
    var i;

    function addTraceOpacity(o) { return trace.opacity * o; }

    function size2radius(s) { return s / 2; }

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
            type: 'Feature',
            geometry: {type: 'Point', coordinates: lonlat},
            properties: props
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
        geojson: {type: 'FeatureCollection', features: features},
        mcc: arrayColor || (fns && fns.selectedColorFn) ?
            {type: 'identity', property: 'mcc'} :
            marker.color,
        mrc: arraySize || (fns && fns.selectedSizeFn) ?
            {type: 'identity', property: 'mrc'} :
            size2radius(marker.size),
        mo: arrayOpacity || (fns && fns.selectedOpacityFn) ?
            {type: 'identity', property: 'mo'} :
            addTraceOpacity(marker.opacity)
    };
}

// only need to check lon (OR lat)
function isBADNUM(lonlat) {
    return lonlat[0] === BADNUM;
}


module.exports = {
    makeCircleOpts: makeCircleOpts
};
