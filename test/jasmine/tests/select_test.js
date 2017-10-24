var d3 = require('d3');

var Plotly = require('@lib/index');
var Lib = require('@src/lib');
var doubleClick = require('../assets/double_click');

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var fail = require('../assets/fail_test');
var mouseEvent = require('../assets/mouse_event');
var touchEvent = require('../assets/touch_event');

var LONG_TIMEOUT_INTERVAL = 5 * jasmine.DEFAULT_TIMEOUT_INTERVAL;

function drag(path, options) {
    var len = path.length;

    if(!options) options = {type: 'mouse'};

    Lib.clearThrottle();

    if(options.type === 'touch') {
        touchEvent('touchstart', path[0][0], path[0][1]);

        path.slice(1, len).forEach(function(pt) {
            Lib.clearThrottle();
            touchEvent('touchmove', pt[0], pt[1]);
        });

        touchEvent('touchend', path[len - 1][0], path[len - 1][1]);
        return;
    }

    mouseEvent('mousemove', path[0][0], path[0][1]);
    mouseEvent('mousedown', path[0][0], path[0][1]);

    path.slice(1, len).forEach(function(pt) {
        Lib.clearThrottle();
        mouseEvent('mousemove', pt[0], pt[1]);
    });

    mouseEvent('mouseup', path[len - 1][0], path[len - 1][1]);
}

function assertSelectionNodes(cornerCnt, outlineCnt) {
    expect(d3.selectAll('.zoomlayer > .zoombox-corners').size())
        .toBe(cornerCnt, 'selection corner count');
    expect(d3.selectAll('.zoomlayer > .select-outline').size())
        .toBe(outlineCnt, 'selection outline count');
}

var selectingCnt, selectingData, selectedCnt, selectedData, deselectCnt, doubleClickData;
var selectedPromise, deselectPromise;

function resetEvents(gd) {
    selectingCnt = 0;
    selectedCnt = 0;
    deselectCnt = 0;
    doubleClickData = null;

    gd.removeAllListeners();

    selectedPromise = new Promise(function(resolve) {
        gd.on('plotly_selecting', function(data) {
            // note that since all of these events test node counts,
            // and all of the other tests at some point check that each of
            // these event handlers was called (via assertEventCounts),
            // we no longer need separate tests that these nodes are created
            // and this way *all* subplot variants get the test.
            assertSelectionNodes(1, 2);
            selectingCnt++;
            selectingData = data;
        });

        gd.on('plotly_selected', function(data) {
            assertSelectionNodes(0, 2);
            selectedCnt++;
            selectedData = data;
            resolve();
        });
    });

    deselectPromise = new Promise(function(resolve) {
        gd.on('plotly_deselect', function(data) {
            assertSelectionNodes(0, 0);
            deselectCnt++;
            doubleClickData = data;
            resolve();
        });
    });
}

function assertEventCounts(selecting, selected, deselect, msg) {
    expect(selectingCnt).toBe(selecting, 'plotly_selecting call count: ' + msg);
    expect(selectedCnt).toBe(selected, 'plotly_selected call count: ' + msg);
    expect(deselectCnt).toBe(deselect, 'plotly_deselect call count: ' + msg);
}

// events for box or lasso select mouse moves then a doubleclick
var NOEVENTS = [0, 0, 0];
// deselect gives an extra plotly_selected event on the first click
// event data is undefined
var BOXEVENTS = [1, 2, 1];
// assumes 5 points in the lasso path
var LASSOEVENTS = [4, 2, 1];

