var Plotly = require('@lib');
var Lib = require('@src/lib');

var constants = require('@src/plots/mapbox/constants');
var supplyLayoutDefaults = require('@src/plots/mapbox/layout_defaults');

var d3 = require('d3');
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var mouseEvent = require('../assets/mouse_event');
var customMatchers = require('../assets/custom_matchers');

var MAPBOX_ACCESS_TOKEN = require('@build/credentials.json').MAPBOX_ACCESS_TOKEN;
var TRANSITION_DELAY = 500;

var noop = function() {};

// until it is part of the main plotly.js bundle
Plotly.register(
    require('@lib/scattermapbox')
);

Plotly.setPlotConfig({
    mapboxAccessToken: MAPBOX_ACCESS_TOKEN
});


describe('mapbox defaults', function() {
    'use strict';

    var layoutIn, layoutOut, fullData;

    beforeEach(function() {
        layoutOut = { font: { color: 'red' } };

        // needs a ternary-ref in a trace in order to be detected
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
        layoutIn = {
            mapbox: {
                layers: [{
                    sourcetype: 'vector',
                    type: 'line',
                    line: {
                        color: 'red',
                        width: 3
                    },
                    fillcolor: 'blue'
                }, {
                    sourcetype: 'geojson',
                    type: 'fill',
                    line: {
                        color: 'red',
                        width: 3
                    },
                    fillcolor: 'blue'
                }]
            }
        };

        supplyLayoutDefaults(layoutIn, layoutOut, fullData);

        expect(layoutOut.mapbox.layers[0].line.color).toEqual('red');
        expect(layoutOut.mapbox.layers[0].line.width).toEqual(3);
        expect(layoutOut.mapbox.layers[0].fillcolor).toBeUndefined();

        expect(layoutOut.mapbox.layers[1].line.color).toEqual('red');
        expect(layoutOut.mapbox.layers[1].line.width).toBeUndefined();
        expect(layoutOut.mapbox.layers[1].fillcolor).toEqual('blue');
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
    });

    it('should throw error if token is invalid', function(done) {
        Plotly.plot(gd, [{
            type: 'scattermapbox',
            lon: [10, 20, 30],
            lat: [10, 20, 30]
        }], {}, {
            mapboxAccessToken: dummyToken
        }).catch(function(err) {
            expect(err).toEqual(new Error(constants.mapOnErrorMsg));
            done();
        });
    });
});

