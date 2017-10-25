var Plotly = require('@lib/index');

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');

describe('aggregate', function() {
    var gd;

    beforeEach(function() { gd = createGraphDiv(); });

    afterEach(destroyGraphDiv);

    it('handles all funcs for numeric data', function() {
        // throw in some non-numbers, they should get discarded except first/last
        Plotly.newPlot(gd, [{
            x: [1, 2, 3, 4, 'fail'],
            y: [1.1, 2.2, 3.3, 'nope', 5.5],
            marker: {
                size: ['2001-01-01', 0.2, 0.1, 0.4, 0.5],
                color: [2, 4, '', 10, 8],
                opacity: [0.6, 'boo', 0.2, 0.8, 1.0],
                line: {
                    color: [2.2, 3.3, 4.4, 5.5, 'the end']
                }
            },
            transforms: [{
                type: 'aggregate',
                groups: ['a', 'b', 'a', 'a', 'a'],
                aggregations: [
                    // missing array - the entry is ignored
                    {target: '', func: 'avg'},
                    // disabled explicitly
                    {target: 'x', func: 'avg', enabled: false},
                    {target: 'x', func: 'sum'},
                    // non-numerics will not count toward numerator or denominator for avg
                    {target: 'y', func: 'avg'},
                    {target: 'marker.size', func: 'min'},
                    {target: 'marker.color', func: 'max'},
                    // marker.opacity doesn't have an entry, but it will default to first
                    // as if it were {target: 'marker.opacity', func: 'first'},
                    {target: 'marker.line.color', func: 'last'},
                    // not present in data, but that's OK for count
                    {target: 'marker.line.width', func: 'count'},
                    // duplicate entry - discarded
                    {target: 'x', func: 'min'}
                ]
            }]
        }], {
            // log axis doesn't change how sum (or avg but not tested) works
            xaxis: {type: 'log'}
        });

        var traceOut = gd._fullData[0];

        expect(traceOut.x).toEqual([8, 2]);
        expect(traceOut.y).toBeCloseToArray([3.3, 2.2], 5);
        expect(traceOut.marker.size).toEqual([0.1, 0.2]);
        expect(traceOut.marker.color).toEqual([10, 4]);
        expect(traceOut.marker.opacity).toEqual([0.6, 'boo']);
        expect(traceOut.marker.line.color).toEqual(['the end', 3.3]);
        expect(traceOut.marker.line.width).toEqual([4, 1]);

        var transform = traceOut.transforms[0];
        var inverseMapping = transform.indexToPoints;
        expect(inverseMapping).toEqual({0: [0, 2, 3, 4], 1: [1]});
    });

    it('handles all funcs except sum for date data', function() {
        // weird cases handled in another test
        Plotly.newPlot(gd, [{
            x: ['2001-01-01', '', '2001-01-03', '2001-01-05', '2001-01-07'],
            y: ['1995-01-15', '2005-03-15', '1990-12-23', '2001-01-01', 'not a date'],
            text: ['2001-01-01 12:34', '2001-01-01 12:35', '2001-01-01 12:36', '2001-01-01 12:37', ''],
            hovertext: ['a', '2001-01-02', '2001-01-03', '2001-01-04', '2001-01-05'],
            customdata: ['2001-01', 'b', '2001-03', '2001-04', '2001-05'],
            transforms: [{
                type: 'aggregate',
                // groups can be any type, but until we implement binning they
                // will always compare as strings = so 1 === '1' === 1.0 !== '1.0'
                groups: [1, 2, '1', 1.0, 1],
                aggregations: [
                    {target: 'x', func: 'avg'},
                    {target: 'y', func: 'min'},
                    {target: 'text', func: 'max'},
                    // hovertext doesn't have a func, default to first
                    {target: 'hovertext'},
                    {target: 'customdata', func: 'last'},
                    // not present in data, but that's OK for count
                    {target: 'marker.line.width', func: 'count'},
                    // duplicate entry - discarded
                    {target: 'x', func: 'min'}
                ]
            }]
        }]);

        var traceOut = gd._fullData[0];

        expect(traceOut.x).toEqual(['2001-01-04', undefined]);
        expect(traceOut.y).toEqual(['1990-12-23', '2005-03-15']);
        expect(traceOut.text).toEqual(['2001-01-01 12:37', '2001-01-01 12:35']);
        expect(traceOut.hovertext).toEqual(['a', '2001-01-02']);
        expect(traceOut.customdata).toEqual(['2001-05', 'b']);
        expect(traceOut.marker.line.width).toEqual([4, 1]);
    });

    it('handles all funcs except sum and avg for category data', function() {
        // weird cases handled in another test
        Plotly.newPlot(gd, [{
            x: ['a', 'b', 'c', 'aa', 'd'],
            y: ['q', 'w', 'e', 'r', 't'],
            text: ['b', 'b', 'a', 'b', 'a'],
            hovertext: ['c', 'b', 'a', 'b', 'a'],
            transforms: [{
                type: 'aggregate',
                groups: [1, 2, 1, 1, 1],
                aggregations: [
                    {target: 'x', func: 'min'},
                    {target: 'y', func: 'max'},
                    {target: 'text', func: 'last'},
                    // hovertext doesn't have an entry, but it will default to first
                    // not present in data, but that's OK for count
                    {target: 'marker.line.width', func: 'count'},
                    // duplicate entry - discarded
                    {target: 'x', func: 'max'}
                ]
            }]
        }], {
            xaxis: {categoryarray: ['aaa', 'aa', 'a', 'b', 'c']}
        });

        var traceOut = gd._fullData[0];

        // explicit order (only possible for axis data)
        expect(traceOut.x).toEqual(['aa', 'b']);
        // implied order from data
        expect(traceOut.y).toEqual(['t', 'w']);
        expect(traceOut.text).toEqual(['a', 'b']);
        expect(traceOut.hovertext).toEqual(['c', 'b']);
        expect(traceOut.marker.line.width).toEqual([4, 1]);
    });

    it('allows date and category sums, and category avg, with weird output', function() {
        // this test is more of an FYI than anything else - it doesn't break but
        // these results are usually meaningless.

        Plotly.newPlot(gd, [{
            x: ['2001-01-01', '2001-01-02', '2001-01-03', '2001-01-04'],
            y: ['a', 'b', 'b', 'c'],
            text: ['a', 'b', 'a', 'c'],
            transforms: [{
                type: 'aggregate',
                groups: [1, 1, 2, 2],
                aggregations: [
                    {target: 'x', func: 'sum'},
                    {target: 'y', func: 'sum'},
                    {target: 'text', func: 'avg'}
                ]
            }]
        }]);

        var traceOut = gd._fullData[0];

        // date sums: 1970-01-01 is "zero", there are shifts due to # of leap years
        // without that shift these would be 2032-01-02 and 2032-01-06
        expect(traceOut.x).toEqual(['2032-01-03', '2032-01-07']);
        // category sums: can go off the end of the category array -> gives undefined
        expect(traceOut.y).toEqual(['b', undefined]);
        // category average: can result in fractional categories -> rounds (0.5 rounds to 1)
        expect(traceOut.text).toEqual(['b', 'b']);

        var transform = traceOut.transforms[0];
        var inverseMapping = transform.indexToPoints;
        expect(inverseMapping).toEqual({0: [0, 1], 1: [2, 3]});
    });

    it('can aggregate on an existing data array', function() {
        Plotly.newPlot(gd, [{
            x: [1, 2, 3, 4, 5],
            y: [2, 4, 6, 8, 10],
            marker: {size: [10, 10, 20, 20, 10]},
            transforms: [{
                type: 'aggregate',
                groups: 'marker.size',
                aggregations: [
                    {target: 'x', func: 'sum'},
                    {target: 'y', func: 'avg'}
                ]
            }]
        }]);

        var traceOut = gd._fullData[0];

        expect(traceOut.x).toEqual([8, 7]);
        expect(traceOut.y).toBeCloseToArray([16 / 3, 7], 5);
        expect(traceOut.marker.size).toEqual([10, 20]);

        var transform = traceOut.transforms[0];
        var inverseMapping = transform.indexToPoints;
        expect(inverseMapping).toEqual({0: [0, 1, 4], 1: [2, 3]});
    });

    it('can handle case where aggregation array is missing', function() {
        Plotly.newPlot(gd, [{
            x: [1, 2, 3, 4, 5],
            y: [2, 4, 6, 8, 10],
            marker: {size: [10, 10, 20, 20, 10]},
            transforms: [{
                type: 'aggregate',
                groups: 'marker.size'
            }]
        }]);

        var traceOut = gd._fullData[0];

        expect(traceOut.x).toEqual([1, 3]);
        expect(traceOut.y).toEqual([2, 6]);
        expect(traceOut.marker.size).toEqual([10, 20]);

        var transform = traceOut.transforms[0];
        var inverseMapping = transform.indexToPoints;
        expect(inverseMapping).toEqual({0: [0, 1, 4], 1: [2, 3]});
    });

    it('handles median, mode, rms, & stddev for numeric data', function() {
        // again, nothing is going to barf with non-numeric data, but sometimes it
        // won't make much sense.

        Plotly.newPlot(gd, [{
            x: [1, 1, 2, 2, 1],
            y: [1, 2, 3, 4, 5],
            marker: {
                size: [1, 2, 3, 4, 5],
                line: {width: [1, 1, 2, 2, 1]},
                color: [1, 1, 2, 2, 1]
            },
            transforms: [{
                type: 'aggregate',
                groups: [1, 2, 1, 1, 1],
                aggregations: [
                    {target: 'x', func: 'mode'},
                    {target: 'y', func: 'median'},
                    {target: 'marker.size', func: 'rms'},
                    {target: 'marker.line.width', func: 'stddev', funcmode: 'population'},
                    {target: 'marker.color', func: 'stddev'}
                ]
            }]
        }]);

        var traceOut = gd._fullData[0];

        // 1 and 2 both have count of 2 in the first group,
        // but 2 gets to that count first
        expect(traceOut.x).toEqual([2, 1]);
        expect(traceOut.y).toBeCloseToArray([3.5, 2], 5);
        expect(traceOut.marker.size).toBeCloseToArray([Math.sqrt(51 / 4), 2], 5);
        expect(traceOut.marker.line.width).toBeCloseToArray([0.5, 0], 5);
        expect(traceOut.marker.color).toBeCloseToArray([Math.sqrt(1 / 3), 0], 5);
    });

    it('links fullData aggregations to userData via _index', function() {
        Plotly.newPlot(gd, [{
            x: [1, 2, 3, 4, 5],
            y: [2, 4, 6, 8, 10],
            marker: {
                size: [10, 10, 20, 20, 10],
                color: ['red', 'green', 'blue', 'yellow', 'white']
            },
            transforms: [{
                type: 'aggregate',
                groups: 'marker.size',
                aggregations: [
                    {target: 'x', func: 'sum'},
                    {target: 'x', func: 'avg'},
                    {target: 'y', func: 'avg'}
                ]
            }]
        }]);

        var traceOut = gd._fullData[0];
        var fullAggregation = traceOut.transforms[0];
        var fullAggregations = fullAggregation.aggregations;
        var enabledAggregations = fullAggregations.filter(function(agg) {
            return agg.enabled;
        });

        expect(enabledAggregations[0].target).toEqual('x');
        expect(enabledAggregations[0]._index).toEqual(0);

        expect(enabledAggregations[1].target).toEqual('y');
        expect(enabledAggregations[1]._index).toEqual(2);

        expect(enabledAggregations[2].target).toEqual('marker.color');
        expect(enabledAggregations[2]._index).toEqual(-1);
    });
});
