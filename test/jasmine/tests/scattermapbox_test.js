var Plotly = require('@lib');
var Plots = require('@src/plots/plots');
var Lib = require('@src/lib');

var ScatterMapbox = require('@src/traces/scattermapbox');
var convert = require('@src/traces/scattermapbox/convert');

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var customMatchers = require('../assets/custom_matchers');

Plotly.setPlotConfig({
    mapboxAccessToken: require('@build/credentials.json').MAPBOX_ACCESS_TOKEN
});


describe('scattermapbox defaults', function() {
    'use strict';

    function _supply(traceIn) {
        var traceOut = { visible: true },
            defaultColor = '#444',
            layout = { _dataLength: 1 };

        ScatterMapbox.supplyDefaults(traceIn, traceOut, defaultColor, layout);

        return traceOut;
    }

    it('should truncate \'lon\' if longer than \'lat\'', function() {
        var fullTrace = _supply({
            lon: [1, 2, 3],
            lat: [2, 3]
        });

        expect(fullTrace.lon).toEqual([1, 2]);
        expect(fullTrace.lat).toEqual([2, 3]);
    });

    it('should truncate \'lat\' if longer than \'lon\'', function() {
        var fullTrace = _supply({
            lon: [1, 2, 3],
            lat: [2, 3, 3, 5]
        });

        expect(fullTrace.lon).toEqual([1, 2, 3]);
        expect(fullTrace.lat).toEqual([2, 3, 3]);
    });

    it('should set \'visible\' to false if \'lat\' and/or \'lon\' has zero length', function() {
        var fullTrace = _supply({
            lon: [1, 2, 3],
            lat: []
        });

        expect(fullTrace.visible).toEqual(false);

        fullTrace = _supply({
            lon: null,
            lat: [1, 2, 3]
        });

        expect(fullTrace.visible).toEqual(false);
    });

    it('should set \'marker.color\' and \'marker.size\' to first item if symbol is set to \'circle\'', function() {
        var base = {
            mode: 'markers',
            lon: [1, 2, 3],
            lat: [2, 3, 3],
            marker: {
                color: ['red', 'green', 'blue'],
                size: [10, 20, 30]
            }
        };

        var fullTrace = _supply(Lib.extendDeep({}, base, {
            marker: { symbol: 'monument' }
        }));

        expect(fullTrace.marker.color).toEqual('red');
        expect(fullTrace.marker.size).toEqual(10);

        fullTrace = _supply(Lib.extendDeep({}, base, {
            marker: { symbol: ['monument', 'music', 'harbor'] }
        }));

        expect(fullTrace.marker.color).toEqual('red');
        expect(fullTrace.marker.size).toEqual(10);

        fullTrace = _supply(Lib.extendDeep({}, base, {
            marker: { symbol: 'circle' }
        }));

        expect(fullTrace.marker.color).toEqual(['red', 'green', 'blue']);
        expect(fullTrace.marker.size).toEqual([10, 20, 30]);
    });
});

