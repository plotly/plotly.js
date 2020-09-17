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

// color of first rectangle
var rectColor1 = "rgb(10, 20, 30)";

var DELAY_TIME = 0;

describe("Shapes referencing domain", function () {
    var gd;
    beforeEach(function() {
        gd = createGraphDiv();
    });
    afterEach(function() {
        Plotly.purge(gd);
        destroyGraphDiv(gd);
        gd = null;
    });
    it("should move to the proper position", function(done) {
        Plotly.newPlot(gd, Lib.extendDeep({}, testMock))
        .then(delay(DELAY_TIME))
        .then(function () {
            var rectPos1before = getSVGElemScreenBBox(
                domainRefComponents.findAROByColor(rectColor1)
            );
            var pos = {
                mouseStartX: rectPos1before.x + rectPos1before.width * 0.5,
                mouseStartY: rectPos1before.y + rectPos1before.height * 0.5,
            };
            pos.mouseEndX = pos.mouseStartX + 100;
            pos.mouseEndY = pos.mouseStartY + -300;
            mouseEvent('mousemove', pos.mouseStartX, pos.mouseStartY);
            mouseEvent('mousedown', pos.mouseStartX, pos.mouseStartY);
            mouseEvent('mousemove', pos.mouseEndX, pos.mouseEndY);
            mouseEvent('mouseup', pos.mouseEndX, pos.mouseEndY);
            var rectPos1after = getSVGElemScreenBBox(
                domainRefComponents.findAROByColor(rectColor1)
            );
            expect(rectPos1after.x).toBeCloseTo(rectPos1before.x + 100, 2);
            expect(rectPos1after.y).toBeCloseTo(rectPos1before.y - 300, 2);
        })
        .then(delay(DELAY_TIME))
        .catch(failTest)
        .then(done);
    });
});
