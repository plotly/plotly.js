/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var setPositionOffset = require('../box/set_positions').setPositionOffset;
var orientations = ['v', 'h'];

module.exports = function setPositions(gd, plotinfo) {
    var calcdata = gd.calcdata;
    var xa = plotinfo.xaxis;
    var ya = plotinfo.yaxis;

    for(var i = 0; i < orientations.length; i++) {
        var orientation = orientations[i];
        var posAxis = orientation === 'h' ? ya : xa;
        var violinList = [];
        var minPad = 0;
        var maxPad = 0;

        for(var j = 0; j < calcdata.length; j++) {
            var cd = calcdata[j];
            var t = cd[0].t;
            var trace = cd[0].trace;

            if(trace.visible === true && trace.type === 'violin' &&
                    !t.empty &&
                    trace.orientation === orientation &&
                    trace.xaxis === xa._id &&
                    trace.yaxis === ya._id
              ) {
                violinList.push(j);

                if(trace.points !== false) {
                    minPad = Math.max(minPad, trace.jitter - trace.pointpos - 1);
                    maxPad = Math.max(maxPad, trace.jitter + trace.pointpos - 1);
                }
            }
        }

        setPositionOffset('violin', gd, violinList, posAxis, [minPad, maxPad]);
    }
};