describe('scattermapbox calc', function() {
    'use strict';

    function _calc(trace) {
        var gd = { data: [trace] };

        Plots.supplyDefaults(gd);

        var fullTrace = gd._fullData[0];
        return ScatterMapbox.calc(gd, fullTrace);
    }

    var base = { type: 'scattermapbox' };

    it('should place lon/lat data in lonlat pairs', function() {
        var calcTrace = _calc(Lib.extendFlat({}, base, {
            lon: [10, 20, 30],
            lat: [20, 30, 10]
        }));

        expect(calcTrace).toEqual([
            { lonlat: [10, 20] },
            { lonlat: [20, 30] },
            { lonlat: [30, 10] }
        ]);
    });

    it('should coerce numeric strings lon/lat data into numbers', function() {
        var calcTrace = _calc(Lib.extendFlat({}, base, {
            lon: [10, 20, '30', '40'],
            lat: [20, '30', 10, '50']
        }));

        expect(calcTrace).toEqual([
            { lonlat: [10, 20] },
            { lonlat: [20, 30] },
            { lonlat: [30, 10] },
            { lonlat: [40, 50] }
        ]);
    });

    it('should keep track of gaps in data', function() {
        var calcTrace = _calc(Lib.extendFlat({}, base, {
            lon: [null, 10, null, null, 20, '30', null, '40', null, 10],
            lat: [10, 20, '30', null, 10, '50', null, 60, null, null]
        }));

        expect(calcTrace).toEqual([
            { lonlat: [10, 20], gapAfter: true },
            { lonlat: [20, 10] },
            { lonlat: [30, 50], gapAfter: true },
            { lonlat: [40, 60], gapAfter: true }
        ]);
    });

    it('should fill array text (base case)', function() {
        var calcTrace = _calc(Lib.extendFlat({}, base, {
            lon: [10, 20, 30],
            lat: [20, 30, 10],
            text: ['A', 'B', 'C']
        }));

        expect(calcTrace).toEqual([
            { lonlat: [10, 20], tx: 'A' },
            { lonlat: [20, 30], tx: 'B' },
            { lonlat: [30, 10], tx: 'C' }
        ]);
    });

    it('should fill array text (invalid entry case)', function() {
        var calcTrace = _calc(Lib.extendFlat({}, base, {
            lon: [10, 20, 30],
            lat: [20, 30, 10],
            text: ['A', 'B', null]
        }));

        expect(calcTrace).toEqual([
            { lonlat: [10, 20], tx: 'A' },
            { lonlat: [20, 30], tx: 'B' },
            { lonlat: [30, 10], tx: '' }
        ]);
    });

    it('should fill array marker attributes (base case)', function() {
        var calcTrace = _calc(Lib.extendFlat({}, base, {
            lon: [10, 20, null, 30],
            lat: [20, 30, null, 10],
            marker: {
                color: ['red', 'blue', 'green', 'yellow'],
                size: [10, 20, 8, 10]
            }
        }));

        expect(calcTrace).toEqual([
            { lonlat: [10, 20], mc: 'red', ms: 10, mcc: 'red', mrc: 5 },
            { lonlat: [20, 30], mc: 'blue', ms: 20, mcc: 'blue', mrc: 10, gapAfter: true },
            { lonlat: [30, 10], mc: 'yellow', ms: 10, mcc: 'yellow', mrc: 5 }
        ]);
    });

    it('should fill array marker attributes (invalid scale case)', function() {
        var calcTrace = _calc(Lib.extendFlat({}, base, {
            lon: [10, 20, null, 30],
            lat: [20, 30, null, 10],
            marker: {
                color: [0, null, 5, 10],
                size: [10, NaN, 8, 10],
                colorscale: [
                    [0, 'blue'], [0.5, 'red'], [1, 'green']
                ]
            }
        }));

        expect(calcTrace).toEqual([
            { lonlat: [10, 20], mc: 0, ms: 10, mcc: 'rgb(0, 0, 255)', mrc: 5 },
            { lonlat: [20, 30], mc: null, ms: NaN, mcc: '#444', mrc: 0, gapAfter: true },
            { lonlat: [30, 10], mc: 10, ms: 10, mcc: 'rgb(0, 128, 0)', mrc: 5 }
        ]);
    });

    it('should fill marker attributes (symbol case)', function() {
        var calcTrace = _calc(Lib.extendFlat({}, base, {
            lon: [10, 20, null, 30],
            lat: [20, 30, null, 10],
            marker: {
                symbol: ['monument', 'music', 'harbor', null]
            }
        }));

        expect(calcTrace).toEqual([
            { lonlat: [10, 20], mx: 'monument' },
            { lonlat: [20, 30], mx: 'music', gapAfter: true },
            { lonlat: [30, 10], mx: 'circle' }
        ]);
    });
});

