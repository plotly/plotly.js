/* global Plotly:false */
describe('Test lib.js:', function() {
    describe('parseDate() should', function() {
        it('return false on bad (number) input:', function() {
            expect(Plotly.Lib.parseDate(0)).toBe(false);
        });
        it('return false on bad (string) input:', function() {
            expect(Plotly.Lib.parseDate('toto')).toBe(false);
        });
        it('work with yyyy-mm-dd string input:', function() {
            var input = '2014-12-01',
                res = Plotly.Lib.parseDate(input),
                res0 = new Date(2014, 11, 1);
            expect(res.getTime()).toEqual(res0.getTime());
        });
        it('work with mm/dd/yyyy string input:', function() {
            var input = '12/01/2014',
                res = Plotly.Lib.parseDate(input),
                res0 = new Date(2014, 11, 1);
            expect(res.getTime()).toEqual(res0.getTime());
        });
        it('work with yyyy-mm-dd HH:MM:SS.sss string input:', function() {
            var input = '2014-12-01 09:50:05.124',
                res = Plotly.Lib.parseDate(input),
                res0 = new Date(2014, 11, 1, 9, 50, 5, 124);
            expect(res.getTime()).toEqual(res0.getTime());
        });
        it('work with mm/dd/yyyy HH:MM:SS string input:', function() {
            var input = '2014-12-01 09:50:05',
                res = Plotly.Lib.parseDate(input),
                res0 = new Date(2014, 11, 1, 9, 50, 5);
            expect(res.getTime()).toEqual(res0.getTime());
        });
    });

    describe('interp() should', function() {
        it('return 1.75 as Q1 of [1, 2, 3, 4, 5]:', function() {
            var input = [1, 2, 3, 4, 5],
                res = Plotly.Lib.interp(input, 0.25),
                res0 = 1.75;
            expect(res).toEqual(res0);
        });
        it('return 4.25 as Q3 of [1, 2, 3, 4, 5]:', function() {
            var input = [1, 2, 3, 4, 5],
                res = Plotly.Lib.interp(input, 0.75),
                res0 = 4.25;
            expect(res).toEqual(res0);
        });
        it('error if second input argument is a string:', function() {
            var input = [1, 2, 3, 4, 5];
            expect(function() {
                Plotly.Lib.interp(input, 'apple');
            }).toThrow('n should be a finite number');
        });
        it('error if second input argument is a date:', function() {
            var in1 = [1, 2, 3, 4, 5],
                in2 = new Date(2014, 11, 1);
            expect(function() {
                Plotly.Lib.interp(in1, in2);
            }).toThrow('n should be a finite number');
        });
        it('return the right boundary on input [-Inf, Inf]:', function() {
            var input = [-Infinity, Infinity],
                res = Plotly.Lib.interp(input, 1),
                res0 = Infinity;
            expect(res).toEqual(res0);
        });
    });

    describe('mean() should', function() {
        it('toss out non-numerics (strings):', function() {
            var input = [1, 2, 'apple', 'orange'],
                res = Plotly.Lib.mean(input);
            expect(res).toEqual(1.5);
        });
        it('toss out non-numerics (NaN):', function() {
            var input = [1, 2, NaN],
                res = Plotly.Lib.mean(input);
            expect(res).toEqual(1.5);
        });
        it('evaluate numbers which are passed around as text strings:', function() {
            var input = ['1', '2'],
                res = Plotly.Lib.mean(input);
            expect(res).toEqual(1.5);
        });
    });

    describe('variance() should', function() {
        it('return 0 on input [2, 2, 2, 2, 2]:', function() {
            var input = [2, 2, 2, 2],
                res = Plotly.Lib.variance(input);
            expect(res).toEqual(0);
        });
        it('return 2/3 on input [-1, 0, 1]:', function() {
            var input = [-1, 0, 1],
                res = Plotly.Lib.variance(input);
            expect(res).toEqual(2/3);
        });
        it('toss out non-numerics (strings):', function() {
            var input = [1, 2, 'apple', 'orange'],
                res = Plotly.Lib.variance(input);
            expect(res).toEqual(0.25);
        });
        it('toss out non-numerics (NaN):', function() {
            var input = [1, 2, NaN],
                res = Plotly.Lib.variance(input);
            expect(res).toEqual(0.25);
        });
    });

    describe('stdev() should', function() {
        it('return 0 on input [2, 2, 2, 2, 2]:', function() {
            var input = [2, 2, 2, 2],
                res = Plotly.Lib.stdev(input);
            expect(res).toEqual(0);
        });
        it('return sqrt(2/3) on input [-1, 0, 1]:', function() {
            var input = [-1, 0, 1],
                res = Plotly.Lib.stdev(input);
            expect(res).toEqual(Math.sqrt(2/3));
        });
        it('toss out non-numerics (strings):', function() {
            var input = [1, 2, 'apple', 'orange'],
                res = Plotly.Lib.stdev(input);
            expect(res).toEqual(0.5);
        });
        it('toss out non-numerics (NaN):', function() {
            var input = [1, 2, NaN],
                res = Plotly.Lib.stdev(input);
            expect(res).toEqual(0.5);
        });
    });

    describe('nestedProperty', function() {
        var np = Plotly.Lib.nestedProperty;

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
            expect(function(){ np(obj, 'arr[-1]'); }).toThrow('bad property string');
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

        it('should have no empty sub-containers', function() {
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
            expect(obj).toEqual({});
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

    describe('extendFlat', function() {
        var extendFlat = Plotly.Lib.extendFlat;

        it('it should extend 2 objects with mutually exclusive keys)', function() {
            var obj1 = {a: 'A'},
                obj2 = {b: 'B'},
                objOut = extendFlat(obj1, obj2);
            expect(obj1).toEqual({a: 'A'});
            expect(objOut).toEqual({a: 'A', b: 'B'});
        });

        it('it should extend 2 objects with overlapping keys)', function() {
            var obj1 = {a: 'A'},
                obj2 = {a: 'AA'},
                objOut = extendFlat(obj1, obj2);
            expect(obj1).toEqual({a: 'A'});
            expect(objOut).toEqual({a: 'AA'});
        });

    });
});

