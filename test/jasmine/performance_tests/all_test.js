var createGraphDiv = require('../assets/create_graph_div');
var delay = require('../assets/delay');
var d3SelectAll = require('../../strict-d3').selectAll;
var Plotly = require('../../../lib/index');
var downloadCSV = require('./assets/post_process').downloadCSV;
var tests = require('./assets/test_cases').testCases;
var nSamples = require('./assets/constants').nSamples;
var MAX_RENDERING_TIME = 4000;

var gd = createGraphDiv();

const samples = Array.from({ length: nSamples }, (_, i) => i);


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
            boxpoints: spec.mode === 'all_points' ? 'all' : false,
            y: y.slice(k * nPerTrace, (k + 1) * nPerTrace),
            x: Array.from({ length: nPerTrace }, (_, i) => k)
        };

        if(spec.traceType === 'box') {
            trace.boxpoints = spec.mode === 'all_points' ? 'all' : false;
        }

        if(spec.traceType === 'violin') {
            trace.points = spec.mode === 'all_points' ? 'all' : false;
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

    var filename;

    afterAll(function(done) {
        downloadCSV(tests, filename);
        // delay for the download to be completed
        delay(1000)().then(done)
    });

    tests.forEach(function(spec, index) {
        var testIt = true;

        var testCase = __karma__.config.testCase;

        filename = '';

        if(testCase) {
            if(testCase.tracesType) {
                filename += testCase.tracesType;
                if(testCase.tracesType !== spec.traceType) testIt = false;
            }

            if(testCase.tracesMode && testCase.tracesMode !== 'undefined') {
                filename += '_' + testCase.tracesMode;
                if(testCase.tracesMode !== spec.mode) testIt = false;
            }

            if(testCase.tracesPoints) {
                filename += '_' + testCase.tracesPoints;
                if(testCase.tracesPoints !== spec.n) testIt = false;
            }

            if(testCase.tracesCount) {
                filename += '_' + testCase.tracesCount;
                if(testCase.tracesCount !== spec.nTraces) testIt = false;
            }
        }

        if(testIt) {
            samples.forEach(function(t) {
                it(
                    spec.nTraces + ' ' + spec.traceType +
                    (spec.mode ? ' | mode: ' + spec.mode : '') +
                    ' | size:' + spec.n + ' | turn: ' + t, function(done) {
                    if(t === 0) {
                        tests[index].raw = [];
                    }

                    var timerID;
                    var requestID1, requestID2;

                    var startTime, endTime;

                    requestID1 = requestAnimationFrame(function() {
                        // Wait for actual rendering instead of promise
                        requestID2 = requestAnimationFrame(function() {
                            endTime = performance.now();

                            var delta = endTime - startTime;

                            if(tests[index].raw[t] === undefined) {
                                tests[index].raw[t] = delta;
                            }

                            if(spec.selector) {
                                var nodes = d3SelectAll(spec.selector);
                                expect(nodes.size()).toEqual(spec.nTraces);
                            }

                            clearTimeout(timerID);

                            done();
                        });
                    });

                    var mock = generateMock(spec);

                    timerID = setTimeout(() => {
                        endTime = performance.now();

                        tests[index].raw[t] = 'none';

                        cancelAnimationFrame(requestID2);
                        cancelAnimationFrame(requestID1);

                        done.fail('Takes too much time: ' + (endTime - startTime));
                    }, MAX_RENDERING_TIME);

                    startTime = performance.now();

                    Plotly.newPlot(gd, mock);
                });
            });
        }
    });
});
