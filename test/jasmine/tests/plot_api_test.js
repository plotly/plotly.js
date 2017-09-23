var Plotly = require('@lib/index');
var PlotlyInternal = require('@src/plotly');
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
var bindPlotAPI = require('@src/plot_api/bind_plot_api');

var d3 = require('d3');
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var fail = require('../assets/fail_test');
var checkTicks = require('../assets/custom_assertions').checkTicks;

function withoutAPI(gd) {
    gd = Lib.extendFlat({}, gd);
    delete gd._plotAPI;
    return gd;
}

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
            }).catch(fail).then(done);
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
            }).catch(fail).then(done);
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
            }).catch(fail).then(done);
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
                .catch(fail)
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
            .catch(fail)
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
            .catch(fail)
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
            .catch(fail)
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
            .catch(fail)
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
            .catch(fail)
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
            .catch(fail)
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
            .catch(fail)
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
            .catch(fail)
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
            'doCamera'
        ];

        beforeAll(function() {
            mockedMethods.forEach(function(m) {
                spyOn(subroutines, m);
            });
        });

        function mock(gd) {
            mockedMethods.forEach(function(m) {
                subroutines[m].calls.reset();
            });

            Plots.supplyDefaults(gd);
            Plots.doCalcdata(gd);
            return gd;
        }

        it('should trigger recalc when switching into select or lasso dragmode', function() {
            var gd = mock({
                data: [{
                    type: 'scattergl',
                    x: [1, 2, 3],
                    y: [1, 2, 3]
                }],
                layout: {
                    dragmode: 'zoom'
                }
            });

            function expectModeBarOnly() {
                expect(gd.calcdata).toBeDefined();
                expect(subroutines.doModeBar).toHaveBeenCalled();
                expect(subroutines.layoutReplot).not.toHaveBeenCalled();
            }

            function expectRecalc() {
                expect(gd.calcdata).toBeUndefined();
                expect(subroutines.doModeBar).not.toHaveBeenCalled();
                expect(subroutines.layoutReplot).toHaveBeenCalled();
            }

            Plotly.relayout(gd, 'dragmode', 'pan');
            expectModeBarOnly();

            Plotly.relayout(mock(gd), 'dragmode', 'lasso');
            expectRecalc();

            Plotly.relayout(mock(gd), 'dragmode', 'select');
            expectModeBarOnly();

            Plotly.relayout(mock(gd), 'dragmode', 'lasso');
            expectModeBarOnly();

            Plotly.relayout(mock(gd), 'dragmode', 'zoom');
            expectModeBarOnly();

            Plotly.relayout(mock(gd), 'dragmode', 'select');
            expectRecalc();
        });
    });

    describe('Plotly.restyle subroutines switchboard', function() {
        beforeEach(function() {
            spyOn(PlotlyInternal, 'plot');
            spyOn(Plots, 'previousPromises');
            spyOn(Scatter, 'arraysToCalcdata');
            spyOn(Bar, 'arraysToCalcdata');
            spyOn(Plots, 'style');
            spyOn(Legend, 'draw');
        });

        function mockDefaultsAndCalc(gd) {
            Plots.supplyDefaults(gd);
            gd.calcdata = gd._fullData.map(function(trace) {
                return [{x: 1, y: 1, trace: trace}];
            });
            bindPlotAPI(gd, PlotlyInternal);
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
            expect(PlotlyInternal.plot).not.toHaveBeenCalled();
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
            expect(PlotlyInternal.plot).not.toHaveBeenCalled();
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
            expect(PlotlyInternal.plot).toHaveBeenCalled();

            mockDefaultsAndCalc(gd);
            PlotlyInternal.plot.calls.reset();
            Plotly.restyle(gd, 'marker.color', 'yellow');
            expect(gd.calcdata).toBeUndefined();
            expect(PlotlyInternal.plot).toHaveBeenCalled();

            mockDefaultsAndCalc(gd);
            PlotlyInternal.plot.calls.reset();
            Plotly.restyle(gd, 'marker.color', 'blue');
            expect(gd.calcdata).toBeDefined();
            expect(PlotlyInternal.plot).not.toHaveBeenCalled();

            mockDefaultsAndCalc(gd);
            PlotlyInternal.plot.calls.reset();
            Plotly.restyle(gd, 'marker.color', [['red', 'blue', 'green']]);
            expect(gd.calcdata).toBeUndefined();
            expect(PlotlyInternal.plot).toHaveBeenCalled();
        });

        it('should do full replot when arrayOk base attributes are updated', function() {
            var gd = {
                data: [{x: [1, 2, 3], y: [1, 2, 3]}],
                layout: {}
            };

            mockDefaultsAndCalc(gd);
            Plotly.restyle(gd, 'hoverlabel.bgcolor', [['red', 'green', 'blue']]);
            expect(gd.calcdata).toBeUndefined();
            expect(PlotlyInternal.plot).toHaveBeenCalled();

            mockDefaultsAndCalc(gd);
            PlotlyInternal.plot.calls.reset();
            Plotly.restyle(gd, 'hoverlabel.bgcolor', 'yellow');
            expect(gd.calcdata).toBeUndefined();
            expect(PlotlyInternal.plot).toHaveBeenCalled();

            mockDefaultsAndCalc(gd);
            PlotlyInternal.plot.calls.reset();
            Plotly.restyle(gd, 'hoverlabel.bgcolor', 'blue');
            expect(gd.calcdata).toBeDefined();
            expect(PlotlyInternal.plot).not.toHaveBeenCalled();

            mockDefaultsAndCalc(gd);
            PlotlyInternal.plot.calls.reset();
            Plotly.restyle(gd, 'hoverlabel.bgcolor', [['red', 'blue', 'green']]);
            expect(gd.calcdata).toBeUndefined();
            expect(PlotlyInternal.plot).toHaveBeenCalled();
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
            expect(PlotlyInternal.plot).toHaveBeenCalled();
        });

        it('calls plot on xgap and ygap styling', function() {
            var gd = {
                data: [{z: [[1, 2, 3], [4, 5, 6], [7, 8, 9]], showscale: false, type: 'heatmap'}],
                layout: {}
            };

            mockDefaultsAndCalc(gd);
            Plotly.restyle(gd, {'xgap': 2});
            expect(PlotlyInternal.plot).toHaveBeenCalled();

            Plotly.restyle(gd, {'ygap': 2});
            expect(PlotlyInternal.plot.calls.count()).toEqual(2);
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
                PlotlyInternal.plot.calls.reset();
                Plotly.restyle(gd, 'zmin', 0);
                expect(gd.calcdata).toBeUndefined();
                expect(PlotlyInternal.plot).toHaveBeenCalled();

                mockDefaultsAndCalc(gd);
                PlotlyInternal.plot.calls.reset();
                Plotly.restyle(gd, 'zmax', 10);
                expect(gd.calcdata).toBeUndefined();
                expect(PlotlyInternal.plot).toHaveBeenCalled();
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
                PlotlyInternal.plot.calls.reset();
                Plotly.restyle(gd, 'zmin', 0);
                expect(gd.calcdata).toBeDefined();
                expect(PlotlyInternal.plot).toHaveBeenCalled();

                mockDefaultsAndCalc(gd);
                PlotlyInternal.plot.calls.reset();
                Plotly.restyle(gd, 'zmax', 10);
                expect(gd.calcdata).toBeDefined();
                expect(PlotlyInternal.plot).toHaveBeenCalled();
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
            .catch(fail)
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
                .catch(fail)
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
            .catch(fail)
            .then(done);
        });

        it('turns off cauto (autocolorscale) when you edit cmin or cmax (colorscale)', function(done) {
            var autocscale = require('@src/components/colorscale/scales').Reds;

            var mcmin0 = 3;
            var mcscl0 = 'rainbow';
            var mlcmax1 = 6;
            var mlcscl1 = 'greens';

            function check(auto, msg) {
                expect(gd.data[0].marker.cauto).toBe(auto, msg);
                expect(gd.data[0].marker.cmin).negateIf(auto).toBe(mcmin0);
                expect(gd._fullData[0].marker.autocolorscale).toBe(auto, msg);
                expect(gd.data[0].marker.colorscale).toEqual(auto ? autocscale : mcscl0);
                expect(gd.data[1].marker.line.cauto).toBe(auto, msg);
                expect(gd.data[1].marker.line.cmax).negateIf(auto).toBe(mlcmax1);
                expect(gd._fullData[1].marker.line.autocolorscale).toBe(auto, msg);
                expect(gd.data[1].marker.line.colorscale).toEqual(auto ? autocscale : mlcscl1);
            }

            Plotly.plot(gd, [
                {y: [1, 2], mode: 'markers', marker: {color: [1, 10]}},
                {y: [2, 1], mode: 'markers', marker: {line: {width: 2, color: [3, 4]}}}
            ])
            .then(function() {
                check(true, 'initial');
                return Plotly.restyle(gd, {'marker.cmin': mcmin0, 'marker.colorscale': mcscl0}, null, [0]);
            })
            .then(function() {
                return Plotly.restyle(gd, {'marker.line.cmax': mlcmax1, 'marker.line.colorscale': mlcscl1}, null, [1]);
            })
            .then(function() {
                check(false, 'set min/max/scale');
                return Plotly.restyle(gd, {'marker.cauto': true, 'marker.autocolorscale': true}, null, [0]);
            })
            .then(function() {
                return Plotly.restyle(gd, {'marker.line.cauto': true, 'marker.line.autocolorscale': true}, null, [1]);
            })
            .then(function() {
                check(true, 'reset');
                return Queue.undo(gd);
            })
            .then(function() {
                return Queue.undo(gd);
            })
            .then(function() {
                check(false, 'undo');
            })
            .catch(fail)
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
            .catch(fail)
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
            .catch(fail)
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
            .catch(fail)
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
            .catch(fail)
            .then(done);
        });

        it('updates colorbars when editing bar charts', function(done) {
            var mock = require('@mocks/bar-colorscale-colorbar.json');

            Plotly.newPlot(gd, mock.data, mock.layout)
            .then(function() {
                expect(d3.select('.cbaxis text').style('fill')).not.toBe('rgb(255, 0, 0)');

                return Plotly.restyle(gd, {'marker.colorbar.tickfont.color': 'rgb(255, 0, 0)'});
            })
            .then(function() {
                expect(d3.select('.cbaxis text').style('fill')).toBe('rgb(255, 0, 0)');

                return Plotly.restyle(gd, {'marker.showscale': false});
            })
            .then(function() {
                expect(d3.select('.cbaxis').size()).toBe(0);
            })
            .catch(fail)
            .then(done);
        });

        it('updates colorbars when editing gl3d plots', function(done) {
            Plotly.newPlot(gd, [{z: [[1, 2], [3, 6]], type: 'surface'}])
            .then(function() {
                expect(d3.select('.cbaxis text').style('fill')).not.toBe('rgb(255, 0, 0)');

                return Plotly.restyle(gd, {'colorbar.tickfont.color': 'rgb(255, 0, 0)'});
            })
            .then(function() {
                expect(d3.select('.cbaxis text').style('fill')).toBe('rgb(255, 0, 0)');

                return Plotly.restyle(gd, {'showscale': false});
            })
            .then(function() {
                expect(d3.select('.cbaxis').size()).toBe(0);
            })
            .catch(fail)
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
            .catch(fail)
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
            .catch(fail)
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
            spyOn(PlotlyInternal, 'redraw');
            bindPlotAPI(gd, PlotlyInternal);
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
            expect(PlotlyInternal.redraw).toHaveBeenCalled();

        });

        it('should work when multiple traces are deleted', function() {
            var expectedData = [
                {'name': 'b'},
                {'name': 'c'}
            ];

            Plotly.deleteTraces(gd, [0, 3]);
            expect(gd.data).toEqual(expectedData);
            expect(PlotlyInternal.redraw).toHaveBeenCalled();

        });

        it('should work when indices are not sorted', function() {
            var expectedData = [
                {'name': 'b'},
                {'name': 'c'}
            ];

            Plotly.deleteTraces(gd, [3, 0]);
            expect(gd.data).toEqual(expectedData);
            expect(PlotlyInternal.redraw).toHaveBeenCalled();

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
            expect(PlotlyInternal.redraw).toHaveBeenCalled();

        });

    });

    describe('Plotly.addTraces', function() {
        var gd;

        beforeEach(function() {
            gd = { data: [{'name': 'a'}, {'name': 'b'}] };
            spyOn(PlotlyInternal, 'redraw');
            spyOn(PlotlyInternal, 'moveTraces');
            bindPlotAPI(gd, PlotlyInternal);
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
            expect(withoutAPI(gd)).toEqual(withoutAPI(expected));
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
            expect(withoutAPI(gd)).toEqual(withoutAPI(expected));
        });

        it('should work when newIndices is undefined', function() {
            Plotly.addTraces(gd, [{'name': 'c'}, {'name': 'd'}]);
            expect(gd.data[2].name).toBeDefined();
            expect(gd.data[2].uid).toBeDefined();
            expect(gd.data[3].name).toBeDefined();
            expect(gd.data[3].uid).toBeDefined();
            expect(PlotlyInternal.redraw).toHaveBeenCalled();
            expect(PlotlyInternal.moveTraces).not.toHaveBeenCalled();
        });

        it('should work when newIndices is defined', function() {
            Plotly.addTraces(gd, [{'name': 'c'}, {'name': 'd'}], [1, 3]);
            expect(gd.data[2].name).toBeDefined();
            expect(gd.data[2].uid).toBeDefined();
            expect(gd.data[3].name).toBeDefined();
            expect(gd.data[3].uid).toBeDefined();
            expect(PlotlyInternal.redraw).not.toHaveBeenCalled();
            expect(PlotlyInternal.moveTraces).toHaveBeenCalledWith(gd, [-2, -1], [1, 3]);
        });

        it('should work when newIndices has negative indices', function() {
            Plotly.addTraces(gd, [{'name': 'c'}, {'name': 'd'}], [-3, -1]);
            expect(gd.data[2].name).toBeDefined();
            expect(gd.data[2].uid).toBeDefined();
            expect(gd.data[3].name).toBeDefined();
            expect(gd.data[3].uid).toBeDefined();
            expect(PlotlyInternal.redraw).not.toHaveBeenCalled();
            expect(PlotlyInternal.moveTraces).toHaveBeenCalledWith(gd, [-2, -1], [-3, -1]);
        });

        it('should work when newIndices is an integer', function() {
            Plotly.addTraces(gd, {'name': 'c'}, 0);
            expect(gd.data[2].name).toBeDefined();
            expect(gd.data[2].uid).toBeDefined();
            expect(PlotlyInternal.redraw).not.toHaveBeenCalled();
            expect(PlotlyInternal.moveTraces).toHaveBeenCalledWith(gd, [-1], [0]);
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
            spyOn(PlotlyInternal, 'redraw');
            bindPlotAPI(gd, PlotlyInternal);
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
            expect(PlotlyInternal.redraw).toHaveBeenCalled();

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
            expect(PlotlyInternal.redraw).toHaveBeenCalled();

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
            expect(PlotlyInternal.redraw).toHaveBeenCalled();

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
            expect(PlotlyInternal.redraw).toHaveBeenCalled();

        });
    });


    describe('Plotly.ExtendTraces', function() {
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

            spyOn(PlotlyInternal, 'redraw');
            spyOn(Plotly.Queue, 'add');
            bindPlotAPI(gd, PlotlyInternal);
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

            expect(PlotlyInternal.redraw).toHaveBeenCalled();
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

            expect(PlotlyInternal.redraw).toHaveBeenCalled();
        });

        it('prepend is the inverse of extend - no maxPoints', function() {
            var cachedData = Lib.extendDeep([], gd.data);

            Plotly.extendTraces(gd, {
                x: [[3, 4], [4, 5]], 'marker.size': [[0, -1], [5, 6]]
            }, [0, 1]);

            expect(gd.data).not.toEqual(cachedData);
            expect(Plotly.Queue.add).toHaveBeenCalled();

            var undoArgs = Plotly.Queue.add.calls.first().args[2];

            gd._plotAPI.prependTraces.apply(null, undoArgs);

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

            gd._plotAPI.extendTraces.apply(null, undoArgs);

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

            gd._plotAPI.prependTraces.apply(null, undoArgs);

            expect(gd.data).toEqual(cachedData);
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

                done();
            });
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

            Plotly.redraw(gd).then(function() {
                expect(d3.selectAll('g.trace.scatter').size()).toEqual(3);
            })
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

            Plotly.plot(gd, data).then(function() {
                var height = 50;

                Plotly.newPlot(gd, data, { height: height }).then(function() {
                    var fullLayout = gd._fullLayout,
                        svg = document.getElementsByClassName('main-svg')[0];

                    expect(fullLayout.height).toBe(height);
                    expect(+svg.getAttribute('height')).toBe(height);
                }).then(done);
            });
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
                done();
            });
        });

        afterEach(destroyGraphDiv);

        it('call doTraceStyle on trace style updates', function(done) {
            expect(subroutines.doTraceStyle).not.toHaveBeenCalled();

            Plotly.update(gd, { 'marker.color': 'blue' }).then(function() {
                expect(subroutines.doTraceStyle).toHaveBeenCalledTimes(1);
                expect(calcdata).toBe(gd.calcdata);
                done();
            });
        });

        it('clear calcdata on data updates', function(done) {
            Plotly.update(gd, { x: [[3, 1, 3]] }).then(function() {
                expect(data).toBe(gd.data);
                expect(layout).toBe(gd.layout);
                expect(calcdata).not.toBe(gd.calcdata);
                done();
            });
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

                done();
            });
        });

        it('call doLegend on legend updates', function(done) {
            expect(subroutines.doLegend).not.toHaveBeenCalled();

            Plotly.update(gd, {}, { 'showlegend': true }).then(function() {
                expect(subroutines.doLegend).toHaveBeenCalledTimes(1);
                expect(calcdata).toBe(gd.calcdata);
                done();
            });
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
                done();
            });
        });

        it('call doModeBar when updating \'dragmode\'', function(done) {
            expect(subroutines.doModeBar).not.toHaveBeenCalled();

            Plotly.update(gd, {}, { 'dragmode': 'pan' }).then(function() {
                expect(subroutines.doModeBar).toHaveBeenCalledTimes(1);
                expect(calcdata).toBe(gd.calcdata);
                done();
            });
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
