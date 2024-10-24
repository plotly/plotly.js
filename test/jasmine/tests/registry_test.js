var Plotly = require('../../../lib/index');
var Registry = require('../../../src/registry');
var Loggers = require('../../../src/lib/loggers');

describe('Test Register:', function() {
    beforeAll(function() {
        this.modulesKeys = Object.keys(Registry.modules);
        this.allCategoriesKeys = Object.keys(Registry.allCategories);
        this.allTypes = Registry.allTypes.slice();
    });

    beforeEach(function() {
        spyOn(Loggers, 'log');
    });

    afterEach(function() {
        function revertObj(obj, initialKeys) {
            Object.keys(obj).forEach(function(k) {
                if(initialKeys.indexOf(k) === -1) delete obj[k];
            });
        }

        function revertArray(arr, initial) {
            arr.length = initial.length;
        }

        revertObj(Registry.modules, this.modulesKeys);
        revertObj(Registry.allCategories, this.allCategoriesKeys);
        revertArray(Registry.allTypes, this.allTypes);
    });

    describe('Plotly.register', function() {
        var mockTrace1 = {
            moduleType: 'trace',
            name: 'mockTrace1',
            meta: 'Meta string',
            basePlotModule: { name: 'plotModule' },
            categories: ['categories', 'array']
        };

        var mockTrace1b = {
            moduleType: 'trace',
            name: 'mockTrace1',
            meta: 'Meta string',
            basePlotModule: { name: 'plotModule' },
            categories: ['categories b', 'array b']
        };

        var mockTrace2 = {
            moduleType: 'trace',
            name: 'mockTrace2',
            meta: 'Meta string',
            basePlotModule: { name: 'plotModule' },
            categories: ['categories', 'array']
        };

        it('should throw an error when no argument is given', function() {
            expect(function() {
                Plotly.register();
            }).toThrowError(Error, 'No argument passed to Plotly.register.');
        });

        it('should work with a single module', function() {
            expect(function() {
                Plotly.register(mockTrace1);
            }).not.toThrow();

            expect(Registry.getModule('mockTrace1')).toBe(mockTrace1);
            expect(Registry.subplotsRegistry.plotModule).toBeDefined();
        });

        it('should work with an array of modules', function() {
            expect(function() {
                Plotly.register([mockTrace2]);
            }).not.toThrow();

            expect(Registry.getModule('mockTrace2')).toBe(mockTrace2);
            expect(Registry.subplotsRegistry.plotModule).toBeDefined();
        });

        it('should throw an error when an invalid module is given', function() {
            var invalidTrace = { moduleType: 'invalid' };

            expect(function() {
                Plotly.register([invalidTrace]);
            }).toThrowError(Error, 'Invalid module was attempted to be registered!');
        });

        it('should not reregister a trace module', function() {
            Plotly.register(mockTrace1);
            Plotly.register(mockTrace1b);
            expect(Registry.allCategories.categories).toBe(true);
            expect(Registry.allCategories.array).toBe(true);
            expect(Registry.allCategories['categories b']).toBeUndefined();
            expect(Registry.allCategories['array b']).toBeUndefined();
            expect(Loggers.log).toHaveBeenCalled();
        });
    });

    describe('Registry.getModule & Registry.traceIs:', function() {
        var fakeModule = {
            moduleType: 'trace',
            name: 'newtype',
            categories: ['red', 'green'],
            calc: function() { return 42; },
            plot: function() { return 1000000; },
            basePlotModule: { name: 'newbaseplot' }
        };

        beforeEach(function() {
            Registry.register(fakeModule);
        });

        it('getModule should find the module for a type', function() {
            expect(Registry.getModule('newtype')).toBe(fakeModule);
            expect(Registry.getModule({type: 'newtype'})).toBe(fakeModule);
            expect(Loggers.log).not.toHaveBeenCalled();
        });

        it('getModule should return false for types it doesn\'t know', function() {
            expect(Registry.getModule('notatype')).toBe(false);
            expect(Registry.getModule({type: 'notatype'})).toBe(false);
            expect(Loggers.log).not.toHaveBeenCalled();
        });

        it('traceIs should find the categories for this type', function() {
            expect(Registry.traceIs('newtype', 'red')).toBe(true);
            expect(Registry.traceIs({type: 'newtype'}, 'red')).toBe(true);
            expect(Loggers.log).not.toHaveBeenCalled();
        });

        it('traceIs should not find other real categories', function() {
            expect(Registry.traceIs('newtype', 'cartesian')).toBe(false);
            expect(Registry.traceIs({type: 'newtype'}, 'cartesian')).toBe(false);
            expect(Loggers.log).not.toHaveBeenCalled();
        });

        it('traceIs should log on unrecognized trace typed', function() {
            expect(Registry.traceIs('nada')).toBe(false);
            expect(Loggers.log).toHaveBeenCalled();
        });
    });
});
