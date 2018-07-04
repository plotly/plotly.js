/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

// TODO Remove eventually
function selectPoints(searchInfo, polygon) {
    var cd = searchInfo.cd;
    var xa = searchInfo.xaxis;
    var ya = searchInfo.yaxis;
    var selection = [];
    var i, j;

    if(polygon === false) {
        for(i = 0; i < cd.length; i++) {
            for(j = 0; j < (cd[i].pts || []).length; j++) {
                // clear selection
                cd[i].pts[j].selected = 0;
            }
        }
    } else {
        for(i = 0; i < cd.length; i++) {
            for(j = 0; j < (cd[i].pts || []).length; j++) {
                var pt = cd[i].pts[j];
                var x = xa.c2p(pt.x);
                var y = ya.c2p(pt.y);

                if(polygon.contains([x, y])) {
                    selection.push({
                        pointNumber: pt.i,
                        x: xa.c2d(pt.x),
                        y: ya.c2d(pt.y)
                    });
                    pt.selected = 1;
                } else {
                    pt.selected = 0;
                }
            }
        }
    }

    return selection;
}

exports.getPointsIn = function(searchInfo, polygon) {
    var pointsIn = [];
    var cd = searchInfo.cd;
    var xa = searchInfo.xaxis;
    var ya = searchInfo.yaxis;
    var i;
    var j;
    var pt;
    var x;
    var y;

    for(i = 0; i < cd.length; i++) {
        for(j = 0; j < (cd[i].pts || []).length; j++) {
            pt = cd[i].pts[j];
            x = xa.c2p(pt.x);
            y = ya.c2p(pt.y);

            if(polygon.contains([x, y])) {
                pointsIn.push(pt.i);
            }
        }
    }

    return pointsIn;
};

exports.toggleSelected = function(searchInfo, selected, pointIds) {
    var selection = [];
    var modifyAll = !Array.isArray(pointIds);
    var cd = searchInfo.cd;
    var xa = searchInfo.xaxis;
    var ya = searchInfo.yaxis;
    var pointId;
    var pt;
    var ptPos;
    var i;
    var j;

    if(!modifyAll) {
        // console.log(pointIds);
    }

    // Mutate state
    // if(!modifyAll) {
    //     for(i = 0; i < pointIds.length; i++) {
    //         pointId = pointIds[i];
    //         for(j = 0; j < cd.length; j++) {
    //             ptPos = cd[j].pts.indexOf(pointId);
    //             if(ptPos > -1) {
    //                 pt = cd[j].pts[ptPos];
    //                 pt.selected = selected ? 1 : 0;
    //             }
    //         }
    //     }
    // }


    for(i = 0; i < cd.length; i++) {
        for(j = 0; j < (cd[i].pts || []).length; j++) {
            pt = cd[i].pts[j];

            if(modifyAll) pt.selected = selected ? 1 : 0;
            else {
                if(pointIds.indexOf(pt.i) > -1) {
                    pt.selected = selected ? 1 : 0;
                }
            }

            if(pt.selected) {
                selection.push({
                    pointNumber: pt.i,
                    x: xa.c2d(pt.x),
                    y: ya.c2d(pt.y)
                });
            }
        }
    }

    return selection;
};
