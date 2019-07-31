var Plotly = require('@lib/index');
var Plots = require('@src/plots/plots');
var Lib = require('@src/lib');

var d3 = require('d3');
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var failTest = require('../assets/fail_test');
var mouseEvent = require('../assets/mouse_event');
var supplyAllDefaults = require('../assets/supply_defaults');

describe('Test sort transform defaults:', function() {
    function _supply(trace, layout) {
        layout = layout || {};
        Lib.extendDeep(layout, {
            _subplots: {cartesian: ['xy'], xaxis: ['x'], yaxis: ['y']},
            _modules: [],
            _basePlotModules: []
        });
        return Plots.supplyTraceDefaults(trace, {type: trace.type || 'scatter'}, 0, layout);
    }

    it('should coerce all attributes', function() {
        var out = _supply({
            x: [1, 2, 3],
            y: [0, 2, 1],
            transforms: [{
                type: 'sort',
                target: 'marker.size',
                order: 'descending'
            }]
        });

        expect(out.transforms[0].type).toEqual('sort');
        expect(out.transforms[0].target).toEqual('marker.size');
        expect(out.transforms[0].order).toEqual('descending');
        expect(out.transforms[0].enabled).toBe(true);
    });

    it('should skip unsettable attribute when `enabled: false`', function() {
        var out = _supply({
            x: [1, 2, 3],
            y: [0, 2, 1],
            transforms: [{
                type: 'sort',
                enabled: false,
                target: 'marker.size',
                order: 'descending'
            }]
        });

        expect(out.transforms[0].type).toEqual('sort');
        expect(out.transforms[0].target).toBeUndefined();
        expect(out.transforms[0].order).toBeUndefined();
        expect(out.transforms[0].enabled).toBe(false);
    });
});

