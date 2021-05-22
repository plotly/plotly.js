'use strict';

var subTypes = require('../scatter/subtypes');
var styleTextSelection = require('./edit_style').styleTextSelection;

module.exports = function select(searchInfo, selectionTester) {
    var cd = searchInfo.cd;
    var xa = searchInfo.xaxis;
    var ya = searchInfo.yaxis;
    var selection = [];
    var trace = cd[0].trace;
    var stash = cd[0].t;
    var len = trace._length;
    var x = stash.x;
    var y = stash.y;
    var scene = stash._scene;
    var index = stash.index;

    if(!scene) return selection;

    var hasText = subTypes.hasText(trace);
    var hasMarkers = subTypes.hasMarkers(trace);
    var hasOnlyLines = !hasMarkers && !hasText;

    if(trace.visible !== true || hasOnlyLines) return selection;

    var els = [];
    var unels = [];

    // degenerate polygon does not enable selection
    // filter out points by visible scatter ones
    if(selectionTester !== false && !selectionTester.degenerate) {
        for(var i = 0; i < len; i++) {
            if(selectionTester.contains([stash.xpx[i], stash.ypx[i]], false, i, searchInfo)) {
                els.push(i);
                selection.push({
                    pointNumber: i,
                    x: xa.c2d(x[i]),
                    y: ya.c2d(y[i])
                });
            } else {
                unels.push(i);
            }
        }
    }

    if(hasMarkers) {
        var scatter2d = scene.scatter2d;

        if(!els.length && !unels.length) {
            // reset to base styles when clearing
            var baseOpts = new Array(scene.count);
            baseOpts[index] = scene.markerOptions[index];
            scatter2d.update.apply(scatter2d, baseOpts);
        } else if(!scene.selectBatch[index].length && !scene.unselectBatch[index].length) {
            // set unselected styles on 'context' canvas (if not done already)
            var unselOpts = new Array(scene.count);
            unselOpts[index] = scene.markerUnselectedOptions[index];
            scatter2d.update.apply(scatter2d, unselOpts);
        }
    }

    scene.selectBatch[index] = els;
    scene.unselectBatch[index] = unels;

    if(hasText) {
        styleTextSelection(cd);
    }

    return selection;
};
