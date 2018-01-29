var Plotly = require('@lib/index');
var Registry = require('@src/registry');

describe('Test Registry', function() {
    'use strict';

    describe('register, getModule, and traceIs', function() {
        beforeEach(function() {
            this.modulesKeys = Object.keys(Registry.modules);
            this.allTypesKeys = Object.keys(Registry.allTypes);
            this.allCategoriesKeys = Object.keys(Registry.allCategories);

            this.fakeModule = {
                calc: function() { return 42; },
                plot: function() { return 1000000; }
            };
            this.fakeModule2 = {
                plot: function() { throw new Error('nope!'); }
            };

            Registry.register(this.fakeModule, 'newtype', ['red', 'green']);

            spyOn(console, 'warn');
        });

        afterEach(function() {
            function revertObj(obj, initialKeys) {
                Object.keys(obj).forEach(function(k) {
                    if(initialKeys.indexOf(k) === -1) delete obj[k];
                });
            }

            revertObj(Registry.modules, this.modulesKeys);
            revertObj(Registry.allTypes, this.allTypesKeys);
            revertObj(Registry.allCategories, this.allCategoriesKeys);
        });

        it('should not reregister a type', function() {
            Registry.register(this.fakeModule2, 'newtype', ['yellow', 'blue']);
            expect(Registry.allCategories.yellow).toBeUndefined();
        });

        it('should find the module for a type', function() {
            expect(Registry.getModule('newtype')).toBe(this.fakeModule);
            expect(Registry.getModule({type: 'newtype'})).toBe(this.fakeModule);
        });

        it('should return false for types it doesn\'t know', function() {
            expect(Registry.getModule('notatype')).toBe(false);
            expect(Registry.getModule({type: 'notatype'})).toBe(false);
        });

        it('should find the categories for this type', function() {
            expect(Registry.traceIs('newtype', 'red')).toBe(true);
            expect(Registry.traceIs({type: 'newtype'}, 'red')).toBe(true);
        });

        it('should not find other real categories', function() {
            expect(Registry.traceIs('newtype', 'cartesian')).toBe(false);
            expect(Registry.traceIs({type: 'newtype'}, 'cartesian')).toBe(false);
            expect(console.warn).not.toHaveBeenCalled();
        });
    });

    describe('Registry.registerSubplot', function() {
        var fake = {
            name: 'fake',
            attr: 'abc',
            idRoot: 'cba',
            attrRegex: /^abc([2-9]|[1-9][0-9]+)?$/,
            idRegex: /^cba([2-9]|[1-9][0-9]+)?$/,
            attributes: { stuff: { 'more stuff': 102102 } }
        };

        Registry.registerSubplot(fake);

        var subplotsRegistry = Registry.subplotsRegistry;

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
});

describe('the register function', function() {
    'use strict';

    beforeEach(function() {
        this.modulesKeys = Object.keys(Registry.modules);
        this.allTypesKeys = Object.keys(Registry.allTypes);
        this.allCategoriesKeys = Object.keys(Registry.allCategories);
        this.allTransformsKeys = Object.keys(Registry.transformsRegistry);
    });

    afterEach(function() {
        function revertObj(obj, initialKeys) {
            Object.keys(obj).forEach(function(k) {
                if(initialKeys.indexOf(k) === -1) delete obj[k];
            });
        }

        revertObj(Registry.modules, this.modulesKeys);
        revertObj(Registry.allTypes, this.allTypesKeys);
        revertObj(Registry.allCategories, this.allCategoriesKeys);
        revertObj(Registry.transformsRegistry, this.allTransformsKeys);
    });

    it('should throw an error when no argument is given', function() {
        expect(function() {
            Plotly.register();
        }).toThrowError(Error, 'No argument passed to Plotly.register.');
    });

    it('should work with a single module', function() {
        var mockTrace1 = {
            moduleType: 'trace',
            name: 'mockTrace1',
            meta: 'Meta string',
            basePlotModule: { name: 'plotModule' },
            categories: ['categories', 'array']
        };

        expect(function() {
            Plotly.register(mockTrace1);
        }).not.toThrow();

        expect(Registry.getModule('mockTrace1')).toBe(mockTrace1);
    });

    it('should work with an array of modules', function() {
        var mockTrace2 = {
            moduleType: 'trace',
            name: 'mockTrace2',
            meta: 'Meta string',
            basePlotModule: { name: 'plotModule' },
            categories: ['categories', 'array']
        };

        expect(function() {
            Plotly.register([mockTrace2]);
        }).not.toThrow();

        expect(Registry.getModule('mockTrace2')).toBe(mockTrace2);
    });

    it('should throw an error when an invalid module is given', function() {
        var invalidTrace = { moduleType: 'invalid' };

        expect(function() {
            Plotly.register([invalidTrace]);
        }).toThrowError(Error, 'Invalid module was attempted to be registered!');

        expect(Registry.transformsRegistry['mah-transform']).toBeUndefined();
    });

    it('should throw when if transform module is invalid (1)', function() {
        var missingTransformName = {
            moduleType: 'transform'
        };

        expect(function() {
            Plotly.register(missingTransformName);
        }).toThrowError(Error, 'Transform module *name* must be a string.');

        expect(Registry.transformsRegistry['mah-transform']).toBeUndefined();
    });

    it('should throw when if transform module is invalid (2)', function() {
        var missingTransformFunc = {
            moduleType: 'transform',
            name: 'mah-transform'
        };

        expect(function() {
            Plotly.register(missingTransformFunc);
        }).toThrowError(Error, 'Transform module mah-transform is missing a *transform* or *calcTransform* method.');

        expect(Registry.transformsRegistry['mah-transform']).toBeUndefined();
    });

    it('should not throw when transform module is valid (1)', function() {
        var transformModule = {
            moduleType: 'transform',
            name: 'mah-transform',
            transform: function() {}
        };

        expect(function() {
            Plotly.register(transformModule);
        }).not.toThrow();

        expect(Registry.transformsRegistry['mah-transform']).toBeDefined();
    });

    it('should not throw when transform module is valid (2)', function() {
        var transformModule = {
            moduleType: 'transform',
            name: 'mah-transform',
            calcTransform: function() {}
        };

        expect(function() {
            Plotly.register(transformModule);
        }).not.toThrow();

        expect(Registry.transformsRegistry['mah-transform']).toBeDefined();
    });

    it('should not throw when transform module is valid (3)', function() {
        var transformModule = {
            moduleType: 'transform',
            name: 'mah-transform',
            transform: function() {},
            calcTransform: function() {}
        };

        expect(function() {
            Plotly.register(transformModule);
        }).not.toThrow();

        expect(Registry.transformsRegistry['mah-transform']).toBeDefined();
    });

    describe('getTransformIndices', function() {
        it('returns an empty array if no transforms present', function() {
            expect(Registry.getTransformIndices({}, 'groupby')).toEqual([]);
        });

        it('returns an empty array if none present', function() {
            expect(Registry.getTransformIndices({
                transforms: [
                    {type: 'filter'},
                    {type: 'groupby'}
                ]
            }, 'degauss')).toEqual([]);
        });

        it('returns an empty array if none present', function() {
            expect(Registry.getTransformIndices({
                transforms: [
                    {type: 'filter'},
                    {type: 'groupby'},
                    {type: 'groupby'}
                ]
            }, 'groupby')).toEqual([1, 2]);
        });
    });

    describe('hasTransform', function() {
        it('returns an false array if no transforms present', function() {
            expect(Registry.hasTransform({}, 'groupby')).toBe(false);
        });

        it('returns an empty array if none present', function() {
            expect(Registry.hasTransform({
                transforms: [
                    {type: 'filter'},
                    {type: 'groupby'}
                ]
            }, 'degauss')).toBe(false);
        });

        it('returns an empty array if none present', function() {
            expect(Registry.hasTransform({
                transforms: [
                    {type: 'filter'},
                    {type: 'groupby'},
                    {type: 'groupby'}
                ]
            }, 'groupby')).toBe(true);
        });
    });
});
