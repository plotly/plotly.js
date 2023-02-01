'use strict';

var domainRefComponents = require('../assets/domain_ref_components');
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var Plotly = require('../../../lib/index');
var Lib = require('../../../src/lib');
var getSVGElemScreenBBox = require('../assets/get_svg_elem_screen_bbox');
var testMock = require('../assets/domain_refs_editable.json');
var delay = require('../assets/delay');
var mouseEvent = require('../assets/mouse_event');
// we have to use drag to move annotations for some reason
var drag = require('../assets/drag');
// var SVGTools = require('../assets/svg_tools');

// color of the rectangles
var rectColor1 = 'rgb(10, 20, 30)';
var rectColor2 = 'rgb(10, 20, 31)';
var rectColor3 = 'rgb(100, 200, 232)';
var rectColor4 = 'rgb(200, 200, 232)';
var arrowColor1 = 'rgb(231, 200, 100)';
var arrowColor2 = 'rgb(231, 200, 200)';

var DELAY_TIME = 10;

// function svgRectToJSON(svgrect) {
//    return JSON.stringify(SVGTools.svgRectToObj(svgrect));
// }

function checkBBox(bboxBefore, bboxAfter, moveX, moveY) {
    // We print out the objects for sanity, because sometimes Jasmine says a
    // test passed when it actually did nothing!
    // console.log('bboxBefore', svgRectToJSON(bboxBefore));
    // console.log('bboxAfter', svgRectToJSON(bboxAfter));
    // console.log('moveX', moveX);
    // console.log('moveY', moveY);
    expect(bboxAfter.x).toBeCloseTo(bboxBefore.x + moveX, 2);
    expect(bboxAfter.y).toBeCloseTo(bboxBefore.y + moveY, 2);
}

function testObjectMove(objectColor, moveX, moveY, type) {
    var bboxBefore = getSVGElemScreenBBox(
        domainRefComponents.findAROByColor(objectColor, undefined, type)
    );
    var pos = {
        mouseStartX: bboxBefore.x + bboxBefore.width * 0.5,
        mouseStartY: bboxBefore.y + bboxBefore.height * 0.5,
    };
    pos.mouseEndX = pos.mouseStartX + moveX;
    pos.mouseEndY = pos.mouseStartY + moveY;
    mouseEvent('mousemove', pos.mouseStartX, pos.mouseStartY);
    mouseEvent('mousedown', pos.mouseStartX, pos.mouseStartY);
    mouseEvent('mousemove', pos.mouseEndX, pos.mouseEndY);
    mouseEvent('mouseup', pos.mouseEndX, pos.mouseEndY);
    var bboxAfter = getSVGElemScreenBBox(
        domainRefComponents.findAROByColor(objectColor, undefined, type)
    );
    checkBBox(bboxBefore, bboxAfter, moveX, moveY);
}

function dragPos0(bbox, corner) {
    if(corner === 'bl') {
        return [ bbox.x + bbox.width * 0.5,
            bbox.y + bbox.height * 0.5 - 10 ];
    } else if(corner === 'tr') {
        return [ bbox.x + bbox.width * 0.5,
            bbox.y + bbox.height * 0.5 + 10 ];
    } else {
        return [ bbox.x + bbox.width * 0.5,
            bbox.y + bbox.height * 0.5];
    }
}

// Tests moving the annotation label
function testAnnotationMoveLabel(objectColor, moveX, moveY) {
    var bboxAfter;
    // Get where the text box (label) is before dragging it
    var bboxBefore = getSVGElemScreenBBox(
        domainRefComponents.findAROByColor(objectColor, undefined, 'rect')
    );
    // we have to use drag to move annotations for some reason
    var optLabelDrag = {
        pos0: dragPos0(bboxBefore)
    };
    optLabelDrag.dpos = [moveX, moveY];
    // console.log('optLabelDrag', optLabelDrag);
    // drag the label, this will make the arrow rotate around the arrowhead
    return (new Promise(function(resolve) {
        drag(optLabelDrag); resolve();
    }))
    .then(delay(DELAY_TIME))
    .then(function() {
        // then check it's position
        bboxAfter = getSVGElemScreenBBox(
            domainRefComponents.findAROByColor(objectColor, undefined, 'rect')
        );
        checkBBox(bboxBefore, bboxAfter, moveX, moveY);
    })
    .then(delay(DELAY_TIME));
}

