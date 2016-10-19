var Plots = require('@src/plots/plots');
var Lib = require('@src/lib');

var Contour = require('@src/traces/contour');
var makeColorMap = require('@src/traces/contour/make_color_map');
var colorScales = require('@src/components/colorscale/scales');

var customMatchers = require('../assets/custom_matchers');


describe('contour defaults', function() {
    'use strict';

    var traceIn,
        traceOut;

    var defaultColor = '#444',
        layout = {
            font: Plots.layoutAttributes.font
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
                end: 14,
                size: 0.5
            }
        };
        supplyDefaults(traceIn, traceOut, defaultColor, layout);
        expect(traceOut.autocontour).toBe(false);

        traceIn = {
            type: 'contour',
            z: [[10, 10.625, 12.5, 15.625],
                [5.625, 6.25, 8.125, 11.25],
                [2.5, 3.125, 5.0, 8.125],
                [0.625, 1.25, 3.125, 6.25]]
        };
        supplyDefaults(traceIn, traceOut, defaultColor, layout);
        expect(traceOut.autocontour).toBe(true);
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

    beforeAll(function() {
        jasmine.addMatchers(customMatchers);
    });

    function _calc(opts) {
        var base = { type: 'contour' },
            trace = Lib.extendFlat({}, base, opts),
            gd = { data: [trace] };

        Plots.supplyDefaults(gd);
        var fullTrace = gd._fullData[0];

        return Contour.calc(gd, fullTrace)[0];
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
});
