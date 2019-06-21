var Plotly = require('@lib/index');
var Plots = require('@src/plots/plots');
// var Lib = require('@src/lib');

var d3 = require('d3');
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var delay = require('../assets/delay');
var failTest = require('../assets/fail_test');
// var click = require('../assets/click');
// var getClientPosition = require('../assets/get_client_position');
// var mouseEvent = require('../assets/mouse_event');
var supplyAllDefaults = require('../assets/supply_defaults');
var indicatorAttrs = require('@src/traces/indicator/attributes.js');
var cn = require('@src/traces/indicator/constants.js');
// var rgb = require('../../../src/components/color').rgb;

// var customAssertions = require('../assets/custom_assertions');
// var assertHoverLabelStyle = customAssertions.assertHoverLabelStyle;
// var assertHoverLabelContent = customAssertions.assertHoverLabelContent;

describe('Indicator defaults', function() {
    function _supply(trace, layout) {
        var gd = {
            data: [trace],
            layout: layout || {}
        };

        supplyAllDefaults(gd);

        return gd._fullData[0];
    }

    it('to number mode', function() {
        var out = _supply({type: 'indicator', value: 1});
        expect(out.mode).toBe('number');
    });

    indicatorAttrs.mode.flags.forEach(function(mode) {
        it('should not coerce container ' + mode + ' if not used', function() {
            var allModes = indicatorAttrs.mode.flags.slice();
            allModes.splice(allModes.indexOf(mode), 1);
            var out = _supply({type: 'indicator', mode: allModes.join('+'), value: 1});
            expect(out[mode]).toBe(undefined);
        });
    });

    it('defaults to formatting numbers using SI prefix', function() {
        var out = _supply({type: 'indicator', mode: 'number+delta', value: 1});
        expect(out.number.valueformat).toBe('.3s');
        expect(out.delta.valueformat).toBe('.3s');
    });

    it('defaults to displaying relative changes in percentage', function() {
        var out = _supply({type: 'indicator', mode: 'delta', delta: {relative: true}, value: 1});
        expect(out.delta.valueformat).toBe('2%');
    });

    // text alignment
    ['number'].forEach(function(mode) {
        it('aligns to center', function() {
            var out = _supply({
                type: 'indicator',
                mode: mode,
                value: 1,
                gauge: {shape: 'angular'}
            });
            expect(out.align).toBe('center');
            expect(out.title.align).toBe('center');
        });
    });

    it('should NOT set number alignment when angular', function() {
        var out = _supply({type: 'indicator', mode: 'number+gauge', gauge: {shape: 'angular'}, value: 1});
        expect(out.align).toBe(undefined);
        expect(out.title.align).toBe('center');
    });

    it('should NOT set title alignment when bullet', function() {
        var out = _supply({type: 'indicator', mode: 'number+gauge', gauge: {shape: 'bullet'}, value: 1});
        expect(out.align).toBe('center');
        expect(out.title.align).toBe(undefined);
    });

    // font-size
    it('number font size to a large value', function() {
        var out = _supply({type: 'indicator', value: 1});
        expect(out.number.font.size).toBe(80);
    });

    it('delta font size to a fraction of number if present', function() {
        var out = _supply({type: 'indicator', mode: 'delta+number', value: 1, number: {font: {size: 50}}});
        expect(out.number.font.size).toBe(50);
        expect(out.delta.font.size).toBe(25);
    });

    it('delta font size to default number font size if no number', function() {
        var out = _supply({type: 'indicator', mode: 'delta', value: 1});
        expect(out.delta.font.size).toBe(80);
    });

    it('title font size to a fraction of number font size', function() {
        var out = _supply({type: 'indicator', value: 1, number: {font: {size: 50}}});
        expect(out.number.font.size).toBe(50);
        expect(out.title.font.size).toBe(12.5);
    });

    it('title font size to a fraction of delta number font size', function() {
        var out = _supply({type: 'indicator', mode: 'delta', value: 1, delta: {font: {size: 50}}});
        expect(out.title.font.size).toBe(12.5);
    });

    it('title font size to a fraction of default number font size if no numbers', function() {
        var out = _supply({type: 'indicator', value: 1});
        expect(out.title.font.size).toBe(20);
    });

    it('will not scale numbers if either number.font.size or delta.font.size is set', function() {
        var out = _supply({type: 'indicator', mode: 'number+delta', value: 1, number: {font: {size: 20}}});
        expect(out._scaleNumbers).toBe(false);

        out = _supply({type: 'indicator', mode: 'number+delta', value: 1, delta: {font: {size: 20}}});
        expect(out._scaleNumbers).toBe(false);
    });
});

