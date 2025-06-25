var Plotly = require('../../../lib/index');
var plotApi = require('../../../src/plot_api/plot_api');
var Lib = require('../../../src/lib');
var Axes = require('../../../src/plots/cartesian/axes');
var subroutines = require('../../../src/plot_api/subroutines');
var annotations = require('../../../src/components/annotations');
var images = require('../../../src/components/images');
var Registry = require('../../../src/registry');

var d3Select = require('../../strict-d3').select;
var d3SelectAll = require('../../strict-d3').selectAll;
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var failTest = require('../assets/fail_test');
var supplyAllDefaults = require('../assets/supply_defaults');
var mockLists = require('../assets/mock_lists');
var mouseEvent = require('../assets/mouse_event');
var drag = require('../assets/drag');
var delay = require('../assets/delay');

var MAPBOX_ACCESS_TOKEN = require('../../../build/credentials.json').MAPBOX_ACCESS_TOKEN;

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

        spyOn(plotApi, '_doPlot').and.callThrough();
        spyOn(Registry, 'call').and.callThrough();

        mockedMethods.forEach(function(m) {
            spyOn(subroutines, m).and.callThrough();
            subroutines[m].calls.reset();
        });

        spyOn(annotations, 'drawOne').and.callThrough();
        spyOn(annotations, 'draw').and.callThrough();
        spyOn(images, 'draw').and.callThrough();
        spyOn(Axes, 'draw').and.callThrough();
    });

    afterEach(destroyGraphDiv);

    function countPlots() {
        plotApi._doPlot.calls.reset();
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

        // calls to Plotly.newPlot via plot_api.js or Registry.call('_doPlot')
        var plotCalls = plotApi._doPlot.calls.count() +
            Registry.call.calls.all()
                .filter(function(d) { return d.args[0] === '_doPlot'; })
                .length;
        expect(plotCalls).toBe(counts.plot || 0, 'Plotly.newPlot calls');
        plotApi._doPlot.calls.reset();
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
            expect(d3SelectAll('.point').size()).toBe(3);

            return Plotly.react(gd, data2, layout);
        })
        .then(function() {
            expect(d3SelectAll('.point').size()).toBe(6);

            return Plotly.react(gd, data1, layout);
        })
        .then(function() {
            expect(d3SelectAll('.point').size()).toBe(3);
        })
        .then(done, done.fail);
    });

    it('should notice new data by ===, without layout.datarevision', function(done) {
        var data = [{y: [1, 2, 3], mode: 'markers'}];
        var layout = {};

        Plotly.newPlot(gd, data, layout)
        .then(countPlots)
        .then(function() {
            expect(d3SelectAll('.point').size()).toBe(3);

            data[0].y.push(4);
            return Plotly.react(gd, data, layout);
        })
        .then(function() {
            // didn't pick it up, as we modified in place!!!
            expect(d3SelectAll('.point').size()).toBe(3);
            countCalls({plot: 0});

            data[0].y = [1, 2, 3, 4, 5];
            return Plotly.react(gd, data, layout);
        })
        .then(function() {
            // new object, we picked it up!
            expect(d3SelectAll('.point').size()).toBe(5);
            countCalls({plot: 1});
        })
        .then(done, done.fail);
    });

    it('should notice new layout.datarevision', function(done) {
        var data = [{y: [1, 2, 3], mode: 'markers'}];
        var layout = {datarevision: 1};

        Plotly.newPlot(gd, data, layout)
        .then(countPlots)
        .then(function() {
            expect(d3SelectAll('.point').size()).toBe(3);

            data[0].y.push(4);
            return Plotly.react(gd, data, layout);
        })
        .then(function() {
            // didn't pick it up, as we didn't modify datarevision
            expect(d3SelectAll('.point').size()).toBe(3);
            countCalls({plot: 0});

            data[0].y.push(5);
            layout.datarevision = 'bananas';
            return Plotly.react(gd, data, layout);
        })
        .then(function() {
            // new revision, we picked it up!
            expect(d3SelectAll('.point').size()).toBe(5);

            countCalls({plot: 1});
        })
        .then(done, done.fail);
    });

    it('picks up partial redraws', function(done) {
        var data = [{y: [1, 2, 3], mode: 'markers'}];
        var layout = {hovermode: 'x'};

        Plotly.newPlot(gd, data, layout)
        .then(countPlots)
        .then(function() {
            layout.title = { text: 'XXXXX' };
            layout.hovermode = 'closest';
            data[0].marker = {color: 'rgb(0, 100, 200)'};
            return Plotly.react(gd, data, layout);
        })
        .then(function() {
            countCalls({layoutStyles: 1, doTraceStyle: 1, doModeBar: 1});
            expect(d3Select('.gtitle').text()).toBe('XXXXX');
            var points = d3SelectAll('.point');
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

            layout.scene.camera = {up: {x: 1, y: 0, z: -1}};

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
        .then(done, done.fail);
    });

    it('picks up special dtick geo case', function(done) {
        var data = [{type: 'scattergeo'}];
        var layout = {};

        function countLines() {
            var path = d3Select(gd).select('.lataxis > path');
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
        .then(done, done.fail);
    });

    it('picks up minimal sequence for cartesian axis range updates', function(done) {
        var data = [{y: [1, 2, 1]}];
        var layout = {xaxis: {range: [1, 2]}};
        var layout2 = {xaxis: {range: [0, 1]}};

        Plotly.newPlot(gd, data, layout)
        .then(countPlots)
        .then(function() {
            expect(Axes.draw).toHaveBeenCalledWith(gd, '');
            return Plotly.react(gd, data, layout2);
        })
        .then(function() {
            expect(Axes.draw).toHaveBeenCalledWith(gd, 'redraw');
            expect(subroutines.layoutStyles).not.toHaveBeenCalled();
        })
        .then(done, done.fail);
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
            expect(d3SelectAll('.annotation').size()).toBe(2);

            layout.annotations[1].bgcolor = 'rgb(200, 100, 0)';
            return Plotly.react(gd, data, layout);
        })
        .then(function() {
            countCalls({annotationDrawOne: 1});
            expect(window.getComputedStyle(d3Select('.annotation[data-index="1"] .bg').node()).fill)
                .toBe('rgb(200, 100, 0)');
            expect(layout.yaxis.range[1]).not.toBeCloseTo(ymax, 0);

            layout.annotations[0].font = {color: 'rgb(0, 255, 0)'};
            layout.annotations[1].bgcolor = 'rgb(0, 0, 255)';
            return Plotly.react(gd, data, layout);
        })
        .then(function() {
            countCalls({annotationDrawOne: 2});
            expect(window.getComputedStyle(d3Select('.annotation[data-index="0"] text').node()).fill)
                .toBe('rgb(0, 255, 0)');
            expect(window.getComputedStyle(d3Select('.annotation[data-index="1"] .bg').node()).fill)
                .toBe('rgb(0, 0, 255)');

            Lib.extendFlat(layout.annotations[0], {yref: 'paper', y: 0.8});

            return Plotly.react(gd, data, layout);
        })
        .then(function() {
            countCalls({plot: 1});
            expect(layout.yaxis.range[1]).toBeCloseTo(ymax, 0);
        })
        .then(done, done.fail);
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
            expect(d3SelectAll('image').size()).toBe(2);

            var n = d3SelectAll('image').node();
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
            var n = d3SelectAll('image').node();
            expect(n.attributes.x.value).toBe(x);
            expect(n.attributes.width.value).toBe(width);
            expect(n.attributes.y.value).not.toBe(y);
            expect(n.attributes.height.value).not.toBe(height);
        })
        .then(done, done.fail);
    });

    it('can change config, and always redraws', function(done) {
        var data = [{y: [1, 2, 3]}];
        var layout = {};

        Plotly.newPlot(gd, data, layout)
        .then(countPlots)
        .then(function() {
            expect(d3SelectAll('.drag').size()).toBe(11);
            expect(d3SelectAll('.gtitle').size()).toBe(0);

            return Plotly.react(gd, data, layout, {editable: true});
        })
        .then(function() {
            expect(d3SelectAll('.drag').size()).toBe(11);
            expect(d3SelectAll('.gtitle').text()).toBe('Click to enter Plot title');
            expect(d3SelectAll('.gtitle-subtitle').text()).toBe('Click to enter Plot subtitle');
            countCalls({plot: 1});

            return Plotly.react(gd, data, layout, {staticPlot: true});
        })
        .then(function() {
            expect(d3SelectAll('.drag').size()).toBe(0);
            expect(d3SelectAll('.gtitle').size()).toBe(0);
            countCalls({plot: 1});

            return Plotly.react(gd, data, layout, {});
        })
        .then(function() {
            expect(d3SelectAll('.drag').size()).toBe(11);
            expect(d3SelectAll('.gtitle').size()).toBe(0);
            countCalls({plot: 1});
        })
        .then(done, done.fail);
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
            expect(d3Select(gd).selectAll('.drag').size()).toBe(4);

            return Plotly.react(gd, data, layout, {staticPlot: true});
        })
        .then(function() {
            expect(d3Select(gd).selectAll('.drag').size()).toBe(0);

            return Plotly.react(gd, data, layout, {});
        })
        .then(function() {
            expect(d3Select(gd).selectAll('.drag').size()).toBe(4);
        })
        .then(done, done.fail);
    });

    it('can put smith plots into staticPlot mode', function(done) {
        var data = [{real: [0, 1, 2], imag: [0, 1, 2], type: 'scattersmith'}];
        var layout = {};

        Plotly.newPlot(gd, data, layout)
        .then(countPlots)
        .then(function() {
            expect(d3Select(gd).selectAll('.drag').size()).toBe(1);

            return Plotly.react(gd, data, layout, {staticPlot: true});
        })
        .then(function() {
            expect(d3Select(gd).selectAll('.drag').size()).toBe(0);

            return Plotly.react(gd, data, layout, {});
        })
        .then(function() {
            expect(d3Select(gd).selectAll('.drag').size()).toBe(1);
        })
        .then(done, done.fail);
    });

    it('can change from scatter to category scatterpolar and back', function(done) {
        function scatter() {
            return {
                data: [{x: ['a', 'b'], y: [1, 2]}],
                layout: {width: 400, height: 400, margin: {r: 80, t: 20}}
            };
        }

        function scatterpolar() {
            return {
                // the bug https://github.com/plotly/plotly.js/issues/3255
                // required all of this to change:
                // - type -> scatterpolar
                // - category theta
                // - margins changed
                data: [{type: 'scatterpolar', r: [1, 2, 3], theta: ['a', 'b', 'c']}],
                layout: {width: 400, height: 400, margin: {r: 80, t: 50}}
            };
        }

        function countTraces(scatterTraces, polarTraces) {
            expect(document.querySelectorAll('.scatter').length)
                .toBe(scatterTraces + polarTraces);
            expect(document.querySelectorAll('.xy .scatter').length)
                .toBe(scatterTraces);
            expect(document.querySelectorAll('.polar .scatter').length)
                .toBe(polarTraces);
        }

        Plotly.newPlot(gd, scatter())
        .then(function() {
            countTraces(1, 0);
            return Plotly.react(gd, scatterpolar());
        })
        .then(function() {
            countTraces(0, 1);
            return Plotly.react(gd, scatter());
        })
        .then(function() {
            countTraces(1, 0);
        })
        .then(done, done.fail);
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
        .then(done, done.fail);
    });

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
        .then(done, done.fail);
    });

    // make sure we've included every trace type in this suite
    var typesTested = {};
    var itemType;
    for(itemType in Registry.modules) { typesTested[itemType] = 0; }

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
        });

        Plotly.newPlot(gd, mock)
        .then(countPlots)
        .then(function() {
            initialJson = fullJson();

            return Plotly.react(gd, mock);
        })
        .then(function() {
            expect(fullJson()).toEqual(initialJson);
            if(['sankey', 'sunburst', 'treemap', 'icicle'].indexOf(gd._fullData[0].type) === -1) {
                countCalls({});
            }
        })
        .then(done, done.fail);
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

    mockLists.map.forEach(function(mockSpec) {
        it('@noCI @gl can redraw "' + mockSpec[0] + '" with no changes as a noop (map mocks)', function(done) {
            Plotly.setPlotConfig({});
            _runReactMock(mockSpec, done);
        });
    });

    it('@noCI tested every trace type at least once', function() {
        for(var itemType in typesTested) {
            if(itemType.indexOf('mapbox') !== -1) continue;
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
        .then(done, done.fail);
    });
});