describe('scattermapbox convert', function() {
    'use strict';

    beforeAll(function() {
        jasmine.addMatchers(customMatchers);
    });

    function _convert(trace) {
        var gd = { data: [trace] };
        Plots.supplyDefaults(gd);

        var fullTrace = gd._fullData[0];
        Plots.doCalcdata(gd, fullTrace);

        var calcTrace = gd.calcdata[0];
        return convert(calcTrace);
    }

    var base = {
        type: 'scattermapbox',
        lon: [10, '20', 30, 20, null, 20, 10],
        lat: [20, 20, '10', null, 10, 10, 20]
    };

    it('should generate correct output for markers + circle bubbles traces', function() {
        var opts = _convert(Lib.extendFlat({}, base, {
            mode: 'markers',
            marker: {
                symbol: 'circle',
                size: [10, 20, null, 10, '10'],
                color: [10, null, '30', 20, 10]
            }
        }));

        assertVisibility(opts, ['none', 'none', 'visible', 'none']);

        expect(opts.circle.paint['circle-color']).toEqual({
            property: 'circle-color',
            stops: [
                [0, 'rgb(220, 220, 220)'], [1, '#444'], [2, 'rgb(178, 10, 28)']
            ]
        }, 'circle-color stops');

        expect(opts.circle.paint['circle-radius']).toEqual({
            property: 'circle-radius',
            stops: [ [0, 5], [1, 10], [2, 0] ]
        }, 'circle-radius stops');

        var circleProps = opts.circle.geojson.features.map(function(f) {
            return f.properties;
        });

        // N.B repeated values have same geojson props
        expect(circleProps).toEqual([
            { 'circle-color': 0, 'circle-radius': 0 },
            { 'circle-color': 1, 'circle-radius': 1 },
            { 'circle-color': 2, 'circle-radius': 2 },
            { 'circle-color': 1, 'circle-radius': 2 },
            { 'circle-color': 1, 'circle-radius': 2 }
        ], 'geojson feature properties');
    });

    it('should generate correct output for fill + markers + lines traces', function() {
        var opts = _convert(Lib.extendFlat({}, base, {
            mode: 'markers+lines',
            marker: { symbol: 'circle' },
            fill: 'toself'
        }));

        assertVisibility(opts, ['visible', 'visible', 'visible', 'none']);

        var segment1 = [[10, 20], [20, 20], [30, 10]],
            segment2 = [[20, 10], [10, 20]];

        var lineCoords = [segment1, segment2],
            fillCoords = [[segment1], [segment2]];

        expect(opts.line.geojson.coordinates).toEqual(lineCoords, 'line coords');
        expect(opts.fill.geojson.coordinates).toEqual(fillCoords, 'fill coords');

        var circleCoords = opts.circle.geojson.features.map(function(f) {
            return f.geometry.coordinates;
        });

        expect(circleCoords).toEqual([
            [10, 20], [20, 20], [30, 10], [20, 10], [10, 20]
        ], 'circle coords');
    });

    it('should generate correct output for markers + non-circle traces', function() {
        var opts = _convert(Lib.extendFlat({}, base, {
            mode: 'markers',
            marker: { symbol: 'monument' }
        }));

        assertVisibility(opts, ['none', 'none', 'none', 'visible']);

        var symbolProps = opts.symbol.geojson.features.map(function(f) {
            return [f.properties.symbol, f.properties.text];
        });

        var expected = opts.symbol.geojson.features.map(function() {
            return ['monument', ''];
        });

        expect(symbolProps).toEqual(expected, 'geojson properties');
    });

    it('should generate correct output for text + lines traces', function() {
        var opts = _convert(Lib.extendFlat({}, base, {
            mode: 'lines+text',
            connectgaps: true,
            text: ['A', 'B', 'C', 'D', 'E', 'F']
        }));

        assertVisibility(opts, ['none', 'visible', 'none', 'visible']);

        var lineCoords = [
            [10, 20], [20, 20], [30, 10], [20, 10], [10, 20]
        ];

        expect(opts.line.geojson.coordinates).toEqual(lineCoords, 'line coords');

        var actualText = opts.symbol.geojson.features.map(function(f) {
            return f.properties.text;
        });

        expect(actualText).toEqual(['A', 'B', 'C', 'F', '']);
    });

    it('should generate correct output for lines traces with trailing gaps', function() {
        var opts = _convert(Lib.extendFlat({}, base, {
            mode: 'lines',
            lon: [10, '20', 30, 20, null, 20, 10, null, null],
            lat: [20, 20, '10', null, 10, 10, 20, null]
        }));

        assertVisibility(opts, ['none', 'visible', 'none', 'none']);

        var lineCoords = [
            [[10, 20], [20, 20], [30, 10]],
            [[20, 10], [10, 20]]
        ];

        expect(opts.line.geojson.coordinates).toEqual(lineCoords, 'have correct line coords');
    });

    it('should correctly convert \'textposition\' to \'text-anchor\' and \'text-offset\'', function() {
        var specs = {
            'top left': ['top-right', [-0.65, -1.65]],
            'top center': ['top', [0, -1.65]],
            'top right': ['top-left', [0.65, -1.65]],
            'middle left': ['right', [-0.65, 0]],
            'middle center': ['center', [0, 0]],
            'middle right': ['left', [0.65, 0]],
            'bottom left': ['bottom-right', [-0.65, 1.65]],
            'bottom center': ['bottom', [0, 1.65]],
            'bottom right': ['bottom-left', [0.65, 1.65]]
        };

        Object.keys(specs).forEach(function(k) {
            var spec = specs[k];

            var opts = _convert(Lib.extendFlat({}, base, {
                textposition: k,
                mode: 'text+markers',
                marker: { size: 15 },
                text: ['A', 'B', 'C']
            }));

            expect([
                opts.symbol.layout['text-anchor'],
                opts.symbol.layout['text-offset']
            ]).toEqual(spec, '(case ' + k + ')');
        });
    });

    it('should generate correct output for markers + circle bubbles traces with repeated values', function() {
        var opts = _convert(Lib.extendFlat({}, base, {
            lon: ['-96.796988', '-81.379236', '-85.311819', ''],
            lat: ['32.776664', '28.538335', '35.047157', '' ],
            marker: { size: ['5', '49', '5', ''] }
        }));

        expect(opts.circle.paint['circle-radius'].stops)
            .toBeCloseTo2DArray([[0, 2.5], [1, 24.5]], 'no replicate stops');

        var radii = opts.circle.geojson.features.map(function(f) {
            return f.properties['circle-radius'];
        });

        expect(radii).toBeCloseToArray([0, 1, 0], 'link features to correct stops');
    });

    it('should generate correct output for traces with only blank points', function() {
        var opts = _convert(Lib.extendFlat({}, base, {
            mode: 'lines',
            lon: ['', null],
            lat: [null, ''],
            fill: 'toself'
        }));

        assertVisibility(opts, ['none', 'none', 'none', 'none']);

        expect(opts.line.geojson.coordinates).toEqual([], 'line coords');
        expect(opts.fill.geojson.coordinates).toEqual([], 'fill coords');
    });

    function assertVisibility(opts, expectations) {
        var actual = ['fill', 'line', 'circle', 'symbol'].map(function(l) {
            return opts[l].layout.visibility;
        });

        expect(actual).toEqual(expectations, 'layer visibility');
    }
});

