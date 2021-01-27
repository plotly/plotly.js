'use strict';

module.exports = function selectPoints(searchInfo, selectionTester) {
    var cd = searchInfo.cd;
    var xa = searchInfo.xaxis;
    var ya = searchInfo.yaxis;
    var selection = [];

    var i, di, ct, x, y;

    if(selectionTester === false) {
        for(i = 0; i < cd.length; i++) {
            cd[i].selected = 0;
        }
    } else {
        for(i = 0; i < cd.length; i++) {
            di = cd[i];
            ct = di.ct;

            if(!ct) continue;

            x = xa.c2p(ct);
            y = ya.c2p(ct);

            if(selectionTester.contains([x, y], null, i, searchInfo)) {
                selection.push({
                    pointNumber: i,
                    lon: ct[0],
                    lat: ct[1]
                });
                di.selected = 1;
            } else {
                di.selected = 0;
            }
        }
    }

    return selection;
};
