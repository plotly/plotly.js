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
            expect(hoverData.xvals.length).toBe(1);
            expect(hoverData.yvals.length).toBe(1);
            expect(typeof hoverData.xvals[0]).toBe('number');
        })
        .then(done, done.fail);
    });

    it('does not fire on empty space by default', function(done) {
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
            expect(hoverData.points[0].x).toBe(2);
            expect(hoverData.points[0].y).toBe(3);
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

            var s = gd._fullLayout._size;
            click(s.l + 250, s.t + 50);

            expect(clickData).toBeDefined();
            expect(clickData.points).toEqual([]);
        })
        .then(done, done.fail);
    });

    it('does not fire on empty space by default', function(done) {
        var clickData;

        makePlot(gd).then(function() {
            gd.on('plotly_click', function(d) { clickData = d; });

            var s = gd._fullLayout._size;
            click(s.l + 250, s.t + 50);

            expect(clickData).toBeUndefined();
        })
        .then(done, done.fail);
    });
});
