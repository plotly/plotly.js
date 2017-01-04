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
    fullLayout.annotations.forEach(function(ann) {
        var xa = Axes.getFromId(gd, ann.xref),
            ya = Axes.getFromId(gd, ann.yref);

        if(!(xa || ya)) return;

        var halfWidth = (ann._xsize || 0) / 2,
            xShift = ann._xshift || 0,
            halfHeight = (ann._ysize || 0) / 2,
            yShift = ann._yshift || 0,
            leftSize = halfWidth - xShift,
            rightSize = halfWidth + xShift,
            topSize = halfHeight - yShift,
            bottomSize = halfHeight + yShift;

        if(ann.showarrow) {
            var headSize = 3 * ann.arrowsize * ann.arrowwidth;
            leftSize = Math.max(leftSize, headSize);
            rightSize = Math.max(rightSize, headSize);
            topSize = Math.max(topSize, headSize);
            bottomSize = Math.max(bottomSize, headSize);
        }

        if(xa && xa.autorange) {
            Axes.expand(xa, [xa.r2c(ann.x)], {
                ppadplus: rightSize,
                ppadminus: leftSize
            });
        }

        if(ya && ya.autorange) {
            Axes.expand(ya, [ya.r2c(ann.y)], {
                ppadplus: bottomSize,
                ppadminus: topSize
            });
        }
    });
}
