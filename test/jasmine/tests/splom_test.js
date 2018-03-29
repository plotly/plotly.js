var Lib = require('@src/lib');
var supplyAllDefaults = require('../assets/supply_defaults');
var Plots = require('@src/plots/plots');

var Plotly = require('@lib');
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var failTest = require('../assets/fail_test');

describe('Test splom trace defaults:', function() {
    var gd;

    function _supply(opts, layout) {
        gd = {};
        opts = Array.isArray(opts) ? opts : [opts];

        gd.data = opts.map(function(o) {
            return Lib.extendFlat({type: 'splom'}, o || {});
        });
        gd.layout = layout || {};

        supplyAllDefaults(gd);
    }

    it('should set to `visible: false` dimensions-less traces', function() {
        _supply([{}, {dimensions: []}]);

        expect(gd._fullData[0].visible).toBe(false);
        expect(gd._fullData[1].visible).toBe(false);
    });

    it('should set to `visible: false` to values-less dimensions', function() {
        _supply({
            dimensions: [
                'not-an-object',
                {other: 'stuff'}
            ]
        });

        expect(gd._fullData[0].dimensions[0].visible).toBe(false);
        expect(gd._fullData[0].dimensions[1].visible).toBe(false);
    });

    it('should work with only one dimensions', function() {
        _supply({
            dimensions: [
                {values: [2, 1, 2]}
            ]
        });

        var fullLayout = gd._fullLayout;
        expect(fullLayout.xaxis.domain).toBeCloseToArray([0, 1]);
        expect(fullLayout.yaxis.domain).toBeCloseToArray([0, 1]);
    });

    it('should set `grid.xaxes` and `grid.yaxes` default using the new of dimensions', function() {
        _supply({
            dimensions: [
                {values: [1, 2, 3]},
                {values: [2, 1, 2]}
            ]
        });

        var fullTrace = gd._fullData[0];
        expect(fullTrace._commonLength).toBe(3, 'common length');
        expect(fullTrace.dimensions[0]._length).toBe(3, 'dim 0 length');
        expect(fullTrace.dimensions[1]._length).toBe(3, 'dim 1 length');
        expect(fullTrace.xaxes).toEqual(['x', 'x2']);
        expect(fullTrace.yaxes).toEqual(['y', 'y2']);

        var fullLayout = gd._fullLayout;
        expect(fullLayout.xaxis.domain).toBeCloseToArray([0, 0.47]);
        expect(fullLayout.yaxis.domain).toBeCloseToArray([0.53, 1]);
        expect(fullLayout.xaxis2.domain).toBeCloseToArray([0.53, 1]);
        expect(fullLayout.yaxis2.domain).toBeCloseToArray([0, 0.47]);

        var subplots = fullLayout._subplots;
        expect(subplots.xaxis).toEqual(['x', 'x2']);
        expect(subplots.yaxis).toEqual(['y', 'y2']);
        expect(subplots.cartesian).toEqual(['xy', 'xy2', 'x2y', 'x2y2']);
    });

    it('should honor `grid.xaxes` and `grid.yaxes` settings', function() {
        _supply({
            dimensions: [
                {values: [1, 2, 3]},
                {values: [2, 1, 2]}
            ]
        }, {
            grid: {domain: {x: [0, 0.5], y: [0, 0.5]}}
        });

        var fullLayout = gd._fullLayout;
        expect(fullLayout.xaxis.domain).toBeCloseToArray([0, 0.24]);
        expect(fullLayout.yaxis.domain).toBeCloseToArray([0.26, 0.5]);
        expect(fullLayout.xaxis2.domain).toBeCloseToArray([0.26, 0.5]);
        expect(fullLayout.yaxis2.domain).toBeCloseToArray([0, 0.24]);
    });

    it('should honor xaxis and yaxis settings', function() {
        _supply({
            dimensions: [
                {values: [1, 2, 3]},
                {values: [2, 1, 2]}
            ]
        }, {
            xaxis: {domain: [0, 0.4]},
            yaxis2: {domain: [0, 0.3]}
        });

        var fullLayout = gd._fullLayout;
        expect(fullLayout.xaxis.domain).toBeCloseToArray([0, 0.4]);
        expect(fullLayout.yaxis.domain).toBeCloseToArray([0.53, 1]);
        expect(fullLayout.xaxis2.domain).toBeCloseToArray([0.53, 1]);
        expect(fullLayout.yaxis2.domain).toBeCloseToArray([0, 0.3]);
    });

    it('should set axis title default using dimensions *label*', function() {
        _supply({
            dimensions: [{
                label: 'A',
                values: [2, 3, 1]
            }, {
                label: 'B',
                values: [1, 2, 1]
            }]
        });

        var fullLayout = gd._fullLayout;
        expect(fullLayout.xaxis.title).toBe('A');
        expect(fullLayout.yaxis.title).toBe('A');
        expect(fullLayout.xaxis2.title).toBe('B');
        expect(fullLayout.yaxis2.title).toBe('B');
    });

    it('should set axis title default using dimensions *label* (even visible false dimensions)', function() {
        _supply({
            dimensions: [{
                label: 'A',
                values: [2, 3, 1]
            }, {
                label: 'B',
                visible: false
            }, {
                label: 'C',
                values: [1, 2, 1]
            }]
        });

        var fullLayout = gd._fullLayout;
        expect(fullLayout.xaxis.title).toBe('A');
        expect(fullLayout.yaxis.title).toBe('A');
        expect(fullLayout.xaxis2.title).toBe('B');
        expect(fullLayout.yaxis2.title).toBe('B');
        expect(fullLayout.xaxis3.title).toBe('C');
        expect(fullLayout.yaxis3.title).toBe('C');
    });

    it('should ignore (x|y)axes values beyond dimensions length', function() {
        _supply({
            dimensions: [{
                label: 'A',
                values: [2, 3, 1]
            }, {
                label: 'B',
                values: [0, 1, 0.5]
            }, {
                label: 'C',
                values: [1, 2, 1]
            }],
            xaxes: ['x', 'x2', 'x3', 'x4'],
            yaxes: ['y', 'y2', 'y3', 'y4']
        });

        var fullTrace = gd._fullData[0];
        // keeps 1-to-1 relationship with input data
        expect(fullTrace.xaxes).toEqual(['x', 'x2', 'x3', 'x4']);
        expect(fullTrace.yaxes).toEqual(['y', 'y2', 'y3', 'y4']);
        // this here does the 'ignoring' part
        expect(fullTrace._activeLength).toBe(3);

        var fullLayout = gd._fullLayout;
        expect(fullLayout.xaxis.title).toBe('A');
        expect(fullLayout.yaxis.title).toBe('A');
        expect(fullLayout.xaxis2.title).toBe('B');
        expect(fullLayout.yaxis2.title).toBe('B');
        expect(fullLayout.xaxis3.title).toBe('C');
        expect(fullLayout.yaxis3.title).toBe('C');
        expect(fullLayout.xaxis4).toBe(undefined);
        expect(fullLayout.yaxis4).toBe(undefined);
    });

    it('should ignore (x|y)axes values beyond dimensions length (case 2)', function() {
        _supply({
            dimensions: [{
                label: 'A',
                values: [2, 3, 1]
            }, {
                label: 'B',
                values: [0, 1, 0.5]
            }, {
                label: 'C',
                values: [1, 2, 1]
            }],
            xaxes: ['x2', 'x3', 'x4', 'x5'],
            yaxes: ['y2', 'y3', 'y4', 'y5']
        });

        var fullTrace = gd._fullData[0];
        // keeps 1-to-1 relationship with input data
        expect(fullTrace.xaxes).toEqual(['x2', 'x3', 'x4', 'x5']);
        expect(fullTrace.yaxes).toEqual(['y2', 'y3', 'y4', 'y5']);
        // this here does the 'ignoring' part
        expect(fullTrace._activeLength).toBe(3);

        var fullLayout = gd._fullLayout;
        expect(fullLayout.xaxis).toBe(undefined);
        expect(fullLayout.yaxis).toBe(undefined);
        expect(fullLayout.xaxis2.title).toBe('A');
        expect(fullLayout.yaxis2.title).toBe('A');
        expect(fullLayout.xaxis3.title).toBe('B');
        expect(fullLayout.yaxis3.title).toBe('B');
        expect(fullLayout.xaxis4.title).toBe('C');
        expect(fullLayout.yaxis4.title).toBe('C');
        expect(fullLayout.xaxis5).toBe(undefined);
        expect(fullLayout.yaxis5).toBe(undefined);
    });

    it('should ignore dimensions beyond (x|y)axes length', function() {
        _supply({
            dimensions: [{
                label: 'A',
                values: [2, 3, 1]
            }, {
                label: 'B',
                values: [0, 1, 0.5]
            }, {
                label: 'C',
                values: [1, 2, 1]
            }],
            xaxes: ['x2', 'x3'],
            yaxes: ['y2', 'y3']
        });

        var fullTrace = gd._fullData[0];
        expect(fullTrace.xaxes).toEqual(['x2', 'x3']);
        expect(fullTrace.yaxes).toEqual(['y2', 'y3']);
        // keep 1-to-1 relationship with input data
        expect(fullTrace.dimensions.length).toBe(3);
        // this here does the 'ignoring' part
        expect(fullTrace._activeLength).toBe(2);
    });

    it('should lead to correct axis auto type value', function() {
        _supply({
            dimensions: [
                {values: ['a', 'b', 'c']},
                {values: ['A', 't', 'd']}
            ]
        });

        var fullLayout = gd._fullLayout;
        expect(fullLayout.xaxis.type).toBe('category');
        expect(fullLayout.yaxis.type).toBe('category');
    });

    it('should lead to correct axis auto type value (case 2)', function() {
        _supply({
            dimensions: [
                {visible: false, values: ['2018-01-01', '2018-02-01', '2018-03-03']},
                {values: ['2018-01-01', '2018-02-01', '2018-03-03']}
            ]
        });

        var fullLayout = gd._fullLayout;
        expect(fullLayout.xaxis.type).toBe('date');
        expect(fullLayout.yaxis.type).toBe('date');
    });
});

describe('@gl Test splom interactions:', function() {
    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(function() {
        Plotly.purge(gd);
        destroyGraphDiv();
    });

    it('should destroy gl objects on Plots.cleanPlot', function(done) {
        Plotly.plot(gd, Lib.extendDeep({}, require('@mocks/splom_large.json'))).then(function() {
            expect(gd._fullLayout._splomGrid).toBeDefined();
            expect(gd.calcdata[0][0].t._scene).toBeDefined();

            return Plots.cleanPlot([], {}, gd._fullData, gd._fullLayout, gd.calcdata);
        })
        .then(function() {
            expect(gd._fullLayout._splomGrid).toBe(null);
            expect(gd.calcdata[0][0].t._scene).toBe(null);
        })
        .catch(failTest)
        .then(done);
    });

});
