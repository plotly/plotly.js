/**
* Copyright 2012-2017, Plotly, Inc.
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
        annotationAxes[ann.xref] = true;
        annotationAxes[ann.yref] = true;
    });

    var autorangedAnnos = Axes.list(gd).filter(function(ax) {
        return ax.autorange && annotationAxes[ax._id];
    });
    if(!autorangedAnnos.length) return;

    return Lib.syncOrAsync([
        draw,
        annAutorange
    ], gd);
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
            headSize = 3 * ann.arrowsize * ann.arrowwidth || 0;

        if(xa && xa.autorange) {
            if(ann.axref === ann.xref) {
                // expand for the arrowhead (padded by arrowhead)
                Axes.expand(xa, [xa.r2c(ann.x)], {
                    ppadplus: headSize,
                    ppadminus: headSize
                });
                // again for the textbox (padded by textbox)
                Axes.expand(xa, [xa.r2c(ann.ax)], {
                    ppadplus: ann._xpadplus,
                    ppadminus: ann._xpadminus
                });
            }
            else {
                Axes.expand(xa, [xa.r2c(ann.x)], {
                    ppadplus: Math.max(ann._xpadplus, headSize),
                    ppadminus: Math.max(ann._xpadminus, headSize)
                });
            }
        }

        if(ya && ya.autorange) {
            if(ann.ayref === ann.yref) {
                Axes.expand(ya, [ya.r2c(ann.y)], {
                    ppadplus: headSize,
                    ppadminus: headSize
                });
                Axes.expand(ya, [ya.r2c(ann.ay)], {
                    ppadplus: ann._ypadplus,
                    ppadminus: ann._ypadminus
                });
            }
            else {
                Axes.expand(ya, [ya.r2c(ann.y)], {
                    ppadplus: Math.max(ann._ypadplus, headSize),
                    ppadminus: Math.max(ann._ypadminus, headSize)
                });
            }
        }
    });
}
