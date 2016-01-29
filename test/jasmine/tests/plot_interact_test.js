var d3 = require('d3');

var Plotly = require('@lib/index');
var Lib = require('@src/lib');

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');


describe('Test plot structure', function() {
    'use strict';

    function assertNamespaces(node) {
        expect(node.getAttribute('xmlns'))
            .toEqual('http://www.w3.org/2000/svg');
        expect(node.getAttribute('xmlns:xlink'))
            .toEqual('http://www.w3.org/1999/xlink');
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
                expect(nodes.size()).toEqual(1);
            });

            it('has one *scatterlayer* node', function() {
                var nodes = d3.selectAll('g.scatterlayer');
                expect(nodes.size()).toEqual(1);
            });

            it('has as many *trace scatter* nodes as there are traces', function() {
                var nodes = d3.selectAll('g.trace.scatter');
                expect(nodes.size()).toEqual(mock.data.length);
            });

            it('has as many *point* nodes as there are traces', function() {
                var nodes = d3.selectAll('path.point');

                var Npts = 0;
                mock.data.forEach(function(trace) {
                    Npts += trace.x.length;
                });

                expect(nodes.size()).toEqual(Npts);
            });

            it('has the correct name spaces', function() {
                var mainSVGs = d3.selectAll('.main-svg');

                mainSVGs.each(function() {
                    var node = this;
                    assertNamespaces(node);
                });
            });
        });

        describe('contour/heatmap traces', function() {
            var mock = require('@mocks/connectgaps_2d.json');

            function extendMock() {
                var mockCopy = Lib.extendDeep(mock);

                // add a colorbar for testing
                mockCopy.data[0].showscale = true;

                return mockCopy;
            }

            describe('initial structure', function() {
                beforeEach(function(done) {
                    var mockCopy = extendMock();

                    Plotly.plot(createGraphDiv(), mockCopy.data, mockCopy.layout)
                        .then(done);
                });

                it('has four *subplot* nodes', function() {
                    var nodes = d3.selectAll('g.subplot');
                    expect(nodes.size()).toEqual(4);
                });

                // N.B. the contour traces both have a heatmap fill
                it('has four heatmap image nodes', function() {
                    var hmNodes = d3.selectAll('g.hm');
                    expect(hmNodes.size()).toEqual(4);

                    var imageNodes = d3.selectAll('image');
                    expect(imageNodes.size()).toEqual(4);
                });

                it('has two contour nodes', function() {
                    var nodes = d3.selectAll('g.contour');
                    expect(nodes.size()).toEqual(2);
                });

                it('has one colorbar nodes', function() {
                    var nodes = d3.selectAll('rect.cbbg');
                    expect(nodes.size()).toEqual(1);
                });
            });

            describe('structure after restyle', function() {
                beforeEach(function(done) {
                    var mockCopy = extendMock();
                    var gd = createGraphDiv();

                    Plotly.plot(gd, mockCopy.data, mockCopy.layout);

                    Plotly.restyle(gd, {
                        type: 'scatter',
                        x: [[1, 2, 3]],
                        y: [[2, 1, 2]],
                        z: null
                    }, 0);

                    Plotly.restyle(gd, 'type', 'contour', 1);

                    Plotly.restyle(gd, 'type', 'heatmap', 2)
                        .then(done);
                });

                it('has four *subplot* nodes', function() {
                    var nodes = d3.selectAll('g.subplot');
                    expect(nodes.size()).toEqual(4);
                });

                it('has two heatmap image nodes', function() {
                    var hmNodes = d3.selectAll('g.hm');
                    expect(hmNodes.size()).toEqual(2);

                    var imageNodes = d3.selectAll('image');
                    expect(imageNodes.size()).toEqual(2);
                });

                it('has two contour nodes', function() {
                    var nodes = d3.selectAll('g.contour');
                    expect(nodes.size()).toEqual(2);
                });

                it('has one scatter node', function() {
                    var nodes = d3.selectAll('g.trace.scatter');
                    expect(nodes.size()).toEqual(1);
                });

                it('has no colorbar node', function() {
                    var nodes = d3.selectAll('rect.cbbg');
                    expect(nodes.size()).toEqual(0);
                });
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

                expect(nodes.size()).toEqual(Npts);
            });

            it('has the correct name spaces', function() {
                var mainSVGs = d3.selectAll('.main-svg');

                mainSVGs.each(function() {
                    var node = this;
                    assertNamespaces(node);
                });

                var testerSVG = d3.selectAll('#js-plotly-tester');
                assertNamespaces(testerSVG.node());
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

            expect(nodes.size()).toEqual(Npts);
        });

        it('has as many *point* nodes as there are marker points', function() {
            var nodes = d3.selectAll('path.point');

            var Npts = 0;
            mock.data.forEach(function(trace) {
                var items = trace.lat;
                if(items) Npts += items.length;
            });

            expect(nodes.size()).toEqual(Npts);
        });

        it('has the correct name spaces', function() {
            var mainSVGs = d3.selectAll('.main-svg');

            mainSVGs.each(function() {
                var node = this;
                assertNamespaces(node);
            });

            var geoSVGs = d3.select('#geo').selectAll('svg');

            geoSVGs.each(function() {
                var node = this;
                assertNamespaces(node);
            });
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

            expect(nodes.size()).toEqual(Npts);
        });
    });
});
