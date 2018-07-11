var Plotly = require('@lib/index');
var Filter = require('@lib/filter');

var Plots = require('@src/plots/plots');
var Lib = require('@src/lib');

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var customAssertions = require('../assets/custom_assertions');
var supplyAllDefaults = require('../assets/supply_defaults');

var assertDims = customAssertions.assertDims;
var assertStyle = customAssertions.assertStyle;

var mockFullLayout = {
    _subplots: {cartesian: ['xy'], xaxis: ['x'], yaxis: ['y']},
    _modules: [],
    _basePlotModules: [],
    _has: function() {},
    _dfltTitle: {x: 'xxx', y: 'yyy'},
    _requestRangeslider: {},
    _traceUids: []
};


describe('general transforms:', function() {
    'use strict';

    var fullLayout = {
        _transformModules: [],
        _subplots: {cartesian: ['xy'], xaxis: ['x'], yaxis: ['y']},
        _modules: [],
        _basePlotModules: []
    };

    var traceIn, traceOut;

    it('passes through empty transforms', function() {
        traceIn = {
            y: [2, 1, 2],
            transforms: [{}]
        };

        traceOut = Plots.supplyTraceDefaults(traceIn, {type: 'scatter'}, 0, fullLayout);

        expect(traceOut.transforms).toEqual([{}]);
    });

    it('does not transform traces with no length', function() {
        traceIn = {
            y: [],
            transforms: [{}]
        };

        traceOut = Plots.supplyTraceDefaults(traceIn, {type: 'scatter'}, 0, fullLayout);

        expect(traceOut.transforms).toBeUndefined();
    });

    it('supplyTraceDefaults should supply the transform defaults', function() {
        traceIn = {
            y: [2, 1, 2],
            transforms: [{ type: 'filter' }]
        };

        traceOut = Plots.supplyTraceDefaults(traceIn, {type: 'scatter'}, 0, fullLayout);

        expect(traceOut.transforms).toEqual([{
            type: 'filter',
            enabled: true,
            operation: '=',
            value: 0,
            target: 'x',
            preservegaps: false,
            _module: Filter
        }]);
    });

    it('supplyTraceDefaults should not bail if transform module is not found', function() {
        traceIn = {
            y: [2, 1, 2],
            transforms: [{ type: 'invalid' }]
        };

        traceOut = Plots.supplyTraceDefaults(traceIn, {type: 'scatter'}, 0, fullLayout);

        expect(traceOut.y).toBe(traceIn.y);
    });

    it('supplyTraceDefaults should honor global transforms', function() {
        traceIn = {
            y: [2, 1, 2],
            transforms: [{
                type: 'filter',
                operation: '>',
                value: 0,
                target: 'x'
            }]
        };

        var layout = {
            _transformModules: [],
            _globalTransforms: [{
                type: 'filter'
            }],
            _subplots: {cartesian: ['xy'], xaxis: ['x'], yaxis: ['y']},
            _modules: [],
            _basePlotModules: []
        };

        traceOut = Plots.supplyTraceDefaults(traceIn, {type: 'scatter'}, 0, layout);

        expect(traceOut.transforms[0]).toEqual(jasmine.objectContaining({
            type: 'filter',
            enabled: true,
            operation: '=',
            value: 0,
            target: 'x',
            _module: Filter
        }), '- global first');

        expect(traceOut.transforms[1]).toEqual(jasmine.objectContaining({
            type: 'filter',
            enabled: true,
            operation: '>',
            value: 0,
            target: 'x',
            _module: Filter
        }), '- trace second');

        expect(layout._transformModules).toEqual([Filter]);
    });

    it('supplyDataDefaults should apply the transform while', function() {
        var dataIn = [{
            x: [-2, -2, 1, 2, 3],
            y: [1, 2, 2, 3, 1]
        }, {
            x: [-2, -1, -2, 0, 1, 2, 3],
            y: [1, 2, 3, 1, 2, 3, 1],
            transforms: [{
                type: 'filter',
                operation: '>',
                value: 0,
                target: 'x'
            }]
        }];

        var dataOut = [];
        Plots.supplyDataDefaults(dataIn, dataOut, {}, mockFullLayout);

        var msg;

        msg = 'does not mutate user data';
        expect(dataIn[1].x).toEqual([-2, -1, -2, 0, 1, 2, 3], msg);
        expect(dataIn[1].y).toEqual([1, 2, 3, 1, 2, 3, 1], msg);
        expect(dataIn[1].transforms).toEqual([{
            type: 'filter',
            operation: '>',
            value: 0,
            target: 'x'
        }], msg);

        msg = 'supplying the transform defaults';
        expect(dataOut[1].transforms[0]).toEqual(jasmine.objectContaining({
            type: 'filter',
            enabled: true,
            operation: '>',
            value: 0,
            target: 'x',
            _module: Filter
        }), msg);

        msg = 'keeping refs to user data';
        expect(dataOut[1]._input.x).toEqual([-2, -1, -2, 0, 1, 2, 3], msg);
        expect(dataOut[1]._input.y).toEqual([1, 2, 3, 1, 2, 3, 1], msg);
        expect(dataOut[1]._input.transforms).toEqual([{
            type: 'filter',
            operation: '>',
            value: 0,
            target: 'x',
        }], msg);

        msg = 'keeping refs to full transforms array';
        expect(dataOut[1]._fullInput.transforms).toEqual([{
            type: 'filter',
            enabled: true,
            operation: '>',
            value: 0,
            target: 'x',
            preservegaps: false,
            _module: Filter
        }], msg);

        msg = 'setting index w.r.t user data';
        expect(dataOut[0].index).toEqual(0, msg);
        expect(dataOut[1].index).toEqual(1, msg);

        msg = 'setting _expandedIndex w.r.t full data';
        expect(dataOut[0]._expandedIndex).toEqual(0, msg);
        expect(dataOut[1]._expandedIndex).toEqual(1, msg);
    });

});

