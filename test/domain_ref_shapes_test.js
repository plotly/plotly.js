// Test the placement of Axis Referencing Objects (AROs)

var Plotly = require('../lib/index');
var d3 = require('d3');
var createGraphDiv = require('../test/jasmine/assets/create_graph_div');
var destroyGraphDiv = require('../test/jasmine/assets/destroy_graph_div');
var pixelCalc = require('../test/jasmine/assets/pixel_calc');
var getSVGElemScreenBBox = require('../test/jasmine/assets/get_svg_elem_screen_bbox');
var Lib = require('../src/lib');
var Axes = require('../src/plots/cartesian/axes');
var axisIds = require('../src/plots/cartesian/axis_ids');
var testImage = 'https://images.plot.ly/language-icons/api-home/js-logo.png';

// NOTE: this tolerance is in pixels
var EQUALITY_TOLERANCE = 1e-2;

var DEBUG = true;

var it = function(s,f) {
    console.log('testing ' + s);
    f(function() { console.log(s + ' is done.'); });
}

// acts on an Object representing a aro which could be a line or a rect
// DEPRECATED
function aroFromAROPos(aro,axletter,axnum,aropos) {
    aro[axletter+'0'] = aropos.value[0];
    aro[axletter+'1'] = aropos.value[1];
    if (aropos.ref === 'range') {
        aro[axletter+'ref'] = axletter + axnum;
    } else if (aropos.ref === 'domain') {
        aro[axletter+'ref'] = axletter + axnum + ' domain';
    } else if (aropos.ref === 'paper') {
        aro[axletter+'ref'] = 'paper';
    }
}

// set common parameters of an ARO
// {aro} is the object whose parameters to set
// {axletter} is the axis, x or y
// {axnum} is the axis number
// {value} is the value of the first coordinate (e.g., x0 if axletter is x)
// {ref} is ['range'|'domain'|'paper']
function aroSetCommonParams(aro,axletter,axnum,value,ref) {
    aro[axletter+'0'] = value;
    if (ref === 'range') {
        aro[axletter+'ref'] = axletter + axnum;
    } else if (aropos.ref === 'domain') {
        aro[axletter+'ref'] = axletter + axnum + ' domain';
    } else if (aropos.ref === 'paper') {
        aro[axletter+'ref'] = 'paper';
    }
}

