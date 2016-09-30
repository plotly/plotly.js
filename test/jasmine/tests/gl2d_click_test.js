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

describe('Test click interactions:', function() {

    if(!hasWebGLSupport('gl2d_click_test')) return;

    var mock = require('@mocks/gl2d_14.json');

    var mockCopy, gd;

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

                        expect(Object.keys(pt)).toEqual([
                            'trace', 'dataCoord', 'traceCoord', 'textLabel', 'color',
                            'name', 'hoverinfo', 'screenCoord'
                        ]);

                        expect(pt.traceCoord).toEqual([15.772, 0.387]);

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

                        expect(Object.keys(pt)).toEqual([
                            'trace', 'dataCoord', 'traceCoord', 'textLabel', 'color',
                            'name', 'hoverinfo', 'screenCoord'
                        ]);

                        expect(pt.traceCoord).toEqual([15.772, 0.387]);

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

                        expect(Object.keys(pt)).toEqual([
                            'trace', 'dataCoord', 'traceCoord', 'textLabel', 'color',
                            'name', 'hoverinfo', 'screenCoord'
                        ]);

                        expect(pt.traceCoord).toEqual([15.772, 0.387]);

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
                        expect(futureData.points[0].traceCoord).toEqual([15.772, 0.387]);

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

                        expect(Object.keys(pt)).toEqual([
                            'trace', 'dataCoord', 'traceCoord', 'textLabel', 'color',
                            'name', 'hoverinfo', 'screenCoord'
                        ]);

                        expect(pt.traceCoord).toEqual([15.772, 0.387]);

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
