var d3Select = require('../../strict-d3').select;
var d3SelectAll = require('../../strict-d3').selectAll;

var Plotly = require('../../../lib/index');
var Lib = require('../../../src/lib');

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');


// This suite is more of a test of the structure of interaction elements on
// various plot types. Tests of actual mouse interactions on cartesian plots
// are in cartesian_interact_test.js

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
        function countSubplots() {
            return d3SelectAll('g.subplot').size();
        }

        function countScatterTraces() {
            return d3SelectAll('g.trace.scatter').size();
        }

        function countColorBars() {
            return d3SelectAll('rect.cbbg').size();
        }

        function countClipPaths() {
            return d3SelectAll('defs').selectAll('.axesclip,.plotclip').size();
        }

        function countDraggers() {
            return d3SelectAll('g.draglayer').selectAll('g').size();
        }

        describe('scatter traces', function() {
            var mock = require('../../image/mocks/14.json');
            var gd;

            beforeEach(function(done) {
                gd = createGraphDiv();

                var mockData = Lib.extendDeep([], mock.data);
                var mockLayout = Lib.extendDeep({}, mock.layout);

                Plotly.newPlot(gd, mockData, mockLayout).then(done);
            });

            it('has one *subplot xy* node', function() {
                expect(countSubplots()).toEqual(1);
            });

            it('has four clip paths', function() {
                expect(countClipPaths()).toEqual(4);
            });

            it('has one dragger group', function() {
                expect(countDraggers()).toEqual(1);
            });

            it('has one *scatterlayer* node', function() {
                var nodes = d3SelectAll('g.scatterlayer');
                expect(nodes.size()).toEqual(1);
            });

            it('has as many *trace scatter* nodes as there are traces', function() {
                expect(countScatterTraces()).toEqual(mock.data.length);
            });

            it('has as many *point* nodes as there are traces', function() {
                var nodes = d3SelectAll('path.point');

                var Npts = 0;
                mock.data.forEach(function(trace) {
                    Npts += trace.x.length;
                });

                expect(nodes.size()).toEqual(Npts);
            });

            it('has the correct name spaces', function() {
                var mainSVGs = d3SelectAll('.main-svg');

                mainSVGs.each(function() {
                    var node = this;
                    assertNamespaces(node);
                });
            });

            it('should be able to get deleted', function(done) {
                expect(countScatterTraces()).toEqual(mock.data.length);
                expect(countSubplots()).toEqual(1);

                Plotly.deleteTraces(gd, [0]).then(function() {
                    expect(countScatterTraces()).toEqual(0);
                    expect(countSubplots()).toEqual(1);
                    expect(countClipPaths()).toEqual(4);
                    expect(countDraggers()).toEqual(1);

                    return Plotly.relayout(gd, {xaxis: null, yaxis: null});
                }).then(function() {
                    expect(countScatterTraces()).toEqual(0);
                    // we still make one empty cartesian subplot if no other subplots are described
                    expect(countSubplots()).toEqual(1);
                    expect(countClipPaths()).toEqual(4);
                    expect(countDraggers()).toEqual(1);
                })
                .then(done, done.fail);
            });

            it('should restore layout axes when they get deleted', function(done) {
                expect(countScatterTraces()).toEqual(mock.data.length);
                expect(countSubplots()).toEqual(1);

                Plotly.relayout(gd, {xaxis: null, yaxis: null})
                .then(function() {
                    expect(countScatterTraces()).toEqual(1);
                    expect(countSubplots()).toEqual(1);
                    expect(gd.layout.xaxis.range).toBeCloseToArray([-4.79980, 74.48580], 4);
                    expect(gd.layout.yaxis.range).toBeCloseToArray([-1.2662, 17.67023], 4);

                    return Plotly.relayout(gd, 'xaxis', null);
                }).then(function() {
                    expect(countScatterTraces()).toEqual(1);
                    expect(countSubplots()).toEqual(1);
                    expect(gd.layout.xaxis.range).toBeCloseToArray([-4.79980, 74.48580], 4);
                    expect(gd.layout.yaxis.range).toBeCloseToArray([-1.2662, 17.67023], 4);

                    return Plotly.relayout(gd, 'xaxis', {});
                }).then(function() {
                    expect(countScatterTraces()).toEqual(1);
                    expect(countSubplots()).toEqual(1);
                    expect(gd.layout.xaxis.range).toBeCloseToArray([-4.79980, 74.48580], 4);
                    expect(gd.layout.yaxis.range).toBeCloseToArray([-1.2662, 17.67023], 4);

                    return Plotly.relayout(gd, 'yaxis', null);
                }).then(function() {
                    expect(countScatterTraces()).toEqual(1);
                    expect(countSubplots()).toEqual(1);
                    expect(gd.layout.xaxis.range).toBeCloseToArray([-4.79980, 74.48580], 4);
                    expect(gd.layout.yaxis.range).toBeCloseToArray([-1.2662, 17.67023], 4);

                    return Plotly.relayout(gd, 'yaxis', {});
                }).then(function() {
                    expect(countScatterTraces()).toEqual(1);
                    expect(countSubplots()).toEqual(1);
                    expect(gd.layout.xaxis.range).toBeCloseToArray([-4.79980, 74.48580], 4);
                    expect(gd.layout.yaxis.range).toBeCloseToArray([-1.2662, 17.67023], 4);
                })
                .then(done, done.fail);
            });
        });

        describe('contour/heatmap traces', function() {
            var mock = require('../../image/mocks/connectgaps_2d.json');
            var gd;

            function extendMock() {
                var mockData = Lib.extendDeep([], mock.data);
                var mockLayout = Lib.extendDeep({}, mock.layout);

                // add a colorbar for testing
                mockData[0].showscale = true;

                return {
                    data: mockData,
                    layout: mockLayout
                };
            }

            function assertHeatmapNodes(expectedCnt) {
                var hmNodes = d3SelectAll('g.hm');
                expect(hmNodes.size()).toEqual(expectedCnt);

                var imageNodes = d3SelectAll('image');
                expect(imageNodes.size()).toEqual(expectedCnt);
            }

            function assertContourNodes(expectedCnt) {
                var nodes = d3SelectAll('g.contour');
                expect(nodes.size()).toEqual(expectedCnt);
            }

            describe('initial structure', function() {
                beforeEach(function(done) {
                    var mockCopy = extendMock();
                    var gd = createGraphDiv();

                    Plotly.newPlot(gd, mockCopy.data, mockCopy.layout)
                        .then(done);
                });

                it('has four *subplot* nodes', function() {
                    expect(countSubplots()).toEqual(4);
                    expect(countClipPaths()).toEqual(12);
                    expect(countDraggers()).toEqual(4);
                });

                it('has four heatmap image nodes', function() {
                    // N.B. the contour traces both have a heatmap fill
                    assertHeatmapNodes(4);
                });

                it('has two contour nodes', function() {
                    assertContourNodes(2);
                });

                it('has one colorbar nodes', function() {
                    expect(countColorBars()).toEqual(1);
                });
            });

            describe('structure after restyle', function() {
                beforeEach(function(done) {
                    var mockCopy = extendMock();
                    var gd = createGraphDiv();

                    Plotly.newPlot(gd, mockCopy.data, mockCopy.layout)
                    .then(function() {
                        return Plotly.restyle(gd, {
                            type: 'scatter',
                            x: [[1, 2, 3]],
                            y: [[2, 1, 2]],
                            z: null
                        }, 0);
                    })
                    .then(function() {
                        return Plotly.restyle(gd, 'type', 'contour', 1);
                    })
                    .then(function() {
                        return Plotly.restyle(gd, 'type', 'heatmap', 2);
                    })
                    .then(done);
                });

                it('has four *subplot* nodes', function() {
                    expect(countSubplots()).toEqual(4);
                    expect(countClipPaths()).toEqual(12);
                    expect(countDraggers()).toEqual(4);
                });

                it('has two heatmap image nodes', function() {
                    assertHeatmapNodes(2);
                });

                it('has two contour nodes', function() {
                    assertContourNodes(2);
                });

                it('has one scatter node', function() {
                    expect(countScatterTraces()).toEqual(1);
                });

                it('has no colorbar node', function() {
                    expect(countColorBars()).toEqual(0);
                });
            });

            describe('structure after deleteTraces', function() {
                beforeEach(function(done) {
                    gd = createGraphDiv();

                    var mockCopy = extendMock();
                    Plotly.newPlot(gd, mockCopy.data, mockCopy.layout)
                        .then(done);
                });

                function assertClassCount(container3, msg, classes) {
                    Object.keys(classes).forEach(function(cls) {
                        expect(container3.selectAll('.' + cls).size())
                            .toBe(classes[cls], msg + ': ' + cls);
                    });
                }

                it('should be removed of traces in sequence', function(done) {
                    expect(countSubplots()).toEqual(4);
                    assertHeatmapNodes(4);
                    assertContourNodes(2);
                    expect(countColorBars()).toEqual(1);
                    assertClassCount(gd._fullLayout._infolayer, 'initial', {
                        'g-gtitle': 1,
                        'g-xtitle': 1,
                        'g-x2title': 1,
                        'g-ytitle': 1,
                        'g-y2title': 1
                    });

                    Plotly.deleteTraces(gd, [0]).then(function() {
                        expect(countSubplots()).toEqual(3);
                        expect(countClipPaths()).toEqual(11);
                        expect(countDraggers()).toEqual(3);
                        assertHeatmapNodes(3);
                        assertContourNodes(2);
                        expect(countColorBars()).toEqual(0);
                        assertClassCount(gd._fullLayout._infolayer, '1 down', {
                            'g-gtitle': 1,
                            'g-xtitle': 1,
                            'g-x2title': 1,
                            'g-ytitle': 1,
                            'g-y2title': 1
                        });

                        return Plotly.deleteTraces(gd, [0]);
                    }).then(function() {
                        expect(countSubplots()).toEqual(2);
                        expect(countClipPaths()).toEqual(7);
                        expect(countDraggers()).toEqual(2);
                        assertHeatmapNodes(2);
                        assertContourNodes(2);
                        expect(countColorBars()).toEqual(0);
                        assertClassCount(gd._fullLayout._infolayer, '2 down', {
                            'g-gtitle': 1,
                            'g-xtitle': 1,
                            'g-x2title': 1,
                            'g-ytitle': 0,
                            'g-y2title': 1
                        });

                        return Plotly.deleteTraces(gd, [0]);
                    }).then(function() {
                        expect(countSubplots()).toEqual(1);
                        expect(countClipPaths()).toEqual(4);
                        expect(countDraggers()).toEqual(1);
                        assertHeatmapNodes(1);
                        assertContourNodes(1);
                        expect(countColorBars()).toEqual(0);
                        assertClassCount(gd._fullLayout._infolayer, '3 down', {
                            'g-gtitle': 1,
                            'g-xtitle': 0,
                            'g-x2title': 1,
                            'g-ytitle': 0,
                            'g-y2title': 1
                        });

                        return Plotly.deleteTraces(gd, [0]);
                    }).then(function() {
                        expect(countSubplots()).toEqual(1);
                        expect(countClipPaths()).toEqual(4);
                        expect(countDraggers()).toEqual(1);
                        assertHeatmapNodes(0);
                        assertContourNodes(0);
                        expect(countColorBars()).toEqual(0);
                        assertClassCount(gd._fullLayout._infolayer, 'all gone', {
                            'g-gtitle': 1,
                            'g-xtitle': 1,
                            'g-x2title': 0,
                            'g-ytitle': 1,
                            'g-y2title': 0
                        });

                        var update = {
                            xaxis: null,
                            yaxis: null,
                            xaxis2: null,
                            yaxis2: null
                        };

                        return Plotly.relayout(gd, update);
                    }).then(function() {
                        expect(countSubplots()).toEqual(1);
                        expect(countClipPaths()).toEqual(4);
                        expect(countDraggers()).toEqual(1);
                        assertHeatmapNodes(0);
                        assertContourNodes(0);
                        expect(countColorBars()).toEqual(0);
                        assertClassCount(gd._fullLayout._infolayer, 'cleared layout axes', {
                            'g-gtitle': 1,
                            'g-xtitle': 1,
                            'g-x2title': 0,
                            'g-ytitle': 1,
                            'g-y2title': 0
                        });
                    })
                    .then(done, done.fail);
                });
            });
        });

        describe('pie traces', function() {
            var mock = require('../../image/mocks/pie_simple.json');
            var gd;

            function countPieTraces() {
                return d3Select('g.pielayer').selectAll('g.trace').size();
            }

            function countBarTraces() {
                return d3SelectAll('g.trace.bars').size();
            }

            beforeEach(function(done) {
                gd = createGraphDiv();

                var mockData = Lib.extendDeep([], mock.data);
                var mockLayout = Lib.extendDeep({}, mock.layout);

                Plotly.newPlot(gd, mockData, mockLayout).then(done);
            });

            it('has as many *slice* nodes as there are pie items', function() {
                var nodes = d3SelectAll('g.slice');

                var Npts = 0;
                mock.data.forEach(function(trace) {
                    Npts += trace.values.length;
                });

                expect(nodes.size()).toEqual(Npts);
            });

            it('has the correct name spaces', function() {
                var mainSVGs = d3SelectAll('.main-svg');

                mainSVGs.each(function() {
                    var node = this;
                    assertNamespaces(node);
                });

                var testerSVG = d3SelectAll('#js-plotly-tester');
                assertNamespaces(testerSVG.node());
            });

            it('should be able to get deleted', function(done) {
                expect(countPieTraces()).toEqual(1);
                expect(countSubplots()).toEqual(0);

                Plotly.deleteTraces(gd, [0]).then(function() {
                    expect(countPieTraces()).toEqual(0);
                    expect(countSubplots()).toEqual(1);
                })
                .then(done, done.fail);
            });

            it('should be able to be restyled to a bar chart and back', function(done) {
                expect(countPieTraces()).toEqual(1);
                expect(countBarTraces()).toEqual(0);
                expect(countSubplots()).toEqual(0);

                Plotly.restyle(gd, 'type', 'bar').then(function() {
                    expect(countPieTraces()).toEqual(0);
                    expect(countBarTraces()).toEqual(1);
                    expect(countSubplots()).toEqual(1);

                    return Plotly.restyle(gd, 'type', 'pie');
                }).then(function() {
                    expect(countPieTraces()).toEqual(1);
                    expect(countBarTraces()).toEqual(0);
                    expect(countSubplots()).toEqual(0);
                })
                .then(done, done.fail);
            });
        });
    });

    describe('geo plots', function() {
        var mock = require('../../image/mocks/geo_first.json');

        beforeEach(function(done) {
            Plotly.newPlot(createGraphDiv(), mock.data, mock.layout).then(done);
        });

        it('has as many *choroplethlocation* nodes as there are choropleth locations', function() {
            var nodes = d3SelectAll('path.choroplethlocation');

            var Npts = 0;
            mock.data.forEach(function(trace) {
                var items = trace.locations;
                if(items) Npts += items.length;
            });

            expect(nodes.size()).toEqual(Npts);
        });

        it('has as many *point* nodes as there are marker points', function() {
            var nodes = d3SelectAll('path.point');

            var Npts = 0;
            mock.data.forEach(function(trace) {
                var items = trace.lat;
                if(items) Npts += items.length;
            });

            expect(nodes.size()).toEqual(Npts);
        });

        it('has the correct name spaces', function() {
            var mainSVGs = d3SelectAll('.main-svg');

            mainSVGs.each(function() {
                var node = this;
                assertNamespaces(node);
            });

            var geoSVGs = d3Select('#geo').selectAll('svg');

            geoSVGs.each(function() {
                var node = this;
                assertNamespaces(node);
            });
        });
    });
});

