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

    if(options.type === 'touch') {
        touchEvent('touchstart', path[0][0], path[0][1]);

        path.slice(1, len).forEach(function(pt) {
            touchEvent('touchmove', pt[0], pt[1]);
        });

        touchEvent('touchend', path[len - 1][0], path[len - 1][1]);
        return;
    }

    mouseEvent('mousemove', path[0][0], path[0][1]);
    mouseEvent('mousedown', path[0][0], path[0][1]);

    path.slice(1, len).forEach(function(pt) {
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

    describe('select elements', function() {
        var mockCopy = Lib.extendDeep({}, mock);
        mockCopy.layout.dragmode = 'select';

        var gd;
        beforeEach(function(done) {
            gd = createGraphDiv();

            Plotly.plot(gd, mockCopy.data, mockCopy.layout)
                .then(done);
        });

        it('should be appended to the zoom layer', function(done) {
            var x0 = 100,
                y0 = 200,
                x1 = 150,
                y1 = 250,
                x2 = 50,
                y2 = 50;

            gd.once('plotly_selecting', function() {
                assertSelectionNodes(1, 2);
            });

            gd.once('plotly_selected', function() {
                assertSelectionNodes(0, 2);
            });

            gd.once('plotly_deselect', function() {
                assertSelectionNodes(0, 0);
            });

            mouseEvent('mousemove', x0, y0);
            assertSelectionNodes(0, 0);

            drag([[x0, y0], [x1, y1]]);
            doubleClick(x2, y2).then(done);
        });
    });

    describe('lasso elements', function() {
        var mockCopy = Lib.extendDeep({}, mock);
        mockCopy.layout.dragmode = 'lasso';

        var gd;
        beforeEach(function(done) {
            gd = createGraphDiv();

            Plotly.plot(gd, mockCopy.data, mockCopy.layout)
                .then(done);
        });

        it('should be appended to the zoom layer', function(done) {
            var x0 = 100,
                y0 = 200,
                x1 = 150,
                y1 = 250,
                x2 = 50,
                y2 = 50;

            gd.once('plotly_selecting', function() {
                assertSelectionNodes(1, 2);
            });

            gd.once('plotly_selected', function() {
                assertSelectionNodes(0, 2);
            });

            gd.once('plotly_deselect', function() {
                assertSelectionNodes(0, 0);
            });

            mouseEvent('mousemove', x0, y0);
            assertSelectionNodes(0, 0);

            drag([[x0, y0], [x1, y1]]);
            doubleClick(x2, y2).then(done);
        });
    });

    describe('select events', function() {
        var mockCopy = Lib.extendDeep({}, mock);
        mockCopy.layout.dragmode = 'select';
        mockCopy.data[0].ids = mockCopy.data[0].x
            .map(function(v) { return 'id-' + v; });
        mockCopy.data[0].customdata = mockCopy.data[0].y
            .map(function(v) { return 'customdata-' + v; });

        var gd;
        beforeEach(function(done) {
            gd = createGraphDiv();

            Plotly.plot(gd, mockCopy.data, mockCopy.layout)
                .then(done);
        });

        it('should trigger selecting/selected/deselect events', function(done) {
            var selectingCnt = 0,
                selectingData;
            gd.on('plotly_selecting', function(data) {
                selectingCnt++;
                selectingData = data;
            });

            var selectedCnt = 0,
                selectedData;
            gd.on('plotly_selected', function(data) {
                selectedCnt++;
                selectedData = data;
            });

            var doubleClickData;
            gd.on('plotly_deselect', function(data) {
                doubleClickData = data;
            });

            drag(selectPath);

            expect(selectingCnt).toEqual(1, 'with the correct selecting count');
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
            expect(selectedCnt).toEqual(1, 'with the correct selected count');
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

            doubleClick(250, 200).then(function() {
                expect(doubleClickData).toBe(null, 'with the correct deselect data');
                done();
            });
        });

    });

    describe('lasso events', function() {
        var mockCopy = Lib.extendDeep({}, mock);
        mockCopy.layout.dragmode = 'lasso';

        var gd;
        beforeEach(function(done) {
            gd = createGraphDiv();

            Plotly.plot(gd, mockCopy.data, mockCopy.layout)
                .then(done);
        });

        it('should trigger selecting/selected/deselect events', function(done) {
            var selectingCnt = 0,
                selectingData;
            gd.on('plotly_selecting', function(data) {
                selectingCnt++;
                selectingData = data;
            });

            var selectedCnt = 0,
                selectedData;
            gd.on('plotly_selected', function(data) {
                selectedCnt++;
                selectedData = data;
            });

            var doubleClickData;
            gd.on('plotly_deselect', function(data) {
                doubleClickData = data;
            });

            drag(lassoPath);

            expect(selectingCnt).toEqual(3, 'with the correct selecting count');
            assertEventData(selectingData.points, [{
                curveNumber: 0,
                pointNumber: 10,
                x: 0.099,
                y: 2.75
            }], 'with the correct selecting points (1)');

            expect(selectedCnt).toEqual(1, 'with the correct selected count');
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

            doubleClick(250, 200).then(function() {
                expect(doubleClickData).toBe(null, 'with the correct deselect data');
                done();
            });
        });

        it('should trigger selecting/selected/deselect events for touches', function(done) {
            var selectingCnt = 0,
                selectingData;
            gd.on('plotly_selecting', function(data) {
                selectingCnt++;
                selectingData = data;
            });

            var selectedCnt = 0,
                selectedData;
            gd.on('plotly_selected', function(data) {
                selectedCnt++;
                selectedData = data;
            });

            var doubleClickData;
            gd.on('plotly_deselect', function(data) {
                doubleClickData = data;
            });

            drag(lassoPath, {type: 'touch'});

            expect(selectingCnt).toEqual(3, 'with the correct selecting count');
            assertEventData(selectingData.points, [{
                curveNumber: 0,
                pointNumber: 10,
                x: 0.099,
                y: 2.75
            }], 'with the correct selecting points (1)');

            expect(selectedCnt).toEqual(1, 'with the correct selected count');
            assertEventData(selectedData.points, [{
                curveNumber: 0,
                pointNumber: 10,
                x: 0.099,
                y: 2.75,
            }], 'with the correct selected points (2)');

            doubleClick(250, 200).then(function() {
                expect(doubleClickData).toBe(null, 'with the correct deselect data');
                done();
            });
        });
    });

    it('should skip over non-visible traces', function(done) {
        var mockCopy = Lib.extendDeep({}, mock);
        mockCopy.layout.dragmode = 'select';

        var gd = createGraphDiv();
        var selectedPtLength;

        Plotly.plot(gd, mockCopy.data, mockCopy.layout).then(function() {
            gd.on('plotly_selected', function(data) {
                selectedPtLength = data.points.length;
            });

            drag(selectPath);
            expect(selectedPtLength).toEqual(2, '(case 0)');

            return Plotly.restyle(gd, 'visible', 'legendonly');
        }).then(function() {
            drag(selectPath);
            expect(selectedPtLength).toEqual(0, '(legendonly case)');

            return Plotly.restyle(gd, 'visible', true);
        }).then(function() {
            drag(selectPath);
            expect(selectedPtLength).toEqual(2, '(back to case 0)');

            return Plotly.relayout(gd, 'dragmode', 'lasso');
        }).then(function() {
            drag(lassoPath);
            expect(selectedPtLength).toEqual(1, '(case 0 lasso)');

            return Plotly.restyle(gd, 'visible', 'legendonly');
        }).then(function() {
            drag(lassoPath);
            expect(selectedPtLength).toEqual(0, '(lasso legendonly case)');

            return Plotly.restyle(gd, 'visible', true);
        }).then(function() {
            drag(lassoPath);
            expect(selectedPtLength).toEqual(1, '(back to lasso case 0)');

            done();
        });
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
        var pts;

        Plotly.plot(gd, data, layout).then(function() {
            gd.on('plotly_selected', function(data) {
                pts = data.points;
            });

            drag([[100, 100], [300, 300]]);
            expect(pts.length).toEqual(1);
            expect(pts[0].x).toEqual(0);
            expect(pts[0].y).toEqual(0);

            return Plotly.relayout(gd, 'dragmode', 'lasso');
        })
        .then(function() {
            drag([[100, 100], [100, 300], [300, 300], [300, 100], [100, 100]]);
            expect(pts.length).toEqual(1);
            expect(pts[0].x).toEqual(0);
            expect(pts[0].y).toEqual(0);
        })
        .then(done);
    });
});

