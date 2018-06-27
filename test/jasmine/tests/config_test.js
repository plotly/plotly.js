var Plotly = require('@lib/index');
var Plots = Plotly.Plots;
var Lib = require('@src/lib');
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var click = require('../assets/click');
var mouseEvent = require('../assets/mouse_event');
var failTest = require('../assets/fail_test');

describe('config argument', function() {

    describe('attribute layout.autosize', function() {
        var layoutWidth = 1111;
        var relayoutWidth = 555;
        var containerWidthBeforePlot = 888;
        var containerWidthBeforeRelayout = 666;
        var containerHeightBeforePlot = 543;
        var containerHeightBeforeRelayout = 321;
        var data = [];

        var gd;

        beforeEach(function() {
            gd = createGraphDiv();
        });

        afterEach(destroyGraphDiv);

        function checkLayoutSize(width, height) {
            expect(gd._fullLayout.width).toBe(width);
            expect(gd._fullLayout.height).toBe(height);

            var svg = document.getElementsByClassName('main-svg')[0];
            expect(+svg.getAttribute('width')).toBe(width);
            expect(+svg.getAttribute('height')).toBe(height);
        }

        function compareLayoutAndFullLayout(gd) {
            expect(gd.layout.width).toBe(gd._fullLayout.width);
            expect(gd.layout.height).toBe(gd._fullLayout.height);
        }

        function testAutosize(autosize, config, layoutHeight, relayoutHeight, done) {
            var layout = {
                autosize: autosize,
                width: layoutWidth
            };
            var relayout = {
                width: relayoutWidth
            };

            var layout2 = Lib.extendDeep({}, layout);

            gd.style.width = containerWidthBeforePlot + 'px';
            gd.style.height = containerHeightBeforePlot + 'px';

            function beforeResize() {
                checkLayoutSize(layoutWidth, layoutHeight);
                if(!autosize) compareLayoutAndFullLayout(gd);

                gd.style.width = containerWidthBeforeRelayout + 'px';
                gd.style.height = containerHeightBeforeRelayout + 'px';
            }

            function afterResize() {
                checkLayoutSize(relayoutWidth, relayoutHeight);
                if(!autosize) compareLayoutAndFullLayout(gd);
            }

            Plotly.plot(gd, data, layout, config).then(function() {
                beforeResize();

                return Plotly.relayout(gd, relayout);
            })
            .then(afterResize)
            // now redo with Plotly.react
            .then(function() {
                gd.style.width = containerWidthBeforePlot + 'px';
                gd.style.height = containerHeightBeforePlot + 'px';

                return Plotly.newPlot(gd, data, layout2, config);
            })
            .then(function() {
                beforeResize();

                layout2.width = relayoutWidth;
                return Plotly.react(gd, data, layout2, config);
            })
            .then(afterResize)
            .catch(failTest)
            .then(done);
        }

        it('should fill the frame when autosize: false, fillFrame: true, frameMargins: undefined', function(done) {
            var autosize = false;
            var config = {
                autosizable: true,
                fillFrame: true
            };
            var layoutHeight = window.innerHeight;
            var relayoutHeight = layoutHeight;

            testAutosize(autosize, config, layoutHeight, relayoutHeight, done);
        });

        it('should fill the frame when autosize: true, fillFrame: true and frameMargins: undefined', function(done) {
            var autosize = true;
            var config = {
                fillFrame: true
            };
            var layoutHeight = window.innerHeight;
            var relayoutHeight = window.innerHeight;

            testAutosize(autosize, config, layoutHeight, relayoutHeight, done);
        });

        it('should fill the container when autosize: false, fillFrame: false and frameMargins: undefined', function(done) {
            var autosize = false;
            var config = {
                autosizable: true,
                fillFrame: false
            };
            var layoutHeight = containerHeightBeforePlot;
            var relayoutHeight = layoutHeight;

            testAutosize(autosize, config, layoutHeight, relayoutHeight, done);
        });

        it('should fill the container when autosize: true, fillFrame: false and frameMargins: undefined', function(done) {
            var autosize = true;
            var config = {
                fillFrame: false
            };
            var layoutHeight = containerHeightBeforePlot;
            var relayoutHeight = containerHeightBeforeRelayout;

            testAutosize(autosize, config, layoutHeight, relayoutHeight, done);
        });

        it('should fill the container when autosize: false, fillFrame: false and frameMargins: 0.1', function(done) {
            var autosize = false;
            var config = {
                autosizable: true,
                fillFrame: false,
                frameMargins: 0.1
            };
            var layoutHeight = 360;
            var relayoutHeight = layoutHeight;

            testAutosize(autosize, config, layoutHeight, relayoutHeight, done);
        });

        it('should fill the container when autosize: true, fillFrame: false and frameMargins: 0.1', function(done) {
            var autosize = true;
            var config = {
                fillFrame: false,
                frameMargins: 0.1
            };
            var layoutHeight = 360;
            var relayoutHeight = 288;

            testAutosize(autosize, config, layoutHeight, relayoutHeight, done);
        });

        it('should respect attribute autosizable: false', function(done) {
            var autosize = false;
            var config = {
                autosizable: false,
                fillFrame: true
            };
            var layoutHeight = Plots.layoutAttributes.height.dflt;
            var relayoutHeight = layoutHeight;

            testAutosize(autosize, config, layoutHeight, relayoutHeight, done);
        });
    });

    describe('showLink attribute', function() {

        var gd;

        beforeEach(function() {
            gd = createGraphDiv();
        });

        afterEach(destroyGraphDiv);

        it('should not display the edit link by default', function() {
            Plotly.plot(gd, [], {});

            var link = document.getElementsByClassName('js-plot-link-container')[0];

            expect(link).toBeUndefined();
        });

        it('should display a link when true', function() {
            Plotly.plot(gd, [], {}, { showLink: true });

            var link = document.getElementsByClassName('js-plot-link-container')[0];

            expect(link.textContent).toBe('Edit chart »');

            var bBox = link.getBoundingClientRect();
            expect(bBox.width).toBeGreaterThan(0);
            expect(bBox.height).toBeGreaterThan(0);
        });
    });


    describe('editable attribute', function() {

        var gd;

        beforeEach(function() {
            gd = createGraphDiv();
        });

        afterEach(destroyGraphDiv);

        function initPlot(editFlag) {
            var edits = {};
            edits[editFlag] = true;

            return Plotly.plot(gd, [
                { x: [1, 2, 3], y: [1, 2, 3] },
                { x: [1, 2, 3], y: [3, 2, 1] }
            ], {
                width: 600,
                height: 400,
                annotations: [
                    { text: 'testing', x: 1, y: 1, showarrow: true }
                ]
            }, { editable: false, edits: edits });
        }

        function checkIfEditable(elClass, text) {
            return function() {
                var label = document.getElementsByClassName(elClass)[0];

                expect(label.textContent).toBe(text);

                var labelBox = label.getBoundingClientRect();
                var labelX = labelBox.left + labelBox.width / 2;
                var labelY = labelBox.top + labelBox.height / 2;

                mouseEvent('click', labelX, labelY);

                var editBox = document.getElementsByClassName('plugin-editable editable')[0];
                expect(editBox).toBeDefined();
                expect(editBox.textContent).toBe(text);
                expect(editBox.getAttribute('contenteditable')).toBe('true');
            };
        }

        function checkIfDraggable(elClass) {
            return function() {
                var el = document.getElementsByClassName(elClass)[0];

                var elBox = el.getBoundingClientRect();
                var elX = elBox.left + elBox.width / 2;
                var elY = elBox.top + elBox.height / 2;

                mouseEvent('mousedown', elX, elY);
                mouseEvent('mousemove', elX - 20, elY + 20);

                var movedBox = el.getBoundingClientRect();

                expect(movedBox.left).toBe(elBox.left - 20);
                expect(movedBox.top).toBe(elBox.top + 20);

                mouseEvent('mouseup', elX - 20, elY + 20);
            };
        }

        it('should let edits override editable', function(done) {
            var data = [{y: [1, 2, 3]}];
            var layout = {width: 600, height: 400};
            Plotly.newPlot(gd, data, layout, {editable: true})
            .then(function() {
                expect(gd._context.edits).toEqual({
                    annotationPosition: true,
                    annotationTail: true,
                    annotationText: true,
                    axisTitleText: true,
                    colorbarPosition: true,
                    colorbarTitleText: true,
                    legendPosition: true,
                    legendText: true,
                    shapePosition: true,
                    titleText: true
                });
            })
            .then(function() {
                return Plotly.newPlot(gd, data, layout, {
                    edits: {annotationPosition: false, annotationTail: false},
                    editable: true
                });
            })
            .then(function() {
                expect(gd._context.edits).toEqual({
                    annotationPosition: false,
                    annotationTail: false,
                    annotationText: true,
                    axisTitleText: true,
                    colorbarPosition: true,
                    colorbarTitleText: true,
                    legendPosition: true,
                    legendText: true,
                    shapePosition: true,
                    titleText: true
                });
            })
            .then(function() {
                return Plotly.newPlot(gd, data, layout, {
                    edits: {annotationText: true, axisTitleText: true},
                    editable: false
                });
            })
            .then(function() {
                expect(gd._context.edits).toEqual({
                    annotationPosition: false,
                    annotationTail: false,
                    annotationText: true,
                    axisTitleText: true,
                    colorbarPosition: false,
                    colorbarTitleText: false,
                    legendPosition: false,
                    legendText: false,
                    shapePosition: false,
                    titleText: false
                });
            })
            .catch(failTest)
            .then(done);
        });

        it('should make titles editable', function(done) {
            initPlot('titleText')
            .then(checkIfEditable('gtitle', 'Click to enter Plot title'))
            .catch(failTest)
            .then(done);
        });

        it('should make x axes labels editable', function(done) {
            initPlot('axisTitleText')
            .then(checkIfEditable('g-xtitle', 'Click to enter X axis title'))
            .catch(failTest)
            .then(done);
        });

        it('should make y axes labels editable', function(done) {
            initPlot('axisTitleText')
            .then(checkIfEditable('g-ytitle', 'Click to enter Y axis title'))
            .catch(failTest)
            .then(done);
        });

        it('should make legend labels editable', function(done) {
            initPlot('legendText')
            .then(checkIfEditable('legendtext', 'trace 0'))
            .catch(failTest)
            .then(done);
        });

        it('should make annotation labels editable', function(done) {
            initPlot('annotationText')
            .then(checkIfEditable('annotation-text-g', 'testing'))
            .catch(failTest)
            .then(done);
        });

        it('should make annotation labels draggable', function(done) {
            initPlot('annotationTail')
            .then(checkIfDraggable('annotation-text-g'))
            .catch(failTest)
            .then(done);
        });

        it('should make annotation arrows draggable', function(done) {
            initPlot('annotationPosition')
            .then(checkIfDraggable('annotation-arrow-g'))
            .catch(failTest)
            .then(done);
        });

        it('should make legends draggable', function(done) {
            initPlot('legendPosition')
            .then(checkIfDraggable('legend'))
            .catch(failTest)
            .then(done);
        });

    });

    describe('axis drag handles attribute', function() {
        var mock = require('@mocks/14.json');

        var gd;
        var mockCopy;

        beforeEach(function(done) {
            gd = createGraphDiv();
            mockCopy = Lib.extendDeep({}, mock);
            done();
        });

        afterEach(destroyGraphDiv);

        function testDraggers(len) {
            [
                'nw', 'ne', 'sw', 'se', 'ew', 'w', 'e', 'ns', 'n', 's'
            ].forEach(function(dir) {
                var draggers = document.getElementsByClassName('drag ' + dir + 'drag');
                expect(draggers.length).toBe(len, dir);
            });
        }

        it('should have drag rectangles cursors by default', function() {
            Plotly.plot(gd, mockCopy.data, {});

            testDraggers(1);
        });

        it('should not have drag rectangles when disabled', function() {
            Plotly.plot(gd, mockCopy.data, {}, { showAxisDragHandles: false });

            testDraggers(0);
        });

    });

    describe('axis range entry attribute', function() {
        var mock = require('@mocks/14.json');

        var gd, mockCopy;

        beforeEach(function(done) {
            gd = createGraphDiv();
            mockCopy = Lib.extendDeep({}, mock);
            done();
        });

        afterEach(destroyGraphDiv);

        it('allows axis range entry by default', function() {
            Plotly.plot(gd, mockCopy.data, {});

            var corner = document.getElementsByClassName('edrag')[0];
            var cornerBox = corner.getBoundingClientRect();
            var cornerX = cornerBox.left + cornerBox.width / 2;
            var cornerY = cornerBox.top + cornerBox.height / 2;

            click(cornerX, cornerY);

            var editBox = document.getElementsByClassName('plugin-editable editable')[0];
            expect(editBox).toBeDefined();
            expect(editBox.getAttribute('contenteditable')).toBe('true');
        });

        it('disallows axis range entry when disabled', function() {
            Plotly.plot(gd, mockCopy.data, {}, { showAxisRangeEntryBoxes: false });

            var corner = document.getElementsByClassName('edrag')[0];
            var cornerBox = corner.getBoundingClientRect();
            var cornerX = cornerBox.left + cornerBox.width / 2;
            var cornerY = cornerBox.top + cornerBox.height / 2;

            click(cornerX, cornerY);

            var editBox = document.getElementsByClassName('plugin-editable editable')[0];
            expect(editBox).toBeUndefined();
        });
    });

    describe('plotlyServerUrl:', function() {
        var gd;

        beforeEach(function() {
            gd = createGraphDiv();
        });

        afterEach(destroyGraphDiv);

        it('should default to plotly cloud', function(done) {
            Plotly.plot(gd, [], {})
            .then(function() {
                expect(gd._context.plotlyServerUrl).toBe('https://plot.ly');
            })
            .catch(failTest)
            .then(done);
        });

        it('can be set to other base urls', function(done) {
            Plotly.plot(gd, [], {}, {plotlyServerUrl: 'dummy'})
            .then(function() {
                expect(gd._context.plotlyServerUrl).toBe('dummy');
            })
            .catch(failTest)
            .then(done);
        });
    });
});
