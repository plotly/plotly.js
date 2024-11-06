var Plotly = require('../../../lib/index');
var plotApi = require('../../../src/plot_api/plot_api');
var Plots = require('../../../src/plots/plots');
var Lib = require('../../../src/lib');
var Queue = require('../../../src/lib/queue');
var Scatter = require('../../../src/traces/scatter');
var Bar = require('../../../src/traces/bar');
var Legend = require('../../../src/components/legend');
var Axes = require('../../../src/plots/cartesian/axes');
var pkg = require('../../../package.json');
var subroutines = require('../../../src/plot_api/subroutines');
var manageArrays = require('../../../src/plot_api/manage_arrays');
var helpers = require('../../../src/plot_api/helpers');
var editTypes = require('../../../src/plot_api/edit_types');

var d3Select = require('../../strict-d3').select;
var d3SelectAll = require('../../strict-d3').selectAll;
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');

var negateIf = require('../assets/negate_if');
var checkTicks = require('../assets/custom_assertions').checkTicks;
var supplyAllDefaults = require('../assets/supply_defaults');

describe('Test plot api', function() {
    'use strict';

    describe('Plotly.version', function() {
        it('should be the same as in the package.json', function() {
            expect(Plotly.version).toEqual(pkg.version);
        });
    });

    describe('Plotly.newPlot', function() {
        var gd;

        beforeEach(function() {
            gd = createGraphDiv();
        });

        afterEach(destroyGraphDiv);

        it('accepts gd, data, layout, and config as args', function(done) {
            Plotly.newPlot(gd,
                [{x: [1, 2, 3], y: [1, 2, 3]}],
                {width: 500, height: 500},
                {editable: true}
            ).then(function() {
                expect(gd.layout.width).toEqual(500);
                expect(gd.layout.height).toEqual(500);
                expect(gd.data.length).toEqual(1);
                expect(gd._context.editable).toBe(true);
            })
            .then(done, done.fail);
        });

        it('accepts gd and an object as args', function(done) {
            Plotly.newPlot(gd, {
                data: [{x: [1, 2, 3], y: [1, 2, 3]}],
                layout: {width: 500, height: 500},
                config: {editable: true},
                frames: [{y: [2, 1, 0], name: 'frame1'}]
            }).then(function() {
                expect(gd.layout.width).toEqual(500);
                expect(gd.layout.height).toEqual(500);
                expect(gd.data.length).toEqual(1);
                expect(gd._transitionData._frames.length).toEqual(1);
                expect(gd._context.editable).toBe(true);
            })
            .then(done, done.fail);
        });

        it('allows adding more frames to the initial set', function(done) {
            Plotly.newPlot(gd, {
                data: [{x: [1, 2, 3], y: [1, 2, 3]}],
                layout: {width: 500, height: 500},
                config: {editable: true},
                frames: [{y: [7, 7, 7], name: 'frame1'}]
            }).then(function() {
                expect(gd.layout.width).toEqual(500);
                expect(gd.layout.height).toEqual(500);
                expect(gd.data.length).toEqual(1);
                expect(gd._transitionData._frames.length).toEqual(1);
                expect(gd._context.editable).toBe(true);

                return Plotly.addFrames(gd, [
                    {y: [8, 8, 8], name: 'frame2'},
                    {y: [9, 9, 9], name: 'frame3'}
                ]);
            }).then(function() {
                expect(gd._transitionData._frames.length).toEqual(3);
                expect(gd._transitionData._frames[0].name).toEqual('frame1');
                expect(gd._transitionData._frames[1].name).toEqual('frame2');
                expect(gd._transitionData._frames[2].name).toEqual('frame3');
            })
            .then(done, done.fail);
        });

        it('should emit afterplot event after plotting is done', function(done) {
            var afterPlot = false;

            var promise = Plotly.newPlot(gd, [{ y: [2, 1, 2]}]);

            gd.on('plotly_afterplot', function() {
                afterPlot = true;
            });

            promise.then(function() {
                expect(afterPlot).toBe(true);
            })
            .then(done, done.fail);
        });
    });

    describe('Plotly.relayout', function() {
        var gd;

        beforeEach(function() {
            gd = createGraphDiv();

            // some of these tests use the undo/redo queue
            // OK, this is weird... the undo/redo queue length is a global config only.
            // It's ignored on the plot, even though the queue itself is per-plot.
            // We may ditch this later, but probably not until v3
            Plotly.setPlotConfig({queueLength: 3});
        });

        afterEach(function() {
            destroyGraphDiv();
            Plotly.setPlotConfig({queueLength: 0});
        });

        it('should update the plot clipPath if the plot is resized', function(done) {
            Plotly.newPlot(gd, [{ x: [1, 2, 3], y: [1, 2, 3] }], { width: 500, height: 500 })
            .then(function() {
                return Plotly.relayout(gd, { width: 400, height: 400 });
            })
            .then(function() {
                var uid = gd._fullLayout._uid;

                var plotClip = document.getElementById('clip' + uid + 'xyplot');
                var clipRect = plotClip.children[0];
                var clipWidth = +clipRect.getAttribute('width');
                var clipHeight = +clipRect.getAttribute('height');

                expect(clipWidth).toBe(240);
                expect(clipHeight).toBe(220);
            })
            .then(done, done.fail);
        });

        it('sets null values to their default', function(done) {
            var defaultWidth;
            Plotly.newPlot(gd, [{ x: [1, 2, 3], y: [1, 2, 3] }])
            .then(function() {
                defaultWidth = gd._fullLayout.width;
                return Plotly.relayout(gd, { width: defaultWidth - 25});
            })
            .then(function() {
                expect(gd._fullLayout.width).toBe(defaultWidth - 25);
                return Plotly.relayout(gd, { width: null });
            })
            .then(function() {
                expect(gd._fullLayout.width).toBe(defaultWidth);
            })
            .then(done, done.fail);
        });

        it('ignores undefined values', function(done) {
            var defaultWidth;
            Plotly.newPlot(gd, [{ x: [1, 2, 3], y: [1, 2, 3] }])
            .then(function() {
                defaultWidth = gd._fullLayout.width;
                return Plotly.relayout(gd, { width: defaultWidth - 25});
            })
            .then(function() {
                expect(gd._fullLayout.width).toBe(defaultWidth - 25);
                return Plotly.relayout(gd, { width: undefined });
            })
            .then(function() {
                expect(gd._fullLayout.width).toBe(defaultWidth - 25);
            })
            .then(done, done.fail);
        });

        it('can set items in array objects', function(done) {
            Plotly.newPlot(gd, [{ x: [1, 2, 3], y: [1, 2, 3] }])
            .then(function() {
                return Plotly.relayout(gd, {rando: [1, 2, 3]});
            })
            .then(function() {
                expect(gd.layout.rando).toEqual([1, 2, 3]);
                return Plotly.relayout(gd, {'rando[1]': 45});
            })
            .then(function() {
                expect(gd.layout.rando).toEqual([1, 45, 3]);
            })
            .then(done, done.fail);
        });

        it('errors if child and parent are edited together', function(done) {
            var edit1 = {rando: [{a: 1}, {b: 2}]};
            var edit2 = {'rando[1]': {c: 3}};
            var edit3 = {'rando[1].d': 4};

            Plotly.newPlot(gd, [{ x: [1, 2, 3], y: [1, 2, 3] }])
            .then(function() {
                return Plotly.relayout(gd, edit1);
            })
            .then(function() {
                expect(gd.layout.rando).toEqual([{a: 1}, {b: 2}]);
                return Plotly.relayout(gd, edit2);
            })
            .then(function() {
                expect(gd.layout.rando).toEqual([{a: 1}, {c: 3}]);
                return Plotly.relayout(gd, edit3);
            })
            .then(function() {
                expect(gd.layout.rando).toEqual([{a: 1}, {c: 3, d: 4}]);

                // OK, setup is done - test the failing combinations
                [[edit1, edit2], [edit1, edit3], [edit2, edit3]].forEach(function(v) {
                    // combine properties in both orders - which results in the same object
                    // but the properties are iterated in opposite orders
                    expect(function() {
                        return Plotly.relayout(gd, Lib.extendFlat({}, v[0], v[1]));
                    }).toThrow();
                    expect(function() {
                        return Plotly.relayout(gd, Lib.extendFlat({}, v[1], v[0]));
                    }).toThrow();
                });
            })
            .then(done, done.fail);
        });

        it('can set empty text nodes', function(done) {
            var data = [{
                x: [1, 2, 3],
                y: [0, 0, 0],
                text: ['', 'Text', ''],
                mode: 'lines+text'
            }];
            var scatter = null;
            var oldHeight = 0;
            Plotly.newPlot(gd, data)
            .then(function() {
                scatter = document.getElementsByClassName('scatter')[0];
                oldHeight = scatter.getBoundingClientRect().height;
                return Plotly.relayout(gd, 'yaxis.range', [0.5, 0.5, 0.5]);
            })
            .then(function() {
                var newHeight = scatter.getBoundingClientRect().height;
                expect(newHeight).toEqual(oldHeight);
            })
            .then(done, done.fail);
        });

        it('should skip empty axis objects', function(done) {
            Plotly.newPlot(gd, [{
                x: [1, 2, 3],
                y: [1, 2, 1]
            }], {
                xaxis: { title: { text: 'x title' } },
                yaxis: { title: { text: 'y title' } }
            })
            .then(function() {
                return Plotly.relayout(gd, { zaxis: {} });
            })
            .then(done, done.fail);
        });

        it('annotations, shapes and images linked to category axes should update properly on zoom/pan', function(done) {
            var jsLogo = 'https://images.plot.ly/language-icons/api-home/js-logo.png';

            function getPos(sel) {
                var rect = sel.node().getBoundingClientRect();
                return [rect.left, rect.bottom];
            }

            function getAnnotationPos() {
                return getPos(d3Select('.annotation'));
            }

            function getShapePos() {
                return getPos(d3Select('.layer-above').select('.shapelayer').select('path'));
            }

            function getImagePos() {
                return getPos(d3Select('.layer-above').select('.imagelayer').select('image'));
            }

            Plotly.newPlot(gd, [{
                x: ['a', 'b', 'c'],
                y: [1, 2, 1]
            }], {
                xaxis: {range: [-1, 5]},
                annotations: [{
                    xref: 'x',
                    yref: 'y',
                    x: 'b',
                    y: 2
                }],
                shapes: [{
                    xref: 'x',
                    yref: 'y',
                    type: 'line',
                    x0: 'c',
                    x1: 'c',
                    y0: -1,
                    y1: 4
                }],
                images: [{
                    xref: 'x',
                    yref: 'y',
                    source: jsLogo,
                    x: 'a',
                    y: 1,
                    sizex: 0.2,
                    sizey: 0.2
                }]
            })
            .then(function() {
                expect(getAnnotationPos()).toBeCloseToArray([247.5, 210.1], -0.5);
                expect(getShapePos()).toBeCloseToArray([350, 369]);
                expect(getImagePos()).toBeCloseToArray([170, 272.52]);

                return Plotly.relayout(gd, 'xaxis.range', [0, 2]);
            })
            .then(function() {
                expect(getAnnotationPos()).toBeCloseToArray([337.5, 210.1], -0.5);
                expect(getShapePos()).toBeCloseToArray([620, 369]);
                expect(getImagePos()).toBeCloseToArray([80, 272.52]);

                return Plotly.relayout(gd, 'xaxis.range', [-1, 5]);
            })
            .then(function() {
                expect(getAnnotationPos()).toBeCloseToArray([247.5, 210.1], -0.5);
                expect(getShapePos()).toBeCloseToArray([350, 369]);
                expect(getImagePos()).toBeCloseToArray([170, 272.52]);
            })
            .then(done, done.fail);
        });

        it('clears autorange when you modify a range or part of a range', function(done) {
            var initialXRange;
            var initialYRange;

            Plotly.newPlot(gd, [{x: [1, 2], y: [1, 2]}])
            .then(function() {
                expect(gd.layout.xaxis.autorange).toBe(true);
                expect(gd.layout.yaxis.autorange).toBe(true);

                initialXRange = gd.layout.xaxis.range.slice();
                initialYRange = gd.layout.yaxis.range.slice();

                return Plotly.relayout(gd, {'xaxis.range': [0, 1], 'yaxis.range[1]': 3});
            })
            .then(function() {
                expect(gd.layout.xaxis.autorange).toBe(false);
                expect(gd.layout.xaxis.range).toEqual([0, 1]);
                expect(gd.layout.yaxis.autorange).toBe(false);
                expect(gd.layout.yaxis.range[1]).toBe(3);

                return Plotly.relayout(gd, {'xaxis.autorange': true, 'yaxis.autorange': true});
            })
            .then(function() {
                expect(gd.layout.xaxis.range).toEqual(initialXRange);
                expect(gd.layout.yaxis.range).toEqual(initialYRange);

                // finally, test that undoing autorange puts back the previous explicit range
                return Queue.undo(gd);
            })
            .then(function() {
                expect(gd.layout.xaxis.autorange).toBe(false);
                expect(gd.layout.xaxis.range).toEqual([0, 1]);
                expect(gd.layout.yaxis.autorange).toBe(false);
                expect(gd.layout.yaxis.range[1]).toBe(3);
            })
            .then(done, done.fail);
        });

        it('sets aspectmode to manual when you provide any aspectratio', function(done) {
            Plotly.newPlot(gd, [{x: [1, 2], y: [1, 2], z: [1, 2], type: 'scatter3d'}])
            .then(function() {
                expect(gd.layout.scene.aspectmode).toBe('auto');

                return Plotly.relayout(gd, {'scene.aspectratio.x': 2});
            })
            .then(function() {
                expect(gd.layout.scene.aspectmode).toBe('manual');

                return Queue.undo(gd);
            })
            .then(function() {
                expect(gd.layout.scene.aspectmode).toBe('auto');
            })
            .then(done, done.fail);
        });

        it('sets tickmode to linear when you edit tick0 or dtick', function(done) {
            Plotly.newPlot(gd, [{x: [1, 2], y: [1, 2]}])
            .then(function() {
                expect(gd.layout.xaxis.tickmode).toBeUndefined();
                expect(gd.layout.yaxis.tickmode).toBeUndefined();

                return Plotly.relayout(gd, {'xaxis.tick0': 0.23, 'yaxis.dtick': 0.34});
            })
            .then(function() {
                expect(gd.layout.xaxis.tickmode).toBe('linear');
                expect(gd.layout.yaxis.tickmode).toBe('linear');

                return Queue.undo(gd);
            })
            .then(function() {
                expect(gd.layout.xaxis.tickmode).toBeUndefined();
                expect(gd.layout.yaxis.tickmode).toBeUndefined();

                expect(gd.layout.xaxis.tick0).toBeUndefined();
                expect(gd.layout.yaxis.dtick).toBeUndefined();
            })
            .then(done, done.fail);
        });

        it('updates non-auto ranges for linear/log changes', function(done) {
            Plotly.newPlot(gd, [{x: [3, 5], y: [3, 5]}], {
                xaxis: {range: [1, 10]},
                yaxis: {type: 'log', range: [0, 1]}
            })
            .then(function() {
                return Plotly.relayout(gd, {'xaxis.type': 'log', 'yaxis.type': 'linear'});
            })
            .then(function() {
                expect(gd.layout.xaxis.range).toBeCloseToArray([0, 1], 5);
                expect(gd.layout.yaxis.range).toBeCloseToArray([1, 10], 5);

                return Queue.undo(gd);
            })
            .then(function() {
                expect(gd.layout.xaxis.range).toBeCloseToArray([1, 10], 5);
                expect(gd.layout.yaxis.range).toBeCloseToArray([0, 1], 5);
            })
            .then(done, done.fail);
        });

        it('respects reversed autorange when switching linear to log', function(done) {
            Plotly.newPlot(gd, [{x: [1, 2], y: [1, 2]}])
            .then(function() {
                // Ideally we should change this to xaxis.autorange: 'reversed'
                // but that's a weird disappearing setting used just to force
                // an initial reversed autorange. Proposed v3 change at:
                // https://github.com/plotly/plotly.js/issues/420#issuecomment-323435082
                return Plotly.relayout(gd, 'xaxis.reverse', true);
            })
            .then(function() {
                var xRange = gd.layout.xaxis.range;
                expect(xRange[1]).toBeLessThan(xRange[0]);
                expect(xRange[0]).toBeGreaterThan(1);

                return Plotly.relayout(gd, 'xaxis.type', 'log');
            })
            .then(function() {
                var xRange = gd.layout.xaxis.range;
                expect(xRange[1]).toBeLessThan(xRange[0]);
                // make sure it's a real loggy range
                expect(xRange[0]).toBeLessThan(1);
            })
            .then(done, done.fail);
        });

        it('autoranges automatically when switching to/from any other axis type than linear <-> log', function(done) {
            Plotly.newPlot(gd, [{x: ['1.5', '0.8'], y: [1, 2]}], {xaxis: {range: [0.6, 1.7]}})
            .then(function() {
                expect(gd.layout.xaxis.autorange).toBeUndefined();
                expect(gd._fullLayout.xaxis.type).toBe('linear');
                expect(gd.layout.xaxis.range).toEqual([0.6, 1.7]);

                return Plotly.relayout(gd, 'xaxis.type', 'category');
            })
            .then(function() {
                expect(gd.layout.xaxis.autorange).toBe(true);
                expect(gd._fullLayout.xaxis.type).toBe('category');
                expect(gd.layout.xaxis.range[0]).toBeLessThan(0);

                return Queue.undo(gd);
            })
            .then(function() {
                expect(gd.layout.xaxis.autorange).toBeUndefined();
                expect(gd._fullLayout.xaxis.type).toBe('linear');
                expect(gd.layout.xaxis.range).toEqual([0.6, 1.7]);
            })
            .then(done, done.fail);
        });

        it('updates autosize/width/height correctly', function(done) {
            function assertSizeAndThen(width, height, auto, msg, next) {
                return function() {
                    expect(gd._fullLayout.width).toBe(width, msg);
                    expect(gd._fullLayout.height).toBe(height, msg);
                    expect(gd._fullLayout.autosize).toBe(auto, msg);
                    if(!auto) {
                        expect(gd.layout.width).toBe(width, msg);
                        expect(gd.layout.height).toBe(height, msg);
                    }

                    if(next) return Plotly.relayout(gd, next);
                };
            }

            // give gd css sizing to be picked up by autosize
            gd.style.width = '543px';
            gd.style.height = '432px';

            Plotly.newPlot(gd, [{y: [1, 3, 2]}])
            .then(assertSizeAndThen(543, 432, true, 'initial',
                {autosize: false}))
            .then(assertSizeAndThen(543, 432, false, 'autosize false with no sizes',
                {autosize: true}))
            .then(assertSizeAndThen(543, 432, true, 'back to autosized',
                {width: 600}))
            .then(assertSizeAndThen(600, 432, false, 'explicit width causes explicit height',
                {width: null}))
            .then(assertSizeAndThen(543, 432, true, 'removed width',
                {height: 500, width: 700}))
            .then(assertSizeAndThen(700, 500, false, 'explicit height and width',
                {autosize: true}))
            .then(assertSizeAndThen(543, 432, true, 'final back to autosize'))
            .then(done, done.fail);
        });
    });

    describe('Plotly.relayout subroutines switchboard', function() {
        var mockedMethods = [
            'layoutReplot',
            'doLegend',
            'layoutStyles',
            'doTicksRelayout',
            'doModeBar',
            'doCamera',
            'doAutoRangeAndConstraints',
            'drawData',
            'finalDraw',
            'drawMarginPushers'
        ];

        var gd;

        beforeAll(function() {
            mockedMethods.forEach(function(m) {
                spyOn(subroutines, m);
            });
            spyOn(Axes, 'draw');
            spyOn(Plots, 'supplyDefaults').and.callThrough();
        });

        function mock(gd) {
            mockedMethods.forEach(function(m) {
                subroutines[m].calls.reset();
            });
            Axes.draw.calls.reset();

            supplyAllDefaults(gd);
            Plots.supplyDefaults.calls.reset();
            Plots.doCalcdata(gd);
            gd.emit = function() {};
            return gd;
        }

        function expectModeBarOnly(msg) {
            expect(gd.calcdata).toBeDefined(msg);
            expect(subroutines.doModeBar.calls.count()).toBeGreaterThan(0, msg);
            expect(subroutines.layoutReplot.calls.count()).toBe(0, msg);
        }

        function expectReplot(msg) {
            expect(gd.calcdata).toBeDefined(msg);
            expect(subroutines.doModeBar.calls.count()).toBe(0, msg);
            expect(subroutines.layoutReplot.calls.count()).toBeGreaterThan(0, msg);
        }

        it('should trigger replot (but not recalc) when switching into select or lasso dragmode for scattergl traces', function(done) {
            gd = mock({
                data: [{
                    type: 'scattergl',
                    x: [1, 2, 3],
                    y: [1, 2, 3]
                }],
                layout: {
                    dragmode: 'zoom'
                }
            });

            Plotly.relayout(gd, 'dragmode', 'pan')
            .then(function() {
                expectModeBarOnly('pan');

                return Plotly.relayout(mock(gd), 'dragmode', 'lasso');
            })
            .then(function() {
                expectReplot('lasso 1');

                return Plotly.relayout(mock(gd), 'dragmode', 'select');
            })
            .then(function() {
                expectModeBarOnly('select 1');

                return Plotly.relayout(mock(gd), 'dragmode', 'lasso');
            })
            .then(function() {
                expectModeBarOnly('lasso 2');

                return Plotly.relayout(mock(gd), 'dragmode', 'zoom');
            })
            .then(function() {
                expectModeBarOnly('zoom');

                return Plotly.relayout(mock(gd), 'dragmode', 'select');
            })
            .then(function() {
                expectReplot('select 2');
            })
            .then(done, done.fail);
        });

        it('should trigger replot (but not recalc) when changing attributes that affect axis length/range', function() {
            // but axis.autorange itself is NOT here, because setting it from false to true requires an
            // autorange so that we calculate _min and _max, which we ignore if autorange is off.
            var axLayoutEdits = {
                'xaxis.rangemode': 'tozero',
                'xaxis.domain': [0.2, 0.8],
                'xaxis.domain[1]': 0.7,
                'yaxis.domain': [0.1, 0.9],
                'yaxis.domain[0]': 0.3,
                'yaxis.overlaying': 'y2',
                'margin.l': 50,
                'margin.r': 20,
                'margin.t': 1,
                'margin.b': 5,
                'margin.autoexpand': false,
                height: 567,
                width: 432,
                'grid.rows': 2,
                'grid.columns': 3,
                'grid.xgap': 0.5,
                'grid.ygap': 0,
                'grid.roworder': 'bottom to top',
                'grid.pattern': 'independent',
                'grid.yaxes': ['y2', 'y'],
                'grid.xaxes[0]': 'x2',
                'grid.domain': {x: [0, 0.4], y: [0.6, 1]},
                'grid.domain.x': [0.01, 0.99],
                'grid.domain.y[0]': 0.33,
                'grid.subplots': [['', 'xy'], ['x2y2', '']],
                'grid.subplots[1][1]': 'xy'
            };

            var attr;
            var checkAttr = expectReplot(attr);
            for(attr in axLayoutEdits) {
                gd = mock({
                    data: [{y: [1, 2]}, {y: [4, 3], xaxis: 'x2', yaxis: 'y2'}],
                    layout: {
                        xaxis2: {domain: [0.6, 0.9]},
                        yaxis2: {domain: [0.6, 0.9]}
                    }
                });

                Plotly.relayout(gd, attr, axLayoutEdits[attr])
                .then(checkAttr);
            }
        });

        it('should trigger minimal sequence for cartesian axis range updates', function() {
            var seq = ['doAutoRangeAndConstraints', 'drawData', 'finalDraw'];

            function _assert(msg) {
                expect(gd.calcdata).toBeDefined();
                mockedMethods.forEach(function(m) {
                    expect(subroutines[m].calls.count()).toBe(
                        seq.indexOf(m) === -1 ? 0 : 1,
                        '# of ' + m + ' calls - ' + msg
                    );
                });
                expect(Axes.draw).toHaveBeenCalledTimes(1);
                expect(Axes.draw.calls.allArgs()[0][1]).toEqual(['x']);
                expect(Axes.draw.calls.allArgs()[0][2]).toEqual({skipTitle: true}, 'skip-axis-title argument');
                expect(Plots.supplyDefaults).not.toHaveBeenCalled();
            }

            var specs = [
                ['relayout', ['xaxis.range[0]', 0]],
                ['relayout', ['xaxis.range[1]', 3]],
                ['relayout', ['xaxis.range', [-1, 5]]],
                ['update', [{}, {'xaxis.range': [-1, 10]}]],

                ['relayout', ['xaxis.autorange', true]],
                ['update', [{}, {'xaxis.autorange': true}]]
            ];

            specs.forEach(function(s) {
                gd = mock({
                    data: [{y: [1, 2, 1]}],
                    layout: {
                        xaxis: {range: [1, 2]}
                    }
                });

                Plotly[s[0]](gd, s[1][0], s[1][1]);

                _assert([
                    'Plotly.', s[0],
                    '(gd, ', JSON.stringify(s[1][0]), ', ', JSON.stringify(s[1][1]), ')'
                ].join(''));
            });
        });

        it('should trigger calc on axis range updates when constraints are present', function(done) {
            gd = mock({
                data: [{
                    y: [1, 2, 1]
                }],
                layout: {
                    xaxis: {constrain: 'domain'},
                    yaxis: {scaleanchor: 'x'}
                }
            });

            Plotly.relayout(gd, 'xaxis.range[0]', 0)
            .then(function() {
                expect(gd.calcdata).toBeUndefined();
            })
            .then(done, done.fail);
        });
    });

    describe('Plotly.restyle subroutines switchboard', function() {
        beforeEach(function() {
            spyOn(plotApi, '_doPlot');
            spyOn(Plots, 'previousPromises');
            spyOn(Scatter, 'arraysToCalcdata');
            spyOn(Bar, 'arraysToCalcdata');
            spyOn(Plots, 'style');
            spyOn(Legend, 'draw');
        });

        function mockDefaultsAndCalc(gd) {
            supplyAllDefaults(gd);
            gd.calcdata = gd._fullData.map(function(trace) {
                return [{x: 1, y: 1, trace: trace}];
            });
            gd.emit = function() {};
        }

        it('calls Scatter.arraysToCalcdata and Plots.style on scatter styling', function(done) {
            var gd = {
                data: [{x: [1, 2, 3], y: [1, 2, 3]}],
                layout: {}
            };
            mockDefaultsAndCalc(gd);
            Plotly.restyle(gd, {'marker.color': 'red'})
            .then(function() {
                expect(Scatter.arraysToCalcdata).toHaveBeenCalled();
                expect(Bar.arraysToCalcdata).not.toHaveBeenCalled();
                expect(Plots.style).toHaveBeenCalled();
                expect(plotApi._doPlot).not.toHaveBeenCalled();
                // "docalc" deletes gd.calcdata - make sure this didn't happen
                expect(gd.calcdata).toBeDefined();
            })
            .then(done, done.fail);
        });

        it('calls Bar.arraysToCalcdata and Plots.style on bar styling', function(done) {
            var gd = {
                data: [{x: [1, 2, 3], y: [1, 2, 3], type: 'bar'}],
                layout: {}
            };
            mockDefaultsAndCalc(gd);
            Plotly.restyle(gd, {'marker.color': 'red'})
            .then(function() {
                expect(Scatter.arraysToCalcdata).not.toHaveBeenCalled();
                expect(Bar.arraysToCalcdata).toHaveBeenCalled();
                expect(Plots.style).toHaveBeenCalled();
                expect(plotApi._doPlot).not.toHaveBeenCalled();
                expect(gd.calcdata).toBeDefined();
            })
            .then(done, done.fail);
        });

        it('should do full replot when arrayOk attributes are updated', function(done) {
            var gd = {
                data: [{x: [1, 2, 3], y: [1, 2, 3]}],
                layout: {}
            };

            mockDefaultsAndCalc(gd);
            Plotly.restyle(gd, 'marker.color', [['red', 'green', 'blue']])
            .then(function() {
                expect(gd.calcdata).toBeUndefined();
                expect(plotApi._doPlot).toHaveBeenCalled();

                mockDefaultsAndCalc(gd);
                plotApi._doPlot.calls.reset();
                return Plotly.restyle(gd, 'marker.color', 'yellow');
            })
            .then(function() {
                expect(gd.calcdata).toBeUndefined();
                expect(plotApi._doPlot).toHaveBeenCalled();

                mockDefaultsAndCalc(gd);
                plotApi._doPlot.calls.reset();
                return Plotly.restyle(gd, 'marker.color', 'blue');
            })
            .then(function() {
                expect(gd.calcdata).toBeDefined();
                expect(plotApi._doPlot).not.toHaveBeenCalled();

                mockDefaultsAndCalc(gd);
                plotApi._doPlot.calls.reset();
                return Plotly.restyle(gd, 'marker.color', [['red', 'blue', 'green']]);
            })
            .then(function() {
                expect(gd.calcdata).toBeUndefined();
                expect(plotApi._doPlot).toHaveBeenCalled();
            })
            .then(done, done.fail);
        });

        it('should do full replot when arrayOk base attributes are updated', function(done) {
            var gd = {
                data: [{x: [1, 2, 3], y: [1, 2, 3]}],
                layout: {}
            };

            mockDefaultsAndCalc(gd);
            Plotly.restyle(gd, 'hoverlabel.bgcolor', [['red', 'green', 'blue']])
            .then(function() {
                expect(gd.calcdata).toBeUndefined();
                expect(plotApi._doPlot).toHaveBeenCalled();

                mockDefaultsAndCalc(gd);
                plotApi._doPlot.calls.reset();
                return Plotly.restyle(gd, 'hoverlabel.bgcolor', 'yellow');
            })
            .then(function() {
                expect(gd.calcdata).toBeUndefined();
                expect(plotApi._doPlot).toHaveBeenCalled();

                mockDefaultsAndCalc(gd);
                plotApi._doPlot.calls.reset();
                return Plotly.restyle(gd, 'hoverlabel.bgcolor', 'blue');
            })
            .then(function() {
                expect(gd.calcdata).toBeDefined();
                expect(plotApi._doPlot).not.toHaveBeenCalled();

                mockDefaultsAndCalc(gd);
                plotApi._doPlot.calls.reset();
                return Plotly.restyle(gd, 'hoverlabel.bgcolor', [['red', 'blue', 'green']]);
            })
            .then(function() {
                expect(gd.calcdata).toBeUndefined();
                expect(plotApi._doPlot).toHaveBeenCalled();
            })
            .then(done, done.fail);
        });

        it('should do full replot when attribute container are updated', function(done) {
            var gd = {
                data: [{x: [1, 2, 3], y: [1, 2, 3]}],
                layout: {
                    xaxis: { range: [0, 4] },
                    yaxis: { range: [0, 4] }
                }
            };

            mockDefaultsAndCalc(gd);
            Plotly.restyle(gd, {
                marker: {
                    color: ['red', 'blue', 'green']
                }
            })
            .then(function() {
                expect(gd.calcdata).toBeUndefined();
                expect(plotApi._doPlot).toHaveBeenCalled();
            })
            .then(done, done.fail);
        });

        it('calls plot on xgap and ygap styling', function(done) {
            var gd = {
                data: [{z: [[1, 2, 3], [4, 5, 6], [7, 8, 9]], showscale: false, type: 'heatmap'}],
                layout: {}
            };

            mockDefaultsAndCalc(gd);
            Plotly.restyle(gd, {xgap: 2})
            .then(function() {
                expect(plotApi._doPlot).toHaveBeenCalled();

                return Plotly.restyle(gd, {ygap: 2});
            })
            .then(function() {
                expect(plotApi._doPlot.calls.count()).toEqual(2);
            })
            .then(done, done.fail);
        });

        [
            {
                data: [{
                    type: 'contour',
                    z: [[1, 2, 3], [1, 2, 1]]
                }]
            },
            {
                data: [{
                    type: 'histogram2dcontour',
                    x: [1, 1, 2, 2, 2, 3],
                    y: [0, 0, 0, 0, 1, 3]
                }]
            }
        ].forEach(function(gd) {
            it('should clear calcdata when restyling \'zmin\' and \'zmax\' on ' + gd.data.type + ' traces', function(done) {
                mockDefaultsAndCalc(gd);
                plotApi._doPlot.calls.reset();
                Plotly.restyle(gd, 'zmin', 0)
                .then(function() {
                    expect(gd.calcdata).toBeUndefined();
                    expect(plotApi._doPlot).toHaveBeenCalled();

                    mockDefaultsAndCalc(gd);
                    plotApi._doPlot.calls.reset();
                    return Plotly.restyle(gd, 'zmax', 10);
                })
                .then(function() {
                    expect(gd.calcdata).toBeUndefined();
                    expect(plotApi._doPlot).toHaveBeenCalled();
                })
                .then(done, done.fail);
            });
        });

        [
            {
                data: [{
                    type: 'heatmap',
                    z: [[1, 2, 3], [1, 2, 1]]
                }]
            },
            {
                data: [{
                    type: 'histogram2d',
                    x: [1, 1, 2, 2, 2, 3],
                    y: [0, 0, 0, 0, 1, 3]
                }]
            }
        ].forEach(function(gd) {
            it('should not clear calcdata when restyling \'zmin\' and \'zmax\' on ' + gd.data.type + ' traces', function(done) {
                mockDefaultsAndCalc(gd);
                plotApi._doPlot.calls.reset();
                Plotly.restyle(gd, 'zmin', 0)
                .then(function() {
                    expect(gd.calcdata).toBeDefined();
                    expect(plotApi._doPlot).toHaveBeenCalled();

                    mockDefaultsAndCalc(gd);
                    plotApi._doPlot.calls.reset();
                    return Plotly.restyle(gd, 'zmax', 10);
                })
                .then(function() {
                    expect(gd.calcdata).toBeDefined();
                    expect(plotApi._doPlot).toHaveBeenCalled();

                    mockDefaultsAndCalc(gd);
                    plotApi._doPlot.calls.reset();
                    return Plotly.restyle(gd, 'zmin', 0);
                })
                .then(done, done.fail);
            });
        });

        it('ignores undefined values', function(done) {
            var gd = {
                data: [{x: [1, 2, 3], y: [1, 2, 3], type: 'scatter'}],
                layout: {}
            };

            mockDefaultsAndCalc(gd);

            // Check to see that the color is updated:
            Plotly.restyle(gd, {'marker.color': 'blue'})
            .then(function() {
                expect(gd._fullData[0].marker.color).toBe('blue');

                // Check to see that the color is unaffected:
                return Plotly.restyle(gd, {'marker.color': undefined});
            })
            .then(function() {
                expect(gd._fullData[0].marker.color).toBe('blue');
            })
            .then(done, done.fail);
        });

        it('ignores invalid trace indices', function(done) {
            var gd = {
                data: [{x: [1, 2, 3], y: [1, 2, 3], type: 'scatter'}],
                layout: {}
            };

            mockDefaultsAndCalc(gd);

            // Call restyle on an invalid trace indice
            Plotly.restyle(gd, {type: 'scatter', 'marker.color': 'red'}, [1])
            .then(done, done.fail);
        });

        it('restores null values to defaults', function(done) {
            var gd = {
                data: [{x: [1, 2, 3], y: [1, 2, 3], type: 'scatter'}],
                layout: {}
            };

            mockDefaultsAndCalc(gd);
            var colorDflt = gd._fullData[0].marker.color;

            // Check to see that the color is updated:
            Plotly.restyle(gd, {'marker.color': 'blue'})
            .then(function() {
                expect(gd._fullData[0].marker.color).toBe('blue');

                // Check to see that the color is restored to the original default:
                return Plotly.restyle(gd, {'marker.color': null});
            })
            .then(function() {
                expect(gd._fullData[0].marker.color).toBe(colorDflt);
            })
            .then(done, done.fail);
        });

        it('can target specific traces by leaving properties undefined', function(done) {
            var gd = {
                data: [
                    {x: [1, 2, 3], y: [1, 2, 3], type: 'scatter'},
                    {x: [1, 2, 3], y: [3, 4, 5], type: 'scatter'}
                ],
                layout: {}
            };

            mockDefaultsAndCalc(gd);
            var colorDflt = [gd._fullData[0].marker.color, gd._fullData[1].marker.color];

            // Check only second trace's color has been changed:
            Plotly.restyle(gd, {'marker.color': [undefined, 'green']})
            .then(function() {
                expect(gd._fullData[0].marker.color).toBe(colorDflt[0]);
                expect(gd._fullData[1].marker.color).toBe('green');

                // Check both colors restored to the original default:
                return Plotly.restyle(gd, {'marker.color': [null, null]});
            })
            .then(function() {
                expect(gd._fullData[0].marker.color).toBe(colorDflt[0]);
                expect(gd._fullData[1].marker.color).toBe(colorDflt[1]);
            })
            .then(done, done.fail);
        });
    });

    describe('Plotly.restyle unmocked', function() {
        var gd;

        beforeEach(function() {
            gd = createGraphDiv();

            // some of these tests use the undo/redo queue
            // OK, this is weird... the undo/redo queue length is a global config only.
            // It's ignored on the plot, even though the queue itself is per-plot.
            // We may ditch this later, but probably not until v3
            Plotly.setPlotConfig({queueLength: 3});
        });

        afterEach(function() {
            destroyGraphDiv();
            Plotly.setPlotConfig({queueLength: 0});
        });

        it('should redo auto z/contour when editing z array', function(done) {
            Plotly.newPlot(gd, [{type: 'contour', z: [[1, 2], [3, 4]]}]).then(function() {
                expect(gd._fullData[0].zauto).toBe(true);
                expect(gd._fullData[0].zmin).toBe(1);
                expect(gd._fullData[0].zmax).toBe(4);
                expect(gd.data[0].autocontour).toBe(true);
                expect(gd.data[0].contours).toEqual({start: 1.5, end: 3.5, size: 0.5});

                return Plotly.restyle(gd, {'z[0][0]': 10});
            }).then(function() {
                expect(gd._fullData[0].zauto).toBe(true);
                expect(gd._fullData[0].zmin).toBe(2);
                expect(gd._fullData[0].zmax).toBe(10);
                expect(gd.data[0].contours).toEqual({start: 3, end: 9, size: 1});
            })
            .then(done, done.fail);
        });

        it('errors if child and parent are edited together', function(done) {
            var edit1 = {rando: [[{a: 1}, {b: 2}]]};
            var edit2 = {'rando[1]': {c: 3}};
            var edit3 = {'rando[1].d': 4};

            Plotly.newPlot(gd, [{x: [1, 2, 3], y: [1, 2, 3], type: 'scatter'}])
            .then(function() {
                return Plotly.restyle(gd, edit1);
            })
            .then(function() {
                expect(gd.data[0].rando).toEqual([{a: 1}, {b: 2}]);
                return Plotly.restyle(gd, edit2);
            })
            .then(function() {
                expect(gd.data[0].rando).toEqual([{a: 1}, {c: 3}]);
                return Plotly.restyle(gd, edit3);
            })
            .then(function() {
                expect(gd.data[0].rando).toEqual([{a: 1}, {c: 3, d: 4}]);

                // OK, setup is done - test the failing combinations
                [[edit1, edit2], [edit1, edit3], [edit2, edit3]].forEach(function(v) {
                    // combine properties in both orders - which results in the same object
                    // but the properties are iterated in opposite orders
                    expect(function() {
                        return Plotly.restyle(gd, Lib.extendFlat({}, v[0], v[1]));
                    }).toThrow();
                    expect(function() {
                        return Plotly.restyle(gd, Lib.extendFlat({}, v[1], v[0]));
                    }).toThrow();
                });
            })
            .then(done, done.fail);
        });

        it('turns off zauto when you edit zmin or zmax', function(done) {
            var zmin0 = 2;
            var zmax1 = 10;

            function check(auto, msg) {
                negateIf(auto, expect(gd._fullData[0].zmin)).toBe(zmin0, msg);
                expect(gd._fullData[0].zauto).toBe(auto, msg);
                negateIf(auto, expect(gd._fullData[1].zmax)).toBe(zmax1, msg);
                expect(gd._fullData[1].zauto).toBe(auto, msg);
            }

            Plotly.newPlot(gd, [
                {z: [[1, 2], [3, 4]], type: 'heatmap'},
                {x: [2, 3], z: [[5, 6], [7, 8]], type: 'contour'}
            ])
            .then(function() {
                check(true, 'initial');
                return Plotly.restyle(gd, 'zmin', zmin0, [0]);
            })
            .then(function() {
                return Plotly.restyle(gd, 'zmax', zmax1, [1]);
            })
            .then(function() {
                check(false, 'set min/max');
                return Plotly.restyle(gd, 'zauto', true);
            })
            .then(function() {
                check(true, 'reset');
                return Queue.undo(gd);
            })
            .then(function() {
                check(false, 'undo');
            })
            .then(done, done.fail);
        });

        it('turns off cauto (autocolorscale) when you edit cmin or cmax (colorscale)', function(done) {
            var scales = require('../../../src/components/colorscale/scales').scales;

            var autocscale = scales.Reds;
            var mcscl0 = 'Rainbow';
            var mlcscl1 = 'Greens';
            var mcmin0 = 3;
            var mlcmax1 = 6;

            function check(auto, autocolorscale, msg) {
                expect(gd._fullData[0].marker.cauto).toBe(auto, msg);
                negateIf(auto, expect(gd._fullData[0].marker.cmin)).toBe(mcmin0);
                expect(gd._fullData[0].marker.autocolorscale).toBe(autocolorscale, msg);
                expect(gd._fullData[0].marker.colorscale).toEqual(auto ? autocscale : scales[mcscl0]);

                expect(gd._fullData[1].marker.line.cauto).toBe(auto, msg);
                negateIf(auto, expect(gd._fullData[1].marker.line.cmax)).toBe(mlcmax1);
                expect(gd._fullData[1].marker.line.autocolorscale).toBe(autocolorscale, msg);
                expect(gd._fullData[1].marker.line.colorscale).toEqual(auto ? autocscale : scales[mlcscl1]);
            }

            Plotly.newPlot(gd, [
                {y: [1, 2], mode: 'markers', marker: {color: [1, 10]}},
                {y: [2, 1], mode: 'markers', marker: {line: {width: 2, color: [3, 4]}}}
            ])
            .then(function() {
                check(true, true, 'initial');
                return Plotly.restyle(gd, {'marker.cmin': mcmin0, 'marker.colorscale': mcscl0}, null, [0]);
            })
            .then(function() {
                return Plotly.restyle(gd, {'marker.line.cmax': mlcmax1, 'marker.line.colorscale': mlcscl1}, null, [1]);
            })
            .then(function() {
                check(false, false, 'set min/max/scale');
                return Plotly.restyle(gd, {'marker.cauto': true, 'marker.autocolorscale': true}, null, [0]);
            })
            .then(function() {
                return Plotly.restyle(gd, {'marker.line.cauto': true, 'marker.line.autocolorscale': true}, null, [1]);
            })
            .then(function() {
                check(true, true, 'reset');
                return Queue.undo(gd);
            })
            .then(function() {
                return Queue.undo(gd);
            })
            .then(function() {
                check(false, false, 'undo');
            })
            .then(done, done.fail);
        });

        it('turns on cauto when cmid is edited', function(done) {
            function _assert(msg, exp) {
                return function() {
                    var mk = gd._fullData[0].marker;
                    for(var k in exp) {
                        expect(mk[k]).toBe(exp[k], [msg, k].join(' - '));
                    }
                };
            }

            function _restyle(arg) {
                return function() { return Plotly.restyle(gd, arg); };
            }

            Plotly.newPlot(gd, [{
                mode: 'markers',
                y: [1, 2, 1],
                marker: { color: [1, -1, 4] }
            }])
            .then(_assert('base', {
                cauto: true,
                cmid: undefined,
                cmin: -1,
                cmax: 4
            }))
            .then(_restyle({'marker.cmid': 0}))
            .then(_assert('set cmid=0', {
                cauto: true,
                cmid: 0,
                cmin: -4,
                cmax: 4
            }))
            .then(_restyle({'marker.cmid': -2}))
            .then(_assert('set cmid=-2', {
                cauto: true,
                cmid: -2,
                cmin: -8,
                cmax: 4
            }))
            .then(_restyle({'marker.cmid': 2}))
            .then(_assert('set cmid=2', {
                cauto: true,
                cmid: 2,
                cmin: -1,
                cmax: 5
            }))
            .then(_restyle({'marker.cmin': 0}))
            .then(_assert('set cmin=0', {
                cauto: false,
                cmid: undefined,
                cmin: 0,
                cmax: 5
            }))
            .then(_restyle({'marker.cmax': 10}))
            .then(_assert('set cmin=0 + cmax=10', {
                cauto: false,
                cmid: undefined,
                cmin: 0,
                cmax: 10
            }))
            .then(_restyle({'marker.cauto': true, 'marker.cmid': null}))
            .then(_assert('back to cauto=true', {
                cauto: true,
                cmid: undefined,
                cmin: -1,
                cmax: 4
            }))
            .then(done, done.fail);
        });

        it('turns off autobin when you edit bin specs', function(done) {
            // test retained (modified) for backward compat with new autobin logic
            var start0 = 0.2;
            var end1 = 6;
            var size1 = 0.5;

            function check(auto, msg) {
                expect(gd.data[0].autobinx).toBeUndefined(msg);
                expect(gd.data[1].autobinx).toBeUndefined(msg);
                expect(gd.data[1].autobiny).toBeUndefined(msg);

                if(auto) {
                    expect(gd.data[0].xbins).toBeUndefined(msg);
                    expect(gd.data[1].xbins).toBeUndefined(msg);
                    expect(gd.data[1].ybins).toBeUndefined(msg);
                } else {
                    // we can have - and use - partial autobin now
                    expect(gd.data[0].xbins).toEqual({start: start0});
                    expect(gd.data[1].xbins).toEqual({end: end1});
                    expect(gd.data[1].ybins).toEqual({size: size1});
                    expect(gd._fullData[0].xbins.start).toBe(start0, msg);
                    expect(gd._fullData[1].xbins.end).toBe(end1, msg);
                    expect(gd._fullData[1].ybins.size).toBe(size1, msg);
                }
            }

            Plotly.newPlot(gd, [
                {x: [1, 1, 1, 1, 2, 2, 2, 3, 3, 4], type: 'histogram'},
                {x: [1, 1, 2, 2, 3, 3, 4, 4], y: [1, 1, 2, 2, 3, 3, 4, 4], type: 'histogram2d'}
            ])
            .then(function() {
                check(true, 'initial');
            })
            .then(function() { return Plotly.restyle(gd, 'xbins.start', start0, [0]); })
            .then(function() { return Plotly.restyle(gd, {'xbins.end': end1, 'ybins.size': size1}, null, [1]); })
            .then(function() {
                check(false, 'set start/end/size');
            })
            .then(function() { return Plotly.restyle(gd, {autobinx: true, autobiny: true}); })
            .then(function() {
                check(true, 'reset');
            })
            .then(function() { return Queue.undo(gd); })
            .then(function() {
                check(false, 'undo');
            })
            .then(done, done.fail);
        });

        it('turns off autocontour when you edit contour specs', function(done) {
            var start0 = 1.7;
            var size1 = 0.6;

            function check(auto, msg) {
                expect(gd.data[0].autocontour).toBe(auto, msg);
                expect(gd.data[1].autocontour).toBe(auto, msg);
                negateIf(auto, expect(gd.data[0].contours.start)).toBe(start0, msg);
                negateIf(auto, expect(gd.data[1].contours.size)).toBe(size1, msg);
            }

            Plotly.newPlot(gd, [
                {z: [[1, 2], [3, 4]], type: 'contour'},
                {x: [1, 2, 3, 4], y: [3, 4, 5, 6], type: 'histogram2dcontour'}
            ])
            .then(function() {
                check(true, 'initial');
                return Plotly.restyle(gd, 'contours.start', start0, [0]);
            })
            .then(function() {
                return Plotly.restyle(gd, 'contours.size', size1, [1]);
            })
            .then(function() {
                check(false, 'set start/size');
                return Plotly.restyle(gd, 'autocontour', true);
            })
            .then(function() {
                check(true, 'reset');
                return Queue.undo(gd);
            })
            .then(function() {
                check(false, 'undo');
            })
            .then(done, done.fail);
        });

        function checkScaling(xyType, xyTypeIn, iIn, iOut) {
            expect(gd._fullData[iOut].xtype).toBe(xyType);
            expect(gd._fullData[iOut].ytype).toBe(xyType);
            expect(gd.data[iIn].xtype).toBe(xyTypeIn);
            expect(gd.data[iIn].ytype).toBe(xyTypeIn);
        }

        it('sets heatmap xtype/ytype when you edit x/y data or scaling params', function(done) {
            Plotly.newPlot(gd, [{type: 'heatmap', z: [[0, 1], [2, 3]]}])
            .then(function() {
                // TODO would probably be better to actively default to 'array' here...
                checkScaling(undefined, undefined, 0, 0);
                return Plotly.restyle(gd, {x: [[2, 4]], y: [[3, 5]]}, [0]);
            })
            .then(function() {
                checkScaling('array', 'array', 0, 0);
                return Plotly.restyle(gd, {x0: 1, dy: 3}, [0]);
            })
            .then(function() {
                checkScaling('scaled', 'scaled', 0, 0);
            })
            .then(done, done.fail);
        });

        it('sets colorbar.tickmode to linear when editing colorbar.tick0/dtick', function(done) {
            // note: this *should* apply to marker.colorbar etc too but currently that's not implemented
            // once we get this all in the schema it will work though.
            var tick00 = 0.33;
            var dtick1 = 0.8;

            function check(auto, msg) {
                negateIf(auto, expect(gd._fullData[0].colorbar.tick0)).toBe(tick00, msg);
                expect(gd._fullData[0].colorbar.tickmode).toBe(auto ? 'auto' : 'linear', msg);
                negateIf(auto, expect(gd._fullData[1].colorbar.dtick)).toBe(dtick1, msg);
                expect(gd._fullData[1].colorbar.tickmode).toBe(auto ? 'auto' : 'linear', msg);
            }

            Plotly.newPlot(gd, [
                {z: [[1, 2], [3, 4]], type: 'heatmap'},
                {x: [2, 3], z: [[1, 2], [3, 4]], type: 'heatmap'}
            ])
            .then(function() {
                check(true, 'initial');
                return Plotly.restyle(gd, 'colorbar.tick0', tick00, [0]);
            })
            .then(function() {
                return Plotly.restyle(gd, 'colorbar.dtick', dtick1, [1]);
            })
            .then(function() {
                check(false, 'change tick0, dtick');
                return Plotly.restyle(gd, 'colorbar.tickmode', 'auto');
            })
            .then(function() {
                check(true, 'reset');
                return Queue.undo(gd);
            })
            .then(function() {
                check(false, 'undo');
            })
            .then(done, done.fail);
        });

        it('updates colorbars when editing bar charts', function(done) {
            var mock = require('../../image/mocks/bar-colorscale-colorbar.json');

            Plotly.newPlot(gd, mock.data, mock.layout)
            .then(function() {
                expect(d3Select('.cbaxis text').node().style.fill).not.toBe('rgb(255, 0, 0)');

                return Plotly.restyle(gd, {'marker.colorbar.tickfont.color': 'rgb(255, 0, 0)'});
            })
            .then(function() {
                expect(d3Select('.cbaxis text').node().style.fill).toBe('rgb(255, 0, 0)');

                return Plotly.restyle(gd, {'marker.showscale': false});
            })
            .then(function() {
                expect(d3Select('.cbaxis').size()).toBe(0);
            })
            .then(done, done.fail);
        });

        it('updates colorbars when editing gl3d plots', function(done) {
            Plotly.newPlot(gd, [{z: [[1, 2], [3, 6]], type: 'surface'}])
            .then(function() {
                expect(d3Select('.cbaxis text').node().style.fill).not.toBe('rgb(255, 0, 0)');

                return Plotly.restyle(gd, {'colorbar.tickfont.color': 'rgb(255, 0, 0)'});
            })
            .then(function() {
                expect(d3Select('.cbaxis text').node().style.fill).toBe('rgb(255, 0, 0)');

                return Plotly.restyle(gd, {showscale: false});
            })
            .then(function() {
                expect(d3Select('.cbaxis').size()).toBe(0);
            })
            .then(done, done.fail);
        });

        it('updates box position and axis type when it falls back to name', function(done) {
            Plotly.newPlot(gd, [{name: 'A', y: [1, 2, 3, 4, 5], type: 'box'}],
                {width: 400, height: 400, xaxis: {nticks: 3}}
            )
            .then(function() {
                checkTicks('x', ['A'], 'initial');
                expect(gd._fullLayout.xaxis.type).toBe('category');

                return Plotly.restyle(gd, {name: 'B'});
            })
            .then(function() {
                checkTicks('x', ['B'], 'changed category');
                expect(gd._fullLayout.xaxis.type).toBe('category');

                return Plotly.restyle(gd, {x0: 12.3});
            })
            .then(function() {
                checkTicks('x', ['12', '12.5'], 'switched to numeric');
                expect(gd._fullLayout.xaxis.type).toBe('linear');
            })
            .then(done, done.fail);
        });

        it('updates scene axis types automatically', function(done) {
            Plotly.newPlot(gd, [{x: [1, 2], y: [1, 2], z: [1, 2], type: 'scatter3d'}])
            .then(function() {
                expect(gd._fullLayout.scene.xaxis.type).toBe('linear');

                return Plotly.restyle(gd, {z: [['a', 'b']]});
            })
            .then(function() {
                expect(gd._fullLayout.scene.zaxis.type).toBe('category');
            })
            .then(done, done.fail);
        });

        it('can drop Cartesian while constraints are active', function(done) {
            Plotly.newPlot(gd, [{x: [1, 2, 3], y: [1, 3, 2], z: [2, 3, 1]}], {xaxis: {scaleanchor: 'y'}})
            .then(function() {
                expect(gd._fullLayout._axisConstraintGroups).toBeDefined();
                expect(gd._fullLayout.scene !== undefined).toBe(false);
                return Plotly.restyle(gd, {type: 'scatter3d'});
            })
            .then(function() {
                expect(gd._fullLayout._axisConstraintGroups).toBeUndefined();
                expect(gd._fullLayout.scene !== undefined).toBe(true);
            })
            .then(done, done.fail);
        });
    });

    describe('Plotly.deleteTraces', function() {
        var gd;

        beforeEach(function() {
            gd = {
                data: [
                    {name: 'a'},
                    {name: 'b'},
                    {name: 'c'},
                    {name: 'd'}
                ]
            };
            spyOn(plotApi, 'redraw');
        });

        it('should throw an error when indices are omitted', function() {
            expect(function() {
                Plotly.deleteTraces(gd);
            }).toThrow(new Error('indices must be an integer or array of integers.'));
        });

        it('should throw an error when indices are out of bounds', function() {
            expect(function() {
                Plotly.deleteTraces(gd, 10);
            }).toThrow(new Error('indices must be valid indices for gd.data.'));
        });

        it('should throw an error when indices are repeated', function() {
            expect(function() {
                Plotly.deleteTraces(gd, [0, 0]);
            }).toThrow(new Error('each index in indices must be unique.'));
        });

        it('should work when indices are negative', function() {
            var expectedData = [
                {name: 'a'},
                {name: 'b'},
                {name: 'c'}
            ];

            Plotly.deleteTraces(gd, -1);
            expect(gd.data).toEqual(expectedData);
            expect(plotApi.redraw).toHaveBeenCalled();
        });

        it('should work when multiple traces are deleted', function() {
            var expectedData = [
                {name: 'b'},
                {name: 'c'}
            ];

            Plotly.deleteTraces(gd, [0, 3]);
            expect(gd.data).toEqual(expectedData);
            expect(plotApi.redraw).toHaveBeenCalled();
        });

        it('should work when indices are not sorted', function() {
            var expectedData = [
                {name: 'b'},
                {name: 'c'}
            ];

            Plotly.deleteTraces(gd, [3, 0]);
            expect(gd.data).toEqual(expectedData);
            expect(plotApi.redraw).toHaveBeenCalled();
        });

        it('should work with more than 10 indices', function() {
            gd.data = [];

            for(var i = 0; i < 20; i++) {
                gd.data.push({
                    name: 'trace #' + i
                });
            }

            var expectedData = [
                {name: 'trace #12'},
                {name: 'trace #13'},
                {name: 'trace #14'},
                {name: 'trace #15'},
                {name: 'trace #16'},
                {name: 'trace #17'},
                {name: 'trace #18'},
                {name: 'trace #19'}
            ];

            Plotly.deleteTraces(gd, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
            expect(gd.data).toEqual(expectedData);
            expect(plotApi.redraw).toHaveBeenCalled();
        });
    });

    describe('Plotly.addTraces', function() {
        var gd;

        beforeEach(function() {
            gd = { data: [{name: 'a'}, {name: 'b'}] };
            spyOn(plotApi, 'redraw');
            spyOn(plotApi, 'moveTraces');
        });

        it('should throw an error when traces is not an object or an array of objects', function() {
            var expected = JSON.parse(JSON.stringify(gd));
            expect(function() {
                Plotly.addTraces(gd, 1, 2);
            }).toThrowError(Error, 'all values in traces array must be non-array objects');

            expect(function() {
                Plotly.addTraces(gd, [{}, 4], 2);
            }).toThrowError(Error, 'all values in traces array must be non-array objects');

            expect(function() {
                Plotly.addTraces(gd, [{}, []], 2);
            }).toThrowError(Error, 'all values in traces array must be non-array objects');

            // make sure we didn't muck with gd.data if things failed!
            expect(gd).toEqual(expected);
        });

        it('should throw an error when traces and newIndices arrays are unequal', function() {
            expect(function() {
                Plotly.addTraces(gd, [{}, {}], 2);
            }).toThrowError(Error, 'if indices is specified, traces.length must equal indices.length');
        });

        it('should throw an error when newIndices are out of bounds', function() {
            var expected = JSON.parse(JSON.stringify(gd));

            expect(function() {
                Plotly.addTraces(gd, [{}, {}], [0, 10]);
            }).toThrow(new Error('newIndices must be valid indices for gd.data.'));

            // make sure we didn't muck with gd.data if things failed!
            expect(gd).toEqual(expected);
        });

        it('should work when newIndices is undefined', function() {
            Plotly.addTraces(gd, [{name: 'c'}, {name: 'd'}]);
            expect(gd.data[2].name).toBeDefined();
            expect(gd.data[3].name).toBeDefined();
            expect(plotApi.redraw).toHaveBeenCalled();
            expect(plotApi.moveTraces).not.toHaveBeenCalled();
        });

        it('should work when newIndices is defined', function() {
            Plotly.addTraces(gd, [{name: 'c'}, {name: 'd'}], [1, 3]);
            expect(gd.data[2].name).toBeDefined();
            expect(gd.data[3].name).toBeDefined();
            expect(plotApi.redraw).not.toHaveBeenCalled();
            expect(plotApi.moveTraces).toHaveBeenCalledWith(gd, [-2, -1], [1, 3]);
        });

        it('should work when newIndices has negative indices', function() {
            Plotly.addTraces(gd, [{name: 'c'}, {name: 'd'}], [-3, -1]);
            expect(gd.data[2].name).toBeDefined();
            expect(gd.data[3].name).toBeDefined();
            expect(plotApi.redraw).not.toHaveBeenCalled();
            expect(plotApi.moveTraces).toHaveBeenCalledWith(gd, [-2, -1], [-3, -1]);
        });

        it('should work when newIndices is an integer', function() {
            Plotly.addTraces(gd, {name: 'c'}, 0);
            expect(gd.data[2].name).toBeDefined();
            expect(plotApi.redraw).not.toHaveBeenCalled();
            expect(plotApi.moveTraces).toHaveBeenCalledWith(gd, [-1], [0]);
        });

        it('should work when adding an existing trace', function() {
            Plotly.addTraces(gd, gd.data[0]);

            expect(gd.data.length).toEqual(3);
            expect(gd.data[0]).not.toBe(gd.data[2]);
        });

        it('should work when duplicating the existing data', function() {
            Plotly.addTraces(gd, gd.data);

            expect(gd.data.length).toEqual(4);
            expect(gd.data[0]).not.toBe(gd.data[2]);
            expect(gd.data[1]).not.toBe(gd.data[3]);
        });
    });

    describe('Plotly.moveTraces should', function() {
        var gd;
        beforeEach(function() {
            gd = {
                data: [
                    {name: 'a'},
                    {name: 'b'},
                    {name: 'c'},
                    {name: 'd'}
                ]
            };
            spyOn(plotApi, 'redraw');
        });

        it('throw an error when index arrays are unequal', function() {
            expect(function() {
                Plotly.moveTraces(gd, [1], [2, 1]);
            }).toThrow(new Error('current and new indices must be of equal length.'));
        });

        it('throw an error when gd.data isn\'t an array.', function() {
            expect(function() {
                Plotly.moveTraces({}, [0], [0]);
            }).toThrow(new Error('gd.data must be an array.'));
            expect(function() {
                Plotly.moveTraces({data: 'meow'}, [0], [0]);
            }).toThrow(new Error('gd.data must be an array.'));
        });

        it('thow an error when a current index is out of bounds', function() {
            expect(function() {
                Plotly.moveTraces(gd, [-gd.data.length - 1], [0]);
            }).toThrow(new Error('currentIndices must be valid indices for gd.data.'));
            expect(function() {
                Plotly.moveTraces(gd, [gd.data.length], [0]);
            }).toThrow(new Error('currentIndices must be valid indices for gd.data.'));
        });

        it('thow an error when a new index is out of bounds', function() {
            expect(function() {
                Plotly.moveTraces(gd, [0], [-gd.data.length - 1]);
            }).toThrow(new Error('newIndices must be valid indices for gd.data.'));
            expect(function() {
                Plotly.moveTraces(gd, [0], [gd.data.length]);
            }).toThrow(new Error('newIndices must be valid indices for gd.data.'));
        });

        it('thow an error when current indices are repeated', function() {
            expect(function() {
                Plotly.moveTraces(gd, [0, 0], [0, 1]);
            }).toThrow(new Error('each index in currentIndices must be unique.'));

            // note that both positive and negative indices are accepted!
            expect(function() {
                Plotly.moveTraces(gd, [0, -gd.data.length], [0, 1]);
            }).toThrow(new Error('each index in currentIndices must be unique.'));
        });

        it('thow an error when new indices are repeated', function() {
            expect(function() {
                Plotly.moveTraces(gd, [0, 1], [0, 0]);
            }).toThrow(new Error('each index in newIndices must be unique.'));

            // note that both positive and negative indices are accepted!
            expect(function() {
                Plotly.moveTraces(gd, [0, 1], [-gd.data.length, 0]);
            }).toThrow(new Error('each index in newIndices must be unique.'));
        });

        it('accept integers in place of arrays', function() {
            var expectedData = [
                {name: 'b'},
                {name: 'a'},
                {name: 'c'},
                {name: 'd'}
            ];

            Plotly.moveTraces(gd, 0, 1);
            expect(gd.data).toEqual(expectedData);
            expect(plotApi.redraw).toHaveBeenCalled();
        });

        it('handle unsorted currentIndices', function() {
            var expectedData = [
                {name: 'd'},
                {name: 'a'},
                {name: 'c'},
                {name: 'b'}
            ];

            Plotly.moveTraces(gd, [3, 1], [0, 3]);
            expect(gd.data).toEqual(expectedData);
            expect(plotApi.redraw).toHaveBeenCalled();
        });

        it('work when newIndices are undefined.', function() {
            var expectedData = [
                {name: 'b'},
                {name: 'c'},
                {name: 'd'},
                {name: 'a'}
            ];

            Plotly.moveTraces(gd, [3, 0]);
            expect(gd.data).toEqual(expectedData);
            expect(plotApi.redraw).toHaveBeenCalled();
        });

        it('accept negative indices.', function() {
            var expectedData = [
                {name: 'a'},
                {name: 'c'},
                {name: 'b'},
                {name: 'd'}
            ];

            Plotly.moveTraces(gd, 1, -2);
            expect(gd.data).toEqual(expectedData);
            expect(plotApi.redraw).toHaveBeenCalled();
        });
    });

    describe('Plotly.extendTraces / Plotly.prependTraces', function() {
        var gd;

        beforeEach(function() {
            gd = {
                data: [
                    {x: [0, 1, 2], marker: {size: [3, 2, 1]}},
                    {x: [1, 2, 3], marker: {size: [2, 3, 4]}}
                ]
            };

            spyOn(plotApi, 'redraw');
            spyOn(Queue, 'add');
        });

        it('should throw an error when gd.data isn\'t an array.', function() {
            expect(function() {
                Plotly.extendTraces({}, {x: [[1]]}, [0]);
            }).toThrow(new Error('gd.data must be an array'));

            expect(function() {
                Plotly.extendTraces({data: 'meow'}, {x: [[1]]}, [0]);
            }).toThrow(new Error('gd.data must be an array'));
        });

        it('should throw an error when update is not an object', function() {
            expect(function() {
                Plotly.extendTraces(gd, undefined, [0], 8);
            }).toThrow(new Error('update must be a key:value object'));

            expect(function() {
                Plotly.extendTraces(gd, null, [0]);
            }).toThrow(new Error('update must be a key:value object'));
        });

        it('should throw an error when indices are omitted', function() {
            expect(function() {
                Plotly.extendTraces(gd, {x: [[1]]});
            }).toThrow(new Error('indices must be an integer or array of integers'));
        });

        it('should throw an error when a current index is out of bounds', function() {
            expect(function() {
                Plotly.extendTraces(gd, {x: [[1]]}, [-gd.data.length - 1]);
            }).toThrow(new Error('indices must be valid indices for gd.data.'));
        });

        it('should not throw an error when negative index wraps to positive', function() {
            expect(function() {
                Plotly.extendTraces(gd, {x: [[1]]}, [-1]);
            }).not.toThrow();
        });

        it('should throw an error when number of Indices does not match Update arrays', function() {
            expect(function() {
                Plotly.extendTraces(gd, {x: [[1, 2], [2, 3]] }, [0]);
            }).toThrow(new Error('attribute x must be an array of length equal to indices array length'));

            expect(function() {
                Plotly.extendTraces(gd, {x: [[1]]}, [0, 1]);
            }).toThrow(new Error('attribute x must be an array of length equal to indices array length'));
        });

        it('should throw an error when maxPoints is an Object but does not match Update', function() {
            expect(function() {
                Plotly.extendTraces(gd, {x: [[1]]}, [0], {y: [1]});
            }).toThrow(new Error('when maxPoints is set as a key:value object it must contain a 1:1 ' +
                                 'corrispondence with the keys and number of traces in the update object'));

            expect(function() {
                Plotly.extendTraces(gd, {x: [[1]]}, [0], {x: [1, 2]});
            }).toThrow(new Error('when maxPoints is set as a key:value object it must contain a 1:1 ' +
                                 'corrispondence with the keys and number of traces in the update object'));
        });

        it('should throw an error when update keys mismatch trace keys', function() {
            // lets update y on both traces, but only 1 trace has "y"
            gd.data[1].y = [1, 2, 3];

            expect(function() {
                Plotly.extendTraces(gd, {
                    y: [[3, 4], [4, 5]], 'marker.size': [[0, -1], [5, 6]]
                }, [0, 1]);
            }).toThrow(new Error('cannot extend missing or non-array attribute: y'));
        });

        it('should extend traces with update keys', function() {
            Plotly.extendTraces(gd, {
                x: [[3, 4], [4, 5]], 'marker.size': [[0, -1], [5, 6]]
            }, [0, 1]);

            expect(gd.data).toEqual([
                {x: [0, 1, 2, 3, 4], marker: {size: [3, 2, 1, 0, -1]}},
                {x: [1, 2, 3, 4, 5], marker: {size: [2, 3, 4, 5, 6]}}
            ]);

            expect(plotApi.redraw).toHaveBeenCalled();
        });

        it('should extend and window traces with update keys', function() {
            var maxPoints = 3;

            Plotly.extendTraces(gd, {
                x: [[3, 4], [4, 5]], 'marker.size': [[0, -1], [5, 6]]
            }, [0, 1], maxPoints);

            expect(gd.data).toEqual([
                {x: [2, 3, 4], marker: {size: [1, 0, -1]}},
                {x: [3, 4, 5], marker: {size: [4, 5, 6]}}
            ]);
        });

        it('should extend and window traces with update keys', function() {
            var maxPoints = 3;

            Plotly.extendTraces(gd, {
                x: [[3, 4], [4, 5]], 'marker.size': [[0, -1], [5, 6]]
            }, [0, 1], maxPoints);

            expect(gd.data).toEqual([
                {x: [2, 3, 4], marker: {size: [1, 0, -1]}},
                {x: [3, 4, 5], marker: {size: [4, 5, 6]}}
            ]);
        });

        it('should extend and window traces using full maxPoint object', function() {
            var maxPoints = {x: [2, 3], 'marker.size': [1, 2]};

            Plotly.extendTraces(gd, {
                x: [[3, 4], [4, 5]], 'marker.size': [[0, -1], [5, 6]]
            }, [0, 1], maxPoints);

            expect(gd.data).toEqual([
                {x: [3, 4], marker: {size: [-1]}},
                {x: [3, 4, 5], marker: {size: [5, 6]}}
            ]);
        });

        it('should truncate arrays when maxPoints is zero', function() {
            Plotly.extendTraces(gd, {
                x: [[3, 4], [4, 5]], 'marker.size': [[0, -1], [5, 6]]
            }, [0, 1], 0);

            expect(gd.data).toEqual([
                {x: [], marker: {size: []}},
                {x: [], marker: {size: []}}
            ]);

            expect(plotApi.redraw).toHaveBeenCalled();
        });

        it('prepend is the inverse of extend - no maxPoints', function() {
            var cachedData = Lib.extendDeep([], gd.data);

            Plotly.extendTraces(gd, {
                x: [[3, 4], [4, 5]], 'marker.size': [[0, -1], [5, 6]]
            }, [0, 1]);

            expect(gd.data).not.toEqual(cachedData);
            expect(Queue.add).toHaveBeenCalled();

            var undoArgs = Queue.add.calls.first().args[2];

            Plotly.prependTraces.apply(null, undoArgs);

            expect(gd.data).toEqual(cachedData);
        });

        it('extend is the inverse of prepend - no maxPoints', function() {
            var cachedData = Lib.extendDeep([], gd.data);

            Plotly.prependTraces(gd, {
                x: [[3, 4], [4, 5]], 'marker.size': [[0, -1], [5, 6]]
            }, [0, 1]);

            expect(gd.data).not.toEqual(cachedData);
            expect(Queue.add).toHaveBeenCalled();

            var undoArgs = Queue.add.calls.first().args[2];

            Plotly.extendTraces.apply(null, undoArgs);

            expect(gd.data).toEqual(cachedData);
        });

        it('prepend is the inverse of extend - with maxPoints', function() {
            var maxPoints = 3;
            var cachedData = Lib.extendDeep([], gd.data);

            Plotly.extendTraces(gd, {
                x: [[3, 4], [4, 5]], 'marker.size': [[0, -1], [5, 6]]
            }, [0, 1], maxPoints);

            expect(gd.data).not.toEqual(cachedData);
            expect(Queue.add).toHaveBeenCalled();

            var undoArgs = Queue.add.calls.first().args[2];

            Plotly.prependTraces.apply(null, undoArgs);

            expect(gd.data).toEqual(cachedData);
        });

        it('should throw when trying to extend a plain array with a typed array', function() {
            gd.data = [{
                x: new Float32Array([1, 2, 3]),
                marker: {size: new Float32Array([20, 30, 10])}
            }];

            expect(function() {
                Plotly.extendTraces(gd, {x: [[1]]}, [0]);
            }).toThrow(new Error('cannot extend array with an array of a different type: x'));
        });

        it('should throw when trying to extend a typed array with a plain array', function() {
            gd.data = [{
                x: [1, 2, 3],
                marker: {size: [20, 30, 10]}
            }];

            expect(function() {
                Plotly.extendTraces(gd, {x: [new Float32Array([1])]}, [0]);
            }).toThrow(new Error('cannot extend array with an array of a different type: x'));
        });

        it('should extend traces with update keys (typed array case)', function() {
            gd.data = [{
                x: new Float32Array([1, 2, 3]),
                marker: {size: new Float32Array([20, 30, 10])}
            }];

            Plotly.extendTraces(gd, {
                x: [new Float32Array([4, 5])],
                'marker.size': [new Float32Array([40, 30])]
            }, [0]);

            expect(gd.data[0].x).toEqual(new Float32Array([1, 2, 3, 4, 5]));
            expect(gd.data[0].marker.size).toEqual(new Float32Array([20, 30, 10, 40, 30]));
        });

        describe('should extend/prepend and window traces with update keys linked', function() {
            function _base(method, args, expectations) {
                gd.data = [{
                    x: [1, 2, 3]
                }, {
                    x: new Float32Array([1, 2, 3])
                }];

                Plotly[method](gd, {
                    x: [args.newPts, new Float32Array(args.newPts)]
                }, [0, 1], args.maxp);

                expect(plotApi.redraw).toHaveBeenCalled();
                expect(Queue.add).toHaveBeenCalled();

                expect(gd.data[0].x).toEqual(expectations.newArray);
                expect(gd.data[1].x).toEqual(new Float32Array(expectations.newArray));

                var cont = Queue.add.calls.first().args[2][1].x;
                expect(cont[0]).toEqual(expectations.remainder);
                expect(cont[1]).toEqual(new Float32Array(expectations.remainder));
            }

            function _extendTraces(args, expectations) {
                return _base('extendTraces', args, expectations);
            }

            function _prependTraces(args, expectations) {
                return _base('prependTraces', args, expectations);
            }

            it('- extend no maxp', function() {
                _extendTraces({
                    newPts: [4, 5]
                }, {
                    newArray: [1, 2, 3, 4, 5],
                    remainder: []
                });
            });

            it('- extend maxp === insert.length', function() {
                _extendTraces({
                    newPts: [4, 5],
                    maxp: 2
                }, {
                    newArray: [4, 5],
                    remainder: [1, 2, 3]
                });
            });

            it('- extend maxp < insert.length', function() {
                _extendTraces({
                    newPts: [4, 5],
                    maxp: 1
                }, {
                    newArray: [5],
                    remainder: [1, 2, 3, 4]
                });
            });

            it('- extend maxp > insert.length', function() {
                _extendTraces({
                    newPts: [4, 5],
                    maxp: 4
                }, {
                    newArray: [2, 3, 4, 5],
                    remainder: [1]
                });
            });

            it('- extend maxp === 0', function() {
                _extendTraces({
                    newPts: [4, 5],
                    maxp: 0
                }, {
                    newArray: [],
                    remainder: [1, 2, 3, 4, 5]
                });
            });

            it('- prepend no maxp', function() {
                _prependTraces({
                    newPts: [-1, 0]
                }, {
                    newArray: [-1, 0, 1, 2, 3],
                    remainder: []
                });
            });

            it('- prepend maxp === insert.length', function() {
                _prependTraces({
                    newPts: [-1, 0],
                    maxp: 2
                }, {
                    newArray: [-1, 0],
                    remainder: [1, 2, 3]
                });
            });

            it('- prepend maxp < insert.length', function() {
                _prependTraces({
                    newPts: [-1, 0],
                    maxp: 1
                }, {
                    newArray: [-1],
                    remainder: [0, 1, 2, 3]
                });
            });

            it('- prepend maxp > insert.length', function() {
                _prependTraces({
                    newPts: [-1, 0],
                    maxp: 4
                }, {
                    newArray: [-1, 0, 1, 2],
                    remainder: [3]
                });
            });

            it('- prepend maxp === 0', function() {
                _prependTraces({
                    newPts: [-1, 0],
                    maxp: 0
                }, {
                    newArray: [],
                    remainder: [-1, 0, 1, 2, 3]
                });
            });
        });
    });

    describe('Plotly.purge', function() {
        afterEach(destroyGraphDiv);

        it('should return the graph div in its original state', function(done) {
            var gd = createGraphDiv();
            var initialKeys = Object.keys(gd);
            var intialHTML = gd.innerHTML;
            var mockData = [{ x: [1, 2, 3], y: [2, 3, 4] }];

            Plotly.newPlot(gd, mockData).then(function() {
                Plotly.purge(gd);

                expect(Object.keys(gd)).toEqual(initialKeys);
                expect(gd.innerHTML).toEqual(intialHTML);
            })
            .then(done, done.fail);
        });
    });

    describe('Plotly.redraw', function() {
        afterEach(destroyGraphDiv);

        it('', function(done) {
            var gd = createGraphDiv();
            var initialData = [];
            var layout = { title: { text: 'Redraw' } };

            Plotly.newPlot(gd, initialData, layout)
            .then(function() {
                var trace1 = {
                    x: [1, 2, 3, 4],
                    y: [4, 1, 5, 3],
                    name: 'First Trace'
                };
                var trace2 = {
                    x: [1, 2, 3, 4],
                    y: [14, 11, 15, 13],
                    name: 'Second Trace'
                };
                var trace3 = {
                    x: [1, 2, 3, 4],
                    y: [5, 3, 7, 1],
                    name: 'Third Trace'
                };

                var newData = [trace1, trace2, trace3];
                gd.data = newData;

                return Plotly.redraw(gd);
            })
            .then(function() {
                expect(d3SelectAll('g.trace.scatter').size()).toEqual(3);
            })
            .then(done, done.fail);
        });
    });

    describe('cleanData & cleanLayout', function() {
        var gd;

        beforeEach(function() {
            gd = createGraphDiv();
        });

        afterEach(destroyGraphDiv);

        it('should rename \'scl\' to \'colorscale\' when colorscale is not defined', function() {
            var data = [{
                type: 'heatmap',
                scl: 'Blues'
            }];

            Plotly.newPlot(gd, data);
            expect(gd.data[0].colorscale).toBe('Blues');
            expect(gd.data[0].scl).toBe(undefined);
        });

        it('should not delete rename \'scl\' to \'colorscale\' when colorscale is defined ', function() {
            var data = [{
                type: 'heatmap',
                colorscale: 'Greens',
                scl: 'Reds'
            }];

            Plotly.newPlot(gd, data);
            expect(gd.data[0].colorscale).toBe('Greens');
            expect(gd.data[0].scl).not.toBe(undefined);
        });

        it('should rename \'reversescl\' to \'reversescale\' when colorscale is not defined', function() {
            var data = [{
                type: 'heatmap',
                reversescl: true
            }];

            Plotly.newPlot(gd, data);
            expect(gd.data[0].reversescale).toBe(true);
            expect(gd.data[0].reversescl).toBe(undefined);
        });

        it('should not delete & rename \'reversescl\' to \'reversescale\' when colorscale is defined', function() {
            var data = [{
                type: 'heatmap',
                reversescale: true,
                reversescl: false
            }];

            Plotly.newPlot(gd, data);
            expect(gd.data[0].reversescale).toBe(true);
            expect(gd.data[0].reversescl).not.toBe(undefined);
        });

        it('should rename \'YIGnBu\' colorscales YlGnBu (2dMap case)', function() {
            var data = [{
                type: 'heatmap',
                colorscale: 'YIGnBu'
            }];

            Plotly.newPlot(gd, data);
            expect(gd.data[0].colorscale).toBe('YlGnBu');
        });

        it('should rename \'YIGnBu\' colorscales YlGnBu (markerColorscale case)', function() {
            var data = [{
                type: 'scattergeo',
                marker: { colorscale: 'YIGnBu' }
            }];

            Plotly.newPlot(gd, data);
            expect(gd.data[0].marker.colorscale).toBe('YlGnBu');
        });

        it('should rename \'YIOrRd\' colorscales YlOrRd (2dMap case)', function() {
            var data = [{
                type: 'contour',
                colorscale: 'YIOrRd'
            }];

            Plotly.newPlot(gd, data);
            expect(gd.data[0].colorscale).toBe('YlOrRd');
        });

        it('should rename \'YIOrRd\' colorscales YlOrRd (markerColorscale case)', function() {
            var data = [{
                type: 'scattergeo',
                marker: { colorscale: 'YIOrRd' }
            }];

            Plotly.newPlot(gd, data);
            expect(gd.data[0].marker.colorscale).toBe('YlOrRd');
        });

        it('should rename \'highlightColor\' to \'highlightcolor\')', function() {
            var data = [{
                type: 'surface',
                contours: {
                    x: { highlightColor: 'red' },
                    y: { highlightcolor: 'blue' }
                }
            }, {
                type: 'surface'
            }, {
                type: 'surface',
                contours: false
            }, {
                type: 'surface',
                contours: {
                    stuff: {},
                    x: false,
                    y: []
                }
            }];

            spyOn(Plots.subplotsRegistry.gl3d, 'plot');

            Plotly.newPlot(gd, data);

            expect(Plots.subplotsRegistry.gl3d.plot).toHaveBeenCalled();

            var contours = gd.data[0].contours;

            expect(contours.x.highlightColor).toBeUndefined();
            expect(contours.x.highlightcolor).toEqual('red');
            expect(contours.y.highlightcolor).toEqual('blue');
            expect(contours.z).toBeUndefined();

            expect(gd.data[1].contours).toBeUndefined();
            expect(gd.data[2].contours).toBe(false);
            expect(gd.data[3].contours).toEqual({ stuff: {}, x: false, y: [] });
        });

        it('should rename \'highlightWidth\' to \'highlightwidth\')', function() {
            var data = [{
                type: 'surface',
                contours: {
                    z: { highlightwidth: 'red' },
                    y: { highlightWidth: 'blue' }
                }
            }, {
                type: 'surface'
            }];

            spyOn(Plots.subplotsRegistry.gl3d, 'plot');

            Plotly.newPlot(gd, data);

            expect(Plots.subplotsRegistry.gl3d.plot).toHaveBeenCalled();

            var contours = gd.data[0].contours;

            expect(contours.x).toBeUndefined();
            expect(contours.y.highlightwidth).toEqual('blue');
            expect(contours.z.highlightWidth).toBeUndefined();
            expect(contours.z.highlightwidth).toEqual('red');

            expect(gd.data[1].contours).toBeUndefined();
        });

        it('should cleanup annotations / shapes refs', function() {
            var data = [{}];

            var layout = {
                annotations: [
                    null,
                    { xref: 'x02', yref: 'y1' }
                ],
                shapes: [
                    { xref: 'y', yref: 'x' },
                    null,
                    { xref: 'x03', yref: 'y1' }
                ]
            };

            Plotly.newPlot(gd, data, layout);

            expect(gd.layout.annotations[0]).toEqual(null);
            expect(gd.layout.annotations[1]).toEqual({ xref: 'x2', yref: 'y' });

            expect(gd.layout.shapes[0].xref).toBeUndefined();
            expect(gd.layout.shapes[0].yref).toBeUndefined();
            expect(gd.layout.shapes[1]).toEqual(null);
            expect(gd.layout.shapes[2].xref).toEqual('x3');
            expect(gd.layout.shapes[2].yref).toEqual('y');
        });

        it('removes direction names and showlegend from finance traces', function() {
            var data = [{
                type: 'ohlc', open: [1], high: [3], low: [0], close: [2],
                increasing: {
                    showlegend: true,
                    name: 'Yeti goes up'
                },
                decreasing: {
                    showlegend: 'legendonly',
                    name: 'Yeti goes down'
                },
                name: 'Snowman'
            }, {
                type: 'candlestick', open: [1], high: [3], low: [0], close: [2],
                increasing: {
                    name: 'Bigfoot'
                },
                decreasing: {
                    showlegend: false,
                    name: 'Biggerfoot'
                },
                name: 'Nobody'
            }, {
                type: 'ohlc', open: [1], high: [3], low: [0], close: [2],
                increasing: {
                    name: 'Batman'
                },
                decreasing: {
                    showlegend: true
                },
                name: 'Robin'
            }, {
                type: 'candlestick', open: [1], high: [3], low: [0], close: [2],
                increasing: {
                    showlegend: false,
                },
                decreasing: {
                    name: 'Fred'
                }
            }, {
                type: 'ohlc', open: [1], high: [3], low: [0], close: [2],
                increasing: {
                    showlegend: false,
                    name: 'Gruyere heating up'
                },
                decreasing: {
                    showlegend: false,
                    name: 'Gruyere cooling off'
                },
                name: 'Emmenthaler'
            }];

            Plotly.newPlot(gd, data);

            // Even if both showlegends are false, leave trace.showlegend out
            // My rationale for this is that legends are sufficiently different
            // now that it's worthwhile resetting their existence to default
            gd.data.forEach(function(trace) {
                expect(trace.increasing.name).toBeUndefined();
                expect(trace.increasing.showlegend).toBeUndefined();
                expect(trace.decreasing.name).toBeUndefined();
                expect(trace.decreasing.showlegend).toBeUndefined();
            });

            // Both directions have names: ignore trace.name, as it
            // had no effect on the output previously
            // Ideally 'Yeti goes' would be smart enough to truncate
            // at 'Yeti' but I don't see how to do that...
            expect(gd.data[0].name).toBe('Yeti goes');
            // One direction has empty or hidden name so use the other
            // Note that even '' in both names would render trace.name impact-less
            expect(gd.data[1].name).toBe('Bigfoot');

            // One direction has a name but trace.name is there too:
            // just use trace.name
            expect(gd.data[2].name).toBe('Robin');

            // No trace.name, only one direction name: use the direction name
            expect(gd.data[3].name).toBe('Fred');

            // both names exist but hidden from the legend: still look for common prefix
            expect(gd.data[4].name).toBe('Gruyere');
        });
    });

    describe('Plotly.newPlot', function() {
        var gd;

        beforeEach(function() {
            gd = createGraphDiv();
        });

        afterEach(destroyGraphDiv);

        it('should respect layout.width and layout.height', function(done) {
            // See issue https://github.com/plotly/plotly.js/issues/537
            var data = [{
                x: [1, 2],
                y: [1, 2]
            }];
            var height = 50;

            Plotly.newPlot(gd, data).then(function() {
                return Plotly.newPlot(gd, data, { height: height });
            })
            .then(function() {
                var fullLayout = gd._fullLayout;
                var svg = document.getElementsByClassName('main-svg')[0];

                expect(fullLayout.height).toBe(height);
                expect(+svg.getAttribute('height')).toBe(height);
            })
            .then(done, done.fail);
        });

        it('should only have one modebar-container', function(done) {
            var data = [{y: [1, 2]}];

            function _assert(msg) {
                return function() {
                    var modebars = document.getElementsByClassName('modebar-container');
                    expect(modebars.length).toBe(1, msg + ' # of modebar container');
                    var groups = document.getElementsByClassName('modebar-group');
                    expect(groups.length).toBe(4, msg + ' # of modebar button groups');
                };
            }

            Plotly.newPlot(gd, data)
            .then(_assert('base'))
            .then(function() { return Plotly.newPlot(gd, data); })
            .then(_assert('after newPlot()'))
            .then(function() {
                // funky combinations of update flags found in
                // https://github.com/plotly/plotly.js/issues/3824
                return Plotly.update(gd, {
                    visible: false
                }, {
                    annotations: [{text: 'a'}]
                });
            })
            .then(_assert('after update()'))
            .then(done, done.fail);
        });
    });

    describe('Plotly.update should', function() {
        var gd, data, layout, calcdata;

        beforeAll(function() {
            Object.keys(subroutines).forEach(function(k) {
                spyOn(subroutines, k).and.callThrough();
            });
        });

        beforeEach(function(done) {
            Object.keys(subroutines).forEach(function(k) {
                subroutines[k].calls.reset();
            });

            gd = createGraphDiv();
            Plotly.newPlot(gd, [{ y: [2, 1, 2] }]).then(function() {
                data = gd.data;
                layout = gd.layout;
                calcdata = gd.calcdata;
            })
            .then(done);
        });

        afterEach(destroyGraphDiv);

        it('call doTraceStyle on trace style updates', function(done) {
            Plotly.update(gd, { 'marker.color': 'blue' }).then(function() {
                expect(subroutines.doTraceStyle).toHaveBeenCalledTimes(1);
                expect(calcdata).toBe(gd.calcdata);
            })
            .then(done, done.fail);
        });

        it('clear calcdata on data updates', function(done) {
            Plotly.update(gd, { x: [[3, 1, 3]] }).then(function() {
                expect(data).toBe(gd.data);
                expect(layout).toBe(gd.layout);
                expect(calcdata).not.toBe(gd.calcdata);
            })
            .then(done, done.fail);
        });

        it('clear calcdata on data + axis updates w/o extending current gd.data', function(done) {
            var traceUpdate = {
                x: [[3, 1, 3]]
            };

            var layoutUpdate = {
                xaxis: { title: { text: 'A' }, type: '-'}
            };

            Plotly.update(gd, traceUpdate, layoutUpdate).then(function() {
                expect(data).toBe(gd.data);
                expect(layout).toBe(gd.layout);
                expect(calcdata).not.toBe(gd.calcdata);
                expect(gd.data.length).toEqual(1);
                expect(subroutines.layoutReplot).toHaveBeenCalledTimes(1);
            })
            .then(done, done.fail);
        });

        it('call doLegend on legend updates', function(done) {
            Plotly.update(gd, {}, { showlegend: true }).then(function() {
                expect(subroutines.doLegend).toHaveBeenCalledTimes(1);
                expect(calcdata).toBe(gd.calcdata);
            })
            .then(done, done.fail);
        });

        it('call array manager when adding update menu', function(done) {
            spyOn(manageArrays, 'applyContainerArrayChanges').and.callThrough();

            var layoutUpdate = {
                updatemenus: [{
                    buttons: [{
                        method: 'relayout',
                        args: ['title', 'Hello World']
                    }]
                }]
            };

            Plotly.update(gd, {}, layoutUpdate).then(function() {
                expect(manageArrays.applyContainerArrayChanges).toHaveBeenCalledTimes(1);
                expect(subroutines.layoutReplot).toHaveBeenCalledTimes(0);
                expect(calcdata).toBe(gd.calcdata);
            })
            .then(done, done.fail);
        });

        it('call doModeBar when updating \'dragmode\'', function(done) {
            Plotly.update(gd, {}, { dragmode: 'pan' }).then(function() {
                expect(subroutines.doModeBar).toHaveBeenCalledTimes(1);
                expect(calcdata).toBe(gd.calcdata);
            })
            .then(done, done.fail);
        });

        it('ignores invalid trace indices', function() {
            // Call update on an invalid trace indice
            Plotly.update(gd, {type: 'scatter', 'marker.color': 'red'}, {}, [1]);
        });
    });
});

describe('plot_api helpers', function() {
    describe('hasParent', function() {
        var attr = 'annotations[2].xref';
        var attr2 = 'marker.line.width';

        it('does not match the attribute itself or other related non-parent attributes', function() {
            var aobj = {
                // '' wouldn't be valid as an attribute in our framework, but tested
                // just in case this would count as a parent.
                '': true,
                'annotations[1]': {}, // parent structure, just a different array element
                xref: 1, // another substring
                'annotations[2].x': 0.5, // substring of the attribute, but not a parent
                'annotations[2].xref': 'x2' // the attribute we're testing - not its own parent
            };

            expect(helpers.hasParent(aobj, attr)).toBe(false);

            var aobj2 = {
                'marker.line.color': 'red',
                'marker.line.width': 2,
                'marker.color': 'blue',
                line: {}
            };

            expect(helpers.hasParent(aobj2, attr2)).toBe(false);
        });

        it('is false when called on a top-level attribute', function() {
            var aobj = {
                '': true,
                width: 100
            };

            expect(helpers.hasParent(aobj, 'width')).toBe(false);
        });

        it('matches any kind of parent', function() {
            expect(helpers.hasParent({annotations: []}, attr)).toBe(true);
            expect(helpers.hasParent({'annotations[2]': {}}, attr)).toBe(true);

            expect(helpers.hasParent({marker: {}}, attr2)).toBe(true);
            // this one wouldn't actually make sense: marker.line needs to be an object...
            // but hasParent doesn't look at the values in aobj, just its keys.
            expect(helpers.hasParent({'marker.line': 1}, attr2)).toBe(true);
        });
    });
});

describe('plot_api edit_types', function() {
    it('initializes flags with all false', function() {
        ['traceFlags', 'layoutFlags'].forEach(function(container) {
            var initFlags = editTypes[container]();
            Object.keys(initFlags).forEach(function(key) {
                expect(initFlags[key]).toBe(false, container + '.' + key);
            });
        });
    });

    it('makes no changes if editType is not included', function() {
        var flags = {calc: false, style: true};

        editTypes.update(flags, {
            valType: 'boolean',
            dflt: true
        });

        expect(flags).toEqual({calc: false, style: true});

        editTypes.update(flags, {
            family: {valType: 'string', dflt: 'Comic sans'},
            size: {valType: 'number', dflt: 96},
            color: {valType: 'color', dflt: 'red'}
        });

        expect(flags).toEqual({calc: false, style: true});
    });

    it('gets updates from the outer object and ignores nested items', function() {
        var flags = {calc: false, legend: true};

        editTypes.update(flags, {
            editType: 'calc+style',
            valType: 'number',
            dflt: 1
        });

        expect(flags).toEqual({calc: true, legend: true, style: true});
    });
});
