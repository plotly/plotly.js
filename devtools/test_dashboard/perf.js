'use strict';

/*
 * timeit: tool for performance testing
 * f: function to be tested
 * n: number of timing runs
 * nchunk: optional number of repetitions per timing run - useful if
 *   the function is very fast. Note though that if arg is a function
 *   it will not be re-evaluated within the chunk, only before each chunk.
 * arg: optional argument to the function. Can be a function itself
 *   to provide a changing input to f
 */
window.timeit = function(f, n, nchunk, arg) {
    var times = new Array(n);
    var totalTime = 0;
    var _arg;
    var t0, t1, dt;

    for(var i = 0; i < n; i++) {
        if(typeof arg === 'function') _arg = arg();
        else _arg = arg;

        if(nchunk) {
            t0 = performance.now();
            for(var j = 0; j < nchunk; j++) { f(_arg); }
            t1 = performance.now();
            dt = (t1 - t0) / nchunk;
        } else {
            t0 = performance.now();
            f(_arg);
            t1 = performance.now();
            dt = t1 - t0;
        }

        times[i] = dt;
        totalTime += dt;
    }

    var first = (times[0]).toFixed(4);
    var last = (times[n - 1]).toFixed(4);
    times.sort(function(a, b) { return a - b; });
    var min = (times[0]).toFixed(4);
    var max = (times[n - 1]).toFixed(4);
    var median = (times[Math.min(Math.ceil(n / 2), n - 1)]).toFixed(4);
    var mean = (totalTime / n).toFixed(4);
    console.log((f.name || 'function') + ' timing (ms) - min: ' + min +
        '  max: ' + max +
        '  median: ' + median +
        '  mean: ' + mean +
        '  first: ' + first +
        '  last: ' + last
    );
};
