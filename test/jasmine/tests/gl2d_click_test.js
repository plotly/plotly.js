var Plotly = require('@lib/index');
var Lib = require('@src/lib');

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var customMatchers = require('../assets/custom_matchers');
var hasWebGLSupport = require('../assets/has_webgl_support');

// cartesian click events events use the hover data
// from the mousemove events and then simulate
// a click event on mouseup
var click = require('../assets/timed_click');
var hover = require('../assets/hover');

describe('Test hover and click interactions', function() {

    if(!hasWebGLSupport('gl2d_click_test')) return;

    var mock = require('@mocks/gl2d_14.json');
    var mock2 = require('@mocks/gl2d_pointcloud-basic.json');
    var mock3 = {
        'data': [
            {
                'type': 'contourgl',
                'z': [
                    [
                        10,
                        10.625,
                        12.5,
                        15.625,
                        20
                    ],
                    [
                        5.625,
                        6.25,
                        8.125,
                        11.25,
                        15.625
                    ],
                    [
                        2.5,
                        3.125,
                        5,
                        8.125,
                        12.5
                    ],
                    [
                        0.625,
                        1.25,
                        3.125,
                        6.25,
                        10.625
                    ],
                    [
                        0,
                        0.625,
                        2.5,
                        5.625,
                        10
                    ]
                ],
                'colorscale': 'Jet',
/*                'contours': {
                    'start': 2,
                    'end': 10,
                    'size': 1
                },*/
                'uid': 'ad5624',
                'zmin': 0,
                'zmax': 20
            }
        ],
        'layout': {
            'xaxis': {
                'range': [
                    0,
                    4
                ],
                'autorange': true
            },
            'yaxis': {
                'range': [
                    0,
                    4
                ],
                'autorange': true
            },
            'height': 450,
            'width': 1000,
            'autosize': true
        }
    };

    var mockCopy, gd;

    function check(pt) {
        expect(Object.keys(pt)).toEqual([
            'x', 'y', 'curveNumber', 'pointNumber', 'data', 'fullData', 'xaxis', 'yaxis'
        ]);

        expect(pt.x).toEqual(15.772);
        expect(pt.y).toEqual(0.387);
        expect(pt.curveNumber).toEqual(0);
        expect(pt.pointNumber).toEqual(33);
        expect(pt.fullData.length).toEqual(1);
        expect(typeof pt.data.uid).toEqual('string');
        expect(pt.xaxis.domain.length).toEqual(2);
        expect(pt.yaxis.domain.length).toEqual(2);
    }

    beforeAll(function() {
        jasmine.addMatchers(customMatchers);
    });

    beforeEach(function() {
        gd = createGraphDiv();
        mockCopy = Lib.extendDeep({}, mock);
    });

    afterEach(destroyGraphDiv);

    describe('hover event is fired on hover', function() {
        var futureData;

        it('in general', function(done) {

            var modifiedMockCopy = Lib.extendDeep({}, mockCopy);

            Plotly.plot(gd, modifiedMockCopy.data, modifiedMockCopy.layout)

                .then(new Promise(function() {

                    gd.on('plotly_hover', function(data) {
                        futureData = data;
                    });

                    hover(654.7712871743302, 316.97670766680994);

                    window.setTimeout(function() {

                        expect(futureData.points.length).toEqual(1);

                        var pt = futureData.points[0];

                        check(pt);

                        done();
                    }, 250);
                }));


        });

        it('even when hoverinfo (== plotly tooltip) is set to none', function(done) {

            var modifiedMockCopy = Lib.extendDeep({}, mockCopy);
            modifiedMockCopy.data[0].hoverinfo = 'none';

            Plotly.plot(gd, modifiedMockCopy.data, modifiedMockCopy.layout)

                .then(new Promise(function() {

                    gd.on('plotly_hover', function(data) {
                        futureData = data;
                    });

                    hover(654.7712871743302, 316.97670766680994);

                    window.setTimeout(function() {

                        expect(futureData.points.length).toEqual(1);

                        var pt = futureData.points[0];

                        check(pt);

                        done();
                    }, 250);
                }));


        });

        it('event happens even on a click interaction', function(done) {

            var modifiedMockCopy = Lib.extendDeep({}, mockCopy);
            modifiedMockCopy.data[0].hoverinfo = 'none';

            Plotly.plot(gd, modifiedMockCopy.data, modifiedMockCopy.layout)

                .then(new Promise(function() {

                    gd.on('plotly_hover', function(data) {
                        futureData = data;
                    });

                    click(654.7712871743302, 316.97670766680994);

                    window.setTimeout(function() {

                        expect(futureData.points.length).toEqual(1);

                        var pt = futureData.points[0];

                        check(pt);

                        done();
                    }, 250);
                }));


        });

        it('unhover happens', function(done) {

            var modifiedMockCopy = Lib.extendDeep({}, mockCopy);
            modifiedMockCopy.data[0].hoverinfo = 'none';

            Plotly.plot(gd, modifiedMockCopy.data, modifiedMockCopy.layout)

                .then(new Promise(function() {

                    futureData = undefined;

                    gd.on('plotly_unhover', function() {
                        futureData = 'emitted plotly_unhover';
                    });

                    hover(654.7712871743302, 316.97670766680994);

                    // fairly realistic simulation of moving with the cursor
                    window.setTimeout(function() {

                        var x = 654, y = 316; // we start here
                        var canceler = window.setInterval(function() {
                            hover(x--, y++); // move the cursor
                        }, 10);

                        window.setTimeout(function() {
                            window.clearInterval(canceler); // stop the mouse at some point
                        }, 250);

                        window.setTimeout(function() {

                            expect(futureData).toEqual('emitted plotly_unhover');

                            done();

                        }, 250);

                    }, 250);
                }));

        });


    });

    describe('hover event is fired for other gl2d plot types', function() {
        var futureData;

        it('pointcloud', function(done) {

            var modifiedMockCopy = Lib.extendDeep({}, mock2);

            Plotly.plot(gd, modifiedMockCopy.data, modifiedMockCopy.layout)

                .then(new Promise(function() {

                    gd.on('plotly_hover', function(data) {
                        futureData = data;
                    });

                    hover(540, 150);

                    window.setTimeout(function() {

                        expect(futureData.points.length).toEqual(1);

                        var pt = futureData.points[0];

                        expect(Object.keys(pt)).toEqual([
                            'x', 'y', 'curveNumber', 'pointNumber', 'data', 'fullData', 'xaxis', 'yaxis'
                        ]);

                        expect(pt.x).toEqual(4.5);
                        expect(pt.y).toEqual(9);
                        expect(pt.curveNumber).toEqual(2);
                        expect(pt.pointNumber).toEqual(1);
                        expect(pt.fullData.length).toEqual(3);
                        expect(typeof pt.data.uid).toEqual('string');
                        expect(pt.xaxis.domain.length).toEqual(2);
                        expect(pt.yaxis.domain.length).toEqual(2);

                        done();
                    }, 350);
                }));


        });

        it('heatmapgl', function(done) {

            var modifiedMockCopy = Lib.extendDeep({}, mock3);
            modifiedMockCopy.data[0].type = 'heatmapgl';

            Plotly.plot(gd, modifiedMockCopy.data, modifiedMockCopy.layout)

                .then(new Promise(function() {

                    gd.on('plotly_hover', function(data) {
                        futureData = data;
                    });

                    hover(540, 150);

                    window.setTimeout(function() {

                        expect(futureData.points.length).toEqual(1);

                        var pt = futureData.points[0];

                        expect(Object.keys(pt)).toEqual([
                            'x', 'y', 'curveNumber', 'pointNumber', 'data', 'fullData', 'xaxis', 'yaxis'
                        ]);

                        expect(pt.x).toEqual(2);
                        expect(pt.y).toEqual(3);
                        expect(pt.curveNumber).toEqual(0);
                        expect(pt.pointNumber).toEqual([2, 3]);
                        expect(pt.fullData.length).toEqual(1);
                        expect(typeof pt.data.uid).toEqual('string');
                        expect(pt.xaxis.domain.length).toEqual(2);
                        expect(pt.yaxis.domain.length).toEqual(2);

                        done();
                    }, 350);
                }));


        });

        it('contourgl', function(done) {

            var modifiedMockCopy = Lib.extendDeep({}, mock3);

            Plotly.plot(gd, modifiedMockCopy.data, modifiedMockCopy.layout)

                .then(new Promise(function() {

                    gd.on('plotly_hover', function(data) {
                        futureData = data;
                    });

                    hover(540, 150);

                    window.setTimeout(function() {

                        expect(futureData.points.length).toEqual(1);

                        var pt = futureData.points[0];

                        expect(Object.keys(pt)).toEqual([
                            'x', 'y', 'curveNumber', 'pointNumber', 'data', 'fullData', 'xaxis', 'yaxis'
                        ]);

                        expect(pt.x).toEqual(2);
                        expect(pt.y).toEqual(3);
                        expect(pt.curveNumber).toEqual(0);
                        expect(pt.pointNumber).toEqual([2, 3]);
                        expect(pt.fullData.length).toEqual(1);
                        expect(typeof pt.data.uid).toEqual('string');
                        expect(pt.xaxis.domain.length).toEqual(2);
                        expect(pt.yaxis.domain.length).toEqual(2);

                        done();
                    }, 350);
                }));
        });
    });

    describe('click event is fired on click', function() {
        var futureData;

        it('in general', function(done) {

            var modifiedMockCopy = Lib.extendDeep({}, mockCopy);

            Plotly.plot(gd, modifiedMockCopy.data, modifiedMockCopy.layout)

                .then(new Promise(function() {

                    gd.on('plotly_click', function(data) {
                        futureData = data;
                    });

                    click(654.7712871743302, 316.97670766680994);

                    window.setTimeout(function() {

                        var pt = futureData.points[0];

                        check(pt);

                        done();

                    }, 350);
                }));

        });

        it('even when hoverinfo (== plotly tooltip) is set to none', function(done) {

            var modifiedMockCopy = Lib.extendDeep({}, mockCopy);
            modifiedMockCopy.data[0].hoverinfo = 'none';

            Plotly.plot(gd, modifiedMockCopy.data, modifiedMockCopy.layout)

                .then(new Promise(function() {

                    gd.on('plotly_hover', function(data) {
                        futureData = data;
                    });

                    hover(654.7712871743302, 316.97670766680994);

                    window.setTimeout(function() {

                        expect(futureData.points.length).toEqual(1);

                        var pt = futureData.points[0];

                        check(pt);

                        done();
                    }, 250);
                }));


        });

        it('unhover happens', function(done) {

            var modifiedMockCopy = Lib.extendDeep({}, mockCopy);
            modifiedMockCopy.data[0].hoverinfo = 'none';

            Plotly.plot(gd, modifiedMockCopy.data, modifiedMockCopy.layout)

                .then(new Promise(function() {

                    futureData = undefined;

                    gd.on('plotly_unhover', function() {
                        futureData = 'emitted plotly_unhover';
                    });

                    hover(654.7712871743302, 316.97670766680994);

                    // fairly realistic simulation of moving with the cursor
                    window.setTimeout(function() {

                        var x = 654, y = 316; // we start here
                        var canceler = window.setInterval(function() {
                            hover(x--, y++); // move the cursor
                        }, 10);

                        window.setTimeout(function() {
                            window.clearInterval(canceler); // stop the mouse at some point
                        }, 250);

                        window.setTimeout(function() {

                            expect(futureData).toEqual('emitted plotly_unhover');

                            done();

                        }, 250);

                    }, 250);
                }));

        });

    });
});
