var d3 = require('d3');

var Plotly = require('@src/index');
var Fx = require('@src/plots/cartesian/graph_interact');


describe('Test plot structure', function () {
    'use strict';

    function createGraphDiv() {
        var gd = document.createElement('div');
        gd.id = 'graph';
        document.body.appendChild(gd);
        return gd;
    }

    function destroyGraphDiv() {
        var gd = document.getElementById('graph');
        document.body.removeChild(gd);
    }

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

            it('responds to hover', function() {
                var gd = document.getElementById('graph');

                var evt = {
                    clientX: gd.layout.width/ 2,
                    clientY: gd.layout.height / 2
                };

                Fx.hover('graph', evt, 'xy');

                var hoverTrace = gd._hoverdata[0];

                expect(hoverTrace.curveNumber).toEqual(0);
                expect(hoverTrace.pointNumber).toEqual(17);
                expect(hoverTrace.x).toEqual(0.388);
                expect(hoverTrace.y).toEqual(1);

                expect(d3.selectAll('g.axistext')[0].length).toEqual(1);
                expect(d3.selectAll('g.hovertext')[0].length).toEqual(1);
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

    describe('gl3d plots', function() {
        var mock = require('@mocks/gl3d_marker-arrays.json');

        beforeEach(function(done) {
            Plotly.plot(createGraphDiv(), mock.data, mock.layout).then(done);
        });

        it('has one *canvas* node', function() {
            var nodes = d3.selectAll('canvas');
            expect(nodes[0].length).toEqual(1);
        });
    });

    describe('gl2d plots', function() {
        var mock = require('@mocks/gl2d_10.json');

        beforeEach(function(done) {
            Plotly.plot(createGraphDiv(), mock.data, mock.layout).then(done);
        });

        it('has one *canvas* node', function() {
            var nodes = d3.selectAll('canvas');
            expect(nodes[0].length).toEqual(1);
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
