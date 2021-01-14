var Plotly = require('@lib');
var Lib = require('@src/lib');
var Fx = require('@src/components/fx');

var constants = require('@src/plots/mapbox/constants');
var supplyLayoutDefaults = require('@src/plots/mapbox/layout_defaults');

var d3Select = require('../../strict-d3').select;
var d3SelectAll = require('../../strict-d3').selectAll;
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var mouseEvent = require('../assets/mouse_event');
var click = require('../assets/click');
var delay = require('../assets/delay');

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
        expect(layoutOut.mapbox.layers).toEqual([jasmine.objectContaining({
            sourcetype: 'geojson',
            _index: 0
        }), jasmine.objectContaining({
            visible: false
        }), jasmine.objectContaining({
            visible: false
        }), jasmine.objectContaining({
            sourcetype: 'geojson',
            _index: 3
        })]);
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

    it('should not allow to set layer type other than *raster* for sourcetype value *raster* and *image*', function() {
        spyOn(Lib, 'log');

        layoutIn = {
            mapbox: {
                layers: [{
                    sourcetype: 'raster',
                    source: 'url',
                    type: 'circle'
                }, {
                    sourcetype: 'image',
                    source: 'url',
                    type: 'fill'
                }]
            }
        };
        supplyLayoutDefaults(layoutIn, layoutOut, fullData);

        expect(Lib.log).toHaveBeenCalledTimes(2);
        expect(Lib.log).toHaveBeenCalledWith('Source types *raster* and *image* must drawn *raster* layer type.');

        expect(layoutOut.mapbox.layers[0].type).toBe('raster');
        expect(layoutOut.mapbox.layers[1].type).toBe('raster');
    });

    it('should default layer with sourcetype *raster* and *image* to type *raster', function() {
        spyOn(Lib, 'log');

        layoutIn = {
            mapbox: {
                layers: [{
                    sourcetype: 'raster',
                    source: 'url'
                }, {
                    sourcetype: 'image',
                    source: 'url'
                }]
            }
        };
        supplyLayoutDefaults(layoutIn, layoutOut, fullData);

        expect(Lib.log).toHaveBeenCalledTimes(0);
        expect(layoutOut.mapbox.layers[0].type).toBe('raster');
        expect(layoutOut.mapbox.layers[1].type).toBe('raster');
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
    var gd;

    var dummyToken = 'asfdsa124331wersdsa1321q3';

    var osmStyle = {
        id: 'osm',
        version: 8,
        sources: {
            'osm-tiles': {
                type: 'raster',
                tiles: [
                    'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
                    'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png'
                ],
                tileSize: 256
            }
        },
        layers: [{
            id: 'osm-tiles',
            type: 'raster',
            source: 'osm-tiles',
            minzoom: 0,
            maxzoom: 22
        }]
    };

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

    it('@gl should throw error when no non-mapbox style is set and missing a mapbox access token token', function() {
        spyOn(Lib, 'error');

        expect(function() {
            Plotly.newPlot(gd, [{
                type: 'scattermapbox',
                lon: [10, 20, 30],
                lat: [10, 20, 30]
            }]);
        }).toThrow(new Error(constants.missingStyleErrorMsg));

        expect(Lib.error).toHaveBeenCalledWith(constants.missingStyleErrorMsg);
    }, LONG_TIMEOUT_INTERVAL);

    it('@gl should throw error when setting a Mapbox style w/o a registered token', function() {
        spyOn(Lib, 'error');

        expect(function() {
            Plotly.newPlot(gd, [{
                type: 'scattermapbox',
                lon: [10, 20, 30],
                lat: [10, 20, 30]
            }], {
                mapbox: {style: 'basic'}
            });
        }).toThrow(new Error(constants.noAccessTokenErrorMsg));

        expect(Lib.error).toHaveBeenCalledWith('Uses Mapbox map style, but did not set an access token.');
    }, LONG_TIMEOUT_INTERVAL);

    it('@gl should throw error if token is invalid', function(done) {
        var cnt = 0;

        Plotly.newPlot(gd, [{
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

    it('@gl should use access token in mapbox layout options if present', function(done) {
        var cnt = 0;

        Plotly.newPlot(gd, [{
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

    it('@gl should warn when multiple tokens in mapbox layout options are present', function(done) {
        spyOn(Lib, 'warn');
        var cnt = 0;

        Plotly.newPlot(gd, [{
            type: 'scattermapbox',
            lon: [10, 20, 30],
            lat: [10, 20, 30]
        }, {
            type: 'scattermapbox',
            lon: [10, 20, 30],
            lat: [10, 20, 30],
            subplot: 'mapbox2'
        }], {
            mapbox: { accesstoken: MAPBOX_ACCESS_TOKEN },
            mapbox2: { accesstoken: dummyToken }
        }).catch(function() {
            cnt++;
        }).then(function() {
            expect(cnt).toEqual(0);
            expect(gd._fullLayout.mapbox.accesstoken).toEqual(MAPBOX_ACCESS_TOKEN);
            expect(Lib.warn).toHaveBeenCalledWith(constants.multipleTokensErrorMsg);
            done();
        });
    }, LONG_TIMEOUT_INTERVAL);

    it('@gl should not throw when using a custom non-mapbox style', function(done) {
        var cnt = 0;

        Plotly.newPlot(gd, [{
            type: 'scattermapbox',
            lon: [10, 20, 30],
            lat: [10, 20, 30]
        }], {
            mapbox: { style: osmStyle }
        }).catch(function() {
            cnt++;
        }).then(function() {
            expect(cnt).toEqual(0);
            expect(gd._fullLayout.mapbox.accesstoken).toBe(undefined);
            done();
        });
    }, LONG_TIMEOUT_INTERVAL);

    it('@gl should not throw when using a custom mapbox style URL with an access token in the layout', function(done) {
        var cnt = 0;

        Plotly.newPlot(gd, [{
            type: 'scattermapbox',
            lon: [10, 20, 30],
            lat: [10, 20, 30]
        }], {
            mapbox: {
                accesstoken: MAPBOX_ACCESS_TOKEN,
                style: 'mapbox://styles/plotly-js-tests/ck4og36lx0vnj1cpdl8y0cr8m'
            }
        }).catch(function() {
            cnt++;
        }).then(function() {
            expect(cnt).toEqual(0);
            expect(gd._fullLayout.mapbox.accesstoken).toBe(MAPBOX_ACCESS_TOKEN);
            done();
        });
    }, LONG_TIMEOUT_INTERVAL);

    it('@gl should log when an access token is set while using a custom non-mapbox style', function(done) {
        spyOn(Lib, 'log');
        var cnt = 0;

        Plotly.newPlot(gd, [{
            type: 'scattermapbox',
            lon: [10, 20, 30],
            lat: [10, 20, 30]
        }], {
            mapbox: {
                style: osmStyle,
                accesstoken: MAPBOX_ACCESS_TOKEN
            }
        }).catch(function() {
            cnt++;
        }).then(function() {
            expect(cnt).toEqual(0);
            expect(Lib.log).toHaveBeenCalledWith([
                'Listed mapbox access token(s)',
                MAPBOX_ACCESS_TOKEN,
                'but did not use a Mapbox map style, ignoring token(s).'
            ].join(' '));
            done();
        });
    }, LONG_TIMEOUT_INTERVAL);

    it('@gl should bypass access token in mapbox layout options when config points to an Atlas server', function(done) {
        var cnt = 0;
        var msg = [
            'An API access token is required to use Mapbox GL.',
            'See https://www.mapbox.com/api-documentation/#access-tokens-and-token-scopes'
        ].join(' ');

        // TODO potential new way of doing this:
        // https://github.com/mapbox/mapbox-gl-js/pull/7594
        //
        // https://www.mapbox.com/atlas/#developing-with-atlas

        Plotly.newPlot(gd, [{
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
            // Note that we get an error here on `new mapboxgl.Map`
            // as we don't have an Atlas server running.
            //
            // In essence, we test that the `new mapboxgl.Map` throws
            // as oppose to `findAccessToken`
            expect(err).toEqual(new Error(msg));
        })
        .then(function() {
            expect(cnt).toEqual(1);
            done();
        });
    }, LONG_TIMEOUT_INTERVAL);
});

describe('mapbox plots', function() {
    var mock = require('@mocks/mapbox_0.json');
    var gd;

    var pointPos = [579, 276];
    var blankPos = [650, 120];

    beforeEach(function(done) {
        gd = createGraphDiv();

        var mockCopy = Lib.extendDeep({}, mock);

        Plotly.newPlot(gd, mockCopy.data, mockCopy.layout).then(done);
    });

    afterEach(function() {
        Plotly.purge(gd);
        destroyGraphDiv();
    });

    it('@gl should be able to toggle trace visibility', function(done) {
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
        })
        .then(done, done.fail);
    }, LONG_TIMEOUT_INTERVAL);

    it('@gl should be able to delete and add traces', function(done) {
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
        })
        .then(done, done.fail);
    }, LONG_TIMEOUT_INTERVAL);

    it('@gl should not update center while dragging', function(done) {
        var map = gd._fullLayout.mapbox._subplot.map;
        spyOn(map, 'setCenter').and.callThrough();

        var p1 = [pointPos[0] + 50, pointPos[1] - 20];

        _mouseEvent('mousemove', pointPos, noop).then(function() {
            return Plotly.relayout(gd, {'mapbox.center': {lon: 13.5, lat: -19.5}});
        }).then(function() {
            // First relayout on mapbox.center results in setCenter call
            expect(map.setCenter).toHaveBeenCalledWith([13.5, -19.5]);
            expect(map.setCenter).toHaveBeenCalledTimes(1);
        }).then(function() {
            return _mouseEvent('mousedown', pointPos, noop);
        }).then(function() {
            return _mouseEvent('mousemove', p1, noop);
        }).then(function() {
            return Plotly.relayout(gd, {'mapbox.center': {lat: 0, lon: 0}});
        }).then(function() {
            return _mouseEvent('mouseup', p1, noop);
        }).then(function() {
            // Second relayout on mapbox.center does not result in a setCenter
            // call since map drag is underway
            expect(map.setCenter).toHaveBeenCalledTimes(1);
        }).then(done, done.fail);
    }, LONG_TIMEOUT_INTERVAL);

    it('@gl should not update zoom while scroll wheeling', function(done) {
        var map = gd._fullLayout.mapbox._subplot.map;
        spyOn(map, 'setZoom').and.callThrough();

        _mouseEvent('mousemove', pointPos, noop).then(function() {
            return Plotly.relayout(gd, {'mapbox.zoom': 5});
        }).then(function() {
            // First relayout on mapbox.zoom results in setZoom call
            expect(map.setZoom).toHaveBeenCalledWith(5);
            expect(map.setZoom).toHaveBeenCalledTimes(1);
        }).then(function() {
            mouseEvent('scroll', pointPos[0], pointPos[1], {deltaY: -400});
            return Plotly.relayout(gd, {'mapbox.zoom': 2}).then(function() {
                // Second relayout on mapbox.zoom does not result in setZoom
                // call since a scroll wheel zoom is underway
                expect(map.setZoom).toHaveBeenCalledTimes(1);
            });
        }).then(done, done.fail);
    }, LONG_TIMEOUT_INTERVAL);

    it('@gl should be able to restyle', function(done) {
        var restyleCnt = 0;
        var relayoutCnt = 0;

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
        .then(done, done.fail);
    }, LONG_TIMEOUT_INTERVAL);

    it('@gl should be able to relayout', function(done) {
        var restyleCnt = 0;
        var relayoutCnt = 0;

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

        Plotly.relayout(gd, 'mapbox.center', { lon: 0, lat: 0 })
        .then(function() {
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
        .then(done, done.fail);
    }, LONG_TIMEOUT_INTERVAL);

    it('@gl should be able to relayout the map style', function(done) {
        function assertLayout(style) {
            var mapInfo = getMapInfo(gd);
            expect(mapInfo.style.name).toEqual(style);
        }

        // TODO
        // this one now logs:
        // 'Unable to perform style diff: Unimplemented: setSprite..  Rebuilding the style from scratch.'
        // https://github.com/mapbox/mapbox-gl-js/issues/6933

        assertLayout('Mapbox Dark');

        Plotly.relayout(gd, 'mapbox.style', 'light')
        .then(function() {
            assertLayout('Mapbox Light');

            return Plotly.relayout(gd, 'mapbox.style', 'dark');
        })
        .then(function() {
            assertLayout('Mapbox Dark');
        })
        .then(done, done.fail);
    }, LONG_TIMEOUT_INTERVAL);

    it('@gl should be able to add, update and remove layers', function(done) {
        var mockWithLayers = require('@mocks/mapbox_layers');

        var layer0 = Lib.extendDeep({}, mockWithLayers.layout.mapbox.layers[0]);
        var layer1 = Lib.extendDeep({}, mockWithLayers.layout.mapbox.layers[1]);

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

            var sourceLen = mapInfo.layoutSources.length;
            var layerLen = mapInfo.layoutLayers.length;

            if(sourceLen !== layerLen) return null;

            return layerLen;
        }

        function getLayerLength(gd) {
            return Lib.filterVisible(gd._fullLayout.mapbox.layers || []).length;
        }

        function assertLayerStyle(gd, expectations, index) {
            var mapInfo = getMapInfo(gd);
            var layers = mapInfo.layers;
            var layerNames = mapInfo.layoutLayers;

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

        Plotly.relayout(gd, 'mapbox.layers[0]', layer0)
        .then(function() {
            expect(getLayerLength(gd)).toEqual(1);
            expect(countVisibleLayers(gd)).toEqual(1);

            // add a new layer at the beginning
            return Plotly.relayout(gd, 'mapbox.layers[1]', layer1);
        })
        .then(function() {
            expect(getLayerLength(gd)).toEqual(2);
            expect(countVisibleLayers(gd)).toEqual(2);

            // hide a layer
            return Plotly.relayout(gd, 'mapbox.layers[0].visible', false);
        })
        .then(function() {
            expect(getLayerLength(gd)).toEqual(1);
            expect(countVisibleLayers(gd)).toEqual(1);

            // re-show it
            return Plotly.relayout(gd, 'mapbox.layers[0].visible', true);
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
        .then(done, done.fail);
    }, LONG_TIMEOUT_INTERVAL);

    it('@gl should be able to update layer image', function(done) {
        var coords = [
            [-80.425, 46.437],
            [-71.516, 46.437],
            [-71.516, 37.936],
            [-80.425, 37.936]
        ];
        function makeFigure(source) {
            return {
                data: [{type: 'scattermapbox'}],
                layout: {
                    mapbox: {
                        layers: [{
                            'sourcetype': 'raster',
                            'source': ['https://a.tile.openstreetmap.org/{z}/{x}/{y}.png'],
                            'below': 'traces',
                        }, {
                            'sourcetype': 'image',
                            'coordinates': coords,
                            'source': source,
                            'below': 'traces',
                        }],
                    }
                }
            };
        }

        var map = null;
        var layerSource = null;

        // Single pixel PNGs generated with http://png-pixel.com/
        var prefix = 'data:image/png;base64,';
        var redImage = prefix + 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42m' +
            'P8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';
        var greenImage = prefix + 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42m' +
            'Nk+M/wHwAEBgIApD5fRAAAAABJRU5ErkJggg==';

        Plotly.react(gd, makeFigure(redImage)).then(function() {
            var mapbox = gd._fullLayout.mapbox._subplot;
            map = mapbox.map;
            layerSource = map.getSource(mapbox.layerList[1].idSource);

            spyOn(layerSource, 'updateImage').and.callThrough();
            spyOn(map, 'removeSource').and.callThrough();
            return Plotly.react(gd, makeFigure(greenImage));
        })
        .then(function() {
            expect(layerSource.updateImage).toHaveBeenCalledWith(
                {url: greenImage, coordinates: coords}
            );
            expect(map.removeSource).not.toHaveBeenCalled();

            // Check order of layers
            var mapbox = gd._fullLayout.mapbox._subplot;
            var mapboxLayers = mapbox.getMapLayers();
            var plotlyjsLayers = mapbox.layerList;

            var indexLower = mapboxLayers.findIndex(function(layer) {
                return layer.id === 'plotly-layout-layer-' + plotlyjsLayers[0].uid;
            });

            var indexUpper = mapboxLayers.findIndex(function(layer) {
                return layer.id === 'plotly-layout-layer-' + plotlyjsLayers[1].uid;
            });

            expect(indexLower).toBeGreaterThan(-1);
            expect(indexUpper).toBeGreaterThan(0);
            expect(indexUpper).toBe(indexLower + 1);
        })
        .then(done, done.fail);
    }, LONG_TIMEOUT_INTERVAL);

    it('@gl should be able to react to layer changes', function(done) {
        function makeFigure(color) {
            return {
                data: [{type: 'scattermapbox'}],
                layout: {
                    mapbox: {
                        layers: [{
                            color: color,
                            sourcetype: 'geojson',
                            type: 'fill',
                            source: {
                                type: 'Feature',
                                properties: {},
                                geometry: {
                                    type: 'Polygon',
                                    coordinates: [[
                                        [174.74475860595703, -36.86533886128865],
                                        [174.77737426757812, -36.86533886128865],
                                        [174.77737426757812, -36.84913134182603],
                                        [174.74475860595703, -36.84913134182603],
                                        [174.74475860595703, -36.86533886128865]
                                    ]]
                                }
                            }
                        }]
                    }
                }
            };
        }

        function _assert(color) {
            var mapInfo = getMapInfo(gd);
            var layer = mapInfo.layers[mapInfo.layoutLayers[0]];

            expect(mapInfo.layoutLayers.length).toBe(1, 'one layer');
            expect(mapInfo.layoutSources.length).toBe(1, 'one layer source');
            expect(String(layer.paint._values['fill-color'].value.value)).toBe(color, 'layer color');
        }

        // TODO
        // this one now logs:
        // 'Unable to perform style diff: Unimplemented: setSprite, setLayerProperty..  Rebuilding the style from scratch.'
        // github.com/mapbox/mapbox-gl-js/issues/6933/

        Plotly.react(gd, makeFigure('blue')).then(function() {
            _assert('rgba(0,0,255,1)');
            return Plotly.react(gd, makeFigure('red'));
        })
        .then(function() {
            _assert('rgba(255,0,0,1)');
        })
        .then(done, done.fail);
    }, LONG_TIMEOUT_INTERVAL);

    it('@gl should not wedge graph after reacting to invalid layer', function(done) {
        Plotly.react(gd, [{type: 'scattermapbox'}], {
            mapbox: {
                layers: [{ source: 'invalid' }]
            }
        })
        .then(function() {
            fail('The above Plotly.react promise should be rejected');
        })
        .catch(function() {
            expect(gd._promises.length).toBe(1, 'has 1 rejected promise in queue');
        })
        .then(function() {
            return Plotly.react(gd, [{type: 'scattermapbox'}], {
                mapbox: {
                    layers: [{
                        sourcetype: 'vector',
                        sourcelayer: 'contour',
                        source: 'mapbox://mapbox.mapbox-terrain-v2'
                    }]
                }
            });
        })
        .then(function() {
            expect(gd._promises.length).toBe(0, 'rejected promise has been cleared');

            var mapInfo = getMapInfo(gd);
            expect(mapInfo.layoutLayers.length).toBe(1, 'one layer');
            expect(mapInfo.layoutSources.length).toBe(1, 'one layer source');
        })
        .then(done, done.fail);
    }, LONG_TIMEOUT_INTERVAL);

    it('@gl should not attempt to remove non-existing layer sources', function(done) {
        function _assert(msg, exp) {
            return function() {
                var layerList = gd._fullLayout.mapbox._subplot.layerList;
                expect(layerList.length).toBe(exp, msg);
            };
        }

        Plotly.react(gd, [{type: 'scattermapbox'}], {
            mapbox: { layers: [{}] }
        })
        .then(_assert('1 visible:false layer', 1))
        .then(function() {
            return Plotly.react(gd, [{type: 'scattermapbox'}], {
                mapbox: { layers: [] }
            });
        })
        .then(_assert('no layers', 0))
        .then(done, done.fail);
    }, LONG_TIMEOUT_INTERVAL);

    it('@gl should validate layout layer input', function(done) {
        Plotly.newPlot(gd, [{type: 'scattermapbox'}], {
            mapbox: {
                layers: [{
                    sourcetype: 'raster',
                    source: ['']
                }]
            }
        })
        .then(function() {
            var mapInfo = getMapInfo(gd);
            expect(mapInfo.layoutLayers.length).toBe(0, 'no on-map layer');
            expect(mapInfo.layoutSources.length).toBe(0, 'no map source');
        })
        .then(done, done.fail);
    }, LONG_TIMEOUT_INTERVAL);

    it('@gl should be able to update the access token', function(done) {
        Plotly.relayout(gd, 'mapbox.accesstoken', 'wont-work')
        .catch(function(err) {
            expect(gd._fullLayout.mapbox.accesstoken).toEqual('wont-work');
            expect(err).toEqual(new Error(constants.mapOnErrorMsg));
            expect(gd._promises.length).toEqual(1);

            return Plotly.relayout(gd, 'mapbox.accesstoken', MAPBOX_ACCESS_TOKEN);
        })
        .then(function() {
            expect(gd._fullLayout.mapbox.accesstoken).toEqual(MAPBOX_ACCESS_TOKEN);
            expect(gd._promises.length).toEqual(0);
        })
        .then(done, done.fail);
    }, LONG_TIMEOUT_INTERVAL);

    it('@gl should be able to update traces', function(done) {
        function assertDataPts(lengths) {
            var lines = getGeoJsonData(gd, 'lines');
            var markers = getGeoJsonData(gd, 'markers');

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
        .then(done, done.fail);
    }, LONG_TIMEOUT_INTERVAL);

    it('@gl should display to hover labels on mouse over', function(done) {
        function assertMouseMove(pos, len) {
            return _mouseEvent('mousemove', pos, function() {
                var hoverLabels = d3Select('.hoverlayer').selectAll('g');

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
            assertHoverLabelStyle(d3Select('g.hovertext'), {
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
        .then(done, done.fail);
    }, LONG_TIMEOUT_INTERVAL);

    it('@gl should respond to hover interactions by', function(done) {
        var hoverCnt = 0;
        var unhoverCnt = 0;

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
        .then(done, done.fail);
    }, LONG_TIMEOUT_INTERVAL);

    it('@gl should not attempt to rehover over exiting subplots', function(done) {
        spyOn(Fx, 'hover').and.callThrough();

        function countHoverLabels() {
            return d3Select('.hoverlayer').selectAll('g').size();
        }

        Promise.resolve()
        .then(function() {
            return _mouseEvent('mousemove', pointPos, function() {
                expect(countHoverLabels()).toEqual(1);
                expect(Fx.hover).toHaveBeenCalledTimes(1);
                expect(Fx.hover.calls.argsFor(0)[2]).toBe('mapbox');
                Fx.hover.calls.reset();
            });
        })
        .then(function() { return Plotly.deleteTraces(gd, [0, 1]); })
        .then(delay(10))
        .then(function() {
            return _mouseEvent('mousemove', pointPos, function() {
                expect(countHoverLabels()).toEqual(0);
                // N.B. no additional calls from Plots.rehover()
                // (as 'mapbox' subplot is gone),
                // just one on the fallback xy subplot
                expect(Fx.hover).toHaveBeenCalledTimes(1);
                expect(Fx.hover.calls.argsFor(0)[2]).toBe('xy');
            });
        })
        .then(done, done.fail);
    }, LONG_TIMEOUT_INTERVAL);

    it('@gl should respond drag / scroll / double-click interactions', function(done) {
        var relayoutCnt = 0;
        var doubleClickCnt = 0;
        var relayoutingCnt = 0;
        var evtData;

        gd.on('plotly_relayout', function(d) {
            relayoutCnt++;
            evtData = d;
        });

        gd.on('plotly_relayouting', function() {
            relayoutingCnt++;
        });

        gd.on('plotly_doubleclick', function() {
            doubleClickCnt++;
        });

        function _scroll(p) {
            return new Promise(function(resolve) {
                mouseEvent('mousemove', p[0], p[1]);
                mouseEvent('scroll', p[0], p[1], {deltaY: -400});
                setTimeout(resolve, 1000);
            });
        }

        function _assertLayout(center, zoom) {
            var mapInfo = getMapInfo(gd);
            var layout = gd.layout.mapbox;

            expect([mapInfo.center.lng, mapInfo.center.lat]).toBeCloseToArray(center);
            expect(mapInfo.zoom).toBeCloseTo(zoom);

            expect([layout.center.lon, layout.center.lat]).toBeCloseToArray(center);
            expect(layout.zoom).toBeCloseTo(zoom);
        }

        function _assert(center, zoom, lon0, lat0, lon1, lat1) {
            _assertLayout(center, zoom);

            expect([evtData['mapbox.center'].lon, evtData['mapbox.center'].lat]).toBeCloseToArray(center);
            expect(evtData['mapbox.zoom']).toBeCloseTo(zoom);
            expect(Object.keys(evtData['mapbox._derived'])).toEqual(['coordinates']);
            expect(evtData['mapbox._derived'].coordinates).toBeCloseTo2DArray([
                [lon0, lat1],
                [lon1, lat1],
                [lon1, lat0],
                [lon0, lat0]
            ], -0.1);
        }

        _assertLayout([-4.710, 19.475], 1.234);

        var p1 = [pointPos[0] + 50, pointPos[1] - 20];

        _drag(pointPos, p1, function() {
            expect(relayoutCnt).toBe(1, 'relayout cnt');
            expect(relayoutingCnt).toBe(1, 'relayouting cnt');
            expect(doubleClickCnt).toBe(0, 'double click cnt');
            _assert([-19.651, 13.751], 1.234,
                -155.15981291032617, -25.560300274373148,
                115.85734493011842, 47.573988219006424);

            return _doubleClick(p1);
        })
        .then(function() {
            expect(relayoutCnt).toBe(2, 'relayout cnt');
            expect(relayoutingCnt).toBe(1, 'relayouting cnt');
            expect(doubleClickCnt).toBe(1, 'double click cnt');
            _assert([-4.710, 19.475], 1.234,
                -140.21950652441467, -20.054298691163496,
                130.79765131602989, 51.4513888208798);

            return _scroll(pointPos);
        })
        .then(function() {
            expect(relayoutCnt).toBe(3, 'relayout cnt');
            expect(relayoutingCnt).toBeCloseTo(10, -1, 'relayouting cnt');
            expect(doubleClickCnt).toBe(1, 'double click cnt');
            expect(getMapInfo(gd).zoom).toBeGreaterThan(1.234);
        })
        .then(done, done.fail);
    }, LONG_TIMEOUT_INTERVAL);

    it('@gl should respond to click interactions by', function(done) {
        var ptData;

        gd.on('plotly_click', function(eventData) {
            ptData = eventData.points[0];
        });

        Promise.resolve()
        .then(function() { return click(blankPos[0], blankPos[1]); })
        .then(delay(100))
        .then(function() {
            expect(ptData).toBe(undefined, 'not firing on blank points');
        })
        .then(delay(100))
        .then(function() { return click(pointPos[0], pointPos[1]); })
        .then(function() {
            expect(ptData).not.toBe(undefined, 'firing on data points');
            expect(Object.keys(ptData)).toEqual([
                'data', 'fullData', 'curveNumber', 'pointNumber', 'pointIndex', 'lon', 'lat'
            ], 'returning the correct event data keys');
            expect(ptData.curveNumber).toEqual(0, 'returning the correct curve number');
            expect(ptData.pointNumber).toEqual(0, 'returning the correct point number');
        })
        .then(done, done.fail);
    }, LONG_TIMEOUT_INTERVAL);

    it('@gl should respect scrollZoom config option', function(done) {
        var mockCopy2 = Lib.extendDeep({}, mock);
        mockCopy2.config = {scrollZoom: false};

        var relayoutCnt = 0;
        var addOnGd = function() {
            gd.on('plotly_relayout', function() { relayoutCnt++; });
        };

        function _scroll() {
            relayoutCnt = 0;
            return new Promise(function(resolve) {
                mouseEvent('mousemove', pointPos[0], pointPos[1]);
                mouseEvent('scroll', pointPos[0], pointPos[1], {deltaY: -400});
                setTimeout(resolve, 500);
            });
        }

        var zoom = getMapInfo(gd).zoom;
        expect(zoom).toBeCloseTo(1.234);
        var zoom0 = zoom;

        addOnGd();

        _scroll().then(function() {
            expect(relayoutCnt).toBe(1, 'scroll relayout cnt');

            var zoomNew = getMapInfo(gd).zoom;
            expect(zoomNew).toBeGreaterThan(zoom);
            zoom = zoomNew;
        })
        .then(function() { return Plotly.newPlot(gd, gd.data, gd.layout, {scrollZoom: false}); })
        .then(addOnGd)
        .then(_scroll)
        .then(function() {
            expect(relayoutCnt).toBe(0, 'no additional relayout call');

            var zoomNew = getMapInfo(gd).zoom;
            expect(zoomNew).toBe(zoom);
            zoom = zoomNew;
        })
        .then(function() { return Plotly.newPlot(gd, gd.data, gd.layout, {scrollZoom: true}); })
        .then(addOnGd)
        .then(_scroll)
        .then(function() {
            expect(relayoutCnt).toBe(1, 'scroll relayout cnt');

            var zoomNew = getMapInfo(gd).zoom;
            expect(zoomNew).toBeGreaterThan(zoom);
        })
        .then(function() { return Plotly.newPlot(gd, mockCopy2); })
        .then(addOnGd)
        .then(_scroll)
        .then(function() {
            // see https://github.com/plotly/plotly.js/issues/3738
            var zoomNew = getMapInfo(gd).zoom;
            expect(zoomNew).toBe(zoom0);
        })
        .then(done, done.fail);
    }, LONG_TIMEOUT_INTERVAL);

    describe('attributions', function() {
        it('@gl should be displayed for style "open-street-map"', function(done) {
            Plotly.newPlot(gd, [{type: 'scattermapbox'}], {mapbox: {style: 'open-street-map'}})
            .then(function() {
                var s = d3SelectAll('.mapboxgl-ctrl-attrib');
                expect(s.size()).toBe(1);
                expect(s.text()).toEqual('© OpenStreetMap');
            })
            .then(done, done.fail);
        });

        it('@gl should be displayed for style from Mapbox', function(done) {
            Plotly.newPlot(gd, [{type: 'scattermapbox'}], {mapbox: {style: 'basic'}})
            .then(function() {
                var s = d3SelectAll('.mapboxgl-ctrl-attrib');
                expect(s.size()).toBe(1);
                expect(s.text()).toEqual('© Mapbox © OpenStreetMap Improve this map');
            })
            .then(done, done.fail);
        });

        function mockLayoutCustomStyle() {
            return {
                'mapbox': {
                    'style': {
                        'id': 'osm',
                        'version': 8,
                        'sources': {
                            'simple-tiles': {
                                'type': 'raster',
                                'tiles': [
                                    'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
                                    'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png'
                                ],
                                'tileSize': 256
                            }
                        },
                        'layers': [
                            {
                                'id': 'simple-tiles',
                                'type': 'raster',
                                'source': 'simple-tiles',
                                'minzoom': 0,
                                'maxzoom': 22
                            }
                        ]
                    }
                }
            };
        }

        it('@gl should not be displayed for custom style without attribution', function(done) {
            Plotly.newPlot(gd, [{type: 'scattermapbox'}], mockLayoutCustomStyle())
            .then(function() {
                var s = d3SelectAll('.mapboxgl-ctrl-attrib');
                expect(s.size()).toBe(1);
                expect(s.text()).toEqual('');
            })
            .then(done, done.fail);
        });

        it('@gl should be displayed for custom style with attribution', function(done) {
            var attr = 'custom attribution';
            var layout = mockLayoutCustomStyle();
            layout.mapbox.style.sources['simple-tiles'].attribution = attr;
            Plotly.newPlot(gd, [{type: 'scattermapbox'}], layout)
            .then(function() {
                var s = d3SelectAll('.mapboxgl-ctrl-attrib');
                expect(s.size()).toBe(1);
                expect(s.text()).toEqual(attr);
            })
            .then(done, done.fail);
        });

        it('@gl should be displayed for attributions defined in layers\' sourceattribution', function(done) {
            var mock = require('@mocks/mapbox_layers.json');
            var customMock = Lib.extendDeep(mock);

            var attr = 'custom attribution';
            var XSS = '<img src=x onerror=\"alert(XSS);\">';
            customMock.data.pop();
            customMock.layout.mapbox.layers[0].sourceattribution = XSS + attr;

            Plotly.newPlot(gd, customMock)
            .then(function() {
                var s = d3SelectAll('.mapboxgl-ctrl-attrib');
                expect(s.size()).toBe(1);
                expect(s.text()).toEqual([XSS + attr, '© Mapbox © OpenStreetMap Improve this map'].join(' | '));
                expect(s.html().indexOf('<img src=x onerror="alert(XSS);">')).toBe(-1);
                expect(s.html().indexOf('&lt;img src=x onerror="alert(XSS);"&gt;')).not.toBe(-1);
            })
            .then(done, done.fail);
        });
    });

    function countVisibleTraces(gd, modes) {
        var mapInfo = getMapInfo(gd);
        var cnts = [];

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
        var mapInfo = getMapInfo(gd);
        var values = [];

        mapInfo.traceLayers.forEach(function(l) {
            var info = mapInfo.layers[l];

            if(l.indexOf(mode) === -1) return;

            values.push(info.paint._values[prop].value.value);
        });

        return values;
    }

    function getGeoJsonData(gd, mode) {
        var mapInfo = getMapInfo(gd);
        var out = [];

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

describe('mapbox react', function() {
    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(function() {
        Plotly.purge(gd);
        destroyGraphDiv();
    });

    it('@gl should be able to react to new tiles', function(done) {
        function assertTile(link) {
            var mapInfo = getMapInfo(gd);
            expect(mapInfo.style.sources.REF.tiles[0]).toEqual(link);
        }

        var firstLink = 'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png';
        var secondLink = 'https://a.tile.stamen.com/watercolor/{z}/{x}/{y}.jpg';

        var fig = {
            data: [
                {
                    type: 'scattermapbox',
                    lon: [10, 20],
                    lat: [20, 10]
                }
            ],
            layout: {
                mapbox: {
                    style: {
                        version: 8,
                        sources: {
                            REF: {
                                type: 'raster',
                                tileSize: 256,
                                tiles: [firstLink]
                            }
                        },
                        layers: [{
                            id: 'REF',
                            source: 'REF',
                            type: 'raster'
                        }],
                    }
                }
            }
        };

        Plotly.newPlot(gd, fig)
        .then(function() {
            assertTile(firstLink);

            // copy figure
            var newFig = JSON.parse(JSON.stringify(fig));

            // new figure
            newFig.layout.mapbox.style.sources = {
                REF: {
                    type: 'raster',
                    tileSize: 256,
                    tiles: [secondLink]
                }
            };

            // update
            Plotly.react(gd, newFig);
        })
        .then(function() {
            assertTile(secondLink);
        })
        .then(done, done.fail);
    }, LONG_TIMEOUT_INTERVAL);
});

describe('test mapbox trace/layout *below* interactions', function() {
    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(function(done) {
        Plotly.purge(gd);
        destroyGraphDiv();
        setTimeout(done, 200);
    });

    function getLayerIds() {
        var subplot = gd._fullLayout.mapbox._subplot;
        var layers = subplot.map.getStyle().layers;
        var layerIds = layers.map(function(l) { return l.id; });
        return layerIds;
    }

    it('@gl should be able to update *below* - scattermapbox + layout layer case', function(done) {
        function _assert(msg, exp) {
            var layersIds = getLayerIds();
            var tracePrefix = 'plotly-trace-layer-' + gd._fullData[0].uid;

            expect(layersIds.indexOf(tracePrefix + '-fill')).toBe(exp.trace[0], msg + '| fill');
            expect(layersIds.indexOf(tracePrefix + '-line')).toBe(exp.trace[1], msg + '| line');
            expect(layersIds.indexOf(tracePrefix + '-circle')).toBe(exp.trace[2], msg + '| circle');
            expect(layersIds.indexOf(tracePrefix + '-symbol')).toBe(exp.trace[3], msg + '| symbol');

            var layoutLayerId = ['plotly-layout-layer', gd._fullLayout._uid, 'mapbox-0'].join('-');
            expect(layersIds.indexOf(layoutLayerId)).toBe(exp.layout, msg + '| layout layer');
        }

        Plotly.newPlot(gd, [{
            type: 'scattermapbox',
            lon: [10, 20, 30],
            lat: [15, 25, 35],
            uid: 'a'
        }], {
            mapbox: {
                style: 'basic',
                layers: [{
                    sourcetype: 'vector',
                    source: 'mapbox://mapbox.mapbox-terrain-v2',
                    sourcelayer: 'contour',
                    type: 'line'
                }]
            }
        })
        .then(function() {
            _assert('default *below*', {
                trace: [20, 21, 22, 23],
                layout: 24
            });
        })
        .then(function() { return Plotly.relayout(gd, 'mapbox.layers[0].below', 'traces'); })
        .then(function() {
            _assert('with layout layer *below:traces*', {
                trace: [21, 22, 23, 24],
                layout: 20
            });
        })
        .then(function() { return Plotly.relayout(gd, 'mapbox.layers[0].below', null); })
        .then(function() {
            _assert('back to default *below* (1)', {
                trace: [20, 21, 22, 23],
                layout: 24
            });
        })
        .then(function() { return Plotly.restyle(gd, 'below', ''); })
        .then(function() {
            _assert('with trace *below:""*', {
                trace: [21, 22, 23, 24],
                layout: 20
            });
        })
        .then(function() { return Plotly.restyle(gd, 'below', null); })
        .then(function() {
            _assert('back to default *below* (2)', {
                trace: [20, 21, 22, 23],
                layout: 24
            });
        })
        .then(function() { return Plotly.restyle(gd, 'below', 'water'); })
        .then(function() {
            _assert('with trace *below:water*', {
                trace: [4, 5, 6, 7],
                layout: 24
            });
        })
        .then(function() { return Plotly.relayout(gd, 'mapbox.layers[0].below', 'water'); })
        .then(function() {
            _assert('with trace AND layout layer *below:water*', {
                trace: [4, 5, 6, 7],
                layout: 8
            });
        })
        .then(function() { return Plotly.relayout(gd, 'mapbox.layers[0].below', ''); })
        .then(function() {
            _assert('with trace *below:water* and layout layer *below:""*', {
                trace: [4, 5, 6, 7],
                layout: 24
            });
        })
        .then(function() { return Plotly.restyle(gd, 'below', ''); })
        .then(function() {
            _assert('with trace AND layout layer *below:water*', {
                trace: [20, 21, 22, 23],
                layout: 24
            });
        })
        .then(function() { return Plotly.update(gd, {below: null}, {'mapbox.layers[0].below': null}); })
        .then(function() {
            _assert('back to default *below* (3)', {
                trace: [20, 21, 22, 23],
                layout: 24
            });
        })
        .then(done, done.fail);
    }, 8 * jasmine.DEFAULT_TIMEOUT_INTERVAL);

    it('@gl should be able to update *below* - scattermapbox + choroplethmapbox + densitymapbox case', function(done) {
        function _assert(msg, exp) {
            var layersIds = getLayerIds();
            var tracePrefix = 'plotly-trace-layer-';

            var scatterPrefix = tracePrefix + 'scatter';
            expect(layersIds.indexOf(scatterPrefix + '-fill')).toBe(exp.scatter[0], msg + '| scatter fill');
            expect(layersIds.indexOf(scatterPrefix + '-line')).toBe(exp.scatter[1], msg + '| scatter line');
            expect(layersIds.indexOf(scatterPrefix + '-circle')).toBe(exp.scatter[2], msg + '| scatter circle');
            expect(layersIds.indexOf(scatterPrefix + '-symbol')).toBe(exp.scatter[3], msg + '| scatter symbol');

            var densityPrefix = tracePrefix + 'density';
            expect(layersIds.indexOf(densityPrefix + '-heatmap')).toBe(exp.density[0], msg + '| density heatmap');

            var choroplethPrefix = tracePrefix + 'choropleth';
            expect(layersIds.indexOf(choroplethPrefix + '-fill')).toBe(exp.choropleth[0], msg + '| choropleth fill');
            expect(layersIds.indexOf(choroplethPrefix + '-line')).toBe(exp.choropleth[1], msg + '| choropleth line');
        }

        Plotly.newPlot(gd, [{
            type: 'scattermapbox',
            lon: [10, 20, 30],
            lat: [15, 25, 35],
            uid: 'scatter'
        }, {
            type: 'densitymapbox',
            lon: [10, 20, 30],
            lat: [15, 25, 35],
            z: [1, 20, 5],
            uid: 'density'
        }, {
            type: 'choroplethmapbox',
            geojson: 'https://raw.githubusercontent.com/python-visualization/folium/master/examples/data/us-states.json',
            locations: ['AL'],
            z: [10],
            uid: 'choropleth'
        }], {
            mapbox: {style: 'basic'}
        })
        .then(function() {
            _assert('base', {
                scatter: [23, 24, 25, 26],
                density: [17],
                choropleth: [5, 6]
            });
        })
        .then(function() { return Plotly.restyle(gd, 'below', ''); })
        .then(function() {
            _assert('all traces *below:""', {
                scatter: [23, 24, 25, 26],
                density: [22],
                choropleth: [20, 21]
            });
        })
        .then(function() { return Plotly.restyle(gd, 'below', null); })
        .then(function() {
            _assert('back to base', {
                scatter: [23, 24, 25, 26],
                density: [17],
                choropleth: [5, 6]
            });
        })
        .then(done, done.fail);
    }, 8 * jasmine.DEFAULT_TIMEOUT_INTERVAL);

    it('@gl should be warn when *below* value does not correspond to a layer on the map', function(done) {
        spyOn(Lib, 'warn');

        var notGonnaWork = 'not-gonna-work';
        var arg = [
            'Trying to add layer with *below* value',
            notGonnaWork,
            'referencing a layer that does not exist',
            'or that does not yet exist.'
        ].join(' ');

        function _assertFallback(msg, exp) {
            var allArgs = Lib.warn.calls.allArgs();

            if(allArgs.length === exp.warnCnt) {
                for(var i = 0; i < exp.warnCnt; i++) {
                    expect(allArgs[i][0]).toBe(arg, 'Lib.warn call #' + i);
                }
            } else {
                fail('Incorrect number of Lib.warn calls');
            }
            Lib.warn.calls.reset();

            getLayerIds().slice(20, -1).forEach(function(id) {
                expect(id.indexOf('plotly-')).toBe(0, 'layer ' + id + ' fallback to top of map');
            });
        }

        Plotly.newPlot(gd, [{
            type: 'scattermapbox',
            lon: [10, 20, 30],
            lat: [15, 25, 35]
        }, {
            type: 'densitymapbox',
            lon: [10, 20, 30],
            lat: [15, 25, 35],
            z: [1, 20, 5]
        }, {
            type: 'choroplethmapbox',
            geojson: 'https://raw.githubusercontent.com/python-visualization/folium/master/examples/data/us-states.json',
            locations: ['AL'],
            z: [10]
        }], {
            mapbox: {
                style: 'basic',
                layers: [{
                    sourcetype: 'vector',
                    source: 'mapbox://mapbox.mapbox-terrain-v2',
                    sourcelayer: 'contour',
                    type: 'line'
                }]
            }
        })
        .then(function() {
            expect(Lib.warn).toHaveBeenCalledTimes(0);
        })
        .then(function() { return Plotly.restyle(gd, 'below', notGonnaWork); })
        .then(function() {
            // 7 for 4 scattermapbox + 2 choroplethmapbox + 1 densitymapbox layer
            _assertFallback('not-gonna-work for traces', {warnCnt: 7});
        })
        .then(function() { return Plotly.relayout(gd, 'mapbox.layers[0].below', 'not-gonna-work'); })
        .then(function() {
            // same as last but + layout layer
            _assertFallback('not-gonna-work for traces', {warnCnt: 8});
        })
        .then(function() { return Plotly.update(gd, {below: null}, {'mapbox.layers[0].below': null}); })
        .then(function() {
            expect(Lib.warn).toHaveBeenCalledTimes(0);
        })
        .then(done, done.fail);
    }, 8 * jasmine.DEFAULT_TIMEOUT_INTERVAL);
});

describe('Test mapbox GeoJSON fetching:', function() {
    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(function(done) {
        Plotly.purge(gd);
        destroyGraphDiv();
        setTimeout(done, 200);
    });

    it('@gl should fetch GeoJSON using URLs found in the traces', function(done) {
        var url = 'https://raw.githubusercontent.com/plotly/datasets/master/florida-red-data.json';
        var url2 = 'https://raw.githubusercontent.com/plotly/datasets/master/florida-blue-data.json';
        var cnt = 0;

        Plotly.newPlot(gd, [{
            type: 'choroplethmapbox',
            locations: ['a'],
            z: [1],
            geojson: url
        }, {
            type: 'choroplethmapbox',
            locations: ['a'],
            z: [1],
            geojson: url2
        }])
        .catch(function() {
            cnt++;
        })
        .then(function() {
            expect(cnt).toBe(0, 'no failures!');
            expect(Lib.isPlainObject(window.PlotlyGeoAssets[url])).toBe(true, 'is a GeoJSON object');
            expect(Lib.isPlainObject(window.PlotlyGeoAssets[url2])).toBe(true, 'is a GeoJSON object');
        })
        .then(done, done.fail);
    });

    it('@gl should fetch GeoJSON using URLs found in the traces', function(done) {
        var actual = '';

        Plotly.newPlot(gd, [{
            type: 'choroplethmapbox',
            locations: ['a'],
            z: [1],
            geojson: 'invalidUrl'
        }, {
            type: 'choroplethmapbox',
            locations: ['a'],
            z: [1],
            geojson: 'invalidUrl-two'
        }])
        .catch(function(reason) {
            // bails up after first failure
            actual = reason;
        })
        .then(function() {
            expect(actual).toEqual(new Error('GeoJSON at URL "invalidUrl" does not exist.'));
            expect(window.PlotlyGeoAssets.invalidUrl).toBe(undefined);
        })
        .then(done, done.fail);
    }, LONG_TIMEOUT_INTERVAL);
});

describe('mapbox toImage', function() {
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

    it('@gl should generate image data with global credentials', function(done) {
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
        .then(done, done.fail);
    }, LONG_TIMEOUT_INTERVAL);

    it('@gl should generate image data with config credentials', function(done) {
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
        .then(done, done.fail);
    }, LONG_TIMEOUT_INTERVAL);

    it('@gl should generate image data with layout credentials', function(done) {
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
        .then(done, done.fail);
    }, LONG_TIMEOUT_INTERVAL);
});

function getMapInfo(gd) {
    var subplot = gd._fullLayout.mapbox._subplot;
    var map = subplot.map;

    var sources = map.style.sourceCaches;
    var layers = map.style._layers;
    var uid = subplot.uid;

    var traceSources = Object.keys(sources).filter(function(k) {
        return k.indexOf('source-') === 0;
    });

    var traceLayers = Object.keys(layers).filter(function(k) {
        return k.indexOf('plotly-trace-layer-') === 0;
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
