var Surface = require('@src/traces/surface');


describe('Test surface', function() {
    'use strict';

    describe('supplyDefaults', function() {
        var supplyDefaults = Surface.supplyDefaults;

        var defaultColor = '#444',
            layout = {};

        var traceIn, traceOut;

        beforeEach(function() {
            traceOut = {};
        });

        it('should set \'visible\' to false if \'z\' isn\'t provided', function() {
            traceIn = {};

            supplyDefaults(traceIn, traceOut, defaultColor, layout);
            expect(traceOut.visible).toBe(false);
        });

        it('should fill \'x\' and \'y\' if not provided', function() {
            traceIn = {
                z: [[1,2,3], [2,1,2]]
            };

            supplyDefaults(traceIn, traceOut, defaultColor, layout);
            expect(traceOut.x).toEqual([0,1,2]);
            expect(traceOut.y).toEqual([0,1]);
        });

        it('should coerce \'project\' if contours or highlight lines are enabled', function() {
            traceIn = {
                z: [[1,2,3], [2,1,2]],
                contours: {
                    x: { show: true }
                }
            };

            supplyDefaults(traceIn, traceOut, defaultColor, layout);
            expect(traceOut.contours.x.project).toEqual({ x: false, y: false, z: false });
            expect(traceOut.contours.y).toEqual({ show: false, highlight: false });
            expect(traceOut.contours.z).toEqual({ show: false, highlight: false });
        });

        it('should coerce contour style attributes if contours lines are enabled', function() {
            traceIn = {
                z: [[1,2,3], [2,1,2]],
                contours: {
                    x: { show: true }
                }
            };

            supplyDefaults(traceIn, traceOut, defaultColor, layout);
            expect(traceOut.contours.x.color).toEqual('#000');
            expect(traceOut.contours.x.width).toEqual(2);
            expect(traceOut.contours.x.usecolormap).toEqual(false);

            ['y', 'z'].forEach(function(ax) {
                expect(traceOut.contours[ax].color).toBeUndefined();
                expect(traceOut.contours[ax].width).toBeUndefined();
                expect(traceOut.contours[ax].usecolormap).toBeUndefined();
            });
        });

        it('should coerce colorscale and colorbar attributes', function() {
            traceIn = {
                z: [[1,2,3], [2,1,2]]
            };

            supplyDefaults(traceIn, traceOut, defaultColor, layout);
            expect(traceOut.cauto).toBe(true);
            expect(traceOut.cmin).toBeUndefined();
            expect(traceOut.cmax).toBeUndefined();
            expect(traceOut.colorscale).toEqual([
                [0, 'rgb(5,10,172)'],
                [0.35, 'rgb(106,137,247)'],
                [0.5, 'rgb(190,190,190)'],
                [0.6, 'rgb(220,170,132)'],
                [0.7, 'rgb(230,145,90)'],
                [1, 'rgb(178,10,28)']
            ]);
            expect(traceOut.showscale).toBe(true);
            expect(traceOut.colorbar).toBeDefined();
        });

        it('should coerce \'c\' attributes with \'z\' if \'c\' isn\'t present', function() {
            traceIn = {
                z: [[1,2,3], [2,1,2]],
                zauto: false,
                zmin: 0,
                zmax: 10
            };

            supplyDefaults(traceIn, traceOut, defaultColor, layout);
            expect(traceOut.cauto).toEqual(false);
            expect(traceOut.cmin).toEqual(0);
            expect(traceOut.cmax).toEqual(10);
        });

        it('should coerce \'c\' attributes with \'c\' values regardless of `\'z\' if \'c\' is present', function() {
            traceIn = {
                z: [[1,2,3], [2,1,2]],
                zauto: false,
                zmin: 0,
                zmax: 10,
                cauto: true,
                cmin: -10,
                cmax: 20
            };

            supplyDefaults(traceIn, traceOut, defaultColor, layout);
            expect(traceOut.cauto).toEqual(true);
            expect(traceOut.cmin).toEqual(-10);
            expect(traceOut.cmax).toEqual(20);
        });

        it('should default \'c\' attributes with if \'surfacecolor\' is present', function() {
            traceIn = {
                z: [[1,2,3], [2,1,2]],
                surfacecolor: [[2,1,2], [1,2,3]],
                zauto: false,
                zmin: 0,
                zmax: 10
            };

            supplyDefaults(traceIn, traceOut, defaultColor, layout);
            expect(traceOut.cauto).toEqual(true);
            expect(traceOut.cmin).toBeUndefined();
            expect(traceOut.cmax).toBeUndefined();
        });
    });
});
