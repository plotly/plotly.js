var Plotly = require('@lib/index');
var Lib = require('@src/lib');
var setConvert = require('@src/plots/cartesian/set_convert');
var name2id = require('@src/plots/cartesian/axis_ids').name2id;

var RangeSlider = require('@src/components/rangeslider');
var constants = require('@src/components/rangeslider/constants');
var mock = require('../../image/mocks/range_slider.json');

var d3 = require('d3');
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var mouseEvent = require('../assets/mouse_event');
var supplyAllDefaults = require('../assets/supply_defaults');
var failTest = require('../assets/fail_test');
var assertPlotSize = require('../assets/custom_assertions').assertPlotSize;

var TOL = 6;


function getRangeSlider() {
    var className = constants.containerClassName;
    return document.getElementsByClassName(className)[0];
}

function getRangeSliderChild(index) {
    return getRangeSlider().children[index];
}

function countRangeSliderClipPaths() {
    return document.querySelectorAll('defs [id*=rangeslider]').length;
}

function testTranslate1D(node, val) {
    var transformParts = node.getAttribute('transform').split('(');

    expect(transformParts[0]).toEqual('translate');
    expect(+transformParts[1].split(',0.5)')[0]).toBeWithin(val, TOL);
}

describe('Visible rangesliders', function() {
    var gd, sliderY;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(destroyGraphDiv);

    function plotMock() {
        var mockCopy = Lib.extendDeep({}, mock);

        return Plotly.plot(gd, mockCopy.data, mockCopy.layout).then(function() {
            var bb = getRangeSlider().getBoundingClientRect();
            sliderY = bb.top + bb.height / 2;
            expect(sliderY).toBeCloseTo(387, -1);
        });
    }

    it('should be added to the DOM when specified', function(done) {
        plotMock().then(function() {
            expect(getRangeSlider()).toBeDefined();
        })
        .catch(failTest)
        .then(done);
    });

    it('should have the correct style and size and be able to update these', function(done) {
        plotMock().then(function() {
            var bg = getRangeSliderChild(0);

            var options = mock.layout.xaxis.rangeslider,
                expectedWidth = gd._fullLayout._size.w + options.borderwidth;

            // width incorporates border widths
            expect(+bg.getAttribute('width')).toEqual(expectedWidth);
            expect(+bg.getAttribute('height')).toEqual(66);

            expect(bg.getAttribute('fill')).toBe('#fafafa');
            expect(bg.getAttribute('stroke')).toBe('black');
            expect(+bg.getAttribute('stroke-width')).toBe(2);

            return Plotly.relayout(gd, {
                'xaxis.rangeslider.thickness': 0.1,
                'xaxis.rangeslider.bgcolor': '#ffff80',
                'xaxis.rangeslider.bordercolor': '#404040',
                'xaxis.rangeslider.borderwidth': 1
            });
        })
        .then(function() {
            var bg = getRangeSliderChild(0);

            expect(+bg.getAttribute('height')).toEqual(32);

            expect(bg.getAttribute('fill')).toBe('#ffff80');
            expect(bg.getAttribute('stroke')).toBe('#404040');
            expect(+bg.getAttribute('stroke-width')).toBe(1);
        })
        .catch(failTest)
        .then(done);
    });

    it('should react to resizing the minimum handle', function(done) {
        var start = 85,
            end = 140,
            diff = end - start;

        plotMock().then(function() {
            expect(gd.layout.xaxis.range).toBeCloseToArray([0, 49]);

            return slide(start, sliderY, end, sliderY);
        })
        .then(function() {
            var maskMin = getRangeSliderChild(2),
                handleMin = getRangeSliderChild(5);

            expect(gd.layout.xaxis.range).toBeCloseToArray([4, 49], -0.5);
            expect(maskMin.getAttribute('width')).toEqual(String(diff));
            expect(handleMin.getAttribute('transform')).toBe('translate(' + (diff - 2.5) + ',0.5)');
        })
        .catch(failTest)
        .then(done);
    });

    it('should react to resizing the maximum handle', function(done) {
        var start = 695;
        var end = 490;
        var diff = end - start;

        var dataMaxStart;

        plotMock().then(function() {
            dataMaxStart = gd._fullLayout.xaxis.rangeslider.d2p(49);

            expect(gd.layout.xaxis.range).toBeCloseToArray([0, 49]);

            return slide(start, sliderY, end, sliderY);
        })
        .then(function() {
            var maskMax = getRangeSliderChild(3),
                handleMax = getRangeSliderChild(6);

            expect(gd.layout.xaxis.range).toBeCloseToArray([0, 32.77], -0.5);
            expect(+maskMax.getAttribute('width')).toBeCloseTo(-diff);

            testTranslate1D(handleMax, dataMaxStart + diff);
        })
        .catch(failTest)
        .then(done);
    });

    it('should react to moving the slidebox left to right', function(done) {
        var start = 250;
        var end = 300;
        var diff = end - start;

        var dataMinStart;

        plotMock().then(function() {
            dataMinStart = gd._fullLayout.xaxis.rangeslider.d2p(0);

            expect(gd.layout.xaxis.range).toBeCloseToArray([0, 49]);

            return slide(start, sliderY, end, sliderY);
        })
        .then(function() {
            var maskMin = getRangeSliderChild(2),
                handleMin = getRangeSliderChild(5);

            expect(gd.layout.xaxis.range).toBeCloseToArray([3.96, 49], -0.5);
            expect(+maskMin.getAttribute('width')).toBeCloseTo(String(diff));
            testTranslate1D(handleMin, dataMinStart + diff - 3);
        })
        .catch(failTest)
        .then(done);
    });

    it('should react to moving the slidebox right to left', function(done) {
        var start = 300;
        var end = 250;
        var diff = end - start;

        var dataMaxStart;

        plotMock().then(function() {
            dataMaxStart = gd._fullLayout.xaxis.rangeslider.d2p(49);

            expect(gd.layout.xaxis.range).toBeCloseToArray([0, 49]);

            return slide(start, sliderY, end, sliderY);
        })
        .then(function() {
            var maskMax = getRangeSliderChild(3),
                handleMax = getRangeSliderChild(6);

            expect(gd.layout.xaxis.range).toBeCloseToArray([0, 45.04], -0.5);
            expect(+maskMax.getAttribute('width')).toBeCloseTo(-diff);
            testTranslate1D(handleMax, dataMaxStart + diff);
        })
        .catch(failTest)
        .then(done);
    });

    it('should resize the main plot when rangeslider has moved', function(done) {
        var start = 300;
        var end = 400;
        var rangeDiff1;

        var rangeDiff2, rangeDiff3;

        plotMock().then(function() {
            rangeDiff1 = gd._fullLayout.xaxis.range[1] - gd._fullLayout.xaxis.range[0];

            return slide(start, sliderY, end, sliderY);
        })
        .then(function() {
            rangeDiff2 = gd._fullLayout.xaxis.range[1] - gd._fullLayout.xaxis.range[0];
            expect(rangeDiff2).toBeLessThan(rangeDiff1);
        })
        .then(function() {
            start = 400;
            end = 200;

            return slide(start, sliderY, end, sliderY);
        })
        .then(function() {
            rangeDiff3 = gd._fullLayout.xaxis.range[1] - gd._fullLayout.xaxis.range[0];
            expect(rangeDiff3).toBeLessThan(rangeDiff2);
        })
        .catch(failTest)
        .then(done);
    });

    it('should relayout with relayout "array syntax"', function(done) {
        plotMock().then(function() {
            return Plotly.relayout(gd, 'xaxis.range', [10, 20]);
        })
        .then(function() {
            var maskMin = getRangeSliderChild(2),
                maskMax = getRangeSliderChild(3),
                handleMin = getRangeSliderChild(5),
                handleMax = getRangeSliderChild(6);

            expect(+maskMin.getAttribute('width')).toBeWithin(125, TOL);
            expect(+maskMax.getAttribute('width')).toBeWithin(365, TOL);
            testTranslate1D(handleMin, 123.32);
            testTranslate1D(handleMax, 252.65);
        })
        .catch(failTest)
        .then(done);
    });

    it('should relayout with relayout "element syntax"', function(done) {
        plotMock().then(function() {
            return Plotly.relayout(gd, 'xaxis.range[0]', 10);
        })
        .then(function() {
            var maskMin = getRangeSliderChild(2),
                maskMax = getRangeSliderChild(3),
                handleMin = getRangeSliderChild(5),
                handleMax = getRangeSliderChild(6);

            expect(+maskMin.getAttribute('width')).toBeWithin(126, TOL);
            expect(+maskMax.getAttribute('width')).toEqual(0);
            testTranslate1D(handleMin, 123.32);
            testTranslate1D(handleMax, 617);
        })
        .catch(failTest)
        .then(done);
    });

    it('should relayout with style options', function(done) {
        var bg, maskMin, maskMax, maskMinWidth, maskMaxWidth;

        plotMock().then(function() {
            bg = getRangeSliderChild(0);
            maskMin = getRangeSliderChild(2);
            maskMax = getRangeSliderChild(3);

            return Plotly.relayout(gd, 'xaxis.range', [5, 10]);
        })
        .then(function() {
            maskMinWidth = +maskMin.getAttribute('width'),
            maskMaxWidth = +maskMax.getAttribute('width');

            return Plotly.relayout(gd, 'xaxis.rangeslider.bgcolor', 'red');
        })
        .then(function() {
            expect(+maskMin.getAttribute('width')).toEqual(maskMinWidth);
            expect(+maskMax.getAttribute('width')).toEqual(maskMaxWidth);

            expect(bg.getAttribute('fill')).toBe('red');
            expect(bg.getAttribute('stroke')).toBe('black');
            expect(bg.getAttribute('stroke-width')).toBe('2');

            return Plotly.relayout(gd, 'xaxis.rangeslider.bordercolor', 'blue');
        })
        .then(function() {
            expect(+maskMin.getAttribute('width')).toEqual(maskMinWidth);
            expect(+maskMax.getAttribute('width')).toEqual(maskMaxWidth);

            expect(bg.getAttribute('fill')).toBe('red');
            expect(bg.getAttribute('stroke')).toBe('blue');
            expect(bg.getAttribute('stroke-width')).toBe('2');

            return Plotly.relayout(gd, 'xaxis.rangeslider.borderwidth', 3);
        })
        .then(function() {
            expect(+maskMin.getAttribute('width')).toEqual(maskMinWidth);
            expect(+maskMax.getAttribute('width')).toEqual(maskMaxWidth);

            expect(bg.getAttribute('fill')).toBe('red');
            expect(bg.getAttribute('stroke')).toBe('blue');
            expect(bg.getAttribute('stroke-width')).toBe('3');
        })
        .catch(failTest)
        .then(done);
    });

    it('should relayout on size / domain udpate', function(done) {
        var maskMin, maskMax;

        plotMock().then(function() {
            maskMin = getRangeSliderChild(2),
            maskMax = getRangeSliderChild(3);

            return Plotly.relayout(gd, 'xaxis.range', [5, 10]);
        })
        .then(function() {
            expect(+maskMin.getAttribute('width')).toBeWithin(63.16, TOL);
            expect(+maskMax.getAttribute('width')).toBeWithin(492.67, TOL);

            return Plotly.relayout(gd, 'xaxis.domain', [0.3, 0.7]);
        })
        .then(function() {
            var maskMin = getRangeSliderChild(2),
                maskMax = getRangeSliderChild(3);

            expect(+maskMin.getAttribute('width')).toBeWithin(25.26, TOL);
            expect(+maskMax.getAttribute('width')).toBeWithin(197.06, TOL);

            return Plotly.relayout(gd, 'width', 400);
        })
        .then(function() {
            var maskMin = getRangeSliderChild(2),
                maskMax = getRangeSliderChild(3);

            expect(+maskMin.getAttribute('width')).toBeWithin(9.22, TOL);
            expect(+maskMax.getAttribute('width')).toBeWithin(71.95, TOL);

        })
        .catch(failTest)
        .then(done);
    });
});