describe('plot svg clip paths', function() {
    // plot with all features that rely on clip paths
    function plot() {
        return Plotly.newPlot(createGraphDiv(), [{
            type: 'contour',
            z: [[1, 2, 3], [2, 3, 1]]
        }, {
            type: 'scatter',
            y: [2, 1, 2]
        }], {
            showlegend: true,
            xaxis: {
                rangeslider: {}
            },
            shapes: [{
                xref: 'x',
                yref: 'y',
                x0: 0,
                y0: 0,
                x1: 3,
                y1: 3
            }]
        });
    }

    afterEach(destroyGraphDiv);

    it('should set clip path url to ids (base case)', function(done) {
        plot().then(function() {
            d3SelectAll('[clip-path]').each(function() {
                var cp = d3Select(this).attr('clip-path');

                expect(cp.substring(0, 5)).toEqual('url(#');
                expect(cp.substring(cp.length - 1)).toEqual(')');
            });
        })
        .then(done, done.fail);
    });

    it('should set clip path url to ids appended to window url', function(done) {
        // this case occurs in some past versions of AngularJS
        // https://github.com/angular/angular.js/issues/8934

        // append <base> with href
        var base = d3Select('body')
            .append('base')
            .attr('href', 'https://chart-studio.plotly.com');

        // grab window URL
        var href = window.location.href.split('#')[0];

        plot().then(function() {
            d3SelectAll('[clip-path]').each(function() {
                var cp = d3Select(this).attr('clip-path');

                expect(cp.substring(0, 6 + href.length)).toEqual('url(\'' + href + '#');
                expect(cp.substring(cp.length - 2)).toEqual('\')');
            });

            base.remove();
        })
        .then(done, done.fail);
    });
});