// Tests moving the whole annotation
function testAnnotationMoveWhole(objectColor, arrowColor, moveX, moveY, corner) {
    var bboxAfter;
    var arrowBBoxAfter;
    // Get where the text box (label) is before dragging it
    var bboxBefore = getSVGElemScreenBBox(
        domainRefComponents.findAROByColor(objectColor, undefined, 'rect')
    );
    var arrowBBoxBefore = getSVGElemScreenBBox(
        domainRefComponents.findAROByColor(arrowColor, undefined, 'path', 'fill')
    );
    var optArrowDrag = {
        pos0: dragPos0(arrowBBoxBefore, corner)
    };
    optArrowDrag.dpos = [moveX, moveY];
    // console.log('optArrowDrag', optArrowDrag);
    // drag the whole annotation
    (new Promise(function(resolve) {
        drag(optArrowDrag); resolve();
    }))
    .then(delay(DELAY_TIME))
    .then(function() {
        // check the new position of the arrow and label
        arrowBBoxAfter = getSVGElemScreenBBox(
            domainRefComponents.findAROByColor(arrowColor, undefined, 'path', 'fill')
        );
        bboxAfter = getSVGElemScreenBBox(
            domainRefComponents.findAROByColor(objectColor, undefined, 'rect')
        );
        checkBBox(arrowBBoxBefore, arrowBBoxAfter, moveX, moveY);
        checkBBox(bboxBefore, bboxAfter, moveX, moveY);
    })
    .then(delay(DELAY_TIME));
}

describe('Shapes referencing domain', function() {
    var gd;
    beforeEach(function() {
        gd = createGraphDiv();
    });
    afterEach(function() {
        Plotly.purge(gd);
        destroyGraphDiv(gd);
        gd = null;
    });
    function testObjectMoveItFun(color, x, y, type) {
        return function(done) {
            Plotly.newPlot(gd, Lib.extendDeep({}, testMock))
            .then(delay(DELAY_TIME))
            .then(function() {
                testObjectMove(color, x, y, type);
            })
            .then(delay(DELAY_TIME))
            .then(done, done.fail);
        };
    }
    function testAnnotationMoveLabelItFun(color, x, y) {
        return function(done) {
            Plotly.newPlot(gd, Lib.extendDeep({}, testMock))
            .then(delay(DELAY_TIME))
            .then(testAnnotationMoveLabel(color, x, y))
            .then(delay(DELAY_TIME))
            .then(done, done.fail);
        };
    }
    function testAnnotationMoveWholeItFun(color, arrowColor, x, y, corner) {
        return function(done) {
            Plotly.newPlot(gd, Lib.extendDeep({}, testMock))
            .then(delay(DELAY_TIME))
            .then(testAnnotationMoveWhole(color, arrowColor, x, y, corner))
            .then(delay(DELAY_TIME))
            .then(done, done.fail);
        };
    }
    it('should move box on linear x axis and log y to the proper position',
    testObjectMoveItFun(rectColor1, 100, -300, 'path'));
    it('should move box on log x axis and linear y to the proper position',
    testObjectMoveItFun(rectColor2, -400, -200, 'path'));
    it('should move annotation label on linear x axis and log y to the proper position',
    testAnnotationMoveLabelItFun(rectColor3, 50, -100, 'rect'));
    it('should move annotation label on log x axis and linear y to the proper position',
    testAnnotationMoveLabelItFun(rectColor4, -75, -150, 'rect'));
    it('should move whole annotation on linear x axis and log y to the proper position',
    testAnnotationMoveWholeItFun(rectColor3, arrowColor1, 50, -100, 'bl'));
    it('should move whole annotation on log x axis and linear y to the proper position',
    testAnnotationMoveWholeItFun(rectColor4, arrowColor2, -75, -150, 'tr'));
});
