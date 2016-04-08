var Plotly = require('@lib');
var Lib = require('@src/lib');
var d3 = require('d3');
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');


describe('ternary plots', function() {
    'use strict';

    afterEach(destroyGraphDiv);

    describe('with scatterternary trace(s)', function() {
        var mock = require('@mocks/ternary_simple.json');
        var gd;

        beforeEach(function(done) {
            gd = createGraphDiv();

            var mockCopy = Lib.extendDeep({}, mock);

            Plotly.plot(gd, mockCopy.data, mockCopy.layout).then(done);
        });

        it('should be able to toggle trace visibility', function(done) {
            expect(countTraces('scatter')).toEqual(1);

            Plotly.restyle(gd, 'visible', false).then(function() {
                expect(countTraces('scatter')).toEqual(0);

                return Plotly.restyle(gd, 'visible', true);
            }).then(function() {
                expect(countTraces('scatter')).toEqual(1);

                return Plotly.restyle(gd, 'visible', 'legendonly');
            }).then(function() {
                expect(countTraces('scatter')).toEqual(0);

                return Plotly.restyle(gd, 'visible', true);
            }).then(function() {
                expect(countTraces('scatter')).toEqual(1);

                done();
            });
        });

        it('should be able to delete and add traces', function(done) {
            expect(countTernarySubplot()).toEqual(1);
            expect(countTraces('scatter')).toEqual(1);

            Plotly.deleteTraces(gd, [0]).then(function() {
                expect(countTernarySubplot()).toEqual(0);
                expect(countTraces('scatter')).toEqual(0);

                var trace = Lib.extendDeep({}, mock.data[0]);

                return Plotly.addTraces(gd, [trace]);
            }).then(function() {
                expect(countTernarySubplot()).toEqual(1);
                expect(countTraces('scatter')).toEqual(1);

                var trace = Lib.extendDeep({}, mock.data[0]);

                return Plotly.addTraces(gd, [trace]);
            }).then(function() {
                expect(countTernarySubplot()).toEqual(1);
                expect(countTraces('scatter')).toEqual(2);

                return Plotly.deleteTraces(gd, [0]);
            }).then(function() {
                expect(countTernarySubplot()).toEqual(1);
                expect(countTraces('scatter')).toEqual(1);

                done();
            });

        });

    });

    function countTernarySubplot() {
        return d3.selectAll('.ternary').size();
    }

    function countTraces(type) {
        return d3.selectAll('.ternary').selectAll('g.trace.' + type).size();
    }
});
