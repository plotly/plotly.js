var Plotly = require('@lib/index');
var Plots = require('@src/plots/plots');
var Lib = require('@src/lib');

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var assertDims = require('../assets/assert_dims');
var assertStyle = require('../assets/assert_style');


describe('filter transforms defaults:', function() {

    var traceIn, traceOut;

    it('supplyTraceDefaults should coerce all attributes', function() {
        traceIn = {
            x: [1, 2, 3],
            transforms: [{
                type: 'filter',
                value: 0
            }]
        };

        traceOut = Plots.supplyTraceDefaults(traceIn, 0, {});

        expect(traceOut.transforms).toEqual([{
            type: 'filter',
            enabled: true,
            operation: '=',
            value: 0,
            filtersrc: 'x'
        }]);
    });

    it('supplyTraceDefaults should not coerce attributes if enabled: false', function() {
        traceIn = {
            x: [1, 2, 3],
            transforms: [{
                enabled: false,
                type: 'filter',
                value: 0
            }]
        };

        traceOut = Plots.supplyTraceDefaults(traceIn, 0, {});

        expect(traceOut.transforms).toEqual([{
            type: 'filter',
            enabled: false,
        }]);
    });

    it('supplyTraceDefaults should coerce *filtersrc* as a strict / noBlank string', function() {
        traceIn = {
            x: [1, 2, 3],
            transforms: [{
                type: 'filter',
            }, {
                type: 'filter',
                filtersrc: 0
            }, {
                type: 'filter',
                filtersrc: ''
            }, {
                type: 'filter',
                filtersrc: 'marker.color'
            }]
        };

        traceOut = Plots.supplyTraceDefaults(traceIn, 0, {});

        expect(traceOut.transforms[0].filtersrc).toEqual('x');
        expect(traceOut.transforms[1].filtersrc).toEqual('x');
        expect(traceOut.transforms[2].filtersrc).toEqual('x');
        expect(traceOut.transforms[3].filtersrc).toEqual('marker.color');
    });
});

