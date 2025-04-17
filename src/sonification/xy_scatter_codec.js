'use strict';
// This codec serves for one x axis and one y axis

function test(trace) {
    if (!trace || !trace.type || trace.type !== 'scatter') return null;
    if ((trace.y === undefined || trace.y.length === 0) && (trace.x === undefined || trace.x.length === 0)) return null;
    return {type: 'scatter', name: trace.name};
}
exports.test = test;

function process(trace) {
    var traceData = [];
    var x = trace.x && trace.x.length !== 0 ? trace.x : [];
    var y = trace.y && trace.y.length !== 0 ? trace.y : [];

    for(var p = 0; p < Math.max(x.length, y.length); p++) {
        traceData.push({
            x: x[p] ? x[p] : p,
            y: y[p] ? y[p] : p,
            label: trace.text[p] ? trace.text[p] : p
        });
    }
    return traceData;
}
exports.process = process;