describe('Rangeslider visibility property', function() {
    var gd;
    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(destroyGraphDiv);

    function defaultLayout(opts) {
        return Lib.extendDeep({
            width: 500,
            height: 600,
            margin: {l: 50, r: 50, t: 100, b: 100}
        }, opts || {});
    }

    it('should not add the slider to the DOM by default', function(done) {
        Plotly.plot(gd, [{ x: [1, 2, 3], y: [2, 3, 4] }], defaultLayout())
        .then(function() {
            var rangeSlider = getRangeSlider();
            expect(rangeSlider).not.toBeDefined();
            assertPlotSize({height: 400});
        })
        .catch(failTest)
        .then(done);
    });

    it('should add the slider if rangeslider is set to anything', function(done) {
        Plotly.plot(gd, [{ x: [1, 2, 3], y: [2, 3, 4] }], defaultLayout())
        .then(function() {
            return Plotly.relayout(gd, 'xaxis.rangeslider', 'exists');
        })
        .then(function() {
            var rangeSlider = getRangeSlider();
            expect(rangeSlider).toBeDefined();
            assertPlotSize({heightLessThan: 400});
        })
        .catch(failTest)
        .then(done);
    });

    it('should add the slider if visible changed to `true`', function(done) {
        Plotly.plot(gd, [{ x: [1, 2, 3], y: [2, 3, 4] }], defaultLayout())
        .then(function() {
            return Plotly.relayout(gd, 'xaxis.rangeslider.visible', true);
        })
        .then(function() {
            var rangeSlider = getRangeSlider();
            expect(rangeSlider).toBeDefined();
            expect(countRangeSliderClipPaths()).toEqual(1);
            assertPlotSize({heightLessThan: 400});
        })
        .catch(failTest)
        .then(done);
    });

    it('should remove the slider if changed to `false` or `undefined`', function(done) {
        Plotly.plot(gd, [{
            x: [1, 2, 3],
            y: [2, 3, 4]
        }], defaultLayout({
            xaxis: {
                rangeslider: { visible: true }
            }
        }))
        .then(function() {
            return Plotly.relayout(gd, 'xaxis.rangeslider.visible', false);
        })
        .then(function() {
            var rangeSlider = getRangeSlider();
            expect(rangeSlider).not.toBeDefined();
            expect(countRangeSliderClipPaths()).toEqual(0);
            assertPlotSize({height: 400});
        })
        .catch(failTest)
        .then(done);
    });

    it('should clear traces in range plot when needed', function(done) {
        function count(query) {
            return d3.select(getRangeSlider()).selectAll(query).size();
        }

        Plotly.plot(gd, [{
            type: 'scatter',
            x: [1, 2, 3],
            y: [2, 1, 2]
        }, {
            type: 'bar',
            x: [1, 2, 3],
            y: [2, 5, 2]
        }], defaultLayout({
            xaxis: {
                rangeslider: { visible: true }
            }
        }))
        .then(function() {
            expect(count('g.scatterlayer > g.trace')).toEqual(1);
            expect(count('g.barlayer > g.trace')).toEqual(1);

            return Plotly.restyle(gd, 'visible', false);
        })
        .then(function() {
            expect(count('g.scatterlayer > g.trace')).toEqual(0);
            expect(count('g.barlayer > g.trace')).toEqual(0);

            return Plotly.restyle(gd, 'visible', true);
        })
        .then(function() {
            expect(count('g.scatterlayer > g.trace')).toEqual(1);
            expect(count('g.barlayer > g.trace')).toEqual(1);

            return Plotly.deleteTraces(gd, [0, 1]);
        })
        .then(function() {
            expect(count('g.scatterlayer > g.trace')).toEqual(0);
            expect(count('g.barlayer > g.trace')).toEqual(0);

            return Plotly.addTraces(gd, [{
                type: 'heatmap',
                z: [[1, 2, 3], [2, 1, 3]]
            }]);
        })
        .then(function() {
            expect(count('g.heatmaplayer > g.hm')).toEqual(1);

            return Plotly.restyle(gd, 'visible', false);
        })
        .then(function() {
            expect(count('g.heatmaplayer > g.hm')).toEqual(0);

            return Plotly.restyle(gd, {
                visible: true,
                type: 'contour'
            });
        })
        .then(function() {
            expect(count('g.contourlayer > g.contour')).toEqual(1);

            return Plotly.restyle(gd, 'type', 'heatmap');
        })
        .then(function() {
            expect(count('g.heatmaplayer > g.hm')).toEqual(1);
            expect(count('g.contourlayer > g.contour')).toEqual(0);

            return Plotly.restyle(gd, 'type', 'contour');
        })
        .then(function() {
            expect(count('g.heatmaplayer > g.hm')).toEqual(0);
            expect(count('g.contourlayer > g.contour')).toEqual(1);

            return Plotly.deleteTraces(gd, [0]);
        })
        .then(function() {
            expect(count('g.heatmaplayer > g.hm')).toEqual(0);
            expect(count('g.contourlayer > g.contour')).toEqual(0);
        })
        .catch(failTest)
        .then(done);
    });
});

