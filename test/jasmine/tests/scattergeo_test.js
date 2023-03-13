var Plotly = require('../../../lib/index');
var Lib = require('../../../src/lib');
var BADNUM = require('../../../src/constants/numerical').BADNUM;
var loggers = require('../../../src/lib/loggers');

var ScatterGeo = require('../../../src/traces/scattergeo');

var d3Select = require('../../strict-d3').select;
var d3SelectAll = require('../../strict-d3').selectAll;
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var mouseEvent = require('../assets/mouse_event');

var customAssertions = require('../assets/custom_assertions');
var assertHoverLabelStyle = customAssertions.assertHoverLabelStyle;
var assertHoverLabelContent = customAssertions.assertHoverLabelContent;
var checkTextTemplate = require('../assets/check_texttemplate');

var supplyAllDefaults = require('../assets/supply_defaults');

describe('Test scattergeo defaults', function() {
    var traceIn,
        traceOut;

    var defaultColor = '#444';
    var layout = {};

    beforeEach(function() {
        traceOut = {};
    });

    it('should not slice lat if it it longer than lon', function() {
        // this is handled at the calc step now via _length.
        traceIn = {
            lon: [-75],
            lat: [45, 45, 45]
        };

        ScatterGeo.supplyDefaults(traceIn, traceOut, defaultColor, layout);
        expect(traceOut.lat).toEqual([45, 45, 45]);
        expect(traceOut.lon).toEqual([-75]);
        expect(traceOut._length).toBe(1);
    });

    it('should slice lon if it it longer than lat', function() {
        // this is handled at the calc step now via _length.
        traceIn = {
            lon: [-75, -75, -75],
            lat: [45]
        };

        ScatterGeo.supplyDefaults(traceIn, traceOut, defaultColor, layout);
        expect(traceOut.lat).toEqual([45]);
        expect(traceOut.lon).toEqual([-75, -75, -75]);
        expect(traceOut._length).toBe(1);
    });

    it('should not coerce lat and lon if locations is valid', function() {
        traceIn = {
            locations: ['CAN', 'USA'],
            lon: [20, 40],
            lat: [20, 40]
        };

        ScatterGeo.supplyDefaults(traceIn, traceOut, defaultColor, layout);
        expect(traceOut.lon).toBeUndefined();
        expect(traceOut.lat).toBeUndefined();
    });

    it('should make trace invisible if lon or lat is omitted and locations not given', function() {
        function testOne() {
            ScatterGeo.supplyDefaults(traceIn, traceOut, defaultColor, layout);
            expect(traceOut.visible).toBe(false);
        }

        traceIn = {
            lat: [45, 45, 45]
        };
        testOne();

        traceIn = {
            lon: [-75, -75, -75]
        };
        traceOut = {};
        testOne();

        traceIn = {};
        traceOut = {};
        testOne();
    });

    it('should default locationmode to *geojson-id* when a valid *geojson* is provided', function() {
        traceIn = {
            locations: ['CAN', 'USA'],
            geojson: 'url'
        };
        traceOut = {};
        ScatterGeo.supplyDefaults(traceIn, traceOut, defaultColor, layout);
        expect(traceOut.locationmode).toBe('geojson-id', 'valid url string');

        traceIn = {
            locations: ['CAN', 'USA'],
            geojson: {}
        };
        traceOut = {};
        ScatterGeo.supplyDefaults(traceIn, traceOut, defaultColor, layout);
        expect(traceOut.locationmode).toBe('geojson-id', 'valid object');

        traceIn = {
            locations: ['CAN', 'USA'],
            geojson: ''
        };
        traceOut = {};
        ScatterGeo.supplyDefaults(traceIn, traceOut, defaultColor, layout);
        expect(traceOut.locationmode).toBe('ISO-3', 'invalid sting');

        traceIn = {
            locations: ['CAN', 'USA'],
            geojson: []
        };
        traceOut = {};
        ScatterGeo.supplyDefaults(traceIn, traceOut, defaultColor, layout);
        expect(traceOut.locationmode).toBe('ISO-3', 'invalid object');

        traceIn = {
            lon: [20, 40],
            lat: [20, 40]
        };
        traceOut = {};
        ScatterGeo.supplyDefaults(traceIn, traceOut, defaultColor, layout);
        expect(traceOut.locationmode).toBe(undefined, 'lon/lat coordinates');
    });

    it('should only coerce *featureidkey* when locationmode is *geojson-id', function() {
        traceIn = {
            locations: ['CAN', 'USA'],
            geojson: 'url',
            featureidkey: 'properties.name'
        };
        traceOut = {};
        ScatterGeo.supplyDefaults(traceIn, traceOut, defaultColor, layout);
        expect(traceOut.featureidkey).toBe('properties.name', 'coerced');

        traceIn = {
            locations: ['CAN', 'USA'],
            featureidkey: 'properties.name'
        };
        traceOut = {};
        ScatterGeo.supplyDefaults(traceIn, traceOut, defaultColor, layout);
        expect(traceOut.featureidkey).toBe(undefined, 'NOT coerced');
    });
});

