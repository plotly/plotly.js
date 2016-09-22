var Plotly = require('@lib/index');
var Lib = require('@src/lib');

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var assertDims = require('../assets/assert_dims');
var assertStyle = require('../assets/assert_style');


Plotly.register([
    require('@src/transforms/filter'),
    require('@src/transforms/groupby')
]);

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
