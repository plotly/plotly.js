var Plotly = require('@src/plotly');

describe('Test Gl3dLayout', function () {
    'use strict';

    describe('supplyLayoutDefaults', function() {
        var layoutIn,
            layoutOut;

        var supplyLayoutDefaults = Plotly.Gl3dLayout.supplyLayoutDefaults;

        beforeEach(function() {
            layoutOut = {
                _hasGL3D: true
            };
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

            supplyLayoutDefaults(layoutIn, layoutOut, [{scene: 'scene', type: 'scatter3d'}]);
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

            supplyLayoutDefaults(layoutIn, layoutOut, [{scene: 'scene', type: 'scatter3d'}]);
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

            supplyLayoutDefaults(layoutIn, layoutOut, [{scene: 'scene', type: 'scatter3d'}]);
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

            supplyLayoutDefaults(layoutIn, layoutOut, [{scene: 'scene', type: 'scatter3d'}]);
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

            supplyLayoutDefaults(layoutIn, layoutOut, [{scene: 'scene', type: 'scatter3d'}]);
            expect(layoutOut.scene.aspectmode).toBe(expected.scene.aspectmode);
            expect(layoutOut.scene.aspectratio).toEqual(expected.scene.aspectratio);
        });



    });
});
