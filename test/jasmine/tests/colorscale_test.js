var Plotly = require('@lib');

var Colorscale = require('@src/components/colorscale');

var Lib = require('@src/lib');
var Plots = require('@src/plots/plots');
var Heatmap = require('@src/traces/heatmap');
var Scatter = require('@src/traces/scatter');

var d3 = require('d3');
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var failTest = require('../assets/fail_test');
var supplyAllDefaults = require('../assets/supply_defaults');

function _supply(trace, layout) {
    var gd = {
        data: [trace],
        layout: layout || {}
    };

    supplyAllDefaults(gd);

    return gd;
}

describe('Test colorscale:', function() {
    'use strict';

    describe('isValidScale', function() {
        var isValidScale = Colorscale.isValidScale;
        var scl;

        it('should accept colorscale strings', function() {
            expect(isValidScale('Earth')).toBe(true);
            expect(isValidScale('Greens')).toBe(true);
            expect(isValidScale('Nop')).toBe(false);
        });

        it('should accept only array of 2-item arrays', function() {
            expect(isValidScale('a')).toBe(false);
            expect(isValidScale([])).toBe(false);
            expect(isValidScale([null, undefined])).toBe(false);
            expect(isValidScale([{}, [1, 'rgb(0, 0, 200']])).toBe(false);
            expect(isValidScale([[0, 'rgb(200, 0, 0)'], {}])).toBe(false);
            expect(isValidScale([[0, 'rgb(0, 0, 200)'], undefined])).toBe(false);
            expect(isValidScale([null, [1, 'rgb(0, 0, 200)']])).toBe(false);
            expect(isValidScale(['a', 'b'])).toBe(false);
            expect(isValidScale(['a'])).toBe(false);
            expect(isValidScale([['a'], ['b']])).toBe(false);

            scl = [[0, 'rgb(0, 0, 200)'], [1, 'rgb(200, 0, 0)']];
            expect(isValidScale(scl)).toBe(true);
        });

        it('should accept only arrays with 1st val = 0 and last val = 1', function() {
            scl = [[0.2, 'rgb(0, 0, 200)'], [1, 'rgb(200, 0, 0)']];
            expect(isValidScale(scl)).toBe(false);

            scl = [['0', 'rgb(0, 0, 200)'], [1, 'rgb(200, 0, 0)']];
            expect(isValidScale(scl)).toBe(true);

            scl = [[0, 'rgb(0, 0, 200)'], [1.2, 'rgb(200, 0, 0)']];
            expect(isValidScale(scl)).toBe(false);

            scl = [[0, 'rgb(0, 0, 200)'], ['1.0', 'rgb(200, 0, 0)']];
            expect(isValidScale(scl)).toBe(true);
        });

        it('should accept ascending order number-color items', function() {
            scl = [['rgb(0, 0, 200)', 0], ['rgb(200, 0, 0)', 1]];
            expect(isValidScale(scl)).toBe(false);

            scl = [[0, 0], [1, 1]];
            expect(isValidScale(scl)).toBe(false);

            scl = [[0, 'a'], [1, 'b']];
            expect(isValidScale()).toBe(false);

            scl = [[0, 'rgb(0, 0, 200)'], [0.6, 'rgb(200, 200, 0)'],
                   [0.3, 'rgb(0, 200, 0)'], [1, 'rgb(200, 0, 0)']];
            expect(isValidScale(scl)).toBe(false);
        });
    });

    describe('flipScale', function() {
        var flipScale = Colorscale.flipScale;
        var scl;

        it('should flip a colorscale', function() {
            scl = [[0, 'rgb(0, 0, 200)'], ['0.5', 'rgb(0, 0, 0)'], ['1.0', 'rgb(200, 0, 0)']];
            expect(flipScale(scl)).toEqual(
                [[0, 'rgb(200, 0, 0)'], [0.5, 'rgb(0, 0, 0)'], [1, 'rgb(0, 0, 200)']]
            );

        });
    });

    describe('hasColorscale', function() {
        var hasColorscale = Colorscale.hasColorscale;
        var trace;

        it('should return false when marker is not defined', function() {
            var shouldBeFalse = [
                {},
                {marker: null}
            ];
            shouldBeFalse.forEach(function(trace) {
                expect(hasColorscale(trace, 'marker')).toBe(false);
            });
        });

        it('should return false when marker is not defined (nested version)', function() {
            var shouldBeFalse = [
                {},
                {marker: null},
                {marker: {line: null}}
            ];
            shouldBeFalse.forEach(function(trace) {
                expect(hasColorscale(trace, 'marker.line')).toBe(false);
            });
        });

        it('should return true when marker color is an Array with at least one number', function() {
            trace = {
                marker: {
                    color: [1, 2, 3],
                    line: {
                        color: [2, 3, 4]
                    }
                }
            };
            expect(hasColorscale(trace, 'marker')).toBe(true);
            expect(hasColorscale(trace, 'marker.line')).toBe(true);

            trace = {
                marker: {
                    color: ['1', 'red', '#d0d0d0'],
                    line: {
                        color: ['blue', '3', '#fff']
                    }
                }
            };
            expect(hasColorscale(trace, 'marker')).toBe(true);
            expect(hasColorscale(trace, 'marker.line')).toBe(true);

            trace = {
                marker: {
                    color: ['green', 'red', 'blue'],
                    line: {
                        color: ['rgb(100, 100, 100)', '#d0d0d0', '#fff']
                    }
                }
            };
            expect(hasColorscale(trace, 'marker')).toBe(false);
            expect(hasColorscale(trace, 'marker.line')).toBe(false);
        });

        it('should return true when marker showscale is true', function() {
            trace = {
                marker: {
                    showscale: true,
                    line: {
                        showscale: true
                    }
                }
            };
            expect(hasColorscale(trace, 'marker')).toBe(true);
            expect(hasColorscale(trace, 'marker.line')).toBe(true);
        });

        it('should return true when marker colorscale is valid', function() {
            trace = {
                marker: {
                    colorscale: 'Greens',
                    line: {
                        colorscale: [[0, 'rgb(0,0,0)'], [1, 'rgb(0,0,0)']]
                    }
                }
            };
            expect(hasColorscale(trace, 'marker')).toBe(true);
            expect(hasColorscale(trace, 'marker.line')).toBe(true);
        });

        it('should return true when marker cmin & cmax are numbers', function() {
            trace = {
                marker: {
                    cmin: 10,
                    cmax: 20,
                    line: {
                        cmin: 10,
                        cmax: 20
                    }
                }
            };
            expect(hasColorscale(trace, 'marker')).toBe(true);
            expect(hasColorscale(trace, 'marker.line')).toBe(true);
        });

        it('should return true when marker colorbar is defined', function() {
            trace = {
                marker: {
                    colorbar: {},
                    line: {
                        colorbar: {}
                    }
                }
            };
            expect(hasColorscale(trace, 'marker')).toBe(true);
            expect(hasColorscale(trace, 'marker.line')).toBe(true);
        });

        it('should return true when marker color is a typed array with at least one non-NaN', function() {
            trace = {
                marker: {
                    color: new Float32Array([1, 2, 3]),
                    line: {
                        color: new Float32Array([2, 3, 4])
                    }
                }
            };
            expect(hasColorscale(trace, 'marker')).toBe(true);
            expect(hasColorscale(trace, 'marker.line')).toBe(true);

            trace = {
                marker: {
                    color: new Float32Array([1, NaN, 3]),
                    line: {
                        color: new Float32Array([2, 3, NaN])
                    }
                }
            };
            expect(hasColorscale(trace, 'marker')).toBe(true);
            expect(hasColorscale(trace, 'marker.line')).toBe(true);

            trace = {
                marker: {
                    color: new Float32Array([NaN, undefined, 'not-a-number']),
                    line: {
                        color: new Float32Array(['not-a-number', NaN, undefined])
                    }
                }
            };
            expect(hasColorscale(trace, 'marker')).toBe(false);
            expect(hasColorscale(trace, 'marker.line')).toBe(false);
        });
    });

    describe('handleDefaults (heatmap-like version)', function() {
        var handleDefaults = Colorscale.handleDefaults;
        var layout = {
            font: Plots.layoutAttributes.font,
            _dfltTitle: {colorbar: 'cb'}
        };
        var opts = {prefix: '', cLetter: 'z'};
        var traceIn, traceOut;

        function coerce(attr, dflt) {
            return Lib.coerce(traceIn, traceOut, Heatmap.attributes, attr, dflt);
        }

        beforeEach(function() {
            traceOut = {};
        });

        it('should set auto to true when min/max are valid', function() {
            traceIn = {
                zmin: -10,
                zmax: 10
            };
            handleDefaults(traceIn, traceOut, layout, coerce, opts);
            expect(traceOut.zauto).toBe(false);
        });

        it('should fall back to auto true when min/max are invalid', function() {
            traceIn = {
                zmin: 'dsa',
                zmax: null
            };
            handleDefaults(traceIn, traceOut, layout, coerce, opts);
            expect(traceOut.zauto).toBe(true);

            traceIn = {
                zmin: 10,
                zmax: -10
            };
            handleDefaults(traceIn, traceOut, layout, coerce, opts);
            expect(traceOut.zauto).toBe(true);
        });

        it('should coerce autocolorscale to false unless set to true', function() {
            traceIn = {};
            handleDefaults(traceIn, traceOut, layout, coerce, opts);
            expect(traceOut.autocolorscale).toBe(false);

            traceIn = {
                colorscale: 'Greens'
            };
            handleDefaults(traceIn, traceOut, layout, coerce, opts);
            expect(traceOut.autocolorscale).toBe(false);

            traceIn = {
                autocolorscale: true
            };
            handleDefaults(traceIn, traceOut, layout, coerce, opts);
            expect(traceOut.autocolorscale).toBe(true);
        });

        it('should coerce showscale to true unless set to false', function() {
            traceIn = {};
            handleDefaults(traceIn, traceOut, layout, coerce, opts);
            expect(traceOut.showscale).toBe(true);

            traceIn = { showscale: false };
            handleDefaults(traceIn, traceOut, layout, coerce, opts);
            expect(traceOut.showscale).toBe(false);
        });
    });

    describe('handleDefaults (scatter-like version)', function() {
        var handleDefaults = Colorscale.handleDefaults;
        var layout = {
            font: Plots.layoutAttributes.font,
            _dfltTitle: {colorbar: 'cb'}
        };
        var opts = {prefix: 'marker.', cLetter: 'c'};
        var traceIn, traceOut;

        function coerce(attr, dflt) {
            return Lib.coerce(traceIn, traceOut, Scatter.attributes, attr, dflt);
        }

        beforeEach(function() {
            traceOut = { marker: {} };
        });

        it('should coerce autocolorscale to true by default', function() {
            traceIn = { marker: { line: {} } };
            handleDefaults(traceIn, traceOut, layout, coerce, opts);
            expect(traceOut.marker.autocolorscale).toBe(true);
        });

        it('should coerce autocolorscale to false when valid colorscale is given', function() {
            traceIn = {
                marker: { colorscale: 'Greens' }
            };
            handleDefaults(traceIn, traceOut, layout, coerce, opts);
            expect(traceOut.marker.autocolorscale).toBe(false);

            traceIn = {
                marker: { colorscale: 'nope' }
            };
            handleDefaults(traceIn, traceOut, layout, coerce, opts);
            expect(traceOut.marker.autocolorscale).toBe(true);
        });

        it('should coerce showscale to true if colorbar is specified', function() {
            traceIn = { marker: {} };
            handleDefaults(traceIn, traceOut, layout, coerce, opts);
            expect(traceOut.marker.showscale).toBe(false);

            traceIn = {
                marker: {
                    colorbar: {}
                }
            };
            handleDefaults(traceIn, traceOut, layout, coerce, opts);
            expect(traceOut.marker.showscale).toBe(true);
        });

    });

    describe('calc', function() {
        var calcColorscale = Colorscale.calc;
        var trace, z;
        var gd;

        beforeEach(function() {
            trace = {};
            z = {};
            gd = {};
        });

        it('should be RdBuNeg when autocolorscale and z <= 0', function() {
            trace = {
                type: 'heatmap',
                z: [[-0, -1.5], [-2, -10]],
                autocolorscale: true,
                _input: {autocolorscale: true}
            };
            gd = _supply(trace);
            calcColorscale(gd, trace, {vals: trace.z, containerStr: '', cLetter: 'z'});
            expect(trace.autocolorscale).toBe(true);
            expect(trace.colorscale[5]).toEqual([1, 'rgb(220,220,220)']);
        });

        it('should be layout.colorscale.sequentialminus when autocolorscale and z <= 0', function() {
            var colorscale = [[0, 'rgb(0,0,0)'], [1, 'rgb(255,255,255)']];
            trace = {
                type: 'heatmap',
                z: [[-0, -1.5], [-2, -10]],
                autocolorscale: true,
                _input: {autocolorscale: true}
            };
            var layout = {
                colorscale: {
                    sequentialminus: colorscale
                }
            };
            gd = _supply(trace, layout);
            calcColorscale(gd, trace, {vals: trace.z, containerStr: '', cLetter: 'z'});
            expect(trace.autocolorscale).toBe(true);
            expect(trace.colorscale).toEqual(colorscale);
        });

        it('should be Blues when the only numerical z <= -0.5', function() {
            trace = {
                type: 'heatmap',
                z: [['a', 'b'], [-0.5, 'd']],
                autocolorscale: true,
                _input: {autocolorscale: true}
            };
            z = [[undefined, undefined], [-0.5, undefined]];
            gd = _supply(trace);
            calcColorscale(gd, trace, {vals: z, containerStr: '', cLetter: 'z'});
            expect(trace.autocolorscale).toBe(true);
            expect(trace.colorscale[5]).toEqual([1, 'rgb(220,220,220)']);
        });

        it('should be layout.colorscale.sequentialminus when autocolorscale and the only numerical z <= -0.5', function() {
            var colorscale = [[0, 'rgb(0,0,0)'], [1, 'rgb(255,255,255)']];
            trace = {
                type: 'heatmap',
                z: [['a', 'b'], [-0.5, 'd']],
                autocolorscale: true,
                _input: {autocolorscale: true}
            };
            z = [[undefined, undefined], [-0.5, undefined]];
            var layout = {
                colorscale: {
                    sequentialminus: colorscale
                }
            };
            gd = _supply(trace, layout);
            calcColorscale(gd, trace, {vals: z, containerStr: '', cLetter: 'z'});
            expect(trace.autocolorscale).toBe(true);
            expect(trace.colorscale).toEqual(colorscale);
        });

        it('should be Reds when the only numerical z >= 0.5', function() {
            trace = {
                type: 'heatmap',
                z: [['a', 'b'], [0.5, 'd']],
                autocolorscale: true,
                _input: {autocolorscale: true}
            };
            z = [[undefined, undefined], [0.5, undefined]];
            gd = _supply(trace);
            calcColorscale(gd, trace, {vals: z, containerStr: '', cLetter: 'z'});
            expect(trace.autocolorscale).toBe(true);
            expect(trace.colorscale[0]).toEqual([0, 'rgb(220,220,220)']);
        });

        it('should be layout.colorscale.sequential when autocolorscale and the only numerical z >= 0.5', function() {
            var colorscale = [[0, 'rgb(0,0,0)'], [1, 'rgb(255,255,255)']];
            trace = {
                type: 'heatmap',
                z: [['a', 'b'], [0.5, 'd']],
                autocolorscale: true,
                _input: {autocolorscale: true}
            };
            z = [[undefined, undefined], [0.5, undefined]];
            var layout = {
                colorscale: {
                    sequential: colorscale
                }
            };
            gd = _supply(trace, layout);
            calcColorscale(gd, trace, {vals: z, containerStr: '', cLetter: 'z'});
            expect(trace.autocolorscale).toBe(true);
            expect(trace.colorscale).toEqual(colorscale);
        });

        it('should be layout.colorscale.diverging when autocolorscale and there are positive and negative values', function() {
            var colorscale = [[0, 'rgb(0,0,0)'], [1, 'rgb(255,255,255)']];
            trace = {
                type: 'heatmap',
                z: [[-1.0, 'b'], [0.5, 'd']],
                autocolorscale: true,
                _input: {autocolorscale: true}
            };
            z = [[-1.0, undefined], [0.5, undefined]];
            var layout = {
                colorscale: {
                    diverging: colorscale
                }
            };
            gd = _supply(trace, layout);
            calcColorscale(gd, trace, {vals: z, containerStr: '', cLetter: 'z'});
            expect(trace.autocolorscale).toBe(true);
            expect(trace.colorscale).toEqual(colorscale);
        });

        it('should ignore layout.colorscale.diverging when colorscale is defined at trace-level', function() {
            var colorscale = [[0, 'rgb(0,0,0)'], [1, 'rgb(255,255,255)']];
            var layoutColorscale = [[0, 'rgb(0,0,0)'], [1, 'rgb(255,255,255)']];
            trace = {
                type: 'heatmap',
                z: [[-1.0, 'b'], [0.5, 'd']],
                autocolorscale: true,
                _input: {autocolorscale: true},
                colorscale: colorscale
            };
            z = [[-1.0, undefined], [0.5, undefined]];
            var layout = {
                colorscale: {
                    diverging: layoutColorscale
                }
            };
            gd = _supply(trace, layout);
            calcColorscale(gd, trace, {vals: z, containerStr: '', cLetter: 'z'});
            expect(trace.autocolorscale).toBe(true);
            expect(trace.colorscale).toEqual(colorscale);
        });
    });

    describe('extractScale + makeColorScaleFunc', function() {
        var scale = [
            [0, 'rgb(5,10,172)'],
            [0.35, 'rgb(106,137,247)'],
            [0.5, 'rgb(190,190,190)'],
            [0.6, 'rgb(220,170,132)'],
            [0.7, 'rgb(230,145,90)'],
            [1, 'rgb(178,10,28)']
        ];

        it('should constrain color array values between cmin and cmax', function() {
            var trace = {
                colorscale: scale,
                pmin: 2,
                pmax: 3
            };

            var specs = Colorscale.extractScale(trace, {cLetter: 'p'});
            var sclFunc = Colorscale.makeColorScaleFunc(specs);

            var color1 = sclFunc(1);
            var color2 = sclFunc(2);
            var color3 = sclFunc(3);
            var color4 = sclFunc(4);

            expect(color1).toEqual(color2);
            expect(color1).toEqual('rgb(5, 10, 172)');
            expect(color3).toEqual(color4);
            expect(color4).toEqual('rgb(178, 10, 28)');
        });

        it('should flip color range when reversescale is true', function() {
            var trace = {
                colorscale: scale,
                reversescale: true,
                pmin: 2,
                pmax: 3
            };

            var specs = Colorscale.extractScale(trace, {cLetter: 'p'});
            var sclFunc = Colorscale.makeColorScaleFunc(specs);

            var color1 = sclFunc(1);
            var color2 = sclFunc(2);
            var color3 = sclFunc(3);
            var color4 = sclFunc(4);

            expect(color1).toEqual(color2);
            expect(color1).toEqual('rgb(178, 10, 28)');
            expect(color3).toEqual(color4);
            expect(color4).toEqual('rgb(5, 10, 172)');
        });
    });
});

