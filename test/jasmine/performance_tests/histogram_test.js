var createGraphDiv = require('../assets/create_graph_div');
var delay = require('../assets/delay');
var d3SelectAll = require('../../strict-d3').selectAll;
var Plotly = require('../../../lib/core');
var PlotlyHistogram = require('../../../lib/histogram');
var writeRawDataAsCSV = require('./assets/post_process').writeRawDataAsCSV;
var nSamples = require('./assets/constants').nSamples;

Plotly.register(PlotlyHistogram);

var gd = createGraphDiv();

const samples = Array.from({ length: nSamples }, (_, i) => i);
const nTimes = samples.length - 1;

var tests = [{
    n: 1000, mode: 'group', nTraces: 1
}, {
    n: 2000, mode: 'group', nTraces: 1
}, {
    n: 4000, mode: 'group', nTraces: 1
}, {
    n: 8000, mode: 'group', nTraces: 1
}, {
    n: 16000, mode: 'group', nTraces: 1
}, {
    n: 32000, mode: 'group', nTraces: 1
}, {
    n: 64000, mode: 'group', nTraces: 1
}, {
    n: 1000, mode: 'stack', nTraces: 1
}, {
    n: 2000, mode: 'stack', nTraces: 1
}, {
    n: 4000, mode: 'stack', nTraces: 1
}, {
    n: 8000, mode: 'stack', nTraces: 1
}, {
    n: 16000, mode: 'stack', nTraces: 1
}, {
    n: 32000, mode: 'stack', nTraces: 1
}, {
    n: 64000, mode: 'stack', nTraces: 1
}, {
    n: 1000, mode: 'group', nTraces: 10
}, {
    n: 2000, mode: 'group', nTraces: 10
}, {
    n: 4000, mode: 'group', nTraces: 10
}, {
    n: 8000, mode: 'group', nTraces: 10
}, {
    n: 16000, mode: 'group', nTraces: 10
}, {
    n: 32000, mode: 'group', nTraces: 10
}, {
    n: 64000, mode: 'group', nTraces: 10
}, {
    n: 1000, mode: 'stack', nTraces: 10
}, {
    n: 2000, mode: 'stack', nTraces: 10
}, {
    n: 4000, mode: 'stack', nTraces: 10
}, {
    n: 8000, mode: 'stack', nTraces: 10
}, {
    n: 16000, mode: 'stack', nTraces: 10
}, {
    n: 32000, mode: 'stack', nTraces: 10
}, {
    n: 64000, mode: 'stack', nTraces: 10
}, {
    n: 1000, mode: 'group', nTraces: 100
}, {
    n: 2000, mode: 'group', nTraces: 100
}, {
    n: 4000, mode: 'group', nTraces: 100
}, {
    n: 8000, mode: 'group', nTraces: 100
}, {
    n: 16000, mode: 'group', nTraces: 100
}, {
    n: 32000, mode: 'group', nTraces: 100
}, {
    n: 64000, mode: 'group', nTraces: 100
}, {
    n: 1000, mode: 'stack', nTraces: 100
}, {
    n: 2000, mode: 'stack', nTraces: 100
}, {
    n: 4000, mode: 'stack', nTraces: 100
}, {
    n: 8000, mode: 'stack', nTraces: 100
}, {
    n: 16000, mode: 'stack', nTraces: 100
}, {
    n: 32000, mode: 'stack', nTraces: 100
}, {
    n: 64000, mode: 'stack', nTraces: 100
}];

tests.forEach(function(spec, index) {
    describe('Performance test ' + spec.nTraces + 'histogram | size:' + spec.n + ' | mode: ' + spec.mode, function() {
        'use strict';

        var startTime, endTime;

        beforeEach(function(done) {
            var z = Array.from({ length: spec.n }, (_, i) => i * Math.cos(Math.sqrt(i)));
            var data = [];
            var nPerTrace = Math.floor(spec.n / spec.nTraces);
            for(var k = 0; k < spec.nTraces; k++) {
                data.push({
                    type: 'histogram',
                    x: z.slice(k * nPerTrace, (k + 1) * nPerTrace),
                    y: Array.from({ length: nPerTrace }, (_, i) => i)
                });
            }

            var mock = {
                data: data,
                layout: {
                    barmode: spec.mode,
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
            it('should graph histogram traces | turn: ' + t, function() {
                var delta = endTime - startTime;

                if(t === 0) {
                    tests[index].raw = [];
                }
                tests[index].raw[t] = delta;

                var nodes = d3SelectAll('g.trace.bars');
                expect(nodes.size()).toEqual(spec.nTraces);

                if(t === nTimes && index === tests.length - 1) {
                    writeRawDataAsCSV('histogram', tests);
                }
            });
        });
    });
});
