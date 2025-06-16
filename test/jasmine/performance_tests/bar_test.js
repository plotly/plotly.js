var createGraphDiv = require('../assets/create_graph_div');
var delay = require('../assets/delay');
var d3SelectAll = require('../../strict-d3').selectAll;
var Plotly = require('../../../lib/core');
var PlotlyBar = require('../../../lib/bar');

var gd = createGraphDiv();

[{
    n: 1000, averageCap: 75
}, {
    n: 2000, averageCap: 100
}, {
    n: 4000, averageCap: 150
}, {
    n: 8000, averageCap: 300
}, {
    n: 16000, averageCap: 600
}, {
    n: 32000, averageCap: 1200
}, {
    n: 64000, averageCap: 2400
}].forEach(function(spec) {
    describe('Bundle with bar | size:' + spec.n, function() {
        'use strict';

        Plotly.register(PlotlyBar);

        const samples = Array.from({ length: 5 }, (_, i) => i);
        const nTimes = samples.length - 1;

        var y = Float64Array.from({ length: spec.n }, (_, i) => i * Math.cos(Math.sqrt(i)));

        var mock = {
            data: [{
                type: 'bar',
                y: y
            }],
            layout: {
                width: 1200,
                height: 400
            }
        };

        var startTime;

        beforeEach(function(done) {
            startTime = Date.now();

            Plotly.newPlot(gd, mock).then(done);
        });

        afterEach(function(done) {
            delay(100)().then(done);
        });

        var maxDelta = 0;
        var aveDelta = 0;

        samples.forEach(function(t) {
            it('should graph bar traces | turn: ' + t, function() {
                var delta = Date.now() - startTime;

                if(t === 0) {
                    console.log('________________________________');
                    console.log('number of points in bar: ' + spec.n);
                    console.log('expected average (cap): ' + spec.averageCap + ' ms');
                }

                if(t > 0) { // we skip the first run which is slow
                    maxDelta = Math.max(maxDelta, delta);
                    aveDelta += delta / nTimes;
                }

                console.log('turn: ' + t + ' | ' + delta + ' ms');

                if(t === nTimes) {
                    console.log('max: ' + maxDelta);
                    console.log('ave: ' + aveDelta);

                    expect(aveDelta).toBeLessThan(spec.averageCap);
                }

                var nodes = d3SelectAll('g.trace.bars');
                expect(nodes.size()).toEqual(1);
            });
        });
    });
});
