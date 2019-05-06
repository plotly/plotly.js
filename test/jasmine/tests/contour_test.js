var d3 = require('d3');

var Plotly = require('@lib/index');
var Plots = require('@src/plots/plots');
var Lib = require('@src/lib');

var Contour = require('@src/traces/contour');
var makeColorMap = require('@src/traces/contour/make_color_map');
var colorScales = require('@src/components/colorscale/scales').scales;

var failTest = require('../assets/fail_test');
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var customAssertions = require('../assets/custom_assertions');
var checkTicks = customAssertions.checkTicks;
var assertNodeOrder = customAssertions.assertNodeOrder;
var supplyAllDefaults = require('../assets/supply_defaults');


describe('contour defaults', function() {
    'use strict';

    var traceIn;
    var traceOut;

    var defaultColor = '#444';
    var layout = {
        font: Plots.layoutAttributes.font,
        _dfltTitle: {colorbar: 'cb'}
    };

    var supplyDefaults = Contour.supplyDefaults;

    beforeEach(function() {
        traceOut = {};
    });

    it('should set autocontour to false when contours is supplied', function() {
        traceIn = {
            type: 'contour',
            z: [[10, 10.625, 12.5, 15.625],
                [5.625, 6.25, 8.125, 11.25],
                [2.5, 3.125, 5.0, 8.125],
                [0.625, 1.25, 3.125, 6.25]],
            contours: {
                start: 4,
                end: 14
                // missing size does NOT set autocontour true
                // even though in calc we set an autosize.
            }
        };
        supplyDefaults(traceIn, traceOut, defaultColor, layout);
        expect(traceOut.autocontour).toBe(false);

        traceIn = {
            type: 'contour',
            z: [[10, 10.625, 12.5, 15.625],
                [5.625, 6.25, 8.125, 11.25],
                [2.5, 3.125, 5.0, 8.125],
                [0.625, 1.25, 3.125, 6.25]],
            contours: {start: 4} // you need at least start and end
        };
        supplyDefaults(traceIn, traceOut, defaultColor, layout);
        expect(traceOut.autocontour).toBe(true);
    });

    it('should inherit layout.calendar', function() {
        traceIn = {
            x: [1, 2],
            y: [1, 2],
            z: [[1, 2], [3, 4]]
        };
        supplyDefaults(traceIn, traceOut, defaultColor, Lib.extendFlat({calendar: 'islamic'}, layout));

        // we always fill calendar attributes, because it's hard to tell if
        // we're on a date axis at this point.
        expect(traceOut.xcalendar).toBe('islamic');
        expect(traceOut.ycalendar).toBe('islamic');
    });

    it('should take its own calendars', function() {
        traceIn = {
            x: [1, 2],
            y: [1, 2],
            z: [[1, 2], [3, 4]],
            xcalendar: 'coptic',
            ycalendar: 'ethiopian'
        };
        supplyDefaults(traceIn, traceOut, defaultColor, Lib.extendFlat({calendar: 'islamic'}, layout));

        // we always fill calendar attributes, because it's hard to tell if
        // we're on a date axis at this point.
        expect(traceOut.xcalendar).toBe('coptic');
        expect(traceOut.ycalendar).toBe('ethiopian');
    });
});