describe('user-defined transforms:', function() {
    'use strict';

    it('should pass correctly arguments to transform methods', function() {
        var transformIn = { type: 'fake' };
        var transformOut = {};

        var calledSupplyDefaults = 0;
        var calledTransform = 0;
        var calledSupplyLayoutDefaults = 0;

        var dataIn = [{
            y: [1, 2, 3],
            transforms: [transformIn]
        }];

        var fullData = [];
        var layout = {};
        var fullLayout = Lib.extendDeep({}, mockFullLayout);
        var transitionData = {};

        function assertSupplyDefaultsArgs(_transformIn, traceOut, _layout) {
            if(!calledSupplyDefaults) {
                expect(_transformIn).toBe(transformIn);
            }
            else {
                // second supplyDefaults call has _module attached
                expect(_transformIn).toEqual(jasmine.objectContaining({
                    type: 'fake',
                    _module: jasmine.objectContaining({name: 'fake'})
                }));
            }
            expect(_layout).toBe(fullLayout);

            calledSupplyDefaults++;

            return transformOut;
        }

        function assertTransformArgs(dataOut, opts) {
            expect(dataOut[0]._input).toBe(dataIn[0]);
            expect(opts.transform).toBe(transformOut);
            expect(opts.fullTrace._input).toBe(dataIn[0]);
            expect(opts.layout).toBe(layout);
            expect(opts.fullLayout).toBe(fullLayout);

            calledTransform++;

            return dataOut;
        }

        function assertSupplyLayoutDefaultsArgs(_layout, _fullLayout, _fullData, _transitionData) {
            expect(_layout).toBe(layout);
            expect(_fullLayout).toBe(fullLayout);
            expect(_fullData).toBe(fullData);
            expect(_transitionData).toBe(transitionData);

            calledSupplyLayoutDefaults++;
        }

        var fakeTransformModule = {
            moduleType: 'transform',
            name: 'fake',
            attributes: {},
            supplyDefaults: assertSupplyDefaultsArgs,
            transform: assertTransformArgs,
            supplyLayoutDefaults: assertSupplyLayoutDefaultsArgs
        };

        Plotly.register(fakeTransformModule);
        Plots.supplyDataDefaults(dataIn, fullData, layout, fullLayout);
        Plots.supplyLayoutModuleDefaults(layout, fullLayout, fullData, transitionData);
        delete Plots.transformsRegistry.fake;
        expect(calledSupplyDefaults).toBe(2);
        expect(calledTransform).toBe(1);
        expect(calledSupplyLayoutDefaults).toBe(1);
    });

    it('handles `makesData` transforms when the incoming trace has no data', function() {
        var transformIn = {type: 'linemaker', x0: 3, y0: 2, x1: 5, y1: 10, n: 3};
        var dataIn = [{transforms: [transformIn], mode: 'lines+markers'}];
        var fullData = [];
        var layout = {};
        var fullLayout = Lib.extendDeep({}, mockFullLayout);

        var lineMakerModule = {
            moduleType: 'transform',
            name: 'linemaker',
            makesData: true,
            attributes: {},
            supplyDefaults: function(transformIn) {
                return Lib.extendFlat({}, transformIn);
            },
            transform: function(data, state) {
                var transform = state.transform;
                var trace = data[0];
                var n = transform.n;
                var x = new Array(n);
                var y = new Array(n);

                // our exciting transform - make a line!
                for(var i = 0; i < n; i++) {
                    x[i] = transform.x0 + (i / (n - 1)) * (transform.x1 - transform.x0);
                    y[i] = transform.y0 + (i / (n - 1)) * (transform.y1 - transform.y0);
                }

                // we didn't coerce mode before, because there was no data
                expect(trace.mode).toBeUndefined();
                expect(trace.line).toBeUndefined();
                expect(trace.marker).toBeUndefined();

                // just put the input trace back in here, it'll get coerced again after the transform
                var traceOut = Lib.extendFlat(trace._input, {x: x, y: y});

                return [traceOut];
            }
        };

        Plotly.register(lineMakerModule);
        Plots.supplyDataDefaults(dataIn, fullData, layout, fullLayout);
        delete Plots.transformsRegistry.linemaker;

        expect(fullData.length).toBe(1);
        var traceOut = fullData[0];
        expect(traceOut.x).toEqual([3, 4, 5]);
        expect(traceOut.y).toEqual([2, 6, 10]);

        // make sure we redid supplyDefaults after the data arrays were added
        expect(traceOut.mode).toBe('lines+markers');
        expect(traceOut.line).toBeDefined();
        expect(traceOut.marker).toBeDefined();
    });

});

