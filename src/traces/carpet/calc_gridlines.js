/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Axes = require('../../plots/cartesian/axes');
var cheaterBasis = require('./cheater_basis');
var arrayMinmax = require('./array_minmax');
var search = require('../../lib/search').findBin;
var computeControlPoints = require('./compute_control_points');
var map2dArray = require('./map_2d_array');
var createSplineEvaluator = require('./create_spline_evaluator');
var setConvert = require('./set_convert');
var map2dArray = require('./map_2d_array');
var map1dArray = require('./map_1d_array');
var makepath = require('./makepath');
var extendFlat = require('../../lib/extend').extendFlat;

module.exports = function calcGridlines (trace, axisLetter, crossAxisLetter, xaxis, yaxis) {
    var i, j, gridline, j0, i0;

    var data = trace[axisLetter];
    var axis = trace[axisLetter + 'axis'];

    var gridlines = axis._gridlines = [];
    var minorgridlines = axis._minorgridlines = [];
    var boundarylines = axis._boundarylines = [];

    var crossData = trace[crossAxisLetter];
    var crossAxis = trace[crossAxisLetter + 'axis'];

    var xcp = trace._xctrl;
    var ycp = trace._yctrl;
    var nea = xcp.length;
    var neb = xcp[0].length;
    var na = trace.a.length;
    var nb = trace.b.length;

    // The default is an empty array that will cause the join to remove the gridline if
    // it's just disappeared:
    axis._startline = axis._endline = [];

    // If the cross axis uses bicubic interpolation, then the grid
    // lines fall once every three expanded grid row/cols:
    var stride = axis.smoothing ? 3 : 1;

    function constructValueGridline (value) {
        var j, j0, tj, pxy, i0, ti, xy, dxydi0, dxydi1, i, dxydj0, dxydj1;
        var xpoints = [];
        var ypoints = [];
        // Search for the fractional grid index giving this line:
        if (axisLetter === 'b') {
            j = trace.b2j(value);
            j0 = Math.floor(Math.max(0, Math.min(nb - 2, j)));
            tj = j - j0;

            for (var i = 0; i < na; i++) {
                i0 = Math.min(na - 2, i);
                ti = i - i0;
                xy = trace._evalxy([], i0, j0, ti, tj);

                if (crossAxis.smoothing && i > 0) {
                    // First control point:
                    dxydi0 = trace.dxydi([], i - 1, j0, 0, tj);
                    xpoints.push(pxy[0] + dxydi0[0] / 3);
                    ypoints.push(pxy[1] + dxydi0[1] / 3);

                    // Second control point:
                    dxydi1 = trace.dxydi([], i - 1, j0, 1, tj);
                    xpoints.push(xy[0] - dxydi1[0] / 3);
                    ypoints.push(xy[1] - dxydi1[1] / 3);
                }

                xpoints.push(xy[0])
                ypoints.push(xy[1])

                pxy = xy;
            }
        } else {
            i = trace.a2i(value);
            i0 = Math.floor(Math.max(0, Math.min(na - 2, i)));
            ti = i - i0;

            for (var j = 0; j < nb; j++) {
                j0 = Math.min(nb - 2, j);
                tj = j - j0;
                xy = trace._evalxy([], i0, j0, ti, tj);

                if (crossAxis.smoothing && j > 0) {
                    // First control point:
                    dxydj0 = trace.dxydj([], i0, j - 1, ti, 0);
                    xpoints.push(pxy[0] + dxydj0[0] / 3);
                    ypoints.push(pxy[1] + dxydj0[1] / 3);

                    // Second control point:
                    dxydj1 = trace.dxydj([], i0, j - 1, ti, 1);
                    xpoints.push(xy[0] - dxydj1[0] / 3);
                    ypoints.push(xy[1] - dxydj1[1] / 3);
                }

                xpoints.push(xy[0])
                ypoints.push(xy[1])

                pxy = xy;
            }
        }

        return {
            axisLetter: axisLetter,
            axis: trace[axisLetter + 'axis'],
            value: value,
            constvar: crossAxisLetter,
            index: n,
            x: xpoints,
            y: ypoints,
            //dxy_0: dxy_0,
            //dxy_1: dxy_1,
            smoothing: crossAxis.smoothing,
        };
    }

    function constructArrayGridline (j) {
        var dxy_0, dxy_1;
        var xpoints = [];
        var ypoints = [];

        if (axisLetter === 'b') {
            // In the tickmode: array case, this operation is a simple
            // transfer of data:
            for (i = 0; i < nea; i++) {
                xpoints[i] = xcp[i][j * stride];
                ypoints[i] = ycp[i][j * stride];
            }

            j0 = Math.min(j, nb - 2);
            dxy_0 = trace.dxydi(null, 0, j0, 0, j - j0);
            dxy_1 = trace.dxydi(null, na - 2, j0, 1, j - j0);
        } else {
            // In the tickmode: array case, this operation is a simple
            // transfer of data:
            for (i = 0; i < neb; i++) {
                xpoints[i] = xcp[j * stride][i];
                ypoints[i] = ycp[j * stride][i];
            }

            i0 = Math.min(i, na - 2);
            dxy_0 = trace.dxydj(null, i0, 0, i - i0, 0);
            dxy_1 = trace.dxydj(null, i0, nb - 2, i - i0, 1);
        }

        return {
            axisLetter: axisLetter,
            axis: trace[axisLetter + 'axis'],
            value: data[j],
            constvar: crossAxisLetter,
            index: j,
            x: xpoints,
            y: ypoints,
            dxy_0: dxy_0,
            dxy_1: dxy_1,
            smoothing: crossAxis.smoothing,
        };
    };


    if (axis.tickmode === 'array') {
        var j0, j1;
        //var j0 = axis.startline ? 1 : 0;
        //var j1 = data.length - (axis.endline ? 1 : 0);

        var eps = 5e-15;
        var bounds = [
            Math.floor(((data.length - 1) - axis.arraytick0) / axis.arraydtick * (1 + eps)),
            Math.ceil((- axis.arraytick0) / axis.arraydtick / (1 + eps))
        ].sort(function (a, b) {return a - b});

        // Unpack sorted values so we can be sure to avoid infinite loops if something
        // is backwards:
        var n1 = bounds[0] - 1;
        var n2 = bounds[1] + 1;

        // If the axes fall along array lines, then this is a much simpler process since
        // we already have all the control points we need
        for (n = n1; n < n2; n++) {
            j = axis.arraytick0 + axis.arraydtick * n;
            if (j < 0 || j > data.length - 1) continue;
            gridlines.push(extendFlat(constructArrayGridline(j), {
                color: axis.gridcolor,
                width: axis.gridwidth
            }));
        }

        for (n = n1; n < n2; n++) {
            j0 = axis.arraytick0 + axis.arraydtick * n;
            j1 = Math.min(j0 + axis.arraydtick, data.length - 1);

            // TODO: fix the bounds computation so we don't have to do a large range and then throw
            // out unneeded numbers
            if (j0 < 0 || j0 > data.length - 1) continue;
            if (j1 < 0 || j1 > data.length - 1) continue;

            var v0 = data[j0];
            var v1 = data[j1];

            for (i = 0; i < axis.minorgridcount; i++) {
                var d = j1 - j0;

                // TODO: fix the bounds computation so we don't have to do a large range and then throw
                // out unneeded numbers
                if (d <= 0) continue;

                // XXX: This calculation isn't quite right. Off by one somewhere?
                var v = v0 + (v1 - v0) * (i + 1) / (axis.minorgridcount + 1) * (axis.arraydtick / d);

                // TODO: fix the bounds computation so we don't have to do a large range and then throw
                // out unneeded numbers
                if (v < data[0] || v > data[data.length - 1]) continue;
                minorgridlines.push(extendFlat(constructValueGridline(v), {
                    color: axis.minorgridcolor,
                    width: axis.minorgridwidth
                }));
            }
        }

        if (axis.startline) {
            boundarylines.push(extendFlat(constructArrayGridline(0), {
                color: axis.startlinecolor,
                width: axis.startlinewidth
            }));
        }

        if (axis.endline) {
            boundarylines.push(extendFlat(constructArrayGridline(data.length - 1), {
                color: axis.endlinecolor,
                width: axis.endlinewidth
            }));
        }
    } else {
        // If the lines do not fall along the axes, then we have to interpolate
        // the contro points and so some math to figure out where the lines are
        // in the first place.

        // Compute the integer boudns of tick0 + n * dtick that fall within the range
        // (roughly speaking):
        // Give this a nice generous epsilon. We use at as * (1 + eps) in order to make
        // inequalities a little tolerant in a more or less correct manner:
        var eps = 5e-15;
        var bounds = [
            Math.floor((data[data.length - 1] - axis.tick0) / axis.dtick * (1 + eps)),
            Math.ceil((data[0] - axis.tick0) / axis.dtick / (1 + eps))
        ].sort(function (a, b) {return a - b});

        // Unpack sorted values so we can be sure to avoid infinite loops if something
        // is backwards:
        var n1 = bounds[0];
        var n2 = bounds[1];

        for (var n = n1; n <= n2; n++) {
            var value = axis.tick0 + axis.dtick * n;

            gridlines.push(extendFlat(constructValueGridline(value), {
                color: axis.gridcolor,
                width: axis.gridwidth
            }));
        }

        for (n = n1 - 1; n < n2 + 1; n++) {
            value = axis.tick0 + axis.dtick * n;

            for (i = 0; i < axis.minorgridcount; i++) {
                var v = value + axis.dtick * (i + 1) / (axis.minorgridcount + 1)
                if (v < data[0] || v > data[data.length - 1]) continue;
                minorgridlines.push(extendFlat(constructValueGridline(v), {
                    color: axis.minorgridcolor,
                    width: axis.minorgridwidth
                }));
            }
        }

        if (axis.startline) {
            boundarylines.push(extendFlat(constructValueGridline(data[0]), {
                color: axis.startlinecolor,
                width: axis.startlinewidth
            }));
        }

        if (axis.endline) {
            boundarylines.push(extendFlat(constructValueGridline(data[data.length - 1]), {
                color: axis.endlinecolor,
                width: axis.endlinewidth
            }));
        }
    }
}
