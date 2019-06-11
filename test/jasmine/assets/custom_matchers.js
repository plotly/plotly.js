/*
 * custom_matchers - to be included in karma.conf.js, so it can
 * add these matchers to jasmine globally and all suites have access.
 */

'use strict';

var isNumeric = require('fast-isnumeric');
var isPlainObject = require('../../../src/lib/is_plain_object');
var extendDeep = require('../../../src/lib/extend').extendDeep;
var deepEqual = require('deep-equal');

var matchers = {
    // toEqual except with sparse arrays populated. This arises because:
    //
    //   var x = new Array(2)
    //   expect(x).toEqual([undefined, undefined])
    //
    // will fail assertion even though x[0] === undefined and x[1] === undefined.
    // This is because the array elements don't exist until assigned. Of course it
    // only fails on *some* platforms (old firefox, looking at you), which is why
    // this is worth all the footwork.
    toLooseDeepEqual: function() {
        function populateUndefinedArrayEls(x) {
            var i;
            if(Array.isArray(x)) {
                for(i = 0; i < x.length; i++) {
                    if(x[i] === undefined) x[i] = undefined;
                }
            } else if(isPlainObject(x)) {
                var keys = Object.keys(x);
                for(i = 0; i < keys.length; i++) {
                    populateUndefinedArrayEls(x[keys[i]]);
                }
            }
            return x;
        }

        return {
            compare: function(actual, expected, msgExtra) {
                var actualExpanded = populateUndefinedArrayEls(extendDeep({}, actual));
                var expectedExpanded = populateUndefinedArrayEls(extendDeep({}, expected));

                var passed = deepEqual(actualExpanded, expectedExpanded);

                var message = [
                    'Expected', JSON.stringify(actual), 'to be close to', JSON.stringify(expected), msgExtra
                ].join(' ');

                return {
                    pass: passed,
                    message: message
                };
            }
        };
    },

    toBeCloseToArray: function() {
        return {
            compare: function(actual, expected, precision, msgExtra) {
                var testFn = makeIsCloseFn(coercePosition(precision));
                var passed = assertArray(actual, expected, testFn);

                var message = [
                    'Expected', actual, 'to be close to', expected, msgExtra
                ].join(' ');

                return {
                    pass: passed,
                    message: message
                };
            }
        };
    },

    toBeCloseTo2DArray: function() {
        return {
            compare: function(actual, expected, precision, msgExtra) {
                var testFn = makeIsCloseFn(coercePosition(precision));
                var passed = assert2DArray(actual, expected, testFn);

                var message = [
                    'Expected',
                    arrayToStr(actual.map(arrayToStr)),
                    'to be close to',
                    arrayToStr(expected.map(arrayToStr)),
                    msgExtra
                ].join('\n');

                return {
                    pass: passed,
                    message: message
                };
            }
        };
    },

    toBeWithin: function() {
        return {
            compare: function(actual, expected, tolerance, msgExtra) {
                var testFn = makeIsWithinFn(tolerance);
                var passed = testFn(actual, expected);

                var message = [
                    'Expected', actual,
                    'to be close to', expected,
                    'within', tolerance,
                    msgExtra
                ].join(' ');

                return {
                    pass: passed,
                    message: message
                };
            }
        };
    },

    toBeWithinArray: function() {
        return {
            compare: function(actual, expected, tolerance, msgExtra) {
                var testFn = makeIsWithinFn(tolerance);
                var passed = assertArray(actual, expected, testFn);

                var message = [
                    'Expected', actual,
                    'to be close to', expected,
                    'within', tolerance,
                    msgExtra
                ].join(' ');

                return {
                    pass: passed,
                    message: message
                };
            }
        };
    },

    toBeClassed: function() {
        return {
            compare: function(node, _expected, msgExtra) {
                var actual = node.classList;
                var expected = Array.isArray(_expected) ? _expected : [_expected];

                var passed = (
                    actual.length === expected.length &&
                    expected.every(function(e) { return actual.contains(e); })
                );

                var message = [
                    'Expected classList', '[' + actual + ']',
                    'to have classes', expected,
                    msgExtra
                ].join(' ');

                return {
                    pass: passed,
                    message: message
                };
            }
        };
    }
};

function assertArray(actual, expected, testFn) {
    if(Array.isArray(actual) && Array.isArray(expected)) {
        var tested = actual.map(function(element, i) {
            return testFn(element, expected[i]);
        });

        return (
            expected.length === actual.length &&
            tested.indexOf(false) < 0
        );
    }
    return false;
}

function assert2DArray(actual, expected, testFn) {
    if(expected.length !== actual.length) return false;

    for(var i = 0; i < expected.length; i++) {
        if(expected[i].length !== actual[i].length) {
            return false;
        }

        for(var j = 0; j < expected[i].length; j++) {
            if(!testFn(actual[i][j], expected[i][j])) {
                return false;
            }
        }
    }
    return true;
}

function makeIsCloseFn(precision) {
    return function isClose(actual, expected) {
        if(isNumeric(actual) && isNumeric(expected)) {
            return Math.abs(actual - expected) < precision;
        }
        return (
            actual === expected ||
            (isNaN(actual) && isNaN(expected))
        );
    };
}

function makeIsWithinFn(tolerance) {
    return function isWithin(actual, expected) {
        if(isNumeric(actual) && isNumeric(expected)) {
            return Math.abs(actual - expected) < tolerance;
        }
        return (
            actual === expected ||
            (isNaN(actual) && isNaN(expected))
        );
    };
}

function coercePosition(precision) {
    if(precision !== 0) {
        precision = Math.pow(10, -precision) / 2 || 0.005;
    }

    return precision;
}

function arrayToStr(array) {
    return '[' + array.join(', ') + ']';
}

beforeAll(function() {
    jasmine.addMatchers(matchers);
});