describe('Test scattergeo calc', function() {
    function _calc(opts) {
        var base = { type: 'scattergeo' };
        var trace = Lib.extendFlat({}, base, opts);
        var gd = { data: [trace] };

        supplyAllDefaults(gd);

        var fullTrace = gd._fullData[0];
        return ScatterGeo.calc(gd, fullTrace).map(function(obj) {
            delete obj.i;
            delete obj.t;
            return obj;
        });
    }

    it('should place lon/lat data in lonlat pairs', function() {
        var calcTrace = _calc({
            lon: [10, 20, 30],
            lat: [20, 30, 10]
        });

        expect(calcTrace).toEqual([
            { lonlat: [10, 20] },
            { lonlat: [20, 30] },
            { lonlat: [30, 10] }
        ]);
    });

    it('should coerce numeric strings lon/lat data into numbers', function() {
        var calcTrace = _calc({
            lon: [10, 20, '30', '40'],
            lat: [20, '30', 10, '50']
        });

        expect(calcTrace).toEqual([
            { lonlat: [10, 20] },
            { lonlat: [20, 30] },
            { lonlat: [30, 10] },
            { lonlat: [40, 50] }
        ]);
    });

    it('should set non-numeric values lon/lat pairs to BADNUM', function() {
        var calcTrace = _calc({
            lon: [null, 10, null, null, 20, '30', null, '40', null, 10],
            lat: [10, 20, '30', null, 10, '50', null, 60, null, null]
        });

        expect(calcTrace).toEqual([
            { lonlat: [BADNUM, BADNUM] },
            { lonlat: [10, 20] },
            { lonlat: [BADNUM, BADNUM] },
            { lonlat: [BADNUM, BADNUM] },
            { lonlat: [20, 10] },
            { lonlat: [30, 50] },
            { lonlat: [BADNUM, BADNUM] },
            { lonlat: [40, 60] },
            { lonlat: [BADNUM, BADNUM] },
            { lonlat: [BADNUM, BADNUM] }
        ]);
    });

    it('should fill array text (base case)', function() {
        var calcTrace = _calc({
            lon: [10, 20, 30, null, 40],
            lat: [20, 30, 10, 'no-good', 50],
            text: ['A', 'B', 'C', 'D', 'E']
        });

        expect(calcTrace).toEqual([
            { lonlat: [10, 20], tx: 'A' },
            { lonlat: [20, 30], tx: 'B' },
            { lonlat: [30, 10], tx: 'C' },
            { lonlat: [BADNUM, BADNUM], tx: 'D' },
            { lonlat: [40, 50], tx: 'E' }
        ]);
    });

    it('should fill array text (invalid entry case)', function() {
        var calcTrace = _calc({
            lon: [10, 20, 30, null, 40],
            lat: [20, 30, 10, 'no-good', 50],
            text: ['A', null, 'C', 'D', {}]
        });

        expect(calcTrace).toEqual([
            { lonlat: [10, 20], tx: 'A' },
            { lonlat: [20, 30], tx: null },
            { lonlat: [30, 10], tx: 'C' },
            { lonlat: [BADNUM, BADNUM], tx: 'D' },
            { lonlat: [40, 50], tx: {} }
        ]);
    });

    it('should fill array marker attributes (base case)', function() {
        var calcTrace = _calc({
            lon: [10, 20, null, 30],
            lat: [20, 30, null, 10],
            marker: {
                color: ['red', 'blue', 'green', 'yellow'],
                size: [10, 20, 8, 10]
            }
        });

        expect(calcTrace).toEqual([
            { lonlat: [10, 20], mc: 'red', ms: 10 },
            { lonlat: [20, 30], mc: 'blue', ms: 20 },
            { lonlat: [BADNUM, BADNUM], mc: 'green', ms: 8 },
            { lonlat: [30, 10], mc: 'yellow', ms: 10 }
        ]);
    });

    it('should fill array marker attributes (invalid scale case)', function() {
        var calcTrace = _calc({
            lon: [10, 20, null, 30],
            lat: [20, 30, null, 10],
            marker: {
                color: [0, null, 5, 10],
                size: [10, NaN, 8, 10],
                colorscale: [
                    [0, 'blue'], [0.5, 'red'], [1, 'green']
                ]
            }
        });

        expect(calcTrace).toEqual([
            { lonlat: [10, 20], mc: 0, ms: 10 },
            { lonlat: [20, 30], mc: null, ms: 0 },
            { lonlat: [BADNUM, BADNUM], mc: 5, ms: 8 },
            { lonlat: [30, 10], mc: 10, ms: 10 }
        ]);
    });

    it('should fill marker attributes (symbol case)', function() {
        var calcTrace = _calc({
            lon: [10, 20, null, 30],
            lat: [20, 30, null, 10],
            marker: {
                symbol: ['cross', 'square', 'diamond', null]
            }
        });

        expect(calcTrace).toEqual([
            { lonlat: [10, 20], mx: 'cross' },
            { lonlat: [20, 30], mx: 'square' },
            { lonlat: [BADNUM, BADNUM], mx: 'diamond' },
            { lonlat: [30, 10], mx: null }
        ]);
    });
});

