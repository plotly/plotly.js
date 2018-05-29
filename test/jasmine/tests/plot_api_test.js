var Plotly = require('@lib/index');
var plotApi = require('@src/plot_api/plot_api');
var Plots = require('@src/plots/plots');
var Lib = require('@src/lib');
var Queue = require('@src/lib/queue');
var Scatter = require('@src/traces/scatter');
var Bar = require('@src/traces/bar');
var Legend = require('@src/components/legend');
var pkg = require('../../../package.json');
var subroutines = require('@src/plot_api/subroutines');
var helpers = require('@src/plot_api/helpers');
var editTypes = require('@src/plot_api/edit_types');
var annotations = require('@src/components/annotations');
var images = require('@src/components/images');
var Registry = require('@src/registry');

var d3 = require('d3');
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var failTest = require('../assets/fail_test');
var checkTicks = require('../assets/custom_assertions').checkTicks;
var supplyAllDefaults = require('../assets/supply_defaults');

describe('Test plot api', function() {
    'use strict';

    describe('Plotly.version', function() {
        it('should be the same as in the package.json', function() {
            expect(Plotly.version).toEqual(pkg.version);
        });
    });

    describe('Plotly.plot', function() {
        var gd;

        beforeEach(function() {
            gd = createGraphDiv();
        });

        afterEach(destroyGraphDiv);

        it('accepts gd, data, layout, and config as args', function(done) {
            Plotly.plot(gd,
                [{x: [1, 2, 3], y: [1, 2, 3]}],
                {width: 500, height: 500},
                {editable: true}
            ).then(function() {
                expect(gd.layout.width).toEqual(500);
                expect(gd.layout.height).toEqual(500);
                expect(gd.data.length).toEqual(1);
                expect(gd._context.editable).toBe(true);
            })
            .catch(failTest)
            .then(done);
        });

        it('accepts gd and an object as args', function(done) {
            Plotly.plot(gd, {
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
            .catch(failTest)
            .then(done);
        });

        it('allows adding more frames to the initial set', function(done) {
            Plotly.plot(gd, {
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
            .catch(failTest)
            .then(done);
        });

        it('should emit afterplot event after plotting is done', function(done) {
            var afterPlot = false;

            var promise = Plotly.plot(gd, [{ y: [2, 1, 2]}]);

            gd.on('plotly_afterplot', function() {
                afterPlot = true;
            });

            promise.then(function() {
                expect(afterPlot).toBe(true);
            })
            .catch(failTest)
            .then(done);
        });
    });

    describe('Plotly.relayout', function() {
        var gd;

        beforeEach(function() {
            gd = createGraphDiv();

            // some of these tests use the undo/redo queue
            // OK, this is weird... the undo/redo queue length is a global config only.
            // It's ignored on the plot, even though the queue itself is per-plot.
            // We may ditch this later, but probably not until v2
            Plotly.setPlotConfig({queueLength: 3});
        });

        afterEach(function() {
            destroyGraphDiv();
            Plotly.setPlotConfig({queueLength: 0});
        });

        it('should update the plot clipPath if the plot is resized', function(done) {

            Plotly.plot(gd, [{ x: [1, 2, 3], y: [1, 2, 3] }], { width: 500, height: 500 })
            .then(function() {
                return Plotly.relayout(gd, { width: 400, height: 400 });
            })
            .then(function() {
                var uid = gd._fullLayout._uid;

                var plotClip = document.getElementById('clip' + uid + 'xyplot'),
                    clipRect = plotClip.children[0],
                    clipWidth = +clipRect.getAttribute('width'),
                    clipHeight = +clipRect.getAttribute('height');

                expect(clipWidth).toBe(240);
                expect(clipHeight).toBe(220);
            })
            .catch(failTest)
            .then(done);
        });

        it('sets null values to their default', function(done) {
            var defaultWidth;
            Plotly.plot(gd, [{ x: [1, 2, 3], y: [1, 2, 3] }])
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
            .catch(failTest)
            .then(done);
        });

        it('ignores undefined values', function(done) {
            var defaultWidth;
            Plotly.plot(gd, [{ x: [1, 2, 3], y: [1, 2, 3] }])
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
            .catch(failTest)
            .then(done);
        });

        it('can set items in array objects', function(done) {
            Plotly.plot(gd, [{ x: [1, 2, 3], y: [1, 2, 3] }])
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
            .catch(failTest)
            .then(done);
        });

        it('errors if child and parent are edited together', function(done) {
            var edit1 = {rando: [{a: 1}, {b: 2}]};
            var edit2 = {'rando[1]': {c: 3}};
            var edit3 = {'rando[1].d': 4};

            Plotly.plot(gd, [{ x: [1, 2, 3], y: [1, 2, 3] }])
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
            .catch(failTest)
            .then(done);
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
            Plotly.plot(gd, data)
            .then(function() {
                scatter = document.getElementsByClassName('scatter')[0];
                oldHeight = scatter.getBoundingClientRect().height;
                return Plotly.relayout(gd, 'yaxis.range', [0.5, 0.5, 0.5]);
            })
            .then(function() {
                var newHeight = scatter.getBoundingClientRect().height;
                expect(newHeight).toEqual(oldHeight);
            })
            .catch(failTest)
            .then(done);
        });

        it('should skip empty axis objects', function(done) {
            Plotly.plot(gd, [{
                x: [1, 2, 3],
                y: [1, 2, 1]
            }], {
                xaxis: { title: 'x title' },
                yaxis: { title: 'y title' }
            })
            .then(function() {
                return Plotly.relayout(gd, { zaxis: {} });
            })
            .catch(failTest)
            .then(done);
        });

        it('annotations, shapes and images linked to category axes should update properly on zoom/pan', function(done) {
            var jsLogo = 'https://images.plot.ly/language-icons/api-home/js-logo.png';

            function getPos(sel) {
                var rect = sel.node().getBoundingClientRect();
                return [rect.left, rect.bottom];
            }

            function getAnnotationPos() {
                return getPos(d3.select('.annotation'));
            }

            function getShapePos() {
                return getPos(d3.select('.layer-above').select('.shapelayer').select('path'));
            }

            function getImagePos() {
                return getPos(d3.select('.layer-above').select('.imagelayer').select('image'));
            }

            Plotly.plot(gd, [{
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
            .catch(failTest)
            .then(done);
        });

        it('clears autorange when you modify a range or part of a range', function(done) {
            var initialXRange;
            var initialYRange;

            Plotly.plot(gd, [{x: [1, 2], y: [1, 2]}])
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
            .catch(failTest)
            .then(done);
        });

        it('sets aspectmode to manual when you provide any aspectratio', function(done) {
            Plotly.plot(gd, [{x: [1, 2], y: [1, 2], z: [1, 2], type: 'scatter3d'}])
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
            .catch(failTest)
            .then(done);
        });

        it('sets tickmode to linear when you edit tick0 or dtick', function(done) {
            Plotly.plot(gd, [{x: [1, 2], y: [1, 2]}])
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
            .catch(failTest)
            .then(done);
        });

        it('updates non-auto ranges for linear/log changes', function(done) {
            Plotly.plot(gd, [{x: [3, 5], y: [3, 5]}], {
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
            .catch(failTest)
            .then(done);
        });

        it('respects reversed autorange when switching linear to log', function(done) {
            Plotly.plot(gd, [{x: [1, 2], y: [1, 2]}])
            .then(function() {
                // Ideally we should change this to xaxis.autorange: 'reversed'
                // but that's a weird disappearing setting used just to force
                // an initial reversed autorange. Proposed v2 change at:
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
            .catch(failTest)
            .then(done);
        });

        it('autoranges automatically when switching to/from any other axis type than linear <-> log', function(done) {
            Plotly.plot(gd, [{x: ['1.5', '0.8'], y: [1, 2]}], {xaxis: {range: [0.6, 1.7]}})
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
            .catch(failTest)
            .then(done);
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
            'finalDraw'
        ];

        var gd;

        beforeAll(function() {
            mockedMethods.forEach(function(m) {
                spyOn(subroutines, m);
            });
        });

        function mock(gd) {
            mockedMethods.forEach(function(m) {
                subroutines[m].calls.reset();
            });

            supplyAllDefaults(gd);
            Plots.doCalcdata(gd);
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

        it('should trigger replot (but not recalc) when switching into select or lasso dragmode for scattergl traces', function() {
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

            Plotly.relayout(gd, 'dragmode', 'pan');
            expectModeBarOnly('pan');

            Plotly.relayout(mock(gd), 'dragmode', 'lasso');
            expectReplot('lasso 1');

            Plotly.relayout(mock(gd), 'dragmode', 'select');
            expectModeBarOnly('select 1');

            Plotly.relayout(mock(gd), 'dragmode', 'lasso');
            expectModeBarOnly('lasso 2');

            Plotly.relayout(mock(gd), 'dragmode', 'zoom');
            expectModeBarOnly('zoom');

            Plotly.relayout(mock(gd), 'dragmode', 'select');
            expectReplot('select 2');
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

            for(var attr in axLayoutEdits) {
                gd = mock({
                    data: [{y: [1, 2]}, {y: [4, 3], xaxis: 'x2', yaxis: 'y2'}],
                    layout: {
                        xaxis2: {domain: [0.6, 0.9]},
                        yaxis2: {domain: [0.6, 0.9]}
                    }
                });

                Plotly.relayout(gd, attr, axLayoutEdits[attr]);
                expectReplot(attr);
            }
        });

        it('should trigger minimal sequence for cartesian axis range updates', function() {
            var seq = ['doTicksRelayout', 'drawData', 'finalDraw'];

            function _assert(msg) {
                expect(gd.calcdata).toBeDefined();
                mockedMethods.forEach(function(m) {
                    expect(subroutines[m].calls.count()).toBe(
                        seq.indexOf(m) === -1 ? 0 : 1,
                        '# of ' + m + ' calls - ' + msg
                    );
                });
            }

            var specs = [
                ['relayout', ['xaxis.range[0]', 0]],
                ['relayout', ['xaxis.range[1]', 3]],
                ['relayout', ['xaxis.range', [-1, 5]]],
                ['update', [{}, {'xaxis.range': [-1, 10]}]]
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

        it('should trigger calc on axis range updates when constraints are present', function() {
            gd = mock({
                data: [{
                    y: [1, 2, 1]
                }],
                layout: {
                    xaxis: {constrain: 'domain'},
                    yaxis: {scaleanchor: 'x'}
                }
            });

            Plotly.relayout(gd, 'xaxis.range[0]', 0);
            expect(gd.calcdata).toBeUndefined();
        });
    });

    describe('Plotly.restyle subroutines switchboard', function() {
        beforeEach(function() {
            spyOn(plotApi, 'plot');
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
        }

        it('calls Scatter.arraysToCalcdata and Plots.style on scatter styling', function() {
            var gd = {
                data: [{x: [1, 2, 3], y: [1, 2, 3]}],
                layout: {}
            };
            mockDefaultsAndCalc(gd);
            Plotly.restyle(gd, {'marker.color': 'red'});
            expect(Scatter.arraysToCalcdata).toHaveBeenCalled();
            expect(Bar.arraysToCalcdata).not.toHaveBeenCalled();
            expect(Plots.style).toHaveBeenCalled();
            expect(plotApi.plot).not.toHaveBeenCalled();
            // "docalc" deletes gd.calcdata - make sure this didn't happen
            expect(gd.calcdata).toBeDefined();
        });

        it('calls Bar.arraysToCalcdata and Plots.style on bar styling', function() {
            var gd = {
                data: [{x: [1, 2, 3], y: [1, 2, 3], type: 'bar'}],
                layout: {}
            };
            mockDefaultsAndCalc(gd);
            Plotly.restyle(gd, {'marker.color': 'red'});
            expect(Scatter.arraysToCalcdata).not.toHaveBeenCalled();
            expect(Bar.arraysToCalcdata).toHaveBeenCalled();
            expect(Plots.style).toHaveBeenCalled();
            expect(plotApi.plot).not.toHaveBeenCalled();
            expect(gd.calcdata).toBeDefined();
        });

        it('should do full replot when arrayOk attributes are updated', function() {
            var gd = {
                data: [{x: [1, 2, 3], y: [1, 2, 3]}],
                layout: {}
            };

            mockDefaultsAndCalc(gd);
            Plotly.restyle(gd, 'marker.color', [['red', 'green', 'blue']]);
            expect(gd.calcdata).toBeUndefined();
            expect(plotApi.plot).toHaveBeenCalled();

            mockDefaultsAndCalc(gd);
            plotApi.plot.calls.reset();
            Plotly.restyle(gd, 'marker.color', 'yellow');
            expect(gd.calcdata).toBeUndefined();
            expect(plotApi.plot).toHaveBeenCalled();

            mockDefaultsAndCalc(gd);
            plotApi.plot.calls.reset();
            Plotly.restyle(gd, 'marker.color', 'blue');
            expect(gd.calcdata).toBeDefined();
            expect(plotApi.plot).not.toHaveBeenCalled();

            mockDefaultsAndCalc(gd);
            plotApi.plot.calls.reset();
            Plotly.restyle(gd, 'marker.color', [['red', 'blue', 'green']]);
            expect(gd.calcdata).toBeUndefined();
            expect(plotApi.plot).toHaveBeenCalled();
        });

        it('should do full replot when arrayOk base attributes are updated', function() {
            var gd = {
                data: [{x: [1, 2, 3], y: [1, 2, 3]}],
                layout: {}
            };

            mockDefaultsAndCalc(gd);
            Plotly.restyle(gd, 'hoverlabel.bgcolor', [['red', 'green', 'blue']]);
            expect(gd.calcdata).toBeUndefined();
            expect(plotApi.plot).toHaveBeenCalled();

            mockDefaultsAndCalc(gd);
            plotApi.plot.calls.reset();
            Plotly.restyle(gd, 'hoverlabel.bgcolor', 'yellow');
            expect(gd.calcdata).toBeUndefined();
            expect(plotApi.plot).toHaveBeenCalled();

            mockDefaultsAndCalc(gd);
            plotApi.plot.calls.reset();
            Plotly.restyle(gd, 'hoverlabel.bgcolor', 'blue');
            expect(gd.calcdata).toBeDefined();
            expect(plotApi.plot).not.toHaveBeenCalled();

            mockDefaultsAndCalc(gd);
            plotApi.plot.calls.reset();
            Plotly.restyle(gd, 'hoverlabel.bgcolor', [['red', 'blue', 'green']]);
            expect(gd.calcdata).toBeUndefined();
            expect(plotApi.plot).toHaveBeenCalled();
        });

        it('should do full replot when attribute container are updated', function() {
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
            });
            expect(gd.calcdata).toBeUndefined();
            expect(plotApi.plot).toHaveBeenCalled();
        });

        it('calls plot on xgap and ygap styling', function() {
            var gd = {
                data: [{z: [[1, 2, 3], [4, 5, 6], [7, 8, 9]], showscale: false, type: 'heatmap'}],
                layout: {}
            };

            mockDefaultsAndCalc(gd);
            Plotly.restyle(gd, {'xgap': 2});
            expect(plotApi.plot).toHaveBeenCalled();

            Plotly.restyle(gd, {'ygap': 2});
            expect(plotApi.plot.calls.count()).toEqual(2);
        });

        it('should clear calcdata when restyling \'zmin\' and \'zmax\' on contour traces', function() {
            var contour = {
                data: [{
                    type: 'contour',
                    z: [[1, 2, 3], [1, 2, 1]]
                }]
            };

            var histogram2dcontour = {
                data: [{
                    type: 'histogram2dcontour',
                    x: [1, 1, 2, 2, 2, 3],
                    y: [0, 0, 0, 0, 1, 3]
                }]
            };

            var mocks = [contour, histogram2dcontour];

            mocks.forEach(function(gd) {
                mockDefaultsAndCalc(gd);
                plotApi.plot.calls.reset();
                Plotly.restyle(gd, 'zmin', 0);
                expect(gd.calcdata).toBeUndefined();
                expect(plotApi.plot).toHaveBeenCalled();

                mockDefaultsAndCalc(gd);
                plotApi.plot.calls.reset();
                Plotly.restyle(gd, 'zmax', 10);
                expect(gd.calcdata).toBeUndefined();
                expect(plotApi.plot).toHaveBeenCalled();
            });
        });

        it('should not clear calcdata when restyling \'zmin\' and \'zmax\' on heatmap traces', function() {
            var heatmap = {
                data: [{
                    type: 'heatmap',
                    z: [[1, 2, 3], [1, 2, 1]]
                }]
            };

            var histogram2d = {
                data: [{
                    type: 'histogram2d',
                    x: [1, 1, 2, 2, 2, 3],
                    y: [0, 0, 0, 0, 1, 3]
                }]
            };

            var mocks = [heatmap, histogram2d];

            mocks.forEach(function(gd) {
                mockDefaultsAndCalc(gd);
                plotApi.plot.calls.reset();
                Plotly.restyle(gd, 'zmin', 0);
                expect(gd.calcdata).toBeDefined();
                expect(plotApi.plot).toHaveBeenCalled();

                mockDefaultsAndCalc(gd);
                plotApi.plot.calls.reset();
                Plotly.restyle(gd, 'zmax', 10);
                expect(gd.calcdata).toBeDefined();
                expect(plotApi.plot).toHaveBeenCalled();
            });
        });

        it('ignores undefined values', function() {
            var gd = {
                data: [{x: [1, 2, 3], y: [1, 2, 3], type: 'scatter'}],
                layout: {}
            };

            mockDefaultsAndCalc(gd);

            // Check to see that the color is updated:
            Plotly.restyle(gd, {'marker.color': 'blue'});
            expect(gd._fullData[0].marker.color).toBe('blue');

            // Check to see that the color is unaffected:
            Plotly.restyle(gd, {'marker.color': undefined});
            expect(gd._fullData[0].marker.color).toBe('blue');
        });

        it('restores null values to defaults', function() {
            var gd = {
                data: [{x: [1, 2, 3], y: [1, 2, 3], type: 'scatter'}],
                layout: {}
            };

            mockDefaultsAndCalc(gd);
            var colorDflt = gd._fullData[0].marker.color;

            // Check to see that the color is updated:
            Plotly.restyle(gd, {'marker.color': 'blue'});
            expect(gd._fullData[0].marker.color).toBe('blue');

            // Check to see that the color is restored to the original default:
            Plotly.restyle(gd, {'marker.color': null});
            expect(gd._fullData[0].marker.color).toBe(colorDflt);
        });

        it('can target specific traces by leaving properties undefined', function() {
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
            Plotly.restyle(gd, {'marker.color': [undefined, 'green']});
            expect(gd._fullData[0].marker.color).toBe(colorDflt[0]);
            expect(gd._fullData[1].marker.color).toBe('green');

            // Check both colors restored to the original default:
            Plotly.restyle(gd, {'marker.color': [null, null]});
            expect(gd._fullData[0].marker.color).toBe(colorDflt[0]);
            expect(gd._fullData[1].marker.color).toBe(colorDflt[1]);
        });
    });

    describe('Plotly.restyle unmocked', function() {
        var gd;

        beforeEach(function() {
            gd = createGraphDiv();

            // some of these tests use the undo/redo queue
            // OK, this is weird... the undo/redo queue length is a global config only.
            // It's ignored on the plot, even though the queue itself is per-plot.
            // We may ditch this later, but probably not until v2
            Plotly.setPlotConfig({queueLength: 3});
        });

        afterEach(function() {
            destroyGraphDiv();
            Plotly.setPlotConfig({queueLength: 0});
        });

        it('should redo auto z/contour when editing z array', function(done) {
            Plotly.plot(gd, [{type: 'contour', z: [[1, 2], [3, 4]]}]).then(function() {
                expect(gd.data[0].zauto).toBe(true, gd.data[0]);
                expect(gd.data[0].zmin).toBe(1);
                expect(gd.data[0].zmax).toBe(4);

                expect(gd.data[0].autocontour).toBe(true);
                expect(gd.data[0].contours).toEqual({start: 1.5, end: 3.5, size: 0.5});

                return Plotly.restyle(gd, {'z[0][0]': 10});
            }).then(function() {
                expect(gd.data[0].zmin).toBe(2);
                expect(gd.data[0].zmax).toBe(10);

                expect(gd.data[0].contours).toEqual({start: 3, end: 9, size: 1});
            })
            .catch(failTest)
            .then(done);
        });

        it('errors if child and parent are edited together', function(done) {
            var edit1 = {rando: [[{a: 1}, {b: 2}]]};
            var edit2 = {'rando[1]': {c: 3}};
            var edit3 = {'rando[1].d': 4};

            Plotly.plot(gd, [{x: [1, 2, 3], y: [1, 2, 3], type: 'scatter'}])
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
            .catch(failTest)
            .then(done);
        });

        it('turns off zauto when you edit zmin or zmax', function(done) {
            var zmin0 = 2;
            var zmax1 = 10;

            function check(auto, msg) {
                expect(gd.data[0].zmin).negateIf(auto).toBe(zmin0, msg);
                expect(gd.data[0].zauto).toBe(auto, msg);
                expect(gd.data[1].zmax).negateIf(auto).toBe(zmax1, msg);
                expect(gd.data[1].zauto).toBe(auto, msg);
            }

            Plotly.plot(gd, [
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
            .catch(failTest)
            .then(done);
        });

        it('turns off cauto (autocolorscale) when you edit cmin or cmax (colorscale)', function(done) {
            var autocscale = require('@src/components/colorscale/scales').Reds;

            var mcmin0 = 3;
            var mcscl0 = 'rainbow';
            var mlcmax1 = 6;
            var mlcscl1 = 'greens';

            function check(auto, autocolorscale, msg) {
                expect(gd.data[0].marker.cauto).toBe(auto, msg);
                expect(gd.data[0].marker.cmin).negateIf(auto).toBe(mcmin0);
                expect(gd._fullData[0].marker.autocolorscale).toBe(autocolorscale, msg);
                expect(gd.data[0].marker.colorscale).toEqual(auto ? autocscale : mcscl0);
                expect(gd.data[1].marker.line.cauto).toBe(auto, msg);
                expect(gd.data[1].marker.line.cmax).negateIf(auto).toBe(mlcmax1);
                expect(gd._fullData[1].marker.line.autocolorscale).toBe(autocolorscale, msg);
                expect(gd.data[1].marker.line.colorscale).toEqual(auto ? autocscale : mlcscl1);
            }

            Plotly.plot(gd, [
                {y: [1, 2], mode: 'markers', marker: {color: [1, 10]}},
                {y: [2, 1], mode: 'markers', marker: {line: {width: 2, color: [3, 4]}}}
            ])
            .then(function() {
                // autocolorscale is actually true after supplyDefaults, but during calc it's set
                // to false when we push the resulting colorscale back to the input container
                check(true, false, 'initial');
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
            .catch(failTest)
            .then(done);
        });

        it('turns off autobin when you edit bin specs', function(done) {
            var start0 = 0.2;
            var end1 = 6;
            var size1 = 0.5;

            function check(auto, msg) {
                expect(gd.data[0].autobinx).toBe(auto, msg);
                expect(gd.data[0].xbins.start).negateIf(auto).toBe(start0, msg);
                expect(gd.data[1].autobinx).toBe(auto, msg);
                expect(gd.data[1].autobiny).toBe(auto, msg);
                expect(gd.data[1].xbins.end).negateIf(auto).toBe(end1, msg);
                expect(gd.data[1].ybins.size).negateIf(auto).toBe(size1, msg);
            }

            Plotly.plot(gd, [
                {x: [1, 1, 1, 1, 2, 2, 2, 3, 3, 4], type: 'histogram'},
                {x: [1, 1, 2, 2, 3, 3, 4, 4], y: [1, 1, 2, 2, 3, 3, 4, 4], type: 'histogram2d'}
            ])
            .then(function() {
                check(true, 'initial');
                return Plotly.restyle(gd, 'xbins.start', start0, [0]);
            })
            .then(function() {
                return Plotly.restyle(gd, {'xbins.end': end1, 'ybins.size': size1}, null, [1]);
            })
            .then(function() {
                check(false, 'set start/end/size');
                return Plotly.restyle(gd, {autobinx: true, autobiny: true});
            })
            .then(function() {
                check(true, 'reset');
                return Queue.undo(gd);
            })
            .then(function() {
                check(false, 'undo');
            })
            .catch(failTest)
            .then(done);
        });

        it('turns off autocontour when you edit contour specs', function(done) {
            var start0 = 1.7;
            var size1 = 0.6;

            function check(auto, msg) {
                expect(gd.data[0].autocontour).toBe(auto, msg);
                expect(gd.data[1].autocontour).toBe(auto, msg);
                expect(gd.data[0].contours.start).negateIf(auto).toBe(start0, msg);
                expect(gd.data[1].contours.size).negateIf(auto).toBe(size1, msg);
            }

            Plotly.plot(gd, [
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
            .catch(failTest)
            .then(done);
        });

        it('sets x/ytype scaled when editing heatmap x0/dx/y0/dy', function(done) {
            var x0 = 3;
            var dy = 5;

            function check(scaled, msg) {
                expect(gd.data[0].x0).negateIf(!scaled).toBe(x0, msg);
                expect(gd.data[0].xtype).toBe(scaled ? 'scaled' : undefined, msg);
                expect(gd.data[0].dy).negateIf(!scaled).toBe(dy, msg);
                expect(gd.data[0].ytype).toBe(scaled ? 'scaled' : undefined, msg);
            }

            Plotly.plot(gd, [{x: [1, 2, 4], y: [2, 3, 5], z: [[1, 2], [3, 4]], type: 'heatmap'}])
            .then(function() {
                check(false, 'initial');
                return Plotly.restyle(gd, {x0: x0, dy: dy});
            })
            .then(function() {
                check(true, 'set x0 & dy');
                return Queue.undo(gd);
            })
            .then(function() {
                check(false, 'undo');
            })
            .catch(failTest)
            .then(done);
        });

        it('sets colorbar.tickmode to linear when editing colorbar.tick0/dtick', function(done) {
            // note: this *should* apply to marker.colorbar etc too but currently that's not implemented
            // once we get this all in the schema it will work though.
            var tick00 = 0.33;
            var dtick1 = 0.8;

            function check(auto, msg) {
                expect(gd._fullData[0].colorbar.tick0).negateIf(auto).toBe(tick00, msg);
                expect(gd._fullData[0].colorbar.tickmode).toBe(auto ? 'auto' : 'linear', msg);
                expect(gd._fullData[1].colorbar.dtick).negateIf(auto).toBe(dtick1, msg);
                expect(gd._fullData[1].colorbar.tickmode).toBe(auto ? 'auto' : 'linear', msg);
            }

            Plotly.plot(gd, [
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
            .catch(failTest)
            .then(done);
        });

        it('updates colorbars when editing bar charts', function(done) {
            var mock = require('@mocks/bar-colorscale-colorbar.json');

            Plotly.newPlot(gd, mock.data, mock.layout)
            .then(function() {
                expect(d3.select('.cbaxis text').node().style.fill).not.toBe('rgb(255, 0, 0)');

                return Plotly.restyle(gd, {'marker.colorbar.tickfont.color': 'rgb(255, 0, 0)'});
            })
            .then(function() {
                expect(d3.select('.cbaxis text').node().style.fill).toBe('rgb(255, 0, 0)');

                return Plotly.restyle(gd, {'marker.showscale': false});
            })
            .then(function() {
                expect(d3.select('.cbaxis').size()).toBe(0);
            })
            .catch(failTest)
            .then(done);
        });

        it('updates colorbars when editing gl3d plots', function(done) {
            Plotly.newPlot(gd, [{z: [[1, 2], [3, 6]], type: 'surface'}])
            .then(function() {
                expect(d3.select('.cbaxis text').node().style.fill).not.toBe('rgb(255, 0, 0)');

                return Plotly.restyle(gd, {'colorbar.tickfont.color': 'rgb(255, 0, 0)'});
            })
            .then(function() {
                expect(d3.select('.cbaxis text').node().style.fill).toBe('rgb(255, 0, 0)');

                return Plotly.restyle(gd, {'showscale': false});
            })
            .then(function() {
                expect(d3.select('.cbaxis').size()).toBe(0);
            })
            .catch(failTest)
            .then(done);
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
            .catch(failTest)
            .then(done);
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
            .catch(failTest)
            .then(done);
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
            .catch(failTest)
            .then(done);
        });
    });

    describe('Plotly.deleteTraces', function() {
        var gd;

        beforeEach(function() {
            gd = {
                data: [
                    {'name': 'a'},
                    {'name': 'b'},
                    {'name': 'c'},
                    {'name': 'd'}
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
                {'name': 'a'},
                {'name': 'b'},
                {'name': 'c'}
            ];

            Plotly.deleteTraces(gd, -1);
            expect(gd.data).toEqual(expectedData);
            expect(plotApi.redraw).toHaveBeenCalled();
        });

        it('should work when multiple traces are deleted', function() {
            var expectedData = [
                {'name': 'b'},
                {'name': 'c'}
            ];

            Plotly.deleteTraces(gd, [0, 3]);
            expect(gd.data).toEqual(expectedData);
            expect(plotApi.redraw).toHaveBeenCalled();
        });

        it('should work when indices are not sorted', function() {
            var expectedData = [
                {'name': 'b'},
                {'name': 'c'}
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
            gd = { data: [{'name': 'a'}, {'name': 'b'}] };
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
            Plotly.addTraces(gd, [{'name': 'c'}, {'name': 'd'}]);
            expect(gd.data[2].name).toBeDefined();
            expect(gd.data[3].name).toBeDefined();
            expect(plotApi.redraw).toHaveBeenCalled();
            expect(plotApi.moveTraces).not.toHaveBeenCalled();
        });

        it('should work when newIndices is defined', function() {
            Plotly.addTraces(gd, [{'name': 'c'}, {'name': 'd'}], [1, 3]);
            expect(gd.data[2].name).toBeDefined();
            expect(gd.data[3].name).toBeDefined();
            expect(plotApi.redraw).not.toHaveBeenCalled();
            expect(plotApi.moveTraces).toHaveBeenCalledWith(gd, [-2, -1], [1, 3]);
        });

        it('should work when newIndices has negative indices', function() {
            Plotly.addTraces(gd, [{'name': 'c'}, {'name': 'd'}], [-3, -1]);
            expect(gd.data[2].name).toBeDefined();
            expect(gd.data[3].name).toBeDefined();
            expect(plotApi.redraw).not.toHaveBeenCalled();
            expect(plotApi.moveTraces).toHaveBeenCalledWith(gd, [-2, -1], [-3, -1]);
        });

        it('should work when newIndices is an integer', function() {
            Plotly.addTraces(gd, {'name': 'c'}, 0);
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
                    {'name': 'a'},
                    {'name': 'b'},
                    {'name': 'c'},
                    {'name': 'd'}
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
                {'name': 'b'},
                {'name': 'a'},
                {'name': 'c'},
                {'name': 'd'}
            ];

            Plotly.moveTraces(gd, 0, 1);
            expect(gd.data).toEqual(expectedData);
            expect(plotApi.redraw).toHaveBeenCalled();

        });

        it('handle unsorted currentIndices', function() {
            var expectedData = [
                {'name': 'd'},
                {'name': 'a'},
                {'name': 'c'},
                {'name': 'b'}
            ];

            Plotly.moveTraces(gd, [3, 1], [0, 3]);
            expect(gd.data).toEqual(expectedData);
            expect(plotApi.redraw).toHaveBeenCalled();

        });

        it('work when newIndices are undefined.', function() {
            var expectedData = [
                {'name': 'b'},
                {'name': 'c'},
                {'name': 'd'},
                {'name': 'a'}
            ];

            Plotly.moveTraces(gd, [3, 0]);
            expect(gd.data).toEqual(expectedData);
            expect(plotApi.redraw).toHaveBeenCalled();

        });

        it('accept negative indices.', function() {
            var expectedData = [
                {'name': 'a'},
                {'name': 'c'},
                {'name': 'b'},
                {'name': 'd'}
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

            if(!Plotly.Queue) {
                Plotly.Queue = {
                    add: function() {},
                    startSequence: function() {},
                    endSequence: function() {}
                };
            }

            spyOn(plotApi, 'redraw');
            spyOn(Plotly.Queue, 'add');
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
            expect(Plotly.Queue.add).toHaveBeenCalled();

            var undoArgs = Plotly.Queue.add.calls.first().args[2];

            Plotly.prependTraces.apply(null, undoArgs);

            expect(gd.data).toEqual(cachedData);
        });

        it('extend is the inverse of prepend - no maxPoints', function() {
            var cachedData = Lib.extendDeep([], gd.data);

            Plotly.prependTraces(gd, {
                x: [[3, 4], [4, 5]], 'marker.size': [[0, -1], [5, 6]]
            }, [0, 1]);

            expect(gd.data).not.toEqual(cachedData);
            expect(Plotly.Queue.add).toHaveBeenCalled();

            var undoArgs = Plotly.Queue.add.calls.first().args[2];

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
            expect(Plotly.Queue.add).toHaveBeenCalled();

            var undoArgs = Plotly.Queue.add.calls.first().args[2];

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
                expect(Plotly.Queue.add).toHaveBeenCalled();

                expect(gd.data[0].x).toEqual(expectations.newArray);
                expect(gd.data[1].x).toEqual(new Float32Array(expectations.newArray));

                var cont = Plotly.Queue.add.calls.first().args[2][1].x;
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

            Plotly.plot(gd, mockData).then(function() {
                Plotly.purge(gd);

                expect(Object.keys(gd)).toEqual(initialKeys);
                expect(gd.innerHTML).toEqual(intialHTML);
            })
            .catch(failTest)
            .then(done);
        });
    });

    describe('Plotly.redraw', function() {

        afterEach(destroyGraphDiv);

        it('', function(done) {
            var gd = createGraphDiv(),
                initialData = [],
                layout = { title: 'Redraw' };

            Plotly.newPlot(gd, initialData, layout);

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

            Plotly.redraw(gd)
            .then(function() {
                expect(d3.selectAll('g.trace.scatter').size()).toEqual(3);
            })
            .catch(failTest)
            .then(done);
        });
    });

    describe('cleanData & cleanLayout', function() {
        var gd;

        beforeEach(function() {
            gd = createGraphDiv();
        });

        afterEach(destroyGraphDiv);

        it('should rename \'YIGnBu\' colorscales YlGnBu (2dMap case)', function() {
            var data = [{
                type: 'heatmap',
                colorscale: 'YIGnBu'
            }];

            Plotly.plot(gd, data);
            expect(gd.data[0].colorscale).toBe('YlGnBu');
        });

        it('should rename \'YIGnBu\' colorscales YlGnBu (markerColorscale case)', function() {
            var data = [{
                type: 'scattergeo',
                marker: { colorscale: 'YIGnBu' }
            }];

            Plotly.plot(gd, data);
            expect(gd.data[0].marker.colorscale).toBe('YlGnBu');
        });

        it('should rename \'YIOrRd\' colorscales YlOrRd (2dMap case)', function() {
            var data = [{
                type: 'contour',
                colorscale: 'YIOrRd'
            }];

            Plotly.plot(gd, data);
            expect(gd.data[0].colorscale).toBe('YlOrRd');
        });

        it('should rename \'YIOrRd\' colorscales YlOrRd (markerColorscale case)', function() {
            var data = [{
                type: 'scattergeo',
                marker: { colorscale: 'YIOrRd' }
            }];

            Plotly.plot(gd, data);
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

            Plotly.plot(gd, data);

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

            Plotly.plot(gd, data);

            expect(Plots.subplotsRegistry.gl3d.plot).toHaveBeenCalled();

            var contours = gd.data[0].contours;

            expect(contours.x).toBeUndefined();
            expect(contours.y.highlightwidth).toEqual('blue');
            expect(contours.z.highlightWidth).toBeUndefined();
            expect(contours.z.highlightwidth).toEqual('red');

            expect(gd.data[1].contours).toBeUndefined();
        });

        it('should rename *filtersrc* to *target* in filter transforms', function() {
            var data = [{
                transforms: [{
                    type: 'filter',
                    filtersrc: 'y'
                }, {
                    type: 'filter',
                    operation: '<'
                }]
            }, {
                transforms: [{
                    type: 'filter',
                    target: 'y'
                }]
            }];

            Plotly.plot(gd, data);

            var trace0 = gd.data[0],
                trace1 = gd.data[1];

            expect(trace0.transforms.length).toEqual(2);
            expect(trace0.transforms[0].filtersrc).toBeUndefined();
            expect(trace0.transforms[0].target).toEqual('y');

            expect(trace1.transforms.length).toEqual(1);
            expect(trace1.transforms[0].target).toEqual('y');
        });

        it('should rename *calendar* to *valuecalendar* in filter transforms', function() {
            var data = [{
                transforms: [{
                    type: 'filter',
                    target: 'y',
                    calendar: 'hebrew'
                }, {
                    type: 'filter',
                    operation: '<'
                }]
            }, {
                transforms: [{
                    type: 'filter',
                    valuecalendar: 'jalali'
                }]
            }];

            Plotly.plot(gd, data);

            var trace0 = gd.data[0],
                trace1 = gd.data[1];

            expect(trace0.transforms.length).toEqual(2);
            expect(trace0.transforms[0].calendar).toBeUndefined();
            expect(trace0.transforms[0].valuecalendar).toEqual('hebrew');

            expect(trace1.transforms.length).toEqual(1);
            expect(trace1.transforms[0].valuecalendar).toEqual('jalali');
        });

        it('should cleanup annotations / shapes refs', function() {
            var data = [{}];

            var layout = {
                annotations: [
                    { ref: 'paper' },
                    null,
                    { xref: 'x02', yref: 'y1' }
                ],
                shapes: [
                    { xref: 'y', yref: 'x' },
                    null,
                    { xref: 'x03', yref: 'y1' }
                ]
            };

            Plotly.plot(gd, data, layout);

            expect(gd.layout.annotations[0]).toEqual({ xref: 'paper', yref: 'paper' });
            expect(gd.layout.annotations[1]).toEqual(null);
            expect(gd.layout.annotations[2]).toEqual({ xref: 'x2', yref: 'y' });

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

            Plotly.plot(gd, data);

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

            Plotly.plot(gd, data).then(function() {

                return Plotly.newPlot(gd, data, { height: height });
            })
            .then(function() {
                var fullLayout = gd._fullLayout;
                var svg = document.getElementsByClassName('main-svg')[0];

                expect(fullLayout.height).toBe(height);
                expect(+svg.getAttribute('height')).toBe(height);
            })
            .catch(failTest)
            .then(done);
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
            gd = createGraphDiv();
            Plotly.plot(gd, [{ y: [2, 1, 2] }]).then(function() {
                data = gd.data;
                layout = gd.layout;
                calcdata = gd.calcdata;
            })
            .catch(failTest)
            .then(done);
        });

        afterEach(destroyGraphDiv);

        it('call doTraceStyle on trace style updates', function(done) {
            expect(subroutines.doTraceStyle).not.toHaveBeenCalled();

            Plotly.update(gd, { 'marker.color': 'blue' }).then(function() {
                expect(subroutines.doTraceStyle).toHaveBeenCalledTimes(1);
                expect(calcdata).toBe(gd.calcdata);
            })
            .catch(failTest)
            .then(done);
        });

        it('clear calcdata on data updates', function(done) {
            Plotly.update(gd, { x: [[3, 1, 3]] }).then(function() {
                expect(data).toBe(gd.data);
                expect(layout).toBe(gd.layout);
                expect(calcdata).not.toBe(gd.calcdata);
            })
            .catch(failTest)
            .then(done);
        });

        it('clear calcdata on data + axis updates w/o extending current gd.data', function(done) {
            var traceUpdate = {
                x: [[3, 1, 3]]
            };

            var layoutUpdate = {
                xaxis: {title: 'A', type: '-'}
            };

            Plotly.update(gd, traceUpdate, layoutUpdate).then(function() {
                expect(data).toBe(gd.data);
                expect(layout).toBe(gd.layout);
                expect(calcdata).not.toBe(gd.calcdata);

                expect(gd.data.length).toEqual(1);
            })
            .catch(failTest)
            .then(done);
        });

        it('call doLegend on legend updates', function(done) {
            expect(subroutines.doLegend).not.toHaveBeenCalled();

            Plotly.update(gd, {}, { 'showlegend': true }).then(function() {
                expect(subroutines.doLegend).toHaveBeenCalledTimes(1);
                expect(calcdata).toBe(gd.calcdata);
            })
            .catch(failTest)
            .then(done);
        });

        it('call layoutReplot when adding update menu', function(done) {
            expect(subroutines.layoutReplot).not.toHaveBeenCalled();

            var layoutUpdate = {
                updatemenus: [{
                    buttons: [{
                        method: 'relayout',
                        args: ['title', 'Hello World']
                    }]
                }]
            };

            Plotly.update(gd, {}, layoutUpdate).then(function() {
                expect(subroutines.doLegend).toHaveBeenCalledTimes(1);
                expect(calcdata).toBe(gd.calcdata);
            })
            .catch(failTest)
            .then(done);
        });

        it('call doModeBar when updating \'dragmode\'', function(done) {
            expect(subroutines.doModeBar).not.toHaveBeenCalled();

            Plotly.update(gd, {}, { 'dragmode': 'pan' }).then(function() {
                expect(subroutines.doModeBar).toHaveBeenCalledTimes(1);
                expect(calcdata).toBe(gd.calcdata);
            })
            .catch(failTest)
            .then(done);
        });
    });

    describe('@noCIdep Plotly.react', function() {
        var mockedMethods = [
            'doTraceStyle',
            'doColorBars',
            'doLegend',
            'layoutStyles',
            'doTicksRelayout',
            'doModeBar',
            'doCamera'
        ];

        var gd;
        var plotCalls;

        beforeEach(function() {
            gd = createGraphDiv();

            mockedMethods.forEach(function(m) {
                spyOn(subroutines, m).and.callThrough();
                subroutines[m].calls.reset();
            });

            spyOn(annotations, 'drawOne').and.callThrough();
            spyOn(annotations, 'draw').and.callThrough();
            spyOn(images, 'draw').and.callThrough();
        });

        afterEach(destroyGraphDiv);

        function countPlots() {
            plotCalls = 0;

            gd.on('plotly_afterplot', function() { plotCalls++; });
            subroutines.layoutStyles.calls.reset();
            annotations.draw.calls.reset();
            annotations.drawOne.calls.reset();
            images.draw.calls.reset();
        }

        function countCalls(counts) {
            var callsFinal = Lib.extendFlat({}, counts);
            callsFinal.layoutStyles = (counts.layoutStyles || 0) + (counts.plot || 0);

            mockedMethods.forEach(function(m) {
                expect(subroutines[m]).toHaveBeenCalledTimes(callsFinal[m] || 0);
                subroutines[m].calls.reset();
            });

            expect(plotCalls).toBe(counts.plot || 0, 'calls to Plotly.plot');
            plotCalls = 0;

            // only consider annotation and image draw calls if we *don't* do a full plot.
            if(!counts.plot) {
                expect(annotations.draw).toHaveBeenCalledTimes(counts.annotationDraw || 0);
                expect(annotations.drawOne).toHaveBeenCalledTimes(counts.annotationDrawOne || 0);
                expect(images.draw).toHaveBeenCalledTimes(counts.imageDraw || 0);
            }
            annotations.draw.calls.reset();
            annotations.drawOne.calls.reset();
            images.draw.calls.reset();
        }

        it('can add / remove traces', function(done) {
            var data1 = [{y: [1, 2, 3], mode: 'markers'}];
            var data2 = [data1[0], {y: [2, 3, 1], mode: 'markers'}];
            var layout = {};
            Plotly.newPlot(gd, data1, layout)
            .then(countPlots)
            .then(function() {
                expect(d3.selectAll('.point').size()).toBe(3);

                return Plotly.react(gd, data2, layout);
            })
            .then(function() {
                expect(d3.selectAll('.point').size()).toBe(6);

                return Plotly.react(gd, data1, layout);
            })
            .then(function() {
                expect(d3.selectAll('.point').size()).toBe(3);
            })
            .catch(failTest)
            .then(done);
        });

        it('should notice new data by ===, without layout.datarevision', function(done) {
            var data = [{y: [1, 2, 3], mode: 'markers'}];
            var layout = {};

            Plotly.newPlot(gd, data, layout)
            .then(countPlots)
            .then(function() {
                expect(d3.selectAll('.point').size()).toBe(3);

                data[0].y.push(4);
                return Plotly.react(gd, data, layout);
            })
            .then(function() {
                // didn't pick it up, as we modified in place!!!
                expect(d3.selectAll('.point').size()).toBe(3);

                data[0].y = [1, 2, 3, 4, 5];
                return Plotly.react(gd, data, layout);
            })
            .then(function() {
                // new object, we picked it up!
                expect(d3.selectAll('.point').size()).toBe(5);

                countCalls({plot: 1});
            })
            .catch(failTest)
            .then(done);
        });

        it('should notice new layout.datarevision', function(done) {
            var data = [{y: [1, 2, 3], mode: 'markers'}];
            var layout = {datarevision: 1};

            Plotly.newPlot(gd, data, layout)
            .then(countPlots)
            .then(function() {
                expect(d3.selectAll('.point').size()).toBe(3);

                data[0].y.push(4);
                return Plotly.react(gd, data, layout);
            })
            .then(function() {
                // didn't pick it up, as we didn't modify datarevision
                expect(d3.selectAll('.point').size()).toBe(3);

                data[0].y.push(5);
                layout.datarevision = 'bananas';
                return Plotly.react(gd, data, layout);
            })
            .then(function() {
                // new revision, we picked it up!
                expect(d3.selectAll('.point').size()).toBe(5);

                countCalls({plot: 1});
            })
            .catch(failTest)
            .then(done);
        });

        it('picks up partial redraws', function(done) {
            var data = [{y: [1, 2, 3], mode: 'markers'}];
            var layout = {};

            Plotly.newPlot(gd, data, layout)
            .then(countPlots)
            .then(function() {
                layout.title = 'XXXXX';
                layout.hovermode = 'closest';
                data[0].marker = {color: 'rgb(0, 100, 200)'};
                return Plotly.react(gd, data, layout);
            })
            .then(function() {
                countCalls({layoutStyles: 1, doTraceStyle: 1, doModeBar: 1});
                expect(d3.select('.gtitle').text()).toBe('XXXXX');
                var points = d3.selectAll('.point');
                expect(points.size()).toBe(3);
                points.each(function() {
                    expect(window.getComputedStyle(this).fill).toBe('rgb(0, 100, 200)');
                });

                layout.showlegend = true;
                layout.xaxis.tick0 = 0.1;
                layout.xaxis.dtick = 0.3;
                return Plotly.react(gd, data, layout);
            })
            .then(function() {
                // legend and ticks get called initially, but then plot gets added during automargin
                countCalls({doLegend: 1, doTicksRelayout: 1, plot: 1});

                data = [{z: [[1, 2], [3, 4]], type: 'surface'}];
                layout = {};

                return Plotly.react(gd, data, layout);
            })
            .then(function() {
                // we get an extra call to layoutStyles from marginPushersAgain due to the colorbar.
                // Really need to simplify that pipeline...
                countCalls({plot: 1, layoutStyles: 1});

                layout.scene.camera = {up: {x: 1, y: -1, z: 0}};

                return Plotly.react(gd, data, layout);
            })
            .then(function() {
                countCalls({doCamera: 1});

                data[0].type = 'heatmap';
                delete layout.scene;
                return Plotly.react(gd, data, layout);
            })
            .then(function() {
                countCalls({plot: 1});

                // ideally we'd just do this with `surface` but colorbar attrs have editType 'calc' there
                // TODO: can we drop them to type: 'colorbars' even for the 3D types?
                data[0].colorbar = {len: 0.6};
                return Plotly.react(gd, data, layout);
            })
            .then(function() {
                countCalls({doColorBars: 1, plot: 1});
            })
            .catch(failTest)
            .then(done);
        });

        it('picks up minimal sequence for cartesian axis range updates', function(done) {
            var data = [{y: [1, 2, 1]}];
            var layout = {xaxis: {range: [1, 2]}};
            var layout2 = {xaxis: {range: [0, 1]}};

            Plotly.newPlot(gd, data, layout)
            .then(countPlots)
            .then(function() {
                return Plotly.react(gd, data, layout2);
            })
            .then(function() {
                expect(subroutines.doTicksRelayout).toHaveBeenCalledTimes(1);
                expect(subroutines.layoutStyles).not.toHaveBeenCalled();
            })
            .catch(failTest)
            .then(done);
        });

        it('redraws annotations one at a time', function(done) {
            var data = [{y: [1, 2, 3], mode: 'markers'}];
            var layout = {};
            var ymax;

            Plotly.newPlot(gd, data, layout)
            .then(countPlots)
            .then(function() {
                ymax = layout.yaxis.range[1];

                layout.annotations = [{
                    x: 1,
                    y: 4,
                    text: 'Way up high',
                    showarrow: false
                }, {
                    x: 1,
                    y: 2,
                    text: 'On the data',
                    showarrow: false
                }];
                return Plotly.react(gd, data, layout);
            })
            .then(function() {
                // autoranged - so we get a full replot
                countCalls({plot: 1});
                expect(d3.selectAll('.annotation').size()).toBe(2);

                layout.annotations[1].bgcolor = 'rgb(200, 100, 0)';
                return Plotly.react(gd, data, layout);
            })
            .then(function() {
                countCalls({annotationDrawOne: 1});
                expect(window.getComputedStyle(d3.select('.annotation[data-index="1"] .bg').node()).fill)
                    .toBe('rgb(200, 100, 0)');
                expect(layout.yaxis.range[1]).not.toBeCloseTo(ymax, 0);

                layout.annotations[0].font = {color: 'rgb(0, 255, 0)'};
                layout.annotations[1].bgcolor = 'rgb(0, 0, 255)';
                return Plotly.react(gd, data, layout);
            })
            .then(function() {
                countCalls({annotationDrawOne: 2});
                expect(window.getComputedStyle(d3.select('.annotation[data-index="0"] text').node()).fill)
                    .toBe('rgb(0, 255, 0)');
                expect(window.getComputedStyle(d3.select('.annotation[data-index="1"] .bg').node()).fill)
                    .toBe('rgb(0, 0, 255)');

                Lib.extendFlat(layout.annotations[0], {yref: 'paper', y: 0.8});

                return Plotly.react(gd, data, layout);
            })
            .then(function() {
                countCalls({plot: 1});
                expect(layout.yaxis.range[1]).toBeCloseTo(ymax, 0);
            })
            .catch(failTest)
            .then(done);
        });

        it('redraws images all at once', function(done) {
            var data = [{y: [1, 2, 3], mode: 'markers'}];
            var layout = {};
            var jsLogo = 'https://images.plot.ly/language-icons/api-home/js-logo.png';

            var x, y, height, width;

            Plotly.newPlot(gd, data, layout)
            .then(countPlots)
            .then(function() {
                layout.images = [{
                    source: jsLogo,
                    xref: 'paper',
                    yref: 'paper',
                    x: 0.1,
                    y: 0.1,
                    sizex: 0.2,
                    sizey: 0.2
                }, {
                    source: jsLogo,
                    xref: 'x',
                    yref: 'y',
                    x: 1,
                    y: 2,
                    sizex: 1,
                    sizey: 1
                }];
                Plotly.react(gd, data, layout);
            })
            .then(function() {
                countCalls({imageDraw: 1});
                expect(d3.selectAll('image').size()).toBe(2);

                var n = d3.selectAll('image').node();
                x = n.attributes.x.value;
                y = n.attributes.y.value;
                height = n.attributes.height.value;
                width = n.attributes.width.value;

                layout.images[0].y = 0.8;
                layout.images[0].sizey = 0.4;
                Plotly.react(gd, data, layout);
            })
            .then(function() {
                countCalls({imageDraw: 1});
                var n = d3.selectAll('image').node();
                expect(n.attributes.x.value).toBe(x);
                expect(n.attributes.width.value).toBe(width);
                expect(n.attributes.y.value).not.toBe(y);
                expect(n.attributes.height.value).not.toBe(height);
            })
            .catch(failTest)
            .then(done);
        });

        it('can change config, and always redraws', function(done) {
            var data = [{y: [1, 2, 3]}];
            var layout = {};

            Plotly.newPlot(gd, data, layout)
            .then(countPlots)
            .then(function() {
                expect(d3.selectAll('.drag').size()).toBe(11);
                expect(d3.selectAll('.gtitle').size()).toBe(0);

                return Plotly.react(gd, data, layout, {editable: true});
            })
            .then(function() {
                expect(d3.selectAll('.drag').size()).toBe(11);
                expect(d3.selectAll('.gtitle').text()).toBe('Click to enter Plot title');
                countCalls({plot: 1});

                return Plotly.react(gd, data, layout, {staticPlot: true});
            })
            .then(function() {
                expect(d3.selectAll('.drag').size()).toBe(0);
                expect(d3.selectAll('.gtitle').size()).toBe(0);
                countCalls({plot: 1});

                return Plotly.react(gd, data, layout, {});
            })
            .then(function() {
                expect(d3.selectAll('.drag').size()).toBe(11);
                expect(d3.selectAll('.gtitle').size()).toBe(0);
                countCalls({plot: 1});
            })
            .catch(failTest)
            .then(done);
        });

        it('can put polar plots into staticPlot mode', function(done) {
            // tested separately since some of the relevant code is actually
            // in cartesian/graph_interact... hopefully we'll fix that
            // sometime and the test will still pass.
            var data = [{r: [1, 2, 3], theta: [0, 120, 240], type: 'scatterpolar'}];
            var layout = {};

            Plotly.newPlot(gd, data, layout)
            .then(countPlots)
            .then(function() {
                expect(d3.select(gd).selectAll('.drag').size()).toBe(3);

                return Plotly.react(gd, data, layout, {staticPlot: true});
            })
            .then(function() {
                expect(d3.select(gd).selectAll('.drag').size()).toBe(0);

                return Plotly.react(gd, data, layout, {});
            })
            .then(function() {
                expect(d3.select(gd).selectAll('.drag').size()).toBe(3);
            })
            .catch(failTest)
            .then(done);
        });

        it('can change data in candlesticks multiple times', function(done) {
            // test that we've fixed the original issue in
            // https://github.com/plotly/plotly.js/issues/2510

            function assertCalc(open, high, low, close) {
                expect(gd.calcdata[0][0]).toEqual(jasmine.objectContaining({
                    min: low,
                    max: high,
                    med: close,
                    q1: Math.min(open, close),
                    q3: Math.max(open, close),
                    dir: close >= open ? 'increasing' : 'decreasing'
                }));
            }
            var trace = {
                type: 'candlestick',
                low: [1],
                open: [2],
                close: [3],
                high: [4]
            };
            Plotly.newPlot(gd, [trace])
            .then(function() {
                assertCalc(2, 4, 1, 3);

                trace.low = [0];
                return Plotly.react(gd, [trace]);
            })
            .then(function() {
                assertCalc(2, 4, 0, 3);

                trace.low = [-1];
                return Plotly.react(gd, [trace]);
            })
            .then(function() {
                assertCalc(2, 4, -1, 3);

                trace.close = [1];
                return Plotly.react(gd, [trace]);
            })
            .then(function() {
                assertCalc(2, 4, -1, 1);
            })
            .catch(failTest)
            .then(done);
        });

        function aggregatedPie(i) {
            var labels = i <= 1 ?
                ['A', 'B', 'A', 'C', 'A', 'B', 'C', 'A', 'B', 'C', 'A'] :
                ['X', 'Y', 'Z', 'Z', 'Y', 'Z', 'X', 'Z', 'Y', 'Z', 'X'];
            var trace = {
                type: 'pie',
                values: [4, 1, 4, 4, 1, 4, 4, 2, 1, 1, 15],
                labels: labels,
                transforms: [{
                    type: 'aggregate',
                    groups: labels,
                    aggregations: [{target: 'values', func: 'sum'}]
                }]
            };
            return {
                data: [trace],
                layout: {
                    datarevision: i,
                    colorway: ['red', 'orange', 'yellow', 'green', 'blue', 'violet']
                }
            };
        }

        var aggPie1CD = [[
            {v: 26, label: 'A', color: 'red', i: 0},
            {v: 9, label: 'C', color: 'orange', i: 2},
            {v: 6, label: 'B', color: 'yellow', i: 1}
        ]];

        var aggPie2CD = [[
            {v: 23, label: 'X', color: 'red', i: 0},
            {v: 15, label: 'Z', color: 'orange', i: 2},
            {v: 3, label: 'Y', color: 'yellow', i: 1}
        ]];

        function aggregatedScatter(i) {
            return {
                data: [{
                    x: [1, 2, 3, 4, 6, 5],
                    y: [2, 1, 3, 5, 6, 4],
                    transforms: [{
                        type: 'aggregate',
                        groups: [1, -1, 1, -1, 1, -1],
                        aggregations: i > 1 ? [{func: 'last', target: 'x'}] : []
                    }]
                }],
                layout: {daterevision: i + 10}
            };
        }

        var aggScatter1CD = [[
            {x: 1, y: 2, i: 0},
            {x: 2, y: 1, i: 1}
        ]];

        var aggScatter2CD = [[
            {x: 6, y: 2, i: 0},
            {x: 5, y: 1, i: 1}
        ]];

        function aggregatedParcoords(i) {
            return {
                data: [{
                    type: 'parcoords',
                    dimensions: [
                        {label: 'A', values: [1, 2, 3, 4]},
                        {label: 'B', values: [4, 3, 2, 1]}
                    ],
                    transforms: i ? [{
                        type: 'aggregate',
                        groups: [1, 2, 1, 2],
                        aggregations: [
                            {target: 'dimensions[0].values', func: i > 1 ? 'avg' : 'first'},
                            {target: 'dimensions[1].values', func: i > 1 ? 'first' : 'avg'}
                        ]
                    }] :
                    []
                }]
            };
        }

        var aggParcoords0Vals = [[1, 2, 3, 4], [4, 3, 2, 1]];
        var aggParcoords1Vals = [[1, 2], [3, 2]];
        var aggParcoords2Vals = [[2, 3], [4, 3]];

        function checkCalcData(expectedCD) {
            return function() {
                expect(gd.calcdata.length).toBe(expectedCD.length);
                expectedCD.forEach(function(expectedCDi, i) {
                    var cdi = gd.calcdata[i];
                    expect(cdi.length).toBe(expectedCDi.length, i);
                    expectedCDi.forEach(function(expectedij, j) {
                        expect(cdi[j]).toEqual(jasmine.objectContaining(expectedij));
                    });
                });
            };
        }

        function checkValues(expectedVals) {
            return function() {
                expect(gd._fullData.length).toBe(1);
                var dims = gd._fullData[0].dimensions;
                expect(dims.length).toBe(expectedVals.length);
                expectedVals.forEach(function(expected, i) {
                    expect(dims[i].values).toEqual(expected);
                });
            };
        }

        function reactTo(fig) {
            return function() { return Plotly.react(gd, fig); };
        }

        it('can change pie aggregations', function(done) {
            Plotly.newPlot(gd, aggregatedPie(1))
            .then(checkCalcData(aggPie1CD))

            .then(reactTo(aggregatedPie(2)))
            .then(checkCalcData(aggPie2CD))

            .then(reactTo(aggregatedPie(1)))
            .then(checkCalcData(aggPie1CD))
            .catch(failTest)
            .then(done);
        });

        it('can change scatter aggregations', function(done) {
            Plotly.newPlot(gd, aggregatedScatter(1))
            .then(checkCalcData(aggScatter1CD))

            .then(reactTo(aggregatedScatter(2)))
            .then(checkCalcData(aggScatter2CD))

            .then(reactTo(aggregatedScatter(1)))
            .then(checkCalcData(aggScatter1CD))
            .catch(failTest)
            .then(done);
        });

        it('can change parcoords aggregations', function(done) {
            Plotly.newPlot(gd, aggregatedParcoords(0))
            .then(checkValues(aggParcoords0Vals))

            .then(reactTo(aggregatedParcoords(1)))
            .then(checkValues(aggParcoords1Vals))

            .then(reactTo(aggregatedParcoords(2)))
            .then(checkValues(aggParcoords2Vals))

            .then(reactTo(aggregatedParcoords(0)))
            .then(checkValues(aggParcoords0Vals))

            .catch(failTest)
            .then(done);
        });

        it('can change type with aggregations', function(done) {
            Plotly.newPlot(gd, aggregatedScatter(1))
            .then(checkCalcData(aggScatter1CD))

            .then(reactTo(aggregatedPie(1)))
            .then(checkCalcData(aggPie1CD))

            .then(reactTo(aggregatedParcoords(1)))
            .then(checkValues(aggParcoords1Vals))

            .then(reactTo(aggregatedScatter(1)))
            .then(checkCalcData(aggScatter1CD))

            .then(reactTo(aggregatedParcoords(2)))
            .then(checkValues(aggParcoords2Vals))

            .then(reactTo(aggregatedPie(2)))
            .then(checkCalcData(aggPie2CD))

            .then(reactTo(aggregatedScatter(2)))
            .then(checkCalcData(aggScatter2CD))

            .then(reactTo(aggregatedParcoords(0)))
            .then(checkValues(aggParcoords0Vals))
            .catch(failTest)
            .then(done);
        });

        it('can change frames without redrawing', function(done) {
            var data = [{y: [1, 2, 3]}];
            var layout = {};
            var frames = [{name: 'frame1'}];

            Plotly.newPlot(gd, {data: data, layout: layout, frames: frames})
            .then(countPlots)
            .then(function() {
                var frameData = gd._transitionData._frames;
                expect(frameData.length).toBe(1);
                expect(frameData[0].name).toBe('frame1');

                frames[0].name = 'frame2';
                return Plotly.react(gd, {data: data, layout: layout, frames: frames});
            })
            .then(function() {
                countCalls({});
                var frameData = gd._transitionData._frames;
                expect(frameData.length).toBe(1);
                expect(frameData[0].name).toBe('frame2');
            })
            .catch(failTest)
            .then(done);
        });

        var svgMockList = [
            ['1', require('@mocks/1.json')],
            ['4', require('@mocks/4.json')],
            ['5', require('@mocks/5.json')],
            ['10', require('@mocks/10.json')],
            ['11', require('@mocks/11.json')],
            ['17', require('@mocks/17.json')],
            ['21', require('@mocks/21.json')],
            ['22', require('@mocks/22.json')],
            ['airfoil', require('@mocks/airfoil.json')],
            ['annotations-autorange', require('@mocks/annotations-autorange.json')],
            ['axes_enumerated_ticks', require('@mocks/axes_enumerated_ticks.json')],
            ['axes_visible-false', require('@mocks/axes_visible-false.json')],
            ['bar_and_histogram', require('@mocks/bar_and_histogram.json')],
            ['basic_error_bar', require('@mocks/basic_error_bar.json')],
            ['binding', require('@mocks/binding.json')],
            ['cheater_smooth', require('@mocks/cheater_smooth.json')],
            ['finance_style', require('@mocks/finance_style.json')],
            ['geo_first', require('@mocks/geo_first.json')],
            ['layout_image', require('@mocks/layout_image.json')],
            ['layout-colorway', require('@mocks/layout-colorway.json')],
            ['polar_categories', require('@mocks/polar_categories.json')],
            ['polar_direction', require('@mocks/polar_direction.json')],
            ['range_selector_style', require('@mocks/range_selector_style.json')],
            ['range_slider_multiple', require('@mocks/range_slider_multiple.json')],
            ['sankey_energy', require('@mocks/sankey_energy.json')],
            ['scattercarpet', require('@mocks/scattercarpet.json')],
            ['shapes', require('@mocks/shapes.json')],
            ['splom_iris', require('@mocks/splom_iris.json')],
            ['table_wrapped_birds', require('@mocks/table_wrapped_birds.json')],
            ['ternary_fill', require('@mocks/ternary_fill.json')],
            ['text_chart_arrays', require('@mocks/text_chart_arrays.json')],
            ['transforms', require('@mocks/transforms.json')],
            ['updatemenus', require('@mocks/updatemenus.json')],
            ['violin_side-by-side', require('@mocks/violin_side-by-side.json')],
            ['world-cals', require('@mocks/world-cals.json')],
            ['typed arrays', {
                data: [{
                    x: new Float32Array([1, 2, 3]),
                    y: new Float32Array([1, 2, 1])
                }]
            }]
        ];

        var glMockList = [
            ['gl2d_heatmapgl', require('@mocks/gl2d_heatmapgl.json')],
            ['gl2d_line_dash', require('@mocks/gl2d_line_dash.json')],
            ['gl2d_parcoords_2', require('@mocks/gl2d_parcoords_2.json')],
            ['gl2d_pointcloud-basic', require('@mocks/gl2d_pointcloud-basic.json')],
            ['gl3d_annotations', require('@mocks/gl3d_annotations.json')],
            ['gl3d_set-ranges', require('@mocks/gl3d_set-ranges.json')],
            ['gl3d_world-cals', require('@mocks/gl3d_world-cals.json')],
            ['gl3d_cone-autorange', require('@mocks/gl3d_cone-autorange.json')],
            ['glpolar_style', require('@mocks/glpolar_style.json')],
        ];

        // make sure we've included every trace type in this suite
        var typesTested = {};
        var itemType;
        for(itemType in Registry.modules) { typesTested[itemType] = 0; }
        for(itemType in Registry.transformsRegistry) { typesTested[itemType] = 0; }

        // Not really being supported... This isn't part of the main bundle, and it's pretty broken,
        // but it gets registered and used by a couple of the gl2d tests.
        delete typesTested.contourgl;

        function _runReactMock(mockSpec, done) {
            var mock = mockSpec[1];
            var initialJson;

            function fullJson() {
                var out = JSON.parse(Plotly.Plots.graphJson({
                    data: gd._fullData.map(function(trace) { return trace._fullInput; }),
                    layout: gd._fullLayout
                }));

                // TODO: does it matter that ax.tick0/dtick/range and zmin/zmax
                // are often not regenerated without a calc step?
                // in as far as editor and others rely on _full, I think the
                // answer must be yes, but I'm not sure about within plotly.js
                [
                    'xaxis', 'xaxis2', 'xaxis3', 'xaxis4', 'xaxis5',
                    'yaxis', 'yaxis2', 'yaxis3', 'yaxis4',
                    'zaxis'
                ].forEach(function(axName) {
                    var ax = out.layout[axName];
                    if(ax) {
                        delete ax.dtick;
                        delete ax.tick0;

                        // TODO this one I don't understand and can't reproduce
                        // in the dashboard but it's needed here?
                        delete ax.range;
                    }
                    if(out.layout.scene) {
                        ax = out.layout.scene[axName];
                        if(ax) {
                            delete ax.dtick;
                            delete ax.tick0;
                            // TODO: this is the only one now that uses '_input_' + key
                            // as a hack to tell Plotly.react to ignore changes.
                            // Can we kill this?
                            delete ax.range;
                        }
                    }
                });
                out.data.forEach(function(trace) {
                    if(trace.type === 'contourcarpet') {
                        delete trace.zmin;
                        delete trace.zmax;
                    }
                });

                return out;
            }

            // Make sure we define `_length` in every trace *in supplyDefaults*.
            // This is only relevant for traces that *have* a 1D concept of length,
            // and in addition to simplifying calc/plot logic later on, ths serves
            // as a signal to transforms about how they should operate. For traces
            // that do NOT have a 1D length, `_length` should be `null`.
            var mockGD = Lib.extendDeep({}, mock);
            supplyAllDefaults(mockGD);
            expect(mockGD._fullData.length).not.toBeLessThan((mock.data || []).length, mockSpec[0]);
            mockGD._fullData.forEach(function(trace, i) {
                var len = trace._length;
                if(trace.visible !== false && len !== null) {
                    expect(typeof len).toBe('number', mockSpec[0] + ' trace ' + i + ': type=' + trace.type);
                }

                typesTested[trace.type]++;

                if(trace.transforms) {
                    trace.transforms.forEach(function(transform) {
                        typesTested[transform.type]++;
                    });
                }
            });

            Plotly.newPlot(gd, mock)
            .then(countPlots)
            .then(function() {
                initialJson = fullJson();

                return Plotly.react(gd, mock);
            })
            .then(function() {
                expect(fullJson()).toEqual(initialJson);
                countCalls({});
            })
            .catch(failTest)
            .then(done);
        }

        svgMockList.forEach(function(mockSpec) {
            it('can redraw "' + mockSpec[0] + '" with no changes as a noop (svg mocks)', function(done) {
                _runReactMock(mockSpec, done);
            });
        });

        glMockList.forEach(function(mockSpec) {
            it('can redraw "' + mockSpec[0] + '" with no changes as a noop (gl mocks)', function(done) {
                _runReactMock(mockSpec, done);
            });
        });

        it('@noCI can redraw scattermapbox with no changes as a noop', function(done) {
            Plotly.setPlotConfig({
                mapboxAccessToken: require('@build/credentials.json').MAPBOX_ACCESS_TOKEN
            });

            _runReactMock(['scattermapbox', require('@mocks/mapbox_bubbles-text.json')], done);
        });

        // since CI breaks up gl/svg types, and drops scattermapbox, this test won't work there
        // but I should hope that if someone is doing something as major as adding a new type,
        // they'll run the full test suite locally!
        it('@noCI tested every trace & transform type at least once', function() {
            for(var itemType in typesTested) {
                expect(typesTested[itemType]).toBeGreaterThan(0, itemType + ' was not tested');
            }
        });
    });

    describe('resizing with Plotly.relayout and Plotly.react', function() {
        var gd;

        beforeEach(function() {
            gd = createGraphDiv();
        });

        afterEach(destroyGraphDiv);

        it('recalculates autoranges when height/width change', function(done) {
            Plotly.newPlot(gd,
                [{y: [1, 2], marker: {size: 100}}],
                {width: 400, height: 400, margin: {l: 100, r: 100, t: 100, b: 100}}
            )
            .then(function() {
                expect(gd.layout.xaxis.range).toBeCloseToArray([-1.31818, 2.31818], 3);
                expect(gd.layout.yaxis.range).toBeCloseToArray([-0.31818, 3.31818], 3);

                return Plotly.relayout(gd, {height: 800, width: 800});
            })
            .then(function() {
                expect(gd.layout.xaxis.range).toBeCloseToArray([-0.22289, 1.22289], 3);
                expect(gd.layout.yaxis.range).toBeCloseToArray([0.77711, 2.22289], 3);

                gd.layout.width = 500;
                gd.layout.height = 500;
                return Plotly.react(gd, gd.data, gd.layout);
            })
            .then(function() {
                expect(gd.layout.xaxis.range).toBeCloseToArray([-0.53448, 1.53448], 3);
                expect(gd.layout.yaxis.range).toBeCloseToArray([0.46552, 2.53448], 3);
            })
            .catch(failTest)
            .then(done);
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
                'xref': 1, // another substring
                'annotations[2].x': 0.5, // substring of the attribute, but not a parent
                'annotations[2].xref': 'x2' // the attribute we're testing - not its own parent
            };

            expect(helpers.hasParent(aobj, attr)).toBe(false);

            var aobj2 = {
                'marker.line.color': 'red',
                'marker.line.width': 2,
                'marker.color': 'blue',
                'line': {}
            };

            expect(helpers.hasParent(aobj2, attr2)).toBe(false);
        });

        it('is false when called on a top-level attribute', function() {
            var aobj = {
                '': true,
                'width': 100
            };

            expect(helpers.hasParent(aobj, 'width')).toBe(false);
        });

        it('matches any kind of parent', function() {
            expect(helpers.hasParent({'annotations': []}, attr)).toBe(true);
            expect(helpers.hasParent({'annotations[2]': {}}, attr)).toBe(true);

            expect(helpers.hasParent({'marker': {}}, attr2)).toBe(true);
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
            dflt: true,
            role: 'style'
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
            dflt: 1,
            role: 'style'
        });

        expect(flags).toEqual({calc: true, legend: true, style: true});
    });
});
