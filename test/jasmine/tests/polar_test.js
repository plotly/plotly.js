var Plotly = require('@lib');
var Lib = require('@src/lib');
var Polar = require('@src/plots/polar');

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var fail = require('../assets/fail_test');

describe('Test legacy polar plots logs:', function() {
    var gd;

    beforeEach(function() {
        spyOn(Lib, 'log');
        gd = createGraphDiv();
    });

    afterEach(destroyGraphDiv);

    var specs = [{
        name: 'legacy polar scatter traces',
        data: [{
            r: [1, 2, 3],
            t: [1, 2, 3]
        }]
    }, {
        name: 'legacy polar bar traces',
        data: [{
            type: 'bar',
            r: [1, 2, 3],
            t: [1, 2, 3]
        }]
    }, {
        name: 'legacy area traces',
        data: [{
            type: 'area',
            r: [1, 2, 3],
            t: [1, 2, 3]
        }]
    }];

    specs.forEach(function(s) {
        it('should log deprecation warning on ' + s.name, function(done) {
            Plotly.plot(gd, s.data)
            .then(function() {
                expect(Lib.log).toHaveBeenCalledTimes(1);
                expect(Lib.log).toHaveBeenCalledWith('Legacy polar charts are deprecated!');
            })
            .catch(fail)
            .then(done);
        });
    });
});

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
