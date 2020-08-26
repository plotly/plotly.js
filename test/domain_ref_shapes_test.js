var Plotly = require('../lib/index');
var d3 = require('d3');
var createGraphDiv = require('../test/jasmine/assets/create_graph_div');
var destroyGraphDiv = require('../test/jasmine/assets/destroy_graph_div');
var pixelCalc = require('../test/jasmine/assets/pixel_calc');
var getSVGElemScreenBBox = require('../test/jasmine/assets/get_svg_elem_screen_bbox');
var Lib = require('../src/lib');
var Axes = require('../src/plots/cartesian/axes');
var axisIds = require('../src/plots/cartesian/axis_ids');

// NOTE: this tolerance is in pixels
var EQUALITY_TOLERANCE = 1e-2;

var DEBUG = true;

var it = function(s,f) {
    console.log('testing ' + s);
    f(function() { console.log(s + ' is done.'); });
}

// acts on an Object representing a shape which could be a line or a rect
function shapeFromShapePos(shape,axletter,axnum,shapepos) {
    shape[axletter+'0'] = shapepos.value[0];
    shape[axletter+'1'] = shapepos.value[1];
    if (shapepos.ref === 'range') {
        shape[axletter+'ref'] = axletter + axnum;
    } else if (shapepos.ref === 'domain') {
        shape[axletter+'ref'] = axletter + axnum + ' domain';
    } else if (shapepos.ref === 'paper') {
        shape[axletter+'ref'] = 'paper';
    }
}

// axid is e.g., 'x', 'y2' etc.
function logAxisIfAxType(layoutIn,layoutOut,axid,axtype) {
    if (axtype === 'log') {
        var axname = axisIds.id2name(axid);
        var axis = {...layoutIn[axname]};
        axis.type = 'log';
        axis.range = axis.range.map(Math.log10);
        layoutOut[axname] = axis;
    }
}


// axref can be xref or yref
// c can be x0, x1, y0, y1
function mapShapeCoordToPixel(layout,axref,shape,c) {
    var reftype = Axes.getRefType(shape[axref]);
    var axletter = axref[0];
    var ret;
    if (reftype === 'range') {
        var axis = axisIds.id2name(shape[axref]);
        ret = pixelCalc.mapRangeToPixel(layout, axis, shape[c]);
    } else if (reftype === 'domain') {
        var axis = axisIds.id2name(shape[axref]);
        ret = pixelCalc.mapDomainToPixel(layout, axis, shape[c]);
    } else if (reftype === 'paper') {
        var axis = axref[0];
        ret = pixelCalc.mapPaperToPixel(layout, axis, shape[c]);
    }
    return ret;
}

// compute the bounding box of the shape so that it can be compared with the SVG
// bounding box
function shapeToBBox(layout,shape) {
    var bbox = {};
    var x1;
    var y1;
    // map x coordinates
    bbox.x = mapShapeCoordToPixel(layout,'xref',shape,'x0');
    x1 = mapShapeCoordToPixel(layout,'xref',shape,'x1');
    // SVG bounding boxes have x,y referring to top left corner, but here we are
    // specifying shapes where y0 refers to the bottom left corner like
    // Plotly.js, so we swap y0 and y1
    bbox.y = mapShapeCoordToPixel(layout,'yref',shape,'y1');
    y1 = mapShapeCoordToPixel(layout,'yref',shape,'y0');
    bbox.width = x1 - bbox.x;
    bbox.height = y1 - bbox.y;
    return bbox;
}

function coordsEq(a,b) {
    return Math.abs(a - b) < EQUALITY_TOLERANCE;
}

function compareBBoxes(a,b) {
    return ['x','y','width','height'].map(
            (k,)=>coordsEq(a[k],b[k])).reduce(
            (l,r)=>l&&r,
            true);
}

// gets the SVG bounding box of the shape and checks it against what mapToPixel
// gives
function checkShapePosition(gd,shape) {
    var shapePath = d3.selectAll('path').filter(function () {
        return this.style.stroke === shape.line.color;
    }).node();
    var shapePathBBox = getSVGElemScreenBBox(shapePath);
    var shapeBBox = shapeToBBox(gd.layout,shape);
    var ret = compareBBoxes(shapeBBox,shapePathBBox);
    if (DEBUG) {
        console.log('SVG BBox',shapePathBBox);
        console.log('shape BBox',shapeBBox);
    }
    return ret;
}

// some made-up values for testing
var shapePositionsX = [
    {
        // shapes referring to data
        ref: 'range',
        // two values for rects
        value: [2,3]
    },
    {
        // shapes referring to domains
        ref: 'domain',
        value: [0.2,0.75],
    },
    {
        // shapes referring to paper
        ref: 'paper',
        value: [0.25, 0.8]
    }
];
var shapePositionsY = [
    {
        // shapes referring to data
        ref: 'range',
        // two values for rects
        value: [1,2]
    },
    {
        // shapes referring to domains
        ref: 'domain',
        value: [0.25,0.7],
    },
    {
        // shapes referring to paper
        ref: 'paper',
        value: [0.2, 0.85]
    }
];
var axisTypes = [ 'linear', 'log' ];
// Test on 'x', 'y', 'x2', 'y2' axes
// TODO the 'paper' position references are tested twice when once would
// suffice.
var axNum = ['','2'];
// only test line and rect for now
var shapeType = ['line','rect'];
// this color chosen so it can easily be found with d3
var shapeColor = 'rgb(50, 100, 150)';
var testDomRefShapeCombo = function(combo) {
        var xAxNum    = combo[0];
        var xaxisType = combo[1];
        var xshapePos = combo[2];
        var yAxNum    = combo[3];
        var yaxisType = combo[4];
        var yshapePos = combo[5];
        var shapeType = combo[6];
        it('should draw a ' + shapeType
           + ' for x' + xAxNum + ' of type '
           + xaxisType
           + ' with a value referencing '
           + xshapePos.ref
           + ' and for y' + yAxNum + ' of type '
           + yaxisType
           + ' with a value referencing '
           + yshapePos.ref,
            function (done) {
                var gd = createGraphDiv();
                var mock = Lib.extendDeep({},
                        require('../test/image/mocks/domain_ref_base.json'));
                if (DEBUG) {
                    console.log(combo);
                }
                Plotly.newPlot(gd, mock)
                var shape = {
                    type: shapeType,
                    line: { color: shapeColor }
                };
                shapeFromShapePos(shape,'x',xAxNum,xshapePos);
                shapeFromShapePos(shape,'y',yAxNum,yshapePos);
                var layout = {shapes: [shape]};
                // change to log axes if need be
                logAxisIfAxType(gd.layout,layout,'x'+xAxNum,xaxisType);
                logAxisIfAxType(gd.layout,layout,'y'+yAxNum,yaxisType);
                Plotly.relayout(gd,layout);
                console.log(checkShapePosition(gd,shape));
                destroyGraphDiv();
            });
}

// Test correct shape positions
function test_correct_shape_positions () {
    var iterable = require('extra-iterable');
    // for both x and y axes
    var testCombos = [...iterable.cartesianProduct([
        axNum,axisTypes,shapePositionsX,axNum,axisTypes,shapePositionsY,shapeType
    ])];
    // map all the combinations to a shape definition and check this shape is
    // placed properly
    testCombos.forEach(testDomRefShapeCombo);
}

test_correct_shape_positions();
