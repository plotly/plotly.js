var Plotly = require('@lib');
var Plots = require('@src/plots/plots');
var Lib = require('@src/lib');
var loggers = require('@src/lib/loggers');

var convertModule = require('@src/traces/choroplethmapbox/convert');
var MAPBOX_ACCESS_TOKEN = require('@build/credentials.json').MAPBOX_ACCESS_TOKEN;

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var failTest = require('../assets/fail_test');
var mouseEvent = require('../assets/mouse_event');
var supplyAllDefaults = require('../assets/supply_defaults');

var assertHoverLabelContent = require('../assets/custom_assertions').assertHoverLabelContent;

describe('Test choroplethmapbox defaults:', function() {
    var gd;
    var fullData;

    function _supply(opts, layout) {
        gd = {};
        opts = Array.isArray(opts) ? opts : [opts];

        gd.data = opts.map(function(o) {
            return Lib.extendFlat({type: 'choroplethmapbox'}, o || {});
        });
        gd.layout = layout || {};

        supplyAllDefaults(gd);
        fullData = gd._fullData;
    }

    function expectVisibleFalse(msg) {
        fullData.forEach(function(trace, i) {
            expect(trace.visible).toBe(false, 'visible |trace #' + i + '- ' + msg);
            expect(trace._length).toBe(undefined, '_length |trace #' + i + '- ' + msg);
        });
    }

    it('should set *visible:false* when locations or z or geojson is missing', function() {
        _supply([
            {z: [1], geojson: 'url'},
            {locations: ['a'], geojson: 'url'},
            {locations: ['a'], z: [1]}
        ]);
        expectVisibleFalse();
    });

    it('should set *visible:false* when locations or z is empty', function() {
        _supply([
            {locations: [], z: [1], geojson: 'url'},
            {locations: ['a'], z: [], geojson: 'url'},
            {locations: [], z: [], geojson: 'url'}
        ]);
        expectVisibleFalse();
    });

    it('should accept string (URL) and object *geojson*', function() {
        _supply([
            {name: 'ok during defaults, will fail later', locations: ['a'], z: [1], geojson: 'url'},
            {name: 'ok during defaults, will fail later', locations: ['a'], z: [1], geojson: {}},
        ]);
        fullData.forEach(function(trace, i) {
            expect(trace.visible).toBe(true, 'visible |trace #' + i);
            expect(trace._length).toBe(1, '_length |trace #' + i);
        });

        _supply([
            {name: 'no', locations: ['a'], z: [1], geojson: ''},
            {name: 'no', locations: ['a'], z: [1], geojson: []},
            {name: 'no', locations: ['a'], z: [1], geojson: true}
        ]);
        expectVisibleFalse();
    });

    it('should not coerce *marker.line.color* when *marker.line.width* is *0*', function() {
        _supply([{
            locations: ['CAN', 'USA'],
            z: [1, 2],
            geojson: 'url',
            marker: {
                line: {
                    color: 'red',
                    width: 0
                }
            }
        }]);

        expect(fullData[0].marker.line.width).toBe(0, 'mlw');
        expect(fullData[0].marker.line.color).toBe(undefined, 'mlc');
    });
});

