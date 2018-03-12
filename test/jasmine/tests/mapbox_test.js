var Plotly = require('@lib');
var Lib = require('@src/lib');

var constants = require('@src/plots/mapbox/constants');
var supplyLayoutDefaults = require('@src/plots/mapbox/layout_defaults');

var d3 = require('d3');
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var mouseEvent = require('../assets/mouse_event');
var failTest = require('../assets/fail_test');
var supplyAllDefaults = require('../assets/supply_defaults');

var customAssertions = require('../assets/custom_assertions');
var assertHoverLabelStyle = customAssertions.assertHoverLabelStyle;
var assertHoverLabelContent = customAssertions.assertHoverLabelContent;

var MAPBOX_ACCESS_TOKEN = require('@build/credentials.json').MAPBOX_ACCESS_TOKEN;
var TRANSITION_DELAY = 500;
var MOUSE_DELAY = 100;
var LONG_TIMEOUT_INTERVAL = 5 * jasmine.DEFAULT_TIMEOUT_INTERVAL;

var noop = function() {};

Plotly.setPlotConfig({
    mapboxAccessToken: MAPBOX_ACCESS_TOKEN
});

describe('mapbox defaults', function() {
    'use strict';

    var layoutIn, layoutOut, fullData;

    beforeEach(function() {
        layoutOut = { font: { color: 'red' }, _subplots: {mapbox: ['mapbox']} };

        // needs a mapbox-ref in a trace in order to be detected
        fullData = [{ type: 'scattermapbox', subplot: 'mapbox' }];
    });

    it('should fill empty containers', function() {
        layoutIn = {};

        supplyLayoutDefaults(layoutIn, layoutOut, fullData);
        expect(layoutIn).toEqual({ mapbox: {} });
    });

    it('should copy ref to input container in full (for updating on map move)', function() {
        var mapbox = { style: 'light '};

        layoutIn = { mapbox: mapbox };

        supplyLayoutDefaults(layoutIn, layoutOut, fullData);
        expect(layoutOut.mapbox._input).toBe(mapbox);
    });

    it('should accept both string and object style', function() {
        var mapboxStyleJSON = {
            id: 'cdsa213wqdsa',
            owner: 'johnny'
        };

        layoutIn = {
            mapbox: { style: 'light' },
            mapbox2: { style: mapboxStyleJSON }
        };

        fullData.push({ type: 'scattermapbox', subplot: 'mapbox2' });
        layoutOut._subplots.mapbox.push('mapbox2');

        supplyLayoutDefaults(layoutIn, layoutOut, fullData);
        expect(layoutOut.mapbox.style).toEqual('light');
        expect(layoutOut.mapbox2.style).toBe(mapboxStyleJSON);
    });

    it('should fill layer containers', function() {
        layoutIn = {
            mapbox: {
                layers: [{}, {}]
            }
        };

        supplyLayoutDefaults(layoutIn, layoutOut, fullData);
        expect(layoutOut.mapbox.layers[0].sourcetype).toEqual('geojson');
        expect(layoutOut.mapbox.layers[1].sourcetype).toEqual('geojson');
    });

    it('should skip over non-object layer containers', function() {
        layoutIn = {
            mapbox: {
                layers: [{}, null, 'remove', {}]
            }
        };

        supplyLayoutDefaults(layoutIn, layoutOut, fullData);
        expect(layoutOut.mapbox.layers[0].sourcetype).toEqual('geojson');
        expect(layoutOut.mapbox.layers[0]._index).toEqual(0);
        expect(layoutOut.mapbox.layers[1].sourcetype).toEqual('geojson');
        expect(layoutOut.mapbox.layers[1]._index).toEqual(3);
    });

    it('should coerce \'sourcelayer\' only for *vector* \'sourcetype\'', function() {
        layoutIn = {
            mapbox: {
                layers: [{
                    sourcetype: 'vector',
                    sourcelayer: 'layer0'
                }, {
                    sourcetype: 'geojson',
                    sourcelayer: 'layer0'
                }]
            }
        };

        supplyLayoutDefaults(layoutIn, layoutOut, fullData);
        expect(layoutOut.mapbox.layers[0].sourcelayer).toEqual('layer0');
        expect(layoutOut.mapbox.layers[1].sourcelayer).toBeUndefined();
    });

    it('should only coerce relevant layer style attributes', function() {
        var base = {
            line: { width: 3 },
            fill: { outlinecolor: '#d3d3d3' },
            circle: { radius: 20 },
            symbol: { icon: 'monument' }
        };

        layoutIn = {
            mapbox: {
                layers: [
                    Lib.extendFlat({}, base, {
                        type: 'line',
                        color: 'red'
                    }),
                    Lib.extendFlat({}, base, {
                        type: 'fill',
                        color: 'blue'
                    }),
                    Lib.extendFlat({}, base, {
                        type: 'circle',
                        color: 'green'
                    }),
                    Lib.extendFlat({}, base, {
                        type: 'symbol',
                        color: 'yellow'
                    })
                ]
            }
        };

        supplyLayoutDefaults(layoutIn, layoutOut, fullData);

        expect(layoutOut.mapbox.layers[0].color).toEqual('red');
        expect(layoutOut.mapbox.layers[0].line.width).toEqual(3);
        expect(layoutOut.mapbox.layers[0].fill).toBeUndefined();
        expect(layoutOut.mapbox.layers[0].circle).toBeUndefined();
        expect(layoutOut.mapbox.layers[0].symbol).toBeUndefined();

        expect(layoutOut.mapbox.layers[1].color).toEqual('blue');
        expect(layoutOut.mapbox.layers[1].fill.outlinecolor).toEqual('#d3d3d3');
        expect(layoutOut.mapbox.layers[1].line).toBeUndefined();
        expect(layoutOut.mapbox.layers[1].circle).toBeUndefined();
        expect(layoutOut.mapbox.layers[1].symbol).toBeUndefined();

        expect(layoutOut.mapbox.layers[2].color).toEqual('green');
        expect(layoutOut.mapbox.layers[2].circle.radius).toEqual(20);
        expect(layoutOut.mapbox.layers[2].line).toBeUndefined();
        expect(layoutOut.mapbox.layers[2].fill).toBeUndefined();
        expect(layoutOut.mapbox.layers[2].symbol).toBeUndefined();

        expect(layoutOut.mapbox.layers[3].color).toEqual('yellow');
        expect(layoutOut.mapbox.layers[3].symbol.icon).toEqual('monument');
        expect(layoutOut.mapbox.layers[3].line).toBeUndefined();
        expect(layoutOut.mapbox.layers[3].fill).toBeUndefined();
        expect(layoutOut.mapbox.layers[3].circle).toBeUndefined();
    });

    it('should set *layout.dragmode* to pan while zoom is not available', function() {
        var gd = {
            data: fullData,
            layout: {}
        };

        supplyAllDefaults(gd);
        expect(gd._fullLayout.dragmode).toBe('pan');
    });
});

