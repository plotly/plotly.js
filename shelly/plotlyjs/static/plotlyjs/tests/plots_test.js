var Plotly = require('../src/plotly');

describe('Test Plotly.Plots', function () {
    'use strict';

    describe('Plotly.Plots.supplyLayoutGlobalDefaults should', function() {
        var layoutIn,
            layoutOut,
            expected;

        var supplyLayoutDefaults = Plotly.Plots.supplyLayoutGlobalDefaults;

        beforeEach(function() {
            layoutOut = {};
        });

        it('should sanitize margins when they are wider than the plot', function() {
            layoutIn = {
                width: 500,
                height: 500,
                margin: {
                    l: 400,
                    r: 200
                }
            };
            expected = {
                l: 332,
                r: 166,
                t: 100,
                b: 80,
                pad: 0,
                autoexpand: true
            };

            supplyLayoutDefaults(layoutIn, layoutOut);
            expect(layoutOut.margin).toEqual(expected);
        });

        it('should sanitize margins when they are taller than the plot', function() {
            layoutIn = {
                width: 500,
                height: 500,
                margin: {
                    l: 400,
                    r: 200,
                    t: 300,
                    b: 500
                }
            };
            expected = {
                l: 332,
                r: 166,
                t: 187,
                b: 311,
                pad: 0,
                autoexpand: true
            };

            supplyLayoutDefaults(layoutIn, layoutOut);
            expect(layoutOut.margin).toEqual(expected);
        });

    });

    describe('Plotly.Plots.getSubplotIds', function() {
        var getSubplotIds = Plotly.Plots.getSubplotIds;

        var ids, layout;

        it('it should return scene ids', function() {
            layout = {
                scene: {},
                scene2: {},
                scene3: {}
            };

            ids = getSubplotIds(layout, 'gl3d');
            expect(ids).toEqual(['scene', 'scene2', 'scene3']);
        });

    });

});
