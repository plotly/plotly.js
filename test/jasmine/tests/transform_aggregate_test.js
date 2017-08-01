var Plotly = require('@lib/index');

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var customMatchers = require('../assets/custom_matchers');

describe('aggregate', function() {
    var gd;

    beforeAll(function() { jasmine.addMatchers(customMatchers);});

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
                    {array: '', func: 'avg'},
                    {array: 'x', func: 'sum'},
                    // non-numerics will not count toward numerator or denominator for avg
                    {array: 'y', func: 'avg'},
                    {array: 'marker.size', func: 'min'},
                    {array: 'marker.color', func: 'max'},
                    // marker.opacity doesn't have an entry, but it will default to first
                    // as if it were {array: 'marker.opacity', func: 'first'},
                    {array: 'marker.line.color', func: 'last'},
                    // not present in data, but that's OK for count
                    {array: 'marker.line.width', func: 'count'},
                    // duplicate entry - discarded
                    {array: 'x', func: 'min'}
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
                    {array: 'x', func: 'avg'},
                    {array: 'y', func: 'min'},
                    {array: 'text', func: 'max'},
                    // hovertext doesn't have a func, default to first
                    {array: 'hovertext'},
                    {array: 'customdata', func: 'last'},
                    // not present in data, but that's OK for count
                    {array: 'marker.line.width', func: 'count'},
                    // duplicate entry - discarded
                    {array: 'x', func: 'min'}
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
                    {array: 'x', func: 'min'},
                    {array: 'y', func: 'max'},
                    {array: 'text', func: 'last'},
                    // hovertext doesn't have an entry, but it will default to first
                    // not present in data, but that's OK for count
                    {array: 'marker.line.width', func: 'count'},
                    // duplicate entry - discarded
                    {array: 'x', func: 'max'}
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
                    {array: 'x', func: 'sum'},
                    {array: 'y', func: 'sum'},
                    {array: 'text', func: 'avg'}
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
                    {array: 'x', func: 'sum'},
                    {array: 'y', func: 'avg'}
                ]
            }]
        }]);

        var traceOut = gd._fullData[0];

        expect(traceOut.x).toEqual([8, 7]);
        expect(traceOut.y).toBeCloseToArray([16 / 3, 7], 5);
        expect(traceOut.marker.size).toEqual([10, 20]);
    });
});
