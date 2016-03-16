var Plotly = require('@lib/index');
var RangeSlider = require('@src/components/rangeslider');
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var mock = require('../../image/mocks/range_slider.json');
var mouseEvent = require('../assets/mouse_event');

fdescribe('the range slider', function() {

    var gd,
        rangeSlider,
        children;

    describe('when specified as visible', function() {

        beforeEach(function(done) {
            gd = createGraphDiv();

            Plotly.plot(gd, mock.data, mock.layout).then(function() {
                rangeSlider = document.getElementsByClassName('range-slider')[0];
                children = rangeSlider.children;
                done();
            });
        });

        afterEach(destroyGraphDiv);

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
                diff = end - start;

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
                diff = end - start;

            slide(start, 400, end, 400);

            var maskMax = children[3],
                handleMax = children[6];

            expect(rangeSlider.getAttribute('data-max')).toEqual(String(+dataMaxStart + diff));
            expect(maskMax.getAttribute('width')).toEqual(String(-diff));
            expect(handleMax.getAttribute('transform')).toBe('translate(' + (+dataMaxStart + diff) + ')');
        });

        it('should react to moving the slidebox left to right', function() {
            var start = 250,
                end = 300,
                dataMinStart = rangeSlider.getAttribute('data-min'),
                diff = end - start;

            slide(start, 400, end, 400);

            var maskMin = children[2],
                handleMin = children[5];

            expect(rangeSlider.getAttribute('data-min')).toEqual(String(+dataMinStart + diff));
            expect(maskMin.getAttribute('width')).toEqual(String(diff));
            expect(handleMin.getAttribute('transform')).toEqual('translate(' + (+dataMinStart + diff - 3) + ')');
        });

        it('should react to moving the slidebox right to left', function() {
            var start = 300,
                end = 250,
                dataMaxStart = rangeSlider.getAttribute('data-max'),
                diff = end - start;

            slide(start, 400, end, 400);

            var maskMax = children[3],
                handleMax = children[6];

            expect(rangeSlider.getAttribute('data-max')).toEqual(String(+dataMaxStart + diff));
            expect(maskMax.getAttribute('width')).toEqual(String(-diff));
            expect(handleMax.getAttribute('transform')).toEqual('translate(' + (+dataMaxStart + diff) + ')');
        });

        it('should resize the main plot when rangeslider has moved', function() {
            var start = 300,
                end = 400;

            slide(start, 400, end, 400);

            var rangeDiff = gd._fullLayout.xaxis.range[1] - gd._fullLayout.xaxis.range[0];

            expect(rangeDiff).toBeCloseTo(21.009, 2);
        });
    });


    describe('when not specified as visible', function() {
        beforeEach(function(done) {
            gd = createGraphDiv();

            Plotly.plot(gd, [{ x: [1,2,3], y: [2,3,4] }], {}).then(function() {
                rangeSlider = document.getElementsByClassName('range-slider')[0];
                done();
            });
        });

        afterEach(destroyGraphDiv);

        it('should not be added to the DOM by default', function() {
            expect(rangeSlider).not.toBeDefined();
        });
    });

    describe('supplyLayoutDefaults function', function() {

        it('should not mutate layoutIn', function() {
            var layoutIn = { xaxis: { rangeslider: { visible: true }}},
                layoutOut = { xaxis: { rangeslider: {}}},
                expected = { xaxis: { rangeslider: { visible: true }}};

            RangeSlider.supplyLayoutDefaults(layoutIn, layoutOut);

            expect(layoutIn).toEqual(expected);
        });

        it('should ignore if there is no xaxis or rangeslider properties', function() {
            var layoutIn = {},
                layoutOut = {};

            RangeSlider.supplyLayoutDefaults(layoutIn, layoutOut);

            expect(layoutOut).toEqual(layoutIn);
        });

        it('should set defaults if rangeslider.visible is true', function() {
            var layoutIn = { xaxis: { rangeslider: { visible: true }}},
                layoutOut = { xaxis: { rangeslider: {}}},
                expected = { xaxis: { rangeslider: {
                    visible: true,
                    height: 0.15,
                    backgroundcolor: '#ffffff',
                    borderwidth: 1,
                    bordercolor: 'transparent'
                }}};

            RangeSlider.supplyLayoutDefaults(layoutIn, layoutOut);

            expect(layoutOut).toEqual(expected);
        });

        it('should set defaults if properties are invalid', function() {
            var layoutIn = { xaxis: { rangeslider: {
                    visible: 'invalid',
                    height: 'invalid',
                    backgroundcolor: 42,
                    bordercolor: 42,
                    borderwidth: 'superfat'
                }}},
                layoutOut = { xaxis: { rangeslider: {}}},
                expected = { xaxis: { rangeslider: {
                    visible: false,
                    height: 0.15,
                    backgroundcolor: '#ffffff',
                    borderwidth: 1,
                    bordercolor: 'transparent'
                }}};

            RangeSlider.supplyLayoutDefaults(layoutIn, layoutOut);

            expect(layoutOut).toEqual(expected);
        });
    });
});


function slide(fromX, fromY, toX, toY) {
    mouseEvent('mousemove', fromX, fromY);
    mouseEvent('mousedown', fromX, fromY);
    mouseEvent('mousemove', toX, toY);
    mouseEvent('mouseup', toX, toY);
}
