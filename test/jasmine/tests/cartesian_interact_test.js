var d3 = require('d3');

var Plotly = require('@lib/index');
var Lib = require('@src/lib');
var constants = require('@src/plots/cartesian/constants');

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var mouseEvent = require('../assets/mouse_event');
var failTest = require('../assets/fail_test');
var selectButton = require('../assets/modebar_button');
var drag = require('../assets/drag');
var doubleClick = require('../assets/double_click');
var getNodeCoords = require('../assets/get_node_coords');
var delay = require('../assets/delay');

var customAssertions = require('../assets/custom_assertions');
var assertNodeDisplay = customAssertions.assertNodeDisplay;

var MODEBAR_DELAY = 500;

describe('zoom box element', function() {
    var mock = require('@mocks/14.json');

    var gd;
    beforeEach(function(done) {
        gd = createGraphDiv();

        var mockCopy = Lib.extendDeep({}, mock);
        mockCopy.layout.dragmode = 'zoom';

        Plotly.plot(gd, mockCopy.data, mockCopy.layout)
        .catch(failTest)
        .then(done);
    });

    afterEach(destroyGraphDiv);

    it('should be appended to the zoom layer', function() {
        var x0 = 100;
        var y0 = 200;
        var x1 = 150;
        var y1 = 200;

        mouseEvent('mousemove', x0, y0);
        expect(d3.selectAll('.zoomlayer > .zoombox').size())
            .toEqual(0);
        expect(d3.selectAll('.zoomlayer > .zoombox-corners').size())
            .toEqual(0);

        mouseEvent('mousedown', x0, y0);
        mouseEvent('mousemove', x1, y1);
        expect(d3.selectAll('.zoomlayer > .zoombox').size())
            .toEqual(1);
        expect(d3.selectAll('.zoomlayer > .zoombox-corners').size())
            .toEqual(1);

        mouseEvent('mouseup', x1, y1);
        expect(d3.selectAll('.zoomlayer > .zoombox').size())
            .toEqual(0);
        expect(d3.selectAll('.zoomlayer > .zoombox-corners').size())
            .toEqual(0);
    });
});