describe('Test choroplethmapbox convert:', function() {
    var geojson0 = function() {
        return {
            type: 'FeatureCollection',
            features: [
                {type: 'Feature', id: 'a', geometry: {type: 'Polygon', coordinates: []}},
                {type: 'Feature', id: 'b', geometry: {type: 'Polygon', coordinates: []}},
                {type: 'Feature', id: 'c', geometry: {type: 'Polygon', coordinates: []}}
            ]
        };
    };

    var base = function() {
        return {
            locations: ['a', 'b', 'c'],
            z: [10, 20, 5],
            geojson: geojson0()
        };
    };

    function pre(trace, layout) {
        var gd = {data: [Lib.extendFlat({type: 'choroplethmapbox'}, trace)]};
        if(layout) gd.layout = layout;

        supplyAllDefaults(gd);
        Plots.doCalcdata(gd, gd._fullData[0]);

        return gd.calcdata[0];
    }

    function _convert(trace) {
        return convertModule.convert(pre(trace));
    }

    function expectBlank(opts, msg) {
        expect(opts.fill.layout.visibility).toBe('none', msg);
        expect(opts.line.layout.visibility).toBe('none', msg);
        expect(opts.geojson).toEqual({type: 'Point', coordinates: []}, msg);
    }

    function extract(opts, k) {
        return opts.geojson.features.map(function(f) { return f.properties[k]; });
    }

    it('should return early when trace is *visible:false*', function() {
        var opts = _convert(Lib.extendFlat(base(), {visible: false}));
        expectBlank(opts);
    });

    it('should return early when trace is has no *_length*', function() {
        var opts = _convert({
            locations: [],
            z: [],
            geojson: geojson0
        });
        expectBlank(opts);
    });

    it('should return early if something goes wrong while fetching a GeoJSON', function() {
        spyOn(loggers, 'error');

        var opts = _convert({
            locations: ['a'], z: [1],
            geojson: 'url'
        });

        expect(loggers.error).toHaveBeenCalledWith('Oops ... something when wrong when fetching url');
        expectBlank(opts);
    });

    describe('should warn when set GeoJSON is not a *FeatureCollection* or a *Feature* type and return early', function() {
        beforeEach(function() { spyOn(loggers, 'warn'); });

        it('- case missing *type* key', function() {
            var opts = _convert({
                locations: ['a'], z: [1],
                geojson: {
                    missingType: ''
                }
            });
            expectBlank(opts);
            expect(loggers.warn).toHaveBeenCalledWith([
                'Invalid GeoJSON type none,',
                'choroplethmapbox traces only support *FeatureCollection* and *Feature* types.'
            ].join(' '));
        });

        it('- case invalid *type*', function() {
            var opts = _convert({
                locations: ['a'], z: [1],
                geojson: {
                    type: 'nop!'
                }
            });
            expectBlank(opts);
            expect(loggers.warn).toHaveBeenCalledWith([
                'Invalid GeoJSON type nop!,',
                'choroplethmapbox traces only support *FeatureCollection* and *Feature* types.'
            ].join(' '));
        });
    });

    describe('should log when crossing a GeoJSON geometry that is not a *Polygon* or a *MultiPolygon* type', function() {
        beforeEach(function() { spyOn(loggers, 'log'); });

        it('- case missing geometry *type*', function() {
            var trace = base();
            delete trace.geojson.features[1].geometry.type;

            var opts = _convert(trace);
            expect(opts.geojson.features.length).toBe(2, '# of feature to be rendered');
            expect(loggers.log).toHaveBeenCalledWith([
                'Location with id b does not have a valid GeoJSON geometry,',
                'choroplethmapbox traces only support *Polygon* and *MultiPolygon* geometries.'
            ].join(' '));
        });

        it('- case invalid geometry *type*', function() {
            var trace = base();
            trace.geojson.features[2].geometry.type = 'not-gonna-work';

            var opts = _convert(trace);
            expect(opts.geojson.features.length).toBe(2, '# of feature to be rendered');
            expect(loggers.log).toHaveBeenCalledWith([
                'Location with id c does not have a valid GeoJSON geometry,',
                'choroplethmapbox traces only support *Polygon* and *MultiPolygon* geometries.'
            ].join(' '));
        });
    });

    it('should log when an entry set in *locations* does not a matching feature in the GeoJSON', function() {
        spyOn(loggers, 'log');

        var trace = base();
        trace.locations = ['a', 'b', 'c', 'd'];
        trace.z = [1, 2, 3, 1];

        var opts = _convert(trace);
        expect(opts.geojson.features.length).toBe(3, '# of features to be rendered');
        expect(loggers.log).toHaveBeenCalledWith('Location with id d does not have a matching feature');
    });

    describe('should accept numbers as *locations* items', function() {
        function _assert(act) {
            expect(act.fill.layout.visibility).toBe('visible', 'fill layer visibility');
            expect(act.line.layout.visibility).toBe('visible', 'line layer visibility');
            expect(act.geojson.features.length).toBe(3, '# of visible features');
            expect(extract(act, 'fc'))
                .toEqual(['rgb(178, 10, 28)', 'rgb(220, 220, 220)', 'rgb(240, 149, 99)']);
        }

        it('- regular array case', function() {
            var trace = {
                locations: [1, 2, 3],
                z: [20, 10, 2],
                geojson: {
                    type: 'FeatureCollection',
                    features: [
                        {type: 'Feature', id: '1', geometry: {type: 'Polygon', coordinates: []}},
                        {type: 'Feature', id: '3', geometry: {type: 'Polygon', coordinates: []}},
                        {type: 'Feature', id: '2', geometry: {type: 'Polygon', coordinates: []}}
                    ]
                }
            };
            _assert(_convert(trace));
        });

        it('- typed array case', function() {
            var trace = {
                locations: new Float32Array([1, 2, 3]),
                z: new Float32Array([20, 10, 2]),
                geojson: {
                    type: 'FeatureCollection',
                    features: [
                        {type: 'Feature', id: 1, geometry: {type: 'Polygon', coordinates: []}},
                        {type: 'Feature', id: 3, geometry: {type: 'Polygon', coordinates: []}},
                        {type: 'Feature', id: 2, geometry: {type: 'Polygon', coordinates: []}}
                    ]
                }
            };
            _assert(_convert(trace));
        });
    });

    it('should handle *Feature* on 1-item *FeatureCollection* the same way', function() {
        var locations = ['a'];
        var z = [1];

        var feature = {
            type: 'Feature',
            id: 'a',
            geometry: {type: 'Polygon', coordinates: []}
        };

        var opts = _convert({
            locations: locations,
            z: z,
            geojson: feature
        });

        var opts2 = _convert({
            locations: locations,
            z: z,
            geojson: {
                type: 'FeatureCollection',
                features: [feature]
            }
        });

        expect(opts).toEqual(opts2);
    });

    it('should fill stuff in corresponding calcdata items', function() {
        var calcTrace = pre(base());
        var opts = convertModule.convert(calcTrace);

        var fullTrace = calcTrace[0].trace;
        expect(fullTrace._opts).toBe(opts, 'opts ref');

        for(var i = 0; i < calcTrace.length; i++) {
            var cdi = calcTrace[i];
            expect(typeof cdi._polygons).toBe('object', '_polygons |' + i);
            expect(Array.isArray(cdi.ct)).toBe(true, 'ct|' + i);
            expect(typeof cdi.fIn).toBe('object', 'fIn |' + i);
            expect(typeof cdi.fOut).toBe('object', 'fOut |' + i);
        }
    });

    describe('should fill *fill-color* correctly', function() {
        function _assert(act, exp) {
            expect(act.fill.paint['fill-color'])
                .toEqual({type: 'identity', property: 'fc'});
            expect(extract(act, 'fc')).toEqual(exp);
        }

        it('- base case', function() {
            _assert(_convert(base()), [
                'rgb(245, 172, 122)',
                'rgb(178, 10, 28)',
                'rgb(220, 220, 220)'
            ]);
        });

        it('- custom colorscale case', function() {
            var trace = base();
            trace.colorscale = [[0, 'rgb(0, 255, 0)'], [1, 'rgb(0, 0, 255)']];
            trace.zmid = 10;

            _assert(_convert(trace), [
                'rgb(0, 128, 128)',
                'rgb(0, 0, 255)',
                'rgb(0, 191, 64)'
            ]);
        });
    });

    describe('should fill *fill-opacity* correctly', function() {
        function _assertScalar(act, exp) {
            expect(act.fill.paint['fill-opacity']).toBe(exp);
            expect(act.line.paint['line-opacity']).toBe(exp);
            expect(extract(act, 'mo')).toEqual([undefined, undefined, undefined]);
        }

        function _assertArray(act, k, exp) {
            expect(act.fill.paint['fill-opacity']).toEqual({type: 'identity', property: k});
            expect(act.line.paint['line-opacity']).toEqual({type: 'identity', property: k});
            expect(extract(act, k)).toBeCloseToArray(exp, 2);
        }

        function fakeSelect(calcTrace, selectedpoints) {
            if(selectedpoints === null) {
                delete calcTrace[0].trace.selectedpoints;
            } else {
                calcTrace[0].trace.selectedpoints = selectedpoints;
            }

            for(var i = 0; i < calcTrace.length; i++) {
                var cdi = calcTrace[i];
                if(selectedpoints) {
                    if(selectedpoints.indexOf(i) !== -1) {
                        cdi.selected = 1;
                    } else {
                        cdi.selected = 0;
                    }
                } else {
                    delete cdi.selected;
                }
            }
        }

        it('- base case', function() {
            var trace = base();
            trace.marker = {opacity: 0.4};
            _assertScalar(_convert(trace), 0.4);
        });

        it('- arrayOk case', function() {
            var trace = base();
            trace.marker = {opacity: [null, 0.2, -10]};
            _assertArray(_convert(trace), 'mo', [0, 0.2, 0]);
        });

        it('- arrayOk case + bad coordinates', function() {
            var trace = base();
            trace.locations = ['a', null, 'c'];
            trace.marker = {opacity: [-1, 0.2, 0.9]};
            _assertArray(_convert(trace), 'mo', [0, 0.9]);
        });

        it('- selection (base)', function() {
            var trace = base();
            trace.selectedpoints = [1];

            var calcTrace = pre(trace);
            _assertArray(convertModule.convert(calcTrace), 'mo2', [0.2, 1, 0.2]);

            fakeSelect(calcTrace, [1, 2]);
            _assertArray(convertModule.convertOnSelect(calcTrace), 'mo2', [0.2, 1, 1]);

            fakeSelect(calcTrace, []);
            _assertArray(convertModule.convertOnSelect(calcTrace), 'mo2', [0.2, 0.2, 0.2]);

            calcTrace[0].trace.unselected = {marker: {opacity: 0}};
            _assertArray(convertModule.convertOnSelect(calcTrace), 'mo2', [0, 0, 0]);

            fakeSelect(calcTrace, null);
            _assertScalar(convertModule.convertOnSelect(calcTrace), 1);
        });

        it('- selection of arrayOk marker.opacity', function() {
            var trace = base();
            trace.marker = {opacity: [0.4, 1, 0.8]};
            trace.selectedpoints = [1];

            var calcTrace = pre(trace);
            _assertArray(convertModule.convert(calcTrace), 'mo2', [0.08, 1, 0.16]);

            fakeSelect(calcTrace, [1, 2]);
            _assertArray(convertModule.convertOnSelect(calcTrace), 'mo2', [0.08, 1, 0.8]);

            calcTrace[0].trace.selected = {marker: {opacity: 1}};
            _assertArray(convertModule.convertOnSelect(calcTrace), 'mo2', [0.08, 1, 1]);

            fakeSelect(calcTrace, []);
            _assertArray(convertModule.convertOnSelect(calcTrace), 'mo2', [0.08, 0.2, 0.16]);

            calcTrace[0].trace.unselected = {marker: {opacity: 0}};
            _assertArray(convertModule.convertOnSelect(calcTrace), 'mo2', [0, 0, 0]);

            fakeSelect(calcTrace, null);
            _assertArray(convertModule.convertOnSelect(calcTrace), 'mo', [0.4, 1, 0.8]);
        });
    });

    describe('should fill *line-color*, *line-width* correctly', function() {
        it('- base case', function() {
            var trace = base();
            trace.marker = {line: {color: 'blue', width: 3}};

            var opts = _convert(trace);
            expect(opts.line.paint['line-color']).toBe('blue');
            expect(opts.line.paint['line-width']).toBe(3);
            expect(extract(opts, 'mlc')).toEqual([undefined, undefined, undefined]);
            expect(extract(opts, 'mlw')).toEqual([undefined, undefined, undefined]);
        });

        it('- arrayOk case', function() {
            var trace = base();
            trace.marker = {
                line: {
                    color: ['blue', 'red', 'black'],
                    width: [0.1, 2, 10]
                }
            };

            var opts = _convert(trace);
            expect(opts.line.paint['line-color']).toEqual({type: 'identity', property: 'mlc'});
            expect(opts.line.paint['line-width']).toEqual({type: 'identity', property: 'mlw'});
            expect(extract(opts, 'mlc')).toEqual(['blue', 'red', 'black']);
            expect(extract(opts, 'mlw')).toEqual([0.1, 2, 10]);
        });
    });

    it('should find correct centroid (single polygon case)', function() {
        var trace = base();

        var coordsIn = [
            [
                [100.0, 0.0], [101.0, 0.0], [101.0, 1.0],
                [100.0, 1.0], [100.0, 0.0]
            ]
        ];

        trace.geojson.features[0].geometry.coordinates = coordsIn;
        var calcTrace = pre(trace);
        var opts = convertModule.convert(calcTrace);

        expect(opts.geojson.features[0].geometry.coordinates).toBe(coordsIn);
        expect(calcTrace[0].ct).toEqual([100.4, 0.4]);
    });

    it('should find correct centroid (multi-polygon case)', function() {
        var trace = base();

        var coordsIn = [
            [
                // this one has the bigger area
                [[30, 20], [45, 40], [10, 40], [30, 20]]
            ],
            [
                [[15, 5], [40, 10], [10, 20], [5, 10], [15, 5]]
            ]
        ];

        trace.geojson.features[0].geometry.type = 'MultiPolygon';
        trace.geojson.features[0].geometry.coordinates = coordsIn;
        var calcTrace = pre(trace);
        var opts = convertModule.convert(calcTrace);

        expect(opts.geojson.features[0].geometry.coordinates).toBe(coordsIn);
        expect(calcTrace[0].ct).toEqual([28.75, 30]);
    });
});

