var Plotly = require('@lib/index');
var Lib = require('@src/lib');

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var customMatchers = require('../assets/custom_matchers');
var fail = require('../assets/fail_test.js');

// cartesian click events events use the hover data
// from the mousemove events and then simulate
// a click event on mouseup
var click = require('../assets/timed_click');
var hover = require('../assets/hover');

// contourgl is not part of the dist plotly.js bundle initially
Plotly.register([
    require('@lib/contourgl')
]);

var mock1 = require('@mocks/gl2d_14.json');
var mock2 = require('@mocks/gl2d_pointcloud-basic.json');

var mock3 = {
    data: [{
        type: 'contourgl',
        z: [
            [10, 10.625, 12.5, 15.625, 20],
            [5.625, 6.25, 8.125, 11.25, 15.625],
            [2.5, 3.125, 5, 8.125, 12.5],
            [0.625, 1.25, 3.125, 6.25, 10.625],
            [0, 0.625, 2.5, 5.625, 10]
        ],
        colorscale: 'Jet',
        // contours: { start: 2, end: 10, size: 1 },
        zmin: 0,
        zmax: 20
    }],
    layout: {}
};

var mock4 = {
    data: [{
        x: [1, 2, 3, 4],
        y: [12, 3, 14, 4],
        type: 'scattergl',
        mode: 'markers'
    }, {
        x: [4, 5, 6, 7],
        y: [1, 31, 24, 14],
        type: 'scattergl',
        mode: 'markers'
    }, {
        x: [8, 9, 10, 11],
        y: [18, 13, 10, 3],
        type: 'scattergl',
        mode: 'markers'
    }],
    layout: {}
};

