/**
* Copyright 2012-2019, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Lib = require('../../lib');
var nestedProperty = Lib.nestedProperty;

var handleGroupingDefaults = require('../bar/defaults').handleGroupingDefaults;
var getAxisGroup = require('../../plots/cartesian/axis_ids').getAxisGroup;
var attributes = require('./attributes');

var BINATTRS = {
    x: [
        {aStr: 'xbins.start', name: 'start'},
        {aStr: 'xbins.end', name: 'end'},
        {aStr: 'xbins.size', name: 'size'},
        {aStr: 'nbinsx', name: 'nbins'}
    ],
    y: [
        {aStr: 'ybins.start', name: 'start'},
        {aStr: 'ybins.end', name: 'end'},
        {aStr: 'ybins.size', name: 'size'},
        {aStr: 'nbinsy', name: 'nbins'}
    ]
};

// handle bin attrs and relink auto-determined values so fullData is complete
module.exports = function crossTraceDefaults(fullData, fullLayout) {
    var allBinOpts = fullLayout._histogramBinOpts = {};
    var isOverlay = fullLayout.barmode === 'overlay';
    var i, j, traceOut, traceIn, binDirection, group, binOpts;

    function coerce(attr) {
        return Lib.coerce(traceOut._input, traceOut, attributes, attr);
    }

    for(i = 0; i < fullData.length; i++) {
        traceOut = fullData[i];
        if(traceOut.type !== 'histogram') continue;

        // TODO: this shouldn't be relinked as it's only used within calc
        // https://github.com/plotly/plotly.js/issues/749
        delete traceOut._autoBinFinished;

        binDirection = traceOut.orientation === 'v' ? 'x' : 'y';
        // in overlay mode make a separate group for each trace
        // otherwise collect all traces of the same subplot & orientation
        group = traceOut._groupName = isOverlay ? traceOut.uid : (
            getAxisGroup(fullLayout, traceOut.xaxis) +
            getAxisGroup(fullLayout, traceOut.yaxis) +
            binDirection
        );
        binOpts = allBinOpts[group];

        if(binOpts) {
            binOpts.traces.push(traceOut);
        } else {
            binOpts = allBinOpts[group] = {
                traces: [traceOut],
                direction: binDirection
            };
        }

        handleGroupingDefaults(traceOut._input, traceOut, fullLayout, coerce);
    }

    for(group in allBinOpts) {
        binOpts = allBinOpts[group];
        binDirection = binOpts.direction;
        var attrs = BINATTRS[binDirection];
        for(j = 0; j < attrs.length; j++) {
            var attrSpec = attrs[j];
            var attr = attrSpec.name;

            // nbins(x|y) is moot if we have a size. This depends on
            // nbins coming after size in binAttrs.
            if(attr === 'nbins' && binOpts.sizeFound) continue;

            var aStr = attrSpec.aStr;
            for(i = 0; i < binOpts.traces.length; i++) {
                traceOut = binOpts.traces[i];
                traceIn = traceOut._input;
                if(nestedProperty(traceIn, aStr).get() !== undefined) {
                    binOpts[attr] = coerce(aStr);
                    binOpts[attr + 'Found'] = true;
                    break;
                }
                var autoVals = traceOut._autoBin;
                if(autoVals && autoVals[attr]) {
                    // if this is the *first* autoval
                    nestedProperty(traceOut, aStr).set(autoVals[attr]);
                }
            }
            // start and end we need to coerce anyway, after having collected the
            // first of each into binOpts, in case a trace wants to restrict its
            // data to a certain range
            if(attr === 'start' || attr === 'end') {
                for(; i < binOpts.traces.length; i++) {
                    traceOut = binOpts.traces[i];
                    coerce(aStr, (traceOut._autoBin || {})[attr]);
                }
            }

            if(attr === 'nbins' && !binOpts.sizeFound && !binOpts.nbinsFound) {
                traceOut = binOpts.traces[0];
                binOpts[attr] = coerce(aStr);
            }
        }
    }
};
