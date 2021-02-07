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
    var mock14Pts = {
        'in-margin': { x: 28, y: 28 },
        'point-0': { x: 92, y: 102 },
        'between-point-0-and-1': { x: 117, y: 110 },
        'point-11': { x: 339, y: 214 },
    };
    var expectedEvents = {
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
    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(destroyGraphDiv);

    function plotMock14(layoutOpts) {
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

    function clickAndTestPoint(pointKey, clickOpts) {
        var x = mock14Pts[pointKey].x;
        var y = mock14Pts[pointKey].y;
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

    it('selects point and/or coordinate when clicked', function(done) {
        plotMock14()
            .then(function() { return clickAndTestPoint('in-margin'); })
            .then(function() { return clickAndTestPoint('point-0'); })
            .then(function() { return clickAndTestPoint('between-point-0-and-1'); })
            .then(function() { return clickAndTestPoint('point-11'); })
            .then(done, done.fail);
    });
});