describe('mapbox credentials', function() {
    'use strict';

    var dummyToken = 'asfdsa124331wersdsa1321q3';
    var gd;

    beforeEach(function() {
        gd = createGraphDiv();

        Plotly.setPlotConfig({
            mapboxAccessToken: null
        });
    });

    afterEach(function() {
        Plotly.purge(gd);
        destroyGraphDiv();

        Plotly.setPlotConfig({
            mapboxAccessToken: MAPBOX_ACCESS_TOKEN
        });
    });

    it('should throw error if token is not registered', function() {
        expect(function() {
            Plotly.plot(gd, [{
                type: 'scattermapbox',
                lon: [10, 20, 30],
                lat: [10, 20, 30]
            }]);
        }).toThrow(new Error(constants.noAccessTokenErrorMsg));
    }, LONG_TIMEOUT_INTERVAL);

    it('should throw error if token is invalid', function(done) {
        var cnt = 0;

        Plotly.plot(gd, [{
            type: 'scattermapbox',
            lon: [10, 20, 30],
            lat: [10, 20, 30]
        }], {}, {
            mapboxAccessToken: dummyToken
        })
        .catch(function(err) {
            cnt++;
            expect(err).toEqual(new Error(constants.mapOnErrorMsg));
        })
        .then(function() {
            expect(cnt).toEqual(1);
            done();
        });
    }, LONG_TIMEOUT_INTERVAL);

    it('should use access token in mapbox layout options if present', function(done) {
        var cnt = 0;

        Plotly.plot(gd, [{
            type: 'scattermapbox',
            lon: [10, 20, 30],
            lat: [10, 20, 30]
        }], {
            mapbox: {
                accesstoken: MAPBOX_ACCESS_TOKEN
            }
        }, {
            mapboxAccessToken: dummyToken
        }).catch(function() {
            cnt++;
        }).then(function() {
            expect(cnt).toEqual(0);
            expect(gd._fullLayout.mapbox.accesstoken).toEqual(MAPBOX_ACCESS_TOKEN);
            done();
        });
    }, LONG_TIMEOUT_INTERVAL);

    it('should bypass access token in mapbox layout options when config points to an Atlas server', function(done) {
        var cnt = 0;
        var msg = [
            'An API access token is required to use Mapbox GL.',
            'See https://www.mapbox.com/api-documentation/#access-tokens'
        ].join(' ');

        Plotly.plot(gd, [{
            type: 'scattermapbox',
            lon: [10, 20, 30],
            lat: [10, 20, 30]
        }], {
            mapbox: {
                accesstoken: MAPBOX_ACCESS_TOKEN
            }
        }, {
            mapboxAccessToken: ''
        })
        .catch(function(err) {
            cnt++;
            expect(err).toEqual(new Error(msg));
        })
        .then(function() {
            expect(cnt).toEqual(1);
            done();
        });
    }, LONG_TIMEOUT_INTERVAL);
});