describe('Test sort transform calc:', function() {
    var base = {
        x: [-2, -1, -2, 0, 1, 3, 1],
        y: [1, 2, 3, 1, 2, 3, 1],
        ids: ['n0', 'n1', 'n2', 'z', 'p1', 'p2', 'p3'],
        marker: {
            color: [0.1, 0.2, 0.3, 0.1, 0.2, 0.3, 0.4],
            size: [10, 20, 5, 1, 6, 0, 10]
        },
        transforms: [{ type: 'sort' }]
    };

    function extend(update) {
        return Lib.extendDeep({}, base, update);
    }

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

    it('should sort all array attributes (ascending case)', function() {
        var out = _transform([extend({})]);

        expect(out[0].x).toEqual([-2, -2, -1, 0, 1, 1, 3]);
        expect(out[0].y).toEqual([1, 3, 2, 1, 2, 1, 3]);
        expect(out[0].ids).toEqual(['n0', 'n2', 'n1', 'z', 'p1', 'p3', 'p2']);
        expect(out[0].marker.color).toEqual([0.1, 0.3, 0.2, 0.1, 0.2, 0.4, 0.3]);
        expect(out[0].marker.size).toEqual([10, 5, 20, 1, 6, 10, 0]);
        expect(out[0].transforms[0]._indexToPoints).toEqual({
            0: [0],
            1: [2],
            2: [1],
            3: [3],
            4: [4],
            5: [6],
            6: [5]
        });
    });

    it('should sort all array attributes (descending case)', function() {
        var out = _transform([extend({
            transforms: [{
                order: 'descending'
            }]
        })]);

        expect(out[0].x).toEqual([3, 1, 1, 0, -1, -2, -2]);
        expect(out[0].y).toEqual([3, 2, 1, 1, 2, 1, 3]);
        expect(out[0].ids).toEqual(['p2', 'p1', 'p3', 'z', 'n1', 'n0', 'n2']);
        expect(out[0].marker.color).toEqual([0.3, 0.2, 0.4, 0.1, 0.2, 0.1, 0.3]);
        expect(out[0].marker.size).toEqual([0, 6, 10, 1, 20, 10, 5]);
        expect(out[0].transforms[0]._indexToPoints).toEqual({
            0: [5],
            1: [4],
            2: [6],
            3: [3],
            4: [1],
            5: [0],
            6: [2]
        });
    });

    it('should sort via nested targets', function() {
        var out = _transform([extend({
            transforms: [{
                target: 'marker.size',
                order: 'descending'
            }]
        })]);

        expect(out[0].x).toEqual([-1, -2, 1, 1, -2, 0, 3]);
        expect(out[0].y).toEqual([2, 1, 1, 2, 3, 1, 3]);
        expect(out[0].ids).toEqual(['n1', 'n0', 'p3', 'p1', 'n2', 'z', 'p2']);
        expect(out[0].marker.color).toEqual([0.2, 0.1, 0.4, 0.2, 0.3, 0.1, 0.3]);
        expect(out[0].marker.size).toEqual([20, 10, 10, 6, 5, 1, 0]);
        expect(out[0].transforms[0]._indexToPoints).toEqual({
            0: [1],
            1: [0],
            2: [6],
            3: [4],
            4: [2],
            5: [3],
            6: [5]
        });
    });

    it('should sort via dates targets', function() {
        var out = _transform([{
            x: ['2015-07-20', '2016-12-02', '2016-09-01', '2016-10-21', '2016-10-20'],
            y: [0, 1, 2, 3, 4, 5],
            transforms: [{ type: 'sort' }]
        }]);

        expect(out[0].x).toEqual([
            '2015-07-20', '2016-09-01', '2016-10-20', '2016-10-21', '2016-12-02'
        ]);
        expect(out[0].y).toEqual([0, 2, 4, 3, 1]);
    });

    it('should sort via categorical targets', function() {
        var trace = extend({
            transforms: [{ target: 'marker.size' }]
        });
        trace.x = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];

        var out = _transform([trace]);

        expect(out[0].x).toEqual(['F', 'D', 'C', 'E', 'A', 'G', 'B']);
        expect(out[0].y).toEqual([3, 1, 3, 2, 1, 1, 2]);
        expect(out[0].ids).toEqual(['p2', 'z', 'n2', 'p1', 'n0', 'p3', 'n1']);
        expect(out[0].marker.size).toEqual([0, 1, 5, 6, 10, 10, 20]);
        expect(out[0].marker.color).toEqual([0.3, 0.1, 0.3, 0.2, 0.1, 0.4, 0.2]);
    });

    it('should sort via custom targets', function() {
        var out = _transform([extend({
            transforms: [{
                target: [10, 20, 30, 10, 20, 30, 0]
            }]
        })]);

        expect(out[0].x).toEqual([1, -2, 0, -1, 1, -2, 3]);
        expect(out[0].y).toEqual([1, 1, 1, 2, 2, 3, 3]);
        expect(out[0].ids).toEqual(['p3', 'n0', 'z', 'n1', 'p1', 'n2', 'p2']);
        expect(out[0].marker.color).toEqual([0.4, 0.1, 0.1, 0.2, 0.2, 0.3, 0.3]);
        expect(out[0].marker.size).toEqual([10, 10, 1, 20, 6, 5, 0]);
    });

    it('should truncate transformed arrays to target array length (short target case)', function() {
        var out = _transform([
            extend({
                transforms: [{
                    order: 'descending',
                    target: [0, 1]
                }]
            }
        ), extend({
            text: ['A', 'B'],
            transforms: [{ target: 'text' }]
        })]);

        expect(out[0].x).toEqual([-1, -2]);
        expect(out[0].y).toEqual([2, 1]);
        expect(out[0].ids).toEqual(['n1', 'n0']);
        expect(out[0].marker.color).toEqual([0.2, 0.1]);
        expect(out[0].marker.size).toEqual([20, 10]);
        expect(out[0]._length).toBe(2);

        expect(out[1].x).toEqual([-2, -1]);
        expect(out[1].y).toEqual([1, 2]);
        expect(out[1].ids).toEqual(['n0', 'n1']);
        expect(out[1].marker.color).toEqual([0.1, 0.2]);
        expect(out[1].marker.size).toEqual([10, 20]);
        expect(out[1]._length).toBe(2);
    });

    it('should truncate transformed arrays to target array length (long target case)', function() {
        var out = _transform([
            extend({
                transforms: [{
                    order: 'descending',
                    target: [0, 1, 2, 0, 1, 2, 3, 0, 1, 2, 3]
                }]
            }
        ), extend({
            text: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'],
            transforms: [{ target: 'text' }]
        })]);

        expect(out[0].x).toEqual([1, -2, 3, -1, 1, -2, 0]);
        expect(out[0].y).toEqual([1, 3, 3, 2, 2, 1, 1]);
        expect(out[0].ids).toEqual(['p3', 'n2', 'p2', 'n1', 'p1', 'n0', 'z']);
        expect(out[0].marker.color).toEqual([0.4, 0.3, 0.3, 0.2, 0.2, 0.1, 0.1]);
        expect(out[0].marker.size).toEqual([10, 5, 0, 20, 6, 10, 1]);
        expect(out[0]._length).toBe(7);

        expect(out[1].x).toEqual([-2, -1, -2, 0, 1, 3, 1]);
        expect(out[1].y).toEqual([1, 2, 3, 1, 2, 3, 1]);
        expect(out[1].ids).toEqual(['n0', 'n1', 'n2', 'z', 'p1', 'p2', 'p3']);
        expect(out[1].marker.color).toEqual([0.1, 0.2, 0.3, 0.1, 0.2, 0.3, 0.4]);
        expect(out[1].marker.size).toEqual([10, 20, 5, 1, 6, 0, 10]);
        expect(out[1]._length).toBe(7);
    });
});

