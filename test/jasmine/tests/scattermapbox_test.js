var Plotly = require('@lib');
var Plots = require('@src/plots/plots');
var Lib = require('@src/lib');

var ScatterMapbox = require('@src/traces/scattermapbox');
var convert = require('@src/traces/scattermapbox/convert');

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var fail = require('../assets/fail_test');
var supplyAllDefaults = require('../assets/supply_defaults');

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
        var traceOut = { visible: true },
            defaultColor = '#444',
            layout = { _dataLength: 1 };

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
});

describe('scattermapbox convert', function() {
    'use strict';

    function _convert(trace) {
        var gd = { data: [trace] };
        supplyAllDefaults(gd);

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

        expect(opts.circle.paint['circle-opacity']).toBe(0.7, 'circle-opacity');

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
            property: 'circle-opacity',
            stops: [ [0, 0.5], [1, 0], [2, 0.25], [6, 0.4] ]
        }, 'circle-opacity stops');

        var circleProps = opts.circle.geojson.features.map(function(f) {
            return f.properties;
        });


        expect(circleProps).toEqual([
            { 'circle-opacity': 0 },
            { 'circle-opacity': 1 },
            { 'circle-opacity': 2 },
            // lat === null
            // lon === null
            { 'circle-opacity': 1 },
            { 'circle-opacity': 6 },
        ], 'geojson feature properties');
    });

    it('should fill circle-opacity correctly during selections', function() {
        var _base = {
            type: 'scattermapbox',
            mode: 'markers',
            lon: [-10, 30, 20],
            lat: [45, 90, 180],
            marker: {symbol: 'circle'}
        };

        var specs = [{
            patch: {
                selectedpoints: [1, 2]
            },
            expected: {stops: [[0, 0.2], [1, 1]], props: [0, 1, 1]}
        }, {
            patch: {
                opacity: 0.5,
                selectedpoints: [1, 2]
            },
            expected: {stops: [[0, 0.1], [1, 0.5]], props: [0, 1, 1]}
        }, {
            patch: {
                marker: {opacity: 0.6},
                selectedpoints: [1, 2]
            },
            expected: {stops: [[0, 0.12], [1, 0.6]], props: [0, 1, 1]}
        }, {
            patch: {
                marker: {
                    opacity: [0.5, 1, 0.6],
                },
                selectedpoints: [0, 2]
            },
            expected: {stops: [[0, 0.5], [1, 0.2], [2, 0.6]], props: [0, 1, 2]}
        }, {
            patch: {
                marker: {opacity: [2, null, -0.6]},
                selectedpoints: [0, 1, 2]
            },
            expected: {stops: [[0, 1], [1, 0]], props: [0, 1, 1]}
        }];

        specs.forEach(function(s, i) {
            var msg0 = '- case ' + i + ' ';
            var opts = _convert(Lib.extendDeep({}, _base, s.patch));

            expect(opts.circle.paint['circle-opacity'].stops)
                .toEqual(s.expected.stops, msg0 + 'stops');

            var props = opts.circle.geojson.features.map(function(f) {
                return f.properties['circle-opacity'];
            });

            expect(props).toEqual(s.expected.props, msg0 + 'props');
        });
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

        expect(actualText).toEqual(['A', 'B', 'C', 'F', undefined]);
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

        // not optimal, but doesn't break anything as mapbox-gl accepts empty
        // coordinate arrays
        assertVisibility(opts, ['visible', 'visible', 'none', 'none']);

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
        Plotly.setPlotConfig({
            mapboxAccessToken: require('@build/credentials.json').MAPBOX_ACCESS_TOKEN
        });

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

    it('should generate hover label info (hoverinfo: \'text\' + \'text\' array case)', function(done) {
        Plotly.restyle(gd, 'hoverinfo', 'text').then(function() {
            var xval = 11,
                yval = 11;

            var out = hoverPoints(getPointData(gd), xval, yval)[0];

            expect(out.extraText).toEqual('A');
            done();
        });
    });

    it('should generate hover label info (hoverinfo: \'text\' + \'hovertext\' array case)', function(done) {
        Plotly.restyle(gd, 'hovertext', ['Apple', 'Banana', 'Orange']).then(function() {
            var xval = 11,
                yval = 11;

            var out = hoverPoints(getPointData(gd), xval, yval)[0];

            expect(out.extraText).toEqual('Apple');
            done();
        });
    });

    it('should generate hover label (\'marker.color\' array case)', function(done) {
        Plotly.restyle(gd, 'marker.color', [['red', 'blue', 'green']]).then(function() {
            var out = hoverPoints(getPointData(gd), 11, 11)[0];

            expect(out.color).toEqual('red');
        })
        .then(done);
    });

    it('should generate hover label (\'marker.color\' w/ colorscale case)', function(done) {
        Plotly.restyle(gd, 'marker.color', [[10, 5, 30]]).then(function() {
            var out = hoverPoints(getPointData(gd), 11, 11)[0];

            expect(out.color).toEqual('rgb(245, 195, 157)');
        })
        .then(done);
    });

    it('should generate hover label (\'hoverinfo\' array case)', function(done) {
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
        .catch(fail)
        .then(done);
    });
});

