var Plotly = require('@lib/index');
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var mock = require('../../image/mocks/range_slider.json');
var mouseEvent = require('../assets/mouse_event');

describe('the range slider', function() {

    var gd,
        rangeSlider,
        children;

    describe('when specified as visible', function() {

        beforeAll(function(done) {
            gd = createGraphDiv();

            Plotly.plot(gd, mock.data, mock.layout).then(function() {
                rangeSlider = document.getElementsByClassName('range-slider')[0];
                children = rangeSlider.children;
                done();
            });
        });

        afterAll(destroyGraphDiv);

        it('should be added to the DOM when specified', function() {
            expect(rangeSlider).toBeDefined();
        });

        it('should have the correct width and height', function() {
            var bg = children[0];

            // width incorporates border widths
            expect(+bg.getAttribute('width')).toEqual(617);
            expect(+bg.getAttribute('height')).toEqual(66);
        });

        it('should have the correct style', function() {
            var bg = children[0];

            expect(bg.getAttribute('fill')).toBe('#fafafa');
            expect(bg.getAttribute('stroke')).toBe('black');
            expect(bg.getAttribute('stroke-width')).toBe('2');
        });

        it('should react to resizing the minimum handle', function() {
            var start = 86,
                end = 140,
                dataMinStart = rangeSlider.getAttribute('data-min'),
                diff = Math.abs(end - start);

            slide(start, 400, end, 400);

            var maskMin = children[2],
                handleMin = children[5];

            expect(rangeSlider.getAttribute('data-min')).toEqual(String(+dataMinStart + diff));
            expect(maskMin.getAttribute('width')).toEqual(String(diff));
            expect(handleMin.getAttribute('transform')).toBe('translate(' + (diff - 3) + ')');
        });

        it('should react to resizing the maximum handle', function() {
            var start = 706,
                end = 500,
                dataMaxStart = rangeSlider.getAttribute('data-max'),
                diff = Math.abs(end - start);

            slide(start, 400, end, 400);

            var maskMax = children[3],
                handleMax = children[6];

            expect(rangeSlider.getAttribute('data-max')).toEqual(String(+dataMaxStart - diff));
            expect(maskMax.getAttribute('width')).toEqual(String(diff));
            expect(handleMax.getAttribute('transform')).toBe('translate(' + (dataMaxStart - diff) + ')');
        });

        it('should react to moving the slidebox', function() {
            var start = 210,
                end = 300,
                dataMinStart = rangeSlider.getAttribute('data-min'),
                dataMaxStart = rangeSlider.getAttribute('data-max'),
                maskMaxWidth = children[3].getAttribute('width'),
                diff = Math.abs(end - start);

            slide(start, 400, end, 400);

            var maskMin = children[2],
                maskMax = children[3],
                handleMin = children[5],
                handleMax = children[6];

            expect(rangeSlider.getAttribute('data-min')).toEqual(String(+dataMinStart + diff));
            expect(maskMin.getAttribute('width')).toEqual(String(+dataMinStart + diff));
            expect(handleMin.getAttribute('transform')).toEqual('translate(' + (+dataMinStart + diff - 3) + ')');

            expect(rangeSlider.getAttribute('data-max')).toEqual(String(+dataMaxStart + diff));
            expect(maskMax.getAttribute('width')).toEqual(String(maskMaxWidth - diff));
            expect(handleMax.getAttribute('transform')).toEqual('translate(' + (+dataMaxStart + diff) + ')');
        });
    });


    describe('when not specified as visible', function() {
        beforeAll(function(done) {
            gd = createGraphDiv();

            Plotly.plot(gd, [{ x: [1,2,3], y: [2,3,4] }], {}).then(function() {
                rangeSlider = document.getElementsByClassName('range-slider')[0];
                done();
            });
        });

        afterAll(destroyGraphDiv);

        it('should not be added to the DOM by default', function() {
            expect(rangeSlider).not.toBeDefined();
        });
    });
});


function slide(fromX, fromY, toX, toY) {
    mouseEvent('mousemove', fromX, fromY);
    mouseEvent('mousedown', fromX, fromY);
    mouseEvent('mousemove', toX, toY);
    mouseEvent('mouseup', toX, toY);
}
