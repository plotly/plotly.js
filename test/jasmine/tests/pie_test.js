var d3 = require('d3');

var Plotly = require('@lib/index');

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var failTest = require('../assets/fail_test');

describe('Pies', function() {
    'use strict';

    var gd;

    beforeEach(function() { gd = createGraphDiv(); });

    afterEach(destroyGraphDiv);

    it('should separate colors and opacities', function(done) {
        Plotly.newPlot(gd, [{
            values: [1, 2, 3, 4, 5],
            type: 'pie',
            sort: false,
            marker: {
                line: {width: 3, color: 'rgba(100,100,100,0.7)'},
                colors: [
                    'rgba(0,0,0,0.2)',
                    'rgba(255,0,0,0.3)',
                    'rgba(0,255,0,0.4)',
                    'rgba(0,0,255,0.5)',
                    'rgba(255,255,0,0.6)'
                ]
            }
        }], {height: 300, width: 400}).then(function() {
            var colors = [
                'rgb(0,0,0)',
                'rgb(255,0,0)',
                'rgb(0,255,0)',
                'rgb(0,0,255)',
                'rgb(255,255,0)'
            ];
            var opacities = [0.2, 0.3, 0.4, 0.5, 0.6];

            function checkPath(d, i) {
                var path = d3.select(this);
                // strip spaces (ie 'rgb(0, 0, 0)') so we're not dependent on browser specifics
                expect(path.style('fill').replace(/\s/g, '')).toBe(colors[i]);
                expect(path.style('fill-opacity')).toBe(String(opacities[i]));
                expect(path.style('stroke').replace(/\s/g, '')).toBe('rgb(100,100,100)');
                expect(path.style('stroke-opacity')).toBe('0.7');
            }
            var slices = d3.selectAll('.slice path');
            slices.each(checkPath);
            expect(slices.size()).toBe(5);

            var legendEntries = d3.selectAll('.legendpoints path');
            legendEntries.each(checkPath);
            expect(legendEntries.size()).toBe(5);
        })
        .catch(failTest)
        .then(done);
    });
});
