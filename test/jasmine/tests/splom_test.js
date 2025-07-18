var Plotly = require('../../../lib/index');
var Lib = require('../../../src/lib');
var Plots = require('../../../src/plots/plots');
var Axes = require('../../../src/plots/cartesian/axes');
var SUBPLOT_PATTERN = require('../../../src/plots/cartesian/constants').SUBPLOT_PATTERN;

var d3Select = require('../../strict-d3').select;
var d3SelectAll = require('../../strict-d3').selectAll;
var supplyAllDefaults = require('../assets/supply_defaults');
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var failTest = require('../assets/fail_test');
var mouseEvent = require('../assets/mouse_event');
var drag = require('../assets/drag');
var doubleClick = require('../assets/double_click');

var customAssertions = require('../assets/custom_assertions');
var assertHoverLabelContent = customAssertions.assertHoverLabelContent;

function _newPlot(gd, arg2, arg3, arg4) {
    var fig;
    if(Array.isArray(arg2)) {
        fig = {
            data: arg2,
            layout: arg3,
            config: arg4
        };
    } else fig = arg2;

    if(!fig.layout) fig.layout = {};
    if(!fig.layout.newselection) fig.layout.newselection = {};
    fig.layout.newselection.mode = 'gradual';
    // complex ouline creation are mainly tested in "gradual" mode here

    return Plotly.newPlot(gd, fig);
}

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

    it('should set `visible: false` dimensions-less traces', function() {
        _supply([{}, {dimensions: []}]);

        expect(gd._fullData[0].visible).toBe(false);
        expect(gd._fullData[1].visible).toBe(false);
    });

    it('should set `visible: false` to traces with showupperhalf, showlowerhalf, and diagonal.visible false', function() {
        _supply({
            dimensions: [{
                values: [1, 2, 3]
            }],
            showupperhalf: false,
            showlowerhalf: false,
            diagonal: {visible: false}
        });

        expect(gd._fullData[0].visible).toBe(false);

        // make sure these are still coerced - so you can get back via GUI!
        expect(gd._fullData[0].showupperhalf).toBe(false);
        expect(gd._fullData[0].showlowerhalf).toBe(false);
        expect(gd._fullData[0].diagonal.visible).toBe(false);
    });

    it('should set `visible: false` to values-less dimensions', function() {
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

    it('should set `grid.xaxes` and `grid.yaxes` default using the number of dimensions', function() {
        _supply({
            dimensions: [
                {values: [1, 2, 3]},
                {values: [2, 1, 2]}
            ]
        });

        var fullTrace = gd._fullData[0];
        expect(fullTrace._length).toBe(3, 'common length');
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

    it('should set `grid.xaxes` and `grid.yaxes` default using the number of dimensions (no upper half, no diagonal case)', function() {
        _supply({
            dimensions: [
                {values: [1, 2, 3]},
                {values: [2, 1, 2]},
                {values: [3, 1, 5]}
            ],
            showupperhalf: false,
            diagonal: {visible: false}
        });

        var fullTrace = gd._fullData[0];
        expect(fullTrace.xaxes).toEqual(['x', 'x2', 'x3']);
        expect(fullTrace.yaxes).toEqual(['y', 'y2', 'y3']);

        var fullLayout = gd._fullLayout;
        expect(fullLayout.xaxis.domain).toBeCloseToArray([0, 0.47]);
        expect(fullLayout.yaxis2.domain).toBeCloseToArray([0.53, 1]);
        expect(fullLayout.xaxis2.domain).toBeCloseToArray([0.53, 1]);
        expect(fullLayout.yaxis3.domain).toBeCloseToArray([0, 0.47]);

        var subplots = fullLayout._subplots;
        expect(subplots.xaxis).toEqual(['x', 'x2']);
        expect(subplots.yaxis).toEqual(['y2', 'y3']);
        expect(subplots.cartesian).toEqual(['xy2', 'xy3', 'x2y3']);
    });

    it('should set `grid.xaxes` and `grid.yaxes` default using the number of dimensions (no lower half, no diagonal case)', function() {
        _supply({
            dimensions: [
                {values: [1, 2, 3]},
                {values: [2, 1, 2]},
                {values: [3, 1, 5]}
            ],
            showlowerhalf: false,
            diagonal: {visible: false}
        });

        var fullTrace = gd._fullData[0];
        expect(fullTrace.xaxes).toEqual(['x', 'x2', 'x3']);
        expect(fullTrace.yaxes).toEqual(['y', 'y2', 'y3']);

        var fullLayout = gd._fullLayout;
        expect(fullLayout.xaxis2.domain).toBeCloseToArray([0, 0.47]);
        expect(fullLayout.yaxis.domain).toBeCloseToArray([0.53, 1]);
        expect(fullLayout.xaxis3.domain).toBeCloseToArray([0.53, 1]);
        expect(fullLayout.yaxis2.domain).toBeCloseToArray([0, 0.47]);

        var subplots = fullLayout._subplots;
        expect(subplots.xaxis).toEqual(['x2', 'x3']);
        expect(subplots.yaxis).toEqual(['y', 'y2']);
        expect(subplots.cartesian).toEqual(['x2y', 'x3y', 'x3y2']);
    });

    it('should set `grid.xaxes` and `grid.yaxes` default using the number of dimensions (no upper half, no diagonal, set x|y axes case)', function() {
        _supply({
            dimensions: [
                {values: [1, 2, 3]},
                {values: [2, 1, 2]},
                {values: [3, 1, 5]}
            ],
            showupperhalf: false,
            diagonal: {visible: false},
            xaxes: ['x5', 'x6', 'x7'],
            yaxes: ['y6', 'y7', 'y8']
        });

        var fullTrace = gd._fullData[0];
        expect(fullTrace.xaxes).toEqual(['x5', 'x6', 'x7']);
        expect(fullTrace.yaxes).toEqual(['y6', 'y7', 'y8']);

        var subplots = gd._fullLayout._subplots;
        expect(subplots.xaxis).toEqual(['x5', 'x6']);
        expect(subplots.yaxis).toEqual(['y7', 'y8']);
        expect(subplots.cartesian).toEqual(['x5y7', 'x5y8', 'x6y8']);
    });

    it('should set `grid.xaxes` and `grid.yaxes` default using the number of dimensions (no lower half, no diagonal, set x|y axes case)', function() {
        _supply({
            dimensions: [
                {values: [1, 2, 3]},
                {values: [2, 1, 2]},
                {values: [3, 1, 5]}
            ],
            showlowerhalf: false,
            diagonal: {visible: false},
            xaxes: ['x5', 'x6', 'x7'],
            yaxes: ['y6', 'y7', 'y8']
        });

        var fullTrace = gd._fullData[0];
        expect(fullTrace.xaxes).toEqual(['x5', 'x6', 'x7']);
        expect(fullTrace.yaxes).toEqual(['y6', 'y7', 'y8']);

        var subplots = gd._fullLayout._subplots;
        expect(subplots.xaxis).toEqual(['x6', 'x7']);
        expect(subplots.yaxis).toEqual(['y6', 'y7']);
        expect(subplots.cartesian).toEqual(['x6y6', 'x7y6', 'x7y7']);
    });

    it('should use special `grid.xside` and `grid.yside` defaults on splom w/o lower half generated grids', function() {
        var gridOut;

        // base case
        _supply({
            dimensions: [
                {values: [1, 2, 3]},
                {values: [2, 1, 2]}
            ]
        });

        gridOut = gd._fullLayout.grid;
        expect(gridOut.xside).toBe('bottom plot');
        expect(gridOut.yside).toBe('left plot');

        // w/o lower half case
        _supply({
            dimensions: [
                {values: [1, 2, 3]},
                {values: [2, 1, 2]}
            ],
            showlowerhalf: false
        });

        gridOut = gd._fullLayout.grid;
        expect(gridOut.xside).toBe('bottom');
        expect(gridOut.yside).toBe('left');

        // non-splom generated grid
        _supply({
            dimensions: [
                {values: [1, 2, 3]},
                {values: [2, 1, 2]}
            ]
        }, {
            grid: {
                xaxes: ['x', 'x2'],
                yaxes: ['y', 'y2']
            }
        });

        gridOut = gd._fullLayout.grid;
        expect(gridOut.xside).toBe('bottom plot');
        expect(gridOut.yside).toBe('left plot');
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
        expect(fullLayout.xaxis.title.text).toBe('A');
        expect(fullLayout.yaxis.title.text).toBe('A');
        expect(fullLayout.xaxis2.title.text).toBe('B');
        expect(fullLayout.yaxis2.title.text).toBe('B');
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
        expect(fullLayout.xaxis.title.text).toBe('A');
        expect(fullLayout.yaxis.title.text).toBe('A');
        expect(fullLayout.xaxis2.title.text).toBe('B');
        expect(fullLayout.yaxis2.title.text).toBe('B');
        expect(fullLayout.xaxis3.title.text).toBe('C');
        expect(fullLayout.yaxis3.title.text).toBe('C');
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

        var fullLayout = gd._fullLayout;
        // this here does the 'ignoring' part
        expect(Object.keys(fullLayout._splomSubplots)).toEqual([
            'xy', 'xy2', 'xy3',
            'x2y', 'x2y2', 'x2y3',
            'x3y', 'x3y2', 'x3y3'
        ]);
        expect(fullLayout.xaxis.title.text).toBe('A');
        expect(fullLayout.yaxis.title.text).toBe('A');
        expect(fullLayout.xaxis2.title.text).toBe('B');
        expect(fullLayout.yaxis2.title.text).toBe('B');
        expect(fullLayout.xaxis3.title.text).toBe('C');
        expect(fullLayout.yaxis3.title.text).toBe('C');
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

        var fullLayout = gd._fullLayout;
        // this here does the 'ignoring' part
        expect(Object.keys(fullLayout._splomSubplots)).toEqual([
            'x2y2', 'x2y3', 'x2y4',
            'x3y2', 'x3y3', 'x3y4',
            'x4y2', 'x4y3', 'x4y4'
        ]);
        expect(fullLayout.xaxis).toBe(undefined);
        expect(fullLayout.yaxis).toBe(undefined);
        expect(fullLayout.xaxis2.title.text).toBe('A');
        expect(fullLayout.yaxis2.title.text).toBe('A');
        expect(fullLayout.xaxis3.title.text).toBe('B');
        expect(fullLayout.yaxis3.title.text).toBe('B');
        expect(fullLayout.xaxis4.title.text).toBe('C');
        expect(fullLayout.yaxis4.title.text).toBe('C');
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

        var fullLayout = gd._fullLayout;
        // this here does the 'ignoring' part
        expect(Object.keys(fullLayout._splomSubplots)).toEqual([
            'x2y2', 'x2y3',
            'x3y2', 'x3y3'
        ]);
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
        expect(fullLayout.xaxis.type).toBe('linear', 'fallbacks to linear for visible:false traces');
        expect(fullLayout.yaxis.type).toBe('linear', 'fallbacks to linear for visible:false traces');
        expect(fullLayout.xaxis2.type).toBe('date');
        expect(fullLayout.yaxis2.type).toBe('date');
    });

    it('axis type in layout takes precedence over dimensions setting', function() {
        _supply({
            dimensions: [
                {values: [1, 2, 1], axis: {type: 'category'}},
                {values: [2, 1, 3]}
            ]
        }, {
            xaxis: {type: 'linear'},
            yaxis: {type: 'linear'},
            xaxis2: {type: 'category'},
            yaxis2: {type: 'category'}
        });

        var fullLayout = gd._fullLayout;
        expect(fullLayout.xaxis.type).toBe('linear');
        expect(fullLayout.yaxis.type).toBe('linear');
        expect(fullLayout.xaxis2.type).toBe('category');
        expect(fullLayout.yaxis2.type).toBe('category');
    });

    it('axis type setting should be skipped when dimension is not visible', function() {
        _supply({
            dimensions: [
                {visible: false, values: [1, 2, 1], axis: {type: 'category'}},
                {values: [-1, 2, 3], axis: {type: 'category'}},
            ]
        }, {
        });

        var fullLayout = gd._fullLayout;
        expect(fullLayout.xaxis.type).toBe('linear');
        expect(fullLayout.yaxis.type).toBe('linear');
        expect(fullLayout.xaxis2.type).toBe('category');
        expect(fullLayout.yaxis2.type).toBe('category');
    });

    it('axis *matches* setting should propagate to layout axis containers', function() {
        _supply({
            dimensions: [
                {values: [1, 2, 1], axis: {matches: true}},
                {values: [-1, 2, 3], axis: {matches: true}}
            ]
        }, {});

        var fullLayout = gd._fullLayout;
        expect(fullLayout.xaxis.matches).toBe('y');
        expect(fullLayout.xaxis2.matches).toBe('y2');
        // not necessary to set y axes matching x, since x already matches y
        expect(fullLayout.yaxis.matches).toBe(undefined);
        expect(fullLayout.yaxis2.matches).toBe(undefined);

        var groups = fullLayout._axisMatchGroups;
        expect(groups.length).toBe(2);
        expect(groups).toContain({x: 1, y: 1});
        expect(groups).toContain({x2: 1, y2: 1});
    });

    it('axis *matches* setting should propagate to layout axis containers (lower + no-diag case)', function() {
        _supply({
            diagonal: {visible: false},
            showlowerhalf: false,
            dimensions: [
                {values: [1, 2, 1], axis: {matches: true}},
                {values: [-1, 2, 3], axis: {matches: true}},
                {values: [-10, 9, 3], axis: {matches: true}}
            ]
        }, {});

        var fullLayout = gd._fullLayout;
        expect(fullLayout.xaxis).toBe(undefined);
        expect(fullLayout.yaxis.matches).toBe(undefined);
        expect(fullLayout.xaxis2.matches).toBe('y2');
        expect(fullLayout.yaxis2.matches).toBe(undefined);
        expect(fullLayout.xaxis3.matches).toBe(undefined);
        expect(fullLayout.yaxis3).toBe(undefined);

        var groups = fullLayout._axisMatchGroups;
        expect(groups.length).toBe(1);
        expect(groups).toContain({x2: 1, y2: 1});
    });

    it('axis *matches* setting should propagate to layout axis containers (upper + no-diag case)', function() {
        _supply({
            diagonal: {visible: false},
            showupperhalf: false,
            dimensions: [
                {values: [1, 2, 1], axis: {matches: true}},
                {values: [-1, 2, 3], axis: {matches: true}},
                {values: [-10, 9, 3], axis: {matches: true}}
            ]
        }, {});

        var fullLayout = gd._fullLayout;
        expect(fullLayout.xaxis.matches).toBe(undefined);
        expect(fullLayout.yaxis).toBe(undefined);
        expect(fullLayout.xaxis2.matches).toBe('y2');
        expect(fullLayout.yaxis2.matches).toBe(undefined);
        expect(fullLayout.xaxis3).toBe(undefined);
        expect(fullLayout.yaxis3.matches).toBe(undefined);

        var groups = fullLayout._axisMatchGroups;
        expect(groups.length).toBe(1);
        expect(groups).toContain({x2: 1, y2: 1});
    });

    it('axis *matches* in layout take precedence over dimensions settings', function() {
        _supply({
            dimensions: [
                {values: [1, 2, 1], axis: {matches: true}},
                {values: [-1, 2, 3], axis: {matches: true}}
            ]
        }, {
            xaxis: {},
            xaxis2: {matches: 'x'}
        });

        var fullLayout = gd._fullLayout;
        expect(fullLayout.xaxis.matches).toBe('y');
        expect(fullLayout.yaxis.matches).toBe(undefined);
        expect(fullLayout.xaxis2.matches).toBe('x');
        expect(fullLayout.yaxis2.matches).toBe('x2');

        var groups = fullLayout._axisMatchGroups;
        expect(groups.length).toBe(1);
        expect(groups).toContain({x: 1, y: 1, x2: 1, y2: 1});
    });
});

describe('Test splom trace calc step:', function() {
    var gd;

    function _calc(opts, layout) {
        gd = {};

        gd.data = [Lib.extendFlat({type: 'splom'}, opts || {})];
        gd.layout = layout || {};
        supplyAllDefaults(gd);
        Plots.doCalcdata(gd);
    }

    it('should skip dimensions with conflicting axis types', function() {
        spyOn(Lib, 'log').and.callThrough();

        _calc({
            dimensions: [{
                values: [1, 2, 3]
            }, {
                values: [2, 1, 2]
            }]
        }, {
            xaxis: {type: 'category'},
            yaxis: {type: 'linear'}
        });

        var trace = gd._fullData[0];
        var scene = gd._fullLayout._splomScenes[trace.uid];

        expect(scene.matrixOptions.data).toBeCloseTo2DArray([[2, 1, 2]]);
        expect(trace._visibleDims).toEqual([1]);
        expect(Lib.log).toHaveBeenCalledTimes(1);
        expect(Lib.log).toHaveBeenCalledWith('Skipping splom dimension 0 with conflicting axis types');
    });
});

describe('Test splom interactions:', function() {
    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(function() {
        Plotly.purge(gd);
        destroyGraphDiv();
    });

    it('@gl should destroy gl objects on Plots.cleanPlot', function(done) {
        var fig = Lib.extendDeep({}, require('../../image/mocks/splom_large.json'));

        _newPlot(gd, fig).then(function() {
            expect(gd._fullLayout._splomGrid).toBeDefined();
            expect(gd._fullLayout._splomScenes).toBeDefined();
            expect(Object.keys(gd._fullLayout._splomScenes).length).toBe(1);

            return Plots.cleanPlot([], {}, gd._fullData, gd._fullLayout);
        })
        .then(function() {
            expect(gd._fullLayout._splomGrid).toBeUndefined();
            expect(gd._fullLayout._splomScenes).toBeUndefined();
        })
        .then(done, done.fail);
    });

    it('@gl when hasOnlyLargeSploms, should create correct regl-line2d data for grid', function(done) {
        var fig = Lib.extendDeep({}, require('../../image/mocks/splom_large.json'));
        var cnt = 1;

        function _assert(dims) {
            var gridData = gd._fullLayout._splomGrid.passes;
            var gridLengths = gridData.map(function(d) { return d.count * 2; });
            var msg = ' - call #' + cnt;

            expect(Object.keys(gridData).length)
                .toBe(dims.length, '# of batches' + msg);
            gridLengths.forEach(function(l, i) {
                expect(l).toBe(dims[i], '# of coords in batch ' + i + msg);
            });
            cnt++;
        }

        _newPlot(gd, fig).then(function() {
            _assert([1198, 16558, 3358, 118]);
            return Plotly.restyle(gd, 'showupperhalf', false);
        })
        .then(function() {
            _assert([1198, 8476, 1768, 4]);
            return Plotly.restyle(gd, 'diagonal.visible', false);
        })
        .then(function() {
            _assert([1138, 7534, 1600]);
            return Plotly.restyle(gd, {
                showupperhalf: true,
                showlowerhalf: false
            });
        })
        .then(function() {
            _assert([7966, 112, 1588]);
            return Plotly.restyle(gd, 'diagonal.visible', true);
        })
        .then(function() {
            _assert([58, 8908, 1756, 118]);
            return Plotly.relayout(gd, {
                'xaxis.gridcolor': null,
                'xaxis.gridwidth': null,
                'yaxis.zerolinecolor': null,
                'yaxis.zerolinewidth': null
            });
        })
        .then(function() {
            // one batch for all 'grid' lines
            // and another for all 'zeroline' lines
            _assert([8968, 1876]);
        })
        .then(done, done.fail);
    });

    it('@gl should update properly in-and-out of hasOnlyLargeSploms regime', function(done) {
        var figLarge = Lib.extendDeep({}, require('../../image/mocks/splom_large.json'));
        var dimsLarge = figLarge.data[0].dimensions;
        var dimsSmall = dimsLarge.slice(0, 5);
        var cnt = 1;

        function _assert(exp) {
            var msg = ' - call #' + cnt;
            var gd3 = d3Select(gd);
            var subplots = gd3.selectAll('g.cartesianlayer > g.subplot');
            var bgs = gd3.selectAll('.bglayer > rect.bg');

            expect(subplots.size())
                .toBe(exp.subplotCnt, '# of <g.subplot>' + msg);

            var failedSubplots = [];
            subplots.each(function(d, i) {
                var actual = this.children.length;
                var expected = typeof exp.innerSubplotNodeCnt === 'function' ?
                    exp.innerSubplotNodeCnt(d[0], i) :
                    exp.innerSubplotNodeCnt;
                if(actual !== expected) {
                    failedSubplots.push([d, actual, 'vs', expected].join(' '));
                }
            });
            expect(failedSubplots)
                .toEqual([], '# of nodes inside <g.subplot>' + msg);

            expect(!!gd._fullLayout._splomGrid)
                .toBe(exp.hasSplomGrid, 'has regl-line2d splom grid' + msg);

            expect(bgs.size()).toBe(exp.bgCnt, '# of <rect.bg> ' + msg);

            cnt++;
        }

        _newPlot(gd, figLarge).then(function() {
            _assert({
                subplotCnt: 400,
                innerSubplotNodeCnt: 4,
                hasSplomGrid: true,
                bgCnt: 0
            });

            return Plotly.relayout(gd, 'paper_bgcolor', 'red');
        })
        .then(function() {
            _assert({
                subplotCnt: 400,
                innerSubplotNodeCnt: 4,
                hasSplomGrid: true,
                bgCnt: 400
            });

            return Plotly.relayout(gd, 'plot_bgcolor', 'red');
        })
        .then(function() {
            _assert({
                subplotCnt: 400,
                innerSubplotNodeCnt: 4,
                hasSplomGrid: true,
                bgCnt: 0
            });

            return Plotly.restyle(gd, 'dimensions', [dimsSmall]);
        })
        .then(function() {
            _assert({
                subplotCnt: 25,
                innerSubplotNodeCnt: 19,
                hasSplomGrid: false,
                bgCnt: 0
            });

            // make sure 'new' subplot layers are in order
            var gridIndex = -1;
            var xaxisIndex = -1;
            var subplot0 = d3Select('g.cartesianlayer > g.subplot').node();
            for(var i in subplot0.children) {
                var cl = subplot0.children[i].classList;
                if(cl) {
                    if(cl.contains('gridlayer')) gridIndex = +i;
                    else if(cl.contains('xaxislayer-above')) xaxisIndex = +i;
                }
            }
            // from large -> small splom:
            // grid layer would be above xaxis layer,
            // if we didn't clear subplot children.
            expect(gridIndex).toBe(2, '<g.gridlayer> index');
            expect(xaxisIndex).toBe(16, '<g.xaxislayer-above> index');

            return Plotly.restyle(gd, 'dimensions', [dimsLarge]);
        })
        .then(function() {
            _assert({
                subplotCnt: 400,
                // from small -> large splom:
                // no need to clear subplots children in existing subplots,
                // new subplots though have reduced number of children.
                innerSubplotNodeCnt: function(d) {
                    var p = d.match(SUBPLOT_PATTERN);
                    return (p[1] > 5 || p[2] > 5) ? 4 : 19;
                },
                hasSplomGrid: true,
                bgCnt: 0
            });
        })
        .then(done, done.fail);
    });

    it('@gl should correctly move axis layers when relayouting *grid.(x|y)side*', function(done) {
        var fig = Lib.extendDeep({}, require('../../image/mocks/splom_upper-nodiag.json'));

        function _assert(exp) {
            var g = d3Select(gd).select('g.cartesianlayer');
            for(var k in exp) {
                // all ticks are set to same position,
                // only check first one
                var tick0 = g.select('g.' + k + 'tick > text');
                var pos = {x: 'y', y: 'x'}[k.charAt(0)];
                expect(+tick0.attr(pos))
                    .toBeWithin(exp[k], 1, pos + ' position for axis ' + k);
            }
        }

        _newPlot(gd, fig).then(function() {
            expect(gd._fullLayout.grid.xside).toBe('bottom', 'sanity check dflt grid.xside');
            expect(gd._fullLayout.grid.yside).toBe('left', 'sanity check dflt grid.yside');

            _assert({
                x2: 433, x3: 433, x4: 433,
                y: 80, y2: 80, y3: 80
            });
            return Plotly.relayout(gd, 'grid.yside', 'left plot');
        })
        .then(function() {
            _assert({
                x2: 433, x3: 433, x4: 433,
                y: 79, y2: 230, y3: 382
            });
            return Plotly.relayout(gd, 'grid.xside', 'bottom plot');
        })
        .then(function() {
            _assert({
                x2: 212, x3: 323, x4: 433,
                y: 79, y2: 230, y3: 382
            });
        })
        .then(done, done.fail);
    });

    it('@gl should work with typed arrays', function(done) {
        _newPlot(gd, [{
            type: 'splom',
            dimensions: [{
                label: 'A',
                values: new Int32Array([1, 2, 3])
            }, {
                label: 'B',
                values: new Int32Array([2, 5, 6])
            }]
        }])
        .then(done, done.fail);
    });

    it('@gl should toggle trace correctly', function(done) {
        var fig = Lib.extendDeep({}, require('../../image/mocks/splom_iris.json'));

        function _assert(msg, exp) {
            var splomScenes = gd._fullLayout._splomScenes;
            var ids = gd._fullData.map(function(trace) { return trace.uid; });

            for(var i = 0; i < 3; i++) {
                var drawFn = splomScenes[ids[i]].draw;
                expect(drawFn.calls.count()).toBe(exp[i], msg + ' - trace ' + i);
                drawFn.calls.reset();
            }
        }

        _newPlot(gd, fig).then(function() {
            var splomScenes = gd._fullLayout._splomScenes;
            for(var k in splomScenes) {
                spyOn(splomScenes[k], 'draw').and.callThrough();
            }

            return Plotly.restyle(gd, 'visible', 'legendonly', [0, 2]);
        })
        .then(function() {
            _assert('0-2 legendonly', [0, 1, 0]);
            return Plotly.restyle(gd, 'visible', false);
        })
        .then(function() {
            _assert('all gone', [0, 0, 0]);
            return Plotly.restyle(gd, 'visible', true);
        })
        .then(function() {
            _assert('all back', [1, 1, 1]);
        })
        .then(done, done.fail);
    });

    it('@gl should update axis arrangement on show(upper|lower)half + diagonal.visible restyles', function(done) {
        var seq = ['', '2', '3', '4'];

        function getAxesTypes(cont, letter) {
            return seq.map(function(s) {
                var ax = cont[letter + 'axis' + s];
                return ax ? ax.type : null;
            });
        }

        // undefined means there's an axis object, but no 'type' key in it
        // null means there's no axis object
        function _assertAxisTypes(msg, exp) {
            var xaxes = getAxesTypes(gd.layout, 'x');
            var yaxes = getAxesTypes(gd.layout, 'y');
            var fullXaxes = getAxesTypes(gd._fullLayout, 'x');
            var fullYaxes = getAxesTypes(gd._fullLayout, 'y');

            expect(xaxes).toEqual(exp.xaxes, msg);
            expect(fullXaxes).toEqual(exp.fullXaxes, msg);
            expect(yaxes).toEqual(exp.yaxes, msg);
            expect(fullYaxes).toEqual(exp.fullYaxes, msg);
        }

        var data = [{
            type: 'splom',
            showupperhalf: false,
            diagonal: {visible: false},
            dimensions: [{
                values: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
            }, {
                values: ['lyndon', 'richard', 'gerald', 'jimmy', 'ronald', 'george', 'bill', 'georgeW', 'barack', 'donald']
            }, {
                values: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
                axis: {type: 'category'}
            }, {
                values: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
                axis: {type: 'log'}
            }]
        }];

        _newPlot(gd, data).then(function() {
            _assertAxisTypes('no upper half / no diagonal', {
                xaxes: ['linear', 'category', undefined, null],
                fullXaxes: ['linear', 'category', 'category', null],
                yaxes: [null, 'category', undefined, undefined],
                fullYaxes: [null, 'category', 'category', 'log']
            });

            return Plotly.restyle(gd, {
                showupperhalf: true,
                'diagonal.visible': true
            });
        })
        .then(function() {
            _assertAxisTypes('full grid', {
                xaxes: ['linear', 'category', undefined, undefined],
                fullXaxes: ['linear', 'category', 'category', 'log'],
                yaxes: ['linear', 'category', undefined, undefined],
                fullYaxes: ['linear', 'category', 'category', 'log']
            });

            return Plotly.restyle(gd, {
                showlowerhalf: false,
                'diagonal.visible': false
            });
        })
        .then(function() {
            _assertAxisTypes('no lower half / no diagonal', {
                xaxes: ['linear', 'category', undefined, undefined],
                fullXaxes: [null, 'category', 'category', 'log'],
                yaxes: ['linear', 'category', undefined, undefined],
                fullYaxes: ['linear', 'category', 'category', null]
            });
        })
        .then(done, done.fail);
    });

    it('@gl should not fail when editing graph with visible:false traces', function(done) {
        _newPlot(gd, [{
            type: 'splom',
            dimensions: [{values: []}, {values: []}]
        }, {
            type: 'splom',
            dimensions: [{values: [1, 2, 3]}, {values: [2, 3, 4]}]
        }])
        .then(function() {
            var fullData = gd._fullData;
            var fullLayout = gd._fullLayout;
            var splomScenes = fullLayout._splomScenes;
            var opts = splomScenes[fullData[1].uid].matrixOptions;

            expect(fullData[0].visible).toBe(false, 'trace 0 visible');
            expect(fullData[1].visible).toBe(true, 'trace 1 visible');
            expect(Object.keys(splomScenes).length).toBe(1, '# of splom scenes');

            expect(opts.opacity).toBe(1, 'marker opacity');
            expect(opts.color).toEqual(new Uint8Array([255, 127, 14, 255]), 'marker color');
            expect(opts.colors).toBe(undefined, 'marker colors');

            return Plotly.restyle(gd, 'marker.opacity', [undefined, [0.2, 0.3, 0.4]]);
        })
        .then(function() {
            var fullData = gd._fullData;
            var fullLayout = gd._fullLayout;
            var opts = fullLayout._splomScenes[fullData[1].uid].matrixOptions;

            // ignored by regl-splom
            expect(opts.opacity).toBe(1, 'marker opacity');
            // ignored by regl-splom
            expect(opts.color).toEqual(new Uint8Array([255, 127, 14, 255]), 'marker color');
            // marker.opacity applied here
            expect(opts.colors).toBeCloseTo2DArray([
                [1, 0.498, 0.0549, 0.2],
                [1, 0.498, 0.0549, 0.3],
                [1, 0.498, 0.0549, 0.4]
            ], 'marker colors');
        })
        .then(done, done.fail);
    });
});

describe('Test splom update switchboard:', function() {
    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(function() {
        Plotly.purge(gd);
        destroyGraphDiv();
    });

    var methods;

    function addSpies() {
        methods.forEach(function(m) {
            var obj = m[0];
            var k = m[1];
            spyOn(obj, k).and.callThrough();
        });
    }

    function assertSpies(msg, exp) {
        methods.forEach(function(m, i) {
            var obj = m[0];
            var k = m[1];
            var expi = exp[i];
            expect(obj[k]).toHaveBeenCalledTimes(expi[1], expi[0]);
            obj[k].calls.reset();
        });
    }

    function toPlainArray(typedArray) {
        return Array.prototype.slice.call(typedArray);
    }

    it('@gl should trigger minimal sequence for axis range updates (large splom case)', function(done) {
        var fig = Lib.extendDeep({}, require('../../image/mocks/splom_large.json'));
        var matrix, regl, splomGrid;

        _newPlot(gd, fig).then(function() {
            var fullLayout = gd._fullLayout;
            var trace = gd._fullData[0];
            var scene = fullLayout._splomScenes[trace.uid];
            matrix = scene.matrix;
            regl = matrix.regl;
            splomGrid = fullLayout._splomGrid;

            methods = [
                [Plots, 'supplyDefaults'],
                [Axes, 'draw'],
                [regl, 'clear'],
                [splomGrid, 'update']
            ];
            addSpies();

            expect(fullLayout.xaxis.range).toBeCloseToArray([-0.0921, 0.9574], 1, 'xrng (base)');

            return Plotly.relayout(gd, 'xaxis.range', [0, 1]);
        })
        .then(function() {
            var msg = 'after update';

            assertSpies(msg, [
                ['supplyDefaults', 0],
                ['Axes.draw', 1],
                ['regl clear', 1],
                ['splom grid update', 1],
                ['splom grid draw', 1],
                ['splom matrix update', 1],
                ['splom matrix draw', 1]
            ]);

            expect(gd.layout.xaxis.range).toBeCloseToArray([0, 1], 1, 'xrng ' + msg);
            expect(gd._fullLayout.xaxis.range).toBeCloseToArray([0, 1], 1, 'xrng ' + msg);
        })
        .then(done, done.fail);
    });

    it('@gl should trigger minimal sequence for marker style updates', function(done) {
        var fig = Lib.extendDeep({}, require('../../image/mocks/splom_0.json'));
        var scene, matrix, regl;

        _newPlot(gd, fig).then(function() {
            var fullLayout = gd._fullLayout;
            var trace = gd._fullData[0];
            scene = fullLayout._splomScenes[trace.uid];
            matrix = scene.matrix;
            regl = matrix.regl;

            methods = [
                [Plots, 'supplyDefaults'],
                [Plots, 'doCalcdata'],
                [Axes, 'draw'],
                [regl, 'clear'],
                [matrix, 'update'],
                [matrix, 'draw']
            ];
            addSpies();

            expect(toPlainArray(scene.matrixOptions.color))
                .toBeCloseToArray([31, 119, 180, 255], 1, 'base color');
            expect(scene.matrixOptions.size).toBe(6, 'base size');
            expect(fullLayout.xaxis.range).toBeCloseToArray([0.851, 3.148], 1, 'base xrng');

            return Plotly.restyle(gd, 'marker.color', 'black');
        })
        .then(function() {
            var msg = 'after scaler marker.color restyle';

            assertSpies(msg, [
                ['supplyDefaults', 1],
                ['doCalcdata', 0],
                ['Axes.draw', 0],
                ['regl clear', 1],
                ['update', 1],
                ['draw', 1]
            ]);

            expect(toPlainArray(scene.matrixOptions.color))
                .toBeCloseToArray([0, 0, 0, 255], 1, msg);

            return Plotly.restyle(gd, 'marker.color', [['red', 'green', 'blue']]);
        })
        .then(function() {
            var msg = 'after arrayOk marker.color restyle';

            assertSpies(msg, [
                ['supplyDefaults', 1],
                ['doCalcdata', 0],
                ['Axes.draw', 0],
                ['clear', 1],
                ['update', 1],
                ['draw', 1]
            ]);

            expect(toPlainArray(scene.matrixOptions.colors[0]))
                .toBeCloseToArray([1, 0, 0, 1], 1, msg + '- 0');
            expect(toPlainArray(scene.matrixOptions.colors[1]))
                .toBeCloseToArray([0, 0.501, 0, 1], 1, msg + '- 1');
            expect(toPlainArray(scene.matrixOptions.colors[2]))
                .toBeCloseToArray([0, 0, 1, 1], 1, msg + '- 2');

            return Plotly.restyle(gd, {
                'marker.cmin': -3,
                'marker.cmax': 3,
                'marker.color': [[1, 2, 3]]
            });
        })
        .then(function() {
            var msg = 'after colorscale marker.color restyle';

            assertSpies(msg, [
                ['supplyDefaults', 1],
                ['doCalcdata', 0],
                ['Axes.draw', 0],
                ['clear', 1],
                ['update', 1],
                ['draw', 1]
            ]);

            expect(toPlainArray(scene.matrixOptions.colors[0]))
                .toBeCloseToArray([0.890, 0.6, 0.4078, 1], 1, msg + '- 0');
            expect(toPlainArray(scene.matrixOptions.colors[1]))
                .toBeCloseToArray([0.81176, 0.3333, 0.2431, 1], 1, msg + '- 1');
            expect(toPlainArray(scene.matrixOptions.colors[2]))
                .toBeCloseToArray([0.6980, 0.0392, 0.1098, 1], 1, msg + '- 2');

            return Plotly.restyle(gd, 'marker.size', 20);
        })
        .then(function() {
            var msg = 'after scalar marker.size restyle';

            assertSpies(msg, [
                ['supplyDefaults', 1],
                ['doCalcdata', 1],
                ['Axes.draw', 1],
                ['regl clear', 1],
                ['update', 1],
                ['draw', 1]
            ]);

            expect(scene.matrixOptions.size).toBe(20, msg);
            expect(gd._fullLayout.xaxis.range)
                .toBeCloseToArray([0.753, 3.246], 1, 'xrng ' + msg);

            return Plotly.restyle(gd, 'marker.size', [[4, 10, 20]]);
        })
        .then(function() {
            var msg = 'after scalar marker.size restyle';

            assertSpies(msg, [
                ['supplyDefaults', 1],
                ['doCalcdata', 1],
                ['Axes.draw', 1],
                ['regl clear', 1],
                ['update', 1],
                ['draw', 1]
            ]);

            expect(scene.matrixOptions.sizes).toBeCloseToArray([4, 10, 20], 1, msg);
            expect(gd._fullLayout.xaxis.range)
                .toBeCloseToArray([0.853, 3.235], 1, 'xrng ' + msg);

            return Plotly.restyle(gd, 'marker.symbol', 'square');
        })
        .then(function() {
            var msg = 'after scalar marker.symbol restyle';

            assertSpies(msg, [
                ['supplyDefaults', 1],
                ['doCalcdata', 0],
                ['Axes.draw', 0],
                ['clear', 1],
                ['update', 1],
                ['draw', 1]
            ]);

            expect(scene.matrixOptions.marker).not.toBeNull(msg);
        })
        .then(done, done.fail);
    });
});

describe('Test splom hover:', function() {
    var gd;

    afterEach(function() {
        Plotly.purge(gd);
        destroyGraphDiv();
    });

    function run(s, done) {
        gd = createGraphDiv();

        var fig = Lib.extendDeep({},
            s.mock || require('../../image/mocks/splom_iris.json')
        );

        if(s.patch) {
            fig = s.patch(fig);
        }

        var pos = s.pos || [200, 100];

        return _newPlot(gd, fig).then(function() {
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
                        expect(actual[i][k]).toBe(exp[i][k], m);
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
        patch: function(fig) {
            fig.layout.hovermode = 'x';
            return fig;
        },
        nums: '7.7',
        name: 'Virginica',
        axis: '2.6',
        evtPts: [{x: 2.6, y: 7.7, pointNumber: 18, curveNumber: 2}]
    }, {
        desc: 'hovermode closest',
        nums: '(2.6, 7.7)',
        name: 'Virginica',
        evtPts: [{x: 2.6, y: 7.7, pointNumber: 18, curveNumber: 2}]
    }, {
        desc: 'skipping over visible false dims',
        patch: function(fig) {
            fig.data[0].dimensions[0].visible = false;
            fig.layout.hovermode = 'x';
            return fig;
        },
        nums: '7.7',
        name: 'Virginica',
        axis: '2.6',
        evtPts: [{x: 2.6, y: 7.7, pointNumber: 18, curveNumber: 2}]
    }, {
        desc: 'on log axes',
        mock: require('../../image/mocks/splom_log.json'),
        patch: function(fig) {
            fig.layout.margin = {t: 0, l: 0, b: 0, r: 0};
            fig.layout.width = 400;
            fig.layout.height = 400;
            fig.layout.hovermode = 'x';
            return fig;
        },
        pos: [20, 380],
        nums: '100',
        axis: '10',
        evtPts: [{x: 10, y: 100, pointNumber: 0}]
    }, {
        desc: 'on date axes',
        mock: require('../../image/mocks/splom_dates.json'),
        patch: function(fig) {
            fig.layout = {
                hovermode: 'x',
                margin: {t: 0, l: 0, b: 0, r: 0},
                width: 400,
                height: 400
            };
            return fig;
        },
        pos: [20, 380],
        nums: 'Apr 2003',
        axis: 'Jan 2000',
        evtPts: [{x: '2000-01-01', y: '2003-04-21', pointNumber: 0}]
    }, {
        desc: 'with hovertext',
        patch: function(fig) {
            fig.data.forEach(function(t) {
                t.hovertext = 'LOOK';
                t.text = 'NOP';
            });
            return fig;
        },
        nums: '(2.6, 7.7)\nLOOK',
        name: 'Virginica',
        evtPts: [{x: 2.6, y: 7.7, pointNumber: 18, curveNumber: 2}]
    }, {
        desc: 'with a hovertemplate',
        patch: function(fig) {
            fig.data.forEach(function(t) {
                t.hovertemplate = '%{x}|%{y}<extra>pt %{pointNumber}</extra>';
            });
            return fig;
        },
        nums: '2.6|7.7',
        name: 'pt 18',
        evtPts: [{x: 2.6, y: 7.7, pointNumber: 18, curveNumber: 2}]
    }];

    specs.forEach(function(s) {
        it('@gl should generate correct hover labels ' + s.desc, function(done) {
            run(s, done);
        });
    });
});

describe('Test splom drag:', function() {
    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(function() {
        Plotly.purge(gd);
        destroyGraphDiv();
    });

    function _drag(p0, p1) {
        var node = d3Select('.nsewdrag[data-subplot="xy"]').node();
        var dx = p1[0] - p0[0];
        var dy = p1[1] - p0[1];
        return drag({node: node, dpos: [dx, dy], pos0: p0});
    }

    it('@gl should update scattermatrix ranges on pan', function(done) {
        var fig = require('../../image/mocks/splom_iris.json');
        fig.layout.dragmode = 'pan';

        var xaxes = ['xaxis', 'xaxis2', 'xaxis3'];
        var yaxes = ['yaxis', 'yaxis2', 'yaxis3'];

        function _assertRanges(msg, xRanges, yRanges) {
            xaxes.forEach(function(n, i) {
                expect(gd._fullLayout[n].range)
                    .toBeCloseToArray(xRanges[i], 0.5, n + ' range - ' + msg);
            });
            yaxes.forEach(function(n, i) {
                expect(gd._fullLayout[n].range)
                    .toBeCloseToArray(yRanges[i], 0.5, n + ' range - ' + msg);
            });
        }

        _newPlot(gd, fig)
        .then(function() {
            var uid = gd._fullData[0].uid;
            var scene = gd._fullLayout._splomScenes[uid];
            spyOn(scene.matrix, 'update');
            spyOn(scene.matrix, 'draw');

            _assertRanges('before drag', [
                [3.9, 8.3],
                [1.7, 4.7],
                [0.3, 7.6]
            ], [
                [3.8, 8.4],
                [1.7, 4.7],
                [0.3, 7.6]
            ]);
        })
        .then(function() { return _drag([130, 130], [150, 150]); })
        .then(function() {
            var uid = gd._fullData[0].uid;
            var scene = gd._fullLayout._splomScenes[uid];
            // N.B. _drag triggers two updateSubplots call
            // - 1 update and 1 draw call per updateSubplot
            // - 1 update calls for data+view opts
            //   during splom plot on mouseup
            // - 1 draw call during splom plot on mouseup
            expect(scene.matrix.update).toHaveBeenCalledTimes(3);
            expect(scene.matrix.draw).toHaveBeenCalledTimes(3);

            _assertRanges('after drag', [
                [2.9, 7.3],
                [1.7, 4.7],
                [0.3, 7.6]
            ], [
                [5.1, 9.6],
                [1.7, 4.7],
                [0.3, 7.6]
            ]);
        })
        .then(done, done.fail);
    });
});

describe('Test splom select:', function() {
    var gd;
    var ptData;
    var subplot;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(function() {
        Plotly.purge(gd);
        destroyGraphDiv();
    });

    function _select(path, opts) {
        return new Promise(function(resolve, reject) {
            opts = opts || {};
            ptData = null;
            subplot = null;

            var to = setTimeout(function() {
                reject('fail: plotly_selected not emitter');
            }, 700);

            gd.once('plotly_selected', function(d) {
                clearTimeout(to);
                ptData = (d || {}).points;
                subplot = Object.keys(d.range || {}).join('');
                resolve();
            });

            opts.path = path;
            opts.clearThrottle = Lib.clearThrottle;
            drag(opts);
        });
    }

    it('@gl should emit correct event data and draw selection outlines', function(done) {
        var fig = Lib.extendDeep({}, require('../../image/mocks/splom_0.json'));
        fig.layout = {
            dragmode: 'select',
            width: 400,
            height: 400,
            margin: {l: 0, t: 0, r: 0, b: 0},
            grid: {xgap: 0, ygap: 0}
        };

        function _assert(_msg, ptExp, otherExp) {
            var msg = ' - ' + _msg;

            expect(ptData.length).toBe(ptExp.length, 'pt length' + msg);
            for(var i = 0; i < ptExp.length; i++) {
                for(var k in ptExp[i]) {
                    var m = 'key ' + k + ' in pt ' + i + msg;
                    expect(ptData[i][k]).toBe(ptExp[i][k], m);
                }
            }

            expect(subplot).toBe(otherExp.subplot, 'subplot of selection' + msg);

            expect(d3SelectAll('.zoomlayer > .select-outline').size())
                .toBe(otherExp.selectionOutlineCnt, 'selection outline cnt' + msg);
        }

        _newPlot(gd, fig)
        .then(function() { return _select([[5, 5], [195, 195]]); })
        .then(function() {
            _assert('first', [
                {pointNumber: 0, x: 1, y: 1},
                {pointNumber: 1, x: 2, y: 2},
                {pointNumber: 2, x: 3, y: 3}
            ], {
                subplot: 'xy',
                selectionOutlineCnt: 1
            });
        })
        .then(function() { return _select([[50, 50], [100, 100]]); })
        .then(function() {
            _assert('second', [
                // new points
                {pointNumber: 1, x: 2, y: 2},

                // remain from previous selection
                {pointNumber: 0, x: 1, y: 1},
                {pointNumber: 2, x: 3, y: 3}
            ], {
                subplot: 'xy',
                selectionOutlineCnt: 1
            });
        })
        .then(function() { return _select([[205, 205], [395, 395]]); })
        .then(function() {
            _assert('across other subplot', [
                {pointNumber: 0, x: 2, y: 2},
                {pointNumber: 1, x: 5, y: 5},
                {pointNumber: 2, x: 6, y: 6}
            ], {
                subplot: 'x2y2',
                // outlines from previous subplot are cleared!
                selectionOutlineCnt: 1
            });
        })
        .then(done, done.fail);
    });

    it('@gl should redraw splom traces before scattergl trace (if any)', function(done) {
        var fig = require('../../image/mocks/splom_with-cartesian.json');
        fig.layout.dragmode = 'select';
        fig.layout.width = 400;
        fig.layout.height = 400;
        fig.layout.margin = {l: 0, t: 0, r: 0, b: 0};
        fig.layout.grid.xgap = 0;
        fig.layout.grid.ygap = 0;

        var cnt = 0;
        var scatterGlCnt = 0;
        var splomCnt = 0;
        var scatterglScene, splomScene;

        _newPlot(gd, fig).then(function() {
            var fullLayout = gd._fullLayout;
            scatterglScene = fullLayout._plots.xy._scene;
            splomScene = fullLayout._splomScenes[gd._fullData[1].uid];

            spyOn(scatterglScene, 'draw').and.callFake(function() {
                cnt++;
                scatterGlCnt = cnt;
            });
            spyOn(splomScene, 'draw').and.callFake(function() {
                cnt++;
                splomCnt = cnt;
            });
        })
        .then(function() { return _select([[20, 395], [195, 205]]); })
        .then(function() {
            expect(scatterglScene.draw).toHaveBeenCalledTimes(1);
            expect(splomScene.draw).toHaveBeenCalledTimes(1);

            expect(cnt).toBe(2);
            expect(splomCnt).toBe(1, 'splom redraw before scattergl');
            expect(scatterGlCnt).toBe(2, 'scattergl redraw after splom');
        })
        .then(done, done.fail);
    });

    it('@noCI @gl should behave correctly during select->dblclick->pan scenarios', function(done) {
        var fig = Lib.extendDeep({}, require('../../image/mocks/splom_0.json'));
        fig.layout = {
            width: 400,
            height: 400,
            margin: {l: 0, t: 0, r: 0, b: 0},
            grid: {xgap: 0, ygap: 0}
        };

        var uid, scene;

        function _assert(msg, exp) {
            expect(scene.matrix.update).toHaveBeenCalledTimes(exp.updateCnt, 'update cnt');
            expect(scene.matrix.draw).toHaveBeenCalledTimes(exp.drawCnt, 'draw cnt');

            expect(scene.matrix.traces.length).toBe(exp.matrixTraces, '# of regl-splom traces');
            expect(scene.selectBatch).toEqual(exp.selectBatch, 'selectBatch');
            expect(scene.unselectBatch).toEqual(exp.unselectBatch, 'unselectBatch');

            scene.matrix.update.calls.reset();
            scene.matrix.draw.calls.reset();
        }

        _newPlot(gd, fig).then(function() {
            uid = gd._fullData[0].uid;
            scene = gd._fullLayout._splomScenes[uid];
            spyOn(scene.matrix, 'update').and.callThrough();
            spyOn(scene.matrix, 'draw').and.callThrough();
        })
        .then(function() {
            _assert('base', {
                updateCnt: 0,
                drawCnt: 0,
                matrixTraces: 1,
                selectBatch: [],
                unselectBatch: []
            });
        })
        .then(function() { return Plotly.relayout(gd, 'dragmode', 'select'); })
        .then(function() {
            _assert('under dragmode:select', {
                updateCnt: 1,     // updates positions, viewport and style in 1 call
                drawCnt: 1,       // results in a 'plot' edit
                matrixTraces: 1,
                selectBatch: [],
                unselectBatch: []
            });
        })
        .then(function() { return _select([[5, 5], [100, 100]]); })
        .then(function() {
            _assert('after selection', {
                updateCnt: 1,    // update to [un]selected styles
                drawCnt: 1,
                matrixTraces: 2,
                selectBatch: [1],
                unselectBatch: [0, 2]
            });
        })
        .then(function() { return Plotly.relayout(gd, 'dragmode', 'pan'); })
        .then(function() {
            _assert('under dragmode:pan with active selection', {
                updateCnt: 0,
                drawCnt: 0,      // nothing here, this is a 'modebar' edit
                matrixTraces: 2,
                selectBatch: [],
                unselectBatch: [0, 2]
            });
        })
        .then(function() { return Plotly.relayout(gd, 'dragmode', 'select'); })
        .then(function() {
            _assert('back dragmode:select', {
                updateCnt: 1,
                drawCnt: 1,       // a 'plot' edit (again)
                matrixTraces: 2,
                selectBatch: [],
                unselectBatch: [0, 2]
            });
        })
        .then(function() { return doubleClick(100, 100); })
        .then(function() {
            _assert('after dblclick clearing selection', {
                updateCnt: 1,  // reset to 'base' styles
                drawCnt: 1,
                matrixTraces: 1,
                selectBatch: [],
                unselectBatch: []
            });
        })
        .then(function() { return Plotly.relayout(gd, 'dragmode', 'pan'); })
        .then(function() {
            _assert('under dragmode:pan with NO active selection', {
                updateCnt: 0,
                drawCnt: 0,
                matrixTraces: 1,
                selectBatch: [],
                unselectBatch: []
            });
        })
        .then(done, done.fail);
    });

    it('@gl should be able to select', function(done) {
        function _assert(msg, exp) {
            return function() {
                var uid = gd._fullData[0].uid;
                var scene = gd._fullLayout._splomScenes[uid];
                expect(scene.selectBatch).withContext(msg + ' selectBatch').toEqual(exp.selectBatch);
                expect(scene.unselectBatch).withContext(msg + ' unselectBatch').toEqual(exp.unselectBatch);
            };
        }

        _newPlot(gd, [{
            type: 'splom',
            dimensions: [{
                values: [1, 2, 3]
            }, {
                values: [2, 3, 0]
            }]
        }], {
            width: 400,
            height: 400,
            margin: {l: 0, t: 0, r: 0, b: 0},
            dragmode: 'select'
        })
        .then(_assert('base', {
            selectBatch: [],
            unselectBatch: []
        }))
        .then(function() { return _select([[50, 50], [195, 195]]); })
        .then(_assert('after selection', {
            selectBatch: [1],
            unselectBatch: [0, 2]
        }))
        .then(done, done.fail);
    });
});
