module.exports = {

    // toBeCloseTo... but for arrays
    toBeCloseToArray: function() {
        return {
            compare: function(actual, expected, precision) {
                if(precision !== 0) {
                    precision = Math.pow(10, -precision) / 2 || 0.005;
                }

                var tested = actual.map(function(element, i) {
                    return Math.abs(expected[i] - element) < precision;
                });

                var passed = tested.indexOf(false) < 0;

                return {
                    pass: passed,
                    message: 'Expected ' + actual + ' to be close to ' + expected + '.'
                };
            }
        };
    }
};
