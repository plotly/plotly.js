var Plotly = require('@lib/index');
var Lib = require('@src/lib');

var Geo = require('@src/plots/geo');
var GeoAssets = require('@src/assets/geo_assets');
var params = require('@src/plots/geo/constants');
var supplyLayoutDefaults = require('@src/plots/geo/layout/axis_defaults');
var geoLocationUtils = require('@src/lib/geo_location_utils');
var topojsonUtils = require('@src/lib/topojson_utils');

var d3 = require('d3');
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var mouseEvent = require('../assets/mouse_event');

var HOVERMINTIME = require('@src/plots/cartesian/constants').HOVERMINTIME;


describe('Test geoaxes', function() {
    'use strict';

    describe('supplyLayoutDefaults', function() {
        var geoLayoutIn,
            geoLayoutOut;

        beforeEach(function() {
            geoLayoutOut = {};
        });

        it('should default to lon(lat)range to params non-world scopes', function() {
            var scopeDefaults = params.scopeDefaults,
                scopes = Object.keys(scopeDefaults),
                customLonaxisRange = [-42.21313312, 40.321321],
                customLataxisRange = [-42.21313312, 40.321321];

            var dfltLonaxisRange, dfltLataxisRange;

            scopes.forEach(function(scope) {
                if(scope === 'world') return;

                dfltLonaxisRange = scopeDefaults[scope].lonaxisRange;
                dfltLataxisRange = scopeDefaults[scope].lataxisRange;

                geoLayoutIn = {};
                geoLayoutOut = {scope: scope};

                supplyLayoutDefaults(geoLayoutIn, geoLayoutOut);
                expect(geoLayoutOut.lonaxis.range).toEqual(dfltLonaxisRange);
                expect(geoLayoutOut.lataxis.range).toEqual(dfltLataxisRange);
                expect(geoLayoutOut.lonaxis.tick0).toEqual(dfltLonaxisRange[0]);
                expect(geoLayoutOut.lataxis.tick0).toEqual(dfltLataxisRange[0]);

                geoLayoutIn = {
                    lonaxis: {range: customLonaxisRange},
                    lataxis: {range: customLataxisRange}
                };
                geoLayoutOut = {scope: scope};

                supplyLayoutDefaults(geoLayoutIn, geoLayoutOut);
                expect(geoLayoutOut.lonaxis.range).toEqual(customLonaxisRange);
                expect(geoLayoutOut.lataxis.range).toEqual(customLataxisRange);
                expect(geoLayoutOut.lonaxis.tick0).toEqual(customLonaxisRange[0]);
                expect(geoLayoutOut.lataxis.tick0).toEqual(customLataxisRange[0]);
            });
        });

        it('should adjust default lon(lat)range to projection.rotation in world scopes', function() {
            var expectedLonaxisRange, expectedLataxisRange;

            function testOne() {
                supplyLayoutDefaults(geoLayoutIn, geoLayoutOut);
                expect(geoLayoutOut.lonaxis.range).toEqual(expectedLonaxisRange);
                expect(geoLayoutOut.lataxis.range).toEqual(expectedLataxisRange);
            }

            geoLayoutIn = {};
            geoLayoutOut = {
                scope: 'world',
                projection: {
                    type: 'equirectangular',
                    rotation: {
                        lon: -75,
                        lat: 45
                    }
                }
            };
            expectedLonaxisRange = [-255, 105];  // => -75 +/- 180
            expectedLataxisRange = [-45, 135];   // => 45 +/- 90
            testOne();

            geoLayoutIn = {};
            geoLayoutOut = {
                scope: 'world',
                projection: {
                    type: 'orthographic',
                    rotation: {
                        lon: -75,
                        lat: 45
                    }
                }
            };
            expectedLonaxisRange = [-165, 15];  // => -75 +/- 90
            expectedLataxisRange = [-45, 135];  // => 45 +/- 90
            testOne();

            geoLayoutIn = {
                lonaxis: {range: [-42.21313312, 40.321321]},
                lataxis: {range: [-42.21313312, 40.321321]}
            };
            expectedLonaxisRange = [-42.21313312, 40.321321];
            expectedLataxisRange = [-42.21313312, 40.321321];
            testOne();
        });
    });
});

