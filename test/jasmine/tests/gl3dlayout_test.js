var Gl3d = require('@src/plots/gl3d');

var tinycolor = require('tinycolor2');
var Color = require('@src/components/color');


describe('Test Gl3d layout defaults', function() {
    'use strict';

    describe('supplyLayoutDefaults', function() {
        var layoutIn, layoutOut, fullData;

        var supplyLayoutDefaults = Gl3d.supplyLayoutDefaults;

        beforeEach(function() {
            // if hasGL3D is not at this stage, the default step is skipped
            layoutOut = { _hasGL3D: true };

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
                .toBe('turntable', 'to turntable by default');

            layoutIn = { scene: { dragmode: 'orbit' } };
            supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            expect(layoutOut.scene.dragmode)
                .toBe('orbit', 'to user val if valid');

            layoutIn = { scene: {}, dragmode: 'orbit' };
            supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            expect(layoutOut.scene.dragmode)
                .toBe('orbit', 'to user layout val if valid and 3d only');

            layoutIn = { scene: {}, dragmode: 'orbit' };
            layoutOut._hasCartesian = true;
            supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            expect(layoutOut.scene.dragmode)
                .toBe('turntable', 'to default if not 3d only');

            layoutIn = { scene: {}, dragmode: 'not gonna work' };
            supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            expect(layoutOut.scene.dragmode)
                .toBe('turntable', 'to default if not valid');
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

            layoutIn = { scene: {}, hovermode: false };
            layoutOut._hasCartesian = true;
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
                aspectratio: { x: 1, y: 1, z: 1 }
            });
        });

        it('should add scene data-only scenes into layoutIn (converse)', function() {
            layoutIn = {};
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
