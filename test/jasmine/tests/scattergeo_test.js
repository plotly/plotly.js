var Plotly = require('@lib');
var Plots = require('@src/plots/plots');
var Lib = require('@src/lib');
var BADNUM = require('@src/constants/numerical').BADNUM;

var ScatterGeo = require('@src/traces/scattergeo');

var d3 = require('d3');
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var mouseEvent = require('../assets/mouse_event');

var customAssertions = require('../assets/custom_assertions');
var assertHoverLabelStyle = customAssertions.assertHoverLabelStyle;
var assertHoverLabelContent = customAssertions.assertHoverLabelContent;
var fail = require('../assets/fail_test');

describe('Test scattergeo defaults', function() {
    var traceIn,
        traceOut;

    var defaultColor = '#444',
        layout = {};

    beforeEach(function() {
        traceOut = {};
    });

    it('should slice lat if it it longer than lon', function() {
        traceIn = {
            lon: [-75],
            lat: [45, 45, 45]
        };

        ScatterGeo.supplyDefaults(traceIn, traceOut, defaultColor, layout);
        expect(traceOut.lat).toEqual([45]);
        expect(traceOut.lon).toEqual([-75]);
    });

    it('should slice lon if it it longer than lat', function() {
        traceIn = {
            lon: [-75, -75, -75],
            lat: [45]
        };

        ScatterGeo.supplyDefaults(traceIn, traceOut, defaultColor, layout);
        expect(traceOut.lat).toEqual([45]);
        expect(traceOut.lon).toEqual([-75]);
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
});

describe('Test scattergeo calc', function() {

    function _calc(opts) {
        var base = { type: 'scattermapbox' };
        var trace = Lib.extendFlat({}, base, opts);
        var gd = { data: [trace] };

        Plots.supplyDefaults(gd);

        var fullTrace = gd._fullData[0];
        return ScatterGeo.calc(gd, fullTrace).map(function(obj) {
            delete obj.i;
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
            { lonlat: [20, 30], mc: null, ms: NaN },
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

        Plotly.plot(gd, [{
            type: 'scattergeo',
            lon: [10, 20, 30],
            lat: [10, 20, 30],
            text: ['A', 'B', 'C']
        }])
        .catch(fail)
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
            d3.select('g.hovertext'),
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
        .catch(fail)
        .then(done);
    });

    it('should generate hover label info (\'text\' single value case)', function(done) {
        Plotly.restyle(gd, 'text', 'text').then(function() {
            check([381, 221], ['(10°, 10°)\ntext', null]);
        })
        .catch(fail)
        .then(done);
    });

    it('should generate hover label info (\'hovertext\' single value case)', function(done) {
        Plotly.restyle(gd, 'hovertext', 'hovertext').then(function() {
            check([381, 221], ['(10°, 10°)\nhovertext', null]);
        })
        .catch(fail)
        .then(done);
    });

    it('should generate hover label info (\'hovertext\' array case)', function(done) {
        Plotly.restyle(gd, 'hovertext', ['Apple', 'Banana', 'Orange']).then(function() {
            check([381, 221], ['(10°, 10°)\nApple', null]);
        })
        .catch(fail)
        .then(done);
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
        .catch(fail)
        .then(done);
    });

    it('should generate hover label with arrayOk \'hoverinfo\' settings', function(done) {
        Plotly.restyle(gd, 'hoverinfo', [['lon', null, 'lat+name']]).then(function() {
            check([381, 221], ['lon: 10°', null]);
        })
        .catch(fail)
        .then(done);
    });
});

describe('scattergeo bad data', function() {
    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(destroyGraphDiv);

    it('should not throw an error with bad locations', function(done) {
        spyOn(Lib, 'warn');
        Plotly.newPlot(gd, [{
            locations: ['canada', 0, null, '', 'utopia'],
            locationmode: 'country names',
            type: 'scattergeo'
        }])
        .then(function() {
            // only utopia warns - others are silently ignored
            expect(Lib.warn).toHaveBeenCalledTimes(1);
        })
        .catch(fail)
        .then(done);
    });
});