describe('mapbox plots', function() {
    'use strict';

    var mock = require('@mocks/mapbox_0.json'),
        gd;

    var pointPos = [579, 276],
        blankPos = [650, 120];

    beforeAll(function() {
        jasmine.addMatchers(customMatchers);
    });

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
            expect(gd._fullLayout.mapbox).toBeUndefined();

            return Plotly.restyle(gd, 'visible', true);
        }).then(function() {
            expect(countVisibleTraces(gd, modes)).toEqual(2);

            return Plotly.restyle(gd, 'visible', 'legendonly', [1]);
        }).then(function() {
            expect(countVisibleTraces(gd, modes)).toEqual(1);

            return Plotly.restyle(gd, 'visible', true);
        }).then(function() {
            expect(countVisibleTraces(gd, modes)).toEqual(2);

            done();
        });
    });

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
        }).then(function() {
            expect(countVisibleTraces(gd, modes)).toEqual(2);

            var trace = {
                type: 'scattermapbox',
                mode: 'markers+lines',
                lon: [10, 20, 10],
                lat: [10, -20, 10]
            };

            return Plotly.addTraces(gd, [trace]);
        }).then(function() {
            expect(countVisibleTraces(gd, modes)).toEqual(3);

            return Plotly.deleteTraces(gd, [0, 1, 2]);
        }).then(function() {
            expect(gd._fullLayout.mapbox).toBeUndefined();

            done();
        });
    });

    it('should be able to restyle', function(done) {
        function assertMarkerColor(expectations) {
            return new Promise(function(resolve) {
                setTimeout(function() {
                    var colors = getStyle(gd, 'circle', 'circle-color');

                    expectations.forEach(function(expected, i) {
                        expect(colors[i]).toBeCloseToArray(expected);
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
            return assertMarkerColor([
                [0, 0.5019, 0, 1],
                [0, 0.5019, 0, 1]
            ]);
        })
        .then(function() {
            return Plotly.restyle(gd, 'marker.color', 'red', [1]);
        })
        .then(function() {
            return assertMarkerColor([
                [0, 0.5019, 0, 1],
                [1, 0, 0, 1]
            ]);
        })
        .then(done);
    });

    it('should be able to relayout', function(done) {
        function assertLayout(style, center, zoom, dims) {
            var mapInfo = getMapInfo(gd);

            expect(mapInfo.style.name).toEqual(style);
            expect([mapInfo.center.lng, mapInfo.center.lat])
                .toBeCloseToArray(center);
            expect(mapInfo.zoom).toBeCloseTo(zoom);

            var divStyle = mapInfo.div.style;
            var expectedDims = ['left', 'top', 'width', 'height'].map(function(p) {
                return parseFloat(divStyle[p]);
            });

            expect(expectedDims).toBeCloseToArray(dims);
        }

        assertLayout('Mapbox Dark', [-4.710, 19.475], 1.234, [80, 100, 908, 270]);

        Plotly.relayout(gd, 'mapbox.center', { lon: 0, lat: 0 }).then(function() {
            assertLayout('Mapbox Dark', [0, 0], 1.234, [80, 100, 908, 270]);

            return Plotly.relayout(gd, 'mapbox.zoom', '6');
        }).then(function() {
            assertLayout('Mapbox Dark', [0, 0], 6, [80, 100, 908, 270]);

            return Plotly.relayout(gd, 'mapbox.style', 'light');
        }).then(function() {
            assertLayout('Mapbox Light', [0, 0], 6, [80, 100, 908, 270]);

            return Plotly.relayout(gd, 'mapbox.domain.x', [0, 0.5]);
        }).then(function() {
            assertLayout('Mapbox Light', [0, 0], 6, [80, 100, 454, 270]);

            return Plotly.relayout(gd, 'mapbox.domain.y[0]', 0.5);
        }).then(function() {
            assertLayout('Mapbox Light', [0, 0], 6, [80, 100, 454, 135]);

            done();
        });
    });

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
            'mapbox.layers[0].fillcolor': 'red',
            'mapbox.layers[0].line.color': 'blue',
            'mapbox.layers[0].opacity': 0.3
        };

        var styleUpdate1 = {
            'mapbox.layers[1].line.width': 3,
            'mapbox.layers[1].line.color': 'blue',
            'mapbox.layers[1].opacity': 0.6
        };

        function countVisibleLayers(gd) {
            var mapInfo = getMapInfo(gd);

            var sourceLen = mapInfo.layoutSources.length,
                layerLen = mapInfo.layoutLayers.length;

            if(sourceLen !== layerLen) return null;

            return layerLen;
        }

        function assertLayerStyle(gd, expectations, index) {
            var mapInfo = getMapInfo(gd),
                layers = mapInfo.layers,
                layerNames = mapInfo.layoutLayers;

            var layer = layers[layerNames[index]];

            return new Promise(function(resolve) {
                setTimeout(function() {
                    Object.keys(expectations).forEach(function(k) {
                        expect(layer.paint[k]).toEqual(expectations[k]);
                    });
                    resolve();
                }, TRANSITION_DELAY);
            });
        }

        expect(countVisibleLayers(gd)).toEqual(0);

        Plotly.relayout(gd, 'mapbox.layers[0]', layer0).then(function() {
            expect(countVisibleLayers(gd)).toEqual(1);

            return Plotly.relayout(gd, 'mapbox.layers[1]', layer1);
        }).then(function() {
            expect(countVisibleLayers(gd)).toEqual(2);

            return Plotly.relayout(gd, mapUpdate);
        }).then(function() {
            expect(countVisibleLayers(gd)).toEqual(2);

            return Plotly.relayout(gd, styleUpdate0);
        }).then(function() {
            expect(countVisibleLayers(gd)).toEqual(2);

            return assertLayerStyle(gd, {
                'fill-color': [1, 0, 0, 1],
                'fill-outline-color': [0, 0, 1, 1],
                'fill-opacity': 0.3
            }, 0);
        }).then(function() {
            expect(countVisibleLayers(gd)).toEqual(2);

            return Plotly.relayout(gd, styleUpdate1);
        }).then(function() {
            expect(countVisibleLayers(gd)).toEqual(2);

            return assertLayerStyle(gd, {
                'line-width': 3,
                'line-color': [0, 0, 1, 1],
                'line-opacity': 0.6
            }, 1);
        }).then(function() {
            expect(countVisibleLayers(gd)).toEqual(2);

            return Plotly.relayout(gd, 'mapbox.layers[1]', 'remove');
        }).then(function() {
            expect(countVisibleLayers(gd)).toEqual(1);

            return Plotly.relayout(gd, 'mapbox.layers[0]', 'remove');
        }).then(function() {
            expect(countVisibleLayers(gd)).toEqual(0);

            done();
        });
    });

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
        }).then(function() {
            assertDataPts([5, 5]);

            done();
        });
    });

    it('should display to hover labels on mouse over', function(done) {
        function assertMouseMove(pos, len) {
            return _mouseEvent('mousemove', pos, function() {
                var hoverLabels = d3.select('.hoverlayer').selectAll('g');

                expect(hoverLabels.size()).toEqual(len);
            });
        }

        assertMouseMove(blankPos, 0).then(function() {
            return assertMouseMove(pointPos, 1);
        }).then(done);
    });

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
                    'data', 'fullData', 'curveNumber', 'pointNumber',
                    'x', 'y', 'xaxis', 'yaxis'
                ], 'returning the correct event data keys');
                expect(hoverData.curveNumber).toEqual(0, 'returning the correct curve number');
                expect(hoverData.pointNumber).toEqual(0, 'returning the correct point number');
            });
        })
        .then(function() {
            return _mouseEvent('mousemove', blankPos, function() {
                expect(unhoverData).not.toBe(undefined, 'firing on data points');
                expect(Object.keys(unhoverData)).toEqual([
                    'data', 'fullData', 'curveNumber', 'pointNumber',
                    'x', 'y', 'xaxis', 'yaxis'
                ], 'returning the correct event data keys');
                expect(unhoverData.curveNumber).toEqual(0, 'returning the correct curve number');
                expect(unhoverData.pointNumber).toEqual(0, 'returning the correct point number');
            });
        })
        .then(function() {
            expect(hoverCnt).toEqual(1);
            expect(unhoverCnt).toEqual(1);

            done();
        });
    });

    it('should respond to click interactions by', function(done) {
        var ptData;

        gd.on('plotly_click', function(eventData) {
            ptData = eventData.points[0];
        });

        function _click(pos, cb) {
            var promise = _mouseEvent('mousemove', pos, noop).then(function() {
                return _mouseEvent('mousedown', pos, noop);
            }).then(function() {
                return _mouseEvent('click', pos, cb);
            });

            return promise;
        }

        _click(blankPos, function() {
            expect(ptData).toBe(undefined, 'not firing on blank points');
        })
        .then(function() {
            return _click(pointPos, function() {
                expect(ptData).not.toBe(undefined, 'firing on data points');
                expect(Object.keys(ptData)).toEqual([
                    'data', 'fullData', 'curveNumber', 'pointNumber',
                    'x', 'y', 'xaxis', 'yaxis'
                ], 'returning the correct event data keys');
                expect(ptData.curveNumber).toEqual(0, 'returning the correct curve number');
                expect(ptData.pointNumber).toEqual(0, 'returning the correct point number');
            });
        })
        .then(done);
    });

    it('should respond drag / scroll interactions', function(done) {
        function _drag(p0, p1, cb) {
            var promise = _mouseEvent('mousemove', p0, noop).then(function() {
                return _mouseEvent('mousedown', p0, noop);
            }).then(function() {
                return _mouseEvent('mousemove', p1, noop);
            }).then(function() {
                return _mouseEvent('mouseup', p1, cb);
            });

            return promise;
        }

        function assertLayout(center, zoom) {
            var mapInfo = getMapInfo(gd),
                layout = gd.layout.mapbox;

            expect([mapInfo.center.lng, mapInfo.center.lat])
                .toBeCloseToArray(center);
            expect(mapInfo.zoom).toBeCloseTo(zoom);

            expect([layout.center.lon, layout.center.lat])
                .toBeCloseToArray(center);
            expect(layout.zoom).toBeCloseTo(zoom);
        }

        assertLayout([-4.710, 19.475], 1.234);

        var p1 = [pointPos[0] + 50, pointPos[1] - 20];

        _drag(pointPos, p1, function() {
            assertLayout([-19.651, 13.751], 1.234);
        })
        .then(done);

        // TODO test scroll

    });

    function getMapInfo(gd) {
        var subplot = gd._fullLayout.mapbox._subplot,
            map = subplot.map;

        var sources = map.style.sources,
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
                if(info.layout.visibility === 'visible') cntPerMode++;
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

            values.push(info.paint[prop]);
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
        var DELAY = 100;

        return new Promise(function(resolve) {
            mouseEvent(type, pos[0], pos[1]);

            setTimeout(function() {
                cb();
                resolve();
            }, DELAY);
        });
    }

});
