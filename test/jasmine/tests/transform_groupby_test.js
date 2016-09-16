var Plotly = require('@lib/index');
var Lib = require('@src/lib');

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var assertDims = require('../assets/assert_dims');
var assertStyle = require('../assets/assert_style');

Plotly.register([
    require('@src/transforms/groupby')
]);

describe('one-to-many transforms:', function() {
    'use strict';

    var mockData0 = [{
        mode: 'markers',
        x: [1, -1, -2, 0, 1, 2, 3],
        y: [1, 2, 3, 1, 2, 3, 1],
        transforms: [{
            type: 'groupby',
            groups: ['a', 'a', 'b', 'a', 'b', 'b', 'a'],
            style: { a: {marker: {color: 'red'}}, b: {marker: {color: 'blue'}} }
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
