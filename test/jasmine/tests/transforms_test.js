var Plotly = require('@lib/index');
var Plots = require('@src/plots/plots');
var Lib = require('@src/lib');

var d3 = require('d3');
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');

Plotly.register([
    //register filter in build
    //require('@src/transforms/filter'),
    require('@src/transforms/groupby')
]);


describe('one-to-one transforms:', function() {
    'use strict';

    var mockData0 = [{
        x: [-2, -1, -2, 0, 1, 2, 3],
        y: [1, 2, 3, 1, 2, 3, 1],
        transforms: [{
            type: 'filter',
            operation: '>'
        }]
    }];

    var mockData1 = [Lib.extendDeep({}, mockData0[0]), {
        x: [20, 11, 12, 0, 1, 2, 3],
        y: [1, 2, 3, 2, 5, 2, 0],
        transforms: [{
            type: 'filter',
            operation: '<',
            value: 10
        }]
    }];

    afterEach(destroyGraphDiv);

    it('supplyTraceDefaults should supply the transform defaults', function() {
        var traceIn = {
            y: [2, 1, 2],
            transforms: [{ type: 'filter' }]
        };

        var traceOut = Plots.supplyTraceDefaults(traceIn, 0, {});

        expect(traceOut.transforms).toEqual([{
            type: 'filter',
            operation: '=',
            value: 0,
            filtersrc: 'x'
        }]);
    });

    it('supplyTraceDefaults should not bail if transform module is not found', function() {
        var traceIn = {
            y: [2, 1, 2],
            transforms: [{ type: 'invalid' }]
        };

        var traceOut = Plots.supplyTraceDefaults(traceIn, 0, {});

        expect(traceOut.y).toBe(traceIn.y);
    });

    it('supplyTraceDefaults should honored global transforms', function() {
        var traceIn = {
            y: [2, 1, 2],
            transforms: [{
                type: 'filter',
                operation: '>',
                value: '0',
                filtersrc: 'x'
            }]
        };

        var layout = {
            _globalTransforms: [{
                type: 'filter'
            }]
        };

        var traceOut = Plots.supplyTraceDefaults(traceIn, 0, layout);

        expect(traceOut.transforms[0]).toEqual({
            type: 'filter',
            operation: '=',
            value: 0,
            filtersrc: 'x'
        }, '- global first');

        expect(traceOut.transforms[1]).toEqual({
            type: 'filter',
            operation: '>',
            value: 0,
            filtersrc: 'x'
        }, '- trace second');
    });

    it('should pass correctly arguments to transform methods', function() {
        var transformIn = { type: 'fake' };
        var transformOut = {};

        var dataIn = [{
            transforms: [transformIn]
        }];

        var layout = {};

        function assertSupplyDefaultsArgs(_transformIn, traceOut, _layout) {
            expect(_transformIn).toBe(transformIn);
            expect(_layout).toBe(layout);

            return transformOut;
        }

        function assertTransformArgs(dataOut, opts) {
            expect(dataOut[0]._input).toBe(dataIn[0]);
            expect(opts.transform).toBe(transformOut);
            expect(opts.fullTrace._input).toBe(dataIn[0]);
            expect(opts.layout).toBe(layout);

            return dataOut;
        }

        var fakeTransformModule = {
            moduleType: 'transform',
            name: 'fake',
            attributes: {},
            supplyDefaults: assertSupplyDefaultsArgs,
            transform: assertTransformArgs
        };

        Plotly.register(fakeTransformModule);
        Plots.supplyDataDefaults(dataIn, [], layout);
        delete Plots.transformsRegistry.fake;
    });

    it('supplyDataDefaults should apply the transform while', function() {
        var dataIn = [{
            x: [-2, -2, 1, 2, 3],
            y: [1, 2, 2, 3, 1],
        }, {
            x: [-2, -1, -2, 0, 1, 2, 3],
            y: [1, 2, 3, 1, 2, 3, 1],
            transforms: [{
                type: 'filter',
                operation: '>',
                value: '0',
                filtersrc: 'x'
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
            value: '0',
            filtersrc: 'x'
        }], msg);

        msg = 'applies transform';
        expect(dataOut[1].x).toEqual([1, 2, 3], msg);
        expect(dataOut[1].y).toEqual([2, 3, 1], msg);

        msg = 'supplying the transform defaults';
        expect(dataOut[1].transforms[0]).toEqual({
            type: 'filter',
            operation: '>',
            value: 0,
            filtersrc: 'x'
        }, msg);

        msg = 'keeping refs to user data';
        expect(dataOut[1]._input.x).toEqual([-2, -1, -2, 0, 1, 2, 3], msg);
        expect(dataOut[1]._input.y).toEqual([1, 2, 3, 1, 2, 3, 1], msg);
        expect(dataOut[1]._input.transforms).toEqual([{
            type: 'filter',
            operation: '>',
            value: '0',
            filtersrc: 'x'
        }], msg);

        msg = 'keeping refs to full transforms array';
        expect(dataOut[1]._fullInput.transforms).toEqual([{
            type: 'filter',
            operation: '>',
            value: 0,
            filtersrc: 'x'
        }], msg);

        msg = 'setting index w.r.t user data';
        expect(dataOut[0].index).toEqual(0, msg);
        expect(dataOut[1].index).toEqual(1, msg);

        msg = 'setting _expandedIndex w.r.t full data';
        expect(dataOut[0]._expandedIndex).toEqual(0, msg);
        expect(dataOut[1]._expandedIndex).toEqual(1, msg);
    });

    it('Plotly.plot should plot the transform trace', function(done) {
        var data = Lib.extendDeep([], mockData0);

        Plotly.plot(createGraphDiv(), data).then(function(gd) {
            assertDims([3]);

            var uid = data[0].uid;
            expect(gd._fullData[0].uid).toEqual(uid + '0');

            done();
        });
    });

    it('Plotly.restyle should work', function(done) {
        var data = Lib.extendDeep([], mockData0);
        data[0].marker = { color: 'red' };

        var gd = createGraphDiv();
        var dims = [3];

        var uid;
        function assertUid(gd) {
            expect(gd._fullData[0].uid)
                .toEqual(uid + '0', 'should preserve uid on restyle');
        }

        Plotly.plot(gd, data).then(function() {
            uid = gd.data[0].uid;

            expect(gd._fullData[0].marker.color).toEqual('red');
            assertUid(gd);
            assertStyle(dims, ['rgb(255, 0, 0)'], [1]);

            return Plotly.restyle(gd, 'marker.color', 'blue');
        }).then(function() {
            expect(gd._fullData[0].marker.color).toEqual('blue');
            assertUid(gd);
            assertStyle(dims, ['rgb(0, 0, 255)'], [1]);

            return Plotly.restyle(gd, 'marker.color', 'red');
        }).then(function() {
            expect(gd._fullData[0].marker.color).toEqual('red');
            assertUid(gd);
            assertStyle(dims, ['rgb(255, 0, 0)'], [1]);

            return Plotly.restyle(gd, 'transforms[0].value', 2.5);
        }).then(function() {
            assertUid(gd);
            assertStyle([1], ['rgb(255, 0, 0)'], [1]);

            done();
        });
    });

    it('Plotly.extendTraces should work', function(done) {
        var data = Lib.extendDeep([], mockData0);

        var gd = createGraphDiv();

        Plotly.plot(gd, data).then(function() {
            expect(gd.data[0].x.length).toEqual(7);
            expect(gd._fullData[0].x.length).toEqual(3);

            assertDims([3]);

            return Plotly.extendTraces(gd, {
                x: [ [-3, 4, 5] ],
                y: [ [1, -2, 3] ]
            }, [0]);
        }).then(function() {
            expect(gd.data[0].x.length).toEqual(10);
            expect(gd._fullData[0].x.length).toEqual(5);

            assertDims([5]);

            done();
        });
    });

    it('Plotly.deleteTraces should work', function(done) {
        var data = Lib.extendDeep([], mockData1);

        var gd = createGraphDiv();

        Plotly.plot(gd, data).then(function() {
            assertDims([3, 4]);

            return Plotly.deleteTraces(gd, [1]);
        }).then(function() {
            assertDims([3]);

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
            assertDims([3, 4]);

            return Plotly.restyle(gd, 'visible', 'legendonly', [1]);
        }).then(function() {
            assertDims([3]);

            return Plotly.restyle(gd, 'visible', false, [0]);
        }).then(function() {
            assertDims([]);

            return Plotly.restyle(gd, 'visible', [true, true], [0, 1]);
        }).then(function() {
            assertDims([3, 4]);

            done();
        });
    });


    it('supplyTraceDefaults should supply the transform defaults', function() {
        var traceIn = {
            y: [2, 1, 2],
            transforms: [{ type: 'filter' }]
        };

        var traceOut = Plots.supplyTraceDefaults(traceIn, 0, {});

        expect(traceOut.transforms).toEqual([{
            type: 'filter',
            operation: '=',
            value: 0,
            filtersrc: 'x'
        }]);
    });

    it('supplyTraceDefaults should accept numeric as character', function() {
        var traceIn = {
            x: '1',
            transforms: [{
                type: 'filter',
                value: '0'
            }]
        };

        var traceOut = Plots.supplyTraceDefaults(traceIn, 0, {});

        expect(traceOut.transforms).toEqual([{
            type: 'filter',
            operation: '=',
            value: 0,
            filtersrc: 'x'
        }]);

        // should also convert if array
        var traceIn = {
            x: '1',
            transforms: [{
                type: 'filter',
                value: ['0']
            }]
        };

        var traceOut = Plots.supplyTraceDefaults(traceIn, 0, {});

        expect(traceOut.transforms).toEqual([{
            type: 'filter',
            operation: '=',
            value: [0],
            filtersrc: 'x'
        }]);
    });

    it('supplyTraceDefaults should accept numeric as character', function() {
        var traceIn = {
            x: '1',
            transforms: [{
                type: 'filter',
                value: '0'
            }]
        };

        var traceOut = Plots.supplyTraceDefaults(traceIn, 0, {});

        expect(traceOut.transforms).toEqual([{
            type: 'filter',
            operation: '=',
            value: 0,
            filtersrc: 'x'
        }]);

        // should also convert if array
        var traceIn = {
            x: '1',
            transforms: [{
                type: 'filter',
                value: ['0']
            }]
        };

        var traceOut = Plots.supplyTraceDefaults(traceIn, 0, {});

        expect(traceOut.transforms).toEqual([{
            type: 'filter',
            operation: '=',
            value: [0],
            filtersrc: 'x'
        }]);
    });

    it('supplyDataDefaults should apply the transform', function() {
        var dataIn = [{
            x: [-2, -1, -2, 0, 1, 2, 3],
            y: [1, 2, 3, 1, 2, 3, 1],
            transforms: [{
                type: 'filter',
                operation: '>',
                value: 0,
                filtersrc: 'x'
            }]
        }];

        var dataOut = [];
        Plots.supplyDataDefaults(dataIn, dataOut, {}, []);

        // does not mutate user data
        expect(dataIn[0].x).toEqual([-2, -1, -2, 0, 1, 2, 3]);
        expect(dataIn[0].y).toEqual([1, 2, 3, 1, 2, 3, 1]);
        expect(dataIn[0].transforms).toEqual([{
            type: 'filter',
            operation: '>',
            value: 0,
            filtersrc: 'x'
        }]);

        // applies transform
        expect(dataOut[0].x).toEqual([1, 2, 3]);
        expect(dataOut[0].y).toEqual([2, 3, 1]);

        // TODO what is the expected behavior ???
//         expect(dataOut[0].transforms).toEqual([]);

        // keep ref to user data
        expect(dataOut[0]._input.x).toEqual([-2, -1, -2, 0, 1, 2, 3]);
        expect(dataOut[0]._input.y).toEqual([1, 2, 3, 1, 2, 3, 1]);
        expect(dataOut[0]._input.transforms).toEqual([{
            type: 'filter',
            operation: '>',
            value: 0,
            filtersrc: 'x'
        }]);

        // keep ref to full transforms array
        expect(dataOut[0]._fullInput.transforms).toEqual([{
            type: 'filter',
            operation: '>',
            value: 0,
            filtersrc: 'x'
        }]);

        // set index w.r.t. fullData
        expect(dataOut[0].index).toEqual(0);

        // TODO do we really need this ???
        // set _index w.r.t. user data
        expect(dataOut[0].index).toEqual(0);
    });

    it('filters should chain as AND', function(){
        var dataIn = [{
            x: [-2, -1, -2, 0, 1, 2, 3],
            y: [1, 2, 3, 1, 2, 3, 1],
            transforms: [
              {
                type: 'filter',
                operation: '>',
                value: 0,
                filtersrc: 'x'
              },
              {
                type: 'filter',
                operation: '<',
                value: 3,
                filtersrc: 'x'
              }
            ]
        }];

        var dataOut = [];
        Plots.supplyDataDefaults(dataIn, dataOut, {}, []);

        // applies transform
        expect(dataOut[0].x).toEqual([1, 2]);
        expect(dataOut[0].y).toEqual([2, 3]);
    });

    it('filters should handle range numeric values within and notwithin', function() {
        var dataIn = [{
            x: [-2, -1, -2, 0, 1, 2, 3],
            y: [1, 2, 3, 1, 2, 3, 1],
            transforms: [{
                type: 'filter',
                operation: 'within',
                value: [-1, 1],
                filtersrc: 'x'
            }]
        }];

        var dataOut = [];
        Plots.supplyDataDefaults(dataIn, dataOut, {}, []);

        // leave this section guarding against mutation
        //   for now but can probably eliminate later
        // does not mutate user data
        expect(dataIn[0].x).toEqual([-2, -1, -2, 0, 1, 2, 3]);
        expect(dataIn[0].y).toEqual([1, 2, 3, 1, 2, 3, 1]);
        expect(dataIn[0].transforms).toEqual([{
            type: 'filter',
            operation: 'within',
            value: [-1, 1],
            filtersrc: 'x'
        }]);

        // applies transform
        expect(dataOut[0].x).toEqual([-1, 0, 1]);
        expect(dataOut[0].y).toEqual([2, 1, 2]);
    });

    it('filters should ignore character values within and notwithin', function() {
        var dataIn = [{
            x: ['a', 'b', 'c', 'd'],
            y: [1, 2, 3, 4],
            transforms: [{
                type: 'filter',
                operation: 'within',
                value: ['a', 'c'],
                filtersrc: 'x'
            }]
        }];

        var dataOut = [];
        Plots.supplyDataDefaults(dataIn, dataOut, {}, []);

        // leave this section guarding against mutation
        //   for now but can probably eliminate later
        // does not mutate user data
        expect(dataIn[0].x).toEqual(['a', 'b', 'c', 'd']);
        expect(dataIn[0].y).toEqual([1, 2, 3, 4]);
        expect(dataIn[0].transforms).toEqual([{
            type: 'filter',
            operation: 'within',
            value: ['a', 'c'],
            filtersrc: 'x'
        }]);

        // applies transform
        expect(dataOut[0].x).toEqual(['a', 'b', 'c', 'd']);
        expect(dataOut[0].y).toEqual([1, 2, 3, 4]);
    });

    it('filters should handle numeric values in', function() {
        var dataIn = [{
            x: [-2, -1, -2, 0, 1, 2, 3],
            y: [1, 2, 3, 1, 2, 3, 1],
            transforms: [{
                type: 'filter',
                operation: 'in',
                value: [-2, 0],
                filtersrc: 'x'
            }]
        }];

        var dataOut = [];
        Plots.supplyDataDefaults(dataIn, dataOut, {}, []);

        // applies transform
        expect(dataOut[0].x).toEqual([-2, -2, 0]);
        expect(dataOut[0].y).toEqual([1, 3, 1]);
    });

    it('filters should handle numeric values in', function() {
        var dataIn = [{
            x: [-2, -1, -2, 0, 1, 2, 3],
            y: [1, 2, 3, 1, 2, 3, 1],
            transforms: [{
                type: 'filter',
                operation: 'notin',
                value: [-2, 0],
                filtersrc: 'x'
            }]
        }];

        var dataOut = [];
        Plots.supplyDataDefaults(dataIn, dataOut, {}, []);

        // applies transform
        expect(dataOut[0].x).toEqual([-1, 1, 2, 3]);
        expect(dataOut[0].y).toEqual([2, 2, 3, 1]);
    });


    it('filters should handle strings with in', function() {
        var dataIn = [{
            x: ['y', 't', 'b', 'm', 'p', 'l', 'o'],
            y: [1, 2, 3, 1, 5, 10, 20],
            transforms: [{
                type: 'filter',
                operation: 'in',
                value: ['p', 'l', 'o'],
                filtersrc: 'x'
            }]
        }];


        var dataOut = [];
        Plots.supplyDataDefaults(dataIn, dataOut, {}, []);

        // applies transform
        expect(dataOut[0].x).toEqual(['p', 'l', 'o']);
        expect(dataOut[0].y).toEqual([5, 10, 20]);
    });

    it('filters should handle strings with in', function() {
        var dataIn = [{
            x: ['y', 't', 'b', 'm', 'p', 'l', 'o'],
            y: [1, 2, 3, 1, 5, 10, 20],
            transforms: [{
                type: 'filter',
                operation: 'notin',
                value: ['p', 'l', 'o'],
                filtersrc: 'x'
            }]
        }];


        var dataOut = [];
        Plots.supplyDataDefaults(dataIn, dataOut, {}, []);

        // applies transform
        expect(dataOut[0].x).toEqual(['y', 't', 'b', 'm']);
        expect(dataOut[0].y).toEqual([1, 2, 3, 1]);
    });


    it('Plotly.plot should plot the transform trace', function(done) {
        var data = Lib.extendDeep([], mockData0);

        Plotly.plot(createGraphDiv(), data).then(function(gd) {
            assertDims([3]);

            var uid = data[0].uid;
            expect(gd._fullData[0].uid).toEqual(uid + '0');

            done();
        });
    });

    it('Plotly.restyle should work', function(done) {
        var data = Lib.extendDeep([], mockData0);
        data[0].marker = { color: 'red' };

        var gd = createGraphDiv();
        var dims = [3];

        Plotly.plot(gd, data).then(function() {
            expect(gd._fullData[0].marker.color).toEqual('red');
            assertStyle(dims, ['rgb(255, 0, 0)'], [1]);

            return Plotly.restyle(gd, 'marker.color', 'blue');
        }).then(function() {
            expect(gd._fullData[0].marker.color).toEqual('blue');
            assertStyle(dims, ['rgb(0, 0, 255)'], [1]);

            return Plotly.restyle(gd, 'marker.color', 'red');
        }).then(function() {
            expect(gd._fullData[0].marker.color).toEqual('red');
            assertStyle(dims, ['rgb(255, 0, 0)'], [1]);

            return Plotly.restyle(gd, 'transforms[0].value', 2.5);
        }).then(function() {
            assertStyle([1], ['rgb(255, 0, 0)'], [1]);

            done();
        });
    });

    it('Plotly.extendTraces should work', function(done) {
        var data = Lib.extendDeep([], mockData0);

        var gd = createGraphDiv();

        Plotly.plot(gd, data).then(function() {
            expect(gd.data[0].x.length).toEqual(7);
            expect(gd._fullData[0].x.length).toEqual(3);

            assertDims([3]);

            return Plotly.extendTraces(gd, {
                x: [ [-3, 4, 5] ],
                y: [ [1, -2, 3] ]
            }, [0]);
        }).then(function() {
            expect(gd.data[0].x.length).toEqual(10);
            expect(gd._fullData[0].x.length).toEqual(5);

            assertDims([5]);

            done();
        });
    });

    it('Plotly.deleteTraces should work', function(done) {
        var data = Lib.extendDeep([], mockData1);

        var gd = createGraphDiv();

        Plotly.plot(gd, data).then(function() {
            assertDims([3, 4]);

            return Plotly.deleteTraces(gd, [1]);
        }).then(function() {
            assertDims([3]);

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
            assertDims([3, 4]);

            return Plotly.restyle(gd, 'visible', 'legendonly', [1]);
        }).then(function() {
            assertDims([3]);

            return Plotly.restyle(gd, 'visible', false, [0]);
        }).then(function() {
            assertDims([]);

            return Plotly.restyle(gd, 'visible', [true, true], [0, 1]);
        }).then(function() {
            assertDims([3, 4]);

            done();
        });
    });

});

describe('one-to-many transforms:', function() {
    'use strict';

    var mockData0 = [{
        mode: 'markers',
        x: [1, -1, -2, 0, 1, 2, 3],
        y: [1, 2, 3, 1, 2, 3, 1],
        transforms: [{
            type: 'groupby',
            groups: ['a', 'a', 'b', 'a', 'b', 'b', 'a'],
            groupColors: { a: 'red', b: 'blue' }
        }]
    }];

    var mockData1 = [Lib.extendDeep({}, mockData0[0]), {
        mode: 'markers',
        x: [20, 11, 12, 0, 1, 2, 3],
        y: [1, 2, 3, 2, 5, 2, 0],
        transforms: [{
            type: 'groupby',
            groups: ['b', 'a', 'b', 'b', 'b', 'a', 'a'],
            groupColors: { a: 'green', b: 'black' }
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
            expect(gd._fullData[0].x).toEqual([1, -1, 0, 3]);
            expect(gd._fullData[0].y).toEqual([1, 2, 1, 1]);
            expect(gd._fullData[1].x).toEqual([-2, 1, 2]);
            expect(gd._fullData[1].y).toEqual([3, 2, 3]);

            assertDims([4, 3]);

            done();
        });
    });

    it('Plotly.restyle should work', function(done) {
        var data = Lib.extendDeep([], mockData0);
        data[0].marker = { size: 20 };

        var gd = createGraphDiv();
        var dims = [4, 3];

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
                'transforms[0].groupColors': { a: 'green', b: 'red' },
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
            expect(gd._fullData[0].x.length).toEqual(4);
            expect(gd._fullData[1].x.length).toEqual(3);

            assertDims([4, 3]);

            return Plotly.extendTraces(gd, {
                x: [ [-3, 4, 5] ],
                y: [ [1, -2, 3] ],
                'transforms[0].groups': [ ['b', 'a', 'b'] ]
            }, [0]);
        }).then(function() {
            expect(gd.data[0].x.length).toEqual(10);
            expect(gd._fullData[0].x.length).toEqual(5);
            expect(gd._fullData[1].x.length).toEqual(5);

            assertDims([5, 5]);

            done();
        });
    });

    it('Plotly.deleteTraces should work', function(done) {
        var data = Lib.extendDeep([], mockData1);

        var gd = createGraphDiv();

        Plotly.plot(gd, data).then(function() {
            assertDims([4, 3, 4, 3]);

            return Plotly.deleteTraces(gd, [1]);
        }).then(function() {
            assertDims([4, 3]);

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
            assertDims([4, 3, 4, 3]);

            return Plotly.restyle(gd, 'visible', 'legendonly', [1]);
        }).then(function() {
            assertDims([4, 3]);

            return Plotly.restyle(gd, 'visible', false, [0]);
        }).then(function() {
            assertDims([]);

            return Plotly.restyle(gd, 'visible', [true, true], [0, 1]);
        }).then(function() {
            assertDims([4, 3, 4, 3]);

            done();
        });
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
            groupColors: { a: 'red', b: 'blue' }
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
            groupColors: { a: 'green', b: 'black' }
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

        data[0].transforms.reverse();

        var gd = createGraphDiv();

        Plotly.plot(gd, data).then(function() {
            expect(gd.data.length).toEqual(1);
            expect(gd.data[0].x).toEqual([1, -1, -2, 0, 1, 2, 3]);
            expect(gd.data[0].y).toEqual([1, 2, 3, 1, 2, 3, 1]);

            expect(gd._fullData.length).toEqual(2);
            expect(gd._fullData[0].x).toEqual([1, 1, 3]);
            expect(gd._fullData[0].y).toEqual([1, 2, 1]);
            expect(gd._fullData[1].x).toEqual([2]);
            expect(gd._fullData[1].y).toEqual([3]);

            assertDims([3, 1]);

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
                'transforms[0].groupColors': { a: 'green', b: 'red' },
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
            groupColors: { a: 'red', b: 'blue' }
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
                'transforms[0].groupColors': { a: 'green', b: 'red' },
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

function assertDims(dims) {
    var traces = d3.selectAll('.trace');

    expect(traces.size())
        .toEqual(dims.length, 'to have correct number of traces');

    traces.each(function(_, i) {
        var trace = d3.select(this);
        var points = trace.selectAll('.point');

        expect(points.size())
            .toEqual(dims[i], 'to have correct number of pts in trace ' + i);
    });
}

function assertStyle(dims, color, opacity) {
    var N = dims.reduce(function(a, b) {
        return a + b;
    });

    var traces = d3.selectAll('.trace');
    expect(traces.size())
        .toEqual(dims.length, 'to have correct number of traces');

    expect(d3.selectAll('.point').size())
        .toEqual(N, 'to have correct total number of points');

    traces.each(function(_, i) {
        var trace = d3.select(this);
        var points = trace.selectAll('.point');

        expect(points.size())
            .toEqual(dims[i], 'to have correct number of pts in trace ' + i);

        points.each(function() {
            var point = d3.select(this);

            expect(point.style('fill'))
                .toEqual(color[i], 'to have correct pt color');
            expect(+point.style('opacity'))
                .toEqual(opacity[i], 'to have correct pt opacity');
        });
    });
}
