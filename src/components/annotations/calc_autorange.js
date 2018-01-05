/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Lib = require('../../lib');
var Axes = require('../../plots/cartesian/axes');

var draw = require('./draw').draw;


module.exports = function calcAutorange(gd) {
    var fullLayout = gd._fullLayout,
        annotationList = Lib.filterVisible(fullLayout.annotations);

    if(!annotationList.length || !gd._fullData.length) return;

    var annotationAxes = {};
    annotationList.forEach(function(ann) {
        annotationAxes[ann.xref] = 1;
        annotationAxes[ann.yref] = 1;
    });

    for(var axId in annotationAxes) {
        var ax = Axes.getFromId(gd, axId);
        if(ax && ax.autorange) {
            return Lib.syncOrAsync([
                draw,
                annAutorange
            ], gd);
        }
    }
};

function annAutorange(gd) {
    var fullLayout = gd._fullLayout;

    // find the bounding boxes for each of these annotations'
    // relative to their anchor points
    // use the arrow and the text bg rectangle,
    // as the whole anno may include hidden text in its bbox
    Lib.filterVisible(fullLayout.annotations).forEach(function(ann) {
        var xa = Axes.getFromId(gd, ann.xref),
            ya = Axes.getFromId(gd, ann.yref),
            headSize = 3 * ann.arrowsize * ann.arrowwidth || 0,
            startHeadSize = 3 * ann.startarrowsize * ann.arrowwidth || 0;

        var headPlus, headMinus, startHeadPlus, startHeadMinus;

        if(xa && xa.autorange) {
            headPlus = headSize + ann.xshift;
            headMinus = headSize - ann.xshift;
            startHeadPlus = startHeadSize + ann.xshift;
            startHeadMinus = startHeadSize - ann.xshift;

            if(ann.axref === ann.xref) {
                // expand for the arrowhead (padded by arrowhead)
                Axes.expand(xa, [xa.r2c(ann.x)], {
                    ppadplus: headPlus,
                    ppadminus: headMinus
                });
                // again for the textbox (padded by textbox)
                Axes.expand(xa, [xa.r2c(ann.ax)], {
                    ppadplus: Math.max(ann._xpadplus, startHeadPlus),
                    ppadminus: Math.max(ann._xpadminus, startHeadMinus)
                });
            }
            else {
                startHeadPlus = ann.ax ? startHeadPlus + ann.ax : startHeadPlus;
                startHeadMinus = ann.ax ? startHeadMinus - ann.ax : startHeadMinus;
                Axes.expand(xa, [xa.r2c(ann.x)], {
                    ppadplus: Math.max(ann._xpadplus, headPlus, startHeadPlus),
                    ppadminus: Math.max(ann._xpadminus, headMinus, startHeadMinus)
                });
            }
        }

        if(ya && ya.autorange) {
            headPlus = headSize - ann.yshift;
            headMinus = headSize + ann.yshift;
            startHeadPlus = startHeadSize - ann.yshift;
            startHeadMinus = startHeadSize + ann.yshift;

            if(ann.ayref === ann.yref) {
                Axes.expand(ya, [ya.r2c(ann.y)], {
                    ppadplus: headPlus,
                    ppadminus: headMinus
                });
                Axes.expand(ya, [ya.r2c(ann.ay)], {
                    ppadplus: Math.max(ann._ypadplus, startHeadPlus),
                    ppadminus: Math.max(ann._ypadminus, startHeadMinus)
                });
            }
            else {
                startHeadPlus = ann.ay ? startHeadPlus + ann.ay : startHeadPlus;
                startHeadMinus = ann.ay ? startHeadMinus - ann.ay : startHeadMinus;
                Axes.expand(ya, [ya.r2c(ann.y)], {
                    ppadplus: Math.max(ann._ypadplus, headPlus, startHeadPlus),
                    ppadminus: Math.max(ann._ypadminus, headMinus, startHeadMinus)
                });
            }
        }
    });
}
