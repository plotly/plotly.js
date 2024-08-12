var Plotly = require('../../../lib/index');
var Plots = require('../../../src/plots/plots');
var Lib = require('../../../src/lib');

var convert = require('../../../src/traces/densitymap/convert');


var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var failTest = require('../assets/fail_test');
var mouseEvent = require('../assets/mouse_event');
var supplyAllDefaults = require('../assets/supply_defaults');

var assertHoverLabelContent = require('../assets/custom_assertions').assertHoverLabelContent;

describe('Test densitymap defaults:', function() {
    var gd;
    var fullData;

    function _supply(opts, layout) {
        gd = {};
        opts = Array.isArray(opts) ? opts : [opts];

        gd.data = opts.map(function(o) {
            return Lib.extendFlat({type: 'densitymap'}, o || {});
        });
        gd.layout = layout || {};

        supplyAllDefaults(gd);
        fullData = gd._fullData;
    }

    it('should set *visible:false* when *lon* and/or *lat* is missing or empty', function() {
        _supply([
            {},
            {lon: [1]},
            {lat: [1]},
            {lon: [], lat: []},
            {lon: [1], lat: []},
            {lon: [], lat: [1]}
        ]);

        fullData.forEach(function(trace, i) {
            expect(trace.visible).toBe(false, 'visible |trace #' + i);
            expect(trace._length).toBe(undefined, '_length |trace #' + i);
        });
    });
});