describe('Rangeslider handleDefaults function', function() {

    function _supply(layoutIn, layoutOut, axName) {
        setConvert(layoutOut[axName]);
        layoutOut[axName]._id = name2id(axName);
        if(!layoutOut._requestRangeslider) layoutOut._requestRangeslider = {};
        RangeSlider.handleDefaults(layoutIn, layoutOut, axName);
        // we don't care about this after it's done its job
        delete layoutOut._requestRangeslider;
    }

    it('should not coerce anything if rangeslider isn\'t set', function() {
        var layoutIn = { xaxis: {} },
            layoutOut = { xaxis: {} },
            expected = { xaxis: {} };

        _supply(layoutIn, layoutOut, 'xaxis');
        expect(layoutIn).toEqual(expected);
        expect(layoutOut.xaxis.rangeslider).toBeUndefined();
    });

    it('should not mutate layoutIn', function() {
        var layoutIn = { xaxis: { rangeslider: { visible: true }} },
            layoutOut = { xaxis: { rangeslider: {}} },
            expected = { xaxis: { rangeslider: { visible: true}} };

        _supply(layoutIn, layoutOut, 'xaxis');
        expect(layoutIn).toEqual(expected);
    });

    it('should set defaults if rangeslider is set to anything truthy', function() {
        var layoutIn = { xaxis: { rangeslider: {} }},
            layoutOut = { xaxis: {} },
            expected = {
                visible: true,
                autorange: true,
                thickness: 0.15,
                bgcolor: '#fff',
                borderwidth: 0,
                bordercolor: '#444',
                _input: layoutIn.xaxis.rangeslider
            };

        _supply(layoutIn, layoutOut, 'xaxis');
        expect(layoutOut.xaxis.rangeslider).toEqual(jasmine.objectContaining(expected));
    });

    it('should set defaults if rangeslider is requested', function() {
        var layoutIn = { xaxis: {}},
            layoutOut = { xaxis: {}, _requestRangeslider: {x: true} },
            expected = {
                visible: true,
                autorange: true,
                thickness: 0.15,
                bgcolor: '#fff',
                borderwidth: 0,
                bordercolor: '#444',
                _input: {}
            };

        _supply(layoutIn, layoutOut, 'xaxis');
        // in fact we DO mutate layoutIn - which we should probably try not to do,
        // but that's a problem for another time.
        // see https://github.com/plotly/plotly.js/issues/1473
        expect(layoutIn).toEqual({xaxis: {rangeslider: {}}});
        expect(layoutOut.xaxis.rangeslider).toEqual(jasmine.objectContaining(expected));
    });

    it('should set defaults if rangeslider.visible is true', function() {
        var layoutIn = { xaxis: { rangeslider: { visible: true }} },
            layoutOut = { xaxis: { rangeslider: {}} },
            expected = {
                visible: true,
                autorange: true,
                thickness: 0.15,
                bgcolor: '#fff',
                borderwidth: 0,
                bordercolor: '#444',
                _input: layoutIn.xaxis.rangeslider
            };

        _supply(layoutIn, layoutOut, 'xaxis');
        expect(layoutOut.xaxis.rangeslider).toEqual(jasmine.objectContaining(expected));
    });

    it('should return early if *visible: false*', function() {
        var layoutIn = { xaxis: { rangeslider: { visible: false, range: [10, 20] }} },
            layoutOut = { xaxis: { rangeslider: {}} };

        _supply(layoutIn, layoutOut, 'xaxis');
        expect(layoutOut.xaxis.rangeslider).toEqual(jasmine.objectContaining({ visible: false }));
    });

    it('should set defaults if properties are invalid', function() {
        var layoutIn = { xaxis: { rangeslider: {
                visible: 'invalid',
                thickness: 'invalid',
                bgcolor: 42,
                bordercolor: 42,
                borderwidth: 'superfat'
            }}},
            layoutOut = { xaxis: {} },
            expected = {
                visible: true,
                autorange: true,
                thickness: 0.15,
                bgcolor: '#fff',
                borderwidth: 0,
                bordercolor: '#444',
                _input: layoutIn.xaxis.rangeslider
            };

        _supply(layoutIn, layoutOut, 'xaxis');
        expect(layoutOut.xaxis.rangeslider).toEqual(jasmine.objectContaining(expected));
    });

    it('should set autorange to true when range input is invalid', function() {
        var layoutIn = { xaxis: { rangeslider: { range: 'not-gonna-work'}} },
            layoutOut = { xaxis: {} },
            expected = {
                visible: true,
                autorange: true,
                thickness: 0.15,
                bgcolor: '#fff',
                borderwidth: 0,
                bordercolor: '#444',
                _input: layoutIn.xaxis.rangeslider
            };

        _supply(layoutIn, layoutOut, 'xaxis');
        expect(layoutOut.xaxis.rangeslider).toEqual(jasmine.objectContaining(expected));
    });

    it('should default \'bgcolor\' to layout \'plot_bgcolor\'', function() {
        var layoutIn = {
            xaxis: { rangeslider: true }
        };

        var layoutOut = {
            xaxis: { range: [2, 40]},
            plot_bgcolor: 'blue'
        };

        _supply(layoutIn, layoutOut, 'xaxis');
        expect(layoutOut.xaxis.rangeslider.bgcolor).toEqual('blue');
    });
});

