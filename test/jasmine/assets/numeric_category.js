'use strict';

var Plotly = require('../../../lib/index');
var d3SelectAll = require('../../strict-d3').selectAll;
var drag = require('../assets/drag');

module.exports.shapeColors = [
    'red',
    'green',
    'blue',
    'yellow',
    'orange',
];

module.exports.shapeColorTab = {
    red: 'rgb(255, 0, 0)',
    green: 'rgb(0, 128, 0)',
    blue: 'rgb(0, 0, 255)',
    yellow: 'rgb(255, 255, 0)',
    orange: 'rgb(255, 165, 0)'
};

function createDesc(xcats, ycats) {
    return 'x is specified as ' + xcats + ', y is specified as ' + ycats;
}

module.exports.shapeColorTestDesc = {
    red: createDesc('indices', 'numeric strings'),
    green: createDesc('indices', 'numeric string categories, one of which is missing'),
    blue: createDesc('string categories', 'indices'),
    yellow: createDesc('numeric string categories, one of which is missing', 'indices'),
    orange: createDesc('(path) indices', '(path) indices'),
};

function keepMthOfNShapes(shapes, nshapes, m) {
    var oneShape = shapes[m];
    var tailShapes = shapes.slice(nshapes);
    return [oneShape].concat(tailShapes);
}

module.exports.plotMthShape = function(gd, m) {
    var mock;
    mock = require('../../image/mocks/numeric-string-categories.json');
    mock.config = {editable: true};
    mock.layout.shapes = keepMthOfNShapes(mock.layout.shapes, mock.layout.shapes.length, m);
    var promise = Plotly.newPlot(gd, mock);
    return promise;
};

module.exports.plotColoredShape = function(gd, color) {
    var mock = require('../../image/mocks/numeric-string-categories.json');
    var m;
    mock.layout.shapes.forEach(function(e, i) {
        if(e && e.line && e.line.color === color) { m = i; }
    });
    return module.exports.plotMthShape(gd, m);
};

module.exports.getShapeByColor = function(color) {
    var rgbColor = module.exports.shapeColorTab[color];
    var shapeNode = d3SelectAll('.shapelayer path[style*="stroke: ' + rgbColor + '"]').node();
    return shapeNode;
};

module.exports.dragShapeByColor = function(color, dx, dy) {
    var shapeNode = module.exports.getShapeByColor(color);
    return drag({node: shapeNode, dpos: [dx, dy]});
};

module.exports.bboxChange = function(fromBBox, toBBox) {
    var ret = {
        dx: toBBox.x - fromBBox.x,
        dy: toBBox.y - fromBBox.y,
        dwidth: toBBox.width - fromBBox.width,
        dheight: toBBox.height - fromBBox.height,
    };
    return ret;
};

// Returns a promise that resolves with an object that looks like:
// {
//  dx: ... // change in horizontal shape position
//  dy: ... // change in vertical shape position
//  dwidth: ... // change in shape width
//  dheight: ... // change in shape height
// }
module.exports.testDragShapeByColor = function(gd, shapeColor, dx, dy) {
    var startBBox, endBBox;
    // Plot the shape with the specified color
    var promise = module.exports.plotColoredShape(gd, shapeColor).then(function() {
        // get the bounding box of the shape with the specified color
        var shapeNode = module.exports.getShapeByColor(shapeColor);
        startBBox = shapeNode.getBoundingClientRect();
        // drag that shape
        return module.exports.dragShapeByColor(shapeColor, dx, dy);
    }).then(function() {
        // get the new bounding box of the shape
        var shapeNode = module.exports.getShapeByColor(shapeColor);
        endBBox = shapeNode.getBoundingClientRect();
        return module.exports.bboxChange(startBBox, endBBox);
    });
    return promise;
};

module.exports.d3SelectAll = d3SelectAll;
