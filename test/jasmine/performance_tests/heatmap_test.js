var createGraphDiv = require('../assets/create_graph_div');
var delay = require('../assets/delay');
var d3SelectAll = require('../../strict-d3').selectAll;
var Plotly = require('../../../lib/core');
var PlotlyHeatmap = require('../../../lib/heatmap');
var downloadCSV = require('./assets/post_process').downloadCSV;
var nSamples = require('./assets/constants').nSamples;

Plotly.register(PlotlyHeatmap);

var gd = createGraphDiv();

const samples = Array.from({ length: nSamples }, (_, i) => i);
const nTimes = samples.length - 1;

var tests = [{
    nx: 50, ny: 20
}, {
    nx: 100, ny: 40
}, {
    nx: 200, ny: 80
}, {
    nx: 400, ny: 160
}, {
    nx: 800, ny: 320
}, {
    nx: 1600, ny: 640
}, {
    nx: 3200, ny: 1280
}];

tests.forEach(function(spec, index) {
    describe('Performance test heatmap | size:' + spec.nx + 'X' + spec.ny, function() {
        'use strict';

        var A = spec.nx;
        var B = spec.ny;
        spec.n = A * B;

        var x = Uint16Array.from({ length: A }, (_, i) => i);
        var y = Uint16Array.from({ length: B }, (_, i) => i);
        var z = [];
        for(var k = 0; k < B ; k++) {
            z[k] = Float64Array.from({ length: A }, (_, i) => k * Math.cos(Math.sqrt(i)));
        }

        var mock = {
            data: [{
                type: 'heatmap',
                x: x,
                y: y,
                z: z
            }],
            layout: {
                width: 900,
                height: 400
            }
        };

        var startTime, endTime;

        beforeEach(function(done) {
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
            it('should graph heatmap traces | turn: ' + t, function() {
                var delta = endTime - startTime;

                if(t === 0) {
                    tests[index].raw = [];
                }
                tests[index].raw[t] = delta;

                var nodes = d3SelectAll('g.heatmaplayer');
                expect(nodes.size()).toEqual(1);

                if(t === nTimes && index === tests.length - 1) {
                    downloadCSV('heatmap', tests);
                }
            });
        });
    });
});