describe('@noCI Test plotly events on a scattermapbox plot:', function() {
    var mock = require('@mocks/mapbox_0.json');

    var mockCopy, gd;

    var blankPos = [10, 10],
        pointPos,
        nearPos;

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

    beforeAll(function(done) {
        Plotly.setPlotConfig({
            mapboxAccessToken: require('@build/credentials.json').MAPBOX_ACCESS_TOKEN
        });

        gd = createGraphDiv();
        mockCopy = Lib.extendDeep({}, mock);

        Plotly.plot(gd, mockCopy.data, mockCopy.layout).then(function() {
            var bb = gd._fullLayout.mapbox._subplot.div.getBoundingClientRect(),
                xval = 10,
                yval = 10,
                point = ScatterMapbox.hoverPoints(getPointData(gd), xval, yval)[0];
            pointPos = [Math.floor(bb.left + (point.x0 + point.x1) / 2),
                Math.floor(bb.top + (point.y0 + point.y1) / 2)];
            nearPos = [pointPos[0] - 30, pointPos[1] - 30];
        }).then(destroyGraphDiv).then(done);
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

            futureData = undefined;
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
                'data', 'fullData', 'curveNumber', 'pointNumber', 'pointIndex', 'lon', 'lat'
            ]);

            expect(pt.curveNumber).toEqual(0, 'points[0].curveNumber');
            expect(typeof pt.data).toEqual(typeof {}, 'points[0].data');
            expect(typeof pt.fullData).toEqual(typeof {}, 'points[0].fullData');
            expect(pt.lat).toEqual(10, 'points[0].lat');
            expect(pt.lon).toEqual(10, 'points[0].lon');
            expect(pt.pointNumber).toEqual(0, 'points[0].pointNumber');

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

            futureData = undefined;
            gd.on('plotly_click', function(data) {
                futureData = data;
            });
        });

        it('should not be trigged when not on data points', function() {
            click(blankPos[0], blankPos[1], clickOpts);
            expect(futureData).toBe(undefined);
        });

        it('does not register right-clicks', function() {
            click(pointPos[0], pointPos[1], clickOpts);
            expect(futureData).toBe(undefined);

            // TODO: 'should contain the correct fields'
            // This test passed previously, but only because assets/click
            // incorrectly generated a click event for right click. It never
            // worked in reality.
            // var pt = futureData.points[0],
            //     evt = futureData.event;

            // expect(Object.keys(pt)).toEqual([
            //     'data', 'fullData', 'curveNumber', 'pointNumber', 'pointIndex', 'lon', 'lat'
            // ]);

            // expect(pt.curveNumber).toEqual(0, 'points[0].curveNumber');
            // expect(typeof pt.data).toEqual(typeof {}, 'points[0].data');
            // expect(typeof pt.fullData).toEqual(typeof {}, 'points[0].fullData');
            // expect(pt.lat).toEqual(10, 'points[0].lat');
            // expect(pt.lon).toEqual(10, 'points[0].lon');
            // expect(pt.pointNumber).toEqual(0, 'points[0].pointNumber');

            // expect(evt.clientX).toEqual(pointPos[0], 'event.clientX');
            // expect(evt.clientY).toEqual(pointPos[1], 'event.clientY');
            // Object.getOwnPropertyNames(clickOpts).forEach(function(opt) {
            //     expect(evt[opt]).toEqual(clickOpts[opt], 'event.' + opt);
            // });
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
                'data', 'fullData', 'curveNumber', 'pointNumber', 'pointIndex', 'lon', 'lat'
            ]);

            expect(pt.curveNumber).toEqual(0, 'points[0].curveNumber');
            expect(typeof pt.data).toEqual(typeof {}, 'points[0].data');
            expect(typeof pt.fullData).toEqual(typeof {}, 'points[0].fullData');
            expect(pt.lat).toEqual(10, 'points[0].lat');
            expect(pt.lon).toEqual(10, 'points[0].lon');
            expect(pt.pointNumber).toEqual(0, 'points[0].pointNumber');

            expect(evt.clientX).toBeDefined('event.clientX');
            expect(evt.clientY).toBeDefined('event.clientY');
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
                    'data', 'fullData', 'curveNumber', 'pointNumber', 'pointIndex', 'lon', 'lat'
                ]);

                expect(pt.curveNumber).toEqual(0, 'points[0].curveNumber');
                expect(typeof pt.data).toEqual(typeof {}, 'points[0].data');
                expect(typeof pt.fullData).toEqual(typeof {}, 'points[0].fullData');
                expect(pt.lat).toEqual(10, 'points[0].lat');
                expect(pt.lon).toEqual(10, 'points[0].lon');
                expect(pt.pointNumber).toEqual(0, 'points[0].pointNumber');

                expect(evt.clientX).toBeDefined('event.clientX');
                expect(evt.clientY).toBeDefined('event.clientY');
            }).then(done);
        });
    });
});