describe('Test Geo layout defaults', function() {
    'use strict';

    var layoutAttributes = Geo.layoutAttributes;
    var supplyLayoutDefaults = Geo.supplyLayoutDefaults;

    describe('supplyLayoutDefaults', function() {
        var layoutIn, layoutOut, fullData;

        beforeEach(function() {
            layoutOut = {};

            // needs a geo-ref in a trace in order to be detected
            fullData = [{ type: 'scattergeo', geo: 'geo' }];
        });

        var seaFields = [
            'showcoastlines', 'coastlinecolor', 'coastlinewidth',
            'showocean', 'oceancolor'
        ];

        var subunitFields = [
            'showsubunits', 'subunitcolor', 'subunitwidth'
        ];

        var frameFields = [
            'showframe', 'framecolor', 'framewidth'
        ];

        it('should not coerce projection.rotation if type is albers usa', function() {
            layoutIn = {
                geo: {
                    projection: {
                        type: 'albers usa',
                        rotation: {
                            lon: 10,
                            lat: 10
                        }
                    }
                }
            };

            supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            expect(layoutOut.geo.projection.rotation).toBeUndefined();
        });

        it('should not coerce projection.rotation if type is albers usa (converse)', function() {
            layoutIn = {
                geo: {
                    projection: {
                        rotation: {
                            lon: 10,
                            lat: 10
                        }
                    }
                }
            };

            supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            expect(layoutOut.geo.projection.rotation).toBeDefined();
        });

        it('should not coerce coastlines and ocean if type is albers usa', function() {
            layoutIn = {
                geo: {
                    projection: {
                        type: 'albers usa'
                    },
                    showcoastlines: true,
                    showocean: true
                }
            };

            supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            seaFields.forEach(function(field) {
                expect(layoutOut.geo[field]).toBeUndefined();
            });
        });

        it('should not coerce coastlines and ocean if type is albers usa (converse)', function() {
            layoutIn = {
                geo: {
                    showcoastlines: true,
                    showocean: true
                }
            };

            supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            seaFields.forEach(function(field) {
                expect(layoutOut.geo[field]).toBeDefined();
            });
        });

        it('should not coerce projection.parallels if type is conic', function() {
            var projTypes = layoutAttributes.projection.type.values;

            function testOne(projType) {
                layoutIn = {
                    geo: {
                        projection: {
                            type: projType,
                            parallels: [10, 10]
                        }
                    }
                };

                supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            }

            projTypes.forEach(function(projType) {
                testOne(projType);
                if(projType.indexOf('conic') !== -1) {
                    expect(layoutOut.geo.projection.parallels).toBeDefined();
                }
                else {
                    expect(layoutOut.geo.projection.parallels).toBeUndefined();
                }
            });
        });

        it('should coerce subunits only when available (usa case)', function() {
            layoutIn = {
                geo: { scope: 'usa' }
            };

            supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            subunitFields.forEach(function(field) {
                expect(layoutOut.geo[field]).toBeDefined();
            });
        });

        it('should coerce subunits only when available (default case)', function() {
            layoutIn = { geo: {} };

            supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            subunitFields.forEach(function(field) {
                expect(layoutOut.geo[field]).toBeUndefined();
            });
        });

        it('should coerce subunits only when available (NA case)', function() {
            layoutIn = {
                geo: {
                    scope: 'north america',
                    resolution: 50
                }
            };

            supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            subunitFields.forEach(function(field) {
                expect(layoutOut.geo[field]).toBeDefined();
            });
        });

        it('should coerce subunits only when available (NA case 2)', function() {
            layoutIn = {
                geo: {
                    scope: 'north america',
                    resolution: '50'
                }
            };

            supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            subunitFields.forEach(function(field) {
                expect(layoutOut.geo[field]).toBeDefined();
            });
        });

        it('should coerce subunits only when available (NA case 2)', function() {
            layoutIn = {
                geo: {
                    scope: 'north america'
                }
            };

            supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            subunitFields.forEach(function(field) {
                expect(layoutOut.geo[field]).toBeUndefined();
            });
        });

        it('should not coerce frame unless for world scope', function() {
            var scopes = layoutAttributes.scope.values;

            function testOne(scope) {
                layoutIn = {
                    geo: { scope: scope }
                };

                supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            }

            scopes.forEach(function(scope) {
                testOne(scope);
                if(scope === 'world') {
                    frameFields.forEach(function(field) {
                        expect(layoutOut.geo[field]).toBeDefined();
                    });
                }
                else {
                    frameFields.forEach(function(field) {
                        expect(layoutOut.geo[field]).toBeUndefined();
                    });
                }
            });
        });

        it('should add geo data-only geos into layoutIn', function() {
            layoutIn = {};
            fullData = [{ type: 'scattergeo', geo: 'geo' }];

            supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            expect(layoutIn.geo).toEqual({});
        });

        it('should add geo data-only geos into layoutIn (converse)', function() {
            layoutIn = {};
            fullData = [{ type: 'scatter' }];

            supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            expect(layoutIn.geo).toBe(undefined);
        });
    });
});