describe('Test colorscale restyle calls:', function() {
    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(function() {
        Plotly.purge(gd);
        destroyGraphDiv();
    });

    function getFill(q) {
        return d3.select(q).node().style.fill;
    }

    it('should be able to toggle between autocolorscale true/false and set colorscales (contour case)', function(done) {
        function _assert(msg, exp) {
            var cc = [];
            cc.push(getFill('.contourbg > path'));
            d3.selectAll('.contourfill > path').each(function() {
                cc.push(getFill(this));
            });
            expect(cc).toEqual(exp.contourColors);

            expect(gd._fullData[0].colorscale).toEqual(exp.colorscale);
            expect(gd._fullData[0].autocolorscale).toBe(exp.autocolorscale, msg);

            expect(gd.data[0].colorscale).toEqual(exp.colorscaleIn);
            expect(gd.data[0].autocolorscale).toBe(exp.autocolorscaleIn, msg);
        }

        // update via, assert then assert again (and again ;) after non-calc edits
        function _run(msg, restyleObj, exp) {
            return Plotly.restyle(gd, restyleObj)
                .then(function() { _assert(msg, exp); })
                .then(function() { return Plotly.relayout(gd, 'xaxis.range', [-1, 5]); })
                .then(function() { _assert(msg + ' after axrange relayout', exp); })
                .then(function() { return Plotly.relayout(gd, 'xaxis.autorange', true); })
                .then(function() { _assert(msg + ' after autorange', exp); })
                .then(function() { return Plotly.restyle(gd, 'contours.showlines', true); })
                .then(function() { _assert(msg + ' after contours.showlines restyle', exp); })
                .then(function() { return Plotly.restyle(gd, 'contours.showlines', false); })
                .then(function() { _assert(msg + ' back to original contours.showlines', exp); });
        }

        var rdbu = ['rgb(5, 10, 172)', 'rgb(190, 190, 190)', 'rgb(178, 10, 28)'];
        var reds = ['rgb(220, 220, 220)', 'rgb(234, 135, 92)', 'rgb(178, 10, 28)'];
        var grns = ['rgb(0, 68, 27)', 'rgb(116, 196, 118)', 'rgb(247, 252, 245)'];

        Plotly.plot(gd, [{
            type: 'contour',
            z: [
                [1, 20, 30],
                [20, 1, 60],
                [30, 60, 1]
            ],
            ncontours: 3
        }])
        .then(function() {
            _assert('base (autocolorscale:false by dflt)', {
                contourColors: rdbu,
                autocolorscale: false,
                autocolorscaleIn: undefined,
                colorscale: Colorscale.scales.RdBu,
                colorscaleIn: undefined
            });
        })
        .then(function() {
            return _run('restyle to autocolorscale:true', {autocolorscale: true}, {
                contourColors: reds,
                autocolorscale: true,
                autocolorscaleIn: true,
                colorscale: Colorscale.scales.Reds,
                colorscaleIn: undefined
            });
        })
        .then(function() {
            return _run('restyle to reversescale:true with autocolorscale:true', {reversescale: true}, {
                contourColors: reds.slice().reverse(),
                autocolorscale: true,
                autocolorscaleIn: true,
                colorscale: Colorscale.scales.Reds,
                colorscaleIn: undefined
            });
        })
        .then(function() {
            return _run('restyle back to autocolorscale:false with reversescale:true', {autocolorscale: false}, {
                contourColors: rdbu.slice().reverse(),
                autocolorscale: false,
                autocolorscaleIn: false,
                colorscale: Colorscale.scales.RdBu,
                colorscaleIn: undefined
            });
        })
        .then(function() {
            return _run('restyle to *Greens* colorscale', {colorscale: 'Greens', reversescale: false}, {
                contourColors: grns,
                autocolorscale: false,
                autocolorscaleIn: false,
                colorscale: Colorscale.scales.Greens,
                colorscaleIn: 'Greens'
            });
        })
        .then(function() {
            return _run('restyle back again to autocolorscale:true', {autocolorscale: true}, {
                contourColors: reds,
                autocolorscale: true,
                autocolorscaleIn: true,
                colorscale: Colorscale.scales.Reds,
                colorscaleIn: 'Greens'
            });
        })
        .then(function() {
            return _run('restyle back to autocolorscale:false with colorscale:Greens', {autocolorscale: false}, {
                contourColors: grns,
                autocolorscale: false,
                autocolorscaleIn: false,
                colorscale: Colorscale.scales.Greens,
                colorscaleIn: 'Greens'
            });
        })
        .catch(failTest)
        .then(done);
    });

    it('should be able to toggle between autocolorscale true/false and set colorscales (scatter marker case)', function(done) {
        function _assert(msg, exp) {
            var mcc = [];
            d3.selectAll('path.point').each(function() {
                mcc.push(getFill(this));
            });
            expect(mcc).toEqual(exp.mcc);

            expect(gd._fullData[0].marker.colorscale).toEqual(exp.colorscale);
            expect(gd._fullData[0].marker.autocolorscale).toBe(exp.autocolorscale, msg);

            expect(gd.data[0].marker.colorscale).toEqual(exp.colorscaleIn);
            expect(gd.data[0].marker.autocolorscale).toBe(exp.autocolorscaleIn, msg);
        }

        // update via, assert then assert again (and again ;) after non-calc edits
        function _run(msg, restyleObj, exp) {
            return Plotly.restyle(gd, restyleObj)
                .then(function() { _assert(msg, exp); })
                .then(function() { return Plotly.relayout(gd, 'xaxis.range', [-1, 5]); })
                .then(function() { _assert(msg + ' after axrange relayout', exp); })
                .then(function() { return Plotly.relayout(gd, 'xaxis.autorange', true); })
                .then(function() { _assert(msg + ' after autorange', exp); })
                .then(function() { return Plotly.restyle(gd, 'marker.symbol', 'square'); })
                .then(function() { _assert(msg + ' after marker.symbol restyle', exp); })
                .then(function() { return Plotly.restyle(gd, 'marker.symbol', null); })
                .then(function() { _assert(msg + ' back to original marker.symbol', exp); });
        }

        var rdbu = ['rgb(5, 10, 172)', 'rgb(77, 101, 226)', 'rgb(178, 10, 28)'];
        var grns = ['rgb(0, 68, 27)', 'rgb(35, 139, 69)', 'rgb(247, 252, 245)'];

        Plotly.plot(gd, [{
            mode: 'markers',
            y: [1, 2, 3],
            marker: {color: [-1, 0, 3]}
        }])
        .then(function() {
            _assert('base (autocolorscale:true by dflt)', {
                mcc: rdbu,
                autocolorscale: true,
                autocolorscaleIn: undefined,
                colorscale: Colorscale.scales.RdBu,
                colorscaleIn: undefined
            });
        })
        .then(function() {
            return _run('set *Greens* colorscale', {'marker.colorscale': 'Greens'}, {
                mcc: grns,
                autocolorscale: false,
                autocolorscaleIn: false,
                colorscale: Colorscale.scales.Greens,
                colorscaleIn: 'Greens'
            });
        })
        .then(function() {
            return _run('back to autocolorscale:true', {'marker.autocolorscale': true}, {
                mcc: rdbu,
                autocolorscale: true,
                autocolorscaleIn: true,
                colorscale: Colorscale.scales.RdBu,
                colorscaleIn: 'Greens'
            });
        })
        .then(function() {
            return _run('back to autocolorscale:false w/ colorscale set', {'marker.autocolorscale': false}, {
                mcc: grns,
                autocolorscale: false,
                autocolorscaleIn: false,
                colorscale: Colorscale.scales.Greens,
                colorscaleIn: 'Greens'
            });
        })
        .catch(failTest)
        .then(done);
    });

    it('should be able to toggle between autocolorscale true/false and set colorscales (scatter marker line case)', function(done) {
        var mlw0 = 5;

        function _assert(msg, exp) {
            var mlcc = [];
            d3.selectAll('path.point').each(function() {
                mlcc.push(d3.select(this).node().style.stroke);
            });
            expect(mlcc).toEqual(exp.mlcc);

            expect(gd._fullData[0].marker.line.colorscale).toEqual(exp.colorscale);
            expect(gd._fullData[0].marker.line.autocolorscale).toBe(exp.autocolorscale, msg);

            expect(gd.data[0].marker.line.colorscale).toEqual(exp.colorscaleIn);
            expect(gd.data[0].marker.line.autocolorscale).toBe(exp.autocolorscaleIn, msg);
        }

        // update via, assert then assert again (and again ;) after non-calc edits
        function _run(msg, restyleObj, exp) {
            return Plotly.restyle(gd, restyleObj)
                .then(function() { _assert(msg, exp); })
                .then(function() { return Plotly.relayout(gd, 'xaxis.range', [-1, 5]); })
                .then(function() { _assert(msg + ' after axrange relayout', exp); })
                .then(function() { return Plotly.relayout(gd, 'xaxis.autorange', true); })
                .then(function() { _assert(msg + ' after autorange', exp); })
                .then(function() { return Plotly.restyle(gd, 'marker.line.width', 10); })
                .then(function() { _assert(msg + ' after marker lw restyle', exp); })
                .then(function() { return Plotly.restyle(gd, 'marker.line.width', mlw0); })
                .then(function() { _assert(msg + ' back to original marker lw', exp); });
        }

        var blues = ['rgb(220, 220, 220)', 'rgb(70, 100, 245)', 'rgb(5, 10, 172)'];
        var grns = ['rgb(247, 252, 245)', 'rgb(116, 196, 118)', 'rgb(0, 68, 27)'];

        Plotly.plot(gd, [{
            mode: 'markers',
            y: [1, 2, 3],
            marker: {
                size: 20,
                line: {
                    color: [-1, -2, -3],
                    width: mlw0
                }
            }
        }])
        .then(function() {
            _assert('base (autocolorscale:true by dflt)', {
                mlcc: blues,
                autocolorscale: true,
                autocolorscaleIn: undefined,
                colorscale: Colorscale.scales.Blues,
                colorscaleIn: undefined
            });
        })
        .then(function() {
            return _run('set *Greens* colorscale', {'marker.line.colorscale': 'Greens'}, {
                mlcc: grns,
                autocolorscale: false,
                autocolorscaleIn: false,
                colorscale: Colorscale.scales.Greens,
                colorscaleIn: 'Greens'
            });
        })
        .then(function() {
            return _run('back to autocolorscale:true', {'marker.line.autocolorscale': true}, {
                mlcc: blues,
                autocolorscale: true,
                autocolorscaleIn: true,
                colorscale: Colorscale.scales.Blues,
                colorscaleIn: 'Greens'
            });
        })
        .then(function() {
            return _run('back to autocolorscale:false w/ colorscale set', {'marker.line.autocolorscale': false}, {
                mlcc: grns,
                autocolorscale: false,
                autocolorscaleIn: false,
                colorscale: Colorscale.scales.Greens,
                colorscaleIn: 'Greens'
            });
        })
        .catch(failTest)
        .then(done);
    });

    it('should work with templates', function(done) {
        function _assert(msg, exp) {
            var mcc = [];
            d3.selectAll('path.point').each(function() {
                mcc.push(getFill(this));
            });

            expect(mcc).toEqual(exp.mcc);
        }

        var template = {
            data: {
                scatter: [{
                    marker: {colorscale: 'Viridis'}
                }]
            }
        };

        Plotly.plot(gd, [{
            y: [1, 2, 3],
            marker: {color: [1, 2, 3]}
        }])
        .then(function() {
            _assert('base - no templates', {
                mcc: ['rgb(220, 220, 220)', 'rgb(234, 135, 92)', 'rgb(178, 10, 28)']
            });
        })
        .then(function() {
            return Plotly.relayout(gd, 'template', template);
        })
        .then(function() {
            _assert('after relayouting in template', {
                mcc: ['rgb(68, 1, 84)', 'rgb(33, 145, 140)', 'rgb(253, 231, 37)']
            });
        })
        .catch(failTest)
        .then(done);
    });

    it('@gl should work with scatter3d', function(done) {
        Plotly.plot(gd, [{
            type: 'scatter3d',
            x: [1, 2, 3],
            y: [1, 2, 3],
            z: [1, 2, 1],
            marker: {color: [1, 2, 1], showscale: true}
        }])
        .then(function() {
            expect(gd._fullData[0].marker.cmin).toBe(1);
            expect(gd._fullData[0].marker.cmax).toBe(2);
        })
        .then(function() {
            // some non-calc edit
            return Plotly.relayout(gd, 'scene.dragmode', 'pab');
        })
        .then(function() {
            expect(gd._fullData[0].marker.cmin).toBe(1);
            expect(gd._fullData[0].marker.cmax).toBe(2);
        })
        .catch(failTest)
        .then(done);
    });
});
