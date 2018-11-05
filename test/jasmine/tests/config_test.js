var Plotly = require('@lib/index');
var Plots = Plotly.Plots;
var Lib = require('@src/lib');
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var click = require('../assets/click');
var mouseEvent = require('../assets/mouse_event');
var failTest = require('../assets/fail_test');
var delay = require('../assets/delay');
var RESIZE_DELAY = 300;

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
                width: relayoutWidth,
                // didn't need this before #3120 - but since we're now
                // implicitly clearing autosize when edit width, if you really
                // want height to re-autosize you need to explicitly re-add
                // autosize
                autosize: autosize
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
            var layoutHeight = Math.round(0.8 * containerHeightBeforePlot);
            var relayoutHeight = layoutHeight;

            testAutosize(autosize, config, layoutHeight, relayoutHeight, done);
        });

        it('should fill the container when autosize: true, fillFrame: false and frameMargins: 0.1', function(done) {
            var autosize = true;
            var config = {
                fillFrame: false,
                frameMargins: 0.1
            };
            var layoutHeight = Math.round(0.8 * containerHeightBeforePlot);
            var relayoutHeight = Math.round(0.8 * containerHeightBeforeRelayout);

            testAutosize(autosize, config, layoutHeight, relayoutHeight, done);
        });

        it('should fill the container when autosize: true up its max-width and max-height', function(done) {
            gd.style.maxWidth = '400px';
            gd.style.maxHeight = '300px';
            Plotly.plot(gd, data, {autosize: true})
            .then(function() {
                checkLayoutSize(400, 300);
            })
            .catch(failTest)
            .then(done);
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

    describe('plotlyServerURL:', function() {
        var gd;
        var form;

        beforeEach(function() {
            gd = createGraphDiv();
            spyOn(HTMLFormElement.prototype, 'submit').and.callFake(function() {
                form = this;
            });
        });

        afterEach(destroyGraphDiv);

        it('should default to plotly cloud', function(done) {
            Plotly.plot(gd, [], {})
            .then(function() {
                expect(gd._context.plotlyServerURL).toBe('https://plot.ly');

                Plotly.Plots.sendDataToCloud(gd);
                expect(form.action).toBe('https://plot.ly/external');
                expect(form.method).toBe('post');
            })
            .catch(failTest)
            .then(done);
        });

        it('can be set to other base urls', function(done) {
            Plotly.plot(gd, [], {}, {plotlyServerURL: 'dummy'})
            .then(function() {
                expect(gd._context.plotlyServerURL).toBe('dummy');

                Plotly.Plots.sendDataToCloud(gd);
                expect(form.action).toContain('/dummy/external');
                expect(form.method).toBe('post');
            })
            .catch(failTest)
            .then(done);
        });

        it('has lesser priotiy then window env', function(done) {
            window.PLOTLYENV = {BASE_URL: 'yo'};

            Plotly.plot(gd, [], {}, {plotlyServerURL: 'dummy'})
            .then(function() {
                expect(gd._context.plotlyServerURL).toBe('dummy');

                Plotly.Plots.sendDataToCloud(gd);
                expect(form.action).toContain('/yo/external');
                expect(form.method).toBe('post');
            })
            .catch(failTest)
            .then(function() {
                delete window.PLOTLY_ENV;
                done();
            });
        });
    });

    describe('responsive figure', function() {
        var gd, data = [{x: [1, 2, 3, 4], y: [5, 10, 2, 8]}];
        var width = 960, height = 800;

        var parent, elWidth, elHeight;

        beforeEach(function() {
            viewport.set(width, height);

            // Prepare a parent container that fills the viewport
            parent = document.createElement('div');
            parent.style.width = '100vw';
            parent.style.height = '100vh';
            parent.style.position = 'fixed';
            parent.style.top = '0';
            parent.style.left = '0';
        });

        afterEach(function() {
            Plotly.purge(gd); // Needed to remove all event listeners
            document.body.removeChild(parent);
            viewport.reset();
        });

        function checkLayoutSize(width, height) {
            expect(gd._fullLayout.width).toBe(width);
            expect(gd._fullLayout.height).toBe(height);

            var svg = document.getElementsByClassName('main-svg')[0];
            expect(+svg.getAttribute('width')).toBe(width);
            expect(+svg.getAttribute('height')).toBe(height);
        }

        function testResponsive() {
            checkLayoutSize(elWidth, elHeight);
            viewport.set(width / 2, height / 2);

            return Promise.resolve()
            .then(delay(RESIZE_DELAY))
            .then(function() {
                checkLayoutSize(elWidth / 2, elHeight / 2);
            })
            .catch(failTest);
        }

        function fillParent(numRows, numCols, cb) {
            elWidth = width / numCols, elHeight = height / numRows;

            // Fill parent
            for(var i = 0; i < (numCols * numRows); i++) {
                var col = document.createElement('div');
                col.style.height = '100%';
                col.style.width = '100%';
                if(typeof(cb) === typeof(Function)) cb.call(col, i);
                parent.appendChild(col);
            }
            document.body.appendChild(parent);
            gd = parent.childNodes[0];
        }

        it('@flaky should resize when the viewport width/height changes', function(done) {
            fillParent(1, 1);
            Plotly.plot(gd, data, {}, {responsive: true})
            .then(testResponsive)
            .then(done);
        });

        it('@flaky should still be responsive if the plot is edited', function(done) {
            fillParent(1, 1);
            Plotly.plot(gd, data, {}, {responsive: true})
            .then(function() {return Plotly.restyle(gd, 'y[0]', data[0].y[0] + 2);})
            .then(testResponsive)
            .then(done);
        });

        it('@flaky should still be responsive if the plot is purged and replotted', function(done) {
            fillParent(1, 1);
            Plotly.plot(gd, data, {}, {responsive: true})
            .then(function() {return Plotly.newPlot(gd, data, {}, {responsive: true});})
            .then(testResponsive)
            .then(done);
        });

        it('@flaky should only have one resize handler when plotted more than once', function(done) {
            fillParent(1, 1);
            var cntWindowResize = 0;
            window.addEventListener('resize', function() {cntWindowResize++;});
            spyOn(Plotly.Plots, 'resize').and.callThrough();

            Plotly.plot(gd, data, {}, {responsive: true})
            .then(function() {return Plotly.restyle(gd, 'y[0]', data[0].y[0] + 2);})
            .then(function() {viewport.set(width / 2, width / 2);})
            .then(delay(RESIZE_DELAY))
            // .then(function() {viewport.set(newWidth, 2 * newHeight);}).then(delay(200))
            .then(function() {
                expect(cntWindowResize).toBe(1);
                expect(Plotly.Plots.resize.calls.count()).toBe(1);
            })
            .catch(failTest)
            .then(done);
        });

        it('@flaky should become responsive if configured as such via Plotly.react', function(done) {
            fillParent(1, 1);
            Plotly.plot(gd, data, {}, {responsive: false})
            .then(function() {return Plotly.react(gd, data, {}, {responsive: true});})
            .then(testResponsive)
            .then(done);
        });

        it('@flaky should stop being responsive if configured as such via Plotly.react', function(done) {
            fillParent(1, 1);
            Plotly.plot(gd, data, {}, {responsive: true})
            // Check initial size
            .then(function() {checkLayoutSize(width, height);})
            // Turn off responsiveness
            .then(function() {return Plotly.react(gd, data, {}, {responsive: false});})
            // Resize viewport
            .then(function() {viewport.set(width / 2, height / 2);})
            // Wait for resize to happen (Plotly.resize has an internal timeout)
            .then(delay(RESIZE_DELAY))
            // Check that final figure's size hasn't changed
            .then(function() {checkLayoutSize(width, height);})
            .catch(failTest)
            .then(done);
        });

        // Testing fancier CSS layouts
        it('@flaky should resize horizontally in a flexbox when responsive: true', function(done) {
            parent.style.display = 'flex';
            parent.style.flexDirection = 'row';
            fillParent(1, 2, function() {
                this.style.flexGrow = '1';
            });

            Plotly.plot(gd, data, {}, { responsive: true })
            .then(testResponsive)
            .then(done);
        });

        it('@flaky should resize vertically in a flexbox when responsive: true', function(done) {
            parent.style.display = 'flex';
            parent.style.flexDirection = 'column';
            fillParent(2, 1, function() {
                this.style.flexGrow = '1';
            });

            Plotly.plot(gd, data, {}, { responsive: true })
            .then(testResponsive)
            .then(done);
        });

        it('@flaky should resize in both direction in a grid when responsive: true', function(done) {
            var numCols = 2, numRows = 2;
            parent.style.display = 'grid';
            parent.style.gridTemplateColumns = 'repeat(' + numCols + ', 1fr)';
            parent.style.gridTemplateRows = 'repeat(' + numRows + ', 1fr)';
            fillParent(numRows, numCols);

            Plotly.plot(gd, data, {}, { responsive: true })
            .then(testResponsive)
            .then(done);
        });

        it('@flaky should provide a fixed non-zero width/height when autosize/responsive: true and container\' size is zero', function(done) {
            fillParent(1, 1, function() {
                this.style.display = 'inline-block';
                this.style.width = null;
                this.style.height = null;
            });
            Plotly.plot(gd, data, {autosize: true}, {responsive: true})
            .then(function() {
                checkLayoutSize(700, 450);
                expect(gd.clientWidth).toBe(700);
                expect(gd.clientHeight).toBe(450);
            })
            .then(function() {
                return Plotly.newPlot(gd, data, {autosize: true}, {responsive: true});
            })
            // It is important to test newPlot to make sure an initially zero size container
            // is still considered to have zero size after a plot is drawn into it.
            .then(function() {
                checkLayoutSize(700, 450);
                expect(gd.clientWidth).toBe(700);
                expect(gd.clientHeight).toBe(450);
            })
            .catch(failTest)
            .then(done);
        });

        // The following test is to guarantee we're not breaking the existing (although maybe not ideal) behaviour.
        // In a future version, one may prefer responsive/autosize:true winning over an explicit width/height when embedded in a webpage.
        it('@flaky should use the explicitly provided width/height even if autosize/responsive:true', function(done) {
            fillParent(1, 1, function() {
                this.style.width = '1000px';
                this.style.height = '500px';
            });

            Plotly.plot(gd, data, {autosize: true, width: 1200, height: 700}, {responsive: true})
            .then(function() {
                expect(gd.clientWidth).toBe(1000);
                expect(gd.clientHeight).toBe(500);
                // The plot should overflow the container!
                checkLayoutSize(1200, 700);
            })
            .catch(failTest)
            .then(done);
        });
    });
});