describe('contour makeColorMap', function() {
    'use strict';

    it('should make correct color map function (\'fill\' coloring case)', function() {
        var trace = {
            contours: {
                coloring: 'fill',
                start: -1.5,
                size: 0.5,
                end: 2.005
            },
            colorscale: [[
                0, 'rgb(12,51,131)'
            ], [
                0.25, 'rgb(10,136,186)'
            ], [
                0.5, 'rgb(242,211,56)'
            ], [
                0.75, 'rgb(242,143,56)'
            ], [
                1, 'rgb(217,30,30)'
            ]]
        };

        var colorMap = makeColorMap(trace);

        expect(colorMap.domain()).toEqual(
            [-1.75, -0.75, 0.25, 1.25, 2.25]
        );

        expect(colorMap.range()).toEqual([
            'rgb(12,51,131)', 'rgb(10,136,186)', 'rgb(242,211,56)',
            'rgb(242,143,56)', 'rgb(217,30,30)'
        ]);
    });

    it('should make correct color map function (\'heatmap\' coloring case)', function() {
        var trace = {
            contours: {
                coloring: 'heatmap',
                start: 1.5,
                size: 0.5,
                end: 5.505
            },
            colorscale: colorScales.RdBu,
            zmin: 1,
            zmax: 6
        };

        var colorMap = makeColorMap(trace);

        expect(colorMap.domain()).toEqual(
           [1, 2.75, 3.5, 4, 4.5, 6]
        );

        expect(colorMap.range()).toEqual([
            'rgb(5,10,172)', 'rgb(106,137,247)', 'rgb(190,190,190)',
            'rgb(220,170,132)', 'rgb(230,145,90)', 'rgb(178,10,28)'
        ]);
    });

    it('should make correct color map function (\'lines\' coloring case)', function() {
        var trace = {
            contours: {
                coloring: 'lines',
                start: 1.5,
                size: 0.5,
                end: 5.505
            },
            colorscale: colorScales.RdBu
        };

        var colorMap = makeColorMap(trace);

        expect(colorMap.domain()).toEqual(
            [1.5, 2.9, 3.5, 3.9, 4.3, 5.5]
        );

        expect(colorMap.range()).toEqual([
            'rgb(5,10,172)', 'rgb(106,137,247)', 'rgb(190,190,190)',
            'rgb(220,170,132)', 'rgb(230,145,90)', 'rgb(178,10,28)'
        ]);
    });
});

