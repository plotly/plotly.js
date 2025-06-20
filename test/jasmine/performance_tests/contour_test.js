var createGraphDiv = require('../assets/create_graph_div');
var delay = require('../assets/delay');
var d3SelectAll = require('../../strict-d3').selectAll;
var Plotly = require('../../../lib/core');
var PlotlyContour = require('../../../lib/contour');
var writeRawDataAsCSV = require('./assets/post_process').writeRawDataAsCSV;

var gd = createGraphDiv();

var tests = [{
    nx: 50, ny: 20, averageCap: 100
}, {
    nx: 100, ny: 40, averageCap: 125
}, {
    nx: 200, ny: 80, averageCap: 250
}, {
    nx: 400, ny: 160, averageCap: 500
}, {
    nx: 800, ny: 320, averageCap: 1000
}, {
    nx: 1600, ny: 640, averageCap: 2000
}, {
    nx: 3200, ny: 1280, averageCap: 4000
}];

tests.forEach(function(spec, index) {
    describe('Performance test contour | size:' + spec.nx + 'X' + spec.ny, function() {
        'use strict';

        Plotly.register(PlotlyContour);

        const samples = Array.from({ length: 9 }, (_, i) => i);
        const nTimes = samples.length - 1;

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
                type: 'contour',
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

        var maxDelta = 0;
        var aveDelta = 0;

        samples.forEach(function(t) {
            it('should graph contour traces | turn: ' + t, function() {
                var delta = endTime - startTime;

                if(t === 0) {
                    // console.log('________________________________');
                    // console.log('number of points: ' + spec.n);
                    // console.log('expected average (cap): ' + spec.averageCap + ' ms');

                    tests[index].raw = [];
                }
                tests[index].raw[t] = delta;

                if(t > 0) { // we skip the first run which is slow
                    maxDelta = Math.max(maxDelta, delta);
                    aveDelta += delta / nTimes;
                }

                // console.log('turn: ' + t + ' | ' + delta + ' ms');

                if(t === nTimes) {
                    tests[index].average = aveDelta;
                    tests[index].maximum = maxDelta;

                    // console.log('max: ' + maxDelta);
                    // console.log('ave: ' + aveDelta);

                    // expect(aveDelta).toBeLessThan(spec.averageCap);
                }

                var nodes = d3SelectAll('g.contourlayer');
                expect(nodes.size()).toEqual(1);

                if(t === nTimes && index === tests.length - 1) {
                    console.log(JSON.stringify(tests, null, 2));

                    writeRawDataAsCSV('contour', tests);
                }
            });
        });
    });
});
