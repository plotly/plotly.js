var Lib = require('@src/lib');
var Plots = require('@src/plots/plots');


describe('Test lib.js:', function() {
    'use strict';

    describe('parseDate() should', function() {
        it('return false on bad (number) input:', function() {
            expect(Lib.parseDate(0)).toBe(false);
        });
        it('return false on bad (string) input:', function() {
            expect(Lib.parseDate('toto')).toBe(false);
        });
        it('work with yyyy-mm-dd string input:', function() {
            var input = '2014-12-01',
                res = Lib.parseDate(input),
                res0 = new Date(2014, 11, 1);
            expect(res.getTime()).toEqual(res0.getTime());
        });
        it('work with mm/dd/yyyy string input:', function() {
            var input = '12/01/2014',
                res = Lib.parseDate(input),
                res0 = new Date(2014, 11, 1);
            expect(res.getTime()).toEqual(res0.getTime());
        });
        it('work with yyyy-mm-dd HH:MM:SS.sss string input:', function() {
            var input = '2014-12-01 09:50:05.124',
                res = Lib.parseDate(input),
                res0 = new Date(2014, 11, 1, 9, 50, 5, 124);
            expect(res.getTime()).toEqual(res0.getTime());
        });
        it('work with mm/dd/yyyy HH:MM:SS string input:', function() {
            var input = '2014-12-01 09:50:05',
                res = Lib.parseDate(input),
                res0 = new Date(2014, 11, 1, 9, 50, 5);
            expect(res.getTime()).toEqual(res0.getTime());
        });
    });

    describe('interp() should', function() {
        it('return 1.75 as Q1 of [1, 2, 3, 4, 5]:', function() {
            var input = [1, 2, 3, 4, 5],
                res = Lib.interp(input, 0.25),
                res0 = 1.75;
            expect(res).toEqual(res0);
        });
        it('return 4.25 as Q3 of [1, 2, 3, 4, 5]:', function() {
            var input = [1, 2, 3, 4, 5],
                res = Lib.interp(input, 0.75),
                res0 = 4.25;
            expect(res).toEqual(res0);
        });
        it('error if second input argument is a string:', function() {
            var input = [1, 2, 3, 4, 5];
            expect(function() {
                Lib.interp(input, 'apple');
            }).toThrow('n should be a finite number');
        });
        it('error if second input argument is a date:', function() {
            var in1 = [1, 2, 3, 4, 5],
                in2 = new Date(2014, 11, 1);
            expect(function() {
                Lib.interp(in1, in2);
            }).toThrow('n should be a finite number');
        });
        it('return the right boundary on input [-Inf, Inf]:', function() {
            var input = [-Infinity, Infinity],
                res = Lib.interp(input, 1),
                res0 = Infinity;
            expect(res).toEqual(res0);
        });
    });

    describe('transposeRagged()', function() {
        it('should transpose and return a rectangular array', function() {
            var input = [
                    [1],
                    [2, 3, 4],
                    [5, 6],
                    [7]],
                output = [
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
            var in1D = [1,2,3,4,'goose!',5,6],
                in2D = [[1,2,3],['',4],[5,'hi!',6]];

            expect(aggNums(Math.min, null, in1D)).toEqual(1);
            expect(aggNums(Math.min, null, in2D)).toEqual(1);

            expect(aggNums(Math.max, null, in1D)).toEqual(6);
            expect(aggNums(Math.max, null, in2D)).toEqual(6);

            expect(aggNums(summation, 0, in1D)).toEqual(21);
            expect(aggNums(summation, 0, in2D)).toEqual(21);
        });
    });

    describe('mean() should', function() {
        it('toss out non-numerics (strings):', function() {
            var input = [1, 2, 'apple', 'orange'],
                res = Lib.mean(input);
            expect(res).toEqual(1.5);
        });
        it('toss out non-numerics (NaN):', function() {
            var input = [1, 2, NaN],
                res = Lib.mean(input);
            expect(res).toEqual(1.5);
        });
        it('evaluate numbers which are passed around as text strings:', function() {
            var input = ['1', '2'],
                res = Lib.mean(input);
            expect(res).toEqual(1.5);
        });
    });

    describe('variance() should', function() {
        it('return 0 on input [2, 2, 2, 2, 2]:', function() {
            var input = [2, 2, 2, 2],
                res = Lib.variance(input);
            expect(res).toEqual(0);
        });
        it('return 2/3 on input [-1, 0, 1]:', function() {
            var input = [-1, 0, 1],
                res = Lib.variance(input);
            expect(res).toEqual(2/3);
        });
        it('toss out non-numerics (strings):', function() {
            var input = [1, 2, 'apple', 'orange'],
                res = Lib.variance(input);
            expect(res).toEqual(0.25);
        });
        it('toss out non-numerics (NaN):', function() {
            var input = [1, 2, NaN],
                res = Lib.variance(input);
            expect(res).toEqual(0.25);
        });
    });

    describe('stdev() should', function() {
        it('return 0 on input [2, 2, 2, 2, 2]:', function() {
            var input = [2, 2, 2, 2],
                res = Lib.stdev(input);
            expect(res).toEqual(0);
        });
        it('return sqrt(2/3) on input [-1, 0, 1]:', function() {
            var input = [-1, 0, 1],
                res = Lib.stdev(input);
            expect(res).toEqual(Math.sqrt(2/3));
        });
        it('toss out non-numerics (strings):', function() {
            var input = [1, 2, 'apple', 'orange'],
                res = Lib.stdev(input);
            expect(res).toEqual(0.5);
        });
        it('toss out non-numerics (NaN):', function() {
            var input = [1, 2, NaN],
                res = Lib.stdev(input);
            expect(res).toEqual(0.5);
        });
    });

    describe('smooth()', function() {
        it('should not alter the input for FWHM < 1.5', function() {
            var input = [1, 2, 1, 2, 1],
                output = Lib.smooth(input.slice(), 1.49);

            expect(output).toEqual(input);

            output = Lib.smooth(input.slice(), 'like butter');

            expect(output).toEqual(input);
        });

        it('should preserve the length and integral even with multiple bounces', function() {
            var input = [1, 2, 4, 8, 16, 8, 10, 12],
                output2 = Lib.smooth(input.slice(), 2),
                output30 = Lib.smooth(input.slice(), 30),
                sumIn = 0,
                sum2 = 0,
                sum30 = 0;

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
            var input = [0, 0, 0, 7, 0, 0, 0],
                out4 = Lib.smooth(input, 4),
                out7 = Lib.smooth(input, 7),
                expected4 = [
                    0.2562815664617711, 0.875, 1.4937184335382292, 1.75,
                    1.493718433538229, 0.875, 0.25628156646177086
                ],
                expected7 = [1, 1, 1, 1, 1, 1, 1],
                i;

            for(i = 0; i < input.length; i++) {
                expect(out4[i]).toBeCloseTo(expected4[i], 6);
                expect(out7[i]).toBeCloseTo(expected7[i], 6);
            }
        });
    });

    describe('nestedProperty', function() {
        var np = Lib.nestedProperty;

        it('should access simple objects', function() {
            var obj = {a: 'b', c: 'd'},
                propA = np(obj, 'a'),
                propB = np(obj, 'b');

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
            var arr = [1, 2, 3],
                prop1 = np(arr, 1),
                prop5 = np(arr, '5');

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
            var obj = {arr: [{a: 1}, {a: 2}, {b: 3}]},
                prop = np(obj, 'arr[-1].a');

            expect(prop.get()).toEqual([1, 2, undefined]);
            expect(obj).toEqual({arr: [{a: 1}, {a: 2}, {b: 3}]});

            prop.set(5);
            expect(prop.get()).toBe(5);
            expect(obj).toEqual({arr: [{a: 5}, {a: 5}, {a: 5, b: 3}]});

            prop.set(null);
            expect(prop.get()).toBe(undefined);
            expect(obj).toEqual({arr: [undefined, undefined, {b: 3}]});

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
            var obj = {a: 'b', c: 'd'},
                propA = np(obj, 'a'),
                propC = np(obj, 'c');

            propA.set(null);
            propC.set(undefined);
            expect(obj).toEqual({});

            propA.set(false);
            np(obj, 'b').set('');
            propC.set(0);
            np(obj, 'd').set(NaN);
            expect(obj).toEqual({a: false, b: '', c: 0, d: NaN});
        });

        it('should remove containers but not data arrays', function() {
            var obj = {
                    annotations: [{a: [1,2,3]}],
                    c: [1,2,3],
                    domain: [1,2],
                    range: [2,3],
                    shapes: ['elephant']
                },
                propA = np(obj, 'annotations[-1].a'),
                propC = np(obj, 'c'),
                propD0 = np(obj, 'domain[0]'),
                propD1 = np(obj, 'domain[1]'),
                propR = np(obj, 'range'),
                propS = np(obj, 'shapes[0]');

            propA.set([]);
            propC.set([]);
            propD0.set(undefined);
            propD1.set(undefined);
            propR.set([]);
            propS.set(null);

            expect(obj).toEqual({c: []});
        });


        it('should have no empty object sub-containers but contain empty data arrays', function() {
            var obj = {},
                prop = np(obj, 'a[1].b.c'),
                expectedArr = [];

            expectedArr[1] = {b: {c: 'pizza'}};

            expect(prop.get()).toBe(undefined);
            expect(obj).toEqual({});

            prop.set('pizza');
            expect(obj).toEqual({a: expectedArr});
            expect(prop.get()).toBe('pizza');

            prop.set(null);
            expect(prop.get()).toBe(undefined);
            expect(obj).toEqual({a: []});
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

            for(var i=0; i<badProps.length; i++) {
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

            for(var i=0; i<badStr.length; i++) {
                expect(badProp(i)).toThrow('bad property string');
            }
        });
    });

    describe('coerce', function() {
        var coerce = Lib.coerce,
            out;

        // TODO: I tested font and string because I changed them, but all the other types need tests still

        it('should set a value and return the value it sets', function() {
            var aVal = 'aaaaah!',
                cVal = {1: 2, 3: 4},
                attrs = {a: {valType: 'any', dflt: aVal}, b: {c: {valType: 'any'}}},
                obj = {b: {c: cVal}},
                outObj = {},

                aOut = coerce(obj, outObj, attrs, 'a'),
                cOut = coerce(obj, outObj, attrs, 'b.c');

            expect(aOut).toBe(aVal);
            expect(aOut).toBe(outObj.a);
            expect(cOut).toBe(cVal);
            expect(cOut).toBe(outObj.b.c);
        });

        describe('string valType', function() {
            var dflt = 'Jabberwock',
                stringAttrs = {
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
                    .toEqual('1,2,3');

                expect(coerce({s: true}, {}, stringAttrs, 's'))
                    .toEqual('true');

                expect(coerce({s: {1: 2}}, {}, stringAttrs, 's'))
                    .toEqual('[object Object]'); // useless, but that's what it does!!
            });
        });

        describe('coerce2', function() {
            var coerce2 = Lib.coerce2;

            it('should set a value and return the value it sets when user input is valid', function() {
                var colVal = 'red',
                    sizeVal = 14,
                    attrs = {testMarker: {testColor: {valType: 'color', dflt: 'rgba(0, 0, 0, 0)'},
                                          testSize: {valType: 'number', dflt: 20}}},
                    obj = {testMarker: {testColor: colVal, testSize: sizeVal}},
                    outObj = {},
                    colOut = coerce2(obj, outObj, attrs, 'testMarker.testColor'),
                    sizeOut = coerce2(obj, outObj, attrs, 'testMarker.testSize');

                expect(colOut).toBe(colVal);
                expect(colOut).toBe(outObj.testMarker.testColor);
                expect(sizeOut).toBe(sizeVal);
                expect(sizeOut).toBe(outObj.testMarker.testSize);
            });

            it('should set and return the default if the user input is not valid', function() {
                var colVal = 'r',
                    sizeVal = 'aaaaah!',
                    attrs = {testMarker: {testColor: {valType: 'color', dflt: 'rgba(0, 0, 0, 0)'},
                                          testSize: {valType: 'number', dflt: 20}}},
                    obj = {testMarker: {testColor: colVal, testSize: sizeVal}},
                    outObj = {},
                    colOut = coerce2(obj, outObj, attrs, 'testMarker.testColor'),
                    sizeOut = coerce2(obj, outObj, attrs, 'testMarker.testSize');

                expect(colOut).toBe('rgba(0, 0, 0, 0)');
                expect(sizeOut).toBe(outObj.testMarker.testSize);
                expect(sizeOut).toBe(20);
                expect(sizeOut).toBe(outObj.testMarker.testSize);
            });

            it('should return false if there is no user input', function() {
                var colVal = null,
                    sizeVal = null,
                    attrs = {testMarker: {testColor: {valType: 'color', dflt: 'rgba(0, 0, 0, 0)'},
                                          testSize: {valType: 'number', dflt: 20}}},
                    obj = {testMarker: {testColor: colVal, testSize: sizeVal}},
                    outObj = {},
                    colOut = coerce2(obj, outObj, attrs, 'testMarker.testColor'),
                    sizeOut = coerce2(obj, outObj, attrs, 'testMarker.testSize');

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


        });
    });

    describe('coerceFont', function() {
        var fontAttrs = Plots.fontAttrs,
            extendFlat = Lib.extendFlat,
            coerceFont = Lib.coerceFont;

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
            var goodFamily = 'A fish', // for now any non-blank string is OK
                badFamily = 42,
                goodSize = 123.456,
                badSize = 'ginormous',
                goodColor = 'red',
                badColor = 'a dark and stormy night';

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

});
