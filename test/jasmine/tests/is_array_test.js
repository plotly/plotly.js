var Lib = require('../../../src/lib');

describe('isArrayOrTypedArray', function() {
    function A() {}

    var buffer = new ArrayBuffer(2);
    var dv = new DataView(buffer);

    var shouldPass = [
        [],
        new Array(10),
        new Float32Array(1),
        new Int32Array([1, 2, 3])
    ];

    var shouldFail = [
        A,
        new A(),
        document,
        window,
        null,
        undefined,
        'string',
        true,
        false,
        NaN,
        Infinity,
        /foo/,
        '\n',
        new Date(),
        new RegExp('foo'),
        new String('string'),
        dv
    ];

    shouldPass.forEach(function(obj) {
        it('treats ' + JSON.stringify(obj) + ' as an array', function() {
            expect(Lib.isArrayOrTypedArray(obj)).toBe(true);
        });
    });

    shouldFail.forEach(function(obj) {
        it('treats ' + JSON.stringify(obj !== window ? obj : 'window') + ' as NOT an array', function() {
            expect(Lib.isArrayOrTypedArray(obj)).toBe(false);
        });
    });
});

describe('isTypedArray', function() {
    function A() {}

    var buffer = new ArrayBuffer(2);
    var dv = new DataView(buffer);

    var shouldPass = [
        new Float32Array(1),
        new Int32Array([1, 2, 3])
    ];

    var shouldFail = [
        new Array(10),
        [],
        A,
        new A(),
        document,
        window,
        null,
        undefined,
        'string',
        true,
        false,
        NaN,
        Infinity,
        /foo/,
        '\n',
        new Date(),
        new RegExp('foo'),
        new String('string'),
        dv
    ];

    shouldPass.forEach(function(obj) {
        it('treats ' + JSON.stringify(obj) + ' as an array', function() {
            expect(Lib.isTypedArray(obj)).toBe(true);
        });
    });

    shouldFail.forEach(function(obj) {
        it('treats ' + JSON.stringify(obj !== window ? obj : 'window') + ' as NOT an array', function() {
            expect(Lib.isTypedArray(obj)).toBe(false);
        });
    });
});
