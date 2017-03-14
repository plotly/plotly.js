var Plotly = require('@lib/index');
var Plots = require('@src/plots/plots');
var Lib = require('@src/lib');
var setConvert = require('@src/plots/cartesian/set_convert');

var RangeSlider = require('@src/components/rangeslider');
var constants = require('@src/components/rangeslider/constants');
var mock = require('../../image/mocks/range_slider.json');

var d3 = require('d3');
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var mouseEvent = require('../assets/mouse_event');
var customMatchers = require('../assets/custom_matchers');

var TOL = 6;


describe('the range slider', function() {

    var gd,
        rangeSlider,
        children;

    var sliderY = 393;

    function getRangeSlider() {
        var className = constants.containerClassName;
        return document.getElementsByClassName(className)[0];
    }

    function countRangeSliderClipPaths() {
        return d3.selectAll('defs').selectAll('*').filter(function() {
            return this.id.indexOf('rangeslider') !== -1;
        }).size();
    }

    function testTranslate1D(node, val) {
        var transformParts = node.getAttribute('transform').split('(');

        expect(transformParts[0]).toEqual('translate');
        expect(+transformParts[1].split(',0.5)')[0]).toBeWithin(val, TOL);
    }

    describe('when specified as visible', function() {

        beforeAll(function() {
            jasmine.addMatchers(customMatchers);
        });

        beforeEach(function(done) {
            gd = createGraphDiv();

            var mockCopy = Lib.extendDeep({}, mock);

            Plotly.plot(gd, mockCopy.data, mockCopy.layout).then(function() {
                rangeSlider = getRangeSlider();
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

        it('should react to resizing the minimum handle', function(done) {
            var start = 85,
                end = 140,
                diff = end - start;

            expect(gd.layout.xaxis.range).toBeCloseToArray([0, 49]);

            slide(start, sliderY, end, sliderY).then(function() {
                var maskMin = children[2],
                    handleMin = children[5];

                expect(gd.layout.xaxis.range).toBeCloseToArray([4, 49], -0.5);
                expect(maskMin.getAttribute('width')).toEqual(String(diff));
                expect(handleMin.getAttribute('transform')).toBe('translate(' + (diff - 2.5) + ',0.5)');
            }).then(done);
        });

        it('should react to resizing the maximum handle', function(done) {
            var start = 695,
                end = 490,
                dataMaxStart = gd._fullLayout.xaxis.rangeslider.d2p(49),
                diff = end - start;

            expect(gd.layout.xaxis.range).toBeCloseToArray([0, 49]);

            slide(start, sliderY, end, sliderY).then(function() {
                var maskMax = children[3],
                    handleMax = children[6];

                expect(gd.layout.xaxis.range).toBeCloseToArray([0, 32.77], -0.5);
                expect(+maskMax.getAttribute('width')).toBeCloseTo(-diff);

                testTranslate1D(handleMax, dataMaxStart + diff);
            }).then(done);
        });

        it('should react to moving the slidebox left to right', function(done) {
            var start = 250,
                end = 300,
                dataMinStart = gd._fullLayout.xaxis.rangeslider.d2p(0),
                diff = end - start;

            expect(gd.layout.xaxis.range).toBeCloseToArray([0, 49]);

            slide(start, sliderY, end, sliderY).then(function() {
                var maskMin = children[2],
                    handleMin = children[5];

                expect(gd.layout.xaxis.range).toBeCloseToArray([3.96, 49], -0.5);
                expect(+maskMin.getAttribute('width')).toBeCloseTo(String(diff));
                testTranslate1D(handleMin, dataMinStart + diff - 3);
            }).then(done);
        });

        it('should react to moving the slidebox right to left', function(done) {
            var start = 300,
                end = 250,
                dataMaxStart = gd._fullLayout.xaxis.rangeslider.d2p(49),
                diff = end - start;

            expect(gd.layout.xaxis.range).toBeCloseToArray([0, 49]);

            slide(start, sliderY, end, sliderY).then(function() {
                var maskMax = children[3],
                    handleMax = children[6];

                expect(gd.layout.xaxis.range).toBeCloseToArray([0, 45.04], -0.5);
                expect(+maskMax.getAttribute('width')).toBeCloseTo(-diff);
                testTranslate1D(handleMax, dataMaxStart + diff);
            }).then(done);
        });

        it('should resize the main plot when rangeslider has moved', function(done) {
            var start = 300,
                end = 400,
                rangeDiff1 = gd._fullLayout.xaxis.range[1] - gd._fullLayout.xaxis.range[0],
                rangeDiff2,
                rangeDiff3;

            slide(start, sliderY, end, sliderY).then(function() {
                rangeDiff2 = gd._fullLayout.xaxis.range[1] - gd._fullLayout.xaxis.range[0];
                expect(rangeDiff2).toBeLessThan(rangeDiff1);
            }).then(function() {
                start = 400;
                end = 200;

                return slide(start, sliderY, end, sliderY);
            }).then(function() {
                rangeDiff3 = gd._fullLayout.xaxis.range[1] - gd._fullLayout.xaxis.range[0];
                expect(rangeDiff3).toBeLessThan(rangeDiff2);
            }).then(done);
        });

        it('should relayout with relayout "array syntax"', function(done) {
            Plotly.relayout(gd, 'xaxis.range', [10, 20]).then(function() {
                var maskMin = children[2],
                    maskMax = children[3],
                    handleMin = children[5],
                    handleMax = children[6];

                expect(+maskMin.getAttribute('width')).toBeWithin(125, TOL);
                expect(+maskMax.getAttribute('width')).toBeWithin(365, TOL);
                testTranslate1D(handleMin, 123.32);
                testTranslate1D(handleMax, 252.65);
            })
            .then(done);
        });

        it('should relayout with relayout "element syntax"', function(done) {
            Plotly.relayout(gd, 'xaxis.range[0]', 10).then(function() {
                var maskMin = children[2],
                    maskMax = children[3],
                    handleMin = children[5],
                    handleMax = children[6];

                expect(+maskMin.getAttribute('width')).toBeWithin(126, TOL);
                expect(+maskMax.getAttribute('width')).toEqual(0);
                testTranslate1D(handleMin, 123.32);
                testTranslate1D(handleMax, 617);
            })
            .then(done);
        });

        it('should relayout with style options', function(done) {
            var bg = children[0],
                maskMin = children[2],
                maskMax = children[3];

            var maskMinWidth, maskMaxWidth;

            Plotly.relayout(gd, 'xaxis.range', [5, 10]).then(function() {
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
            .then(done);
        });

        it('should relayout on size / domain udpate', function(done) {
            var maskMin = children[2],
                maskMax = children[3];

            Plotly.relayout(gd, 'xaxis.range', [5, 10]).then(function() {
                expect(+maskMin.getAttribute('width')).toBeWithin(63.16, TOL);
                expect(+maskMax.getAttribute('width')).toBeWithin(492.67, TOL);

                return Plotly.relayout(gd, 'xaxis.domain', [0.3, 0.7]);
            })
            .then(function() {
                var maskMin = children[2],
                    maskMax = children[3];

                expect(+maskMin.getAttribute('width')).toBeWithin(25.26, TOL);
                expect(+maskMax.getAttribute('width')).toBeWithin(197.06, TOL);

                return Plotly.relayout(gd, 'width', 400);
            })
            .then(function() {
                var maskMin = children[2],
                    maskMax = children[3];

                expect(+maskMin.getAttribute('width')).toBeWithin(9.22, TOL);
                expect(+maskMax.getAttribute('width')).toBeWithin(71.95, TOL);

            })
            .then(done);
        });
    });


    describe('visibility property', function() {
        beforeEach(function() {
            gd = createGraphDiv();
        });

        afterEach(destroyGraphDiv);

        it('should not add the slider to the DOM by default', function(done) {
            Plotly.plot(gd, [{ x: [1, 2, 3], y: [2, 3, 4] }], {})
            .then(function() {
                var rangeSlider = getRangeSlider();
                expect(rangeSlider).not.toBeDefined();
            })
            .then(done);
        });

        it('should add the slider if rangeslider is set to anything', function(done) {
            Plotly.plot(gd, [{ x: [1, 2, 3], y: [2, 3, 4] }], {})
            .then(function() {
                return Plotly.relayout(gd, 'xaxis.rangeslider', 'exists');
            })
            .then(function() {
                var rangeSlider = getRangeSlider();
                expect(rangeSlider).toBeDefined();
            })
            .then(done);
        });

        it('should add the slider if visible changed to `true`', function(done) {
            Plotly.plot(gd, [{ x: [1, 2, 3], y: [2, 3, 4] }], {})
            .then(function() {
                return Plotly.relayout(gd, 'xaxis.rangeslider.visible', true);
            })
            .then(function() {
                var rangeSlider = getRangeSlider();
                expect(rangeSlider).toBeDefined();
                expect(countRangeSliderClipPaths()).toEqual(1);
            })
            .then(done);
        });

        it('should remove the slider if changed to `false` or `undefined`', function(done) {
            Plotly.plot(gd, [{
                x: [1, 2, 3],
                y: [2, 3, 4]
            }], {
                xaxis: {
                    rangeslider: { visible: true }
                }
            })
            .then(function() {
                return Plotly.relayout(gd, 'xaxis.rangeslider.visible', false);
            })
            .then(function() {
                var rangeSlider = getRangeSlider();
                expect(rangeSlider).not.toBeDefined();
                expect(countRangeSliderClipPaths()).toEqual(0);
            })
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
            }], {
                xaxis: {
                    rangeslider: { visible: true }
                }
            })
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
                expect(count('g.imagelayer > g.hm')).toEqual(1);

                return Plotly.restyle(gd, 'visible', false);
            })
            .then(function() {
                expect(count('g.imagelayer > g.hm')).toEqual(0);

                return Plotly.restyle(gd, {
                    visible: true,
                    type: 'contour'
                });
            })
            .then(function() {
                expect(count('g.maplayer > g.contour')).toEqual(1);

                return Plotly.restyle(gd, 'type', 'heatmap');
            })
            .then(function() {
                expect(count('g.imagelayer > g.hm')).toEqual(1);
                expect(count('g.maplayer > g.contour')).toEqual(0);

                return Plotly.restyle(gd, 'type', 'contour');
            })
            .then(function() {
                expect(count('g.imagelayer > g.hm')).toEqual(0);
                expect(count('g.maplayer > g.contour')).toEqual(1);

                return Plotly.deleteTraces(gd, [0]);
            })
            .then(function() {
                expect(count('g.imagelayer > g.hm')).toEqual(0);
                expect(count('g.maplayer > g.contour')).toEqual(0);
            })
            .then(done);

        });
    });

    describe('handleDefaults function', function() {

        function _supply(layoutIn, layoutOut, axName) {
            setConvert(layoutOut[axName]);
            RangeSlider.handleDefaults(layoutIn, layoutOut, axName);
        }

        it('should not coerce anything if rangeslider isn\'t set', function() {
            var layoutIn = { xaxis: {} },
                layoutOut = { xaxis: {} },
                expected = { xaxis: {} };

            _supply(layoutIn, layoutOut, 'xaxis');
            expect(layoutIn).toEqual(expected);
        });

        it('should not mutate layoutIn', function() {
            var layoutIn = { xaxis: { rangeslider: { visible: true }} },
                layoutOut = { xaxis: { rangeslider: {}} },
                expected = { xaxis: { rangeslider: { visible: true }} };

            _supply(layoutIn, layoutOut, 'xaxis');
            expect(layoutIn).toEqual(expected);
        });

        it('should set defaults if rangeslider is set to anything truthy', function() {
            var layoutIn = { xaxis: { rangeslider: {} }},
                layoutOut = { xaxis: {} },
                expected = {
                    visible: true,
                    autorange: true,
                    range: [-1, 6],
                    thickness: 0.15,
                    bgcolor: '#fff',
                    borderwidth: 0,
                    bordercolor: '#444',
                    _input: layoutIn.xaxis.rangeslider
                };

            _supply(layoutIn, layoutOut, 'xaxis');
            expect(layoutOut.xaxis.rangeslider).toEqual(expected);
        });

        it('should set defaults if rangeslider.visible is true', function() {
            var layoutIn = { xaxis: { rangeslider: { visible: true }} },
                layoutOut = { xaxis: { rangeslider: {}} },
                expected = {
                    visible: true,
                    autorange: true,
                    range: [-1, 6],
                    thickness: 0.15,
                    bgcolor: '#fff',
                    borderwidth: 0,
                    bordercolor: '#444',
                    _input: layoutIn.xaxis.rangeslider
                };

            _supply(layoutIn, layoutOut, 'xaxis');
            expect(layoutOut.xaxis.rangeslider).toEqual(expected);
        });

        it('should return early if *visible: false*', function() {
            var layoutIn = { xaxis: { rangeslider: { visible: false, range: [10, 20] }} },
                layoutOut = { xaxis: { rangeslider: {}} };

            _supply(layoutIn, layoutOut, 'xaxis');
            expect(layoutOut.xaxis.rangeslider).toEqual({ visible: false });
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
                    range: [-1, 6],
                    thickness: 0.15,
                    bgcolor: '#fff',
                    borderwidth: 0,
                    bordercolor: '#444',
                    _input: layoutIn.xaxis.rangeslider
                };

            _supply(layoutIn, layoutOut, 'xaxis');
            expect(layoutOut.xaxis.rangeslider).toEqual(expected);
        });

        it('should expand the rangeslider range to axis range', function() {
            var layoutIn = { xaxis: { rangeslider: { range: [5, 6] } } },
                layoutOut = { xaxis: { range: [1, 10], type: 'linear'} },
                expected = {
                    visible: true,
                    autorange: false,
                    range: [1, 10],
                    thickness: 0.15,
                    bgcolor: '#fff',
                    borderwidth: 0,
                    bordercolor: '#444',
                    _input: layoutIn.xaxis.rangeslider
                };

            _supply(layoutIn, layoutOut, 'xaxis');

            // don't compare the whole layout, because we had to run setConvert which
            // attaches all sorts of other stuff to xaxis
            expect(layoutOut.xaxis.rangeslider).toEqual(expected);
        });

        it('should set autorange to true when range input is invalid', function() {
            var layoutIn = { xaxis: { rangeslider: { range: 'not-gonna-work'}} },
                layoutOut = { xaxis: {} },
                expected = {
                    visible: true,
                    autorange: true,
                    range: [-1, 6],
                    thickness: 0.15,
                    bgcolor: '#fff',
                    borderwidth: 0,
                    bordercolor: '#444',
                    _input: layoutIn.xaxis.rangeslider
                };

            _supply(layoutIn, layoutOut, 'xaxis');
            expect(layoutOut.xaxis.rangeslider).toEqual(expected);
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

    describe('anchored axes fixedrange', function() {

        it('should default to *true* when range slider is visible', function() {
            var mock = {
                layout: {
                    xaxis: { rangeslider: {} },
                    yaxis: { anchor: 'x' },
                    yaxis2: { anchor: 'x' },
                    yaxis3: { anchor: 'free' }
                }
            };

            Plots.supplyDefaults(mock);

            expect(mock._fullLayout.xaxis.rangeslider.visible).toBe(true);
            expect(mock._fullLayout.yaxis.fixedrange).toBe(true);
            expect(mock._fullLayout.yaxis2.fixedrange).toBe(true);
            expect(mock._fullLayout.yaxis3.fixedrange).toBe(false);
        });

        it('should honor user settings', function() {
            var mock = {
                layout: {
                    xaxis: { rangeslider: {} },
                    yaxis: { anchor: 'x', fixedrange: false },
                    yaxis2: { anchor: 'x', fixedrange: false },
                    yaxis3: { anchor: 'free' }
                }
            };

            Plots.supplyDefaults(mock);

            expect(mock._fullLayout.xaxis.rangeslider.visible).toBe(true);
            expect(mock._fullLayout.yaxis.fixedrange).toBe(false);
            expect(mock._fullLayout.yaxis2.fixedrange).toBe(false);
            expect(mock._fullLayout.yaxis3.fixedrange).toBe(false);
        });

    });

    describe('in general', function() {

        beforeAll(function() {
            jasmine.addMatchers(customMatchers);
        });

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
                .then(done);
        });

        it('should plot when only y data is provided', function(done) {
            Plotly.plot(gd, [{ y: [1, 2, 3] }], { xaxis: { rangeslider: {} }})
                .then(function() {
                    var rangeSlider = getRangeSlider();

                    expect(rangeSlider).toBeDefined();
                })
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

            })
            .then(done);
        });
    });
});


function slide(fromX, fromY, toX, toY) {
    return new Promise(function(resolve) {
        mouseEvent('mousemove', fromX, fromY);
        mouseEvent('mousedown', fromX, fromY);
        mouseEvent('mousemove', toX, toY);
        mouseEvent('mouseup', toX, toY);

        setTimeout(function() {
            return resolve();
        }, 20);
    });
}
