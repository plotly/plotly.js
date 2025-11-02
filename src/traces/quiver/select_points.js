'use strict';

module.exports = function selectPoints(searchInfo, selectionTester) {
    var cd = searchInfo.cd;
    var xa = searchInfo.xaxis;
    var ya = searchInfo.yaxis;
    var selection = [];
    var trace = cd[0].trace;
    var i;
    var segment;
    var x;
    var y;

    if(selectionTester === false) { // clear selection
        for(i = 0; i < cd.length; i++) {
            cd[i].selected = 0;
        }
    } else {
        for(i = 0; i < cd.length; i++) {
            segment = cd[i];
            // Use the start point of the arrow for selection testing
            x = xa.c2p(segment[0].x);
            y = ya.c2p(segment[0].y);

            if((segment[0].i !== null) && selectionTester.contains([x, y], false, i, searchInfo)) {
                selection.push({
                    pointNumber: segment[0].i,
                    x: xa.c2d(segment[0].x),
                    y: ya.c2d(segment[0].y)
                });
                segment.selected = 1;
            } else {
                segment.selected = 0;
            }
        }
    }

    return selection;
};


