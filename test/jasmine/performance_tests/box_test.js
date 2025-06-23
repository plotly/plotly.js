var createGraphDiv = require('../assets/create_graph_div');
var delay = require('../assets/delay');
var d3SelectAll = require('../../strict-d3').selectAll;
var Plotly = require('../../../lib/core');
var PlotlyBox = require('../../../lib/box');
var downloadCSV = require('./assets/post_process').downloadCSV;
var nSamples = require('./assets/constants').nSamples;

Plotly.register(PlotlyBox);

var gd = createGraphDiv();

const samples = Array.from({ length: nSamples }, (_, i) => i);
const nTimes = samples.length - 1;

var tests = [{
    n: 1000, mode: 'no points', nTraces: 1
}, {
    n: 2000, mode: 'no points', nTraces: 1
}, {
    n: 4000, mode: 'no points', nTraces: 1
}, {
    n: 8000, mode: 'no points', nTraces: 1
}, {
    n: 16000, mode: 'no points', nTraces: 1
}, {
    n: 32000, mode: 'no points', nTraces: 1
}, {
    n: 64000, mode: 'no points', nTraces: 1
}, {
    n: 1000, mode: 'all points', nTraces: 1
}, {
    n: 2000, mode: 'all points', nTraces: 1
}, {
    n: 4000, mode: 'all points', nTraces: 1
}, {
    n: 8000, mode: 'all points', nTraces: 1
}, {
    n: 16000, mode: 'all points', nTraces: 1
}, {
    n: 32000, mode: 'all points', nTraces: 1
}, {
    n: 64000, mode: 'all points', nTraces: 1
}, {
    n: 1000, mode: 'no points', nTraces: 10
}, {
    n: 2000, mode: 'no points', nTraces: 10
}, {
    n: 4000, mode: 'no points', nTraces: 10
}, {
    n: 8000, mode: 'no points', nTraces: 10
}, {
    n: 16000, mode: 'no points', nTraces: 10
}, {
    n: 32000, mode: 'no points', nTraces: 10
}, {
    n: 64000, mode: 'no points', nTraces: 10
}, {
    n: 1000, mode: 'all points', nTraces: 10
}, {
    n: 2000, mode: 'all points', nTraces: 10
}, {
    n: 4000, mode: 'all points', nTraces: 10
}, {
    n: 8000, mode: 'all points', nTraces: 10
}, {
    n: 16000, mode: 'all points', nTraces: 10
}, {
    n: 32000, mode: 'all points', nTraces: 10
}, {
    n: 64000, mode: 'all points', nTraces: 10
}, {
    n: 1000, mode: 'no points', nTraces: 100
}, {
    n: 2000, mode: 'no points', nTraces: 100
}, {
    n: 4000, mode: 'no points', nTraces: 100
}, {
    n: 8000, mode: 'no points', nTraces: 100
}, {
    n: 16000, mode: 'no points', nTraces: 100
}, {
    n: 32000, mode: 'no points', nTraces: 100
}, {
    n: 64000, mode: 'no points', nTraces: 100
}, {
    n: 1000, mode: 'all points', nTraces: 100
}, {
    n: 2000, mode: 'all points', nTraces: 100
}, {
    n: 4000, mode: 'all points', nTraces: 100
}, {
    n: 8000, mode: 'all points', nTraces: 100
}, {
    n: 16000, mode: 'all points', nTraces: 100
}, {
    n: 32000, mode: 'all points', nTraces: 100
}, {
    n: 64000, mode: 'all points', nTraces: 100
}];

tests.forEach(function(spec, index) {
    describe('Performance test ' + spec.nTraces + ' box | size:' + spec.n + ' | mode: ' + spec.mode, function() {
        'use strict';

        var startTime, endTime;

        beforeEach(function(done) {
            var y = Array.from({ length: spec.n }, (_, i) => i * Math.cos(Math.sqrt(i)));
            var data = [];
            var nPerTrace = Math.floor(spec.n / spec.nTraces);
            for(var k = 0; k < spec.nTraces; k++) {
                data.push({
                    type: 'box',
                    boxpoints: spec.mode === 'all points' ? 'all' : false,
                    y: y.slice(k * nPerTrace, (k + 1) * nPerTrace),
                    x: Array.from({ length: nPerTrace }, (_, i) => k)
                });
            }

            var mock = {
                data: data,
                layout: {
                    showlegend: false,
                    width: 900,
                    height: 400
                }
            };

            startTime = performance.now();

            // Wait for actual rendering to complete
            requestAnimationFrame(function() {
                requestAnimationFrame(function() {
                    endTime = performance.now();
                    done();
                });
            });

            Plotly.newPlot(gd, mock);
        });

        afterEach(function(done) {
            delay(100)().then(done);
        });

        samples.forEach(function(t) {
            it('should graph box traces | turn: ' + t, function() {
                var delta = endTime - startTime;

                if(t === 0) {
                    tests[index].raw = [];
                }
                tests[index].raw[t] = delta;

                var nodes = d3SelectAll('g.trace.boxes');
                expect(nodes.size()).toEqual(spec.nTraces);

                if(t === nTimes && index === tests.length - 1) {
                    downloadCSV('box', tests);
                }
            });
        });
    });
});
