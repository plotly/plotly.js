var Plotly = require('@lib/index');
var RangeSlider = require('@src/components/rangeslider');
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var mock = require('../../image/mocks/range_slider.json');
var mouseEvent = require('../assets/mouse_event');

describe('the range slider', function() {

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

            var options = mock.layout.xaxis.rangeslider,
                expectedWidth = gd._fullLayout._size.w + options.borderwidth;

            // width incorporates border widths
            expect(+bg.getAttribute('width')).toEqual(expectedWidth);
            expect(+bg.getAttribute('height')).toEqual(66);
        });

        it('should have the correct style', function() {
            var bg = children[0];

            expect(bg.getAttribute('fill')).toBe('#fafafa');
            expect(bg.getAttribute('stroke')).toBe('black');
            expect(bg.getAttribute('stroke-width')).toBe('2');
        });

        it('should react to resizing the minimum handle', function() {
            var start = 85,
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
            var start = 705,
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
                end = 400,
                rangeDiff1 = gd._fullLayout.xaxis.range[1] - gd._fullLayout.xaxis.range[0];

            slide(start, 400, end, 400);

            var rangeDiff2 = gd._fullLayout.xaxis.range[1] - gd._fullLayout.xaxis.range[0];

            expect(rangeDiff2).toBeLessThan(rangeDiff1);

            start = 400;
            end = 200;

            slide(start, 400, end, 400);

            var rangeDiff3 = gd._fullLayout.xaxis.range[1] - gd._fullLayout.xaxis.range[0];

            expect(rangeDiff3).toBeLessThan(rangeDiff2);
        });
    });


    fdescribe('visibility property', function() {
        beforeEach(function() {
            gd = createGraphDiv();
        });

        afterEach(destroyGraphDiv);

        it('should not add the slider to the DOM by default', function(done) {
            Plotly.plot(gd, [{ x: [1,2,3], y: [2,3,4] }], {})
                .then(function() {
                    var rangeSlider = document.getElementsByClassName('range-slider')[0];
                    expect(rangeSlider).not.toBeDefined();
                })
                .then(done);
        });

        it('should add the slider if changed to `true`', function(done) {
            Plotly.plot(gd, [{ x: [1,2,3], y: [2,3,4] }], {})
                .then(function() { Plotly.relayout(gd, 'xaxis.rangeslider.visible', true); })
                .then(function() {
                    var rangeSlider = document.getElementsByClassName('range-slider')[0];
                    expect(rangeSlider).toBeDefined();
                })
                .then(done);
        });

        it('should remove the slider if changed to `false` or `undefined`', function(done) {
            Plotly.plot(gd, [{ x: [1,2,3], y: [2,3,4] }], { xaxis: { rangeslider: { visible: true }}})
                .then(function() { Plotly.relayout(gd, 'xaxis.rangeslider.visible', false); })
                .then(function() {
                    var rangeSlider = document.getElementsByClassName('range-slider')[0];
                    expect(rangeSlider).not.toBeDefined();
                })
                .then(done);
        });
    });

    describe('supplyLayoutDefaults function', function() {

        it('should not coerce anything if rangeslider isn\'t set', function() {
            var layoutIn = { xaxis: {}, yaxis: {}},
                layoutOut = { xaxis: {}, yaxis: {}},
                expected = { xaxis: {}, yaxis: {}};

            RangeSlider.supplyLayoutDefaults(layoutIn, layoutOut);

            expect(layoutIn).toEqual(expected);
        });

        it('should not mutate layoutIn', function() {
            var layoutIn = { xaxis: { rangeslider: { visible: true }}, yaxis: {}},
                layoutOut = { xaxis: { rangeslider: {}}, yaxis: {}},
                expected = { xaxis: { rangeslider: { visible: true }}, yaxis: {}};

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
            var layoutIn = { xaxis: { rangeslider: { visible: true }}, yaxis: {}},
                layoutOut = { xaxis: { rangeslider: {}}, yaxis: {}},
                expected = {
                    xaxis: {
                        rangeslider: {
                            visible: true,
                            height: 0.15,
                            backgroundcolor: '#fff',
                            borderwidth: 0,
                            bordercolor: '#444'
                        }
                    },
                    yaxis: {
                        fixedrange: true
                    }
                };

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
                }}, yaxis: {}},
                layoutOut = { xaxis: { rangeslider: {}}, yaxis: {}},
                expected = { xaxis: { rangeslider: {
                    visible: false,
                    height: 0.15,
                    backgroundcolor: '#fff',
                    borderwidth: 0,
                    bordercolor: '#444'
                }}, yaxis: {}};

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