describe('main plot pan', function() {
    var gd, modeBar, relayoutCallback;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(destroyGraphDiv);

    it('should respond to pan interactions', function(done) {
        var mock = require('@mocks/10.json');
        var precision = 5;

        var originalX = [-0.5251046025104602, 5.5];
        var originalY = [-1.6340975059013805, 7.166241526218911];

        var newX = [-1.905857740585774, 4.119246861924687];
        var newY = [-0.3769062155984817, 8.42343281652181];

        function _drag(x0, y0, x1, y1) {
            mouseEvent('mousedown', x0, y0);
            mouseEvent('mousemove', x1, y1);
            mouseEvent('mouseup', x1, y1);
        }

        function _checkAxes(xRange, yRange) {
            expect(gd.layout.xaxis.range).toBeCloseToArray(xRange, precision);
            expect(gd.layout.yaxis.range).toBeCloseToArray(yRange, precision);
        }

        function _runDrag(xr0, xr1, yr0, yr1) {
            // Drag scene along the X axis
            _drag(110, 150, 220, 150);
            _checkAxes(xr1, yr0);

            // Drag scene back along the X axis (not from the same starting point but same X delta)
            _drag(280, 150, 170, 150);
            _checkAxes(xr0, yr0);

            // Drag scene along the Y axis
            _drag(110, 150, 110, 190);
            _checkAxes(xr0, yr1);

            // Drag scene back along the Y axis (not from the same starting point but same Y delta)
            _drag(280, 130, 280, 90);
            _checkAxes(xr0, yr0);

            // Drag scene along both the X and Y axis
            _drag(110, 150, 220, 190);
            _checkAxes(xr1, yr1);

            // Drag scene back along the X and Y axis (not from the same starting point but same delta vector)
            _drag(280, 130, 170, 90);
            _checkAxes(xr0, yr0);
        }

        Plotly.plot(gd, mock.data, mock.layout).then(function() {
            modeBar = gd._fullLayout._modeBar;
            relayoutCallback = jasmine.createSpy('relayoutCallback');
            gd.on('plotly_relayout', relayoutCallback);

            var buttonPan = selectButton(modeBar, 'pan2d');

            expect(gd.layout.xaxis.range).toBeCloseToArray(originalX, precision);
            expect(gd.layout.yaxis.range).toBeCloseToArray(originalY, precision);

            // Switch to pan mode
            expect(buttonPan.isActive()).toBe(false); // initially, zoom is active
            buttonPan.click();
            expect(buttonPan.isActive()).toBe(true); // switched on dragmode

            // Switching mode must not change visible range
            expect(gd.layout.xaxis.range).toBeCloseToArray(originalX, precision);
            expect(gd.layout.yaxis.range).toBeCloseToArray(originalY, precision);
        })
        .then(delay(MODEBAR_DELAY))
        .then(function() {
            expect(relayoutCallback).toHaveBeenCalledTimes(1);
            relayoutCallback.calls.reset();
            _runDrag(originalX, newX, originalY, newY);
        })
        .then(delay(MODEBAR_DELAY))
        .then(function() {
            // X and back; Y and back; XY and back
            expect(relayoutCallback).toHaveBeenCalledTimes(6);
            return Plotly.relayout(gd, {'xaxis.fixedrange': true});
        })
        .then(function() {
            relayoutCallback.calls.reset();
            _runDrag(originalX, originalX, originalY, newY);
        })
        .then(delay(MODEBAR_DELAY))
        .then(function() {
            // Y and back; XY and back
            // should perhaps be 4, but the noop drags still generate a relayout call.
            // TODO: should we try and remove this call?
            expect(relayoutCallback).toHaveBeenCalledTimes(6);
            return Plotly.relayout(gd, {'yaxis.fixedrange': true});
        })
        .then(function() {
            relayoutCallback.calls.reset();
            _runDrag(originalX, originalX, originalY, originalY);
        })
        .then(delay(MODEBAR_DELAY))
        .then(function() {
            // both axes are fixed - no changes
            expect(relayoutCallback).toHaveBeenCalledTimes(0);
            return Plotly.relayout(gd, {'xaxis.fixedrange': false, dragmode: 'pan'});
        })
        .then(function() {
            relayoutCallback.calls.reset();
            _runDrag(originalX, newX, originalY, originalY);
        })
        .then(delay(MODEBAR_DELAY))
        .then(function() {
            // X and back; XY and back
            expect(relayoutCallback).toHaveBeenCalledTimes(6);
        })
        .catch(failTest)
        .then(done);
    });

    it('should show/hide `cliponaxis: false` pts according to range', function(done) {
        function _assert(markerDisplay, textDisplay, barTextDisplay) {
            var gd3 = d3.select(gd);

            assertNodeDisplay(
                gd3.select('.scatterlayer').selectAll('.point'),
                markerDisplay,
                'marker pts'
            );
            assertNodeDisplay(
                gd3.select('.scatterlayer').selectAll('.textpoint'),
                textDisplay,
                'text pts'
            );
            assertNodeDisplay(
                gd3.select('.barlayer').selectAll('.bartext'),
                barTextDisplay,
                'bar text'
            );
        }

        function _run(p0, p1, markerDisplay, textDisplay, barTextDisplay) {
            mouseEvent('mousedown', p0[0], p0[1]);
            mouseEvent('mousemove', p1[0], p1[1]);

            _assert(markerDisplay, textDisplay, barTextDisplay);

            mouseEvent('mouseup', p1[0], p1[1]);
        }

        Plotly.newPlot(gd, [{
            mode: 'markers+text',
            x: [1, 2, 3],
            y: [1, 2, 3],
            text: ['a', 'b', 'c'],
            cliponaxis: false
        }, {
            type: 'bar',
            x: [1, 2, 3],
            y: [1, 2, 3],
            text: ['a', 'b', 'c'],
            textposition: 'outside',
            cliponaxis: false
        }], {
            xaxis: {range: [0, 4]},
            yaxis: {range: [0, 4]},
            width: 500,
            height: 500,
            dragmode: 'pan'
        })
        .then(function() {
            _assert(
                [null, null, null],
                [null, null, null],
                [null, null, null]
            );
        })
        .then(function() {
            _run(
                [250, 250], [250, 150],
                [null, null, 'none'],
                [null, null, 'none'],
                [null, null, 'none']
            );
            expect(gd._fullLayout.yaxis.range[1]).toBeLessThan(3);
        })
        .then(function() {
            _run(
                [250, 250], [150, 250],
                ['none', null, 'none'],
                ['none', null, 'none'],
                ['none', null, 'none']
            );
            expect(gd._fullLayout.xaxis.range[0]).toBeGreaterThan(1);
        })
        .then(function() {
            _run(
                [250, 250], [350, 350],
                [null, null, null],
                [null, null, null],
                [null, null, null]
            );
        })
        .catch(failTest)
        .then(done);
    });
});

