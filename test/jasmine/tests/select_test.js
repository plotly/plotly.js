var d3Select = require('../../strict-d3').select;
var d3SelectAll = require('../../strict-d3').selectAll;

var Plotly = require('../../../lib/index');
var Lib = require('../../../src/lib');
var click = require('../assets/click');
var doubleClick = require('../assets/double_click');
var DBLCLICKDELAY = require('../../../src/plot_api/plot_config').dfltConfig.doubleClickDelay;

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');

var mouseEvent = require('../assets/mouse_event');
var touchEvent = require('../assets/touch_event');

var LONG_TIMEOUT_INTERVAL = 5 * jasmine.DEFAULT_TIMEOUT_INTERVAL;
var delay = require('../assets/delay');
var sankeyConstants = require('../../../src/traces/sankey/constants');

function _newPlot(gd, arg2, arg3, arg4) {
    var fig;
    if(Array.isArray(arg2)) {
        fig = {
            data: arg2,
            layout: arg3,
            config: arg4
        };
    } else fig = arg2;

    if(!fig.layout) fig.layout = {};
    if(!fig.layout.newselection) fig.layout.newselection = {};
    fig.layout.newselection.mode = 'gradual';
    // complex ouline creation are mainly tested in 'gradual' mode here
    return Plotly.newPlot(gd, fig);
}

function drag(path, options) {
    var len = path.length;

    if(!options) options = {type: 'mouse'};

    Lib.clearThrottle();

    if(options.type === 'touch') {
        touchEvent('touchstart', path[0][0], path[0][1], options);

        path.slice(1, len).forEach(function(pt) {
            Lib.clearThrottle();
            touchEvent('touchmove', pt[0], pt[1], options);
        });

        touchEvent('touchend', path[len - 1][0], path[len - 1][1], options);
        return;
    }

    mouseEvent('mousemove', path[0][0], path[0][1], options);
    mouseEvent('mousedown', path[0][0], path[0][1], options);

    path.slice(1, len).forEach(function(pt) {
        Lib.clearThrottle();
        mouseEvent('mousemove', pt[0], pt[1], options);
    });

    mouseEvent('mouseup', path[len - 1][0], path[len - 1][1], options);
}

function assertSelectionNodes(cornerCnt, outlineCnt, _msg) {
    var msg = _msg ? ' - ' + _msg : '';

    expect(d3SelectAll('.zoomlayer > .zoombox-corners').size())
        .toBe(cornerCnt, 'selection corner count' + msg);
    expect(d3SelectAll('.zoomlayer > .select-outline').size())
        .toBe(outlineCnt, 'selection outline count' + msg);
}

