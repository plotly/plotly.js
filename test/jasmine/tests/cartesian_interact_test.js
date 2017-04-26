var d3 = require('d3');

var Plotly = require('@lib/index');
var Lib = require('@src/lib');
var constants = require('@src/plots/cartesian/constants');

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var mouseEvent = require('../assets/mouse_event');
var failTest = require('../assets/fail_test');
var customMatchers = require('../assets/custom_matchers');
var selectButton = require('../assets/modebar_button');
var drag = require('../assets/drag');
var doubleClick = require('../assets/double_click');
var getNodeCoords = require('../assets/get_node_coords');
var delay = require('../assets/delay');

var MODEBAR_DELAY = 500;

describe('zoom box element', function() {
  var mock = require('@mocks/14.json');

  var gd;
  beforeEach(function(done) {
    gd = createGraphDiv();

    var mockCopy = Lib.extendDeep({}, mock);
    mockCopy.layout.dragmode = 'zoom';

    Plotly.plot(gd, mockCopy.data, mockCopy.layout).then(done);
  });

  afterEach(destroyGraphDiv);

  it('should be appended to the zoom layer', function() {
    var x0 = 100;
    var y0 = 200;
    var x1 = 150;
    var y1 = 200;

    mouseEvent('mousemove', x0, y0);
    expect(d3.selectAll('.zoomlayer > .zoombox').size()).toEqual(0);
    expect(d3.selectAll('.zoomlayer > .zoombox-corners').size()).toEqual(0);

    mouseEvent('mousedown', x0, y0);
    mouseEvent('mousemove', x1, y1);
    expect(d3.selectAll('.zoomlayer > .zoombox').size()).toEqual(1);
    expect(d3.selectAll('.zoomlayer > .zoombox-corners').size()).toEqual(1);

    mouseEvent('mouseup', x1, y1);
    expect(d3.selectAll('.zoomlayer > .zoombox').size()).toEqual(0);
    expect(d3.selectAll('.zoomlayer > .zoombox-corners').size()).toEqual(0);
  });
});

describe('main plot pan', function() {
  var mock = require('@mocks/10.json'), gd, modeBar, relayoutCallback;

  beforeEach(function(done) {
    gd = createGraphDiv();

    Plotly.plot(gd, mock.data, mock.layout).then(function() {
      modeBar = gd._fullLayout._modeBar;
      relayoutCallback = jasmine.createSpy('relayoutCallback');

      gd.on('plotly_relayout', relayoutCallback);

      done();
    });
  });

  afterEach(destroyGraphDiv);

  it('should respond to pan interactions', function(done) {
    jasmine.addMatchers(customMatchers);

    var precision = 5;

    var buttonPan = selectButton(modeBar, 'pan2d');

    var originalX = [-0.6225, 5.5];
    var originalY = [-1.6340975059013805, 7.166241526218911];

    var newX = [-2.0255729166666665, 4.096927083333333];
    var newY = [-0.3769062155984817, 8.42343281652181];

    expect(gd.layout.xaxis.range).toBeCloseToArray(originalX, precision);
    expect(gd.layout.yaxis.range).toBeCloseToArray(originalY, precision);

    // Switch to pan mode
    expect(buttonPan.isActive()).toBe(false); // initially, zoom is active
    buttonPan.click();
    expect(buttonPan.isActive()).toBe(true); // switched on dragmode

    // Switching mode must not change visible range
    expect(gd.layout.xaxis.range).toBeCloseToArray(originalX, precision);
    expect(gd.layout.yaxis.range).toBeCloseToArray(originalY, precision);

    setTimeout(function() {
      expect(relayoutCallback).toHaveBeenCalledTimes(1);
      relayoutCallback.calls.reset();

      // Drag scene along the X axis

      mouseEvent('mousedown', 110, 150);
      mouseEvent('mousemove', 220, 150);
      mouseEvent('mouseup', 220, 150);

      expect(gd.layout.xaxis.range).toBeCloseToArray(newX, precision);
      expect(gd.layout.yaxis.range).toBeCloseToArray(originalY, precision);

      // Drag scene back along the X axis (not from the same starting point but same X delta)

      mouseEvent('mousedown', 280, 150);
      mouseEvent('mousemove', 170, 150);
      mouseEvent('mouseup', 170, 150);

      expect(gd.layout.xaxis.range).toBeCloseToArray(originalX, precision);
      expect(gd.layout.yaxis.range).toBeCloseToArray(originalY, precision);

      // Drag scene along the Y axis

      mouseEvent('mousedown', 110, 150);
      mouseEvent('mousemove', 110, 190);
      mouseEvent('mouseup', 110, 190);

      expect(gd.layout.xaxis.range).toBeCloseToArray(originalX, precision);
      expect(gd.layout.yaxis.range).toBeCloseToArray(newY, precision);

      // Drag scene back along the Y axis (not from the same starting point but same Y delta)

      mouseEvent('mousedown', 280, 130);
      mouseEvent('mousemove', 280, 90);
      mouseEvent('mouseup', 280, 90);

      expect(gd.layout.xaxis.range).toBeCloseToArray(originalX, precision);
      expect(gd.layout.yaxis.range).toBeCloseToArray(originalY, precision);

      // Drag scene along both the X and Y axis

      mouseEvent('mousedown', 110, 150);
      mouseEvent('mousemove', 220, 190);
      mouseEvent('mouseup', 220, 190);

      expect(gd.layout.xaxis.range).toBeCloseToArray(newX, precision);
      expect(gd.layout.yaxis.range).toBeCloseToArray(newY, precision);

      // Drag scene back along the X and Y axis (not from the same starting point but same delta vector)

      mouseEvent('mousedown', 280, 130);
      mouseEvent('mousemove', 170, 90);
      mouseEvent('mouseup', 170, 90);

      expect(gd.layout.xaxis.range).toBeCloseToArray(originalX, precision);
      expect(gd.layout.yaxis.range).toBeCloseToArray(originalY, precision);

      setTimeout(function() {
        expect(relayoutCallback).toHaveBeenCalledTimes(6); // X and back; Y and back; XY and back

        done();
      }, MODEBAR_DELAY);
    }, MODEBAR_DELAY);
  });
});

