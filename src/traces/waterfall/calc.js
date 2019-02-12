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
var arraysToCalcdata = require('./arrays_to_calcdata');
var calcSelection = require('../scatter/calc_selection');

function extractOperators(list) {
    var result = [];
    if(!list || !list.length) return result;

    for(var i = 0; i < list.length; i++) {
        var operator = (list[i].length > 1) ? list[i].substring(0, 2) : '';
        if(
            operator !== '= ' &&
            operator !== '+ ' &&
            operator !== '- ' &&
            operator !== '% '
        ) operator = '';
        result.push(operator);
    }
    return result;
}

module.exports = function calc(gd, trace) {
    var xa = Axes.getFromId(gd, trace.xaxis || 'x');
    var ya = Axes.getFromId(gd, trace.yaxis || 'y');
    var size, pos, operators;

    if(trace.orientation === 'h') {
        size = xa.makeCalcdata(trace, 'x');
        pos = ya.makeCalcdata(trace, 'y');
        operators = extractOperators(trace.y);
        ya._operators = operators;
    } else {
        size = ya.makeCalcdata(trace, 'y');
        pos = xa.makeCalcdata(trace, 'x');
        operators = extractOperators(trace.x);
        xa._operators = operators;
    }

    // create the "calculated data" to plot
    var serieslen = Math.min(pos.length, size.length);
    var cd = new Array(serieslen);

    // set position and size (as well as for waterfall total size)
    var previousSum = 0;
    var newSize;
    var i;

    for(i = 0; i < serieslen; i++) {
        cd[i] = {
            p: pos[i],
            s: size[i]
        };

        if(operators[i] === '= ') {
            if(i === 0) previousSum = cd[i].s; // this is a special case to allow using first element contain an initial value

            cd[i].isSum = true;
            cd[i].s = previousSum;
        } else if(operators[i] === '% ') {
            cd[i].isSum = false;
            var delta = Math.abs(cd[i].s);
            var sign = (cd[i].s < 0) ? -1 : 1;
            newSize = sign * (delta * previousSum * 0.01);
            cd[i].s = previousSum + newSize;
            previousSum += newSize;
        } else if(operators[i] === '- ') {
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

    var vals = [];
    if(trace._autoMarkerColor || trace._autoMarkerLineColor) {
        for(i = 0; i < serieslen; i++) {
            vals[i] = (cd[i].isSum) ? 0 :
                (i === 0) ? cd[i].s : cd[i].s - cd[i - 1].s;
        }
    }

    // auto-z and autocolorscale if applicable
    if(hasColorscale(trace, 'marker')) {
        colorscaleCalc(gd, trace, {
            vals: (trace._autoMarkerColor) ? vals : trace.marker.color,
            containerStr: 'marker',
            cLetter: 'c'
        });
    }
    if(hasColorscale(trace, 'marker.line')) {
        colorscaleCalc(gd, trace, {
            vals: (trace._autoMarkerLineColor) ? vals : trace.marker.line.color,
            containerStr: 'marker.line',
            cLetter: 'c'
        });
    }

    arraysToCalcdata(cd, trace, vals);
    calcSelection(cd, trace);

    return cd;
};
