var Plotly = require('../lib/index');
var d3 = require('d3');
var createGraphDiv = require('../test/jasmine/assets/create_graph_div');
var pixelCalc = require('../test/jasmine/assets/pixel_calc');
var getSVGElemScreenBBox = require('../test/jasmine/assets/get_svg_elem_screen_bbox');
var Lib = require('../src/lib');

var dothething = function() {
    var shapeColor = 'rgb(50, 150, 250)';
    var gd = createGraphDiv();
    var mock = Lib.extendDeep({}, require('../test/image/mocks/domain_ref_base.json'));
    var shape = {
      type: 'rect',
      xref: 'x2',
      yref: 'y2',
      x0: 2,
      x1: 3,
      y0: 1,
      y1: 2,
      line: { color: shapeColor }
    };
    Plotly.newPlot(gd,mock)
    .then(function () {
        var xaxis2 = {...gd.layout.xaxis2};
        var yaxis2 = {...gd.layout.yaxis2};
        xaxis2.type = 'log';
        xaxis2.range = xaxis2.range.map(Math.log10);
        yaxis2.type = 'log';
        yaxis2.range = yaxis2.range.map(Math.log10);
        var layout = {
            shapes: [shape],
            xaxis2: xaxis2,
            yaxis2: yaxis2
        }
        return layout;
    })
    .then(function(layout) {
        return Plotly.relayout(gd,layout);
    })
    .then(function () {
        var shapePath = d3.selectAll('path').filter(function () {
            return this.style.stroke === shapeColor;
        }).node();
        var bbox = getSVGElemScreenBBox(shapePath)
        console.log(bbox);
        console.log('property names',Object.keys(bbox));
        console.log('x0',pixelCalc.mapRangeToPixel(gd.layout, 'xaxis2', shape.x0));
        console.log('x1',pixelCalc.mapRangeToPixel(gd.layout, 'xaxis2', shape.x1));
        console.log('y0',pixelCalc.mapRangeToPixel(gd.layout, 'yaxis2', shape.y0));
        console.log('y1',pixelCalc.mapRangeToPixel(gd.layout, 'yaxis2', shape.y1));
        console.log('bbox.x0 - shape.x0',
            bbox.x -
            pixelCalc.mapRangeToPixel(gd.layout, 'xaxis2', shape.x0)
        );
    });
}

dothething();
