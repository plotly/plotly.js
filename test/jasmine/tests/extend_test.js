var extendModule = require('@src/lib/extend.js');
var extendFlat = extendModule.extendFlat;
var extendDeep = extendModule.extendDeep;
var extendDeepAll = extendModule.extendDeepAll;

var str = 'me a test',
    integer = 10,
    arr = [1, 'what', new Date(81, 8, 4)],
    date = new Date(81, 4, 13);

var Foo = function() {};

var obj = {
    str: str,
    integer: integer,
    arr: arr,
    date: date,
    constructor: 'fake',
    isPrototypeOf: 'not a function',
    foo: new Foo()
};

var deep = {
    ori: obj,
    layer: {
        integer: 10,
        str: 'str',
        date: new Date(84, 5, 12),
        arr: [101, 'dude', new Date(82, 10, 4)],
        deep: {
            str: obj.str,
            integer: integer,
            arr: obj.arr,
            date: new Date(81, 7, 4)
        }
    }
};

var undef = {
    str: undefined,
    layer: {
        date: undefined
    },
    arr: [1, 2, undefined]
};


describe('extendFlat', function() {
    'use strict';

    var ori, target;

    it('extends an array with an array', function() {
        ori = [1, 2, 3, 4, 5, 6];
        target = extendFlat(ori, arr);

        expect(ori).toEqual([1, 'what', new Date(81, 8, 4), 4, 5, 6]);
        expect(arr).toEqual([1, 'what', new Date(81, 8, 4)]);
        expect(target).toEqual([1, 'what', new Date(81, 8, 4), 4, 5, 6]);

    });

    it('extends an array with an array into a clone', function() {
        ori = [1, 2, 3, 4, 5, 6];
        target = extendFlat([], ori, arr);

        expect(ori).toEqual([1, 2, 3, 4, 5, 6]);
        expect(arr).toEqual([1, 'what', new Date(81, 8, 4)]);
        expect(target).toEqual([1, 'what', new Date(81, 8, 4), 4, 5, 6]);
    });

    it('extends an array with an object', function() {
        ori = [1, 2, 3, 4, 5, 6];
        target = extendFlat(ori, obj);

        expect(obj).toEqual({
            str: 'me a test',
            integer: 10,
            arr: [1, 'what', new Date(81, 8, 4)],
            date: new Date(81, 4, 13),
            constructor: 'fake',
            isPrototypeOf: 'not a function',
            foo: new Foo()
        });

        expect(ori.length).toEqual(6);
        expect(ori.str).toEqual('me a test');
        expect(ori.integer).toEqual(10);
        expect(ori.arr).toEqual([1, 'what', new Date(81, 8, 4)]);
        expect(ori.date).toEqual(new Date(81, 4, 13));

        expect(target.length).toEqual(6);
        expect(target.str).toEqual('me a test');
        expect(target.integer).toEqual(10);
        expect(target.arr).toEqual([1, 'what', new Date(81, 8, 4)]);
        expect(target.date).toEqual(new Date(81, 4, 13));
    });

    it('extends an object with an array', function() {
        ori = {
            str: 'no shit',
            integer: 76,
            arr: [1, 2, 3, 4],
            date: new Date(81, 7, 26)
        };
        target = extendFlat(ori, arr);

        expect(ori).toEqual({
            0: 1,
            1: 'what',
            2: new Date(81, 8, 4),
            str: 'no shit',
            integer: 76,
            arr: [1, 2, 3, 4],
            date: new Date(81, 7, 26)
        });
        expect(arr).toEqual([1, 'what', new Date(81, 8, 4)]);
        expect(target).toEqual({
            0: 1,
            1: 'what',
            2: new Date(81, 8, 4),
            str: 'no shit',
            integer: 76,
            arr: [1, 2, 3, 4],
            date: new Date(81, 7, 26)
        });
    });

    it('extends an object with another object', function() {
        ori = {
            str: 'no shit',
            integer: 76,
            arr: [1, 2, 3, 4],
            date: new Date(81, 7, 26),
            foo: 'bar'
        };
        target = extendFlat(ori, obj);

        expect(ori).toEqual({
            str: 'me a test',
            integer: 10,
            arr: [1, 'what', new Date(81, 8, 4)],
            date: new Date(81, 4, 13),
            constructor: 'fake',
            isPrototypeOf: 'not a function',
            foo: new Foo()
        });
        expect(obj).toEqual({
            str: 'me a test',
            integer: 10,
            arr: [1, 'what', new Date(81, 8, 4)],
            date: new Date(81, 4, 13),
            constructor: 'fake',
            isPrototypeOf: 'not a function',
            foo: new Foo()
        });
        expect(target).toEqual({
            str: 'me a test',
            integer: 10,
            arr: [1, 'what', new Date(81, 8, 4)],
            date: new Date(81, 4, 13),
            constructor: 'fake',
            isPrototypeOf: 'not a function',
            foo: new Foo()
        });
    });

    it('merges array keys', function() {
        var defaults = {
            arr: [1, 2, 3]
        };

        var override = {
            arr: ['x']
        };

        target = extendFlat(defaults, override);

        expect(defaults).toEqual({arr: ['x']});
        expect(override).toEqual({arr: ['x']});
        expect(target).toEqual({arr: ['x']});
    });

    it('ignores keys with undefined values', function() {
        ori = {};
        target = extendFlat(ori, undef);

        expect(ori).toEqual({
            layer: { date: undefined },
            arr: [1, 2, undefined]
        });
        expect(undef).toEqual({
            str: undefined,
            layer: {
                date: undefined
            },
            arr: [1, 2, undefined]
        });
        expect(target).toEqual({
            layer: { date: undefined },
            arr: [1, 2, undefined]
        });
    });

    it('does not handle null inputs', function() {
        expect(function() {
            extendFlat(null, obj);
        }).toThrowError(TypeError);
    });

    it('does not handle string targets', function() {
        expect(function() {
            extendFlat(null, obj);
        }).toThrowError(TypeError);
    });
});

