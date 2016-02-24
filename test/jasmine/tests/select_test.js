var Plotly = require('@lib/index');
var Lib = require('@src/lib');
var DBLCLICKDELAY = require('@src/plots/cartesian/constants').DBLCLICKDELAY;

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var mouseEvent = require('../assets/mouse_event');
var customMatchers = require('../assets/custom_matchers');


describe('select box and lasso', function() {
    var mock = require('@mocks/14.json');

    beforeEach(function() {
        jasmine.addMatchers(customMatchers);
    });

    afterEach(destroyGraphDiv);

    function drag(path) {
        var len = path.length;

        mouseEvent('mousemove', path[0][0], path[0][1]);
        mouseEvent('mousedown', path[0][0], path[0][1]);

        path.slice(1, len).forEach(function(pt) {
            mouseEvent('mousemove', pt[0], pt[1]);
        });

        mouseEvent('mouseup', path[len - 1][0], path[len - 1][1]);
    }

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

    function assertRange(actual, expected) {
        var PRECISION = 4;

        expect(actual.x).toBeCloseToArray(expected.x, PRECISION);
        expect(actual.y).toBeCloseToArray(expected.y, PRECISION);
    }

    describe('select events', function() {
        var mockCopy = Lib.extendDeep({}, mock);
        mockCopy.layout.dragmode = 'select';

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

            drag([[100, 200], [150, 200]]);

            expect(selectingCnt).toEqual(1, 'with the correct selecting count');
            expect(selectingData.points).toEqual([{
                curveNumber: 0,
                pointNumber: 0,
                x: 0.002,
                y: 16.25
            }, {
                curveNumber: 0,
                pointNumber: 1,
                x: 0.004,
                y: 12.5
            }], 'with the correct selecting points');
            assertRange(selectingData.range, {
                x: [0.0019667582669138295, 0.004546754982054625],
                y: [0.10209191961595454, 24.512223978291406]
            }, 'with the correct selecting range');

            expect(selectedCnt).toEqual(1, 'with the correct selected count');
            expect(selectedData.points).toEqual([{
                curveNumber: 0,
                pointNumber: 0,
                x: 0.002,
                y: 16.25
            }, {
                curveNumber: 0,
                pointNumber: 1,
                x: 0.004,
                y: 12.5
            }], 'with the correct selected points');
            assertRange(selectedData.range, {
                x: [0.0019667582669138295, 0.004546754982054625],
                y: [0.10209191961595454, 24.512223978291406]
            }, 'with the correct selected range');

            doubleClick(250, 200, function() {
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

            drag([[331, 178], [333, 246], [350, 250], [343, 176]]);

            expect(selectingCnt).toEqual(3, 'with the correct selecting count');
            expect(selectingData.points).toEqual([{
                curveNumber: 0,
                pointNumber: 10,
                x: 0.099,
                y: 2.75
            }], 'with the correct selecting points');

            expect(selectedCnt).toEqual(1, 'with the correct selected count');
            expect(selectedData.points).toEqual([{
                curveNumber: 0,
                pointNumber: 10,
                x: 0.099,
                y: 2.75
            }], 'with the correct selected points');

            doubleClick(250, 200, function() {
                expect(doubleClickData).toBe(null, 'with the correct deselect data');
                done();
            });
        });
    });
});
