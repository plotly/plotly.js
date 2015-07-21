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

    describe('Plotly.Plots.getSubplotIdsInData', function() {
        var getSubplotIdsInData = Plotly.Plots.getSubplotIdsInData;

        var ids, data;

        it('it should return scene ids', function() {
            data = [
                {
                    type: 'scatter3d',
                    scene: 'scene'
                },
                {
                    type: 'surface',
                    scene: 'scene2'
                },
                {
                    type: 'choropleth',
                    geo: 'geo'
                }
            ];

            ids = getSubplotIdsInData(data, 'geo');
            expect(ids).toEqual(['geo']);

            ids = getSubplotIdsInData(data, 'gl3d');
            expect(ids).toEqual(['scene', 'scene2']);
        });

    });

    describe('Plotly.Plots.register, getModule, and traceIs', function() {
        beforeEach(function() {
            this.modulesKeys = Object.keys(Plotly.Plots.modules);
            this.allTypesKeys = Object.keys(Plotly.Plots.allTypes);
            this.allCategoriesKeys = Object.keys(Plotly.Plots.allCategories);

            this.fakeModule = {
                calc: function() { return 42; },
                plot: function() { return 1000000; }
            };
            this.fakeModule2 = {
                plot: function() { throw new Error('nope!'); }
            };

            Plotly.Plots.register(this.fakeModule, 'newtype', ['red', 'green']);

            spyOn(console, 'warn');
        });

        afterEach(function() {
            function revertObj(obj, initialKeys) {
                Object.keys(obj).forEach(function(k) {
                    if(initialKeys.indexOf(k) === -1) delete obj[k];
                });
            }

            revertObj(Plotly.Plots.modules, this.modulesKeys);
            revertObj(Plotly.Plots.allTypes, this.allTypesKeys);
            revertObj(Plotly.Plots.allCategories, this.allCategoriesKeys);
        });

        it('should error on attempts to reregister a type', function() {
            var fm2 = this.fakeModule2;
            expect(function() { Plotly.Plots.register(fm2, 'newtype', ['yellow', 'blue']); })
                .toThrow(new Error('type newtype already registered'));
            expect(Plotly.Plots.allCategories.yellow).toBeUndefined();
        });

        it('should find the module for a type', function() {
            expect(Plotly.Plots.getModule('newtype')).toBe(this.fakeModule);
            expect(Plotly.Plots.getModule({type: 'newtype'})).toBe(this.fakeModule);
        });

        it('should return false for types it doesn\'t know', function() {
            expect(Plotly.Plots.getModule('notatype')).toBe(false);
            expect(Plotly.Plots.getModule({type: 'notatype'})).toBe(false);
            expect(Plotly.Plots.getModule({type: 'newtype', r: 'this is polar'})).toBe(false);
        });

        it('should find the categories for this type', function() {
            expect(Plotly.Plots.traceIs('newtype', 'red')).toBe(true);
            expect(Plotly.Plots.traceIs({type: 'newtype'}, 'red')).toBe(true);
        });

        it('should not find other real categories', function() {
            expect(Plotly.Plots.traceIs('newtype', 'cartesian')).toBe(false);
            expect(Plotly.Plots.traceIs({type: 'newtype'}, 'cartesian')).toBe(false);
            expect(console.warn).not.toHaveBeenCalled();
        });
    });
});
