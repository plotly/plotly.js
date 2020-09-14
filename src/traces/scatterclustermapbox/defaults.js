/**
* Copyright 2012-2020, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Lib = require('../../lib');

var subTypes = require('../scatter/subtypes');
var handleMarkerDefaults = require('../scatter/marker_defaults');

var attributes = require('./attributes');

module.exports = function supplyDefaults(
  traceIn,
  traceOut,
  defaultColor,
  layout
) {
    function coerce(attr, dflt) {
        return Lib.coerce(traceIn, traceOut, attributes, attr, dflt);
    }
    var len = handleLonLatDefaults(traceIn, traceOut, coerce);
    if(!len) {
        traceOut.visible = false;
        return;
    }

    coerce('texttemplate');
    coerce('hovertext');
    coerce('hovertemplate');
    coerce('mode');
    coerce('below');
    coerce('cluster.maxZoom');
    coerce('cluster.radius');
    coerce('cluster.steps');
    coerce('cluster.stepSize');
    coerce('cluster.stepColors');


    if(subTypes.hasMarkers(traceOut)) {
        handleMarkerDefaults(traceIn, traceOut, defaultColor, layout, coerce, {
            noLine: true,
            noSelect: true
        });

        var marker = traceOut.marker;
        if(marker.symbol !== 'circle') {
            if(Lib.isArrayOrTypedArray(marker.size)) marker.size = marker.size[0];
            if(Lib.isArrayOrTypedArray(marker.color)) marker.color = marker.color[0];
        }
    }
};

function handleLonLatDefaults(traceIn, traceOut, coerce) {
    var lon = coerce('lon') || [];
    var lat = coerce('lat') || [];
    var len = Math.min(lon.length, lat.length);
    traceOut._length = len;

    return len;
}
