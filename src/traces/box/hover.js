/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Axes = require('../../plots/cartesian/axes');
var Lib = require('../../lib');
var Fx = require('../../components/fx');
var Color = require('../../components/color');

module.exports = function hoverPoints(pointData, xval, yval, hovermode) {
    var cd = pointData.cd;
    var xa = pointData.xa;
    var ya = pointData.ya;

    var trace = cd[0].trace;
    var hoveron = trace.hoveron;
    var marker = trace.marker || {};

    // output hover points array
    var closeData = [];
    // x/y/effective distance functions
    var dx, dy, distfn;
    // orientation-specific fields
    var posLetter, valLetter, posAxis, valAxis;
    // calcdata item
    var di;
    // hover point item extended from pointData
    var pointData2;
    // loop indices
    var i, j;

    if(hoveron.indexOf('boxes') !== -1) {
        var t = cd[0].t;

        // closest mode: handicap box plots a little relative to others
        // adjust inbox w.r.t. to calculate box size
        var boxDelta = (hovermode === 'closest') ? 2.5 * t.bdPos : t.bdPos;

        if(trace.orientation === 'h') {
            dx = function(di) {
                return Fx.inbox(di.min - xval, di.max - xval);
            };
            dy = function(di) {
                var pos = di.pos + t.bPos - yval;
                return Fx.inbox(pos - boxDelta, pos + boxDelta);
            };
            posLetter = 'y';
            posAxis = ya;
            valLetter = 'x';
            valAxis = xa;
        } else {
            dx = function(di) {
                var pos = di.pos + t.bPos - xval;
                return Fx.inbox(pos - boxDelta, pos + boxDelta);
            };
            dy = function(di) {
                return Fx.inbox(di.min - yval, di.max - yval);
            };
            posLetter = 'x';
            posAxis = xa;
            valLetter = 'y';
            valAxis = ya;
        }

        distfn = Fx.getDistanceFunction(hovermode, dx, dy);
        Fx.getClosest(cd, distfn, pointData);

        // skip the rest (for this trace) if we didn't find a close point
        // and create the item(s) in closedata for this point
        if(pointData.index !== false) {
            di = cd[pointData.index];

            var lc = trace.line.color;
            var mc = marker.color;

            if(Color.opacity(lc) && trace.line.width) pointData.color = lc;
            else if(Color.opacity(mc) && trace.boxpoints) pointData.color = mc;
            else pointData.color = trace.fillcolor;

            pointData[posLetter + '0'] = posAxis.c2p(di.pos + t.bPos - t.bdPos, true);
            pointData[posLetter + '1'] = posAxis.c2p(di.pos + t.bPos + t.bdPos, true);

            Axes.tickText(posAxis, posAxis.c2l(di.pos), 'hover').text;
            pointData[posLetter + 'LabelVal'] = di.pos;

            // box plots: each "point" gets many labels
            var usedVals = {};
            var attrs = ['med', 'min', 'q1', 'q3', 'max'];

            if(trace.boxmean) attrs.push('mean');
            if(trace.boxpoints) [].push.apply(attrs, ['lf', 'uf']);

            for(i = 0; i < attrs.length; i++) {
                var attr = attrs[i];

                if(!(attr in di) || (di[attr] in usedVals)) continue;
                usedVals[di[attr]] = true;

                // copy out to a new object for each value to label
                var val = valAxis.c2p(di[attr], true);
                pointData2 = Lib.extendFlat({}, pointData);
                pointData2[valLetter + '0'] = pointData2[valLetter + '1'] = val;
                pointData2[valLetter + 'LabelVal'] = di[attr];
                pointData2.attr = attr;

                if(attr === 'mean' && ('sd' in di) && trace.boxmean === 'sd') {
                    pointData2[valLetter + 'err'] = di.sd;
                }
                // only keep name on the first item (median)
                pointData.name = '';

                closeData.push(pointData2);
            }
        }
    }

    if(hoveron.indexOf('points') !== -1) {
        var xPx = xa.c2p(xval);
        var yPx = ya.c2p(yval);

        // do not take jitter into consideration in compare hover modes
        var kx, ky;
        if(hovermode === 'closest') {
            kx = 'x';
            ky = 'y';
        } else {
            kx = 'xh';
            ky = 'yh';
        }

        dx = function(di) {
            var rad = Math.max(3, di.mrc || 0);
            return Math.max(Math.abs(xa.c2p(di[kx]) - xPx) - rad, 1 - 3 / rad);
        };
        dy = function(di) {
            var rad = Math.max(3, di.mrc || 0);
            return Math.max(Math.abs(ya.c2p(di[ky]) - yPx) - rad, 1 - 3 / rad);
        };
        distfn = Fx.getDistanceFunction(hovermode, dx, dy);

        for(i = 0; i < cd.length; i++) {
            di = cd[i];

            for(j = 0; j < (di.pts || []).length; j++) {
                var pt = di.pts[j];

                var newDistance = distfn(pt);
                if(newDistance <= pointData.distance) {
                    pointData.distance = newDistance;

                    var xc = xa.c2p(pt.x, true);
                    var yc = ya.c2p(pt.y, true);
                    var rad = pt.mrc || 1;

                    pointData2 = Lib.extendFlat({}, pointData, {
                        // corresponds to index in x/y input data array
                        index: pt.i,
                        color: marker.color,
                        x0: xc - rad,
                        x1: xc + rad,
                        xLabelVal: pt.x,
                        y0: yc - rad,
                        y1: yc + rad,
                        yLabelVal: pt.y
                    });

                    closeData.push(pointData2);
                }
            }
        }
    }

    return closeData;
};