describe('Test densitymap convert:', function() {
    var base = function() {
        return {
            lon: [10, 20, 30],
            lat: [15, 25, 35],
            z: [1, 20, 5],
        };
    };

    function pre(trace, layout) {
        var gd = {data: [Lib.extendFlat({type: 'densitymap'}, trace)]};
        if(layout) gd.layout = layout;

        supplyAllDefaults(gd);
        Plots.doCalcdata(gd, gd._fullData[0]);

        return gd.calcdata[0];
    }

    function _convert(trace) {
        return convert(pre(trace));
    }

    function expectBlank(opts, msg) {
        expect(opts.heatmap.layout.visibility).toBe('none', msg);
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
            lon: [],
            lat: [],
            z: [],
        });
        expectBlank(opts);
    });

    describe('should fill in *z* in GeoJSON properties', function() {
        function _assert(act, prop, paint) {
            expect(extract(act, 'z')).toEqual(prop);
            expect(act.heatmap.paint['heatmap-weight']).toEqual(paint);
        }

        it('- base', function() {
            var opts = _convert(base());
            _assert(opts, [1, 20, 5], [
                'interpolate', ['linear'],
                ['get', 'z'],
                1, 0,
                20, 1
            ]);
        });

        it('- with BADNUMs', function() {
            var opts = _convert({
                lon: [10, null, 30, 40],
                lat: [null, 25, 35, 45],
                z: [1, 20, null, 10]
            });
            _assert(opts, [0, 10], [
                'interpolate', ['linear'],
                ['get', 'z'],
                1, 0,
                20, 1
            ]);
        });

        it('- w/ set zmin/zmax', function() {
            var opts = _convert(Lib.extendFlat({}, base(), {zmin: 0, zmax: 100}));
            _assert(opts, [1, 20, 5], [
                'interpolate', ['linear'],
                ['get', 'z'],
                0, 0,
                100, 1
            ]);
        });

        it('- w/o z', function() {
            var opts = _convert({
                lon: [10, 20, 30, 40],
                lat: [15, 25, 35, 45],
            });
            _assert(opts, [undefined, undefined, undefined, undefined], 1);
        });
    });

    describe('should fill in *radius* settings', function() {
        function _assert(act, prop, paint) {
            expect(extract(act, 'r')).toEqual(prop);
            expect(act.heatmap.paint['heatmap-radius']).toEqual(paint);
        }

        it('- base', function() {
            var opts = _convert(base());
            _assert(opts, [undefined, undefined, undefined], 30);
        });

        it('- arrayOk', function() {
            var opts = _convert({
                lon: [10, 20, 30, 40],
                lat: [15, 25, 35, 45],
                z: [1, 20, 5, 10],
                radius: [20, '2', -100, 'not-gonna-work']
            });
            _assert(opts, [20, 2, 0, 0], {type: 'identity', property: 'r'});
        });
    });

    it('should propagate the trace opacity', function() {
        var opts = _convert(Lib.extendFlat({}, base(), {opacity: 0.2}));
        expect(opts.heatmap.paint['heatmap-opacity']).toBe(0.2);
    });

    describe('should propagate colorscale settings', function() {
        function _assert(act, exp) {
            expect(act.heatmap.paint['heatmap-color']).toEqual(exp);
        }

        it('- base', function() {
            var opts = _convert(Lib.extendFlat(base(), {
                colorscale: [
                    [0, 'rgb(0, 0, 0)'],
                    [1, 'rgb(255, 255, 255)']
                ]
            }));
            _assert(opts, [
                'interpolate', ['linear'],
                ['heatmap-density'],
                0, 'rgba(0, 0, 0, 0)',
                1, 'rgb(255, 255, 255)'
            ]);
        });

        it('- with rgba in colorscale[0][1]', function() {
            var opts = _convert(Lib.extendFlat(base(), {
                colorscale: [
                    [0, 'rgba(0, 0, 0, 0.2)'],
                    [1, 'rgb(255, 255, 255)']
                ]
            }));
            _assert(opts, [
                'interpolate', ['linear'],
                ['heatmap-density'],
                0, 'rgba(0, 0, 0, 0.2)',
                1, 'rgb(255, 255, 255)'
            ]);
        });

        it('- w/ reversescale:true', function() {
            var opts = _convert(Lib.extendFlat(base(), {
                colorscale: [
                    [0, 'rgb(0, 0, 0)'],
                    [1, 'rgb(255, 255, 255)']
                ],
                reversescale: true
            }));
            _assert(opts, [
                'interpolate', ['linear'],
                ['heatmap-density'],
                0, 'rgba(255, 255, 255, 0)',
                1, 'rgb(0, 0, 0)'
            ]);
        });

        it('- with rgba in colorscale[0][1] and reversescale:true', function() {
            var opts = _convert(Lib.extendFlat(base(), {
                colorscale: [
                    [0, 'rgba(0, 0, 0, 0.2)'],
                    [1, 'rgba(255, 255, 255, 0.2)']
                ],
                reversescale: true
            }));
            _assert(opts, [
                'interpolate', ['linear'],
                ['heatmap-density'],
                0, 'rgba(255, 255, 255, 0.2)',
                1, 'rgba(0, 0, 0, 0.2)'
            ]);
        });
    });

    it('should work with typed array', function() {
        var opts = _convert({
            lon: new Float32Array([10, 20, 30]),
            lat: new Float32Array([15, 25, 35]),
            z: new Float32Array([1, 20, 5]),
            radius: new Float32Array([30, 20, 25])
        });

        var coords = opts.geojson.features.map(function(f) { return f.geometry.coordinates; });
        expect(coords).toEqual([ [10, 15], [20, 25], [30, 35] ]);

        expect(extract(opts, 'z')).toEqual([1, 20, 5]);
        expect(extract(opts, 'r')).toEqual([30, 20, 25]);

        var paint = opts.heatmap.paint;
        expect(paint['heatmap-weight']).toEqual([
            'interpolate', ['linear'],
            ['get', 'z'],
            1, 0,
            20, 1
        ]);
        expect(paint['heatmap-radius']).toEqual({type: 'identity', property: 'r'});
        expect(paint['heatmap-color']).toEqual([
            'interpolate', ['linear'],
            ['heatmap-density'],
            0, 'rgba(220, 220, 220, 0)',
            0.2, 'rgb(245,195,157)',
            0.4, 'rgb(245,160,105)',
            1, 'rgb(178,10,28)'
        ]);
    });
});

