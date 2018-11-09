var Plotly = require('@lib/index');
var plotApi = require('@src/plot_api/plot_api');
var Lib = require('@src/lib');
var Axes = require('@src/plots/cartesian/axes');
var subroutines = require('@src/plot_api/subroutines');
var annotations = require('@src/components/annotations');
var images = require('@src/components/images');
var Registry = require('@src/registry');

var d3 = require('d3');
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var failTest = require('../assets/fail_test');
var supplyAllDefaults = require('../assets/supply_defaults');
var mockLists = require('../assets/mock_lists');

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
    var afterPlotCnt;

    beforeEach(function() {
        gd = createGraphDiv();

        spyOn(plotApi, 'plot').and.callThrough();
        spyOn(Registry, 'call').and.callThrough();

        mockedMethods.forEach(function(m) {
            spyOn(subroutines, m).and.callThrough();
            subroutines[m].calls.reset();
        });

        spyOn(annotations, 'drawOne').and.callThrough();
        spyOn(annotations, 'draw').and.callThrough();
        spyOn(images, 'draw').and.callThrough();
        spyOn(Axes, 'doTicks').and.callThrough();
    });

    afterEach(destroyGraphDiv);

    function countPlots() {
        plotApi.plot.calls.reset();
        subroutines.layoutStyles.calls.reset();
        annotations.draw.calls.reset();
        annotations.drawOne.calls.reset();
        images.draw.calls.reset();

        afterPlotCnt = 0;
        gd.on('plotly_afterplot', function() { afterPlotCnt++; });
    }

    function countCalls(counts) {
        var callsFinal = Lib.extendFlat({}, counts);
        callsFinal.layoutStyles = (counts.layoutStyles || 0) + (counts.plot || 0);

        mockedMethods.forEach(function(m) {
            expect(subroutines[m]).toHaveBeenCalledTimes(callsFinal[m] || 0);
            subroutines[m].calls.reset();
        });

        // calls to Plotly.plot via plot_api.js or Registry.call('plot')
        var plotCalls = plotApi.plot.calls.count() +
            Registry.call.calls.all()
                .filter(function(d) { return d.args[0] === 'plot'; })
                .length;
        expect(plotCalls).toBe(counts.plot || 0, 'Plotly.plot calls');
        plotApi.plot.calls.reset();
        Registry.call.calls.reset();

        // only consider annotation and image draw calls if we *don't* do a full plot.
        if(!counts.plot) {
            expect(annotations.draw).toHaveBeenCalledTimes(counts.annotationDraw || 0);
            expect(annotations.drawOne).toHaveBeenCalledTimes(counts.annotationDrawOne || 0);
            expect(images.draw).toHaveBeenCalledTimes(counts.imageDraw || 0);
        }
        annotations.draw.calls.reset();
        annotations.drawOne.calls.reset();
        images.draw.calls.reset();

        expect(afterPlotCnt).toBe(1, 'plotly_afterplot should be called only once per edit');
        afterPlotCnt = 0;
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
            countCalls({plot: 0});

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
            countCalls({plot: 0});

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

    it('picks up special dtick geo case', function(done) {
        var data = [{type: 'scattergeo'}];
        var layout = {};

        function countLines() {
            var path = d3.select(gd).select('.lataxis > path');
            return path.attr('d').split('M').length;
        }

        Plotly.react(gd, data)
        .then(countPlots)
        .then(function() {
            layout.geo = {lataxis: {showgrid: true, dtick: 10}};
            return Plotly.react(gd, data, layout);
        })
        .then(function() {
            countCalls({plot: 1});
            expect(countLines()).toBe(18);
        })
        .then(function() {
            layout.geo.lataxis.dtick = 30;
            return Plotly.react(gd, data, layout);
        })
        .then(function() {
            countCalls({plot: 1});
            expect(countLines()).toBe(6);
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
            expect(Axes.doTicks).toHaveBeenCalledWith(gd, '');
            return Plotly.react(gd, data, layout2);
        })
        .then(function() {
            expect(Axes.doTicks).toHaveBeenCalledWith(gd, 'redraw');
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
            return Plotly.react(gd, data, layout);
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
            return Plotly.react(gd, data, layout);
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
            expect(d3.select(gd).selectAll('.drag').size()).toBe(4);

            return Plotly.react(gd, data, layout, {staticPlot: true});
        })
        .then(function() {
            expect(d3.select(gd).selectAll('.drag').size()).toBe(0);

            return Plotly.react(gd, data, layout, {});
        })
        .then(function() {
            expect(d3.select(gd).selectAll('.drag').size()).toBe(4);
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

    mockLists.svg.forEach(function(mockSpec) {
        it('can redraw "' + mockSpec[0] + '" with no changes as a noop (svg mocks)', function(done) {
            _runReactMock(mockSpec, done);
        });
    });

    mockLists.gl.forEach(function(mockSpec) {
        it('can redraw "' + mockSpec[0] + '" with no changes as a noop (gl mocks)', function(done) {
            _runReactMock(mockSpec, done);
        });
    });

    mockLists.mapbox.forEach(function(mockSpec) {
        it('@noCI can redraw "' + mockSpec[0] + '" with no changes as a noop (mapbpox mocks)', function(done) {
            Plotly.setPlotConfig({
                mapboxAccessToken: require('@build/credentials.json').MAPBOX_ACCESS_TOKEN
            });
            _runReactMock(mockSpec, done);
        });
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
