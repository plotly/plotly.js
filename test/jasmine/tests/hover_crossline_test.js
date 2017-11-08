var d3 = require('d3');

var Plotly = require('@lib/index');
var Fx = require('@src/components/fx');
var Lib = require('@src/lib');

var fail = require('../assets/fail_test');
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');

describe('crossline', function() {
    'use strict';

    afterEach(destroyGraphDiv);

    describe('hover', function() {
        var gd;

        function makeMock() {
            var _mock = Lib.extendDeep({}, require('@mocks/19.json'));
            _mock.layout.xaxis.showcrossline = true;
            _mock.layout.yaxis.showcrossline = true;
            _mock.layout.xaxis2.showcrossline = true;
            _mock.layout.hovermode = 'closest';
            return _mock;
        }

        function _hover(evt, subplot) {
            Fx.hover(gd, evt, subplot);
            Lib.clearThrottle();
        }

        function _assert(lineExpect) {
            var TOL = 5;
            var lines = d3.selectAll('line.crossline');

            expect(lines.size()).toBe(lineExpect.length, '# of line nodes');

            lines.each(function(_, i) {
                var sel = d3.select(this);
                ['x1', 'y1', 'x2', 'y2'].forEach(function(d, j) {
                    expect(sel.attr(d))
                        .toBeWithin(lineExpect[i][j], TOL, 'line ' + i + ' attr ' + d);
                });
            });
        }

        it('draws lines and markers on enabled axes in the closest hovermode', function(done) {
            gd = createGraphDiv();
            var _mock = makeMock();

            Plotly.plot(gd, _mock).then(function() {
                _hover({xval: 2, yval: 3}, 'xy');
                _assert(
                    [[80, 250, 1033, 250], [557, 100, 557, 401]]
                );
            })
            .then(function() {
                _hover({xval: 30, yval: 40}, 'x2y2');
                _assert(
                    [[651, 167, 985, 167], [820, 115, 820, 220]]
                );
            })
            .catch(fail)
            .then(done);
        });

        it('draws lines and markers on enabled axes in the x hovermode', function(done) {
            gd = createGraphDiv();
            var _mock = makeMock();

            _mock.layout.hovermode = 'x';

            Plotly.plot(gd, _mock).then(function() {
                _hover({xval: 2, yval: 3}, 'xy');
                _assert(
                    [[80, 250, 1033, 250], [557, 100, 557, 401]]
                );
            })
            .then(function() {
                _hover({xval: 30, yval: 40}, 'x2y2');
                _assert(
                    [[651, 167, 985, 167], [820, 115, 820, 220]]
                );
            })
            .catch(fail)
            .then(done);
        });

        it('draws lines and markers on enabled axes in the y hovermode', function(done) {
            gd = createGraphDiv();
            var _mock = makeMock();

            _mock.layout.hovermode = 'y';

            Plotly.plot(gd, _mock).then(function() {
                _hover({xval: 2, yval: 3}, 'xy');
                _assert(
                    [[80, 250, 1033, 250], [557, 100, 557, 401]]
                );
            })
            .then(function() {
                _hover({xval: 30, yval: 40}, 'x2y2');
                _assert(
                    [[652, 167, 985, 167], [820, 115, 820, 220]]
                );
            })
            .catch(fail)
            .then(done);
        });

        it('does not draw lines and markers on enabled axes if spikes are enabled on the same axes', function(done) {
            gd = createGraphDiv();
            var _mock = makeMock();

            _mock.layout.xaxis.showspikes = true;

            Plotly.plot(gd, _mock).then(function() {
                _hover({xval: 2, yval: 3}, 'xy');
                _assert(
                    [[80, 250, 1033, 250]]
                );
            })
            .then(function() {
                _hover({xval: 30, yval: 40}, 'x2y2');
                _assert(
                    [[652, 167, 985, 167]]
                );
            })
            .catch(fail)
            .then(done);
        });

        it('does not draw lines and markers on enabled axes if spikes are enabled on the same axes', function(done) {
            gd = createGraphDiv();
            var _mock = makeMock();

            _mock.layout.yaxis.showspikes = true;

            Plotly.plot(gd, _mock).then(function() {
                _hover({xval: 2, yval: 3}, 'xy');
                _assert(
                    [[557, 100, 557, 401]]
                );
            })
            .then(function() {
                _hover({xval: 30, yval: 40}, 'x2y2');
                _assert(
                    [[818, 115, 818, 220]]
                );
            })
            .catch(fail)
            .then(done);
        });

        it('draws lines and markers on enabled axes w/o tick labels', function(done) {
            gd = createGraphDiv();
            var _mock = makeMock();

            _mock.layout.xaxis.showticklabels = false;
            _mock.layout.yaxis.showticklabels = false;

            Plotly.plot(gd, _mock).then(function() {
                _hover({xval: 2, yval: 3}, 'xy');
                _assert(
                    [[80, 250, 1033, 250], [557, 100, 557, 401]]
                );
            })
            .then(function() {
                _hover({xval: 30, yval: 40}, 'x2y2');
                _assert(
                    [[652, 167, 985, 167], [820, 115, 820, 220]]
                );
            })
            .catch(fail)
            .then(done);
        });
    });
});
