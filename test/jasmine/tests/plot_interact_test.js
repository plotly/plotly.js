var d3 = require('d3');

var Plotly = require('@lib/index');

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');


describe('Test plot structure', function() {
    'use strict';

    afterEach(destroyGraphDiv);

    describe('cartesian plots', function() {
        describe('scatter traces', function() {
            var mock = require('@mocks/14.json');

            beforeEach(function(done) {
                Plotly.plot(createGraphDiv(), mock.data, mock.layout).then(done);
            });

            it('has one *subplot xy* node', function() {
                var nodes = d3.selectAll('g.subplot.xy');
                expect(nodes[0].length).toEqual(1);
            });

            it('has one *scatterlayer* node', function() {
                var nodes = d3.selectAll('g.scatterlayer');
                expect(nodes[0].length).toEqual(1);
            });

            it('has as many *trace scatter* nodes as there are traces', function() {
                var nodes = d3.selectAll('g.trace.scatter');
                expect(nodes[0].length).toEqual(mock.data.length);
            });

            it('has as many *point* nodes as there are traces', function() {
                var nodes = d3.selectAll('path.point');

                var Npts = 0;
                mock.data.forEach(function(trace) {
                    Npts += trace.x.length;
                });

                expect(nodes[0].length).toEqual(Npts);
            });
        });

        describe('pie traces', function() {
            var mock = require('@mocks/pie_simple.json');

            beforeEach(function(done) {
                Plotly.plot(createGraphDiv(), mock.data, mock.layout).then(done);
            });

            it('has as many *slice* nodes as there are pie items', function() {
                var nodes = d3.selectAll('g.slice');

                var Npts = 0;
                mock.data.forEach(function(trace) {
                    Npts += trace.values.length;
                });

                expect(nodes[0].length).toEqual(Npts);
            });
        });
    });

    describe('geo plots', function() {
        var mock = require('@mocks/geo_first.json');

        beforeEach(function(done) {
            Plotly.plot(createGraphDiv(), mock.data, mock.layout).then(done);
        });

        it('has as many *choroplethlocation* nodes as there are choropleth locations', function() {
            var nodes = d3.selectAll('path.choroplethlocation');

            var Npts = 0;
            mock.data.forEach(function(trace) {
                var items = trace.locations;
                if(items) Npts += items.length;
            });

            expect(nodes[0].length).toEqual(Npts);
        });

        it('has as many *point* nodes as there are marker points', function() {
            var nodes = d3.selectAll('path.point');

            var Npts = 0;
            mock.data.forEach(function(trace) {
                var items = trace.lat;
                if(items) Npts += items.length;
            });

            expect(nodes[0].length).toEqual(Npts);
        });
    });

    describe('polar plots', function() {
        var mock = require('@mocks/polar_scatter.json');

        beforeEach(function(done) {
            Plotly.plot(createGraphDiv(), mock.data, mock.layout).then(done);
        });

        it('has as many *mark dot* nodes as there are points', function() {
            var nodes = d3.selectAll('path.mark.dot');

            var Npts = 0;
            mock.data.forEach(function(trace) {
                Npts += trace.r.length;
            });

            expect(nodes[0].length).toEqual(Npts);
        });
    });
});
