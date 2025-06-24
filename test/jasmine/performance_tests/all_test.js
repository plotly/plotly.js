var createGraphDiv = require('../assets/create_graph_div');
var delay = require('../assets/delay');
var d3SelectAll = require('../../strict-d3').selectAll;
var Plotly = require('../../../lib/index');
var downloadCSV = require('./assets/post_process').downloadCSV;
var nSamples = require('./assets/constants').nSamples;

var gd = createGraphDiv();

const samples = Array.from({ length: nSamples }, (_, i) => i);

var tests = [];

for(let traceType of ['image', 'heatmap', 'contour']) {
    for(let m of [10, 20, 40, 80, 160, 320, 640]) {
        let nx = 5 * m;
        let ny = 2 * m;
        tests.push({
            nx: nx,
            ny: ny,
            n: nx * ny,
            nTraces: 1,
            traceType: traceType,
            selector: traceType === 'image' ? 'g.imagelayer.mlayer' :
                'g.' + traceType + 'layer'
        });
    }
}

for(let traceType of ['box', 'violin']) {
    for(let mode of ['no points', 'all points']) {
        for(let nTraces of [1, 10, 100]) {
            for(let n of [1000, 2000, 4000, 8000, 16000, 32000]) {
                tests.push({
                    n:n,
                    nTraces: nTraces,
                    traceType: traceType,
                    mode: mode,
                    selector: (
                        traceType === 'box' ? 'g.trace.boxes' :
                        traceType === 'violin' ? 'g.trace.violins' :
                        undefined
                    )
                });
            }
        }
    }
}

for(let traceType of ['scatter', 'scattergl', 'scattergeo']) {
    for(let mode of ['markers', 'lines', 'markers+lines']) {
        for(let nTraces of [1, 10, 100]) {
            for(let n of [1000, 2000, 4000, 8000, 16000, 32000]) {
                tests.push({
                    n:n,
                    nTraces: nTraces,
                    traceType: traceType,
                    mode: mode,
                    selector: (
                        traceType === 'scatter' ? 'g.trace.scatter' :
                        undefined
                    )
                });
            }
        }
    }
}

for(let traceType of ['bar', 'histogram']) {
    for(let mode of ['group', 'stack', 'overlay']) {
        for(let nTraces of [1, 10, 100]) {
            for(let n of [1000, 2000, 4000, 8000, 16000, 32000]) {
                tests.push({
                    n:n,
                    nTraces: nTraces,
                    traceType: traceType,
                    mode: mode,
                    selector: 'g.trace.bars'
                });
            }
        }
    }
}

function generateMock(spec) {
    var type = spec.traceType;
    return (
        (type === 'image') ? makeImage(spec) :
        (type === 'heatmap' || type === 'contour') ? makeHeatmap(spec) :
        (type === 'box' || type === 'violin') ? makeBox(spec) :
        (type === 'bar' || type === 'histogram') ? makeBar(spec) :
        (type === 'scatter' || type === 'scattergl') ? makeScatter(spec) :
        (type === 'scattergeo') ? makeScatterGeo(spec) :
        {}
    );
}


function makeImage(spec) {
    var A = spec.nx;
    var B = spec.ny;

    var x = Array.from({ length: A }, (_, i) => i);
    var y = Array.from({ length: B }, (_, i) => i);
    var z = [];
    for(var k = 0; k < B ; k++) {
        z[k] = [];
        for(var i = 0; i < A ; i++) {
            z[k][i] = [
                Math.floor(127 * (1 + Math.cos(Math.sqrt(i)))),
                0,
                Math.floor(127 * (1 + Math.cos(Math.sqrt(k)))),
            ];
        }
    }

    return {
        data: [{
            type: 'image',
            x: x,
            y: y,
            z: z
        }],
        layout: {
            width: 900,
            height: 400
        }
    };
}

function makeHeatmap(spec) {
    var A = spec.nx;
    var B = spec.ny;

    var x = Array.from({ length: A }, (_, i) => i);
    var y = Array.from({ length: B }, (_, i) => i);
    var z = [];
    for(var k = 0; k < B ; k++) {
        z[k] = Array.from({ length: A }, (_, i) => k * Math.cos(Math.sqrt(i)));
    }

    return {
        data: [{
            type: spec.traceType,
            x: x,
            y: y,
            z: z
        }],
        layout: {
            width: 900,
            height: 400
        }
    };
}

