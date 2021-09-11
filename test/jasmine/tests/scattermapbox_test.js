var Plotly = require('@lib/index');
var Plots = require('@src/plots/plots');
var Lib = require('@src/lib');
var Axes = require('@src/plots/cartesian/axes');

var ScatterMapbox = require('@src/traces/scattermapbox');
var convert = require('@src/traces/scattermapbox/convert');

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');

var supplyAllDefaults = require('../assets/supply_defaults');

var assertHoverLabelContent = require('../assets/custom_assertions').assertHoverLabelContent;
var mouseEvent = require('../assets/mouse_event');
var click = require('../assets/click');
var HOVERMINTIME = require('@src/components/fx').constants.HOVERMINTIME;

function move(fromX, fromY, toX, toY, delay) {
    return new Promise(function(resolve) {
        mouseEvent('mousemove', fromX, fromY);

        setTimeout(function() {
            mouseEvent('mousemove', toX, toY);
            resolve();
        }, delay || HOVERMINTIME + 10);
    });
}

describe('scattermapbox defaults', function() {
    'use strict';

    function _supply(traceIn) {
        var traceOut = { visible: true };
        var defaultColor = '#444';
        var layout = { _dataLength: 1 };

        ScatterMapbox.supplyDefaults(traceIn, traceOut, defaultColor, layout);

        return traceOut;
    }

    it('should not truncate \'lon\' if longer than \'lat\'', function() {
        // this is handled at the calc step now via _length.
        var fullTrace = _supply({
            lon: [1, 2, 3],
            lat: [2, 3]
        });

        expect(fullTrace.lon).toEqual([1, 2, 3]);
        expect(fullTrace.lat).toEqual([2, 3]);
        expect(fullTrace._length).toBe(2);
    });

    it('should not truncate \'lat\' if longer than \'lon\'', function() {
        // this is handled at the calc step now via _length.
        var fullTrace = _supply({
            lon: [1, 2, 3],
            lat: [2, 3, 3, 5]
        });

        expect(fullTrace.lon).toEqual([1, 2, 3]);
        expect(fullTrace.lat).toEqual([2, 3, 3, 5]);
        expect(fullTrace._length).toBe(3);
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

    it('should not fill *marker.line* in fullData while is not available', function() {
        var fullTrace = _supply({
            mode: 'markers',
            lon: [10, 20, 30],
            lat: [10, 20, 30]
        });

        expect(fullTrace.marker).toBeDefined();
        expect(fullTrace.marker.line).toBeUndefined();
    });
});

describe('scattermapbox convert', function() {
    var base = {
        type: 'scattermapbox',
        lon: [10, '20', 30, 20, null, 20, 10],
        lat: [20, 20, '10', null, 10, 10, 20]
    };

    function _convert(trace) {
        var gd = { data: [trace] };
        supplyAllDefaults(gd);

        var fullTrace = gd._fullData[0];
        Plots.doCalcdata(gd, fullTrace);

        var calcTrace = gd.calcdata[0];

        var mockAxis = {type: 'linear'};
        Axes.setConvert(mockAxis, gd._fullLayout);

        gd._fullLayout.mapbox._subplot = {
            mockAxis: mockAxis
        };

        return convert(gd, calcTrace);
    }

    function assertVisibility(opts, expectations) {
        var actual = ['fill', 'line', 'circle', 'symbol'].map(function(l) {
            return opts[l].layout.visibility;
        });

        expect(actual).toEqual(expectations, 'layer visibility');
    }

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
            property: 'mcc',
            type: 'identity'
        }, 'circle-color paint');

        expect(opts.circle.paint['circle-radius']).toEqual({
            property: 'mrc',
            type: 'identity'
        }, 'circle-radius paint');

        expect(opts.circle.paint['circle-opacity']).toBe(0.7, 'circle-opacity');

        var circleProps = opts.circle.geojson.features.map(function(f) {
            return f.properties;
        });

        // N.B repeated values have same geojson props
        expect(circleProps).toEqual([
            { 'mcc': 'rgb(220, 220, 220)', 'mrc': 5 },
            { 'mcc': '#444', 'mrc': 10 },
            { 'mcc': 'rgb(178, 10, 28)', 'mrc': 0 },
            { 'mcc': '#444', 'mrc': 0 },
            { 'mcc': '#444', 'mrc': 0 }
        ], 'geojson feature properties');
    });

    it('should fill circle-opacity correctly', function() {
        var opts = _convert(Lib.extendFlat({}, base, {
            mode: 'markers',
            marker: {
                symbol: 'circle',
                size: 10,
                color: 'red',
                opacity: [1, null, 0.5, '0.5', '1', 0, 0.8]
            },
            opacity: 0.5
        }));

        assertVisibility(opts, ['none', 'none', 'visible', 'none']);
        expect(opts.circle.paint['circle-color']).toBe('red', 'circle-color');
        expect(opts.circle.paint['circle-radius']).toBe(5, 'circle-radius');

        expect(opts.circle.paint['circle-opacity']).toEqual({
            property: 'mo',
            type: 'identity'
        }, 'circle-opacity paint');

        var circleProps = opts.circle.geojson.features.map(function(f) {
            return f.properties;
        });

        expect(circleProps).toEqual([
            { 'mo': 0.5 },
            { 'mo': 0 },
            { 'mo': 0.25 },
            // lat === null
            // lon === null
            { 'mo': 0 },
            { 'mo': 0.4 },
        ], 'geojson feature properties');
    });

    it('should fill circle props correctly during selections', function() {
        var _base = {
            type: 'scattermapbox',
            mode: 'markers',
            lon: [-10, 30, 20],
            lat: [45, 90, 180],
            marker: {symbol: 'circle'}
        };

        var specs = [{
            msg: 'base case',
            patch: {
                selectedpoints: [1, 2]
            },
            expected: {
                opacity: [0.2, 1, 1]
            }
        }, {
            msg: 'with set trace opacity',
            patch: {
                opacity: 0.5,
                selectedpoints: [1, 2]
            },
            expected: {
                opacity: [0.1, 0.5, 0.5]
            }
        }, {
            msg: 'with set scalar marker.opacity',
            patch: {
                marker: {opacity: 0.6},
                selectedpoints: [1, 2]
            },
            expected: {
                opacity: [0.12, 0.6, 0.6]
            }
        }, {
            msg: 'width set array marker.opacity',
            patch: {
                marker: {
                    opacity: [0.5, 1, 0.6],
                },
                selectedpoints: [0, 2]
            },
            expected: {
                opacity: [0.5, 0.2, 0.6]
            }
        }, {
            msg: 'with set array marker.opacity including invalid items',
            patch: {
                marker: {opacity: [2, null, -0.6]},
                selectedpoints: [0, 1, 2]
            },
            expected: {
                opacity: [1, 0, 0]
            }
        }, {
            msg: 'with set selected & unselected styles',
            patch: {
                selected: {
                    marker: {
                        opacity: 1,
                        color: 'green',
                        size: 20
                    }
                },
                unselected: {
                    marker: {
                        opacity: 0,
                        color: 'red',
                        size: 5
                    }
                },
                selectedpoints: [0, 2]
            },
            expected: {
                opacity: [1, 0, 1],
                color: ['green', 'red', 'green'],
                size: [10, 2.5, 10]
            }
        }, {
            msg: 'with set selected styles only',
            patch: {
                selected: {
                    marker: {
                        opacity: 1,
                        color: 'green',
                        size: 20
                    }
                },
                selectedpoints: [0, 2]
            },
            expected: {
                opacity: [1, 0.2, 1],
                color: ['green', '#1f77b4', 'green'],
                size: [10, 3, 10]
            }
        }, {
            msg: 'with set selected styles only + array items',
            patch: {
                marker: {
                    opacity: [0.5, 0.6, 0.7],
                    color: ['blue', 'yellow', 'cyan'],
                    size: [50, 60, 70]
                },
                selected: {
                    marker: {
                        opacity: 1,
                        color: 'green',
                        size: 20
                    }
                },
                selectedpoints: [0, 2]
            },
            expected: {
                opacity: [1, 0.12, 1],
                color: ['green', 'yellow', 'green'],
                size: [10, 30, 10]
            }
        }, {
            msg: 'with set unselected styles only',
            patch: {
                unselected: {
                    marker: {
                        opacity: 0,
                        color: 'red',
                        size: 5
                    }
                },
                selectedpoints: [0, 2]
            },
            expected: {
                opacity: [1, 0, 1],
                color: ['#1f77b4', 'red', '#1f77b4'],
                size: [3, 2.5, 3]

            }
        }, {
            msg: 'with set unselected styles only + array items',
            patch: {
                marker: {
                    opacity: [0.5, 0.6, 0.7],
                    color: ['blue', 'yellow', 'cyan'],
                    size: [50, 60, 70]
                },
                unselected: {
                    marker: {
                        opacity: 0,
                        color: 'red',
                        size: 5
                    }
                },
                selectedpoints: [0, 2]
            },
            expected: {
                opacity: [0.5, 0, 0.7],
                color: ['blue', 'red', 'cyan'],
                size: [25, 2.5, 35]
            }
        }];

        specs.forEach(function(s, i) {
            var msg0 = s.msg + ' - case ' + i + '- ';
            var opts = _convert(Lib.extendDeep({}, _base, s.patch));
            var features = opts.circle.geojson.features;

            function _assert(kProp, kExp) {
                var actual = features.map(function(f) { return f.properties[kProp]; });
                var expected = s.expected[kExp];
                var msg = msg0 + ' marker.' + kExp;

                if(Array.isArray(expected)) {
                    expect(actual).toEqual(expected, msg);
                } else {
                    actual.forEach(function(a) {
                        expect(a).toBe(undefined, msg);
                    });
                }
            }

            _assert('mo', 'opacity');
            _assert('mcc', 'color');
            // N.B. sizes in props should be half of the input values
            _assert('mrc', 'size');
        });
    });

    it('should generate correct output for fill + markers + lines traces', function() {
        var opts = _convert(Lib.extendFlat({}, base, {
            mode: 'markers+lines',
            marker: { symbol: 'circle' },
            fill: 'toself'
        }));

        assertVisibility(opts, ['visible', 'visible', 'visible', 'none']);

        var segment1 = [[10, 20], [20, 20], [30, 10]];
        var segment2 = [[20, 10], [10, 20]];

        var lineCoords = [segment1, segment2];
        var fillCoords = [[segment1], [segment2]];

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


    it('should allow symbols to be rotated and overlapped', function() {
        var opts = _convert(Lib.extendFlat({}, base, {
            mode: 'markers',
            marker: {
                symbol: ['monument', 'music', 'harbor'],
                angle: [0, 90, 45],
                allowoverlap: true
            },
        }));

        var symbolAngle = opts.symbol.geojson.features.map(function(f) {
            return f.properties.angle;
        });

        var expected = [0, 90, 45, 0, 0];
        expect(symbolAngle).toEqual(expected, 'geojson properties');


        expect(opts.symbol.layout['icon-rotate'].property).toEqual('angle', 'symbol.layout.icon-rotate');
        expect(opts.symbol.layout['icon-allow-overlap']).toEqual(true, 'symbol.layout.icon-allow-overlap');
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

        expect(actualText).toEqual(['A', 'B', 'C', 'F', undefined]);
    });

    it('should generate correct output for texttemplate without text', function() {
        var opts = _convert(Lib.extendFlat({}, base, {
            mode: 'lines+text',
            connectgaps: true,
            textposition: 'outside',
            texttemplate: ['A', 'B', 'C', 'D', 'E', 'F']
        }));

        var actualText = opts.symbol.geojson.features.map(function(f) {
            return f.properties.text;
        });

        expect(actualText).toEqual(['A', 'B', 'C', 'F', '']);
    });

    it('should convert \\n to \'\' and <br> to \\n', function() {
        var opts = _convert(Lib.extendFlat({}, base, {
            mode: 'text',
            text: ['one\nline', 'two<br>lines', 'three<BR>lines<br />yep']
        }));

        var actualText = opts.symbol.geojson.features.map(function(f) {
            return f.properties.text;
        });

        expect(actualText).toEqual(['oneline', 'two\nlines', 'three\nlines\nyep', undefined, undefined]);
    });

    it('should convert \\n to \'\' and <br> to \\n - texttemplate case', function() {
        var opts = _convert(Lib.extendFlat({}, base, {
            mode: 'text',
            texttemplate: ['%{lon}\none\nline', '%{lat}<br>two<br>lines', '%{lon}\n%{lat}<br>more<br>lines']
        }));

        var actualText = opts.symbol.geojson.features.map(function(f) {
            return f.properties.text;
        });

        expect(actualText).toEqual(['10oneline', '20\ntwo\nlines', '3010\nmore\nlines', '', '']);
    });

    it('should generate correct output for texttemplate', function() {
        var mock = {
            'type': 'scattermapbox',
            'mode': 'markers+text',
            'lon': [-73.57, -79.24, -123.06],
            'lat': [45.5, 43.4, 49.13],
            'text': ['Montreal', 'Toronto', 'Vancouver'],
            'texttemplate': '%{text} (%{lon}, %{lat}): %{customdata:.2s}',
            'textposition': 'top center',
            'customdata': [1780000, 2930000, 675218]
        };
        var opts = _convert(mock);
        var actualText = opts.symbol.geojson.features.map(function(f) {
            return f.properties.text;
        });

        expect(actualText).toEqual([
            'Montreal (−73.57, 45.5): 1.8M',
            'Toronto (−79.24, 43.4): 2.9M',
            'Vancouver (−123.06, 49.13): 680k'
        ]);
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

        expect(opts.circle.paint['circle-radius']).toEqual({
            property: 'mrc',
            type: 'identity'
        }, 'circle-radius paint');

        var radii = opts.circle.geojson.features.map(function(f) {
            return f.properties.mrc;
        });

        expect(radii).toBeCloseToArray([2.5, 24.5, 2.5], 'circle radii');
    });

    it('should generate correct output for traces with only blank points', function() {
        var opts = _convert(Lib.extendFlat({}, base, {
            mode: 'lines',
            lon: ['', null],
            lat: [null, ''],
            fill: 'toself'
        }));

        // not optimal, but doesn't break anything as mapbox-gl accepts empty
        // coordinate arrays
        assertVisibility(opts, ['visible', 'visible', 'none', 'none']);

        expect(opts.line.geojson.coordinates).toEqual([], 'line coords');
        expect(opts.fill.geojson.coordinates).toEqual([], 'fill coords');
    });
});

