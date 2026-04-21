var Plotly = require('../../../lib/index');
var Fx = require('../../../src/components/fx');
var Lib = require('../../../src/lib');

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var click = require('../assets/click');


function makePlot(gd, layoutExtras) {
    return Plotly.newPlot(gd, [{
        x: [1, 2, 3],
        y: [1, 3, 2],
        type: 'scatter',
        mode: 'markers'
    }], Lib.extendFlat({
        width: 400, height: 400,
        margin: {l: 50, t: 50, r: 50, b: 50},
        xaxis: {range: [0, 10]},
        yaxis: {range: [0, 10]},
        hovermode: 'closest'
    }, layoutExtras || {}));
}

describe('hoveranywhere', function() {
    'use strict';

    var gd;

    beforeEach(function() { gd = createGraphDiv(); });
    afterEach(destroyGraphDiv);

    function _hover(xPixel, yPixel) {
        var bb = gd.getBoundingClientRect();
        var s = gd._fullLayout._size;
        Fx.hover(gd, {
            clientX: xPixel + bb.left + s.l,
            clientY: yPixel + bb.top + s.t,
            target: gd.querySelector('.nsewdrag')
        }, 'xy');
        Lib.clearThrottle();
    }

    it('emits plotly_hover with coordinate data on empty space', function(done) {
        var hoverData;

        makePlot(gd, {hoveranywhere: true}).then(function() {
            gd.on('plotly_hover', function(d) { hoverData = d; });

            // hover over empty area (no data points nearby)
            _hover(250, 50);

            expect(hoverData).toBeDefined();
            expect(hoverData.points).toEqual([]);
            expect(hoverData.xaxes.length).toBe(1);
            expect(hoverData.yaxes.length).toBe(1);
            expect(hoverData.xaxes[0]._id).toBe('x');
            expect(hoverData.yaxes[0]._id).toBe('y');
            expect(hoverData.xvals.length).toBe(1);
            expect(hoverData.yvals.length).toBe(1);
            expect(hoverData.xvals[0]).toBeCloseTo(250 / 30, 2);
            expect(hoverData.yvals[0]).toBeCloseTo(10 - 50 / 30, 2);
        })
        .then(done, done.fail);
    });

    it('does not emit plotly_hover event on empty space when hoveranywhere is false', function(done) {
        var hoverData;

        makePlot(gd).then(function() {
            gd.on('plotly_hover', function(d) { hoverData = d; });
            _hover(250, 50);
            expect(hoverData).toBeUndefined();
        })
        .then(done, done.fail);
    });

    it('still returns normal point data on traces', function(done) {
        var hoverData;

        makePlot(gd, {hoveranywhere: true}).then(function() {
            gd.on('plotly_hover', function(d) { hoverData = d; });

            // hover near (2, 3)
            _hover(60, 210);

            expect(hoverData.points.length).toBe(1);
            var pt = hoverData.points[0];
            expect(pt.x).toBe(2);
            expect(pt.y).toBe(3);
            expect(pt.curveNumber).toBe(0);
            expect(pt.pointNumber).toBe(1);
            // xPixel/yPixel: plot-area px + margin (60+50=110, 210+50=260)
            expect(pt.xPixel).toBeCloseTo(110, 1);
            expect(pt.yPixel).toBeCloseTo(260, 1);
            // bbox is page-relative (xPixel/yPixel + graph div page offset);
            // center of bbox should equal xPixel/yPixel + page offset
            var gLeft = gd.offsetLeft + gd.clientLeft;
            var gTop = gd.offsetTop + gd.clientTop;
            expect(pt.bbox).toBeDefined();
            expect((pt.bbox.x0 + pt.bbox.x1) / 2).toBeCloseTo(110 + gLeft, 1);
            expect((pt.bbox.y0 + pt.bbox.y1) / 2).toBeCloseTo(260 + gTop, 1);
            expect(pt.bbox.x0).toBeLessThan(pt.bbox.x1);
            expect(pt.bbox.y0).toBeLessThan(pt.bbox.y1);
            expect(hoverData.xaxes.length).toBe(1);
            expect(hoverData.yaxes.length).toBe(1);
            expect(hoverData.xvals.length).toBe(1);
            expect(hoverData.yvals.length).toBe(1);
            expect(hoverData.xvals[0]).toBeCloseTo(2, 2);
            expect(hoverData.yvals[0]).toBeCloseTo(3, 2);
        })
        .then(done, done.fail);
    });

    it('respects hovermode:false', function(done) {
        var hoverData;

        makePlot(gd, {hoveranywhere: true, hovermode: false}).then(function() {
            gd.on('plotly_hover', function(d) { hoverData = d; });
            _hover(250, 50);
            expect(hoverData).toBeUndefined();
        })
        .then(done, done.fail);
    });
});

describe('clickanywhere', function() {
    'use strict';

    var gd;

    beforeEach(function() { gd = createGraphDiv(); });
    afterEach(destroyGraphDiv);

    it('emits plotly_click with empty points on empty space', function(done) {
        var clickData;

        makePlot(gd, {clickanywhere: true}).then(function() {
            gd.on('plotly_click', function(d) { clickData = d; });

            var bb = gd.getBoundingClientRect();
            var s = gd._fullLayout._size;
            click(bb.left + s.l + 250, bb.top + s.t + 50);

            expect(clickData).toBeDefined();
            expect(clickData.points).toEqual([]);
            expect(clickData.xaxes.length).toBe(1);
            expect(clickData.yaxes.length).toBe(1);
            expect(clickData.xvals.length).toBe(1);
            expect(clickData.yvals.length).toBe(1);
            // click at 250px into 300px plot area, xrange [0,10]: 250/300*10 = 8.33
            expect(clickData.xvals[0]).toBeCloseTo(250 / 30, 2);
            // click at 50px into 300px plot area, yrange [0,10]: 10 - 50/300*10 = 8.33
            expect(clickData.yvals[0]).toBeCloseTo(10 - 50 / 30, 2);
        })
        .then(done, done.fail);
    });

    it('does not emit plotly_click event on empty space when clickanywhere is false', function(done) {
        var clickData;

        makePlot(gd).then(function() {
            gd.on('plotly_click', function(d) { clickData = d; });

            var bb = gd.getBoundingClientRect();
            var s = gd._fullLayout._size;
            click(bb.left + s.l + 250, bb.top + s.t + 50);

            expect(clickData).toBeUndefined();
        })
        .then(done, done.fail);
    });
});
