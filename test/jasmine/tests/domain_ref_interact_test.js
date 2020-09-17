'use strict';
var failTest = require('../assets/fail_test');
var domainRefComponents = require('../assets/domain_ref/components');
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var Plotly = require('../../../lib/index');
var Lib = require('../../../src/lib');
var getSVGElemScreenBBox = require(
    '../assets/get_svg_elem_screen_bbox');
var testMock = require('../../image/mocks/domain_refs_editable.json');
var delay = require('../assets/delay');
var mouseEvent = require('../assets/mouse_event');
var drag = require('../assets/drag');

// color of the rectangles
var rectColor1 = 'rgb(10, 20, 30)';
var rectColor2 = 'rgb(10, 20, 31)';
var rectColor3 = 'rgb(100, 200, 232)';
var rectColor4 = 'rgb(200, 200, 232)';

var DELAY_TIME = 0;

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
    expect(bboxAfter.x).toBeCloseTo(bboxBefore.x + moveX, 2);
    expect(bboxAfter.y).toBeCloseTo(bboxBefore.y + moveY, 2);
}

function testAnnotationMove(objectColor, moveX, moveY, type) {
    var bboxBefore = getSVGElemScreenBBox(
        domainRefComponents.findAROByColor(objectColor, undefined, type)
    );
    var opt = {
        pos0: [ bboxBefore.x + bboxBefore.width * 0.5,
            bboxBefore.y + bboxBefore.height * 0.5 ],
    };
    opt.dpos = [moveX, moveY];
    return (new Promise(function() { drag(opt); }))
    .then(function() {
        var bboxAfter = getSVGElemScreenBBox(
            domainRefComponents.findAROByColor(objectColor, undefined, type)
        );
        expect(bboxAfter.x).toBeCloseTo(bboxBefore.x + moveX, 2);
        expect(bboxAfter.y).toBeCloseTo(bboxBefore.y + moveY, 2);
    });
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
            .catch(failTest)
            .then(done);
        };
    }
    function testAnnotationMoveItFun(color, x, y, type) {
        return function(done) {
            Plotly.newPlot(gd, Lib.extendDeep({}, testMock))
            .then(delay(DELAY_TIME))
            .then(testAnnotationMove(color, x, y, type))
            .then(delay(DELAY_TIME))
            .catch(failTest)
            .then(done);
        };
    }
    it('should move box on linear x axis and log y to the proper position',
    testObjectMoveItFun(rectColor1, 100, -300, 'path'));
    it('should move box on log x axis and linear y to the proper position',
    testObjectMoveItFun(rectColor2, -400, -200, 'path'));
    it('should move annotation box on linear x axis and log y to the proper position',
    testAnnotationMoveItFun(rectColor3, 50, -100, 'rect'));
    it('should move annotation box on log x axis and linear y to the proper position',
    testAnnotationMoveItFun(rectColor4, -75, -150, 'rect'));
});