describe('Rangeslider yaxis options', function() {

    it('should be set one yaxis is present', function() {
        var mock = {
            layout: {
                xaxis: { rangeslider: {} },
                yaxis: { }
            }
        };

        supplyAllDefaults(mock);

        expect(mock._fullLayout.xaxis.rangeslider.yaxis).toEqual(jasmine.objectContaining({ rangemode: 'match' }));
    });

    it('should set multiple yaxis with data are present', function() {
        var mock = {
            data: [
                {y: [1, 2]},
                {y: [1, 2], yaxis: 'y2'}
            ],
            layout: {
                xaxis: { rangeslider: {} },
                yaxis: { },
                yaxis2: { },
                yaxis3: { }
            }
        };

        supplyAllDefaults(mock);

        expect(mock._fullLayout.xaxis.rangeslider.yaxis).toEqual(jasmine.objectContaining({ rangemode: 'match' }));
        expect(mock._fullLayout.xaxis.rangeslider.yaxis2).toEqual(jasmine.objectContaining({ rangemode: 'match' }));
        expect(mock._fullLayout.xaxis.rangeslider.yaxis3).toEqual(undefined);
    });

    it('should honor user settings', function() {
        var mock = {
            data: [
                {y: [1, 2]},
                {y: [1, 2], yaxis: 'y2'},
                {y: [1, 2], yaxis: 'y3'}
            ],
            layout: {
                xaxis: { rangeslider: {
                    yaxis: { rangemode: 'auto' },
                    yaxis2: { rangemode: 'fixed' },
                    yaxis3: { range: [0, 1] }
                } },
                yaxis: { },
                yaxis2: { },
                yaxis3: { }
            }
        };

        supplyAllDefaults(mock);

        expect(mock._fullLayout.xaxis.rangeslider.yaxis).toEqual(jasmine.objectContaining({ rangemode: 'auto', range: [-1, 4] }));
        expect(mock._fullLayout.xaxis.rangeslider.yaxis2).toEqual(jasmine.objectContaining({ rangemode: 'fixed', range: [-1, 4] }));
        expect(mock._fullLayout.xaxis.rangeslider.yaxis3).toEqual(jasmine.objectContaining({ rangemode: 'fixed', range: [0, 1] }));
    });
});

