var Plotly = require('@lib');
var Lib = require('@src/lib');
var Plots = require('@src/plots/plots');
var SUBPLOT_PATTERN = require('@src/plots/cartesian/constants').SUBPLOT_PATTERN;

var d3 = require('d3');
var supplyAllDefaults = require('../assets/supply_defaults');
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var failTest = require('../assets/fail_test');
var mouseEvent = require('../assets/mouse_event');
var drag = require('../assets/drag');
var doubleClick = require('../assets/double_click');

var customAssertions = require('../assets/custom_assertions');
var assertHoverLabelContent = customAssertions.assertHoverLabelContent;

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

    it('should set `grid.xaxes` and `grid.yaxes` default using the new of dimensions', function() {
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

        var fullLayout = gd._fullLayout;
        // this here does the 'ignoring' part
        expect(Object.keys(fullLayout._splomSubplots)).toEqual([
            'xy', 'xy2', 'xy3',
            'x2y', 'x2y2', 'x2y3',
            'x3y', 'x3y2', 'x3y3'
        ]);
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

        var fullLayout = gd._fullLayout;
        // this here does the 'ignoring' part
        expect(Object.keys(fullLayout._splomSubplots)).toEqual([
            'x2y2', 'x2y3', 'x2y4',
            'x3y2', 'x3y3', 'x3y4',
            'x4y2', 'x4y3', 'x4y4'
        ]);
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

        var cd = gd.calcdata[0][0];

        expect(cd.t._scene.matrixOptions.data).toBeCloseTo2DArray([[2, 1, 2]]);
        expect(cd.t.visibleDims).toEqual([1]);
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
        var fig = Lib.extendDeep({}, require('@mocks/splom_large.json'));

        Plotly.plot(gd, fig).then(function() {
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

    it('@gl when hasOnlyLargeSploms, should create correct regl-line2d data for grid', function(done) {
        var fig = Lib.extendDeep({}, require('@mocks/splom_large.json'));
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

        Plotly.plot(gd, fig).then(function() {
            _assert([1198, 3478, 16318, 118]);
            return Plotly.restyle(gd, 'showupperhalf', false);
        })
        .then(function() {
            _assert([1198, 1882, 8452, 4]);
            return Plotly.restyle(gd, 'diagonal.visible', false);
        })
        .then(function() {
            _assert([1138, 1702, 7636, 4]);
            return Plotly.restyle(gd, {
                showupperhalf: true,
                showlowerhalf: false
            });
        })
        .then(function() {
            _assert([64, 1594, 7852, 112]);
            return Plotly.restyle(gd, 'diagonal.visible', true);
        })
        .then(function() {
            _assert([58, 1768, 8680, 118]);
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
            _assert([8740, 1888]);
        })
        .catch(failTest)
        .then(done);
    });

    it('@gl should update properly in-and-out of hasOnlyLargeSploms regime', function(done) {
        var figLarge = Lib.extendDeep({}, require('@mocks/splom_large.json'));
        var dimsLarge = figLarge.data[0].dimensions;
        var dimsSmall = dimsLarge.slice(0, 5);
        var cnt = 1;

        function _assert(exp) {
            var msg = ' - call #' + cnt;
            var subplots = d3.selectAll('g.cartesianlayer > g.subplot');

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

            cnt++;
        }

        Plotly.plot(gd, figLarge).then(function() {
            _assert({
                subplotCnt: 400,
                innerSubplotNodeCnt: 5,
                hasSplomGrid: true
            });
            return Plotly.restyle(gd, 'dimensions', [dimsSmall]);
        })
        .then(function() {
            _assert({
                subplotCnt: 25,
                innerSubplotNodeCnt: 17,
                hasSplomGrid: false
            });

            // make sure 'new' subplot layers are in order
            var gridIndex = -1;
            var xaxisIndex = -1;
            var subplot0 = d3.select('g.cartesianlayer > g.subplot').node();
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
            expect(gridIndex).toBe(1, '<g.gridlayer> index');
            expect(xaxisIndex).toBe(14, '<g.xaxislayer-above> index');

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
                    return (p[1] > 5 || p[2] > 5) ? 5 : 17;
                },
                hasSplomGrid: true
            });
        })
        .catch(failTest)
        .then(done);
    });

    it('@gl should correctly move axis layers when relayouting *grid.(x|y)side*', function(done) {
        var fig = Lib.extendDeep({}, require('@mocks/splom_upper-nodiag.json'));

        function _assert(exp) {
            var g = d3.select(gd).select('g.cartesianlayer');
            for(var k in exp) {
                // all ticks are set to same position,
                // only check first one
                var tick0 = g.select('g.' + k + 'tick > text');
                var pos = {x: 'y', y: 'x'}[k.charAt(0)];
                expect(+tick0.attr(pos))
                    .toBeWithin(exp[k], 1, pos + ' position for axis ' + k);
            }
        }

        Plotly.plot(gd, fig).then(function() {
            expect(gd._fullLayout.grid.xside).toBe('bottom', 'sanity check dflt grid.xside');
            expect(gd._fullLayout.grid.yside).toBe('left', 'sanity check dflt grid.yside');

            _assert({
                x: 433, x2: 433, x3: 433,
                y: 80, y2: 80, y3: 80
            });
            return Plotly.relayout(gd, 'grid.yside', 'left plot');
        })
        .then(function() {
            _assert({
                x: 433, x2: 433, x3: 433,
                y: 79, y2: 230, y3: 382
            });
            return Plotly.relayout(gd, 'grid.xside', 'bottom plot');
        })
        .then(function() {
            _assert({
                x: 212, x2: 323, x3: 433,
                y: 79, y2: 230, y3: 382
            });
        })
        .catch(failTest)
        .then(done);
    });

    it('@gl should work with typed arrays', function(done) {
        Plotly.plot(gd, [{
            type: 'splom',
            dimensions: [{
                label: 'A',
                values: new Int32Array([1, 2, 3])
            }, {
                label: 'B',
                values: new Int32Array([2, 5, 6])
            }]
        }])
        .catch(failTest)
        .then(done);
    });

    it('@gl should toggle trace correctly', function(done) {
        var fig = Lib.extendDeep({}, require('@mocks/splom_iris.json'));

        function _assert(msg, exp) {
            for(var i = 0; i < 3; i++) {
                expect(Boolean(gd.calcdata[i][0].t._scene))
                    .toBe(Boolean(exp[i]), msg + ' - trace ' + i);
            }
        }

        Plotly.plot(gd, fig).then(function() {
            _assert('base', [1, 1, 1]);
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
        .catch(failTest)
        .then(done);
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
            s.mock || require('@mocks/splom_iris.json')
        );

        if(s.patch) {
            fig = s.patch(fig);
        }

        var pos = s.pos || [200, 100];

        return Plotly.plot(gd, fig).then(function() {
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
        nums: '7.7',
        name: 'Virginica',
        axis: '2.6',
        evtPts: [{x: 2.6, y: 7.7, pointNumber: 18, curveNumber: 2}]
    }, {
        desc: 'hovermode closest',
        patch: function(fig) {
            fig.layout.hovermode = 'closest';
            return fig;
        },
        nums: '(2.6, 7.7)',
        name: 'Virginica',
        evtPts: [{x: 2.6, y: 7.7, pointNumber: 18, curveNumber: 2}]
    }, {
        desc: 'skipping over visible false dims',
        patch: function(fig) {
            fig.data[0].dimensions[0].visible = false;
            return fig;
        },
        nums: '7.7',
        name: 'Virginica',
        axis: '2.6',
        evtPts: [{x: 2.6, y: 7.7, pointNumber: 18, curveNumber: 2}]
    }, {
        desc: 'on log axes',
        mock: require('@mocks/splom_log.json'),
        patch: function(fig) {
            fig.layout.margin = {t: 0, l: 0, b: 0, r: 0};
            fig.layout.width = 400;
            fig.layout.height = 400;
            return fig;
        },
        pos: [20, 380],
        nums: '100',
        axis: '10',
        evtPts: [{x: 10, y: 100, pointNumber: 0}]
    }, {
        desc: 'on date axes',
        mock: require('@mocks/splom_dates.json'),
        patch: function(fig) {
            fig.layout = {
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
        var node = d3.select('.nsewdrag[data-subplot="xy"]').node();
        var dx = p1[0] - p0[0];
        var dy = p1[1] - p0[1];
        return drag(node, dx, dy, null, p0[0], p0[1]);
    }

    it('@gl should update scattermatrix ranges on pan', function(done) {
        var fig = require('@mocks/splom_iris.json');
        fig.layout.dragmode = 'pan';

        var xaxes = ['xaxis', 'xaxis2', 'xaxis3'];
        var yaxes = ['yaxis', 'yaxis2', 'yaxis3'];

        function _assertRanges(msg, xRanges, yRanges) {
            xaxes.forEach(function(n, i) {
                expect(gd._fullLayout[n].range)
                    .toBeCloseToArray(xRanges[i], 1, n + ' range - ' + msg);
            });
            yaxes.forEach(function(n, i) {
                expect(gd._fullLayout[n].range)
                    .toBeCloseToArray(yRanges[i], 1, n + ' range - ' + msg);
            });
        }

        Plotly.plot(gd, fig)
        .then(function() {
            var scene = gd.calcdata[0][0].t._scene;
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
            var scene = gd.calcdata[0][0].t._scene;
            // N.B. _drag triggers two updateSubplots call
            // - 1 update and 1 draw call per updateSubplot
            // - 2 update calls (1 for data, 1 for view opts)
            //   during splom plot on mouseup
            // - 1 draw call during splom plot on mouseup
            expect(scene.matrix.update).toHaveBeenCalledTimes(4);
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
        .catch(failTest)
        .then(done);
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
            }, 200);

            gd.once('plotly_selected', function(d) {
                clearTimeout(to);
                ptData = (d || {}).points;
                subplot = Object.keys(d.range || {}).join('');
                resolve();
            });

            Lib.clearThrottle();
            mouseEvent('mousemove', path[0][0], path[0][1], opts);
            mouseEvent('mousedown', path[0][0], path[0][1], opts);

            var len = path.length;
            path.slice(1, len).forEach(function(pt) {
                Lib.clearThrottle();
                mouseEvent('mousemove', pt[0], pt[1], opts);
            });

            mouseEvent('mouseup', path[len - 1][0], path[len - 1][1], opts);
        });
    }

    it('@gl should emit correct event data and draw selection outlines', function(done) {
        var fig = Lib.extendDeep({}, require('@mocks/splom_0.json'));
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

            expect(d3.selectAll('.zoomlayer > .select-outline').size())
                .toBe(otherExp.selectionOutlineCnt, 'selection outline cnt' + msg);
        }

        Plotly.newPlot(gd, fig)
        .then(function() { return _select([[5, 5], [195, 195]]); })
        .then(function() {
            _assert('first', [
                {pointNumber: 0, x: 1, y: 1},
                {pointNumber: 1, x: 2, y: 2},
                {pointNumber: 2, x: 3, y: 3}
            ], {
                subplot: 'xy',
                selectionOutlineCnt: 2
            });
        })
        .then(function() { return _select([[50, 50], [100, 100]]); })
        .then(function() {
            _assert('second', [
                {pointNumber: 1, x: 2, y: 2}
            ], {
                subplot: 'xy',
                selectionOutlineCnt: 2
            });
        })
        .then(function() { return _select([[5, 195], [100, 100]], {shiftKey: true}); })
        .then(function() {
            _assert('multi-select', [
                {pointNumber: 0, x: 1, y: 1},
                {pointNumber: 1, x: 2, y: 2}
            ], {
                subplot: 'xy',
                // still '2' as the selection get merged
                selectionOutlineCnt: 2
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
                selectionOutlineCnt: 2
            });
        })
        .then(function() { return _select([[50, 50], [100, 100]]); })
        .then(function() {
            _assert('multi-select across other subplot (prohibited for now)', [
                {pointNumber: 1, x: 2, y: 2}
            ], {
                subplot: 'xy',
                // outlines from previous subplot are cleared!
                selectionOutlineCnt: 2
            });
        })
        .catch(failTest)
        .then(done);
    });

    it('@gl should redraw splom traces before scattergl trace (if any)', function(done) {
        var fig = require('@mocks/splom_with-cartesian.json');
        fig.layout.dragmode = 'select';
        fig.layout.width = 400;
        fig.layout.height = 400;
        fig.layout.margin = {l: 0, t: 0, r: 0, b: 0};
        fig.layout.grid.xgap = 0;
        fig.layout.grid.ygap = 0;

        var cnt = 0;
        var scatterGlCnt = 0;
        var splomCnt = 0;

        Plotly.newPlot(gd, fig).then(function() {
            // 'scattergl' trace module
            spyOn(gd._fullLayout._modules[0], 'style').and.callFake(function() {
                cnt++;
                scatterGlCnt = cnt;
            });
            // 'splom' trace module
            spyOn(gd._fullLayout._modules[1], 'style').and.callFake(function() {
                cnt++;
                splomCnt = cnt;
            });
        })
        .then(function() { return _select([[20, 395], [195, 205]]); })
        .then(function() {
            expect(gd._fullLayout._modules[0].style).toHaveBeenCalledTimes(1);
            expect(gd._fullLayout._modules[1].style).toHaveBeenCalledTimes(1);

            expect(cnt).toBe(2);
            expect(splomCnt).toBe(1, 'splom redraw before scattergl');
            expect(scatterGlCnt).toBe(2, 'scattergl redraw after splom');
        })
        .catch(failTest)
        .then(done);
    });

    it('@gl should behave correctly during select->dblclick->pan scenarios', function(done) {
        var fig = Lib.extendDeep({}, require('@mocks/splom_0.json'));
        fig.layout = {
            width: 400,
            height: 400,
            margin: {l: 0, t: 0, r: 0, b: 0},
            grid: {xgap: 0, ygap: 0}
        };

        var scene;

        function _assert(msg, exp) {
            expect(scene.matrix.update).toHaveBeenCalledTimes(exp.updateCnt, 'update cnt');
            expect(scene.matrix.draw).toHaveBeenCalledTimes(exp.drawCnt, 'draw cnt');

            expect(scene.matrix.traces.length).toBe(exp.matrixTraces, '# of regl-splom traces');
            expect(scene.selectBatch).toEqual(exp.selectBatch, 'selectBatch');
            expect(scene.unselectBatch).toEqual(exp.unselectBatch, 'unselectBatch');

            scene.matrix.update.calls.reset();
            scene.matrix.draw.calls.reset();
        }

        Plotly.plot(gd, fig).then(function() {
            scene = gd.calcdata[0][0].t._scene;
            spyOn(scene.matrix, 'update').and.callThrough();
            spyOn(scene.matrix, 'draw').and.callThrough();
        })
        .then(function() {
            _assert('base', {
                updateCnt: 0,
                drawCnt: 0,
                matrixTraces: 1,
                selectBatch: null,
                unselectBatch: null
            });
        })
        .then(function() { return Plotly.relayout(gd, 'dragmode', 'select'); })
        .then(function() {
            _assert('under dragmode:select', {
                updateCnt: 3,     // updates positions, viewport and style in 3 calls
                drawCnt: 1,       // results in a 'plot' edit
                matrixTraces: 2,
                selectBatch: [],
                unselectBatch: []
            });
        })
        .then(function() { return _select([[5, 5], [100, 100]]); })
        .then(function() {
            _assert('after selection', {
                updateCnt: 0,
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
                selectBatch: [1],
                unselectBatch: [0, 2]
            });
        })
        .then(function() { return Plotly.relayout(gd, 'dragmode', 'select'); })
        .then(function() {
            _assert('back dragmode:select', {
                updateCnt: 3,
                drawCnt: 1,       // a 'plot' edit (again)
                matrixTraces: 2,
                selectBatch: [1],
                unselectBatch: [0, 2]
            });
        })
        .then(function() { return doubleClick(100, 100); })
        .then(function() {
            _assert('after dblclick clearing selection', {
                updateCnt: 0,
                drawCnt: 1,
                matrixTraces: 2,
                selectBatch: null,
                unselectBatch: []
            });
        })
        .then(function() { return Plotly.relayout(gd, 'dragmode', 'pan'); })
        .then(function() {
            _assert('under dragmode:pan with NO active selection', {
                updateCnt: 1,       // to clear off 1 matrixTrace
                drawCnt: 0,
                matrixTraces: 1,    // N.B. back to '1' here
                selectBatch: null,
                unselectBatch: []
            });
        })
        .catch(failTest)
        .then(done);
    });
});