describe('multiple transforms:', function() {
    'use strict';

    var gd;

    beforeEach(function() { gd = createGraphDiv(); });

    var mockData0 = [{
        mode: 'markers',
        x: [1, -1, -2, 0, 1, 2, 3],
        y: [1, 2, 3, 1, 2, 3, 1],
        transforms: [{
            type: 'groupby',
            groups: ['a', 'a', 'b', 'a', 'b', 'b', 'a'],
            styles: [{
                target: 'a',
                value: {marker: {color: 'red'}}
            }, {
                target: 'b',
                value: {marker: {color: 'blue'}}
            }]
        }, {
            type: 'filter',
            operation: '>'
        }]
    }];

    var mockData1 = [Lib.extendDeep({}, mockData0[0]), {
        mode: 'markers',
        x: [20, 11, 12, 0, 1, 2, 3],
        y: [1, 2, 3, 2, 5, 2, 0],
        transforms: [{
            type: 'groupby',
            groups: ['b', 'a', 'b', 'b', 'b', 'a', 'a'],
            styles: [{
                target: 'a',
                value: {marker: {color: 'green'}}
            }, {
                target: 'b',
                value: {marker: {color: 'black'}}
            }]
        }, {
            type: 'filter',
            operation: '<',
            value: 10
        }]
    }];

    var mockData2 = [{
        x: [1, 2, 3, 4, 5],
        y: [2, 3, 1, 7, 9],
        marker: {size: [10, 20, 20, 20, 10]},
        transforms: [
            {
                type: 'filter',
                operation: '>',
                value: 2,
                target: 'y'
            },
            {
                type: 'aggregate',
                groups: 'marker.size',
                aggregations: [
                    {target: 'x', func: 'sum'}, // 20: 6, 10: 5
                    {target: 'y', func: 'avg'}  // 20: 5, 10: 9
                ]
            },
            {
                type: 'filter',
                operation: '<',
                value: 6,
                target: 'x'
            }
        ]
    }];

    afterEach(destroyGraphDiv);

    it('Plotly.plot should plot the transform traces - filter|aggregate|filter', function(done) {
        var data = Lib.extendDeep([], mockData2);

        Plotly.plot(gd, data).then(function() {
            expect(gd.data.length).toEqual(1);

            // this would be the result if we didn't have a second filter - kept for test case overview
            // expect(gd._fullData[0].x).toEqual([6, 5]);
            // expect(gd._fullData[0].y).toEqual([5, 9]);
            // expect(gd._fullData[0].marker.size).toEqual([20, 10]);

            expect(gd._fullData[0].x).toEqual([5]);
            expect(gd._fullData[0].y).toEqual([9]);
            expect(gd._fullData[0].marker.size).toEqual([10]);

            expect(gd._fullData[0].transforms[0]._indexToPoints).toEqual({0: [1], 1: [3], 2: [4]});
            expect(gd._fullData[0].transforms[1]._indexToPoints).toEqual({0: [1, 3], 1: [4]});
            expect(gd._fullData[0].transforms[2]._indexToPoints).toEqual({0: [4]});

            done();
        });
    });


    it('Plotly.plot should plot the transform traces', function(done) {
        var data = Lib.extendDeep([], mockData0);

        Plotly.plot(gd, data).then(function() {
            expect(gd.data.length).toEqual(1);
            expect(gd.data[0].x).toEqual([1, -1, -2, 0, 1, 2, 3]);
            expect(gd.data[0].y).toEqual([1, 2, 3, 1, 2, 3, 1]);

            expect(gd._fullData.length).toEqual(2);
            expect(gd._fullData[0].x).toEqual([1, 3]);
            expect(gd._fullData[0].y).toEqual([1, 1]);
            expect(gd._fullData[1].x).toEqual([1, 2]);
            expect(gd._fullData[1].y).toEqual([2, 3]);

            assertDims([2, 2]);

            done();
        });
    });

    it('Plotly.plot should plot the transform traces (reverse case)', function(done) {
        var data = Lib.extendDeep([], mockData0);

        data[0].transforms.slice().reverse();

        Plotly.plot(gd, data).then(function() {
            expect(gd.data.length).toEqual(1);
            expect(gd.data[0].x).toEqual([1, -1, -2, 0, 1, 2, 3]);
            expect(gd.data[0].y).toEqual([1, 2, 3, 1, 2, 3, 1]);

            expect(gd._fullData.length).toEqual(2);
            expect(gd._fullData[0].x).toEqual([1, 3]);
            expect(gd._fullData[0].y).toEqual([1, 1]);
            expect(gd._fullData[1].x).toEqual([1, 2]);
            expect(gd._fullData[1].y).toEqual([2, 3]);

            assertDims([2, 2]);

            done();
        });
    });

    it('Plotly.restyle should work', function(done) {
        var data = Lib.extendDeep([], mockData0);
        data[0].marker = { size: 20 };

        var dims = [2, 2];

        Plotly.plot(gd, data).then(function() {
            assertStyle(dims,
                ['rgb(255, 0, 0)', 'rgb(0, 0, 255)'],
                [1, 1]
            );

            return Plotly.restyle(gd, 'marker.opacity', 0.4);
        }).then(function() {
            assertStyle(dims,
                ['rgb(255, 0, 0)', 'rgb(0, 0, 255)'],
                [0.4, 0.4]
            );

            expect(gd._fullData[0].marker.opacity).toEqual(0.4);
            expect(gd._fullData[1].marker.opacity).toEqual(0.4);

            return Plotly.restyle(gd, 'marker.opacity', 1);
        }).then(function() {
            assertStyle(dims,
                ['rgb(255, 0, 0)', 'rgb(0, 0, 255)'],
                [1, 1]
            );

            expect(gd._fullData[0].marker.opacity).toEqual(1);
            expect(gd._fullData[1].marker.opacity).toEqual(1);

            return Plotly.restyle(gd, {
                'transforms[0].styles': [[{
                    target: 'a',
                    value: {marker: {color: 'green'}}
                }, {
                    target: 'b',
                    value: {marker: {color: 'red'}}
                }]],
                'marker.opacity': 0.4
            });
        }).then(function() {
            assertStyle(dims,
                ['rgb(0, 128, 0)', 'rgb(255, 0, 0)'],
                [0.4, 0.4]
            );

            done();
        });
    });

    it('Plotly.extendTraces should work', function(done) {
        var data = Lib.extendDeep([], mockData0);

        Plotly.plot(gd, data).then(function() {
            expect(gd.data[0].x.length).toEqual(7);
            expect(gd._fullData[0].x.length).toEqual(2);
            expect(gd._fullData[1].x.length).toEqual(2);

            assertDims([2, 2]);

            return Plotly.extendTraces(gd, {
                x: [ [-3, 4, 5] ],
                y: [ [1, -2, 3] ],
                'transforms[0].groups': [ ['b', 'a', 'b'] ]
            }, [0]);
        }).then(function() {
            expect(gd.data[0].x.length).toEqual(10);
            expect(gd._fullData[0].x.length).toEqual(3);
            expect(gd._fullData[1].x.length).toEqual(3);

            assertDims([3, 3]);

            done();
        });
    });

    it('Plotly.deleteTraces should work', function(done) {
        var data = Lib.extendDeep([], mockData1);

        Plotly.plot(gd, data).then(function() {
            assertDims([2, 2, 2, 2]);

            return Plotly.deleteTraces(gd, [1]);
        }).then(function() {
            assertDims([2, 2]);

            return Plotly.deleteTraces(gd, [0]);
        }).then(function() {
            assertDims([]);

            done();
        });
    });

    it('toggling trace visibility should work', function(done) {
        var data = Lib.extendDeep([], mockData1);

        Plotly.plot(gd, data).then(function() {
            assertDims([2, 2, 2, 2]);

            return Plotly.restyle(gd, 'visible', 'legendonly', [1]);
        }).then(function() {
            assertDims([2, 2]);

            return Plotly.restyle(gd, 'visible', false, [0]);
        }).then(function() {
            assertDims([]);

            return Plotly.restyle(gd, 'visible', [true, true]);
        }).then(function() {
            assertDims([2, 2, 2, 2]);

            done();
        });
    });

    it('executes filter and aggregate in the order given', function() {
        // filter and aggregate do not commute!

        var trace1 = {
            x: [0, -5, 7, 4, 5],
            y: [2, 4, 6, 8, 10],
            transforms: [{
                type: 'aggregate',
                groups: [1, 2, 2, 1, 1],
                aggregations: [
                    {target: 'x', func: 'sum'},
                    {target: 'y', func: 'avg'}
                ]
            }, {
                type: 'filter',
                target: 'x',
                operation: '<',
                value: 5
            }]
        };

        var trace2 = Lib.extendDeep({}, trace1);
        trace2.transforms.reverse();

        Plotly.newPlot(gd, [trace1, trace2]);

        var trace1Out = gd._fullData[0];
        expect(trace1Out.x).toEqual([2]);
        expect(trace1Out.y).toEqual([5]);

        var trace2Out = gd._fullData[1];
        expect(trace2Out.x).toEqual([4, -5]);
        expect(trace2Out.y).toEqual([5, 4]);
    });

    it('always executes groupby before aggregate', function() {
        // aggregate and groupby wouldn't commute, but groupby always happens first
        // because it has a `transform`, and aggregate has a `calcTransform`

        var trace1 = {
            x: [1, 2, 3, 4, 5],
            y: [2, 4, 6, 8, 10],
            transforms: [{
                type: 'groupby',
                groups: [1, 1, 2, 2, 2]
            }, {
                type: 'aggregate',
                groups: [1, 2, 2, 1, 1],
                aggregations: [
                    {target: 'x', func: 'sum'},
                    {target: 'y', func: 'avg'}
                ]
            }]
        };

        var trace2 = Lib.extendDeep({}, trace1);
        trace2.transforms.reverse();

        Plotly.newPlot(gd, [trace1, trace2]);

        var t1g1 = gd._fullData[0];
        var t1g2 = gd._fullData[1];
        var t2g1 = gd._fullData[2];
        var t2g2 = gd._fullData[3];

        expect(t1g1.x).toEqual([1, 2]);
        expect(t1g1.y).toEqual([2, 4]);
        // group 2 has its aggregations switched, since group 2 comes first
        expect(t1g2.x).toEqual([3, 9]);
        expect(t1g2.y).toEqual([6, 9]);

        // if we had done aggregation first, we'd implicitly get the first val
        // for each of the groupby groups, which is [1, 1]
        // so we'd only make 1 output trace, and it would look like:
        // {x: [10, 5], y: [20/3, 5]}
        // (and if we got some other groupby groups values, the most it could do
        // is break ^^ into two separate traces)
        expect(t2g1.x).toEqual(t1g1.x);
        expect(t2g1.y).toEqual(t1g1.y);
        expect(t2g2.x).toEqual(t1g2.x);
        expect(t2g2.y).toEqual(t1g2.y);
    });
});

