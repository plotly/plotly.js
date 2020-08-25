var Plotly = require('../lib/index');
var d3 = require('d3');
var createGraphDiv = require('../test/jasmine/assets/create_graph_div');
var pixelCalc = require('../test/jasmine/assets/pixel_calc');
var getSVGElemScreenBBox = require('../test/jasmine/assets/get_svg_elem_screen_bbox');
var Lib = require('../src/lib');

var dothething = function() {
    var gd = createGraphDiv();
    var mock = Lib.extendDeep({}, require('../test/image/mocks/domain_ref_base.json'));
    Plotly.newPlot(gd,mock);
}

dothething();