describe('axis zoom/pan and main plot zoom', function() {
    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(destroyGraphDiv);

    function getDragger(subplot, directions) {
        return document.querySelector('.' + directions + 'drag[data-subplot="' + subplot + '"]');
    }

    function doDrag(subplot, directions, dx, dy) {
        return function() {
            var dragger = getDragger(subplot, directions);
            return drag(dragger, dx, dy);
        };
    }

    function doDblClick(subplot, directions) {
        return function() {
            gd._mouseDownTime = 0; // ensure independence from any previous clicks
            return doubleClick(getDragger(subplot, directions));
        };
    }

    function doScroll(subplot, directions, deltaY, opts) {
        return function() {
            opts = opts || {};
            var edge = opts.edge || '';
            var dx = opts.dx || 0;
            var dy = opts.dy || 0;
            var dragger = getDragger(subplot, directions);
            var coords = getNodeCoords(dragger, edge);
            mouseEvent('scroll', coords.x + dx, coords.y + dy, {deltaY: deltaY, element: dragger});
            return delay(constants.REDRAWDELAY + 10)();
        };
    }

    describe('subplots with shared axes', function() {
        var initialRange = [0, 2];
        var autoRange = [-0.1594, 2.1594];

        function makePlot(constrainScales, layoutEdits) {
            // mock with 4 subplots, 3 of which share some axes:
            //
            //   |            |
            // y2|    xy2   y3|   x3y3
            //   |            |
            //   +---------   +----------
            //                     x3
            //   |            |
            //  y|    xy      |   x2y
            //   |            |
            //   +---------   +----------
            //        x            x2
            //
            // each subplot is 200x200 px
            // if constrainScales is used, x/x2/y/y2 are linked, as are x3/y3
            // layoutEdits are other changes to make to the layout

            var data = [
                {y: [0, 1, 2]},
                {y: [0, 1, 2], xaxis: 'x2'},
                {y: [0, 1, 2], yaxis: 'y2'},
                {y: [0, 1, 2], xaxis: 'x3', yaxis: 'y3'}
            ];

            var layout = {
                width: 700,
                height: 620,
                margin: {l: 100, r: 100, t: 20, b: 100},
                showlegend: false,
                xaxis: {domain: [0, 0.4], range: [0, 2]},
                yaxis: {domain: [0.15, 0.55], range: [0, 2]},
                xaxis2: {domain: [0.6, 1], range: [0, 2]},
                yaxis2: {domain: [0.6, 1], range: [0, 2]},
                xaxis3: {domain: [0.6, 1], range: [0, 2], anchor: 'y3'},
                yaxis3: {domain: [0.6, 1], range: [0, 2], anchor: 'x3'}
            };

            var config = {scrollZoom: true};

            if(constrainScales) {
                layout.yaxis.scaleanchor = 'x';
                layout.yaxis2.scaleanchor = 'x';
                layout.xaxis2.scaleanchor = 'y';
                layout.yaxis3.scaleanchor = 'x3';
            }

            if(layoutEdits) Lib.extendDeep(layout, layoutEdits);

            return Plotly.newPlot(gd, data, layout, config)
            .then(checkRanges({}, 'initial'))
            .then(function() {
                expect(Object.keys(gd._fullLayout._plots).sort())
                    .toEqual(['xy', 'xy2', 'x2y', 'x3y3'].sort());

                // nsew, n, ns, s, w, ew, e, ne, nw, se, sw
                expect(document.querySelectorAll('.drag[data-subplot="xy"]').length).toBe(11);
                // same but no w, ew, e because x is on xy only
                expect(document.querySelectorAll('.drag[data-subplot="xy2"]').length).toBe(8);
                // y is on xy only so no n, ns, s
                expect(document.querySelectorAll('.drag[data-subplot="x2y"]').length).toBe(8);
                // all 11, as this is a fully independent subplot
                expect(document.querySelectorAll('.drag[data-subplot="x3y3"]').length).toBe(11);
            });
        }

        function checkRanges(newRanges, msg) {
            msg = msg || '';
            if(msg) msg = ' - ' + msg;

            return function() {
                var allRanges = {
                    xaxis: initialRange.slice(),
                    yaxis: initialRange.slice(),
                    xaxis2: initialRange.slice(),
                    yaxis2: initialRange.slice(),
                    xaxis3: initialRange.slice(),
                    yaxis3: initialRange.slice()
                };
                Lib.extendDeep(allRanges, newRanges);

                for(var axName in allRanges) {
                    expect(gd.layout[axName].range).toBeCloseToArray(allRanges[axName], 3, axName + msg);
                    expect(gd._fullLayout[axName].range).toBeCloseToArray(gd.layout[axName].range, 6, axName + msg);
                }
            };
        }

        it('updates with correlated subplots & no constraints - zoom, dblclick, axis ends', function(done) {
            makePlot()
            // zoombox into a small point - drag starts from the center unless you specify otherwise
            .then(doDrag('xy', 'nsew', 100, -50))
            .then(checkRanges({xaxis: [1, 2], yaxis: [1, 1.5]}, 'zoombox'))

            // first dblclick reverts to saved ranges
            .then(doDblClick('xy', 'nsew'))
            .then(checkRanges({}, 'dblclick #1'))
            // next dblclick autoscales (just that plot)
            .then(doDblClick('xy', 'nsew'))
            .then(checkRanges({xaxis: autoRange, yaxis: autoRange}, 'dblclick #2'))
            // dblclick on one axis reverts just that axis to saved
            .then(doDblClick('xy', 'ns'))
            .then(checkRanges({xaxis: autoRange}, 'dblclick y'))
            // dblclick the plot at this point (one axis default, the other autoscaled)
            // and the whole thing is reverted to default
            .then(doDblClick('xy', 'nsew'))
            .then(checkRanges({}, 'dblclick #3'))

            // 1D zoombox - use the linked subplots
            .then(doDrag('xy2', 'nsew', -100, 0))
            .then(checkRanges({xaxis: [0, 1]}, 'xy2 zoombox'))
            .then(doDrag('x2y', 'nsew', 0, 50))
            .then(checkRanges({xaxis: [0, 1], yaxis: [0.5, 1]}, 'x2y zoombox'))
            // dblclick on linked subplots just changes the linked axis
            .then(doDblClick('xy2', 'nsew'))
            .then(checkRanges({yaxis: [0.5, 1]}, 'dblclick xy2'))
            .then(doDblClick('x2y', 'nsew'))
            .then(checkRanges({}, 'dblclick x2y'))
            // drag on axis ends - all these 1D draggers the opposite axis delta is irrelevant
            .then(doDrag('xy2', 'n', 53, 100))
            .then(checkRanges({yaxis2: [0, 4]}, 'drag y2n'))
            .then(doDrag('xy', 's', 53, -100))
            .then(checkRanges({yaxis: [-2, 2], yaxis2: [0, 4]}, 'drag ys'))
            // expanding drag is highly nonlinear
            .then(doDrag('x2y', 'e', 50, 53))
            .then(checkRanges({yaxis: [-2, 2], yaxis2: [0, 4], xaxis2: [0, 0.8751]}, 'drag x2e'))
            .then(doDrag('x2y', 'w', -50, 53))
            .then(checkRanges({yaxis: [-2, 2], yaxis2: [0, 4], xaxis2: [0.4922, 0.8751]}, 'drag x2w'))
            // reset all from the modebar
            .then(function() { selectButton(gd._fullLayout._modeBar, 'resetScale2d').click(); })
            .then(checkRanges({}, 'final reset'))
            .catch(failTest)
            .then(done);
        });

        it('updates with correlated subplots & no constraints - middles, corners, and scrollwheel', function(done) {
            makePlot()
            // drag axis middles
            .then(doDrag('x3y3', 'ew', 100, 0))
            .then(checkRanges({xaxis3: [-1, 1]}, 'drag x3ew'))
            .then(doDrag('x3y3', 'ns', 53, 100))
            .then(checkRanges({xaxis3: [-1, 1], yaxis3: [1, 3]}, 'drag y3ns'))
            // drag corners
            .then(doDrag('x3y3', 'ne', -100, 100))
            .then(checkRanges({xaxis3: [-1, 3], yaxis3: [1, 5]}, 'zoom x3y3ne'))
            .then(doDrag('x3y3', 'sw', 100, -100))
            .then(checkRanges({xaxis3: [-5, 3], yaxis3: [-3, 5]}, 'zoom x3y3sw'))
            .then(doDrag('x3y3', 'nw', -50, -50))
            .then(checkRanges({xaxis3: [-0.5006, 3], yaxis3: [-3, 0.5006]}, 'zoom x3y3nw'))
            .then(doDrag('x3y3', 'se', 50, 50))
            .then(checkRanges({xaxis3: [-0.5006, 1.0312], yaxis3: [-1.0312, 0.5006]}, 'zoom x3y3se'))
            .then(doDblClick('x3y3', 'nsew'))
            .then(checkRanges({}, 'reset x3y3'))
            // scroll wheel
            .then(doScroll('xy', 'nsew', 20, {edge: 'se'}))
            .then(checkRanges({xaxis: [-0.2103, 2], yaxis: [0, 2.2103]}, 'xy main scroll'))
            .then(doScroll('xy', 'ew', -20, {dx: -50}))
            .then(checkRanges({xaxis: [-0.1578, 1.8422], yaxis: [0, 2.2103]}, 'x scroll'))
            .then(doScroll('xy', 'ns', -20, {dy: -50}))
            .then(checkRanges({xaxis: [-0.1578, 1.8422], yaxis: [0.1578, 2.1578]}, 'y scroll'))
            .catch(failTest)
            .then(done);
        });

        it('updates linked axes when there are constraints', function(done) {
            makePlot(true)
            // zoombox - this *would* be 1D (dy=-1) but that's not allowed
            .then(doDrag('xy', 'nsew', 100, -1))
            .then(checkRanges({xaxis: [1, 2], yaxis: [1, 2], xaxis2: [0.5, 1.5], yaxis2: [0.5, 1.5]}, 'zoombox xy'))
            // first dblclick reverts to saved ranges
            .then(doDblClick('xy', 'nsew'))
            .then(checkRanges({}, 'dblclick xy'))
            // next dblclick autoscales ALL linked plots
            .then(doDblClick('xy', 'ns'))
            .then(checkRanges({xaxis: autoRange, yaxis: autoRange, xaxis2: autoRange, yaxis2: autoRange}, 'dblclick y'))
            // revert again
            .then(doDblClick('xy', 'nsew'))
            .then(checkRanges({}, 'dblclick xy #2'))
            // corner drag - full distance in one direction and no shift in the other gets averaged
            // into half distance in each
            .then(doDrag('xy', 'ne', -200, 0))
            .then(checkRanges({xaxis: [0, 4], yaxis: [0, 4], xaxis2: [-1, 3], yaxis2: [-1, 3]}, 'zoom xy ne'))
            // drag one end
            .then(doDrag('xy', 's', 53, -100))
            .then(checkRanges({xaxis: [-2, 6], yaxis: [-4, 4], xaxis2: [-3, 5], yaxis2: [-3, 5]}, 'zoom y s'))
            // middle of an axis
            .then(doDrag('xy', 'ew', -100, 53))
            .then(checkRanges({xaxis: [2, 10], yaxis: [-4, 4], xaxis2: [-3, 5], yaxis2: [-3, 5]}, 'drag x ew'))
            // revert again
            .then(doDblClick('xy', 'nsew'))
            .then(checkRanges({}, 'dblclick xy #3'))
            // scroll wheel
            .then(doScroll('xy', 'nsew', 20, {edge: 'se'}))
            .then(checkRanges({xaxis: [-0.2103, 2], yaxis: [0, 2.2103], xaxis2: [-0.1052, 2.1052], yaxis2: [-0.1052, 2.1052]}, 'scroll xy'))
            .then(doScroll('xy', 'ew', -20, {dx: -50}))
            .then(checkRanges({xaxis: [-0.1578, 1.8422], yaxis: [0.1052, 2.1052]}, 'scroll x'))
            .catch(failTest)
            .then(done);
        });
    });

    it('updates linked axes when there are constraints (axes_scaleanchor mock)', function(done) {
        var fig = Lib.extendDeep({}, require('@mocks/axes_scaleanchor.json'));

        function _assert(y3rng, y4rng) {
            expect(gd._fullLayout.yaxis3.range).toBeCloseToArray(y3rng, 2, 'y3 rng');
            expect(gd._fullLayout.yaxis4.range).toBeCloseToArray(y4rng, 2, 'y3 rng');
        }

        Plotly.plot(gd, fig)
        .then(function() {
            _assert([-0.36, 4.36], [-0.36, 4.36]);
        })
        .then(doDrag('x2y3', 'nsew', 0, 100))
        .then(function() {
            _assert([-0.36, 2], [0.82, 3.18]);
        })
        .then(doDrag('x2y4', 'nsew', 0, 50))
        .then(function() {
            _assert([0.41, 1.23], [1.18, 2]);
        })
        .catch(failTest)
        .then(done);
    });

    it('updates axis layout when the constraints require it', function(done) {
        function _assert(xGridCnt) {
            var xGrid = d3.select(gd).selectAll('.gridlayer > .x > path.xgrid');
            expect(xGrid.size()).toEqual(xGridCnt);
        }

        Plotly.plot(gd, [{
            x: [1, 1.5, 0, -1.5, -1, -1.5, 0, 1.5, 1],
            y: [0, 1.5, 1, 1.5, 0, -1.5, -1, -1.5, 0],
            line: {shape: 'spline'}
        }], {
            xaxis: {constrain: 'domain'},
            yaxis: {scaleanchor: 'x'},
            width: 700,
            height: 500
        })
        .then(function() {
            _assert(2);

            return Plotly.relayout(gd, {
                'xaxis.range[0]': 0,
                'xaxis.range[1]': 1,
                'yaxis.range[0]': 0,
                'yaxis.range[1]': 1
            });
        })
        .then(function() {
            _assert(1);
        })
        .catch(failTest)
        .then(done);
    });

    it('should draw correct zoomboxes corners', function(done) {
        var dragCoverNode;
        var p1;

        function _dragStart(p0, dp) {
            var node = getDragger('xy', 'nsew');
            mouseEvent('mousemove', p0[0], p0[1], {element: node});
            mouseEvent('mousedown', p0[0], p0[1], {element: node});

            var promise = drag.waitForDragCover().then(function(dcn) {
                dragCoverNode = dcn;
                p1 = [p0[0] + dp[0], p0[1] + dp[1]];
                mouseEvent('mousemove', p1[0], p1[1], {element: dragCoverNode});
            });
            return promise;
        }

        function _assertAndDragEnd(msg, exp) {
            var zl = d3.select(gd).select('g.zoomlayer');
            var d = zl.select('.zoombox-corners').attr('d');

            if(exp.cornerCnt) {
                var actual = (d.match(/Z/g) || []).length;
                expect(actual).toBe(exp.cornerCnt, 'zoombox corner cnt: ' + msg);
            } else {
                expect(d).toBe('M0,0Z', 'no zoombox corners: ' + msg);
            }

            mouseEvent('mouseup', p1[0], p1[1], {element: dragCoverNode});
            return drag.waitForDragCoverRemoval();
        }

        Plotly.plot(gd, [{ y: [1, 2, 1] }])
        .then(function() { return _dragStart([170, 170], [30, 30]); })
        .then(function() {
            return _assertAndDragEnd('full-x full-y', {cornerCnt: 4});
        })
        .then(function() { return _dragStart([170, 170], [5, 30]); })
        .then(function() {
            return _assertAndDragEnd('full-y', {cornerCnt: 2});
        })
        .then(function() { return _dragStart([170, 170], [30, 2]); })
        .then(function() {
            return _assertAndDragEnd('full-x', {cornerCnt: 2});
        })
        .then(function() { return Plotly.relayout(gd, 'xaxis.fixedrange', true); })
        .then(function() { return _dragStart([170, 170], [30, 30]); })
        .then(function() {
            return _assertAndDragEnd('full-x full-y w/ fixed xaxis', {cornerCnt: 2});
        })
        .then(function() { return _dragStart([170, 170], [30, 5]); })
        .then(function() {
            return _assertAndDragEnd('full-x w/ fixed xaxis', {cornerCnt: 0});
        })
        .then(function() { return Plotly.relayout(gd, {'xaxis.fixedrange': false, 'yaxis.fixedrange': true}); })
        .then(function() { return _dragStart([170, 170], [30, 30]); })
        .then(function() {
            return _assertAndDragEnd('full-x full-y w/ fixed yaxis', {cornerCnt: 2});
        })
        .then(function() { return _dragStart([170, 170], [5, 30]); })
        .then(function() {
            return _assertAndDragEnd('full-y w/ fixed yaxis', {cornerCnt: 0});
        })
        .catch(failTest)
        .then(done);
    });

    it('handles xy, x-only and y-only zoombox updates', function(done) {
        function _assert(msg, xrng, yrng) {
            expect(gd.layout.xaxis.range).toBeCloseToArray(xrng, 2, 'xrng - ' + msg);
            expect(gd.layout.yaxis.range).toBeCloseToArray(yrng, 2, 'yrng - ' + msg);
        }

        Plotly.plot(gd, [{ y: [1, 2, 1] }])
        .then(doDrag('xy', 'nsew', 50, 50))
        .then(function() { _assert('after xy drag', [1, 1.208], [1.287, 1.5]); })
        .then(doDblClick('xy', 'nsew'))
        .then(doDrag('xy', 'nsew', 50, 0))
        .then(function() { _assert('after x-only drag', [1, 1.208], [0.926, 2.073]); })
        .then(doDblClick('xy', 'nsew'))
        .then(doDrag('xy', 'nsew', 0, 50))
        .then(function() { _assert('after y-only drag', [-0.128, 2.128], [1.287, 1.5]); })
        .catch(failTest)
        .then(done);
    });

    it('should compute correct multicategory tick label span during drag', function(done) {
        var fig = Lib.extendDeep({}, require('@mocks/multicategory.json'));

        var dragCoverNode;
        var p1;

        function _dragStart(draggerClassName, p0, dp) {
            var node = getDragger('xy', draggerClassName);
            mouseEvent('mousemove', p0[0], p0[1], {element: node});
            mouseEvent('mousedown', p0[0], p0[1], {element: node});

            var promise = drag.waitForDragCover().then(function(dcn) {
                dragCoverNode = dcn;
                p1 = [p0[0] + dp[0], p0[1] + dp[1]];
                mouseEvent('mousemove', p1[0], p1[1], {element: dragCoverNode});
            });
            return promise;
        }

        function _assertAndDragEnd(msg, exp) {
            _assertLabels(msg, exp);
            mouseEvent('mouseup', p1[0], p1[1], {element: dragCoverNode});
            return drag.waitForDragCoverRemoval();
        }

        function _assertLabels(msg, exp) {
            var tickLabels = d3.select(gd).selectAll('.xtick > text');
            expect(tickLabels.size()).toBe(exp.angle.length, msg + ' - # of tick labels');

            tickLabels.each(function(_, i) {
                var t = d3.select(this).attr('transform');
                var rotate = (t.split('rotate(')[1] || '').split(')')[0];
                var angle = rotate.split(',')[0];
                expect(Number(angle)).toBe(exp.angle[i], msg + ' - node ' + i);

            });

            var tickLabels2 = d3.select(gd).selectAll('.xtick2 > text');
            expect(tickLabels2.size()).toBe(exp.y.length, msg + ' - # of secondary labels');

            tickLabels2.each(function(_, i) {
                var y = d3.select(this).attr('y');
                expect(Number(y)).toBeWithin(exp.y[i], 5, msg + ' - node ' + i);
            });
        }

        Plotly.plot(gd, fig)
        .then(function() {
            _assertLabels('base', {
                angle: [0, 0, 0, 0, 0, 0, 0],
                y: [406, 406]
            });
        })
        .then(function() { return _dragStart('edrag', [585, 390], [-340, 0]); })
        .then(function() {
            return _assertAndDragEnd('drag to wide-range -> rotates labels', {
                angle: [90, 90, 90, 90, 90, 90, 90],
                y: [430, 430]
            });
        })
        .then(function() { return _dragStart('edrag', [585, 390], [100, 0]); })
        .then(function() {
            return _assertAndDragEnd('drag to narrow-range -> un-rotates labels', {
                angle: [0, 0, 0, 0, 0, 0, 0],
                y: [406, 406]
            });
        })
        .catch(failTest)
        .then(done);
    });
});

