var Plotly = require('@lib/index');
var Lib = require('@src/lib');
var Registry = require('@src/registry');
function _doPlot(gd, data, layout) {
    return Registry.call('_doPlot', gd, data, layout);
}

var Table = require('@src/traces/table');
var attributes = require('@src/traces/table/attributes');
var cn = require('@src/traces/table/constants').cn;

var d3SelectAll = require('../../strict-d3').selectAll;
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');

var supplyAllDefaults = require('../assets/supply_defaults');
var mouseEvent = require('../assets/mouse_event');

var mockMulti = require('@mocks/table_latex_multitrace_scatter.json');

// mock with two columns; lowest column count of general case
var mock2 = Lib.extendDeep({}, mockMulti);
mock2.data = [mock2.data[2]]; // keep the subplot with two columns

// mock with one column as special case
var mock1 = Lib.extendDeep({}, mock2);
mock1.data[0].header.values = mock1.data[0].header.values.slice(0, 1);
mock1.data[0].cells.values = mock1.data[0].cells.values.slice(0, 1);

// mock with zero columns; special case, as no column can be rendered
var mock0 = Lib.extendDeep({}, mock1);
mock0.data[0].header.values = [];
mock0.data[0].cells.values = [];

var mock = require('@mocks/table_plain_birds.json');

describe('table initialization tests', function() {
    'use strict';

    describe('table global defaults', function() {
        it('should not coerce trace opacity', function() {
            var gd = Lib.extendDeep({}, mock1);

            supplyAllDefaults(gd);

            expect(gd._fullData[0].opacity).toBeUndefined();
        });

        it('should use global font as label, tick and range font defaults', function() {
            var gd = Lib.extendDeep({}, mock1);
            delete gd.data[0].header.font;
            delete gd.data[0].cells.font;
            gd.layout.font = {
                family: 'Gravitas',
                size: 20,
                color: 'blue'
            };

            supplyAllDefaults(gd);

            var expected = {
                family: 'Gravitas',
                size: 20,
                color: 'blue'
            };

            expect(gd._fullData[0].header.font).toEqual(expected);
            expect(gd._fullData[0].cells.font).toEqual(expected);
        });
    });

    describe('table defaults', function() {
        function _supply(traceIn) {
            var traceOut = { visible: true };
            var defaultColor = '#777';
            var layout = { font: {family: '"Open Sans", verdana, arial, sans-serif', size: 12, color: '#444'} };

            Table.supplyDefaults(traceIn, traceOut, defaultColor, layout);

            return traceOut;
        }

        it('\'line\' specification should yield a default color', function() {
            var fullTrace = _supply({});
            expect(fullTrace.header.fill.color).toEqual(attributes.header.fill.color.dflt);
            expect(fullTrace.cells.fill.color).toEqual(attributes.cells.fill.color.dflt);
        });

        it('\'domain\' specification should have a default', function() {
            var fullTrace = _supply({});
            expect(fullTrace.domain).toEqual({x: [0, 1], y: [0, 1]});
        });

        it('\'*.values\' specification should have a default of an empty array', function() {
            var fullTrace = _supply({});
            expect(fullTrace.header.values).toEqual([]);
            expect(fullTrace.cells.values).toEqual([]);
        });

        it('\'columnwidth\' specification should accept a numerical array', function() {
            var fullTrace = _supply({
                columnwidth: [1, 2, 3]
            });
            expect(fullTrace.columnwidth).toEqual([1, 2, 3]);
        });

        it('\'columnwidth\' specification should accept a string array (converted downstream)', function() {
            var fullTrace = _supply({
                columnwidth: ['1', '2', '3']
            });
            expect(fullTrace.columnwidth).toEqual(['1', '2', '3']);
        });

        it('\'header\' should be used with default values where attributes are not provided', function() {
            var fullTrace = _supply({
                header: {
                    values: ['A'],
                    alienProperty: 'Alpha Centauri'
                },
                cells: {
                    values: [1, 2], // otherwise header.values will become []
                    alienProperty: 'Betelgeuse'
                }
            });
            expect(fullTrace.header).toEqual({
                values: ['A'], // only one column remains
                format: [],
                align: 'center',
                height: 28,
                line: { width: 1, color: 'grey' },
                fill: { color: attributes.header.fill.color.dflt },
                font: {family: '"Open Sans", verdana, arial, sans-serif', size: 12, color: '#444'}
            });

            expect(fullTrace.cells).toEqual({
                values: [1, 2],
                format: [],
                align: 'center',
                height: 20,
                line: { width: 1, color: 'grey' },
                fill: { color: attributes.cells.fill.color.dflt },
                font: {family: '"Open Sans", verdana, arial, sans-serif', size: 12, color: '#444'}
            });
        });
    });
});