describe('invalid transforms', function() {
    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(destroyGraphDiv);

    it('ignores them', function(done) {
        Plotly.plot(gd, [{
            y: [1, 2, 3],
            transforms: [{}]
        }]).then(function() {
            expect(gd._fullData[0].transforms.length).toEqual(1);
            done();
        });
    });
});

describe('multiple traces with transforms:', function() {
    'use strict';

    var mockData0 = [{
        mode: 'markers',
        x: [1, -1, -2, 0, 1, 2, 3],
        y: [1, 2, 3, 1, 2, 3, 1],
        marker: { color: 'green' },
        name: 'filtered',
        transforms: [{
            type: 'filter',
            operation: '>',
            value: 1
        }]
    }, {
        mode: 'markers',
        x: [20, 11, 12, 0, 1, 2, 3],
        y: [1, 2, 3, 2, 5, 2, 0],
        transforms: [{
            type: 'groupby',
            groups: ['a', 'a', 'b', 'a', 'b', 'b', 'a'],
            styles: [{
                target: 'a',
                value: {marker: {color: 'red'}},
            }, {
                target: 'b',
                value: {marker: {color: 'blue'}}
            }]
        }, {
            type: 'filter',
            operation: '>'
        }]
    }];

    afterEach(destroyGraphDiv);

    it('Plotly.plot should plot the transform traces', function(done) {
        var data = Lib.extendDeep([], mockData0);

        var gd = createGraphDiv();

        Plotly.plot(gd, data).then(function() {
            expect(gd.data.length).toEqual(2);
            expect(gd.data[0].x).toEqual([1, -1, -2, 0, 1, 2, 3]);
            expect(gd.data[0].y).toEqual([1, 2, 3, 1, 2, 3, 1]);
            expect(gd.data[1].x).toEqual([20, 11, 12, 0, 1, 2, 3]);
            expect(gd.data[1].y).toEqual([1, 2, 3, 2, 5, 2, 0]);

            expect(gd._fullData.length).toEqual(3);
            expect(gd._fullData[0].x).toEqual([2, 3]);
            expect(gd._fullData[0].y).toEqual([3, 1]);
            expect(gd._fullData[1].x).toEqual([20, 11, 3]);
            expect(gd._fullData[1].y).toEqual([1, 2, 0]);
            expect(gd._fullData[2].x).toEqual([12, 1, 2]);
            expect(gd._fullData[2].y).toEqual([3, 5, 2]);

            assertDims([2, 3, 3]);

            done();
        });
    });

    it('Plotly.restyle should work', function(done) {
        var data = Lib.extendDeep([], mockData0);
        data[0].marker.size = 20;

        var gd = createGraphDiv();
        var dims = [2, 3, 3];

        Plotly.plot(gd, data).then(function() {
            assertStyle(dims,
                ['rgb(0, 128, 0)', 'rgb(255, 0, 0)', 'rgb(0, 0, 255)'],
                [1, 1, 1]
            );

            return Plotly.restyle(gd, 'marker.opacity', 0.4);
        }).then(function() {
            assertStyle(dims,
                ['rgb(0, 128, 0)', 'rgb(255, 0, 0)', 'rgb(0, 0, 255)'],
                [0.4, 0.4, 0.4]
            );

            gd._fullData.forEach(function(trace) {
                expect(trace.marker.opacity).toEqual(0.4);
            });

            return Plotly.restyle(gd, 'marker.opacity', 1);
        }).then(function() {
            assertStyle(dims,
                ['rgb(0, 128, 0)', 'rgb(255, 0, 0)', 'rgb(0, 0, 255)'],
                [1, 1, 1]
            );

            gd._fullData.forEach(function(trace) {
                expect(trace.marker.opacity).toEqual(1);
            });

            return Plotly.restyle(gd, {
                'transforms[0].styles': [[{
                    target: 'a',
                    value: {marker: {color: 'green'}},
                }, {
                    target: 'b',
                    value: {marker: {color: 'red'}}
                }]],
                'marker.opacity': [0.4, 0.6]
            });
        }).then(function() {
            assertStyle(dims,
                ['rgb(0, 128, 0)', 'rgb(0, 128, 0)', 'rgb(255, 0, 0)'],
                [0.4, 0.6, 0.6]
            );

            done();
        });
    });

    it('Plotly.extendTraces should work', function(done) {
        var data = Lib.extendDeep([], mockData0);

        var gd = createGraphDiv();

        Plotly.plot(gd, data).then(function() {
            assertDims([2, 3, 3]);

            return Plotly.extendTraces(gd, {
                x: [ [-3, 4, 5] ],
                y: [ [1, -2, 3] ],
                'transforms[0].groups': [ ['b', 'a', 'b'] ]
            }, [1]);
        }).then(function() {
            assertDims([2, 4, 4]);

            return Plotly.extendTraces(gd, {
                x: [ [5, 7, 10] ],
                y: [ [1, -2, 3] ]
            }, [0]);
        }).then(function() {
            assertDims([5, 4, 4]);

            done();
        });
    });

    it('Plotly.deleteTraces should work', function(done) {
        var data = Lib.extendDeep([], mockData0);

        var gd = createGraphDiv();

        Plotly.plot(gd, data).then(function() {
            assertDims([2, 3, 3]);

            return Plotly.deleteTraces(gd, [1]);
        }).then(function() {
            assertDims([2]);

            return Plotly.deleteTraces(gd, [0]);
        }).then(function() {
            assertDims([]);

            done();
        });
    });

    it('toggling trace visibility should work', function(done) {
        var data = Lib.extendDeep([], mockData0);

        var gd = createGraphDiv();

        Plotly.plot(gd, data).then(function() {
            assertDims([2, 3, 3]);

            return Plotly.restyle(gd, 'visible', 'legendonly', [1]);
        }).then(function() {
            assertDims([2]);

            return Plotly.restyle(gd, 'visible', false, [0]);
        }).then(function() {
            assertDims([]);

            return Plotly.restyle(gd, 'visible', [true, true]);
        }).then(function() {
            assertDims([2, 3, 3]);

            return Plotly.restyle(gd, 'visible', 'legendonly', [0]);
        }).then(function() {
            assertDims([3, 3]);

            done();
        });
    });
});