describe('clear bglayer react', function() {
    var x = [1];
    var y = [2];
    var z = [3];

    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(destroyGraphDiv);

    function hasBgRect() {
        var bgLayer = d3SelectAll('.bglayer .bg');
        return bgLayer[0][0] !== undefined; // i.e. background rect
    }

    it('clear plot background when react from cartesian to gl3d & back', function(done) {
        Plotly.newPlot(gd, {
            data: [{ type: 'scatter', x: x, y: y, z: z }],
            layout: { plot_bgcolor: 'green' }
        }).then(function() {
            expect(gd._fullLayout.plot_bgcolor).toBe('green');
            expect(hasBgRect()).toBe(true);

            return Plotly.react(gd, {
                data: [{ type: 'scatter3d', x: x, y: y, z: z }],
                layout: { plot_bgcolor: 'red' }
            });
        }).then(function() {
            expect(gd._fullLayout.plot_bgcolor).toBe(undefined);
            expect(hasBgRect()).toBe(false);

            return Plotly.react(gd, {
                data: [{ type: 'scatter', x: x, y: y, z: z }],
                layout: { plot_bgcolor: 'green' }
            });
        }).then(function() {
            expect(gd._fullLayout.plot_bgcolor).toBe('green');
            expect(hasBgRect()).toBe(true);
        })
        .then(done, done.fail);
    });

    it('clear plot background when react from gl2d to gl3d & back', function(done) {
        Plotly.newPlot(gd, {
            data: [{ type: 'scatter2d', x: x, y: y, z: z }],
            layout: { plot_bgcolor: 'green' }
        }).then(function() {
            expect(gd._fullLayout.plot_bgcolor).toBe('green');
            expect(hasBgRect()).toBe(true);

            return Plotly.react(gd, {
                data: [{ type: 'scatter3d', x: x, y: y, z: z }],
                layout: { plot_bgcolor: 'red' }
            });
        }).then(function() {
            expect(gd._fullLayout.plot_bgcolor).toBe(undefined);
            expect(hasBgRect()).toBe(false);

            return Plotly.react(gd, {
                data: [{ type: 'scatter2d', x: x, y: y, z: z }],
                layout: { plot_bgcolor: 'green' }
            });
        }).then(function() {
            expect(gd._fullLayout.plot_bgcolor).toBe('green');
            expect(hasBgRect()).toBe(true);
        })
        .then(done, done.fail);
    });

    it('create plot background when react from gl3d to gl2d & back', function(done) {
        Plotly.newPlot(gd, {
            data: [{ type: 'scatter3d', x: x, y: y, z: z }],
            layout: { plot_bgcolor: 'red' }
        }).then(function() {
            expect(gd._fullLayout.plot_bgcolor).toBe(undefined);
            expect(hasBgRect()).toBe(false);

            return Plotly.react(gd, {
                data: [{ type: 'scatter2d', x: x, y: y, z: z }],
                layout: { plot_bgcolor: 'green' }
            });
        }).then(function() {
            expect(gd._fullLayout.plot_bgcolor).toBe('green');
            expect(hasBgRect()).toBe(true);

            return Plotly.react(gd, {
                data: [{ type: 'scatter3d', x: x, y: y, z: z }],
                layout: { plot_bgcolor: 'red' }
            });
        }).then(function() {
            expect(gd._fullLayout.plot_bgcolor).toBe(undefined);
            expect(hasBgRect()).toBe(false);
        })
        .then(done, done.fail);
    });

    it('create plot background when react from gl3d to cartesian & back', function(done) {
        Plotly.newPlot(gd, {
            data: [{ type: 'scatter3d', x: x, y: y, z: z }],
            layout: { plot_bgcolor: 'red' }
        }).then(function() {
            expect(gd._fullLayout.plot_bgcolor).toBe(undefined);
            expect(hasBgRect()).toBe(false);

            return Plotly.react(gd, {
                data: [{ type: 'scatter', x: x, y: y, z: z }],
                layout: { plot_bgcolor: 'green' }
            });
        }).then(function() {
            expect(gd._fullLayout.plot_bgcolor).toBe('green');
            expect(hasBgRect()).toBe(true);

            return Plotly.react(gd, {
                data: [{ type: 'scatter3d', x: x, y: y, z: z }],
                layout: { plot_bgcolor: 'red' }
            });
        }).then(function() {
            expect(gd._fullLayout.plot_bgcolor).toBe(undefined);
            expect(hasBgRect()).toBe(false);
        })
        .then(done, done.fail);
    });

    it('change plot background when react from cartesian to gl2d & back', function(done) {
        Plotly.newPlot(gd, {
            data: [{ type: 'scatter', x: x, y: y, z: z }],
            layout: { plot_bgcolor: 'yellow' }
        }).then(function() {
            expect(gd._fullLayout.plot_bgcolor).toBe('yellow');
            expect(hasBgRect()).toBe(true);

            return Plotly.react(gd, {
                data: [{ type: 'scatter2d', x: x, y: y, z: z }],
                layout: { plot_bgcolor: 'green' }
            });
        }).then(function() {
            expect(gd._fullLayout.plot_bgcolor).toBe('green');
            expect(hasBgRect()).toBe(true);

            return Plotly.react(gd, {
                data: [{ type: 'scatter', x: x, y: y, z: z }],
                layout: { plot_bgcolor: 'yellow' }
            });
        }).then(function() {
            expect(gd._fullLayout.plot_bgcolor).toBe('yellow');
            expect(hasBgRect()).toBe(true);
        })
        .then(done, done.fail);
    });

    it('change plot background when react from gl2d to cartesian & back', function(done) {
        Plotly.newPlot(gd, {
            data: [{ type: 'scatter2d', x: x, y: y, z: z }],
            layout: { plot_bgcolor: 'yellow' }
        }).then(function() {
            expect(gd._fullLayout.plot_bgcolor).toBe('yellow');
            expect(hasBgRect()).toBe(true);

            return Plotly.react(gd, {
                data: [{ type: 'scatter', x: x, y: y, z: z }],
                layout: { plot_bgcolor: 'green' }
            });
        }).then(function() {
            expect(gd._fullLayout.plot_bgcolor).toBe('green');
            expect(hasBgRect()).toBe(true);

            return Plotly.react(gd, {
                data: [{ type: 'scatter2d', x: x, y: y, z: z }],
                layout: { plot_bgcolor: 'yellow' }
            });
        }).then(function() {
            expect(gd._fullLayout.plot_bgcolor).toBe('yellow');
            expect(hasBgRect()).toBe(true);
        })
        .then(done, done.fail);
    });
});