describe('@noCI Test choroplethmapbox hover:', function() {
    var gd;

    afterEach(function(done) {
        Plotly.purge(gd);
        destroyGraphDiv();
        setTimeout(done, 200);
    });

    function run(s, done) {
        gd = createGraphDiv();

        var fig = Lib.extendDeep({},
            s.mock || require('@mocks/mapbox_choropleth0.json')
        );

        if(s.patch) {
            fig = s.patch(fig);
        }

        if(!fig.layout) fig.layout = {};
        if(!fig.layout.mapbox) fig.layout.mapbox = {};
        fig.layout.mapbox.accesstoken = MAPBOX_ACCESS_TOKEN;

        var pos = s.pos || [270, 220];

        return Plotly.plot(gd, fig).then(function() {
            var to = setTimeout(function() {
                failTest('no event data received');
                done();
            }, 100);

            gd.on('plotly_hover', function(d) {
                clearTimeout(to);
                assertHoverLabelContent(s);

                var msg = ' - event data ' + s.desc;
                var actual = d.points || [];
                var exp = s.evtPts;
                expect(actual.length).toBe(exp.length, 'pt length' + msg);
                for(var i = 0; i < exp.length; i++) {
                    for(var k in exp[i]) {
                        var m = 'key ' + k + ' in pt ' + i + msg;
                        var matcher = k === 'properties' ? 'toEqual' : 'toBe';
                        expect(actual[i][k])[matcher](exp[i][k], m);
                    }
                }

                // w/o this purge gets called before
                // hover throttle is complete
                setTimeout(done, 0);
            });

            mouseEvent('mousemove', pos[0], pos[1]);
        })
        .catch(failTest);
    }

    var specs = [{
        desc: 'basic',
        nums: '10',
        name: 'NY',
        evtPts: [{location: 'NY', z: 10, pointNumber: 0, curveNumber: 0, properties: {name: 'New York'}}]
    }, {
        desc: 'with a hovertemplate using values in *properties*',
        patch: function(fig) {
            fig.data.forEach(function(t) {
                t.hovertemplate = '%{z:.3f}<extra>PROP::%{properties.name}</extra>';
            });
            return fig;
        },
        nums: '10.000',
        name: 'PROP::New York',
        evtPts: [{location: 'NY', z: 10, pointNumber: 0, curveNumber: 0, properties: {name: 'New York'}}]
    }, {
        desc: 'with "typeof number" locations[i] and feature id (in *name* label case)',
        patch: function() {
            var fig = Lib.extendDeep({}, require('@mocks/mapbox_choropleth-raw-geojson.json'));
            fig.data.shift();
            fig.data[0].locations = [100];
            fig.data[0].geojson.id = 100;
            return fig;
        },
        nums: '10',
        name: '100',
        evtPts: [{location: 100, z: 10, pointNumber: 0, curveNumber: 0}]
    }, {
        desc: 'with "typeof number" locations[i] and feature id (in *nums* label case)',
        patch: function() {
            var fig = Lib.extendDeep({}, require('@mocks/mapbox_choropleth-raw-geojson.json'));
            fig.data.shift();
            fig.data[0].locations = [100];
            fig.data[0].geojson.id = 100;
            fig.data[0].hoverinfo = 'location+name';
            return fig;
        },
        nums: '100',
        name: 'trace 0',
        evtPts: [{location: 100, z: 10, pointNumber: 0, curveNumber: 0}]
    }, {
        desc: 'with "typeof number" locations[i] and feature id (hovertemplate case)',
        patch: function() {
            var fig = Lib.extendDeep({}, require('@mocks/mapbox_choropleth-raw-geojson.json'));
            fig.data.shift();
            fig.data[0].locations = [100];
            fig.data[0].geojson.id = 100;
            fig.data[0].hovertemplate = '### %{location}<extra>%{location} ###</extra>';
            return fig;
        },
        nums: '### 100',
        name: '100 ###',
        evtPts: [{location: 100, z: 10, pointNumber: 0, curveNumber: 0}]
    }];

    specs.forEach(function(s) {
        it('@gl should generate correct hover labels ' + s.desc, function(done) {
            run(s, done);
        });
    });
});