describe('restyle applied on transforms:', function() {
    'use strict';

    afterEach(destroyGraphDiv);

    it('should be able', function(done) {
        var gd = createGraphDiv();

        var data = [{ y: [2, 1, 2] }];

        var transform0 = {
            type: 'filter',
            target: 'y',
            operation: '>',
            value: 1
        };

        var transform1 = {
            type: 'groupby',
            groups: ['a', 'b', 'b']
        };

        Plotly.plot(gd, data).then(function() {
            expect(gd.data.transforms).toBeUndefined();

            return Plotly.restyle(gd, 'transforms[0]', transform0);
        })
        .then(function() {
            var msg = 'to generate blank transform objects';

            expect(gd.data[0].transforms[0]).toBe(transform0, msg);

            // make sure transform actually works
            expect(gd._fullData[0].y).toEqual([2, 2], msg);

            return Plotly.restyle(gd, 'transforms[1]', transform1);
        })
        .then(function() {
            var msg = 'to generate blank transform objects (2)';

            expect(gd.data[0].transforms[0]).toBe(transform0, msg);
            expect(gd.data[0].transforms[1]).toBe(transform1, msg);
            expect(gd._fullData[0].y).toEqual([2], msg);

            return Plotly.restyle(gd, 'transforms[0]', null);
        })
        .then(function() {
            var msg = 'to remove transform objects';

            expect(gd.data[0].transforms[0]).toBe(transform1, msg);
            expect(gd.data[0].transforms[1]).toBeUndefined(msg);
            expect(gd._fullData[0].y).toEqual([2], msg);
            expect(gd._fullData[1].y).toEqual([1, 2], msg);

            return Plotly.restyle(gd, 'transforms', null);
        })
        .then(function() {
            var msg = 'to remove all transform objects';

            expect(gd.data[0].transforms).toBeUndefined(msg);
            expect(gd._fullData[0].y).toEqual([2, 1, 2], msg);
        })
        .then(done);
    });

});