describe('Indicator plot', function() {
    var gd;
    beforeEach(function() {
        gd = createGraphDiv();
    });
    afterEach(destroyGraphDiv);

    describe('numbers', function() {
        function checkNumbersScale(value, msg) {
            var numbers = d3.selectAll('text.numbers');
            expect(numbers.length).toBe(1);

            var transform = numbers.attr('transform');
            expect(transform.match('scale')).toBeTruthy('cannot find scale attribute on text.numbers[0]');
            var scale = transform.match(/.*scale\((.*)\)/)[1];

            expect(scale).toBeCloseTo(value, 1, msg);
        }

        it('scale down to fit figure size', function(done) {
            Plotly.newPlot(gd, [{
                type: 'indicator',
                value: 500,
                number: {valueformat: '0.f'}
            }], {width: 400, height: 400})
            .then(function() {
                checkNumbersScale(1, 'initialy at normal scale');
                return Plotly.relayout(gd, {width: 200, height: 200});
            })
            .then(function() {
                checkNumbersScale(0.2, 'should scale down');
                return Plotly.relayout(gd, {width: 400, height: 400});
            })
            .then(function() {
                checkNumbersScale(1, 'should scale up');
            })
            .catch(failTest)
            .then(done);
        });

        it('scale down but never back up if domain size is constant', function(done) {
            Plotly.newPlot(gd, [{
                type: 'indicator',
                value: 1,
                number: {valueformat: '0.f'}
            }], {width: 400, height: 400})
            .then(function() {
                checkNumbersScale(1, 'initialy at normal scale');
                return Plotly.restyle(gd, 'value', [1E6]);
            })
            .then(function() {
                checkNumbersScale(0.7, 'should scale down');
                return Plotly.restyle(gd, 'value', [1]);
            })
            .then(function() {
                checkNumbersScale(0.7, 'should not scale up');
            })
            .catch(failTest)
            .then(done);
        });

        ['number', 'delta'].forEach(function(numberType) {
            it('if ' + numberType + ' font-size is specified, never scale', function(done) {
                var figure = {
                    type: 'indicator',
                    mode: 'number+delta',
                    value: 1,
                    number: {valueformat: '0.f'}
                };
                figure[numberType] = {font: {size: 100}};
                Plotly.newPlot(gd, [figure], {width: 400, height: 400})
                .then(function() {
                    checkNumbersScale(1, 'initialy at normal scale');
                    return Plotly.restyle(gd, 'value', [1E6]);
                })
                .then(function() {
                    checkNumbersScale(1, 'should not rescale');
                    return Plotly.restyle(gd, 'value', [1]);
                })
                .then(function() {
                    checkNumbersScale(1, 'should not rescale');
                })
                .catch(failTest)
                .then(done);
            });
        });
    });

    describe('number', function() {
        function assertContent(txt) {
            var sel = d3.selectAll('tspan.number');
            expect(sel.length).toBe(1);
            expect(sel.text()).toBe(txt);
        }
        it('formats value via `valueformat`', function(done) {
            Plotly.newPlot(gd, [{
                type: 'indicator',
                mode: 'number',
                value: 220,
            }])
            .then(function() {
                assertContent('220');
                return Plotly.restyle(gd, 'number.valueformat', '0.3f');
            })
            .then(function() {
                assertContent('220.000');
                return Plotly.restyle(gd, 'number.valueformat', '$');
            })
            .then(function() {
                assertContent('$220');
            })
            .catch(failTest)
            .then(done);
        });

        it('supports suffix', function(done) {
            Plotly.newPlot(gd, [{
                type: 'indicator',
                mode: 'number',
                number: {suffix: 'potatoes'},
                value: 220,
            }])
            .then(function() {
                assertContent('220 potatoes');
            })
            .catch(failTest)
            .then(done);
        });
    });

    describe('delta', function() {
        function assertContent(txt) {
            var sel = d3.selectAll('tspan.delta');
            expect(sel.length).toBe(1);
            expect(sel.text()).toBe(txt);
        }
        it('can display relative changes', function(done) {
            Plotly.newPlot(gd, [{
                type: 'indicator',
                mode: 'number+delta',
                value: 220,
                delta: {reference: 200}
            }], {width: 400, height: 400})
            .then(function() {
                assertContent(gd._fullData[0].delta.increasing.symbol + '20.0');
                return Plotly.restyle(gd, 'delta.relative', true);
            })
            .then(function() {
                assertContent(gd._fullData[0].delta.increasing.symbol + '10%');
                return Plotly.restyle(gd, 'delta.valueformat', '.3f');
            })
            .then(function() {
                assertContent(gd._fullData[0].delta.increasing.symbol + '0.100');
            })
            .catch(failTest)
            .then(done);
        });
    });

    describe('title', function() {
        beforeEach(function() {
            // hide the div
            gd.style.display = 'none';
            gd.style.top = 100;
            gd.style.left = 100;
        });

        it('positions it above the numbers', function(done) {
            Plotly.newPlot(gd, [{
                type: 'indicator',
                value: 1,
                title: {text: 'Value'},
                mode: 'number'
            }])
            .then(function() {
                gd.style.display = 'block';

                var t = d3.selectAll('text.title').node();
                var titleBBox = t.getBoundingClientRect();

                var numbers = d3.selectAll('text.numbers').node();
                var numbersBBox = numbers.getBoundingClientRect();

                expect(titleBBox.bottom).toBeCloseTo(numbersBBox.top - cn.titlePadding, 0);
            })
            .catch(failTest)
            .then(done);
        });

        it('position it above angular axes', function(done) {
            Plotly.newPlot(gd, [{
                type: 'indicator',
                value: 1,
                title: {text: 'Value'},
                mode: 'gauge',
                gauge: {shape: 'angular'}
            }])
            .then(function() {
                gd.style.display = 'block';
                var t = d3.selectAll('text.title').node();
                var titleBBox = t.getBoundingClientRect();

                var ax = d3.selectAll('g.angularaxis').node();
                var axBBox = ax.getBoundingClientRect();
                expect(titleBBox.bottom).toBeCloseTo(axBBox.top - cn.titlePadding, 0);
            })
            .catch(failTest)
            .then(done);
        });

        it('position it left of bullet', function(done) {
            Plotly.newPlot(gd, [{
                type: 'indicator',
                value: 1,
                title: {text: 'Value'},
                mode: 'gauge',
                gauge: {shape: 'bullet'}
            }])
            .then(function() {
                gd.style.display = 'block';
                var t = d3.selectAll('text.title').node();
                var titleBBox = t.getBoundingClientRect();

                var ax = d3.selectAll('g.bulletaxis').node();
                var axBBox = ax.getBoundingClientRect();
                expect(titleBBox.right < axBBox.left).toBe(true);
            })
            .catch(failTest)
            .then(done);
        });
    });

    it('restyle between modes', function(done) {
        function assertElementCnt(sel, cnt) {
            var el = d3.selectAll(sel);
            expect(el.size()).toBe(cnt, 'selection "' + sel + '" does not have size ' + cnt);
        }
        function assertGauge(shape, cnt) {
            assertElementCnt('g.' + shape, cnt);
            assertElementCnt('g.' + shape + 'axis', cnt);
        }
        function assert(flags) {
            // flags is an array denoting whether the figure [hasNumber, hasDelta, hasAngular, hasBullet]
            assertElementCnt('tspan.number', flags[0]);
            assertElementCnt('tspan.delta', flags[1]);
            assertGauge('angular', flags[2]);
            assertGauge('bullet', flags[3]);
        }

        Plotly.newPlot(gd, [{
            type: 'indicator',
            value: 100,
            mode: 'number+delta+gauge'
        }])
        .then(function() {
            assert([1, 1, 1, 0]);
            return Plotly.restyle(gd, 'mode', 'number+delta');
        })
        .then(function() {
            assert([1, 1, 0, 0]);
            return Plotly.restyle(gd, 'mode', 'number');
        })
        .then(function() {
            assert([1, 0, 0, 0]);
            return Plotly.restyle(gd, 'mode', 'delta');
        })
        .then(function() {
            assert([0, 1, 0, 0]);
            return Plotly.restyle(gd, 'mode', 'gauge');
        })
        .then(function() {
            assert([0, 0, 1, 0]);
            return Plotly.restyle(gd, 'gauge.shape', 'bullet');
        })
        .then(function() {
            assert([0, 0, 0, 1]);
            return Plotly.restyle(gd, 'mode', 'number+delta+gauge');
        })
        .then(function() {
            assert([1, 1, 0, 1]);
        })
        .catch(failTest)
        .then(done);
    });
});

describe('Indicator animations', function() {
    var gd;
    beforeEach(function() {
        gd = createGraphDiv();
    });
    afterEach(destroyGraphDiv);

    it('should be able to transition via `Plotly.react`', function(done) {
        var mock = {data: [{type: 'indicator', value: 100}], layout: {}};
        mock.layout.transition = {duration: 200};

        spyOn(Plots, 'transitionFromReact').and.callThrough();

        Plotly.plot(gd, mock)
        .then(function() {
            gd.data[0].value = '400';
            return Plotly.react(gd, gd.data, gd.layout);
        })
        .then(delay(300))
        .then(function() {
            expect(Plots.transitionFromReact).toHaveBeenCalledTimes(1);
        })
        .catch(failTest)
        .then(done);
    });
});
