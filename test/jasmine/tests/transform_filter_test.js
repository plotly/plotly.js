var Plotly = require('@lib/index');
var Filter = require('@src/transforms/filter');

var Plots = require('@src/plots/plots');
var Lib = require('@src/lib');

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var customAssertions = require('../assets/custom_assertions');
var supplyAllDefaults = require('../assets/supply_defaults');


var assertDims = customAssertions.assertDims;
var assertStyle = customAssertions.assertStyle;

describe('filter transforms defaults:', function() {
    var fullLayout = {
        _transformModules: [],
        _subplots: {cartesian: ['xy'], xaxis: ['x'], yaxis: ['y']}
    };

    var traceIn, traceOut;

    it('supplyTraceDefaults should coerce all attributes', function() {
        traceIn = {
            x: [1, 2, 3],
            transforms: [{
                type: 'filter',
                value: 0
            }]
        };

        traceOut = Plots.supplyTraceDefaults(traceIn, {type: 'scatter'}, 0, fullLayout);

        expect(traceOut.transforms).toEqual([{
            type: 'filter',
            enabled: true,
            preservegaps: false,
            operation: '=',
            value: 0,
            target: 'x',
            _module: Filter
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

        traceOut = Plots.supplyTraceDefaults(traceIn, {type: 'scatter'}, 0, fullLayout);

        expect(traceOut.transforms).toEqual([{
            type: 'filter',
            enabled: false,
            _module: Filter
        }]);
    });

    it('supplyTraceDefaults should coerce *target* as a strict / noBlank string', function() {
        traceIn = {
            x: [1, 2, 3],
            transforms: [{
                type: 'filter'
            }, {
                type: 'filter',
                target: 0
            }, {
                type: 'filter',
                target: ''
            }, {
                type: 'filter',
                target: 'marker.color'
            }]
        };

        traceOut = Plots.supplyTraceDefaults(traceIn, {type: 'scatter'}, 0, fullLayout);

        expect(traceOut.transforms[0].target).toEqual('x');
        expect(traceOut.transforms[1].target).toEqual('x');
        expect(traceOut.transforms[2].target).toEqual('x');
        expect(traceOut.transforms[3].target).toEqual('marker.color');
    });

    it('supplyTraceDefaults should set *enabled:false* and return early when *target* is an empty array', function() {
        // see https://github.com/plotly/plotly.js/issues/2908
        // this solves multiple problems downstream

        traceIn = {
            x: [1, 2, 3],
            transforms: [{
                type: 'filter',
                target: []
            }]
        };
        traceOut = Plots.supplyTraceDefaults(traceIn, {type: 'scatter'}, 0, fullLayout);
        expect(traceOut.transforms[0].target).toEqual([]);
        expect(traceOut.transforms[0].enabled).toBe(false, 'set to false!');

        traceIn = {
            x: new Float32Array([1, 2, 3]),
            transforms: [{
                type: 'filter',
                target: new Float32Array()
            }]
        };
        traceOut = Plots.supplyTraceDefaults(traceIn, {type: 'scatter'}, 0, fullLayout);
        expect(traceOut.transforms[0].target).toEqual(new Float32Array());
        expect(traceOut.transforms[0].enabled).toBe(false, 'set to false!');
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

        supplyAllDefaults(gd);
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

    it('filters should skip if *target* isn\'t present in trace', function() {
        var out = _transform([Lib.extendDeep({}, base, {
            transforms: [{
                type: 'filter',
                operation: '>',
                value: 0,
                target: 'z'
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
                target: 'z'
            }]
        })]);

        expect(out[0].x).toEqual([0, 1]);
        expect(out[0].y).toEqual([1, 2]);
        expect(out[0].z).toEqual(['2016-10-21', '2016-12-02']);
        expect(out[0].transforms[0]._indexToPoints).toEqual({0: [3], 1: [4]});
    });

    it('should use the calendar from the target attribute if target is a string', function() {
        // this is the same data as in "filters should handle 3D *z* data"
        // but with different calendars
        var out = _transform([Lib.extendDeep({}, base, {
            type: 'scatter3d',
            // the same array as above but in nanakshahi dates
            z: ['0547-05-05', '0548-05-17', '0548-06-17', '0548-08-07', '0548-09-19'],
            zcalendar: 'nanakshahi',
            transforms: [{
                type: 'filter',
                operation: '>',
                value: '5776-06-28',
                valuecalendar: 'hebrew',
                target: 'z',
                // targetcalendar is ignored!
                targetcalendar: 'taiwan'
            }]
        })]);

        expect(out[0].x).toEqual([0, 1]);
        expect(out[0].y).toEqual([1, 2]);
        expect(out[0].z).toEqual(['0548-08-07', '0548-09-19']);
    });

    it('should use targetcalendar anyway if there is no matching calendar attribute', function() {
        // this is the same data as in "filters should handle 3D *z* data"
        // but with different calendars
        var out = _transform([Lib.extendDeep({}, base, {
            type: 'scatter',
            // the same array as above but in taiwanese dates
            text: ['0104-07-20', '0105-08-01', '0105-09-01', '0105-10-21', '0105-12-02'],
            transforms: [{
                type: 'filter',
                operation: '>',
                value: '5776-06-28',
                valuecalendar: 'hebrew',
                target: 'text',
                targetcalendar: 'taiwan'
            }]
        })]);

        expect(out[0].x).toEqual([0, 1]);
        expect(out[0].y).toEqual([1, 2]);
        expect(out[0].text).toEqual(['0105-10-21', '0105-12-02']);
    });

    it('should use targetcalendar if target is an array', function() {
        // this is the same data as in "filters should handle 3D *z* data"
        // but with different calendars
        var out = _transform([Lib.extendDeep({}, base, {
            type: 'scatter3d',
            // the same array as above but in nanakshahi dates
            z: ['0547-05-05', '0548-05-17', '0548-06-17', '0548-08-07', '0548-09-19'],
            zcalendar: 'nanakshahi',
            transforms: [{
                type: 'filter',
                operation: '>',
                value: '5776-06-28',
                valuecalendar: 'hebrew',
                target: ['0104-07-20', '0105-08-01', '0105-09-01', '0105-10-21', '0105-12-02'],
                targetcalendar: 'taiwan'
            }]
        })]);

        expect(out[0].x).toEqual([0, 1]);
        expect(out[0].y).toEqual([1, 2]);
        expect(out[0].z).toEqual(['0548-08-07', '0548-09-19']);
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
                target: 'lon'
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
                target: 'lat'
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
                target: 'marker.color'
            }]
        })]);

        expect(out[0].x).toEqual([-2, 2, 3]);
        expect(out[0].y).toEqual([3, 3, 1]);
        expect(out[0].marker.color).toEqual([0.3, 0.3, 0.4]);
        expect(out[0].transforms[0]._indexToPoints).toEqual({0: [2], 1: [5], 2: [6]});
    });

    it('filters should handle array on base trace attributes', function() {
        var out = _transform([Lib.extendDeep({}, base, {
            hoverinfo: ['x', 'y', 'text', 'name', 'none', 'skip', 'all'],
            hoverlabel: {
                bgcolor: ['red', 'green', 'blue', 'black', 'yellow', 'cyan', 'pink']
            },
            transforms: [{
                type: 'filter',
                operation: '>',
                value: 0
            }]
        })]);

        expect(out[0].x).toEqual([1, 2, 3]);
        expect(out[0].y).toEqual([2, 3, 1]);
        expect(out[0].hoverinfo).toEqual(['none', 'skip', 'all']);
        expect(out[0].hoverlabel.bgcolor).toEqual(['yellow', 'cyan', 'pink']);
    });

    it('filters should skip if *enabled* is false', function() {
        var out = _transform([Lib.extendDeep({}, base, {
            transforms: [{
                type: 'filter',
                enabled: false,
                operation: '>',
                value: 0,
                target: 'x'
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
                target: 'x'
            }, {
                type: 'filter',
                operation: '<',
                value: 3,
                target: 'x'
            }]
        })]);

        expect(out[0].x).toEqual([1, 2]);
        expect(out[0].y).toEqual([2, 3]);
        expect(out[0].transforms[0]._indexToPoints).toEqual({0: [4], 1: [5], 2: [6]});
        expect(out[0].transforms[1]._indexToPoints).toEqual({0: [4], 1: [5]});
    });

    it('filters should chain as AND (case 2)', function() {
        var out = _transform([Lib.extendDeep({}, base, {
            transforms: [{
                type: 'filter',
                operation: '>',
                value: 0,
                target: 'x'
            }, {
                type: 'filter',
                enabled: false,
                operation: '>',
                value: 2,
                target: 'y'
            }, {
                type: 'filter',
                operation: '<',
                value: 2,
                target: 'y'
            }]
        })]);

        expect(out[0].x).toEqual([3]);
        expect(out[0].y).toEqual([1]);
        expect(out[0].transforms[0]._indexToPoints).toEqual({0: [4], 1: [5], 2: [6]});
        expect(out[0].transforms[2]._indexToPoints).toEqual({0: [6]});
    });

    it('should preserve gaps in data when `preservegaps` is turned on', function() {
        var out = _transform([Lib.extendDeep({}, base, {
            transforms: [{
                type: 'filter',
                preservegaps: true,
                operation: '>',
                value: 0,
                target: 'x'
            }]
        })]);

        expect(out[0].x).toEqual([undefined, undefined, undefined, undefined, 1, 2, 3]);
        expect(out[0].y).toEqual([undefined, undefined, undefined, undefined, 2, 3, 1]);
        expect(out[0].marker.color).toEqual([undefined, undefined, undefined, undefined, 0.2, 0.3, 0.4]);
        expect(out[0].transforms[0]._indexToPoints).toEqual({4: [4], 5: [5], 6: [6]});
    });

    it('two filter transforms with `preservegaps: true` should commute', function() {
        var transform0 = {
            type: 'filter',
            preservegaps: true,
            operation: '>',
            value: -1,
            target: 'x'
        };

        var transform1 = {
            type: 'filter',
            preservegaps: true,
            operation: '<',
            value: 2,
            target: 'x'
        };

        var out0 = _transform([Lib.extendDeep({}, base, {
            transforms: [transform0, transform1]
        })]);

        var out1 = _transform([Lib.extendDeep({}, base, {
            transforms: [transform1, transform0]
        })]);
        // _indexToPoints differs in the first transform but matches in the second
        expect(out0[0].transforms[0]._indexToPoints).toEqual({3: [3], 4: [4], 5: [5], 6: [6]});
        expect(out1[0].transforms[0]._indexToPoints).toEqual({0: [0], 1: [1], 2: [2], 3: [3], 4: [4]});
        expect(out0[0].transforms[1]._indexToPoints).toEqual({3: [3], 4: [4]});
        expect(out1[0].transforms[1]._indexToPoints).toEqual({3: [3], 4: [4]});

        ['x', 'y', 'ids', 'marker.color', 'marker.size'].forEach(function(k) {
            var v0 = Lib.nestedProperty(out0[0], k).get();
            var v1 = Lib.nestedProperty(out1[0], k).get();
            expect(v0).toEqual(v1);
        });
    });

    it('two filter transforms with `preservegaps: false` should commute', function() {
        var transform0 = {
            type: 'filter',
            preservegaps: false,
            operation: '>',
            value: -1,
            target: 'x'
        };

        var transform1 = {
            type: 'filter',
            preservegaps: false,
            operation: '<',
            value: 2,
            target: 'x'
        };

        var out0 = _transform([Lib.extendDeep({}, base, {
            transforms: [transform0, transform1]
        })]);

        var out1 = _transform([Lib.extendDeep({}, base, {
            transforms: [transform1, transform0]
        })]);

        // _indexToPoints differs in the first transform but matches in the second
        expect(out0[0].transforms[0]._indexToPoints).toEqual({0: [3], 1: [4], 2: [5], 3: [6]});
        expect(out1[0].transforms[0]._indexToPoints).toEqual({0: [0], 1: [1], 2: [2], 3: [3], 4: [4]});
        expect(out0[0].transforms[1]._indexToPoints).toEqual({0: [3], 1: [4]});
        expect(out1[0].transforms[1]._indexToPoints).toEqual({0: [3], 1: [4]});

        ['x', 'y', 'ids', 'marker.color', 'marker.size'].forEach(function(k) {
            var v0 = Lib.nestedProperty(out0[0], k).get();
            var v1 = Lib.nestedProperty(out1[0], k).get();
            expect(v0).toEqual(v1);
        });
    });

    it('two filter transforms with different `preservegaps` values should not necessarily commute', function() {
        var transform0 = {
            type: 'filter',
            preservegaps: true,
            operation: '>',
            value: -1,
            target: 'x'
        };

        var transform1 = {
            type: 'filter',
            preservegaps: false,
            operation: '<',
            value: 2,
            target: 'x'
        };

        var out0 = _transform([Lib.extendDeep({}, base, {
            transforms: [transform0, transform1]
        })]);

        expect(out0[0].x).toEqual([0, 1]);
        expect(out0[0].y).toEqual([1, 2]);
        expect(out0[0].marker.color).toEqual([0.1, 0.2]);

        var out1 = _transform([Lib.extendDeep({}, base, {
            transforms: [transform1, transform0]
        })]);

        expect(out1[0].x).toEqual([undefined, undefined, undefined, 0, 1]);
        expect(out1[0].y).toEqual([undefined, undefined, undefined, 1, 2]);
        expect(out1[0].marker.color).toEqual([undefined, undefined, undefined, 0.1, 0.2]);
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
                    target: 'x'
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
                    target: 'x'
                }]
            })]);

            _assert(out, [-1, 0], [2, 1], [0.2, 0.1]);
        });

        it('with operation *(]*', function() {
            var out = _transform([Lib.extendDeep({}, _base, {
                transforms: [{
                    operation: '(]',
                    value: [-1, 1],
                    target: 'x'
                }]
            })]);

            _assert(out, [0, 1], [1, 2], [0.1, 0.2]);
        });

        it('with operation *()*', function() {
            var out = _transform([Lib.extendDeep({}, _base, {
                transforms: [{
                    operation: '()',
                    value: [-1, 1],
                    target: 'x'
                }]
            })]);

            _assert(out, [0], [1], [0.1]);
        });

        it('with operation *)(*', function() {
            var out = _transform([Lib.extendDeep({}, _base, {
                transforms: [{
                    operation: ')(',
                    value: [-1, 1],
                    target: 'x'
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
                    target: 'x'
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
                    target: 'x'
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
                    target: 'x'
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
                    target: 'x'
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
                    target: 'x'
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
                    target: 'x'
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
                    target: 'x'
                }]
            })]);

            _assert(out, ['b'], [2], ['1']);
        });

        it('with operation *)(*', function() {
            var out = _transform([Lib.extendDeep({}, _base, {
                transforms: [{
                    operation: ')(',
                    value: ['a', 'c'],
                    target: 'x'
                }]
            })]);

            _assert(out, ['d'], [4], ['0']);
        });

        it('with operation *{}*', function() {
            var out = _transform([Lib.extendDeep({}, _base, {
                transforms: [{
                    operation: '{}',
                    value: ['b', 'd'],
                    target: 'x'
                }]
            })]);

            _assert(out, ['b', 'd'], [2, 4], ['1', '0']);
        });

        it('with operation *}{*', function() {
            var out = _transform([Lib.extendDeep({}, _base, {
                transforms: [{
                    operation: '}{',
                    value: ['b', 'd'],
                    target: 'x'
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
                    target: 'x'
                }]
            })]);

            _assert(out, ['2015-07-20'], [1], [0.1]);
        });

        it('with operation *!=*', function() {
            var out = _transform([Lib.extendDeep({}, _base, {
                transforms: [{
                    operation: '!=',
                    value: '2015-07-20',
                    target: 'x'
                }]
            })]);

            _assert(
                out,
                ['2016-08-01', '2016-09-01', '2016-10-21', '2016-12-02'],
                [2, 3, 1, 5],
                [0.2, 0.3, 0.1, 0.2]
            );
        });

        it('with operation *<*', function() {
            var out = _transform([Lib.extendDeep({}, _base, {
                transforms: [{
                    operation: '<',
                    value: '2016-01-01',
                    target: 'x'
                }]
            })]);

            _assert(out, ['2015-07-20'], [1], [0.1]);
        });

        it('with operation *>*', function() {
            var out = _transform([Lib.extendDeep({}, _base, {
                transforms: [{
                    operation: '>=',
                    value: '2016-08-01',
                    target: 'x'
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
                    target: 'x'
                }]
            })]);

            _assert(out, ['2016-08-01', '2016-09-01'], [2, 3], [0.2, 0.3]);
        });

        it('with operation *)(*', function() {
            var out = _transform([Lib.extendDeep({}, _base, {
                transforms: [{
                    operation: ')(',
                    value: ['2016-08-01', '2016-10-01'],
                    target: 'x'
                }]
            })]);

            _assert(out, ['2015-07-20', '2016-10-21', '2016-12-02'], [1, 1, 5], [0.1, 0.1, 0.2]);
        });

        it('with operation *{}*', function() {
            var out = _transform([Lib.extendDeep({}, _base, {
                transforms: [{
                    operation: '{}',
                    value: '2015-07-20',
                    target: 'x'
                }]
            })]);

            _assert(out, ['2015-07-20'], [1], [0.1]);
        });

        it('with operation *}{*', function() {
            var out = _transform([Lib.extendDeep({}, _base, {
                transforms: [{
                    operation: '}{',
                    value: ['2016-08-01', '2016-09-01', '2016-10-21', '2016-12-02'],
                    target: 'x'
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
                target: 'ids'
            }]
        })]);

        expect(out[0].x).toEqual([-1, 1, 2]);
        expect(out[0].y).toEqual([2, 2, 3]);
        expect(out[0].ids).toEqual(['n1', 'p1', 'p2']);
    });

    describe('filters should handle array *target* values', function() {
        var _base = Lib.extendDeep({}, base);

        function _assert(out, x, y, markerColor) {
            expect(out[0].x).toEqual(x, '- x coords');
            expect(out[0].y).toEqual(y, '- y coords');
            expect(out[0].marker.color).toEqual(markerColor, '- marker.color arrayOk');
            expect(out[0].marker.size).toEqual(20, '- marker.size style');
        }

        it('with numeric items', function() {
            var out = _transform([Lib.extendDeep({}, _base, {
                transforms: [{
                    target: [1, 1, 0, 0, 1, 0, 1],
                    operation: '{}',
                    value: 0
                }]
            })]);

            _assert(out, [-2, 0, 2], [3, 1, 3], [0.3, 0.1, 0.3]);
            expect(out[0].transforms[0].target).toEqual([0, 0, 0]);
        });

        it('with ragged items - longer target', function() {
            var out = _transform([Lib.extendDeep({}, _base, {
                transforms: [{
                    target: [1, 1, 0, 0, 1, 0, 1, 0, 1, 0, 1],
                    operation: '{}',
                    value: 0
                }]
            })]);

            _assert(out, [-2, 0, 2], [3, 1, 3], [0.3, 0.1, 0.3]);
            expect(out[0].transforms[0].target).toEqual([0, 0, 0]);
        });

        it('with ragged items - longer data', function() {
            var out = _transform([Lib.extendDeep({}, _base, {
                x: _base.x.concat(_base.x),
                y: _base.y.concat(_base.y),
                ids: _base.ids.concat(['a1', 'a2', 'a3', 'a4']),
                marker: {color: _base.marker.color.concat(_base.marker.color)},
                transforms: [{
                    target: [1, 1, 0, 0, 1, 0, 1],
                    operation: '{}',
                    value: 0
                }]
            })]);

            _assert(out, [-2, 0, 2], [3, 1, 3], [0.3, 0.1, 0.3]);
            expect(out[0].transforms[0].target).toEqual([0, 0, 0]);
        });

        it('with categorical items and *{}*', function() {
            var out = _transform([Lib.extendDeep({}, _base, {
                transforms: [{
                    target: ['a', 'a', 'b', 'b', 'a', 'b', 'a'],
                    operation: '{}',
                    value: 'b'
                }]
            })]);

            _assert(out, [-2, 0, 2], [3, 1, 3], [0.3, 0.1, 0.3]);
            expect(out[0].transforms[0].target).toEqual(['b', 'b', 'b']);
        });

        it('with categorical items and *<* and *>=*', function() {
            var out = _transform([{
                x: [1, 2, 3],
                y: [10, 20, 30],
                transforms: [{
                    type: 'filter',
                    operation: '<',
                    target: ['a', 'b', 'c'],
                    value: 'c'
                }]
            }, {
                x: [1, 2, 3],
                y: [30, 20, 10],
                transforms: [{
                    type: 'filter',
                    operation: '>=',
                    target: ['a', 'b', 'c'],
                    value: 'b'
                }]
            }]);

            expect(out[0].x).toEqual([1, 2]);
            expect(out[0].y).toEqual([10, 20]);
            expect(out[0].transforms[0].target).toEqual(['a', 'b']);

            expect(out[1].x).toEqual([2, 3]);
            expect(out[1].y).toEqual([20, 10]);
            expect(out[1].transforms[0].target).toEqual(['b', 'c']);
        });

        it('with categorical items and *[]*, *][*, *()* and *)(*', function() {
            var out = _transform([{
                x: [1, 2, 3],
                y: [10, 20, 30],
                transforms: [{
                    type: 'filter',
                    operation: '[]',
                    target: ['a', 'b', 'c'],
                    value: ['a', 'b']
                }]
            }, {
                x: [1, 2, 3],
                y: [10, 20, 30],
                transforms: [{
                    type: 'filter',
                    operation: '()',
                    target: ['a', 'b', 'c'],
                    value: ['a', 'b']
                }]
            }, {
                x: [1, 2, 3],
                y: [30, 20, 10],
                transforms: [{
                    type: 'filter',
                    operation: '][',
                    target: ['a', 'b', 'c'],
                    value: ['a', 'b']
                }]
            }, {
                x: [1, 2, 3],
                y: [30, 20, 10],
                transforms: [{
                    type: 'filter',
                    operation: ')(',
                    target: ['a', 'b', 'c'],
                    value: ['a', 'b']
                }]
            }]);

            expect(out[0].x).toEqual([1, 2]);
            expect(out[0].y).toEqual([10, 20]);
            expect(out[0].transforms[0].target).toEqual(['a', 'b']);

            expect(out[1].x).toEqual([]);
            expect(out[1].y).toEqual([]);
            expect(out[1].transforms[0].target).toEqual([]);

            expect(out[2].x).toEqual([1, 2, 3]);
            expect(out[2].y).toEqual([30, 20, 10]);
            expect(out[2].transforms[0].target).toEqual(['a', 'b', 'c']);

            expect(out[3].x).toEqual([3]);
            expect(out[3].y).toEqual([10]);
            expect(out[3].transforms[0].target).toEqual(['c']);
        });

        it('with dates items', function() {
            var out = _transform([Lib.extendDeep({}, _base, {
                transforms: [{
                    target: ['2015-07-20', '2016-08-01', '2016-09-01', '2016-10-21', '2016-12-02'],
                    operation: '<',
                    value: '2016-01-01'
                }]
            })]);

            _assert(out, [-2], [1], [0.1]);
            expect(out[0].transforms[0].target).toEqual(['2015-07-20']);
        });

        it('with multiple transforms (dates) ', function() {
            var out = _transform([Lib.extendDeep({}, _base, {
                transforms: [{
                    target: ['2015-07-20', '2016-08-01', '2016-09-01', '2016-10-21', '2016-12-02'],
                    operation: '>',
                    value: '2016-01-01'
                }, {
                    type: 'filter',
                    target: ['2015-07-20', '2016-08-01', '2016-09-01', '2016-10-21', '2016-12-02'],
                    operation: '<',
                    value: '2016-09-01'
                }]
            })]);

            _assert(out, [-1], [2], [0.2]);
            expect(out[0].transforms[0].target).toEqual(['2016-08-01']);
        });
    });
});