describe('filter transforms calc:', function() {
    'use strict';

    function calcDatatoTrace(calcTrace) {
        return calcTrace[0].trace;
    }

    function _transform(data, layout) {
        var gd = {
            data: data,
            layout: layout || {}
        };

        Plots.supplyDefaults(gd);
        Plots.doCalcdata(gd);

        return gd.calcdata.map(calcDatatoTrace);
    }

    var base = {
        x: [-2, -1, -2, 0, 1, 2, 3],
        y: [1, 2, 3, 1, 2, 3, 1],
        ids: ['n0', 'n1', 'n2', 'z', 'p1', 'p2', 'p3'],
        marker: {
            color: [0.1, 0.2, 0.3, 0.1, 0.2, 0.3, 0.4],
            size: 20
        },
        transforms: [{ type: 'filter' }]
    };

    it('filters should skip if *filtersrc* isn\'t present in trace', function() {
        var out = _transform([Lib.extendDeep({}, base, {
            transforms: [{
                type: 'filter',
                operation: '>',
                value: 0,
                filtersrc: 'z'
            }]
        })]);

        expect(out[0].x).toEqual(base.x);
        expect(out[0].y).toEqual(base.y);
    });

    it('filters should handle 3D *z* data', function() {
        var out = _transform([Lib.extendDeep({}, base, {
            type: 'scatter3d',
            z: ['2015-07-20', '2016-08-01', '2016-09-01', '2016-10-21', '2016-12-02'],
            transforms: [{
                type: 'filter',
                operation: '>',
                value: '2016-10-01',
                filtersrc: 'z'
            }]
        })]);

        expect(out[0].x).toEqual([0, 1]);
        expect(out[0].y).toEqual([1, 2]);
        expect(out[0].z).toEqual(['2016-10-21', '2016-12-02']);
    });

    it('filters should handle geographical *lon* data', function() {
        var trace0 = {
            type: 'scattergeo',
            lon: [-90, -40, 100, 120, 130],
            lat: [-50, -40, 10, 20, 30],
            transforms: [{
                type: 'filter',
                operation: '>',
                value: 0,
                filtersrc: 'lon'
            }]
        };

        var trace1 = {
            type: 'scattermapbox',
            lon: [-90, -40, 100, 120, 130],
            lat: [-50, -40, 10, 20, 30],
            transforms: [{
                type: 'filter',
                operation: '<',
                value: 0,
                filtersrc: 'lat'
            }]
        };

        var out = _transform([trace0, trace1]);

        expect(out[0].lon).toEqual([100, 120, 130]);
        expect(out[0].lat).toEqual([10, 20, 30]);

        expect(out[1].lon).toEqual([-90, -40]);
        expect(out[1].lat).toEqual([-50, -40]);
    });

    it('filters should handle nested attributes', function() {
        var out = _transform([Lib.extendDeep({}, base, {
            transforms: [{
                type: 'filter',
                operation: '>',
                value: 0.2,
                filtersrc: 'marker.color'
            }]
        })]);

        expect(out[0].x).toEqual([-2, 2, 3]);
        expect(out[0].y).toEqual([3, 3, 1]);
        expect(out[0].marker.color).toEqual([0.3, 0.3, 0.4]);
    });

    it('filters should skip if *enabled* is false', function() {
        var out = _transform([Lib.extendDeep({}, base, {
            transforms: [{
                type: 'filter',
                enabled: false,
                operation: '>',
                value: 0,
                filtersrc: 'x'
            }]
        })]);

        expect(out[0].x).toEqual(base.x);
        expect(out[0].y).toEqual(base.y);
    });

    it('filters should chain as AND (case 1)', function() {
        var out = _transform([Lib.extendDeep({}, base, {
            transforms: [{
                type: 'filter',
                operation: '>',
                value: 0,
                filtersrc: 'x'
            }, {
                type: 'filter',
                operation: '<',
                value: 3,
                filtersrc: 'x'
            }]
        })]);

        expect(out[0].x).toEqual([1, 2]);
        expect(out[0].y).toEqual([2, 3]);
    });

    it('filters should chain as AND (case 2)', function() {
        var out = _transform([Lib.extendDeep({}, base, {
            transforms: [{
                type: 'filter',
                operation: '>',
                value: 0,
                filtersrc: 'x'
            }, {
                type: 'filter',
                enabled: false,
                operation: '>',
                value: 2,
                filtersrc: 'y'
            }, {
                type: 'filter',
                operation: '<',
                value: 2,
                filtersrc: 'y'
            }]
        })]);

        expect(out[0].x).toEqual([3]);
        expect(out[0].y).toEqual([1]);
    });

    describe('filters should handle numeric values', function() {
        var _base = Lib.extendDeep({}, base);

        function _assert(out, x, y, markerColor) {
            expect(out[0].x).toEqual(x, '- x coords');
            expect(out[0].y).toEqual(y, '- y coords');
            expect(out[0].marker.color).toEqual(markerColor, '- marker.color arrayOk');
            expect(out[0].marker.size).toEqual(20, '- marker.size style');
        }

        it('with operation *[]*', function() {
            var out = _transform([Lib.extendDeep({}, _base, {
                transforms: [{
                    operation: '[]',
                    value: [-1, 1],
                    filtersrc: 'x'
                }]
            })]);

            _assert(out,
                [-1, 0, 1],
                [2, 1, 2],
                [0.2, 0.1, 0.2]
            );
        });

        it('with operation *[)*', function() {
            var out = _transform([Lib.extendDeep({}, _base, {
                transforms: [{
                    operation: '[)',
                    value: [-1, 1],
                    filtersrc: 'x'
                }]
            })]);

            _assert(out, [-1, 0], [2, 1], [0.2, 0.1]);
        });

        it('with operation *(]*', function() {
            var out = _transform([Lib.extendDeep({}, _base, {
                transforms: [{
                    operation: '(]',
                    value: [-1, 1],
                    filtersrc: 'x'
                }]
            })]);

            _assert(out, [0, 1], [1, 2], [0.1, 0.2]);
        });

        it('with operation *()*', function() {
            var out = _transform([Lib.extendDeep({}, _base, {
                transforms: [{
                    operation: '()',
                    value: [-1, 1],
                    filtersrc: 'x'
                }]
            })]);

            _assert(out, [0], [1], [0.1]);
        });

        it('with operation *)(*', function() {
            var out = _transform([Lib.extendDeep({}, _base, {
                transforms: [{
                    operation: ')(',
                    value: [-1, 1],
                    filtersrc: 'x'
                }]
            })]);

            _assert(out,
                [-2, -2, 2, 3],
                [1, 3, 3, 1],
                [0.1, 0.3, 0.3, 0.4]
            );
        });

        it('with operation *)[*', function() {
            var out = _transform([Lib.extendDeep({}, _base, {
                transforms: [{
                    operation: ')[',
                    value: [-1, 1],
                    filtersrc: 'x'
                }]
            })]);

            _assert(out,
                [-2, -2, 1, 2, 3],
                [1, 3, 2, 3, 1],
                [0.1, 0.3, 0.2, 0.3, 0.4]
            );
        });

        it('with operation *](*', function() {
            var out = _transform([Lib.extendDeep({}, _base, {
                transforms: [{
                    operation: '](',
                    value: [-1, 1],
                    filtersrc: 'x'
                }]
            })]);

            _assert(out,
                [-2, -1, -2, 2, 3],
                [1, 2, 3, 3, 1],
                [0.1, 0.2, 0.3, 0.3, 0.4]
            );
        });

        it('with operation *][*', function() {
            var out = _transform([Lib.extendDeep({}, _base, {
                transforms: [{
                    operation: '][',
                    value: [-1, 1],
                    filtersrc: 'x'
                }]
            })]);

            _assert(out,
                [-2, -1, -2, 1, 2, 3],
                [1, 2, 3, 2, 3, 1],
                [0.1, 0.2, 0.3, 0.2, 0.3, 0.4]
            );
        });

        it('with operation *{}*', function() {
            var out = _transform([Lib.extendDeep({}, _base, {
                transforms: [{
                    operation: '{}',
                    value: [-2, 0],
                    filtersrc: 'x'
                }]
            })]);

            _assert(out,
                [-2, -2, 0],
                [1, 3, 1],
                [0.1, 0.3, 0.1]
            );
        });

        it('with operation *}{*', function() {
            var out = _transform([Lib.extendDeep({}, _base, {
                transforms: [{
                    operation: '}{',
                    value: [-2, 0],
                    filtersrc: 'x'
                }]
            })]);

            _assert(out,
                [-1, 1, 2, 3],
                [2, 2, 3, 1],
                [0.2, 0.2, 0.3, 0.4]
            );
        });

        it('should honored set axis type', function() {
            var out = _transform([Lib.extendDeep({}, _base, {
                x: [1, 2, 3, 0, -1, -2, -3],
                transforms: [{
                    operation: '>',
                    value: -1,
                    filtersrc: 'x'
                }]
            })], {
                xaxis: { type: 'category' }
            });

            _assert(out, [-2, -3], [3, 1], [0.3, 0.4]);
        });

    });

    describe('filters should handle categories', function() {
        var _base = {
            x: ['a', 'b', 'c', 'd'],
            y: [1, 2, 3, 4],
            marker: {
                color: 'red',
                size: ['0', '1', '2', '0']
            },
            transforms: [{ type: 'filter' }]
        };

        function _assert(out, x, y, markerSize) {
            expect(out[0].x).toEqual(x, '- x coords');
            expect(out[0].y).toEqual(y, '- y coords');
            expect(out[0].marker.size).toEqual(markerSize, '- marker.size arrayOk');
            expect(out[0].marker.color).toEqual('red', '- marker.color style');
        }

        it('with operation *()*', function() {
            var out = _transform([Lib.extendDeep({}, _base, {
                transforms: [{
                    operation: '()',
                    value: ['a', 'c'],
                    filtersrc: 'x'
                }]
            })]);

            _assert(out, ['b'], [2], ['1']);
        });

        it('with operation *)(*', function() {
            var out = _transform([Lib.extendDeep({}, _base, {
                transforms: [{
                    operation: ')(',
                    value: ['a', 'c'],
                    filtersrc: 'x'
                }]
            })]);

            _assert(out, ['d'], [4], ['0']);
        });

        it('with operation *{}*', function() {
            var out = _transform([Lib.extendDeep({}, _base, {
                transforms: [{
                    operation: '{}',
                    value: ['b', 'd'],
                    filtersrc: 'x'
                }]
            })]);

            _assert(out, ['b', 'd'], [2, 4], ['1', '0']);
        });

        it('with operation *}{*', function() {
            var out = _transform([Lib.extendDeep({}, _base, {
                transforms: [{
                    operation: '}{',
                    value: ['b', 'd'],
                    filtersrc: 'x'
                }]
            })]);

            _assert(out, ['a', 'c'], [1, 3], ['0', '2']);
        });

    });

    describe('filters should handle dates', function() {
        var _base = {
            x: ['2015-07-20', '2016-08-01', '2016-09-01', '2016-10-21', '2016-12-02'],
            y: [1, 2, 3, 1, 5],
            marker: {
                line: {
                    color: [0.1, 0.2, 0.3, 0.1, 0.2],
                    width: 2.5
                }
            },
            transforms: [{ type: 'filter' }]
        };

        function _assert(out, x, y, markerLineColor) {
            expect(out[0].x).toEqual(x, '- x coords');
            expect(out[0].y).toEqual(y, '- y coords');
            expect(out[0].marker.line.color).toEqual(markerLineColor, '- marker.line.color arrayOk');
            expect(out[0].marker.line.width).toEqual(2.5, '- marker.line.width style');
        }

        it('with operation *=*', function() {
            var out = _transform([Lib.extendDeep({}, _base, {
                transforms: [{
                    operation: '=',
                    value: ['2015-07-20'],
                    filtersrc: 'x'
                }]
            })]);

            _assert(out, ['2015-07-20'], [1], [0.1]);
        });

        it('with operation *<*', function() {
            var out = _transform([Lib.extendDeep({}, _base, {
                transforms: [{
                    operation: '<',
                    value: '2016-01-01',
                    filtersrc: 'x'
                }]
            })]);

            _assert(out, ['2015-07-20'], [1], [0.1]);
        });

        it('with operation *>*', function() {
            var out = _transform([Lib.extendDeep({}, _base, {
                transforms: [{
                    operation: '>=',
                    value: '2016-08-01',
                    filtersrc: 'x'
                }]
            })]);

            _assert(out,
                ['2016-08-01', '2016-09-01', '2016-10-21', '2016-12-02'],
                [2, 3, 1, 5],
                [0.2, 0.3, 0.1, 0.2]
            );
        });

        it('with operation *[]*', function() {
            var out = _transform([Lib.extendDeep({}, _base, {
                transforms: [{
                    operation: '[]',
                    value: ['2016-08-01', '2016-10-01'],
                    filtersrc: 'x'
                }]
            })]);

            _assert(out, ['2016-08-01', '2016-09-01'], [2, 3], [0.2, 0.3]);
        });

        it('with operation *)(*', function() {
            var out = _transform([Lib.extendDeep({}, _base, {
                transforms: [{
                    operation: ')(',
                    value: ['2016-08-01', '2016-10-01'],
                    filtersrc: 'x'
                }]
            })]);

            _assert(out, ['2015-07-20', '2016-10-21', '2016-12-02'], [1, 1, 5], [0.1, 0.1, 0.2]);
        });

        it('with operation *{}*', function() {
            var out = _transform([Lib.extendDeep({}, _base, {
                transforms: [{
                    operation: '{}',
                    value: '2015-07-20',
                    filtersrc: 'x'
                }]
            })]);

            _assert(out, ['2015-07-20'], [1], [0.1]);
        });

        it('with operation *}{*', function() {
            var out = _transform([Lib.extendDeep({}, _base, {
                transforms: [{
                    operation: '}{',
                    value: ['2016-08-01', '2016-09-01', '2016-10-21', '2016-12-02'],
                    filtersrc: 'x'
                }]
            })]);

            _assert(out, ['2015-07-20'], [1], [0.1]);
        });

    });

    it('filters should handle ids', function() {
        var out = _transform([Lib.extendDeep({}, base, {
            transforms: [{
                operation: '{}',
                value: ['p1', 'p2', 'n1'],
                filtersrc: 'ids'
            }]
        })]);

        expect(out[0].x).toEqual([-1, 1, 2]);
        expect(out[0].y).toEqual([2, 2, 3]);
        expect(out[0].ids).toEqual(['n1', 'p1', 'p2']);
    });
});

describe('filter transforms interactions', function() {
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
});