describe('contour calc', function() {
    'use strict';

    function _calc(opts, layout) {
        var base = { type: 'contour' };
        var trace = Lib.extendFlat({}, base, opts);
        var gd = { data: [trace] };
        if(layout) gd.layout = layout;

        supplyAllDefaults(gd);
        var fullTrace = gd._fullData[0];
        var fullLayout = gd._fullLayout;
        fullTrace._extremes = {};

        // we used to call ax.setScale during supplyDefaults, and this had a
        // fallback to provide _categories and _categoriesMap. Now neither of
        // those is true... anyway the right way to do this though is
        // ax.clearCalc.
        fullLayout.xaxis.clearCalc();
        fullLayout.yaxis.clearCalc();

        var out = Contour.calc(gd, fullTrace)[0];
        out.trace = fullTrace;
        out._xcategories = fullLayout.xaxis._categories;
        out._ycategories = fullLayout.yaxis._categories;
        return out;
    }

    it('should fill in bricks if x/y not given', function() {
        var out = _calc({
            z: [[1, 2, 3], [3, 1, 2]]
        });

        expect(out.x).toBeCloseToArray([0, 1, 2]);
        expect(out.y).toBeCloseToArray([0, 1]);
        expect(out.z).toBeCloseTo2DArray([[1, 2, 3], [3, 1, 2]]);
    });

    it('should fill in bricks with x0/dx + y0/dy', function() {
        var out = _calc({
            z: [[1, 2, 3], [3, 1, 2]],
            x0: 10,
            dx: 0.5,
            y0: -2,
            dy: -2
        });

        expect(out.x).toBeCloseToArray([10, 10.5, 11]);
        expect(out.y).toBeCloseToArray([-2, -4]);
        expect(out.z).toBeCloseTo2DArray([[1, 2, 3], [3, 1, 2]]);
    });

    it('should convert x/y coordinates into bricks', function() {
        var out = _calc({
            x: [1, 2, 3],
            y: [2, 6],
            z: [[1, 2, 3], [3, 1, 2]]
        });

        expect(out.x).toBeCloseToArray([1, 2, 3]);
        expect(out.y).toBeCloseToArray([2, 6]);
        expect(out.z).toBeCloseTo2DArray([[1, 2, 3], [3, 1, 2]]);
    });

    it('should trim brick-link /y coordinates', function() {
        var out = _calc({
            x: [1, 2, 3, 4],
            y: [2, 6, 10],
            z: [[1, 2, 3], [3, 1, 2]]
        });

        expect(out.x).toBeCloseToArray([1, 2, 3]);
        expect(out.y).toBeCloseToArray([2, 6]);
        expect(out.z).toBeCloseTo2DArray([[1, 2, 3], [3, 1, 2]]);
    });

    it('should handle 1-xy + 1-brick case', function() {
        var out = _calc({
            x: [2],
            y: [3],
            z: [[1]]
        });

        expect(out.x).toBeCloseToArray([2]);
        expect(out.y).toBeCloseToArray([3]);
        expect(out.z).toBeCloseTo2DArray([[1]]);
    });

    it('should handle 1-xy + multi-brick case', function() {
        var out = _calc({
            x: [2],
            y: [3],
            z: [[1, 2, 3], [3, 1, 2]]
        });

        expect(out.x).toBeCloseToArray([2, 3, 4]);
        expect(out.y).toBeCloseToArray([3, 4]);
        expect(out.z).toBeCloseTo2DArray([[1, 2, 3], [3, 1, 2]]);
    });

    it('should handle 0-xy + multi-brick case', function() {
        var out = _calc({
            x: [],
            y: [],
            z: [[1, 2, 3], [3, 1, 2]]
        });

        expect(out.x).toBeCloseToArray([0, 1, 2]);
        expect(out.y).toBeCloseToArray([0, 1]);
        expect(out.z).toBeCloseTo2DArray([[1, 2, 3], [3, 1, 2]]);
    });

    it('should make nice autocontour values', function() {
        var incompleteContours = [
            undefined,
            {start: 12},
            {end: 45},
            {start: 2, size: 2}  // size gets ignored
        ];

        var contoursFinal = [
            // fully auto. These are *not* exactly the output contours objects,
            // I put the input ncontours in here too.
            {inputNcontours: undefined, start: 0.5, end: 4.5, size: 0.5},
            // explicit ncontours
            {inputNcontours: 6, start: 1, end: 4, size: 1},
            // edge case where low ncontours makes start and end cross
            {inputNcontours: 2, start: 2.5, end: 2.5, size: 5}
        ];

        incompleteContours.forEach(function(contoursIn) {
            contoursFinal.forEach(function(spec) {
                var out = _calc({
                    z: [[0, 2], [3, 5]],
                    contours: Lib.extendFlat({}, contoursIn),
                    ncontours: spec.inputNcontours
                }).trace;

                ['start', 'end', 'size'].forEach(function(attr) {
                    expect(out.contours[attr]).toBe(spec[attr], [contoursIn, spec.inputNcontours, attr]);
                });
            });
        });
    });

    it('should supply size and reorder start/end if autocontour is off', function() {
        var specs = [
            {start: 1, end: 100, ncontours: undefined, size: 10},
            {start: 1, end: 100, ncontours: 5, size: 20},
            {start: 10, end: 10, ncontours: 10, size: 1}
        ];

        specs.forEach(function(spec) {
            [
                [spec.start, spec.end, 'normal'],
                [spec.end, spec.start, 'reversed']
            ].forEach(function(v) {
                var startIn = v[0];
                var endIn = v[1];
                var order = v[2];

                var out = _calc({
                    z: [[1, 2], [3, 4]],
                    contours: {start: startIn, end: endIn},
                    ncontours: spec.ncontours
                }).trace;

                ['start', 'end', 'size'].forEach(function(attr) {
                    expect(out.contours[attr]).toBe(spec[attr], [spec, order, attr]);
                    expect(out._input.contours[attr]).toBe(spec[attr], [spec, order, attr]);
                });
            });
        });
    });

    ['contour'].forEach(function(traceType) {
        it('should sort z data based on axis categoryorder for ' + traceType, function() {
            var mock = require('@mocks/heatmap_categoryorder');
            var data = mock.data[0];
            data.type = traceType;
            var layout = mock.layout;

            // sort x axis categories
            var mockLayout = Lib.extendDeep({}, layout);
            var out = _calc(data, mockLayout);
            mockLayout.xaxis.categoryorder = 'category ascending';
            var out1 = _calc(data, mockLayout);

            expect(out._xcategories).toEqual(out1._xcategories.slice().reverse());
            // Check z data is also sorted
            for(var i = 0; i < out.z.length; i++) {
                expect(out1.z[i]).toEqual(out.z[i].slice().reverse());
            }

            // sort y axis categories
            mockLayout = Lib.extendDeep({}, layout);
            out = _calc(data, mockLayout);
            mockLayout.yaxis.categoryorder = 'category ascending';
            out1 = _calc(data, mockLayout);

            expect(out._ycategories).toEqual(out1._ycategories.slice().reverse());
            // Check z data is also sorted
            expect(out1.z).toEqual(out.z.slice().reverse());
        });

        it('should sort z data based on axis categoryarray ' + traceType, function() {
            var mock = require('@mocks/heatmap_categoryorder');
            var data = mock.data[0];
            data.type = traceType;
            var layout = mock.layout;

            layout.xaxis.categoryorder = 'array';
            layout.xaxis.categoryarray = ['x', 'z', 'y', 'w'];
            layout.yaxis.categoryorder = 'array';
            layout.yaxis.categoryarray = ['a', 'd', 'b', 'c'];

            var out = _calc(data, layout);

            expect(out._xcategories).toEqual(layout.xaxis.categoryarray, 'xaxis should reorder');
            expect(out._ycategories).toEqual(layout.yaxis.categoryarray, 'yaxis should reorder');
            expect(out.z[0][0]).toEqual(0);
        });
    });
});

