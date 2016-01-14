var Plotly = require('@src/plotly');

describe('the register function', function() {

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
            categories: ['categories', 'array']
        };

        expect(function() {
            Plotly.register(mockTrace1);
        }).not.toThrow();

        expect(Plotly.Plots.getModule('mockTrace1')).toBe(mockTrace1);
    });

    it('should work with an array of modules', function() {
        var mockTrace2 = {
            moduleType: 'trace',
            name: 'mockTrace2',
            meta: 'Meta string',
            categories: ['categories', 'array']
        };

        expect(function() {
            Plotly.register([mockTrace2]);
        }).not.toThrow();

        expect(Plotly.Plots.getModule('mockTrace2')).toBe(mockTrace2);
    });

    it('should throw an error when an invalid module is given', function() {
        var invalidTrace = { moduleType: 'invalid' };

        expect(function() {
            Plotly.register([invalidTrace]);
        }).toThrowError(Error, 'Invalid module was attempted to be registered!');
    });
});
