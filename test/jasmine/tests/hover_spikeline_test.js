var d3 = require('d3');

var Plotly = require('@lib/index');
var Fx = require('@src/components/fx');
var Lib = require('@src/lib');

var failTest = require('../assets/fail_test');
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');

describe('spikeline hover', function() {
    'use strict';

    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(destroyGraphDiv);

    function makeMock(spikemode, hovermode) {
        var _mock = Lib.extendDeep({}, require('@mocks/19.json'));
        _mock.layout.xaxis.showspikes = true;
        _mock.layout.xaxis.spikemode = spikemode;
        _mock.layout.yaxis.showspikes = true;
        _mock.layout.yaxis.spikemode = spikemode + '+marker';
        _mock.layout.xaxis2.showspikes = true;
        _mock.layout.xaxis2.spikemode = spikemode;
        _mock.layout.hovermode = hovermode;
        return _mock;
    }

    function _hover(evt, subplot) {
        if(!subplot) subplot = 'xy';
        Fx.hover(gd, evt, subplot);
        Lib.clearThrottle();
    }

    function _set_hovermode(hovermode) {
        return Plotly.relayout(gd, 'hovermode', hovermode);
    }

    function _set_spikedistance(spikedistance) {
        return Plotly.relayout(gd, 'spikedistance', spikedistance);
    }

    function _assert(lineExpect, circleExpect) {
        var TOL = 5;
        var lines = d3.selectAll('line.spikeline');
        var circles = d3.selectAll('circle.spikeline');

        expect(lines.size()).toBe(lineExpect.length * 2, '# of line nodes');
        expect(circles.size()).toBe(circleExpect.length, '# of circle nodes');

        lines.each(function(_, i) {
            var sel = d3.select(this);
            ['x1', 'y1', 'x2', 'y2'].forEach(function(d, j) {
                expect(sel.attr(d))
                    // we always have 2 lines with identical coords
                    .toBeWithin(lineExpect[Math.floor(i / 2)][j], TOL, 'line ' + i + ' attr ' + d);
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

    it('draws lines and markers on enabled axes in the closest hovermode', function(done) {
        var _mock = makeMock('toaxis', 'closest');

        Plotly.plot(gd, _mock).then(function() {
            _hover({xval: 2, yval: 3});
            _assert(
                [[557, 401, 557, 250], [80, 250, 557, 250]],
                [[83, 250]]
            );

            _hover({xval: 30, yval: 40}, 'x2y2');
            _assert(
                [[820, 220, 820, 167]],
                []
            );
        })
        .catch(failTest)
        .then(done);
    });

    it('works the same for scattergl', function(done) {
        var _mock = makeMock('toaxis', 'closest');
        _mock.data[0].type = 'scattergl';
        _mock.data[1].type = 'scattergl';

        Plotly.plot(gd, _mock).then(function() {
            _hover({xval: 2, yval: 3});
            _assert(
                [[557, 401, 557, 250], [80, 250, 557, 250]],
                [[83, 250]]
            );

            _hover({xval: 30, yval: 40}, 'x2y2');
            _assert(
                [[820, 220, 820, 167]],
                []
            );
        })
        .catch(failTest)
        .then(done);
    });

    it('draws lines and markers on enabled axes w/o tick labels', function(done) {
        var _mock = makeMock('toaxis', 'closest');

        _mock.layout.xaxis.showticklabels = false;
        _mock.layout.yaxis.showticklabels = false;

        Plotly.plot(gd, _mock).then(function() {
            _hover({xval: 2, yval: 3});
            _assert(
                [[557, 401, 557, 250], [80, 250, 557, 250]],
                [[83, 250]]
            );

            _hover({xval: 30, yval: 40}, 'x2y2');
            _assert(
                [[820, 220, 820, 167]],
                []
            );
        })
        .catch(failTest)
        .then(done);
    });

    it('draws lines and markers on enabled axes in the x hovermode', function(done) {
        var _mock = makeMock('across', 'x');

        Plotly.plot(gd, _mock).then(function() {
            _hover({xval: 2, yval: 3});
            _assert(
                [[557, 100, 557, 401], [80, 250, 1036, 250]],
                [[83, 250]]
            );

            _hover({xval: 30, yval: 40}, 'x2y2');
            _assert(
                [[820, 116, 820, 220]],
                []
            );
        })
        .catch(failTest)
        .then(done);
    });

    it('draws lines and markers on enabled axes in the spikesnap "cursor" mode', function(done) {
        var _mock = makeMock('toaxis', 'x');

        _mock.layout.xaxis.spikesnap = 'cursor';
        _mock.layout.yaxis.spikesnap = 'cursor';
        _mock.layout.xaxis2.spikesnap = 'cursor';

        Plotly.plot(gd, _mock)
        .then(function() {
            _set_spikedistance(200);
        })
        .then(function() {
            _hover({xpx: 120, ypx: 180});
            _assert(
                [[200, 401, 200, 280], [80, 280, 200, 280]],
                [[83, 280]]
            );

            _hover({xpx: 31, ypx: 41}, 'x2y2');
            _assert(
                [[682, 220, 682, 156]],
                []
            );
        })
        .catch(failTest)
        .then(done);
    });

    it('doesn\'t switch between toaxis and across spikemodes on switching the hovermodes', function(done) {
        var _mock = makeMock('toaxis', 'closest');

        Plotly.plot(gd, _mock).then(function() {
            _hover({xval: 2, yval: 3});
            _assert(
                [[557, 401, 557, 250], [80, 250, 557, 250]],
                [[83, 250]]
            );

            _hover({xval: 30, yval: 40}, 'x2y2');
            _assert(
                [[820, 220, 820, 167]],
                []
            );

            _set_hovermode('x');
        })
        .then(function() {
            _hover({xval: 2, yval: 3});
            _assert(
                [[557, 401, 557, 250], [80, 250, 557, 250]],
                [[83, 250]]
            );

            _hover({xval: 30, yval: 40}, 'x2y2');
            _assert(
                [[820, 220, 820, 167]],
                []
            );
        })
        .catch(failTest)
        .then(done);
    });

    it('increase the range of search for points to draw the spikelines on spikedistance change', function(done) {
        var _mock = makeMock('toaxis', 'closest');

        Plotly.plot(gd, _mock).then(function() {
            _hover({xval: 1.6, yval: 2.6});
            _assert(
                [],
                []
            );

            _hover({xval: 26, yval: 36}, 'x2y2');
            _assert(
                [],
                []
            );

            _set_spikedistance(200);
        })
        .then(function() {
            _hover({xval: 1.6, yval: 2.6});
            _assert(
                [[557, 401, 557, 250], [80, 250, 557, 250]],
                [[83, 250]]
            );

            _hover({xval: 26, yval: 36}, 'x2y2');
            _assert(
                [[820, 220, 820, 167]],
                []
            );
        })
        .catch(failTest)
        .then(done);
    });

    it('correctly responds to setting the spikedistance to -1 by increasing ' +
        'the range of search for points to draw the spikelines to Infinity', function(done) {
        var _mock = makeMock('toaxis', 'closest');

        Plotly.plot(gd, _mock).then(function() {
            _hover({xval: 1.6, yval: 2.6});
            _assert(
                [],
                []
            );

            _hover({xval: 26, yval: 36}, 'x2y2');
            _assert(
                [],
                []
            );

            _set_spikedistance(-1);
        })
        .then(function() {
            _hover({xval: 1.6, yval: 2.6});
            _assert(
                [[557, 401, 557, 250], [80, 250, 557, 250]],
                [[83, 250]]
            );

            _hover({xval: 26, yval: 36}, 'x2y2');
            _assert(
                [[820, 220, 820, 167]],
                []
            );
        })
        .catch(failTest)
        .then(done);
    });

    it('correctly responds to setting the spikedistance to 0 by disabling ' +
        'the search for points to draw the spikelines', function(done) {
        var _mock = makeMock('toaxis', 'closest');

        Plotly.plot(gd, _mock).then(function() {
            _hover({xval: 2, yval: 3});
            _assert(
                [[557, 401, 557, 250], [80, 250, 557, 250]],
                [[83, 250]]
            );

            _hover({xval: 30, yval: 40}, 'x2y2');
            _assert(
                [[820, 220, 820, 167]],
                []
            );

            _set_spikedistance(0);
        })
        .then(function() {
            _hover({xval: 2, yval: 3});
            _assert(
                [],
                []
            );

            _hover({xval: 30, yval: 40}, 'x2y2');
            _assert(
                [],
                []
            );
        })
        .catch(failTest)
        .then(done);
    });

    function spikeLayout() {
        return {
            width: 600, height: 600, margin: {l: 100, r: 100, t: 100, b: 100},
            showlegend: false,
            xaxis: {range: [-0.5, 1.5], showspikes: true, spikemode: 'toaxis+marker'},
            yaxis: {range: [-1, 3], showspikes: true, spikemode: 'toaxis+marker'},
            hovermode: 'x',
            boxmode: 'group', barmode: 'group', violinmode: 'group'
        };
    }

    it('positions spikes at the data value on grouped bars', function(done) {
        function _assertBarSpikes() {
            // regardless of hovermode, you must be actually over the bar to see its spikes
            _hover({xval: -0.2, yval: 0.8});
            _assert(
                [[200, 500, 200, 300], [100, 300, 200, 300]],
                [[200, 500], [100, 300]]
            );

            _hover({xval: -0.2, yval: 1.2});
            _assert([], []);

            _hover({xval: 0.2, yval: 1.8});
            _assert(
                [[200, 500, 200, 200], [100, 200, 200, 200]],
                [[200, 500], [100, 200]]
            );

            _hover({xval: 0.2, yval: 2.2});
            _assert([], []);
        }

        Plotly.newPlot(gd, [{
            type: 'bar', y: [1, 2]
        }, {
            type: 'bar', y: [2, 1]
        }], spikeLayout())
        .then(_assertBarSpikes)
        .then(function() { _set_hovermode('closest'); })
        .then(_assertBarSpikes)
        .catch(failTest)
        .then(done);
    });

    it('positions spikes at the data value on grouped boxes', function(done) {
        Plotly.newPlot(gd, [{
            type: 'box', x: [0, 0, 0, 0, 1, 1, 1, 1], y: [0, 0, 1, 1, 0, 0, 1, 1], boxpoints: 'all'
        }, {
            type: 'box', x: [0, 0, 0, 0, 1, 1, 1, 1], y: [2, 2, 1, 1, 2, 2, 1, 1]
        }], spikeLayout())
        .then(function() {
            // over the box: median line @ (0, 0.5)
            _hover({xval: -0.1, yval: 0.1});
            _assert(
                [[200, 500, 200, 350], [100, 350, 200, 350]],
                [[200, 500], [100, 350]]
            );

            // point hover @ (0, 0)
            _hover({xval: -0.4, yval: 0.1});
            _assert(
                [[200, 500, 200, 400], [100, 400, 200, 400]],
                [[200, 500], [100, 400]]
            );
        })
        .catch(failTest)
        .then(done);
    });

    it('positions spikes correctly on grouped violins', function(done) {
        Plotly.newPlot(gd, [{
            type: 'violin', x: [0, 0, 0, 0, 1, 1, 1, 1], y: [0, 0, 1, 1, 0, 0, 1, 1], side: 'positive', points: 'all'
        }, {
            type: 'violin', x: [0, 0, 0, 0, 1, 1, 1, 1], y: [2, 2, 1, 1, 2, 2, 1, 1], side: 'positive'
        }], spikeLayout())
        .then(function() {
            // over the violin: KDE @ (0, 0.2)
            _hover({xval: -0.15, yval: 0.2});
            _assert(
                [[200, 500, 200, 380], [100, 380, 200, 380]],
                [[200, 500], [100, 380]]
            );

            // off the violin, not quite at the points
            _hover({xval: -0.2, yval: 0.2});
            _assert([], []);

            // over a point
            _hover({xval: -0.4, yval: 0.2});
            _assert(
                [[200, 500, 200, 400], [100, 400, 200, 400]],
                [[200, 500], [100, 400]]
            );
        })
        .catch(failTest)
        .then(done);
    });

    it('positions spikes correctly on heatmaps', function(done) {
        Plotly.newPlot(gd, [{
            type: 'heatmap', x: [0, 1], y: [0, 2], z: [[1, 2], [3, 4]]
        }], spikeLayout())
        .then(function() {
            // heatmap bricks go past the x/y bounds
            _hover({xval: -0.1, yval: 0.2});
            _assert(
                [[200, 500, 200, 400], [100, 400, 200, 400]],
                [[200, 500], [100, 400]]
            );
        })
        .catch(failTest)
        .then(done);
    });

    it('positions spikes correctly on contour maps', function(done) {
        Plotly.newPlot(gd, [{
            type: 'contour', x: [0, 1], y: [0, 2], z: [[1, 2], [3, 4]]
        }], spikeLayout())
        .then(function() {
            // contour doesn't draw past the x/y bounds
            _hover({xval: -0.1, yval: 0.2});
            _assert([], []);

            _hover({xval: 0.1, yval: 0.2});
            _assert(
                [[200, 500, 200, 400], [100, 400, 200, 400]],
                [[200, 500], [100, 400]]
            );
        })
        .catch(failTest)
        .then(done);
    });

    it('does not show spikes on scatter fills', function(done) {
        Plotly.newPlot(gd, [{
            x: [0, 0, 1, 1, 0], y: [0, 2, 2, 0, 0], fill: 'toself'
        }], Lib.extendFlat({}, spikeLayout(), {hovermode: 'closest'}))
        .then(function() {
            // center of the fill: no spikes
            _hover({xval: 0.5, yval: 1});
            _assert([], []);

            // sanity check: points still generate spikes
            _hover({xval: 0, yval: 0});
            _assert(
                [[200, 500, 200, 400], [100, 400, 200, 400]],
                [[200, 500], [100, 400]]
            );
        })
        .catch(failTest)
        .then(done);
    });
});