describe('contour plotting and editing', function() {
    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
    });
    afterEach(destroyGraphDiv);

    it('can restyle x/y to different types', function(done) {
        Plotly.newPlot(gd, [{
            type: 'contour',
            x: [1, 2, 3],
            y: [3, 4, 5],
            z: [[10, 11, 12], [13, 14, 15], [17, 18, 19]]
        }], {width: 400, height: 400})
        .then(function() {
            checkTicks('x', ['1', '1.5', '2', '2.5', '3'], 'linear x');
            expect(gd._fullLayout.xaxis.type).toBe('linear');
            checkTicks('y', ['3', '3.5', '4', '4.5', '5'], 'linear y');
            expect(gd._fullLayout.yaxis.type).toBe('linear');

            return Plotly.restyle(gd, {x: [['a', 'b', 'c']], y: [['2016-01', '2016-02', '2016-03']]});
        })
        .then(function() {
            checkTicks('x', ['a', 'b', 'c'], 'category x');
            expect(gd._fullLayout.xaxis.type).toBe('category');
            checkTicks('y', ['Jan 102016', 'Jan 24', 'Feb 7', 'Feb 21'], 'date y');
            expect(gd._fullLayout.yaxis.type).toBe('date');

            // should be a noop, but one that raises no errors!
            return Plotly.relayout(gd, {'xaxis.type': '-', 'yaxis.type': '-'});
        })
        .then(function() {
            checkTicks('x', ['a', 'b', 'c'], 'category x #2');
            expect(gd._fullLayout.xaxis.type).toBe('category');
            checkTicks('y', ['Jan 102016', 'Jan 24', 'Feb 7', 'Feb 21'], 'date y #2');
            expect(gd._fullLayout.yaxis.type).toBe('date');
        })
        .catch(failTest)
        .then(done);
    });

    it('works and draws labels when explicitly specifying ncontours=1', function(done) {
        Plotly.newPlot(gd, [{
            z: [[0.20, 0.57], [0.3, 0.4]],
            type: 'contour',
            zmin: 0.4,
            zmax: 0.41,
            ncontours: 1,
            showscale: false,
            contours: {showlabels: true}
        }], {
            width: 500, height: 500
        })
        .then(function() {
            expect(gd.querySelector('.contourlabels text').textContent).toBe('0.41');
        })
        .catch(failTest)
        .then(done);
    });

    it('should always draw heatmap coloring layer below contour lines', function(done) {
        function _assertNoHeatmap(msg) {
            msg = ' (' + msg + ')';
            // all we care about here *really* is that there are contour levels
            // *somewhere* on the plot, and there is no heatmap anywhere.
            expect(gd.querySelector('.hm')).toBe(null, 'heatmap exists' + msg);
            expect(gd.querySelector('.contourlevel')).not.toBe(null, 'missing contours' + msg);
        }

        Plotly.newPlot(gd, [{
            type: 'contour',
            z: [[1, 2, 3], [1, 3, 0]],
            contours: {coloring: 'heatmap'}
        }])
        .then(function() {
            assertNodeOrder('.hm', '.contourlevel', 'initial heatmap coloring');
            return Plotly.restyle(gd, 'contours.coloring', 'lines');
        })
        .then(function() {
            _assertNoHeatmap('line coloring');
            return Plotly.restyle(gd, 'contours.coloring', 'heatmap');
        })
        .then(function() {
            assertNodeOrder('.hm', '.contourlevel', 'back to heatmap coloring');
        })
        .catch(failTest)
        .then(done);
    });

    it('can change z values with gaps', function(done) {
        Plotly.newPlot(gd, [{
            type: 'contour',
            z: [[1, 2], [null, 4], [1, 2]]
        }])
        .then(function() {
            expect(gd.calcdata[0][0].z).toEqual([[1, 2], [2, 4], [1, 2]]);
            expect(gd.calcdata[0][0].zmask).toEqual([[1, 1], [0, 1], [1, 1]]);

            return Plotly.react(gd, [{
                type: 'contour',
                z: [[6, 5], [8, 7], [null, 10]]
            }]);
        })
        .then(function() {
            expect(gd.calcdata[0][0].z).toEqual([[6, 5], [8, 7], [9, 10]]);
            expect(gd.calcdata[0][0].zmask).toEqual([[1, 1], [1, 1], [0, 1]]);

            return Plotly.react(gd, [{
                type: 'contour',
                z: [[1, 2], [null, 4], [1, 2]]
            }]);
        })
        .then(function() {
            expect(gd.calcdata[0][0].z).toEqual([[1, 2], [2, 4], [1, 2]]);
            expect(gd.calcdata[0][0].zmask).toEqual([[1, 1], [0, 1], [1, 1]]);

            return Plotly.react(gd, [{
                type: 'contour',
                // notice that this one is the same as the previous, except that
                // a previously present value was removed...
                z: [[1, 2], [null, 4], [1, null]]
            }]);
        })
        .then(function() {
            expect(gd.calcdata[0][0].z).toEqual([[1, 2], [2, 4], [1, 2.5]]);
            expect(gd.calcdata[0][0].zmask).toEqual([[1, 1], [0, 1], [1, 0]]);
        })
        .catch(failTest)
        .then(done);
    });

    it('keeps the correct ordering after hide and show', function(done) {
        function getIndices() {
            var out = [];
            d3.selectAll('.contour').each(function(d) { out.push(d[0].trace.index); });
            return out;
        }

        Plotly.newPlot(gd, [{
            type: 'contour',
            z: [[1, 2], [3, 4]]
        }, {
            type: 'contour',
            z: [[2, 1], [4, 3]],
            contours: {coloring: 'lines'}
        }])
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
        .catch(failTest)
        .then(done);
    });
});