describe('Test scattergeo hover', function() {
    var gd;

    beforeEach(function(done) {
        gd = createGraphDiv();

        Plotly.newPlot(gd, [{
            type: 'scattergeo',
            lon: [10, 20, 30],
            lat: [10, 20, 30],
            text: ['A', 'B', 'C']
        }])
        .then(done);
    });

    afterEach(destroyGraphDiv);

    function check(pos, content, style) {
        mouseEvent('mousemove', pos[0], pos[1]);

        style = style || {
            bgcolor: 'rgb(31, 119, 180)',
            bordercolor: 'rgb(255, 255, 255)',
            fontColor: 'rgb(255, 255, 255)',
            fontSize: 13,
            fontFamily: 'Arial'
        };

        assertHoverLabelContent({
            nums: content[0],
            name: content[1]
        });
        assertHoverLabelStyle(
            d3Select('g.hovertext'),
            style
        );
    }

    it('should generate hover label info (base case)', function() {
        check([381, 221], ['(10°, 10°)\nA', null]);
    });

    it('should generate hover label info (with trace name)', function(done) {
        Plotly.restyle(gd, 'hoverinfo', 'lon+lat+text+name').then(function() {
            check([381, 221], ['(10°, 10°)\nA', 'trace 0']);
        })
        .then(done, done.fail);
    });

    it('should use the hovertemplate', function(done) {
        Plotly.restyle(gd, 'hovertemplate', 'tpl %{lat}<extra>x</extra>').then(function() {
            check([381, 221], ['tpl 10', 'x']);
        })
        .then(done, done.fail);
    });

    it('should not hide hover label when hovertemplate', function(done) {
        Plotly.restyle(gd, {
            name: '',
            hovertemplate: 'tpl %{lat}<extra>x</extra>'
        }).then(function() {
            check([381, 221], ['tpl 10', 'x']);
        })
        .then(done, done.fail);
    });

    it('should generate hover label info (\'text\' single value case)', function(done) {
        Plotly.restyle(gd, 'text', 'text').then(function() {
            check([381, 221], ['(10°, 10°)\ntext', null]);
        })
        .then(done, done.fail);
    });

    it('should generate hover label info (\'hovertext\' single value case)', function(done) {
        Plotly.restyle(gd, 'hovertext', 'hovertext').then(function() {
            check([381, 221], ['(10°, 10°)\nhovertext', null]);
        })
        .then(done, done.fail);
    });

    it('should generate hover label info (\'hovertext\' array case)', function(done) {
        Plotly.restyle(gd, 'hovertext', ['Apple', 'Banana', 'Orange']).then(function() {
            check([381, 221], ['(10°, 10°)\nApple', null]);
        })
        .then(done, done.fail);
    });

    it('should generate hover label with custom styling', function(done) {
        Plotly.restyle(gd, {
            'hoverlabel.bgcolor': 'red',
            'hoverlabel.bordercolor': [['blue', 'black', 'green']]
        })
        .then(function() {
            check([381, 221], ['(10°, 10°)\nA', null], {
                bgcolor: 'rgb(255, 0, 0)',
                bordercolor: 'rgb(0, 0, 255)',
                fontColor: 'rgb(0, 0, 255)',
                fontSize: 13,
                fontFamily: 'Arial'
            });
        })
        .then(done, done.fail);
    });

    it('should generate hover label with arrayOk \'hoverinfo\' settings', function(done) {
        Plotly.restyle(gd, 'hoverinfo', [['lon', null, 'lat+name']]).then(function() {
            check([381, 221], ['lon: 10°', null]);
        })
        .then(done, done.fail);
    });

    describe('should preserve lon/lat formatting hovetemplate equivalence', function() {
        var pos = [381, 221];
        var exp = ['(10.00088°, 10.00012°)\nA'];

        it('- base case (truncate z decimals)', function(done) {
            Plotly.restyle(gd, {
                lon: [[10.0001221321]],
                lat: [[10.00087683]]
            })
            .then(function() { check(pos, exp); })
            .then(done, done.fail);
        });

        it('- hovertemplate case (same lat/lon truncation)', function(done) {
            Plotly.restyle(gd, {
                lon: [[10.0001221321]],
                lat: [[10.00087683]],
                hovertemplate: '(%{lat}°, %{lon}°)<br>%{text}<extra></extra>'
            })
            .then(function() { check(pos, exp); })
            .then(done, done.fail);
        });
    });

    it('should include *properties* from input custom geojson', function(done) {
        var fig = Lib.extendDeep({}, require('../../image/mocks/geo_custom-geojson.json'));
        fig.data = [fig.data[3]];
        fig.data[0].geo = 'geo';
        fig.data[0].marker = {size: 40};
        fig.data[0].hovertemplate = '%{properties.name}<extra>LOOK</extra>';
        fig.layout.geo.projection = {scale: 30};

        Plotly.react(gd, fig)
        .then(function() {
            check([275, 255], ['New York', 'LOOK']);
        })
        .then(done, done.fail);
    });
});

