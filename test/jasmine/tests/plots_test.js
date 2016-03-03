var Plotly = require('@lib/index');
var Plots = require('@src/plots/plots');
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');


describe('Test Plots', function() {
    'use strict';

    describe('Plots.supplyLayoutGlobalDefaults should', function() {
        var layoutIn,
            layoutOut,
            expected;

        var supplyLayoutDefaults = Plots.supplyLayoutGlobalDefaults;

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

    describe('Plots.supplyDataDefaults', function() {
        var supplyDataDefaults = Plots.supplyDataDefaults,
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

    describe('Plots.getSubplotIds', function() {
        var getSubplotIds = Plots.getSubplotIds;

        it('returns scene ids in order', function() {
            var layout = {
                scene2: {},
                scene: {},
                scene3: {}
            };

            expect(getSubplotIds(layout, 'gl3d'))
                .toEqual(['scene', 'scene2', 'scene3']);

            expect(getSubplotIds(layout, 'cartesian'))
                .toEqual([]);
            expect(getSubplotIds(layout, 'geo'))
                .toEqual([]);
            expect(getSubplotIds(layout, 'no-valid-subplot-type'))
                .toEqual([]);
        });

        it('returns geo ids in order', function() {
            var layout = {
                geo2: {},
                geo: {},
                geo3: {}
            };

            expect(getSubplotIds(layout, 'geo'))
                .toEqual(['geo', 'geo2', 'geo3']);

            expect(getSubplotIds(layout, 'cartesian'))
                .toEqual([]);
            expect(getSubplotIds(layout, 'gl3d'))
                .toEqual([]);
            expect(getSubplotIds(layout, 'no-valid-subplot-type'))
                .toEqual([]);
        });

        it('returns cartesian ids', function() {
            var layout = {
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

    describe('Plots.findSubplotIds', function() {
        var findSubplotIds = Plots.findSubplotIds;
        var ids;

        it('should return subplots ids found in the data', function() {
            var data = [{
                type: 'scatter3d',
                scene: 'scene'
            }, {
                type: 'surface',
                scene: 'scene2'
            }, {
                type: 'choropleth',
                geo: 'geo'
            }];

            ids = findSubplotIds(data, 'geo');
            expect(ids).toEqual(['geo']);

            ids = findSubplotIds(data, 'gl3d');
            expect(ids).toEqual(['scene', 'scene2']);
        });
    });

    describe('Plots.register, getModule, and traceIs', function() {
        beforeEach(function() {
            this.modulesKeys = Object.keys(Plots.modules);
            this.allTypesKeys = Object.keys(Plots.allTypes);
            this.allCategoriesKeys = Object.keys(Plots.allCategories);

            this.fakeModule = {
                calc: function() { return 42; },
                plot: function() { return 1000000; }
            };
            this.fakeModule2 = {
                plot: function() { throw new Error('nope!'); }
            };

            Plots.register(this.fakeModule, 'newtype', ['red', 'green']);

            spyOn(console, 'warn');
        });

        afterEach(function() {
            function revertObj(obj, initialKeys) {
                Object.keys(obj).forEach(function(k) {
                    if(initialKeys.indexOf(k) === -1) delete obj[k];
                });
            }

            revertObj(Plots.modules, this.modulesKeys);
            revertObj(Plots.allTypes, this.allTypesKeys);
            revertObj(Plots.allCategories, this.allCategoriesKeys);
        });

        it('should not reregister a type', function() {
            Plots.register(this.fakeModule2, 'newtype', ['yellow', 'blue']);
            expect(Plots.allCategories.yellow).toBeUndefined();
        });

        it('should find the module for a type', function() {
            expect(Plots.getModule('newtype')).toBe(this.fakeModule);
            expect(Plots.getModule({type: 'newtype'})).toBe(this.fakeModule);
        });

        it('should return false for types it doesn\'t know', function() {
            expect(Plots.getModule('notatype')).toBe(false);
            expect(Plots.getModule({type: 'notatype'})).toBe(false);
            expect(Plots.getModule({type: 'newtype', r: 'this is polar'})).toBe(false);
        });

        it('should find the categories for this type', function() {
            expect(Plots.traceIs('newtype', 'red')).toBe(true);
            expect(Plots.traceIs({type: 'newtype'}, 'red')).toBe(true);
        });

        it('should not find other real categories', function() {
            expect(Plots.traceIs('newtype', 'cartesian')).toBe(false);
            expect(Plots.traceIs({type: 'newtype'}, 'cartesian')).toBe(false);
            expect(console.warn).not.toHaveBeenCalled();
        });
    });

    describe('Plots.registerSubplot', function() {
        var fake = {
            name: 'fake',
            attr: 'abc',
            idRoot: 'cba',
            attrRegex: /^abc([2-9]|[1-9][0-9]+)?$/,
            idRegex: /^cba([2-9]|[1-9][0-9]+)?$/,
            attributes: { stuff: { 'more stuff': 102102 } }
        };

        Plots.registerSubplot(fake);

        var subplotsRegistry = Plots.subplotsRegistry;

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
                it('considers ' + JSON.stringify(s) + 'as a correct attribute name', function() {
                    expect(subplotsRegistry.fake.attrRegex.test(s)).toBe(true);
                });
            });

            shouldFail.forEach(function(s) {
                it('considers ' + JSON.stringify(s) + 'as an incorrect attribute name', function() {
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
                it('considers ' + JSON.stringify(s) + 'as a correct attribute name', function() {
                    expect(subplotsRegistry.fake.idRegex.test(s)).toBe(true);
                });
            });

            shouldFail.forEach(function(s) {
                it('considers ' + JSON.stringify(s) + 'as an incorrect attribute name', function() {
                    expect(subplotsRegistry.fake.idRegex.test(s)).toBe(false);
                });
            });
        });

    });

    describe('Plots.purge', function() {
        var gd;

        beforeEach(function(done) {
            gd = createGraphDiv();
            Plotly.plot(gd, [{ x: [1,2,3], y: [2,3,4] }], {}).then(done);
        });

        afterEach(destroyGraphDiv);

        it('should unset everything in the gd except _context', function() {
            var expectedKeys = [
                '_ev', 'on', 'once', 'removeListener', 'removeAllListeners',
                'emit', '_context', '_replotPending', '_mouseDownTime',
                '_hmpixcount', '_hmlumcount'
            ];

            Plots.purge(gd);
            expect(Object.keys(gd)).toEqual(expectedKeys);
            expect(gd.data).toBeUndefined();
            expect(gd.layout).toBeUndefined();
            expect(gd._fullData).toBeUndefined();
            expect(gd._fullLayout).toBeUndefined();
            expect(gd.calcdata).toBeUndefined();
            expect(gd.framework).toBeUndefined();
            expect(gd.empty).toBeUndefined();
            expect(gd.fid).toBeUndefined();
            expect(gd.undoqueue).toBeUndefined();
            expect(gd.undonum).toBeUndefined();
            expect(gd.autoplay).toBeUndefined();
            expect(gd.changed).toBeUndefined();
            expect(gd._modules).toBeUndefined();
            expect(gd._tester).toBeUndefined();
            expect(gd._testref).toBeUndefined();
            expect(gd._promises).toBeUndefined();
            expect(gd._redrawTimer).toBeUndefined();
            expect(gd._replotting).toBeUndefined();
            expect(gd.firstscatter).toBeUndefined();
            expect(gd.hmlumcount).toBeUndefined();
            expect(gd.hmpixcount).toBeUndefined();
            expect(gd.numboxes).toBeUndefined();
            expect(gd._hoverTimer).toBeUndefined();
            expect(gd._lastHoverTime).toBeUndefined();
        });
    });
});