describe('table', function() {
    afterEach(destroyGraphDiv);

    describe('edge cases', function() {
        it('Works with more than one column', function(done) {
            var mockCopy = Lib.extendDeep({}, mock2);
            var gd = createGraphDiv();
            Plotly.newPlot(gd, mockCopy.data, mockCopy.layout).then(function() {
                expect(gd.data.length).toEqual(1);
                expect(gd.data[0].header.values.length).toEqual(2);
                expect(gd.data[0].cells.values.length).toEqual(2);
                expect(document.querySelectorAll('.' + cn.yColumn).length).toEqual(2);
            })
            .then(done, done.fail);
        });

        it('Works with one column', function(done) {
            var mockCopy = Lib.extendDeep({}, mock1);
            var gd = createGraphDiv();
            Plotly.newPlot(gd, mockCopy.data, mockCopy.layout).then(function() {
                expect(gd.data.length).toEqual(1);
                expect(gd.data[0].header.values.length).toEqual(1);
                expect(gd.data[0].cells.values.length).toEqual(1);
                expect(document.querySelectorAll('.' + cn.yColumn).length).toEqual(1);
            })
            .then(done, done.fail);
        });

        it('Does not error with zero columns', function(done) {
            var mockCopy = Lib.extendDeep({}, mock0);
            var gd = createGraphDiv();

            Plotly.newPlot(gd, mockCopy.data, mockCopy.layout).then(function() {
                expect(gd.data.length).toEqual(1);
                expect(gd.data[0].header.values.length).toEqual(0);
                expect(gd.data[0].cells.values.length).toEqual(0);
                expect(document.querySelectorAll('.' + cn.yColumn).length).toEqual(0);
            })
            .then(done, done.fail);
        });

        it('Does not raise an error with zero lines', function(done) {
            var mockCopy = Lib.extendDeep({}, mock2);

            mockCopy.layout.width = 320;
            mockCopy.data[0].header.values = [[], []];
            mockCopy.data[0].cells.values = [[], []];

            var gd = createGraphDiv();
            Plotly.newPlot(gd, mockCopy.data, mockCopy.layout).then(function() {
                expect(gd.data.length).toEqual(1);
                expect(gd.data[0].header.values.length).toEqual(2);
                expect(gd.data[0].cells.values.length).toEqual(2);
                expect(document.querySelectorAll('.' + cn.yColumn).length).toEqual(2);
            })
            .then(done, done.fail);
        });

        it('should remove scroll glyph and capture zone when *staticPlot:true*', function(done) {
            var mockCopy = Lib.extendDeep({}, require('@mocks/table_plain_birds.json'));
            var gd = createGraphDiv();

            function _assert(msg, exp) {
                expect(d3SelectAll('.' + cn.scrollbarCaptureZone).size()).toBe(exp.captureZone, msg);
                expect(d3SelectAll('.' + cn.scrollbarGlyph).size()).toBe(exp.glyph, msg);
            }

            // more info in: https://github.com/plotly/streambed/issues/11618

            Plotly.newPlot(gd, mockCopy).then(function() {
                _assert('staticPlot:false (base)', {
                    captureZone: 1,
                    glyph: 1
                });
            })
            .then(function() { return Plotly.purge(gd); })
            .then(function() { return Plotly.newPlot(gd, mockCopy.data, mockCopy.layout, {staticPlot: true}); })
            .then(function() {
                _assert('staticPlot:true', {
                    captureZone: 0,
                    glyph: 0
                });
            })
            .then(done, done.fail);
        });
    });

    describe('Rendering with partial attribute support', function() {
        var mockCopy,
            gd;

        afterEach(destroyGraphDiv);

        it('`Plotly.newPlot` should render all the columns even if no cell contents were supplied yet', function(done) {
            gd = createGraphDiv();
            mockCopy = Lib.extendDeep({}, mock);
            delete mockCopy.data[0].cells;
            Plotly.newPlot(gd, mockCopy.data, mockCopy.layout).then(function() {
                expect(gd.data.length).toEqual(1);
                expect(gd.data[0].header.values.length).toEqual(7);
                expect(document.querySelectorAll('.' + cn.yColumn).length).toEqual(7);
                expect(document.querySelectorAll('.' + cn.columnCell).length).toEqual(7 * 2); // both column rows to render
            })
            .then(done, done.fail);
        });

        it('`Plotly.newPlot` should render all columns even if no header contents were supplied yet', function(done) {
            gd = createGraphDiv();
            mockCopy = Lib.extendDeep({}, mock);
            delete mockCopy.data[0].header;
            Plotly.newPlot(gd, mockCopy.data, mockCopy.layout).then(function() {
                expect(gd.data.length).toEqual(1);
                expect(gd.data[0].cells.values.length).toEqual(7);
                expect(document.querySelectorAll('.' + cn.yColumn).length).toEqual(7);
                expect(document.querySelectorAll('.' + cn.columnCell).length).toEqual(7 * 29);
                expect(document.querySelectorAll('#header').length).toEqual(7);
                expect(document.querySelectorAll('#header .' + cn.columnCell).length).toEqual(7);
                expect(document.querySelector('#header .' + cn.columnCell + ' text').textContent).toEqual('');
            })
            .then(done, done.fail);
        });

        it('`Plotly.newPlot` should render all the column headers even if not all header values were supplied', function(done) {
            gd = createGraphDiv();
            mockCopy = Lib.extendDeep({}, mock);
            mockCopy.data[0].header.values = ['A', 'S', 'D']; // doesn't cover all 7 columns
            Plotly.newPlot(gd, mockCopy.data, mockCopy.layout).then(function() {
                expect(gd.data.length).toEqual(1);
                expect(gd.data[0].cells.values.length).toEqual(7);
                expect(document.querySelectorAll('.' + cn.yColumn).length).toEqual(7);
                expect(document.querySelectorAll('#header').length).toEqual(7);
                expect(document.querySelectorAll('#header .' + cn.columnCell).length).toEqual(7);
                expect(document.querySelector('#header .' + cn.columnCell + ' text').textContent).toEqual('A');
            })
            .then(done, done.fail);
        });
    });

    describe('basic use and basic data restyling', function() {
        var mockCopy,
            gd;

        beforeEach(function(done) {
            mockCopy = Lib.extendDeep({}, mock);
            mockCopy.data[0].domain = {
                x: [0.1, 0.9],
                y: [0.05, 0.85]
            };
            gd = createGraphDiv();
            Plotly.newPlot(gd, mockCopy.data, mockCopy.layout).then(done);
        });

        it('`Plotly.newPlot` should have proper fields on `gd.data` on initial rendering', function() {
            expect(gd.data.length).toEqual(1);
            expect(gd.data[0].header.values.length).toEqual(7);
            expect(gd.data[0].cells.values.length).toEqual(7);
            expect(document.querySelectorAll('.' + cn.yColumn).length).toEqual(7);
        });

        it('Calling _doPlot again should add the new table trace', function(done) {
            var reversedMockCopy = Lib.extendDeep({}, mockCopy);
            reversedMockCopy.data[0].header.values = reversedMockCopy.data[0].header.values.slice().reverse();
            reversedMockCopy.data[0].cells.values = reversedMockCopy.data[0].cells.values.slice().reverse();
            reversedMockCopy.data[0].domain.y = [0, 0.3];

            _doPlot(gd, reversedMockCopy.data, reversedMockCopy.layout).then(function() {
                expect(gd.data.length).toEqual(2);
                expect(document.querySelectorAll('.' + cn.yColumn).length).toEqual(7 * 2);
            })
            .then(done, done.fail);
        });

        it('Calling `Plotly.restyle` with a string path should amend the preexisting table', function(done) {
            expect(gd.data.length).toEqual(1);

            Plotly.restyle(gd, 'header.fill.color', 'magenta').then(function() {
                expect(gd.data.length).toEqual(1);

                expect(gd.data[0].header.fill.color).toEqual('magenta');
                expect(gd.data[0].header.values.length).toEqual(7);
                expect(gd.data[0].cells.values.length).toEqual(7);
                expect(gd.data[0].header.line.color).toEqual(['dimgray', 'grey']); // no change relative to original mock value
                expect(gd.data[0].cells.line.color).toEqual(['grey']); // no change relative to original mock value
            })
            .then(done, done.fail);
        });

        it('Calling `Plotly.restyle` for a `header.values` change should amend the preexisting one', function(done) {
            function restyleValues(what, key, setterValue) {
                // array values need to be wrapped in an array; unwrapping here for value comparison
                var value = Array.isArray(setterValue) ? setterValue[0] : setterValue;

                return function() {
                    return Plotly.restyle(gd, what + '.values[' + key + ']', setterValue).then(function() {
                        expect(gd.data[0][what].values[key]).toEqual(value, 'for column \'' + key + '\'');
                        expect(document.querySelectorAll('.' + cn.yColumn).length).toEqual(7);
                    });
                };
            }

            restyleValues('cells', 0, [['new cell content 1', 'new cell content 2']])()
                .then(restyleValues('cells', 2, [[0, 0.1]]))
                .then(restyleValues('header', 1, [['Species top', 'Species bottom']]))
                .then(done, done.fail);
        });

        it('Calling `Plotly.relayout` with string should amend the preexisting table', function(done) {
            expect(gd.layout.width).toEqual(1000);
            Plotly.relayout(gd, 'width', 500)
            .then(function() {
                expect(gd.data.length).toEqual(1);
                expect(gd.layout.width).toEqual(500);
            })
            .then(done, done.fail);
        });

        it('Calling `Plotly.relayout` with object should amend the preexisting table', function(done) {
            expect(gd.layout.width).toEqual(1000);
            Plotly.relayout(gd, {width: 500})
            .then(function() {
                expect(gd.data.length).toEqual(1);
                expect(gd.layout.width).toEqual(500);
            })
            .then(done, done.fail);
        });
    });

    describe('more restyling tests with scenegraph queries', function() {
        var mockCopy, gd;

        beforeEach(function(done) {
            mockCopy = Lib.extendDeep({}, mock2);
            gd = createGraphDiv();
            Plotly.newPlot(gd, mockCopy.data, mockCopy.layout).then(done);
        });

        it('Calling `Plotly.restyle` for a `header.values` change should amend the preexisting one', function(done) {
            function restyleValues(what, fun, setterValue) {
                var value = Array.isArray(setterValue) ? setterValue[0] : setterValue;

                return function() {
                    return Plotly.restyle(gd, what, setterValue).then(function() {
                        expect(fun(gd)).toEqual(value, what + ':::' + value);
                        expect(document.querySelectorAll('.' + cn.yColumn).length).toEqual(2);
                        expect(document.querySelectorAll('.' + cn.columnBlock).length).toEqual(6);
                        expect(document.querySelectorAll('.' + cn.columnCell).length).toEqual(6);
                        expect(document.querySelectorAll('.' + cn.cellRect).length).toEqual(6);
                        expect(document.querySelectorAll('.' + cn.cellTextHolder).length).toEqual(6);
                    });
                };
            }

            restyleValues('cells.fill.color', function(gd) {return gd.data[0].cells.fill.color;}, [['green', 'red']])()
                .then(restyleValues('cells.line.color', function(gd) {return gd.data[0].cells.line.color;}, [['magenta', 'blue']]))
                .then(restyleValues('cells.line.width', function(gd) {return gd.data[0].cells.line.width;}, [[5, 3]]))
                .then(restyleValues('cells.format', function(gd) {return gd.data[0].cells.format;}, [['', '']]))
                .then(restyleValues('cells.prefix', function(gd) {return gd.data[0].cells.prefix;}, [['p1']]))
                .then(restyleValues('cells.suffix', function(gd) {return gd.data[0].cells.suffix;}, [['s1']]))
                .then(restyleValues('header.fill.color', function(gd) {return gd.data[0].header.fill.color;}, [['yellow', 'purple']]))
                .then(restyleValues('header.line.color', function(gd) {return gd.data[0].header.line.color;}, [['green', 'red']]))
                .then(restyleValues('header.line.width', function(gd) {return gd.data[0].header.line.width;}, [[2, 6]]))
                .then(restyleValues('header.format', function(gd) {return gd.data[0].header.format;}, [['', '']]))
                .then(done);
        });
    });

    describe('scroll effects', function() {
        var mockCopy, gd, gdWheelEventCount;

        beforeEach(function(done) {
            mockCopy = Lib.extendDeep({}, mockMulti);
            gd = createGraphDiv();
            gdWheelEventCount = 0;
            Plotly.newPlot(gd, mockCopy.data, mockCopy.layout)
            .then(function() {
                gd.addEventListener('wheel', function(evt) {
                    gdWheelEventCount++;
                    // make sure we don't *really* scroll the page.
                    // that would be annoying!
                    evt.stopPropagation();
                    evt.preventDefault();
                });
            })
            .then(done);
        });

        function assertBubbledEvents(cnt) {
            expect(gdWheelEventCount).toBe(cnt);
            gdWheelEventCount = 0;
        }

        function getCenter(el) {
            var bBox = el.getBoundingClientRect();
            // actually above center, since these bboxes are bigger than the
            // visible table area
            return {x: bBox.left + bBox.width / 2, y: bBox.top + bBox.height / 4};
        }

        function scroll(pos, dy) {
            mouseEvent('mousemove', pos.x, pos.y);
            mouseEvent('wheel', pos.x, pos.y, {deltaX: 0, deltaY: dy});
        }

        it('bubbles scroll events iff they did not scroll a table', function() {
            var allTableControls = document.querySelectorAll('.' + cn.tableControlView);
            var smallCenter = getCenter(allTableControls[0]);
            var bigCenter = getCenter(allTableControls[1]);

            // table with no scroll bars - events always bubble
            scroll(smallCenter, -20);
            assertBubbledEvents(1);
            scroll(smallCenter, 20);
            assertBubbledEvents(1);

            // table with scrollbars - events bubble if we don't use them
            scroll(bigCenter, -20); // up from the top - bubbles
            assertBubbledEvents(1);
            scroll(bigCenter, 20); // down from the top - scrolled, so no bubble
            assertBubbledEvents(0);
            scroll(bigCenter, -40); // back to the top, with extra dy discarded
            assertBubbledEvents(0);
            scroll(bigCenter, -20); // now it bubbles
            assertBubbledEvents(1);
            scroll(bigCenter, 200000); // all the way to the bottom
            assertBubbledEvents(0);
            scroll(bigCenter, 20); // now it bubbles from the bottom..
            assertBubbledEvents(1);
        });

        it('does not scroll any tables with staticPlot', function(done) {
            var allTableControls = document.querySelectorAll('.' + cn.tableControlView);
            var bigCenter = getCenter(allTableControls[1]);

            var mock = Lib.extendDeep({}, mockMulti);

            // make sure initially with staticPlot: false, scrolling works
            // (copied from previous test)
            scroll(bigCenter, 20);
            assertBubbledEvents(0);
            scroll(bigCenter, -40);
            assertBubbledEvents(0);

            Plotly.react(gd, mock.data, mock.layout, {staticPlot: true})
            .then(function() {
                // now the same scrolls bubble
                scroll(bigCenter, 20);
                assertBubbledEvents(1);
                scroll(bigCenter, -40);
                assertBubbledEvents(1);

                return Plotly.react(gd, mock.data, mock.layout, {staticPlot: false});
            })
            .then(function() {
                // scroll works again!
                scroll(bigCenter, 20);
                assertBubbledEvents(0);
                scroll(bigCenter, -40);
                assertBubbledEvents(0);
            })
            .then(done, done.fail);
        });
    });
});