describe('Test select box and lasso in general:', function() {
    var mock = require('@mocks/14.json');
    var selectPath = [[93, 193], [143, 193]];
    var lassoPath = [[316, 171], [318, 239], [335, 243], [328, 169]];

    afterEach(destroyGraphDiv);

    function assertRange(actual, expected) {
        var PRECISION = 4;

        expect(actual.x).toBeCloseToArray(expected.x, PRECISION);
        expect(actual.y).toBeCloseToArray(expected.y, PRECISION);
    }

    function assertEventData(actual, expected, msg) {
        expect(actual.length).toBe(expected.length, msg + ' same number of pts');

        expected.forEach(function(e, i) {
            var a = actual[i];
            var m = msg + ' (pt ' + i + ')';

            expect(a.data).toBeDefined(m + ' has data ref');
            expect(a.fullData).toBeDefined(m + ' has fullData ref');
            expect(Object.keys(a).length - 2).toBe(Object.keys(e).length, m + ' has correct number of keys');

            Object.keys(e).forEach(function(k) {
                expect(a[k]).toBe(e[k], m + ' ' + k);
            });
        });
    }

    describe('select events', function() {
        var mockCopy = Lib.extendDeep({}, mock);
        mockCopy.layout.dragmode = 'select';
        mockCopy.data[0].ids = mockCopy.data[0].x
            .map(function(v) { return 'id-' + v; });
        mockCopy.data[0].customdata = mockCopy.data[0].y
            .map(function(v) { return 'customdata-' + v; });
        addInvisible(mockCopy);

        var gd;
        beforeEach(function(done) {
            gd = createGraphDiv();

            Plotly.plot(gd, mockCopy.data, mockCopy.layout)
                .then(done);
        });

        it('should trigger selecting/selected/deselect events', function(done) {
            resetEvents(gd);

            drag(selectPath);

            selectedPromise.then(function() {
                expect(selectingCnt).toBe(1, 'with the correct selecting count');
                assertEventData(selectingData.points, [{
                    curveNumber: 0,
                    pointNumber: 0,
                    x: 0.002,
                    y: 16.25,
                    id: 'id-0.002',
                    customdata: 'customdata-16.25'
                }, {
                    curveNumber: 0,
                    pointNumber: 1,
                    x: 0.004,
                    y: 12.5,
                    id: 'id-0.004',
                    customdata: 'customdata-12.5'
                }], 'with the correct selecting points (1)');
                assertRange(selectingData.range, {
                    x: [0.002000, 0.0046236],
                    y: [0.10209191961595454, 24.512223978291406]
                }, 'with the correct selecting range');
                expect(selectedCnt).toBe(1, 'with the correct selected count');
                assertEventData(selectedData.points, [{
                    curveNumber: 0,
                    pointNumber: 0,
                    x: 0.002,
                    y: 16.25,
                    id: 'id-0.002',
                    customdata: 'customdata-16.25'
                }, {
                    curveNumber: 0,
                    pointNumber: 1,
                    x: 0.004,
                    y: 12.5,
                    id: 'id-0.004',
                    customdata: 'customdata-12.5'
                }], 'with the correct selected points (2)');
                assertRange(selectedData.range, {
                    x: [0.002000, 0.0046236],
                    y: [0.10209191961595454, 24.512223978291406]
                }, 'with the correct selected range');

                return doubleClick(250, 200);
            })
            .then(deselectPromise)
            .then(function() {
                expect(doubleClickData).toBe(null, 'with the correct deselect data');
            })
            .catch(fail)
            .then(done);
        });

    });

    describe('lasso events', function() {
        var mockCopy = Lib.extendDeep({}, mock);
        mockCopy.layout.dragmode = 'lasso';
        addInvisible(mockCopy);

        var gd;
        beforeEach(function(done) {
            gd = createGraphDiv();

            Plotly.plot(gd, mockCopy.data, mockCopy.layout)
                .then(done);
        });

        it('should trigger selecting/selected/deselect events', function(done) {
            resetEvents(gd);

            drag(lassoPath);

            selectedPromise.then(function() {
                expect(selectingCnt).toBe(3, 'with the correct selecting count');
                assertEventData(selectingData.points, [{
                    curveNumber: 0,
                    pointNumber: 10,
                    x: 0.099,
                    y: 2.75
                }], 'with the correct selecting points (1)');

                expect(selectedCnt).toBe(1, 'with the correct selected count');
                assertEventData(selectedData.points, [{
                    curveNumber: 0,
                    pointNumber: 10,
                    x: 0.099,
                    y: 2.75,
                }], 'with the correct selected points (2)');

                expect(selectedData.lassoPoints.x).toBeCloseToArray(
                    [0.084, 0.087, 0.115, 0.103], 'lasso points x coords');
                expect(selectedData.lassoPoints.y).toBeCloseToArray(
                    [4.648, 1.342, 1.247, 4.821], 'lasso points y coords');

                return doubleClick(250, 200);
            })
            .then(deselectPromise)
            .then(function() {
                expect(doubleClickData).toBe(null, 'with the correct deselect data');
            })
            .catch(fail)
            .then(done);
        });

        it('should set selected points in graph data', function(done) {
            resetEvents(gd);

            drag(lassoPath);

            selectedPromise.then(function() {
                expect(selectingCnt).toBe(3, 'with the correct selecting count');
                expect(gd.data[0].selectedpoints).toEqual([10]);

                return doubleClick(250, 200);
            })
            .then(deselectPromise)
            .then(function() {
                expect(gd.data[0].selectedpoints).toBeUndefined();
            })
            .catch(fail)
            .then(done);
        });

        it('should set selected points in full data', function(done) {
            resetEvents(gd);

            drag(lassoPath);

            selectedPromise.then(function() {
                expect(selectingCnt).toBe(3, 'with the correct selecting count');
                expect(gd._fullData[0].selectedpoints).toEqual([10]);

                return doubleClick(250, 200);
            })
            .then(deselectPromise)
            .then(function() {
                expect(gd._fullData[0].selectedpoints).toBeUndefined();
            })
            .catch(fail)
            .then(done);
        });

        it('should trigger selecting/selected/deselect events for touches', function(done) {
            resetEvents(gd);

            drag(lassoPath, {type: 'touch'});

            selectedPromise.then(function() {
                expect(selectingCnt).toBe(3, 'with the correct selecting count');
                assertEventData(selectingData.points, [{
                    curveNumber: 0,
                    pointNumber: 10,
                    x: 0.099,
                    y: 2.75
                }], 'with the correct selecting points (1)');

                expect(selectedCnt).toBe(1, 'with the correct selected count');
                assertEventData(selectedData.points, [{
                    curveNumber: 0,
                    pointNumber: 10,
                    x: 0.099,
                    y: 2.75,
                }], 'with the correct selected points (2)');

                return doubleClick(250, 200);
            })
            .then(deselectPromise)
            .then(function() {
                expect(doubleClickData).toBe(null, 'with the correct deselect data');
            })
            .catch(fail)
            .then(done);
        });
    });

    it('should skip over non-visible traces', function(done) {
        // note: this tests a mock with one or several invisible traces
        // the invisible traces in the other tests test for multiple
        // traces, with some visible and some not.
        var mockCopy = Lib.extendDeep({}, mock);
        mockCopy.layout.dragmode = 'select';

        var gd = createGraphDiv();

        function resetAndSelect() {
            resetEvents(gd);
            drag(selectPath);
            return selectedPromise;
        }

        function resetAndLasso() {
            resetEvents(gd);
            drag(lassoPath);
            return selectedPromise;
        }

        function checkPointCount(cnt, msg) {
            expect((selectedData.points || []).length).toBe(cnt, msg);
        }

        Plotly.plot(gd, mockCopy.data, mockCopy.layout)
        .then(resetAndSelect)
        .then(function() {
            checkPointCount(2, '(case 0)');

            return Plotly.restyle(gd, 'visible', 'legendonly');
        })
        .then(resetAndSelect)
        .then(function() {
            checkPointCount(0, '(legendonly case)');

            return Plotly.restyle(gd, 'visible', true);
        })
        .then(resetAndSelect)
        .then(function() {
            checkPointCount(2, '(back to case 0)');

            return Plotly.relayout(gd, 'dragmode', 'lasso');
        })
        .then(resetAndLasso)
        .then(function() {
            checkPointCount(1, '(case 0 lasso)');

            return Plotly.restyle(gd, 'visible', 'legendonly');
        })
        .then(resetAndSelect)
        .then(function() {
            checkPointCount(0, '(lasso legendonly case)');

            return Plotly.restyle(gd, 'visible', true);
        })
        .then(resetAndLasso)
        .then(function() {
            checkPointCount(1, '(back to lasso case 0)');

            mockCopy = Lib.extendDeep({}, mock);
            mockCopy.layout.dragmode = 'select';
            mockCopy.data[0].visible = false;
            addInvisible(mockCopy);
            return Plotly.newPlot(gd, mockCopy);
        })
        .then(resetAndSelect)
        .then(function() {
            checkPointCount(0, '(multiple invisible traces select)');
            return Plotly.relayout(gd, 'dragmode', 'lasso');
        })
        .then(resetAndLasso)
        .then(function() {
            checkPointCount(0, '(multiple invisible traces lasso)');
        })
        .catch(fail)
        .then(done);
    });

    it('should skip over BADNUM items', function(done) {
        var data = [{
            mode: 'markers',
            x: [null, undefined, NaN, 0, 'NA'],
            y: [NaN, null, undefined, 0, 'NA']
        }];
        var layout = {
            dragmode: 'select',
            width: 400,
            heigth: 400,
        };
        var gd = createGraphDiv();

        Plotly.plot(gd, data, layout).then(function() {
            resetEvents(gd);
            drag([[100, 100], [300, 300]]);
            return selectedPromise;
        })
        .then(function() {
            expect(selectedData.points.length).toBe(1);
            expect(selectedData.points[0].x).toBe(0);
            expect(selectedData.points[0].y).toBe(0);

            return Plotly.relayout(gd, 'dragmode', 'lasso');
        })
        .then(function() {
            resetEvents(gd);
            drag([[100, 100], [100, 300], [300, 300], [300, 100], [100, 100]]);
            return selectedPromise;
        })
        .then(function() {
            expect(selectedData.points.length).toBe(1);
            expect(selectedData.points[0].x).toBe(0);
            expect(selectedData.points[0].y).toBe(0);
        })
        .catch(fail)
        .then(done);
    });
});

