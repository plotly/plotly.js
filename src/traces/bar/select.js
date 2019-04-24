/**
* Copyright 2012-2019, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

module.exports = function selectPoints(searchInfo, selectionTester) {
    var cd = searchInfo.cd;
    var xa = searchInfo.xaxis;
    var ya = searchInfo.yaxis;
    var trace = cd[0].trace;
    var selection = [];
    var i;

    if(selectionTester === false) {
        // clear selection
        for(i = 0; i < cd.length; i++) {
            cd[i].selected = 0;
        }
    } else {
        var getCentroid = trace.orientation === 'h' ?
            function(d) { return [xa.c2p(d.s1, true), (ya.c2p(d.p0, true) + ya.c2p(d.p1, true)) / 2]; } :
            function(d) { return [(xa.c2p(d.p0, true) + xa.c2p(d.p1, true)) / 2, ya.c2p(d.s1, true)]; };

        for(i = 0; i < cd.length; i++) {
            var di = cd[i];
            var ct = 'ct' in di ? di.ct : getCentroid(di);

            if(selectionTester.contains(ct, false, i, searchInfo)) {
                selection.push({
                    pointNumber: i,
                    x: xa.c2d(di.x),
                    y: ya.c2d(di.y)
                });
                di.selected = 1;
            } else {
                di.selected = 0;
            }
        }
    }

    return selection;
};