describe('@noCI, mapbox plots', function() {
    'use strict';

    var mock = require('@mocks/mapbox_0.json'),
        gd;

    var pointPos = [579, 276],
        blankPos = [650, 120];

    beforeEach(function(done) {
        gd = createGraphDiv();

        var mockCopy = Lib.extendDeep({}, mock);

        Plotly.plot(gd, mockCopy.data, mockCopy.layout).then(done);
    });

    afterEach(function() {
        Plotly.purge(gd);
        destroyGraphDiv();
    });

    it('should be able to toggle trace visibility', function(done) {
        var modes = ['line', 'circle'];

        expect(countVisibleTraces(gd, modes)).toEqual(2);

        Plotly.restyle(gd, 'visible', false).then(function() {
            expect(gd._fullLayout.mapbox === undefined).toBe(false);

            expect(countVisibleTraces(gd, modes)).toEqual(0);

            return Plotly.restyle(gd, 'visible', true);
        })
        .then(function() {
            expect(countVisibleTraces(gd, modes)).toEqual(2);

            return Plotly.restyle(gd, 'visible', 'legendonly', [1]);
        })
        .then(function() {
            expect(countVisibleTraces(gd, modes)).toEqual(1);

            return Plotly.restyle(gd, 'visible', true);
        })
        .then(function() {
            expect(countVisibleTraces(gd, modes)).toEqual(2);

            var mockCopy = Lib.extendDeep({}, mock);
            mockCopy.data[0].visible = false;

            return Plotly.newPlot(gd, mockCopy.data, mockCopy.layout);
        })
        .then(function() {
            expect(countVisibleTraces(gd, modes)).toEqual(1);

            done();
        });
    }, LONG_TIMEOUT_INTERVAL);

    it('should be able to delete and add traces', function(done) {
        var modes = ['line', 'circle'];

        expect(countVisibleTraces(gd, modes)).toEqual(2);

        Plotly.deleteTraces(gd, [0]).then(function() {
            expect(countVisibleTraces(gd, modes)).toEqual(1);

            var trace = {
                type: 'scattermapbox',
                mode: 'markers+lines',
                lon: [-10, -20, -10],
                lat: [-10, 20, -10]
            };

            return Plotly.addTraces(gd, [trace]);
        })
        .then(function() {
            expect(countVisibleTraces(gd, modes)).toEqual(2);

            var trace = {
                type: 'scattermapbox',
                mode: 'markers+lines',
                lon: [10, 20, 10],
                lat: [10, -20, 10]
            };

            return Plotly.addTraces(gd, [trace]);
        })
        .then(function() {
            expect(countVisibleTraces(gd, modes)).toEqual(3);

            return Plotly.deleteTraces(gd, [0, 1, 2]);
        })
        .then(function() {
            expect(gd._fullLayout.mapbox === undefined).toBe(true);

            done();
        });
    }, LONG_TIMEOUT_INTERVAL);

    it('should be able to restyle', function(done) {
        var restyleCnt = 0,
            relayoutCnt = 0;

        gd.on('plotly_restyle', function() {
            restyleCnt++;
        });

        gd.on('plotly_relayout', function() {
            relayoutCnt++;
        });

        function assertMarkerColor(expectations) {
            return new Promise(function(resolve) {
                setTimeout(function() {
                    var objs = getStyle(gd, 'circle', 'circle-color');

                    expectations.forEach(function(expected, i) {
                        var obj = objs[i];
                        var rgba = [obj.r, obj.g, obj.b, obj.a];
                        expect(rgba).toBeCloseToArray(expected);
                    });

                    resolve();
                }, TRANSITION_DELAY);
            });
        }

        assertMarkerColor([
            [0.121, 0.466, 0.705, 1],
            [1, 0.498, 0.0549, 1]
        ])
        .then(function() {
            return Plotly.restyle(gd, 'marker.color', 'green');
        })
        .then(function() {
            expect(restyleCnt).toEqual(1);
            expect(relayoutCnt).toEqual(0);

            return assertMarkerColor([
                [0, 0.5019, 0, 1],
                [0, 0.5019, 0, 1]
            ]);
        })
        .then(function() {
            return Plotly.restyle(gd, 'marker.color', 'red', [1]);
        })
        .then(function() {
            expect(restyleCnt).toEqual(2);
            expect(relayoutCnt).toEqual(0);

            return assertMarkerColor([
                [0, 0.5019, 0, 1],
                [1, 0, 0, 1]
            ]);
        })
        .then(done);
    }, LONG_TIMEOUT_INTERVAL);

    it('should be able to relayout', function(done) {
        var restyleCnt = 0,
            relayoutCnt = 0;

        gd.on('plotly_restyle', function() {
            restyleCnt++;
        });

        gd.on('plotly_relayout', function() {
            relayoutCnt++;
        });

        function assertLayout(center, zoom, dims) {
            var mapInfo = getMapInfo(gd);

            expect([mapInfo.center.lng, mapInfo.center.lat])
                .toBeCloseToArray(center);
            expect(mapInfo.zoom).toBeCloseTo(zoom);

            var divStyle = mapInfo.div.style;
            ['left', 'top', 'width', 'height'].forEach(function(p, i) {
                expect(parseFloat(divStyle[p])).toBeWithin(dims[i], 8);
            });
        }

        assertLayout([-4.710, 19.475], 1.234, [80, 100, 908, 270]);

        Plotly.relayout(gd, 'mapbox.center', { lon: 0, lat: 0 }).then(function() {
            expect(restyleCnt).toEqual(0);
            expect(relayoutCnt).toEqual(1);

            assertLayout([0, 0], 1.234, [80, 100, 908, 270]);

            return Plotly.relayout(gd, 'mapbox.zoom', '6');
        })
        .then(function() {
            expect(restyleCnt).toEqual(0);
            expect(relayoutCnt).toEqual(2);

            assertLayout([0, 0], 6, [80, 100, 908, 270]);

            return Plotly.relayout(gd, 'mapbox.domain.x', [0, 0.5]);
        })
        .then(function() {
            expect(restyleCnt).toEqual(0);
            expect(relayoutCnt).toEqual(3);

            assertLayout([0, 0], 6, [80, 100, 454, 270]);

            return Plotly.relayout(gd, 'mapbox.domain.y[0]', 0.5);
        })
        .then(function() {
            expect(restyleCnt).toEqual(0);
            expect(relayoutCnt).toEqual(4);

            assertLayout([0, 0], 6, [80, 100, 454, 135]);
        })
        .catch(failTest)
        .then(done);
    }, LONG_TIMEOUT_INTERVAL);

    it('should be able to relayout the map style', function(done) {
        function assertLayout(style) {
            var mapInfo = getMapInfo(gd);
            expect(mapInfo.style.name).toEqual(style);
        }

        assertLayout('Mapbox Dark');

        Plotly.relayout(gd, 'mapbox.style', 'light').then(function() {
            assertLayout('Mapbox Light');

            return Plotly.relayout(gd, 'mapbox.style', 'dark');
        })
        .then(function() {
            assertLayout('Mapbox Dark');
        })
        .catch(failTest)
        .then(done);
    }, LONG_TIMEOUT_INTERVAL);

    it('should be able to add, update and remove layers', function(done) {
        var mockWithLayers = require('@mocks/mapbox_layers');

        var layer0 = Lib.extendDeep({}, mockWithLayers.layout.mapbox.layers[0]),
            layer1 = Lib.extendDeep({}, mockWithLayers.layout.mapbox.layers[1]);

        var mapUpdate = {
            'mapbox.zoom': mockWithLayers.layout.mapbox.zoom,
            'mapbox.center.lon': mockWithLayers.layout.mapbox.center.lon,
            'mapbox.center.lat': mockWithLayers.layout.mapbox.center.lat
        };

        var styleUpdate0 = {
            'mapbox.layers[0].color': 'red',
            'mapbox.layers[0].fill.outlinecolor': 'blue',
            'mapbox.layers[0].opacity': 0.3
        };

        var styleUpdate1 = {
            'mapbox.layers[1].color': 'blue',
            'mapbox.layers[1].line.width': 3,
            'mapbox.layers[1].opacity': 0.6
        };

        function countVisibleLayers(gd) {
            var mapInfo = getMapInfo(gd);

            var sourceLen = mapInfo.layoutSources.length,
                layerLen = mapInfo.layoutLayers.length;

            if(sourceLen !== layerLen) return null;

            return layerLen;
        }

        function getLayerLength(gd) {
            return (gd.layout.mapbox.layers || []).length;
        }

        function assertLayerStyle(gd, expectations, index) {
            var mapInfo = getMapInfo(gd),
                layers = mapInfo.layers,
                layerNames = mapInfo.layoutLayers;

            var layer = layers[layerNames[index]];
            expect(layer).toBeDefined(layerNames[index]);

            return new Promise(function(resolve) {
                setTimeout(function() {
                    Object.keys(expectations).forEach(function(k) {
                        try {
                            var obj = layer.paint._values[k].value.value;
                            expect(String(obj)).toBe(String(expectations[k]), k);
                        } catch(e) {
                            fail('could not find paint values in layer');
                        }
                    });
                    resolve();
                }, TRANSITION_DELAY);
            });
        }

        expect(countVisibleLayers(gd)).toEqual(0);

        Plotly.relayout(gd, 'mapbox.layers[0]', layer0).then(function() {
            expect(getLayerLength(gd)).toEqual(1);
            expect(countVisibleLayers(gd)).toEqual(1);

            // add a new layer at the beginning
            return Plotly.relayout(gd, 'mapbox.layers[1]', layer1);
        })
        .then(function() {
            expect(getLayerLength(gd)).toEqual(2);
            expect(countVisibleLayers(gd)).toEqual(2);

            return Plotly.relayout(gd, mapUpdate);
        })
        .then(function() {
            expect(getLayerLength(gd)).toEqual(2);
            expect(countVisibleLayers(gd)).toEqual(2);

            return Plotly.relayout(gd, styleUpdate0);
        })
        .then(function() {
            expect(getLayerLength(gd)).toEqual(2);
            expect(countVisibleLayers(gd)).toEqual(2);

            return assertLayerStyle(gd, {
                'fill-color': 'rgba(255,0,0,1)',
                'fill-outline-color': 'rgba(0,0,255,1)',
                'fill-opacity': 0.3
            }, 0);
        })
        .then(function() {
            expect(getLayerLength(gd)).toEqual(2);
            expect(countVisibleLayers(gd)).toEqual(2);

            return Plotly.relayout(gd, styleUpdate1);
        })
        .then(function() {
            expect(getLayerLength(gd)).toEqual(2);
            expect(countVisibleLayers(gd)).toEqual(2);

            return assertLayerStyle(gd, {
                'line-width': 3,
                'line-color': 'rgba(0,0,255,1)',
                'line-opacity': 0.6
            }, 1);
        })
        .then(function() {
            expect(getLayerLength(gd)).toEqual(2);
            expect(countVisibleLayers(gd)).toEqual(2);

            // delete the first layer
            return Plotly.relayout(gd, 'mapbox.layers[0]', null);
        })
        .then(function() {
            expect(getLayerLength(gd)).toEqual(1);
            expect(countVisibleLayers(gd)).toEqual(1);

            return Plotly.relayout(gd, 'mapbox.layers[0]', null);
        })
        .then(function() {
            expect(getLayerLength(gd)).toEqual(0);
            expect(countVisibleLayers(gd)).toEqual(0);

            return Plotly.relayout(gd, 'mapbox.layers[0]', {});
        })
        .then(function() {
            expect(gd.layout.mapbox.layers).toEqual([{}]);
            expect(countVisibleLayers(gd)).toEqual(0);

            // layer with no source are not drawn

            return Plotly.relayout(gd, 'mapbox.layers[0].source', layer0.source);
        })
        .then(function() {
            expect(getLayerLength(gd)).toEqual(1);
            expect(countVisibleLayers(gd)).toEqual(1);
        })
        .catch(failTest)
        .then(done);
    }, LONG_TIMEOUT_INTERVAL);

    it('should be able to update the access token', function(done) {
        Plotly.relayout(gd, 'mapbox.accesstoken', 'wont-work').catch(function(err) {
            expect(gd._fullLayout.mapbox.accesstoken).toEqual('wont-work');
            expect(err).toEqual(new Error(constants.mapOnErrorMsg));
            expect(gd._promises.length).toEqual(1);

            return Plotly.relayout(gd, 'mapbox.accesstoken', MAPBOX_ACCESS_TOKEN);
        }).then(function() {
            expect(gd._fullLayout.mapbox.accesstoken).toEqual(MAPBOX_ACCESS_TOKEN);
            expect(gd._promises.length).toEqual(0);
        })
        .catch(failTest)
        .then(done);
    }, LONG_TIMEOUT_INTERVAL);

    it('should be able to update traces', function(done) {
        function assertDataPts(lengths) {
            var lines = getGeoJsonData(gd, 'lines'),
                markers = getGeoJsonData(gd, 'markers');

            lines.forEach(function(obj, i) {
                expect(obj.coordinates[0].length).toEqual(lengths[i]);
            });

            markers.forEach(function(obj, i) {
                expect(obj.features.length).toEqual(lengths[i]);
            });
        }

        assertDataPts([3, 3]);

        var update = {
            lon: [[10, 20]],
            lat: [[-45, -20]]
        };

        Plotly.restyle(gd, update, [1]).then(function() {
            assertDataPts([3, 2]);

            var update = {
                lon: [ [10, 20], [30, 40, 20] ],
                lat: [ [-10, 20], [10, 20, 30] ]
            };

            return Plotly.extendTraces(gd, update, [0, 1]);
        })
        .then(function() {
            assertDataPts([5, 5]);
        })
        .catch(failTest)
        .then(done);
    }, LONG_TIMEOUT_INTERVAL);

    it('should display to hover labels on mouse over', function(done) {
        function assertMouseMove(pos, len) {
            return _mouseEvent('mousemove', pos, function() {
                var hoverLabels = d3.select('.hoverlayer').selectAll('g');

                expect(hoverLabels.size()).toEqual(len);
            });
        }

        assertMouseMove(blankPos, 0).then(function() {
            return assertMouseMove(pointPos, 1);
        })
        .then(function() {
            return Plotly.restyle(gd, {
                'hoverlabel.bgcolor': 'yellow',
                'hoverlabel.font.size': [[20, 10, 30]]
            });
        })
        .then(function() {
            return assertMouseMove(pointPos, 1);
        })
        .then(function() {
            assertHoverLabelStyle(d3.select('g.hovertext'), {
                bgcolor: 'rgb(255, 255, 0)',
                bordercolor: 'rgb(68, 68, 68)',
                fontSize: 20,
                fontFamily: 'Arial',
                fontColor: 'rgb(68, 68, 68)'
            });
            assertHoverLabelContent({
                nums: '(10°, 10°)',
                name: 'trace 0'
            });
        })
        .catch(failTest)
        .then(done);
    }, LONG_TIMEOUT_INTERVAL);

    it('should respond to hover interactions by', function(done) {
        var hoverCnt = 0,
            unhoverCnt = 0;

        var hoverData, unhoverData;

        gd.on('plotly_hover', function(eventData) {
            hoverCnt++;
            hoverData = eventData.points[0];
        });

        gd.on('plotly_unhover', function(eventData) {
            unhoverCnt++;
            unhoverData = eventData.points[0];
        });

        _mouseEvent('mousemove', blankPos, function() {
            expect(hoverData).toBe(undefined, 'not firing on blank points');
            expect(unhoverData).toBe(undefined, 'not firing on blank points');
        })
        .then(function() {
            return _mouseEvent('mousemove', pointPos, function() {
                expect(hoverData).not.toBe(undefined, 'firing on data points');
                expect(Object.keys(hoverData)).toEqual([
                    'data', 'fullData', 'curveNumber', 'pointNumber', 'pointIndex', 'lon', 'lat'
                ], 'returning the correct event data keys');
                expect(hoverData.curveNumber).toEqual(0, 'returning the correct curve number');
                expect(hoverData.pointNumber).toEqual(0, 'returning the correct point number');
            });
        })
        .then(function() {
            return _mouseEvent('mousemove', blankPos, function() {
                expect(unhoverData).not.toBe(undefined, 'firing on data points');
                expect(Object.keys(unhoverData)).toEqual([
                    'data', 'fullData', 'curveNumber', 'pointNumber', 'pointIndex', 'lon', 'lat'
                ], 'returning the correct event data keys');
                expect(unhoverData.curveNumber).toEqual(0, 'returning the correct curve number');
                expect(unhoverData.pointNumber).toEqual(0, 'returning the correct point number');
            });
        })
        .then(function() {
            expect(hoverCnt).toEqual(1);
            expect(unhoverCnt).toEqual(1);
        })
        .catch(failTest)
        .then(done);
    }, LONG_TIMEOUT_INTERVAL);

    it('should respond drag / scroll / double-click interactions', function(done) {
        var relayoutCnt = 0;
        var doubleClickCnt = 0;
        var updateData;

        gd.on('plotly_relayout', function(eventData) {
            relayoutCnt++;
            updateData = eventData;
        });

        gd.on('plotly_doubleclick', function() {
            doubleClickCnt++;
        });

        function assertLayout(center, zoom, opts) {
            var mapInfo = getMapInfo(gd),
                layout = gd.layout.mapbox;

            expect([mapInfo.center.lng, mapInfo.center.lat]).toBeCloseToArray(center);
            expect(mapInfo.zoom).toBeCloseTo(zoom);

            expect([layout.center.lon, layout.center.lat]).toBeCloseToArray(center);
            expect(layout.zoom).toBeCloseTo(zoom);

            if(opts && opts.withUpdateData) {
                var mapboxUpdate = updateData.mapbox;

                expect([mapboxUpdate.center.lon, mapboxUpdate.center.lat]).toBeCloseToArray(center);
                expect(mapboxUpdate.zoom).toBeCloseTo(zoom);
            }
        }

        assertLayout([-4.710, 19.475], 1.234);

        var p1 = [pointPos[0] + 50, pointPos[1] - 20];

        _drag(pointPos, p1, function() {
            expect(relayoutCnt).toEqual(1);
            assertLayout([-19.651, 13.751], 1.234, {withUpdateData: true});

            return _doubleClick(p1);
        })
        .then(function() {
            expect(doubleClickCnt).toBe(1, 'double click cnt');
            assertLayout([-4.710, 19.475], 1.234);
        })
        .catch(failTest)
        .then(done);

        // TODO test scroll

    }, LONG_TIMEOUT_INTERVAL);

    it('should respond to click interactions by', function(done) {
        var ptData;

        gd.on('plotly_click', function(eventData) {
            ptData = eventData.points[0];
        });

        _click(blankPos, function() {
            expect(ptData).toBe(undefined, 'not firing on blank points');
        })
        .then(function() {
            return _click(pointPos, function() {
                expect(ptData).not.toBe(undefined, 'firing on data points');
                expect(Object.keys(ptData)).toEqual([
                    'data', 'fullData', 'curveNumber', 'pointNumber', 'pointIndex', 'lon', 'lat'
                ], 'returning the correct event data keys');
                expect(ptData.curveNumber).toEqual(0, 'returning the correct curve number');
                expect(ptData.pointNumber).toEqual(0, 'returning the correct point number');
            });
        })
        .catch(failTest)
        .then(done);
    }, LONG_TIMEOUT_INTERVAL);

    function getMapInfo(gd) {
        var subplot = gd._fullLayout.mapbox._subplot,
            map = subplot.map;

        var sources = map.style.sourceCaches,
            layers = map.style._layers,
            uid = subplot.uid;

        var traceSources = Object.keys(sources).filter(function(k) {
            return k.indexOf('-source-') !== -1;
        });

        var traceLayers = Object.keys(layers).filter(function(k) {
            return k.indexOf('-layer-') !== -1;
        });

        var layoutSources = Object.keys(sources).filter(function(k) {
            return k.indexOf(uid) !== -1;
        });

        var layoutLayers = Object.keys(layers).filter(function(k) {
            return k.indexOf(uid) !== -1;
        });

        return {
            map: map,
            div: subplot.div,
            sources: sources,
            layers: layers,
            traceSources: traceSources,
            traceLayers: traceLayers,
            layoutSources: layoutSources,
            layoutLayers: layoutLayers,
            center: map.getCenter(),
            zoom: map.getZoom(),
            style: map.getStyle()
        };
    }

    function countVisibleTraces(gd, modes) {
        var mapInfo = getMapInfo(gd),
            cnts = [];

        // 'modes' are the ScatterMapbox layers names
        // e.g. 'fill', 'line', 'circle', 'symbol'

        modes.forEach(function(mode) {
            var cntPerMode = 0;

            mapInfo.traceLayers.forEach(function(l) {
                var info = mapInfo.layers[l];

                if(l.indexOf(mode) === -1) return;
                if(info.visibility === 'visible') cntPerMode++;
            });

            cnts.push(cntPerMode);
        });

        var cnt = cnts.reduce(function(a, b) {
            return (a === b) ? a : null;
        });

        // returns null if not all counter per mode are the same,
        // returns the counter if all are the same.

        return cnt;
    }

    function getStyle(gd, mode, prop) {
        var mapInfo = getMapInfo(gd),
            values = [];

        mapInfo.traceLayers.forEach(function(l) {
            var info = mapInfo.layers[l];

            if(l.indexOf(mode) === -1) return;

            values.push(info.paint._values[prop].value.value);
        });

        return values;
    }

    function getGeoJsonData(gd, mode) {
        var mapInfo = getMapInfo(gd),
            out = [];

        mapInfo.traceSources.forEach(function(s) {
            var info = mapInfo.sources[s];

            if(s.indexOf(mode) === -1) return;

            out.push(info._data);
        });

        return out;
    }

    function _mouseEvent(type, pos, cb) {
        return new Promise(function(resolve) {
            mouseEvent(type, pos[0], pos[1]);

            setTimeout(function() {
                cb();
                resolve();
            }, MOUSE_DELAY);
        });
    }

    function _click(pos, cb) {
        var promise = _mouseEvent('mousemove', pos, noop).then(function() {
            return _mouseEvent('mousedown', pos, noop);
        }).then(function() {
            return _mouseEvent('click', pos, cb);
        });

        return promise;
    }

    function _doubleClick(pos) {
        return _mouseEvent('dblclick', pos, noop);
    }

    function _drag(p0, p1, cb) {
        var promise = _mouseEvent('mousemove', p0, noop).then(function() {
            return _mouseEvent('mousedown', p0, noop);
        }).then(function() {
            return _mouseEvent('mousemove', p1, noop);
        }).then(function() {
            // repeat mousemove to simulate long dragging motion
            return _mouseEvent('mousemove', p1, noop);
        }).then(function() {
            return _mouseEvent('mouseup', p1, noop);
        }).then(function() {
            return _mouseEvent('mouseup', p1, noop);
        }).then(cb);

        return promise;
    }
});

