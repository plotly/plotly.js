var Plotly = require('@lib/index');
var Gl3d = require('@src/plots/gl3d');

var tinycolor = require('tinycolor2');
var Color = require('@src/components/color');

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var failTest = require('../assets/fail_test');


describe('Test Gl3d layout defaults', function() {
    'use strict';

    describe('supplyLayoutDefaults', function() {
        var layoutIn, layoutOut, fullData;

        var supplyLayoutDefaults = Gl3d.supplyLayoutDefaults;

        beforeEach(function() {
            layoutOut = {
                _basePlotModules: ['gl3d'],
                _dfltTitle: {x: 'xxx', y: 'yyy', colorbar: 'cbbb'},
                _subplots: {gl3d: ['scene']}
            };

            // needs a scene-ref in a trace in order to be detected
            fullData = [ { type: 'scatter3d', scene: 'scene' }];
        });

        it('should coerce aspectmode=ratio when ratio data is valid', function() {
            var aspectratio = {
                x: 1,
                y: 2,
                z: 1
            };

            layoutIn = {
                scene: {
                    aspectmode: 'manual',
                    aspectratio: aspectratio
                }
            };

            var expected = {
                scene: {
                    aspectmode: 'manual',
                    aspectratio: aspectratio,
                    bgcolor: 'rgba(0,0,0,0)'
                }
            };

            supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            expect(layoutOut.scene.aspectmode).toBe(expected.scene.aspectmode);
            expect(layoutOut.scene.aspectratio).toEqual(expected.scene.aspectratio);
            expect(layoutOut.scene.bgcolor).toBe(expected.scene.bgcolor);
        });


        it('should coerce aspectmode=auto when aspect ratio data is invalid', function() {
            var aspectratio = {
                x: 'g',
                y: 2,
                z: 1
            };

            layoutIn = {
                scene: {
                    aspectmode: 'manual',
                    aspectratio: aspectratio
                }
            };

            var expected = {
                scene: {
                    aspectmode: 'auto',
                    aspectratio: {x: 1, y: 1, z: 1}
                }
            };

            supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            expect(layoutOut.scene.aspectmode).toBe(expected.scene.aspectmode);
            expect(layoutOut.scene.aspectratio).toEqual(expected.scene.aspectratio);
        });


        it('should coerce manual when valid ratio data but invalid aspectmode', function() {
            var aspectratio = {
                x: 1,
                y: 2,
                z: 1
            };

            layoutIn = {
                scene: {
                    aspectmode: {},
                    aspectratio: aspectratio
                }
            };

            var expected = {
                scene: {
                    aspectmode: 'manual',
                    aspectratio: {x: 1, y: 2, z: 1}
                }
            };

            supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            expect(layoutOut.scene.aspectmode).toBe(expected.scene.aspectmode);
            expect(layoutOut.scene.aspectratio).toEqual(expected.scene.aspectratio);
        });


        it('should not coerce manual when invalid ratio data but invalid aspectmode', function() {
            var aspectratio = {
                x: 'g',
                y: 2,
                z: 1
            };

            layoutIn = {
                scene: {
                    aspectmode: {},
                    aspectratio: aspectratio
                }
            };

            var expected = {
                scene: {
                    aspectmode: 'auto',
                    aspectratio: {x: 1, y: 1, z: 1}
                }
            };

            supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            expect(layoutOut.scene.aspectmode).toBe(expected.scene.aspectmode);
            expect(layoutOut.scene.aspectratio).toEqual(expected.scene.aspectratio);
        });


        it('should not coerce manual when valid ratio data and valid non-manual aspectmode', function() {
            var aspectratio = {
                x: 1,
                y: 2,
                z: 1
            };

            layoutIn = {
                scene: {
                    aspectmode: 'cube',
                    aspectratio: aspectratio
                }
            };

            var expected = {
                scene: {
                    aspectmode: 'cube',
                    aspectratio: {x: 1, y: 2, z: 1}
                }
            };

            supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            expect(layoutOut.scene.aspectmode).toBe(expected.scene.aspectmode);
            expect(layoutOut.scene.aspectratio).toEqual(expected.scene.aspectratio);
        });

        it('should coerce dragmode', function() {
            layoutIn = { scene: {} };
            supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            expect(layoutOut.scene.dragmode)
                .toBe('orbit', 'to orbit by default');

            layoutIn = { scene: { dragmode: 'turntable' } };
            supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            expect(layoutOut.scene.dragmode)
                .toBe('turntable', 'to user val if valid');

            layoutIn = { scene: {}, dragmode: 'turntable' };
            supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            expect(layoutOut.scene.dragmode)
                .toBe('turntable', 'to user layout val if valid and 3d only');

            layoutIn = { scene: {}, dragmode: 'invalid' };
            supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            expect(layoutOut.scene.dragmode)
                .toBe('orbit', 'to orbit if invalid and 3d only');

            layoutIn = { scene: {}, dragmode: 'orbit' };
            layoutOut._basePlotModules.push({ name: 'cartesian' });
            supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            expect(layoutOut.scene.dragmode)
                .toBe('orbit', 'to default if not 3d only');

            layoutIn = { scene: {}, dragmode: 'not gonna work' };
            supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            expect(layoutOut.scene.dragmode)
                .toBe('orbit', 'to default if not valid');
        });

        it('should coerce hovermode', function() {
            layoutIn = { scene: {} };
            supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            expect(layoutOut.scene.hovermode)
                .toBe('closest', 'to closest by default');

            layoutIn = { scene: { hovermode: false } };
            supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            expect(layoutOut.scene.hovermode)
                .toBe(false, 'to user val if valid');

            layoutIn = { scene: {}, hovermode: false };
            supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            expect(layoutOut.scene.hovermode)
                .toBe(false, 'to user layout val if valid and 3d only');

            layoutIn = { scene: {}, hovermode: 'invalid' };
            supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            expect(layoutOut.scene.hovermode)
                .toBe('closest', 'to closest if invalid and 3d only');

            layoutIn = { scene: {}, hovermode: false };
            layoutOut._basePlotModules.push({ name: 'cartesian' });
            supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            expect(layoutOut.scene.hovermode)
                .toBe('closest', 'to default if not 3d only');

            layoutIn = { scene: {}, hovermode: 'not gonna work' };
            supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            expect(layoutOut.scene.hovermode)
                .toBe('closest', 'to default if not valid');
        });

        it('should add data-only scenes into layoutIn', function() {
            layoutIn = {};
            fullData = [{ type: 'scatter3d', scene: 'scene' }];

            supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            expect(layoutIn.scene).toEqual({
                aspectratio: { x: 1, y: 1, z: 1 },
                aspectmode: 'auto'
            });
        });

        it('should add scene data-only scenes into layoutIn (converse)', function() {
            layoutIn = {};
            layoutOut._subplots.gl3d = [];
            fullData = [{ type: 'scatter' }];

            supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            expect(layoutIn.scene).toBe(undefined);
        });

        it('should use combo of \'axis.color\', bgcolor and lightFraction as default for \'axis.gridcolor\'', function() {
            layoutIn = {
                paper_bgcolor: 'green',
                scene: {
                    bgcolor: 'yellow',
                    xaxis: { showgrid: true, color: 'red' },
                    yaxis: { gridcolor: 'blue' },
                    zaxis: { showgrid: true }
                }
            };

            var bgColor = Color.combine('yellow', 'green'),
                frac = 100 * (204 - 0x44) / (255 - 0x44);

            supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            expect(layoutOut.scene.xaxis.gridcolor)
                .toEqual(tinycolor.mix('red', bgColor, frac).toRgbString());
            expect(layoutOut.scene.yaxis.gridcolor).toEqual('blue');
            expect(layoutOut.scene.zaxis.gridcolor)
                .toEqual(tinycolor.mix('#444', bgColor, frac).toRgbString());
        });
    });
});

describe('Gl3d layout edge cases', function() {
    var gd;

    beforeEach(function() {gd = createGraphDiv(); });
    afterEach(destroyGraphDiv);

    it('should handle auto aspect ratio correctly on data changes', function(done) {
        Plotly.plot(gd, [{x: [1, 2], y: [1, 3], z: [1, 4], type: 'scatter3d'}])
        .then(function() {
            var aspect = gd.layout.scene.aspectratio;
            expect(aspect.x).toBeCloseTo(0.5503);
            expect(aspect.y).toBeCloseTo(1.1006);
            expect(aspect.z).toBeCloseTo(1.6510);

            return Plotly.restyle(gd, 'x', [[1, 6]]);
        })
        .then(function() {
            /*
             * Check that now it's the same as if you had just made the plot with
             * x: [1, 6] in the first place
             */
            var aspect = gd.layout.scene.aspectratio;
            expect(aspect.x).toBeCloseTo(1.6091);
            expect(aspect.y).toBeCloseTo(0.6437);
            expect(aspect.z).toBeCloseTo(0.9655);
        })
        .catch(failTest)
        .then(done);
    });

});