describe('@noCI scattermapbox hover', function() {
    'use strict';

    var hoverPoints = ScatterMapbox.hoverPoints;

    var gd;

    beforeAll(function(done) {
        jasmine.addMatchers(customMatchers);

        gd = createGraphDiv();

        var data = [{
            type: 'scattermapbox',
            lon: [10, 20, 30],
            lat: [10, 20, 30],
            text: ['A', 'B', 'C']
        }];

        Plotly.plot(gd, data, { autosize: true }).then(done);
    });

    afterAll(function() {
        Plotly.purge(gd);
        destroyGraphDiv();
    });

    function getPointData(gd) {
        var cd = gd.calcdata,
            mapbox = gd._fullLayout.mapbox._subplot;

        return {
            index: false,
            distance: 20,
            cd: cd[0],
            trace: cd[0][0].trace,
            xa: mapbox.xaxis,
            ya: mapbox.yaxis
        };
    }

    it('should generate hover label info (base case)', function() {
        var xval = 11,
            yval = 11;

        var out = hoverPoints(getPointData(gd), xval, yval)[0];

        expect(out.index).toEqual(0);
        expect([out.x0, out.x1, out.y0, out.y1]).toBeCloseToArray([
            297.444, 299.444, 105.410, 107.410
        ]);
        expect(out.extraText).toEqual('(10°, 10°)<br>A');
        expect(out.color).toEqual('#1f77b4');
    });

    it('should skip over blank and non-string text items', function(done) {
        var xval = 11,
            yval = 11,
            out;

        Plotly.restyle(gd, 'text', [['', 'B', 'C']]).then(function() {
            out = hoverPoints(getPointData(gd), xval, yval)[0];
            expect(out.extraText).toEqual('(10°, 10°)');

            return Plotly.restyle(gd, 'text', [[null, 'B', 'C']]);
        })
        .then(function() {
            out = hoverPoints(getPointData(gd), xval, yval)[0];
            expect(out.extraText).toEqual('(10°, 10°)');

            return Plotly.restyle(gd, 'text', [[false, 'B', 'C']]);
        })
        .then(function() {
            out = hoverPoints(getPointData(gd), xval, yval)[0];
            expect(out.extraText).toEqual('(10°, 10°)');

            return Plotly.restyle(gd, 'text', [['A', 'B', 'C']]);
        })
        .then(function() {
            out = hoverPoints(getPointData(gd), xval, yval)[0];
            expect(out.extraText).toEqual('(10°, 10°)<br>A');
        })
        .then(done);
    });

    it('should generate hover label info (positive winding case)', function() {
        var xval = 11 + 720,
            yval = 11;

        var out = hoverPoints(getPointData(gd), xval, yval)[0];

        expect(out.index).toEqual(0);
        expect([out.x0, out.x1, out.y0, out.y1]).toBeCloseToArray([
            2345.444, 2347.444, 105.410, 107.410
        ]);
        expect(out.extraText).toEqual('(10°, 10°)<br>A');
        expect(out.color).toEqual('#1f77b4');
    });

    it('should generate hover label info (negative winding case)', function() {
        var xval = 11 - 1080,
            yval = 11;

        var out = hoverPoints(getPointData(gd), xval, yval)[0];

        expect(out.index).toEqual(0);
        expect([out.x0, out.x1, out.y0, out.y1]).toBeCloseToArray([
            -2774.555, -2772.555, 105.410, 107.410
        ]);
        expect(out.extraText).toEqual('(10°, 10°)<br>A');
        expect(out.color).toEqual('#1f77b4');
    });

    it('should generate hover label info (hoverinfo: \'lon\' case)', function(done) {
        Plotly.restyle(gd, 'hoverinfo', 'lon').then(function() {
            var xval = 11,
                yval = 11;

            var out = hoverPoints(getPointData(gd), xval, yval)[0];

            expect(out.extraText).toEqual('lon: 10°');
            done();
        });
    });

    it('should generate hover label info (hoverinfo: \'lat\' case)', function(done) {
        Plotly.restyle(gd, 'hoverinfo', 'lat').then(function() {
            var xval = 11,
                yval = 11;

            var out = hoverPoints(getPointData(gd), xval, yval)[0];

            expect(out.extraText).toEqual('lat: 10°');
            done();
        });
    });

    it('should generate hover label info (hoverinfo: \'text\' case)', function(done) {
        Plotly.restyle(gd, 'hoverinfo', 'text').then(function() {
            var xval = 11,
                yval = 11;

            var out = hoverPoints(getPointData(gd), xval, yval)[0];

            expect(out.extraText).toEqual('A');
            done();
        });
    });
});
