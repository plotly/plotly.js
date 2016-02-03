var Lib = require('@src/lib');

describe('isPlainObject', function() {
    'use strict';

    var isPlainObject = Lib.isPlainObject;

    function A() {}

    var shouldPass = [
        {},
        {a: 'A', 'B': 'b'}
    ];

    var shouldFail = [
        A,
        new A(),
        document,
        window,
        null,
        undefined,
        [],
        'string',
        true,
        false,
        NaN,
        Infinity,
        /foo/,
        '\n',
        new Array(10),
        new Date(),
        new RegExp('foo'),
        new String('string')
    ];

    shouldPass.forEach(function(obj) {
        it('treats ' + JSON.stringify(obj) + ' as a plain object', function() {
            expect(isPlainObject(obj)).toBe(true);
        });
    });

    shouldFail.forEach(function(obj) {
        it('treats ' + JSON.stringify(obj!==window ? obj: 'window') + ' as NOT a plain object', function() {
            expect(isPlainObject(obj)).toBe(false);
        });
    });
});