describe('Test sort transform interactions:', function() {
    afterEach(destroyGraphDiv);

    function _assertFirst(p) {
        var parts = d3.select('.point').attr('d').split(',').slice(0, 3).join(',');
        expect(parts).toEqual(p);
    }

    it('should respond to restyle calls', function(done) {
        Plotly.plot(createGraphDiv(), [{
            x: [-2, -1, -2, 0, 1, 3, 1],
            y: [1, 2, 3, 1, 2, 3, 1],
            marker: {
                size: [10, 20, 5, 1, 6, 0, 10]
            },
            transforms: [{
                type: 'sort',
                target: 'marker.size',
            }]
        }])
        .then(function(gd) {
            _assertFirst('M0,0A0,0 0 1');

            return Plotly.restyle(gd, 'transforms[0].order', 'descending');
        })
        .then(function(gd) {
            _assertFirst('M10,0A10,10 0 1');

            return Plotly.restyle(gd, 'transforms[0].enabled', false);
        })
        .then(function(gd) {
            _assertFirst('M5,0A5,5 0 1');

            return Plotly.restyle(gd, 'transforms[0].enabled', true);
        })
        .then(function() {
            _assertFirst('M10,0A10,10 0 1');
        })
        .catch(failTest)
        .then(done);
    });

    it('does not preserve event data `pointNumber` value', function(done) {
        var gd = createGraphDiv();

        function getPxPos(gd, id) {
            var trace = gd.data[0];
            var fullLayout = gd._fullLayout;
            var index = trace.ids.indexOf(id);

            return [
                fullLayout.xaxis.d2p(trace.x[index]),
                fullLayout.yaxis.d2p(trace.y[index])
            ];
        }

        function hover(gd, id) {
            return new Promise(function(resolve, reject) {
                gd.once('plotly_hover', function(eventData) {
                    Lib.clearThrottle();
                    resolve(eventData);
                });

                var pos = getPxPos(gd, id);
                mouseEvent('mousemove', pos[0], pos[1]);

                setTimeout(function() {
                    reject('plotly_hover did not get called!');
                }, 100);
            });
        }

        function assertPt(eventData, x, y, pointNumber, id) {
            var pt = eventData.points[0];

            expect(pt.x).toEqual(x, 'x');
            expect(pt.y).toEqual(y, 'y');
            expect(pt.pointNumber).toEqual(pointNumber, 'pointNumber');
            expect(pt.fullData.ids[pt.pointNumber]).toEqual(id, 'id');
        }

        Plotly.plot(gd, [{
            mode: 'markers',
            x: [-2, -1, -2, 0, 1, 3, 1],
            y: [1, 2, 3, 1, 2, 3, 1],
            ids: ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
            marker: {
                size: [10, 20, 5, 1, 6, 0, 10]
            },
            transforms: [{
                enabled: false,
                type: 'sort',
                target: 'marker.size',
            }]
        }], {
            width: 500,
            height: 500,
            margin: {l: 0, t: 0, r: 0, b: 0},
            hovermode: 'closest'
        })
        .then(function() { return hover(gd, 'D'); })
        .then(function(eventData) {
            assertPt(eventData, 0, 1, 3, 'D');
        })
        .then(function() { return hover(gd, 'G'); })
        .then(function(eventData) {
            assertPt(eventData, 1, 1, 6, 'G');
        })
        .then(function() {
            return Plotly.restyle(gd, 'transforms[0].enabled', true);
        })
        .then(function() { return hover(gd, 'D'); })
        .then(function(eventData) {
            assertPt(eventData, 0, 1, 1, 'D');
        })
        .then(function() { return hover(gd, 'G'); })
        .then(function(eventData) {
            assertPt(eventData, 1, 1, 5, 'G');
        })
        .then(function() {
            return Plotly.relayout(gd, 'xaxis.range', [-5, 5]);
        })
        .then(function() { return hover(gd, 'D'); })
        .then(function(eventData) {
            assertPt(eventData, 0, 1, 1, 'D');
        })
        .then(function() { return hover(gd, 'G'); })
        .then(function(eventData) {
            assertPt(eventData, 1, 1, 5, 'G');
        })
        .catch(failTest)
        .then(done);
    });

    it('should honor *categoryarray* when set', function(done) {
        var gd = createGraphDiv();

        Plotly.plot(gd, [{
            x: ['C', 'B', 'A'],
            y: [3, 1, 2],
            marker: {
                size: [10, 20, 5]
            },
            transforms: [{
                enabled: false,
                type: 'sort',
                target: [0, 2, 1],
            }]
        }], {
            xaxis: {
                categoryorder: 'trace',
                categoryarray: ['A', 'B', 'C']
            }
        })
        .then(function() {
            expect(gd._fullLayout.xaxis._categories).toEqual(['C', 'B', 'A']);

            return Plotly.restyle(gd, 'transforms[0].enabled', true);
        })
        .then(function() {
            expect(gd._fullLayout.xaxis._categories).toEqual(['C', 'A', 'B']);

            return Plotly.relayout(gd, 'xaxis.categoryorder', 'array');
        })
        .then(function() {
            expect(gd._fullLayout.xaxis._categories).toEqual(['A', 'B', 'C']);
        })
        .catch(failTest)
        .then(done);
    });
});
