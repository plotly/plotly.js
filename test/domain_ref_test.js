var Plotly = require('../lib/index');
var d3 = require('d3');
var createGraphDiv = require('../test/jasmine/assets/create_graph_div');
var pixelCalc = require('../test/jasmine/assets/pixel_calc');
var getSVGElemScreenBBox = require('../test/jasmine/assets/get_svg_elem_screen_bbox');
var Lib = require('../src/lib');
var testImage = 'https://images.plot.ly/language-icons/api-home/js-logo.png';

function findPathWithColor(c) {
    var aroPath = d3.selectAll('path').filter(function() {
        return this.style.stroke === c;
    }).node();
    return aroPath;
}

var dothething = function() {
    var arrowColor0 = 'rgb(10, 20, 30)';
    var arrowColor1 = 'rgb(10, 20, 31)';
    var shapeColor = 'rgb(50, 150, 250)';
    var arrowX0 = .75;
    var arrowY0 = 3;
    var arrowX1 = 1.;
    var arrowY1 = 4;
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
        line: {
            color: shapeColor
        }
    };
    var anno0 = {
        width: 10,
        height: 10,
        x: arrowX0,
        y: arrowY0,
        xref: 'x domain',
        yref: 'y',
        ax: arrowX1,
        ay: arrowY1,
        axref: 'x domain',
        ayref: 'y',
        showarrow: true,
        arrowhead: 0,
        arrowcolor: arrowColor0,
        bgcolor: 'rgb(10,100,30)',
    };
    var anno1 = {...anno0};
    anno1.ax += arrowX1 - arrowX0;
    anno1.ay += arrowY1 - arrowY0;
    anno1.arrowcolor = arrowColor1;
    Plotly.newPlot(gd, mock)
        .then(function() {
            var xaxis2 = {
                ...gd.layout.xaxis2
            };
            var yaxis2 = {
                ...gd.layout.yaxis2
            };
            xaxis2.type = 'log';
            xaxis2.range = xaxis2.range.map(Math.log10);
            yaxis2.type = 'log';
            yaxis2.range = yaxis2.range.map(Math.log10);
            var layout = {
                shapes: [shape],
                xaxis2: xaxis2,
                yaxis2: yaxis2,
                // adding image for test
                images: [{
                    x: 0.25,
                    y: 0.1,
                    sizex: 0.7,
                    sizey: 0.7,
                    source: testImage,
                    xanchor: "left",
                    xref: "x domain",
                    yanchor: "bottom",
                    yref: "y domain",
                    sizing: "stretch"
                }],
                // adding annotation for test
                annotations: [anno0,anno1]
            }
            return layout;
        })
        .then(function(layout) {
            return Plotly.relayout(gd, layout);
        })
        .then(function() {
            var shapePath = d3.selectAll('path').filter(function() {
                return this.style.stroke === shapeColor;
            }).node();
            var bbox = getSVGElemScreenBBox(shapePath)
            console.log(bbox);
            console.log('property names', Object.keys(bbox));
            console.log('x0', pixelCalc.mapRangeToPixel(gd.layout, 'xaxis2', shape.x0));
            console.log('x1', pixelCalc.mapRangeToPixel(gd.layout, 'xaxis2', shape.x1));
            console.log('y0', pixelCalc.mapRangeToPixel(gd.layout, 'yaxis2', shape.y0));
            console.log('y1', pixelCalc.mapRangeToPixel(gd.layout, 'yaxis2', shape.y1));
            console.log('bbox.x0 - shape.x0',
                bbox.x -
                pixelCalc.mapRangeToPixel(gd.layout, 'xaxis2', shape.x0)
            );
            // here we check to see the annotation arrow length is as expected
            // by comparing 2 annotations, one of which has arrow dimensions
            // twice the other one.
            var annoPath0 = d3.selectAll('path').filter(function() {
                return this.style.stroke === arrowColor0;
            }).node();
            var annoPath1 = d3.selectAll('path').filter(function() {
                return this.style.stroke === arrowColor1;
            }).node();
            var anbbox0 = getSVGElemScreenBBox(annoPath0);
            var anbbox1 = getSVGElemScreenBBox(annoPath1);
            console.log(anbbox0);
            console.log(anbbox1);
            var arrowXest = ((anbbox1.x+anbbox1.width) - (anbbox0.x+anbbox0.width));
            console.log("Annotation 0 ax " + arrowXest + " correct: ",
                        pixelCalc.mapDomainToPixel(gd.layout, 'xaxis', arrowX1)-pixelCalc.mapDomainToPixel(gd.layout, 'xaxis', arrowX0) == arrowXest);
            // SVG's y is the top of the box
            var arrowYest = (anbbox1.y - anbbox0.y);
            console.log("Annotation 1 ay " + arrowYest + " correct: ",
                        pixelCalc.mapRangeToPixel(gd.layout, 'yaxis', arrowY1)-pixelCalc.mapRangeToPixel(gd.layout, 'yaxis', arrowY0) == arrowYest);
        });
}

dothething();