describe('Plotly.react and uirevision attributes', function() {
    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(function() {
        Plotly.purge(gd);
        destroyGraphDiv();
    });

    function checkCloseIfArray(val1, val2, msg) {
        if(Array.isArray(val1) && Array.isArray(val2)) {
            if(Array.isArray(val1[0]) && Array.isArray(val2[0])) {
                expect(val1).toBeCloseTo2DArray(val2, 2, msg);
            } else {
                expect(val1).toBeCloseToArray(val2, 2, msg);
            }
        } else {
            expect(val1).toBe(val2, msg);
        }
    }

    function checkState(dataKeys, layoutKeys, msg) {
        var np = Lib.nestedProperty;
        return function() {
            dataKeys.forEach(function(traceKeys, i) {
                var trace = gd.data[i];
                var fullTrace = gd._fullData.filter(function(ft) {
                    return ft.index === i;
                })[0]._fullInput;

                for(var key in traceKeys) {
                    var val = traceKeys[key];
                    var valIn = Array.isArray(val) ? val[0] : val;
                    var valOut = Array.isArray(val) ? val[val.length - 1] : val;
                    checkCloseIfArray(np(trace, key).get(), valIn, msg + ': data[' + i + '].' + key);
                    checkCloseIfArray(np(fullTrace, key).get(), valOut, msg + ': _fullData[' + i + '].' + key);
                    checkCloseIfArray(np(trace, key).get(), valIn, msg + ': data[' + i + '].' + key);
                    checkCloseIfArray(np(fullTrace, key).get(), valOut, msg + ': _fullData[' + i + '].' + key);
                }
            });

            for(var key in (layoutKeys || {})) {
                var val = layoutKeys[key];
                var valIn = Array.isArray(val) ? val[0] : val;
                var valOut = Array.isArray(val) ? val[val.length - 1] : val;
                checkCloseIfArray(np(gd.layout, key).get(), valIn, msg + ': layout.' + key);
                checkCloseIfArray(np(gd._fullLayout, key).get(), valOut, msg + ': _fullLayout.' + key);
            }
        };
    }

    function _react(fig) {
        return function() {
            return Plotly.react(gd, fig);
        };
    }

    it('preserves zoom and trace visibility state until uirevision changes', function(done) {
        var checkNoEdits = checkState([{
        }, {
            visible: [undefined, true]
        }], {
            'xaxis.autorange': true,
            'yaxis.autorange': true
        }, 'initial');

        var checkHasEdits = checkState([{
        }, {
            visible: 'legendonly'
        }], {
            'xaxis.range[0]': 0,
            'xaxis.range[1]': 1,
            'xaxis.autorange': false,
            'yaxis.range[0]': 1,
            'yaxis.range[1]': 2,
            'yaxis.autorange': false
        }, 'with GUI edits');

        var i = 0;
        function fig(rev) {
            i++;
            return {
                data: [{y: [1, 3, i]}, {y: [2, 1, i + 1]}],
                layout: {uirevision: rev}
            };
        }

        function setEdits() {
            return Registry.call('_guiRelayout', gd, {
                'xaxis.range': [0, 1],
                'yaxis.range': [1, 2]
            })
            .then(function() {
                return Registry.call('_guiRestyle', gd, 'visible', 'legendonly', [1]);
            });
        }

        Plotly.newPlot(gd, fig('something'))
        .then(checkNoEdits)
        .then(setEdits)
        .then(checkHasEdits)
        .then(_react(fig('something')))
        .then(checkHasEdits)
        .then(_react(fig('something else!')))
        .then(checkNoEdits)
        .then(_react(fig('something')))
        // back to the first uirevision, but the changes are gone forever
        .then(checkNoEdits)
        // falsy uirevision - does not preserve edits
        .then(_react(fig(false)))
        .then(checkNoEdits)
        .then(setEdits)
        .then(checkHasEdits)
        .then(_react(fig(false)))
        .then(checkNoEdits)
        .then(done, done.fail);
    });

    it('moves trace visibility with uid', function(done) {
        Plotly.newPlot(gd,
            [{y: [1, 3, 1], uid: 'a'}, {y: [2, 1, 2], uid: 'b'}],
            {uirevision: 'something'}
        )
        .then(function() {
            return Registry.call('_guiRestyle', gd, 'visible', 'legendonly', [1]);
        })
        // we hid the second trace, with uid b
        .then(checkState([{visible: [undefined, true]}, {visible: 'legendonly'}]))
        .then(_react({
            data: [{y: [1, 3, 1], uid: 'b'}, {y: [2, 1, 2], uid: 'a'}],
            layout: {uirevision: 'something'}
        }))
        // now the first trace is hidden, because it has uid b now!
        .then(checkState([{visible: 'legendonly'}, {visible: [undefined, true]}]))
        .then(done, done.fail);
    });

    describe('should handle case where traces are removed', function() {
        var y0 = [1, 2, 1];
        var y1 = [2, 1, 2];

        function mockLegendClick() {
            return Registry.call('_guiRestyle', gd, 'visible', 'legendonly');
        }

        function _assert(msg, exp) {
            return function() {
                expect(gd._fullData.length).toBe(exp.length, msg + ' - # traces');
                exp.forEach(function(expi, i) {
                    expect(gd._fullData[i].visible).toBe(expi, msg + ' trace ' + i + ' visibility');
                });
            };
        }

        it('- case no uirevision no uid', function(done) {
            Plotly.newPlot(gd, [{y: y0}, {y: y1}])
            .then(_assert('base', [true, true]))
            .then(mockLegendClick)
            .then(_react([{y: [1, 2, 1]}]))
            .then(_assert('after react', [true]))
            .then(done, done.fail);
        });

        it('- case no uirevision with uid', function(done) {
            Plotly.newPlot(gd, [{y: y0, uid: 'a'}, {y: y1, uid: 'b'}])
            .then(_assert('base', [true, true]))
            .then(mockLegendClick)
            .then(_react([{y: [1, 2, 1], uid: 'a'}]))
            .then(_assert('after react', [true]))
            .then(done, done.fail);
        });

        it('- case with uirevision no uid', function(done) {
            Plotly.newPlot(gd, [{y: y0}, {y: y1}], {uirevision: true})
            .then(_assert('base', [true, true]))
            .then(mockLegendClick)
            .then(_react({data: [{y: [1, 2, 1]}], layout: {uirevision: true}}))
            .then(_assert('after react', ['legendonly']))
            .then(done, done.fail);
        });

        it('- case with uirevision with uid', function(done) {
            Plotly.newPlot(gd, [{y: y0, uid: 'a'}, {y: y1, uid: 'b'}], {uirevision: true})
            .then(_assert('base', [true, true]))
            .then(mockLegendClick)
            .then(_react({data: [{y: [1, 2, 1], uid: 'a'}], layout: {uirevision: true}}))
            .then(_assert('after react', ['legendonly']))
            .then(done, done.fail);
        });
    });

    it('controls axis edits with axis.uirevision', function(done) {
        function fig(mainRev, xRev, yRev, x2Rev, y2Rev) {
            return {
                data: [{y: [1, 2, 1]}, {y: [3, 4, 3], xaxis: 'x2', yaxis: 'y2'}],
                layout: {
                    uirevision: mainRev,
                    grid: {columns: 2, pattern: 'independent'},
                    xaxis: {uirevision: xRev},
                    yaxis: {uirevision: yRev},
                    xaxis2: {uirevision: x2Rev},
                    yaxis2: {uirevision: y2Rev}
                }
            };
        }

        function checkAutoRange(x, y, x2, y2, msg) {
            return checkState([], {
                'xaxis.autorange': x,
                'yaxis.autorange': y,
                'xaxis2.autorange': x2,
                'yaxis2.autorange': y2
            }, msg);
        }

        function setExplicitRanges() {
            return Registry.call('_guiRelayout', gd, {
                'xaxis.range': [1, 2],
                'yaxis.range': [2, 3],
                'xaxis2.range': [3, 4],
                'yaxis2.range': [4, 5]
            });
        }

        Plotly.newPlot(gd, fig('a', 'x1a', 'y1a', 'x2a', 'y2a'))
        .then(checkAutoRange(true, true, true, true))
        .then(setExplicitRanges)
        .then(checkAutoRange(false, false, false, false))
        // change main rev (no effect) and y1 and x2
        .then(_react(fig('b', 'x1a', 'y1b', 'x2b', 'y2a')))
        .then(checkAutoRange(false, true, true, false))
        // now reset with falsy revisions for x2 & y2 but undefined for x1 & y1
        // to show that falsy says "never persist changes here" but undefined
        // will be inherited
        .then(_react(fig('a', undefined, undefined, false, '')))
        .then(checkAutoRange(true, true, true, true))
        .then(setExplicitRanges)
        .then(checkAutoRange(false, false, false, false))
        .then(_react(fig('a', undefined, undefined, false, '')))
        .then(checkAutoRange(false, false, true, true))
        .then(_react(fig('b', undefined, undefined, false, '')))
        .then(checkAutoRange(true, true, true, true))
        .then(done, done.fail);
    });

    function setCartesianRanges(xRange, yRange) {
        return function() {
            return Registry.call('_guiRelayout', gd, {
                'xaxis.range': xRange,
                'yaxis.range': yRange
            });
        };
    }

    function checkCartesianRanges(xRange, yRange, msg) {
        return checkState([], {
            'xaxis.range': [xRange],
            'yaxis.range': [yRange]
        }, msg);
    }

    it('treats explicit and implicit cartesian autorange the same', function(done) {
        function fig(explicit, uirevision) {
            return {
                data: [{z: [[1, 2], [3, 4]], type: 'heatmap', x: [0, 1, 2], y: [3, 4, 5]}],
                layout: {
                    xaxis: explicit ? {autorange: true, range: [0, 2]} : {},
                    yaxis: explicit ? {autorange: true, range: [3, 5]} : {},
                    uirevision: uirevision
                }
            };
        }

        // First go from implicit to explicit and back after zooming in
        Plotly.newPlot(gd, fig(false, 'a'))
        .then(checkCartesianRanges([0, 2], [3, 5], 'initial implicit'))
        .then(setCartesianRanges([2, 4], [5, 7]))
        .then(checkCartesianRanges([2, 4], [5, 7], 'zoomed from implicit'))
        .then(_react(fig(true, 'a')))
        .then(checkCartesianRanges([2, 4], [5, 7], 'react to explicit'))
        .then(_react(fig(true, 'a')))
        .then(checkCartesianRanges([2, 4], [5, 7], 'react to STAY explicit'))
        .then(_react(fig(false, 'a')))
        .then(checkCartesianRanges([2, 4], [5, 7], 'back to implicit'))
        // then go from explicit to implicit and back after zooming in
        .then(_react(fig(true, 'b')))
        .then(checkCartesianRanges([0, 2], [3, 5], 'new uirevision explicit'))
        .then(setCartesianRanges([4, 6], [7, 9]))
        .then(checkCartesianRanges([4, 6], [7, 9], 'zoomed from explicit'))
        .then(_react(fig(false, 'b')))
        .then(checkCartesianRanges([4, 6], [7, 9], 'react to implicit'))
        .then(_react(fig(false, 'b')))
        .then(checkCartesianRanges([4, 6], [7, 9], 'react to STAY implicit'))
        .then(_react(fig(true, 'b')))
        .then(checkCartesianRanges([4, 6], [7, 9], 'back to explicit'))
        .then(done, done.fail);
    });

    it('respects reverting an explicit cartesian axis range to auto', function(done) {
        function fig(xRange, yRange) {
            return {
                data: [{z: [[1, 2], [3, 4]], type: 'heatmap', x: [0, 1, 2], y: [3, 4, 5]}],
                layout: {
                    xaxis: {range: xRange},
                    yaxis: {range: yRange},
                    uirevision: 'a'
                }
            };
        }

        Plotly.newPlot(gd, fig([1, 3], [4, 6]))
        .then(checkCartesianRanges([1, 3], [4, 6], 'initial explicit ranges'))
        .then(setCartesianRanges([2, 4], [5, 7]))
        .then(checkCartesianRanges([2, 4], [5, 7], 'zoomed to different explicit'))
        .then(_react(fig(undefined, undefined)))
        .then(checkCartesianRanges([0, 2], [3, 5], 'react to autorange'))
        .then(done, done.fail);
    });

    it('respects reverting an explicit polar axis range to auto', function(done) {
        function fig(range) {
            return {
                data: [{type: 'barpolar', r: [1, 1], theta: [0, 90]}],
                layout: {
                    polar: {radialaxis: {range: range}},
                    uirevision: 'a'
                }
            };
        }

        function setRange(range) {
            return function() {
                return Registry.call('_guiRelayout', gd, {
                    'polar.radialaxis.range': range
                });
            };
        }

        function checkRange(range) {
            return checkState([], {'polar.radialaxis.range': [range]});
        }

        Plotly.newPlot(gd, fig([1, 3]))
        .then(checkRange([1, 3]))
        .then(setRange([2, 4]))
        .then(checkRange([2, 4]))
        .then(_react(fig(undefined)))
        .then(checkRange([0, 1.05263]))
        .then(done, done.fail);
    });

    function _run(figFn, editFn, checkInitial, checkEdited) {
        // figFn should take 2 args (main uirevision and partial uirevision)
        // and return a figure {data, layout}
        // editFn, checkInitial, checkEdited are functions of no args
        return Plotly.newPlot(gd, figFn('main a', 'part a'))
        .then(checkInitial)
        .then(editFn)
        .then(checkEdited)
        .then(_react(figFn('main b', 'part a')))
        .then(checkEdited)
        .then(_react(figFn('main b', 'part b')))
        .then(checkInitial)
        .catch(failTest);
    }

    it('controls trace and pie label visibility from legend.uirevision', function(done) {
        function fig(mainRev, legendRev) {
            return {
                data: [
                    {y: [1, 2]},
                    {y: [2, 1]},
                    {type: 'pie', labels: ['a', 'b', 'c'], values: [1, 2, 3]}
                ],
                layout: {
                    uirevision: mainRev,
                    legend: {uirevision: legendRev}
                }
            };
        }

        function hideSome() {
            return Registry.call('_guiUpdate', gd,
                {visible: 'legendonly'},
                {hiddenlabels: ['b', 'c']},
                [0]
            );
        }

        function checkVisible(traces, hiddenlabels) {
            return checkState(
                traces.map(function(v) {
                    return {visible: v ? [undefined, true] : 'legendonly'};
                }),
                {hiddenlabels: hiddenlabels}
            );
        }
        var checkAllVisible = checkVisible([true, true], undefined);
        // wrap [b, c] in another array to distinguish it from
        // [layout, fullLayout]
        var checkSomeHidden = checkVisible([false, true], [['b', 'c']]);

        _run(fig, hideSome, checkAllVisible, checkSomeHidden).then(done);
    });

    it('@gl preserves modebar interactions using modebar.uirevision', function(done) {
        function fig(mainRev, modebarRev) {
            return {
                data: [
                    {type: 'surface', z: [[1, 2], [3, 4]]},
                    {y: [1, 2]}
                ],
                layout: {
                    scene: {
                        domain: {x: [0, 0.4]},
                        hovermode: 'closest',
                        dragmode: 'zoom'
                    },
                    xaxis: {domain: [0.6, 1], showspikes: true},
                    yaxis: {showspikes: true},
                    uirevision: mainRev,
                    modebar: {uirevision: modebarRev},
                    hovermode: 'closest',
                    dragmode: 'zoom'
                }
            };
        }

        function attrs(original) {
            var dragmode = original ? 'zoom' : 'pan';
            var hovermode = original ? 'closest' : false;
            var spikes = original ? true : false;
            var spikes3D = original ? [undefined, true] : false;
            return {
                dragmode: dragmode,
                hovermode: hovermode,
                'xaxis.showspikes': spikes,
                'yaxis.showspikes': spikes,
                'scene.dragmode': dragmode,
                'scene.hovermode': hovermode,
                'scene.xaxis.showspikes': spikes3D,
                'scene.yaxis.showspikes': spikes3D,
                'scene.zaxis.showspikes': spikes3D
            };
        }

        function editModes() {
            return Registry.call('_guiRelayout', gd, attrs());
        }

        var checkOriginalModes = checkState([], attrs(true));
        var checkEditedModes = checkState([], attrs());

        _run(fig, editModes, checkOriginalModes, checkEditedModes).then(done, done.fail);
    });

    it('preserves geo viewport changes using geo.uirevision', function(done) {
        function fig(mainRev, geoRev) {
            return {
                data: [{
                    type: 'scattergeo', lon: [0, -75], lat: [0, 45]
                }],
                layout: {
                    uirevision: mainRev,
                    geo: {uirevision: geoRev}
                }
            };
        }

        function attrs(original) {
            return {
                'geo.projection.scale': original ? [undefined, 1] : 3,
                'geo.projection.rotation.lon': original ? [undefined, 0] : -45,
                'geo.center.lat': original ? [undefined, 0] : 22,
                'geo.center.lon': original ? [undefined, 0] : -45
            };
        }

        function editView() {
            return Registry.call('_guiRelayout', gd, attrs());
        }

        var checkOriginalView = checkState([], attrs(true));
        var checkEditedView = checkState([], attrs());

        _run(fig, editView, checkOriginalView, checkEditedView).then(done, done.fail);
    });

    it('preserves geo viewport changes using geo.uirevision (fitbounds case)', function(done) {
        function fig(mainRev, geoRev) {
            return {
                data: [{
                    type: 'scattergeo', lon: [0, -75], lat: [0, 45]
                }],
                layout: {
                    uirevision: mainRev,
                    geo: {uirevision: geoRev, fitbounds: 'locations'}
                }
            };
        }

        function attrs(original) {
            return {
                'geo.fitbounds': original ? ['locations', 'locations'] : false,
                'geo.projection.scale': original ? [undefined, undefined] : 3,
                'geo.projection.rotation.lon': original ? [undefined, undefined] : -45,
                'geo.center.lat': original ? [undefined, undefined] : 22,
                'geo.center.lon': original ? [undefined, undefined] : -45
            };
        }

        function editView() {
            return Registry.call('_guiRelayout', gd, attrs());
        }

        var checkOriginalView = checkState([], attrs(true));
        var checkEditedView = checkState([], attrs());

        _run(fig, editView, checkOriginalView, checkEditedView).then(done, done.fail);
    });

    it('@gl preserves 3d camera changes using scene.uirevision', function(done) {
        function fig(mainRev, sceneRev) {
            return {
                data: [{type: 'surface', z: [[1, 2], [3, 4]]}],
                layout: {
                    uirevision: mainRev,
                    scene: {uirevision: sceneRev}
                }
            };
        }

        function editCamera() {
            return Registry.call('_guiRelayout', gd, {
                'scene.camera': {
                    center: {x: 1, y: 2, z: 3},
                    eye: {x: 2, y: 3, z: 4},
                    up: {x: 0, y: 0, z: 1}
                }
            });
        }

        function _checkCamera(original) {
            return checkState([], {
                'scene.camera.center.x': original ? [undefined, 0] : 1,
                'scene.camera.center.y': original ? [undefined, 0] : 2,
                'scene.camera.center.z': original ? [undefined, 0] : 3,
                'scene.camera.eye.x': original ? [undefined, 1.25] : 2,
                'scene.camera.eye.y': original ? [undefined, 1.25] : 3,
                'scene.camera.eye.z': original ? [undefined, 1.25] : 4,
                'scene.camera.up.x': original ? [undefined, 0] : 0,
                'scene.camera.up.y': original ? [undefined, 0] : 0,
                'scene.camera.up.z': original ? [undefined, 1] : 1
            });
        }
        var checkOriginalCamera = _checkCamera(true);
        var checkEditedCamera = _checkCamera(false);

        _run(fig, editCamera, checkOriginalCamera, checkEditedCamera).then(done, done.fail);
    });

    it('preserves selectedpoints using selectionrevision', function(done) {
        function fig(mainRev, selectionRev) {
            return {
                data: [{y: [1, 3, 1]}, {y: [2, 1, 3]}],
                layout: {
                    uirevision: mainRev,
                    selectionrevision: selectionRev,
                    dragmode: 'select',
                    width: 400,
                    height: 400,
                    margin: {l: 100, t: 100, r: 100, b: 100}
                }
            };
        }

        function editSelection() {
            // drag across the upper right quadrant, so we'll select
            // curve 0 point 1 and curve 1 point 2
            return drag({node: document.querySelector('.nsewdrag'), dpos: [148, 100], pos0: [150, 102]});
        }

        var checkNoSelection = checkState([
            {selectedpoints: undefined},
            {selectedpoints: undefined}
        ]);
        var checkSelection = checkState([
            {selectedpoints: [[1]]},
            {selectedpoints: [[2]]}
        ]);

        _run(fig, editSelection, checkNoSelection, checkSelection).then(done, done.fail);
    });

    it('preserves polar view changes using polar.uirevision', function(done) {
        // polar you can control either at the subplot or the axis level
        function fig(mainRev, polarRev) {
            return {
                data: [{r: [1, 2], theta: [1, 2], type: 'scatterpolar', mode: 'lines'}],
                layout: {
                    uirevision: mainRev,
                    polar: {uirevision: polarRev}
                }
            };
        }

        function fig2(mainRev, polarRev) {
            return {
                data: [{r: [1, 2], theta: [1, 2], type: 'scatterpolar', mode: 'lines'}],
                layout: {
                    uirevision: mainRev,
                    polar: {
                        angularaxis: {uirevision: polarRev},
                        radialaxis: {uirevision: polarRev}
                    }
                }
            };
        }

        function attrs(original) {
            return {
                'polar.radialaxis.range[0]': original ? 0 : -2,
                'polar.radialaxis.range[1]': original ? 2 : 4,
                'polar.radialaxis.angle': original ? [undefined, 0] : 45,
                'polar.angularaxis.rotation': original ? [undefined, 0] : -90
            };
        }

        function editPolar() {
            return Registry.call('_guiRelayout', gd, attrs());
        }

        var checkInitial = checkState([], attrs(true));
        var checkEdited = checkState([], attrs());

        _run(fig, editPolar, checkInitial, checkEdited)
        .then(function() {
            return _run(fig2, editPolar, checkInitial, checkEdited);
        })
        .then(done, done.fail);
    });

    it('preserves ternary view changes using ternary.uirevision', function(done) {
        function fig(mainRev, ternaryRev) {
            return {
                data: [{a: [1, 2, 3], b: [2, 3, 1], c: [3, 1, 2], type: 'scatterternary'}],
                layout: {
                    uirevision: mainRev,
                    ternary: {uirevision: ternaryRev}
                }
            };
        }

        function fig2(mainRev, ternaryRev) {
            return {
                data: [{a: [1, 2, 3], b: [2, 3, 1], c: [3, 1, 2], type: 'scatterternary'}],
                layout: {
                    uirevision: mainRev,
                    ternary: {
                        aaxis: {uirevision: ternaryRev},
                        baxis: {uirevision: ternaryRev},
                        caxis: {uirevision: ternaryRev}
                    }
                }
            };
        }

        function attrs(original) {
            return {
                'ternary.aaxis.min': original ? [undefined, 0] : 0.1,
                'ternary.baxis.min': original ? [undefined, 0] : 0.2,
                'ternary.caxis.min': original ? [undefined, 0] : 0.3,
            };
        }

        function editTernary() {
            return Registry.call('_guiRelayout', gd, attrs());
        }

        var checkInitial = checkState([], attrs(true));
        var checkEdited = checkState([], attrs());

        _run(fig, editTernary, checkInitial, checkEdited)
        .then(function() {
            return _run(fig2, editTernary, checkInitial, checkEdited);
        })
        .then(done);
    });

    it('@gl preserves mapbox view changes using mapbox.uirevision', function(done) {
        function fig(mainRev, mapboxRev) {
            return {
                data: [{lat: [1, 2], lon: [1, 2], type: 'scattermapbox'}],
                layout: {
                    uirevision: mainRev,
                    mapbox: {uirevision: mapboxRev}
                }
            };
        }

        function attrs(original) {
            return {
                'mapbox.center.lat': original ? [undefined, 0] : 1,
                'mapbox.center.lon': original ? [undefined, 0] : 2,
                'mapbox.zoom': original ? [undefined, 1] : 3,
                'mapbox.bearing': original ? [undefined, 0] : 4,
                'mapbox.pitch': original ? [undefined, 0] : 5
            };
        }

        function editMap() {
            return Registry.call('_guiRelayout', gd, attrs());
        }

        var checkInitial = checkState([], attrs(true));
        var checkEdited = checkState([], attrs());

        Plotly.setPlotConfig({
            mapboxAccessToken: MAPBOX_ACCESS_TOKEN
        });

        _run(fig, editMap, checkInitial, checkEdited).then(done);
    });

    it('@gl preserves map view changes using map.uirevision', function(done) {
        function fig(mainRev, mapRev) {
            return {
                data: [{lat: [1, 2], lon: [1, 2], type: 'scattermap'}],
                layout: {
                    uirevision: mainRev,
                    map: {uirevision: mapRev}
                }
            };
        }

        function attrs(original) {
            return {
                'map.center.lat': original ? [undefined, 0] : 1,
                'map.center.lon': original ? [undefined, 0] : 2,
                'map.zoom': original ? [undefined, 1] : 3,
                'map.bearing': original ? [undefined, 0] : 4,
                'map.pitch': original ? [undefined, 0] : 5
            };
        }

        function editMap() {
            return Registry.call('_guiRelayout', gd, attrs());
        }

        var checkInitial = checkState([], attrs(true));
        var checkEdited = checkState([], attrs());

        Plotly.setPlotConfig({});

        _run(fig, editMap, checkInitial, checkEdited).then(done);
    });

    it('preserves editable: true shape & annotation edits using editrevision', function(done) {
        function fig(mainRev, editRev) {
            return {layout: {
                shapes: [{x0: 0, x1: 0.5, y0: 0, y1: 0.5}],
                annotations: [
                    {x: 1, y: 0, text: 'hi'},
                    {x: 1, y: 1, text: 'bye', showarrow: true, ax: -20, ay: 20}
                ],
                xaxis: {range: [0, 1]},
                yaxis: {range: [0, 1]},
                uirevision: mainRev,
                editrevision: editRev
            }};
        }

        function attrs(original) {
            return {
                'shapes[0].x0': original ? 0 : 0.1,
                'shapes[0].x1': original ? 0.5 : 0.2,
                'shapes[0].y0': original ? 0 : 0.3,
                'shapes[0].y1': original ? 0.5 : 0.4,
                'annotations[1].x': original ? 1 : 0.5,
                'annotations[1].y': original ? 1 : 0.6,
                'annotations[1].ax': original ? -20 : -30,
                'annotations[1].ay': original ? 20 : 30,
                'annotations[1].text': original ? 'bye' : 'buy'
            };
        }

        function editComponents() {
            return Registry.call('_guiRelayout', gd, attrs());
        }

        var checkInitial = checkState([], attrs(true));
        var checkEdited = checkState([], attrs());

        _run(fig, editComponents, checkInitial, checkEdited).then(done);
    });

    it('preserves editable: true plot title and legend & colorbar positions using editrevision', function(done) {
        function fig(mainRev, editRev) {
            return {
                data: [{y: [1, 2]}, {y: [2, 1]}, {z: [[1, 2], [3, 4]], type: 'heatmap'}],
                layout: {
                    uirevision: mainRev,
                    editrevision: editRev
                },
                config: {editable: true}
            };
        }

        function editEditable() {
            return Registry.call('_guiUpdate', gd,
                {'colorbar.x': 0.8, 'colorbar.y': 0.6},
                {'title.text': 'yep', 'title.subtitle.text': 'hey', 'legend.x': 1.1, 'legend.y': 0.9},
                [2]
            );
        }

        function checkAttrs(original) {
            return checkState([{}, {}, {
                'colorbar.x': original ? [undefined, 1.02] : 0.8,
                'colorbar.y': original ? [undefined, 0.5] : 0.6
            }], {
                'title.text': original ? [undefined, 'Click to enter Plot title'] : 'yep',
                'title.subtitle.text': original ? [undefined, 'Click to enter Plot subtitle'] : 'hey',
                'legend.x': original ? [undefined, 1.02] : 1.1,
                'legend.y': original ? [undefined, 1] : 0.9
            });
        }

        _run(fig, editEditable, checkAttrs(true), checkAttrs).then(done);
    });

    it('@gl preserves editable: true name, colorbar title and parcoords constraint range via trace.uirevision', function(done) {
        function fig(mainRev, traceRev) {
            return {
                data: [{
                    type: 'parcoords',
                    dimensions: [
                        {label: 'a', values: [1, 2, 3, 5], constraintrange: [2.5, 3.5]},
                        {label: 'b', values: [7, 9, 5, 6]}
                    ],
                    line: {showscale: true, color: [1, 2, 3, 4]},
                    uirevision: traceRev
                }],
                layout: {
                    uirevision: mainRev,
                    width: 400,
                    height: 400,
                    margin: {l: 100, r: 100, t: 100, b: 100}
                },
                config: {editable: true}
            };
        }

        function attrs(original) {
            return {
                'dimensions[0].constraintrange': original ? [[2.5, 3.5]] : [[[1.5, 2.5], [2.938, 3.979]]],
                'dimensions[1].constraintrange': original ? undefined : [[6.937, 7.979]],
                'line.colorbar.title.text': original ? [undefined, 'Click to enter Colorscale title'] : 'color',
                name: original ? [undefined, 'trace 0'] : 'name'
            };
        }

        function axisDragNode(i) {
            return document.querySelectorAll('.axis-brush .background')[i];
        }

        function editTrace() {
            return Registry.call('_guiRestyle', gd,
                {'line.colorbar.title.text': 'color', name: 'name'},
                [0]
            )
            .then(function() {
                return drag({node: axisDragNode(0), dpos: [0, 50], noCover: true});
            })
            .then(delay(100))
            .then(function() {
                return drag({node: axisDragNode(0), dpos: [0, -50], noCover: true});
            })
            .then(delay(100))
            .then(function() {
                return drag({node: axisDragNode(1), dpos: [0, -50], noCover: true});
            });
        }

        _run(fig, editTrace, checkState([attrs(true)]), checkState([attrs()])).then(done);
    }, 5 * jasmine.DEFAULT_TIMEOUT_INTERVAL);

    it('preserves editable: true axis titles using the axis uirevisions', function(done) {
        function fig(mainRev, axRev) {
            return {
                data: [
                    {y: [1, 2]},
                    {a: [1, 2], b: [2, 1], c: [1, 1], type: 'scatterternary'},
                    {r: [1, 2], theta: [1, 2], type: 'scatterpolar'}
                ],
                layout: {
                    uirevision: mainRev,
                    xaxis: {uirevision: axRev},
                    yaxis: {uirevision: axRev},
                    ternary: {
                        aaxis: {uirevision: axRev},
                        baxis: {uirevision: axRev},
                        caxis: {uirevision: axRev}
                    },
                    polar: {radialaxis: {uirevision: axRev}}
                },
                config: {editable: true}
            };
        }

        function attrs(original) {
            return {
                'xaxis.title.text': original ? [undefined, 'Click to enter X axis title'] : 'XXX',
                'yaxis.title.text': original ? [undefined, 'Click to enter Y axis title'] : 'YYY',
                'ternary.aaxis.title.text': original ? [undefined, 'Component A'] : 'AAA',
                'ternary.baxis.title.text': original ? [undefined, 'Component B'] : 'BBB',
                'ternary.caxis.title.text': original ? [undefined, 'Component C'] : 'CCC',
                'polar.radialaxis.title.text': original ? [undefined, ''] : 'RRR'
            };
        }

        function editComponents() {
            return Registry.call('_guiRelayout', gd, attrs());
        }

        var checkInitial = checkState([], attrs(true));
        var checkEdited = checkState([], attrs());

        _run(fig, editComponents, checkInitial, checkEdited).then(done);
    });

    ['sunburst', 'icicle', 'treemap'].forEach(function(type) {
        it('preserves ' + type + ' level changes', function(done) {
            function assertLevel(msg, exp) {
                expect(gd._fullData[0].level).toBe(exp, msg);
            }

            Plotly.react(gd, [{
                type: type,
                labels: ['Eve', 'Cain', 'Seth', 'Enos', 'Noam', 'Abel', 'Awan', 'Enoch', 'Azura'],
                parents: ['', 'Eve', 'Eve', 'Seth', 'Seth', 'Eve', 'Eve', 'Awan', 'Eve'],
                uirevision: 1
            }])
            .then(function() {
                assertLevel('no set level at start', undefined);
            })
            .then(function() {
                var nodeSeth = d3Select('.slice:nth-child(2)').node();
                mouseEvent('click', 0, 0, {element: nodeSeth});
            })
            .then(function() {
                assertLevel('after clicking on Seth sector', 'Seth');
            })
            .then(function() {
                return Plotly.react(gd, [{
                    type: type,
                    labels: ['Eve', 'Cain', 'Seth', 'Enos', 'Noam', 'Abel', 'Awan', 'Enoch', 'Azura', 'Joe'],
                    parents: ['', 'Eve', 'Eve', 'Seth', 'Seth', 'Eve', 'Eve', 'Awan', 'Eve', 'Seth'],
                    uirevision: 1
                }]);
            })
            .then(function() {
                assertLevel('after reacting with new data, but with same uirevision', 'Seth');
            })
            .then(done, done.fail);
        });
    });
});

