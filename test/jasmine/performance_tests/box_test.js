var createGraphDiv = require('../assets/create_graph_div');
var delay = require('../assets/delay');
var d3SelectAll = require('../../strict-d3').selectAll;
var Plotly = require('../../../lib/core');
var PlotlyBox = require('../../../lib/box');
var writeRawDataAsCSV = require('./assets/post_process').writeRawDataAsCSV;

var gd = createGraphDiv();

var tests = [{
    n: 1000
}, {
    n: 2000
}, {
    n: 4000
}, {
    n: 8000
}, {
    n: 16000
}, {
    n: 32000
}, {
    n: 64000
}];

tests.forEach(function(spec, index) {
    describe('Performance test box | size:' + spec.n, function() {
        'use strict';

        Plotly.register(PlotlyBox);

        const samples = Array.from({ length: 9 }, (_, i) => i);
        const nTimes = samples.length - 1;

        var y = Float64Array.from({ length: spec.n }, (_, i) => i * Math.cos(Math.sqrt(i)));

        var mock = {
            data: [{
                type: 'box',
                boxpoints: 'all',
                y: y
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
            it('should graph box traces | turn: ' + t, function() {
                var delta = endTime - startTime;

                if(t === 0) {
                    tests[index].raw = [];
                }
                tests[index].raw[t] = delta;

                var nodes = d3SelectAll('g.trace.boxes');
                expect(nodes.size()).toEqual(1);

                if(t === nTimes && index === tests.length - 1) {
                    writeRawDataAsCSV('box', tests);
                }
            });
        });
    });
});