describe('scattermapbox hover', function() {
    var hoverPoints = ScatterMapbox.hoverPoints;
    var gd;

    beforeAll(function(done) {
        Plotly.setPlotConfig({
            mapboxAccessToken: require('@build/credentials.json').MAPBOX_ACCESS_TOKEN
        });

        gd = createGraphDiv();

        var data = [{
            type: 'scattermapbox',
            lon: [10, 20, 30, 300],
            lat: [10, 20, 30, 10],
            text: ['A', 'B', 'C', 'D']
        }];

        Plotly.newPlot(gd, data, { autosize: true }).then(done);
    });

    afterAll(function() {
        Plotly.purge(gd);
        destroyGraphDiv();
    });

    function getPointData(gd) {
        var cd = gd.calcdata;
        var subplot = gd._fullLayout.mapbox._subplot;

        return {
            index: false,
            distance: 20,
            cd: cd[0],
            trace: cd[0][0].trace,
            subplot: subplot,
            xa: subplot.xaxis,
            ya: subplot.yaxis
        };
    }

    function checkHoverLabel(pos, content) {
        mouseEvent('mousemove', pos[0], pos[1]);

        assertHoverLabelContent({
            nums: content[0],
            name: content[1]
        });
    }

    it('@gl should generate hover label info (base case)', function() {
        var xval = 11;
        var yval = 11;

        var out = hoverPoints(getPointData(gd), xval, yval)[0];

        expect(out.index).toEqual(0);
        expect([out.x0, out.x1, out.y0, out.y1]).toBeCloseToArray([
            297.444, 299.444, 105.410, 107.410
        ]);
        expect(out.extraText).toEqual('(10°, 10°)<br>A');
        expect(out.color).toEqual('#1f77b4');
    });

    it('@gl should generate hover label info (lon > 180 case)', function() {
        var xval = 301;
        var yval = 11;
        var out = hoverPoints(getPointData(gd), xval, yval)[0];

        expect(out.index).toEqual(3);
        expect([out.x0, out.x1, out.y0, out.y1]).toBeCloseToArray([
            1122.33, 1124.33, 105.41, 107.41
        ]);
        expect(out.extraText).toEqual('(10°, 300°)<br>D');
        expect(out.color).toEqual('#1f77b4');
    });

    it('@gl should skip over blank and non-string text items', function(done) {
        var xval = 11;
        var yval = 11;
        var out;

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
        .then(done, done.fail);
    });

    it('@gl should generate hover label info (positive winding case)', function() {
        var xval = 11 + 720;
        var yval = 11;

        var out = hoverPoints(getPointData(gd), xval, yval)[0];

        expect(out.index).toEqual(0);
        expect([out.x0, out.x1, out.y0, out.y1]).toBeCloseToArray([
            2345.444, 2347.444, 105.410, 107.410
        ]);
        expect(out.extraText).toEqual('(10°, 10°)<br>A');
        expect(out.color).toEqual('#1f77b4');
    });

    it('@gl should generate hover label info (negative winding case)', function() {
        var xval = 11 - 1080;
        var yval = 11;

        var out = hoverPoints(getPointData(gd), xval, yval)[0];

        expect(out.index).toEqual(0);
        expect([out.x0, out.x1, out.y0, out.y1]).toBeCloseToArray([
            -2774.555, -2772.555, 105.410, 107.410
        ]);
        expect(out.extraText).toEqual('(10°, 10°)<br>A');
        expect(out.color).toEqual('#1f77b4');
    });

    it('@gl should generate hover label info (hoverinfo: \'lon\' case)', function(done) {
        Plotly.restyle(gd, 'hoverinfo', 'lon').then(function() {
            var xval = 11;
            var yval = 11;

            var out = hoverPoints(getPointData(gd), xval, yval)[0];

            expect(out.extraText).toEqual('lon: 10°');
        })
        .then(done, done.fail);
    });

    it('@gl should generate hover label info (hoverinfo: \'lat\' case)', function(done) {
        Plotly.restyle(gd, 'hoverinfo', 'lat').then(function() {
            var xval = 11;
            var yval = 11;

            var out = hoverPoints(getPointData(gd), xval, yval)[0];

            expect(out.extraText).toEqual('lat: 10°');
        })
        .then(done, done.fail);
    });

    it('@gl should generate hover label info (hoverinfo: \'text\' + \'text\' array case)', function(done) {
        Plotly.restyle(gd, 'hoverinfo', 'text').then(function() {
            var xval = 11;
            var yval = 11;

            var out = hoverPoints(getPointData(gd), xval, yval)[0];

            expect(out.extraText).toEqual('A');
        })
        .then(done, done.fail);
    });

    it('@gl should generate hover label info (hoverinfo: \'text\' + \'hovertext\' array case)', function(done) {
        Plotly.restyle(gd, 'hovertext', ['Apple', 'Banana', 'Orange']).then(function() {
            var xval = 11;
            var yval = 11;

            var out = hoverPoints(getPointData(gd), xval, yval)[0];

            expect(out.extraText).toEqual('Apple');
        })
        .then(done, done.fail);
    });

    it('@gl should generate hover label (\'marker.color\' array case)', function(done) {
        Plotly.restyle(gd, 'marker.color', [['red', 'blue', 'green']]).then(function() {
            var out = hoverPoints(getPointData(gd), 11, 11)[0];

            expect(out.color).toEqual('red');
        })
        .then(done, done.fail);
    });

    it('@gl should generate hover label (\'marker.color\' w/ colorscale case)', function(done) {
        Plotly.restyle(gd, 'marker.color', [[10, 5, 30]]).then(function() {
            var out = hoverPoints(getPointData(gd), 11, 11)[0];

            expect(out.color).toEqual('rgb(245, 195, 157)');
        })
        .then(done, done.fail);
    });

    it('@gl should generate hover label (\'hoverinfo\' array case)', function(done) {
        function check(expected) {
            var out = hoverPoints(getPointData(gd), 11, 11)[0];
            expect(out.extraText).toEqual(expected);
        }

        Plotly.restyle(gd, 'hoverinfo', [['lon', 'lat', 'lon+lat+name']]).then(function() {
            check('lon: 10°');
            return Plotly.restyle(gd, 'hoverinfo', [['lat', 'lon', 'name']]);
        })
        .then(function() {
            check('lat: 10°');
            return Plotly.restyle(gd, 'hoverinfo', [['text', 'lon', 'name']]);
        })
        .then(function() {
            check('Apple');
            return Plotly.restyle(gd, 'hoverinfo', [[null, 'lon', 'name']]);
        })
        .then(function() {
            check('(10°, 10°)<br>Apple');
        })
        .then(done, done.fail);
    });

    it('@gl should pass along hovertemplate', function(done) {
        Plotly.restyle(gd, 'hovertemplate', 'tpl').then(function() {
            var xval = 11;
            var yval = 11;

            var out = hoverPoints(getPointData(gd), xval, yval)[0];

            expect(out.hovertemplate).toEqual('tpl');
        })
        .then(done, done.fail);
    });

    it('@gl should always display hoverlabel when hovertemplate is defined', function(done) {
        Plotly.restyle(gd, {
            name: '',
            hovertemplate: 'tpl2<extra></extra>'
        })
        .then(function() {
            checkHoverLabel([190, 215], ['tpl2', '']);
        })
        .then(done, done.fail);
    });
});

