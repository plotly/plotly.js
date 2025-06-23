var createGraphDiv = require('../assets/create_graph_div');
var delay = require('../assets/delay');
var d3SelectAll = require('../../strict-d3').selectAll;
var Plotly = require('../../../lib/core');
var PlotlyImage = require('../../../lib/image');
var downloadCSV = require('./assets/post_process').downloadCSV;
var nSamples = require('./assets/constants').nSamples;

Plotly.register(PlotlyImage);

var gd = createGraphDiv();

const samples = Array.from({ length: nSamples }, (_, i) => i);
const nTimes = samples.length - 1;

var tests = [];
for(let m of [10, 20, 40, 80, 160, 320, 640]) {
    let nx = 5 * m;
    let ny = 2 * m;
    tests.push({
        nx: nx,
        ny: ny,
        n: nx * ny,
    });
}

tests.forEach(function(spec, index) {
    describe('Performance test image | size:' + spec.nx + 'X' + spec.ny, function() {
        'use strict';

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

        var mock = {
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
            it('should graph image traces | turn: ' + t, function() {
                var delta = endTime - startTime;

                if(t === 0) {
                    tests[index].raw = [];
                }
                tests[index].raw[t] = delta;

                var nodes = d3SelectAll('g.imagelayer.mlayer');
                expect(nodes.size()).toEqual(1);

                if(t === nTimes && index === tests.length - 1) {
                    downloadCSV('image', tests);
                }
            });
        });
    });
});