// shape, annotation and image all take x0, y0, xref, yref, color parameters
// arotype can be 'shape', 'annotation', or 'image'
// shapes take type=[line|rect], x1, y1
// annotations take ax, ay, axref, ayref, (text is just set to "A" and xanchor
// and yanchor are always set to left because these are text attributes which we
// don't test)
// images take xsize, ysize, xanchor, yanchor (sizing is set to stretch for simplicity
// in computing the bounding box and source is something predetermined)
function aroFromParams(arotype,x0,y0,xreftype,yreftype,xaxnum,yaxnum,color,opts) {
    var aro = {};
    // fill with common values
    aroSetCommonParams(aro,'x',xaxnum,x0,xreftype);
    aroSetCommonParams(aro,'y',yaxnum,y0,yreftype);
    switch (arotype) {
        case 'shape':
            aro.x1 = opts.x1;
            aro.y1 = opts.y1;
            aro.type = opts.type;
            aro.line = {color: color};
        case 'annotation':
            aro.text = "A";
            aro.ax = opts.ax;
            aro.ay = opts.ay;
            aro.axref = opts.axref;
            aro.ayref = opts.ayref;
            aro.showarrow = true;
            aro.arrowhead = 0;
            aro.arrowcolor = color;
        case 'image':
            aro.sizex = opts.sizex;
            aro.sizey = opts.sizey;
            aro.xanchor = opts.xanchor;
            aro.yanchor = opts.yanchor;
            aro.sizing = "stretch";
            aro.source = testImage;
        default:
            throw "Bad arotype: " + arotype;
    }
    return aro;
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
function mapAROCoordToPixel(layout,axref,aro,c) {
    var reftype = Axes.getRefType(aro[axref]);
    var axletter = axref[0];
    var ret;
    if (reftype === 'range') {
        var axis = axisIds.id2name(aro[axref]);
        ret = pixelCalc.mapRangeToPixel(layout, axis, aro[c]);
    } else if (reftype === 'domain') {
        var axis = axisIds.id2name(aro[axref]);
        ret = pixelCalc.mapDomainToPixel(layout, axis, aro[c]);
    } else if (reftype === 'paper') {
        var axis = axref[0];
        ret = pixelCalc.mapPaperToPixel(layout, axis, aro[c]);
    }
    return ret;
}

// compute the bounding box of the aro so that it can be compared with the SVG
// bounding box
function aroToBBox(layout,aro) {
    var bbox = {};
    var x1;
    var y1;
    // map x coordinates
    bbox.x = mapAROCoordToPixel(layout,'xref',aro,'x0');
    x1 = mapAROCoordToPixel(layout,'xref',aro,'x1');
    // SVG bounding boxes have x,y referring to top left corner, but here we are
    // specifying aros where y0 refers to the bottom left corner like
    // Plotly.js, so we swap y0 and y1
    bbox.y = mapAROCoordToPixel(layout,'yref',aro,'y1');
    y1 = mapAROCoordToPixel(layout,'yref',aro,'y0');
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

// gets the SVG bounding box of the aro and checks it against what mapToPixel
// gives
function checkAROPosition(gd,aro) {
    var aroPath = d3.selectAll('path').filter(function () {
        return this.style.stroke === aro.line.color;
    }).node();
    var aroPathBBox = getSVGElemScreenBBox(aroPath);
    var aroBBox = aroToBBox(gd.layout,aro);
    var ret = compareBBoxes(aroBBox,aroPathBBox);
    if (DEBUG) {
        console.log('SVG BBox',aroPathBBox);
        console.log('aro BBox',aroBBox);
    }
    return ret;
}

// some made-up values for testing
var aroPositionsX = [
    {
        // aros referring to data
        ref: 'range',
        value: [2,3],
        // for objects that need a size (i.e., images)
        size: 1.5
    },
    {
        // aros referring to domains
        ref: 'domain',
        value: [0.2,0.75],
        size: 0.3
    },
    {
        // aros referring to paper
        ref: 'paper',
        value: [0.25, 0.8],
        size: 0.35
    },
];
var aroRelPixelSizeX [
    // this means specify the offset with the second value in aroPositions{X,Y}
    { ref: 'nopixel' },
    // with this you can specify the arrow in pixels
    { ref: 'pixel', value: 100 }
];
var aroPositionsY = [
    {
        // aros referring to data
        ref: 'range',
        // two values for rects
        value: [1,2]
    },
    {
        // aros referring to domains
        ref: 'domain',
        value: [0.25,0.7],
    },
    {
        // aros referring to paper
        ref: 'paper',
        value: [0.2, 0.85]
    }
];
var aroRelPixelSizeY [
    // this means specify the offset with the second value in aroPositions{X,Y}
    { ref: 'nopixel' },
    // with this you can specify the arrow in pixels
    { ref: 'pixel', value: 200 }
];

var aroTypes = ['shape', 'annotation', 'image'];
var axisTypes = [ 'linear', 'log' ];
// Test on 'x', 'y', 'x2', 'y2' axes
// TODO the 'paper' position references are tested twice when once would
// suffice.
var axNum = ['','2'];
// only test line and rect for now
var aroType = ['line','rect'];
// this color chosen so it can easily be found with d3
// NOTE: for images color cannot be set but it will be the only image in the
// plot so you can use d3.select('g image').node()
var aroColor = 'rgb(50, 100, 150)';
var testDomRefAROCombo = function(combo) {
        var xAxNum    = combo[0];
        var xaxisType = combo[1];
        var xaroPos = combo[2];
        var yAxNum    = combo[3];
        var yaxisType = combo[4];
        var yaroPos = combo[5];
        var aroType = combo[6];
        it('should draw a ' + aroType
           + ' for x' + xAxNum + ' of type '
           + xaxisType
           + ' with a value referencing '
           + xaroPos.ref
           + ' and for y' + yAxNum + ' of type '
           + yaxisType
           + ' with a value referencing '
           + yaroPos.ref,
            function (done) {
                var gd = createGraphDiv();
                var mock = Lib.extendDeep({},
                        require('../test/image/mocks/domain_ref_base.json'));
                if (DEBUG) {
                    console.log(combo);
                }
                Plotly.newPlot(gd, mock)
                var aro = {
                    type: aroType,
                    line: { color: aroColor }
                };
                aroFromAROPos(aro,'x',xAxNum,xaroPos);
                aroFromAROPos(aro,'y',yAxNum,yaroPos);
                var layout = {shapes: [aro]};
                // change to log axes if need be
                logAxisIfAxType(gd.layout,layout,'x'+xAxNum,xaxisType);
                logAxisIfAxType(gd.layout,layout,'y'+yAxNum,yaxisType);
                Plotly.relayout(gd,layout);
                console.log(checkAROPosition(gd,aro));
                destroyGraphDiv();
            });
}

// Test correct aro positions
function test_correct_aro_positions () {
    var iterable = require('extra-iterable');
    // for both x and y axes
    var testCombos = [...iterable.cartesianProduct([
        axNum,axisTypes,aroPositionsX,axNum,axisTypes,aroPositionsY,aroType
    ])];
    // map all the combinations to a aro definition and check this aro is
    // placed properly
    testCombos.forEach(testDomRefAROCombo);
}

test_correct_aro_positions();