describe('Test plotly events on a scattermapbox plot:', function() {
    var mock = require('@mocks/mapbox_0.json');
    var pointPos = [440, 290];
    var nearPos = [460, 290];
    var blankPos = [10, 10];
    var mockCopy;
    var gd;

    beforeAll(function() {
        Plotly.setPlotConfig({
            mapboxAccessToken: require('@build/credentials.json').MAPBOX_ACCESS_TOKEN
        });
    });

    beforeEach(function(done) {
        gd = createGraphDiv();
        mockCopy = Lib.extendDeep({}, mock);
        mockCopy.layout.width = 800;
        mockCopy.layout.height = 500;
        Plotly.newPlot(gd, mockCopy).then(done);
    });

    afterEach(destroyGraphDiv);

    describe('click events', function() {
        var futureData;

        beforeEach(function() {
            futureData = null;

            gd.on('plotly_click', function(data) {
                futureData = data;
            });
        });

        it('@gl should not be trigged when not on data points', function() {
            click(blankPos[0], blankPos[1]);
            expect(futureData).toBe(null);
        });

        it('@gl should contain the correct fields', function() {
            click(pointPos[0], pointPos[1]);

            var pt = futureData.points[0];

            expect(Object.keys(pt).sort()).toEqual([
                'data', 'fullData', 'curveNumber', 'pointNumber', 'pointIndex', 'lon', 'lat', 'bbox'
            ].sort());

            expect(pt.curveNumber).toEqual(0, 'points[0].curveNumber');
            expect(typeof pt.data).toEqual(typeof {}, 'points[0].data');
            expect(typeof pt.fullData).toEqual(typeof {}, 'points[0].fullData');
            expect(pt.lat).toEqual(10, 'points[0].lat');
            expect(pt.lon).toEqual(10, 'points[0].lon');
            expect(pt.pointNumber).toEqual(0, 'points[0].pointNumber');
        });
    });

    describe('modified click events', function() {
        var clickOpts = {
            altKey: true,
            ctrlKey: true,
            metaKey: true,
            shiftKey: true
        };

        var futureData;

        beforeEach(function() {
            futureData = null;

            gd.on('plotly_click', function(data) {
                futureData = data;
            });
        });

        it('@gl should not be trigged when not on data points', function() {
            click(blankPos[0], blankPos[1], clickOpts);
            expect(futureData).toBe(null);
        });

        it('@gl does not register right-clicks', function() {
            click(pointPos[0], pointPos[1], clickOpts);
            expect(futureData).toBe(null);

            // TODO: 'should contain the correct fields'
            // This test passed previously, but only because assets/click
            // incorrectly generated a click event for right click. It never
            // worked in reality.
            // var pt = futureData.points[0],
            //     evt = futureData.event;

            // expect(Object.keys(pt).sort()).toEqual([
            //     'data', 'fullData', 'curveNumber', 'pointNumber', 'pointIndex', 'lon', 'lat', 'bbox'
            // ].sort());

            // expect(pt.curveNumber).toEqual(0, 'points[0].curveNumber');
            // expect(typeof pt.data).toEqual(typeof {}, 'points[0].data');
            // expect(typeof pt.fullData).toEqual(typeof {}, 'points[0].fullData');
            // expect(pt.lat).toEqual(10, 'points[0].lat');
            // expect(pt.lon).toEqual(10, 'points[0].lon');
            // expect(pt.pointNumber).toEqual(0, 'points[0].pointNumber');

            // Object.getOwnPropertyNames(clickOpts).forEach(function(opt) {
            //     expect(evt[opt]).toEqual(clickOpts[opt], 'event.' + opt);
            // });
        });
    });

    describe('hover events', function() {
        var futureData;

        beforeEach(function() {
            futureData = null;

            gd.on('plotly_hover', function(data) {
                futureData = data;
            });
        });

        it('@gl should contain the correct fields', function() {
            mouseEvent('mousemove', blankPos[0], blankPos[1]);
            mouseEvent('mousemove', pointPos[0], pointPos[1]);

            var pt = futureData.points[0];

            expect(Object.keys(pt).sort()).toEqual([
                'data', 'fullData', 'curveNumber', 'pointNumber', 'pointIndex', 'lon', 'lat', 'bbox'
            ].sort());

            expect(pt.curveNumber).toEqual(0, 'points[0].curveNumber');
            expect(typeof pt.data).toEqual(typeof {}, 'points[0].data');
            expect(typeof pt.fullData).toEqual(typeof {}, 'points[0].fullData');
            expect(pt.lat).toEqual(10, 'points[0].lat');
            expect(pt.lon).toEqual(10, 'points[0].lon');
            expect(pt.pointNumber).toEqual(0, 'points[0].pointNumber');
        });
    });

    describe('unhover events', function() {
        var futureData;

        beforeEach(function() {
            futureData = null;

            gd.on('plotly_unhover', function(data) {
                futureData = data;
            });
        });

        it('@gl should contain the correct fields', function(done) {
            move(pointPos[0], pointPos[1], nearPos[0], nearPos[1], HOVERMINTIME + 10).then(function() {
                var pt = futureData.points[0];

                expect(Object.keys(pt).sort()).toEqual([
                    'data', 'fullData', 'curveNumber', 'pointNumber', 'pointIndex', 'lon', 'lat', 'bbox'
                ].sort());

                expect(pt.curveNumber).toEqual(0, 'points[0].curveNumber');
                expect(typeof pt.data).toEqual(typeof {}, 'points[0].data');
                expect(typeof pt.fullData).toEqual(typeof {}, 'points[0].fullData');
                expect(pt.lat).toEqual(10, 'points[0].lat');
                expect(pt.lon).toEqual(10, 'points[0].lon');
                expect(pt.pointNumber).toEqual(0, 'points[0].pointNumber');
            })
            .then(done, done.fail);
        });
    });
});

