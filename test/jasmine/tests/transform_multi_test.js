var Plotly = require('@lib/index');
var Filter = require('@lib/filter');

var Plots = require('@src/plots/plots');
var Lib = require('@src/lib');

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var assertDims = require('../assets/assert_dims');
var assertStyle = require('../assets/assert_style');


describe('general transforms:', function() {
    'use strict';

    var fullLayout = { _transformModules: [] };

    var traceIn, traceOut;

    it('supplyTraceDefaults should supply the transform defaults', function() {
        traceIn = {
            y: [2, 1, 2],
            transforms: [{ type: 'filter' }]
        };

        traceOut = Plots.supplyTraceDefaults(traceIn, 0, fullLayout);

        expect(traceOut.transforms).toEqual([{
            type: 'filter',
            enabled: true,
            operation: '=',
            value: 0,
            target: 'x',
            _module: Filter
        }]);
    });

    it('supplyTraceDefaults should not bail if transform module is not found', function() {
        traceIn = {
            y: [2, 1, 2],
            transforms: [{ type: 'invalid' }]
        };

        traceOut = Plots.supplyTraceDefaults(traceIn, 0, fullLayout);

        expect(traceOut.y).toBe(traceIn.y);
    });

    it('supplyTraceDefaults should honored global transforms', function() {
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
            }]
        };

        traceOut = Plots.supplyTraceDefaults(traceIn, 0, layout);

        expect(traceOut.transforms[0]).toEqual({
            type: 'filter',
            enabled: true,
            operation: '=',
            value: 0,
            target: 'x',
            _module: Filter
        }, '- global first');

        expect(traceOut.transforms[1]).toEqual({
            type: 'filter',
            enabled: true,
            operation: '>',
            value: 0,
            target: 'x',
            _module: Filter
        }, '- trace second');

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
        Plots.supplyDataDefaults(dataIn, dataOut, {}, []);

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
        expect(dataOut[1].transforms[0]).toEqual({
            type: 'filter',
            enabled: true,
            operation: '>',
            value: 0,
            target: 'x',
            _module: Filter
        }, msg);

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

        var dataIn = [{
            transforms: [transformIn]
        }];

        var fullData = [],
            layout = {},
            fullLayout = { _has: function() {} },
            transitionData = {};

        function assertSupplyDefaultsArgs(_transformIn, traceOut, _layout) {
            expect(_transformIn).toBe(transformIn);
            expect(_layout).toBe(fullLayout);

            return transformOut;
        }

        function assertTransformArgs(dataOut, opts) {
            expect(dataOut[0]._input).toBe(dataIn[0]);
            expect(opts.transform).toBe(transformOut);
            expect(opts.fullTrace._input).toBe(dataIn[0]);
            expect(opts.layout).toBe(layout);
            expect(opts.fullLayout).toBe(fullLayout);

            return dataOut;
        }

        function assertSupplyLayoutDefaultsArgs(_layout, _fullLayout, _fullData, _transitionData) {
            expect(_layout).toBe(layout);
            expect(_fullLayout).toBe(fullLayout);
            expect(_fullData).toBe(fullData);
            expect(_transitionData).toBe(transitionData);
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
    });

});

describe('multiple transforms:', function() {
    'use strict';

    var mockData0 = [{
        mode: 'markers',
        x: [1, -1, -2, 0, 1, 2, 3],
        y: [1, 2, 3, 1, 2, 3, 1],
        transforms: [{
            type: 'groupby',
            groups: ['a', 'a', 'b', 'a', 'b', 'b', 'a'],
            style: { a: {marker: {color: 'red'}}, b: {marker: {color: 'blue'}} }
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
            style: { a: {marker: {color: 'green'}}, b: {marker: {color: 'black'}} }
        }, {
            type: 'filter',
            operation: '<',
            value: 10
        }]
    }];

    afterEach(destroyGraphDiv);

    it('Plotly.plot should plot the transform traces', function(done) {
        var data = Lib.extendDeep([], mockData0);

        var gd = createGraphDiv();

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

        var gd = createGraphDiv();

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

        var gd = createGraphDiv();
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
                'transforms[0].style': { a: {marker: {color: 'green'}}, b: {marker: {color: 'red'}} },
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

        var gd = createGraphDiv();

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

        var gd = createGraphDiv();

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

        var gd = createGraphDiv();

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
            style: { a: {marker: {color: 'red'}}, b: {marker: {color: 'blue'}} }
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
                'transforms[0].style': { a: {marker: {color: 'green'}}, b: {marker: {color: 'red'}} },
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