describe('@noCI Test choroplethmapbox interactions:', function() {
    var gd;

    var geojson = {
        type: 'Feature',
        id: 'AL',
        geometry: {
            type: 'Polygon',
            coordinates: [[
                [-87.359296, 35.00118 ], [-85.606675, 34.984749 ], [-85.431413, 34.124869 ], [-85.184951, 32.859696 ],
                [-85.069935, 32.580372 ], [-84.960397, 32.421541 ], [-85.004212, 32.322956 ], [-84.889196, 32.262709 ],
                [-85.058981, 32.13674 ], [-85.053504, 32.01077 ], [-85.141136, 31.840985 ], [-85.042551, 31.539753 ],
                [-85.113751, 31.27686 ], [-85.004212, 31.003013 ], [-85.497137, 30.997536 ], [-87.600282, 30.997536 ],
                [-87.633143, 30.86609 ], [-87.408589, 30.674397 ], [-87.446927, 30.510088 ], [-87.37025, 30.427934 ],
                [-87.518128, 30.280057 ], [-87.655051, 30.247195 ], [-87.90699, 30.411504 ], [-87.934375, 30.657966 ],
                [-88.011052, 30.685351 ], [-88.10416, 30.499135 ], [-88.137022, 30.318396 ], [-88.394438, 30.367688 ],
                [-88.471115, 31.895754 ], [-88.241084, 33.796253 ], [-88.098683, 34.891641 ], [-88.202745, 34.995703 ],
                [-87.359296, 35.00118 ]
            ]]
        }
    };

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(function(done) {
        Plotly.purge(gd);
        destroyGraphDiv();
        setTimeout(done, 200);
    });

    it('@gl should be able to add and remove traces', function(done) {
        function _assert(msg, exp) {
            var map = gd._fullLayout.mapbox._subplot.map;
            var layers = map.getStyle().layers;

            expect(layers.length).toBe(exp.layerCnt, 'total # of layers |' + msg);
        }

        var trace0 = {
            type: 'choroplethmapbox',
            locations: ['AL'],
            z: [10],
            geojson: geojson
        };

        var trace1 = {
            type: 'choroplethmapbox',
            locations: ['AL'],
            z: [1],
            geojson: geojson,
            marker: {opacity: 0.3}
        };

        Plotly.plot(gd,
            [trace0, trace1],
            {mapbox: {style: 'basic'}},
            {mapboxAccessToken: MAPBOX_ACCESS_TOKEN}
        )
        .then(function() {
            _assert('base', { layerCnt: 24 });
        })
        .then(function() { return Plotly.deleteTraces(gd, [0]); })
        .then(function() {
            _assert('w/o trace0', { layerCnt: 22 });
        })
        .then(function() { return Plotly.addTraces(gd, [trace0]); })
        .then(function() {
            _assert('after adding trace0', { layerCnt: 24 });
        })
        .catch(failTest)
        .then(done);
    });

    it('@gl should be able to restyle *below*', function(done) {
        function getLayerIds() {
            var subplot = gd._fullLayout.mapbox._subplot;
            var layers = subplot.map.getStyle().layers;
            var layerIds = layers.map(function(l) { return l.id; });
            return layerIds;
        }

        Plotly.plot(gd, [{
            type: 'choroplethmapbox',
            locations: ['AL'],
            z: [10],
            geojson: geojson,
            uid: 'a'
        }], {}, {mapboxAccessToken: MAPBOX_ACCESS_TOKEN})
        .then(function() {
            expect(getLayerIds()).withContext('default *below*').toEqual([
                'background', 'landuse_overlay_national_park', 'landuse_park',
                'waterway', 'water',
                'plotly-trace-layer-a-fill', 'plotly-trace-layer-a-line',
                'building', 'tunnel_minor', 'tunnel_major', 'road_minor', 'road_major',
                'bridge_minor case', 'bridge_major case', 'bridge_minor', 'bridge_major',
                'admin_country', 'poi_label', 'road_major_label',
                'place_label_other', 'place_label_city', 'country_label'
            ]);
        })
        .then(function() { return Plotly.restyle(gd, 'below', ''); })
        .then(function() {
            expect(getLayerIds()).withContext('*below* set to \'\'').toEqual([
                'background', 'landuse_overlay_national_park', 'landuse_park',
                'waterway', 'water',
                'building', 'tunnel_minor', 'tunnel_major', 'road_minor', 'road_major',
                'bridge_minor case', 'bridge_major case', 'bridge_minor', 'bridge_major',
                'admin_country', 'poi_label', 'road_major_label',
                'place_label_other', 'place_label_city', 'country_label',
                'plotly-trace-layer-a-fill', 'plotly-trace-layer-a-line'
            ]);
        })
        .then(function() { return Plotly.restyle(gd, 'below', 'place_label_other'); })
        .then(function() {
            expect(getLayerIds()).withContext('*below* set to same base layer').toEqual([
                'background', 'landuse_overlay_national_park', 'landuse_park',
                'waterway', 'water',
                'building', 'tunnel_minor', 'tunnel_major', 'road_minor', 'road_major',
                'bridge_minor case', 'bridge_major case', 'bridge_minor', 'bridge_major',
                'admin_country', 'poi_label', 'road_major_label',
                'plotly-trace-layer-a-fill', 'plotly-trace-layer-a-line',
                'place_label_other', 'place_label_city', 'country_label',
            ]);
        })
        .then(function() { return Plotly.restyle(gd, 'below', null); })
        .then(function() {
            expect(getLayerIds()).withContext('back to default *below*').toEqual([
                'background', 'landuse_overlay_national_park', 'landuse_park',
                'waterway', 'water',
                'plotly-trace-layer-a-fill', 'plotly-trace-layer-a-line',
                'building', 'tunnel_minor', 'tunnel_major', 'road_minor', 'road_major',
                'bridge_minor case', 'bridge_major case', 'bridge_minor', 'bridge_major',
                'admin_country', 'poi_label', 'road_major_label',
                'place_label_other', 'place_label_city', 'country_label'
            ]);
        })
        .catch(failTest)
        .then(done);
    }, 5 * jasmine.DEFAULT_TIMEOUT_INTERVAL);
});
