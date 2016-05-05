'use strict';

var Plotly = require('@lib/index');

var createGraphDiv = require('./create_graph_div');
var destroyGraphDiv = require('./destroy_graph_div');

var failTest = require('./fail_test');

function teardown(gd) {

    Plotly.purge(gd);

    destroyGraphDiv();

}

/**
 *  Provides a safe means of setting up and tearing down a plot (which may or may not have WebGL elements).
 *  It is a self-contained alternative to the manual setup/teardown process, which uses:
 *    - createGraphDiv in the beforeEach, assigning it to global variable gd
 *    - purg, destroyGraphDiv in the afterEach
 *
 *    In theory we could incorporate a .then(done) clause here, as well as a ./failTest but there may be
 *    test cases that want to call done() manually inside a testing function or somewhere in a .then
 *
 *    @param {Function} runner  A function that runs tests, taking two arguments: 'gd' and 'done'
 *                              withSetupTeardown binds the newly setup graph div to gd and
 *                              calls the graph div teardown before calling done. Therefore the actual
 *                              test case doesn't need to know where gd comes from, and can call 'done()'
 *                              as usual.
 *    @param {Function} done    The 'done' function that gets passed to the testcase (describe or it)
 *                              for the purpose of handling asynchronous tests (typically invoked as the
 *                              last expression in the last .then or window.timeout of the test case
 *
 *    @example
 *
 *            it('should respond to drag interactions with mock of unset camera', done => {
 *                       withSetupTeardown(done, (gd, done) => {
 *                               makePlot(gd, require('@mocks/myMock.json'))
 *                                   .then(gd => {
 *                                       expect(...);
 *                                       expect(...);
 *                                       expect(...);
 *                                       done(); // best ignored, as we still do a failTest and then(done)
 *                                   })
 *                           }
 *                       );
 *                   });
 *
 */
module.exports = function withSetupTeardown(done, runner) {

    var gd = createGraphDiv();

    // Passing a teardown-inducing 'done' as a second, optional argument makes possible those test cases where
    // the test writer wants to explicitly call 'done', e.g. at the end of a window.setTimeout - cleanup must
    // happen in this case too.
    var possibleThenable = runner(gd, function() {
        teardown(gd);
        done();
    });

    // A test case can only be called 'done' after the teardown had been performed.
    // One way of helping ensure that the destroys are not forgotten is that done() is part of
    // the teardown, consequently if a test case omits the teardown by accident, the test will
    // visibly hang. If the teardown receives no proper arguments, it'll also visibly fail.

    if(possibleThenable && possibleThenable.then && typeof possibleThenable.then === 'function') {

        return possibleThenable
            // needs to catch via failTest otherwise errors inside the .then silently fail (tests may fail to fail)
            .then(null, failTest) // current linter balks on .catch with 'dot-notation'; fixme a linter
            .then(function() {
                teardown(gd);
            })
            .then(done);

    } else {

        return possibleThenable;

    }
};