describe('Test select box and lasso per trace:', function() {
    var gd;
    var eventData;

    afterEach(destroyGraphDiv);

    function makeAssertPoints(keys) {
        var callNumber = 0;

        return function(expected) {
            var msg = '(call #' + callNumber + ') ';
            var pts = (eventData || {}).points || [];

            expect(pts.length).toBe(expected.length, msg + 'selected points length');

            pts.forEach(function(p, i) {
                var e = expected[i] || [];
                keys.forEach(function(k, j) {
                    expect(p[k])
                        .toBe(e[j], msg + 'selected pt ' + i + ' - ' + k + ' val');
                });
            });

            callNumber++;
        };
    }

    function makeAssertRanges(subplot, tol) {
        tol = tol || 1;
        var callNumber = 0;

        return function(expected) {
            var msg = '(call #' + callNumber + ') ';
            var ranges = (eventData.range || {})[subplot] || [];

            expect(ranges)
                .toBeCloseTo2DArray(expected, tol, msg + 'select box range for ' + subplot);

            callNumber++;
        };
    }

    function makeAssertLassoPoints(subplot, tol) {
        tol = tol || 1;
        var callNumber = 0;

        return function(expected) {
            var msg = '(call #' + callNumber + ') ';
            var lassoPoints = (eventData.lassoPoints || {})[subplot] || [];

            expect(lassoPoints)
                .toBeCloseTo2DArray(expected, tol, msg + 'lasso points for ' + subplot);

            callNumber++;
        };
    }

    function _run(dragPath, afterDragFn, dblClickPos) {
        afterDragFn = afterDragFn || function() {};
        dblClickPos = dblClickPos || [250, 200];

        var selectingCnt = 0;
        var selectedCnt = 0;
        var deselectCnt = 0;

        gd.once('plotly_selecting', function() {
            assertSelectionNodes(1, 2);
            selectingCnt++;
        });

        gd.once('plotly_selected', function(d) {
            assertSelectionNodes(0, 2);
            selectedCnt++;
            eventData = d;
        });

        gd.once('plotly_deselect', function() {
            deselectCnt++;
            assertSelectionNodes(0, 0);
        });

        assertSelectionNodes(0, 0);
        drag(dragPath);
        afterDragFn();

        return doubleClick(dblClickPos[0], dblClickPos[1]).then(function() {
            expect(selectingCnt).toBe(1, 'plotly_selecting call count');
            expect(selectedCnt).toBe(1, 'plotly_selected call count');
            expect(deselectCnt).toBe(1, 'plotly_deselect call count');
        });
    }

    function _runNoSelect(dragPath, afterDragFn, dblClickPos) {
        afterDragFn = afterDragFn || function() {};
        dblClickPos = dblClickPos || [250, 200];

        var selectingCnt = 0;
        var selectedCnt = 0;
        var deselectCnt = 0;

        gd.once('plotly_selecting', function() {
            selectingCnt++;
        });

        gd.once('plotly_selected', function() {
            selectedCnt++;
        });

        gd.once('plotly_deselect', function() {
            deselectCnt++;
        });

        assertSelectionNodes(0, 0);
        drag(dragPath);
        afterDragFn();

        return doubleClick(dblClickPos[0], dblClickPos[1]).then(function() {
            expect(selectingCnt).toBe(0, 'plotly_selecting call count');
            expect(selectedCnt).toBe(0, 'plotly_selected call count');
            expect(deselectCnt).toBe(0, 'plotly_deselect call count');
        });
    }

    it('should work on scatterternary traces', function(done) {
        gd = createGraphDiv();

        var assertPoints = makeAssertPoints(['a', 'b', 'c']);

        var fig = Lib.extendDeep({}, require('@mocks/ternary_simple'));
        fig.layout.width = 800;
        fig.layout.dragmode = 'select';

        Plotly.plot(gd, fig).then(function() {
            return _run([[400, 200], [445, 235]], function() {
                assertPoints([[0.5, 0.25, 0.25]]);
            }, [380, 180]);
        })
        .then(function() {
            return Plotly.relayout(gd, 'dragmode', 'lasso');
        })
        .then(function() {
            return _run([[400, 200], [445, 200], [445, 235], [400, 235], [400, 200]], function() {
                assertPoints([[0.5, 0.25, 0.25]]);
            }, [380, 180]);
        })
        .then(function() {
            // should work after a relayout too
            return Plotly.relayout(gd, 'width', 400);
        })
        .then(function() {
            return _run([[200, 200], [230, 200], [230, 230], [200, 230], [200, 200]], function() {
                assertPoints([[0.5, 0.25, 0.25]]);
            }, [180, 180]);
        })
        .catch(fail)
        .then(done);
    });

    it('should work on scattercarpet traces', function(done) {
        gd = createGraphDiv();

        var assertPoints = makeAssertPoints(['a', 'b']);

        var fig = Lib.extendDeep({}, require('@mocks/scattercarpet'));
        fig.layout.dragmode = 'select';

        Plotly.plot(gd, fig).then(function() {
            return _run([[300, 200], [400, 250]], function() {
                assertPoints([[0.2, 1.5]]);
            });
        })
        .then(function() {
            return Plotly.relayout(gd, 'dragmode', 'lasso');
        })
        .then(function() {
            return _run([[300, 200], [400, 200], [400, 250], [300, 250], [300, 200]], function() {
                assertPoints([[0.2, 1.5]]);
            });
        })
        .catch(fail)
        .then(done);
    });

    it('@noCI should work on scattermapbox traces', function(done) {
        gd = createGraphDiv();

        var assertPoints = makeAssertPoints(['lon', 'lat']);
        var assertRanges = makeAssertRanges('mapbox');
        var assertLassoPoints = makeAssertLassoPoints('mapbox');

        var fig = Lib.extendDeep({}, require('@mocks/mapbox_bubbles-text'));
        fig.layout.dragmode = 'select';
        fig.config = {
            mapboxAccessToken: require('@build/credentials.json').MAPBOX_ACCESS_TOKEN
        };

        Plotly.plot(gd, fig).then(function() {
            return _run([[370, 120], [500, 200]], function() {
                assertPoints([[30, 30]]);
                assertRanges([[21.99, 34.55], [38.14, 25.98]]);
            });
        })
        .then(function() {
            return Plotly.relayout(gd, 'dragmode', 'lasso');
        })
        .then(function() {
            return _run([[300, 200], [300, 300], [400, 300], [400, 200], [300, 200]], function() {
                assertPoints([[20, 20]]);
                assertLassoPoints([
                    [13.28, 25.97], [13.28, 14.33], [25.71, 14.33], [25.71, 25.97], [13.28, 25.97]
                ]);
            });
        })
        .then(function() {
            // make selection handlers don't get called in 'pan' dragmode
            return Plotly.relayout(gd, 'dragmode', 'pan');
        })
        .then(function() {
            return _runNoSelect([[370, 120], [500, 200]]);
        })
        .catch(fail)
        .then(done);
    }, LONG_TIMEOUT_INTERVAL);
});
