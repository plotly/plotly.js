var d3Select = require('../../strict-d3').select;

var Plotly = require('../../../lib/index');
var Colorbar = require('../../../src/components/colorbar');
var Plots = require('../../../src/plots/plots');
var subroutines = require('../../../src/plot_api/subroutines');

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');

var negateIf = require('../assets/negate_if');
var supplyAllDefaults = require('../assets/supply_defaults');
var assertPlotSize = require('../assets/custom_assertions').assertPlotSize;
var drag = require('../assets/drag');

describe('Test colorbar:', function() {
    'use strict';

    describe('supplyDefaults:', function() {
        function _supply(trace, layout) {
            var gd = {
                data: [trace],
                layout: layout
            };
            supplyAllDefaults(gd);
            return gd._fullData[0];
        }

        it('should fill in tickfont defaults', function() {
            var out = _supply({
                type: 'heatmap',
                z: [[1, 2, 3], [2, 3, 6]]
            });
            expect(out.colorbar.tickfont.color).toBe('#444', 'dflt color');
        });

        it('should inherit tickfont defaults from global font', function() {
            var out = _supply({
                type: 'heatmap',
                z: [[1, 2, 3], [2, 3, 6]]
            }, {
                font: {color: 'red'}
            });
            expect(out.colorbar.tickfont.color).toBe('red', 'from global font');
        });
    });

    describe('hasColorbar', function() {
        var hasColorbar = Colorbar.hasColorbar;
        var trace;

        it('should return true when marker colorbar is defined', function() {
            trace = {
                marker: {
                    colorbar: {},
                    line: {
                        colorbar: {}
                    }
                }
            };
            expect(hasColorbar(trace.marker)).toBe(true);
            expect(hasColorbar(trace.marker.line)).toBe(true);

            trace = {
                marker: {
                    line: {}
                }
            };
            expect(hasColorbar(trace.marker)).toBe(false);
            expect(hasColorbar(trace.marker.line)).toBe(false);
        });
    });

    describe('drawing & editing', function() {
        var gd;

        beforeEach(function() {
            gd = createGraphDiv();
        });

        afterEach(destroyGraphDiv);

        it('does not lock up on tiny fractional ranges', function(done) {
            var z = [
                [9607345622458638.0, 9607345622458652.0, 9607345622458652.0, 9607345622458646.0, 9607345622458652.0, 9607345622458650.0, 9607345622458650.0, 9607345622458646.0],
                [9607345622458654.0, 9607345622458640.0, 9607345622458650.0, 9607345622458652.0, 9607345622458652.0, 9607345622458654.0, 9607345622458650.0, 9607345622458652.0],
                [9607345622458654.0, 9607345622458652.0, 9607345622458638.0, 9607345622458652.0, 9607345622458650.0, 9607345622458652.0, 9607345622458654.0, 9607345622458650.0],
                [9607345622458650.0, 9607345622458652.0, 9607345622458650.0, 9607345622458632.0, 9607345622458644.0, 9607345622458646.0, 9607345622458646.0, 9607345622458650.0],
                [9607345622458654.0, 9607345622458652.0, 9607345622458650.0, 9607345622458650.0, 9607345622458638.0, 9607345622458654.0, 9607345622458654.0, 9607345622458650.0],
                [9607345622458650.0, 9607345622458654.0, 9607345622458650.0, 9607345622458646.0, 9607345622458652.0, 9607345622458638.0, 9607345622458646.0, 9607345622458652.0],
                [9607345622458654.0, 9607345622458652.0, 9607345622458654.0, 9607345622458650.0, 9607345622458654.0, 9607345622458652.0, 9607345622458640.0, 9607345622458654.0],
                [9607345622458650.0, 9607345622458652.0, 9607345622458650.0, 9607345622458652.0, 9607345622458650.0, 9607345622458654.0, 9607345622458654.0, 9607345622458638.0]
            ];
            Plotly.newPlot(gd, [{type: 'heatmap', z: z}])
            .then(done, done.fail);
        });

        function assertCB(msg, present, opts) {
            var expandedMarginR = opts.expandedMarginR;
            var expandedMarginT = opts.expandedMarginT;
            var cbTop = opts.top;
            var cbHeight = opts.height;
            var multiFill = opts.multiFill;
            var colorbars = d3Select(gd).selectAll('.colorbar');
            expect(colorbars.size()).toBe(present ? 1 : 0);

            // check that the displayed object has the right size,
            // not just that fullLayout._size changed
            var plotSizeTest = {};
            if(expandedMarginR) plotSizeTest.widthLessThan = 400;
            else plotSizeTest.width = 400;

            if(expandedMarginT) plotSizeTest.heightLessThan = 400;
            else plotSizeTest.height = 400;

            assertPlotSize(plotSizeTest);

            if(present) {
                var cbbg = colorbars.selectAll('.cbbg');
                var cbfills = colorbars.selectAll('.cbfill');

                negateIf(multiFill, expect(cbfills.size())).toBe(1);

                if(!cbHeight) cbHeight = 400;
                var bgHeight = +cbbg.attr('height');
                if(expandedMarginT) expect(bgHeight).toBeLessThan(cbHeight - 2);
                else expect(bgHeight).toBeWithin(cbHeight, 2);

                if(cbTop !== undefined) {
                    var topShift = cbbg.node().getBoundingClientRect().top - gd.getBoundingClientRect().top;
                    expect(topShift).toBeWithin(cbTop, 2);
                }
            }
        }

        // let heatmap stand in for all traces with trace.{showscale, colorbar}
        // also test impliedEdits for colorbars at the trace root
        it('can show and hide heatmap colorbars and sizes correctly with automargin', function(done) {
            var thickPx, lenFrac;

            Plotly.newPlot(gd, [{
                type: 'heatmap',
                z: [[1, 10], [100, 1000]]
            }], {
                height: 500,
                width: 500,
                margin: {l: 50, r: 50, t: 50, b: 50}
            })
            .then(function() {
                assertCB('initial', true, {expandedMarginR: true, expandedMarginT: false, top: 50});

                return Plotly.restyle(gd, {showscale: false});
            })
            .then(function() {
                assertCB('hidden', false, {expandedMarginR: false, expandedMarginT: false});

                return Plotly.restyle(gd, {showscale: true, 'colorbar.y': 0.8});
            })
            .then(function() {
                assertCB('up high', true, {expandedMarginR: true, expandedMarginT: true, top: 12});

                return Plotly.restyle(gd, {'colorbar.y': 0.7});
            })
            .then(function() {
                assertCB('a little lower', true, {expandedMarginR: true, expandedMarginT: true, top: 12});

                return Plotly.restyle(gd, {
                    'colorbar.x': 0.7,
                    'colorbar.y': 0.5,
                    'colorbar.thickness': 50,
                    'colorbar.len': 0.5
                });
            })
            .then(function() {
                assertCB('mid-plot', true, {expandedMarginR: false, expandedMarginT: false, top: 150, height: 200});

                thickPx = gd._fullData[0].colorbar.thickness;
                lenFrac = gd._fullData[0].colorbar.len;

                return Plotly.restyle(gd, {
                    'colorbar.x': 1.1,
                    'colorbar.thicknessmode': 'fraction',
                    'colorbar.lenmode': 'pixels'
                });
            })
            .then(function() {
                expect(gd._fullData[0].colorbar.thickness)
                    .toBeCloseTo(thickPx / 400, 5);
                expect(gd._fullData[0].colorbar.len)
                    .toBeCloseTo(lenFrac * 400, 3);

                assertCB('changed size modes', true, {expandedMarginR: true, expandedMarginT: false, top: 150, height: 200});
            })
            .then(done, done.fail);
        });

        // scatter has trace.marker.{showscale, colorbar}
        it('can show and hide scatter colorbars', function(done) {
            Plotly.newPlot(gd, [{
                y: [1, 2, 3],
                marker: {color: [1, 2, 3], showscale: true}
            }], {
                height: 500,
                width: 500,
                margin: {l: 50, r: 50, t: 50, b: 50}
            })
            .then(function() {
                assertCB('initial', true, {expandedMarginR: true});

                return Plotly.restyle(gd, {'marker.showscale': false});
            })
            .then(function() {
                assertCB('hidden', false, {expandedMarginR: false});

                return Plotly.restyle(gd, {'marker.showscale': true, 'marker.colorbar.x': 0.7});
            })
            .then(function() {
                assertCB('mid-plot', true, {expandedMarginR: false});

                return Plotly.restyle(gd, {'marker.colorbar.x': 1.1});
            })
            .then(function() {
                assertCB('far right', true, {expandedMarginR: true});
            })
            .then(done, done.fail);
        });

        it('can show and hide colorbars of shared color axes', function(done) {
            Plotly.newPlot(gd, [{
                y: [1, 2, 3],
                marker: {color: [1, 2, 3], coloraxis: 'coloraxis'}
            }, {
                y: [1, 2, 3],
                marker: {color: [1, 0, 3], coloraxis: 'coloraxis'}
            }], {
                showlegend: false,
                height: 500,
                width: 500,
                margin: {l: 50, r: 50, t: 50, b: 50}
            })
            .then(function() {
                assertCB('initial', true, {expandedMarginR: true});

                return Plotly.relayout(gd, {'coloraxis.showscale': false});
            })
            .then(function() {
                assertCB('hidden', false, {expandedMarginR: false});

                return Plotly.relayout(gd, {'coloraxis.showscale': true, 'coloraxis.colorbar.x': 0.7});
            })
            .then(function() {
                assertCB('mid-plot', true, {expandedMarginR: false});

                return Plotly.relayout(gd, {'coloraxis.colorbar.x': 1.1});
            })
            .then(function() {
                assertCB('far right', true, {expandedMarginR: true});
            })
            .then(done, done.fail);
        });

        // histogram colorbars could not be edited before
        it('can show and hide histogram colorbars', function(done) {
            Plotly.newPlot(gd, [{
                type: 'histogram',
                x: [0, 1, 1, 2, 2, 2, 3, 3, 4],
                xbins: {start: -1.5, end: 4.5, size: 1},
                marker: {color: [1, 2, 3, 4, 5, 6], showscale: true}
            }], {
                height: 500,
                width: 500,
                margin: {l: 50, r: 50, t: 50, b: 50}
            })
            .then(function() {
                assertCB('initial', true, {expandedMarginR: true});

                return Plotly.restyle(gd, {'marker.showscale': false});
            })
            .then(function() {
                assertCB('hidden', false, {expandedMarginR: false});

                return Plotly.restyle(gd, {'marker.showscale': true, 'marker.colorbar.x': 0.7});
            })
            .then(function() {
                assertCB('mid-plot', true, {expandedMarginR: false});

                return Plotly.restyle(gd, {'marker.colorbar.x': 1.1});
            })
            .then(function() {
                assertCB('far right', true, {expandedMarginR: true});
            })
            .then(done, done.fail);
        });

        it('creates multiple fills for contour colorbars', function(done) {
            Plotly.newPlot(gd, [{
                type: 'contour',
                z: [[1, 10], [100, 1000]]
            }], {
                height: 500,
                width: 500,
                margin: {l: 50, r: 50, t: 50, b: 50}
            })
            .then(function() {
                assertCB('initial', true, {expandedMarginR: true, expandedMarginT: false, top: 50, multiFill: true});

                return Plotly.restyle(gd, {showscale: false});
            })
            .then(function() {
                assertCB('hidden', false, {expandedMarginR: false, expandedMarginT: false});

                return Plotly.restyle(gd, {showscale: true, 'colorbar.y': 0.8});
            })
            .then(function() {
                assertCB('up high', true, {expandedMarginR: true, expandedMarginT: true, top: 12, multiFill: true});

                return Plotly.restyle(gd, {'contours.coloring': 'heatmap'});
            })
            .then(function() {
                assertCB('up high', true, {expandedMarginR: true, expandedMarginT: true, top: 12, multiFill: false});
            })
            .then(done, done.fail);
        });

        // parcoords has trace.marker.{showscale, colorbar}
        // also tests impliedEdits for colorbars in containers
        it('can show and hide parcoords colorbars', function(done) {
            function assertParcoordsCB(present, expandedMargin) {
                var colorbars = d3Select(gd).selectAll('.colorbar');
                expect(colorbars.size()).toBe(present ? 1 : 0);

                var yAxes = d3Select(gd).selectAll('.parcoords .y-axis');
                expect(yAxes.size()).toBe(2);
                var transform = yAxes[0][1].getAttribute('transform');
                if(expandedMargin) expect(transform).not.toBe('translate(400,0)');
                else expect(transform).toBe('translate(400,0)');

                var cbfills = colorbars.selectAll('.cbfill');
                expect(cbfills.size()).toBe(present ? 1 : 0);
            }

            var thickPx, lenFrac;

            Plotly.newPlot(gd, [{
                type: 'parcoords',
                dimensions: [{values: [1, 2]}, {values: [1, 2]}],
                line: {color: [1, 2], showscale: true}
            }], {
                height: 500,
                width: 500,
                margin: {l: 50, r: 50, t: 50, b: 50}
            })
            .then(function() {
                assertParcoordsCB(true, true);

                return Plotly.restyle(gd, {'line.showscale': false});
            })
            .then(function() {
                assertParcoordsCB(false, false);

                return Plotly.restyle(gd, {
                    'line.showscale': true,
                    'line.colorbar.x': 0.7
                });
            })
            .then(function() {
                assertParcoordsCB(true, false);

                thickPx = gd._fullData[0].line.colorbar.thickness;
                lenFrac = gd._fullData[0].line.colorbar.len;

                return Plotly.restyle(gd, {
                    'line.colorbar.x': 1.1,
                    'line.colorbar.thicknessmode': 'fraction',
                    'line.colorbar.lenmode': 'pixels'
                });
            })
            .then(function() {
                expect(gd._fullData[0].line.colorbar.thickness)
                    .toBeCloseTo(thickPx / 400, 5);
                expect(gd._fullData[0].line.colorbar.len)
                    .toBeCloseTo(lenFrac * 400, 3);

                assertParcoordsCB(true, true);
            })
            .then(done, done.fail);
        });

        function getCBNode() {
            return document.querySelector('.colorbar');
        }

        it('@flaky can drag root-level colorbars in editable mode', function(done) {
            Plotly.newPlot(gd,
                [{z: [[1, 2], [3, 4]], type: 'heatmap'}],
                {width: 400, height: 400},
                {editable: true}
            )
            .then(function() {
                expect(gd.data[0].colorbar).toBeUndefined();
                expect(gd._fullData[0].colorbar.x).toBe(1.02);
                expect(gd._fullData[0].colorbar.y).toBe(0.5);
                return drag({node: getCBNode(), dpos: [-100, 100]});
            })
            .then(function() {
                expect(gd.data[0].colorbar.x).toBeWithin(0.591, 0.01);
                expect(gd.data[0].colorbar.y).toBeWithin(0.045, 0.01);
            })
            .then(done, done.fail);
        });

        it('@flaky can drag marker-level colorbars in editable mode', function(done) {
            Plotly.newPlot(gd,
                [{y: [1, 2, 1], marker: {color: [0, 1, 2], showscale: true}}],
                {width: 400, height: 400},
                {editable: true}
            )
            .then(function() {
                expect(gd.data[0].marker.colorbar).toBeUndefined();
                expect(gd._fullData[0].marker.colorbar.x).toBe(1.02);
                expect(gd._fullData[0].marker.colorbar.y).toBe(0.5);
                return drag({node: getCBNode(), dpos: [-100, 100]});
            })
            .then(function() {
                expect(gd.data[0].marker.colorbar.x).toBeWithin(0.591, 0.01);
                expect(gd.data[0].marker.colorbar.y).toBeWithin(0.045, 0.01);
            })
            .then(done, done.fail);
        });

        it('@flaky can drag colorbars linked to color axes in editable mode', function(done) {
            Plotly.newPlot(gd,
                [{z: [[1, 2], [3, 4]], type: 'heatmap', coloraxis: 'coloraxis'}],
                {coloraxis: {}, width: 400, height: 400},
                {editable: true}
            )
            .then(function() {
                expect(gd.layout.coloraxis.colorbar).toBeUndefined();
                expect(gd._fullLayout.coloraxis.colorbar.x).toBe(1.02);
                expect(gd._fullLayout.coloraxis.colorbar.y).toBe(0.5);
                return drag({node: getCBNode(), dpos: [-100, 100]});
            })
            .then(function() {
                expect(gd.layout.coloraxis.colorbar.x).toBeWithin(0.591, 0.01);
                expect(gd.layout.coloraxis.colorbar.y).toBeWithin(0.045, 0.01);
                expect(gd._fullLayout.coloraxis.colorbar.x).toBeWithin(0.591, 0.01);
                expect(gd._fullLayout.coloraxis.colorbar.y).toBeWithin(0.045, 0.01);
            })
            .then(done, done.fail);
        });

        it('can edit colorbar visuals in optimized edit pathway', function(done) {
            spyOn(subroutines, 'doColorBars').and.callThrough();
            spyOn(Plots, 'doCalcdata').and.callThrough();

            function getOutline(cb) {
                return Number(cb.select('.cboutline').node().style['stroke-width']);
            }

            function _assert(msg, exp) {
                var gd3 = d3Select(gd);
                var cb0 = gd3.select('.cbtrace0');
                var cb1 = gd3.select('.cbcoloraxis');

                if(msg !== 'base') {
                    expect(subroutines.doColorBars).toHaveBeenCalledTimes(1);
                    expect(Plots.doCalcdata).toHaveBeenCalledTimes(0);
                }
                subroutines.doColorBars.calls.reset();
                Plots.doCalcdata.calls.reset();

                expect(getOutline(cb0)).toBe(exp.outline[0], 'trace0 cb outline');
                expect(getOutline(cb1)).toBe(exp.outline[1], 'coloraxis cb outline');
            }

            Plotly.newPlot(gd, [{
                type: 'heatmap',
                z: [[1, 2, 3], [2, 1, 2]],
                uid: 'trace0'
            }, {
                y: [1, 2, 3],
                marker: {color: [2, 1, 2], coloraxis: 'coloraxis'}
            }], {
                width: 500,
                height: 500
            })
            .then(function() { _assert('base', {outline: [1, 1]}); })
            .then(function() {
                return Plotly.restyle(gd, 'colorbar.outlinewidth', 2, [0]);
            })
            .then(function() { _assert('after restyle', {outline: [2, 1]}); })
            .then(function() {
                return Plotly.relayout(gd, 'coloraxis.colorbar.outlinewidth', 5);
            })
            .then(function() { _assert('after relayout', {outline: [2, 5]}); })
            .then(function() {
                return Plotly.update(gd, {'colorbar.outlinewidth': 1}, {}, [0]);
            })
            .then(function() { _assert('after trace update', {outline: [1, 5]}); })
            .then(function() {
                return Plotly.update(gd, {}, {'coloraxis.colorbar.outlinewidth': 1});
            })
            .then(function() { _assert('after layout update', {outline: [1, 1]}); })
            .then(function() {
                gd.data[0].colorbar = {outlinewidth: 10};
                return Plotly.react(gd, gd.data, gd.layout);
            })
            .then(function() { _assert('after trace react', {outline: [10, 1]}); })
            .then(function() {
                gd.layout.coloraxis = {colorbar: {outlinewidth: 10}};
                return Plotly.react(gd, gd.data, gd.layout);
            })
            .then(function() { _assert('after layout trace', {outline: [10, 10]}); })
            .then(done, done.fail);
        });

        it('creates the same colorbars attributes in newPlot and react', function(done) {
            function getCBFillAttributes() {
                var attrs = [];
                var colorbars = d3Select(gd).selectAll('.colorbar');
                colorbars.selectAll('.cbfill').each(function() {
                    var attrsForElem = {};
                    for(var i = 0; i < this.attributes.length; i++) {
                        var attr = this.attributes.item(i);
                        attrsForElem[attr.name] = attr.value;
                    }
                    attrs.push(attrsForElem);
                });
                return attrs;
            }

            var mock = require('../../image/mocks/contour_transposed');
            var z = mock.data[0].z;

            var expectedAttrs;
            var actualAttrs;

            Plotly.newPlot(gd, mock)
            .then(function() {
                expectedAttrs = getCBFillAttributes();
                return Plotly.newPlot(gd, [{type: 'heatmap', z: z}]);
            })
            .then(function() {
                return Plotly.react(gd, mock);
            })
            .then(function() {
                actualAttrs = getCBFillAttributes();
                expect(actualAttrs).toEqual(expectedAttrs);
            })
            .then(done, done.fail);
        });
    });
});
