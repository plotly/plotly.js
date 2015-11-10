var Plotly = require('@src/plotly');

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

    describe('Plotly.Plots.supplyDataDefaults', function() {
        var supplyDataDefaults = Plotly.Plots.supplyDataDefaults,
            layout = {};

        var traceIn, traceOut;

        describe('should coerce hoverinfo', function() {
            it('without *name* for single-trace graphs by default', function() {
                layout._dataLength = 1;

                traceIn = {};
                traceOut = supplyDataDefaults(traceIn, 0, layout);
                expect(traceOut.hoverinfo).toEqual('x+y+z+text');

                traceIn = { hoverinfo: 'name' };
                traceOut = supplyDataDefaults(traceIn, 0, layout);
                expect(traceOut.hoverinfo).toEqual('name');
            });

            it('without *name* for single-trace graphs by default', function() {
                layout._dataLength = 2;

                traceIn = {};
                traceOut = supplyDataDefaults(traceIn, 0, layout);
                expect(traceOut.hoverinfo).toEqual('all');

                traceIn = { hoverinfo: 'name' };
                traceOut = supplyDataDefaults(traceIn, 0, layout);
                expect(traceOut.hoverinfo).toEqual('name');
            });
        });
    });

    describe('Plotly.Plots.getSubplotIds', function() {
        var getSubplotIds = Plotly.Plots.getSubplotIds;
        var layout;

        it('returns scene ids', function() {
            layout = {
                scene: {},
                scene2: {},
                scene3: {}
            };

            expect(getSubplotIds(layout, 'gl3d'))
                .toEqual(['scene', 'scene2', 'scene3']);

            expect(getSubplotIds(layout, 'cartesian'))
                .toEqual([]);

            expect(getSubplotIds(layout, 'no-valid-subplot-type'))
                .toEqual([]);
        });

        it('returns cartesian ids', function() {
            layout = {
                _plots: { xy: {}, x2y2: {} }
            };

            expect(getSubplotIds(layout, 'cartesian'))
                .toEqual([]);

            layout._hasCartesian = true;
            expect(getSubplotIds(layout, 'cartesian'))
                .toEqual(['xy', 'x2y2']);
            expect(getSubplotIds(layout, 'gl2d'))
                .toEqual([]);

            delete layout._hasCartesian;
            layout._hasGL2D = true;
            expect(getSubplotIds(layout, 'gl2d'))
                .toEqual(['xy', 'x2y2']);
            expect(getSubplotIds(layout, 'cartesian'))
                .toEqual([]);

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

    describe('Plotly.Plots.registerSubplot', function() {
        Plotly.Plots.registerSubplot('fake', 'abc', 'cba', {
            stuff: { 'more stuff': 102102 }
        });

        var subplotsRegistry = Plotly.Plots.subplotsRegistry;

        it('should register attr, idRoot and attributes', function() {
            expect(subplotsRegistry.fake.attr).toEqual('abc');
            expect(subplotsRegistry.fake.idRoot).toEqual('cba');
            expect(subplotsRegistry.fake.attributes)
                .toEqual({stuff: { 'more stuff': 102102 }});
        });

        describe('registered subplot type attribute regex', function() {
            it('should compile to correct attribute regex string', function() {
                expect(subplotsRegistry.fake.attrRegex.toString())
                    .toEqual('/^abc([2-9]|[1-9][0-9]+)?$/');
            });

            var shouldPass = [
                'abc', 'abc2', 'abc3', 'abc10', 'abc9', 'abc100', 'abc2002'
            ];
            var shouldFail = [
                '0abc', 'abc0', 'abc1', 'abc021321', 'abc00021321'
            ];

            shouldPass.forEach(function(s) {
                it('considers ' + JSON.stringify(s) + 'as a correct attribute name', function () {
                    expect(subplotsRegistry.fake.attrRegex.test(s)).toBe(true);
                });
            });

            shouldFail.forEach(function(s) {
                it('considers ' + JSON.stringify(s) + 'as an incorrect attribute name', function () {
                    expect(subplotsRegistry.fake.attrRegex.test(s)).toBe(false);
                });
            });
        });

        describe('registered subplot type id regex', function() {
            it('should compile to correct id regular expression', function() {
                expect(subplotsRegistry.fake.idRegex.toString())
                    .toEqual('/^cba([2-9]|[1-9][0-9]+)?$/');
            });

            var shouldPass = [
                'cba', 'cba2', 'cba3', 'cba10', 'cba9', 'cba100', 'cba2002'
            ];
            var shouldFail = [
                '0cba', 'cba0', 'cba1', 'cba021321', 'cba00021321'
            ];

            shouldPass.forEach(function(s) {
                it('considers ' + JSON.stringify(s) + 'as a correct attribute name', function () {
                    expect(subplotsRegistry.fake.idRegex.test(s)).toBe(true);
                });
            });

            shouldFail.forEach(function(s) {
                it('considers ' + JSON.stringify(s) + 'as an incorrect attribute name', function () {
                    expect(subplotsRegistry.fake.idRegex.test(s)).toBe(false);
                });
            });
        });

    });
});