describe('Rangeslider anchored axes fixedrange', function() {

    it('should default to *true* when range slider is visible', function() {
        var mock = {
            data: [
                {y: [1, 2]},
                {y: [1, 2], yaxis: 'y2'},
                {y: [1, 2], yaxis: 'y3'}
            ],
            layout: {
                xaxis: { rangeslider: {} },
                yaxis: { anchor: 'x' },
                yaxis2: { anchor: 'x' },
                yaxis3: { anchor: 'free' }
            }
        };

        supplyAllDefaults(mock);

        expect(mock._fullLayout.xaxis.rangeslider.visible).toBe(true);
        expect(mock._fullLayout.yaxis.fixedrange).toBe(true);
        expect(mock._fullLayout.yaxis2.fixedrange).toBe(true);
        expect(mock._fullLayout.yaxis3.fixedrange).toBe(false);
    });

    it('should honor user settings', function() {
        var mock = {
            data: [
                {y: [1, 2]},
                {y: [1, 2], yaxis: 'y2'},
                {y: [1, 2], yaxis: 'y3'}
            ],
            layout: {
                xaxis: { rangeslider: {} },
                yaxis: { anchor: 'x', fixedrange: false },
                yaxis2: { anchor: 'x', fixedrange: false },
                yaxis3: { anchor: 'free' }
            }
        };

        supplyAllDefaults(mock);

        expect(mock._fullLayout.xaxis.rangeslider.visible).toBe(true);
        expect(mock._fullLayout.yaxis.fixedrange).toBe(false);
        expect(mock._fullLayout.yaxis2.fixedrange).toBe(false);
        expect(mock._fullLayout.yaxis3.fixedrange).toBe(false);
    });

});