describe('Test Plotly.react + interactions under uirevision:', function() {
    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(function() {
        Plotly.purge(gd);
        destroyGraphDiv();
    });

    it('@gl gl3d subplots preserve camera changes on interactions', function(done) {
        function _react() {
            return Plotly.react(gd, [{
                type: 'surface',
                z: [[1, 2, 3], [3, 1, 2], [2, 3, 1]]
            }], {
                width: 500,
                height: 500,
                uirevision: true
            });
        }

        // mocking panning/scrolling with mouse events is brittle,
        // this here is enough to to trigger the relayoutCallback
        function _mouseup() {
            var sceneLayout = gd._fullLayout.scene;
            var cameraOld = sceneLayout.camera;
            sceneLayout._scene.setViewport({
                camera: {
                    projection: {type: 'perspective'},
                    eye: {x: 2, y: 2, z: 2},
                    center: cameraOld.center,
                    up: cameraOld.up
                },
                aspectratio: gd._fullLayout.scene.aspectratio
            });

            var target = gd.querySelector('.svg-container .gl-container #scene canvas');
            return new Promise(function(resolve) {
                mouseEvent('mouseup', 200, 200, {element: target});
                setTimeout(resolve, 0);
            });
        }

        // should be same before & after 2nd react()
        function _assertGUI(msg) {
            var TOL = 2;

            var eye = ((gd.layout.scene || {}).camera || {}).eye || {};
            expect(eye.x).toBeCloseTo(2, TOL, msg);
            expect(eye.y).toBeCloseTo(2, TOL, msg);
            expect(eye.z).toBeCloseTo(2, TOL, msg);

            var fullEye = gd._fullLayout.scene.camera.eye;
            expect(fullEye.x).toBeCloseTo(2, TOL, msg);
            expect(fullEye.y).toBeCloseTo(2, TOL, msg);
            expect(fullEye.z).toBeCloseTo(2, TOL, msg);

            var preGUI = gd._fullLayout._preGUI;
            expect(preGUI['scene.camera']).toBe(null, msg);
        }

        _react()
        .then(function() {
            expect(gd.layout.scene).toEqual(jasmine.objectContaining({
                aspectratio: {x: 1, y: 1, z: 1},
                aspectmode: 'auto'
            }));
            expect(gd.layout.scene.camera).toBe(undefined);

            var fullEye = gd._fullLayout.scene.camera.eye;
            expect(fullEye.x).toBe(1.25);
            expect(fullEye.y).toBe(1.25);
            expect(fullEye.z).toBe(1.25);

            expect(gd._fullLayout._preGUI).toEqual({});
        })
        .then(function() { return _mouseup(); })
        .then(function() { _assertGUI('before'); })
        .then(_react)
        .then(function() { _assertGUI('after'); })
        .then(done, done.fail);
    });

    it('geo subplots should preserve viewport changes after panning', function(done) {
        function _react() {
            return Plotly.react(gd, [{
                type: 'scattergeo',
                lon: [3, 1, 2],
                lat: [2, 3, 1]
            }], {
                width: 500,
                height: 500,
                uirevision: true
            });
        }

        // should be same before & after 2nd react()
        function _assertGUI(msg) {
            var TOL = 2;

            var geo = gd.layout.geo || {};
            expect(((geo.projection || {}).rotation || {}).lon).toBeCloseTo(-52.94, TOL, msg);
            expect((geo.center || {}).lon).toBeCloseTo(-52.94, TOL, msg);
            expect((geo.center || {}).lat).toBeCloseTo(52.94, TOL, msg);

            var fullGeo = gd._fullLayout.geo;
            expect(fullGeo.projection.rotation.lon).toBeCloseTo(-52.94, TOL, msg);
            expect(fullGeo.center.lon).toBeCloseTo(-52.94, TOL, msg);
            expect(fullGeo.center.lat).toBeCloseTo(52.94, TOL, msg);

            var preGUI = gd._fullLayout._preGUI;
            expect(preGUI['geo.projection.rotation.lon']).toBe(null, msg);
            expect(preGUI['geo.center.lon']).toBe(null, msg);
            expect(preGUI['geo.center.lat']).toBe(null, msg);
            expect(preGUI['geo.projection.scale']).toBe(null, msg);
        }

        _react()
        .then(function() {
            expect(gd.layout.geo).toEqual({});

            var fullGeo = gd._fullLayout.geo;
            expect(fullGeo.projection.rotation.lon).toBe(0);
            expect(fullGeo.center.lon).toBe(0);
            expect(fullGeo.center.lat).toBe(0);

            expect(gd._fullLayout._preGUI).toEqual({});
        })
        .then(function() { return drag({pos0: [200, 200], dpos: [50, 50], noCover: true}); })
        .then(function() { _assertGUI('before'); })
        .then(_react)
        .then(function() { _assertGUI('after'); })
        .then(done, done.fail);
    });

    it('@gl mapbox subplots should preserve viewport changes after panning', function(done) {
        Plotly.setPlotConfig({
            mapboxAccessToken: MAPBOX_ACCESS_TOKEN
        });

        function _react() {
            return Plotly.react(gd, [{
                type: 'scattermapbox',
                lon: [3, 1, 2],
                lat: [2, 3, 1]
            }], {
                width: 500,
                height: 500,
                uirevision: true
            });
        }

        // see mapbox_test.js for rationale
        function _mouseEvent(type, pos) {
            return new Promise(function(resolve) {
                mouseEvent(type, pos[0], pos[1], {
                    buttons: 1 // left button
                });
                setTimeout(resolve, 100);
            });
        }

        // see mapbox_test.js for rationale
        function _drag(p0, p1) {
            return _mouseEvent('mousemove', p0)
                .then(function() { return _mouseEvent('mousedown', p0); })
                .then(function() { return _mouseEvent('mousemove', p1); })
                .then(function() { return _mouseEvent('mousemove', p1); })
                .then(function() { return _mouseEvent('mouseup', p1); })
                .then(function() { return _mouseEvent('mouseup', p1); });
        }

        // should be same before & after 2nd react()
        function _assertGUI(msg) {
            var TOL = 2;

            var mapbox = gd.layout.mapbox || {};
            expect((mapbox.center || {}).lon).toBeCloseTo(-17.578, TOL, msg);
            expect((mapbox.center || {}).lat).toBeCloseTo(17.308, TOL, msg);
            expect(mapbox.zoom).toBe(1);

            var fullMapbox = gd._fullLayout.mapbox || {};
            expect(fullMapbox.center.lon).toBeCloseTo(-17.578, TOL, msg);
            expect(fullMapbox.center.lat).toBeCloseTo(17.308, TOL, msg);
            expect(fullMapbox.zoom).toBe(1);

            var preGUI = gd._fullLayout._preGUI;
            expect(preGUI['mapbox.center.lon']).toBe(null, msg);
            expect(preGUI['mapbox.center.lat']).toBe(null, msg);
            expect(preGUI['mapbox.zoom']).toBe(null, msg);
        }

        _react()
        .then(function() {
            expect(gd.layout.mapbox).toEqual({});

            var fullMapbox = gd._fullLayout.mapbox;
            expect(fullMapbox.center.lon).toBe(0);
            expect(fullMapbox.center.lat).toBe(0);
            expect(fullMapbox.zoom).toBe(1);

            expect(gd._fullLayout._preGUI).toEqual({});
        })
        .then(function() { return _drag([200, 200], [250, 250]); })
        .then(function() { _assertGUI('before'); })
        .then(_react)
        .then(function() { _assertGUI('after'); })
        .then(done, done.fail);
    });

    it('@gl map subplots should preserve viewport changes after panning', function(done) {
        Plotly.setPlotConfig({});

        function _react() {
            return Plotly.react(gd, [{
                type: 'scattermap',
                lon: [3, 1, 2],
                lat: [2, 3, 1]
            }], {
                width: 500,
                height: 500,
                uirevision: true
            });
        }

        // see map_test.js for rationale
        function _mouseEvent(type, pos) {
            return new Promise(function(resolve) {
                mouseEvent(type, pos[0], pos[1], {
                    buttons: 1 // left button
                });
                setTimeout(resolve, 100);
            });
        }

        // see map_test.js for rationale
        function _drag(p0, p1) {
            return _mouseEvent('mousemove', p0)
                .then(function() { return _mouseEvent('mousedown', p0); })
                .then(function() { return _mouseEvent('mousemove', p1); })
                .then(function() { return _mouseEvent('mousemove', p1); })
                .then(function() { return _mouseEvent('mouseup', p1); })
                .then(function() { return _mouseEvent('mouseup', p1); });
        }

        // should be same before & after 2nd react()
        function _assertGUI(msg) {
            var TOL = 2;

            var map = gd.layout.map || {};
            expect((map.center || {}).lon).toBeCloseTo(-17.578, TOL, msg);
            expect((map.center || {}).lat).toBeCloseTo(17.308, TOL, msg);
            expect(map.zoom).toBe(1);

            var fullMap = gd._fullLayout.map || {};
            expect(fullMap.center.lon).toBeCloseTo(-17.578, TOL, msg);
            expect(fullMap.center.lat).toBeCloseTo(17.308, TOL, msg);
            expect(fullMap.zoom).toBe(1);

            var preGUI = gd._fullLayout._preGUI;
            expect(preGUI['map.center.lon']).toBe(null, msg);
            expect(preGUI['map.center.lat']).toBe(null, msg);
            expect(preGUI['map.zoom']).toBe(null, msg);
        }

        _react()
        .then(function() {
            expect(gd.layout.map).toEqual({});

            var fullMap = gd._fullLayout.map;
            expect(fullMap.center.lon).toBe(0);
            expect(fullMap.center.lat).toBe(0);
            expect(fullMap.zoom).toBe(1);

            expect(gd._fullLayout._preGUI).toEqual({});
        })
        .then(function() { return _drag([200, 200], [250, 250]); })
        .then(function() { _assertGUI('before'); })
        .then(_react)
        .then(function() { _assertGUI('after'); })
        .then(done, done.fail);
    });
});
