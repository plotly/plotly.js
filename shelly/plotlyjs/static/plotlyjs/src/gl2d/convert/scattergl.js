'use strict';

function LineWithMarkers(scene, uid) {

}

var proto = LineWithMarkers.prototype;

function createLineWithMarkers(scene, data) {
    var plot = new LineWithMarkers(scene, data.uid);
    plot.update(data);
    return plot;
}

module.exports = createLineWithMarkers;
