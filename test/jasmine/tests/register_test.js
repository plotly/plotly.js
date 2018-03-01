var Plotly = require('@lib/index');
var Registry = require('@src/registry');
var Loggers = require('@src/lib/loggers');

describe('Test Plotly.register:', function() {
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

    beforeEach(function() {
        this.modulesKeys = Object.keys(Registry.modules);
        this.allTypesKeys = Object.keys(Registry.allTypes);
        this.allCategoriesKeys = Object.keys(Registry.allCategories);
        this.allTransformsKeys = Object.keys(Registry.transformsRegistry);

        spyOn(Loggers, 'log');
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

describe('Test Registry.getModule & Registry.traceIs:', function() {
    var fakeModule = {
        moduleType: 'trace',
        name: 'newtype',
        categories: ['red', 'green'],
        calc: function() { return 42; },
        plot: function() { return 1000000; },
        basePlotModule: { name: 'newbaseplot' }
    };

    beforeAll(function() {
        Registry.register(fakeModule);
    });

    beforeEach(function() {
        spyOn(Loggers, 'log');
    });

    it('should find the module for a type', function() {
        expect(Registry.getModule('newtype')).toBe(fakeModule);
        expect(Registry.getModule({type: 'newtype'})).toBe(fakeModule);
        expect(Loggers.log).not.toHaveBeenCalled();
    });

    it('should return false for types it doesn\'t know', function() {
        expect(Registry.getModule('notatype')).toBe(false);
        expect(Registry.getModule({type: 'notatype'})).toBe(false);
        expect(Loggers.log).not.toHaveBeenCalled();
    });

    it('should find the categories for this type', function() {
        expect(Registry.traceIs('newtype', 'red')).toBe(true);
        expect(Registry.traceIs({type: 'newtype'}, 'red')).toBe(true);
        expect(Loggers.log).not.toHaveBeenCalled();
    });

    it('should not find other real categories', function() {
        expect(Registry.traceIs('newtype', 'cartesian')).toBe(false);
        expect(Registry.traceIs({type: 'newtype'}, 'cartesian')).toBe(false);
        expect(Loggers.log).not.toHaveBeenCalled();
    });

    it('should log on unrecognized trace typed', function() {
        expect(Registry.traceIs('nada')).toBe(false);
        expect(Loggers.log).toHaveBeenCalled();
    });
});

describe('Test Registry.getTransformIndices & Registry.hasTransform:', function() {
    var transformModule = {
        moduleType: 'transform',
        name: 'mah-transform',
        transform: function() {}
    };

    beforeAll(function() {
        Plotly.register(transformModule);
    });

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
