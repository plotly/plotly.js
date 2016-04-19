var Colorscale = require('@src/components/colorscale');
var Lib = require('@src/lib');
var Plots = require('@src/plots/plots');
var Heatmap = require('@src/traces/heatmap');
var Scatter = require('@src/traces/scatter');


describe('Test colorscale:', function() {
    'use strict';

    describe('isValidScale', function() {
        var isValidScale = Colorscale.isValidScale,
            scl;

        it('should accept colorscale strings', function() {
            expect(isValidScale('Earth')).toBe(true);
            expect(isValidScale('Greens')).toBe(true);
            expect(isValidScale('Nop')).toBe(false);
        });

        it('should accept only array of 2-item arrays', function() {
            expect(isValidScale('a')).toBe(false);
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
        var flipScale = Colorscale.flipScale,
            scl;

        it('should flip a colorscale', function() {
            scl = [[0, 'rgb(0, 0, 200)'], ['0.5', 'rgb(0, 0, 0)'], ['1.0', 'rgb(200, 0, 0)']];
            expect(flipScale(scl)).toEqual(
                [[0, 'rgb(200, 0, 0)'], [0.5, 'rgb(0, 0, 0)'], [1, 'rgb(0, 0, 200)']]
            );

        });
    });

    describe('hasColorscale', function() {
        var hasColorscale = Colorscale.hasColorscale,
            trace;

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
    });

    describe('handleDefaults (heatmap-like version)', function() {
        var handleDefaults = Colorscale.handleDefaults,
            layout = {
                font: Plots.layoutAttributes.font
            },
            opts = {prefix: '', cLetter: 'z'};
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
        var handleDefaults = Colorscale.handleDefaults,
            layout = {
                font: Plots.layoutAttributes.font
            },
            opts = {prefix: 'marker.', cLetter: 'c'};
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

        beforeEach(function() {
            trace = {};
            z = {};
        });

        it('should be RdBuNeg when autocolorscale and z <= 0', function() {
            trace = {
                type: 'heatmap',
                z: [[0, -1.5], [-2, -10]],
                autocolorscale: true,
                _input: {}
            };
            z = [[0, -1.5], [-2, -10]];
            calcColorscale(trace, z, '', 'z');
            expect(trace.autocolorscale).toBe(true);
            expect(trace.colorscale[5]).toEqual([1, 'rgb(220,220,220)']);
        });

        it('should be Blues when the only numerical z <= -0.5', function() {
            trace = {
                type: 'heatmap',
                z: [['a', 'b'], [-0.5, 'd']],
                autocolorscale: true,
                _input: {}
            };
            z = [[undefined, undefined], [-0.5, undefined]];
            calcColorscale(trace, z, '', 'z');
            expect(trace.autocolorscale).toBe(true);
            expect(trace.colorscale[5]).toEqual([1, 'rgb(220,220,220)']);
        });

        it('should be Reds when the only numerical z >= 0.5', function() {
            trace = {
                type: 'heatmap',
                z: [['a', 'b'], [0.5, 'd']],
                autocolorscale: true,
                _input: {}
            };
            z = [[undefined, undefined], [0.5, undefined]];
            calcColorscale(trace, z, '', 'z');
            expect(trace.autocolorscale).toBe(true);
            expect(trace.colorscale[0]).toEqual([0, 'rgb(220,220,220)']);
        });

        it('should be reverse the auto scale when reversescale is true', function() {
            trace = {
                type: 'heatmap',
                z: [['a', 'b'], [0.5, 'd']],
                autocolorscale: true,
                reversescale: true,
                _input: {}
            };
            z = [[undefined, undefined], [0.5, undefined]];
            calcColorscale(trace, z, '', 'z');
            expect(trace.autocolorscale).toBe(true);
            expect(trace.colorscale[trace.colorscale.length-1])
                .toEqual([1, 'rgb(220,220,220)']);
        });

    });

    describe('makeScaleFunction', function() {
        var scale = [
                [0,'rgb(5,10,172)'],
                [0.35,'rgb(106,137,247)'],
                [0.5,'rgb(190,190,190)'],
                [0.6,'rgb(220,170,132)'],
                [0.7,'rgb(230,145,90)'],
                [1,'rgb(178,10,28)']
            ],
            scaleFunction = Colorscale.makeScaleFunction(scale, 2, 3);

        it('should constrain color array values between cmin and cmax', function() {
            var color1 = scaleFunction(1),
                color2 = scaleFunction(2),
                color3 = scaleFunction(3),
                color4 = scaleFunction(4);

            expect(color1).toEqual(color2);
            expect(color1).toEqual('rgb(5, 10, 172)');
            expect(color3).toEqual(color4);
            expect(color4).toEqual('rgb(178, 10, 28)');
        });
    });
});