describe('axis zoom/pan and main plot zoom', function() {
  var gd;

  beforeEach(function() {
    gd = createGraphDiv();
    jasmine.addMatchers(customMatchers);
  });

  afterEach(destroyGraphDiv);

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
      { y: [0, 1, 2] },
      { y: [0, 1, 2], xaxis: 'x2' },
      { y: [0, 1, 2], yaxis: 'y2' },
      { y: [0, 1, 2], xaxis: 'x3', yaxis: 'y3' },
    ];

    var layout = {
      width: 700,
      height: 620,
      margin: { l: 100, r: 100, t: 20, b: 100 },
      showlegend: false,
      xaxis: { domain: [0, 0.4], range: [0, 2] },
      yaxis: { domain: [0.15, 0.55], range: [0, 2] },
      xaxis2: { domain: [0.6, 1], range: [0, 2] },
      yaxis2: { domain: [0.6, 1], range: [0, 2] },
      xaxis3: { domain: [0.6, 1], range: [0, 2], anchor: 'y3' },
      yaxis3: { domain: [0.6, 1], range: [0, 2], anchor: 'x3' },
    };

    var config = { scrollZoom: true };

    if (constrainScales) {
      layout.yaxis.scaleanchor = 'x';
      layout.yaxis2.scaleanchor = 'x';
      layout.xaxis2.scaleanchor = 'y';
      layout.yaxis3.scaleanchor = 'x3';
    }

    if (layoutEdits) Lib.extendDeep(layout, layoutEdits);

    return Plotly.newPlot(gd, data, layout, config).then(function() {
      [
        'xaxis',
        'yaxis',
        'xaxis2',
        'yaxis2',
        'xaxis3',
        'yaxis3',
      ].forEach(function(axName) {
        expect(gd._fullLayout[axName].range).toEqual(initialRange);
      });

      expect(Object.keys(gd._fullLayout._plots)).toEqual([
        'xy',
        'xy2',
        'x2y',
        'x3y3',
      ]);

      // nsew, n, ns, s, w, ew, e, ne, nw, se, sw
      expect(document.querySelectorAll('.drag[data-subplot="xy"]').length).toBe(
        11
      );
      // same but no w, ew, e because x is on xy only
      expect(
        document.querySelectorAll('.drag[data-subplot="xy2"]').length
      ).toBe(8);
      // y is on xy only so no n, ns, s
      expect(
        document.querySelectorAll('.drag[data-subplot="x2y"]').length
      ).toBe(8);
      // all 11, as this is a fully independent subplot
      expect(
        document.querySelectorAll('.drag[data-subplot="x3y3"]').length
      ).toBe(11);
    });
  }

  function getDragger(subplot, directions) {
    return document.querySelector(
      '.' + directions + 'drag[data-subplot="' + subplot + '"]'
    );
  }

  function doDrag(subplot, directions, dx, dy) {
    return function() {
      var dragger = getDragger(subplot, directions);
      return drag(dragger, dx, dy);
    };
  }

  function doDblClick(subplot, directions) {
    return function() {
      return doubleClick(getDragger(subplot, directions));
    };
  }

  function checkRanges(newRanges) {
    return function() {
      var allRanges = {
        xaxis: initialRange.slice(),
        yaxis: initialRange.slice(),
        xaxis2: initialRange.slice(),
        yaxis2: initialRange.slice(),
        xaxis3: initialRange.slice(),
        yaxis3: initialRange.slice(),
      };
      Lib.extendDeep(allRanges, newRanges);

      for (var axName in allRanges) {
        expect(gd.layout[axName].range).toBeCloseToArray(
          allRanges[axName],
          3,
          axName
        );
        expect(gd._fullLayout[axName].range).toBeCloseToArray(
          gd.layout[axName].range,
          6,
          axName
        );
      }
    };
  }

  it('updates with correlated subplots & no constraints - zoom, dblclick, axis ends', function(
    done
  ) {
    makePlot()
      // zoombox into a small point - drag starts from the center unless you specify otherwise
      .then(doDrag('xy', 'nsew', 100, -50))
      .then(checkRanges({ xaxis: [1, 2], yaxis: [1, 1.5] }))
      // first dblclick reverts to saved ranges
      .then(doDblClick('xy', 'nsew'))
      .then(checkRanges())
      // next dblclick autoscales (just that plot)
      .then(doDblClick('xy', 'nsew'))
      .then(checkRanges({ xaxis: autoRange, yaxis: autoRange }))
      // dblclick on one axis reverts just that axis to saved
      .then(doDblClick('xy', 'ns'))
      .then(checkRanges({ xaxis: autoRange }))
      // dblclick the plot at this point (one axis default, the other autoscaled)
      // and the whole thing is reverted to default
      .then(doDblClick('xy', 'nsew'))
      .then(checkRanges())
      // 1D zoombox - use the linked subplots
      .then(doDrag('xy2', 'nsew', -100, 0))
      .then(checkRanges({ xaxis: [0, 1] }))
      .then(doDrag('x2y', 'nsew', 0, 50))
      .then(checkRanges({ xaxis: [0, 1], yaxis: [0.5, 1] }))
      // dblclick on linked subplots just changes the linked axis
      .then(doDblClick('xy2', 'nsew'))
      .then(checkRanges({ yaxis: [0.5, 1] }))
      .then(doDblClick('x2y', 'nsew'))
      .then(checkRanges())
      // drag on axis ends - all these 1D draggers the opposite axis delta is irrelevant
      .then(doDrag('xy2', 'n', 53, 100))
      .then(checkRanges({ yaxis2: [0, 4] }))
      .then(doDrag('xy', 's', 53, -100))
      .then(checkRanges({ yaxis: [-2, 2], yaxis2: [0, 4] }))
      // expanding drag is highly nonlinear
      .then(doDrag('x2y', 'e', 50, 53))
      .then(
        checkRanges({ yaxis: [-2, 2], yaxis2: [0, 4], xaxis2: [0, 0.8751] })
      )
      .then(doDrag('x2y', 'w', -50, 53))
      .then(
        checkRanges({
          yaxis: [-2, 2],
          yaxis2: [0, 4],
          xaxis2: [0.4922, 0.8751],
        })
      )
      // reset all from the modebar
      .then(function() {
        selectButton(gd._fullLayout._modeBar, 'resetScale2d').click();
      })
      .then(checkRanges())
      .catch(failTest)
      .then(done);
  });

  it('updates with correlated subplots & no constraints - middles, corners, and scrollwheel', function(
    done
  ) {
    makePlot()
      // drag axis middles
      .then(doDrag('x3y3', 'ew', 100, 0))
      .then(checkRanges({ xaxis3: [-1, 1] }))
      .then(doDrag('x3y3', 'ns', 53, 100))
      .then(checkRanges({ xaxis3: [-1, 1], yaxis3: [1, 3] }))
      // drag corners
      .then(doDrag('x3y3', 'ne', -100, 100))
      .then(checkRanges({ xaxis3: [-1, 3], yaxis3: [1, 5] }))
      .then(doDrag('x3y3', 'sw', 100, -100))
      .then(checkRanges({ xaxis3: [-5, 3], yaxis3: [-3, 5] }))
      .then(doDrag('x3y3', 'nw', -50, -50))
      .then(checkRanges({ xaxis3: [-0.5006, 3], yaxis3: [-3, 0.5006] }))
      .then(doDrag('x3y3', 'se', 50, 50))
      .then(
        checkRanges({ xaxis3: [-0.5006, 1.0312], yaxis3: [-1.0312, 0.5006] })
      )
      .then(doDblClick('x3y3', 'nsew'))
      .then(checkRanges())
      // scroll wheel
      .then(function() {
        var mainDrag = getDragger('xy', 'nsew');
        var mainDragCoords = getNodeCoords(mainDrag, 'se');
        mouseEvent('scroll', mainDragCoords.x, mainDragCoords.y, {
          deltaY: 20,
          element: mainDrag,
        });
      })
      .then(delay(constants.REDRAWDELAY + 10))
      .then(checkRanges({ xaxis: [-0.4428, 2], yaxis: [0, 2.4428] }))
      .then(function() {
        var ewDrag = getDragger('xy', 'ew');
        var ewDragCoords = getNodeCoords(ewDrag);
        mouseEvent('scroll', ewDragCoords.x - 50, ewDragCoords.y, {
          deltaY: -20,
          element: ewDrag,
        });
      })
      .then(delay(constants.REDRAWDELAY + 10))
      .then(checkRanges({ xaxis: [-0.3321, 1.6679], yaxis: [0, 2.4428] }))
      .then(function() {
        var nsDrag = getDragger('xy', 'ns');
        var nsDragCoords = getNodeCoords(nsDrag);
        mouseEvent('scroll', nsDragCoords.x, nsDragCoords.y - 50, {
          deltaY: -20,
          element: nsDrag,
        });
      })
      .then(delay(constants.REDRAWDELAY + 10))
      .then(checkRanges({ xaxis: [-0.3321, 1.6679], yaxis: [0.3321, 2.3321] }))
      .catch(failTest)
      .then(done);
  });

  it('updates linked axes when there are constraints', function(done) {
    makePlot(true)
      // zoombox - this *would* be 1D (dy=-1) but that's not allowed
      .then(doDrag('xy', 'nsew', 100, -1))
      .then(
        checkRanges({
          xaxis: [1, 2],
          yaxis: [1, 2],
          xaxis2: [0.5, 1.5],
          yaxis2: [0.5, 1.5],
        })
      )
      // first dblclick reverts to saved ranges
      .then(doDblClick('xy', 'nsew'))
      .then(checkRanges())
      // next dblclick autoscales ALL linked plots
      .then(doDblClick('xy', 'ns'))
      .then(
        checkRanges({
          xaxis: autoRange,
          yaxis: autoRange,
          xaxis2: autoRange,
          yaxis2: autoRange,
        })
      )
      // revert again
      .then(doDblClick('xy', 'nsew'))
      .then(checkRanges())
      // corner drag - full distance in one direction and no shift in the other gets averaged
      // into half distance in each
      .then(doDrag('xy', 'ne', -200, 0))
      .then(
        checkRanges({
          xaxis: [0, 4],
          yaxis: [0, 4],
          xaxis2: [-1, 3],
          yaxis2: [-1, 3],
        })
      )
      // drag one end
      .then(doDrag('xy', 's', 53, -100))
      .then(
        checkRanges({
          xaxis: [-2, 6],
          yaxis: [-4, 4],
          xaxis2: [-3, 5],
          yaxis2: [-3, 5],
        })
      )
      // middle of an axis
      .then(doDrag('xy', 'ew', -100, 53))
      .then(
        checkRanges({
          xaxis: [2, 10],
          yaxis: [-4, 4],
          xaxis2: [-3, 5],
          yaxis2: [-3, 5],
        })
      )
      // revert again
      .then(doDblClick('xy', 'nsew'))
      .then(checkRanges())
      // scroll wheel
      .then(function() {
        var mainDrag = getDragger('xy', 'nsew');
        var mainDragCoords = getNodeCoords(mainDrag, 'se');
        mouseEvent('scroll', mainDragCoords.x, mainDragCoords.y, {
          deltaY: 20,
          element: mainDrag,
        });
      })
      .then(delay(constants.REDRAWDELAY + 10))
      .then(
        checkRanges({
          xaxis: [-0.4428, 2],
          yaxis: [0, 2.4428],
          xaxis2: [-0.2214, 2.2214],
          yaxis2: [-0.2214, 2.2214],
        })
      )
      .then(function() {
        var ewDrag = getDragger('xy', 'ew');
        var ewDragCoords = getNodeCoords(ewDrag);
        mouseEvent('scroll', ewDragCoords.x - 50, ewDragCoords.y, {
          deltaY: -20,
          element: ewDrag,
        });
      })
      .then(delay(constants.REDRAWDELAY + 10))
      .then(checkRanges({ xaxis: [-0.3321, 1.6679], yaxis: [0.2214, 2.2214] }))
      .catch(failTest)
      .then(done);
  });
});
