var Plotly = require('@lib/index');
var Plots = Plotly.Plots;
var Lib = require('@src/lib');
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var click = require('../assets/click');
var mouseEvent = require('../assets/mouse_event');

describe('config argument', function() {

    describe('attribute layout.autosize', function() {
        var layoutWidth = 1111,
            relayoutWidth = 555,
            containerWidthBeforePlot = 888,
            containerWidthBeforeRelayout = 666,
            containerHeightBeforePlot = 543,
            containerHeightBeforeRelayout = 321,
            data = [],
            gd;

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

                },
                relayout = {
                    width: relayoutWidth
                };

            var container = document.getElementById('graph');
            container.style.width = containerWidthBeforePlot + 'px';
            container.style.height = containerHeightBeforePlot + 'px';

            Plotly.plot(gd, data, layout, config).then(function() {
                checkLayoutSize(layoutWidth, layoutHeight);
                if(!autosize) compareLayoutAndFullLayout(gd);

                container.style.width = containerWidthBeforeRelayout + 'px';
                container.style.height = containerHeightBeforeRelayout + 'px';

                Plotly.relayout(gd, relayout).then(function() {
                    checkLayoutSize(relayoutWidth, relayoutHeight);
                    if(!autosize) compareLayoutAndFullLayout(gd);
                    done();
                });
            });
        }

        it('should fill the frame when autosize: false, fillFrame: true, frameMargins: undefined', function(done) {
            var autosize = false,
                config = {
                    autosizable: true,
                    fillFrame: true
                },
                layoutHeight = window.innerHeight,
                relayoutHeight = layoutHeight;
            testAutosize(autosize, config, layoutHeight, relayoutHeight, done);
        });

        it('should fill the frame when autosize: true, fillFrame: true and frameMargins: undefined', function(done) {
            var autosize = true,
                config = {
                    fillFrame: true
                },
                layoutHeight = window.innerHeight,
                relayoutHeight = window.innerHeight;
            testAutosize(autosize, config, layoutHeight, relayoutHeight, done);
        });

        it('should fill the container when autosize: false, fillFrame: false and frameMargins: undefined', function(done) {
            var autosize = false,
                config = {
                    autosizable: true,
                    fillFrame: false
                },
                layoutHeight = containerHeightBeforePlot,
                relayoutHeight = layoutHeight;
            testAutosize(autosize, config, layoutHeight, relayoutHeight, done);
        });

        it('should fill the container when autosize: true, fillFrame: false and frameMargins: undefined', function(done) {
            var autosize = true,
                config = {
                    fillFrame: false
                },
                layoutHeight = containerHeightBeforePlot,
                relayoutHeight = containerHeightBeforeRelayout;
            testAutosize(autosize, config, layoutHeight, relayoutHeight, done);
        });

        it('should fill the container when autosize: false, fillFrame: false and frameMargins: 0.1', function(done) {
            var autosize = false,
                config = {
                    autosizable: true,
                    fillFrame: false,
                    frameMargins: 0.1
                },
                layoutHeight = 360,
                relayoutHeight = layoutHeight;
            testAutosize(autosize, config, layoutHeight, relayoutHeight, done);
        });

        it('should fill the container when autosize: true, fillFrame: false and frameMargins: 0.1', function(done) {
            var autosize = true,
                config = {
                    fillFrame: false,
                    frameMargins: 0.1
                },
                layoutHeight = 360,
                relayoutHeight = 288;
            testAutosize(autosize, config, layoutHeight, relayoutHeight, done);
        });

        it('should respect attribute autosizable: false', function(done) {
            var autosize = false,
                config = {
                    autosizable: false,
                    fillFrame: true
                },
                layoutHeight = Plots.layoutAttributes.height.dflt,
                relayoutHeight = layoutHeight;
            testAutosize(autosize, config, layoutHeight, relayoutHeight, done);
        });
    });

    describe('showLink attribute', function() {

        var gd;

        beforeEach(function(done) {
            gd = createGraphDiv();
            done();
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

        afterEach(destroyGraphDiv);

        function checkIfEditable(elClass, text) {
            return function() {
                var label = document.getElementsByClassName(elClass)[0];

                expect(label.textContent).toBe(text);

                var labelBox = label.getBoundingClientRect(),
                    labelX = labelBox.left + labelBox.width / 2,
                    labelY = labelBox.top + labelBox.height / 2;

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

                var elBox = el.getBoundingClientRect(),
                    elX = elBox.left + elBox.width / 2,
                    elY = elBox.top + elBox.height / 2;

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
            .then(done);
        });

        it('should make titles editable', function(done) {
            initPlot('titleText')
            .then(checkIfEditable('gtitle', 'Click to enter Plot title'))
            .then(done);
        });

        it('should make x axes labels editable', function(done) {
            initPlot('axisTitleText')
            .then(checkIfEditable('g-xtitle', 'Click to enter X axis title'))
            .then(done);
        });

        it('should make y axes labels editable', function(done) {
            initPlot('axisTitleText')
            .then(checkIfEditable('g-ytitle', 'Click to enter Y axis title'))
            .then(done);
        });

        it('should make legend labels editable', function(done) {
            initPlot('legendText')
            .then(checkIfEditable('legendtext', 'trace 0'))
            .then(done);
        });

        it('should make annotation labels editable', function(done) {
            initPlot('annotationText')
            .then(checkIfEditable('annotation-text-g', 'testing'))
            .then(done);
        });

        it('should make annotation labels draggable', function(done) {
            initPlot('annotationTail')
            .then(checkIfDraggable('annotation-text-g'))
            .then(done);
        });

        it('should make annotation arrows draggable', function(done) {
            initPlot('annotationPosition')
            .then(checkIfDraggable('annotation-arrow-g'))
            .then(done);
        });

        it('should make legends draggable', function(done) {
            initPlot('legendPosition')
            .then(checkIfDraggable('legend'))
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

        it('should have drag rectangles cursors by default', function() {
            Plotly.plot(gd, mockCopy.data, {});

            var nwdrag = document.getElementsByClassName('drag nwdrag');
            expect(nwdrag.length).toBe(1);
            var nedrag = document.getElementsByClassName('drag nedrag');
            expect(nedrag.length).toBe(1);
            var swdrag = document.getElementsByClassName('drag swdrag');
            expect(swdrag.length).toBe(1);
            var sedrag = document.getElementsByClassName('drag sedrag');
            expect(sedrag.length).toBe(1);
            var ewdrag = document.getElementsByClassName('drag ewdrag');
            expect(ewdrag.length).toBe(1);
            var wdrag = document.getElementsByClassName('drag wdrag');
            expect(wdrag.length).toBe(1);
            var edrag = document.getElementsByClassName('drag edrag');
            expect(edrag.length).toBe(1);
            var nsdrag = document.getElementsByClassName('drag nsdrag');
            expect(nsdrag.length).toBe(1);
            var sdrag = document.getElementsByClassName('drag sdrag');
            expect(sdrag.length).toBe(1);
            var ndrag = document.getElementsByClassName('drag ndrag');
            expect(ndrag.length).toBe(1);

        });

        it('should not have drag rectangles when disabled', function() {
            Plotly.plot(gd, mockCopy.data, {}, { showAxisDragHandles: false });

            var nwdrag = document.getElementsByClassName('drag nwdrag');
            expect(nwdrag.length).toBe(0);
            var nedrag = document.getElementsByClassName('drag nedrag');
            expect(nedrag.length).toBe(0);
            var swdrag = document.getElementsByClassName('drag swdrag');
            expect(swdrag.length).toBe(0);
            var sedrag = document.getElementsByClassName('drag sedrag');
            expect(sedrag.length).toBe(0);
            var ewdrag = document.getElementsByClassName('drag ewdrag');
            expect(ewdrag.length).toBe(0);
            var wdrag = document.getElementsByClassName('drag wdrag');
            expect(wdrag.length).toBe(0);
            var edrag = document.getElementsByClassName('drag edrag');
            expect(edrag.length).toBe(0);
            var nsdrag = document.getElementsByClassName('drag nsdrag');
            expect(nsdrag.length).toBe(0);
            var sdrag = document.getElementsByClassName('drag sdrag');
            expect(sdrag.length).toBe(0);
            var ndrag = document.getElementsByClassName('drag ndrag');
            expect(ndrag.length).toBe(0);
        });

    });

    describe('axis range entry attribute', function() {
        var mock = require('@mocks/14.json');

        var gd;
        var mockCopy;

        beforeEach(function(done) {
            gd = createGraphDiv();
            mockCopy = Lib.extendDeep({}, mock);
            done();
        });

        afterEach(destroyGraphDiv);

        it('show allow axis range entry by default', function() {
            Plotly.plot(gd, mockCopy.data, {});

            var corner = document.getElementsByClassName('edrag')[0];

            var cornerBox = corner.getBoundingClientRect(),
                cornerX = cornerBox.left + cornerBox.width / 2,
                cornerY = cornerBox.top + cornerBox.height / 2;

            click(cornerX, cornerY);

            var editBox = document.getElementsByClassName('plugin-editable editable')[0];
            expect(editBox).toBeDefined();
            expect(editBox.getAttribute('contenteditable')).toBe('true');
        });

        it('show not allow axis range entry when', function() {
            Plotly.plot(gd, mockCopy.data, {}, { showAxisRangeEntryBoxes: false });

            var corner = document.getElementsByClassName('edrag')[0];

            var cornerBox = corner.getBoundingClientRect(),
                cornerX = cornerBox.left + cornerBox.width / 2,
                cornerY = cornerBox.top + cornerBox.height / 2;

            click(cornerX, cornerY);

            var editBox = document.getElementsByClassName('plugin-editable editable')[0];
            expect(editBox).toBeUndefined();
        });


    });
});
