var Plotly = require('@lib');
var Lib = require('@src/lib');
var Polar = require('@src/plots/polar');
var constants = require('@src/plots/polar/constants');

var d3 = require('d3');
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

    function _supply(layoutIn, fullData) {
        fullData = fullData || [{
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

    it('should not try to autotype visible false traces', function() {
        _supply({
            polar: {}
        }, [{
            type: 'scatterpolar',
            visible: false,
            r: ['2017-01-20', '2017-02-10', '2017-03-03'],
            theta: ['a', 'b', 'c'],
            subplot: 'polar'
        }]);

        expect(layoutOut.polar.radialaxis.type).toBe('linear', 'not date');
        expect(layoutOut.polar.angularaxis.type).toBe('linear', 'not category');
    });
});

describe('Test relayout on polar subplots:', function() {
    afterEach(destroyGraphDiv);

    it('should be able to reorder axis layers when relayout\'ing *layer*', function(done) {
        var gd = createGraphDiv();
        var fig = Lib.extendDeep({}, require('@mocks/polar_line.json'));
        var dflt = constants.layerNames;

        function _assert(expected) {
            var actual = d3.selectAll('g.polar > .polarlayer');

            expect(actual.size()).toBe(expected.length, '# of layer');

            actual.each(function(d, i) {
                var className = d3.select(this)
                    .attr('class')
                    .split('polarlayer ')[1];

                expect(className).toBe(expected[i], 'layer ' + i);
            });
        }

        Plotly.plot(gd, fig).then(function() {
            _assert(dflt);
            return Plotly.relayout(gd, 'polar.radialaxis.layer', 'below traces');
        })
        .then(function() {
            _assert([
                'draglayer', 'plotbg', 'backplot', 'angular-grid', 'radial-grid',
                'radial-axis', 'radial-line',
                'frontplot',
                'angular-axis', 'angular-line'
            ]);
            return Plotly.relayout(gd, 'polar.angularaxis.layer', 'below traces');
        })
        .then(function() {
            _assert([
                'draglayer', 'plotbg', 'backplot', 'angular-grid', 'radial-grid',
                'angular-axis',
                'radial-axis',
                'angular-line',
                'radial-line',
                'frontplot'
            ]);
            return Plotly.relayout(gd, 'polar.radialaxis.layer', 'above traces');
        })
        .then(function() {
            _assert([
                'draglayer', 'plotbg', 'backplot', 'angular-grid', 'radial-grid',
                'angular-axis', 'angular-line',
                'frontplot',
                'radial-axis', 'radial-line'
            ]);
            return Plotly.relayout(gd, 'polar.angularaxis.layer', null);
        })
        .then(function() {
            _assert(dflt);
        })
        .catch(fail)
        .then(done);
    });

    it('should be able to relayout axis types', function(done) {
        var gd = createGraphDiv();
        var fig = Lib.extendDeep({}, require('@mocks/polar_scatter.json'));

        Plotly.plot(gd, fig).then(function() {
            return Plotly.relayout(gd, 'polar.radialaxis.type', 'log');
        })
        .catch(fail)
        .then(done);
    });

    it('should be propagate angular settings down to tick labels', function(done) {
        var gd = createGraphDiv();
        var fig = Lib.extendDeep({}, require('@mocks/polar_scatter.json'));
        var pos0 = [];
        var pos1 = [];

        Plotly.plot(gd, fig).then(function() {
            d3.selectAll('.angulartick> text').each(function() {
                var tx = d3.select(this);
                pos0.push([tx.attr('x'), tx.attr('y')]);
            });
            return Plotly.relayout(gd, 'polar.angularaxis.position', 90);
        })
        .then(function() {
            d3.selectAll('.angulartick> text').each(function() {
                var tx = d3.select(this);
                pos1.push([tx.attr('x'), tx.attr('y')]);
            });

            // if they're the same, the tick label position did not update
            expect(pos1).not.toBeCloseTo2DArray(pos0);
        })
        .catch(fail)
        .then(done);
    });
});
