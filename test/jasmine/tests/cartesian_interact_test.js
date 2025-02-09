var d3Select = require('../../strict-d3').select;
var d3SelectAll = require('../../strict-d3').selectAll;

var Plotly = require('../../../lib/index');
var Lib = require('../../../src/lib');
var Axes = require('../../../src/plots/cartesian/axes');
var Drawing = require('../../../src/components/drawing');
var constants = require('../../../src/plots/cartesian/constants');

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var mouseEvent = require('../assets/mouse_event');

var selectButton = require('../assets/modebar_button');
var drag = require('../assets/drag');
var doubleClick = require('../assets/double_click');
var getNodeCoords = require('../assets/get_node_coords');
var delay = require('../assets/delay');

var customAssertions = require('../assets/custom_assertions');
var assertNodeDisplay = customAssertions.assertNodeDisplay;

var MODEBAR_DELAY = 500;

describe('zoom box element', function() {
    var mock = require('../../image/mocks/14.json');

    var gd;
    beforeEach(function(done) {
        gd = createGraphDiv();

        var mockCopy = Lib.extendDeep({}, mock);
        mockCopy.layout.dragmode = 'zoom';

        Plotly.newPlot(gd, mockCopy.data, mockCopy.layout)
        .then(done);
    });

    afterEach(destroyGraphDiv);

    it('should be appended to the zoom layer', function() {
        var x0 = 100;
        var y0 = 200;
        var x1 = 150;
        var y1 = 200;

        mouseEvent('mousemove', x0, y0);
        expect(d3SelectAll('.zoomlayer > .zoombox').size())
            .toEqual(0);
        expect(d3SelectAll('.zoomlayer > .zoombox-corners').size())
            .toEqual(0);

        mouseEvent('mousedown', x0, y0);
        mouseEvent('mousemove', x1, y1);
        expect(d3SelectAll('.zoomlayer > .zoombox').size())
            .toEqual(1);
        expect(d3SelectAll('.zoomlayer > .zoombox-corners').size())
            .toEqual(1);

        mouseEvent('mouseup', x1, y1);
        expect(d3SelectAll('.zoomlayer > .zoombox').size())
            .toEqual(0);
        expect(d3SelectAll('.zoomlayer > .zoombox-corners').size())
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
        var mock = require('../../image/mocks/10.json');
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

        Plotly.newPlot(gd, mock.data, mock.layout).then(function() {
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
        .then(done, done.fail);
    });

    it('should emit plotly_relayouting events during pan interactions', function(done) {
        var mock = Lib.extendDeep({}, require('../../image/mocks/10.json'));
        mock.layout.dragmode = 'pan';

        var nsteps = 10;
        var events = [];
        var relayoutCallback;

        Plotly.newPlot(gd, mock.data, mock.layout)
        .then(function() {
            relayoutCallback = jasmine.createSpy('relayoutCallback');
            gd.on('plotly_relayout', relayoutCallback);
            gd.on('plotly_relayouting', function(e) {
                events.push(e);
            });
            return drag({pos0: [100, 150], posN: [220, 250], nsteps: nsteps});
        })
        .then(function() {
            expect(events.length).toEqual(nsteps);
            var first = events.splice(0, 1)[0];
            var last = events.splice(-1, 1)[0];
            expect(first['xaxis.range[1]'] - first['xaxis.range[0]']).toBeCloseTo(6, 0);
            expect(last['xaxis.range[1]'] - last['xaxis.range[0]']).toBeCloseTo(6, 0);

            expect(first['xaxis.range[1]'] - last['xaxis.range[1]']).toBeCloseTo(1, 0);
        })
        .then(done, done.fail);
    });

    it('should show/hide `cliponaxis: false` pts according to range', function(done) {
        function _assert(markerDisplay, textDisplay, barTextDisplay) {
            var gd3 = d3Select(gd);

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
            var fns = drag.makeFns({pos0: p0, posN: p1});
            return fns.start()
                .then(function() { _assert(markerDisplay, textDisplay, barTextDisplay); })
                .then(fns.end);
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
            return _run(
                [250, 250], [250, 150],
                [null, null, 'none'],
                [null, null, 'none'],
                [null, null, 'none']
            );
        })
        .then(function() {
            expect(gd._fullLayout.yaxis.range[1]).toBeLessThan(3);
        })
        .then(function() {
            return _run(
                [250, 250], [150, 250],
                ['none', null, 'none'],
                ['none', null, 'none'],
                ['none', null, 'none']
            );
        })
        .then(function() {
            expect(gd._fullLayout.xaxis.range[0]).toBeGreaterThan(1);
        })
        .then(function() {
            return _run(
                [250, 250], [350, 350],
                [null, null, null],
                [null, null, null],
                [null, null, null]
            );
        })
        .then(done, done.fail);
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

    function doDrag(subplot, directions, dx, dy, nsteps) {
        return function() {
            var dragger = getDragger(subplot, directions);
            return drag({node: dragger, dpos: [dx, dy], nsteps: nsteps});
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
            var nsteps = opts.nsteps || 1;

            for(var i = 1; i <= nsteps; i++) {
                mouseEvent('scroll', coords.x + dx, coords.y + dy, {deltaY: deltaY / nsteps * i, element: dragger});
            }
            return delay(constants.REDRAWDELAY + 10)();
        };
    }

    function makeDragFns(subplot, directions, dx, dy, x0, y0) {
        var dragger = getDragger(subplot, directions);
        return drag.makeFns({node: dragger, dpos: [dx, dy], pos0: [x0, y0]});
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
            .then(done, done.fail);
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
            .then(done, done.fail);
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
            .then(done, done.fail);
        });
    });

    it('updates linked axes when there are constraints (axes_scaleanchor mock)', function(done) {
        var fig = Lib.extendDeep({}, require('../../image/mocks/axes_scaleanchor.json'));

        function _assert(y3rng, y4rng) {
            expect(gd._fullLayout.yaxis3.range).toBeCloseToArray(y3rng, 2, 'y3 rng');
            expect(gd._fullLayout.yaxis4.range).toBeCloseToArray(y4rng, 2, 'y3 rng');
        }

        Plotly.newPlot(gd, fig)
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
        .then(done, done.fail);
    });

    it('updates axis layout when the constraints require it', function(done) {
        function _assert(xGridCnt) {
            var xGrid = d3Select(gd).selectAll('.gridlayer > .x > path.xgrid');
            expect(xGrid.size()).toEqual(xGridCnt);
        }

        Plotly.newPlot(gd, [{
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
        .then(done, done.fail);
    });

    it('should draw correct zoomboxes corners', function(done) {
        function _run(msg, dp, exp) {
            var drag = makeDragFns('xy', 'nsew', dp[0], dp[1], 170, 170);

            return drag.start().then(function() {
                var zl = d3Select(gd).select('g.zoomlayer');
                var d = zl.select('.zoombox-corners').attr('d');

                if(exp.cornerCnt) {
                    var actual = (d.match(/Z/g) || []).length;
                    expect(actual).toBe(exp.cornerCnt, 'zoombox corner cnt: ' + msg);
                } else {
                    expect(d).toBe('M0,0Z', 'no zoombox corners: ' + msg);
                }
            })
            .then(drag.end);
        }

        Plotly.newPlot(gd, [{ y: [1, 2, 1] }])
        .then(function() {
            return _run('full-x full-y', [30, 30], {cornerCnt: 4});
        })
        .then(function() {
            return _run('full-y', [5, 30], {cornerCnt: 2});
        })
        .then(function() {
            return _run('full-x', [30, 2], {cornerCnt: 2});
        })
        .then(function() { return Plotly.relayout(gd, 'xaxis.fixedrange', true); })
        .then(function() {
            return _run('full-x full-y w/ fixed xaxis', [30, 30], {cornerCnt: 2});
        })
        .then(function() {
            return _run('full-x w/ fixed xaxis', [30, 5], {cornerCnt: 0});
        })
        .then(function() { return Plotly.relayout(gd, {'xaxis.fixedrange': false, 'yaxis.fixedrange': true}); })
        .then(function() {
            return _run('full-x full-y w/ fixed yaxis', [30, 30], {cornerCnt: 2});
        })
        .then(function() {
            return _run('full-y w/ fixed yaxis', [5, 30], {cornerCnt: 0});
        })
        .then(done, done.fail);
    });

    it('should emit plotly_relayouting events when drawing zoom selection', function(done) {
        var nsteps = 10; var events = []; var relayoutCallback;
        Plotly.newPlot(gd, [{ y: [1, 2, 1] }])
        .then(function() {
            relayoutCallback = jasmine.createSpy('relayoutCallback');
            gd.on('plotly_relayout', relayoutCallback);
            gd.on('plotly_relayouting', function(e) {
                events.push(e);
            });
        })
        .then(doDrag('xy', 'nsew', 100, 100, nsteps))
        .then(function() {
            expect(events.length).toEqual(nsteps);
            expect(relayoutCallback).toHaveBeenCalledTimes(1);
        })
        .then(done, done.fail);
    });

    it('should emit plotly_relayouting events when zooming via mouse wheel', function(done) {
        var nsteps = 10; var events = []; var relayoutCallback;
        Plotly.newPlot(gd, [{ y: [1, 2, 1] }], {}, {scrollZoom: true})
        .then(function() {
            relayoutCallback = jasmine.createSpy('relayoutCallback');
            gd.on('plotly_relayout', relayoutCallback);
            gd.on('plotly_relayouting', function(e) {
                events.push(e);
            });
        })
        .then(doScroll('xy', 'nsew', 100, {edge: 'se', nsteps: nsteps}))
        .then(function() {
            expect(events.length).toEqual(nsteps);
            expect(relayoutCallback).toHaveBeenCalledTimes(1);
        })
        .then(done, done.fail);
    });

    it('handles xy, x-only and y-only zoombox updates', function(done) {
        function _assert(msg, xrng, yrng) {
            expect(gd.layout.xaxis.range).toBeCloseToArray(xrng, 2, 'xrng - ' + msg);
            expect(gd.layout.yaxis.range).toBeCloseToArray(yrng, 2, 'yrng - ' + msg);
        }

        Plotly.newPlot(gd, [{ y: [1, 2, 1] }])
        .then(doDrag('xy', 'nsew', 50, 50))
        .then(function() { _assert('after xy drag', [1, 1.208], [1.287, 1.5]); })
        .then(doDblClick('xy', 'nsew'))
        .then(doDrag('xy', 'nsew', 50, 0))
        .then(function() { _assert('after x-only drag', [1, 1.208], [0.926, 2.073]); })
        .then(doDblClick('xy', 'nsew'))
        .then(doDrag('xy', 'nsew', 0, 50))
        .then(function() { _assert('after y-only drag', [-0.128, 2.128], [1.287, 1.5]); })
        .then(done, done.fail);
    });

    it('handles y-only to xy back to y-only in single zoombox drag motion', function(done) {
        function _assert(msg, evtData, xrng, yrng) {
            expect([evtData['xaxis.range[0]'], evtData['xaxis.range[1]']])
                    .toBeCloseToArray(xrng, 2, 'x evt - ' + msg);
            expect([evtData['yaxis.range[0]'], evtData['yaxis.range[1]']])
                    .toBeCloseToArray(yrng, 2, 'y evt - ' + msg);
        }

        var relayoutingList = [];
        var relayoutList = [];

        var xrng0 = [-0.1347, 2.1347];
        var yrng1 = [1.3581, 1.5];
        var blank = [undefined, undefined];

        Plotly.newPlot(gd, [{
            y: [1, 2, 1]
        }], {
            margin: {l: 0, t: 0, r: 0, b: 0},
            width: 400, height: 400
        })
        .then(function() {
            gd.on('plotly_relayouting', function(d) {
                relayoutingList.push(d);

                // N.B. should not mutate axis range on mousemove
                expect(gd._fullLayout.xaxis.range)
                    .toBeCloseToArray(xrng0, 2, 'full x range| relyouting call #' + relayoutingList.length);
            });
            gd.on('plotly_relayout', function(d) { relayoutList.push(d); });
        })
        .then(function() {
            return drag({
                node: getDragger('xy', 'nsew'),
                path: [
                    // start in middle
                    [200, 200],
                    // y-only zoombox
                    [200, 250],
                    // xy zoombox
                    [250, 250],
                    // back to y-only
                    [200, 250]
                ]
            });
        })
        .then(delay(100))
        .then(function() {
            if(relayoutingList.length === 3) {
                _assert('relayouting y-only', relayoutingList[0], blank, yrng1);
                _assert('relayouting xy', relayoutingList[1], [0.9999, 1.2836], yrng1);
                _assert('relayouting back to y-only', relayoutingList[2], blank, yrng1);
            } else {
                fail('did not emit correct number of plotly_relayouting events');
            }

            if(relayoutList.length === 1) {
                _assert('relayout', relayoutList[0], blank, yrng1);
            } else {
                fail('did not emit correct number of plotly_relayout events');
            }
        })
        .then(done, done.fail);
    });

    it('should compute correct multicategory tick label span during drag', function(done) {
        var fig = Lib.extendDeep({}, require('../../image/mocks/multicategory.json'));

        function _assertLabels(msg, exp) {
            var tickLabels = d3Select(gd).selectAll('.xtick > text');
            expect(tickLabels.size()).withContext(msg + ' - # of tick labels').toBe(exp.angle.length);

            tickLabels.each(function(_, i) {
                var t = d3Select(this).attr('transform');
                var rotate = (t.split('rotate(')[1] || '').split(')')[0];
                var angle = rotate.split(',')[0];
                expect(Number(angle)).withContext(msg + ' - node ' + i).toBeCloseTo(exp.angle[i], 2);
            });

            var tickLabels2 = d3Select(gd).selectAll('.xtick2 > text');
            expect(tickLabels2.size()).toBe(exp.y.length, msg + ' - # of secondary labels');

            tickLabels2.each(function(_, i) {
                var y = d3Select(this).attr('y');
                expect(Number(y)).toBeWithin(exp.y[i], 5.5, msg + ' - node ' + i);
            });
        }

        function _run(msg, dp, exp) {
            var drag = makeDragFns('xy', 'e', dp[0], dp[1], 585, 390);
            return drag.start()
                .then(function() { _assertLabels(msg, exp); })
                .then(drag.end);
        }

        Plotly.newPlot(gd, fig)
        .then(function() {
            _assertLabels('base', {
                angle: [0, 0, 0, 0, 0, 0, 0],
                y: [406, 406]
            });
        })
        .then(function() {
            return _run('drag to wide-range -> rotates labels', [-340, 0], {
                angle: [30, 30, 30, 30, 30, 30, 30],
                y: [430, 430]
            });
        })
        .then(function() {
            return _run('drag to narrow-range -> un-rotates labels', [100, 0], {
                angle: [0, 0, 0, 0, 0, 0, 0],
                y: [406, 406]
            });
        })
        .then(done, done.fail);
    });

    describe('updates matching axes', function() {
        var TOL = 1;
        var eventData;

        function assertRanges(msg, exp) {
            exp.forEach(function(expi) {
                var axNames = expi[0];
                var rng = expi[1];
                var opts = expi[2] || {};

                axNames.forEach(function(n) {
                    var msgi = n + ' - ' + msg;
                    if(!opts.skipInput) expect(gd.layout[n].range).toBeCloseToArray(rng, TOL, msgi + ' |input');
                    expect(gd._fullLayout[n].range).toBeCloseToArray(rng, TOL, msgi + ' |full');
                });
            });
        }

        function assertEventData(msg, exp) {
            if(eventData === null) {
                return fail('plotly_relayout did not get triggered - ' + msg);
            }

            exp.forEach(function(expi) {
                var axNames = expi[0];
                var rng = expi[1];
                var opts = expi[2] || {};

                axNames.forEach(function(n) {
                    var msgi = n + ' - ' + msg;
                    if(opts.autorange) {
                        expect(eventData[n + '.autorange']).toBe(true, 2, msgi + '|event data');
                    } else if(!opts.noChange && !opts.noEventData) {
                        expect(eventData[n + '.range[0]']).toBeCloseTo(rng[0], TOL, msgi + '|event data [0]');
                        expect(eventData[n + '.range[1]']).toBeCloseTo(rng[1], TOL, msgi + '|event data [1]');
                    }
                });
            });

            eventData = null;
        }

        function assertAxesDrawCalls(msg, exp) {
            var cnt = 0;
            exp.forEach(function(expi) {
                var axNames = expi[0];
                var opts = expi[2] || {};
                axNames.forEach(function() {
                    if(!opts.noChange) {
                        cnt++;
                        // called twice as many times on drag:
                        // - once per axis during mousemouve
                        // - once per axis on mouseup
                        if(opts.dragged) cnt++;
                    }
                });
            });

            expect(Axes.drawOne).toHaveBeenCalledTimes(cnt);
            Axes.drawOne.calls.reset();
        }

        function assertSubplotTranslateAndScale(msg, spIds, trans, scale) {
            var gClips = d3Select(gd).select('g.clips');
            var uid = gd._fullLayout._uid;
            var transActual = [];
            var scaleActual = [];
            var trans0 = [];
            var scale1 = [];

            spIds.forEach(function(id) {
                var rect = gClips.select('#clip' + uid + id + 'plot > rect');
                var t = Drawing.getTranslate(rect);
                var s = Drawing.getScale(rect);
                transActual.push(t.x, t.y);
                scaleActual.push(s.x, s.y);
                trans0.push(0, 0);
                scale1.push(1, 1);
            });

            var transExp = trans ? trans : trans0;
            var scaleExp = scale ? scale : scale1;
            var msg1 = msg + ' [' + spIds.map(function(id) { return '..' + id; }).join(', ') + ']';
            expect(transActual).toBeWithinArray(transExp, 3, msg1 + ' clip translate');
            expect(scaleActual).toBeWithinArray(scaleExp, 3, msg1 + ' clip scale');
        }

        function _assert(msg, exp) {
            return function() {
                assertRanges(msg, exp);
                assertEventData(msg, exp);
                assertAxesDrawCalls(msg, exp);
            };
        }

        function makePlot(data, layout, s) {
            s = s || {};

            var fig = {};
            fig.data = Lib.extendDeep([], data);
            fig.layout = Lib.extendDeep({}, layout, {dragmode: s.dragmode});
            fig.config = {scrollZoom: true};

            spyOn(Axes, 'drawOne').and.callThrough();
            eventData = null;

            return Plotly.newPlot(gd, fig).then(function() {
                Axes.drawOne.calls.reset();
                gd.on('plotly_relayout', function(d) { eventData = d; });
            });
        }

        describe('no-constrained x-axes matching x-axes subplot case', function() {
            var data = [
                { y: [1, 2, 1] },
                { y: [2, 1, 2, 3], xaxis: 'x2' },
                { y: [0, 1], xaxis: 'x3' }
            ];

            // N.B. ax._length are not equal here
            var layout = {
                xaxis: {domain: [0, 0.2]},
                xaxis2: {matches: 'x', domain: [0.3, 0.6]},
                xaxis3: {matches: 'x', domain: [0.65, 1]},
                yaxis: {},
                width: 800,
                height: 500,
                dragmode: 'zoom'
            };

            var xr0 = [-0.285, 3.246];
            var yr0 = [-0.211, 3.211];

            var specs = [{
                desc: 'zoombox on xy',
                drag: ['xy', 'nsew', 30, 30],
                exp: [
                    [['xaxis', 'xaxis2', 'xaxis3'], [1.457, 2.328]],
                    [['yaxis'], [1.179, 1.50]]
                ],
                dblclickSubplot: 'xy'
            }, {
                desc: 'x-only zoombox on xy',
                drag: ['xy', 'nsew', 30, 0],
                exp: [
                    [['xaxis', 'xaxis2', 'xaxis3'], [1.457, 2.328]],
                    [['yaxis'], yr0, {noChange: true}]
                ],
                dblclickSubplot: 'x2y'
            }, {
                desc: 'y-only zoombox on xy',
                drag: ['xy', 'nsew', 0, 30],
                exp: [
                    [['xaxis', 'xaxis2', 'xaxis3'], xr0, {noChange: true}],
                    [['yaxis'], [1.179, 1.50]]
                ],
                dblclickSubplot: 'x3y'
            }, {
                desc: 'zoombox on x2y',
                drag: ['x2y', 'nsew', 30, 30],
                exp: [
                    // N.B. slightly different range result
                    // due difference in ax._length
                    [['xaxis', 'xaxis2', 'xaxis3'], [1.468, 2.049]],
                    [['yaxis'], [1.179, 1.50]]
                ],
                dblclickSubplot: 'x3y'
            }, {
                desc: 'zoombox on x3y',
                drag: ['x3y', 'nsew', 30, 30],
                exp: [
                    // Similarly here slightly different range result
                    // due difference in ax._length
                    [['xaxis', 'xaxis2', 'xaxis3'], [1.470, 1.974]],
                    [['yaxis'], [1.179, 1.50]]
                ],
                dblclickSubplot: 'xy'
            }, {
                desc: 'drag ew on x2y',
                drag: ['x2y', 'ew', 30, 0],
                exp: [
                    [['xaxis', 'xaxis2', 'xaxis3'], [-0.866, 2.665], {dragged: true}],
                    [['yaxis'], yr0, {noChange: true}]
                ],
                dblclickSubplot: 'x3y'
            }, {
                desc: 'drag ew on x3y',
                drag: ['x3y', 'ew', 30, 0],
                exp: [
                    [['xaxis', 'xaxis2', 'xaxis3'], [-0.783, 2.748], {dragged: true}],
                    [['yaxis'], yr0, {noChange: true}]
                ],
                dblclickSubplot: 'xy'
            }, {
                desc: 'drag e on xy',
                drag: ['xy', 'e', 30, 30],
                exp: [
                    // FIXME On CI we need 1.359 but locally it's 1.317 ??
                    [['xaxis', 'xaxis2', 'xaxis3'], [xr0[0], 1.359], {dragged: true}],
                    [['yaxis'], yr0, {noChange: true}]
                ],
                dblclickSubplot: 'x3y'
            }, {
                desc: 'drag nw on x3y',
                drag: ['xy', 'nw', 30, 30],
                exp: [
                    // FIXME On CI we need -1.425 but locally it's -1.442 ??
                    [['xaxis', 'xaxis2', 'xaxis3'], [-1.425, xr0[1]], {dragged: true}],
                    [['yaxis'], [-0.211, 3.565], {dragged: true}]
                ],
                dblclickSubplot: 'x3y'
            }, {
                desc: 'panning on xy subplot',
                dragmode: 'pan',
                drag: ['xy', 'nsew', 30, 30],
                exp: [
                    [['xaxis', 'xaxis2', 'xaxis3'], [-1.157, 2.374], {dragged: true}],
                    [['yaxis'], [0.109, 3.532], {dragged: true}]
                ],
                dblclickSubplot: 'x3y'
            }, {
                desc: 'panning on x2y subplot',
                dragmode: 'pan',
                drag: ['x2y', 'nsew', 30, 30],
                exp: [
                    [['xaxis', 'xaxis2', 'xaxis3'], [-0.866, 2.665], {dragged: true}],
                    [['yaxis'], [0.109, 3.532], {dragged: true}]
                ],
                dblclickSubplot: 'x2y'
            }, {
                desc: 'panning on x3y subplot',
                dragmode: 'pan',
                drag: ['x3y', 'nsew', 30, 30],
                exp: [
                    [['xaxis', 'xaxis2', 'xaxis3'], [-0.783, 2.748], {dragged: true}],
                    [['yaxis'], [0.109, 3.532], {dragged: true}]
                ],
                dblclickSubplot: 'xy'
            }, {
                desc: 'scrolling on x3y subplot',
                scroll: ['x3y', 20],
                exp: [
                    [['xaxis', 'xaxis2', 'xaxis3'], [-0.655, 3.247], {dragged: true}],
                    [['yaxis'], [-0.211, 3.571], {dragged: true}]
                ],
                dblclickSubplot: 'xy'
            }, {
                desc: 'scrolling on x2y subplot',
                scroll: ['x2y', 20],
                exp: [
                    [['xaxis', 'xaxis2', 'xaxis3'], [-0.655, 3.247], {dragged: true}],
                    [['yaxis'], [-0.211, 3.571], {dragged: true}]
                ],
                dblclickSubplot: 'xy'
            }, {
                desc: 'scrolling on xy subplot',
                scroll: ['xy', 20],
                exp: [
                    [['xaxis', 'xaxis2', 'xaxis3'], [-0.655, 3.247], {dragged: true}],
                    [['yaxis'], [-0.211, 3.571], {dragged: true}]
                ],
                dblclickSubplot: 'x2y'
            }];

            specs.forEach(function(s) {
                var msg = 'after ' + s.desc;
                var msg2 = ['after dblclick on subplot', s.dblclickSubplot, msg].join(' ');

                it('@flaky ' + s.desc, function(done) {
                    makePlot(data, layout, s).then(function() {
                        assertRanges('base', [
                            [['xaxis', 'xaxis2', 'xaxis3'], xr0],
                            [['yaxis'], yr0]
                        ]);
                    })
                    .then(function() {
                        if(s.scroll) {
                            return doScroll(s.scroll[0], 'nsew', s.scroll[1], {edge: 'se'})();
                        } else {
                            return doDrag(s.drag[0], s.drag[1], s.drag[2], s.drag[3])();
                        }
                    })
                    .then(_assert(msg, s.exp))
                    .then(doDblClick(s.dblclickSubplot, 'nsew'))
                    .then(_assert(msg2, [
                        [['xaxis', 'xaxis2', 'xaxis3'], xr0, {autorange: true}],
                        [['yaxis'], yr0, {autorange: true}]
                    ]))
                    .then(done, done.fail);
                });
            });
        });

        describe('y-axes matching y-axes case', function() {
            var data = [
                { y: [1, 2, 1] },
                { y: [2, 1, 2, 3], yaxis: 'y2' },
                { y: [0, 1], yaxis: 'y3' }
            ];

            // N.B. ax._length are not equal here
            var layout = {
                yaxis: {domain: [0, 0.2]},
                yaxis2: {matches: 'y', domain: [0.3, 0.6]},
                yaxis3: {matches: 'y2', domain: [0.65, 1]},
                width: 500,
                height: 800,
                dragmode: 'pan'
            };

            var xr0 = [-0.211, 3.211];
            var yr0 = [-0.234, 3.244];

            var specs = [{
                desc: 'pan on xy',
                drag: ['xy', 'nsew', 30, 30],
                exp: [
                    [['xaxis'], [-0.534, 2.888], {dragged: true}],
                    [['yaxis', 'yaxis2', 'yaxis3'], [0.607, 4.085], {dragged: true}],
                ],
                trans: [-30, -30, -30, -45, -30, -52.5]
            }, {
                desc: 'pan on xy2',
                drag: ['xy2', 'nsew', 30, 30],
                exp: [
                    [['xaxis'], [-0.534, 2.888], {dragged: true}],
                    [['yaxis', 'yaxis2', 'yaxis3'], [0.327, 3.805], {dragged: true}],
                ],
                trans: [-30, -20, -30, -30, -30, -35]
            }, {
                desc: 'pan on xy3',
                drag: ['xy3', 'nsew', 30, 30],
                exp: [
                    [['xaxis'], [-0.534, 2.888], {dragged: true}],
                    [['yaxis', 'yaxis2', 'yaxis3'], [0.247, 3.725], {dragged: true}],
                ],
                trans: [-30, -17.142, -30, -25.71, -30, -30]
            }, {
                desc: 'drag ns dragger on xy2',
                drag: ['xy2', 'ns', 0, 30],
                exp: [
                    [['xaxis'], xr0, {noChange: true}],
                    [['yaxis', 'yaxis2', 'yaxis3'], [0.327, 3.805], {dragged: true}],
                ],
                trans: [0, -20, 0, -30, 0, -35]
            }, {
                desc: 'drag n dragger on xy3',
                drag: ['xy3', 'n', 0, 30],
                exp: [
                    [['xaxis'], xr0, {noChange: true}],
                    [['yaxis', 'yaxis2', 'yaxis3'], [yr0[0], 3.802], {dragged: true}],
                ],
                trans: [0, -19.893, 0, -29.839, 0, -34.812],
                scale: [1, 1.160, 1, 1.160, 1, 1.160]
            }, {
                desc: 'drag s dragger on xy',
                drag: ['xy', 's', 0, 30],
                exp: [
                    [['xaxis'], xr0, {noChange: true}],
                    [['yaxis', 'yaxis2', 'yaxis3'], [1.586, yr0[1]], {dragged: true}],
                ],
                trans: [0, 0, 0, 0, 0, 0],
                scale: [1, 0.476, 1, 0.476, 1, 0.476]
            }];

            specs.forEach(function(s) {
                var msg = 'after ' + s.desc;

                it('@flaky ' + s.desc, function(done) {
                    makePlot(data, layout, s).then(function() {
                        assertRanges('base', [
                            [['xaxis'], xr0],
                            [['yaxis', 'yaxis2', 'yaxis3'], yr0]
                        ]);
                    })
                    .then(function() {
                        var drag = makeDragFns(s.drag[0], s.drag[1], s.drag[2], s.drag[3]);
                        return drag.start().then(function() {
                            assertSubplotTranslateAndScale(msg, ['xy', 'xy2', 'xy3'], s.trans, s.scale);
                        })
                       .then(drag.end);
                    })
                    .then(_assert(msg, s.exp))
                    .then(done, done.fail);
                });
            });
        });

        describe('x <--> y axes matching case', function() {
            /*
             * y  |                         y2 |
             *    |                            |
             * m  |                            |
             * a  |                            |
             * t  |                            |
             * c  |                            |
             * h  |                            |
             * e  |                            |
             * s  |                            |
             *    |                            |
             * x2    ________________________   _________________________
             *
             *                 x                    x2 matches y
             */

            var data = [
                { y: [1, 2, 1] },
                { y: [2, 3, -1, 5], xaxis: 'x2', yaxis: 'y2' },
            ];

            var layout = {
                xaxis: {domain: [0, 0.4]},
                xaxis2: {anchor: 'y2', domain: [0.6, 1], matches: 'y'},
                yaxis: {matches: 'x2'},
                yaxis2: {anchor: 'x2'},
                width: 700,
                height: 500,
                dragmode: 'pan'
            };

            var rm0 = [-0.237, 3.237];
            var rx0 = [-0.158, 2.158];
            var ry20 = [-1.422, 5.422];

            var specs = [{
                desc: 'pan on xy subplot',
                drag: ['xy', 'nsew', 30, 30],
                exp: [
                    [['yaxis', 'xaxis2'], [0.0886, 3.562], {dragged: true}],
                    [['xaxis'], [-0.496, 1.820], {dragged: true}],
                    [['yaxis2'], ry20, {noChange: true}],
                ],
                trans: [-30, -30, 19.275, 0]
            }, {
                desc: 'pan on x2y2 subplot',
                drag: ['x2y2', 'nsew', 30, 30],
                exp: [
                    [['yaxis', 'xaxis2'], [-0.744, 2.730], {dragged: true}],
                    [['xaxis'], rx0, {noChange: true}],
                    [['yaxis2'], [-0.787, 6.064], {dragged: true}],
                ],
                trans: [0, 46.69, -30, -30]
            }, {
                desc: 'drag xy ns dragger',
                drag: ['xy', 'ns', 0, 30],
                exp: [
                    [['yaxis', 'xaxis2'], [0.0886, 3.562], {dragged: true}],
                    [['xaxis'], rx0, {noChange: true}],
                    [['yaxis2'], ry20, {noChange: true}],
                ],
                trans: [0, -30, 19.275, 0]
            }, {
                desc: 'drag x2y2 ew dragger',
                drag: ['x2y2', 'ew', 30, 0],
                exp: [
                    [['yaxis', 'xaxis2'], [-0.744, 2.730], {dragged: true}],
                    [['xaxis'], rx0, {noChange: true}],
                    [['yaxis2'], ry20, {noChange: true}],
                ],
                trans: [0, 46.692, -30, 0]
            }, {
                desc: 'drag xy n corner',
                drag: ['xy', 'n', 0, 30],
                exp: [
                    [['yaxis', 'xaxis2'], [rm0[0], 3.596], {dragged: true}],
                    [['xaxis'], rx0, {noChange: true}],
                    [['yaxis2'], ry20, {noChange: true}],
                ],
                trans: [0, -33.103, 0, 0],
                scale: [1, 1.103, 1.103, 1]
            }, {
                desc: 'drag xy s corner',
                drag: ['xy', 's', 0, 30],
                exp: [
                    [['yaxis', 'xaxis2'], [0.174, rm0[1]], {dragged: true}],
                    [['xaxis'], rx0, {noChange: true}],
                    [['yaxis2'], ry20, {noChange: true}],
                ],
                trans: [0, 0, 24.367, 0],
                scale: [1, 0.881, 0.881, 1]
            }, {
                desc: 'drag x2y2 e corner',
                drag: ['x2y2', 'e', 30, 0],
                exp: [
                    [['yaxis', 'xaxis2'], [rm0[0], 2.486], {dragged: true}],
                    [['xaxis'], rx0, {noChange: true}],
                    [['yaxis2'], ry20, {noChange: true}],
                ],
                trans: [0, 69.094, 0, 0],
                scale: [1, 0.784, 0.784, 1]
            }, {
                desc: 'drag x2y2 w corner',
                drag: ['x2y2', 'w', 30, 0],
                exp: [
                    [['yaxis', 'xaxis2'], [-0.830, rm0[1]], {dragged: true}],
                    [['xaxis'], rx0, {noChange: true}],
                    [['yaxis2'], ry20, {noChange: true}],
                ],
                trans: [0, 0, -35.125, 0],
                scale: [1, 1.170, 1.170, 1]
            }];

            specs.forEach(function(s) {
                var msg = 'after ' + s.desc;

                it('@flaky ' + s.desc, function(done) {
                    makePlot(data, layout, s).then(function() {
                        assertRanges('base', [
                            [['yaxis', 'xaxis2'], rm0],
                            [['xaxis'], rx0],
                            [['yaxis2'], ry20],
                        ]);
                    })
                    .then(function() {
                        var drag = makeDragFns(s.drag[0], s.drag[1], s.drag[2], s.drag[3]);
                        return drag.start().then(function() {
                            assertSubplotTranslateAndScale(msg, ['xy', 'x2y2'], s.trans, s.scale);
                        })
                       .then(drag.end);
                    })
                    .then(_assert(msg, s.exp))
                    .then(done, done.fail);
                });
            });
        });

        describe('constrained subplot case', function() {
            var data = [{
                type: 'splom',
                // N.B. subplots xy and x2y2 are "constrained",
                dimensions: [{
                    values: [1, 2, 5, 3, 4],
                    label: 'A',
                    axis: {matches: true}
                }, {
                    values: [2, 1, 0, 3, 4],
                    label: 'B',
                    axis: {matches: true}
                }]
            }];

            var layout = {width: 500, height: 500};

            var rng0 = {xy: [0.648, 5.351], x2y2: [-0.351, 4.351]};

            var specs = [{
                desc: 'zoombox on constrained xy subplot',
                drag: ['xy', 'nsew', 30, 30],
                exp: [
                    [['xaxis', 'yaxis'], [2.093, 3.860]],
                    [['xaxis2', 'yaxis2'], rng0.x2y2, {noChange: true}]
                ],
                zoombox: [60.509, 56.950],
                dblclickSubplot: 'xy'
            }, {
                desc: 'zoombox on constrained x2y2 subplot',
                drag: ['x2y2', 'nsew', 30, 30],
                exp: [
                    [['xaxis', 'yaxis'], rng0.xy, {noChange: true}],
                    [['xaxis2', 'yaxis2'], [1.075, 2.862]]
                ],
                zoombox: [61.177, 57.578],
                dblclickSubplot: 'xy'
            }, {
                desc: 'drag ew on x2y2',
                drag: ['x2y2', 'ew', 30, 0],
                exp: [
                    [['xaxis', 'yaxis'], rng0.xy, {noChange: true}],
                    [['xaxis2', 'yaxis2'], [-1.227, 3.475], {dragged: true}]
                ],
                dblclickSubplot: 'x2y2'
            }, {
                desc: 'scrolling on xy subplot',
                scroll: ['xy', 20],
                exp: [
                    [['xaxis', 'yaxis'], [0.151, 5.896], {dragged: true}],
                    [['xaxis2', 'yaxis2'], rng0.x2y2, {noChange: true}]
                ],
                dblclickSubplot: 'x2y2'
            }];

            specs.forEach(function(s) {
                var msg = 'after ' + s.desc;
                var msg2 = ['after dblclick on subplot', s.dblclickSubplot, msg].join(' ');
                var spmatch = s.dblclickSubplot.match(constants.SUBPLOT_PATTERN);

                it('@flaky ' + s.desc, function(done) {
                    makePlot(data, layout, s).then(function() {
                        assertRanges('base', [
                            [['xaxis', 'yaxis'], rng0.xy],
                            [['xaxis2', 'yaxis2'], rng0.x2y2]
                        ]);
                    })
                    .then(function() {
                        if(s.scroll) {
                            return doScroll(s.scroll[0], 'nsew', s.scroll[1], {edge: 'se'})();
                        } else {
                            var drag = makeDragFns(s.drag[0], s.drag[1], s.drag[2], s.drag[3]);
                            return drag.start().then(function() {
                                if(s.drag[1] === 'nsew') {
                                    var zb = d3Select(gd).select('g.zoomlayer > path.zoombox');
                                    var d = zb.attr('d');
                                    var v = Number(d.split('v')[1].split('h')[0]);
                                    var h = Number(d.split('h')[1].split('v')[0]);
                                    expect(h).toBeCloseTo(s.zoombox[0], 1, 'zoombox horizontal span -' + msg);
                                    expect(v).toBeCloseTo(s.zoombox[1], 1, 'zoombox vertical span -' + msg);
                                }
                            })
                           .then(drag.end);
                        }
                    })
                    .then(_assert(msg, s.exp))
                    .then(doDblClick(s.dblclickSubplot, 'nsew'))
                    .then(_assert(msg2, [[
                        ['xaxis' + spmatch[1], 'yaxis' + spmatch[2]],
                        rng0[s.dblclickSubplot],
                        {autorange: true}
                    ]]))
                    .then(done, done.fail);
                });
            });
        });

        it('@noCI panning a matching overlaying axis', function(done) {
            /*
             * y |                     | y2  y3 |
             *   |                     |        |
             *   |                     | o   m  |
             *   |                     | v   a  |
             *   |                     | e   t  |
             *   |                     | r   c  |
             *   |                     | l   h  |
             *   |                     | a   e  |
             *   |                     | y   s  |
             *   |                     |        |
             *    ______________________ y   y2  ____________________
             *
             *                 x                          x2
             */
            var data = [
                { y: [1, 2, 1] },
                { y: [2, 1, 3, 4], yaxis: 'y2' },
                { y: [2, 3, -1, 5], xaxis: 'x2', yaxis: 'y3' }
            ];

            var layout = {
                xaxis: {domain: [0, 0.4]},
                xaxis2: {anchor: 'y2', domain: [0.5, 1]},
                yaxis2: {anchor: 'x', overlaying: 'y', side: 'right'},
                yaxis3: {anchor: 'x2', matches: 'y2'},
                width: 700,
                height: 500,
                dragmode: 'pan'
            };

            makePlot(data, layout).then(function() {
                assertRanges('base', [
                    [['yaxis2', 'yaxis3'], [-1.422, 5.422]],
                    [['xaxis'], [-0.237, 3.237]],
                    [['yaxis'], [0.929, 2.070]],
                    [['xaxis2'], [-0.225, 3.222]]
                ]);
            })
            .then(function() {
                var drag = makeDragFns('xy', 'nsew', 30, 30);
                return drag.start().then(function() {
                    // N.B. it is with these values that Axes.drawOne gets called!
                    assertRanges('during drag', [
                        [['yaxis2', 'yaxis3'], [-0.788, 6.0641], {skipInput: true}],
                        [['xaxis'], [-0.744, 2.730], {skipInput: true}],
                        [['yaxis'], [1.036, 2.177], {skipInput: true}],
                        [['xaxis2'], [-0.225, 3.222]]
                    ]);
                })
                .then(drag.end);
            })
            .then(_assert('after drag on xy subplot', [
                [['yaxis2', 'yaxis3'], [-0.788, 6.0641], {dragged: true}],
                [['xaxis'], [-0.744, 2.730], {dragged: true}],
                [['yaxis'], [1.036, 2.177], {dragged: true}],
                [['xaxis2'], [-0.225, 3.222], {noChange: true}]
            ]))
            .then(function() { return Plotly.relayout(gd, 'dragmode', 'zoom'); })
            .then(doDrag('xy', 'nsew', 30, 30))
            .then(_assert('after zoombox on xy subplot', [
                [['yaxis2', 'yaxis3'], [2, 2.6417]],
                [['xaxis'], [0.979, 1.486]],
                [['yaxis'], [1.5, 1.609]],
                [['xaxis2'], [-0.225, 3.222], {noChange: true}]
            ]))
            .then(done, done.fail);
        });

        it('panning a matching axes with references to *missing* axes', function(done) {
            var data = [
                // N.B. no traces on subplot xy
                { x: [1, 2, 3], y: [1, 2, 1], xaxis: 'x2', yaxis: 'y2'},
                { x: [1, 2, 3], y: [1, 2, 1], xaxis: 'x3', yaxis: 'y3'},
                { x: [1, 2, 3], y: [1, 2, 1], xaxis: 'x4', yaxis: 'y4'}
            ];

            var layout = {
                xaxis: {domain: [0, 0.48]},
                xaxis2: {anchor: 'y2', domain: [0.52, 1], matches: 'x'},
                xaxis3: {anchor: 'y3', domain: [0, 0.48], matches: 'x'},
                xaxis4: {anchor: 'y4', domain: [0.52, 1], matches: 'x'},
                yaxis: {domain: [0, 0.48]},
                yaxis2: {anchor: 'x2', domain: [0.52, 1], matches: 'y'},
                yaxis3: {anchor: 'x3', domain: [0.52, 1], matches: 'y'},
                yaxis4: {anchor: 'x4', domain: [0, 0.48], matches: 'y'},
                width: 400,
                height: 400,
                margin: {t: 50, l: 50, b: 50, r: 50},
                showlegend: false,
                dragmode: 'pan'
            };

            makePlot(data, layout).then(function() {
                assertRanges('base', [
                    [['xaxis', 'xaxis2', 'xaxis3', 'xaxis4'], [0.8206, 3.179]],
                    [['yaxis', 'yaxis2', 'yaxis3', 'yaxis4'], [0.9103, 2.0896]]
                ]);
            })
            .then(function() {
                var drag = makeDragFns('x2y2', 'nsew', 30, 30);
                return drag.start().then(function() {
                    assertRanges('during drag', [
                        [['xaxis', 'xaxis2', 'xaxis3', 'xaxis4'], [0.329, 2.687], {skipInput: true}],
                        [['yaxis', 'yaxis2', 'yaxis3', 'yaxis4'], [1.156, 2.335], {skipInput: true}]
                    ]);
                })
                .then(drag.end);
            })
            .then(_assert('after drag on x2y2 subplot', [
                [['xaxis', 'xaxis2', 'xaxis3', 'xaxis4'], [0.329, 2.687], {dragged: true}],
                [['yaxis', 'yaxis2', 'yaxis3', 'yaxis4'], [1.156, 2.335], {dragged: true}]
            ]))
            .then(doDblClick('x3y3', 'nsew'))
            .then(_assert('after double-click on x3y3 subplot', [
                [['xaxis', 'xaxis2', 'xaxis3', 'xaxis4'], [0.8206, 3.179], {autorange: true}],
                [['yaxis', 'yaxis2', 'yaxis3', 'yaxis4'], [0.9103, 2.0896], {autorange: true}]
            ]))
            .then(done, done.fail);
        });

        it('matching and constrained subplots play nice together', function(done) {
            var data = [
                {x: [0, 3], y: [0, 3]},
                {x: [0, 3], y: [1, 8], xaxis: 'x2', yaxis: 'y2'}
            ];

            var layout = {
                width: 400, height: 350, margin: {l: 50, r: 50, t: 50, b: 50},
                yaxis: {domain: [0, 0.4], scaleanchor: 'x'},
                xaxis2: {anchor: 'y2'},
                yaxis2: {domain: [0.6, 1], matches: 'x2'},
                showlegend: false
            };
            var x2y2, mx, my;

            makePlot(data, layout).then(function() {
                assertRanges('base', [
                    [['xaxis'], [-3.955, 6.955]],
                    [['yaxis'], [-0.318, 3.318]],
                    [['xaxis2', 'yaxis2'], [-0.588, 8.824]]
                ]);
                x2y2 = d3Select('.subplot.x2y2 .overplot').select('.x2y2');
                expect(x2y2.attr('transform')).toBe('translate(50,50)');
                mx = gd._fullLayout.xaxis._m;
                my = gd._fullLayout.yaxis._m;
            })
            .then(function() {
                var drag = makeDragFns('x2y2', 'ns', 30, 30);
                return drag.start().then(function() {
                    assertRanges('during drag', [
                        [['xaxis'], [-3.955, 6.955]],
                        [['yaxis'], [-0.318, 3.318]],
                        [['xaxis2', 'yaxis2'], [2.236, 11.648], {skipInput: true}]
                    ]);
                    // Check that the data container moves as it should with the axes
                    expect(x2y2.attr('transform')).toBe('translate(-40,80)scale(1,1)');
                })
                .then(drag.end);
            })
            .then(_assert('after drag on x2y2 subplot', [
                [['xaxis'], [-3.955, 6.955], {noChange: true}],
                [['yaxis'], [-0.318, 3.318], {noChange: true}],
                [['xaxis2', 'yaxis2'], [2.236, 11.648], {dragged: true}]
            ]))
            .then(function() {
                // make sure the ranges were correct when xy was redrawn
                expect(gd._fullLayout.xaxis._m).toBe(mx);
                expect(gd._fullLayout.yaxis._m).toBe(my);
            })
            .then(doDblClick('x2y2', 'ew'))
            .then(_assert('after double-click on x2', [
                [['xaxis'], [-3.955, 6.955], {noChange: true}],
                [['yaxis'], [-0.318, 3.318], {noChange: true}],
                [['xaxis2'], [-0.588, 8.824], {autorange: true}],
                [['yaxis2'], [-0.588, 8.824], {noEventData: true}]
            ]))
            .then(function() {
                expect(gd._fullLayout.xaxis._m).toBe(mx);
                expect(gd._fullLayout.yaxis._m).toBe(my);
            })
            .then(done, done.fail);
        });

        it('handles matching & scaleanchor chained together', function(done) {
            var data = [
                {y: [1, 2]},
                {y: [0, 1], xaxis: 'x2', yaxis: 'y2'}
            ];

            var layout = {
                width: 350,
                height: 300,
                margin: {l: 50, r: 50, t: 50, b: 50},
                showlegend: false,
                xaxis: {domain: [0, 0.4]},
                yaxis: {domain: [0, 0.5], matches: 'x'},
                xaxis2: {domain: [0.6, 1], scaleanchor: 'x', anchor: 'y2'},
                yaxis2: {domain: [0.5, 1], matches: 'x2', anchor: 'x2'}
            };

            makePlot(data, layout).then(function() {
                assertRanges('base', [
                    [['xaxis', 'yaxis'], [-0.212, 2.212]],
                    [['xaxis2', 'yaxis2'], [-0.712, 1.712]]
                ]);
            })
            .then(function() {
                var drag = makeDragFns('xy', 'sw', 30, -30);
                return drag.start().then(function() {
                    assertRanges('during drag sw', [
                        [['xaxis', 'yaxis'], [-1.251, 2.212], {skipInput: true}],
                        [['xaxis2', 'yaxis2'], [-1.232, 2.232], {skipInput: true}]
                    ]);
                })
                .then(drag.end);
            })
            .then(_assert('after drag sw on xy subplot', [
                [['xaxis', 'yaxis'], [-1.251, 2.212], {dragged: true}],
                [['xaxis2', 'yaxis2'], [-1.232, 2.232], {dragged: true}]
            ]))
            .then(doDblClick('x2y2', 'nsew'))
            .then(_assert('after double-click on x2', [
                [['xaxis', 'yaxis'], [-0.212, 2.212], {autorange: true}],
                [['xaxis2', 'yaxis2'], [-0.712, 1.712], {autorange: true}]
            ]))
            .then(function() {
                var drag = makeDragFns('xy', 'nw', 30, 30);
                return drag.start().then(function() {
                    assertRanges('during drag nw', [
                        [['xaxis', 'yaxis'], [-0.732, 2.732], {skipInput: true}],
                        [['xaxis2', 'yaxis2'], [-1.232, 2.232], {skipInput: true}]
                    ]);
                })
                .then(drag.end);
            })
            .then(_assert('after drag nw on xy subplot', [
                [['xaxis', 'yaxis'], [-0.732, 2.732], {dragged: true}],
                [['xaxis2', 'yaxis2'], [-1.232, 2.232], {dragged: true}]
            ]))
            .then(done, done.fail);
        });
    });

    describe('redrag behavior', function() {
        function _assertZoombox(msg, exp) {
            var gd3 = d3Select(gd);
            var zb = gd3.select('g.zoomlayer').select('.zoombox-corners');

            if(zb.size()) {
                expect(zb.attr('d')).toBe(exp.zoombox, msg + '| zoombox path');
            } else {
                expect(false).toBe(exp.zoombox, msg + '| no zoombox');
            }
        }

        function _assertClipRect(msg, exp) {
            var gd3 = d3Select(gd);
            var uid = gd._fullLayout._uid;
            var clipRect = gd3.select('#clip' + uid + 'xyplot > rect');
            var xy = Drawing.getTranslate(clipRect);
            expect(xy.x).toBeCloseTo(exp.clipTranslate[0], 2, msg + '| clip rect translate.x');
            expect(xy.y).toBeCloseTo(exp.clipTranslate[1], 2, msg + '| clip rect translate.y');
        }

        it('should handle extendTraces redraws during drag interactions', function(done) {
            var step = 500;
            var interval;
            var xrngPrev;

            function _assert(msg, exp) {
                return function() {
                    var fullLayout = gd._fullLayout;

                    expect(fullLayout.xaxis.range).toBeCloseToArray(exp.xrng === 'previous' ?
                        xrngPrev :
                        exp.xrng, 2, msg + '|xaxis range');
                    expect(d3Select(gd).selectAll('.point').size()).toBe(exp.nodeCnt, msg + '|pt cnt');
                    expect(Boolean(gd._dragdata)).toBe(exp.hasDragData, msg + '|has gd._dragdata?');
                    _assertZoombox(msg, exp);
                    _assertClipRect(msg, exp);

                    xrngPrev = fullLayout.xaxis.range.slice();
                };
            }

            Plotly.newPlot(gd, [{y: [1, 2, 1]}], {dragmode: 'zoom'})
            .then(_assert('base', {
                nodeCnt: 3,
                xrng: [-0.128, 2.128],
                hasDragData: false,
                zoombox: false,
                clipTranslate: [0, 0]
            }))
            .then(function() {
                Lib.seedPseudoRandom();

                interval = setInterval(function() {
                    Plotly.extendTraces(gd, { y: [[Lib.pseudoRandom()]] }, [0]);
                }, step);
            })
            .then(delay(1.5 * step))
            .then(_assert('after 1st extendTraces trace call', {
                nodeCnt: 4,
                xrng: [-0.1927, 3.1927],
                hasDragData: false,
                zoombox: false,
                clipTranslate: [0, 0]
            }))
            .then(function() {
                var drag = makeDragFns('xy', 'nsew', 30, 0);
                return drag.start()
                    .then(_assert('just after start of zoombox', {
                        nodeCnt: 4,
                        xrng: 'previous',
                        hasDragData: true,
                        zoombox: 'M269.5,114.5h-3v41h3ZM300.5,114.5h3v41h-3Z',
                        clipTranslate: [0, 0]
                    }))
                    .then(delay(step))
                    .then(_assert('during zoombox drag', {
                        nodeCnt: 5,
                        // N.B. x autorange for one more node
                        xrng: [-0.257, 4.257],
                        hasDragData: true,
                        zoombox: 'M269.5,114.5h-3v41h3ZM300.5,114.5h3v41h-3Z',
                        clipTranslate: [0, 0]
                    }))
                    .then(drag.end);
            })
            .then(_assert('just after zoombox drag', {
                nodeCnt: 5,
                xrng: [2, 2.2507],
                hasDragData: false,
                zoombox: false,
                clipTranslate: [0, 0]
            }))
            .then(delay(step))
            .then(function() {
                return Plotly.relayout(gd, {
                    dragmode: 'pan',
                    'xaxis.autorange': true,
                    'yaxis.autorange': true
                });
            })
            .then(delay(step))
            .then(_assert('after extendTraces two more steps / back to autorange:true', {
                nodeCnt: 7,
                xrng: [-0.385, 6.385],
                hasDragData: false,
                zoombox: false,
                clipTranslate: [0, 0]
            }))
            .then(function() {
                var drag = makeDragFns('xy', 'nsew', 60, 0);
                return drag.start()
                    .then(_assert('just after pan start', {
                        nodeCnt: 7,
                        xrng: [-1.137, 5.633],
                        hasDragData: true,
                        zoombox: false,
                        clipTranslate: [-60, 0]
                    }))
                    .then(delay(step))
                    .then(_assert('during pan mousedown', {
                        nodeCnt: 8,
                        xrng: [-1.327, 6.572],
                        hasDragData: true,
                        zoombox: false,
                        clipTranslate: [-60, 0]
                    }))
                    .then(drag.end);
            })
            .then(_assert('just after pan end', {
                nodeCnt: 8,
                // N.B same xrng as just before on dragend
                xrng: 'previous',
                hasDragData: false,
                zoombox: false,
                clipTranslate: [0, 0]
            }))
            .then(delay(step))
            .then(_assert('last extendTraces call', {
                nodeCnt: 9,
                // N.B. same range as previous assert
                // as now that xaxis range is set
                xrng: 'previous',
                hasDragData: false,
                zoombox: false,
                clipTranslate: [0, 0]
            }))
            .then(function() {
                clearInterval(interval);
                done();
            }, done.fail);
        });

        it('should handle plotly_relayout callback during drag interactions', function(done) {
            var step = 500;
            var relayoutTracker = [];
            var restyleTracker = [];
            var zCnt = 0;
            var xrngPrev;
            var yrngPrev;

            function z() {
                return [[1, 2, 3], [2, (zCnt++) * 5, 1], [3, 2, 1]];
            }

            function _assert(msg, exp) {
                return function() {
                    var trace = gd._fullData[0];
                    var fullLayout = gd._fullLayout;

                    expect(fullLayout.xaxis.range).toBeCloseToArray(exp.xrng === 'previous' ?
                        xrngPrev :
                        exp.xrng, 2, msg + '|xaxis range');
                    expect(fullLayout.yaxis.range).toBeCloseToArray(exp.yrng === 'previous' ?
                        yrngPrev :
                        exp.yrng, 2, msg + '|yaxis range');

                    expect(trace.zmax).toBe(exp.zmax, msg + '|zmax');
                    expect(Boolean(gd._dragdata)).toBe(exp.hasDragData, msg + '|has gd._dragdata?');
                    expect(relayoutTracker.length).toBe(exp.relayoutCnt, msg + '|relayout cnt');
                    expect(restyleTracker.length).toBe(exp.restyleCnt, msg + '|restyle cnt');
                    _assertZoombox(msg, exp);
                    _assertClipRect(msg, exp);

                    xrngPrev = fullLayout.xaxis.range.slice();
                    yrngPrev = fullLayout.yaxis.range.slice();
                };
            }

            Plotly.newPlot(gd, [{ type: 'heatmap', z: z() }], {dragmode: 'pan'})
            .then(function() {
                // inspired by https://github.com/plotly/plotly.js/issues/2687
                gd.on('plotly_relayout', function(d) {
                    relayoutTracker.unshift(d);
                    setTimeout(function() {
                        Plotly.restyle(gd, 'z', [z()]);
                    }, step);
                });
                gd.on('plotly_restyle', function(d) {
                    restyleTracker.unshift(d);
                });
            })
            .then(_assert('base', {
                zmax: 3,
                xrng: [-0.5, 2.5],
                yrng: [-0.5, 2.5],
                relayoutCnt: 0,
                restyleCnt: 0,
                hasDragData: false,
                zoombox: false,
                clipTranslate: [0, 0]
            }))
            .then(doDrag('xy', 'nsew', 30, 30))
            .then(_assert('after drag / before update #1', {
                zmax: 3,
                xrng: [-0.6707, 2.329],
                yrng: [-0.1666, 2.833],
                relayoutCnt: 1,
                restyleCnt: 0,
                hasDragData: false,
                zoombox: false,
                clipTranslate: [0, 0]
            }))
            .then(delay(step + 10))
            .then(_assert('after update #1', {
                zmax: 5,
                xrng: [-0.6707, 2.329],
                yrng: [-0.1666, 2.833],
                relayoutCnt: 1,
                restyleCnt: 1,
                hasDragData: false,
                zoombox: false,
                clipTranslate: [0, 0]
            }))
            .then(doDrag('xy', 'nsew', 30, 30))
            .then(delay(step / 2))
            .then(function() {
                var drag = makeDragFns('xy', 'nsew', 30, 30);
                return drag.start()
                    .then(_assert('just after pan start', {
                        zmax: 5,
                        xrng: [-1.005, 1.994],
                        yrng: [0.5, 3.5],
                        relayoutCnt: 2,
                        restyleCnt: 1,
                        hasDragData: true,
                        zoombox: false,
                        clipTranslate: [-30, -30]
                    }))
                    .then(delay(step))
                    .then(_assert('after update #2 / during pan mousedown', {
                        zmax: 10,
                        xrng: 'previous',
                        yrng: 'previous',
                        relayoutCnt: 2,
                        restyleCnt: 2,
                        hasDragData: true,
                        zoombox: false,
                        clipTranslate: [-30, -30]
                    }))
                    .then(drag.end);
            })
            .then(_assert('after pan end', {
                zmax: 10,
                xrng: 'previous',
                yrng: 'previous',
                relayoutCnt: 3,
                restyleCnt: 2,
                hasDragData: false,
                zoombox: false,
                clipTranslate: [0, 0]
            }))
            .then(delay(step))
            .then(_assert('after update #3', {
                zmax: 15,
                xrng: 'previous',
                yrng: 'previous',
                relayoutCnt: 3,
                restyleCnt: 3,
                hasDragData: false,
                zoombox: false,
                clipTranslate: [0, 0]
            }))
            .then(done, done.fail);
        });

        it('should handle react calls in plotly_selecting callback', function(done) {
            var selectingTracker = [];
            var selectedTracker = [];

            function _assert(msg, exp) {
                return function() {
                    var gd3 = d3Select(gd);

                    expect(gd3.selectAll('.point').size()).toBe(exp.nodeCnt, msg + '|pt cnt');
                    expect(Boolean(gd._dragdata)).toBe(exp.hasDragData, msg + '|has gd._dragdata?');
                    expect(selectingTracker.length).toBe(exp.selectingCnt, msg + '| selecting cnt');
                    expect(selectedTracker.length).toBe(exp.selectedCnt, msg + '| selected cnt');

                    var outline = d3Select('.zoomlayer > .select-outline');
                    if(outline.size()) {
                        expect(outline.attr('d')).toBe(exp.selectOutline, msg + '| selection outline path');
                    } else {
                        expect(false).toBe(exp.selectOutline, msg + '| no selection outline');
                    }
                };
            }

            var trace0 = {mode: 'markers', x: [1, 2, 3], y: [1, 2, 1], marker: {opacity: 0.5}};
            var trace1 = {mode: 'markers', x: [], y: [], marker: {size: 20}};

            var layout = {
                dragmode: 'select',
                showlegend: false,
                width: 400,
                height: 400,
                margin: {l: 0, r: 0, t: 0, b: 0}
            };

            Plotly.newPlot(gd, [trace0], layout)
            .then(function() {
                // inspired by https://github.com/plotly/plotly.js-crossfilter.js
                gd.on('plotly_selecting', function(d) {
                    selectingTracker.unshift(d);

                    if(d && d.points) {
                        trace1.x = d.points.map(function(p) { return trace0.x[p.pointNumber]; });
                        trace1.y = d.points.map(function(p) { return trace0.y[p.pointNumber]; });
                    } else {
                        trace1.x = [];
                        trace1.y = [];
                    }

                    Plotly.react(gd, [trace0, trace1], layout);
                });

                gd.on('plotly_selected', function(d) {
                    selectedTracker.unshift(d);
                    Plotly.react(gd, [trace0], layout);
                });
            })
            .then(_assert('base', {
                nodeCnt: 3,
                hasDragData: false,
                selectingCnt: 0,
                selectedCnt: 0,
                selectOutline: false
            }))
            .then(function() {
                var drag = makeDragFns('xy', 'nsew', 200, 200, 20, 20);
                return drag.start()
                    .then(_assert('just after pan start', {
                        nodeCnt: 4,
                        hasDragData: true,
                        selectingCnt: 1,
                        selectedCnt: 0,
                        selectOutline: 'M20,20L20,220L220,220L220,20Z'
                    }))
                    .then(delay(100))
                    .then(_assert('while holding on mouse', {
                        nodeCnt: 4,
                        hasDragData: true,
                        selectingCnt: 1,
                        selectedCnt: 0,
                        selectOutline: 'M20,20L20,220L220,220L220,20Z'
                    }))
                    .then(drag.end);
            })
            .then(_assert('after drag', {
                nodeCnt: 3,
                hasDragData: false,
                selectingCnt: 1,
                selectedCnt: 1,
                selectOutline: false
            }))
            .then(done, done.fail);
        });
    });

    it('zoomboxes during small drag motions', function(done) {
        var MINDRAG = constants.MINDRAG;
        var eventData = {};

        function _run(msg, dpos, exp) {
            return function() {
                var node = getDragger('xy', 'nsew');
                var fns = drag.makeFns({node: node, pos0: [200, 200], dpos: dpos});

                return fns.start().then(function() {
                    var zl = d3Select(gd).select('g.zoomlayer');
                    var d = zl.select('.zoombox-corners').attr('d');
                    if(exp === 'nozoom') {
                        expect(d).toBe('M0,0Z', 'blank path | ' + msg);
                    } else {
                        var actual = (d.match(/Z/g) || []).length;
                        if(exp === 'x-zoom' || exp === 'y-zoom') {
                            expect(actual).toBe(2, 'two corners | ' + msg);
                        } else if(exp === 'xy-zoom') {
                            expect(actual).toBe(4, 'four corners | ' + msg);
                        } else {
                            fail('wrong expectation str.');
                        }
                    }
                })
                .then(fns.end)
                .then(function() {
                    var keys = Object.keys(eventData);
                    if(exp === 'nozoom') {
                        expect(keys.length).toBe(0, 'no event data | ' + msg);
                    } else if(exp === 'x-zoom') {
                        expect(keys).withContext('relayout xaxis rng | ' + msg)
                            .toEqual(['xaxis.range[0]', 'xaxis.range[1]']);
                    } else if(exp === 'y-zoom') {
                        expect(keys).withContext('relayout yaxis rng | ' + msg)
                            .toEqual(['yaxis.range[0]', 'yaxis.range[1]']);
                    } else if(exp === 'xy-zoom') {
                        expect(keys.length).toBe(4, 'x and y relayout | ' + msg);
                    } else {
                        fail('wrong expectation str.');
                    }
                    eventData = {};
                });
            };
        }

        Plotly.newPlot(gd, [{y: [1, 2, 1]}], {width: 400, height: 400})
        .then(function() {
            gd.on('plotly_relayout', function(d) { eventData = d; });
        })
        .then(_run('dx < MINDRAG', [MINDRAG - 2, 0], 'nozoom'))
        .then(_run('dx > MINDRAG', [MINDRAG + 2, 0], 'x-zoom'))
        .then(_run('dy < MINDRAG', [0, MINDRAG - 2], 'nozoom'))
        .then(_run('dy > MINDRAG', [0, MINDRAG + 2], 'y-zoom'))
        .then(_run('(dx,dy) < MINDRAG', [MINDRAG - 2, MINDRAG - 2], 'nozoom'))
        .then(_run('(dx,dy) > MINDRAG', [MINDRAG + 2, MINDRAG + 2], 'xy-zoom'))
        .then(done, done.fail);
    });

    describe('with axis rangebreaks', function() {
        it('should compute correct range updates - x-axis case', function(done) {
            function _assert(msg, xrng) {
                expect(gd.layout.xaxis.range).toBeCloseToArray(xrng, 2, 'xrng - ' + msg);
            }

            Plotly.newPlot(gd, [{
                mode: 'lines',
                x: [
                    '1970-01-01 00:00:00.000',
                    '1970-01-01 00:00:00.010',
                    '1970-01-01 00:00:00.050',
                    '1970-01-01 00:00:00.090',
                    '1970-01-01 00:00:00.100',
                    '1970-01-01 00:00:00.150',
                    '1970-01-01 00:00:00.190',
                    '1970-01-01 00:00:00.200'
                ]
            }], {
                xaxis: {
                    rangebreaks: [
                        {bounds: [
                            '1970-01-01 00:00:00.011',
                            '1970-01-01 00:00:00.089'
                        ]},
                        {bounds: [
                            '1970-01-01 00:00:00.101',
                            '1970-01-01 00:00:00.189'
                        ]}
                    ]
                },
                dragmode: 'zoom'
            })
            .then(function() {
                _assert('base', [
                    '1970-01-01',
                    '1970-01-01 00:00:00.2'
                ]);
            })
            .then(doDrag('xy', 'nsew', 50, 0))
            // x range would be ~ [100, 118] w/o rangebreaks
            .then(function() {
                _assert('after x-only zoombox', [
                    '1970-01-01 00:00:00.095',
                    '1970-01-01 00:00:00.0981'
                ]);
            })
            .then(doDblClick('xy', 'nsew'))
            .then(function() {
                _assert('back to base', [
                    '1970-01-01',
                    '1970-01-01 00:00:00.2'
                ]);
            })
            .then(function() { return Plotly.relayout(gd, 'dragmode', 'pan'); })
            .then(doDrag('xy', 'nsew', 50, 0))
            // x range would be ~ [-18, 181] w/o rangebreaks
            .then(function() {
                _assert('after x-only pan', [
                    '1969-12-31 23:59:59.9969',
                    '1970-01-01 00:00:00.1969'
                ]);
            })
            .then(done, done.fail);
        });

        it('should compute correct range updates - y-axis case', function(done) {
            function _assert(msg, yrng) {
                expect(gd.layout.yaxis.range).toBeCloseToArray(yrng, 2, 'yrng - ' + msg);
            }

            Plotly.newPlot(gd, [{
                mode: 'lines',
                y: [
                    '1970-01-01 00:00:00.000',
                    '1970-01-01 00:00:00.010',
                    '1970-01-01 00:00:00.050',
                    '1970-01-01 00:00:00.090',
                    '1970-01-01 00:00:00.100',
                    '1970-01-01 00:00:00.150',
                    '1970-01-01 00:00:00.190',
                    '1970-01-01 00:00:00.200'
                ]
            }], {
                yaxis: {
                    rangebreaks: [
                        {bounds: [
                            '1970-01-01 00:00:00.011',
                            '1970-01-01 00:00:00.089'
                        ]},
                        {bounds: [
                            '1970-01-01 00:00:00.101',
                            '1970-01-01 00:00:00.189'
                        ]}
                    ]
                },
                dragmode: 'zoom'
            })
            .then(function() {
                _assert('base', [
                    '1969-12-31 23:59:59.9981',
                    '1970-01-01 00:00:00.2019'
                ]);
            })
            .then(doDrag('xy', 'nsew', 0, -50))
            // y range would be ~ [62, 100] w/o rangebreaks
            .then(function() {
                _assert('after y-only zoombox', [
                    '1970-01-01 00:00:00.01',
                    '1970-01-01 00:00:00.095'
                ]);
            })
            .then(doDblClick('xy', 'nsew'))
            .then(function() {
                _assert('back to base', [
                    '1969-12-31 23:59:59.9981',
                    '1970-01-01 00:00:00.2019'
                ]);
            })
            .then(function() { return Plotly.relayout(gd, 'dragmode', 'pan'); })
            .then(doDrag('xy', 'nsew', 0, -50))
            // y range would be ~ [35, 239] w/o rangebreaks
            .then(function() {
                _assert('after y-only pan', [
                    '1970-01-01 00:00:00.0051',
                    '1970-01-01 00:00:00.2089'
                ]);
            })
            .then(done, done.fail);
        });
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
        Plotly.newPlot(gd, [{
            y: [1, 2, 1],
            marker: {
                color: [20, 30, 10],
                colorbar: {
                    tickvals: [25],
                    ticktext: ['one single tick']
                }
            }
        }], {
            hovermode: 'x',
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
        .then(done, done.fail);
    });

    it('should have correct content for *heatmap* traces', function(done) {
        Plotly.newPlot(gd, [{
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
        .then(done, done.fail);
    });
});

describe('Cartesian plots with css transforms', function() {
    var gd;
    var eventRecordings = {};

    beforeEach(function() {
        eventRecordings = {};
        gd = createGraphDiv();
    });

    afterEach(destroyGraphDiv);

    function _getLocalPos(element, point) {
        var bb = element.getBoundingClientRect();
        return [
            bb.left + point[0],
            bb.top + point[1]
        ];
    }

    function transformPlot(gd, transformString) {
        gd.style.webkitTransform = transformString;
        gd.style.MozTransform = transformString;
        gd.style.msTransform = transformString;
        gd.style.OTransform = transformString;
        gd.style.transform = transformString;
    }

    function _drag(start, end) {
        var localStart = _getLocalPos(gd, start);
        var localEnd = _getLocalPos(gd, end);
        Lib.clearThrottle();
        mouseEvent('mousemove', localStart[0], localStart[1]);
        mouseEvent('mousedown', localStart[0], localStart[1]);
        mouseEvent('mousemove', localEnd[0], localEnd[1]);
    }

    function _dragRelease(start, end) {
        var localEnd = _getLocalPos(gd, end);
        _drag(start, end);
        mouseEvent('mouseup', localEnd[0], localEnd[1]);
    }

    function _hover(pos) {
        return new Promise(function(resolve, reject) {
            var localPos = _getLocalPos(gd, pos);
            gd.once('plotly_hover', function(d) {
                Lib.clearThrottle();
                resolve(d);
            });

            mouseEvent('mousemove', localPos[0], localPos[1]);

            setTimeout(function() {
                reject('plotly_hover did not get called!');
            }, 100);
        });
    }

    function _unhover(pos) {
        var localPos = _getLocalPos(gd, pos);
        mouseEvent('mouseout', localPos[0], localPos[1]);
    }

    var points = [[50, 180], [150, 180], [250, 180]];
    var xLabels = ['one', 'two', 'three'];
    var mock = {
        data: [{
            x: xLabels,
            y: [1, 2, 3],
            type: 'bar'
        }],
        layout: {
            width: 600,
            height: 400,
            margin: {l: 0, t: 0, r: 0, b: 0}
        }
    };

    var bbox = {
        one: { x0: 20, x1: 180, y0: 273.33, y1: 273.33 },
        two: { x0: 220, x1: 380, y0: 146.67, y1: 146.67 },
        three: { x0: 420, x1: 580, y0: 20, y1: 20 }
    };

    [{
        transform: 'scaleX(0.5)',
        hovered: 1,
        selected: {numPoints: 1, selectedLabels: ['two']}
    }, {
        transform: 'scale(0.5)',
        hovered: 1,
        selected: {numPoints: 2, selectedLabels: ['one', 'two']}
    }, {
        transform: 'scale(0.25) translate(150px, 25%) scaleY(2)',
        hovered: 1,
        selected: {numPoints: 3, selectedLabels: ['one', 'two', 'three']}
    }].forEach(function(t) {
        var transform = t.transform;
        it('hover behaves correctly after css transform: ' + transform, function(done) {
            var _bboxRecordings = {};

            function _hoverAndAssertEventOccurred(point, label) {
                return _hover(point)
                .then(function() {
                    expect(eventRecordings[label]).toBe(t.hovered);
                    expect(_bboxRecordings[label]).toEqual(bbox[label]);
                })
                .then(function() {
                    _unhover(point);
                });
            }

            Plotly.newPlot(gd, Lib.extendDeep({}, mock))
            .then(function() {
                transformPlot(gd, transform);

                gd.on('plotly_hover', function(d) {
                    eventRecordings[d.points[0].x] = 1;
                    _bboxRecordings[d.points[0].x] = d.points[0].bbox;
                });
            })
            .then(function() {_hoverAndAssertEventOccurred(points[0], xLabels[0]);})
            .then(function() {_hoverAndAssertEventOccurred(points[1], xLabels[1]);})
            .then(function() {_hoverAndAssertEventOccurred(points[2], xLabels[2]);})
            .then(done, done.fail);
        });

        it('drag-zoom behaves correctly after css transform: ' + transform, function(done) {
            // return a rect of form {left, top, width, height} from the zoomlayer
            // svg path.
            function _getZoomlayerPathRect(pathStr) {
                var rect = {};
                rect.height = Number(pathStr.split('v')[1].split('h')[0]);
                rect.width = Number(pathStr.split('h')[1].split('v')[0]);
                var startCoordsString = pathStr.split('M')[2].split('v')[0];
                rect.left = Number(startCoordsString.split(',')[0]);
                rect.top = Number(startCoordsString.split(',')[1]);
                return rect;
            }

            // asserts that the zoombox path must go from the start to end positions,
            // in css-transformed coordinates.
            function _assertTransformedZoombox(startPos, endPos) {
                startPos = Lib.apply3DTransform(gd._fullLayout._invTransform)(startPos[0], startPos[1]);
                endPos = Lib.apply3DTransform(gd._fullLayout._invTransform)(endPos[0], endPos[1]);
                var size = [endPos[0] - startPos[0], endPos[1] - startPos[1]];
                var zb = d3Select(gd).select('g.zoomlayer > path.zoombox');
                var zoomboxRect = _getZoomlayerPathRect(zb.attr('d'));
                expect(zoomboxRect.left).toBeCloseTo(startPos[0], -1);
                expect(zoomboxRect.top).toBeCloseTo(startPos[1]);
                expect(zoomboxRect.width).toBeCloseTo(size[0]);
                expect(zoomboxRect.height).toBeCloseTo(size[1]);
            }

            var start = [50, 50];
            var end = [150, 150];

            Plotly.newPlot(gd, Lib.extendDeep({}, mock))
            .then(function() {
                transformPlot(gd, transform);

                _drag(start, end);
            })
            .then(function() {
                _assertTransformedZoombox(start, end);
            })
            .then(function() { mouseEvent('mouseup', 0, 0); })
            .then(done, done.fail);
        });

        it('select behaves correctly after css transform: ' + transform, function(done) {
            function _assertSelected(expectation) {
                var data = gd._fullData[0];
                var points = data.selectedpoints;
                expect(typeof(points) !== 'undefined').toBeTrue();
                if(expectation.numPoints) {
                    expect(points.length).toBe(expectation.numPoints);
                }
                if(expectation.selectedLabels) {
                    var selectedLabels = points.map(function(i) { return data.x[i]; });
                    expect(selectedLabels).toEqual(expectation.selectedLabels);
                }
            }

            var start = [10, 10];
            var end = [200, 200];

            Plotly.newPlot(gd, Lib.extendDeep({}, mock))
            .then(function() {
                transformPlot(gd, transform);

                return Plotly.relayout(gd, 'dragmode', 'select');
            })
            .then(function() {
                _dragRelease(start, end);
            })
            .then(function() {
                _assertSelected(t.selected);
            })
            .then(done, done.fail);
        });
    });
});

describe('Cartesian taces with zorder', function() {
    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(destroyGraphDiv);

    var data0 = [
        {x: [1, 2], y: [1, 1], type: 'scatter', marker: {size: 10}, zorder: 10},
        {x: [1, 2], y: [1, 2], type: 'scatter', marker: {size: 30}},
        {x: [1, 2], y: [1, 3], type: 'scatter', marker: {size: 20}, zorder: 5}
    ];

    var data1 = [
        {x: [1, 2], y: [1, 1], type: 'scatter', marker: {size: 10}},
        {x: [1, 2], y: [1, 2], type: 'scatter', marker: {size: 30}, zorder: -5},
        {x: [1, 2], y: [1, 3], type: 'scatter', marker: {size: 20}, zorder: 10},
    ];

    var barData = [
        {x: [1, 2], y: [2, 4], type: 'bar'},
        {x: [1, 2], y: [4, 2], type: 'bar', zorder: -10}
    ];

    function fig(data) {
        return {
            data: data,
            layout: {
                width: 400, height: 400
            }
        };
    }

    function assertZIndices(data, expectedData) {
        for(var i = 0; i < data.length; i++) {
            var zorder = expectedData[i].zorder ? expectedData[i].zorder : 0;
            expect(data[i].zorder).toEqual(zorder);
        }
    }

    function assertZIndicesSorted(data) {
        var prevZIndex;
        expect(data.length).toBeGreaterThan(0);
        for(var i = 0; i < data.length; i++) {
            var currentZIndex = data[i].__data__.zorder;
            if(prevZIndex !== undefined) {
                expect(currentZIndex).toBeGreaterThanOrEqual(prevZIndex);
            }
            prevZIndex = currentZIndex;
        }
    }

    it('should be able to update and remove layers for scatter traces in respect to zorder', function(done) {
        Plotly.newPlot(gd, fig(data0))
        .then(function() {
            var data = gd._fullData;
            assertZIndices(data, data0);
        })
        .then(function() {
            return Plotly.react(gd, fig(data1));
        })
        .then(function() {
            var data = gd._fullData;
            assertZIndices(data, data1);
        })
        .then(function() {
            return Plotly.react(gd, fig(barData));
        })
        .then(function() {
            var data = gd._fullData;
            assertZIndices(data, barData);
            var scatterTraces = d3SelectAll('g[class^="scatterlayer"]')[0];
            expect(scatterTraces.length).toBe(0);
            var barTraces = d3SelectAll('g[class^="barlayer"]')[0];
            expect(barTraces.length).toBe(2);
        })
        .then(function() {
            return Plotly.react(gd, fig(barData.concat(data0)));
        })
        .then(function() {
            var data = gd._fullData;
            assertZIndices(data, barData.concat(data0));
            var scatterTraces = d3SelectAll('g[class^="scatterlayer"]')[0];
            expect(scatterTraces.length).toBe(3);
            var barTraces = d3SelectAll('g[class^="barlayer"]')[0];
            expect(barTraces.length).toBe(2);
        })
        .then(done, done.fail);
    });

    it('should display traces in ascending order', function(done) {
        Plotly.newPlot(gd, fig(data0))
        .then(function() {
            var tracesData = d3SelectAll('g[class^="scatterlayer"]');
            assertZIndicesSorted(tracesData[0]);
        })
        .then(function() {
            return Plotly.react(gd, fig(data1));
        })
        .then(function() {
            var tracesData = d3SelectAll('g[class^="scatterlayer"]');
            assertZIndicesSorted(tracesData[0]);
        })
        .then(done, done.fail);
    });

    it('should display traces in ascending zorder order after restyle', function(done) {
        Plotly.newPlot(gd, fig(data0))
        .then(function() {
            var tracesData = d3SelectAll('g[class^="scatterlayer"]');
            var data = gd._fullData;
            assertZIndices(data, data0);
            assertZIndicesSorted(tracesData[0]);
        })
        .then(function() {
            return Plotly.restyle(gd, 'marker.size', 20);
        })
        .then(function() {
            var tracesData = d3SelectAll('g[class^="scatterlayer"]');
            var data = gd._fullData;
            assertZIndices(data, data0);
            assertZIndicesSorted(tracesData[0]);
        })
        .then(function() {
            return Plotly.react(gd, fig(data1));
        })
        .then(function() {
            var tracesData = d3SelectAll('g[class^="scatterlayer"]');
            var data = gd._fullData;
            assertZIndices(data, data1);
            assertZIndicesSorted(tracesData[0]);
        })
        .then(function() {
            return Plotly.restyle(gd, 'marker.size', 20);
        })
        .then(function() {
            var tracesData = d3SelectAll('g[class^="scatterlayer"]');
            var data = gd._fullData;
            assertZIndices(data, data1);
            assertZIndicesSorted(tracesData[0]);
        })
        .then(done, done.fail);
    });

    ['bar', 'waterfall', 'funnel'].forEach(function(traceType) {
        it('should display ' + traceType + ' traces in ascending order', function(done) {
            var _Data = [
                {x: [1, 2], y: [2, 4], type: traceType},
                {x: [1, 2], y: [4, 2], type: traceType, zorder: -10}
            ];
            var _Class = 'g[class^="' + traceType + 'layer"]';
            Plotly.newPlot(gd, fig(_Data))
            .then(function() {
                var data = gd._fullData;
                assertZIndices(data, _Data);
                var tracesData = d3SelectAll(_Class);
                assertZIndicesSorted(tracesData[0]);
            })
            .then(function() {
                return Plotly.restyle(gd, 'barmode', 'overlay');
            })
            .then(function() {
                var tracesData = d3SelectAll(_Class);
                assertZIndicesSorted(tracesData[0]);
            })
            .then(function() {
                return Plotly.restyle(gd, 'barmode', 'stack');
            })
            .then(function() {
                var tracesData = d3SelectAll(_Class);
                assertZIndicesSorted(tracesData[0]);
            })
            .then(done, done.fail);
        });
    });
});
