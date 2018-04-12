var Plotly = require('@lib');
var Lib = require('@src/lib');
var Plots = require('@src/plots/plots');
var SUBPLOT_PATTERN = require('@src/plots/cartesian/constants').SUBPLOT_PATTERN;

var d3 = require('d3');
var supplyAllDefaults = require('../assets/supply_defaults');
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

    it('should use special `grid.xside` and `grid.yside` defaults on splom generated grids', function() {
        var gridOut;

        _supply({
            dimensions: [
                {values: [1, 2, 3]},
                {values: [2, 1, 2]}
            ]
        });

        gridOut = gd._fullLayout.grid;
        expect(gridOut.xside).toBe('bottom');
        expect(gridOut.yside).toBe('left');

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

    it('when hasOnlyLargeSploms, should create correct regl-line2d data for grid', function(done) {
        var fig = Lib.extendDeep({}, require('@mocks/splom_large.json'));
        var cnt = 1;

        function _assert(dims) {
            var gridData = gd._fullLayout._splomGrid.lines;
            var gridLengths = gridData.map(function(d) { return d.positions.length; });
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

    it('should update properly in-and-out of hasOnlyLargeSploms regime', function(done) {
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
                    exp.innerSubplotNodeCnt(d, i) :
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

    it('should correctly move axis layers when relayouting *grid.(x|y)side*', function(done) {
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
});
