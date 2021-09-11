var Lib = require('@src/lib');
var setCursor = require('@src/lib/setcursor');
var overrideCursor = require('@src/lib/override_cursor');
var config = require('@src/plot_api/plot_config').dfltConfig;

var d3Select = require('../../strict-d3').select;
var d3SelectAll = require('../../strict-d3').selectAll;
var Plotly = require('@lib/index');
var Plots = require('@src/plots/plots');
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');


describe('Test lib.js:', function() {
    'use strict';

    describe('interp() should', function() {
        it('return 1.75 as Q1 of [1, 2, 3, 4, 5]:', function() {
            var input = [1, 2, 3, 4, 5];
            var res = Lib.interp(input, 0.25);
            var res0 = 1.75;
            expect(res).toEqual(res0);
        });
        it('return 4.25 as Q3 of [1, 2, 3, 4, 5]:', function() {
            var input = [1, 2, 3, 4, 5];
            var res = Lib.interp(input, 0.75);
            var res0 = 4.25;
            expect(res).toEqual(res0);
        });
        it('error if second input argument is a string:', function() {
            var input = [1, 2, 3, 4, 5];
            expect(function() {
                Lib.interp(input, 'apple');
            }).toThrow('n should be a finite number');
        });
        it('error if second input argument is a date:', function() {
            var in1 = [1, 2, 3, 4, 5];
            var in2 = new Date(2014, 11, 1);
            expect(function() {
                Lib.interp(in1, in2);
            }).toThrow('n should be a finite number');
        });
        it('return the right boundary on input [-Inf, Inf]:', function() {
            var input = [-Infinity, Infinity];
            var res = Lib.interp(input, 1);
            var res0 = Infinity;
            expect(res).toEqual(res0);
        });
    });

    describe('transposeRagged()', function() {
        it('should transpose and return a rectangular array', function() {
            var input = [
                [1],
                [2, 3, 4],
                [5, 6],
                [7]];
            var output = [
                [1, 2, 5, 7],
                [undefined, 3, 6, undefined],
                [undefined, 4, undefined, undefined]
            ];

            expect(Lib.transposeRagged(input)).toEqual(output);
        });
    });

    describe('dot()', function() {
        var dot = Lib.dot;

        it('should return null for empty or unequal-length inputs', function() {
            expect(dot([], [])).toBeNull();
            expect(dot([1], [2, 3])).toBeNull();
        });

        it('should dot vectors to a scalar', function() {
            expect(dot([1, 2, 3], [4, 5, 6])).toEqual(32);
        });

        it('should dot a vector and a matrix to a vector', function() {
            expect(dot([1, 2], [[3, 4], [5, 6]])).toEqual([13, 16]);
            expect(dot([[3, 4], [5, 6]], [1, 2])).toEqual([11, 17]);
        });

        it('should dot two matrices to a matrix', function() {
            expect(dot([[1, 2], [3, 4]], [[5, 6], [7, 8]]))
                .toEqual([[19, 22], [43, 50]]);
        });
    });

    describe('aggNums()', function() {
        var aggNums = Lib.aggNums;

        function summation(a, b) { return a + b; }

        it('should work with 1D and 2D inputs and ignore non-numerics', function() {
            var in1D = [1, 2, 3, 4, 'goose!', 5, 6];
            var in2D = [[1, 2, 3], ['', 4], [5, 'hi!', 6]];

            expect(aggNums(Math.min, null, in1D)).toEqual(1);
            expect(aggNums(Math.min, null, in2D)).toEqual(1);

            expect(aggNums(Math.max, null, in1D)).toEqual(6);
            expect(aggNums(Math.max, null, in2D)).toEqual(6);

            expect(aggNums(summation, 0, in1D)).toEqual(21);
            expect(aggNums(summation, 0, in2D)).toEqual(21);
        });
    });

    describe('mean() should', function() {
        it('toss out non-numerics (strings)', function() {
            var input = [1, 2, 'apple', 'orange'];
            var res = Lib.mean(input);
            expect(res).toEqual(1.5);
        });
        it('toss out non-numerics (NaN)', function() {
            var input = [1, 2, NaN];
            var res = Lib.mean(input);
            expect(res).toEqual(1.5);
        });
        it('evaluate numbers which are passed around as text strings:', function() {
            var input = ['1', '2'];
            var res = Lib.mean(input);
            expect(res).toEqual(1.5);
        });
    });

    describe('midRange() should', function() {
        it('should calculate the arithmetic mean of the maximum and minimum value of a given array', function() {
            var input = [1, 5.5, 6, 15, 10, 13];
            var res = Lib.midRange(input);
            expect(res).toEqual(8);
        });
        it('toss out non-numerics (strings)', function() {
            var input = [1, 2, 'apple', 'orange'];
            var res = Lib.midRange(input);
            expect(res).toEqual(1.5);
        });
        it('toss out non-numerics (NaN)', function() {
            var input = [1, 2, NaN];
            var res = Lib.midRange(input);
            expect(res).toEqual(1.5);
        });
        it('should be able to deal with array of length 1', function() {
            var input = [10];
            var res = Lib.midRange(input);
            expect(res).toEqual(10);
        });
        it('should return undefined for an empty array', function() {
            var input = [];
            var res = Lib.midRange(input);
            expect(res).toBeUndefined();
        });
    });

    describe('variance() should', function() {
        it('return 0 on input [2, 2, 2, 2, 2]:', function() {
            var input = [2, 2, 2, 2];
            var res = Lib.variance(input);
            expect(res).toEqual(0);
        });
        it('return 2/3 on input [-1, 0, 1]:', function() {
            var input = [-1, 0, 1];
            var res = Lib.variance(input);
            expect(res).toEqual(2 / 3);
        });
        it('toss out non-numerics (strings):', function() {
            var input = [1, 2, 'apple', 'orange'];
            var res = Lib.variance(input);
            expect(res).toEqual(0.25);
        });
        it('toss out non-numerics (NaN):', function() {
            var input = [1, 2, NaN];
            var res = Lib.variance(input);
            expect(res).toEqual(0.25);
        });
    });

    describe('median() should', function() {
        it('return the middle value exactly for odd number of observations:', function() {
            var input = [1, 8, 9, 2, 7, 6, 3];
            var res = Lib.median(input);
            expect(res).toEqual(6);
        });

        it('return the mean of the two middle values for even number of observations', function() {
            var input = [4, 3, 2, 1, 5, 6, 8, 9];
            var res = Lib.median(input);
            expect(res).toEqual(4.5);
        });
    });

    describe('stdev() should', function() {
        it('return 0 on input [2, 2, 2, 2, 2]:', function() {
            var input = [2, 2, 2, 2];
            var res = Lib.stdev(input);
            expect(res).toEqual(0);
        });
        it('return sqrt(2/3) on input [-1, 0, 1]:', function() {
            var input = [-1, 0, 1];
            var res = Lib.stdev(input);
            expect(res).toEqual(Math.sqrt(2 / 3));
        });
        it('toss out non-numerics (strings):', function() {
            var input = [1, 2, 'apple', 'orange'];
            var res = Lib.stdev(input);
            expect(res).toEqual(0.5);
        });
        it('toss out non-numerics (NaN):', function() {
            var input = [1, 2, NaN];
            var res = Lib.stdev(input);
            expect(res).toEqual(0.5);
        });
    });

    describe('smooth()', function() {
        it('should not alter the input for FWHM < 1.5', function() {
            var input = [1, 2, 1, 2, 1];
            var output = Lib.smooth(input.slice(), 1.49);

            expect(output).toEqual(input);

            output = Lib.smooth(input.slice(), 'like butter');

            expect(output).toEqual(input);
        });

        it('should preserve the length and integral even with multiple bounces', function() {
            var input = [1, 2, 4, 8, 16, 8, 10, 12];
            var output2 = Lib.smooth(input.slice(), 2);
            var output30 = Lib.smooth(input.slice(), 30);
            var sumIn = 0;
            var sum2 = 0;
            var sum30 = 0;

            for(var i = 0; i < input.length; i++) {
                sumIn += input[i];
                sum2 += output2[i];
                sum30 += output30[i];
            }

            expect(output2.length).toEqual(input.length);
            expect(output30.length).toEqual(input.length);
            expect(sum2).toBeCloseTo(sumIn, 6);
            expect(sum30).toBeCloseTo(sumIn, 6);
        });

        it('should use a hann window and bounce', function() {
            var input = [0, 0, 0, 7, 0, 0, 0];
            var out4 = Lib.smooth(input, 4);
            var out7 = Lib.smooth(input, 7);
            var expected4 = [
                0.2562815664617711, 0.875, 1.4937184335382292, 1.75,
                1.493718433538229, 0.875, 0.25628156646177086
            ];
            var expected7 = [1, 1, 1, 1, 1, 1, 1];
            var i;

            for(i = 0; i < input.length; i++) {
                expect(out4[i]).toBeCloseTo(expected4[i], 6);
                expect(out7[i]).toBeCloseTo(expected7[i], 6);
            }
        });
    });

    describe('nestedProperty', function() {
        var np = Lib.nestedProperty;

        it('should access simple objects', function() {
            var obj = {a: 'b', c: 'd'};
            var propA = np(obj, 'a');
            var propB = np(obj, 'b');

            expect(propA.get()).toBe('b');
            // making and reading nestedProperties shouldn't change anything
            expect(obj).toEqual({a: 'b', c: 'd'});
            // only setting them should
            propA.set('cats');
            expect(obj).toEqual({a: 'cats', c: 'd'});
            expect(propA.get()).toBe('cats');
            propA.set('b');

            expect(propB.get()).toBe(undefined);
            expect(obj).toEqual({a: 'b', c: 'd'});
            propB.set({cats: true, dogs: false});
            expect(obj).toEqual({a: 'b', c: 'd', b: {cats: true, dogs: false}});
        });

        it('should access arrays', function() {
            var arr = [1, 2, 3];
            var prop1 = np(arr, 1);
            var prop5 = np(arr, '5');

            expect(prop1.get()).toBe(2);
            expect(arr).toEqual([1, 2, 3]);

            prop1.set('cats');
            expect(prop1.get()).toBe('cats');

            prop1.set(2);
            expect(prop5.get()).toBe(undefined);
            expect(arr).toEqual([1, 2, 3]);

            prop5.set(5);
            var localArr = [1, 2, 3];
            localArr[5] = 5;
            expect(arr).toEqual(localArr);

            prop5.set(null);
            expect(arr).toEqual([1, 2, 3]);
            expect(arr.length).toBe(3);
        });

        it('should not access whole array elements with index -1', function() {
            // for a lot of cases we could make this work,
            // but deleting the value is a mess, and anyway
            // we don't need this, it's better just to set the whole
            // array, ie np(obj, 'arr')
            var obj = {arr: [1, 2, 3]};
            expect(function() { np(obj, 'arr[-1]'); }).toThrow('bad property string');
        });

        it('should access properties of objects in an array with index -1', function() {
            var obj = {arr: [{a: 1}, {a: 2}, {b: 3}]};
            var prop = np(obj, 'arr[-1].a');

            expect(prop.get()).toEqual([1, 2, undefined]);
            expect(obj).toEqual({arr: [{a: 1}, {a: 2}, {b: 3}]});

            prop.set(5);
            expect(prop.get()).toBe(5);
            expect(obj).toEqual({arr: [{a: 5}, {a: 5}, {a: 5, b: 3}]});

            prop.set(null);
            expect(prop.get()).toBe(undefined);
            expect(obj).toEqual({arr: [{}, {}, {b: 3}]});

            prop.set([2, 3, 4]);
            expect(prop.get()).toEqual([2, 3, 4]);
            expect(obj).toEqual({arr: [{a: 2}, {a: 3}, {a: 4, b: 3}]});

            prop.set([6, 7, undefined]);
            expect(prop.get()).toEqual([6, 7, undefined]);
            expect(obj).toEqual({arr: [{a: 6}, {a: 7}, {b: 3}]});

            // too short an array: wrap around
            prop.set([9, 10]);
            expect(prop.get()).toEqual([9, 10, 9]);
            expect(obj).toEqual({arr: [{a: 9}, {a: 10}, {a: 9, b: 3}]});

            // too long an array: ignore extras
            prop.set([11, 12, 13, 14]);
            expect(prop.get()).toEqual([11, 12, 13]);
            expect(obj).toEqual({arr: [{a: 11}, {a: 12}, {a: 13, b: 3}]});
        });

        it('should remove a property only with undefined or null', function() {
            var obj = {a: 'b', c: 'd'};
            var propA = np(obj, 'a');
            var propC = np(obj, 'c');

            propA.set(null);
            propC.set(undefined);
            expect(obj).toEqual({});

            propA.set(false);
            np(obj, 'b').set('');
            propC.set(0);
            np(obj, 'd').set(NaN);
            expect(obj).toEqual({a: false, b: '', c: 0, d: NaN});
        });

        it('should not remove arrays or empty objects inside container arrays', function() {
            var obj = {
                annotations: [{a: [1, 2, 3]}],
                c: [1, 2, 3],
                domain: [1, 2],
                range: [2, 3],
                shapes: ['elephant']
            };
            var propA = np(obj, 'annotations[-1].a');
            var propC = np(obj, 'c');
            var propD0 = np(obj, 'domain[0]');
            var propD1 = np(obj, 'domain[1]');
            var propR = np(obj, 'range');
            var propS = np(obj, 'shapes[0]');

            propA.set([[]]);
            propC.set([]);
            propD0.set(undefined);
            propD1.set(undefined);
            propR.set([]);
            propS.set(null);

            // 'a' and 'c' are both potentially data arrays so we need to keep them
            expect(obj).toEqual({
                annotations: [{a: []}],
                c: [],
                domain: [],
                range: [],
                shapes: []
            });
        });


        it('should allow empty object sub-containers', function() {
            var obj = {};
            var prop = np(obj, 'a[1].b.c');
            // we never set a value into a[0] so it doesn't even get {}
            var expectedArr = [undefined, {b: {c: 'pizza'}}];

            expect(prop.get()).toBe(undefined);
            expect(obj).toEqual({});

            prop.set('pizza');
            expect(obj).toEqual({a: expectedArr});
            expect(prop.get()).toBe('pizza');

            prop.set(null);
            expect(prop.get()).toBe(undefined);
            expect(obj).toEqual({a: [undefined, {b: {}}]});
        });

        it('does not prune inside `args` arrays', function() {
            var obj = {};
            var args = np(obj, 'args');

            args.set([]);
            expect(obj.args).toEqual([]);

            args.set([null]);
            expect(obj.args).toEqual([null]);

            np(obj, 'args[1]').set([]);
            expect(obj.args).toEqual([null, []]);

            np(obj, 'args[2]').set({});
            expect(obj.args).toEqual([null, [], {}]);

            np(obj, 'args[1]').set();
            expect(obj.args).toEqual([null, undefined, {}]);

            // we still trim undefined off the end of arrays, but nothing else.
            np(obj, 'args[2]').set();
            expect(obj.args).toEqual([null]);
        });

        it('should get empty, and fail on set, with a bad input object', function() {
            var badProps = [
                np(5, 'a'),
                np(undefined, 'a'),
                np('cats', 'a'),
                np(true, 'a')
            ];

            function badSetter(i) {
                return function() {
                    badProps[i].set('cats');
                };
            }

            for(var i = 0; i < badProps.length; i++) {
                expect(badProps[i].get()).toBe(undefined);
                expect(badSetter(i)).toThrow('bad container');
            }
        });

        it('should fail on a bad property string', function() {
            var badStr = [
                [], {}, false, undefined, null, NaN, Infinity
            ];

            function badProp(i) {
                return function() {
                    np({}, badStr[i]);
                };
            }

            for(var i = 0; i < badStr.length; i++) {
                expect(badProp(i)).toThrow('bad property string');
            }
        });
    });

    describe('objectFromPath', function() {
        it('should return an object', function() {
            var obj = Lib.objectFromPath('test', 'object');

            expect(obj).toEqual({ test: 'object' });
        });

        it('should work for deep objects', function() {
            var obj = Lib.objectFromPath('deep.nested.test', 'object');

            expect(obj).toEqual({ deep: { nested: { test: 'object' }}});
        });

        it('should work for arrays', function() {
            var obj = Lib.objectFromPath('nested[2].array', 'object');

            expect(Object.keys(obj)).toEqual(['nested']);
            expect(Array.isArray(obj.nested)).toBe(true);
            expect(obj.nested[0]).toBe(undefined);
            expect(obj.nested[2]).toEqual({ array: 'object' });
        });

        it('should work for any given value', function() {
            var obj = Lib.objectFromPath('test.type', { an: 'object' });

            expect(obj).toEqual({ test: { type: { an: 'object' }}});

            obj = Lib.objectFromPath('test.type', [42]);

            expect(obj).toEqual({ test: { type: [42] }});
        });
    });

    describe('expandObjectPaths', function() {
        it('returns the original object', function() {
            var x = {};
            expect(Lib.expandObjectPaths(x)).toBe(x);
        });

        it('unpacks top-level paths', function() {
            var input = {'marker.color': 'red', 'marker.size': [1, 2, 3]};
            var expected = {marker: {color: 'red', size: [1, 2, 3]}};
            expect(Lib.expandObjectPaths(input)).toLooseDeepEqual(expected);
        });

        it('unpacks recursively', function() {
            var input = {'marker.color': {'red.certainty': 'definitely'}};
            var expected = {marker: {color: {red: {certainty: 'definitely'}}}};
            expect(Lib.expandObjectPaths(input)).toLooseDeepEqual(expected);
        });

        it('unpacks deep paths', function() {
            var input = {'foo.bar.baz': 'red'};
            var expected = {foo: {bar: {baz: 'red'}}};
            expect(Lib.expandObjectPaths(input)).toLooseDeepEqual(expected);
        });

        it('unpacks non-top-level deep paths', function() {
            var input = {color: {'foo.bar.baz': 'red'}};
            var expected = {color: {foo: {bar: {baz: 'red'}}}};
            expect(Lib.expandObjectPaths(input)).toLooseDeepEqual(expected);
        });

        it('merges dotted properties into objects', function() {
            var input = {marker: {color: 'red'}, 'marker.size': 8};
            var expected = {marker: {color: 'red', size: 8}};
            expect(Lib.expandObjectPaths(input)).toLooseDeepEqual(expected);
        });

        it('merges objects into dotted properties', function() {
            var input = {'marker.size': 8, marker: {color: 'red'}};
            var expected = {marker: {color: 'red', size: 8}};
            expect(Lib.expandObjectPaths(input)).toLooseDeepEqual(expected);
        });

        it('retains the identity of nested objects', function() {
            var input = {marker: {size: 8}};
            var origNested = input.marker;
            var expanded = Lib.expandObjectPaths(input);
            var newNested = expanded.marker;

            expect(input).toBe(expanded);
            expect(origNested).toBe(newNested);
        });

        it('retains the identity of nested arrays', function() {
            var input = {'marker.size': [1, 2, 3]};
            var origArray = input['marker.size'];
            var expanded = Lib.expandObjectPaths(input);
            var newArray = expanded.marker.size;

            expect(input).toBe(expanded);
            expect(origArray).toBe(newArray);
        });

        it('expands bracketed array notation', function() {
            var input = {'marker[1]': {color: 'red'}};
            var expected = {marker: [undefined, {color: 'red'}]};
            expect(Lib.expandObjectPaths(input)).toLooseDeepEqual(expected);
        });

        it('expands nested arrays', function() {
            var input = {'marker[1].range[1]': 5};
            var expected = {marker: [undefined, {range: [undefined, 5]}]};
            var computed = Lib.expandObjectPaths(input);
            expect(computed).toLooseDeepEqual(expected);
        });

        it('expands bracketed array with more nested attributes', function() {
            var input = {'marker[1]': {'color.alpha': 2}};
            var expected = {marker: [undefined, {color: {alpha: 2}}]};
            var computed = Lib.expandObjectPaths(input);
            expect(computed).toLooseDeepEqual(expected);
        });

        it('expands bracketed array notation without further nesting', function() {
            var input = {'marker[1]': 8};
            var expected = {marker: [undefined, 8]};
            var computed = Lib.expandObjectPaths(input);
            expect(computed).toLooseDeepEqual(expected);
        });

        it('expands bracketed array notation with further nesting', function() {
            var input = {'marker[1].size': 8};
            var expected = {marker: [undefined, {size: 8}]};
            var computed = Lib.expandObjectPaths(input);
            expect(computed).toLooseDeepEqual(expected);
        });

        it('expands bracketed array notation with further nesting', function() {
            var input = {'marker[1].size.magnitude': 8};
            var expected = {marker: [undefined, {size: {magnitude: 8}}]};
            var computed = Lib.expandObjectPaths(input);
            expect(computed).toLooseDeepEqual(expected);
        });

        it('combines changes with single array nesting', function() {
            var input = {'marker[1].foo': 5, 'marker[0].foo': 4};
            var expected = {marker: [{foo: 4}, {foo: 5}]};
            var computed = Lib.expandObjectPaths(input);
            expect(computed).toLooseDeepEqual(expected);
        });

        it('does not skip over array container set to null values', function() {
            var input = {title: 'clear annotations', annotations: null};
            var expected = {title: 'clear annotations', annotations: null};
            var computed = Lib.expandObjectPaths(input);
            expect(computed).toLooseDeepEqual(expected);
        });

        it('expands array containers', function() {
            var input = {title: 'clear annotation 1', 'annotations[1]': { title: 'new' }};
            var expected = {title: 'clear annotation 1', annotations: [null, { title: 'new' }]};
            var computed = Lib.expandObjectPaths(input);
            expect(computed).toLooseDeepEqual(expected);
        });

        // TODO: This test is unimplemented since it's a currently-unused corner case.
        // Getting the test to pass requires some extension (pun?) to extendDeepNoArrays
        // that's intelligent enough to only selectively merge *some* arrays, in particular
        // not data arrays but yes on arrays that were previously expanded. This is a bit
        // tricky to get to work just right and currently doesn't have any known use since
        // container arrays are not multiply nested.
        //
        // Additional notes on what works or what doesn't work. This case does *not* work
        // because the two nested arrays that would result from the expansion need to be
        // deep merged.
        //
        //   Lib.expandObjectPaths({'marker.range[0]': 5, 'marker.range[1]': 2})
        //
        //   // => {marker: {range: [null, 2]}}
        //
        // This case *does* work because the array merging does not require a deep extend:
        //
        //   Lib.expandObjectPaths({'range[0]': 5, 'range[1]': 2}
        //
        //   // => {range: [5, 2]}
        //
        // Finally note that this case works fine because there's no merge necessary:
        //
        //   Lib.expandObjectPaths({'marker.range[1]': 2})
        //
        //   // => {marker: {range: [null, 2]}}
        //
        /*
        it('combines changes', function() {
            var input = {'marker[1].range[1]': 5, 'marker[1].range[0]': 4};
            var expected = {marker: [undefined, {range: [4, 5]}]};
            var computed = Lib.expandObjectPaths(input);
            expect(computed).toEqual(expected);
        });
        */
    });

    describe('coerce', function() {
        var coerce = Lib.coerce;
        var out;

        // TODO: I tested font and string because I changed them, but all the other types need tests still

        it('should set a value and return the value it sets', function() {
            var aVal = 'aaaaah!';
            var cVal = {1: 2, 3: 4};
            var attrs = {a: {valType: 'any', dflt: aVal}, b: {c: {valType: 'any'}}};
            var obj = {b: {c: cVal}};
            var outObj = {};

            var aOut = coerce(obj, outObj, attrs, 'a');
            var cOut = coerce(obj, outObj, attrs, 'b.c');

            expect(aOut).toBe(aVal);
            expect(aOut).toBe(outObj.a);
            expect(cOut).toBe(cVal);
            expect(cOut).toBe(outObj.b.c);
        });

        describe('data_array valType', function() {
            var attrs = {
                d: {valType: 'data_array'}
            };

            it('should pass ref to out object (plain array case)', function() {
                var arr = [1, 2, 3];
                out = coerce({d: arr}, {}, attrs, 'd');
                expect(out).toBe(arr);
            });

            it('should pass ref to out object (typed array case)', function() {
                var arr = new Float32Array([1, 2, 3]);
                out = coerce({d: arr}, {}, attrs, 'd');
                expect(out).toBe(arr);
            });
        });

        describe('string valType', function() {
            var dflt = 'Jabberwock';
            var stringAttrs = {
                s: {valType: 'string', dflt: dflt},
                noBlank: {valType: 'string', dflt: dflt, noBlank: true}
            };

            it('should insert the default if input is missing, or blank with noBlank', function() {
                out = coerce(undefined, {}, stringAttrs, 's');
                expect(out).toEqual(dflt);

                out = coerce({}, {}, stringAttrs, 's');
                expect(out).toEqual(dflt);

                out = coerce({s: ''}, {}, stringAttrs, 's');
                expect(out).toEqual('');

                out = coerce({noBlank: ''}, {}, stringAttrs, 'noBlank');
                expect(out).toEqual(dflt);
            });

            it('should always return a string for any input', function() {
                expect(coerce({s: 'a string!!'}, {}, stringAttrs, 's'))
                    .toEqual('a string!!');

                expect(coerce({s: 42}, {}, stringAttrs, 's'))
                    .toEqual('42');

                expect(coerce({s: [1, 2, 3]}, {}, stringAttrs, 's'))
                    .toEqual(dflt);

                expect(coerce({s: true}, {}, stringAttrs, 's'))
                    .toEqual(dflt);

                expect(coerce({s: {1: 2}}, {}, stringAttrs, 's'))
                    .toEqual(dflt);
            });
        });

        describe('coerce2', function() {
            var coerce2 = Lib.coerce2;

            it('should set a value and return the value it sets when user input is valid', function() {
                var colVal = 'red';
                var sizeVal = 0; // 0 is valid but falsey
                var attrs = {
                    testMarker: {
                        testColor: {valType: 'color', dflt: 'rgba(0, 0, 0, 0)'},
                        testSize: {valType: 'number', dflt: 20}
                    }
                };
                var obj = {testMarker: {testColor: colVal, testSize: sizeVal}};
                var outObj = {};
                var colOut = coerce2(obj, outObj, attrs, 'testMarker.testColor');
                var sizeOut = coerce2(obj, outObj, attrs, 'testMarker.testSize');

                expect(colOut).toBe(colVal);
                expect(colOut).toBe(outObj.testMarker.testColor);
                expect(sizeOut).toBe(sizeVal);
                expect(sizeOut).toBe(outObj.testMarker.testSize);
            });

            it('should set and return the default if the user input is not valid', function() {
                var colVal = 'r';
                var sizeVal = 'aaaaah!';
                var attrs = {
                    testMarker: {
                        testColor: {valType: 'color', dflt: 'rgba(0, 0, 0, 0)'},
                        testSize: {valType: 'number', dflt: 20}
                    }
                };
                var obj = {testMarker: {testColor: colVal, testSize: sizeVal}};
                var outObj = {};
                var colOut = coerce2(obj, outObj, attrs, 'testMarker.testColor');
                var sizeOut = coerce2(obj, outObj, attrs, 'testMarker.testSize');

                expect(colOut).toBe('rgba(0, 0, 0, 0)');
                expect(sizeOut).toBe(outObj.testMarker.testSize);
                expect(sizeOut).toBe(20);
                expect(sizeOut).toBe(outObj.testMarker.testSize);
            });

            it('should return false if there is no user input', function() {
                var colVal = null;
                var sizeVal; // undefined
                var attrs = {
                    testMarker: {
                        testColor: {valType: 'color', dflt: 'rgba(0, 0, 0, 0)'},
                        testSize: {valType: 'number', dflt: 20}
                    }
                };
                var obj = {testMarker: {testColor: colVal, testSize: sizeVal}};
                var outObj = {};
                var colOut = coerce2(obj, outObj, attrs, 'testMarker.testColor');
                var sizeOut = coerce2(obj, outObj, attrs, 'testMarker.testSize');

                expect(colOut).toBe(false);
                expect(sizeOut).toBe(false);
            });
        });

        describe('info_array valType', function() {
            var infoArrayAttrs = {
                range: {
                    valType: 'info_array',
                    items: [
                        { valType: 'number' },
                        { valType: 'number' }
                    ]
                },
                domain: {
                    valType: 'info_array',
                    items: [
                        { valType: 'number', min: 0, max: 1 },
                        { valType: 'number', min: 0, max: 1 }
                    ],
                    dflt: [0, 1]
                }
            };

            it('should insert the default if input is missing', function() {
                expect(coerce(undefined, {}, infoArrayAttrs, 'domain'))
                    .toEqual([0, 1]);
                expect(coerce(undefined, {}, infoArrayAttrs, 'domain', [0, 0.5]))
                    .toEqual([0, 0.5]);
            });

            it('should dive into the items and coerce accordingly', function() {
                expect(coerce({range: ['-10', 100]}, {}, infoArrayAttrs, 'range'))
                    .toEqual([-10, 100]);

                expect(coerce({domain: [0, 0.5]}, {}, infoArrayAttrs, 'domain'))
                    .toEqual([0, 0.5]);

                expect(coerce({domain: [-5, 0.5]}, {}, infoArrayAttrs, 'domain'))
                    .toEqual([0, 0.5]);

                expect(coerce({domain: [0.5, 4.5]}, {}, infoArrayAttrs, 'domain'))
                    .toEqual([0.5, 1]);
            });

            it('should coerce unexpected input as best as it can', function() {
                expect(coerce({range: [12]}, {}, infoArrayAttrs, 'range'))
                    .toEqual([12]);

                expect(coerce({range: [12]}, {}, infoArrayAttrs, 'range', [-1, 20]))
                    .toEqual([12, 20]);

                expect(coerce({domain: [0.5]}, {}, infoArrayAttrs, 'domain'))
                    .toEqual([0.5, 1]);

                expect(coerce({range: ['-10', 100, 12]}, {}, infoArrayAttrs, 'range'))
                    .toEqual([-10, 100]);

                expect(coerce({domain: [0, 0.5, 1]}, {}, infoArrayAttrs, 'domain'))
                    .toEqual([0, 0.5]);
            });

            it('supports bounded freeLength attributes', function() {
                var attrs = {
                    x: {
                        valType: 'info_array',
                        freeLength: true,
                        items: [
                            {valType: 'integer', min: 0},
                            {valType: 'integer', max: -1}
                        ],
                        dflt: [1, -2]
                    },
                };
                expect(coerce({}, {}, attrs, 'x')).toEqual([1, -2]);
                expect(coerce({x: []}, {}, attrs, 'x')).toEqual([1, -2]);
                expect(coerce({x: [5]}, {}, attrs, 'x')).toEqual([5, -2]);
                expect(coerce({x: [-5]}, {}, attrs, 'x')).toEqual([1, -2]);
                expect(coerce({x: [5, -5]}, {}, attrs, 'x')).toEqual([5, -5]);
                expect(coerce({x: [3, -3, 3]}, {}, attrs, 'x')).toEqual([3, -3]);
            });

            it('supports unbounded freeLength attributes', function() {
                var attrs = {
                    x: {
                        valType: 'info_array',
                        freeLength: true,
                        items: {valType: 'integer', min: 0, dflt: 1}
                    }
                };
                expect(coerce({}, {}, attrs, 'x')).toBeUndefined();
                expect(coerce({x: []}, {}, attrs, 'x')).toEqual([]);
                expect(coerce({x: [3]}, {}, attrs, 'x')).toEqual([3]);
                expect(coerce({x: [-3]}, {}, attrs, 'x')).toEqual([1]);
                expect(coerce({x: [-1, 4, 'hi', 5]}, {}, attrs, 'x'))
                    .toEqual([1, 4, 1, 5]);
            });

            it('supports 2D fixed-size arrays', function() {
                var attrs = {
                    x: {
                        valType: 'info_array',
                        dimensions: 2,
                        items: [
                            [{valType: 'integer', min: 0, max: 2}, {valType: 'integer', min: 3, max: 5}],
                            [{valType: 'integer', min: 6, max: 8}, {valType: 'integer', min: 9, max: 11}]
                        ],
                        dflt: [[1, 4], [7, 10]]
                    }
                };
                expect(coerce({}, {}, attrs, 'x')).toEqual([[1, 4], [7, 10]]);
                expect(coerce({x: []}, {}, attrs, 'x')).toEqual([[1, 4], [7, 10]]);
                expect(coerce({x: [[0, 3], [8, 11]]}, {}, attrs, 'x'))
                    .toEqual([[0, 3], [8, 11]]);
                expect(coerce({x: [[10, 5, 10], [6], [1, 2, 3]]}, {}, attrs, 'x'))
                    .toEqual([[1, 5], [6, 10]]);
            });

            it('supports unbounded 2D freeLength arrays', function() {
                var attrs = {
                    x: {
                        valType: 'info_array',
                        freeLength: true,
                        dimensions: 2,
                        items: {valType: 'integer', min: 0, dflt: 1}
                    }
                };
                expect(coerce({}, {}, attrs, 'x')).toBeUndefined();
                expect(coerce({x: []}, {}, attrs, 'x')).toEqual([]);
                expect(coerce({x: [[], [0], [-1, 2], [5, 'a', 4, 6.6]]}, {}, attrs, 'x'))
                    .toEqual([[], [0], [1, 2], [5, 1, 4, 1]]);
            });

            it('supports dimensions=\'1-2\' with 1D items array', function() {
                var attrs = {
                    x: {
                        valType: 'info_array',
                        freeLength: true, // in this case only the outer length of 2D is free
                        dimensions: '1-2',
                        items: [
                            {valType: 'integer', min: 0, max: 5, dflt: 1},
                            {valType: 'integer', min: 10, max: 15, dflt: 11}
                        ]
                    }
                };
                expect(coerce({}, {}, attrs, 'x')).toBeUndefined();
                expect(coerce({x: []}, {}, attrs, 'x')).toEqual([1, 11]);
                expect(coerce({x: [4, 4, 4]}, {}, attrs, 'x')).toEqual([4, 11]);
                expect(coerce({x: [[]]}, {}, attrs, 'x')).toEqual([[1, 11]]);
                expect(coerce({x: [[12, 12, 12]]}, {}, attrs, 'x')).toEqual([[1, 12]]);
                expect(coerce({x: [[], 4, true]}, {}, attrs, 'x')).toEqual([[1, 11], [1, 11], [1, 11]]);
            });

            it('supports dimensions=\'1-2\' with single item', function() {
                var attrs = {
                    x: {
                        valType: 'info_array',
                        freeLength: true,
                        dimensions: '1-2',
                        items: {valType: 'integer', min: 0, max: 5, dflt: 1}
                    }
                };
                expect(coerce({}, {}, attrs, 'x')).toBeUndefined();
                expect(coerce({x: []}, {}, attrs, 'x')).toEqual([]);
                expect(coerce({x: [-3, 3, 6, 'a']}, {}, attrs, 'x')).toEqual([1, 3, 1, 1]);
                expect(coerce({x: [[]]}, {}, attrs, 'x')).toEqual([[]]);
                expect(coerce({x: [[-1, 0, 10]]}, {}, attrs, 'x')).toEqual([[1, 0, 1]]);
                expect(coerce({x: [[], 4, [3], [-1, 10]]}, {}, attrs, 'x')).toEqual([[], [], [3], [1, 1]]);
            });
        });

        describe('subplotid valtype', function() {
            var dflt = 'slice';
            var idAttrs = {
                pizza: {
                    valType: 'subplotid',
                    dflt: dflt
                }
            };

            var goodVals = ['slice', 'slice2', 'slice1492'];

            goodVals.forEach(function(goodVal) {
                it('should allow "' + goodVal + '"', function() {
                    expect(coerce({pizza: goodVal}, {}, idAttrs, 'pizza'))
                        .toEqual(goodVal);
                });
            });

            var badVals = [
                'slice0',
                'slice1',
                'Slice2',
                '2slice',
                '2',
                2,
                'slice2 ',
                'slice2.0',
                ' slice2',
                'slice 2',
                'slice01'
            ];

            badVals.forEach(function(badVal) {
                it('should not allow "' + badVal + '"', function() {
                    expect(coerce({pizza: badVal}, {}, idAttrs, 'pizza'))
                        .toEqual(dflt);
                });
            });
        });
    });

    describe('coerceFont', function() {
        var fontAttrs = Plots.fontAttrs({});
        var extendFlat = Lib.extendFlat;
        var coerceFont = Lib.coerceFont;

        var defaultFont = {
            family: '"Open sans", verdana, arial, sans-serif, DEFAULT',
            size: 314159,
            color: 'neon pink with sparkles'
        };

        var attributes = {
            fontWithDefault: {
                family: extendFlat({}, fontAttrs.family, {dflt: defaultFont.family}),
                size: extendFlat({}, fontAttrs.size, {dflt: defaultFont.size}),
                color: extendFlat({}, fontAttrs.color, {dflt: defaultFont.color})
            },
            fontNoDefault: fontAttrs
        };

        var containerIn;

        function coerce(attr, dflt) {
            return Lib.coerce(containerIn, {}, attributes, attr, dflt);
        }

        it('should insert the full default if no or empty input', function() {
            containerIn = undefined;
            expect(coerceFont(coerce, 'fontWithDefault'))
                .toEqual(defaultFont);

            containerIn = {};
            expect(coerceFont(coerce, 'fontNoDefault', defaultFont))
                .toEqual(defaultFont);

            containerIn = {fontWithDefault: {}};
            expect(coerceFont(coerce, 'fontWithDefault'))
                .toEqual(defaultFont);
        });

        it('should fill in defaults for bad inputs', function() {
            containerIn = {
                fontWithDefault: {family: '', size: 'a million', color: 42}
            };
            expect(coerceFont(coerce, 'fontWithDefault'))
                .toEqual(defaultFont);
        });

        it('should pass through individual valid pieces', function() {
            var goodFamily = 'A fish'; // for now any non-blank string is OK
            var badFamily = 42;
            var goodSize = 123.456;
            var badSize = 'ginormous';
            var goodColor = 'red';
            var badColor = 'a dark and stormy night';

            containerIn = {
                fontWithDefault: {family: goodFamily, size: badSize, color: badColor}
            };
            expect(coerceFont(coerce, 'fontWithDefault'))
                .toEqual({family: goodFamily, size: defaultFont.size, color: defaultFont.color});

            containerIn = {
                fontWithDefault: {family: badFamily, size: goodSize, color: badColor}
            };
            expect(coerceFont(coerce, 'fontWithDefault'))
                .toEqual({family: defaultFont.family, size: goodSize, color: defaultFont.color});

            containerIn = {
                fontWithDefault: {family: badFamily, size: badSize, color: goodColor}
            };
            expect(coerceFont(coerce, 'fontWithDefault'))
                .toEqual({family: defaultFont.family, size: defaultFont.size, color: goodColor});
        });
    });

    describe('init2dArray', function() {
        it('should initialize a 2d array with the correct dimenstions', function() {
            var array = Lib.init2dArray(4, 5);
            expect(array.length).toEqual(4);
            expect(array[0].length).toEqual(5);
            expect(array[3].length).toEqual(5);
        });
    });

    describe('validate', function() {
        function assert(shouldPass, shouldFail, valObject) {
            shouldPass.forEach(function(v) {
                var res = Lib.validate(v, valObject);
                expect(res).toBe(true, JSON.stringify(v) + ' should pass');
            });

            shouldFail.forEach(function(v) {
                var res = Lib.validate(v, valObject);
                expect(res).toBe(false, JSON.stringify(v) + ' should fail');
            });
        }

        it('should work for valType \'data_array\' where', function() {
            var shouldPass = [[20], []];
            var shouldFail = ['a', {}, 20, undefined, null];

            assert(shouldPass, shouldFail, {
                valType: 'data_array'
            });

            assert(shouldPass, shouldFail, {
                valType: 'data_array',
                dflt: [1, 2]
            });
        });

        it('should work for valType \'enumerated\' where', function() {
            assert(['a', 'b'], ['c', 1, null, undefined, ''], {
                valType: 'enumerated',
                values: ['a', 'b'],
                dflt: 'a'
            });

            assert([1, '1', 2, '2'], ['c', 3, null, undefined, ''], {
                valType: 'enumerated',
                values: [1, 2],
                coerceNumber: true,
                dflt: 1
            });

            assert(['a', 'b', [1, 2]], ['c', 1, null, undefined, ''], {
                valType: 'enumerated',
                values: ['a', 'b'],
                arrayOk: true,
                dflt: 'a'
            });

            assert(['x', 'x2'], ['xx', 'x0', undefined], {
                valType: 'enumerated',
                values: ['/^x([2-9]|[1-9][0-9]+)?$/'],
                dflt: 'x'
            });
        });

        it('should work for valType \'boolean\' where', function() {
            var shouldPass = [true, false];
            var shouldFail = ['a', 1, {}, [], null, undefined, ''];

            assert(shouldPass, shouldFail, {
                valType: 'boolean',
                dflt: true
            });

            assert(shouldPass, shouldFail, {
                valType: 'boolean',
                dflt: false
            });
        });

        it('should work for valType \'number\' where', function() {
            var shouldPass = [20, '20', 1e6];
            var shouldFail = ['a', [], {}, null, undefined, ''];

            assert(shouldPass, shouldFail, {
                valType: 'number'
            });

            assert(shouldPass, shouldFail, {
                valType: 'number',
                dflt: null
            });

            assert([20, '20'], [-10, '-10', 25, '25'], {
                valType: 'number',
                dflt: 20,
                min: 0,
                max: 21
            });

            assert([20, '20', [1, 2]], ['a', {}], {
                valType: 'number',
                dflt: 20,
                arrayOk: true
            });
        });

        it('should work for valType \'integer\' where', function() {
            assert([1, 2, '3', '4'], ['a', 1.321321, {}, [], null, 2 / 3, undefined, null], {
                valType: 'integer',
                dflt: 1
            });

            assert([1, 2, '3', '4'], [-1, '-2', 2.121, null, undefined, [], {}], {
                valType: 'integer',
                min: 0,
                dflt: 1
            });
        });

        it('should work for valType \'string\' where', function() {
            var date = new Date(2016, 1, 1);

            assert(['3', '4', 'a', 3, 1.2113, ''], [undefined, {}, [], null, date, false], {
                valType: 'string',
                dflt: 'a'
            });

            assert(['3', '4', 'a', 3, 1.2113], ['', undefined, {}, [], null, date, true], {
                valType: 'string',
                dflt: 'a',
                noBlank: true
            });

            assert(['3', '4', ''], [undefined, 1, {}, [], null, date, true, false], {
                valType: 'string',
                dflt: 'a',
                strict: true
            });

            assert(['3', '4'], [undefined, 1, {}, [], null, date, '', true, false], {
                valType: 'string',
                dflt: 'a',
                strict: true,
                noBlank: true
            });
        });

        it('should work for valType \'color\' where', function() {
            var shouldPass = ['red', '#d3d3d3', 'rgba(0,255,255,0.1)'];
            var shouldFail = [1, {}, [], 'rgq(233,122,332,1)', null, undefined];

            assert(shouldPass, shouldFail, {
                valType: 'color'
            });
        });

        it('should work for valType \'colorlist\' where', function() {
            var shouldPass = [['red'], ['#ffffff'], ['rgba(0,0,0,1)'], ['red', 'green', 'blue']];
            var shouldFail = [1, null, undefined, {}, [], 'red', ['red', null]];

            assert(shouldPass, shouldFail, {
                valType: 'colorlist'
            });
        });

        it('should work for valType \'colorscale\' where', function() {
            var good = [ [0, 'red'], [1, 'blue'] ];
            var bad = [ [0.1, 'red'], [1, 'blue'] ];
            var bad2 = [ [0], [1] ];
            var bad3 = [ ['red'], ['blue']];
            var bad4 = ['red', 'blue'];

            var shouldPass = ['Viridis', 'Greens', good];
            var shouldFail = ['red', 1, undefined, null, {}, [], bad, bad2, bad3, bad4];

            assert(shouldPass, shouldFail, {
                valType: 'colorscale'
            });
        });

        it('should work for valType \'angle\' where', function() {
            var shouldPass = ['auto', '120', 270];
            var shouldFail = [{}, [], 'red', null, undefined, ''];

            assert(shouldPass, shouldFail, {
                valType: 'angle',
                dflt: 0
            });
        });

        it('should work for valType \'subplotid\' where', function() {
            var shouldPass = ['sp', 'sp4', 'sp10'];
            var shouldFail = [{}, [], 'sp1', 'sp0', 'spee1', null, undefined, true];

            assert(shouldPass, shouldFail, {
                valType: 'subplotid',
                dflt: 'sp'
            });
        });

        it('should work for valType \'flaglist\' where', function() {
            var shouldPass = ['a', 'b', 'a+b', 'b+a', 'c'];
            var shouldFail = [{}, [], 'red', null, undefined, '', 'a + b'];

            assert(shouldPass, shouldFail, {
                valType: 'flaglist',
                flags: ['a', 'b'],
                extras: ['c']
            });
        });

        it('should work for valType \'any\' where', function() {
            var shouldPass = ['', '120', null, false, {}, []];
            var shouldFail = [undefined];

            assert(shouldPass, shouldFail, {
                valType: 'any'
            });
        });

        it('should work for valType \'info_array\' where', function() {
            var shouldPass = [[1, 2], [-20, '20']];
            var shouldFail = [
                {}, [], [10], [null, 10], ['aads', null],
                'red', null, undefined, '',
                [1, 10, null]
            ];

            assert(shouldPass, shouldFail, {
                valType: 'info_array',
                items: [{
                    valType: 'number', dflt: -20
                }, {
                    valType: 'number', dflt: 20
                }]
            });
        });

        it('should work for valType \'info_array\' (freeLength case)', function() {
            var shouldPass = [
                ['marker.color', 'red'],
                [{ 'marker.color': 'red' }, [1, 2]]
            ];
            var shouldFail = [
                ['marker.color', 'red', 'red'],
                [{ 'marker.color': 'red' }, [1, 2], 'blue']
            ];

            assert(shouldPass, shouldFail, {
                valType: 'info_array',
                freeLength: true,
                items: [{
                    valType: 'any'
                }, {
                    valType: 'any'
                }, {
                    valType: 'number'
                }]
            });
        });
    });

    describe('setCursor', function() {
        beforeEach(function() {
            this.el3 = d3Select(createGraphDiv());
        });

        afterEach(destroyGraphDiv);

        it('should assign cursor- class', function() {
            setCursor(this.el3, 'one');

            expect(this.el3.attr('class')).toEqual('cursor-one');
        });

        it('should assign cursor- class while present non-cursor- classes', function() {
            this.el3.classed('one', true);
            this.el3.classed('two', true);
            this.el3.classed('three', true);
            setCursor(this.el3, 'one');

            expect(this.el3.attr('class')).toEqual('one two three cursor-one');
        });

        it('should update class from one cursor- class to another', function() {
            this.el3.classed('cursor-one', true);
            setCursor(this.el3, 'two');

            expect(this.el3.attr('class')).toEqual('cursor-two');
        });

        it('should update multiple cursor- classes', function() {
            this.el3.classed('cursor-one', true);
            this.el3.classed('cursor-two', true);
            this.el3.classed('cursor-three', true);
            setCursor(this.el3, 'four');

            expect(this.el3.attr('class')).toEqual('cursor-four');
        });

        it('should remove cursor- if no new class is given', function() {
            this.el3.classed('cursor-one', true);
            this.el3.classed('cursor-two', true);
            this.el3.classed('cursor-three', true);
            setCursor(this.el3);

            expect(this.el3.attr('class')).toEqual('');
        });
    });

    describe('overrideCursor', function() {
        beforeEach(function() {
            this.el3 = d3Select(createGraphDiv());
        });

        afterEach(destroyGraphDiv);

        it('should apply the new cursor(s) and revert to the original when removed', function() {
            this.el3
                .classed('cursor-before', true)
                .classed('not-a-cursor', true)
                .classed('another', true);

            overrideCursor(this.el3, 'after');
            expect(this.el3.attr('class')).toBe('not-a-cursor another cursor-after');

            overrideCursor(this.el3, 'later');
            expect(this.el3.attr('class')).toBe('not-a-cursor another cursor-later');

            overrideCursor(this.el3);
            expect(this.el3.attr('class')).toBe('not-a-cursor another cursor-before');
        });

        it('should apply the new cursor(s) and revert to the none when removed', function() {
            this.el3
                .classed('not-a-cursor', true)
                .classed('another', true);

            overrideCursor(this.el3, 'after');
            expect(this.el3.attr('class')).toBe('not-a-cursor another cursor-after');

            overrideCursor(this.el3, 'later');
            expect(this.el3.attr('class')).toBe('not-a-cursor another cursor-later');

            overrideCursor(this.el3);
            expect(this.el3.attr('class')).toBe('not-a-cursor another');
        });

        it('should do nothing if no existing or new override is present', function() {
            this.el3
                .classed('cursor-before', true)
                .classed('not-a-cursor', true);

            overrideCursor(this.el3);

            expect(this.el3.attr('class')).toBe('cursor-before not-a-cursor');
        });
    });

    describe('pushUnique', function() {
        beforeEach(function() {
            this.obj = { a: 'A' };
            this.array = ['a', 'b', 'c', this.obj];
        });

        it('should fill new items in array', function() {
            var out = Lib.pushUnique(this.array, 'd');

            expect(this.array).toEqual(['a', 'b', 'c', { a: 'A' }, 'd']);
            expect(this.array).toBe(out);
        });

        it('should ignore falsy items except 0', function() {
            Lib.pushUnique(this.array, false);
            expect(this.array).toEqual(['a', 'b', 'c', { a: 'A' }]);

            Lib.pushUnique(this.array, undefined);
            expect(this.array).toEqual(['a', 'b', 'c', { a: 'A' }]);

            Lib.pushUnique(this.array, null);
            expect(this.array).toEqual(['a', 'b', 'c', { a: 'A' }]);

            Lib.pushUnique(this.array, '');
            expect(this.array).toEqual(['a', 'b', 'c', { a: 'A' }]);

            Lib.pushUnique(this.array, 0);
            expect(this.array).toEqual(['a', 'b', 'c', { a: 'A' }, 0]);
        });

        it('should ignore item already in array', function() {
            Lib.pushUnique(this.array, 'a');
            expect(this.array).toEqual(['a', 'b', 'c', { a: 'A' }]);

            Lib.pushUnique(this.array, this.obj);
            expect(this.array).toEqual(['a', 'b', 'c', { a: 'A' }]);
        });

        it('should recognize matching RegExps', function() {
            expect(this.array).toEqual(['a', 'b', 'c', { a: 'A' }]);

            var r1 = /a/;
            var r2 = /a/;
            Lib.pushUnique(this.array, r1);
            expect(this.array).toEqual(['a', 'b', 'c', { a: 'A' }, r1]);

            Lib.pushUnique(this.array, r2);
            expect(this.array).toEqual(['a', 'b', 'c', { a: 'A' }, r1]);
        });
    });

    describe('filterUnique', function() {
        it('should return array containing unique values', function() {
            expect(
                Lib.filterUnique(['a', 'a', 'b', 'b'])
            )
            .toEqual(['a', 'b']);

            expect(
                Lib.filterUnique(['1', ['1'], 1])
            )
            .toEqual(['1']);

            expect(
                Lib.filterUnique([1, '1', [1]])
            )
            .toEqual([1]);

            expect(
                Lib.filterUnique([ { a: 1 }, { b: 2 }])
            )
            .toEqual([{ a: 1 }]);

            expect(
                Lib.filterUnique([null, undefined, null, null, undefined])
            )
            .toEqual([null, undefined]);
        });
    });

    describe('numSeparate', function() {
        it('should work on numbers and strings', function() {
            expect(Lib.numSeparate(12345.67, '.,')).toBe('12,345.67');
            expect(Lib.numSeparate('12345.67', '.,')).toBe('12,345.67');
        });

        it('should ignore years', function() {
            expect(Lib.numSeparate(2016, '.,')).toBe('2016');
        });

        it('should work even for 4-digit integer if third argument is true', function() {
            expect(Lib.numSeparate(3000, '.,', true)).toBe('3,000');
        });

        it('should work for multiple thousands', function() {
            expect(Lib.numSeparate(1000000000, '.,')).toBe('1,000,000,000');
        });

        it('should work when there\'s only one separator', function() {
            expect(Lib.numSeparate(12.34, '|')).toBe('12|34');
            expect(Lib.numSeparate(1234.56, '|')).toBe('1234|56');
        });

        it('should throw an error when no separator is provided', function() {
            expect(function() {
                Lib.numSeparate(1234);
            }).toThrowError('Separator string required for formatting!');

            expect(function() {
                Lib.numSeparate(1234, '');
            }).toThrowError('Separator string required for formatting!');
        });
    });

    describe('cleanNumber', function() {
        it('should return finite numbers untouched', function() {
            var vals = [
                0, 1, 2, 1234.567, -1, -100, -999.999,
                Number.MAX_VALUE, Number.MIN_VALUE,
                -Number.MAX_VALUE, -Number.MIN_VALUE
            ];

            if(!Lib.isIE()) {
                vals.push(Number.EPSILON, -Number.EPSILON);
            }

            vals.forEach(function(v) {
                expect(Lib.cleanNumber(v)).toBe(v);
            });
        });

        it('should accept number strings with arbitrary cruft on the outside', function() {
            [
                ['0', 0],
                ['1', 1],
                ['1.23', 1.23],
                ['-100.001', -100.001],
                ['  $4.325  #%\t', 4.325],
                [' " #1" ', 1],
                [' \'\n \r -9.2e7   \t\' ', -9.2e7],
                ['1,690,000', 1690000],
                ['1 690 000', 1690000],
                ['2 2', 22],
                ['$5,162,000.00', 5162000],
                [' $1,410,000.00 ', 1410000],
            ].forEach(function(v) {
                expect(Lib.cleanNumber(v[0])).toBe(v[1], v[0]);
            });
        });

        it('should not accept other objects or cruft in the middle', function() {
            [
                NaN, Infinity, -Infinity, null, undefined, new Date(), '',
                ' ', '\t', '2\t2', '2%2', '2$2', {1: 2}, [1], ['1'], {}, []
            ].forEach(function(v) {
                expect(Lib.cleanNumber(v)).toBeUndefined(v);
            });
        });
    });

    describe('isPlotDiv', function() {
        it('should work on plain objects', function() {
            expect(Lib.isPlotDiv({})).toBe(false);
        });
    });

    describe('isD3Selection', function() {
        var gd;

        beforeEach(function() {
            gd = createGraphDiv();
        });

        afterEach(function() {
            destroyGraphDiv();
            Plotly.setPlotConfig({ queueLength: 0 });
        });

        it('recognizes real and duck typed selections', function() {
            var yesSelections = [
                d3Select(gd),
                // this is what got us into trouble actually - d3 selections can
                // contain non-nodes - say for example d3 selections! then they
                // don't work correctly. But it makes a convenient test!
                d3Select(1)
            ];

            yesSelections.forEach(function(v) {
                expect(Lib.isD3Selection(v)).toBe(true, v);
            });
        });

        it('rejects non-selections', function() {
            var notSelections = [
                1,
                'path',
                [1, 2],
                [[1, 2]],
                {classed: 1},
                gd
            ];

            notSelections.forEach(function(v) {
                expect(Lib.isD3Selection(v)).toBe(false, v);
            });
        });
    });

    describe('loggers', function() {
        var stashConsole;
        var stashLogLevel;
        var stashOnGraphLogLevel;

        function consoleFn(name, messages) {
            var out = function() {
                var args = [];
                for(var i = 0; i < arguments.length; i++) args.push(arguments[i]);
                messages.push([name, args]);
            };

            return out;
        }

        function mockConsole() {
            var out = {
                MESSAGES: []
            };
            out.log = consoleFn('log', out.MESSAGES);

            out.error = consoleFn('error', out.MESSAGES);

            out.trace = consoleFn('trace', out.MESSAGES);

            return out;
        }

        beforeEach(function() {
            stashConsole = window.console;
            stashLogLevel = config.logging;
            stashOnGraphLogLevel = config.notifyOnLogging;
        });

        afterEach(function() {
            window.console = stashConsole;
            config.logging = stashLogLevel;
            config.notifyOnLogging = stashOnGraphLogLevel;
        });

        it('emits one console message', function() {
            var c = window.console = mockConsole();
            config.logging = 2;

            Lib.log('tick', 'tock', 'tick', 'tock', 1);
            Lib.warn('I\'m', 'a', 'little', 'cuckoo', 'clock', [1, 2]);
            Lib.error('cuckoo!', 'cuckoo!!!', {a: 1, b: 2});

            expect(c.MESSAGES).toEqual([
                ['trace', ['LOG:', 'tick', 'tock', 'tick', 'tock', 1]],
                ['trace', ['WARN:', 'I\'m', 'a', 'little', 'cuckoo', 'clock', [1, 2]]],
                ['error', ['ERROR:', 'cuckoo!', 'cuckoo!!!', {a: 1, b: 2}]]
            ]);
        });

        it('omits .log at log level 1', function() {
            var c = window.console = mockConsole();
            config.logging = 1;

            Lib.log(1);
            Lib.warn(2);
            Lib.error(3);

            expect(c.MESSAGES).toEqual([
                ['trace', ['WARN:', 2]],
                ['error', ['ERROR:', 3]]
            ]);
        });

        it('logs nothing at log level 0', function() {
            var c = window.console = mockConsole();
            config.logging = 0;

            Lib.log(1);
            Lib.warn(2);
            Lib.error(3);

            expect(c.MESSAGES).toEqual([]);
        });

        describe('should log message in notifier div in accordance notifyOnLogging config option', function() {
            var query = '.notifier-note';

            beforeEach(function(done) {
                d3SelectAll(query).each(function() {
                    d3Select(this).select('button').node().click();
                });
                setTimeout(done, 1000);
            });

            function _run(exp) {
                config.logging = 0;

                Lib.log('log');
                Lib.warn('warn');
                Lib.error('error!');

                var notes = d3SelectAll(query);

                expect(notes.size()).toBe(exp.length, '# of notifier notes');

                var actual = [];
                notes.each(function() {
                    actual.push(d3Select(this).select('p').text());
                });
                expect(actual).toEqual(exp);
            }

            it('with level 2', function() {
                config.notifyOnLogging = 2;
                _run(['log', 'warn', 'error!']);
            });

            it('with level 1', function() {
                config.notifyOnLogging = 1;
                _run(['warn', 'error!']);
            });

            it('with level 0', function() {
                config.notifyOnLogging = 0;
                _run([]);
            });
        });
    });

    describe('keyedContainer', function() {
        describe('with no existing container', function() {
            it('creates a named container only when setting a value', function() {
                var container = {};
                var kCont = Lib.keyedContainer(container, 'styles');

                expect(kCont.get('name1')).toBeUndefined();
                expect(container).toEqual({});

                kCont.set('name1', null);
                expect(container).toEqual({});

                kCont.set('name1', 'value1');
                expect(container).toEqual({
                    styles: [{name: 'name1', value: 'value1'}]
                });
                expect(kCont.get('name1')).toBe('value1');
                expect(kCont.get('name2')).toBeUndefined();
            });
        });

        describe('with no path', function() {
            it('adds elements just like when there is a path', function() {
                var arr = [];
                var kCont = Lib.keyedContainer(arr);

                expect(kCont.get('name1')).toBeUndefined();
                expect(arr).toEqual([]);

                kCont.set('name1', null);
                expect(arr).toEqual([]);

                kCont.set('name1', 'value1');
                expect(arr).toEqual([{name: 'name1', value: 'value1'}]);
                expect(kCont.get('name1')).toBe('value1');
                expect(kCont.get('name2')).toBeUndefined();
            });

            it('does not barf if the array is missing', function() {
                var kCont = Lib.keyedContainer();
                kCont.set('name1', null);
                kCont.set('name1', 'value1');
                expect(kCont.get('name1')).toBeUndefined();
            });
        });

        describe('with a filled container', function() {
            var container, carr;

            beforeEach(function() {
                container = {
                    styles: [
                        {name: 'name1', value: 'value1'},
                        {name: 'name2', value: 'value2'}
                    ]
                };

                carr = Lib.keyedContainer(container, 'styles');
            });

            describe('modifying the object', function() {
                it('adds and updates items', function() {
                    carr.set('foo', 'bar');
                    carr.set('name1', 'value3');

                    expect(container).toEqual({styles: [
                        {name: 'name1', value: 'value3'},
                        {name: 'name2', value: 'value2'},
                        {name: 'foo', value: 'bar'}
                    ]});
                });

                it('removes items', function() {
                    carr.set('foo', 'bar');
                    carr.remove('name1');

                    expect(container).toEqual({styles: [
                        {name: 'name2', value: 'value2'},
                        {name: 'foo', value: 'bar'}
                    ]});
                });

                it('gets items', function() {
                    expect(carr.get('foo')).toBe(undefined);
                    expect(carr.get('name1')).toEqual('value1');

                    carr.remove('name1');

                    expect(carr.get('name1')).toBe(undefined);

                    carr.rename('name2', 'name3');

                    expect(carr.get('name3')).toEqual('value2');
                });

                it('renames items', function() {
                    carr.rename('name2', 'name3');

                    expect(container).toEqual({styles: [
                        {name: 'name1', value: 'value1'},
                        {name: 'name3', value: 'value2'}
                    ]});
                });
            });

            describe('constructing updates', function() {
                it('constructs updates for addition and modification', function() {
                    carr.set('foo', 'bar');
                    carr.set('name1', 'value3');

                    expect(carr.constructUpdate()).toEqual({
                        'styles[0].value': 'value3',
                        'styles[2].name': 'foo',
                        'styles[2].value': 'bar'
                    });
                });

                it('constructs updates for removal', function() {
                    carr.set('foo', 'bar');
                    carr.remove('name1');

                    expect(carr.constructUpdate()).toEqual({
                        'styles[0].name': 'name2',
                        'styles[0].value': 'value2',
                        'styles[1].name': 'foo',
                        'styles[1].value': 'bar',
                        'styles[2]': null
                    });
                });

                it('constructs updates for renaming', function() {
                    carr.rename('name2', 'name3');

                    expect(carr.constructUpdate()).toEqual({
                        'styles[1].name': 'name3'
                    });
                });
            });
        });

        describe('with custom named properties', function() {
            it('performs all of the operations', function() {
                var container = {styles: [
                    {foo: 'name1', bar: 'value1'},
                    {foo: 'name2', bar: 'value2'}
                ]};

                var carr = Lib.keyedContainer(container, 'styles', 'foo', 'bar');

                // SET A VALUE

                carr.set('name3', 'value3');

                expect(container).toEqual({styles: [
                    {foo: 'name1', bar: 'value1'},
                    {foo: 'name2', bar: 'value2'},
                    {foo: 'name3', bar: 'value3'}
                ]});

                expect(carr.constructUpdate()).toEqual({
                    'styles[2].foo': 'name3',
                    'styles[2].bar': 'value3'
                });

                // REMOVE A VALUE

                carr.remove('name2');

                expect(container).toEqual({styles: [
                    {foo: 'name1', bar: 'value1'},
                    {foo: 'name3', bar: 'value3'}
                ]});

                expect(carr.constructUpdate()).toEqual({
                    'styles[1].foo': 'name3',
                    'styles[1].bar': 'value3',
                    'styles[2]': null
                });

                // RENAME A VALUE

                carr.rename('name1', 'name2');

                expect(container).toEqual({styles: [
                    {foo: 'name2', bar: 'value1'},
                    {foo: 'name3', bar: 'value3'}
                ]});

                expect(carr.constructUpdate()).toEqual({
                    'styles[0].foo': 'name2',
                    'styles[1].foo': 'name3',
                    'styles[1].bar': 'value3',
                    'styles[2]': null
                });

                // SET A VALUE

                carr.set('name2', 'value2');

                expect(container).toEqual({styles: [
                    {foo: 'name2', bar: 'value2'},
                    {foo: 'name3', bar: 'value3'}
                ]});

                expect(carr.constructUpdate()).toEqual({
                    'styles[0].foo': 'name2',
                    'styles[0].bar': 'value2',
                    'styles[1].foo': 'name3',
                    'styles[1].bar': 'value3',
                    'styles[2]': null
                });
            });
        });

        describe('with nested valueName', function() {
            it('gets and sets values', function() {
                var container = {styles: []};

                var carr = Lib.keyedContainer(container, 'styles', 'foo', 'bar.value');

                carr.set('name1', 'value1');

                expect(container).toEqual({styles: [
                    {foo: 'name1', bar: {value: 'value1'}}
                ]});

                expect(carr.get('name1')).toEqual('value1');
            });

            it('renames values', function() {
                var container = {styles: []};

                var carr = Lib.keyedContainer(container, 'styles', 'foo', 'bar.value');

                carr.set('name1', 'value1');
                carr.rename('name1', 'name2');

                expect(container).toEqual({styles: [
                    {foo: 'name2', bar: {value: 'value1'}}
                ]});

                expect(carr.get('name2')).toEqual('value1');
                expect(carr.get('name1')).toBeUndefined();
            });

            it('constructs updates', function() {
                var container = {styles: [
                    {foo: 'name1', bar: {value: 'value1'}},
                    {foo: 'name2', bar: {value: 'value2'}}
                ]};

                var carr = Lib.keyedContainer(container, 'styles', 'foo', 'bar.value');

                carr.set('name3', 'value3');
                carr.remove('name2');
                carr.rename('name1', 'name4');

                expect(container).toEqual({styles: [
                    {foo: 'name4', bar: {value: 'value1'}},
                    {foo: 'name2', bar: {}},
                    {foo: 'name3', bar: {value: 'value3'}}
                ]});

                expect(carr.constructUpdate()).toEqual({
                    'styles[0].foo': 'name4',
                    'styles[1].bar.value': null,
                    'styles[2].foo': 'name3',
                    'styles[2].bar.value': 'value3',
                });
            });

            it('unsets but does not remove items with extra top-level data', function() {
                var container = {styles: [
                    {foo: 'name', bar: {value: 'value'}, extra: 'data'}
                ]};

                var carr = Lib.keyedContainer(container, 'styles', 'foo', 'bar.value');

                carr.remove('name');

                expect(container.styles).toEqual([{foo: 'name', bar: {}, extra: 'data'}]);

                expect(carr.constructUpdate()).toEqual({
                    'styles[0].bar.value': null,
                });
            });

            it('unsets but does not remove items with extra value data', function() {
                var container = {styles: [
                    {foo: 'name1', bar: {value: 'value1', extra: 'data'}},
                    {foo: 'name2', bar: {value: 'value2'}},
                    {foo: 'name3', bar: {value: 'value3', extra: 'data'}},
                ]};

                var carr = Lib.keyedContainer(container, 'styles', 'foo', 'bar.value');

                // Remove the first value:

                carr.remove('name1');

                expect(container.styles).toEqual([
                    {foo: 'name1', bar: {extra: 'data'}},
                    {foo: 'name2', bar: {value: 'value2'}},
                    {foo: 'name3', bar: {value: 'value3', extra: 'data'}},
                ]);

                expect(carr.constructUpdate()).toEqual({
                    'styles[0].bar.value': null
                });

                // Remove the second value:
                carr.remove('name2');

                expect(container.styles).toEqual([
                    {foo: 'name1', bar: {extra: 'data'}},
                    {foo: 'name2', bar: {}},
                    {foo: 'name3', bar: {value: 'value3', extra: 'data'}},
                ]);

                expect(carr.constructUpdate()).toEqual({
                    'styles[0].bar.value': null,
                    'styles[1].bar.value': null
                });
            });

            it('does not compress nested attributes *sigh*', function() {
                var container = {styles: [
                    {foo: 'name1', bar: {value: 'value1'}},
                    {foo: 'name2', bar: {value: 'value2', extra: 'data2'}},
                ]};

                var carr = Lib.keyedContainer(container, 'styles', 'foo', 'bar.value');

                // Remove the first value:

                carr.remove('name1');

                expect(container.styles).toEqual([
                    {foo: 'name1', bar: {}},
                    {foo: 'name2', bar: {value: 'value2', extra: 'data2'}},
                ]);

                expect(carr.constructUpdate()).toEqual({
                    'styles[0].bar.value': null
                });
            });
        });
    });

    describe('templateString', function() {
        it('evaluates attributes', function() {
            expect(Lib.templateString('foo %{bar}', {bar: 'baz'})).toEqual('foo baz');
        });

        it('evaluates nested properties', function() {
            expect(Lib.templateString('foo %{bar.baz}', {bar: {baz: 'asdf'}})).toEqual('foo asdf');
        });

        it('evaluates array nested properties', function() {
            expect(Lib.templateString('foo %{bar[0].baz}', {bar: [{baz: 'asdf'}]})).toEqual('foo asdf');
        });

        it('subtitutes multiple matches', function() {
            expect(Lib.templateString('foo %{group} %{trace}', {group: 'asdf', trace: 'jkl;'})).toEqual('foo asdf jkl;');
        });

        it('replaces missing matches with empty string', function() {
            expect(Lib.templateString('foo %{group} %{trace}', {})).toEqual('foo  ');
        });

        it('replaces empty key with empty string', function() {
            expect(Lib.templateString('foo %{} %{}', {})).toEqual('foo  ');
        });

        it('should work with the number *0*', function() {
            expect(Lib.templateString('%{group}', {group: 0})).toEqual('0');
        });

        it('should work with the number *0* (nested case)', function() {
            expect(Lib.templateString('%{x.y}', {'x': {y: 0}})).toEqual('0');
        });
    });

    describe('hovertemplateString', function() {
        var locale = false;
        it('evaluates attributes', function() {
            expect(Lib.hovertemplateString('foo %{bar}', {}, locale, {bar: 'baz'})).toEqual('foo baz');
        });

        it('evaluates attributes with a dot in their name', function() {
            expect(Lib.hovertemplateString('%{marker.size}', {}, locale, {'marker.size': 12}, {marker: {size: 14}})).toEqual('12');
        });

        it('evaluates nested properties', function() {
            expect(Lib.hovertemplateString('foo %{bar.baz}', {}, locale, {bar: {baz: 'asdf'}})).toEqual('foo asdf');
        });

        it('evaluates array nested properties', function() {
            expect(Lib.hovertemplateString('foo %{bar[0].baz}', {}, locale, {bar: [{baz: 'asdf'}]})).toEqual('foo asdf');
        });

        it('should work with the number *0*', function() {
            expect(Lib.hovertemplateString('%{group}', {}, locale, {group: 0})).toEqual('0');
        });

        it('should work with the number *0* (nested case)', function() {
            expect(Lib.hovertemplateString('%{x.y}', {}, locale, {'x': {y: 0}})).toEqual('0');
        });

        it('subtitutes multiple matches', function() {
            expect(Lib.hovertemplateString('foo %{group} %{trace}', {}, locale, {group: 'asdf', trace: 'jkl;'})).toEqual('foo asdf jkl;');
        });

        it('replaces missing matches with template string', function() {
            expect(Lib.hovertemplateString('foo %{group} %{trace}', {}, locale, {group: 1})).toEqual('foo 1 %{trace}');
        });

        it('uses the value from the first object with the specified key', function() {
            var obj1 = {a: 'first'};
            var obj2 = {a: 'second', foo: {bar: 'bar'}};

            // Simple key
            expect(Lib.hovertemplateString('foo %{a}', {}, locale, obj1, obj2)).toEqual('foo first');
            expect(Lib.hovertemplateString('foo %{a}', {}, locale, obj2, obj1)).toEqual('foo second');

            // Nested Keys
            expect(Lib.hovertemplateString('foo %{foo.bar}', {}, locale, obj1, obj2)).toEqual('foo bar');

            // Nested keys with 0
            expect(Lib.hovertemplateString('y: %{y}', {}, locale, {y: 0}, {y: 1})).toEqual('y: 0');
        });

        it('formats numbers using d3-format mini-language when `:`', function() {
            expect(Lib.hovertemplateString('a: %{a:.0%}', {}, locale, {a: 0.123})).toEqual('a: 12%');
            expect(Lib.hovertemplateString('a: %{a:0.2%}', {}, locale, {a: 0.123})).toEqual('a: 12.30%');
            expect(Lib.hovertemplateString('b: %{b:2.2f}', {}, locale, {b: 43})).toEqual('b: 43.00');
        });

        it('formats date using d3-time-format mini-language `|`', function() {
            expect(Lib.hovertemplateString('a: %{a|%A}', {}, locale, {a: '2019-05-22'})).toEqual('a: Wednesday');
            expect(Lib.hovertemplateString('%{x|%b %-d, %Y}', {}, locale, {x: '2019-01-01'})).toEqual('Jan 1, 2019');
        });

        it('looks for default label if no format is provided', function() {
            expect(Lib.hovertemplateString('y: %{y}', {yLabel: '0.1'}, locale, {y: 0.123})).toEqual('y: 0.1');
        });

        it('warns user up to 10 times if a variable cannot be found', function() {
            spyOn(Lib, 'warn').and.callThrough();
            Lib.hovertemplateString('%{idontexist}', {});
            expect(Lib.warn.calls.count()).toBe(1);

            for(var i = 0; i < 15; i++) {
                Lib.hovertemplateString('%{idontexist}', {});
            }
            expect(Lib.warn.calls.count()).toBe(10);
        });

        it('does not error out when arguments are undefined', function() {
            expect(function() {
                Lib.hovertemplateString('y: %{y}', undefined, locale, undefined);
            }).not.toThrow();
        });
    });

    describe('texttemplateString', function() {
        var locale = false;
        it('evaluates attributes', function() {
            expect(Lib.texttemplateString('foo %{bar}', {}, locale, {bar: 'baz'})).toEqual('foo baz');
        });

        it('looks for default label if no format is provided', function() {
            expect(Lib.texttemplateString('y: %{y}', {yLabel: '0.1'}, locale, {y: 0.123})).toEqual('y: 0.1');
        });

        it('warns user up to 10 times if a variable cannot be found', function() {
            spyOn(Lib, 'warn').and.callThrough();
            Lib.texttemplateString('%{idontexist}', {});
            expect(Lib.warn.calls.count()).toBe(1);

            for(var i = 0; i < 15; i++) {
                Lib.texttemplateString('%{idontexist}', {});
            }
            expect(Lib.warn.calls.count()).toBe(11);
        });
    });

    describe('relativeAttr()', function() {
        it('replaces the last part always', function() {
            expect(Lib.relativeAttr('annotations[3].x', 'y')).toBe('annotations[3].y');
            expect(Lib.relativeAttr('x', 'z')).toBe('z');
            expect(Lib.relativeAttr('marker.line.width', 'colorbar.x')).toBe('marker.line.colorbar.x');
        });

        it('ascends with ^', function() {
            expect(Lib.relativeAttr('annotations[3].x', '^[2].z')).toBe('annotations[2].z');
            expect(Lib.relativeAttr('annotations[3].x', '^^margin')).toBe('margin');
            expect(Lib.relativeAttr('annotations[3].x', '^^margin.r')).toBe('margin.r');
            expect(Lib.relativeAttr('marker.line.width', '^colorbar.x')).toBe('marker.colorbar.x');
        });

        it('fails on ascending too far', function() {
            expect(function() { return Lib.relativeAttr('x', '^y'); }).toThrow();
            expect(function() { return Lib.relativeAttr('marker.line.width', '^^^colorbar.x'); }).toThrow();
        });

        it('fails with malformed baseAttr', function() {
            expect(function() { return Lib.relativeAttr('x[]', 'z'); }).toThrow();
            expect(function() { return Lib.relativeAttr('x.a]', 'z'); }).toThrow();
            expect(function() { return Lib.relativeAttr('x[a]', 'z'); }).toThrow();
            expect(function() { return Lib.relativeAttr('x[3].', 'z'); }).toThrow();
            expect(function() { return Lib.relativeAttr('x.y.', 'z'); }).toThrow();
        });
    });

    describe('subplotSort', function() {
        it('puts xy subplots in the right order', function() {
            var a = ['x10y', 'x10y20', 'x10y12', 'x10y2', 'xy', 'x2y12', 'xy2', 'xy15'];
            a.sort(Lib.subplotSort);
            expect(a).toEqual(['xy', 'xy2', 'xy15', 'x2y12', 'x10y', 'x10y2', 'x10y12', 'x10y20']);
        });

        it('puts simple subplots in the right order', function() {
            ['scene', 'geo', 'ternary', 'mapbox'].forEach(function(v) {
                var a = [v + '100', v + '43', v, v + '10', v + '2'];
                a.sort(Lib.subplotSort);
                expect(a).toEqual([v, v + '2', v + '10', v + '43', v + '100']);
            });
        });
    });

    describe('sort', function() {
        var callCount;
        beforeEach(function() {
            callCount = 0;
        });

        function sortCounter(a, b) {
            callCount++;
            return a - b;
        }

        function sortCounterReversed(a, b) {
            callCount++;
            return b - a;
        }

        function ascending(n) {
            var out = new Array(n);
            for(var i = 0; i < n; i++) {
                out[i] = i;
            }
            assertAscending(out);
            return out;
        }

        function descending(n) {
            var out = new Array(n);
            for(var i = 0; i < n; i++) {
                out[i] = n - 1 - i;
            }
            assertDescending(out);
            return out;
        }

        function rand(n) {
            Lib.seedPseudoRandom();
            var out = new Array(n);
            for(var i = 0; i < n; i++) {
                out[i] = Lib.pseudoRandom();
            }
            return out;
        }

        function assertAscending(array) {
            for(var i = 1; i < array.length; i++) {
                if(array[i] < array[i - 1]) {
                    // we already know this expect will fail,
                    // just want to format the message nicely and then
                    // quit so we don't get a million messages
                    expect(array[i]).not.toBeLessThan(array[i - 1]);
                    break;
                }
            }
        }

        function assertDescending(array) {
            for(var i = 1; i < array.length; i++) {
                if(array[i] < array[i - 1]) {
                    expect(array[i]).not.toBeGreaterThan(array[i - 1]);
                    break;
                }
            }
        }

        function _sort(array, sortFn) {
            var arrayOut = Lib.sort(array, sortFn);
            expect(arrayOut).toBe(array);
            return array;
        }

        it('sorts ascending arrays ascending in N-1 calls', function() {
            var arrayIn = _sort(ascending(100000), sortCounter);
            expect(callCount).toBe(99999);
            assertAscending(arrayIn);
        });

        it('sorts descending arrays ascending in N-1 calls', function() {
            var arrayIn = _sort(descending(100000), sortCounter);
            expect(callCount).toBe(99999);
            assertAscending(arrayIn);
        });

        it('sorts ascending arrays descending in N-1 calls', function() {
            var arrayIn = _sort(ascending(100000), sortCounterReversed);
            expect(callCount).toBe(99999);
            assertDescending(arrayIn);
        });

        it('sorts descending arrays descending in N-1 calls', function() {
            var arrayIn = _sort(descending(100000), sortCounterReversed);
            expect(callCount).toBe(99999);
            assertDescending(arrayIn);
        });

        it('sorts random arrays ascending in a few more calls than bare sort', function() {
            var arrayIn = _sort(rand(100000), sortCounter);
            assertAscending(arrayIn);

            var ourCallCount = callCount;
            callCount = 0;
            rand(100000).sort(sortCounter);
            // in general this will be ~N*log_2(N)
            expect(callCount).toBeGreaterThan(1e6);
            // This number (2) is only repeatable because we used Lib.pseudoRandom
            // should always be at least 2 and less than N - 1, and if
            // the input array is really not sorted it will be close to 2. It will
            // only be large if the array is sorted until near the end.
            expect(ourCallCount - callCount).toBe(2);
        });

        it('sorts random arrays descending in a few more calls than bare sort', function() {
            var arrayIn = _sort(rand(100000), sortCounterReversed);
            assertDescending(arrayIn);

            var ourCallCount = callCount;
            callCount = 0;
            rand(100000).sort(sortCounterReversed);
            expect(callCount).toBeGreaterThan(1e6);
            expect(ourCallCount - callCount).toBe(2);
        });

        it('supports short arrays', function() {
            expect(_sort([], sortCounter)).toEqual([]);
            expect(_sort([1], sortCounter)).toEqual([1]);
            expect(callCount).toBe(0);

            expect(_sort([1, 2], sortCounter)).toEqual([1, 2]);
            expect(_sort([2, 3], sortCounterReversed)).toEqual([3, 2]);
            expect(callCount).toBe(2);
        });

        function dupes() {
            return [0, 1, 1, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 5, 5, 6, 7, 8, 9];
        }

        it('still short-circuits in order with duplicates', function() {
            expect(_sort(dupes(), sortCounter))
                .toEqual(dupes());

            expect(callCount).toEqual(18);
        });

        it('still short-circuits reversed with duplicates', function() {
            expect(_sort(dupes(), sortCounterReversed))
                .toEqual(dupes().reverse());

            expect(callCount).toEqual(18);
        });
    });

    describe('relinkPrivateKeys', function() {
        it('ignores customdata and ids', function() {
            var fromContainer = {
                customdata: [{_x: 1, _y: 2, a: 3}],
                ids: [{_i: 4, j: 5}]
            };
            var toContainer = {
                customdata: [{a: 6}],
                ids: [{j: 7}]
            };

            Lib.relinkPrivateKeys(toContainer, fromContainer);

            expect(toContainer.customdata[0]._x).toBeUndefined();
            expect(toContainer.customdata[0]._y).toBeUndefined();
            expect(toContainer.ids[0]._i).toBeUndefined();
        });

        it('ignores any values that are ===', function() {
            var accesses = 0;

            var obj = {
                get _x() { accesses++; return 1; },
                set _x(v) { accesses++; }
            };
            var array = [obj];
            var array2 = [obj];

            var fromContainer = {
                x: array,
                y: array,
                o: obj
            };
            var toContainer = {
                x: array,
                y: array2,
                o: obj
            };

            Lib.relinkPrivateKeys(toContainer, fromContainer);

            expect(accesses).toBe(0);

            obj._x = 2;
            expect(obj._x).toBe(1);
            expect(accesses).toBe(2);
        });

        it('reinserts other private keys if they\'re not already there', function() {
            var obj1 = {a: 10, _a: 11};
            var obj2 = {a: 12, _a: 13};
            function f1() { return 1; }
            function f2() { return 2; }

            var fromContainer = {
                a: 1,
                _a: 2,
                _b: 3,
                _c: obj1,
                _d: obj1,
                f: f1, // functions are private even without _
                g: f1,
                array: [{a: 3, _a: 4, _b: 5, f: f1, g: f1}],
                o: {a: 6, _a: 7, _b: 8},
                array2: [{a: 9, _a: 10}],
                o2: {a: 11, _a: 12}
            };
            fromContainer._circular = fromContainer;
            fromContainer._circular2 = fromContainer;
            var toContainer = {
                a: 21,
                _a: 22,
                _c: obj2,
                f: f2,
                array: [{a: 23, _a: 24, f: f2}],
                o: {a: 26, _a: 27},
                x: [28],
                _x: 29
            };
            toContainer._circular = toContainer;

            Lib.relinkPrivateKeys(toContainer, fromContainer);

            var expected = {
                a: 21,
                _a: 22,
                _b: 3,
                _c: obj2,
                _circular: toContainer,
                _circular2: fromContainer,
                _d: obj1,
                f: f2,
                g: f1,
                array: [{a: 23, _a: 24, _b: 5, f: f2, g: f1}],
                o: {a: 26, _a: 27, _b: 8},
                x: [28],
                _x: 29
            };

            expect(toContainer).toEqual(expected);
        });
    });

    describe('concat', function() {
        var concat = Lib.concat;

        beforeEach(function() {
            spyOn(Array.prototype, 'concat').and.callThrough();
        });

        it('works with multiple Arrays', function() {
            var res = concat([1], [[2], 3], [{a: 4}, 5, 6]);
            expect(Array.prototype.concat.calls.count()).toBe(1);

            // note: can't `concat` in the `expect` if we want to count native
            // `Array.concat calls`, because `toEqual` calls `Array.concat`
            // profusely itself.
            expect(res).toEqual([1, [2], 3, {a: 4}, 5, 6]);
        });

        it('works with some empty arrays', function() {
            var a1 = [1];
            var res = concat(a1, [], [2, 3]);
            expect(Array.prototype.concat.calls.count()).toBe(1);
            expect(res).toEqual([1, 2, 3]);
            expect(a1).toEqual([1]); // did not mutate a1

            Array.prototype.concat.calls.reset();
            var a1b = concat(a1, []);
            var a1c = concat([], a1b);
            var a1d = concat([], a1c, []);
            expect(Array.prototype.concat.calls.count()).toBe(0);

            expect(a1d).toEqual([1]);
            // does not mutate a1, but *will* return it unchanged if it's the
            // only one with data
            expect(a1d).toBe(a1);

            expect(concat([], [0], [1, 0], [2, 0, 0])).toEqual([0, 1, 0, 2, 0, 0]);

            // a single typedArray will keep its identity (and type)
            // even if other empty arrays don't match type.
            var f1 = new Float32Array([1, 2]);
            Array.prototype.concat.calls.reset();
            res = concat([], f1, new Float64Array([]));
            expect(Array.prototype.concat.calls.count()).toBe(0);
            expect(res).toBe(f1);
            expect(f1).toEqual(new Float32Array([1, 2]));
        });

        it('works with all empty arrays', function() {
            [[], [[]], [[], []], [[], [], [], []]].forEach(function(empties) {
                Array.prototype.concat.calls.reset();
                var res = concat.apply(null, empties);
                expect(Array.prototype.concat.calls.count()).toBe(0);
                expect(res).toEqual([]);
            });
        });

        it('converts mismatched types to Array', function() {
            [
                [[1, 2], new Float64Array([3, 4])],
                [new Float64Array([1, 2]), [3, 4]],
                [new Float64Array([1, 2]), new Float32Array([3, 4])]
            ].forEach(function(mismatch) {
                Array.prototype.concat.calls.reset();
                var res = concat.apply(null, mismatch);
                // no concat - all entries moved over individually
                expect(Array.prototype.concat.calls.count()).toBe(0);
                expect(res).toEqual([1, 2, 3, 4]);
            });
        });

        it('concatenates matching TypedArrays preserving type', function() {
            [Float32Array, Float64Array, Int16Array, Int32Array].forEach(function(Type, i) {
                var v = i * 10;
                Array.prototype.concat.calls.reset();
                var res = concat([], new Type([v]), new Type([v + 1, v]), new Type([v + 2, v, v]));
                // no concat - uses `TypedArray.set`
                expect(Array.prototype.concat.calls.count()).toBe(0);
                expect(res).toEqual(new Type([v, v + 1, v, v + 2, v, v]));
            });
        });
    });
});

