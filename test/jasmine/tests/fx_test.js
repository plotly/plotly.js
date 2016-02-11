var Fx = require('@src/plots/cartesian/graph_interact');


describe('Test FX', function() {
    'use strict';

    describe('defaults', function() {

        it('should default (blank version)', function() {
            var layoutIn = {};
            var layoutOut = {};
            var fullData = [{}];

            Fx.supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            expect(layoutOut.hovermode).toBe('closest', 'hovermode to closest');
            expect(layoutOut.dragmode).toBe('zoom', 'dragmode to zoom');
        });

        it('should default (cartesian version)', function() {
            var layoutIn = {};
            var layoutOut = {
                _hasCartesian: true
            };
            var fullData = [{}];

            Fx.supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            expect(layoutOut.hovermode).toBe('x', 'hovermode to x');
            expect(layoutOut.dragmode).toBe('zoom', 'dragmode to zoom');
            expect(layoutOut._isHoriz).toBe(false, 'isHoriz to false');
        });

        it('should default (cartesian horizontal version)', function() {
            var layoutIn = {};
            var layoutOut = {
                _hasCartesian: true
            };
            var fullData = [{
                orientation: 'h'
            }];

            Fx.supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            expect(layoutOut.hovermode).toBe('y', 'hovermode to y');
            expect(layoutOut.dragmode).toBe('zoom', 'dragmode to zoom');
            expect(layoutOut._isHoriz).toBe(true, 'isHoriz to true');
        });

        it('should default (gl3d version)', function() {
            var layoutIn = {};
            var layoutOut = {
                _hasGL3D: true
            };
            var fullData = [{}];

            Fx.supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            expect(layoutOut.hovermode).toBe('closest', 'hovermode to closest');
            expect(layoutOut.dragmode).toBe('zoom', 'dragmode to zoom');
        });

        it('should default (geo version)', function() {
            var layoutIn = {};
            var layoutOut = {
                _hasGeo: true
            };
            var fullData = [{}];

            Fx.supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            expect(layoutOut.hovermode).toBe('closest', 'hovermode to closest');
            expect(layoutOut.dragmode).toBe('zoom', 'dragmode to zoom');
        });

        it('should default (multi plot type version)', function() {
            var layoutIn = {};
            var layoutOut = {
                _hasCartesian: true,
                _hasGL3D: true
            };
            var fullData = [{}];

            Fx.supplyLayoutDefaults(layoutIn, layoutOut, fullData);
            expect(layoutOut.hovermode).toBe('x', 'hovermode to x');
            expect(layoutOut.dragmode).toBe('zoom', 'dragmode to zoom');
        });
    });
});
