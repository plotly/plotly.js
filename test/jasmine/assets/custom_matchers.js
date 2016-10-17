'use strict';

var isNumeric = require('fast-isnumeric');
var Lib = require('@src/lib');
var deepEqual = require('deep-equal');

module.exports = {
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
                    x[i] = x[i];
                }
            } else if(Lib.isPlainObject(x)) {
                var keys = Object.keys(x);
                for(i = 0; i < keys.length; i++) {
                    populateUndefinedArrayEls(x[keys[i]]);
                }
            }
            return x;
        }

        return {
            compare: function(actual, expected, msgExtra) {
                var actualExpanded = populateUndefinedArrayEls(Lib.extendDeep({}, actual));
                var expectedExpanded = populateUndefinedArrayEls(Lib.extendDeep({}, expected));

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

    // toBeCloseTo... but for arrays
    toBeCloseToArray: function() {
        return {
            compare: function(actual, expected, precision, msgExtra) {
                precision = coercePosition(precision);

                var tested = actual.map(function(element, i) {
                    return isClose(element, expected[i], precision);
                });

                var passed = (
                    expected.length === actual.length &&
                    tested.indexOf(false) < 0
                );

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

    // toBeCloseTo... but for 2D arrays
    toBeCloseTo2DArray: function() {
        return {
            compare: function(actual, expected, precision, msgExtra) {
                precision = coercePosition(precision);

                var passed = true;

                if(expected.length !== actual.length) passed = false;
                else {
                    for(var i = 0; i < expected.length; ++i) {
                        if(expected[i].length !== actual[i].length) {
                            passed = false;
                            break;
                        }

                        for(var j = 0; j < expected[i].length; ++j) {
                            if(!isClose(actual[i][j], expected[i][j], precision)) {
                                passed = false;
                                break;
                            }
                        }
                    }
                }

                var message = [
                    'Expected',
                    arrayToStr(actual.map(arrayToStr)),
                    'to be close to',
                    arrayToStr(expected.map(arrayToStr)),
                    msgExtra
                ].join(' ');

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
                var passed = Math.abs(actual - expected) < tolerance;

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
    }
};

function isClose(actual, expected, precision) {
    if(isNumeric(actual) && isNumeric(expected)) {
        return Math.abs(actual - expected) < precision;
    }

    return actual === expected;
}

function coercePosition(precision) {
    if(precision !== 0) {
        precision = Math.pow(10, -precision) / 2 || 0.005;
    }

    return precision;
}

function arrayToStr(array) {
    return '[ ' + array.join(', ') + ' ]';
}
