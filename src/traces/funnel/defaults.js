/**
* Copyright 2012-2019, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Lib = require('../../lib');

var handleGroupingDefaults = require('../bar/defaults').handleGroupingDefaults;
var handleText = require('../bar/defaults').handleText;
var handleXYDefaults = require('../scatter/xy_defaults');
var attributes = require('./attributes');
var Color = require('../../components/color');

function supplyDefaults(traceIn, traceOut, defaultColor, layout) {
    function coerce(attr, dflt) {
        return Lib.coerce(traceIn, traceOut, attributes, attr, dflt);
    }

    var len = handleXYDefaults(traceIn, traceOut, layout, coerce);
    if(!len) {
        traceOut.visible = false;
        return;
    }

    coerce('orientation', (traceOut.x && !traceOut.y) ? 'h' : 'v');
    coerce('offset');
    coerce('width');

    coerce('text');

    coerce('hovertext');
    coerce('hovertemplate');

    handleText(traceIn, traceOut, layout, coerce, false);

    // TODO: move this block to bar handleText if/when textinfo implimented for bars/histograms
    if(traceOut.textposition !== 'none') {
        coerce('textinfo');
    }

    var markerColor = coerce('marker.color', defaultColor);
    coerce('marker.line.color', Color.defaultLine);
    coerce('marker.line.width');

    var connectorVisible = coerce('connector.visible');
    if(connectorVisible) {
        var defaultFillcolor = Color.addOpacity(
            Lib.isArrayOrTypedArray(markerColor) ? markerColor[0] : markerColor, 0.5
        );
        coerce('connector.fillcolor', defaultFillcolor);

        var connectorLineWidth = coerce('connector.line.width');
        if(connectorLineWidth) {
            coerce('connector.line.color');
            coerce('connector.line.dash');
        }
    }
}

function crossTraceDefaults(fullData, fullLayout) {
    var traceIn, traceOut;

    function coerce(attr) {
        return Lib.coerce(traceOut._input, traceOut, attributes, attr);
    }

    if(fullLayout.funnelmode === 'group') {
        for(var i = 0; i < fullData.length; i++) {
            traceOut = fullData[i];
            traceIn = traceOut._input;

            handleGroupingDefaults(traceIn, traceOut, fullLayout, coerce);
        }
    }
}

module.exports = {
    supplyDefaults: supplyDefaults,
    crossTraceDefaults: crossTraceDefaults
};