describe('@noCI, mapbox toImage', function() {
    // decreased from 1e5 - perhaps chrome got better at encoding these
    // because I get 99330 and the image still looks correct
    var MINIMUM_LENGTH = 7e4;

    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(function() {
        Plotly.purge(gd);
        Plotly.setPlotConfig({ mapboxAccessToken: null });
        destroyGraphDiv();
    });

    it('should generate image data with global credentials', function(done) {
        Plotly.setPlotConfig({
            mapboxAccessToken: MAPBOX_ACCESS_TOKEN
        });

        Plotly.newPlot(gd, [{
            type: 'scattermapbox',
            lon: [0, 10, 20],
            lat: [-10, 10, -10]
        }])
        .then(function() {
            return Plotly.toImage(gd);
        })
        .then(function(imgData) {
            expect(imgData.length).toBeGreaterThan(MINIMUM_LENGTH);
        })
        .catch(failTest)
        .then(done);
    }, LONG_TIMEOUT_INTERVAL);

    it('should generate image data with config credentials', function(done) {
        Plotly.newPlot(gd, [{
            type: 'scattermapbox',
            lon: [0, 10, 20],
            lat: [-10, 10, -10]
        }], {}, {
            mapboxAccessToken: MAPBOX_ACCESS_TOKEN
        })
        .then(function() {
            return Plotly.toImage(gd);
        })
        .then(function(imgData) {
            expect(imgData.length).toBeGreaterThan(MINIMUM_LENGTH);
        })
        .catch(failTest)
        .then(done);
    }, LONG_TIMEOUT_INTERVAL);

    it('should generate image data with layout credentials', function(done) {
        Plotly.newPlot(gd, [{
            type: 'scattermapbox',
            lon: [0, 10, 20],
            lat: [-10, 10, -10]
        }], {
            mapbox: {
                accesstoken: MAPBOX_ACCESS_TOKEN
            }
        })
        .then(function() {
            return Plotly.toImage(gd);
        })
        .then(function(imgData) {
            expect(imgData.length).toBeGreaterThan(MINIMUM_LENGTH);
        })
        .catch(failTest)
        .then(done);
    }, LONG_TIMEOUT_INTERVAL);
});