describe('Test select box and lasso per trace:', function() {
    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(destroyGraphDiv);

    function makeAssertPoints(keys) {
        var callNumber = 0;

        return function(expected) {
            var msg = '(call #' + callNumber + ') ';
            var pts = (selectedData || {}).points || [];

            expect(pts.length).toBe(expected.length, msg + 'selected points length');

            pts.forEach(function(p, i) {
                var e = expected[i] || [];
                keys.forEach(function(k, j) {
                    var msgFull = msg + 'selected pt ' + i + ' - ' + k + ' val';

                    if(typeof e[j] === 'number') {
                        expect(p[k]).toBeCloseTo(e[j], 1, msgFull);
                    } else {
                        expect(p[k]).toBe(e[j], msgFull);
                    }
                });
            });

            callNumber++;
        };
    }

    function makeAssertRanges(subplot, tol) {
        tol = tol || 1;
        var callNumber = 0;

        return function(expected) {
            var msg = '(call #' + callNumber + ') select box range ';
            var ranges = selectedData.range || {};

            if(subplot) {
                expect(ranges[subplot] || [])
                    .toBeCloseTo2DArray(expected, tol, msg + 'for ' + subplot);
            } else {
                expect(ranges.x || [])
                    .toBeCloseToArray(expected[0], tol, msg + 'x coords');
                expect(ranges.y || [])
                    .toBeCloseToArray(expected[1], tol, msg + 'y coords');
            }

            callNumber++;
        };
    }

    function makeAssertLassoPoints(subplot, tol) {
        tol = tol || 1;
        var callNumber = 0;

        return function(expected) {
            var msg = '(call #' + callNumber + ') lasso points ';
            var lassoPoints = selectedData.lassoPoints || {};

            if(subplot) {
                expect(lassoPoints[subplot] || [])
                    .toBeCloseTo2DArray(expected, tol, msg + 'for ' + subplot);
            } else {
                expect(lassoPoints.x || [])
                    .toBeCloseToArray(expected[0], tol, msg + 'x coords');
                expect(lassoPoints.y || [])
                    .toBeCloseToArray(expected[1], tol, msg + 'y coords');
            }

            callNumber++;
        };
    }

    function _run(dragPath, afterDragFn, dblClickPos, eventCounts, msg) {
        afterDragFn = afterDragFn || function() {};
        dblClickPos = dblClickPos || [250, 200];

        resetEvents(gd);

        assertSelectionNodes(0, 0);
        drag(dragPath);

        return (eventCounts[0] ? selectedPromise : Promise.resolve())
            .then(afterDragFn)
            .then(function() {
                // before dblclick we also have one less plotly_selected event
                // because the first click of the dblclick emits plotly_selected
                // even though it does so with undefined event data.
                assertEventCounts(eventCounts[0], Math.max(0, eventCounts[1] - 1), 0, msg);
                return doubleClick(dblClickPos[0], dblClickPos[1]);
            })
            .then(eventCounts[2] ? deselectPromise : Promise.resolve())
            .then(function() {
                assertEventCounts(eventCounts[0], eventCounts[1], eventCounts[2], msg);
            });
    }

    it('should work on scatterternary traces', function(done) {
        var assertPoints = makeAssertPoints(['a', 'b', 'c']);

        var fig = Lib.extendDeep({}, require('@mocks/ternary_simple'));
        fig.layout.width = 800;
        fig.layout.dragmode = 'select';
        addInvisible(fig);

        Plotly.plot(gd, fig).then(function() {
            return _run(
                [[400, 200], [445, 235]],
                function() {
                    assertPoints([[0.5, 0.25, 0.25]]);
                },
                [380, 180],
                BOXEVENTS, 'scatterternary select'
            );
        })
        .then(function() {
            return Plotly.relayout(gd, 'dragmode', 'lasso');
        })
        .then(function() {
            return _run(
                [[400, 200], [445, 200], [445, 235], [400, 235], [400, 200]],
                function() { assertPoints([[0.5, 0.25, 0.25]]); },
                [380, 180],
                LASSOEVENTS, 'scatterternary lasso'
            );
        })
        .then(function() {
            // should work after a relayout too
            return Plotly.relayout(gd, 'width', 400);
        })
        .then(function() {
            return _run(
                [[200, 200], [230, 200], [230, 230], [200, 230], [200, 200]],
                function() { assertPoints([[0.5, 0.25, 0.25]]); },
                [180, 180],
                LASSOEVENTS, 'scatterternary lasso after relayout'
            );
        })
        .catch(fail)
        .then(done);
    });

    it('should work on scattercarpet traces', function(done) {
        var assertPoints = makeAssertPoints(['a', 'b']);

        var fig = Lib.extendDeep({}, require('@mocks/scattercarpet'));
        fig.layout.dragmode = 'select';
        addInvisible(fig);

        Plotly.plot(gd, fig).then(function() {
            return _run(
                [[300, 200], [400, 250]],
                function() { assertPoints([[0.2, 1.5]]); },
                null, BOXEVENTS, 'scattercarpet select'
            );
        })
        .then(function() {
            return Plotly.relayout(gd, 'dragmode', 'lasso');
        })
        .then(function() {
            return _run(
                [[300, 200], [400, 200], [400, 250], [300, 250], [300, 200]],
                function() { assertPoints([[0.2, 1.5]]); },
                null, LASSOEVENTS, 'scattercarpet lasso'
            );
        })
        .catch(fail)
        .then(done);
    });

    it('@noCI should work on scattermapbox traces', function(done) {
        var assertPoints = makeAssertPoints(['lon', 'lat']);
        var assertRanges = makeAssertRanges('mapbox');
        var assertLassoPoints = makeAssertLassoPoints('mapbox');

        var fig = Lib.extendDeep({}, require('@mocks/mapbox_bubbles-text'));
        fig.layout.dragmode = 'select';
        fig.config = {
            mapboxAccessToken: require('@build/credentials.json').MAPBOX_ACCESS_TOKEN
        };
        addInvisible(fig);

        Plotly.plot(gd, fig).then(function() {
            return _run(
                [[370, 120], [500, 200]],
                function() {
                    assertPoints([[30, 30]]);
                    assertRanges([[21.99, 34.55], [38.14, 25.98]]);
                },
                null, BOXEVENTS, 'scattermapbox select'
            );
        })
        .then(function() {
            return Plotly.relayout(gd, 'dragmode', 'lasso');
        })
        .then(function() {
            return _run(
                [[300, 200], [300, 300], [400, 300], [400, 200], [300, 200]],
                function() {
                    assertPoints([[20, 20]]);
                    assertLassoPoints([
                        [13.28, 25.97], [13.28, 14.33], [25.71, 14.33], [25.71, 25.97], [13.28, 25.97]
                    ]);
                },
                null, LASSOEVENTS, 'scattermapbox lasso'
            );
        })
        .then(function() {
            // make selection handlers don't get called in 'pan' dragmode
            return Plotly.relayout(gd, 'dragmode', 'pan');
        })
        .then(function() {
            return _run(
                [[370, 120], [500, 200]], null, null, NOEVENTS, 'scattermapbox pan'
            );
        })
        .catch(fail)
        .then(done);
    }, LONG_TIMEOUT_INTERVAL);

    it('should work on scattergeo traces', function(done) {
        var assertPoints = makeAssertPoints(['lon', 'lat']);
        var assertRanges = makeAssertRanges('geo');
        var assertLassoPoints = makeAssertLassoPoints('geo');
        var fig = {
            data: [{
                type: 'scattergeo',
                lon: [10, 20, 30],
                lat: [10, 20, 30]
            }, {
                type: 'scattergeo',
                lon: [-10, -20, -30],
                lat: [10, 20, 30]
            }],
            layout: {
                showlegend: false,
                dragmode: 'select',
                width: 800,
                height: 600
            }
        };
        addInvisible(fig);

        Plotly.plot(gd, fig)
        .then(function() {
            return _run(
                [[350, 200], [450, 400]],
                function() {
                    assertPoints([[10, 10], [20, 20], [-10, 10], [-20, 20]]);
                    assertRanges([[-28.13, 61.88], [28.13, -50.64]]);
                },
                null, BOXEVENTS, 'scattergeo select'
            );
        })
        .then(function() {
            return Plotly.relayout(gd, 'dragmode', 'lasso');
        })
        .then(function() {
            return _run(
                [[300, 200], [300, 300], [400, 300], [400, 200], [300, 200]],
                function() {
                    assertPoints([[-10, 10], [-20, 20], [-30, 30]]);
                    assertLassoPoints([
                        [-56.25, 61.88], [-56.24, 5.63], [0, 5.63], [0, 61.88], [-56.25, 61.88]
                    ]);
                },
                null, LASSOEVENTS, 'scattergeo lasso'
            );
        })
        // .then(deselectPromise)
        .then(function() {
            // assertEventCounts(4, 2, 1, 'de-lasso');

            // make sure selection handlers don't get called in 'pan' dragmode
            return Plotly.relayout(gd, 'dragmode', 'pan');
        })
        .then(function() {
            return _run(
                [[370, 120], [500, 200]], null, null, NOEVENTS, 'scattergeo pan'
            );
        })
        .catch(fail)
        .then(done);
    }, LONG_TIMEOUT_INTERVAL);

    it('should work on choropleth traces', function(done) {
        var assertPoints = makeAssertPoints(['location', 'z']);
        var assertRanges = makeAssertRanges('geo', -0.5);
        var assertLassoPoints = makeAssertLassoPoints('geo', -0.5);

        var fig = Lib.extendDeep({}, require('@mocks/geo_choropleth-text'));
        fig.layout.width = 870;
        fig.layout.height = 450;
        fig.layout.dragmode = 'select';
        fig.layout.geo.scope = 'europe';
        addInvisible(fig, false);

        // add a trace with no locations which will then make trace invisible, lacking DOM elements
        var emptyChoroplethTrace = Lib.extendDeep({}, fig.data[0]);
        emptyChoroplethTrace.text = [];
        emptyChoroplethTrace.locations = [];
        emptyChoroplethTrace.z = [];
        fig.data.push(emptyChoroplethTrace);

        Plotly.plot(gd, fig)
        .then(function() {
            return _run(
                [[350, 200], [400, 250]],
                function() {
                    assertPoints([['GBR', 26.507354205352502], ['IRL', 86.4125147625692]]);
                    assertRanges([[-19.11, 63.06], [7.31, 53.72]]);
                },
                [280, 190],
                BOXEVENTS, 'choropleth select'
            );
        })
        .then(function() {
            return Plotly.relayout(gd, 'dragmode', 'lasso');
        })
        .then(function() {
            return _run(
                [[350, 200], [400, 200], [400, 250], [350, 250], [350, 200]],
                function() {
                    assertPoints([['GBR', 26.507354205352502], ['IRL', 86.4125147625692]]);
                    assertLassoPoints([
                        [-19.11, 63.06], [5.50, 65.25], [7.31, 53.72], [-12.90, 51.70], [-19.11, 63.06]
                    ]);
                },
                [280, 190],
                LASSOEVENTS, 'choropleth lasso'
            );
        })
        .then(function() {
            // make selection handlers don't get called in 'pan' dragmode
            return Plotly.relayout(gd, 'dragmode', 'pan');
        })
        .then(function() {
            return _run(
                [[370, 120], [500, 200]], null, [280, 190], NOEVENTS, 'choropleth pan'
            );
        })
        .catch(fail)
        .then(done);
    }, LONG_TIMEOUT_INTERVAL);

    it('should work for bar traces', function(done) {
        var assertPoints = makeAssertPoints(['curveNumber', 'x', 'y']);
        var assertRanges = makeAssertRanges();
        var assertLassoPoints = makeAssertLassoPoints();

        var fig = Lib.extendDeep({}, require('@mocks/0'));
        fig.layout.dragmode = 'lasso';
        addInvisible(fig);

        Plotly.plot(gd, fig)
        .then(function() {
            return _run(
                [[350, 200], [400, 200], [400, 250], [350, 250], [350, 200]],
                function() {
                    assertPoints([
                        [0, 4.9, 0.371], [0, 5, 0.368], [0, 5.1, 0.356], [0, 5.2, 0.336],
                        [0, 5.3, 0.309], [0, 5.4, 0.275], [0, 5.5, 0.235], [0, 5.6, 0.192],
                        [0, 5.7, 0.145],
                        [1, 5.1, 0.485], [1, 5.2, 0.409], [1, 5.3, 0.327],
                        [1, 5.4, 0.24], [1, 5.5, 0.149], [1, 5.6, 0.059],
                        [2, 4.9, 0.473], [2, 5, 0.368], [2, 5.1, 0.258],
                        [2, 5.2, 0.146], [2, 5.3, 0.036]
                    ]);
                    assertLassoPoints([
                        [4.87, 5.74, 5.74, 4.87, 4.87],
                        [0.53, 0.53, -0.02, -0.02, 0.53]
                    ]);
                },
                null, LASSOEVENTS, 'bar lasso'
            );
        })
        .then(function() {
            return Plotly.relayout(gd, 'dragmode', 'select');
        })
        .then(function() {
            return _run(
                [[350, 200], [370, 220]],
                function() {
                    assertPoints([
                        [0, 4.9, 0.371], [0, 5, 0.368], [0, 5.1, 0.356], [0, 5.2, 0.336],
                        [1, 5.1, 0.485], [1, 5.2, 0.41],
                        [2, 4.9, 0.473], [2, 5, 0.37]
                    ]);
                    assertRanges([[4.87, 5.22], [0.31, 0.53]]);
                },
                null, BOXEVENTS, 'bar select'
            );
        })
        .catch(fail)
        .then(done);
    });

    it('should work for date/category traces', function(done) {
        var assertPoints = makeAssertPoints(['curveNumber', 'x', 'y']);

        var fig = {
            data: [{
                x: ['2017-01-01', '2017-02-01', '2017-03-01'],
                y: ['a', 'b', 'c']
            }, {
                type: 'bar',
                x: ['2017-01-01', '2017-02-02', '2017-03-01'],
                y: ['a', 'b', 'c']
            }],
            layout: {
                dragmode: 'lasso',
                width: 400,
                height: 400
            }
        };
        addInvisible(fig);

        var x0 = 100;
        var y0 = 100;
        var x1 = 250;
        var y1 = 250;

        Plotly.plot(gd, fig)
        .then(function() {
            return _run(
                [[x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0]],
                function() {
                    assertPoints([
                        [0, '2017-02-01', 'b'],
                        [1, '2017-02-02', 'b']
                    ]);
                },
                null, LASSOEVENTS, 'date/category lasso'
            );
        })
        .then(function() {
            return Plotly.relayout(gd, 'dragmode', 'select');
        })
        .then(function() {
            return _run(
                [[x0, y0], [x1, y1]],
                function() {
                    assertPoints([
                        [0, '2017-02-01', 'b'],
                        [1, '2017-02-02', 'b']
                    ]);
                },
                null, BOXEVENTS, 'date/category select'
            );
        })
        .catch(fail)
        .then(done);
    });

    it('should work for histogram traces', function(done) {
        var assertPoints = makeAssertPoints(['curveNumber', 'x', 'y']);
        var assertRanges = makeAssertRanges();
        var assertLassoPoints = makeAssertLassoPoints();

        var fig = Lib.extendDeep({}, require('@mocks/hist_grouped'));
        fig.layout.dragmode = 'lasso';
        fig.layout.width = 600;
        fig.layout.height = 500;
        addInvisible(fig);

        Plotly.plot(gd, fig)
        .then(function() {
            return _run(
                [[200, 200], [400, 200], [400, 350], [200, 350], [200, 200]],
                function() {
                    assertPoints([
                        [0, 1.8, 2], [1, 2.2, 1], [1, 3.2, 1]
                    ]);
                    assertLassoPoints([
                        [1.66, 3.59, 3.59, 1.66, 1.66],
                        [2.17, 2.17, 0.69, 0.69, 2.17]
                    ]);
                },
                null, LASSOEVENTS, 'histogram lasso'
            );
        })
        .then(function() {
            return Plotly.relayout(gd, 'dragmode', 'select');
        })
        .then(function() {
            return _run(
                [[200, 200], [400, 350]],
                function() {
                    assertPoints([
                        [0, 1.8, 2], [1, 2.2, 1], [1, 3.2, 1]
                    ]);
                    assertRanges([[1.66, 3.59], [0.69, 2.17]]);
                },
                null, BOXEVENTS, 'histogram select'
            );
        })
        .catch(fail)
        .then(done);
    });

    it('should work for box traces', function(done) {
        var assertPoints = makeAssertPoints(['curveNumber', 'y', 'x']);
        var assertRanges = makeAssertRanges();
        var assertLassoPoints = makeAssertLassoPoints();

        var fig = Lib.extendDeep({}, require('@mocks/box_grouped'));
        fig.data.forEach(function(trace) {
            trace.boxpoints = 'all';
        });
        fig.layout.dragmode = 'lasso';
        fig.layout.width = 600;
        fig.layout.height = 500;
        addInvisible(fig);

        Plotly.plot(gd, fig)
        .then(function() {
            return _run(
                [[200, 200], [400, 200], [400, 350], [200, 350], [200, 200]],
                function() {
                    assertPoints([
                        [0, 0.2, 'day 2'], [0, 0.3, 'day 2'], [0, 0.5, 'day 2'], [0, 0.7, 'day 2'],
                        [1, 0.2, 'day 2'], [1, 0.5, 'day 2'], [1, 0.7, 'day 2'], [1, 0.7, 'day 2'],
                        [2, 0.3, 'day 1'], [2, 0.6, 'day 1'], [2, 0.6, 'day 1']
                    ]);
                    assertLassoPoints([
                        ['day 1', 'day 2', 'day 2', 'day 1', 'day 1'],
                        [0.71, 0.71, 0.1875, 0.1875, 0.71]
                    ]);
                },
                null, LASSOEVENTS, 'box lasso'
            );
        })
        .then(function() {
            return Plotly.relayout(gd, 'dragmode', 'select');
        })
        .then(function() {
            return _run(
                [[200, 200], [400, 350]],
                function() {
                    assertPoints([
                        [0, 0.2, 'day 2'], [0, 0.3, 'day 2'], [0, 0.5, 'day 2'], [0, 0.7, 'day 2'],
                        [1, 0.2, 'day 2'], [1, 0.5, 'day 2'], [1, 0.7, 'day 2'], [1, 0.7, 'day 2'],
                        [2, 0.3, 'day 1'], [2, 0.6, 'day 1'], [2, 0.6, 'day 1']
                    ]);
                    assertRanges([['day 1', 'day 2'], [0.1875, 0.71]]);
                },
                null, BOXEVENTS, 'box select'
            );
        })
        .catch(fail)
        .then(done);
    });
});

// to make sure none of the above tests fail with extraneous invisible traces,
// add a bunch of them here
function addInvisible(fig, canHaveLegend) {
    var data = fig.data;
    var inputData = Lib.extendDeep([], data);
    for(var i = 0; i < inputData.length; i++) {
        data.push(Lib.extendDeep({}, inputData[i], {visible: false}));
        if(canHaveLegend !== false) data.push(Lib.extendDeep({}, inputData[i], {visible: 'legendonly'}));
    }

    if(inputData.length === 1 && fig.layout.showlegend !== true) fig.layout.showlegend = false;
}