function makeBox(spec) {
    var y = Array.from({ length: spec.n }, (_, i) => i * Math.cos(Math.sqrt(i)));
    var data = [];
    var nPerTrace = Math.floor(spec.n / spec.nTraces);
    for(var k = 0; k < spec.nTraces; k++) {
        var trace = {
            type: spec.traceType,
            boxpoints: spec.mode === 'all points' ? 'all' : false,
            y: y.slice(k * nPerTrace, (k + 1) * nPerTrace),
            x: Array.from({ length: nPerTrace }, (_, i) => k)
        };

        if(spec.traceType === 'box') {
            trace.boxpoints = spec.mode === 'all points' ? 'all' : false;
        }

        if(spec.traceType === 'violin') {
            trace.points = spec.mode === 'all points' ? 'all' : false;
        }

        data.push(trace);
    }

    return {
        data: data,
        layout: {
            showlegend: false,
            width: 900,
            height: 400
        }
    };
}

function makeBar(spec) {
    var z = Array.from({ length: spec.n }, (_, i) => i * Math.cos(Math.sqrt(i)));
    var data = [];
    var nPerTrace = Math.floor(spec.n / spec.nTraces);
    for(var k = 0; k < spec.nTraces; k++) {
        if(spec.traceType === 'bar') {
            data.push({
                type: 'bar',
                y: z.slice(k * nPerTrace, (k + 1) * nPerTrace),
                x: Array.from({ length: nPerTrace }, (_, i) => i)
            });
        } else if(spec.traceType === 'histogram') {
            data.push({
                type: 'histogram',
                x: z.slice(k * nPerTrace, (k + 1) * nPerTrace),
                y: Array.from({ length: nPerTrace }, (_, i) => i)
            });
        }
    }

    return {
        data: data,
        layout: {
            barmode: spec.mode,
            showlegend: false,
            width: 900,
            height: 400
        }
    };
}

function makeScatter(spec) {
    var y = Array.from({ length: spec.n }, (_, i) => i * Math.cos(Math.sqrt(i)));
    var data = [];
    var nPerTrace = Math.floor(spec.n / spec.nTraces);
    for(var k = 0; k < spec.nTraces; k++) {
        data.push({
            type: spec.traceType,
            mode: spec.mode,
            y: y.slice(k * nPerTrace, (k + 1) * nPerTrace),
            x: Array.from({ length: nPerTrace }, (_, i) => i + k * nPerTrace)
        });
    }

    return {
        data: data,
        layout: {
            showlegend: false,
            width: 900,
            height: 400
        }
    };
}

function makeScatterGeo(spec) {
    var y = Array.from({ length: spec.n }, (_, i) => 0.001 * i * Math.cos(Math.sqrt(i)));

    var data = [];
    var nPerTrace = Math.floor(spec.n / spec.nTraces);
    for(var k = 0; k < spec.nTraces; k++) {
        data.push({
            type: 'scattergeo',
            mode: spec.mode,
            lat: y.slice(k * nPerTrace, (k + 1) * nPerTrace),
            lon: Array.from({ length: nPerTrace }, (_, i) => -180 + 0.005 * (i + k * nPerTrace))
        });
    }

    return {
        data: data,
        layout: {
            showlegend: false,
            width: 900,
            height: 400
        }
    };
}


describe('Performance test various traces', function() {
    'use strict';

    afterAll(function(done) {
        downloadCSV(tests);
        // delay for the download to be completed
        delay(1000)().then(done)
    });

    tests.forEach(function(spec, index) {
        samples.forEach(function(t) {
            it('turn: ' + t, function(done) {
                var startTime, endTime;

                requestAnimationFrame(function() {
                    // Wait for actual rendering instead of promise
                    requestAnimationFrame(function() {
                        endTime = performance.now();

                        var delta = endTime - startTime;

                        if(t === 0) {
                            tests[index].raw = [];
                        }
                        tests[index].raw[t] = delta;

                        if(spec.selector) {
                            var nodes = d3SelectAll(spec.selector);
                            expect(nodes.size()).toEqual(spec.nTraces);
                        }

                        done();
                    });
                });

                var mock = generateMock(spec);

                startTime = performance.now();

                Plotly.newPlot(gd, mock);
            });
        });
    });
});