describe('geojson / topojson utils', function() {
    'use strict';

    function _locationToFeature(topojson, loc, locationmode) {
        var trace = { locationmode: locationmode };
        var features = topojsonUtils.getTopojsonFeatures(trace, topojson);

        var feature = geoLocationUtils.locationToFeature(locationmode, loc, features);
        return feature;
    }

    describe('should be able to extract topojson feature from *locations* items', function() {
        var topojsonName = 'world_110m';
        var topojson = GeoAssets.topojson[topojsonName];

        it('with *ISO-3* locationmode', function() {
            var out = _locationToFeature(topojson, 'CAN', 'ISO-3');

            expect(Object.keys(out)).toEqual(['type', 'id', 'properties', 'geometry']);
            expect(out.id).toEqual('CAN');
        });

        it('with *ISO-3* locationmode (not-found case)', function() {
            var out = _locationToFeature(topojson, 'XXX', 'ISO-3');

            expect(out).toEqual(false);
        });

        it('with *country names* locationmode', function() {
            var out = _locationToFeature(topojson, 'United States', 'country names');

            expect(Object.keys(out)).toEqual(['type', 'id', 'properties', 'geometry']);
            expect(out.id).toEqual('USA');
        });

        it('with *country names* locationmode (not-found case)', function() {
            var out = _locationToFeature(topojson, 'XXX', 'country names');

            expect(out).toEqual(false);
        });
    });

    describe('should distinguish between US and US Virgin Island', function() {

        // N.B. Virgin Island don't appear at the 'world_110m' resolution
        var topojsonName = 'world_50m';
        var topojson = GeoAssets.topojson[topojsonName];

        var shouldPass = [
            'Virgin Islands (U.S.)',
            ' Virgin   Islands (U.S.) '
        ];

        shouldPass.forEach(function(str) {
            it('(case ' + str + ')', function() {
                var out = _locationToFeature(topojson, str, 'country names');
                expect(out.id).toEqual('VIR');
            });
        });
    });
});

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
            return d3.select('g.geolayer').selectAll('.geo').size();
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
            it('should show one hover text group', function() {
                mouseEventScatterGeo('mousemove');
                expect(d3.selectAll('g.hovertext').size()).toEqual(1);
            });

            it('should show longitude and latitude values', function() {
                mouseEventScatterGeo('mousemove');

                var node = d3.selectAll('g.hovertext').selectAll('tspan')[0][0];
                expect(node.innerHTML).toEqual('(0°, 0°)');
            });

            it('should show the trace name', function() {
                mouseEventScatterGeo('mousemove');

                var node = d3.selectAll('g.hovertext').selectAll('text')[0][0];
                expect(node.innerHTML).toEqual('trace 0');
            });

            it('should show *text* (case 1)', function(done) {
                Plotly.restyle(gd, 'text', [['A', 'B']]).then(function() {
                    mouseEventScatterGeo('mousemove');

                    var node = d3.selectAll('g.hovertext').selectAll('tspan')[0][1];
                    expect(node.innerHTML).toEqual('A');
                })
                .then(done);
            });

            it('should show *text* (case 2)', function(done) {
                Plotly.restyle(gd, 'text', [[null, 'B']]).then(function() {
                    mouseEventScatterGeo('mousemove');

                    var node = d3.selectAll('g.hovertext').selectAll('tspan')[0][1];
                    expect(node).toBeUndefined();
                })
                .then(done);
            });

            it('should show *text* (case 3)', function(done) {
                Plotly.restyle(gd, 'text', [['', 'B']]).then(function() {
                    mouseEventScatterGeo('mousemove');

                    var node = d3.selectAll('g.hovertext').selectAll('tspan')[0][1];
                    expect(node).toBeUndefined();
                })
                .then(done);
            });
        });

        describe('scattergeo hover events', function() {
            var ptData, cnt;

            beforeEach(function() {
                cnt = 0;

                gd.on('plotly_hover', function(eventData) {
                    ptData = eventData.points[0];
                    cnt++;
                });

                mouseEventScatterGeo('mousemove');
            });

            it('should contain the correct fields', function() {
                expect(Object.keys(ptData)).toEqual([
                    'data', 'fullData', 'curveNumber', 'pointNumber',
                    'lon', 'lat', 'location'
                ]);
                expect(cnt).toEqual(1);
            });

            it('should show the correct point data', function() {
                expect(ptData.lon).toEqual(0);
                expect(ptData.lat).toEqual(0);
                expect(ptData.location).toBe(null);
                expect(ptData.curveNumber).toEqual(0);
                expect(ptData.pointNumber).toEqual(0);
                expect(cnt).toEqual(1);
            });

            it('should not be triggered when pt over on the other side of the globe', function(done) {
                var update = {
                    'geo.projection.type': 'orthographic',
                    'geo.projection.rotation': { lon: 82, lat: -19 }
                };

                Plotly.relayout(gd, update).then(function() {
                    setTimeout(function() {
                        mouseEvent('mousemove', 288, 170);

                        expect(cnt).toEqual(1);

                        done();
                    }, HOVERMINTIME + 10);
                });
            });

            it('should not be triggered when pt *location* does not have matching feature', function(done) {
                var update = {
                    'locations': [['CAN', 'AAA', 'USA']]
                };

                Plotly.restyle(gd, update).then(function() {
                    setTimeout(function() { mouseEvent('mousemove', 300, 230);

                        expect(cnt).toEqual(1);

                        done();
                    }, HOVERMINTIME + 10);
                });
            });
        });

        describe('scattergeo click events', function() {
            var ptData;

            beforeEach(function() {
                gd.on('plotly_click', function(eventData) {
                    ptData = eventData.points[0];
                });

                mouseEventScatterGeo('mousemove');
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

        describe('scattergeo unhover events', function() {
            var ptData;

            beforeEach(function(done) {
                gd.on('plotly_unhover', function(eventData) {
                    ptData = eventData.points[0];
                });

                mouseEventScatterGeo('mousemove');
                setTimeout(function() {
                    mouseEvent('mousemove', 400, 200);
                    done();
                }, HOVERMINTIME + 10);
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
                mouseEventChoropleth('mousemove');
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
                mouseEventChoropleth('mousemove');
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

                mouseEventChoropleth('mouseover');
                mouseEventChoropleth('mousemove');
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

        describe('choropleth unhover events', function() {
            var ptData;

            beforeEach(function(done) {
                gd.on('plotly_unhover', function(eventData) {
                    ptData = eventData.points[0];
                });

                mouseEventChoropleth('mouseover');
                mouseEventChoropleth('mousemove');
                mouseEventChoropleth('mouseout');
                setTimeout(function() {
                    mouseEvent('mousemove', 300, 235);
                    done();
                }, HOVERMINTIME + 100);
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

                    gd.calcdata = undefined;
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

                    gd.calcdata = undefined;
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

                    gd.calcdata = undefined;
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

                gd.calcdata = undefined;
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

                gd.calcdata = undefined;
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
