var d3Select = require('../../strict-d3').select;
var d3SelectAll = require('../../strict-d3').selectAll;

var Plotly = require('../../../lib/index');
var Fx = require('../../../src/components/fx');
var Lib = require('../../../src/lib');


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
        var _mock = Lib.extendDeep({}, require('../../image/mocks/19.json'));
        _mock.layout.xaxis.spikesnap = 'data';
        _mock.layout.xaxis.showspikes = true;
        _mock.layout.xaxis.spikemode = spikemode;
        _mock.layout.yaxis.spikesnap = 'data';
        _mock.layout.yaxis.showspikes = true;
        _mock.layout.yaxis.spikemode = spikemode + '+marker';
        _mock.layout.xaxis2.spikesnap = 'data';
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

    function _setHovermode(hovermode) {
        return Plotly.relayout(gd, 'hovermode', hovermode);
    }

    function _setSpikedistance(spikedistance) {
        return Plotly.relayout(gd, 'spikedistance', spikedistance);
    }

    function _assert(lineExpect, circleExpect) {
        var TOL = 5;
        var lines = d3SelectAll('line.spikeline');
        var circles = d3SelectAll('circle.spikeline');

        expect(lines.size()).toBe(lineExpect.length * 2, '# of line nodes');
        expect(circles.size()).toBe(circleExpect.length, '# of circle nodes');

        lines.each(function(_, i) {
            var sel = d3Select(this);
            ['x1', 'y1', 'x2', 'y2'].forEach(function(d, j) {
                expect(sel.attr(d))
                    // we always have 2 lines with identical coords
                    .toBeWithin(lineExpect[Math.floor(i / 2)][j], TOL, 'line ' + i + ' attr ' + d);
            });
        });

        circles.each(function(_, i) {
            var sel = d3Select(this);
            ['cx', 'cy'].forEach(function(d, j) {
                expect(sel.attr(d))
                    .toBeWithin(circleExpect[i][j], TOL, 'circle ' + i + ' attr ' + d);
            });
        });
    }

    it('draws lines and markers on enabled axes in the closest hovermode', function(done) {
        var _mock = makeMock('toaxis', 'closest');

        Plotly.newPlot(gd, _mock).then(function() {
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
        .then(done, done.fail);
    });

    it('works the same for scattergl', function(done) {
        var _mock = makeMock('toaxis', 'closest');
        _mock.data[0].type = 'scattergl';
        _mock.data[1].type = 'scattergl';

        Plotly.newPlot(gd, _mock).then(function() {
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
        .then(done, done.fail);
    });

    it('draws lines and markers on enabled axes w/o tick labels', function(done) {
        var _mock = makeMock('toaxis', 'closest');

        _mock.layout.xaxis.showticklabels = false;
        _mock.layout.yaxis.showticklabels = false;

        Plotly.newPlot(gd, _mock).then(function() {
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
        .then(done, done.fail);
    });

    it('draws lines and markers on enabled axes in the x hovermode', function(done) {
        var _mock = makeMock('across', 'x');

        Plotly.newPlot(gd, _mock).then(function() {
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
        .then(done, done.fail);
    });

    it('draws lines up to x-axis position', function(done) {
        Plotly.newPlot(gd, [
            { y: [1, 2, 1] },
            { y: [2, 1, 2], yaxis: 'y2' }
        ], {
            // here the x-axis is drawn at the middle of the graph
            xaxis: { showspike: true, spikemode: 'toaxis' },
            yaxis: { domain: [0.5, 1] },
            yaxis2: { anchor: 'x', domain: [0, 0.5] },
            width: 400,
            height: 400
        })
        .then(function() {
            _hover({xval: 1, yval: 2});
            // from "y" of x-axis up to "y" of pt
            _assert([[189, 210.5, 189, 109.25]], []);
        })
        .then(function() { return Plotly.relayout(gd, 'xaxis.spikemode', 'across'); })
        .then(function() {
            _hover({xval: 1, yval: 2});
            // from "y" of xy subplot top, down to "y" xy2 subplot bottom
            _assert([[189, 100, 189, 320]], []);
        })
        .then(done, done.fail);
    });

    it('draws lines up to y-axis position - anchor free case', function(done) {
        Plotly.newPlot(gd, [
            { y: [1, 2, 1] },
            { y: [2, 1, 2], xaxis: 'x2' }
        ], {
            yaxis: { domain: [0.5, 1] },
            xaxis2: {
                anchor: 'free', position: 0, overlaying: 'x',
                showspikes: true, spikemode: 'across'
            },
            width: 400,
            height: 400,
            showlegend: false
        })
        .then(function() {
            _hover({xval: 0, yval: 2}, 'x2y');
            // from "y" of pt, down to "y" of x2 axis
            _assert([[95.75, 100, 95.75, 320]], []);
        })
        .then(function() { return Plotly.relayout(gd, 'xaxis2.position', 0.6); })
        .then(function() {
            _hover({xval: 0, yval: 2}, 'x2y');
            // from "y" of pt, down to "y" of x axis (which is further down)
            _assert([[95.75, 100, 95.75, 210]], []);
        })
        .then(done, done.fail);
    });

    it('draws lines up to y-axis position', function(done) {
        Plotly.newPlot(gd, [
            { y: [1, 2, 1] },
            { y: [2, 1, 2], xaxis: 'x2' }
        ], {
            // here the y-axis is drawn at the middle of the graph,
            // with xy subplot to the right and xy2 to the left
            yaxis: { showspike: true, spikemode: 'toaxis' },
            xaxis: { domain: [0.5, 1] },
            xaxis2: { anchor: 'y', domain: [0, 0.5] },
            width: 400,
            height: 400,
            showlegend: false
        })
        .then(function() {
            _hover({xval: 1, yval: 2});
            // from "x" of y-axis to "x" of pt
            _assert([[199.5, 114.75, 260, 114.75]], []);
        })
        .then(function() { return Plotly.relayout(gd, 'yaxis.spikemode', 'across'); })
        .then(function() {
            _hover({xval: 1, yval: 2});
            // from "x" at xy2 subplot left, to "x" at xy subplot right
            _assert([[80, 114.75, 320, 114.75]], []);
        })
        .then(done, done.fail);
    });

    it('draws lines up to y-axis position - anchor free case', function(done) {
        Plotly.newPlot(gd, [
            { y: [1, 2, 1] },
            { y: [2, 1, 2], yaxis: 'y2' }
        ], {
            xaxis: { domain: [0.5, 1] },
            yaxis2: {
                anchor: 'free', position: 0, overlaying: 'y',
                showspikes: true, spikemode: 'across'
            },
            width: 400,
            height: 400,
            showlegend: false
        })
        .then(function() {
            _hover({xval: 0, yval: 2}, 'xy2');
            // from "x" of y2 axis to "x" of pt
            _assert([[80, 114.75, 320, 114.75]], []);
        })
        .then(function() { return Plotly.relayout(gd, 'yaxis2.position', 0.6); })
        .then(function() {
            _hover({xval: 0, yval: 2}, 'xy2');
            // from "x" of y axis (which is further left) to "x" of pt
            _assert([[200, 114.75, 320, 114.75]], []);
        })
        .then(done, done.fail);
    });

    it('draws lines and markers on enabled axes in the spikesnap "cursor" mode', function(done) {
        var _mock = makeMock('toaxis', 'x');

        _mock.layout.xaxis.spikesnap = 'cursor';
        _mock.layout.yaxis.spikesnap = 'cursor';
        _mock.layout.xaxis2.spikesnap = 'cursor';

        Plotly.newPlot(gd, _mock)
        .then(function() {
            _setSpikedistance(200);
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
        .then(done, done.fail);
    });

    it('does not show spikes if no points are hovered in the spikesnap "hovered data" mode', function(done) {
        var _mock = makeMock('toaxis', 'x');
        Plotly.newPlot(gd, _mock)
        .then(function() {
            _hover({xval: 1.5});
            _assert(
                [[558, 401, 558, 251], [80, 251, 558, 251]], [[83, 251]]
            );
            return Plotly.relayout(gd, 'xaxis.spikesnap', 'hovered data');
        })
        .then(function() {
            _hover({xval: 1.5});
            _assert([[80, 251, 558, 251]], [[83, 251]]);

            return Plotly.relayout(gd, 'yaxis.spikesnap', 'hovered data');
        })
        .then(function() {
            _hover({xval: 1.5});
            _assert([], []);
        })
        .then(done, done.fail);
    });

    it('doesn\'t switch between toaxis and across spikemodes on switching the hovermodes', function(done) {
        var _mock = makeMock('toaxis', 'closest');

        Plotly.newPlot(gd, _mock).then(function() {
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

            _setHovermode('x');
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
        .then(done, done.fail);
    });

    it('increase the range of search for points to draw the spikelines on spikedistance change', function(done) {
        var _mock = makeMock('toaxis', 'closest');
        _mock.layout.spikedistance = 20;

        Plotly.newPlot(gd, _mock).then(function() {
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

            _setSpikedistance(200);
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
        .then(done, done.fail);
    });

    it('correctly responds to setting the spikedistance to -1 by increasing ' +
        'the range of search for points to draw the spikelines to Infinity', function(done) {
        var _mock = makeMock('toaxis', 'closest');

        Plotly.newPlot(gd, _mock).then(function() {
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

            _setSpikedistance(20);
        })
        .then(function() {
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
        })
        .then(done, done.fail);
    });

    it('correctly select the closest bar even when setting spikedistance to -1 (case of x hovermode)', function(done) {
        var mock = require('../../image/mocks/bar_stack-with-gaps');
        var mockCopy = Lib.extendDeep({}, mock);
        mockCopy.layout.xaxis.showspikes = true;
        mockCopy.layout.yaxis.showspikes = true;
        mockCopy.layout.spikedistance = -1;
        mockCopy.layout.hovermode = 'x';

        Plotly.newPlot(gd, mockCopy)
        .then(function() {
            _hover({xpx: 600, ypx: 400});
            var lines = d3SelectAll('line.spikeline');
            expect(lines.size()).toBe(4);
            expect(lines[0][1].getAttribute('stroke')).toBe('#2ca02c');

            _hover({xpx: 600, ypx: 100});
            lines = d3SelectAll('line.spikeline');
            expect(lines.size()).toBe(4);
            expect(lines[0][1].getAttribute('stroke')).toBe('#2ca02c');
        })
        .then(done, done.fail);
    });

    it('correctly select the closest bar even when setting spikedistance to -1 (case of closest hovermode)', function(done) {
        var mock = require('../../image/mocks/bar_stack-with-gaps');
        var mockCopy = Lib.extendDeep({}, mock);
        mockCopy.layout.xaxis.showspikes = true;
        mockCopy.layout.yaxis.showspikes = true;
        mockCopy.layout.xaxis.spikesnap = 'data';
        mockCopy.layout.yaxis.spikesnap = 'data';
        mockCopy.layout.spikedistance = -1;
        mockCopy.layout.hovermode = 'closest';

        Plotly.newPlot(gd, mockCopy)
        .then(function() {
            _hover({xpx: 600, ypx: 400});
            var lines = d3SelectAll('line.spikeline');
            expect(lines.size()).toBe(4);
            expect(lines[0][1].getAttribute('stroke')).toBe('#1f77b4');

            _hover({xpx: 600, ypx: 100});
            lines = d3SelectAll('line.spikeline');
            expect(lines.size()).toBe(4);
            expect(lines[0][1].getAttribute('stroke')).toBe('#2ca02c');
        })
        .then(done, done.fail);
    });

    it('could select the closest scatter point inside bar', function(done) {
        Plotly.newPlot(gd, {
            data: [{
                type: 'scatter',
                marker: { color: 'green' },
                x: [
                    -1,
                    0,
                    0.5,
                    1
                ],
                y: [
                    0.1,
                    0.2,
                    0.25,
                    0.3
                ]
            },
            {
                type: 'bar',
                marker: { color: 'blue' },
                x: [
                    -1,
                    -0.2,
                    1
                ],
                y: [
                    1,
                    2,
                    0.5
                ]
            }],
            layout: {
                spikedistance: 20,
                hovermode: 'x',
                xaxis: { showspikes: true },
                yaxis: { showspikes: true },
                showlegend: false,
                width: 500,
                height: 500,
                margin: {
                    t: 50,
                    b: 50,
                    l: 50,
                    r: 50,
                }
            }
        })
        .then(function() {
            var lines;

            _hover({xpx: 200, ypx: 200});
            lines = d3SelectAll('line.spikeline');
            expect(lines.size()).toBe(4);
            expect(lines[0][1].getAttribute('stroke')).toBe('green');

            _hover({xpx: 200, ypx: 350});
            lines = d3SelectAll('line.spikeline');
            expect(lines.size()).toBe(4);
            expect(lines[0][1].getAttribute('stroke')).toBe('green');

            _hover({xpx: 300, ypx: 350});
            lines = d3SelectAll('line.spikeline');
            expect(lines.size()).toBe(4);
            expect(lines[0][1].getAttribute('stroke')).toBe('blue');
        })
        .then(done, done.fail);
    });

    it('correctly responds to setting the spikedistance to 0 by disabling ' +
        'the search for points to draw the spikelines', function(done) {
        var _mock = makeMock('toaxis', 'closest');

        Plotly.newPlot(gd, _mock).then(function() {
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

            _setSpikedistance(0);
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
        .then(done, done.fail);
    });

    function spikeLayout() {
        return {
            width: 600, height: 600, margin: {l: 100, r: 100, t: 100, b: 100},
            showlegend: false,
            spikedistance: 20,
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
        .then(function() { _setHovermode('closest'); })
        .then(_assertBarSpikes)
        .then(done, done.fail);
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
        .then(done, done.fail);
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
        .then(done, done.fail);
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
        .then(done, done.fail);
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
        .then(done, done.fail);
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
        .then(done, done.fail);
    });

    it('correctly draws lines up to the winning point', function(done) {
        Plotly.newPlot(gd, [
            {type: 'bar', y: [5, 7, 9, 6, 4, 3]},
            {y: [5, 7, 9, 6, 4, 3], marker: {color: 'green'}},
            {y: [5, 7, 9, 6, 4, 3], marker: {color: 'red'}}
        ], {
            hovermode: 'x',
            xaxis: {showspikes: true},
            yaxis: {showspikes: true},
            spikedistance: -1,
            width: 400, height: 400,
            showlegend: false
        })
        .then(function() {
            _hover({xpx: 150, ypx: 250});

            var lines = d3SelectAll('line.spikeline');
            expect(lines.size()).toBe(4);
            expect(lines[0][1].getAttribute('stroke')).toBe('green');
            expect(lines[0][3].getAttribute('stroke')).toBe('green');
        })
        .then(done, done.fail);
    });

    describe('works across all cartesian traces', function() {
        var schema = Plotly.PlotSchema.get();
        var traces = Object.keys(schema.traces);
        var tracesSchema = [];
        var i, j, k;
        for(i = 0; i < traces.length; i++) {
            tracesSchema.push(schema.traces[traces[i]]);
        }
        var excludedTraces = [ 'image' ];
        var cartesianTraces = tracesSchema.filter(function(t) {
            return t.categories.length &&
                t.categories.indexOf('cartesian') !== -1 &&
                t.categories.indexOf('noHover') === -1 &&
                excludedTraces.indexOf(t.type) === -1;
        });

        function makeData(type, axName, a, b) {
            var input = [a, b];
            var cat = input[axName === 'yaxis' ? 1 : 0];
            var data = input[axName === 'yaxis' ? 0 : 1];

            var measure = [];
            for(j = 0; j < data.length; j++) {
                measure.push('absolute');
            }

            var z = Lib.init2dArray(cat.length, data.length);
            for(j = 0; j < z.length; j++) {
                for(k = 0; k < z[j].length; k++) {
                    z[j][k] = 0;
                }
            }
            if(axName === 'xaxis') {
                for(j = 0; j < b.length; j++) {
                    z[0][j] = b[j];
                }
            }
            if(axName === 'yaxis') {
                for(j = 0; j < b.length; j++) {
                    z[j][0] = b[j];
                }
            }

            return Lib.extendDeep({}, {
                orientation: axName === 'yaxis' ? 'h' : 'v',
                type: type,
                x: cat,
                a: cat,

                b: data,
                y: data,
                z: z,

                // For OHLC
                open: data,
                close: data,
                high: data,
                low: data,

                // For histogram
                nbinsx: cat.length,
                nbinsy: data.length,

                // For waterfall
                measure: measure,

                // For splom
                dimensions: [
                    {
                        label: 'DimensionA',
                        values: a
                    },
                    {
                        label: 'DimensionB',
                        values: b
                    }
                ]
            });
        }

        cartesianTraces.forEach(function(trace) {
            it('correctly responds to setting the spikedistance to -1 for ' + trace.type, function(done) {
                var type = trace.type;
                var x = [4, 5, 6];
                var data = [7, 2, 3];

                var mock = {
                    data: [makeData(type, 'xaxis', x, data)],
                    layout: {
                        spikedistance: -1,
                        xaxis: {showspikes: true, spikesnap: 'data'},
                        yaxis: {showspikes: true, spikesnap: 'data'},
                        zaxis: {showspikes: true, spikesnap: 'data'},
                        title: {text: trace.type},
                        width: 400, height: 400
                    }
                };

                Plotly.newPlot(gd, mock)
                    .then(function() {
                        _hover({xpx: 200, ypx: 100});

                        var lines = d3SelectAll('line.spikeline');
                        expect(lines.size()).toBe(4);
                    })
                    .then(done, done.fail);
            });
        });
    });
});
