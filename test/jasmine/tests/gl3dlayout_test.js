var Gl3d = require('@src/plots/gl3d');


fdescribe('Test Gl3d layout defaults', function() {
    'use strict';

    describe('supplyLayoutDefaults', function() {
        var supplyLayoutDefaults = Gl3d.supplyLayoutDefaults;
        var layoutIn, layoutOut, fullData;

        beforeEach(function() {
            layoutOut = {_hasGL3D: true};
            fullData = [{scene: 'scene', type: 'scatter3d'}];
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
            layoutIn = {};
            supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            expect(layoutOut.scene.dragmode)
                .toBe('turntable', 'to turntable by default');

            layoutIn = { scene: { dragmode: 'orbit' } };
            supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            expect(layoutOut.scene.dragmode)
                .toBe('orbit', 'to user val if valid');

            layoutIn = { dragmode: 'orbit' };
            supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            expect(layoutOut.scene.dragmode)
                .toBe('orbit', 'to user layout val if valid and 3d only');

            layoutIn = { dragmode: 'orbit' };
            layoutOut._hasCartesian = true;
            supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            expect(layoutOut.scene.dragmode)
                .toBe('turntable', 'to default if not 3d only');

            layoutIn = { dragmode: 'not gonna work' };
            supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            expect(layoutOut.scene.dragmode)
                .toBe('turntable', 'to default if not valid');
        });

        it('should coerce hovermode', function() {
            layoutIn = {};
            supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            expect(layoutOut.scene.hovermode)
                .toBe('closest', 'to closest by default');

            layoutIn = { scene: { hovermode: false } };
            supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            expect(layoutOut.scene.hovermode)
                .toBe(false, 'to user val if valid');

            layoutIn = { hovermode: false };
            supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            expect(layoutOut.scene.hovermode)
                .toBe(false, 'to user layout val if valid and 3d only');

            layoutIn = { hovermode: false };
            layoutOut._hasCartesian = true;
            supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            expect(layoutOut.scene.hovermode)
                .toBe('closest', 'to default if not 3d only');

            layoutIn = { hovermode: 'not gonna work' };
            supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            expect(layoutOut.scene.hovermode)
                .toBe('closest', 'to default if not valid');
        });
    });
});
