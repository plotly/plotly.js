'use strict';

/**
 * Errors thrown in promise 'then'-s fail silently unless handled e.g. this way. A silent failure would probably
 * make at least some of the test assertions to be bypassed, i.e. a clean jasmine test run could result even if
 * some assertions were to fail, had the error been removed.
 *
 * @example
 *
 *       Plotly.newPlot(...)
 *           .then(function(gd) {
 *               assert(...);
 *               assert(...);
 *            })
 *            .catch(failTest)
 *            .then(done);
 *
 *    See ./with_setup_teardown.js for a different example.
 */
module.exports = function failTest(error) {
    if(error === undefined) {
        expect(error).not.toBeUndefined();
    } else {
        expect(error).toBeUndefined();
    }
    if(error && error.stack) {
        console.error(error.stack);
    }
};
