var Fx = require('@src/plots/cartesian/graph_interact');
var Plots = require('@src/plots/plots');


describe('Test FX', function() {
    'use strict';

    describe('defaults', function() {

        var layoutIn, layoutOut, fullData;

        beforeEach(function() {
            layoutIn = {};
            layoutOut = {
                _has: Plots._hasPlotType
            };
            fullData = [{}];
        });

        it('should default (blank version)', function() {
            Fx.supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            expect(layoutOut.hovermode).toBe('closest', 'hovermode to closest');
            expect(layoutOut.dragmode).toBe('zoom', 'dragmode to zoom');
        });

        it('should default (cartesian version)', function() {
            layoutOut._basePlotModules = [{ name: 'cartesian' }];

            Fx.supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            expect(layoutOut.hovermode).toBe('x', 'hovermode to x');
            expect(layoutOut.dragmode).toBe('zoom', 'dragmode to zoom');
            expect(layoutOut._isHoriz).toBe(false, 'isHoriz to false');
        });

        it('should default (cartesian horizontal version)', function() {
            layoutOut._basePlotModules = [{ name: 'cartesian' }];
            fullData[0] = { orientation: 'h' };

            Fx.supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            expect(layoutOut.hovermode).toBe('y', 'hovermode to y');
            expect(layoutOut.dragmode).toBe('zoom', 'dragmode to zoom');
            expect(layoutOut._isHoriz).toBe(true, 'isHoriz to true');
        });

        it('should default (gl3d version)', function() {
            layoutOut._basePlotModules = [{ name: 'gl3d' }];

            Fx.supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            expect(layoutOut.hovermode).toBe('closest', 'hovermode to closest');
            expect(layoutOut.dragmode).toBe('zoom', 'dragmode to zoom');
        });

        it('should default (geo version)', function() {
            layoutOut._basePlotModules = [{ name: 'geo' }];

            Fx.supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            expect(layoutOut.hovermode).toBe('closest', 'hovermode to closest');
            expect(layoutOut.dragmode).toBe('zoom', 'dragmode to zoom');
        });

        it('should default (multi plot type version)', function() {
            layoutOut._basePlotModules = [{ name: 'cartesian' }, { name: 'gl3d' }];

            Fx.supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            expect(layoutOut.hovermode).toBe('x', 'hovermode to x');
            expect(layoutOut.dragmode).toBe('zoom', 'dragmode to zoom');
        });
    });
});
