module.exports = {

    // toBeCloseTo... but for arrays
    toBeCloseToArray: function() {
        return {
            compare: function(actual, expected, precision) {
                precision = coercePosition(precision);

                var tested = actual.map(function(element, i) {
                    return Math.abs(expected[i] - element) < precision;
                });

                var passed = (
                    expected.length === actual.length &&
                    tested.indexOf(false) < 0
                );

                return {
                    pass: passed,
                    message: 'Expected ' + actual + ' to be close to ' + expected + '.'
                };
            }
        };
    },

    // toBeCloseTo... but for 2D arrays
    toBeCloseTo2DArray: function() {
        return {
            compare: function(actual, expected, precision) {
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
                            var isClose = Math.abs(expected[i][j] - actual[i][j]) < precision;

                            if(!isClose) {
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
                    arrayToStr(expected.map(arrayToStr))
                ].join(' ');

                return {
                    pass: passed,
                    message: message
                };
            }
        };
    }
};

function coercePosition(precision) {
    if(precision !== 0) {
        precision = Math.pow(10, -precision) / 2 || 0.005;
    }

    return precision;
}

function arrayToStr(array) {
    return '[ ' + array.join(', ') + ' ]';
}
