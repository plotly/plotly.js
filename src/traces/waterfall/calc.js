/**
* Copyright 2012-2019, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Axes = require('../../plots/cartesian/axes');
var hasColorscale = require('../../components/colorscale/helpers').hasColorscale;
var colorscaleCalc = require('../../components/colorscale/calc');
var arraysToCalcdata = require('../bar/arrays_to_calcdata');
var calcSelection = require('../scatter/calc_selection');

function extractInstructions(list) {
    var result = [];
    for(var i = 0; i < list.length; i++) {
        result.push(
            (list[i].length) ? list[i][0] : ''
        );
    }
    return result;
}

module.exports = function calc(gd, trace) {
    var xa = Axes.getFromId(gd, trace.xaxis || 'x');
    var ya = Axes.getFromId(gd, trace.yaxis || 'y');
    var size, pos, instr;

    if(trace.orientation === 'h') {
        size = xa.makeCalcdata(trace, 'x');
        pos = ya.makeCalcdata(trace, 'y');
        instr = extractInstructions(trace.y);
    } else {
        size = ya.makeCalcdata(trace, 'y');
        pos = xa.makeCalcdata(trace, 'x');
        instr = extractInstructions(trace.x);
    }

    // create the "calculated data" to plot
    var serieslen = Math.min(pos.length, size.length);
    var cd = new Array(serieslen);

    // set position and size (as well as for waterfall total size)
    var previousSum = 0;
    var newSize;

    for(var i = 0; i < serieslen; i++) {
        cd[i] = {
            p: pos[i],
            s: size[i]
        };

        if(instr[i] === '=' || instr[i] === '|') {
            cd[i].isSum = true;
            cd[i].s = previousSum;
        } else if(instr[i] === '%') {
            cd[i].isSum = false;
            var delta = Math.abs(cd[i].s);
            var sign = (cd[i].s < 0) ? -1 : 1;
            newSize = sign * (delta * previousSum * 0.01);
            cd[i].s = previousSum + newSize;
            previousSum += newSize;
        } else if(instr[i] === '-') {
            cd[i].isSum = false;
            newSize = -cd[i].s;
            cd[i].s = previousSum + newSize;
            previousSum += newSize;
        } else { // default is to add
            cd[i].isSum = false;
            newSize = cd[i].s;
            cd[i].s = previousSum + newSize;
            previousSum += newSize;
        }

        if(trace.ids) {
            cd[i].id = String(trace.ids[i]);
        }
    }

    // auto-z and autocolorscale if applicable
    if(hasColorscale(trace, 'marker')) {
        colorscaleCalc(gd, trace, {
            vals: trace.marker.color,
            containerStr: 'marker',
            cLetter: 'c'
        });
    }
    if(hasColorscale(trace, 'marker.line')) {
        colorscaleCalc(gd, trace, {
            vals: trace.marker.line.color,
            containerStr: 'marker.line',
            cLetter: 'c'
        });
    }

    arraysToCalcdata(cd, trace);
    calcSelection(cd, trace);

    return cd;
};
