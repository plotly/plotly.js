var d3 = require('d3');

var Plotly = require('@lib/index');
var Colorbar = require('@src/components/colorbar');
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var failTest = require('../assets/fail_test');
var assertPlotSize = require('../assets/custom_assertions').assertPlotSize;


describe('Test colorbar:', function() {
    'use strict';

    describe('hasColorbar', function() {
        var hasColorbar = Colorbar.hasColorbar,
            trace;

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
            .catch(failTest)
            .then(done);
        });

        // let heatmap stand in for all traces with trace.{showscale, colorbar}
        // also test impliedEdits for colorbars at the trace root
        it('can show and hide heatmap colorbars and sizes correctly with automargin', function(done) {
            function assertCB(msg, present, expandedMarginR, expandedMarginT, cbTop, cbHeight) {
                var colorbars = d3.select(gd).selectAll('.colorbar');
                expect(colorbars.size()).toBe(present ? 1 : 0);

                var cbbg = colorbars.selectAll('.colorbar .cbbg');

                // check that the displayed object has the right size,
                // not just that fullLayout._size changed
                var plotSizeTest = {};
                if(expandedMarginR) plotSizeTest.widthLessThan = 400;
                else plotSizeTest.width = 400;

                if(expandedMarginT) plotSizeTest.heightLessThan = 400;
                else plotSizeTest.height = 400;

                assertPlotSize(plotSizeTest);

                if(present) {
                    if(!cbHeight) cbHeight = 400;
                    var bgHeight = +cbbg.attr('height');
                    if(expandedMarginT) expect(bgHeight).toBeLessThan(cbHeight - 2);
                    else expect(bgHeight).toBeWithin(cbHeight, 2);

                    var topShift = cbbg.node().getBoundingClientRect().top - gd.getBoundingClientRect().top;
                    expect(topShift).toBeWithin(cbTop, 2);
                }
            }

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
                assertCB('initial', true, true, false, 50);

                return Plotly.restyle(gd, {showscale: false});
            })
            .then(function() {
                assertCB('hidden', false, false, false);

                return Plotly.restyle(gd, {showscale: true, 'colorbar.y': 0.8});
            })
            .then(function() {
                assertCB('up high', true, true, true, 12);

                return Plotly.restyle(gd, {'colorbar.y': 0.7});
            })
            .then(function() {
                assertCB('a little lower', true, true, true, 12);

                return Plotly.restyle(gd, {
                    'colorbar.x': 0.7,
                    'colorbar.y': 0.5,
                    'colorbar.thickness': 50,
                    'colorbar.len': 0.5
                });
            })
            .then(function() {
                assertCB('mid-plot', true, false, false, 150, 200);

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

                assertCB('changed size modes', true, true, false, 150, 200);
            })
            .catch(failTest)
            .then(done);
        });

        // scatter has trace.marker.{showscale, colorbar}
        it('can show and hide scatter colorbars', function(done) {
            function assertCB(present, expandedMargin) {
                var colorbars = d3.select(gd).selectAll('.colorbar');
                expect(colorbars.size()).toBe(present ? 1 : 0);

                assertPlotSize(expandedMargin ? {widthLessThan: 400} : {width: 400});
            }

            Plotly.newPlot(gd, [{
                y: [1, 2, 3],
                marker: {color: [1, 2, 3], showscale: true}
            }], {
                height: 500,
                width: 500,
                margin: {l: 50, r: 50, t: 50, b: 50}
            })
            .then(function() {
                assertCB(true, true);

                return Plotly.restyle(gd, {'marker.showscale': false});
            })
            .then(function() {
                assertCB(false, false);

                return Plotly.restyle(gd, {'marker.showscale': true, 'marker.colorbar.x': 0.7});
            })
            .then(function() {
                assertCB(true, false);

                return Plotly.restyle(gd, {'marker.colorbar.x': 1.1});
            })
            .then(function() {
                assertCB(true, true);
            })
            .catch(failTest)
            .then(done);
        });

        // histogram colorbars could not be edited before
        it('can show and hide scatter colorbars', function(done) {
            function assertCB(present, expandedMargin) {
                var colorbars = d3.select(gd).selectAll('.colorbar');
                expect(colorbars.size()).toBe(present ? 1 : 0);

                assertPlotSize(expandedMargin ? {widthLessThan: 400} : {width: 400});
            }

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
                assertCB(true, true);

                return Plotly.restyle(gd, {'marker.showscale': false});
            })
            .then(function() {
                assertCB(false, false);

                return Plotly.restyle(gd, {'marker.showscale': true, 'marker.colorbar.x': 0.7});
            })
            .then(function() {
                assertCB(true, false);

                return Plotly.restyle(gd, {'marker.colorbar.x': 1.1});
            })
            .then(function() {
                assertCB(true, true);
            })
            .catch(failTest)
            .then(done);
        });

        // parcoords has trace.marker.{showscale, colorbar}
        // also tests impliedEdits for colorbars in containers
        it('can show and hide parcoords colorbars', function(done) {
            function assertCB(present, expandedMargin) {
                var colorbars = d3.select(gd).selectAll('.colorbar');
                expect(colorbars.size()).toBe(present ? 1 : 0);

                var yAxes = d3.select(gd).selectAll('.parcoords .y-axis');
                expect(yAxes.size()).toBe(2);
                var transform = yAxes[0][1].getAttribute('transform');
                if(expandedMargin) expect(transform).not.toBe('translate(400, 0)');
                else expect(transform).toBe('translate(400, 0)');
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
                assertCB(true, true);

                return Plotly.restyle(gd, {'line.showscale': false});
            })
            .then(function() {
                assertCB(false, false);

                return Plotly.restyle(gd, {
                    'line.showscale': true,
                    'line.colorbar.x': 0.7
                });
            })
            .then(function() {
                assertCB(true, false);

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

                assertCB(true, true);
            })
            .catch(failTest)
            .then(done);
        });
    });
});
