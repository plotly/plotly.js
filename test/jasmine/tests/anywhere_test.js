var Plotly = require('@lib/index');
var Lib = require('@src/lib');
var click = require('../assets/click');

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var DBLCLICKDELAY = require('@src/plot_api/plot_config').dfltConfig.doubleClickDelay;

var clickEvent;
var clickedPromise;

function resetEvents(gd) {
    clickEvent = null;

    gd.removeAllListeners();

    clickedPromise = new Promise(function(resolve) {
        gd.on('plotly_click', function(data) {
            clickEvent = data.points[0];
            resolve();
        });
    });
}

describe('Click-to-select', function() {
    var mock14PtsScatter = {
        'in-margin': { x: 28, y: 28 },
        'point-0': { x: 92, y: 102 },
        'between-point-0-and-1': { x: 117, y: 110 },
        'point-11': { x: 339, y: 214 },
    };
    var expectedEventsScatter = {
        'in-margin': false,
        'point-0': {
            curveNumber: 0,
            pointIndex: 0,
            pointNumber: 0,
            x: 0.002,
            y: 16.25
        },
        'between-point-0-and-1': { x: 0.002990379231567056, y: 14.169142943944111 },
        'point-11': {
            curveNumber: 0,
            pointIndex: 11,
            pointNumber: 11,
            x: 0.125,
            y: 2.125
        },
    };

    var mockPtsGeoscatter = {
        'start': {lat: 40.7127, lon: -74.0059},
        'end': {lat: 51.5072, lon: 0.1275},
    };
    var mockPtsGeoscatterClick = {
        'in-margin': { x: 28, y: 28 },
        'start': {x: 239, y: 174},
        'end': {x: 426, y: 157},
        'iceland': {x: 322, y: 150},
    };
    var expectedEventsGeoscatter = {
        'in-margin': false,
        'start': {
            curveNumber: 0,
            pointIndex: 0,
            pointNumber: 0,
            lat: 40.7127,
            lon: -74.0059,
        },
        'end': {
            curveNumber: 0,
            pointIndex: 1,
            pointNumber: 1,
            lat: 51.5072,
            lon: 51.5072,
        },
        'iceland': {lat: -18.666562962962963, lon: 56.66635185185185},
    };

    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(function() {
        resetEvents(gd);
        destroyGraphDiv();
    });

    function plotMock14Anywhere(layoutOpts) {
        var mock = require('@mocks/14.json');
        var defaultLayoutOpts = {
            layout: {
                clickmode: 'event+anywhere',
                hoverdistance: 1
            }
        };
        var mockCopy = Lib.extendDeep(
            {},
            mock,
            defaultLayoutOpts,
            { layout: layoutOpts });

        return Plotly.newPlot(gd, mockCopy.data, mockCopy.layout);
    }

    function plotMock14AnywhereSelect(layoutOpts) {
        var mock = require('@mocks/14.json');
        var defaultLayoutOpts = {
            layout: {
                clickmode: 'select+event+anywhere',
                hoverdistance: 1
            }
        };
        var mockCopy = Lib.extendDeep(
            {},
            mock,
            defaultLayoutOpts,
            { layout: layoutOpts });

        return Plotly.newPlot(gd, mockCopy.data, mockCopy.layout);
    }

    function plotGeoscatterAnywhere() {
        var layout = {
            clickmode: 'event+anywhere',
            hoverdistance: 1
        };
        var data = [{
            type: 'scattergeo',
            lat: [ mockPtsGeoscatter.start.lat, mockPtsGeoscatter.end.lat ],
            lon: [ mockPtsGeoscatter.start.lon, mockPtsGeoscatter.end.lat ],
            mode: 'lines',
            line: {
                width: 2,
                color: 'blue'
            }
        }];
        return Plotly.newPlot(gd, data, layout);
    }

    function isSubset(superObj, subObj) {
        return superObj === subObj ||
            typeof superObj === 'object' &&
            typeof subObj === 'object' && (
                subObj.valueOf() === superObj.valueOf() ||
                Object.keys(subObj).every(function(k) { return isSubset(superObj[k], subObj[k]); })
            );
    }

    /**
     * Executes a click and before resets event handlers.
     * Returns the `clickedPromise` for convenience.
     */
    function _click(x, y, clickOpts) {
        resetEvents(gd);
        setTimeout(function() {
            click(x, y, clickOpts);
        }, DBLCLICKDELAY * 1.03);
        return clickedPromise;
    }

    function clickAndTestPoint(mockPts, expectedEvents, pointKey, clickOpts) {
        var x = mockPts[pointKey].x;
        var y = mockPts[pointKey].y;
        var expectedEvent = expectedEvents[pointKey];
        var result = _click(x, y, clickOpts);
        if(expectedEvent) {
            result.then(function() {
                expect(isSubset(clickEvent, expectedEvent)).toBe(true);
            });
        } else {
            expect(clickEvent).toBe(null);
            result = null;
        }
        return result;
    }

    it('selects point and/or coordinate when clicked - scatter - event+anywhere', function(done) {
        plotMock14Anywhere()
            .then(function() { return clickAndTestPoint(mock14PtsScatter, expectedEventsScatter, 'in-margin'); })
            .then(function() { return clickAndTestPoint(mock14PtsScatter, expectedEventsScatter, 'point-0'); })
            .then(function() { return clickAndTestPoint(mock14PtsScatter, expectedEventsScatter, 'between-point-0-and-1'); })
            .then(function() { return clickAndTestPoint(mock14PtsScatter, expectedEventsScatter, 'point-11'); })
            .then(done, done.fail);
    });

    it('selects point and/or coordinate when clicked - scatter - select+event+anywhere', function(done) {
        plotMock14AnywhereSelect()
            .then(function() { return clickAndTestPoint(mock14PtsScatter, expectedEventsScatter, 'in-margin'); })
            .then(function() { return clickAndTestPoint(mock14PtsScatter, expectedEventsScatter, 'point-0'); })
            .then(function() { return clickAndTestPoint(mock14PtsScatter, expectedEventsScatter, 'between-point-0-and-1'); })
            .then(function() { return clickAndTestPoint(mock14PtsScatter, expectedEventsScatter, 'point-11'); })
            .then(done, done.fail);
    });

    it('selects point and/or coordinate when clicked - geoscatter - event+anywhere', function(done) {
        plotGeoscatterAnywhere()
            .then(function() { return clickAndTestPoint(mockPtsGeoscatterClick, expectedEventsGeoscatter, 'in-margin'); })
            .then(function() { return clickAndTestPoint(mockPtsGeoscatterClick, expectedEventsGeoscatter, 'start'); })
            .then(function() { return clickAndTestPoint(mockPtsGeoscatterClick, expectedEventsGeoscatter, 'end'); })
            .then(function() { return clickAndTestPoint(mockPtsGeoscatterClick, expectedEventsGeoscatter, 'iceland'); })
            .then(done, done.fail);
    });
});