describe('Test hover and click interactions', function() {
    var gd;

    // need to wait a little bit before canvas can properly catch mouse events
    function wait() {
        return new Promise(function(resolve) {
            setTimeout(resolve, 100);
        });
    }

    function makeHoverFn(gd, x, y) {
        return function() {
            return new Promise(function(resolve) {
                gd.on('plotly_hover', resolve);
                hover(x, y);
            });
        };
    }

    function makeClickFn(gd, x, y) {
        return function() {
            return new Promise(function(resolve) {
                gd.on('plotly_click', resolve);
                click(x, y);
            });
        };
    }

    function makeUnhoverFn(gd, x0, y0) {
        return function() {
            return new Promise(function(resolve) {
                var eventData = null;

                gd.on('plotly_unhover', function() {
                    eventData = 'emitted plotly_unhover';
                });

                // fairly realistic simulation of moving with the cursor
                var canceler = setInterval(function() {
                    hover(x0--, y0--);
                }, 10);

                setTimeout(function() {
                    clearInterval(canceler);
                    resolve(eventData);
                }, 350);
            });
        };
    }

    function assertEventData(actual, expected) {
        expect(actual.points.length).toEqual(1, 'points length');

        var pt = actual.points[0];

        expect(Object.keys(pt)).toEqual([
            'x', 'y', 'curveNumber', 'pointNumber',
            'data', 'fullData', 'xaxis', 'yaxis'
        ], 'event data keys');

        expect(typeof pt.data.uid).toEqual('string', 'uid');
        expect(pt.xaxis.domain.length).toEqual(2, 'xaxis');
        expect(pt.yaxis.domain.length).toEqual(2, 'yaxis');

        expect(pt.x).toEqual(expected.x, 'x');
        expect(pt.y).toEqual(expected.y, 'y');
        expect(pt.curveNumber).toEqual(expected.curveNumber, 'curve number');
        expect(pt.pointNumber).toEqual(expected.pointNumber, 'point number');
    }

    // returns basic hover/click/unhover runner for one xy position
    function makeRunner(pos, expected, opts) {
        opts = opts || {};

        var _hover = makeHoverFn(gd, pos[0], pos[1]);
        var _click = makeClickFn(gd, pos[0], pos[1]);

        var _unhover = opts.noUnHover ?
            function() { return 'emitted plotly_unhover'; } :
            makeUnhoverFn(gd, pos[0], pos[1]);

        return function() {
            return wait()
                .then(_hover)
                .then(function(eventData) {
                    assertEventData(eventData, expected);
                })
                .then(_click)
                .then(function(eventData) {
                    assertEventData(eventData, expected);
                })
                .then(_unhover)
                .then(function(eventData) {
                    expect(eventData).toEqual('emitted plotly_unhover');
                });
        };
    }

    beforeAll(function() {
        jasmine.addMatchers(customMatchers);
    });

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(function() {
        Plotly.purge(gd);
        destroyGraphDiv();
    });

    it('should output correct event data for scattergl', function(done) {
        var _mock = Lib.extendDeep({}, mock1);
        var run = makeRunner([655, 317], {
            x: 15.772,
            y: 0.387,
            curveNumber: 0,
            pointNumber: 33
        });

        Plotly.plot(gd, _mock)
        .then(run)
        .catch(fail)
        .then(done);
    });

    it('should output correct event data for scattergl with hoverinfo: \'none\'', function(done) {
        var _mock = Lib.extendDeep({}, mock1);
        _mock.data[0].hoverinfo = 'none';

        var run = makeRunner([655, 317], {
            x: 15.772,
            y: 0.387,
            curveNumber: 0,
            pointNumber: 33
        });

        Plotly.plot(gd, _mock)
        .then(run)
        .catch(fail)
        .then(done);
    });

    it('should output correct event data for pointcloud', function(done) {
        var _mock = Lib.extendDeep({}, mock2);

        var run = makeRunner([540, 150], {
            x: 4.5,
            y: 9,
            curveNumber: 2,
            pointNumber: 1
        });

        Plotly.plot(gd, _mock)
        .then(run)
        .catch(fail)
        .then(done);
    });

    it('should output correct event data for heatmapgl', function(done) {
        var _mock = Lib.extendDeep({}, mock3);
        _mock.data[0].type = 'heatmapgl';

        var run = makeRunner([540, 150], {
            x: 3,
            y: 3,
            curveNumber: 0,
            pointNumber: [3, 3]
        }, {
            noUnHover: true
        });

        Plotly.plot(gd, _mock)
        .then(run)
        .catch(fail)
        .then(done);
    });

    it('should output correct event data for scattergl after visibility restyle', function(done) {
        var _mock = Lib.extendDeep({}, mock4);

        var run = makeRunner([435, 216], {
            x: 8,
            y: 18,
            curveNumber: 2,
            pointNumber: 0
        });

        Plotly.plot(gd, _mock)
        .then(run)
        .then(function() {
            return Plotly.restyle(gd, 'visible', false, [1]);
        })
        .then(run)
        .catch(fail)
        .then(done);
    });

    it('should output correct event data for scattergl-fancy', function(done) {
        var _mock = Lib.extendDeep({}, mock4);
        _mock.data[0].mode = 'markers+lines';
        _mock.data[1].mode = 'markers+lines';
        _mock.data[2].mode = 'markers+lines';

        var run = makeRunner([435, 216], {
            x: 8,
            y: 18,
            curveNumber: 2,
            pointNumber: 0
        });

        Plotly.plot(gd, _mock)
        .then(run)
        .then(function() {
            return Plotly.restyle(gd, 'visible', false, [1]);
        })
        .then(run)
        .catch(fail)
        .then(done);
    });

    it('should output correct event data contourgl', function(done) {
        var _mock = Lib.extendDeep({}, mock3);

        var run = makeRunner([540, 150], {
            x: 3,
            y: 3,
            curveNumber: 0,
            pointNumber: [3, 3]
        }, {
            noUnHover: true
        });

        Plotly.plot(gd, _mock)
        .then(run)
        .catch(fail)
        .then(done);
    });
});