describe('filter transforms interactions', function() {
    'use strict';

    var mockData0 = [{
        x: [-2, -1, -2, 0, 1, 2, 3],
        y: [1, 2, 3, 1, 2, 3, 1],
        text: ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
        transforms: [{
            type: 'filter',
            operation: '>'
        }]
    }];

    var mockData1 = [Lib.extendDeep({}, mockData0[0]), {
        x: [20, 11, 12, 0, 1, 2, 3],
        y: [1, 2, 3, 2, 5, 2, 0],
        text: ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
        transforms: [{
            type: 'filter',
            operation: '<',
            value: 10
        }]
    }];

    afterEach(destroyGraphDiv);

    it('Plotly.newPlot should plot the transform trace', function(done) {
        var data = Lib.extendDeep([], mockData0);

        Plotly.newPlot(createGraphDiv(), data).then(function(gd) {
            assertDims([3]);

            var uid = gd._fullData[0]._fullInput.uid;
            expect(gd._fullData[0].uid).toEqual(uid + '0');
        })
        .then(done, done.fail);
    });

    it('Plotly.restyle should work', function(done) {
        var data = Lib.extendDeep([], mockData0);
        data[0].marker = { color: 'red' };

        var gd = createGraphDiv();
        var dims = [3];

        var uid;
        function assertUid(gd) {
            expect(gd._fullData[0].uid)
                .toBe(uid + '0', 'should preserve uid on restyle');
        }

        Plotly.newPlot(gd, data).then(function() {
            uid = gd._fullData[0]._fullInput.uid;

            expect(gd._fullData[0].marker.color).toEqual('red');
            assertUid(gd);
            assertStyle(dims, ['rgb(255, 0, 0)'], [1]);

            expect(gd._fullLayout.xaxis.range).toBeCloseToArray([0.87, 3.13]);
            expect(gd._fullLayout.yaxis.range).toBeCloseToArray([0.85, 3.15]);

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

            expect(gd._fullLayout.xaxis.range).toBeCloseToArray([2, 4]);
            expect(gd._fullLayout.yaxis.range).toBeCloseToArray([0, 2]);
        })
        .then(done, done.fail);
    });

    it('Plotly.extendTraces should work', function(done) {
        var data = Lib.extendDeep([], mockData0);

        var gd = createGraphDiv();

        Plotly.newPlot(gd, data).then(function() {
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
        })
        .then(done, done.fail);
    });

    it('Plotly.deleteTraces should work', function(done) {
        var data = Lib.extendDeep([], mockData1);

        var gd = createGraphDiv();

        Plotly.newPlot(gd, data).then(function() {
            assertDims([3, 4]);

            return Plotly.deleteTraces(gd, [1]);
        }).then(function() {
            assertDims([3]);

            return Plotly.deleteTraces(gd, [0]);
        }).then(function() {
            assertDims([]);
        })
        .then(done, done.fail);
    });

    it('toggling trace visibility should work', function(done) {
        var data = Lib.extendDeep([], mockData1);

        var gd = createGraphDiv();

        Plotly.newPlot(gd, data).then(function() {
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
        })
        .then(done, done.fail);
    });

    it('zooming in/out should not change filtered data', function(done) {
        var data = Lib.extendDeep([], mockData1);

        var gd = createGraphDiv();

        function getTx(p) { return p.tx; }

        Plotly.newPlot(gd, data).then(function() {
            expect(gd.calcdata[0].map(getTx)).toEqual(['e', 'f', 'g']);
            expect(gd.calcdata[1].map(getTx)).toEqual(['D', 'E', 'F', 'G']);

            return Plotly.relayout(gd, 'xaxis.range', [-1, 1]);
        })
        .then(function() {
            expect(gd.calcdata[0].map(getTx)).toEqual(['e', 'f', 'g']);
            expect(gd.calcdata[1].map(getTx)).toEqual(['D', 'E', 'F', 'G']);

            return Plotly.relayout(gd, 'xaxis.autorange', true);
        })
        .then(function() {
            expect(gd.calcdata[0].map(getTx)).toEqual(['e', 'f', 'g']);
            expect(gd.calcdata[1].map(getTx)).toEqual(['D', 'E', 'F', 'G']);
        })
        .then(done, done.fail);
    });

    it('should update axis categories', function(done) {
        var data = [{
            type: 'bar',
            x: ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
            y: [1, 10, 100, 25, 50, -25, 100],
            transforms: [{
                type: 'filter',
                operation: '<',
                value: 10,
                target: [1, 10, 100, 25, 50, -25, 100]
            }]
        }];

        var gd = createGraphDiv();

        Plotly.newPlot(gd, data).then(function() {
            expect(gd._fullLayout.xaxis._categories).toEqual(['a', 'f']);
            expect(gd._fullLayout.yaxis._categories).toEqual([]);

            return Plotly.addTraces(gd, [{
                type: 'bar',
                x: ['h', 'i'],
                y: [2, 1],
                transforms: [{
                    type: 'filter',
                    operation: '=',
                    value: 'i'
                }]
            }]);
        })
        .then(function() {
            expect(gd._fullLayout.xaxis._categories).toEqual(['a', 'f', 'i']);
            expect(gd._fullLayout.yaxis._categories).toEqual([]);

            return Plotly.deleteTraces(gd, [0]);
        })
        .then(function() {
            expect(gd._fullLayout.xaxis._categories).toEqual(['i']);
            expect(gd._fullLayout.yaxis._categories).toEqual([]);
        })
        .then(done, done.fail);
    });

    it('should clear indexToPoints on removal', function(done) {
        var gd = createGraphDiv();

        Plotly.react(gd, [{
            y: [1, 2, 3, 1, 2, 3],
            transforms: [{
                type: 'filter',
                target: 'y',
                operation: '<',
                value: 3
            }]
        }])
        .then(function() {
            expect(gd._fullData[0]._indexToPoints).toEqual({0: [0], 1: [1], 2: [3], 3: [4]});
            return Plotly.react(gd, [{ y: [1, 2, 3, 1, 2, 3] }]);
        })
        .then(function() {
            expect(gd._fullData[0]._indexToPoints).toBeUndefined();
        })
        .then(done, done.fail);
    });
});