describe('rangesliders in general', function() {
    var gd;
    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(destroyGraphDiv);

    function assertRange(axRange, rsRange) {
        // lower toBeCloseToArray precision for FF38 on CI
        var precision = 1e-2;

        expect(gd.layout.xaxis.range).toBeCloseToArray(axRange, precision);
        expect(gd.layout.xaxis.rangeslider.range).toBeCloseToArray(rsRange, precision);
    }

    it('should plot when only x data is provided', function(done) {
        Plotly.plot(gd, [{ x: [1, 2, 3] }], { xaxis: { rangeslider: {} }})
        .then(function() {
            var rangeSlider = getRangeSlider();

            expect(rangeSlider).toBeDefined();
        })
        .catch(failTest)
        .then(done);
    });

    it('should plot when only y data is provided', function(done) {
        Plotly.plot(gd, [{ y: [1, 2, 3] }], { xaxis: { rangeslider: {} }})
        .then(function() {
            var rangeSlider = getRangeSlider();

            expect(rangeSlider).toBeDefined();
        })
        .catch(failTest)
        .then(done);
    });

    it('should expand its range in accordance with new data arrays', function(done) {
        Plotly.plot(gd, [{
            y: [2, 1, 2]
        }], {
            xaxis: { rangeslider: {} }
        })
        .then(function() {
            assertRange([-0.13, 2.13], [-0.13, 2.13]);

            return Plotly.restyle(gd, 'y', [[2, 1, 2, 1]]);
        })
        .then(function() {
            assertRange([-0.19, 3.19], [-0.19, 3.19]);

            return Plotly.extendTraces(gd, { y: [[2, 1]] }, [0]);
        })
        .then(function() {
            assertRange([-0.32, 5.32], [-0.32, 5.32]);

            return Plotly.addTraces(gd, { x: [0, 10], y: [2, 1] });
        })
        .then(function() {
            assertRange([-0.68, 10.68], [-0.68, 10.68]);

            return Plotly.deleteTraces(gd, [1]);
        })
        .then(function() {
            assertRange([-0.31, 5.31], [-0.31, 5.31]);
        })
        .catch(failTest)
        .then(done);
    });

    it('should not expand its range when range slider range is set', function(done) {
        Plotly.plot(gd, [{
            y: [2, 1, 2]
        }], {
            xaxis: { rangeslider: { range: [-1, 11] } }
        })
        .then(function() {
            assertRange([-0.13, 2.13], [-1, 11]);

            return Plotly.restyle(gd, 'y', [[2, 1, 2, 1]]);
        })
        .then(function() {
            assertRange([-0.19, 3.19], [-1, 11]);

            return Plotly.extendTraces(gd, { y: [[2, 1]] }, [0]);
        })
        .then(function() {
            assertRange([-0.32, 5.32], [-1, 11]);

            return Plotly.addTraces(gd, { x: [0, 10], y: [2, 1] });
        })
        .then(function() {
            assertRange([-0.68, 10.68], [-1, 11]);

            return Plotly.deleteTraces(gd, [1]);
        })
        .then(function() {
            assertRange([-0.31, 5.31], [-1, 11]);

            return Plotly.update(gd, {
                y: [[2, 1, 2, 1, 2]]
            }, {
                'xaxis.rangeslider.autorange': true
            });
        })
        .then(function() {
            assertRange([-0.26, 4.26], [-0.26, 4.26]);

            // smaller than xaxis.range - won't be accepted
            return Plotly.relayout(gd, {'xaxis.rangeslider.range': [0, 2]});
        })
        .then(function() {
            assertRange([-0.26, 4.26], [-0.26, 4.26]);

            // will be accepted (and autorange is disabled by impliedEdits)
            return Plotly.relayout(gd, {'xaxis.rangeslider.range': [-2, 12]});
        })
        .then(function() {
            assertRange([-0.26, 4.26], [-2, 12]);
        })
        .catch(failTest)
        .then(done);
    });

    it('should configure yaxis opts on relayout', function(done) {
        Plotly.plot(gd, [{
            y: [2, 1, 2]
        }], {
            xaxis: { rangeslider: { yaxis: { range: [-10, 20] } } }
        })
        .then(function() {
            expect(gd.layout.xaxis.rangeslider.yaxis).toEqual(jasmine.objectContaining({ rangemode: 'fixed', range: [-10, 20] }));

            return Plotly.relayout(gd, 'xaxis.rangeslider.yaxis.rangemode', 'auto');
        })
        .then(function() {
            var precision = 2;

            expect(gd.layout.xaxis.rangeslider.yaxis.rangemode).toEqual('auto');
            expect(gd.layout.xaxis.rangeslider.yaxis.range)
                .toBeCloseToArray([0.920, 2.079], precision);

            return Plotly.relayout(gd, 'xaxis.rangeslider.yaxis.rangemode', 'match');
        })
        .then(function() {
            expect(gd.layout.xaxis.rangeslider.yaxis).toEqual(jasmine.objectContaining({ rangemode: 'match' }));
        })
        .catch(failTest)
        .then(done);
    });

    it('should update rangeslider x/y ranges when data changes even if main axes are not autoranged', function(done) {
        Plotly.plot(gd, [{
            // use a heatmap because it doesn't add any padding
            x0: 0, dx: 1,
            y0: 1, dy: 1,
            z: [[1, 2, 3], [2, 3, 4], [3, 4, 5]],
            type: 'heatmap'
        }], {
            xaxis: {
                range: [0, 2],
                rangeslider: {yaxis: {rangemode: 'auto'}}
            },
            yaxis: {range: [1.1, 3.1]}
        })
        .then(function() {
            expect(gd._fullLayout.xaxis.rangeslider.range).toBeCloseToArray([-0.5, 2.5], 3);
            expect(gd._fullLayout.xaxis.rangeslider.yaxis.range).toBeCloseToArray([0.5, 3.5], 3);

            return Plotly.restyle(gd, {dx: 2, dy: 4});
        })
        .then(function() {
            expect(gd._fullLayout.xaxis.rangeslider.range).toBeCloseToArray([-1, 5], 3);
            expect(gd._fullLayout.xaxis.rangeslider.yaxis.range).toBeCloseToArray([-1, 11], 3);
        })
        .catch(failTest)
        .then(done);
    });

    it('should be able to turn on rangeslider x/y autorange if initially specified', function(done) {
        Plotly.plot(gd, [{
            // use a heatmap because it doesn't add any padding
            x0: 0, dx: 1,
            y0: 1, dy: 1,
            z: [[1, 2, 3], [2, 3, 4], [3, 4, 5]],
            type: 'heatmap'
        }], {
            xaxis: {
                range: [0.1, 1.9],
                rangeslider: {range: [0, 2], yaxis: {range: [1, 3]}}
            },
            yaxis: {range: [1.1, 2.9]}
        })
        .then(function() {
            expect(gd._fullLayout.xaxis.rangeslider.range).toBeCloseToArray([0, 2], 3);
            expect(gd._fullLayout.xaxis.rangeslider.yaxis.range).toBeCloseToArray([1, 3], 3);

            return Plotly.relayout(gd, {'xaxis.rangeslider.yaxis.rangemode': 'auto'});
        })
        .then(function() {
            expect(gd._fullLayout.xaxis.rangeslider.range).toBeCloseToArray([0, 2], 3);
            expect(gd._fullLayout.xaxis.rangeslider.yaxis.range).toBeCloseToArray([0.5, 3.5], 3);

            return Plotly.relayout(gd, {'xaxis.rangeslider.autorange': true});
        })
        .then(function() {
            expect(gd._fullLayout.xaxis.rangeslider.range).toBeCloseToArray([-0.5, 2.5], 3);
            expect(gd._fullLayout.xaxis.rangeslider.yaxis.range).toBeCloseToArray([0.5, 3.5], 3);
        })
        .catch(failTest)
        .then(done);
    });

    it('should be able to turn on rangeslider x/y autorange implicitly by deleting x range', function(done) {
        // this does not apply to y ranges, because the default there is 'match'
        Plotly.plot(gd, [{
            // use a heatmap because it doesn't add any padding
            x0: 0, dx: 1,
            y0: 1, dy: 1,
            z: [[1, 2, 3], [2, 3, 4], [3, 4, 5]],
            type: 'heatmap'
        }], {
            xaxis: {
                range: [0.1, 1.9],
                rangeslider: {range: [0, 2], yaxis: {range: [1, 3]}}
            },
            yaxis: {range: [1.1, 2.9]}
        })
        .then(function() {
            expect(gd._fullLayout.xaxis.rangeslider.range).toBeCloseToArray([0, 2], 3);

            return Plotly.relayout(gd, {'xaxis.rangeslider.range': null});
        })
        .then(function() {
            expect(gd._fullLayout.xaxis.rangeslider.range).toBeCloseToArray([-0.5, 2.5], 3);
        })
        .catch(failTest)
        .then(done);
    });
});

function slide(fromX, fromY, toX, toY) {
    return new Promise(function(resolve) {
        mouseEvent('mousemove', fromX, fromY);
        mouseEvent('mousedown', fromX, fromY);
        mouseEvent('mousemove', toX, toY);
        mouseEvent('mouseup', toX, toY);

        setTimeout(function() {
            resolve();
        }, 20);
    });
}