describe('Queue', function() {
    'use strict';

    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(function() {
        destroyGraphDiv();
        Plotly.setPlotConfig({ queueLength: 0 });
    });

    it('should not fill in undoQueue by default', function(done) {
        Plotly.newPlot(gd, [{
            y: [2, 1, 2]
        }]).then(function() {
            expect(gd.undoQueue).toBeUndefined();

            return Plotly.restyle(gd, 'marker.color', 'red');
        }).then(function() {
            expect(gd.undoQueue.index).toEqual(0);
            expect(gd.undoQueue.queue).toEqual([]);

            return Plotly.relayout(gd, 'title', 'A title');
        }).then(function() {
            expect(gd.undoQueue.index).toEqual(0);
            expect(gd.undoQueue.queue).toEqual([]);
        })
        .then(done, done.fail);
    });

    it('should fill in undoQueue up to value found in *queueLength* config', function(done) {
        Plotly.setPlotConfig({ queueLength: 2 });

        Plotly.newPlot(gd, [{
            y: [2, 1, 2]
        }])
        .then(function() {
            expect(gd.undoQueue).toBeUndefined();

            return Plotly.restyle(gd, 'marker.color', 'red');
        })
        .then(function() {
            expect(gd.undoQueue.index).toEqual(1);
            expect(gd.undoQueue.queue[0].undo.args[0][1]['marker.color']).toEqual([null]);
            expect(gd.undoQueue.queue[0].redo.args[0][1]['marker.color']).toEqual('red');

            return Plotly.relayout(gd, 'title.text', 'A title');
        })
        .then(function() {
            expect(gd.undoQueue.index).toEqual(2);
            expect(gd.undoQueue.queue[1].undo.args[0][1]['title.text']).toEqual(null);
            expect(gd.undoQueue.queue[1].redo.args[0][1]['title.text']).toEqual('A title');

            return Plotly.restyle(gd, 'mode', 'markers');
        })
        .then(function() {
            expect(gd.undoQueue.index).toEqual(2);
            expect(gd.undoQueue.queue[2]).toBeUndefined();

            expect(gd.undoQueue.queue[1].undo.args[0][1].mode).toEqual([null]);
            expect(gd.undoQueue.queue[1].redo.args[0][1].mode).toEqual('markers');

            expect(gd.undoQueue.queue[0].undo.args[0][1]['title.text']).toEqual(null);
            expect(gd.undoQueue.queue[0].redo.args[0][1]['title.text']).toEqual('A title');

            return Plotly.restyle(gd, 'transforms[0]', { type: 'filter' });
        })
        .then(function() {
            expect(gd.undoQueue.queue[1].undo.args[0][1])
                .toEqual({ 'transforms[0]': null });
            expect(gd.undoQueue.queue[1].redo.args[0][1])
                .toEqual({ 'transforms[0]': { type: 'filter' } });

            return Plotly.relayout(gd, 'updatemenus[0]', { buttons: [] });
        })
        .then(function() {
            expect(gd.undoQueue.queue[1].undo.args[0][1])
                .toEqual({ 'updatemenus[0]': null });
            expect(gd.undoQueue.queue[1].redo.args[0][1])
                .toEqual({ 'updatemenus[0]': { buttons: [] } });

            return Plotly.relayout(gd, 'updatemenus[0]', null);
        })
        .then(function() {
            expect(gd.undoQueue.queue[1].undo.args[0][1])
                .toEqual({ 'updatemenus[0]': { buttons: [] } });
            expect(gd.undoQueue.queue[1].redo.args[0][1])
                .toEqual({ 'updatemenus[0]': null });

            return Plotly.restyle(gd, 'transforms[0]', null);
        })
        .then(function() {
            expect(gd.undoQueue.queue[1].undo.args[0][1])
                .toEqual({ 'transforms[0]': [ { type: 'filter' } ]});
            expect(gd.undoQueue.queue[1].redo.args[0][1])
                .toEqual({ 'transforms[0]': null });
        })
        .then(done, done.fail);
    });
});
