var Plotly = require('@lib/index');
var Lib = require('@src/lib');

var Geo = require('@src/plots/geo');
var GeoAssets = require('@src/assets/geo_assets');
var constants = require('@src/plots/geo/constants');
var geoLocationUtils = require('@src/lib/geo_location_utils');
var topojsonUtils = require('@src/lib/topojson_utils');

var d3 = require('d3');
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var fail = require('../assets/fail_test');
var getClientPosition = require('../assets/get_client_position');
var mouseEvent = require('../assets/mouse_event');
var click = require('../assets/click');

var DBLCLICKDELAY = require('@src/constants/interactions').DBLCLICKDELAY;
var HOVERMINTIME = require('@src/components/fx').constants.HOVERMINTIME;

function move(fromX, fromY, toX, toY, delay) {
    return new Promise(function(resolve) {
        mouseEvent('mousemove', fromX, fromY);

        setTimeout(function() {
            mouseEvent('mousemove', toX, toY);
            resolve();
        }, delay || DBLCLICKDELAY / 4);
    });
}

describe('Test Geo layout defaults', function() {
    'use strict';

    var layoutAttributes = Geo.layoutAttributes;
    var supplyLayoutDefaults = Geo.supplyLayoutDefaults;

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
        expect(layoutOut.geo.scope).toEqual('usa');
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
        expect(layoutOut.geo.scope).toEqual('world');
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
            } else {
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
            } else {
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

    describe('should default to lon(lat)range to params non-world scopes', function() {
        var scopeDefaults = constants.scopeDefaults;
        var scopes = Object.keys(scopeDefaults);
        var customLonaxisRange = [-42.21313312, 40.321321];
        var customLataxisRange = [-42.21313312, 40.321321];

        scopes.forEach(function(s) {
            if(s === 'world') return;

            it('base case for ' + s, function() {
                layoutIn = {geo: {scope: s}};
                supplyLayoutDefaults(layoutIn, layoutOut, fullData);

                var dfltLonaxisRange = scopeDefaults[s].lonaxisRange;
                var dfltLataxisRange = scopeDefaults[s].lataxisRange;

                expect(layoutOut.geo.lonaxis.range).toEqual(dfltLonaxisRange);
                expect(layoutOut.geo.lataxis.range).toEqual(dfltLataxisRange);
                expect(layoutOut.geo.lonaxis.tick0).toEqual(dfltLonaxisRange[0]);
                expect(layoutOut.geo.lataxis.tick0).toEqual(dfltLataxisRange[0]);
            });

            it('custom case for ' + s, function() {
                layoutIn = {
                    geo: {
                        scope: s,
                        lonaxis: {range: customLonaxisRange},
                        lataxis: {range: customLataxisRange}
                    }
                };
                supplyLayoutDefaults(layoutIn, layoutOut, fullData);

                expect(layoutOut.geo.lonaxis.range).toEqual(customLonaxisRange);
                expect(layoutOut.geo.lataxis.range).toEqual(customLataxisRange);
                expect(layoutOut.geo.lonaxis.tick0).toEqual(customLonaxisRange[0]);
                expect(layoutOut.geo.lataxis.tick0).toEqual(customLataxisRange[0]);
            });
        });
    });

    describe('should adjust default lon(lat)range to projection.rotation in world scopes', function() {
        var specs = [{
            geo: {
                scope: 'world',
                projection: {
                    type: 'equirectangular',
                    rotation: {lon: -75, lat: 45}
                }
            },
            // => -75 +/- 180
            lonRange: [-255, 105],
            // => 45 +/- 90
            latRange: [-45, 135]
        }, {
            geo: {
                scope: 'world',
                projection: {
                    type: 'orthographic',
                    rotation: {lon: -75, lat: 45}
                }
            },
            // => -75 +/- 90
            lonRange: [-165, 15],
            // => 45 +/- 90
            latRange: [-45, 135]
        }, {
            geo: {
                lonaxis: {range: [-42.21313312, 40.321321]},
                lataxis: {range: [-42.21313312, 40.321321]}
            },
            lonRange: [-42.21313312, 40.321321],
            latRange: [-42.21313312, 40.321321]
        }];

        specs.forEach(function(s, i) {
            it('- case ' + i, function() {
                layoutIn = {geo: s.geo};
                supplyLayoutDefaults(layoutIn, layoutOut, fullData);

                expect(layoutOut.geo.lonaxis.range).toEqual(s.lonRange);
                expect(layoutOut.geo.lataxis.range).toEqual(s.latRange);
            });
        });
    });

    describe('should default projection.rotation.lon to lon-center of world-scope maps', function() {
        var specs = [
            { lonRange: [10, 80], projLon: 45 },
            { lonRange: [-45, -10], projLon: -27.5 },
            { lonRange: [-45, 45], projLon: 0 },
            { lonRange: [-140, 140], projLon: 0 },
            // N.B. 180 not -180 after removing ambiguity across antimeridian
            { lonRange: [140, -140], projLon: 180 }
        ];

        specs.forEach(function(s, i) {
            it('- case ' + i, function() {
                layoutIn = {
                    geo: { lonaxis: {range: s.lonRange} }
                };

                supplyLayoutDefaults(layoutIn, layoutOut, fullData);
                expect(layoutOut.geo.lonaxis.range)
                    .toEqual(s.lonRange, 'lonaxis.range');
                expect(layoutOut.geo.projection.rotation.lon)
                    .toEqual(s.projLon, 'computed projection rotation lon');
            });
        });

        var scope = 'europe';
        var dflt = constants.scopeDefaults[scope].projRotate[0];

        specs.forEach(function(s, i) {
            it('- converse ' + i, function() {
                layoutIn = {
                    geo: {
                        scope: 'europe',
                        lonaxis: {range: s.lonRange}
                    }
                };

                supplyLayoutDefaults(layoutIn, layoutOut, fullData);
                expect(layoutOut.geo.lonaxis.range)
                    .toEqual(s.lonRange, 'lonaxis.range');
                expect(layoutOut.geo.projection.rotation.lon)
                    .toEqual(dflt, 'scope dflt projection rotation lon');
            });
        });
    });

    describe('should default center.lon', function() {
        var specs = [
            { lonRange: [10, 80], projLon: 0, centerLon: 45 },
            { lonRange: [-45, -10], projLon: -20, centerLon: -27.5 },
            { lonRange: [-45, 45], projLon: 5, centerLon: 0 },
            { lonRange: [-140, 140], projLon: 0, centerLon: 0 },
            { lonRange: [140, -140], projLon: 160, centerLon: 180 }
        ];

        specs.forEach(function(s, i) {
            it('to projection.rotation.lon on world maps - case ' + i, function() {
                layoutIn = {
                    geo: {
                        lonaxis: {range: s.lonRange},
                        projection: {
                            rotation: {lon: s.projLon}
                        }
                    }
                };

                supplyLayoutDefaults(layoutIn, layoutOut, fullData);
                expect(layoutOut.geo.lonaxis.range)
                    .toEqual(s.lonRange, 'lonaxis.range');
                expect(layoutOut.geo.projection.rotation.lon)
                    .toEqual(s.projLon, 'projection.rotation.lon');
                expect(layoutOut.geo.center.lon)
                    .toEqual(s.projLon, 'center lon (inherited from projection.rotation.lon');
            });
        });

        var scope = 'africa';

        specs.forEach(function(s, i) {
            it('to lon-center on scoped maps - case ' + i, function() {
                layoutIn = {
                    geo: {
                        scope: scope,
                        lonaxis: {range: s.lonRange},
                        projection: {
                            rotation: {lon: s.projLon}
                        }
                    }
                };

                supplyLayoutDefaults(layoutIn, layoutOut, fullData);
                expect(layoutOut.geo.lonaxis.range)
                    .toEqual(s.lonRange, 'lonaxis.range');
                expect(layoutOut.geo.projection.rotation.lon)
                    .toEqual(s.projLon, 'projection.rotation.lon');
                expect(layoutOut.geo.center.lon)
                    .toEqual(s.centerLon, 'computed center lon');
            });
        });
    });

    describe('should default center.lat', function() {
        var specs = [
            { latRange: [-90, 90], centerLat: 0 },
            { latRange: [0, 30], centerLat: 15 },
            { latRange: [-25, -5], centerLat: -15 }
        ];

        specs.forEach(function(s, i) {
            it('- case ' + i, function() {
                layoutIn = {
                    geo: { lataxis: {range: s.latRange} }
                };

                supplyLayoutDefaults(layoutIn, layoutOut, fullData);
                expect(layoutOut.geo.lataxis.range)
                    .toEqual(s.latRange, 'lataxis.range');
                expect(layoutOut.geo.center.lat)
                    .toEqual(s.centerLat, 'computed center lat');

            });
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

            it('should show custom \`hoverlabel\' settings', function(done) {
                Plotly.restyle(gd, {
                    'hoverlabel.bgcolor': 'red',
                    'hoverlabel.bordercolor': [['blue', 'black', 'green']]
                })
                .then(function() {
                    mouseEventScatterGeo('mousemove');

                    var path = d3.selectAll('g.hovertext').select('path');
                    expect(path.style('fill')).toEqual('rgb(255, 0, 0)', 'bgcolor');
                    expect(path.style('stroke')).toEqual('rgb(0, 0, 255)', 'bordecolor[0]');
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
                    'lon', 'lat', 'location', 'marker.size'
                ]);
                expect(cnt).toEqual(1);
            });

            it('should show the correct point data', function() {
                expect(ptData.lon).toEqual(0);
                expect(ptData.lat).toEqual(0);
                expect(ptData.location).toBe(null);
                expect(ptData.curveNumber).toEqual(0);
                expect(ptData.pointNumber).toEqual(0);
                expect(ptData['marker.size']).toEqual(20);
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
                    'lon', 'lat', 'location', 'marker.size'
                ]);
            });

            it('should show the correct point data', function() {
                expect(ptData.lon).toEqual(0);
                expect(ptData.lat).toEqual(0);
                expect(ptData.location).toBe(null);
                expect(ptData.curveNumber).toEqual(0);
                expect(ptData.pointNumber).toEqual(0);
                expect(ptData['marker.size']).toEqual(20);
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
                    'lon', 'lat', 'location', 'marker.size'
                ]);
            });

            it('should show the correct point data', function() {
                expect(ptData.lon).toEqual(0);
                expect(ptData.lat).toEqual(0);
                expect(ptData.location).toBe(null);
                expect(ptData.curveNumber).toEqual(0);
                expect(ptData.pointNumber).toEqual(0);
                expect(ptData['marker.size']).toEqual(20);
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


describe('Test event property of interactions on a geo plot:', function() {
    var mock = require('@mocks/geo_scattergeo-locations.json');

    var mockCopy, gd;

    var blankPos = [10, 10],
        pointPos,
        nearPos;

    beforeAll(function(done) {
        gd = createGraphDiv();
        mockCopy = Lib.extendDeep({}, mock);
        Plotly.plot(gd, mockCopy.data, mockCopy.layout).then(function() {
            pointPos = getClientPosition('path.point');
            nearPos = [pointPos[0] - 30, pointPos[1] - 30];
            destroyGraphDiv();
            done();
        });
    });

    beforeEach(function() {
        gd = createGraphDiv();
        mockCopy = Lib.extendDeep({}, mock);
    });

    afterEach(destroyGraphDiv);

    describe('click events', function() {
        var futureData;

        beforeEach(function(done) {
            Plotly.plot(gd, mockCopy.data, mockCopy.layout).then(done);

            gd.on('plotly_click', function(data) {
                futureData = data;
            });
        });

        it('should not be trigged when not on data points', function() {
            click(blankPos[0], blankPos[1]);
            expect(futureData).toBe(undefined);
        });

        it('should contain the correct fields', function() {
            click(pointPos[0], pointPos[1]);

            var pt = futureData.points[0],
                evt = futureData.event;

            expect(Object.keys(pt)).toEqual([
                'data', 'fullData', 'curveNumber', 'pointNumber', 'lon', 'lat',
                'location', 'text', 'marker.size'
            ]);

            expect(pt.curveNumber).toEqual(0, 'points[0].curveNumber');
            expect(typeof pt.data).toEqual(typeof {}, 'points[0].data');
            expect(typeof pt.fullData).toEqual(typeof {}, 'points[0].fullData');
            expect(pt.lat).toEqual(57.75, 'points[0].lat');
            expect(pt.lon).toEqual(-101.57, 'points[0].lon');
            expect(pt.location).toEqual('CAN', 'points[0].location');
            expect(pt.pointNumber).toEqual(0, 'points[0].pointNumber');
            expect(pt.text).toEqual(20, 'points[0].text');
            expect(pt['marker.size']).toEqual(20, 'points[0][\'marker.size\']');

            expect(evt.clientX).toEqual(pointPos[0], 'event.clientX');
            expect(evt.clientY).toEqual(pointPos[1], 'event.clientY');
        });
    });

    describe('modified click events', function() {
        var clickOpts = {
                altKey: true,
                ctrlKey: true,
                metaKey: true,
                shiftKey: true
            },
            futureData;

        beforeEach(function(done) {
            Plotly.plot(gd, mockCopy.data, mockCopy.layout).then(done);

            gd.on('plotly_click', function(data) {
                futureData = data;
            });
        });

        it('should not be trigged when not on data points', function() {
            click(blankPos[0], blankPos[1], clickOpts);
            expect(futureData).toBe(undefined);
        });

        it('should contain the correct fields', function() {
            click(pointPos[0], pointPos[1], clickOpts);

            var pt = futureData.points[0],
                evt = futureData.event;

            expect(Object.keys(pt)).toEqual([
                'data', 'fullData', 'curveNumber', 'pointNumber', 'lon', 'lat',
                'location', 'text', 'marker.size'
            ]);

            expect(pt.curveNumber).toEqual(0, 'points[0].curveNumber');
            expect(typeof pt.data).toEqual(typeof {}, 'points[0].data');
            expect(typeof pt.fullData).toEqual(typeof {}, 'points[0].fullData');
            expect(pt.lat).toEqual(57.75, 'points[0].lat');
            expect(pt.lon).toEqual(-101.57, 'points[0].lon');
            expect(pt.location).toEqual('CAN', 'points[0].location');
            expect(pt.pointNumber).toEqual(0, 'points[0].pointNumber');
            expect(pt.text).toEqual(20, 'points[0].text');
            expect(pt['marker.size']).toEqual(20, 'points[0][\'marker.size\']');

            expect(evt.clientX).toEqual(pointPos[0], 'event.clientX');
            expect(evt.clientY).toEqual(pointPos[1], 'event.clientY');
            Object.getOwnPropertyNames(clickOpts).forEach(function(opt) {
                expect(evt[opt]).toEqual(clickOpts[opt], 'event.' + opt);
            });
        });
    });

    describe('hover events', function() {
        var futureData;

        beforeEach(function(done) {
            Plotly.plot(gd, mockCopy.data, mockCopy.layout).then(done);

            gd.on('plotly_hover', function(data) {
                futureData = data;
            });
        });

        it('should contain the correct fields', function() {
            mouseEvent('mousemove', blankPos[0], blankPos[1]);
            mouseEvent('mousemove', pointPos[0], pointPos[1]);

            var pt = futureData.points[0],
                evt = futureData.event;

            expect(Object.keys(pt)).toEqual([
                'data', 'fullData', 'curveNumber', 'pointNumber', 'lon', 'lat',
                'location', 'text', 'marker.size'
            ]);

            expect(pt.curveNumber).toEqual(0, 'points[0].curveNumber');
            expect(typeof pt.data).toEqual(typeof {}, 'points[0].data');
            expect(typeof pt.fullData).toEqual(typeof {}, 'points[0].fullData');
            expect(pt.lat).toEqual(57.75, 'points[0].lat');
            expect(pt.lon).toEqual(-101.57, 'points[0].lon');
            expect(pt.location).toEqual('CAN', 'points[0].location');
            expect(pt.pointNumber).toEqual(0, 'points[0].pointNumber');
            expect(pt.text).toEqual(20, 'points[0].text');
            expect(pt['marker.size']).toEqual(20, 'points[0][\'marker.size\']');

            expect(evt.clientX).toEqual(pointPos[0], 'event.clientX');
            expect(evt.clientY).toEqual(pointPos[1], 'event.clientY');
        });
    });

    describe('unhover events', function() {
        var futureData;

        beforeEach(function(done) {
            Plotly.plot(gd, mockCopy.data, mockCopy.layout).then(done);

            gd.on('plotly_unhover', function(data) {
                futureData = data;
            });
        });

        it('should contain the correct fields', function(done) {
            move(pointPos[0], pointPos[1], nearPos[0], nearPos[1], HOVERMINTIME + 10).then(function() {
                var pt = futureData.points[0],
                    evt = futureData.event;

                expect(Object.keys(pt)).toEqual([
                    'data', 'fullData', 'curveNumber', 'pointNumber', 'lon', 'lat',
                    'location', 'text', 'marker.size'
                ]);

                expect(pt.curveNumber).toEqual(0, 'points[0].curveNumber');
                expect(typeof pt.data).toEqual(typeof {}, 'points[0].data');
                expect(typeof pt.fullData).toEqual(typeof {}, 'points[0].fullData');
                expect(pt.lat).toEqual(57.75, 'points[0].lat');
                expect(pt.lon).toEqual(-101.57, 'points[0].lon');
                expect(pt.location).toEqual('CAN', 'points[0].location');
                expect(pt.pointNumber).toEqual(0, 'points[0].pointNumber');
                expect(pt.text).toEqual(20, 'points[0].text');
                expect(pt['marker.size']).toEqual(20, 'points[0][\'marker.size\']');

                expect(evt.clientX).toEqual(nearPos[0], 'event.clientX');
                expect(evt.clientY).toEqual(nearPos[1], 'event.clientY');
            }).then(done);
        });
    });
});

describe('Test geo zoom/pan/drag interactions:', function() {
    var gd;
    var eventData;
    var dblClickCnt = 0;

    afterEach(destroyGraphDiv);

    function plot(fig) {
        gd = createGraphDiv();

        return Plotly.plot(gd, fig).then(function() {
            gd.on('plotly_relayout', function(d) { eventData = d; });
            gd.on('plotly_doubleclick', function() { dblClickCnt++; });
        });
    }

    function assertEventData(eventKeys) {
        if(eventKeys === 'dblclick') {
            expect(dblClickCnt).toBe(1, 'double click got fired');
            expect(eventData).toBeDefined('relayout is fired on double clicks');
        }
        else {
            expect(dblClickCnt).toBe(0, 'double click not fired');

            if(Array.isArray(eventKeys)) {
                expect(Object.keys(eventData || {}).length)
                    .toBe(Object.keys(eventKeys).length, '# of event data keys');
                eventKeys.forEach(function(k) {
                    expect((eventData || {})[k]).toBeDefined('event data key ' + k);
                });
            } else {
                expect(eventData).toBeUndefined();
            }
        }

        eventData = undefined;
        dblClickCnt = 0;
    }


    function drag(path) {
        var len = path.length;

        mouseEvent('mousemove', path[0][0], path[0][1]);
        mouseEvent('mousedown', path[0][0], path[0][1]);

        path.slice(1, len).forEach(function(pt) {
            mouseEvent('mousemove', pt[0], pt[1]);
        });

        mouseEvent('mouseup', path[len - 1][0], path[len - 1][1]);
    }

    function scroll(pos, delta) {
        return new Promise(function(resolve) {
            mouseEvent('mousemove', pos[0], pos[1]);
            mouseEvent('scroll', pos[0], pos[1], {deltaX: delta[0], deltaY: delta[1]});
            setTimeout(resolve, 100);
        });
    }

    function dblClick(pos) {
        return new Promise(function(resolve) {
            mouseEvent('dblclick', pos[0], pos[1]);
            setTimeout(resolve, 100);
        });
    }

    it('should work for non-clipped projections', function(done) {
        var fig = Lib.extendDeep({}, require('@mocks/geo_winkel-tripel'));
        fig.layout.width = 700;
        fig.layout.height = 500;
        fig.layout.dragmode = 'pan';

        function _assert(attr, proj, eventKeys) {
            var geoLayout = gd._fullLayout.geo;
            var rotation = geoLayout.projection.rotation;
            var center = geoLayout.center;
            var scale = geoLayout.projection.scale;

            expect(rotation.lon).toBeCloseTo(attr[0][0], 1, 'rotation.lon');
            expect(rotation.lat).toBeCloseTo(attr[0][1], 1, 'rotation.lat');
            expect(center.lon).toBeCloseTo(attr[1][0], 1, 'center.lon');
            expect(center.lat).toBeCloseTo(attr[1][1], 1, 'center.lat');
            expect(scale).toBeCloseTo(attr[2], 1, 'zoom');

            var geo = geoLayout._subplot;
            var rotate = geo.projection.rotate();
            var translate = geo.projection.translate();
            var _center = geo.projection.center();
            var _scale = geo.projection.scale();

            expect(rotate[0]).toBeCloseTo(proj[0][0], 0, 'rotate[0]');
            expect(rotate[1]).toBeCloseTo(proj[0][1], 0, 'rotate[1]');
            expect(translate[0]).toBeCloseTo(proj[1][0], 0, 'translate[0]');
            expect(translate[1]).toBeCloseTo(proj[1][1], 0, 'translate[1]');
            expect(_center[0]).toBeCloseTo(proj[2][0], 0, 'center[0]');
            expect(_center[1]).toBeCloseTo(proj[2][1], 0, 'center[1]');
            expect(_scale).toBeCloseTo(proj[3], 0, 'scale');

            assertEventData(eventKeys);
        }

        plot(fig).then(function() {
            _assert([
                [-90, 0], [-90, 0], 1
            ], [
                [90, 0], [350, 260], [0, 0], 101.9
            ], undefined);
            return drag([[350, 250], [400, 250]]);
        })
        .then(function() {
            _assert([
                [-124.4, 0], [-124.4, 0], 1
            ], [
                [124.4, 0], [350, 260], [0, 0], 101.9
            ], [
                'geo.projection.rotation.lon', 'geo.center.lon'
            ]);
            return drag([[400, 250], [400, 300]]);
        })
        .then(function() {
            _assert([
                [-124.4, 0], [-124.4, 28.1], 1
            ], [
                [124.4, 0], [350, 310], [0, 0], 101.9
            ], [
                'geo.center.lat'
            ]);
            return scroll([350, 250], [-200, -200]);
        })
        .then(function() {
            _assert([
                [-124.4, 0], [-124.4, 29.5], 1.3
            ], [
                [124.4, 0], [350, 329.2], [0, 0], 134.4
            ], [
                'geo.projection.rotation.lon',
                'geo.center.lon', 'geo.center.lat',
                'geo.projection.scale'
            ]);
            // something that causes a replot
            return Plotly.relayout(gd, 'geo.showocean', false);
        })
        .then(function() {
            _assert([
                [-124.4, 0], [-124.4, 29.5], 1.3
            ], [
                // converts translate (px) to center (lonlat)
                [124.4, 0], [350, 260], [0, 29.5], 134.4
            ], [
                'geo.showocean'
            ]);
            return dblClick([350, 250]);
        })
        .then(function() {
            // resets to initial view
            _assert([
                [-90, 0], [-90, 0], 1
            ], [
                [90, 0], [350, 260], [0, 0], 101.9
            ], 'dblclick');
        })
        .catch(fail)
        .then(done);
    });

    it('should work for clipped projections', function(done) {
        var fig = Lib.extendDeep({}, require('@mocks/geo_orthographic'));
        fig.layout.dragmode = 'pan';

        // of layout width = height = 500

        function _assert(attr, proj, eventKeys) {
            var geoLayout = gd._fullLayout.geo;
            var rotation = geoLayout.projection.rotation;
            var scale = geoLayout.projection.scale;

            expect(rotation.lon).toBeCloseTo(attr[0][0], 0, 'rotation.lon');
            expect(rotation.lat).toBeCloseTo(attr[0][1], 0, 'rotation.lat');
            expect(scale).toBeCloseTo(attr[1], 1, 'zoom');

            var geo = geoLayout._subplot;
            var rotate = geo.projection.rotate();
            var _scale = geo.projection.scale();

            expect(rotate[0]).toBeCloseTo(proj[0][0], 0, 'rotate[0]');
            expect(rotate[1]).toBeCloseTo(proj[0][1], 0, 'rotate[1]');
            expect(_scale).toBeCloseTo(proj[1], 0, 'scale');

            assertEventData(eventKeys);
        }

        plot(fig).then(function() {
            _assert([
                [-75, 45], 1
            ], [
                [75, -45], 160
            ], undefined);
            return drag([[250, 250], [300, 250]]);
        })
        .then(function() {
            _assert([
                [-103.7, 49.3], 1
            ], [
                [103.7, -49.3], 160
            ], [
                'geo.projection.rotation.lon', 'geo.projection.rotation.lat'
            ]);
            return drag([[250, 250], [300, 300]]);
        })
        .then(function() {
            _assert([
                [-135.5, 73.8], 1
            ], [
                [135.5, -73.8], 160
            ], [
                'geo.projection.rotation.lon', 'geo.projection.rotation.lat'
            ]);
            return scroll([300, 300], [-200, -200]);
        })
        .then(function() {
            _assert([
                [-126.2, 67.1], 1.3
            ], [
                [126.2, -67.1], 211.1
            ], [
                'geo.projection.rotation.lon', 'geo.projection.rotation.lat',
                'geo.projection.scale'
            ]);
            // something that causes a replot
            return Plotly.relayout(gd, 'geo.showocean', false);
        })
        .then(function() {
            _assert([
                [-126.2, 67.1], 1.3
            ], [
                [126.2, -67.1], 211.1
            ], [
                'geo.showocean'
            ]);
            return dblClick([350, 250]);
        })
        .then(function() {
            // resets to initial view
            _assert([
                [-75, 45], 1
            ], [
                [75, -45], 160
            ], 'dblclick');
        })
        .catch(fail)
        .then(done);
    });

    it('should work for scoped projections', function(done) {
        var fig = Lib.extendDeep({}, require('@mocks/geo_europe-bubbles'));
        fig.layout.geo.resolution = 110;
        fig.layout.dragmode = 'pan';

        // of layout width = height = 500

        function _assert(attr, proj, eventKeys) {
            var geoLayout = gd._fullLayout.geo;
            var center = geoLayout.center;
            var scale = geoLayout.projection.scale;

            expect(center.lon).toBeCloseTo(attr[0][0], -0.5, 'center.lon');
            expect(center.lat).toBeCloseTo(attr[0][1], -0.5, 'center.lat');
            expect(scale).toBeCloseTo(attr[1], 1, 'zoom');

            var geo = geoLayout._subplot;
            var translate = geo.projection.translate();
            var _center = geo.projection.center();
            var _scale = geo.projection.scale();

            expect(translate[0]).toBeCloseTo(proj[0][0], -0.75, 'translate[0]');
            expect(translate[1]).toBeCloseTo(proj[0][1], -0.75, 'translate[1]');
            expect(_center[0]).toBeCloseTo(proj[1][0], -0.5, 'center[0]');
            expect(_center[1]).toBeCloseTo(proj[1][1], -0.5, 'center[1]');
            expect(_scale).toBeCloseTo(proj[2], -1, 'scale');

            assertEventData(eventKeys);
        }

        plot(fig).then(function() {
            _assert([
                [15, 57.5], 1,
            ], [
                [247, 260], [0, 57.5], 292.2
            ], undefined);
            return drag([[250, 250], [200, 200]]);
        })
        .then(function() {
            _assert([
                [30.9, 46.2], 1
            ], [
                // changes translate(), but not center()
                [197, 210], [0, 57.5], 292.2
            ], [
                'geo.center.lon', 'geo.center.lon'
            ]);
            return scroll([300, 300], [-200, -200]);
        })
        .then(function() {
            _assert([
                [34.3, 43.6], 1.3
            ], [
                [164.1, 181.2], [0, 57.5], 385.5
            ], [
                'geo.center.lon', 'geo.center.lon', 'geo.projection.scale'
            ]);
            // something that causes a replot
            return Plotly.relayout(gd, 'geo.showlakes', true);
        })
        .then(function() {
            _assert([
                [34.3, 43.6], 1.3
            ], [
                // changes are now reflected in 'center'
                [247, 260], [19.3, 43.6], 385.5
            ], [
                'geo.showlakes'
            ]);
            return dblClick([250, 250]);
        })
        .then(function() {
            _assert([
                [15, 57.5], 1,
            ], [
                [247, 260], [0, 57.5], 292.2
            ], 'dblclick');
        })
        .catch(fail)
        .then(done);
    });

    it('should work for *albers usa* projections', function(done) {
        var fig = Lib.extendDeep({}, require('@mocks/geo_choropleth-usa'));
        fig.layout.dragmode = 'pan';

        // layout width = 870
        // layout height = 598

        function _assert(attr, proj, eventKeys) {
            var geoLayout = gd._fullLayout.geo;
            var center = geoLayout.center;
            var scale = geoLayout.projection.scale;

            expect(center.lon).toBeCloseTo(attr[0][0], 1, 'center.lon');
            expect(center.lat).toBeCloseTo(attr[0][1], 1, 'center.lat');
            expect(scale).toBeCloseTo(attr[1], 1, 'zoom');

            // albersUsa projection does not have a center() method
            var geo = geoLayout._subplot;
            var translate = geo.projection.translate();
            var _scale = geo.projection.scale();

            expect(translate[0]).toBeCloseTo(proj[0][0], -1, 'translate[0]');
            expect(translate[1]).toBeCloseTo(proj[0][1], -1, 'translate[1]');
            expect(_scale).toBeCloseTo(proj[1], -1.5, 'scale');

            assertEventData(eventKeys);
        }

        plot(fig).then(function() {
            _assert([
                [-96.6, 38.7], 1,
            ], [
                [416, 309], 738.5
            ], undefined);
            return drag([[250, 250], [200, 200]]);
        })
        .then(function() {
            _assert([
                [-91.8, 34.8], 1,
            ], [
                [366, 259], 738.5
            ], [
                'geo.center.lon', 'geo.center.lon'
            ]);
            return scroll([300, 300], [-200, -200]);
        })
        .then(function() {
            _assert([
                [-94.5, 35.0], 1.3
            ], [
                [387.1, 245.9], 974.4
            ], [
                'geo.center.lon', 'geo.center.lon', 'geo.projection.scale'
            ]);
            // something that causes a replot
            return Plotly.relayout(gd, 'geo.showlakes', true);
        })
        .then(function() {
            _assert([
                [-94.5, 35.0], 1.3
            ], [
                // new center values are reflected in translate()
                [387.1, 245.9], 974.4
            ], [
                'geo.showlakes'
            ]);
            return dblClick([250, 250]);
        })
        .then(function() {
            _assert([
                [-96.6, 38.7], 1,
            ], [
                [416, 309], 738.5
            ], 'dblclick');
        })
        .catch(fail)
        .then(done);
    });
});