describe('scattergeo drawing', function() {
    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(destroyGraphDiv);

    it('should not throw an error with bad locations', function(done) {
        spyOn(loggers, 'log');
        Plotly.newPlot(gd, [{
            locations: ['canada', 0, null, '', 'utopia'],
            locationmode: 'country names',
            type: 'scattergeo'
        }])
        .then(function() {
            // only utopia logs - others are silently ignored
            expect(loggers.log).toHaveBeenCalledTimes(1);
        })
        .then(done, done.fail);
    });

    it('preserves order after hide/show', function(done) {
        function getIndices() {
            var out = [];
            d3SelectAll('.scattergeo').each(function(d) { out.push(d[0].trace.index); });
            return out;
        }

        Plotly.newPlot(gd, [
            {type: 'scattergeo', lon: [10, 20], lat: [10, 20]},
            {type: 'scattergeo', lon: [10, 20], lat: [10, 20]}
        ])
        .then(function() {
            expect(getIndices()).toEqual([0, 1]);
            return Plotly.restyle(gd, 'visible', false, [0]);
        })
        .then(function() {
            expect(getIndices()).toEqual([1]);
            return Plotly.restyle(gd, 'visible', true, [0]);
        })
        .then(function() {
            expect(getIndices()).toEqual([0, 1]);
        })
        .then(done, done.fail);
    });
});

describe('Test scattergeo texttemplate:', function() {
    checkTextTemplate([{
        type: 'scattergeo',
        mode: 'markers+text',
        lon: [-73.57, -79.24, -123.06],
        lat: [45.5, 43.4, 49.13],
        text: ['Montreal', 'Toronto', 'Vancouver']
    }], '.scattergeo text', [
        ['%{text}: %{lon}, %{lat}', ['Montreal: −73.57, 45.5', 'Toronto: −79.24, 43.4', 'Vancouver: −123.06, 49.13']]
    ]);

    checkTextTemplate([{
        type: 'scattergeo',
        mode: 'markers+text',
        locations: ['Canada'],
        locationmode: 'country names'
    }], '.scattergeo text', [
        ['%{location}', ['Canada']]
    ]);
});
