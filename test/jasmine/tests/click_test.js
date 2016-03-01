var Plotly = require('@lib/index');
var Lib = require('@src/lib');
var DBLCLICKDELAY = require('@src/plots/cartesian/constants').DBLCLICKDELAY;

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var mouseEvent = require('../assets/mouse_event');
var customMatchers = require('../assets/custom_matchers');


describe('click interactions', function() {
    var mock = require('@mocks/14.json'),
        gd;

    var pointPos = [351, 223],
        blankPos = [70, 363];

    afterEach(destroyGraphDiv);

    // cartesian click events events use the hover data
    // from the mousemove events and then simulate
    // a click event on mouseup
    function click(x, y) {
        mouseEvent('mousemove', x, y);
        mouseEvent('mousedown', x, y);
        mouseEvent('mouseup', x, y);
    }

    function doubleClick(x, y, cb) {
        click(x, y);
        setTimeout(function() {
            click(x, y);
            cb();
        }, DBLCLICKDELAY / 2);
    }

    describe('click events', function() {
        var futureData;

        beforeEach(function(done) {
            gd = createGraphDiv();

            var mockCopy = Lib.extendDeep({}, mock);
            Plotly.plot(gd, mockCopy.data, mockCopy.layout)
                .then(done);

            gd.on('plotly_click', function(data) {
                futureData = data;
            });
        });

        it('should not be trigged when not on data points', function() {
            click(blankPos[0], blankPos[1]);
            expect(futureData).toBe(undefined);
        });

        it('should contain the correct fields', function() {
            click(pointPos[0], pointPos[1]);
            expect(futureData.points.length).toEqual(1);

            var pt = futureData.points[0];
            expect(Object.keys(pt)).toEqual([
                'data', 'fullData', 'curveNumber', 'pointNumber',
                'x', 'y', 'xaxis', 'yaxis'
            ]);
            expect(pt.curveNumber).toEqual(0);
            expect(pt.pointNumber).toEqual(11);
            expect(pt.x).toEqual(0.125);
            expect(pt.y).toEqual(2.125);
        });
    });

    describe('double click events', function() {
        var futureData;

        beforeEach(function(done) {
            gd = createGraphDiv();

            var mockCopy = Lib.extendDeep({}, mock);
            Plotly.plot(gd, mockCopy.data, mockCopy.layout)
                .then(done);

            gd.on('plotly_doubleclick', function(data) {
                futureData = data;
            });

        });

        it('should return null', function(done) {
            doubleClick(pointPos[0], pointPos[1], function() {
                expect(futureData).toBe(null);
                done();
            });
        });
    });

    describe('double click interactions', function() {
        var mockCopy;

        var autoRangeX = [-3.011967491973726, 2.1561305597186564],
            autoRangeY = [-0.9910086301469277, 1.389382716298284];

        var setRangeX = [-3, 1],
            setRangeY = [-0.5, 1];

        var zoomRangeX = [-2, 0],
            zoomRangeY = [0, 0.5];

        var update = {
            'xaxis.range[0]': zoomRangeX[0],
            'xaxis.range[1]': zoomRangeX[1],
            'yaxis.range[0]': zoomRangeY[0],
            'yaxis.range[1]': zoomRangeY[1]
        };

        beforeEach(function() {
            jasmine.addMatchers(customMatchers);

            gd = createGraphDiv();
            mockCopy = Lib.extendDeep({}, mock);
        });

        function setRanges(mockCopy) {
            mockCopy.layout.xaxis.autorange = false;
            mockCopy.layout.xaxis.range = setRangeX.slice();

            mockCopy.layout.yaxis.autorange = false;
            mockCopy.layout.yaxis.range = setRangeY.slice();

            return mockCopy;
        }

        it('when set to \'reset+autorange\' (the default) should work when \'autorange\' is on', function(done) {
            Plotly.plot(gd, mockCopy.data, mockCopy.layout).then(function() {
                expect(gd.layout.xaxis.range).toBeCloseToArray(autoRangeX);
                expect(gd.layout.yaxis.range).toBeCloseToArray(autoRangeY);

                Plotly.relayout(gd, update).then(function() {
                    expect(gd.layout.xaxis.range).toBeCloseToArray(zoomRangeX);
                    expect(gd.layout.yaxis.range).toBeCloseToArray(zoomRangeY);

                    doubleClick(blankPos[0], blankPos[1], function() {
                        expect(gd.layout.xaxis.range).toBeCloseToArray(autoRangeX);
                        expect(gd.layout.yaxis.range).toBeCloseToArray(autoRangeY);

                        done();
                    });
                });
            });
        });

        it('when set to \'reset+autorange\' (the default) should reset to set range on double click', function(done) {
            mockCopy = setRanges(mockCopy);

            Plotly.plot(gd, mockCopy.data, mockCopy.layout).then(function() {
                expect(gd.layout.xaxis.range).toBeCloseToArray(setRangeX);
                expect(gd.layout.yaxis.range).toBeCloseToArray(setRangeY);

                Plotly.relayout(gd, update).then(function() {
                    expect(gd.layout.xaxis.range).toBeCloseToArray(zoomRangeX);
                    expect(gd.layout.yaxis.range).toBeCloseToArray(zoomRangeY);

                    doubleClick(blankPos[0], blankPos[1], function() {
                        expect(gd.layout.xaxis.range).toBeCloseToArray(setRangeX);
                        expect(gd.layout.yaxis.range).toBeCloseToArray(setRangeY);

                        done();
                    });
                });
            });
        });

        it('when set to \'reset+autorange\' (the default) should autosize on 1st double click and reset on 2nd', function(done) {
            mockCopy = setRanges(mockCopy);

            Plotly.plot(gd, mockCopy.data, mockCopy.layout).then(function() {
                expect(gd.layout.xaxis.range).toBeCloseToArray(setRangeX);
                expect(gd.layout.yaxis.range).toBeCloseToArray(setRangeY);

                doubleClick(blankPos[0], blankPos[1], function() {
                    expect(gd.layout.xaxis.range).toBeCloseToArray(autoRangeX);
                    expect(gd.layout.yaxis.range).toBeCloseToArray(autoRangeY);

                    doubleClick(blankPos[0], blankPos[1], function() {
                        expect(gd.layout.xaxis.range).toBeCloseToArray(setRangeX);
                        expect(gd.layout.yaxis.range).toBeCloseToArray(setRangeY);

                        done();
                    });
                });
            });
        });

        it('when set to \'reset\' should work when \'autorange\' is on', function(done) {
            Plotly.plot(gd, mockCopy.data, mockCopy.layout, { doubleClick: 'reset' }).then(function() {
                expect(gd.layout.xaxis.range).toBeCloseToArray(autoRangeX);
                expect(gd.layout.yaxis.range).toBeCloseToArray(autoRangeY);

                Plotly.relayout(gd, update).then(function() {
                    expect(gd.layout.xaxis.range).toBeCloseToArray(zoomRangeX);
                    expect(gd.layout.yaxis.range).toBeCloseToArray(zoomRangeY);

                    doubleClick(blankPos[0], blankPos[1], function() {
                        expect(gd.layout.xaxis.range).toBeCloseToArray(autoRangeX);
                        expect(gd.layout.yaxis.range).toBeCloseToArray(autoRangeY);

                        done();
                    });
                });
            });
        });

        it('when set to \'reset\' should reset to set range on double click', function(done) {
            mockCopy = setRanges(mockCopy);

            Plotly.plot(gd, mockCopy.data, mockCopy.layout, { doubleClick: 'reset' }).then(function() {
                expect(gd.layout.xaxis.range).toBeCloseToArray(setRangeX);
                expect(gd.layout.yaxis.range).toBeCloseToArray(setRangeY);

                Plotly.relayout(gd, update).then(function() {
                    expect(gd.layout.xaxis.range).toBeCloseToArray(zoomRangeX);
                    expect(gd.layout.yaxis.range).toBeCloseToArray(zoomRangeY);

                    doubleClick(blankPos[0], blankPos[1], function() {
                        expect(gd.layout.xaxis.range).toBeCloseToArray(setRangeX);
                        expect(gd.layout.yaxis.range).toBeCloseToArray(setRangeY);

                        done();
                    });
                });
            });
        });

        it('when set to \'reset\' should reset on all double clicks', function(done) {
            mockCopy = setRanges(mockCopy);

            Plotly.plot(gd, mockCopy.data, mockCopy.layout, { doubleClick: 'reset' }).then(function() {
                expect(gd.layout.xaxis.range).toBeCloseToArray(setRangeX);
                expect(gd.layout.yaxis.range).toBeCloseToArray(setRangeY);

                doubleClick(blankPos[0], blankPos[1], function() {
                    expect(gd.layout.xaxis.range).toBeCloseToArray(setRangeX);
                    expect(gd.layout.yaxis.range).toBeCloseToArray(setRangeY);

                    done();
                });
            });
        });

        it('when set to \'autosize\' should work when \'autorange\' is on', function(done) {
            Plotly.plot(gd, mockCopy.data, mockCopy.layout, { doubleClick: 'autosize' }).then(function() {
                expect(gd.layout.xaxis.range).toBeCloseToArray(autoRangeX);
                expect(gd.layout.yaxis.range).toBeCloseToArray(autoRangeY);

                Plotly.relayout(gd, update).then(function() {
                    expect(gd.layout.xaxis.range).toBeCloseToArray(zoomRangeX);
                    expect(gd.layout.yaxis.range).toBeCloseToArray(zoomRangeY);

                    doubleClick(blankPos[0], blankPos[1], function() {
                        expect(gd.layout.xaxis.range).toBeCloseToArray(autoRangeX);
                        expect(gd.layout.yaxis.range).toBeCloseToArray(autoRangeY);

                        done();
                    });
                });
            });
        });

        it('when set to \'autosize\' should set to autorange on double click', function(done) {
            mockCopy = setRanges(mockCopy);

            Plotly.plot(gd, mockCopy.data, mockCopy.layout, { doubleClick: 'autosize' }).then(function() {
                expect(gd.layout.xaxis.range).toBeCloseToArray(setRangeX);
                expect(gd.layout.yaxis.range).toBeCloseToArray(setRangeY);

                Plotly.relayout(gd, update).then(function() {
                    expect(gd.layout.xaxis.range).toBeCloseToArray(zoomRangeX);
                    expect(gd.layout.yaxis.range).toBeCloseToArray(zoomRangeY);

                    doubleClick(blankPos[0], blankPos[1], function() {
                        expect(gd.layout.xaxis.range).toBeCloseToArray(autoRangeX);
                        expect(gd.layout.yaxis.range).toBeCloseToArray(autoRangeY);

                        done();
                    });
                });
            });
        });

        it('when set to \'autosize\' should reset on all double clicks', function(done) {
            mockCopy = setRanges(mockCopy);

            Plotly.plot(gd, mockCopy.data, mockCopy.layout, { doubleClick: 'autosize' }).then(function() {
                expect(gd.layout.xaxis.range).toBeCloseToArray(setRangeX);
                expect(gd.layout.yaxis.range).toBeCloseToArray(setRangeY);

                doubleClick(blankPos[0], blankPos[1], function() {
                    expect(gd.layout.xaxis.range).toBeCloseToArray(autoRangeX);
                    expect(gd.layout.yaxis.range).toBeCloseToArray(autoRangeY);

                    done();
                });
            });
        });

    });
});
