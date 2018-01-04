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
            font: {color: 'red'},
            _subplots: {polar: ['polar']}
        };

        Polar.supplyLayoutDefaults(layoutIn, layoutOut, fullData);
    }

    it('should default *radialaxis.angle* to first sector angle', function() {
        _supply({
            polar: {
                sector: [45, 135]
            }
        });
        expect(layoutOut.polar.radialaxis.angle).toBe(45);
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

    it('should propagate axis *color* settings', function() {
        _supply({
            polar: {
                angularaxis: {color: 'red'},
                radialaxis: {color: 'blue'}
            }
        });

        expect(layoutOut.polar.angularaxis.linecolor).toBe('red');
        expect(layoutOut.polar.angularaxis.gridcolor).toBe('rgb(255, 153, 153)', 'blend by 60% with bgcolor');

        expect(layoutOut.polar.radialaxis.titlefont.color).toBe('blue');
        expect(layoutOut.polar.radialaxis.linecolor).toBe('blue');
        expect(layoutOut.polar.radialaxis.gridcolor).toBe('rgb(153, 153, 255)', 'blend by 60% with bgcolor');
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
            return Plotly.relayout(gd, 'polar.angularaxis.rotation', 90);
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

    it('should be able to relayout angular ticks layout', function(done) {
        var gd = createGraphDiv();
        var fig = Lib.extendDeep({}, require('@mocks/polar_scatter.json'));

        function check(cnt, expected) {
            var ticks = d3.selectAll('path.angulartick');

            expect(ticks.size()).toBe(cnt, '# of ticks');
            ticks.each(function() {
                expect(d3.select(this).attr('d')).toBe(expected);
            });
        }

        Plotly.plot(gd, fig).then(function() {
            check(8, 'M1.5,0h5');
            return Plotly.relayout(gd, 'polar.angularaxis.ticks', 'inside');
        })
        .then(function() {
            check(8, 'M-1.5,0h-5');
            return Plotly.relayout(gd, 'polar.angularaxis.ticks', 'outside');
        })
        .then(function() {
            check(8, 'M1.5,0h5');
            return Plotly.relayout(gd, 'polar.angularaxis.ticks', '');
        })
        .then(function() {
            check(0);
            return Plotly.relayout(gd, 'polar.angularaxis.ticks', 'inside');
        })
        .then(function() {
            check(8, 'M-1.5,0h-5');
        })
        .catch(fail)
        .then(done);
    });

    it('should be able to toggle axis features', function(done) {
        var gd = createGraphDiv();
        var fig = Lib.extendDeep({}, require('@mocks/polar_scatter.json'));

        function assertCnt(selector, expected, msg) {
            var sel = d3.select(gd).selectAll(selector);
            expect(sel.size()).toBe(expected, msg);
        }

        function assertDisplay(selector, expected, msg) {
            var sel = d3.select(gd).selectAll(selector);

            if(!sel.size()) fail(selector + ' not found');

            sel.each(function() {
                expect(d3.select(this).attr('display')).toBe(expected, msg);
            });
        }

        function toggle(astr, vals, exps, selector, fn) {
            return Plotly.relayout(gd, astr, vals[0]).then(function() {
                fn(selector, exps[0], astr + ' ' + vals[0]);
                return Plotly.relayout(gd, astr, vals[1]);
            })
            .then(function() {
                fn(selector, exps[1], astr + ' ' + vals[1]);
                return Plotly.relayout(gd, astr, vals[0]);
            })
            .then(function() {
                fn(selector, exps[0], astr + ' ' + vals[0]);
            });
        }

        Plotly.plot(gd, fig).then(function() {
            return toggle(
                'polar.radialaxis.showline',
                [true, false], [null, 'none'],
                '.radial-line > line', assertDisplay
            );
        })
        .then(function() {
            return toggle(
                'polar.radialaxis.showgrid',
                [true, false], [null, 'none'],
                '.radial-grid', assertDisplay
            );
        })
        .then(function() {
            return toggle(
                'polar.radialaxis.showticklabels',
                [true, false], [6, 0],
                '.radial-axis > .xtick > text', assertCnt
            );
        })
        .then(function() {
            return toggle(
                'polar.radialaxis.ticks',
                ['outside', ''], [6, 0],
                '.radial-axis > path.xtick', assertCnt
            );
        })
        .then(function() {
            return toggle(
                'polar.angularaxis.showline',
                [true, false], [null, 'none'],
                '.angular-line > path', assertDisplay
            );
        })
        .then(function() {
            return toggle(
                'polar.angularaxis.showgrid',
                [true, false], [8, 0],
                '.angular-grid > .angular > path', assertCnt
            );
        })
        .then(function() {
            return toggle(
                'polar.angularaxis.showticklabels',
                [true, false], [8, 0],
                '.angular-axis > .angulartick > text', assertCnt
            );
        })
        .then(function() {
            return toggle(
                'polar.angularaxis.ticks',
                ['outside', ''], [8, 0],
                '.angular-axis > path.angulartick', assertCnt
            );
        })
        .catch(fail)
        .then(done);
    });

    it('should be able to restyle radial axis title', function(done) {
        var gd = createGraphDiv();
        var lastBBox;

        function assertTitle(content, didBBoxChanged) {
            var radialAxisTitle = d3.select('g.g-polartitle');
            var txt = radialAxisTitle.select('text');
            var bb = radialAxisTitle.node().getBBox();
            var newBBox = [bb.x, bb.y, bb.width, bb.height];

            if(content === '') {
                expect(txt.size()).toBe(0, 'cleared <text>');
            } else {
                expect(txt.text()).toBe(content, 'radial axis title');
            }

            expect(newBBox).negateIf(didBBoxChanged).toEqual(lastBBox, 'did bbox change');
            lastBBox = newBBox;
        }

        Plotly.plot(gd, [{
            type: 'scatterpolar',
            r: [1, 2, 3],
            theta: [10, 20, 30]
        }], {
            polar: {
                radialaxis: {title: 'yo'}
            }
        })
        .then(function() {
            assertTitle('yo', true);
            return Plotly.relayout(gd, 'polar.radialaxis.title', '');
        })
        .then(function() {
            assertTitle('', true);
            return Plotly.relayout(gd, 'polar.radialaxis.title', 'yo2');
        })
        .then(function() {
            assertTitle('yo2', true);
            return Plotly.relayout(gd, 'polar.radialaxis.ticklen', 20);
        })
        .then(function() {
            assertTitle('yo2', true);
            return Plotly.relayout(gd, 'polar.radialaxis.titlefont.color', 'red');
        })
        .then(function() {
            assertTitle('yo2', false);
            return Plotly.relayout(gd, 'title', 'dummy');
        })
        .then(function() {
            assertTitle('yo2', false);
        })
        .catch(fail)
        .then(done);
    });

    it('should clean up its framework, clip paths and info layers when getting deleted', function(done) {
        var gd = createGraphDiv();
        var fig = Lib.extendDeep({}, require('@mocks/polar_scatter.json'));
        var traces = Lib.extendDeep([], fig.data);
        var inds = traces.map(function(_, i) { return i; });

        function _assert(exp) {
            expect(d3.selectAll('g.polar').size()).toBe(exp.subplot, '# subplot layer');
            expect(d3.selectAll('g.g-polartitle').size()).toBe(exp.rtitle, '# radial title');

            var clipCnt = 0;
            d3.selectAll('clipPath').each(function() {
                if(/polar-circle$/.test(this.id)) clipCnt++;
            });
            expect(clipCnt).toBe(exp.clip, '# clip paths');
        }

        Plotly.plot(gd, fig).then(function() {
            _assert({subplot: 1, clip: 1, rtitle: 1});

            return Plotly.deleteTraces(gd, inds);
        })
        .then(function() {
            _assert({subplot: 0, clip: 0, rtitle: 0});

            return Plotly.addTraces(gd, traces);
        })
        .then(function() {
            _assert({subplot: 1, clip: 1, rtitle: 1});
        })
        .catch(fail)
        .then(done);
    });
});