describe('Test plotly events on a scattermapbox plot when css transform is present:', function() {
    var mock = require('@mocks/mapbox_0.json');
    var pointPos = [440 / 2, 290 / 2];
    var nearPos = [460 / 2, 290 / 2];
    var blankPos = [10 / 2, 10 / 2];
    var mockCopy;
    var gd;

    function transformPlot(gd, transformString) {
        gd.style.webkitTransform = transformString;
        gd.style.MozTransform = transformString;
        gd.style.msTransform = transformString;
        gd.style.OTransform = transformString;
        gd.style.transform = transformString;
    }

    beforeAll(function() {
        Plotly.setPlotConfig({
            mapboxAccessToken: require('@build/credentials.json').MAPBOX_ACCESS_TOKEN
        });
    });

    beforeEach(function(done) {
        gd = createGraphDiv();
        mockCopy = Lib.extendDeep({}, mock);
        mockCopy.layout.width = 800;
        mockCopy.layout.height = 500;

        Plotly.newPlot(gd, mockCopy)
            .then(function() { transformPlot(gd, 'translate(-25%, -25%) scale(0.5)'); })
            .then(done);
    });

    afterEach(destroyGraphDiv);

    describe('click events', function() {
        var futureData;

        beforeEach(function() {
            futureData = null;

            gd.on('plotly_click', function(data) {
                futureData = data;
            });
        });

        it('@gl should not be trigged when not on data points', function() {
            click(blankPos[0], blankPos[1]);
            expect(futureData).toBe(null);
        });

        it('@gl should contain the correct fields', function() {
            click(pointPos[0], pointPos[1]);

            var pt = futureData.points[0];

            expect(Object.keys(pt).sort()).toEqual([
                'data', 'fullData', 'curveNumber', 'pointNumber', 'pointIndex', 'lon', 'lat', 'bbox'
            ].sort());

            expect(pt.curveNumber).toEqual(0, 'points[0].curveNumber');
            expect(typeof pt.data).toEqual(typeof {}, 'points[0].data');
            expect(typeof pt.fullData).toEqual(typeof {}, 'points[0].fullData');
            expect(pt.lat).toEqual(10, 'points[0].lat');
            expect(pt.lon).toEqual(10, 'points[0].lon');
            expect(pt.pointNumber).toEqual(0, 'points[0].pointNumber');
        });
    });

    describe('hover events', function() {
        var futureData;

        beforeEach(function() {
            futureData = null;

            gd.on('plotly_hover', function(data) {
                futureData = data;
            });
        });

        it('@gl should contain the correct fields', function() {
            mouseEvent('mousemove', blankPos[0], blankPos[1]);
            mouseEvent('mousemove', pointPos[0], pointPos[1]);

            var pt = futureData.points[0];

            expect(Object.keys(pt).sort()).toEqual([
                'data', 'fullData', 'curveNumber', 'pointNumber', 'pointIndex', 'lon', 'lat', 'bbox'
            ].sort());

            expect(pt.curveNumber).toEqual(0, 'points[0].curveNumber');
            expect(typeof pt.data).toEqual(typeof {}, 'points[0].data');
            expect(typeof pt.fullData).toEqual(typeof {}, 'points[0].fullData');
            expect(pt.lat).toEqual(10, 'points[0].lat');
            expect(pt.lon).toEqual(10, 'points[0].lon');
            expect(pt.pointNumber).toEqual(0, 'points[0].pointNumber');
        });
    });

    describe('unhover events', function() {
        var futureData;

        beforeEach(function() {
            futureData = null;

            gd.on('plotly_unhover', function(data) {
                futureData = data;
            });
        });

        it('@gl should contain the correct fields', function(done) {
            move(pointPos[0], pointPos[1], nearPos[0], nearPos[1], HOVERMINTIME + 10).then(function() {
                var pt = futureData.points[0];

                expect(Object.keys(pt).sort()).toEqual([
                    'data', 'fullData', 'curveNumber', 'pointNumber', 'pointIndex', 'lon', 'lat', 'bbox'
                ].sort());

                expect(pt.curveNumber).toEqual(0, 'points[0].curveNumber');
                expect(typeof pt.data).toEqual(typeof {}, 'points[0].data');
                expect(typeof pt.fullData).toEqual(typeof {}, 'points[0].fullData');
                expect(pt.lat).toEqual(10, 'points[0].lat');
                expect(pt.lon).toEqual(10, 'points[0].lon');
                expect(pt.pointNumber).toEqual(0, 'points[0].pointNumber');
            })
            .then(done, done.fail);
        });
    });
});