describe('supplyDefaults with groupby + filter', function() {
    function calcDatatoTrace(calcTrace) {
        return calcTrace[0].trace;
    }

    function _transform(data, layout) {
        var gd = {
            data: data,
            layout: layout || {}
        };

        supplyAllDefaults(gd);
        Plots.doCalcdata(gd);

        return gd.calcdata.map(calcDatatoTrace);
    }

    it('filter + groupby with blank target', function() {
        var out = _transform([{
            x: [1, 2, 3, 4, 5, 6, 7],
            y: [4, 6, 5, 7, 6, 8, 9],
            transforms: [{
                type: 'filter',
                operation: '<',
                value: 6.5
            }, {
                type: 'groupby',
                groups: [1, 1, 1, 2, 2, 2, 2]
            }]
        }]);

        expect(out[0].x).toEqual([1, 2, 3]);
        expect(out[0].y).toEqual([4, 6, 5]);

        expect(out[1].x).toEqual([4, 5, 6]);
        expect(out[1].y).toEqual([7, 6, 8]);
    });

    it('fiter + groupby', function() {
        var out = _transform([{
            x: [5, 4, 3],
            y: [6, 5, 4],
        }, {
            x: [1, 2, 3, 4, 5, 6, 7],
            y: [4, 6, 5, 7, 8, 9, 10],
            transforms: [{
                type: 'filter',
                target: [1, 2, 3, 4, 5, 6, 7],
                operation: '<',
                value: 6.5
            }, {
                type: 'groupby',
                groups: [1, 1, 1, 2, 2, 2, 2]
            }]
        }]);

        expect(out[0].x).toEqual([5, 4, 3]);
        expect(out[0].y).toEqual([6, 5, 4]);

        expect(out[1].x).toEqual([1, 2, 3]);
        expect(out[1].y).toEqual([4, 6, 5]);

        expect(out[2].x).toEqual([4, 5, 6]);
        expect(out[2].y).toEqual([7, 8, 9]);
    });

    it('groupby + filter', function() {
        var out = _transform([{
            x: [1, 2, 3, 4, 5, 6, 7],
            y: [4, 6, 5, 7, 6, 8, 9],
            transforms: [{
                type: 'groupby',
                groups: [1, 1, 1, 2, 2, 2, 2]
            }, {
                type: 'filter',
                target: [1, 2, 3, 4, 5, 6, 7],
                operation: '<',
                value: 6.5
            }]
        }]);

        expect(out[0].x).toEqual([1, 2, 3]);
        expect(out[0].y).toEqual([4, 6, 5]);

        expect(out[1].x).toEqual([4, 5, 6]);
        expect(out[1].y).toEqual([7, 6, 8]);
    });

    it('groupby + groupby', function() {
        var out = _transform([{
            x: [1, 2, 3, 4, 5, 6, 7, 8],
            y: [4, 6, 5, 7, 6, 8, 9, 10],
            transforms: [{
                type: 'groupby',
                groups: [1, 1, 1, 1, 2, 2, 2, 2]
            }, {
                type: 'groupby',
                groups: [3, 4, 3, 4, 3, 4, 3, 5],
            }]
        }]);
        //               |  |  |  |  |  |  |  |
        //               v  v  v  v  v  v  v  v
        // Trace number: 0  1  0  1  2  3  2  4

        expect(out.length).toEqual(5);
        expect(out[0].x).toEqual([1, 3]);
        expect(out[1].x).toEqual([2, 4]);
        expect(out[2].x).toEqual([5, 7]);
        expect(out[3].x).toEqual([6]);
        expect(out[4].x).toEqual([8]);
    });

    it('groupby + groupby + filter', function() {
        var out = _transform([{
            x: [1, 2, 3, 4, 5, 6, 7, 8],
            y: [4, 6, 5, 7, 6, 8, 9, 10],
            transforms: [{
                type: 'groupby',
                groups: [1, 1, 1, 1, 2, 2, 2, 2]
            }, {
                type: 'groupby',
                groups: [3, 4, 3, 4, 3, 4, 3, 5],
            }, {
                type: 'filter',
                target: [1, 2, 3, 4, 5, 6, 7, 8],
                operation: '<',
                value: 4.5
            }]
        }]);
        //               |  |  |  |  |  |  |  |
        //               v  v  v  v  v  v  v  v
        // Trace number: 0  1  0  1  2  3  2  4

        expect(out.length).toEqual(5);
        expect(out[0].x).toEqual([1, 3]);
        expect(out[1].x).toEqual([2, 4]);
        expect(out[2].x).toEqual([]);
        expect(out[3].x).toEqual([]);
        expect(out[4].x).toEqual([]);
    });

    it('fiter + filter', function() {
        var out = _transform([{
            x: [1, 2, 3, 4, 5, 6, 7],
            y: [4, 6, 5, 7, 8, 9, 10],
            transforms: [{
                type: 'filter',
                target: [1, 2, 3, 4, 5, 6, 7],
                operation: '<',
                value: 6.5
            }, {
                type: 'filter',
                target: [1, 2, 3, 4, 5, 6, 7],
                operation: '>',
                value: 1.5
            }]
        }]);

        expect(out[0].x).toEqual([2, 3, 4, 5, 6]);
        expect(out[0].y).toEqual([6, 5, 7, 8, 9]);
    });
});
