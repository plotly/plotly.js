var d3 = require('d3');

var Plotly = require('@lib/index');
var Fx = require('@src/components/fx');
var Lib = require('@src/lib');

var fail = require('../assets/fail_test');
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');

describe('spikeline', function() {
    'use strict';

    afterEach(destroyGraphDiv);

    describe('hover', function() {
        var gd;

        function makeMock() {
            var _mock = Lib.extendDeep({}, require('@mocks/19.json'));
            _mock.layout.xaxis.showspikes = true;
            _mock.layout.xaxis.spikemode = 'toaxis';
            _mock.layout.yaxis.showspikes = true;
            _mock.layout.yaxis.spikemode = 'toaxis+marker';
            _mock.layout.xaxis2.showspikes = true;
            _mock.layout.xaxis2.spikemode = 'toaxis';
            _mock.layout.hovermode = 'closest';
            return _mock;
        }

        function _hover(evt, subplot) {
            Fx.hover(gd, evt, subplot);
            Lib.clearThrottle();
        }

        function _assert(lineExpect, circleExpect) {
            var TOL = 5;
            var lines = d3.selectAll('line.spikeline');
            var circles = d3.selectAll('circle.spikeline');

            expect(lines.size()).toBe(lineExpect.length, '# of line nodes');
            expect(circles.size()).toBe(circleExpect.length, '# of circle nodes');

            lines.each(function(_, i) {
                var sel = d3.select(this);
                ['x1', 'y1', 'x2', 'y2'].forEach(function(d, j) {
                    expect(sel.attr(d))
                        .toBeWithin(lineExpect[i][j], TOL, 'line ' + i + ' attr ' + d);
                });
            });

            circles.each(function(_, i) {
                var sel = d3.select(this);
                ['cx', 'cy'].forEach(function(d, j) {
                    expect(sel.attr(d))
                        .toBeWithin(circleExpect[i][j], TOL, 'circle ' + i + ' attr ' + d);
                });
            });
        }

        it('draws lines and markers on enabled axes', function(done) {
            gd = createGraphDiv();
            var _mock = makeMock();

            Plotly.plot(gd, _mock).then(function() {
                _hover({xval: 2, yval: 3}, 'xy');
                _assert(
                    [[557, 401, 557, 250], [557, 401, 557, 250], [80, 250, 557, 250], [80, 250, 557, 250]],
                    [[83, 250]]
                );
            })
            .then(function() {
                _hover({xval: 30, yval: 40}, 'x2y2');
                _assert(
                    [[820, 220, 820, 167], [820, 220, 820, 167]],
                    []
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
                    [[557, 401, 557, 250], [557, 401, 557, 250], [80, 250, 557, 250], [80, 250, 557, 250]],
                    [[83, 250]]
                );
            })
            .then(function() {
                _hover({xval: 30, yval: 40}, 'x2y2');
                _assert(
                    [[820, 220, 820, 167], [820, 220, 820, 167]],
                    []
                );
            })
            .catch(fail)
            .then(done);
        });
    });
});