var selectingCnt, selectingData, selectedCnt, selectedData, deselectCnt, doubleClickData;
var selectedPromise, deselectPromise, clickedPromise, relayoutPromise;

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
            assertSelectionNodes(1, 1);
            selectingCnt++;
            selectingData = data;
        });

        gd.on('plotly_selected', function(data) {
            // With click-to-select supported, selection nodes are only
            // in the DOM in certain circumstances.
            if(data &&
              gd._fullLayout.dragmode.indexOf('select') > -1 &&
              gd._fullLayout.dragmode.indexOf('lasso') > -1) {
                assertSelectionNodes(0, 1);
            }
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

    clickedPromise = new Promise(function(resolve) {
        gd.on('plotly_click', function() {
            resolve();
        });
    });

    relayoutPromise = new Promise(function(resolve) {
        gd.on('plotly_relayout', function() {
            resolve();
        });
    });
}

function assertEventCounts(selecting, selected, deselect, msg) {
    expect(selectingCnt).toBe(selecting, 'plotly_selecting call count: ' + msg);
    expect(selectedCnt).toBe(selected, 'plotly_selected call count: ' + msg);
    expect(deselectCnt).toBe(deselect, 'plotly_deselect call count: ' + msg);
}

// TODO: in v3, when we get rid of the `plotly_selected->undefined` event, these will
// change to BOXEVENTS = [1, 1, 1], LASSOEVENTS = [4, 1, 1]. See also _run down below
//
// events for box or lasso select mouse moves then a doubleclick
var NOEVENTS = [0, 0, 0];
// deselect used to give an extra plotly_selected event on the first click
// with undefined event data - but now that's gone, since `clickFn` handles this.
var BOXEVENTS = [1, 2, 1];
// assumes 5 points in the lasso path
var LASSOEVENTS = [4, 2, 1];

var mockZorder = {
    data: [
        {x: [1, 2], y: [1, 1], type: 'scatter', zorder: 10, marker: {size: 50}},
        {x: [1, 2], y: [1, 2], type: 'scatter', marker: {size: 50}},
        {x: [1, 2], y: [1, 3], type: 'scatter', zorder: 5, marker: {size: 50}}
    ],
    layout: {
        width: 400,
        height: 400,
        clickmode: 'event+select',
        dragmode: 'select',
        hovermode: 'closest'
    }
};

describe('Click-to-select', function() {
    var mock14Pts = {
        1: { x: 134, y: 116 },
        7: { x: 270, y: 160 },
        10: { x: 324, y: 198 },
        35: { x: 685, y: 341 }
    };
    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(destroyGraphDiv);

    function plotMock14(layoutOpts) {
        var mock = require('../../image/mocks/14.json');
        var defaultLayoutOpts = {
            layout: {
                clickmode: 'event+select',
                dragmode: 'select',
                hovermode: 'closest'
            }
        };
        var mockCopy = Lib.extendDeep(
          {},
          mock,
          defaultLayoutOpts,
          { layout: layoutOpts });

        return _newPlot(gd, mockCopy.data, mockCopy.layout);
    }

    /**
     * Executes a click and before resets selection event handlers.
     * By default, click is executed with a delay to prevent unwanted double clicks.
     * Returns the `selectedPromise` promise for convenience.
     */
    function _click(x, y, clickOpts, immediate) {
        resetEvents(gd);

        // Too fast subsequent calls of `click` would
        // produce an unwanted double click, thus we need
        // to delay the click.
        if(immediate) {
            click(x, y, clickOpts);
        } else {
            setTimeout(function() {
                click(x, y, clickOpts);
            }, DBLCLICKDELAY * 1.03);
        }

        return selectedPromise;
    }

    function _clickPt(coords, clickOpts, immediate) {
        expect(coords).toBeDefined('coords needs to be defined');
        expect(coords.x).toBeDefined('coords.x needs to be defined');
        expect(coords.y).toBeDefined('coords.y needs to be defined');

        return _click(coords.x, coords.y, clickOpts, immediate);
    }

    /**
     * Convenient helper to execute a click immediately.
     */
    function _immediateClickPt(coords, clickOpts) {
        return _clickPt(coords, clickOpts, true);
    }

    /**
     * Asserting selected points.
     *
     * @param expected can be a point number, an array
     * of point numbers (for a single trace) or an array of point number
     * arrays in case of multiple traces. undefined in an array of arrays
     * is also allowed, e.g. useful when not all traces support selection.
     */
    function assertSelectedPoints(expected) {
        var expectedPtsPerTrace = toArrayOfArrays(expected);
        var expectedPts, traceNum;

        for(traceNum = 0; traceNum < expectedPtsPerTrace.length; traceNum++) {
            expectedPts = expectedPtsPerTrace[traceNum];
            expect(gd._fullData[traceNum].selectedpoints).toEqual(expectedPts);
            expect(gd.data[traceNum].selectedpoints).toEqual(expectedPts);
        }

        function toArrayOfArrays(expected) {
            var isArrayInArray, i;

            if(Array.isArray(expected)) {
                isArrayInArray = false;
                for(i = 0; i < expected.length; i++) {
                    if(Array.isArray(expected[i])) {
                        isArrayInArray = true;
                        break;
                    }
                }

                return isArrayInArray ? expected : [expected];
            } else {
                return [[expected]];
            }
        }
    }

    function assertSelectionCleared() {
        gd._fullData.forEach(function(fullDataItem) {
            expect(fullDataItem.selectedpoints).toBeUndefined();
        });
    }

    it('selects a single data point when being clicked', function(done) {
        plotMock14()
          .then(function() { return _immediateClickPt(mock14Pts[7]); })
          .then(function() { assertSelectedPoints(7); })
          .then(done, done.fail);
    });

    it('selects a single data point when being clicked on trace with zorder', function(done) {
        _newPlot(gd, mockZorder.data, mockZorder.layout)
        .then(function() {
            return _immediateClickPt({ x: 270, y: 150 });
        })
        .then(function() {
            assertSelectedPoints([], [], [1]);
            return _clickPt({ x: 270, y: 200 });
        })
        .then(function() {
            assertSelectedPoints([], [1], []);
            return _clickPt({ x: 270, y: 250 });
        })
        .then(done, done.fail);
    });

    it('should only select top most zorder trace if overlapping position on single click', function(done) {
        _newPlot(gd, mockZorder.data, mockZorder.layout)
        .then(function() {
            return _immediateClickPt({ x: 130, y: 250 });
        })
        .then(function() {
            assertSelectedPoints([0], [], []);
        })
        .then(done, done.fail);
    });

    it('should lasso select all overlapping points regardless of zorder', function(done) {
        mockZorder.layout.dragmode = 'lasso';
        _newPlot(gd, mockZorder.data, mockZorder.layout)
        .then(function() {
            drag([[200, 200], [200, 300], [100, 300], [100, 200], [200, 200]]);
        })
        .then(function() {
            expect(gd.data[0].selectedpoints).toEqual([0]);
            expect(gd.data[1].selectedpoints).toEqual([0]);
            expect(gd.data[2].selectedpoints).toEqual([0]);
        })
        .then(function() {
            return doubleClick(200, 200); // Clear selection
        })
        .then(function() {
            drag([[200, 100], [200, 300], [300, 300], [300, 100], [200, 100]]);
        })
        .then(function() {
            expect(gd.data[0].selectedpoints).toEqual([1]);
            expect(gd.data[1].selectedpoints).toEqual([1]);
            expect(gd.data[2].selectedpoints).toEqual([1]);
        })
        .then(done, done.fail);
    });

    it('should box select all overlapping points regardless of zorder', function(done) {
        mockZorder.layout.dragmode = 'select';
        _newPlot(gd, mockZorder.data, mockZorder.layout)
        .then(function() {
            drag([[200, 200], [100, 300]]);
        })
        .then(function() {
            expect(gd.data[0].selectedpoints).toEqual([0]);
            expect(gd.data[1].selectedpoints).toEqual([0]);
            expect(gd.data[2].selectedpoints).toEqual([0]);
        })
        .then(function() {
            return doubleClick(200, 200); // Clear selection
        })
        .then(function() {
            drag([[200, 100], [300, 300]]);
        })
        .then(function() {
            expect(gd.data[0].selectedpoints).toEqual([1]);
            expect(gd.data[1].selectedpoints).toEqual([1]);
            expect(gd.data[2].selectedpoints).toEqual([1]);
        })
        .then(done, done.fail);
    });


    it('cleanly clears and starts selections although add/subtract mode on', function(done) {
        plotMock14()
          .then(function() {
              return _immediateClickPt(mock14Pts[7]);
          })
          .then(function() {
              assertSelectedPoints(7);
              _clickPt(mock14Pts[7], { shiftKey: true });
              return deselectPromise;
          })
          .then(function() {
              assertSelectionCleared();
              return _clickPt(mock14Pts[35], { shiftKey: true });
          })
          .then(function() {
              assertSelectedPoints(35);
          })
          .then(done, done.fail);
    });

    it('supports adding to an existing selection', function(done) {
        plotMock14()
          .then(function() { return _immediateClickPt(mock14Pts[7]); })
          .then(function() {
              assertSelectedPoints(7);
              return _clickPt(mock14Pts[35], { shiftKey: true });
          })
          .then(function() { assertSelectedPoints([7, 35]); })
          .then(done, done.fail);
    });

    it('supports subtracting from an existing selection', function(done) {
        plotMock14()
          .then(function() { return _immediateClickPt(mock14Pts[7]); })
          .then(function() {
              assertSelectedPoints(7);
              return _clickPt(mock14Pts[35], { shiftKey: true });
          })
          .then(function() {
              assertSelectedPoints([7, 35]);
              return _clickPt(mock14Pts[7], { shiftKey: true });
          })
          .then(function() { assertSelectedPoints(35); })
          .then(done, done.fail);
    });

    it('@noCI @gl works in a multi-trace plot', function(done) {
        _newPlot(gd, [
            {
                x: [1, 3, 5, 4, 10, 12, 12, 7],
                y: [2, 7, 6, 1, 0, 13, 6, 12],
                type: 'scatter',
                mode: 'markers',
                marker: { size: 20 }
            }, {
                x: [1, 7, 6, 2],
                y: [2, 3, 5, 4],
                type: 'bar'
            }, {
                x: [7, 8, 9, 10],
                y: [7, 9, 13, 21],
                type: 'scattergl',
                mode: 'markers',
                marker: { size: 20 }
            }
        ], {
            width: 400,
            height: 600,
            hovermode: 'closest',
            dragmode: 'select',
            clickmode: 'event+select'
        })
          .then(function() {
              return _click(136, 369, {}, true);
          })
          .then(function() {
              assertSelectedPoints([[1], [], []]);
              return _click(245, 136, { shiftKey: true });
          })
          .then(function() {
              assertSelectedPoints([[1], [], [3]]);
          })
          .then(done, done.fail);
    });

    it('is supported in pan/zoom mode', function(done) {
        plotMock14({ dragmode: 'zoom' })
          .then(function() {
              return _immediateClickPt(mock14Pts[35]);
          })
          .then(function() {
              assertSelectedPoints(35);
              return _clickPt(mock14Pts[7], { shiftKey: true });
          })
          .then(function() {
              assertSelectedPoints([7, 35]);
              return _clickPt(mock14Pts[7], { shiftKey: true });
          })
          .then(function() {
              assertSelectedPoints(35);
              _clickPt(mock14Pts[35], { shiftKey: true });
              return deselectPromise;
          })
          .then(function() {
              assertSelectionCleared();
              return _clickPt(mock14Pts[7], { shiftKey: true });
          })
          .then(function() {
              assertSelectedPoints(7);
              drag([[110, 100], [300, 300]]);
          })
          .then(delay(100))
          .then(function() {
              // persist after zoombox
              assertSelectedPoints(7);
          })
          .then(done, done.fail);
    });

    it('retains selected points when switching between pan and zoom mode', function(done) {
        plotMock14({ dragmode: 'zoom' })
          .then(function() {
              return _immediateClickPt(mock14Pts[35]);
          })
          .then(function() {
              assertSelectedPoints(35);
              return Plotly.relayout(gd, 'dragmode', 'pan');
          })
          .then(function() {
              assertSelectedPoints(35);
              return _clickPt(mock14Pts[7], { shiftKey: true });
          })
          .then(function() {
              assertSelectedPoints([7, 35]);
              return Plotly.relayout(gd, 'dragmode', 'zoom');
          })
          .then(function() {
              assertSelectedPoints([7, 35]);
              return _clickPt(mock14Pts[7], { shiftKey: true });
          })
          .then(function() {
              assertSelectedPoints(35);
          })
          .then(done, done.fail);
    });

    it('@gl is supported by scattergl in pan/zoom mode', function(done) {
        _newPlot(gd, [
            {
                x: [7, 8, 9, 10],
                y: [7, 9, 13, 21],
                type: 'scattergl',
                mode: 'markers',
                marker: { size: 20 }
            }
        ], {
            width: 400,
            height: 600,
            hovermode: 'closest',
            dragmode: 'zoom',
            clickmode: 'event+select'
        })
          .then(function() {
              return _click(230, 340, {}, true);
          })
          .then(function() {
              assertSelectedPoints(2);
          })
          .then(done, done.fail);
    });

    it('deals correctly with histogram\'s binning in the persistent selection case', function(done) {
        var mock = require('../../image/mocks/histogram_colorscale.json');
        var firstBinPts = [0];
        var secondBinPts = [1, 2];
        var thirdBinPts = [3, 4, 5];

        mock.layout.clickmode = 'event+select';
        _newPlot(gd, mock.data, mock.layout)
          .then(function() {
              return clickFirstBinImmediately();
          })
          .then(function() {
              assertSelectedPoints(firstBinPts);
              return shiftClickSecondBin();
          })
          .then(function() {
              assertSelectedPoints([].concat(firstBinPts, secondBinPts));
              return shiftClickThirdBin();
          })
          .then(function() {
              assertSelectedPoints([].concat(firstBinPts, secondBinPts, thirdBinPts));
              return clickFirstBin();
          })
          .then(function() {
              assertSelectedPoints([].concat(firstBinPts));
              clickFirstBin();
              return deselectPromise;
          })
          .then(function() {
              assertSelectionCleared();
          })
          .then(done, done.fail);

        function clickFirstBinImmediately() { return _immediateClickPt({ x: 141, y: 358 }); }
        function clickFirstBin() { return _click(141, 358); }
        function shiftClickSecondBin() { return _click(239, 330, { shiftKey: true }); }
        function shiftClickThirdBin() { return _click(351, 347, { shiftKey: true }); }
    });

    it('ignores clicks on boxes in a box trace type', function(done) {
        var mock = Lib.extendDeep({}, require('../../image/mocks/box_grouped_horz.json'));

        mock.layout.clickmode = 'event+select';
        mock.layout.width = 1100;
        mock.layout.height = 450;

        _newPlot(gd, mock.data, mock.layout)
          .then(function() {
              return clickPtImmediately();
          })
          .then(function() {
              assertSelectedPoints(2);
              clickPt();
              return deselectPromise;
          })
          .then(function() {
              assertSelectionCleared();
              clickBox();
              return clickedPromise;
          })
          .then(function() {
              assertSelectionCleared();
          })
          .then(done, done.fail);

        function clickPtImmediately() { return _immediateClickPt({ x: 610, y: 342 }); }
        function clickPt() { return _clickPt({ x: 610, y: 342 }); }
        function clickBox() { return _clickPt({ x: 565, y: 329 }); }
    });

    describe('is disabled when clickmode does not include \'select\'', function() {
        ['select', 'lasso']
          .forEach(function(dragmode) {
              it('and dragmode is ' + dragmode, function(done) {
                  plotMock14({ clickmode: 'event', dragmode: dragmode })
                    .then(function() {
                        // Still, the plotly_selected event should be thrown,
                        // so return promise here
                        return _immediateClickPt(mock14Pts[1]);
                    })
                    .then(function() {
                        assertSelectionCleared();
                    })
                    .then(done, done.fail);
              });
          });
    });

    describe('is disabled when clickmode does not include \'select\'', function() {
        ['pan', 'zoom']
          .forEach(function(dragmode) {
              it('and dragmode is ' + dragmode, function(done) {
                  plotMock14({ clickmode: 'event', dragmode: dragmode })
                    .then(function() {
                        _immediateClickPt(mock14Pts[1]);
                        return clickedPromise;
                    })
                    .then(function() {
                        assertSelectionCleared();
                    })
                    .then(done, done.fail);
              });
          });
    });

    describe('is supported by', function() {
        // On loading mocks:
        // - Note, that `require` function calls are resolved at compile time
        //   and thus dynamically concatenated mock paths won't work.
        // - Some mocks don't specify a width and height, so this needs
        //   to be set explicitly to ensure click coordinates fit.

        // The non-gl traces: use CI annotation
        [
            testCase('histrogram', require('../../image/mocks/histogram_colorscale.json'), 355, 301, [3, 4, 5]),
            testCase('box', require('../../image/mocks/box_grouped_horz.json'), 610, 342, [[2], [], []],
              { width: 1100, height: 450 }),
            testCase('violin', require('../../image/mocks/violin_grouped.json'), 166, 187, [[3], [], []],
              { width: 1100, height: 450 }),
            testCase('ohlc', require('../../image/mocks/ohlc_first.json'), 669, 165, [9]),
            testCase('candlestick', require('../../image/mocks/finance_style.json'), 331, 162, [[], [5]]),
            testCase('choropleth', require('../../image/mocks/geo_choropleth-text.json'), 440, 163, [6]),
            testCase('scattergeo', require('../../image/mocks/geo_scattergeo-locations.json'), 285, 240, [1]),
            testCase('scatterternary', require('../../image/mocks/ternary_markers.json'), 485, 335, [7]),

            // Note that first trace (carpet) in mock doesn't support selection,
            // thus undefined is expected
            testCase('scattercarpet', require('../../image/mocks/scattercarpet.json'), 532, 178,
              [undefined, [], [], [], [], [], [2]], { width: 1100, height: 450 }),

            // scatterpolar and scatterpolargl do not support pan (the default),
            // so set dragmode to zoom
            testCase('scatterpolar', require('../../image/mocks/polar_scatter.json'), 130, 290,
              [[], [], [], [19], [], []], { dragmode: 'zoom' }),
        ]
          .forEach(function(testCase) {
              it('trace type ' + testCase.label, function(done) {
                  _run(testCase, done);
              });
          });

        [
            testCase('scatterpolargl', require('../../image/mocks/glpolar_scatter.json'), 130, 290,
              [[], [], [], [19], [], []], { dragmode: 'zoom' }),
            testCase('splom', require('../../image/mocks/splom_lower.json'), 427, 400, [[], [7], []])
        ]
          .forEach(function(testCase) {
              it('@gl trace type ' + testCase.label, function(done) {
                  _run(testCase, done);
              });
          });

        [
            testCase('scattermap', require('../../image/mocks/map_0.json'), 650, 195, [[2], []], {}, {}),
            testCase('choroplethmap', require('../../image/mocks/map_choropleth0.json'), 270, 220, [[0]], {}, {})
        ]
          .forEach(function(testCase) {
              it('@gl trace type ' + testCase.label, function(done) {
                  _run(testCase, done);
              });
          });

        [
            testCase('scattermap', require('../../image/mocks/map_0.json'), 650, 195, [[2], []], {}),
            testCase('choroplethmap', require('../../image/mocks/map_choropleth0.json'), 270, 220, [[0]], {})
        ]
          .forEach(function(testCase) {
              it('@gl trace type ' + testCase.label, function(done) {
                  _run(testCase, done);
              });
          });

        function _run(testCase, doneFn) {
            _newPlot(gd, testCase.mock.data, testCase.mock.layout, testCase.mock.config)
              .then(function() {
                  return _immediateClickPt(testCase);
              })
              .then(function() {
                  assertSelectedPoints(testCase.expectedPts);
                  return Plotly.relayout(gd, 'dragmode', 'lasso');
              })
              .then(function() {
                  _clickPt(testCase);
                  return deselectPromise;
              })
              .then(function() {
                  assertSelectionCleared();
                  return _clickPt(testCase);
              })
              .then(function() {
                  assertSelectedPoints(testCase.expectedPts);
              })
              .then(doneFn, doneFn.fail);
        }
    });

    it('should maintain style of errorbars after double click cleared selection (bar case)', function(done) {
        _newPlot(gd, { // Note: this call should be newPlot not plot
            data: [{
                x: [0, 1, 2],
                y: [100, 200, 400],
                type: 'bar',
                marker: {
                    color: 'yellow'
                },
                error_y: {
                    type: 'sqrt'
                }
            }],
            layout: {
                dragmode: 'select'
            }
        })
        .then(function() {
            var x = 100;
            var y = 100;
            drag([[x, y], [x, y]]); // first empty drag
            return doubleClick(x, y); // then double click
        })
        .then(function() {
            assertSelectionCleared();
        })
        .then(function() {
            d3Select(gd).select('g.plot').each(function() {
                d3Select(this).selectAll('g.errorbar').selectAll('path').each(function() {
                    expect(d3Select(this).attr('style'))
                        .toBe('vector-effect: non-scaling-stroke; stroke-width: 2px; stroke: rgb(68, 68, 68); stroke-opacity: 1; opacity: 1; fill: rgb(255, 255, 0); fill-opacity: 1;', 'to be visible'
                    );
                });
            });
        })
        .then(done, done.fail);
    });

    describe('triggers \'plotly_selected\' before \'plotly_click\'', function() {
        [
            testCase('cartesian', require('../../image/mocks/14.json'), 270, 160, [7]),
            testCase('geo', require('../../image/mocks/geo_scattergeo-locations.json'), 285, 240, [1]),
            testCase('ternary', require('../../image/mocks/ternary_markers.json'), 485, 335, [7]),
            testCase('polar', require('../../image/mocks/polar_scatter.json'), 130, 290,
              [[], [], [], [19], [], []], { dragmode: 'zoom' })
        ].forEach(function(testCase) {
            it('for base plot ' + testCase.label, function(done) {
                _run(testCase, done);
            });
        });

        [
            testCase('scattermap', require('../../image/mocks/map_0.json'), 650, 195, [[2], []], {}, {}),
            testCase('choroplethmap', require('../../image/mocks/map_choropleth0.json'), 270, 220, [[0], []], {}, {})
        ].forEach(function(testCase) {
            it('@gl for base plot ' + testCase.label, function(done) {
                _run(testCase, done);
            });
        });

        [
            testCase('map', require('../../image/mocks/map_0.json'), 650, 195, [[2], []], {}),
            testCase('map', require('../../image/mocks/map_choropleth0.json'), 270, 220, [[0], []], {})
        ].forEach(function(testCase) {
            it('@gl for base plot ' + testCase.label, function(done) {
                _run(testCase, done);
            });
        });

        function _run(testCase, doneFn) {
            _newPlot(gd, testCase.mock.data, testCase.mock.layout, testCase.mock.config)
              .then(function() {
                  var clickHandlerCalled = false;
                  var selectedHandlerCalled = false;

                  gd.on('plotly_selected', function() {
                      expect(clickHandlerCalled).toBe(false);
                      selectedHandlerCalled = true;
                  });
                  gd.on('plotly_click', function() {
                      clickHandlerCalled = true;
                      expect(selectedHandlerCalled).toBe(true);
                      doneFn();
                  });

                  return click(testCase.x, testCase.y);
              })
              .then(doneFn, doneFn.fail);
        }
    });

    function testCase(label, mock, x, y, expectedPts, layoutOptions, configOptions) {
        var defaultLayoutOpts = {
            layout: {
                clickmode: 'event+select',
                dragmode: 'pan',
                hovermode: 'closest'
            }
        };
        var customLayoutOptions = {
            layout: layoutOptions
        };
        var customConfigOptions = {
            config: configOptions
        };
        var mockCopy = Lib.extendDeep(
          {},
          mock,
          defaultLayoutOpts,
          customLayoutOptions,
          customConfigOptions);

        return {
            label: label,
            mock: mockCopy,
            layoutOptions: layoutOptions,
            x: x,
            y: y,
            expectedPts: expectedPts,
            configOptions: configOptions
        };
    }
});

describe('Test select box and lasso in general:', function() {
    var mock = require('../../image/mocks/14.json');
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
        mockCopy.layout.hovermode = 'closest';
        mockCopy.data[0].ids = mockCopy.data[0].x
            .map(function(v) { return 'id-' + v; });
        mockCopy.data[0].customdata = mockCopy.data[0].y
            .map(function(v) { return 'customdata-' + v; });
        addInvisible(mockCopy);

        var gd;
        beforeEach(function(done) {
            gd = createGraphDiv();

            _newPlot(gd, mockCopy.data, mockCopy.layout)
                .then(done);
        });

        it('should trigger selecting/selected/deselect events', function(done) {
            resetEvents(gd);

            drag(selectPath);

            selectedPromise.then(function() {
                expect(selectedCnt).toBe(1, 'with the correct selected count');
                assertEventData(selectedData.points, [{
                    curveNumber: 0,
                    pointNumber: 0,
                    pointIndex: 0,
                    x: 0.002,
                    y: 16.25,
                    id: 'id-0.002',
                    customdata: 'customdata-16.25'
                }, {
                    curveNumber: 0,
                    pointNumber: 1,
                    pointIndex: 1,
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
            .then(done, done.fail);
        });

        it('should handle add/sub selection', function(done) {
            resetEvents(gd);

            drag(selectPath);

            selectedPromise.then(function() {
                expect(selectingCnt).toBe(1, 'with the correct selecting count');
                assertEventData(selectingData.points, [{
                    curveNumber: 0,
                    pointNumber: 0,
                    pointIndex: 0,
                    x: 0.002,
                    y: 16.25,
                    id: 'id-0.002',
                    customdata: 'customdata-16.25'
                }, {
                    curveNumber: 0,
                    pointNumber: 1,
                    pointIndex: 1,
                    x: 0.004,
                    y: 12.5,
                    id: 'id-0.004',
                    customdata: 'customdata-12.5'
                }], 'with the correct selecting points (1)');
                assertRange(selectingData.range, {
                    x: [0.002000, 0.0046236],
                    y: [0.10209191961595454, 24.512223978291406]
                }, 'with the correct selecting range');
            })
            .then(function() {
                // add selection
                drag([[193, 193], [213, 193]], {shiftKey: true});
            })
            .then(function() {
                expect(selectingCnt).toBe(2, 'with the correct selecting count');
                assertEventData(selectingData.points, [{
                    curveNumber: 0,
                    pointNumber: 0,
                    pointIndex: 0,
                    x: 0.002,
                    y: 16.25,
                    id: 'id-0.002',
                    customdata: 'customdata-16.25'
                }, {
                    curveNumber: 0,
                    pointNumber: 1,
                    pointIndex: 1,
                    x: 0.004,
                    y: 12.5,
                    id: 'id-0.004',
                    customdata: 'customdata-12.5'
                }, {
                    curveNumber: 0,
                    pointNumber: 4,
                    pointIndex: 4,
                    x: 0.013,
                    y: 6.875,
                    id: 'id-0.013',
                    customdata: 'customdata-6.875'
                }], 'with the correct selecting points (1)');
            })
            .then(function() {
                // sub selection
                drag([[219, 143], [219, 183]], {altKey: true});
            }).then(function() {
                assertEventData(selectingData.points, [{
                    curveNumber: 0,
                    pointNumber: 0,
                    pointIndex: 0,
                    x: 0.002,
                    y: 16.25,
                    id: 'id-0.002',
                    customdata: 'customdata-16.25'
                }, {
                    curveNumber: 0,
                    pointNumber: 1,
                    pointIndex: 1,
                    x: 0.004,
                    y: 12.5,
                    id: 'id-0.004',
                    customdata: 'customdata-12.5'
                }], 'with the correct selecting points (1)');

                return doubleClick(250, 200);
            })
            .then(function() {
                expect(doubleClickData).toBe(null, 'with the correct deselect data');
            })
            .then(done, done.fail);
        });
    });

    describe('select / deselect with fake selections', function() {
        var gd;
        beforeEach(function(done) {
            gd = createGraphDiv();

            var mockCopy = Lib.extendDeep({}, mock);
            mockCopy.layout.dragmode = 'select';
            mockCopy.layout.hovermode = 'closest';
            mockCopy.layout.selections = [null];
            addInvisible(mockCopy);

            _newPlot(gd, mockCopy.data, mockCopy.layout)
                .then(done);
        });

        it('should trigger selecting/selected/deselect events', function(done) {
            resetEvents(gd);

            drag(selectPath);

            selectedPromise.then(function() {
                expect(selectedCnt).toBe(1, 'with the correct selected count');
                assertEventData(selectedData.points, [{
                    curveNumber: 0,
                    pointNumber: 0,
                    pointIndex: 0,
                    x: 0.002,
                    y: 16.25
                }, {
                    curveNumber: 0,
                    pointNumber: 1,
                    pointIndex: 1,
                    x: 0.004,
                    y: 12.5
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
            .then(done, done.fail);
        });

        it('should handle add/sub selection', function(done) {
            resetEvents(gd);
            expect(gd.layout.selections.length).toBe(1);

            drag([[193, 193], [213, 193]], {shiftKey: true})

            selectedPromise.then(function() {
                expect(selectedCnt).toBe(1, 'with the correct selected count');
                assertEventData(selectedData.points, [{
                    curveNumber: 0,
                    pointNumber: 4,
                    pointIndex: 4,
                    x: 0.013,
                    y: 6.875
                }], 'with the correct selected points (1)');
            })
            .then(function() {
                // this is not working here, but it works in the test dashboard, not sure why
                // but at least this test shows us that no errors are thrown.
                // expect(gd.layout.selections.length).toBe(2, 'fake selection is still there');

                resetEvents(gd);

                return doubleClick(250, 200);
            })
            .then(relayoutPromise)
            .then(function() {
                expect(gd.layout.selections.length).toBe(0, 'fake selection is cleared');
                expect(doubleClickData).toBe(null, 'with the correct deselect data');
            })
            .then(done, done.fail);
        });

        it('should clear fake selections on doubleclick', function(done) {
            resetEvents(gd);

            doubleClick(250, 200);

            relayoutPromise.then(function() {
                expect(gd.layout.selections.length).toBe(0, 'fake selections are cleared');
            })
            .then(done, done.fail);
        });
    });

    describe('lasso events', function() {
        var mockCopy = Lib.extendDeep({}, mock);
        mockCopy.layout.dragmode = 'lasso';
        mockCopy.layout.hovermode = 'closest';
        addInvisible(mockCopy);

        var gd;
        beforeEach(function(done) {
            gd = createGraphDiv();

            _newPlot(gd, mockCopy.data, mockCopy.layout)
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
                    pointIndex: 10,
                    x: 0.099,
                    y: 2.75
                }], 'with the correct selecting points (1)');

                expect(selectedCnt).toBe(1, 'with the correct selected count');
                assertEventData(selectedData.points, [{
                    curveNumber: 0,
                    pointNumber: 10,
                    pointIndex: 10,
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
            .then(done, done.fail);
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
            .then(done, done.fail);
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
            .then(done, done.fail);
        });

        it('should trigger selecting/selected/deselect events for touches', function(done) {
            resetEvents(gd);

            drag(lassoPath, {type: 'touch'});

            selectedPromise.then(function() {
                expect(selectingCnt).toBe(3, 'with the correct selecting count');
                assertEventData(selectingData.points, [{
                    curveNumber: 0,
                    pointNumber: 10,
                    pointIndex: 10,
                    x: 0.099,
                    y: 2.75
                }], 'with the correct selecting points (1)');

                expect(selectedCnt).toBe(1, 'with the correct selected count');
                assertEventData(selectedData.points, [{
                    curveNumber: 0,
                    pointNumber: 10,
                    pointIndex: 10,
                    x: 0.099,
                    y: 2.75,
                }], 'with the correct selected points (2)');

                return doubleClick(250, 200);
            })
            .then(deselectPromise)
            .then(function() {
                expect(doubleClickData).toBe(null, 'with the correct deselect data');
            })
            .then(done, done.fail);
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

        _newPlot(gd, mockCopy.data, mockCopy.layout)
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
            return _newPlot(gd, mockCopy);
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
        .then(done, done.fail);
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

        _newPlot(gd, data, layout).then(function() {
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
        .then(done, done.fail);
    });

    it('scroll zoom should clear selection regions', function(done) {
        var gd = createGraphDiv();
        var mockCopy = Lib.extendDeep({}, mock);
        mockCopy.layout.dragmode = 'select';
        mockCopy.config = {scrollZoom: true};

        function _drag() {
            resetEvents(gd);
            drag(selectPath);
            return selectedPromise;
        }

        function _scroll() {
            mouseEvent('mousemove', selectPath[0][0], selectPath[0][1]);
            mouseEvent('scroll', selectPath[0][0], selectPath[0][1], {deltaX: 0, deltaY: -20});
        }

        _newPlot(gd, mockCopy)
        .then(_drag)
        .then(_scroll)
        .then(function() {
            assertSelectionNodes(0, 0);
        })
        .then(_drag)
        .then(_scroll)
        .then(function() {
            // make sure it works the 2nd time aroung
            assertSelectionNodes(0, 0);
        })
        .then(done, done.fail);
    });

    describe('should return correct range data on dragmode *select*', function() {
        var specs = [{
            axType: 'linear',
            rng: [-0.6208, 0.8375]
        }, {
            axType: 'log',
            rng: [0.2394, 6.8785]
        }, {
            axType: 'date',
            rng: ['2000-01-20 19:48', '2000-04-06 01:48']
        }, {
            axType: 'category',
            rng: [-0.6208, 0.8375]
        }, {
            axType: 'multicategory',
            rng: [-0.6208, 0.8375]
        }];

        specs.forEach(function(s) {
            it('- on ' + s.axType + ' axes', function(done) {
                var gd = createGraphDiv();

                _newPlot(gd, [], {
                    xaxis: {type: s.axType},
                    dragmode: 'select',
                    width: 400,
                    height: 400
                })
                .then(function() {
                    resetEvents(gd);
                    drag(selectPath);
                    return selectedPromise;
                })
                .then(function() {
                    expect(selectedData.range.x).toBeCloseToArray(s.rng, 2);
                })
                .then(done, done.fail);
            });
        });
    });

    describe('should return correct range data on dragmode *lasso*', function() {
        var specs = [{
            axType: 'linear',
            pts: [5.883, 5.941, 6, 6]
        }, {
            axType: 'log',
            pts: [764422.2742, 874312.4580, 1000000, 1000000]
        }, {
            axType: 'date',
            pts: ['2000-12-25 21:36', '2000-12-28 22:48', '2001-01-01', '2001-01-01']
        }, {
            axType: 'category',
            pts: [5.8833, 5.9416, 6, 6]
        }, {
            axType: 'multicategory',
            pts: [5.8833, 5.9416, 6, 6]
        }];

        specs.forEach(function(s) {
            it('- on ' + s.axType + ' axes', function(done) {
                var gd = createGraphDiv();

                _newPlot(gd, [], {
                    xaxis: {type: s.axType},
                    dragmode: 'lasso',
                    width: 400,
                    height: 400
                })
                .then(function() {
                    resetEvents(gd);
                    drag(lassoPath);
                    return selectedPromise;
                })
                .then(function() {
                    expect(selectedData.lassoPoints.x).toBeCloseToArray(s.pts, 2);
                })
                .then(done, done.fail);
            });
        });
    });

    it('should have their selection outlines cleared during *axrange* relayout calls', function(done) {
        var gd = createGraphDiv();
        var fig = Lib.extendDeep({}, mock);
        fig.layout.dragmode = 'select';

        function _drag() {
            resetEvents(gd);
            drag(selectPath);
            return selectedPromise;
        }

        _newPlot(gd, fig)
        .then(_drag)
        .then(function() { assertSelectionNodes(0, 1, 'after drag 1'); })
        .then(function() { return Plotly.relayout(gd, 'xaxis.range', [-5, 5]); })
        .then(function() { assertSelectionNodes(0, 0, 'after axrange relayout'); })
        .then(_drag)
        .then(function() { assertSelectionNodes(0, 1, 'after drag 2'); })
        .then(done, done.fail);
    });

    it('should select the right data with the corresponding select direction', function(done) {
        var gd = createGraphDiv();

        // drag around just the center point, but if we have a selectdirection we may
        // get either the ones to the left and right or above and below
        var selectPath = [[175, 175], [225, 225]];

        function selectDrag() {
            resetEvents(gd);
            drag(selectPath);
            return selectedPromise;
        }

        function assertSelectedPointNumbers(pointNumbers) {
            var pts = selectedData.points;
            expect(pts.length).toBe(pointNumbers.length);
            pointNumbers.forEach(function(pointNumber, i) {
                expect(pts[i].pointNumber).toBe(pointNumber);
            });
        }

        _newPlot(gd, [{
            x: [1, 1, 1, 2, 2, 2, 3, 3, 3],
            y: [1, 2, 3, 1, 2, 3, 1, 2, 3],
            mode: 'markers'
        }], {
            width: 400,
            height: 400,
            dragmode: 'select',
            margin: {l: 100, r: 100, t: 100, b: 100},
            xaxis: {range: [0, 4]},
            yaxis: {range: [0, 4]}
        })
        .then(selectDrag)
        .then(function() {
            expect(gd._fullLayout.selectdirection).toBe('any');
            assertSelectedPointNumbers([4]);

            return Plotly.relayout(gd, {selectdirection: 'h'});
        })
        .then(selectDrag)
        .then(function() {
            assertSelectedPointNumbers([3, 4, 5]);

            return Plotly.relayout(gd, {selectdirection: 'v'});
        })
        .then(selectDrag)
        .then(function() {
            assertSelectedPointNumbers([1, 4, 7]);

            return Plotly.relayout(gd, {selectdirection: 'd'});
        })
        .then(selectDrag)
        .then(function() {
            assertSelectedPointNumbers([4]);
        })
        .then(done, done.fail);
    });

    it('@flaky should cleanly clear and restart selections on double click when add/subtract mode on', function(done) {
        var gd = createGraphDiv();
        var fig = Lib.extendDeep({}, require('../../image/mocks/0.json'));

        fig.layout.dragmode = 'select';
        _newPlot(gd, fig)
          .then(function() {
              return drag([[350, 100], [400, 400]]);
          })
          .then(function() {
              _assertSelectedPoints([49, 50, 51, 52, 53, 54, 55, 56, 57]);

              // Note: although Shift has no behavioral effect on clearing a selection
              // with a double click, users might hold the Shift key by accident.
              // This test ensures selection is cleared as expected although
              // the Shift key is held and no selection state is retained in any way.
              return doubleClick(500, 200, { shiftKey: true });
          })
          .then(function() {
              _assertSelectedPoints(null);
              return drag([[450, 100], [500, 400]], { shiftKey: true });
          })
          .then(function() {
              _assertSelectedPoints([67, 68, 69, 70, 71, 72, 73, 74]);
          })
          .then(done, done.fail);

        function _assertSelectedPoints(selPts) {
            if(selPts) {
                expect(gd.data[0].selectedpoints).toEqual(selPts);
            } else {
                expect('selectedpoints' in gd.data[0]).toBe(false);
            }
        }
    });

    it('should clear selected points on double click only on pan/lasso modes', function(done) {
        var gd = createGraphDiv();
        var fig = Lib.extendDeep({}, require('../../image/mocks/0.json'));
        fig.data = [fig.data[0]];
        fig.layout.xaxis.autorange = false;
        fig.layout.xaxis.range = [2, 8];
        fig.layout.yaxis.autorange = false;
        fig.layout.yaxis.range = [0, 3];
        fig.layout.hovermode = 'closest';

        function _assert(msg, exp) {
            expect(gd.layout.xaxis.range)
                .toBeCloseToArray(exp.xrng, 2, 'xaxis range - ' + msg);
            expect(gd.layout.yaxis.range)
                .toBeCloseToArray(exp.yrng, 2, 'yaxis range - ' + msg);

            if(exp.selpts === null) {
                expect('selectedpoints' in gd.data[0])
                    .toBe(false, 'cleared selectedpoints - ' + msg);
            } else {
                expect(gd.data[0].selectedpoints)
                    .toBeCloseToArray(exp.selpts, 2, 'selectedpoints - ' + msg);
            }
        }

        _newPlot(gd, fig).then(function() {
            _assert('base', {
                xrng: [2, 8],
                yrng: [0, 3],
                selpts: null
            });
            return Plotly.relayout(gd, 'xaxis.range', [0, 10]);
        })
        .then(function() {
            _assert('after xrng relayout', {
                xrng: [0, 10],
                yrng: [0, 3],
                selpts: null
            });
            return doubleClick(200, 200);
        })
        .then(function() {
            _assert('after double-click under dragmode zoom', {
                xrng: [2, 8],
                yrng: [0, 3],
                selpts: null
            });
            return Plotly.relayout(gd, 'dragmode', 'select');
        })
        .then(function() {
            _assert('after relayout to select', {
                xrng: [2, 8],
                yrng: [0, 3],
                selpts: null
            });
            return drag([[100, 100], [400, 400]]);
        })
        .then(function() {
            _assert('after selection', {
                xrng: [2, 8],
                yrng: [0, 3],
                selpts: [40, 41, 42, 43, 44, 45, 46, 47, 48]
            });
            return doubleClick(200, 200);
        })
        .then(function() {
            _assert('after double-click under dragmode select', {
                xrng: [2, 8],
                yrng: [0, 3],
                selpts: null
            });
            return drag([[100, 100], [400, 400]]);
        })
        .then(function() {
            _assert('after selection 2', {
                xrng: [2, 8],
                yrng: [0, 3],
                selpts: [40, 41, 42, 43, 44, 45, 46, 47, 48]
            });
            return Plotly.relayout(gd, 'dragmode', 'pan');
        })
        .then(function() {
            _assert('after relayout to pan', {
                xrng: [2, 8],
                yrng: [0, 3],
                selpts: [40, 41, 42, 43, 44, 45, 46, 47, 48]
            });
            return Plotly.relayout(gd, 'yaxis.range', [0, 20]);
        })
        .then(function() {
            _assert('after yrng relayout', {
                xrng: [2, 8],
                yrng: [0, 20],
                selpts: [40, 41, 42, 43, 44, 45, 46, 47, 48]
            });
            return doubleClick(200, 200);
        })
        .then(function() {
            _assert('after double-click under dragmode pan', {
                xrng: [2, 8],
                yrng: [0, 3],
                // N.B. does not clear selection!
                selpts: [40, 41, 42, 43, 44, 45, 46, 47, 48]
            });
        })
        .then(done, done.fail);
    });

    it('should remember selection polygons from previous select/lasso mode', function(done) {
        var gd = createGraphDiv();
        var path1 = [[150, 150], [170, 170]];
        var path2 = [[193, 193], [213, 193]];

        var fig = Lib.extendDeep({}, mock);
        fig.layout.margin = {l: 0, t: 0, r: 0, b: 0};
        fig.layout.width = 500;
        fig.layout.height = 500;
        fig.layout.dragmode = 'select';
        fig.config = {scrollZoom: true};

        // d attr to array of segment [x,y]
        function outline2coords(outline) {
            if(!outline.size()) return [[]];

            return outline.attr('d')
                .replace(/Z/g, '')
                .split('M')
                .filter(Boolean)
                .map(function(s) {
                    return s.split('L')
                        .map(function(s) { return s.split(',').map(Number); });
                })
                .reduce(function(a, b) { return a.concat(b); });
        }

        function _assert(msg, exp) {
            var outline = d3Select(gd).select('.zoomlayer').select('.select-outline');

            if(exp.outline) {
                expect(outline2coords(outline)).toBeCloseTo2DArray(exp.outline, 2, msg);
            } else {
                assertSelectionNodes(0, 0, msg);
            }
        }

        function _drag(path, opts) {
            return function() {
                resetEvents(gd);
                drag(path, opts);
                return selectedPromise;
            };
        }

        _newPlot(gd, fig)
        .then(function() { _assert('base', {outline: false}); })
        .then(_drag(path1))
        .then(_drag(path2, {shiftKey: true}))
        .then(function() {
            _assert('select path1+path2', {
                outline: [
                    [213, 500], [213, 0], [193, 0], [193, 500],
                    [170, 170], [170, 150], [150, 150], [150, 170],
                ]
            });
        })
        .then(function() {
            return Plotly.relayout(gd, 'dragmode', 'lasso');
        })
        .then(function() {
            // N.B. all relayout calls clear the selection outline at the moment,
            // perhaps we could make an exception for select <-> lasso ?
            _assert('after relayout -> lasso', {outline: false});
        })
        .then(_drag(lassoPath, {shiftKey: true}))
        .then(function() {
            // merged with previous 'select' polygon
            _assert('after shift lasso', {
                outline: [
                    [335, 243], [328, 169], [316, 171], [318, 239],
                    [213, 500], [213, 0], [193, 0], [193, 500],
                    [170, 170], [170, 150], [150, 150], [150, 170],
                ]
            });
        })
        .then(_drag(lassoPath))
        .then(function() {
            _assert('after lasso (no-shift)', {
                outline: [[316, 171], [318, 239], [335, 243], [328, 169]]
            });
        })
        .then(function() {
            return Plotly.relayout(gd, 'dragmode', 'pan');
        })
        .then(function() {
            _assert('after relayout -> pan', {outline: false});
            drag(path2);
            _assert('after pan', {outline: false});
            return Plotly.relayout(gd, 'dragmode', 'select');
        })
        .then(function() {
            _assert('after relayout back to select', {outline: false});
        })
        .then(function() {
            mouseEvent('mousemove', 200, 200);
            mouseEvent('scroll', 200, 200, {deltaX: 0, deltaY: -20});
        })
        .then(done, done.fail);
    });

    it('should re-select data in all overlaying visible traces', function(done) {
        var gd = createGraphDiv();
        _newPlot(gd, [{
            x: [1, 2, 3],
            y: [4, 5, 6],
            name: 'yaxis1 data',
            type: 'scatter'
        },
        {
            x: [2, 3, 4],
            y: [40, 50, 60],
            name: 'yaxis2 data',
            yaxis: 'y2',
            xaxis: 'x2',
            type: 'scatter'
        },
        {
            x: [3, 4, 5],
            y: [400, 500, 600],
            name: 'yaxis3 data',
            yaxis: 'y3',
            type: 'scatter'
        },
        {
            x: [4, 5, 6],
            y: [1000, 2000, 3000],
            name: 'yaxis4 data',
            yaxis: 'y4',
            xaxis: 'x2',
            type: 'scatter'
        }
        ],
            {
                grid: {
                    rows: 2,
                    columns: 1,
                    pattern: 'independent'
                },
                width: 800,
                height: 600,
                yaxis: {
                    showline: true,
                    title: {
                        text: 'yaxis title'
                    }
                },
                yaxis2: {
                    title: {
                        text: 'yaxis2 title'
                    },
                    showline: true
                },
                yaxis3: {
                    title: {
                        text: 'yaxis3 title'
                    },
                    anchor: 'free',
                    overlaying: 'y',
                    showline: true,
                    autoshift: true
                },
                yaxis4: {
                    title: {
                        text: 'yaxis4 title'
                    },
                    anchor: 'free',
                    overlaying: 'y2',
                    showline: true,
                    autoshift: true
                }
            }).then(function() {
                return Plotly.relayout(gd, 'dragmode', 'select');
            }).then(function() {
                return drag([[150, 450], [650, 350]]);
            }).then(function() {
                expect(gd.data[0].selectedpoints).toBe(undefined);
                expect(gd.data[1].selectedpoints).toEqual([1, 2]);
                expect(gd.data[2].selectedpoints).toBe(undefined);
                expect(gd.data[3].selectedpoints).toEqual([1, 2]);
            }).then(function() {
                return drag([[150, 100], [600, 200]]);
            }).then(function() {
                expect(gd.data[0].selectedpoints).toEqual([1, 2]);
                expect(gd.data[1].selectedpoints).toEqual([1, 2]);
                expect(gd.data[2].selectedpoints).toEqual([1]);
                expect(gd.data[3].selectedpoints).toEqual([1, 2]);
            }).then(function() {
                return drag([[600, 150], [650, 150]]); // Extend existing selection
            }).then(function() {
                expect(gd.data[0].selectedpoints).toEqual([1, 2]);
                expect(gd.data[1].selectedpoints).toEqual([1, 2]);
                expect(gd.data[2].selectedpoints).toEqual([1, 2]);
                expect(gd.data[3].selectedpoints).toEqual([1, 2]);
            }).then(done, done.fail);
    });
});

describe('Test select box and lasso per trace:', function() {
    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
        spyOn(Lib, 'error');
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

                    if(typeof p[k] === 'number' && typeof e[j] === 'number') {
                        expect(p[k]).toBeCloseTo(e[j], 1, msgFull);
                    } else if(Array.isArray(p[k]) && Array.isArray(e[j])) {
                        expect(p[k]).toBeCloseToArray(e[j], 1, msgFull);
                    } else {
                        expect(p[k]).toBe(e[j], msgFull);
                    }
                });
            });

            callNumber++;
        };
    }

    function makeAssertSelectedPoints() {
        var callNumber = 0;

        return function(expected) {
            var msg = '(call #' + callNumber + ') ';

            gd.data.forEach(function(trace, i) {
                var msgFull = msg + 'selectedpoints array for trace ' + i;
                var actual = trace.selectedpoints;

                if(expected[i]) {
                    expect(actual).toBeCloseToArray(expected[i], 1, msgFull);
                } else {
                    expect(actual).toBe(undefined, 1, msgFull);
                }
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
            var lassoPoints = {};
            if (selectedData && selectedData.lassoPoints) {
                lassoPoints = selectedData.lassoPoints;
            }

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

    function transformPlot(gd, transformString) {
        gd.style.webkitTransform = transformString;
        gd.style.MozTransform = transformString;
        gd.style.msTransform = transformString;
        gd.style.OTransform = transformString;
        gd.style.transform = transformString;
    }

    var cssTransform = 'translate(-25%, -25%) scale(0.5)';

    function _run(hasCssTransform, dragPath, afterDragFn, dblClickPos, eventCounts, msg) {
        afterDragFn = afterDragFn || function() {};
        dblClickPos = dblClickPos || [250, 200];

        var scale = 1;
        if(hasCssTransform) {
            scale = 0.5;
        }
        dblClickPos[0] *= scale;
        dblClickPos[1] *= scale;
        for(var i = 0; i < dragPath.length; i++) {
            for(var j = 0; j < dragPath[i].length; j++) {
                dragPath[i][j] *= scale;
            }
        }

        resetEvents(gd);

        assertSelectionNodes(0, 0);
        drag(dragPath);

        return (eventCounts[0] ? selectedPromise : Promise.resolve())
            .then(afterDragFn)
            .then(function() {
                // TODO: in v3 when we remove the `plotly_selecting->undefined` the Math.max(...)
                // in the middle here will turn into just eventCounts[1].
                // It's just here because one of the selected events is generated during
                // doubleclick so hasn't happened yet when we're testing this.
                assertEventCounts(eventCounts[0], Math.max(0, eventCounts[1] - 1), 0, msg + ' (before dblclick)');
                return doubleClick(dblClickPos[0], dblClickPos[1]);
            })
            .then(eventCounts[2] ? deselectPromise : Promise.resolve())
            .then(function() {
                assertEventCounts(eventCounts[0], eventCounts[1], eventCounts[2], msg + ' (after dblclick)');
                expect(Lib.error).not.toHaveBeenCalled();
            });
    }

    [false, true].forEach(function(hasCssTransform) {
        it('should work on scatterternary traces, hasCssTransform: ' + hasCssTransform, function(done) {
            var assertPoints = makeAssertPoints(['a', 'b', 'c']);
            var assertSelectedPoints = makeAssertSelectedPoints();

            var fig = Lib.extendDeep({}, require('../../image/mocks/ternary_simple'));
            fig.layout.width = 800;
            fig.layout.dragmode = 'select';
            addInvisible(fig);

            _newPlot(gd, fig)
            .then(function() {
                if(hasCssTransform) transformPlot(gd, cssTransform);

                return _run(hasCssTransform,
                    [[400, 200], [445, 235]],
                    function() {
                        assertPoints([[0.5, 0.25, 0.25]]);
                        assertSelectedPoints({0: [0]});
                        expect(selectedData.points[0].id).toBe("first ID")
                    },
                    [380, 180],
                    BOXEVENTS, 'scatterternary select'
                );
            })
            .then(function() {
                return Plotly.relayout(gd, 'dragmode', 'lasso');
            })
            .then(function() {
                return _run(hasCssTransform,
                    [[400, 200], [445, 200], [445, 235], [400, 235], [400, 200]],
                    function() {
                        assertPoints([[0.5, 0.25, 0.25]]);
                        assertSelectedPoints({0: [0]});
                    },
                    [380, 180],
                    LASSOEVENTS, 'scatterternary lasso'
                );
            })
            .then(function() {
                // should work after a relayout too
                return Plotly.relayout(gd, 'width', 400);
            })
            .then(function() {
                return _run(hasCssTransform,
                    [[200, 200], [230, 200], [230, 230], [200, 230], [200, 200]],
                    function() {
                        assertPoints([[0.5, 0.25, 0.25]]);
                        assertSelectedPoints({0: [0]});
                    },
                    [180, 180],
                    LASSOEVENTS, 'scatterternary lasso after relayout'
                );
            })
            .then(done, done.fail);
        });
    });

    [false, true].forEach(function(hasCssTransform) {
        it('should work on scattercarpet traces, hasCssTransform: ' + hasCssTransform, function(done) {
            var assertPoints = makeAssertPoints(['a', 'b']);
            var assertSelectedPoints = makeAssertSelectedPoints();

            var fig = Lib.extendDeep({}, require('../../image/mocks/scattercarpet'));
            delete fig.data[6].selectedpoints;
            fig.layout.dragmode = 'select';
            addInvisible(fig);

            _newPlot(gd, fig)
            .then(function() {
                if(hasCssTransform) transformPlot(gd, cssTransform);

                return _run(hasCssTransform,
                    [[300, 200], [400, 250]],
                    function() {
                        assertPoints([[0.2, 1.5]]);
                        assertSelectedPoints({1: [], 2: [], 3: [], 4: [], 5: [1], 6: []});
                    },
                    null, BOXEVENTS, 'scattercarpet select'
                );
            })
            .then(function() {
                return Plotly.relayout(gd, 'dragmode', 'lasso');
            })
            .then(function() {
                return _run(hasCssTransform,
                    [[300, 200], [400, 200], [400, 250], [300, 250], [300, 200]],
                    function() {
                        assertPoints([[0.2, 1.5]]);
                        assertSelectedPoints({1: [], 2: [], 3: [], 4: [], 5: [1], 6: []});
                    },
                    null, LASSOEVENTS, 'scattercarpet lasso'
                );
            })
            .then(done, done.fail);
        });
    });

    [false, true].forEach(function(hasCssTransform) {
        it('@gl should work on scattermap traces, hasCssTransform: ' + hasCssTransform, function(done) {
            var assertPoints = makeAssertPoints(['lon', 'lat']);
            var assertRanges = makeAssertRanges('map');
            var assertLassoPoints = makeAssertLassoPoints('map');
            var assertSelectedPoints = makeAssertSelectedPoints();

            var fig = Lib.extendDeep({}, require('../../image/mocks/map_bubbles-text'));

            fig.data[0].lon.push(null);
            fig.data[0].lat.push(null);

            fig.layout.dragmode = 'select';

            delete fig.layout.map.bounds;

            fig.config = {};
            addInvisible(fig);

            _newPlot(gd, fig)
            .then(function() {
                if(hasCssTransform) transformPlot(gd, cssTransform);

                return _run(hasCssTransform,
                    [[370, 120], [500, 200]],
                    function() {
                        assertPoints([[30, 30]]);
                        assertRanges([[21.99, 34.55], [38.14, 25.98]]);
                        assertSelectedPoints({0: [2]});
                    },
                    null, BOXEVENTS, 'scattermap select'
                );
            })
            .then(function() {
                return Plotly.relayout(gd, 'dragmode', 'lasso');
            })
            .then(function() {
                return _run(hasCssTransform,
                    [[300, 200], [300, 300], [400, 300], [400, 200], [300, 200]],
                    function() {
                        assertPoints([[20, 20]]);
                        assertSelectedPoints({0: [1]});
                        assertLassoPoints([
                            [13.28, 25.97], [13.28, 14.33], [25.71, 14.33], [25.71, 25.97], [13.28, 25.97]
                        ]);
                    },
                    null, LASSOEVENTS, 'scattermap lasso'
                );
            })
            .then(function() {
                // make selection handlers don't get called in 'pan' dragmode
                return Plotly.relayout(gd, 'dragmode', 'pan');
            })
            .then(function() {
                return _run(hasCssTransform,
                    [[370, 120], [500, 200]], null, null, NOEVENTS, 'scattermap pan'
                );
            })
            .then(done, done.fail);
        }, LONG_TIMEOUT_INTERVAL);
    });

    [false, true].forEach(function(hasCssTransform) {
        it('@gl should work on scattermap traces, hasCssTransform: ' + hasCssTransform, function(done) {
            var assertPoints = makeAssertPoints(['lon', 'lat']);
            var assertRanges = makeAssertRanges('map');
            var assertLassoPoints = makeAssertLassoPoints('map');
            var assertSelectedPoints = makeAssertSelectedPoints();

            var fig = Lib.extendDeep({}, require('../../image/mocks/map_bubbles-text'));

            fig.data[0].lon.push(null);
            fig.data[0].lat.push(null);

            fig.layout.dragmode = 'select';

            delete fig.layout.map.bounds;

            fig.config = {};
            addInvisible(fig);

            _newPlot(gd, fig)
            .then(function() {
                if(hasCssTransform) transformPlot(gd, cssTransform);

                return _run(hasCssTransform,
                    [[370, 120], [500, 200]],
                    function() {
                        assertPoints([[30, 30]]);
                        assertRanges([[21.99, 34.55], [38.14, 25.98]]);
                        assertSelectedPoints({0: [2]});
                    },
                    null, BOXEVENTS, 'scattermap select'
                );
            })
            .then(function() {
                return Plotly.relayout(gd, 'dragmode', 'lasso');
            })
            .then(function() {
                return _run(hasCssTransform,
                    [[300, 200], [300, 300], [400, 300], [400, 200], [300, 200]],
                    function() {
                        assertPoints([[20, 20]]);
                        assertSelectedPoints({0: [1]});
                        assertLassoPoints([
                            [13.28, 25.97], [13.28, 14.33], [25.71, 14.33], [25.71, 25.97], [13.28, 25.97]
                        ]);
                    },
                    null, LASSOEVENTS, 'scattermap lasso'
                );
            })
            .then(function() {
                // make selection handlers don't get called in 'pan' dragmode
                return Plotly.relayout(gd, 'dragmode', 'pan');
            })
            .then(function() {
                return _run(hasCssTransform,
                    [[370, 120], [500, 200]], null, null, NOEVENTS, 'scattermap pan'
                );
            })
            .then(done, done.fail);
        }, LONG_TIMEOUT_INTERVAL);
    });

    [false, true].forEach(function(hasCssTransform) {
        it('@gl should work on choroplethmap traces, hasCssTransform: ' + hasCssTransform, function(done) {
            var assertPoints = makeAssertPoints(['location', 'z']);
            var assertRanges = makeAssertRanges('map');
            var assertLassoPoints = makeAssertLassoPoints('map');
            var assertSelectedPoints = makeAssertSelectedPoints();

            var fig = Lib.extendDeep({}, require('../../image/mocks/map_choropleth0.json'));

            fig.data[0].locations.push(null);

            fig.layout.dragmode = 'select';
            fig.config = {};
            addInvisible(fig);

            _newPlot(gd, fig)
            .then(function() {
                if(hasCssTransform) transformPlot(gd, cssTransform);

                return _run(hasCssTransform,
                    [[150, 150], [300, 300]],
                    function() {
                        assertPoints([['NY', 10]]);
                        assertRanges([[-83.38, 46.13], [-74.06, 39.29]]);
                        assertSelectedPoints({0: [0]});
                    },
                    null, BOXEVENTS, 'choroplethmap select'
                );
            })
            .then(function() {
                return Plotly.relayout(gd, 'dragmode', 'lasso');
            })
            .then(function() {
                return _run(hasCssTransform,
                    [[300, 200], [300, 300], [400, 300], [400, 200], [300, 200]],
                    function() {
                        assertPoints([['MA', 20]]);
                        assertSelectedPoints({0: [1]});
                        assertLassoPoints([
                            [-74.06, 43.936], [-74.06, 39.293], [-67.84, 39.293],
                            [-67.84, 43.936], [-74.06, 43.936]
                        ]);
                    },
                    null, LASSOEVENTS, 'choroplethmap lasso'
                );
            })
            .then(done, done.fail);
        }, LONG_TIMEOUT_INTERVAL);
    });

    [false, true].forEach(function(hasCssTransform) {
        it('should work on scattergeo traces, hasCssTransform: ' + hasCssTransform, function(done) {
            var assertPoints = makeAssertPoints(['lon', 'lat']);
            var assertSelectedPoints = makeAssertSelectedPoints();
            var assertRanges = makeAssertRanges('geo');
            var assertLassoPoints = makeAssertLassoPoints('geo');

            function assertNodeOpacity(exp) {
                var traces = d3Select(gd).selectAll('.scatterlayer > .trace');
                expect(traces.size()).toBe(Object.keys(exp).length, 'correct # of trace <g>');

                traces.each(function(_, i) {
                    d3Select(this).selectAll('path.point').each(function(_, j) {
                        expect(Number(this.style.opacity))
                            .toBe(exp[i][j], 'node opacity - trace ' + i + ' pt ' + j);
                    });
                });
            }

            var fig = {
                data: [{
                    type: 'scattergeo',
                    lon: [10, 20, 30, null],
                    lat: [10, 20, 30, null]
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

            _newPlot(gd, fig)
            .then(function() {
                if(hasCssTransform) transformPlot(gd, cssTransform);

                return _run(hasCssTransform,
                    [[350, 200], [450, 400]],
                    function() {
                        assertPoints([[10, 10], [20, 20], [-10, 10], [-20, 20]]);
                        assertSelectedPoints({0: [0, 1], 1: [0, 1]});
                        assertNodeOpacity({0: [1, 1, 0.2], 1: [1, 1, 0.2]});
                        assertRanges([[-28.13, 61.88], [28.13, -50.64]]);
                    },
                    null, BOXEVENTS, 'scattergeo select'
                );
            })
            .then(function() {
                return Plotly.relayout(gd, 'dragmode', 'lasso');
            })
            .then(function() {
                return _run(hasCssTransform,
                    [[300, 200], [300, 300], [400, 300], [400, 200], [300, 200]],
                    function() {
                        assertPoints([[-10, 10], [-20, 20], [-30, 30]]);
                        assertSelectedPoints({0: [], 1: [0, 1, 2]});
                        assertNodeOpacity({0: [0.2, 0.2, 0.2], 1: [1, 1, 1]});
                        assertLassoPoints([
                            [-56.25, 61.88], [-56.24, 5.63], [0, 5.63], [0, 61.88], [-56.25, 61.88]
                        ]);
                    },
                    null, LASSOEVENTS, 'scattergeo lasso'
                );
            })
            .then(function() {
                // some projection types can't handle BADNUM during c2p,
                // make they are skipped here
                return Plotly.relayout(gd, 'geo.projection.type', 'robinson');
            })
            .then(function() {
                return _run(hasCssTransform,
                    [[300, 200], [300, 300], [400, 300], [400, 200], [300, 200]],
                    function() {
                        assertPoints([[-10, 10], [-20, 20], [-30, 30]]);
                        assertSelectedPoints({0: [], 1: [0, 1, 2]});
                        assertNodeOpacity({0: [0.2, 0.2, 0.2], 1: [1, 1, 1]});
                        assertLassoPoints([
                            [-67.40, 55.07], [-56.33, 4.968], [0, 4.968], [0, 55.07], [-67.40, 55.07]
                        ]);
                    },
                    null, LASSOEVENTS, 'scattergeo lasso (on robinson projection)'
                );
            })
            .then(function() {
                // make sure selection handlers don't get called in 'pan' dragmode
                return Plotly.relayout(gd, 'dragmode', 'pan');
            })
            .then(function() {
                return _run(hasCssTransform,
                    [[370, 120], [500, 200]], null, null, NOEVENTS, 'scattergeo pan'
                );
            })
            .then(done, done.fail);
        }, LONG_TIMEOUT_INTERVAL);
    });

    [false, true].forEach(function(hasCssTransform) {
        it('should work on scatterpolar traces, hasCssTransform: ' + hasCssTransform, function(done) {
            var assertPoints = makeAssertPoints(['r', 'theta']);
            var assertSelectedPoints = makeAssertSelectedPoints();

            var fig = Lib.extendDeep({}, require('../../image/mocks/polar_subplots'));
            fig.layout.width = 800;
            fig.layout.dragmode = 'select';
            addInvisible(fig);

            _newPlot(gd, fig)
            .then(function() {
                if(hasCssTransform) transformPlot(gd, cssTransform);

                return _run(hasCssTransform,
                    [[150, 150], [350, 250]],
                    function() {
                        assertPoints([[1, 0], [2, 45]]);
                        assertSelectedPoints({0: [0, 1]});
                    },
                    [200, 200],
                    BOXEVENTS, 'scatterpolar select'
                );
            })
            .then(function() {
                return Plotly.relayout(gd, 'dragmode', 'lasso');
            })
            .then(function() {
                return _run(hasCssTransform,
                    [[150, 150], [350, 150], [350, 250], [150, 250], [150, 150]],
                    function() {
                        assertPoints([[1, 0], [2, 45]]);
                        assertSelectedPoints({0: [0, 1]});
                    },
                    [200, 200],
                    LASSOEVENTS, 'scatterpolar lasso'
                );
            })
            .then(done, done.fail);
        });
    });

    [false, true].forEach(function(hasCssTransform) {
        it('should work on scattersmith traces, hasCssTransform: ' + hasCssTransform, function(done) {
            var assertPoints = makeAssertPoints(['real', 'imag']);
            var assertSelectedPoints = makeAssertSelectedPoints();

            var fig = Lib.extendDeep({}, require('../../image/mocks/smith_basic.json'));
            fig.layout.dragmode = 'select';
            addInvisible(fig);

            _newPlot(gd, fig)
            .then(function() {
                if(hasCssTransform) transformPlot(gd, cssTransform);

                return _run(hasCssTransform,
                    [[260, 260], [460, 460]],
                    function() {
                        assertPoints([[1, 0]]);
                        assertSelectedPoints({0: [2]});
                    },
                    [360, 360],
                    BOXEVENTS, 'scattersmith select'
                );
            })
            .then(function() {
                return Plotly.relayout(gd, 'dragmode', 'lasso');
            })
            .then(function() {
                return _run(hasCssTransform,
                    [[260, 260], [260, 460], [460, 460], [460, 260], [260, 260]],
                    function() {
                        assertPoints([[1, 0]]);
                        assertSelectedPoints({0: [2]});
                    },
                    [360, 360],
                    LASSOEVENTS, 'scattersmith lasso'
                );
            })
            .then(done, done.fail);
        });
    });

    [false, true].forEach(function(hasCssTransform) {
        it('should work on barpolar traces, hasCssTransform: ' + hasCssTransform, function(done) {
            var assertPoints = makeAssertPoints(['r', 'theta']);
            var assertSelectedPoints = makeAssertSelectedPoints();

            var fig = Lib.extendDeep({}, require('../../image/mocks/polar_wind-rose.json'));
            fig.layout.showlegend = false;
            fig.layout.width = 500;
            fig.layout.height = 500;
            fig.layout.dragmode = 'select';
            addInvisible(fig);

            _newPlot(gd, fig)
            .then(function() {
                if(hasCssTransform) transformPlot(gd, cssTransform);

                return _run(hasCssTransform,
                    [[150, 150], [250, 250]],
                    function() {
                        assertPoints([
                            [62.5, 'N-W'], [55, 'N-W'], [40, 'North'],
                            [40, 'N-W'], [20, 'North'], [22.5, 'N-W']
                        ]);
                        assertSelectedPoints({
                            0: [7],
                            1: [7],
                            2: [0, 7],
                            3: [0, 7]
                        });
                    },
                    [200, 200],
                    BOXEVENTS, 'barpolar select'
                );
            })
            .then(function() {
                return Plotly.relayout(gd, 'dragmode', 'lasso');
            })
            .then(function() {
                return _run(hasCssTransform,
                    [[150, 150], [350, 150], [350, 250], [150, 250], [150, 150]],
                    function() {
                        assertPoints([
                            [62.5, 'N-W'], [50, 'N-E'], [55, 'N-W'], [40, 'North'],
                            [30, 'N-E'], [40, 'N-W'], [20, 'North'], [7.5, 'N-E'], [22.5, 'N-W']
                        ]);
                        assertSelectedPoints({
                            0: [7],
                            1: [1, 7],
                            2: [0, 1, 7],
                            3: [0, 1, 7]
                        });
                    },
                    [200, 200],
                    LASSOEVENTS, 'barpolar lasso'
                );
            })
            .then(done, done.fail);
        });
    });

    [false, true].forEach(function(hasCssTransform) {
        it('should work on choropleth traces, hasCssTransform: ' + hasCssTransform, function(done) {
            var assertPoints = makeAssertPoints(['location', 'z']);
            var assertSelectedPoints = makeAssertSelectedPoints();
            var assertRanges = makeAssertRanges('geo', -0.5);
            var assertLassoPoints = makeAssertLassoPoints('geo', -0.5);

            var fig = Lib.extendDeep({}, require('../../image/mocks/geo_choropleth-text'));
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

            _newPlot(gd, fig)
            .then(function() {
                if(hasCssTransform) transformPlot(gd, cssTransform);

                return _run(hasCssTransform,
                    [[350, 200], [400, 250]],
                    function() {
                        assertPoints([['GBR', 26.507354205352502], ['IRL', 86.4125147625692]]);
                        assertSelectedPoints({0: [43, 54]});
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
                return _run(hasCssTransform,
                    [[350, 200], [400, 200], [400, 250], [350, 250], [350, 200]],
                    function() {
                        assertPoints([['GBR', 26.507354205352502], ['IRL', 86.4125147625692]]);
                        assertSelectedPoints({0: [43, 54]});
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
                return _run(hasCssTransform,
                    [[370, 120], [500, 200]], null, [200, 180], NOEVENTS, 'choropleth pan'
                );
            })
            .then(done, done.fail);
        }, LONG_TIMEOUT_INTERVAL);
    });

    [false].forEach(function(hasCssTransform) {
        it('@noCI should work for waterfall traces, hasCssTransform: ' + hasCssTransform, function(done) {
            var assertPoints = makeAssertPoints(['curveNumber', 'x', 'y']);
            var assertSelectedPoints = makeAssertSelectedPoints();
            var assertRanges = makeAssertRanges();
            var assertLassoPoints = makeAssertLassoPoints();

            var fig = Lib.extendDeep({}, require('../../image/mocks/waterfall_profit-loss_2018_positive-negative'));
            fig.layout.dragmode = 'lasso';
            addInvisible(fig);

            _newPlot(gd, fig)
            .then(function() {
                if(hasCssTransform) transformPlot(gd, cssTransform);

                return _run(hasCssTransform,
                    [[400, 300], [200, 400], [400, 500], [600, 400], [500, 350]],
                    function() {
                        assertPoints([
                            [0, 281, 'Purchases'],
                            [0, 269, 'Material expenses'],                        ]);
                        assertSelectedPoints({
                            0: [5, 6]
                        });
                        assertLassoPoints([
                            [289.8550, 57.9710 ,521.7391, 405.7971],
                            [4.3387, 6.7580, 6.7580, 5.5483]
                        ]);
                    },
                    null, [3, 2, 1], 'waterfall lasso'
                );
            })
            .then(function() {
                return Plotly.relayout(gd, 'dragmode', 'select');
            })
            .then(function() {
                return _run(hasCssTransform,
                    [[300, 300], [400, 400]],
                    function() {
                        assertPoints([
                            [0, 281, 'Purchases'],
                            [0, 269, 'Material expenses']
                        ]);
                        assertSelectedPoints({
                            0: [5, 6]
                        });
                        assertRanges([
                            [173.9130, 289.8550],
                            [4.3387, 6.7580]
                        ]);
                    },
                    null, BOXEVENTS, 'waterfall select'
                );
            })
            .then(done, done.fail);
        });
    });

    [false].forEach(function(hasCssTransform) {
        it('@noCI should work for funnel traces, hasCssTransform: ' + hasCssTransform, function(done) {
            var assertPoints = makeAssertPoints(['curveNumber', 'x', 'y']);
            var assertSelectedPoints = makeAssertSelectedPoints();
            var assertLassoPoints = makeAssertLassoPoints();

            var fig = Lib.extendDeep({}, require('../../image/mocks/funnel_horizontal_group_basic'));
            fig.layout.dragmode = 'lasso';
            addInvisible(fig);

            _newPlot(gd, fig)
            .then(function() {
                if(hasCssTransform) transformPlot(gd, cssTransform);

                return _run(hasCssTransform,
                    [[400, 300], [200, 400], [400, 500], [600, 400], [500, 350]],
                    function() {
                        assertPoints([
                            [0, 331.5, 'Author: etpinard'],
                            [1, 53.5, 'Pull requests'],
                        ]);
                        assertSelectedPoints({
                            0: [2],
                            1: [1]
                        });
                        assertLassoPoints([
                            [-140.1492, -1697.3631, 1417.0646, 638.4577],
                            [1.1129, 1.9193 , 1.9193, 1.5161]
                        ]);
                    },
                    null, [3, 2, 1], 'funnel lasso'
                );
            })
            .then(done, done.fail);
        });
    });

    [false].forEach(function(hasCssTransform) {
        it('@flaky should work for bar traces, hasCssTransform: ' + hasCssTransform, function(done) {
            var assertPoints = makeAssertPoints(['curveNumber', 'x', 'y']);
            var assertSelectedPoints = makeAssertSelectedPoints();
            var assertRanges = makeAssertRanges();
            var assertLassoPoints = makeAssertLassoPoints();

            var fig = Lib.extendDeep({}, require('../../image/mocks/0'));
            fig.layout.dragmode = 'lasso';
            addInvisible(fig);

            _newPlot(gd, fig)
            .then(function() {
                if(hasCssTransform) transformPlot(gd, cssTransform);

                return _run(hasCssTransform,
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
                        assertSelectedPoints({
                            0: [49, 50, 51, 52, 53, 54, 55, 56, 57],
                            1: [51, 52, 53, 54, 55, 56],
                            2: [49, 50, 51, 52, 53]
                        });
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
            .then(delay(100))
            .then(function() {
                return _run(hasCssTransform,
                    [[350, 200], [370, 220]],
                    function() {
                        assertPoints([
                            [0, 4.9, 0.371], [0, 5, 0.368], [0, 5.1, 0.356], [0, 5.2, 0.336],
                            [1, 5.1, 0.485], [1, 5.2, 0.41],
                            [2, 4.9, 0.473], [2, 5, 0.37]
                        ]);
                        assertSelectedPoints({
                            0: [49, 50, 51, 52],
                            1: [51, 52],
                            2: [49, 50]
                        });
                        assertRanges([[4.87, 5.22], [0.31, 0.53]]);
                    },
                    null, BOXEVENTS, 'bar select'
                );
            })
            .then(function() {
                // mimic https://github.com/plotly/plotly.js/issues/3795
                return Plotly.relayout(gd, {
                    'xaxis.rangeslider.visible': true,
                    'xaxis.range': [0, 6]
                });
            })
            .then(function() {
                return _run(hasCssTransform,
                    [[350, 200], [360, 200]],
                    function() {
                        assertPoints([
                            [0, 2.5, -0.429], [1, 2.5, -1.015], [2, 2.5, -1.172],
                        ]);
                        assertSelectedPoints({
                            0: [25],
                            1: [25],
                            2: [25]
                        });
                        assertRanges([[2.434, 2.521], [-1.4355, 2.0555]]);
                    },
                    null, BOXEVENTS, 'bar select (after xaxis.range relayout)'
                );
            })
            .then(done, done.fail);
        });
    });

    [false, true].forEach(function(hasCssTransform) {
        it('@noCI should work for date/category traces, hasCssTransform: ' + hasCssTransform, function(done) {
            var assertPoints = makeAssertPoints(['curveNumber', 'x', 'y']);
            var assertSelectedPoints = makeAssertSelectedPoints();

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

            _newPlot(gd, fig)
            .then(function() {
                if(hasCssTransform) transformPlot(gd, cssTransform);

                return _run(hasCssTransform,
                    [[x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0]],
                    function() {
                        assertPoints([
                            [0, '2017-02-01', 'b'],
                            [1, '2017-02-02', 'b']
                        ]);
                        assertSelectedPoints({0: [1], 1: [1]});
                    },
                    null, LASSOEVENTS, 'date/category lasso'
                );
            })
            .then(function() {
                return Plotly.relayout(gd, 'dragmode', 'select');
            })
            .then(function() {
                return _run(hasCssTransform,
                    [[x0, y0], [x1, y1]],
                    function() {
                        assertPoints([
                            [0, '2017-02-01', 'b'],
                            [1, '2017-02-02', 'b']
                        ]);
                        assertSelectedPoints({0: [1], 1: [1]});
                    },
                    null, BOXEVENTS, 'date/category select'
                );
            })
            .then(done, done.fail);
        });
    });

    [false, true].forEach(function(hasCssTransform) {
        it('should work for histogram traces, hasCssTransform: ' + hasCssTransform, function(done) {
            var assertPoints = makeAssertPoints(['curveNumber', 'x', 'y', 'pointIndices']);
            var assertSelectedPoints = makeAssertSelectedPoints();
            var assertRanges = makeAssertRanges();
            var assertLassoPoints = makeAssertLassoPoints();

            var fig = Lib.extendDeep({}, require('../../image/mocks/hist_grouped'));
            fig.layout.dragmode = 'lasso';
            fig.layout.width = 600;
            fig.layout.height = 500;
            addInvisible(fig);

            _newPlot(gd, fig)
            .then(function() {
                if(hasCssTransform) transformPlot(gd, cssTransform);

                return _run(hasCssTransform,
                    [[200, 200], [400, 200], [400, 350], [200, 350], [200, 200]],
                    function() {
                        assertPoints([
                            [0, 1.8, 2, [3, 4]], [1, 2.2, 1, [1]], [1, 3.2, 1, [2]]
                        ]);
                        assertSelectedPoints({0: [3, 4], 1: [1, 2]});
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
                return _run(hasCssTransform,
                    [[200, 200], [400, 350]],
                    function() {
                        assertPoints([
                            [0, 1.8, 2, [3, 4]], [1, 2.2, 1, [1]], [1, 3.2, 1, [2]]
                        ]);
                        assertSelectedPoints({0: [3, 4], 1: [1, 2]});
                        assertRanges([[1.66, 3.59], [0.69, 2.17]]);
                    },
                    null, BOXEVENTS, 'histogram select'
                );
            })
            .then(done, done.fail);
        });
    });

    [false, true].forEach(function(hasCssTransform) {
        it('should work for box traces, hasCssTransform: ' + hasCssTransform, function(done) {
            var assertPoints = makeAssertPoints(['curveNumber', 'y', 'x']);
            var assertSelectedPoints = makeAssertSelectedPoints();
            var assertRanges = makeAssertRanges();
            var assertLassoPoints = makeAssertLassoPoints();

            var fig = Lib.extendDeep({}, require('../../image/mocks/box_grouped'));
            fig.data.forEach(function(trace) {
                trace.boxpoints = 'all';
            });
            fig.layout.dragmode = 'lasso';
            fig.layout.width = 600;
            fig.layout.height = 500;
            fig.layout.xaxis = {range: [-0.565, 1.5]};
            addInvisible(fig);

            _newPlot(gd, fig)
            .then(function() {
                if(hasCssTransform) transformPlot(gd, cssTransform);

                return _run(hasCssTransform,
                    [[200, 200], [400, 200], [400, 350], [200, 350], [200, 200]],
                    function() {
                        assertPoints([
                            [0, 0.2, 'day 2'], [0, 0.3, 'day 2'], [0, 0.5, 'day 2'], [0, 0.7, 'day 2'],
                            [1, 0.2, 'day 2'], [1, 0.5, 'day 2'], [1, 0.7, 'day 2'], [1, 0.7, 'day 2'],
                            [2, 0.3, 'day 1'], [2, 0.6, 'day 1'], [2, 0.6, 'day 1']
                        ]);
                        assertSelectedPoints({
                            0: [6, 11, 10, 7],
                            1: [11, 8, 6, 10],
                            2: [1, 4, 5]
                        });
                        assertLassoPoints([
                            [0.0423, 1.0546, 1.0546, 0.0423, 0.0423],
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
                return _run(hasCssTransform,
                    [[200, 200], [400, 350]],
                    function() {
                        assertPoints([
                            [0, 0.2, 'day 2'], [0, 0.3, 'day 2'], [0, 0.5, 'day 2'], [0, 0.7, 'day 2'],
                            [1, 0.2, 'day 2'], [1, 0.5, 'day 2'], [1, 0.7, 'day 2'], [1, 0.7, 'day 2'],
                            [2, 0.3, 'day 1'], [2, 0.6, 'day 1'], [2, 0.6, 'day 1']
                        ]);
                        assertSelectedPoints({
                            0: [6, 11, 10, 7],
                            1: [11, 8, 6, 10],
                            2: [1, 4, 5]
                        });
                        assertRanges([[0.04235, 1.0546], [0.1875, 0.71]]);
                    },
                    null, BOXEVENTS, 'box select'
                );
            })
            .then(done, done.fail);
        });
    });

    [false, true].forEach(function(hasCssTransform) {
        it('should work for box traces (q1/median/q3 case), hasCssTransform: ' + hasCssTransform, function(done) {
            var assertPoints = makeAssertPoints(['curveNumber', 'y', 'x']);
            var assertSelectedPoints = makeAssertSelectedPoints();

            var fig = {
                data: [{
                    type: 'box',
                    x0: 'A',
                    q1: [1],
                    median: [2],
                    q3: [3],
                    y: [[0, 1, 2, 3, 4]],
                    pointpos: 0,
                }],
                layout: {
                    width: 500,
                    height: 500,
                    dragmode: 'lasso'
                }
            };

            _newPlot(gd, fig)
            .then(function() {
                if(hasCssTransform) transformPlot(gd, cssTransform);

                return _run(hasCssTransform,
                    [[200, 200], [400, 200], [400, 350], [200, 350], [200, 200]],
                    function() {
                        assertPoints([ [0, 1, undefined], [0, 2, undefined] ]);
                        assertSelectedPoints({ 0: [[0, 1], [0, 2]] });
                    },
                    null, LASSOEVENTS, 'box lasso'
                );
            })
            .then(function() {
                return Plotly.relayout(gd, 'dragmode', 'select');
            })
            .then(function() {
                return _run(hasCssTransform,
                    [[200, 200], [400, 300]],
                    function() {
                        assertPoints([ [0, 2, undefined] ]);
                        assertSelectedPoints({ 0: [[0, 2]] });
                    },
                    null, BOXEVENTS, 'box select'
                );
            })
            .then(done, done.fail);
        });
    });

    [false, true].forEach(function(hasCssTransform) {
        it('should work for violin traces, hasCssTransform: ' + hasCssTransform, function(done) {
            var assertPoints = makeAssertPoints(['curveNumber', 'y', 'x']);
            var assertSelectedPoints = makeAssertSelectedPoints();
            var assertRanges = makeAssertRanges();
            var assertLassoPoints = makeAssertLassoPoints();

            var fig = Lib.extendDeep({}, require('../../image/mocks/violin_grouped'));
            fig.layout.dragmode = 'lasso';
            fig.layout.width = 600;
            fig.layout.height = 500;
            addInvisible(fig);

            _newPlot(gd, fig)
            .then(function() {
                if(hasCssTransform) transformPlot(gd, cssTransform);

                return _run(hasCssTransform,
                    [[200, 200], [400, 200], [400, 350], [200, 350], [200, 200]],
                    function() {
                        assertPoints([
                            [0, 0.3, 'day 2'], [0, 0.5, 'day 2'], [0, 0.7, 'day 2'], [0, 0.9, 'day 2'],
                            [1, 0.5, 'day 2'], [1, 0.7, 'day 2'], [1, 0.7, 'day 2'], [1, 0.8, 'day 2'],
                            [1, 0.9, 'day 2'],
                            [2, 0.3, 'day 1'], [2, 0.6, 'day 1'], [2, 0.6, 'day 1'], [2, 0.9, 'day 1']
                        ]);
                        assertSelectedPoints({
                            0: [11, 10, 7, 8],
                            1: [8, 6, 10, 9, 7],
                            2: [1, 4, 5, 3]
                        });
                        assertLassoPoints([
                            [0.07777, 1.0654, 1.0654, 0.07777, 0.07777],
                            [1.02, 1.02, 0.27, 0.27, 1.02]
                        ]);
                    },
                    null, LASSOEVENTS, 'violin lasso'
                );
            })
            .then(function() {
                return Plotly.relayout(gd, 'dragmode', 'select');
            })
            .then(function() {
                return _run(hasCssTransform,
                    [[200, 200], [400, 350]],
                    function() {
                        assertPoints([
                            [0, 0.3, 'day 2'], [0, 0.5, 'day 2'], [0, 0.7, 'day 2'], [0, 0.9, 'day 2'],
                            [1, 0.5, 'day 2'], [1, 0.7, 'day 2'], [1, 0.7, 'day 2'], [1, 0.8, 'day 2'],
                            [1, 0.9, 'day 2'],
                            [2, 0.3, 'day 1'], [2, 0.6, 'day 1'], [2, 0.6, 'day 1'], [2, 0.9, 'day 1']
                        ]);
                        assertSelectedPoints({
                            0: [11, 10, 7, 8],
                            1: [8, 6, 10, 9, 7],
                            2: [1, 4, 5, 3]
                        });
                        assertRanges([[0.07777, 1.0654], [0.27, 1.02]]);
                    },
                    null, BOXEVENTS, 'violin select'
                );
            })
            .then(done, done.fail);
        });
    });

    [false].forEach(function(hasCssTransform) {
        ['ohlc', 'candlestick'].forEach(function(type) {
            it('should work for ' + type + ' traces, hasCssTransform: ' + hasCssTransform, function(done) {
                var assertPoints = makeAssertPoints(['curveNumber', 'x', 'open', 'high', 'low', 'close']);
                var assertSelectedPoints = makeAssertSelectedPoints();
                var assertRanges = makeAssertRanges();
                var assertLassoPoints = makeAssertLassoPoints();
                var l0 = 275;
                var lv0 = '2011-01-03 18:00';
                var r0 = 325;
                var rv0 = '2011-01-04 06:00';
                var l1 = 75;
                var lv1 = '2011-01-01 18:00';
                var r1 = 125;
                var rv1 = '2011-01-02 06:00';
                var t = 75;
                var tv = 7.565;
                var b = 225;
                var bv = -1.048;

                function countUnSelectedPaths(selector) {
                    var unselected = 0;
                    d3Select(gd).selectAll(selector).each(function() {
                        var opacity = this.style.opacity;
                        if(opacity < 1) unselected++;
                    });
                    return unselected;
                }

                _newPlot(gd, [{
                    type: type,
                    x: ['2011-01-02', '2011-01-03', '2011-01-04'],
                    open: [1, 2, 3],
                    high: [3, 4, 5],
                    low: [0, 1, 2],
                    close: [0, 3, 2]
                }], {
                    width: 400,
                    height: 400,
                    margin: {l: 50, r: 50, t: 50, b: 50},
                    yaxis: {range: [-3, 9]},
                    dragmode: 'lasso'
                })
                .then(function() {
                    if(hasCssTransform) transformPlot(gd, cssTransform);

                    return _run(hasCssTransform,
                        [[l0, t], [l0, b], [r0, b], [r0, t], [l0, t]],
                        function() {
                            assertPoints([[0, '2011-01-04', 3, 5, 2, 2]]);
                            assertSelectedPoints([[2]]);
                            assertLassoPoints([
                                [lv0, lv0, rv0, rv0, lv0],
                                [tv, bv, bv, tv, tv]
                            ]);
                            expect(countUnSelectedPaths('.cartesianlayer .trace path')).toBe(2);
                            expect(countUnSelectedPaths('.rangeslider-rangeplot .trace path')).toBe(2);
                        },
                        null, LASSOEVENTS, type + ' lasso'
                    );
                })
                .then(function() {
                    return Plotly.relayout(gd, 'dragmode', 'select');
                })
                .then(function() {
                    return _run(hasCssTransform,
                        [[l1, t], [r1, b]],
                        function() {
                            assertPoints([[0, '2011-01-02', 1, 3, 0, 0]]);
                            assertSelectedPoints([[0]]);
                            assertRanges([[lv1, rv1], [bv, tv]]);
                        },
                        null, BOXEVENTS, type + ' select'
                    );
                })
                .then(done, done.fail);
            });
        });
    });

    [false, true].forEach(function(hasCssTransform) {
        it('should work on scatter/bar traces with text nodes, hasCssTransform: ' + hasCssTransform, function(done) {
            var assertSelectedPoints = makeAssertSelectedPoints();

            function assertFillOpacity(exp, msg) {
                var txtPts = d3Select(gd).select('g.overplot').select('.xy').selectAll('text');

                expect(txtPts.size()).toBe(exp.length, '# of text nodes: ' + msg);

                txtPts.each(function(_, i) {
                    var act = Number(this.style['fill-opacity']);
                    expect(act).toBe(exp[i], 'node ' + i + ' fill opacity: ' + msg);
                });
            }

            _newPlot(gd, [{
                mode: 'markers+text',
                x: [1, 2, 3],
                y: [1, 2, 1],
                text: ['a', 'b', 'c']
            }, {
                type: 'bar',
                x: [1, 2, 3],
                y: [1, 2, 1],
                text: ['A', 'B', 'C'],
                textposition: 'outside'
            }], {
                dragmode: 'select',
                hovermode: 'closest',
                showlegend: false,
                width: 400,
                height: 400,
                margin: {l: 0, t: 0, r: 0, b: 0}
            })
            .then(function() {
                if(hasCssTransform) transformPlot(gd, cssTransform);

                return _run(hasCssTransform,
                    [[10, 10], [100, 300]],
                    function() {
                        assertSelectedPoints({0: [0], 1: [0]});
                        assertFillOpacity([1, 0.2, 0.2, 1, 0.2, 0.2], '_run');
                    },
                    [10, 10], BOXEVENTS, 'selecting first scatter/bar text nodes'
                );
            })
            .then(function() {
                assertFillOpacity([1, 1, 1, 1, 1, 1], 'final');
            })
            .then(done, done.fail);
        });
    });

    describe('should work on sankey traces', function() {
        var waitingTime = sankeyConstants.duration * 2;

        [false].forEach(function(hasCssTransform) {
            it('select, hasCssTransform: ' + hasCssTransform, function(done) {
                var fig = Lib.extendDeep({}, require('../../image/mocks/sankey_circular.json'));
                fig.layout.dragmode = 'select';
                var dblClickPos = [250, 400];

                _newPlot(gd, fig)
                .then(function() {
                    if(hasCssTransform) transformPlot(gd, cssTransform);

                    // No groups initially
                    expect(gd._fullData[0].node.groups).toEqual([]);
                })
                .then(function() {
                    // Grouping the two nodes on the top right
                    return _run(hasCssTransform,
                        [[640, 130], [400, 450]],
                        function() {
                            expect(gd._fullData[0].node.groups).toEqual([[2, 3]], 'failed to group #2 + #3');
                        },
                        dblClickPos, BOXEVENTS, 'for top right nodes #2 and #3'
                    );
                })
                .then(delay(waitingTime))
                .then(function() {
                    // Grouping node #4 and the previous group
                    drag([[715, 400], [300, 110]]);
                })
                .then(delay(waitingTime))
                .then(function() {
                    expect(gd._fullData[0].node.groups).toEqual([[4, 3, 2]], 'failed to group #4 + existing group of #2 and #3');
                })
                .then(done, done.fail);
            });
        });

        it('should not work when dragmode is undefined', function(done) {
            var fig = Lib.extendDeep({}, require('../../image/mocks/sankey_circular.json'));
            fig.layout.dragmode = undefined;

            _newPlot(gd, fig)
            .then(function() {
                // No groups initially
                expect(gd._fullData[0].node.groups).toEqual([]);
            })
            .then(function() {
                // Grouping the two nodes on the top right
                drag([[640, 130], [400, 450]]);
            })
            .then(delay(waitingTime))
            .then(function() {
                expect(gd._fullData[0].node.groups).toEqual([]);
            })
            .then(done, done.fail);
        });
    });

    it('@gl should work on choroplethmap traces after adding a new trace on top:', function(done) {
        var assertPoints = makeAssertPoints(['location', 'z']);
        var assertRanges = makeAssertRanges('map');
        var assertLassoPoints = makeAssertLassoPoints('map');
        var assertSelectedPoints = makeAssertSelectedPoints();

        var fig = Lib.extendDeep({}, require('../../image/mocks/map_choropleth0.json'));

        fig.data[0].locations.push(null);

        fig.layout.dragmode = 'select';
        fig.config = {};
        addInvisible(fig);

        var hasCssTransform = false;

        _newPlot(gd, fig)
        .then(function() {
            // add a scatter points on top
            fig.data[3] = {
                type: 'scattermap',
                marker: { size: 40 },
                lon: [-70],
                lat: [40]
            };

            return Plotly.react(gd, fig);
        })
        .then(function() {
            return _run(hasCssTransform,
                [[150, 150], [300, 300]],
                function() {
                    assertPoints([['NY', 10]]);
                    assertRanges([[-83.38, 46.13], [-74.06, 39.29]]);
                    assertSelectedPoints({0: [0], 3: []});
                },
                null, BOXEVENTS, 'choroplethmap select'
            );
        })
        .then(function() {
            return Plotly.relayout(gd, 'dragmode', 'lasso');
        })
        .then(function() {
            return _run(hasCssTransform,
                [[300, 200], [300, 300], [400, 300], [400, 200], [300, 200]],
                function() {
                    assertPoints([['MA', 20], []]);
                    assertSelectedPoints({0: [1], 3: [0]});
                    assertLassoPoints([
                        [-74.06, 43.936], [-74.06, 39.293], [-67.84, 39.293],
                        [-67.84, 43.936], [-74.06, 43.936]
                    ]);
                },
                null, LASSOEVENTS, 'choroplethmap lasso'
            );
        })
        .then(done, done.fail);
    }, LONG_TIMEOUT_INTERVAL);
});

describe('Test that selections persist:', function() {
    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(destroyGraphDiv);

    function assertPtOpacity(selector, expected) {
        d3SelectAll(selector).each(function(_, i) {
            var style = Number(this.style.opacity);
            expect(style).toBe(expected.style[i], 'style for pt ' + i);
        });
    }

    it('should persist for scatter', function(done) {
        function _assert(expected) {
            var selected = gd.calcdata[0].map(function(d) { return d.selected; });
            expect(selected).toBeCloseToArray(expected.selected, 'selected vals');
            assertPtOpacity('.point', expected);
        }

        _newPlot(gd, [{
            x: [1, 2, 3],
            y: [1, 2, 1]
        }], {
            dragmode: 'select',
            width: 400,
            height: 400,
            margin: {l: 0, t: 0, r: 0, b: 0}
        })
        .then(function() {
            resetEvents(gd);
            drag([[5, 5], [250, 350]]);
            return selectedPromise;
        })
        .then(function() {
            _assert({
                selected: [0, 1, 0],
                style: [0.2, 1, 0.2]
            });

            // trigger a recalc
            Plotly.restyle(gd, 'x', [[10, 20, 30]]);
        })
        .then(function() {
            _assert({
                selected: [undefined, 1, undefined],
                style: [0.2, 1, 0.2]
            });
        })
        .then(done, done.fail);
    });

    it('should persist for box', function(done) {
        function _assert(expected) {
            var selected = gd.calcdata[0][0].pts.map(function(d) { return d.selected; });
            expect(selected).toBeCloseToArray(expected.cd, 'selected calcdata vals');
            expect(gd.data[0].selectedpoints).toBeCloseToArray(expected.selectedpoints, 'selectedpoints array');
            assertPtOpacity('.point', expected);
        }

        _newPlot(gd, [{
            type: 'box',
            x0: 0,
            y: [5, 4, 4, 1, 2, 2, 2, 2, 2, 3, 3, 3],
            boxpoints: 'all'
        }], {
            dragmode: 'select',
            width: 400,
            height: 400,
            margin: {l: 0, t: 0, r: 0, b: 0}
        })
        .then(function() {
            resetEvents(gd);
            drag([[5, 5], [400, 150]]);
            return selectedPromise;
        })
        .then(function() {
            _assert({
                // N.B. pts in calcdata are sorted
                cd: [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1],
                selectedpoints: [1, 2, 0],
                style: [0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 1, 1, 1],
            });

            // trigger a recalc
            return Plotly.restyle(gd, 'x0', 1);
        })
        .then(function() {
            _assert({
                cd: [undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, 1, 1, 1],
                selectedpoints: [1, 2, 0],
                style: [0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 1, 1, 1],
            });
        })
        .then(done, done.fail);
    });

    it('should persist for histogram', function(done) {
        function _assert(expected) {
            var selected = gd.calcdata[0].map(function(d) { return d.selected; });
            expect(selected).toBeCloseToArray(expected.selected, 'selected vals');
            assertPtOpacity('.point > path', expected);
        }

        _newPlot(gd, [{
            type: 'histogram',
            x: [1, 2, 2, 2, 2, 2, 3, 3, 3, 4, 4, 5],
            boxpoints: 'all'
        }], {
            dragmode: 'select',
            width: 400,
            height: 400,
            margin: {l: 0, t: 0, r: 0, b: 0}
        })
        .then(function() {
            resetEvents(gd);
            drag([[5, 5], [400, 150]]);
            return selectedPromise;
        })
        .then(function() {
            _assert({
                selected: [0, 1, 0, 0, 0],
                style: [0.2, 1, 0.2, 0.2, 0.2],
            });

            // trigger a recalc
            return Plotly.restyle(gd, 'histfunc', 'sum');
        })
        .then(function() {
            _assert({
                selected: [undefined, 1, undefined, undefined, undefined],
                style: [0.2, 1, 0.2, 0.2, 0.2],
            });
        })
        .then(done, done.fail);
    });
});

describe('Test that selection styles propagate to range-slider plot:', function() {
    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(destroyGraphDiv);

    function makeAssertFn(query) {
        return function(msg, expected) {
            var gd3 = d3Select(gd);
            var mainPlot3 = gd3.select('.cartesianlayer');
            var rangePlot3 = gd3.select('.rangeslider-rangeplot');

            mainPlot3.selectAll(query).each(function(_, i) {
                expect(this.style.opacity).toBe(String(expected[i]), msg + ' opacity for mainPlot pt ' + i);
            });
            rangePlot3.selectAll(query).each(function(_, i) {
                expect(this.style.opacity).toBe(String(expected[i]), msg + ' opacity for rangePlot pt ' + i);
            });
        };
    }

    it('- svg points case', function(done) {
        var _assert = makeAssertFn('path.point,.point>path');

        _newPlot(gd, [
            { mode: 'markers', x: [1], y: [1] },
            { type: 'bar', x: [2], y: [2], },
            { type: 'histogram', x: [3, 3, 3] },
            { type: 'box', x: [4], y: [4], boxpoints: 'all' },
            { type: 'violin', x: [5], y: [5], points: 'all' },
            { type: 'waterfall', x: [6], y: [6]},
            { type: 'funnel', x: [7], y: [7], orientation: 'v'}
        ], {
            dragmode: 'select',
            xaxis: { rangeslider: {visible: true} },
            width: 500,
            height: 500,
            margin: {l: 10, t: 10, r: 10, b: 10},
            showlegend: false
        })
        .then(function() {
            _assert('base', [1, 1, 1, 1, 1, 1, 1]);
        })
        .then(function() {
            resetEvents(gd);
            drag([[20, 20], [40, 40]]);
            return selectedPromise;
        })
        .then(function() {
            _assert('after empty selection', [0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2]);
        })
        .then(function() { return doubleClick(200, 200); })
        .then(function() {
            _assert('after double-click reset', [1, 1, 1, 1, 1, 1, 1]);
        })
        .then(done, done.fail);
    });

    it('- svg finance case', function(done) {
        var _assert = makeAssertFn('path.box,.ohlc>path');

        _newPlot(gd, [
            { type: 'ohlc', x: [6], open: [6], high: [6], low: [6], close: [6] },
            { type: 'candlestick', x: [7], open: [7], high: [7], low: [7], close: [7] },
        ], {
            dragmode: 'select',
            width: 500,
            height: 500,
            margin: {l: 10, t: 10, r: 10, b: 10},
            showlegend: false
        })
        .then(function() {
            _assert('base', [1, 1]);
        })
        .then(function() {
            resetEvents(gd);
            drag([[20, 20], [40, 40]]);
            return selectedPromise;
        })
        .then(function() {
            _assert('after empty selection', [0.3, 0.3]);
        })
        .then(function() { return doubleClick(200, 200); })
        .then(function() {
            _assert('after double-click reset', [1, 1]);
        })
        .then(done, done.fail);
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