describe('Test densitymap hover:', function() {
    var gd;

    afterEach(function(done) {
        Plotly.purge(gd);
        destroyGraphDiv();
        setTimeout(done, 200);
    });

    function run(s, done) {
        gd = createGraphDiv();

        var fig = Lib.extendDeep({},
            s.mock || require('../../image/mocks/map_density0.json')
        );

        if(s.patch) {
            fig = s.patch(fig);
        }

        if(!fig.layout) fig.layout = {};
        if(!fig.layout.map) fig.layout.map = {};


        var pos = s.pos || [353, 143];

        return Plotly.newPlot(gd, fig).then(function() {
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
        nums: '3\n(25°, 20°)',
        name: '',
        evtPts: [{lon: 20, lat: 25, z: 3, pointNumber: 1, curveNumber: 0}]
    }, {
        desc: 'with a hovertemplate',
        patch: function(fig) {
            fig.data.forEach(function(t) {
                t.hovertemplate = '%{z:.3f}<extra>%{lon} || %{lat}</extra>';
            });
            return fig;
        },
        nums: '3.000',
        name: '20 || 25',
        evtPts: [{lon: 20, lat: 25, z: 3, pointNumber: 1, curveNumber: 0}]
    }, {
        desc: 'w/o z flag',
        patch: function(fig) {
            fig.data.forEach(function(t) {
                t.hoverinfo = 'lon+lat+name';
            });
            return fig;
        },
        nums: '(25°, 20°)',
        name: 'trace 0',
        evtPts: [{lon: 20, lat: 25, z: 3, pointNumber: 1, curveNumber: 0}]
    }, {
        desc: 'w/o z data',
        patch: function(fig) {
            fig.data.forEach(function(t) {
                delete t.z;
            });
            return fig;
        },
        nums: '(25°, 20°)',
        name: '',
        evtPts: [{lon: 20, lat: 25, pointNumber: 1, curveNumber: 0}]
    }];

    specs.forEach(function(s) {
        it('@gl should generate correct hover labels ' + s.desc, function(done) {
            run(s, done);
        });
    });
});

describe('Test densitymap interactions:', function() {
    var gd;

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
            var map = gd._fullLayout.map._subplot.map;
            var layers = map.getStyle().layers;

            expect(layers.length).toBe(exp.layerCnt, 'total # of layers |' + msg);
        }

        var trace0 = {
            type: 'densitymap',
            lon: [10, 20, 30],
            lat: [15, 25, 35],
            z: [1, 20, 5],
        };

        var trace1 = {
            type: 'densitymap',
            lon: [-10, -20, -30],
            lat: [15, 25, 35],
            z: [1, 20, 5],
        };

        Plotly.newPlot(gd,
            [trace0, trace1],
            {map: {style: 'basic'}},
            {}
        )
        .then(function() {
            _assert('base', { layerCnt: 95 });
        })
        .then(function() { return Plotly.deleteTraces(gd, [0]); })
        .then(function() {
            _assert('w/o trace0', { layerCnt: 94 });
        })
        .then(function() { return Plotly.addTraces(gd, [trace0]); })
        .then(function() {
            _assert('after adding trace0', { layerCnt: 95 });
        })
        .then(done, done.fail);
    });

    it('@gl should be able to restyle *below*', function(done) {
        function getLayerIds() {
            var subplot = gd._fullLayout.map._subplot;
            var layers = subplot.map.getStyle().layers;
            var layerIds = layers.map(function(l) { return l.id; });
            return layerIds;
        }

        Plotly.newPlot(gd, [{
            type: 'densitymap',
            lon: [10, 20, 30],
            lat: [15, 25, 35],
            z: [1, 20, 5],
            uid: 'a'
        }], {}, {})
        .then(function() {
            expect(getLayerIds()).withContext('default *below*').toEqual([
                'background', 'landcover', 'park_national_park', 'park_nature_reserve', 'landuse_residential', 'landuse', 'waterway', 'boundary_county', 'boundary_state', 'water', 'water_shadow', 'aeroway-runway', 'aeroway-taxiway', 'plotly-trace-layer-a-heatmap', 'waterway_label', 'tunnel_service_case', 'tunnel_minor_case', 'tunnel_sec_case', 'tunnel_pri_case', 'tunnel_trunk_case', 'tunnel_mot_case', 'tunnel_path', 'tunnel_service_fill', 'tunnel_minor_fill', 'tunnel_sec_fill', 'tunnel_pri_fill', 'tunnel_trunk_fill', 'tunnel_mot_fill', 'tunnel_rail', 'tunnel_rail_dash', 'road_service_case', 'road_minor_case', 'road_pri_case_ramp', 'road_trunk_case_ramp', 'road_mot_case_ramp', 'road_sec_case_noramp', 'road_pri_case_noramp', 'road_trunk_case_noramp', 'road_mot_case_noramp', 'road_path', 'road_service_fill', 'road_minor_fill', 'road_pri_fill_ramp', 'road_trunk_fill_ramp', 'road_mot_fill_ramp', 'road_sec_fill_noramp', 'road_pri_fill_noramp', 'road_trunk_fill_noramp', 'road_mot_fill_noramp', 'rail', 'rail_dash', 'bridge_service_case', 'bridge_minor_case', 'bridge_sec_case', 'bridge_pri_case', 'bridge_trunk_case', 'bridge_mot_case', 'bridge_path', 'bridge_service_fill', 'bridge_minor_fill', 'bridge_sec_fill', 'bridge_pri_fill', 'bridge_trunk_fill', 'bridge_mot_fill', 'building', 'building-top', 'boundary_country_outline', 'boundary_country_inner', 'watername_ocean', 'watername_sea', 'watername_lake', 'watername_lake_line', 'place_hamlet', 'place_suburbs', 'place_villages', 'place_town', 'place_country_2', 'place_country_1', 'place_state', 'place_continent', 'place_city_r6', 'place_city_r5', 'place_city_dot_r7', 'place_city_dot_r4', 'place_city_dot_r2', 'place_city_dot_z7', 'place_capital_dot_z7', 'poi_stadium', 'poi_park', 'roadname_minor', 'roadname_sec', 'roadname_pri', 'roadname_major', 'housenumber'
            ]);
        })
        .then(function() { return Plotly.restyle(gd, 'below', ''); })
        .then(function() {
            expect(getLayerIds()).withContext('default *below*').toEqual([
                'background', 'landcover', 'park_national_park', 'park_nature_reserve', 'landuse_residential', 'landuse', 'waterway', 'boundary_county', 'boundary_state', 'water', 'water_shadow', 'aeroway-runway', 'aeroway-taxiway', 'waterway_label', 'tunnel_service_case', 'tunnel_minor_case', 'tunnel_sec_case', 'tunnel_pri_case', 'tunnel_trunk_case', 'tunnel_mot_case', 'tunnel_path', 'tunnel_service_fill', 'tunnel_minor_fill', 'tunnel_sec_fill', 'tunnel_pri_fill', 'tunnel_trunk_fill', 'tunnel_mot_fill', 'tunnel_rail', 'tunnel_rail_dash', 'road_service_case', 'road_minor_case', 'road_pri_case_ramp', 'road_trunk_case_ramp', 'road_mot_case_ramp', 'road_sec_case_noramp', 'road_pri_case_noramp', 'road_trunk_case_noramp', 'road_mot_case_noramp', 'road_path', 'road_service_fill', 'road_minor_fill', 'road_pri_fill_ramp', 'road_trunk_fill_ramp', 'road_mot_fill_ramp', 'road_sec_fill_noramp', 'road_pri_fill_noramp', 'road_trunk_fill_noramp', 'road_mot_fill_noramp', 'rail', 'rail_dash', 'bridge_service_case', 'bridge_minor_case', 'bridge_sec_case', 'bridge_pri_case', 'bridge_trunk_case', 'bridge_mot_case', 'bridge_path', 'bridge_service_fill', 'bridge_minor_fill', 'bridge_sec_fill', 'bridge_pri_fill', 'bridge_trunk_fill', 'bridge_mot_fill', 'building', 'building-top', 'boundary_country_outline', 'boundary_country_inner', 'watername_ocean', 'watername_sea', 'watername_lake', 'watername_lake_line', 'place_hamlet', 'place_suburbs', 'place_villages', 'place_town', 'place_country_2', 'place_country_1', 'place_state', 'place_continent', 'place_city_r6', 'place_city_r5', 'place_city_dot_r7', 'place_city_dot_r4', 'place_city_dot_r2', 'place_city_dot_z7', 'place_capital_dot_z7', 'poi_stadium', 'poi_park', 'roadname_minor', 'roadname_sec', 'roadname_pri', 'roadname_major', 'housenumber', 'plotly-trace-layer-a-heatmap'
            ]);
        })
        .then(function() { return Plotly.restyle(gd, 'below', 'place_label_other'); })
        .then(function() {
            expect(getLayerIds()).withContext('default *below*').toEqual([
                'background', 'landcover', 'park_national_park', 'park_nature_reserve', 'landuse_residential', 'landuse', 'waterway', 'boundary_county', 'boundary_state', 'water', 'water_shadow', 'aeroway-runway', 'aeroway-taxiway', 'waterway_label', 'tunnel_service_case', 'tunnel_minor_case', 'tunnel_sec_case', 'tunnel_pri_case', 'tunnel_trunk_case', 'tunnel_mot_case', 'tunnel_path', 'tunnel_service_fill', 'tunnel_minor_fill', 'tunnel_sec_fill', 'tunnel_pri_fill', 'tunnel_trunk_fill', 'tunnel_mot_fill', 'tunnel_rail', 'tunnel_rail_dash', 'road_service_case', 'road_minor_case', 'road_pri_case_ramp', 'road_trunk_case_ramp', 'road_mot_case_ramp', 'road_sec_case_noramp', 'road_pri_case_noramp', 'road_trunk_case_noramp', 'road_mot_case_noramp', 'road_path', 'road_service_fill', 'road_minor_fill', 'road_pri_fill_ramp', 'road_trunk_fill_ramp', 'road_mot_fill_ramp', 'road_sec_fill_noramp', 'road_pri_fill_noramp', 'road_trunk_fill_noramp', 'road_mot_fill_noramp', 'rail', 'rail_dash', 'bridge_service_case', 'bridge_minor_case', 'bridge_sec_case', 'bridge_pri_case', 'bridge_trunk_case', 'bridge_mot_case', 'bridge_path', 'bridge_service_fill', 'bridge_minor_fill', 'bridge_sec_fill', 'bridge_pri_fill', 'bridge_trunk_fill', 'bridge_mot_fill', 'building', 'building-top', 'boundary_country_outline', 'boundary_country_inner', 'watername_ocean', 'watername_sea', 'watername_lake', 'watername_lake_line', 'place_hamlet', 'place_suburbs', 'place_villages', 'place_town', 'place_country_2', 'place_country_1', 'place_state', 'place_continent', 'place_city_r6', 'place_city_r5', 'place_city_dot_r7', 'place_city_dot_r4', 'place_city_dot_r2', 'place_city_dot_z7', 'place_capital_dot_z7', 'poi_stadium', 'poi_park', 'roadname_minor', 'roadname_sec', 'roadname_pri', 'roadname_major', 'housenumber', 'plotly-trace-layer-a-heatmap'
            ]);
        })
        .then(function() { return Plotly.restyle(gd, 'below', null); })
        .then(function() {
            expect(getLayerIds()).withContext('back to default *below*').toEqual([
                'background', 'landcover', 'park_national_park', 'park_nature_reserve', 'landuse_residential', 'landuse', 'waterway', 'boundary_county', 'boundary_state', 'water', 'water_shadow', 'aeroway-runway', 'aeroway-taxiway', 'plotly-trace-layer-a-heatmap', 'waterway_label', 'tunnel_service_case', 'tunnel_minor_case', 'tunnel_sec_case', 'tunnel_pri_case', 'tunnel_trunk_case', 'tunnel_mot_case', 'tunnel_path', 'tunnel_service_fill', 'tunnel_minor_fill', 'tunnel_sec_fill', 'tunnel_pri_fill', 'tunnel_trunk_fill', 'tunnel_mot_fill', 'tunnel_rail', 'tunnel_rail_dash', 'road_service_case', 'road_minor_case', 'road_pri_case_ramp', 'road_trunk_case_ramp', 'road_mot_case_ramp', 'road_sec_case_noramp', 'road_pri_case_noramp', 'road_trunk_case_noramp', 'road_mot_case_noramp', 'road_path', 'road_service_fill', 'road_minor_fill', 'road_pri_fill_ramp', 'road_trunk_fill_ramp', 'road_mot_fill_ramp', 'road_sec_fill_noramp', 'road_pri_fill_noramp', 'road_trunk_fill_noramp', 'road_mot_fill_noramp', 'rail', 'rail_dash', 'bridge_service_case', 'bridge_minor_case', 'bridge_sec_case', 'bridge_pri_case', 'bridge_trunk_case', 'bridge_mot_case', 'bridge_path', 'bridge_service_fill', 'bridge_minor_fill', 'bridge_sec_fill', 'bridge_pri_fill', 'bridge_trunk_fill', 'bridge_mot_fill', 'building', 'building-top', 'boundary_country_outline', 'boundary_country_inner', 'watername_ocean', 'watername_sea', 'watername_lake', 'watername_lake_line', 'place_hamlet', 'place_suburbs', 'place_villages', 'place_town', 'place_country_2', 'place_country_1', 'place_state', 'place_continent', 'place_city_r6', 'place_city_r5', 'place_city_dot_r7', 'place_city_dot_r4', 'place_city_dot_r2', 'place_city_dot_z7', 'place_capital_dot_z7', 'poi_stadium', 'poi_park', 'roadname_minor', 'roadname_sec', 'roadname_pri', 'roadname_major', 'housenumber'
            ]);
        })
        .then(done, done.fail);
    }, 5 * jasmine.DEFAULT_TIMEOUT_INTERVAL);

    it('@gl should be able to restyle from and to *scattermap*', function(done) {
        function _assert(msg, exp) {
            var traceHash = gd._fullLayout.map._subplot.traceHash;
            expect(Object.keys(traceHash).length).toBe(1, 'one visible trace| ' + msg);
            for(var k in traceHash) {
                expect(traceHash[k].type).toBe(exp, 'trace type| ' + msg);
            }
        }

        Plotly.newPlot(gd, [{
            type: 'densitymap',
            lon: [10, 20, 30],
            lat: [15, 25, 35],
            z: [1, 20, 5]
        }], {}, {

        })
        .then(function() { _assert('after first', 'densitymap'); })
        .then(function() { return Plotly.restyle(gd, 'type', 'scattermap'); })
        .then(function() { _assert('after restyle to scattermap', 'scattermap'); })
        .then(function() { return Plotly.restyle(gd, 'type', 'densitymap'); })
        .then(function() { _assert('back to densitymap', 'densitymap'); })
        .then(done, done.fail);
    }, 5 * jasmine.DEFAULT_TIMEOUT_INTERVAL);
});
