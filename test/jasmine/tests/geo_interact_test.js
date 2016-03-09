var d3 = require('d3');

var Plotly = require('@lib/index');
var Lib = require('@src/lib');

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var mouseEvent = require('../assets/mouse_event');


describe('Test geo interactions', function() {
    'use strict';

    afterEach(destroyGraphDiv);

    describe('mock geo_first.json', function() {
        var mock = require('@mocks/geo_first.json');
        var gd;

        function mouseEventScatterGeo(type) {
            mouseEvent(type, 300, 235);
        }

        function mouseEventChoropleth(type) {
            mouseEvent(type, 400, 160);
        }

        function countTraces(type) {
            return d3.selectAll('g.trace.' + type).size();
        }

        function countGeos() {
            return d3.select('div.geo-container').selectAll('div').size();
        }

        function countColorBars() {
            return d3.select('g.infolayer').selectAll('.cbbg').size();
        }

        beforeEach(function(done) {
            gd = createGraphDiv();

            var mockCopy = Lib.extendDeep({}, mock);

            Plotly.plot(gd, mockCopy.data, mockCopy.layout).then(done);
        });

        describe('scattergeo hover labels', function() {
            beforeEach(function() {
                mouseEventScatterGeo('mouseover');
            });

            it('should show one hover text group', function() {
                expect(d3.selectAll('g.hovertext').size()).toEqual(1);
            });

            it('should show longitude and latitude values', function() {
                var node = d3.selectAll('g.hovertext').selectAll('tspan')[0][0];

                expect(node.innerHTML).toEqual('(0°, 0°)');
            });

            it('should show the trace name', function() {
                var node = d3.selectAll('g.hovertext').selectAll('text')[0][0];

                expect(node.innerHTML).toEqual('trace 0');
            });
        });

        describe('scattergeo hover events', function() {
            var ptData;

            beforeEach(function() {
                gd.on('plotly_hover', function(eventData) {
                    ptData = eventData.points[0];
                });

                mouseEventScatterGeo('mouseover');
            });

            it('should contain the correct fields', function() {
                expect(Object.keys(ptData)).toEqual([
                    'data', 'fullData', 'curveNumber', 'pointNumber',
                    'lon', 'lat', 'location'
                ]);
            });

            it('should show the correct point data', function() {
                expect(ptData.lon).toEqual(0);
                expect(ptData.lat).toEqual(0);
                expect(ptData.location).toBe(null);
                expect(ptData.curveNumber).toEqual(0);
                expect(ptData.pointNumber).toEqual(0);
            });
        });

        describe('scattergeo click events', function() {
            var ptData;

            beforeEach(function() {
                gd.on('plotly_click', function(eventData) {
                    ptData = eventData.points[0];
                });

                mouseEventScatterGeo('click');
            });

            it('should contain the correct fields', function() {
                expect(Object.keys(ptData)).toEqual([
                    'data', 'fullData', 'curveNumber', 'pointNumber',
                    'lon', 'lat', 'location'
                ]);
            });

            it('should show the correct point data', function() {
                expect(ptData.lon).toEqual(0);
                expect(ptData.lat).toEqual(0);
                expect(ptData.location).toBe(null);
                expect(ptData.curveNumber).toEqual(0);
                expect(ptData.pointNumber).toEqual(0);
            });
        });

        describe('choropleth hover labels', function() {
            beforeEach(function() {
                mouseEventChoropleth('mouseover');
            });

            it('should show one hover text group', function() {
                expect(d3.selectAll('g.hovertext').size()).toEqual(1);
            });

            it('should show location and z values', function() {
                var node = d3.selectAll('g.hovertext').selectAll('tspan')[0];

                expect(node[0].innerHTML).toEqual('RUS');
                expect(node[1].innerHTML).toEqual('10');
            });

            it('should show the trace name', function() {
                var node = d3.selectAll('g.hovertext').selectAll('text')[0][0];

                expect(node.innerHTML).toEqual('trace 1');
            });
        });

        describe('choropleth hover events', function() {
            var ptData;

            beforeEach(function() {
                gd.on('plotly_hover', function(eventData) {
                    ptData = eventData.points[0];
                });

                mouseEventChoropleth('mouseover');
            });

            it('should contain the correct fields', function() {
                expect(Object.keys(ptData)).toEqual([
                    'data', 'fullData', 'curveNumber', 'pointNumber',
                    'location', 'z'
                ]);
            });

            it('should show the correct point data', function() {
                expect(ptData.location).toBe('RUS');
                expect(ptData.z).toEqual(10);
                expect(ptData.curveNumber).toEqual(1);
                expect(ptData.pointNumber).toEqual(2);
            });
        });

        describe('choropleth click events', function() {
            var ptData;

            beforeEach(function() {
                gd.on('plotly_click', function(eventData) {
                    ptData = eventData.points[0];
                });

                mouseEventChoropleth('click');
            });

            it('should contain the correct fields', function() {
                expect(Object.keys(ptData)).toEqual([
                    'data', 'fullData', 'curveNumber', 'pointNumber',
                    'location', 'z'
                ]);
            });

            it('should show the correct point data', function() {
                expect(ptData.location).toBe('RUS');
                expect(ptData.z).toEqual(10);
                expect(ptData.curveNumber).toEqual(1);
                expect(ptData.pointNumber).toEqual(2);
            });
        });

        describe('trace visibility toggle', function() {
            it('should toggle scattergeo elements', function(done) {
                expect(countTraces('scattergeo')).toBe(1);
                expect(countTraces('choropleth')).toBe(1);

                Plotly.restyle(gd, 'visible', false, [0]).then(function() {
                    expect(countTraces('scattergeo')).toBe(0);
                    expect(countTraces('choropleth')).toBe(1);

                    return Plotly.restyle(gd, 'visible', true, [0]);
                }).then(function() {
                    expect(countTraces('scattergeo')).toBe(1);
                    expect(countTraces('choropleth')).toBe(1);

                    done();
                });
            });

            it('should toggle choropleth elements', function(done) {
                expect(countTraces('scattergeo')).toBe(1);
                expect(countTraces('choropleth')).toBe(1);

                Plotly.restyle(gd, 'visible', false, [1]).then(function() {
                    expect(countTraces('scattergeo')).toBe(1);
                    expect(countTraces('choropleth')).toBe(0);

                    return Plotly.restyle(gd, 'visible', true, [1]);
                }).then(function() {
                    expect(countTraces('scattergeo')).toBe(1);
                    expect(countTraces('choropleth')).toBe(1);

                    done();
                });
            });

        });

        describe('deleting traces and geos', function() {
            it('should delete traces in succession', function(done) {
                expect(countTraces('scattergeo')).toBe(1);
                expect(countTraces('choropleth')).toBe(1);
                expect(countGeos()).toBe(1);
                expect(countColorBars()).toBe(1);

                Plotly.deleteTraces(gd, [0]).then(function() {
                    expect(countTraces('scattergeo')).toBe(0);
                    expect(countTraces('choropleth')).toBe(1);
                    expect(countGeos()).toBe(1);
                    expect(countColorBars()).toBe(1);

                    return Plotly.deleteTraces(gd, [0]);
                }).then(function() {
                    expect(countTraces('scattergeo')).toBe(0);
                    expect(countTraces('choropleth')).toBe(0);
                    expect(countGeos()).toBe(0, '- trace-less geo subplot are deleted');
                    expect(countColorBars()).toBe(0);

                    return Plotly.relayout(gd, 'geo', null);
                }).then(function() {
                    expect(countTraces('scattergeo')).toBe(0);
                    expect(countTraces('choropleth')).toBe(0);
                    expect(countGeos()).toBe(0);
                    expect(countColorBars()).toBe(0);

                    done();
                });
            });
        });

        describe('streaming calls', function() {
            var INTERVAL = 10;

            var N_MARKERS_AT_START = Math.min(
                mock.data[0].lat.length,
                mock.data[0].lon.length
            );

            var N_LOCATIONS_AT_START = mock.data[1].locations.length;

            var lonQueue = [45, -45, 12, 20],
                latQueue = [-75, 80, 5, 10],
                textQueue = ['c', 'd', 'e', 'f'],
                locationsQueue = ['AUS', 'FRA', 'DEU', 'MEX'],
                zQueue = [100, 20, 30, 12];

            beforeEach(function(done) {
                var update = {
                    mode: 'lines+markers+text',
                    text: [['a', 'b']],
                    'marker.size': 10
                };

                Plotly.restyle(gd, update, [0]).then(done);
            });

            function countScatterGeoLines() {
                return d3.selectAll('g.trace.scattergeo')
                    .selectAll('path.js-line')
                    .size();
            }

            function countScatterGeoMarkers() {
                return d3.selectAll('g.trace.scattergeo')
                    .selectAll('path.point')
                    .size();
            }

            function countScatterGeoTextGroups() {
                return d3.selectAll('g.trace.scattergeo')
                    .selectAll('g')
                    .size();
            }

            function countScatterGeoTextNodes() {
                return d3.selectAll('g.trace.scattergeo')
                    .selectAll('g')
                    .select('text')
                    .size();
            }

            function checkScatterGeoOrder() {
                var order = ['js-path', 'point', null];
                var nodes = d3.selectAll('g.trace.scattergeo');

                nodes.each(function() {
                    var list = [];

                    d3.select(this).selectAll('*').each(function() {
                        var className = d3.select(this).attr('class');
                        list.push(className);
                    });

                    var listSorted = list.slice().sort(function(a, b) {
                        return order.indexOf(a) - order.indexOf(b);
                    });

                    expect(list).toEqual(listSorted);
                });
            }

            function countChoroplethPaths() {
                return d3.selectAll('g.trace.choropleth')
                    .selectAll('path.choroplethlocation')
                    .size();
            }

            it('should be able to add line/marker/text nodes', function(done) {
                var i = 0;

                var interval = setInterval(function() {
                    expect(countTraces('scattergeo')).toBe(1);
                    expect(countTraces('choropleth')).toBe(1);
                    expect(countScatterGeoLines()).toBe(1);
                    expect(countScatterGeoMarkers()).toBe(N_MARKERS_AT_START + i);
                    expect(countScatterGeoTextGroups()).toBe(N_MARKERS_AT_START + i);
                    expect(countScatterGeoTextNodes()).toBe(N_MARKERS_AT_START + i);
                    checkScatterGeoOrder();

                    var trace = gd.data[0];
                    trace.lon.push(lonQueue[i]);
                    trace.lat.push(latQueue[i]);
                    trace.text.push(textQueue[i]);

                    if(i === lonQueue.length - 1) {
                        clearInterval(interval);
                        done();
                    }

                    Plotly.plot(gd);
                    i++;
                }, INTERVAL);
            });

            it('should be able to shift line/marker/text nodes', function(done) {
                var i = 0;

                var interval = setInterval(function() {
                    expect(countTraces('scattergeo')).toBe(1);
                    expect(countTraces('choropleth')).toBe(1);
                    expect(countScatterGeoLines()).toBe(1);
                    expect(countScatterGeoMarkers()).toBe(N_MARKERS_AT_START);
                    expect(countScatterGeoTextGroups()).toBe(N_MARKERS_AT_START);
                    expect(countScatterGeoTextNodes()).toBe(N_MARKERS_AT_START);
                    checkScatterGeoOrder();

                    var trace = gd.data[0];
                    trace.lon.push(lonQueue[i]);
                    trace.lat.push(latQueue[i]);
                    trace.text.push(textQueue[i]);
                    trace.lon.shift();
                    trace.lat.shift();
                    trace.text.shift();

                    if(i === lonQueue.length - 1) {
                        clearInterval(interval);
                        done();
                    }

                    Plotly.plot(gd);
                    i++;
                }, INTERVAL);
            });

            it('should be able to update line/marker/text nodes', function(done) {
                var i = 0;

                var interval = setInterval(function() {
                    expect(countTraces('scattergeo')).toBe(1);
                    expect(countTraces('choropleth')).toBe(1);
                    expect(countScatterGeoLines()).toBe(1);
                    expect(countScatterGeoMarkers()).toBe(N_MARKERS_AT_START);
                    expect(countScatterGeoTextGroups()).toBe(N_MARKERS_AT_START);
                    expect(countScatterGeoTextNodes()).toBe(N_MARKERS_AT_START);
                    checkScatterGeoOrder();

                    var trace = gd.data[0];
                    trace.lon.push(lonQueue[i]);
                    trace.lat.push(latQueue[i]);
                    trace.text.push(textQueue[i]);
                    trace.lon.shift();
                    trace.lat.shift();
                    trace.text.shift();

                    if(i === lonQueue.length - 1) {
                        clearInterval(interval);
                        done();
                    }

                    Plotly.plot(gd);
                    i++;
                }, INTERVAL);
            });

            it('should be able to delete line/marker/text nodes and choropleth paths', function(done) {
                var trace0 = gd.data[0];
                trace0.lon.shift();
                trace0.lat.shift();
                trace0.text.shift();

                var trace1 = gd.data[1];
                trace1.locations.shift();

                Plotly.plot(gd).then(function() {
                    expect(countTraces('scattergeo')).toBe(1);
                    expect(countTraces('choropleth')).toBe(1);

                    expect(countScatterGeoLines()).toBe(1);
                    expect(countScatterGeoMarkers()).toBe(N_MARKERS_AT_START - 1);
                    expect(countScatterGeoTextGroups()).toBe(N_MARKERS_AT_START - 1);
                    expect(countScatterGeoTextNodes()).toBe(N_MARKERS_AT_START - 1);
                    checkScatterGeoOrder();

                    expect(countChoroplethPaths()).toBe(N_LOCATIONS_AT_START - 1);

                    done();
                });
            });

            it('should be able to update line/marker/text nodes and choropleth paths', function(done) {
                var trace0 = gd.data[0];
                trace0.lon = lonQueue;
                trace0.lat = latQueue;
                trace0.text = textQueue;

                var trace1 = gd.data[1];
                trace1.locations = locationsQueue;
                trace1.z = zQueue;

                Plotly.plot(gd).then(function() {
                    expect(countTraces('scattergeo')).toBe(1);
                    expect(countTraces('choropleth')).toBe(1);

                    expect(countScatterGeoLines()).toBe(1);
                    expect(countScatterGeoMarkers()).toBe(lonQueue.length);
                    expect(countScatterGeoTextGroups()).toBe(textQueue.length);
                    expect(countScatterGeoTextNodes()).toBe(textQueue.length);
                    checkScatterGeoOrder();

                    expect(countChoroplethPaths()).toBe(locationsQueue.length);

                    done();
                });
            });

        });
    });
});