describe('filter resulting in empty coordinate arrays', function() {
    var gd;

    afterEach(function(done) {
        Plotly.purge(gd);
        setTimeout(function() {
            destroyGraphDiv();
            done();
        }, 200);
    });

    function filter2empty(mock) {
        var fig = Lib.extendDeep({}, mock);
        var data = fig.data || [];

        data.forEach(function(trace) {
            trace.transforms = [{
                type: 'filter',
                target: [null]
            }];
        });

        return fig;
    }

    describe('svg mocks', function() {
        var mockList = require('../assets/mock_lists').svg;

        mockList.forEach(function(d) {
            it(d[0], function(done) {
                gd = createGraphDiv();
                var fig = filter2empty(d[1]);
                Plotly.newPlot(gd, fig).then(done, done.fail);
            });
        });
    });

    describe('gl mocks', function() {
        var mockList = require('../assets/mock_lists').gl;

        mockList.forEach(function(d) {
            it('@gl ' + d[0], function(done) {
                gd = createGraphDiv();
                var fig = filter2empty(d[1]);
                Plotly.newPlot(gd, fig).then(done, done.fail);
            });
        });
    });

    describe('mapbox mocks', function() {
        var mockList = require('../assets/mock_lists').mapbox;

        Plotly.setPlotConfig({
            mapboxAccessToken: require('@build/credentials.json').MAPBOX_ACCESS_TOKEN
        });

        mockList.forEach(function(d) {
            it('@gl' + d[0], function(done) {
                gd = createGraphDiv();
                var fig = filter2empty(d[1]);
                Plotly.newPlot(gd, fig).then(done, done.fail);
            });
        });
    });
});
