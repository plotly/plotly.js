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

var INCREASING_COLOR = '#3D9970';
var DECREASING_COLOR = '#FF4136';
var TOTALS_COLOR = '#4499FF';

function handleDirection(coerce, direction, defaultColor) {
    coerce(direction + '.color', defaultColor);
    coerce(direction + '.line.color', Color.defaultLine);
    coerce(direction + '.line.width');
    coerce(direction + '.opacity');
}

function supplyDefaults(traceIn, traceOut, defaultColor, layout) {
    function coerce(attr, dflt) {
        return Lib.coerce(traceIn, traceOut, attributes, attr, dflt);
    }

    var len = handleXYDefaults(traceIn, traceOut, layout, coerce);
    if(!len) {
        traceOut.visible = false;
        return;
    }

    coerce('measure');

    coerce('orientation', (traceOut.x && !traceOut.y) ? 'h' : 'v');
    coerce('base');
    coerce('offset');
    coerce('width');

    coerce('text');
    coerce('hovertext');
    coerce('hovertemplate');

    handleText(traceIn, traceOut, layout, coerce);

    handleDirection(coerce, 'increasing', INCREASING_COLOR);
    handleDirection(coerce, 'decreasing', DECREASING_COLOR);
    handleDirection(coerce, 'totals', TOTALS_COLOR);
    handleDirection(coerce, 'marker', defaultColor);

    coerce('selected.marker.color');
    coerce('unselected.marker.color');

    Lib.coerceSelectionMarkerOpacity(traceOut, coerce);

    coerce('connector.color');
    coerce('connector.width');
    coerce('connector.dash');
    coerce('connector.mode');
}

function crossTraceDefaults(fullData, fullLayout) {
    var traceIn, traceOut;

    function coerce(attr) {
        return Lib.coerce(traceOut._input, traceOut, attributes, attr);
    }

    for(var i = 0; i < fullData.length; i++) {
        traceOut = fullData[i];

        traceIn = traceOut._input;
        if(fullLayout.waterfallmode === 'group') {
            handleGroupingDefaults(traceIn, traceOut, fullLayout, coerce);
        }
    }
}

module.exports = {
    supplyDefaults: supplyDefaults,
    crossTraceDefaults: crossTraceDefaults,
    handleGroupingDefaults: handleGroupingDefaults
};