describe('extendDeep', function() {
    'use strict';

    var ori, target;

    it('extends nested object with another nested object', function() {
        ori = {
            str: 'no shit',
            integer: 76,
            arr: [1, 2, 3, 4],
            date: new Date(81, 7, 26),
            layer: {
                deep: {
                    integer: 42
                }
            }
        };
        target = extendDeep(ori, deep);

        expect(ori).toEqual({
            str: 'no shit',
            integer: 76,
            arr: [1, 2, 3, 4],
            date: new Date(81, 7, 26),
            ori: {
                str: 'me a test',
                integer: 10,
                arr: [1, 'what', new Date(81, 8, 4)],
                date: new Date(81, 4, 13),
                constructor: 'fake',
                isPrototypeOf: 'not a function',
                foo: new Foo()
            },
            layer: {
                integer: 10,
                str: 'str',
                date: new Date(84, 5, 12),
                arr: [101, 'dude', new Date(82, 10, 4)],
                deep: {
                    str: 'me a test',
                    integer: 10,
                    arr: [1, 'what', new Date(81, 8, 4)],
                    date: new Date(81, 7, 4)
                }
            }
        });
        expect(deep).toEqual({
            ori: {
                str: 'me a test',
                integer: 10,
                arr: [1, 'what', new Date(81, 8, 4)],
                date: new Date(81, 4, 13),
                constructor: 'fake',
                isPrototypeOf: 'not a function',
                foo: new Foo()
            },
            layer: {
                integer: 10,
                str: 'str',
                date: new Date(84, 5, 12),
                arr: [101, 'dude', new Date(82, 10, 4)],
                deep: {
                    str: 'me a test',
                    integer: 10,
                    arr: [1, 'what', new Date(81, 8, 4)],
                    date: new Date(81, 7, 4)
                }
            }
        });
        expect(target).toEqual({
            str: 'no shit',
            integer: 76,
            arr: [1, 2, 3, 4],
            date: new Date(81, 7, 26),
            ori: {
                str: 'me a test',
                integer: 10,
                arr: [1, 'what', new Date(81, 8, 4)],
                date: new Date(81, 4, 13),
                constructor: 'fake',
                isPrototypeOf: 'not a function',
                foo: new Foo()
            },
            layer: {
                integer: 10,
                str: 'str',
                date: new Date(84, 5, 12),
                arr: [101, 'dude', new Date(82, 10, 4)],
                deep: {
                    str: 'me a test',
                    integer: 10,
                    arr: [1, 'what', new Date(81, 8, 4)],
                    date: new Date(81, 7, 4)
                }
            }
        });
    });

    it('doesn\'t modify source objects after setting the target', function() {
        ori = {
            str: 'no shit',
            integer: 76,
            arr: [1, 2, 3, 4],
            date: new Date(81, 7, 26),
            layer: {
                deep: {
                    integer: 42
                }
            }
        };
        target = extendDeep(ori, deep);
        target.layer.deep.integer = 100;

        expect(ori.layer.deep.integer).toEqual(100);
        expect(deep).toEqual({
            ori: {
                str: 'me a test',
                integer: 10,
                arr: [1, 'what', new Date(81, 8, 4)],
                date: new Date(81, 4, 13),
                constructor: 'fake',
                isPrototypeOf: 'not a function',
                foo: new Foo()
            },
            layer: {
                integer: 10,
                str: 'str',
                date: new Date(84, 5, 12),
                arr: [101, 'dude', new Date(82, 10, 4)],
                deep: {
                    str: 'me a test',
                    integer: 10,
                    arr: [1, 'what', new Date(81, 8, 4)],
                    date: new Date(81, 7, 4)
                }
            }
        });
    });

    it('merges array items', function() {
        var defaults = {
            arr: [1, 2, 3]
        };

        var override = {
            arr: ['x']
        };

        target = extendDeep(defaults, override);

        expect(defaults).toEqual({arr: ['x', 2, 3]});
        expect(override).toEqual({arr: ['x']});
        expect(target).toEqual({arr: ['x', 2, 3]});
    });

    it('ignores keys with undefined values', function() {
        ori = {};
        target = extendDeep(ori, undef);

        expect(ori).toEqual({
            layer: { },
            arr: [1, 2 ]
        });
        expect(undef).toEqual({
            str: undefined,
            layer: {
                date: undefined
            },
            arr: [1, 2, undefined]
        });
        expect(target).toEqual({
            layer: { },
            arr: [1, 2 ]
        });
    });

    it('does not handle circular structure', function() {
        var circ = { a: {b: null} };
        circ.a.b = circ;

        expect(function() {
            extendDeep({}, circ);
        }).toThrow();

        // results in an InternalError on Chrome and
        // a RangeError on Firefox
    });
});

describe('extendDeepAll', function() {
    'use strict';

    var ori;

    it('extends object with another other containing keys undefined values', function() {
        ori = {};
        extendDeepAll(ori, deep, undef);

        expect(ori.str).toBe(undefined);
        expect(ori.layer.date).toBe(undefined);
        expect(ori.arr[2]).toBe(undefined);
    });
});