describe('Event data:', function() {
    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(destroyGraphDiv);

    function _hover(px, py) {
        return new Promise(function(resolve, reject) {
            gd.once('plotly_hover', function(d) {
                Lib.clearThrottle();
                resolve(d);
            });

            mouseEvent('mousemove', px, py);

            setTimeout(function() {
                reject('plotly_hover did not get called!');
            }, 100);
        });
    }

    it('should have correct content for *scatter* traces', function(done) {
        Plotly.plot(gd, [{
            y: [1, 2, 1],
            marker: {
                color: [20, 30, 10],
                colorbar: {
                    tickvals: [25],
                    ticktext: ['one single tick']
                }
            }
        }], {
            width: 500,
            height: 500
        })
        .then(function() { return _hover(200, 200); })
        .then(function(d) {
            var pt = d.points[0];

            expect(pt.y).toBe(2, 'y');
            expect(pt['marker.color']).toBe(30, 'marker.color');
            expect('marker.colorbar.tickvals' in pt).toBe(false, 'marker.colorbar.tickvals');
            expect('marker.colorbar.ticktext' in pt).toBe(false, 'marker.colorbar.ticktext');
        })
        .catch(fail)
        .then(done);
    });

    it('should have correct content for *heatmap* traces', function(done) {
        Plotly.plot(gd, [{
            type: 'heatmap',
            z: [[1, 2, 1], [2, 3, 1]],
            colorbar: {
                tickvals: [2],
                ticktext: ['one single tick']
            },
            text: [['incomplete array']],
            ids: [['incomplete array']]
        }], {
            width: 500,
            height: 500
        })
        .then(function() { return _hover(200, 200); })
        .then(function(d) {
            var pt = d.points[0];

            expect(pt.z).toBe(3, 'z');
            expect(pt.text).toBe(undefined, 'undefined text items are included');
            expect('id' in pt).toBe(false, 'undefined ids items are not included');
            expect('marker.colorbar.tickvals' in pt).toBe(false, 'marker.colorbar.tickvals');
            expect('marker.colorbar.ticktext' in pt).toBe(false, 'marker.colorbar.ticktext');
        })
        .catch(fail)
        .then(done);
    });
});
