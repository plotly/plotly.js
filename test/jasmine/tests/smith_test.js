var Smith = require('@src/plots/smith');

describe('Test smith plot defaults:', function() {
    var layoutOut;

    function _supply(layoutIn, fullData) {
        fullData = fullData || [{
            type: 'scattersmith',
            r: [],
            theta: [],
            subplot: 'smith'
        }];

        layoutOut = {
            autotypenumbers: 'convert types',
            font: {color: 'red'},
            _subplots: {smith: ['smith']}
        };

        Smith.supplyLayoutDefaults(layoutIn, layoutOut, fullData);
    }

    it('should contain correct default top level values', function() {
        _supply({
            smith: {}
        });
        
        var smith = layoutOut.smith;

        expect(smith.domain.x).toEqual([0, 1]);
        expect(smith.domain.y).toEqual([0, 1]);
        expect(smith.bgcolor).toBe('#fff');
    });

    it('should contain correct defaults for the axes', function() {
        _supply({
            smith: {}
        });

        var imag = layoutOut.smith.imaginaryaxis;
        var real = layoutOut.smith.realaxis;

        expect(imag.type).toBe('linear');
        expect(real.type).toBe('linear');
    });
});
