var Lib = require('@src/lib');

suite('Benchmark: lib functions', function() {
    benchmark('Lib.cleanNumber', function() {
        [
            0, 1, 2, 1234.567,
            -1, -100, -999.999,
            Number.MAX_VALUE, Number.MIN_VALUE, Number.EPSILON,
            -Number.MAX_VALUE, -Number.MIN_VALUE, -Number.EPSILON,
            NaN, Infinity, -Infinity, null, undefined, new Date(), '',
            ' ', '\t', '2\t2', '2%2', '2$2', {1: 2}, [1], ['1'], {}, []
        ]
        .forEach(Lib.cleanNumber);
    });

    benchmark('Lib.hovertemplateString', function() {
        Lib.hovertemplateString('%{x}', {xLabel: '234.0'}, false);
    });
});
