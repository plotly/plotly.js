var Lib = require('@src/lib');
var Polar = require('@src/plots/polar');

describe('Test polar plots defaults:', function() {
    var layoutOut;

    function _supply(layoutIn) {
        var fullData = [{
            type: 'scatterpolar',
            r: [],
            theta: [],
            subplot: 'polar'
        }];

        layoutOut = {
            font: {color: 'red'}
        };

        Polar.supplyLayoutDefaults(layoutIn, layoutOut, fullData);
    }

    it('should default *radialaxis.position* to first sector angle', function() {
        _supply({
            polar: {
                sector: [45, 135]
            }
        });
        expect(layoutOut.polar.radialaxis.position).toBe(45);
    });

    it('should coerce *angularaxis.thetaunit* only for linear angular axes', function() {
        _supply({
            polar: {
                angularaxis: {thetaunit: 'radians'}
            }
        });
        expect(layoutOut.polar.angularaxis.thetaunit).toBe('radians');

        _supply({
            polar: {
                angularaxis: {
                    type: 'category',
                    thetaunit: 'radians'
                }
            }
        });
        expect(layoutOut.polar.angularaxis.thetaunit).toBeUndefined();
    });
});
