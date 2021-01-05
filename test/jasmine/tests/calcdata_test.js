var Plotly = require('@lib/index');

var BADNUM = require('@src/constants/numerical').BADNUM;
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');

var Lib = require('@src/lib');

describe('calculated data and points', function() {
    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(destroyGraphDiv);

    describe('connectGaps', function() {
        it('should exclude null and undefined points when false', function(done) {
            Plotly.newPlot(gd, [{ x: [1, 2, 3, undefined, 5], y: [1, null, 3, 4, 5]}], {})
            .then(function() {
                expect(gd.calcdata[0][1]).toEqual(jasmine.objectContaining({ x: BADNUM, y: BADNUM}));
                expect(gd.calcdata[0][3]).toEqual(jasmine.objectContaining({ x: BADNUM, y: BADNUM}));
            })
            .then(done, done.fail);
        });

        it('should exclude null and undefined points as categories when false', function(done) {
            Plotly.newPlot(gd, [{ x: [1, 2, 3, undefined, 5], y: [1, null, 3, 4, 5] }], { xaxis: { type: 'category' }})
            .then(function() {
                expect(gd.calcdata[0][1]).toEqual(jasmine.objectContaining({ x: BADNUM, y: BADNUM}));
                expect(gd.calcdata[0][3]).toEqual(jasmine.objectContaining({ x: BADNUM, y: BADNUM}));
            })
            .then(done, done.fail);
        });
    });

    describe('category ordering', function() {
        describe('default category ordering reified', function() {
            it('should output categories in the given order by default', function(done) {
                Plotly.newPlot(gd, [{x: ['c', 'a', 'e', 'b', 'd'], y: [15, 11, 12, 13, 14]}], { xaxis: {
                    type: 'category'
                }})
                .then(function() {
                    expect(gd.calcdata[0][0].y).toEqual(15);
                    expect(gd.calcdata[0][1].y).toEqual(11);
                    expect(gd.calcdata[0][2].y).toEqual(12);
                    expect(gd.calcdata[0][3].y).toEqual(13);
                    expect(gd.calcdata[0][4].y).toEqual(14);
                })
                .then(done, done.fail);
            });

            it('should output categories in the given order if `trace` order is explicitly specified', function(done) {
                Plotly.newPlot(gd, [{x: ['c', 'a', 'e', 'b', 'd'], y: [15, 11, 12, 13, 14]}], { xaxis: {
                    type: 'category',
                    categoryorder: 'trace'
                    // Also, if axis tick order is made configurable, shouldn't we make trace order configurable?
                    // Trace order as in, if a line or curve is drawn through points, what's the trace sequence.
                    // These are two orthogonal concepts. Currently, the trace order is implied
                    // by the order the {x,y} arrays are specified.
                }})
                .then(function() {
                    expect(gd.calcdata[0][0].y).toEqual(15);
                    expect(gd.calcdata[0][1].y).toEqual(11);
                    expect(gd.calcdata[0][2].y).toEqual(12);
                    expect(gd.calcdata[0][3].y).toEqual(13);
                    expect(gd.calcdata[0][4].y).toEqual(14);
                })
                .then(done, done.fail);
            });
        });

        describe('domain alphanumerical category ordering', function() {
            it('should output categories in ascending domain alphanumerical order', function(done) {
                Plotly.newPlot(gd, [{x: ['c', 'a', 'e', 'b', 'd'], y: [15, 11, 12, 13, 14]}], { xaxis: {
                    type: 'category',
                    categoryorder: 'category ascending'
                }})
                .then(function() {
                    expect(gd.calcdata[0][0]).toEqual(jasmine.objectContaining({x: 2, y: 15}));
                    expect(gd.calcdata[0][1]).toEqual(jasmine.objectContaining({x: 0, y: 11}));
                    expect(gd.calcdata[0][2]).toEqual(jasmine.objectContaining({x: 4, y: 12}));
                    expect(gd.calcdata[0][3]).toEqual(jasmine.objectContaining({x: 1, y: 13}));
                    expect(gd.calcdata[0][4]).toEqual(jasmine.objectContaining({x: 3, y: 14}));
                })
                .then(done, done.fail);
            });

            it('should output categories in descending domain alphanumerical order', function(done) {
                Plotly.newPlot(gd, [{x: ['c', 'a', 'e', 'b', 'd'], y: [15, 11, 12, 13, 14]}], { xaxis: {
                    type: 'category',
                    categoryorder: 'category descending'
                }})
                .then(function() {
                    expect(gd.calcdata[0][0]).toEqual(jasmine.objectContaining({x: 2, y: 15}));
                    expect(gd.calcdata[0][1]).toEqual(jasmine.objectContaining({x: 4, y: 11}));
                    expect(gd.calcdata[0][2]).toEqual(jasmine.objectContaining({x: 0, y: 12}));
                    expect(gd.calcdata[0][3]).toEqual(jasmine.objectContaining({x: 3, y: 13}));
                    expect(gd.calcdata[0][4]).toEqual(jasmine.objectContaining({x: 1, y: 14}));
                })
                .then(done, done.fail);
            });

            it('should output categories in ascending domain alphanumerical order even if categories are all numbers', function(done) {
                Plotly.newPlot(gd, [{x: [3, 1, 5, 2, 4], y: [15, 11, 12, 13, 14]}], { xaxis: {
                    type: 'category',
                    categoryorder: 'category ascending'
                }})
                .then(function() {
                    expect(gd.calcdata[0][0]).toEqual(jasmine.objectContaining({x: 2, y: 15}));
                    expect(gd.calcdata[0][1]).toEqual(jasmine.objectContaining({x: 0, y: 11}));
                    expect(gd.calcdata[0][2]).toEqual(jasmine.objectContaining({x: 4, y: 12}));
                    expect(gd.calcdata[0][3]).toEqual(jasmine.objectContaining({x: 1, y: 13}));
                    expect(gd.calcdata[0][4]).toEqual(jasmine.objectContaining({x: 3, y: 14}));
                })
                .then(done, done.fail);
            });

            it('should output categories in categoryorder order even if category array is defined', function(done) {
                Plotly.newPlot(gd, [{x: ['c', 'a', 'e', 'b', 'd'], y: [15, 11, 12, 13, 14]}], { xaxis: {
                    type: 'category',
                    categoryorder: 'category ascending',
                    categoryarray: ['b', 'a', 'd', 'e', 'c'] // These must be ignored. Alternative: error?
                }})
                .then(function() {
                    expect(gd.calcdata[0][0]).toEqual(jasmine.objectContaining({x: 2, y: 15}));
                    expect(gd.calcdata[0][1]).toEqual(jasmine.objectContaining({x: 0, y: 11}));
                    expect(gd.calcdata[0][2]).toEqual(jasmine.objectContaining({x: 4, y: 12}));
                    expect(gd.calcdata[0][3]).toEqual(jasmine.objectContaining({x: 1, y: 13}));
                    expect(gd.calcdata[0][4]).toEqual(jasmine.objectContaining({x: 3, y: 14}));
                })
                .then(done, done.fail);
            });

            it('should output categories in ascending domain alphanumerical order, excluding undefined', function(done) {
                Plotly.newPlot(gd, [{x: ['c', undefined, 'e', 'b', 'd'], y: [15, 11, 12, 13, 14]}], { xaxis: {
                    type: 'category',
                    categoryorder: 'category ascending'
                }})
                .then(function() {
                    expect(gd.calcdata[0][0]).toEqual(jasmine.objectContaining({x: 1, y: 15}));
                    expect(gd.calcdata[0][2]).toEqual(jasmine.objectContaining({x: 3, y: 12}));
                    expect(gd.calcdata[0][3]).toEqual(jasmine.objectContaining({x: 0, y: 13}));
                    expect(gd.calcdata[0][4]).toEqual(jasmine.objectContaining({x: 2, y: 14}));
                })
                .then(done, done.fail);
            });

            it('should combine duplicate categories', function(done) {
                Plotly.newPlot(gd, [{x: [ '1', '1'], y: [10, 20]}], { xaxis: {
                    type: 'category',
                    categoryorder: 'category ascending'
                }})
                .then(function() {
                    expect(gd.calcdata[0][0]).toEqual(jasmine.objectContaining({x: 0, y: 10}));
                    expect(gd.calcdata[0][1]).toEqual(jasmine.objectContaining({x: 0, y: 20}));
                    expect(gd._fullLayout.xaxis._categories).toEqual(['1']);
                })
                .then(done, done.fail);
            });

            it('should skip over visible-false traces', function(done) {
                Plotly.newPlot(gd, [{
                    x: [1, 2, 3],
                    y: [7, 6, 5],
                    visible: false
                }, {
                    x: [10, 9, 8],
                    y: ['A', 'B', 'C'],
                    yaxis: 'y2'
                }], {
                    yaxis2: {
                        categoryorder: 'category descending'
                    }
                })
                .then(function() {
                    expect(gd.calcdata[1][0]).toEqual(jasmine.objectContaining({x: 10, y: 2}));
                    expect(gd.calcdata[1][1]).toEqual(jasmine.objectContaining({x: 9, y: 1}));
                    expect(gd.calcdata[1][2]).toEqual(jasmine.objectContaining({x: 8, y: 0}));
                    expect(gd._fullLayout.yaxis2._categories).toEqual(['C', 'B', 'A']);
                })
                .then(done, done.fail);
            });
        });

        describe('explicit category ordering', function() {
            it('should output categories in explicitly supplied order, independent of trace order', function(done) {
                Plotly.newPlot(gd, [{x: ['c', 'a', 'e', 'b', 'd'], y: [15, 11, 12, 13, 14]}], { xaxis: {
                    type: 'category',
                    categoryorder: 'array',
                    categoryarray: ['b', 'a', 'd', 'e', 'c']
                }})
                .then(function() {
                    expect(gd.calcdata[0][0]).toEqual(jasmine.objectContaining({x: 4, y: 15}));
                    expect(gd.calcdata[0][1]).toEqual(jasmine.objectContaining({x: 1, y: 11}));
                    expect(gd.calcdata[0][2]).toEqual(jasmine.objectContaining({x: 3, y: 12}));
                    expect(gd.calcdata[0][3]).toEqual(jasmine.objectContaining({x: 0, y: 13}));
                    expect(gd.calcdata[0][4]).toEqual(jasmine.objectContaining({x: 2, y: 14}));
                })
                .then(done, done.fail);
            });

            it('should output categories in explicitly supplied order even if category values are all numbers', function(done) {
                Plotly.newPlot(gd, [{x: [3, 1, 5, 2, 4], y: [15, 11, 12, 13, 14]}], { xaxis: {
                    type: 'category',
                    categoryorder: 'array',
                    categoryarray: [2, 1, 4, 5, 3]
                }})
                .then(function() {
                    expect(gd.calcdata[0][0]).toEqual(jasmine.objectContaining({x: 4, y: 15}));
                    expect(gd.calcdata[0][1]).toEqual(jasmine.objectContaining({x: 1, y: 11}));
                    expect(gd.calcdata[0][2]).toEqual(jasmine.objectContaining({x: 3, y: 12}));
                    expect(gd.calcdata[0][3]).toEqual(jasmine.objectContaining({x: 0, y: 13}));
                    expect(gd.calcdata[0][4]).toEqual(jasmine.objectContaining({x: 2, y: 14}));
                })
                .then(done, done.fail);
            });

            it('should output categories in explicitly supplied order, independent of trace order, pruned', function(done) {
                Plotly.newPlot(gd, [{x: ['c', undefined, 'e', 'b', 'd'], y: [15, 11, 12, null, 14]}], { xaxis: {
                    type: 'category',
                    categoryorder: 'array',
                    categoryarray: ['b', 'a', 'd', 'e', 'c']
                }})
                .then(function() {
                    expect(gd.calcdata[0][0]).toEqual(jasmine.objectContaining({x: 4, y: 15}));
                    expect(gd.calcdata[0][1]).toEqual(jasmine.objectContaining({ x: BADNUM, y: BADNUM}));
                    expect(gd.calcdata[0][2]).toEqual(jasmine.objectContaining({x: 3, y: 12}));
                    expect(gd.calcdata[0][3]).toEqual(jasmine.objectContaining({ x: BADNUM, y: BADNUM}));
                    expect(gd.calcdata[0][4]).toEqual(jasmine.objectContaining({x: 2, y: 14}));
                })
                .then(done, done.fail);
            });

            it('should output categories in explicitly supplied order even if not all categories are present', function(done) {
                Plotly.newPlot(gd, [{x: ['c', 'a', 'e', 'b', 'd'], y: [15, 11, 12, 13, 14]}], { xaxis: {
                    type: 'category',
                    categoryorder: 'array',
                    categoryarray: ['b', 'x', 'a', 'd', 'z', 'e', 'c']
                }})
                .then(function() {
                    expect(gd.calcdata[0][0]).toEqual(jasmine.objectContaining({x: 6, y: 15}));
                    expect(gd.calcdata[0][1]).toEqual(jasmine.objectContaining({x: 2, y: 11}));
                    expect(gd.calcdata[0][2]).toEqual(jasmine.objectContaining({x: 5, y: 12}));
                    expect(gd.calcdata[0][3]).toEqual(jasmine.objectContaining({x: 0, y: 13}));
                    expect(gd.calcdata[0][4]).toEqual(jasmine.objectContaining({x: 3, y: 14}));
                })
                .then(done, done.fail);
            });

            it('should output categories in explicitly supplied order even if some missing categories were at the beginning or end of categoryarray', function(done) {
                Plotly.newPlot(gd, [{x: ['c', 'a', 'e', 'b', 'd'], y: [15, 11, 12, 13, 14]}], { xaxis: {
                    type: 'category',
                    categoryorder: 'array',
                    categoryarray: ['y', 'b', 'x', 'a', 'd', 'z', 'e', 'c', 'q', 'k']
                }})
                .then(function() {
                    expect(gd.calcdata[0][0]).toEqual(jasmine.objectContaining({x: 7, y: 15}));
                    expect(gd.calcdata[0][1]).toEqual(jasmine.objectContaining({x: 3, y: 11}));
                    expect(gd.calcdata[0][2]).toEqual(jasmine.objectContaining({x: 6, y: 12}));
                    expect(gd.calcdata[0][3]).toEqual(jasmine.objectContaining({x: 1, y: 13}));
                    expect(gd.calcdata[0][4]).toEqual(jasmine.objectContaining({x: 4, y: 14}));

                    // The auto-range feature currently eliminates unused category ticks on the left/right axis tails.
                    // The below test case reifies this current behavior, and checks proper order of categories kept.

                    var domTickTexts = Array.prototype.slice.call(document.querySelectorAll('g.xtick'))
                        .map(function(e) {return e.__data__.text;});

                    expect(domTickTexts).toEqual(['b', 'x', 'a', 'd', 'z', 'e', 'c']);  // y, q and k has no data points
                })
                .then(done, done.fail);
            });

            it('should output categories in explicitly supplied order even if some missing categories were at the beginning or end of categoryarray', function(done) {
                // The auto-range feature currently eliminates unutilized category ticks on the left/right edge
                // BUT keeps it if a data point with null is added; test is almost identical to the one above
                // except that it explicitly adds an axis tick for y

                Plotly.newPlot(gd, [{x: ['c', 'a', 'e', 'b', 'd', 'y'], y: [15, 11, 12, 13, 14, null]}], { xaxis: {
                    type: 'category',
                    categoryorder: 'array',
                    categoryarray: ['y', 'b', 'x', 'a', 'd', 'z', 'e', 'c', 'q', 'k']
                }})
                .then(function() {
                    expect(gd.calcdata[0][0]).toEqual(jasmine.objectContaining({x: 7, y: 15}));
                    expect(gd.calcdata[0][1]).toEqual(jasmine.objectContaining({x: 3, y: 11}));
                    expect(gd.calcdata[0][2]).toEqual(jasmine.objectContaining({x: 6, y: 12}));
                    expect(gd.calcdata[0][3]).toEqual(jasmine.objectContaining({x: 1, y: 13}));
                    expect(gd.calcdata[0][4]).toEqual(jasmine.objectContaining({x: 4, y: 14}));

                    var domTickTexts = Array.prototype.slice.call(document.querySelectorAll('g.xtick'))
                        .map(function(e) {return e.__data__.text;});

                    expect(domTickTexts).toEqual(['y', 'b', 'x', 'a', 'd', 'z', 'e', 'c']);  // q, k has no data; y is null
                })
                .then(done, done.fail);
            });

            it('should output categories in explicitly supplied order even if not all categories are present, and should interact with a null value orthogonally', function(done) {
                Plotly.newPlot(gd, [{x: ['c', 'a', 'e', 'b', 'd'], y: [15, null, 12, 13, 14]}], { xaxis: {
                    type: 'category',
                    categoryorder: 'array',
                    categoryarray: ['b', 'x', 'a', 'd', 'z', 'e', 'c']
                }})
                .then(function() {
                    expect(gd.calcdata[0][0]).toEqual(jasmine.objectContaining({x: 6, y: 15}));
                    expect(gd.calcdata[0][1]).toEqual(jasmine.objectContaining({x: BADNUM, y: BADNUM}));
                    expect(gd.calcdata[0][2]).toEqual(jasmine.objectContaining({x: 5, y: 12}));
                    expect(gd.calcdata[0][3]).toEqual(jasmine.objectContaining({x: 0, y: 13}));
                    expect(gd.calcdata[0][4]).toEqual(jasmine.objectContaining({x: 3, y: 14}));
                })
                .then(done, done.fail);
            });

            it('should output categories in explicitly supplied order first, if not all categories are covered', function(done) {
                Plotly.newPlot(gd, [{x: ['c', 'a', 'e', 'b', 'd'], y: [15, 11, 12, 13, 14]}], { xaxis: {
                    type: 'category',
                    categoryorder: 'array',
                    categoryarray: ['b', 'a', 'x', 'c']
                }})
                .then(function() {
                    expect(gd.calcdata[0][0]).toEqual(jasmine.objectContaining({x: 3, y: 15}));
                    expect(gd.calcdata[0][1]).toEqual(jasmine.objectContaining({x: 1, y: 11}));
                    expect(gd.calcdata[0][2]).toEqual(jasmine.objectContaining({x: 4, y: 12}));
                    expect(gd.calcdata[0][3]).toEqual(jasmine.objectContaining({x: 0, y: 13}));
                    expect(gd.calcdata[0][4]).toEqual(jasmine.objectContaining({x: 5, y: 14}));

                    // The order of the rest is unspecified, no need to check. Alternative: make _both_ categoryorder and
                    // categories effective; categories would take precedence and the remaining items would be sorted
                    // based on the categoryorder. This of course means that the mere presence of categories triggers this
                    // behavior, rather than an explicit 'explicit' categoryorder.
                })
                .then(done, done.fail);
            });
        });

        describe('ordering tests in the presence of multiple traces - mutually exclusive', function() {
            it('baseline testing for the unordered, disjunct case', function(done) {
                var x1 = ['Gear', 'Bearing', 'Motor'];
                var x2 = ['Switch', 'Plug', 'Cord', 'Fuse', 'Bulb'];
                var x3 = ['Pump', 'Leak', 'Seals'];

                Plotly.newPlot(gd, [
                    {x: x1, y: x1.map(function(d, i) {return i + 10;})},
                    {x: x2, y: x2.map(function(d, i) {return i + 20;})},
                    {x: x3, y: x3.map(function(d, i) {return i + 30;})}
                ])
                .then(function() {
                    expect(gd.calcdata[0][0]).toEqual(jasmine.objectContaining({x: 0, y: 10}));
                    expect(gd.calcdata[0][1]).toEqual(jasmine.objectContaining({x: 1, y: 11}));
                    expect(gd.calcdata[0][2]).toEqual(jasmine.objectContaining({x: 2, y: 12}));

                    expect(gd.calcdata[1][0]).toEqual(jasmine.objectContaining({x: 3, y: 20}));
                    expect(gd.calcdata[1][1]).toEqual(jasmine.objectContaining({x: 4, y: 21}));
                    expect(gd.calcdata[1][2]).toEqual(jasmine.objectContaining({x: 5, y: 22}));
                    expect(gd.calcdata[1][3]).toEqual(jasmine.objectContaining({x: 6, y: 23}));
                    expect(gd.calcdata[1][4]).toEqual(jasmine.objectContaining({x: 7, y: 24}));

                    expect(gd.calcdata[2][0]).toEqual(jasmine.objectContaining({x: 8, y: 30}));
                    expect(gd.calcdata[2][1]).toEqual(jasmine.objectContaining({x: 9, y: 31}));
                    expect(gd.calcdata[2][2]).toEqual(jasmine.objectContaining({x: 10, y: 32}));
                })
                .then(done, done.fail);
            });

            it('category order follows the trace order (even if categoryarray is specified)', function(done) {
                var x1 = ['Gear', 'Bearing', 'Motor'];
                var x2 = ['Switch', 'Plug', 'Cord', 'Fuse', 'Bulb'];
                var x3 = ['Pump', 'Leak', 'Seals'];

                Plotly.newPlot(gd, [
                    {x: x1, y: x1.map(function(d, i) {return i + 10;})},
                    {x: x2, y: x2.map(function(d, i) {return i + 20;})},
                    {x: x3, y: x3.map(function(d, i) {return i + 30;})}
                ], { xaxis: {
                    // type: 'category', // commented out to rely on autotyping for added realism
                    categoryorder: 'trace',
                    categoryarray: ['Switch', 'Bearing', 'Motor', 'Seals', 'Pump', 'Cord', 'Plug', 'Bulb', 'Fuse', 'Gear', 'Leak']
                }})
                .then(function() {
                    expect(gd.calcdata[0][0]).toEqual(jasmine.objectContaining({x: 0, y: 10}));
                    expect(gd.calcdata[0][1]).toEqual(jasmine.objectContaining({x: 1, y: 11}));
                    expect(gd.calcdata[0][2]).toEqual(jasmine.objectContaining({x: 2, y: 12}));

                    expect(gd.calcdata[1][0]).toEqual(jasmine.objectContaining({x: 3, y: 20}));
                    expect(gd.calcdata[1][1]).toEqual(jasmine.objectContaining({x: 4, y: 21}));
                    expect(gd.calcdata[1][2]).toEqual(jasmine.objectContaining({x: 5, y: 22}));
                    expect(gd.calcdata[1][3]).toEqual(jasmine.objectContaining({x: 6, y: 23}));
                    expect(gd.calcdata[1][4]).toEqual(jasmine.objectContaining({x: 7, y: 24}));

                    expect(gd.calcdata[2][0]).toEqual(jasmine.objectContaining({x: 8, y: 30}));
                    expect(gd.calcdata[2][1]).toEqual(jasmine.objectContaining({x: 9, y: 31}));
                    expect(gd.calcdata[2][2]).toEqual(jasmine.objectContaining({x: 10, y: 32}));
                })
                .then(done, done.fail);
            });

            it('category order is category ascending (even if categoryarray is specified)', function(done) {
                var x1 = ['Gear', 'Bearing', 'Motor'];
                var x2 = ['Switch', 'Plug', 'Cord', 'Fuse', 'Bulb'];
                var x3 = ['Pump', 'Leak', 'Seals'];

                Plotly.newPlot(gd, [
                    {x: x1, y: x1.map(function(d, i) {return i + 10;})},
                    {x: x2, y: x2.map(function(d, i) {return i + 20;})},
                    {x: x3, y: x3.map(function(d, i) {return i + 30;})}
                ], { xaxis: {
                    // type: 'category', // commented out to rely on autotyping for added realism
                    categoryorder: 'category ascending',
                    categoryarray: ['Switch', 'Bearing', 'Motor', 'Seals', 'Pump', 'Cord', 'Plug', 'Bulb', 'Fuse', 'Gear', 'Leak']
                    // this is the expected sorted outcome: ['Bearing','Bulb','Cord','Fuse','Gear','Leak','Motor','Plug','Pump','Seals','Switch']
                }})
                .then(function() {
                    expect(gd.calcdata[0][0]).toEqual(jasmine.objectContaining({x: 4, y: 10}));
                    expect(gd.calcdata[0][1]).toEqual(jasmine.objectContaining({x: 0, y: 11}));
                    expect(gd.calcdata[0][2]).toEqual(jasmine.objectContaining({x: 6, y: 12}));

                    expect(gd.calcdata[1][0]).toEqual(jasmine.objectContaining({x: 10, y: 20}));
                    expect(gd.calcdata[1][1]).toEqual(jasmine.objectContaining({x: 7, y: 21}));
                    expect(gd.calcdata[1][2]).toEqual(jasmine.objectContaining({x: 2, y: 22}));
                    expect(gd.calcdata[1][3]).toEqual(jasmine.objectContaining({x: 3, y: 23}));
                    expect(gd.calcdata[1][4]).toEqual(jasmine.objectContaining({x: 1, y: 24}));

                    expect(gd.calcdata[2][0]).toEqual(jasmine.objectContaining({x: 8, y: 30}));
                    expect(gd.calcdata[2][1]).toEqual(jasmine.objectContaining({x: 5, y: 31}));
                    expect(gd.calcdata[2][2]).toEqual(jasmine.objectContaining({x: 9, y: 32}));
                })
                .then(done, done.fail);
            });

            it('category order is category descending (even if categoryarray is specified)', function(done) {
                var x1 = ['Gear', 'Bearing', 'Motor'];
                var x2 = ['Switch', 'Plug', 'Cord', 'Fuse', 'Bulb'];
                var x3 = ['Pump', 'Leak', 'Seals'];

                Plotly.newPlot(gd, [
                    {x: x1, y: x1.map(function(d, i) {return i + 10;})},
                    {x: x2, y: x2.map(function(d, i) {return i + 20;})},
                    {x: x3, y: x3.map(function(d, i) {return i + 30;})}
                ], { xaxis: {
                    // type: 'category', // commented out to rely on autotyping for added realism
                    categoryorder: 'category descending',
                    categoryarray: ['Switch', 'Bearing', 'Motor', 'Seals', 'Pump', 'Cord', 'Plug', 'Bulb', 'Fuse', 'Gear', 'Leak']
                    // this is the expected sorted outcome: ["Switch", "Seals", "Pump", "Plug", "Motor", "Leak", "Gear", "Fuse", "Cord", "Bulb", "Bearing"]
                }})
                .then(function() {
                    expect(gd.calcdata[0][0]).toEqual(jasmine.objectContaining({x: 6, y: 10}));
                    expect(gd.calcdata[0][1]).toEqual(jasmine.objectContaining({x: 10, y: 11}));
                    expect(gd.calcdata[0][2]).toEqual(jasmine.objectContaining({x: 4, y: 12}));

                    expect(gd.calcdata[1][0]).toEqual(jasmine.objectContaining({x: 0, y: 20}));
                    expect(gd.calcdata[1][1]).toEqual(jasmine.objectContaining({x: 3, y: 21}));
                    expect(gd.calcdata[1][2]).toEqual(jasmine.objectContaining({x: 8, y: 22}));
                    expect(gd.calcdata[1][3]).toEqual(jasmine.objectContaining({x: 7, y: 23}));
                    expect(gd.calcdata[1][4]).toEqual(jasmine.objectContaining({x: 9, y: 24}));

                    expect(gd.calcdata[2][0]).toEqual(jasmine.objectContaining({x: 2, y: 30}));
                    expect(gd.calcdata[2][1]).toEqual(jasmine.objectContaining({x: 5, y: 31}));
                    expect(gd.calcdata[2][2]).toEqual(jasmine.objectContaining({x: 1, y: 32}));
                })
                .then(done, done.fail);
            });

            it('category order follows categoryarray', function(done) {
                var x1 = ['Gear', 'Bearing', 'Motor'];
                var x2 = ['Switch', 'Plug', 'Cord', 'Fuse', 'Bulb'];
                var x3 = ['Pump', 'Leak', 'Seals'];

                Plotly.newPlot(gd, [
                    {x: x1, y: x1.map(function(d, i) {return i + 10;})},
                    {x: x2, y: x2.map(function(d, i) {return i + 20;})},
                    {x: x3, y: x3.map(function(d, i) {return i + 30;})}
                ], { xaxis: {
                    // type: 'category', // commented out to rely on autotyping for added realism
                    categoryorder: 'array',
                    categoryarray: ['Switch', 'Bearing', 'Motor', 'Seals', 'Pump', 'Cord', 'Plug', 'Bulb', 'Fuse', 'Gear', 'Leak']
                }})
                .then(function() {
                    expect(gd.calcdata[0][0]).toEqual(jasmine.objectContaining({x: 9, y: 10}));
                    expect(gd.calcdata[0][1]).toEqual(jasmine.objectContaining({x: 1, y: 11}));
                    expect(gd.calcdata[0][2]).toEqual(jasmine.objectContaining({x: 2, y: 12}));

                    expect(gd.calcdata[1][0]).toEqual(jasmine.objectContaining({x: 0, y: 20}));
                    expect(gd.calcdata[1][1]).toEqual(jasmine.objectContaining({x: 6, y: 21}));
                    expect(gd.calcdata[1][2]).toEqual(jasmine.objectContaining({x: 5, y: 22}));
                    expect(gd.calcdata[1][3]).toEqual(jasmine.objectContaining({x: 8, y: 23}));
                    expect(gd.calcdata[1][4]).toEqual(jasmine.objectContaining({x: 7, y: 24}));

                    expect(gd.calcdata[2][0]).toEqual(jasmine.objectContaining({x: 4, y: 30}));
                    expect(gd.calcdata[2][1]).toEqual(jasmine.objectContaining({x: 10, y: 31}));
                    expect(gd.calcdata[2][2]).toEqual(jasmine.objectContaining({x: 3, y: 32}));
                })
                .then(done, done.fail);
            });
        });

        describe('ordering tests in the presence of multiple traces - partially overlapping', function() {
            it('baseline testing for the unordered, partially overlapping case', function(done) {
                var x1 = ['Gear', 'Bearing', 'Motor'];
                var x2 = ['Switch', 'Plug', 'Cord', 'Fuse', 'Bulb'];
                var x3 = ['Pump', 'Leak', 'Bearing', 'Seals'];

                Plotly.newPlot(gd, [
                    {x: x1, y: x1.map(function(d, i) {return i + 10;})},
                    {x: x2, y: x2.map(function(d, i) {return i + 20;})},
                    {x: x3, y: x3.map(function(d, i) {return i + 30;})}
                ])
                .then(function() {
                    expect(gd.calcdata[0][0]).toEqual(jasmine.objectContaining({x: 0, y: 10}));
                    expect(gd.calcdata[0][1]).toEqual(jasmine.objectContaining({x: 1, y: 11}));
                    expect(gd.calcdata[0][2]).toEqual(jasmine.objectContaining({x: 2, y: 12}));

                    expect(gd.calcdata[1][0]).toEqual(jasmine.objectContaining({x: 3, y: 20}));
                    expect(gd.calcdata[1][1]).toEqual(jasmine.objectContaining({x: 4, y: 21}));
                    expect(gd.calcdata[1][2]).toEqual(jasmine.objectContaining({x: 5, y: 22}));
                    expect(gd.calcdata[1][3]).toEqual(jasmine.objectContaining({x: 6, y: 23}));
                    expect(gd.calcdata[1][4]).toEqual(jasmine.objectContaining({x: 7, y: 24}));

                    expect(gd.calcdata[2][0]).toEqual(jasmine.objectContaining({x: 8, y: 30}));
                    expect(gd.calcdata[2][1]).toEqual(jasmine.objectContaining({x: 9, y: 31}));
                    expect(gd.calcdata[2][2]).toEqual(jasmine.objectContaining({x: 1, y: 32}));
                    expect(gd.calcdata[2][3]).toEqual(jasmine.objectContaining({x: 10, y: 33}));
                })
                .then(done, done.fail);
            });

            it('category order follows the trace order (even if categoryarray is specified)', function(done) {
                var x1 = ['Gear', 'Bearing', 'Motor'];
                var x2 = ['Switch', 'Plug', 'Cord', 'Fuse', 'Bulb'];
                var x3 = ['Pump', 'Leak', 'Bearing', 'Seals'];

                Plotly.newPlot(gd, [
                    {x: x1, y: x1.map(function(d, i) {return i + 10;})},
                    {x: x2, y: x2.map(function(d, i) {return i + 20;})},
                    {x: x3, y: x3.map(function(d, i) {return i + 30;})}
                ], { xaxis: {
                    // type: 'category', // commented out to rely on autotyping for added realism
                    categoryorder: 'trace',
                    categoryarray: ['Switch', 'Bearing', 'Motor', 'Seals', 'Pump', 'Cord', 'Plug', 'Bulb', 'Fuse', 'Gear', 'Leak']
                }})
                .then(function() {
                    expect(gd.calcdata[0][0]).toEqual(jasmine.objectContaining({x: 0, y: 10}));
                    expect(gd.calcdata[0][1]).toEqual(jasmine.objectContaining({x: 1, y: 11}));
                    expect(gd.calcdata[0][2]).toEqual(jasmine.objectContaining({x: 2, y: 12}));

                    expect(gd.calcdata[1][0]).toEqual(jasmine.objectContaining({x: 3, y: 20}));
                    expect(gd.calcdata[1][1]).toEqual(jasmine.objectContaining({x: 4, y: 21}));
                    expect(gd.calcdata[1][2]).toEqual(jasmine.objectContaining({x: 5, y: 22}));
                    expect(gd.calcdata[1][3]).toEqual(jasmine.objectContaining({x: 6, y: 23}));
                    expect(gd.calcdata[1][4]).toEqual(jasmine.objectContaining({x: 7, y: 24}));

                    expect(gd.calcdata[2][0]).toEqual(jasmine.objectContaining({x: 8, y: 30}));
                    expect(gd.calcdata[2][1]).toEqual(jasmine.objectContaining({x: 9, y: 31}));
                    expect(gd.calcdata[2][2]).toEqual(jasmine.objectContaining({x: 1, y: 32}));
                    expect(gd.calcdata[2][3]).toEqual(jasmine.objectContaining({x: 10, y: 33}));
                })
                .then(done, done.fail);
            });

            it('category order is category ascending (even if categoryarray is specified)', function(done) {
                var x1 = ['Gear', 'Bearing', 'Motor'];
                var x2 = ['Switch', 'Plug', 'Cord', 'Fuse', 'Bulb'];
                var x3 = ['Pump', 'Leak', 'Bearing', 'Seals'];

                Plotly.newPlot(gd, [
                    {x: x1, y: x1.map(function(d, i) {return i + 10;})},
                    {x: x2, y: x2.map(function(d, i) {return i + 20;})},
                    {x: x3, y: x3.map(function(d, i) {return i + 30;})}
                ], { xaxis: {
                    // type: 'category', // commented out to rely on autotyping for added realism
                    categoryorder: 'category ascending',
                    categoryarray: ['Switch', 'Bearing', 'Motor', 'Seals', 'Pump', 'Cord', 'Plug', 'Bulb', 'Fuse', 'Gear', 'Leak']
                    // this is the expected sorted outcome: ['Bearing','Bulb','Cord','Fuse','Gear','Leak','Motor','Plug','Pump','Seals','Switch']
                }})
                .then(function() {
                    expect(gd.calcdata[0][0]).toEqual(jasmine.objectContaining({x: 4, y: 10}));
                    expect(gd.calcdata[0][1]).toEqual(jasmine.objectContaining({x: 0, y: 11}));
                    expect(gd.calcdata[0][2]).toEqual(jasmine.objectContaining({x: 6, y: 12}));

                    expect(gd.calcdata[1][0]).toEqual(jasmine.objectContaining({x: 10, y: 20}));
                    expect(gd.calcdata[1][1]).toEqual(jasmine.objectContaining({x: 7, y: 21}));
                    expect(gd.calcdata[1][2]).toEqual(jasmine.objectContaining({x: 2, y: 22}));
                    expect(gd.calcdata[1][3]).toEqual(jasmine.objectContaining({x: 3, y: 23}));
                    expect(gd.calcdata[1][4]).toEqual(jasmine.objectContaining({x: 1, y: 24}));

                    expect(gd.calcdata[2][0]).toEqual(jasmine.objectContaining({x: 8, y: 30}));
                    expect(gd.calcdata[2][1]).toEqual(jasmine.objectContaining({x: 5, y: 31}));
                    expect(gd.calcdata[2][2]).toEqual(jasmine.objectContaining({x: 0, y: 32}));
                    expect(gd.calcdata[2][3]).toEqual(jasmine.objectContaining({x: 9, y: 33}));
                })
                .then(done, done.fail);
            });

            it('category order is category descending (even if categoryarray is specified)', function(done) {
                var x1 = ['Gear', 'Bearing', 'Motor'];
                var x2 = ['Switch', 'Plug', 'Cord', 'Fuse', 'Bulb'];
                var x3 = ['Pump', 'Leak', 'Bearing', 'Seals'];

                Plotly.newPlot(gd, [
                    {x: x1, y: x1.map(function(d, i) {return i + 10;})},
                    {x: x2, y: x2.map(function(d, i) {return i + 20;})},
                    {x: x3, y: x3.map(function(d, i) {return i + 30;})}
                ], { xaxis: {
                    // type: 'category', // commented out to rely on autotyping for added realism
                    categoryorder: 'category descending',
                    categoryarray: ['Switch', 'Bearing', 'Motor', 'Seals', 'Pump', 'Cord', 'Plug', 'Bulb', 'Fuse', 'Gear', 'Leak']
                    // this is the expected sorted outcome: ["Switch", "Seals", "Pump", "Plug", "Motor", "Leak", "Gear", "Fuse", "Cord", "Bulb", "Bearing"]
                }})
                .then(function() {
                    expect(gd.calcdata[0][0]).toEqual(jasmine.objectContaining({x: 6, y: 10}));
                    expect(gd.calcdata[0][1]).toEqual(jasmine.objectContaining({x: 10, y: 11}));
                    expect(gd.calcdata[0][2]).toEqual(jasmine.objectContaining({x: 4, y: 12}));

                    expect(gd.calcdata[1][0]).toEqual(jasmine.objectContaining({x: 0, y: 20}));
                    expect(gd.calcdata[1][1]).toEqual(jasmine.objectContaining({x: 3, y: 21}));
                    expect(gd.calcdata[1][2]).toEqual(jasmine.objectContaining({x: 8, y: 22}));
                    expect(gd.calcdata[1][3]).toEqual(jasmine.objectContaining({x: 7, y: 23}));
                    expect(gd.calcdata[1][4]).toEqual(jasmine.objectContaining({x: 9, y: 24}));

                    expect(gd.calcdata[2][0]).toEqual(jasmine.objectContaining({x: 2, y: 30}));
                    expect(gd.calcdata[2][1]).toEqual(jasmine.objectContaining({x: 5, y: 31}));
                    expect(gd.calcdata[2][2]).toEqual(jasmine.objectContaining({x: 10, y: 32}));
                    expect(gd.calcdata[2][3]).toEqual(jasmine.objectContaining({x: 1, y: 33}));
                })
                .then(done, done.fail);
            });

            it('category order follows categoryarray', function(done) {
                var x1 = ['Gear', 'Bearing', 'Motor'];
                var x2 = ['Switch', 'Plug', 'Cord', 'Fuse', 'Bulb'];
                var x3 = ['Pump', 'Leak', 'Bearing', 'Seals'];

                Plotly.newPlot(gd, [
                    {x: x1, y: x1.map(function(d, i) {return i + 10;})},
                    {x: x2, y: x2.map(function(d, i) {return i + 20;})},
                    {x: x3, y: x3.map(function(d, i) {return i + 30;})}
                ], { xaxis: {
                    // type: 'category', // commented out to rely on autotyping for added realism
                    categoryorder: 'array',
                    categoryarray: ['Switch', 'Bearing', 'Motor', 'Seals', 'Pump', 'Cord', 'Plug', 'Bulb', 'Fuse', 'Gear', 'Leak']
                }})
                .then(function() {
                    expect(gd.calcdata[0][0]).toEqual(jasmine.objectContaining({x: 9, y: 10}));
                    expect(gd.calcdata[0][1]).toEqual(jasmine.objectContaining({x: 1, y: 11}));
                    expect(gd.calcdata[0][2]).toEqual(jasmine.objectContaining({x: 2, y: 12}));

                    expect(gd.calcdata[1][0]).toEqual(jasmine.objectContaining({x: 0, y: 20}));
                    expect(gd.calcdata[1][1]).toEqual(jasmine.objectContaining({x: 6, y: 21}));
                    expect(gd.calcdata[1][2]).toEqual(jasmine.objectContaining({x: 5, y: 22}));
                    expect(gd.calcdata[1][3]).toEqual(jasmine.objectContaining({x: 8, y: 23}));
                    expect(gd.calcdata[1][4]).toEqual(jasmine.objectContaining({x: 7, y: 24}));

                    expect(gd.calcdata[2][0]).toEqual(jasmine.objectContaining({x: 4, y: 30}));
                    expect(gd.calcdata[2][1]).toEqual(jasmine.objectContaining({x: 10, y: 31}));
                    expect(gd.calcdata[2][2]).toEqual(jasmine.objectContaining({x: 1, y: 32}));
                    expect(gd.calcdata[2][3]).toEqual(jasmine.objectContaining({x: 3, y: 33}));
                })
                .then(done, done.fail);
            });
        });

        describe('ordering tests in the presence of multiple traces - fully overlapping', function() {
            it('baseline testing for the unordered, fully overlapping case', function(done) {
                var x1 = ['Gear', 'Bearing', 'Motor'];
                var x2 = ['Bearing', 'Gear', 'Motor'];
                var x3 = ['Motor', 'Gear', 'Bearing'];

                Plotly.newPlot(gd, [
                    {x: x1, y: x1.map(function(d, i) {return i + 10;})},
                    {x: x2, y: x2.map(function(d, i) {return i + 20;})},
                    {x: x3, y: x3.map(function(d, i) {return i + 30;})}
                ])
                .then(function() {
                    expect(gd.calcdata[0][0]).toEqual(jasmine.objectContaining({x: 0, y: 10}));
                    expect(gd.calcdata[0][1]).toEqual(jasmine.objectContaining({x: 1, y: 11}));
                    expect(gd.calcdata[0][2]).toEqual(jasmine.objectContaining({x: 2, y: 12}));

                    expect(gd.calcdata[1][0]).toEqual(jasmine.objectContaining({x: 1, y: 20}));
                    expect(gd.calcdata[1][1]).toEqual(jasmine.objectContaining({x: 0, y: 21}));
                    expect(gd.calcdata[1][2]).toEqual(jasmine.objectContaining({x: 2, y: 22}));

                    expect(gd.calcdata[2][0]).toEqual(jasmine.objectContaining({x: 2, y: 30}));
                    expect(gd.calcdata[2][1]).toEqual(jasmine.objectContaining({x: 0, y: 31}));
                    expect(gd.calcdata[2][2]).toEqual(jasmine.objectContaining({x: 1, y: 32}));
                })
                .then(done, done.fail);
            });

            it('category order follows the trace order (even if categoryarray is specified)', function(done) {
                var x1 = ['Gear', 'Bearing', 'Motor'];
                var x2 = ['Bearing', 'Gear', 'Motor'];
                var x3 = ['Motor', 'Gear', 'Bearing'];

                Plotly.newPlot(gd, [
                    {x: x1, y: x1.map(function(d, i) {return i + 10;})},
                    {x: x2, y: x2.map(function(d, i) {return i + 20;})},
                    {x: x3, y: x3.map(function(d, i) {return i + 30;})}
                ], { xaxis: {
                    // type: 'category', // commented out to rely on autotyping for added realism
                    categoryorder: 'trace',
                    categoryarray: ['Switch', 'Bearing', 'Motor', 'Seals', 'Pump', 'Cord', 'Plug', 'Bulb', 'Fuse', 'Gear', 'Leak']
                }})
                .then(function() {
                    expect(gd.calcdata[0][0]).toEqual(jasmine.objectContaining({x: 0, y: 10}));
                    expect(gd.calcdata[0][1]).toEqual(jasmine.objectContaining({x: 1, y: 11}));
                    expect(gd.calcdata[0][2]).toEqual(jasmine.objectContaining({x: 2, y: 12}));

                    expect(gd.calcdata[1][0]).toEqual(jasmine.objectContaining({x: 1, y: 20}));
                    expect(gd.calcdata[1][1]).toEqual(jasmine.objectContaining({x: 0, y: 21}));
                    expect(gd.calcdata[1][2]).toEqual(jasmine.objectContaining({x: 2, y: 22}));

                    expect(gd.calcdata[2][0]).toEqual(jasmine.objectContaining({x: 2, y: 30}));
                    expect(gd.calcdata[2][1]).toEqual(jasmine.objectContaining({x: 0, y: 31}));
                    expect(gd.calcdata[2][2]).toEqual(jasmine.objectContaining({x: 1, y: 32}));
                })
                .then(done, done.fail);
            });

            it('category order is category ascending (even if categoryarray is specified)', function(done) {
                var x1 = ['Gear', 'Bearing', 'Motor'];
                var x2 = ['Bearing', 'Gear', 'Motor'];
                var x3 = ['Motor', 'Gear', 'Bearing'];

                Plotly.newPlot(gd, [
                    {x: x1, y: x1.map(function(d, i) {return i + 10;})},
                    {x: x2, y: x2.map(function(d, i) {return i + 20;})},
                    {x: x3, y: x3.map(function(d, i) {return i + 30;})}
                ], { xaxis: {
                    // type: 'category', // commented out to rely on autotyping for added realism
                    categoryorder: 'category ascending',
                    categoryarray: ['Switch', 'Bearing', 'Motor', 'Seals', 'Pump', 'Cord', 'Plug', 'Bulb', 'Fuse', 'Gear', 'Leak']
                    // this is the expected sorted outcome: ['Bearing','Bulb','Cord','Fuse','Gear','Leak','Motor','Plug','Pump','Seals','Switch']
                }})
                .then(function() {
                    expect(gd.calcdata[0][0]).toEqual(jasmine.objectContaining({x: 1, y: 10}));
                    expect(gd.calcdata[0][1]).toEqual(jasmine.objectContaining({x: 0, y: 11}));
                    expect(gd.calcdata[0][2]).toEqual(jasmine.objectContaining({x: 2, y: 12}));

                    expect(gd.calcdata[1][0]).toEqual(jasmine.objectContaining({x: 0, y: 20}));
                    expect(gd.calcdata[1][1]).toEqual(jasmine.objectContaining({x: 1, y: 21}));
                    expect(gd.calcdata[1][2]).toEqual(jasmine.objectContaining({x: 2, y: 22}));

                    expect(gd.calcdata[2][0]).toEqual(jasmine.objectContaining({x: 2, y: 30}));
                    expect(gd.calcdata[2][1]).toEqual(jasmine.objectContaining({x: 1, y: 31}));
                    expect(gd.calcdata[2][2]).toEqual(jasmine.objectContaining({x: 0, y: 32}));
                })
                .then(done, done.fail);
            });

            it('category order is category descending (even if categoryarray is specified)', function(done) {
                var x1 = ['Gear', 'Bearing', 'Motor'];
                var x2 = ['Bearing', 'Gear', 'Motor'];
                var x3 = ['Motor', 'Gear', 'Bearing'];

                Plotly.newPlot(gd, [
                    {x: x1, y: x1.map(function(d, i) {return i + 10;})},
                    {x: x2, y: x2.map(function(d, i) {return i + 20;})},
                    {x: x3, y: x3.map(function(d, i) {return i + 30;})}
                ], { xaxis: {
                    // type: 'category', // commented out to rely on autotyping for added realism
                    categoryorder: 'category descending',
                    categoryarray: ['Switch', 'Bearing', 'Motor', 'Seals', 'Pump', 'Cord', 'Plug', 'Bulb', 'Fuse', 'Gear', 'Leak']
                    // this is the expected sorted outcome: ["Switch", "Seals", "Pump", "Plug", "Motor", "Leak", "Gear", "Fuse", "Cord", "Bulb", "Bearing"]
                }})
                .then(function() {
                    expect(gd.calcdata[0][0]).toEqual(jasmine.objectContaining({x: 1, y: 10}));
                    expect(gd.calcdata[0][1]).toEqual(jasmine.objectContaining({x: 2, y: 11}));
                    expect(gd.calcdata[0][2]).toEqual(jasmine.objectContaining({x: 0, y: 12}));

                    expect(gd.calcdata[1][0]).toEqual(jasmine.objectContaining({x: 2, y: 20}));
                    expect(gd.calcdata[1][1]).toEqual(jasmine.objectContaining({x: 1, y: 21}));
                    expect(gd.calcdata[1][2]).toEqual(jasmine.objectContaining({x: 0, y: 22}));

                    expect(gd.calcdata[2][0]).toEqual(jasmine.objectContaining({x: 0, y: 30}));
                    expect(gd.calcdata[2][1]).toEqual(jasmine.objectContaining({x: 1, y: 31}));
                    expect(gd.calcdata[2][2]).toEqual(jasmine.objectContaining({x: 2, y: 32}));
                })
                .then(done, done.fail);
            });

            it('category order follows categoryarray', function(done) {
                var x1 = ['Gear', 'Bearing', 'Motor'];
                var x2 = ['Bearing', 'Gear', 'Motor'];
                var x3 = ['Motor', 'Gear', 'Bearing'];

                Plotly.newPlot(gd, [
                    {x: x1, y: x1.map(function(d, i) {return i + 10;})},
                    {x: x2, y: x2.map(function(d, i) {return i + 20;})},
                    {x: x3, y: x3.map(function(d, i) {return i + 30;})}
                ], {
                    xaxis: {
                        // type: 'category', // commented out to rely on autotyping for added realism
                        categoryorder: 'array',
                        categoryarray: ['Bearing', 'Motor', 'Gear']
                    }
                })
                .then(function() {
                    expect(gd.calcdata[0][0]).toEqual(jasmine.objectContaining({x: 2, y: 10}));
                    expect(gd.calcdata[0][1]).toEqual(jasmine.objectContaining({x: 0, y: 11}));
                    expect(gd.calcdata[0][2]).toEqual(jasmine.objectContaining({x: 1, y: 12}));

                    expect(gd.calcdata[1][0]).toEqual(jasmine.objectContaining({x: 0, y: 20}));
                    expect(gd.calcdata[1][1]).toEqual(jasmine.objectContaining({x: 2, y: 21}));
                    expect(gd.calcdata[1][2]).toEqual(jasmine.objectContaining({x: 1, y: 22}));

                    expect(gd.calcdata[2][0]).toEqual(jasmine.objectContaining({x: 1, y: 30}));
                    expect(gd.calcdata[2][1]).toEqual(jasmine.objectContaining({x: 2, y: 31}));
                    expect(gd.calcdata[2][2]).toEqual(jasmine.objectContaining({x: 0, y: 32}));
                })
                .then(done, done.fail);
            });

            it('category order follows categoryarray even if data is sparse', function(done) {
                var x1 = ['Gear', 'Bearing', 'Motor'];
                var x2 = ['Bearing', 'Gear', 'Motor'];
                var x3 = ['Motor', 'Gear', 'Bearing'];

                Plotly.newPlot(gd, [
                    {x: x1, y: x1.map(function(d, i) {return i + 10;})},
                    {x: x2, y: x2.map(function(d, i) {return i + 20;})},
                    {x: x3, y: x3.map(function(d, i) {return i + 30;})}
                ], {
                    xaxis: {
                        // type: 'category', // commented out to rely on autotyping for added realism
                        categoryorder: 'array',
                        categoryarray: ['Switch', 'Bearing', 'Motor', 'Seals', 'Pump', 'Cord', 'Plug', 'Bulb', 'Fuse', 'Gear', 'Leak']
                    }
                })
                .then(function() {
                    expect(gd.calcdata[0][0]).toEqual(jasmine.objectContaining({x: 9, y: 10}));
                    expect(gd.calcdata[0][1]).toEqual(jasmine.objectContaining({x: 1, y: 11}));
                    expect(gd.calcdata[0][2]).toEqual(jasmine.objectContaining({x: 2, y: 12}));

                    expect(gd.calcdata[1][0]).toEqual(jasmine.objectContaining({x: 1, y: 20}));
                    expect(gd.calcdata[1][1]).toEqual(jasmine.objectContaining({x: 9, y: 21}));
                    expect(gd.calcdata[1][2]).toEqual(jasmine.objectContaining({x: 2, y: 22}));

                    expect(gd.calcdata[2][0]).toEqual(jasmine.objectContaining({x: 2, y: 30}));
                    expect(gd.calcdata[2][1]).toEqual(jasmine.objectContaining({x: 9, y: 31}));
                    expect(gd.calcdata[2][2]).toEqual(jasmine.objectContaining({x: 1, y: 32}));
                })
                .then(done, done.fail);
            });
        });

        describe('ordering and stacking combined', function() {
            it('partially overlapping category order follows categoryarray and stacking produces expected results', function(done) {
                var x1 = ['Gear', 'Bearing', 'Motor'];
                var x2 = ['Switch', 'Plug', 'Cord', 'Fuse', 'Bulb'];
                var x3 = ['Pump', 'Leak', 'Bearing', 'Seals'];

                Plotly.newPlot(gd, [
                    {x: x1, y: x1.map(function(d, i) {return i + 10;}), type: 'bar'},
                    {x: x2, y: x2.map(function(d, i) {return i + 20;}), type: 'bar'},
                    {x: x3, y: x3.map(function(d, i) {return i + 30;}), type: 'bar'}
                ], {
                    barmode: 'stack',
                    xaxis: {
                        // type: 'category', // commented out to rely on autotyping for added realism
                        categoryorder: 'array',
                        categoryarray: ['Switch', 'Bearing', 'Motor', 'Seals', 'Pump', 'Cord', 'Plug', 'Bulb', 'Fuse', 'Gear', 'Leak']
                    }
                })
                .then(function() {
                    expect(gd.calcdata[0][0]).toEqual(jasmine.objectContaining({x: 9, y: 10}));
                    expect(gd.calcdata[0][1]).toEqual(jasmine.objectContaining({x: 1, y: 11}));
                    expect(gd.calcdata[0][2]).toEqual(jasmine.objectContaining({x: 2, y: 12}));

                    expect(gd.calcdata[1][0]).toEqual(jasmine.objectContaining({x: 0, y: 20}));
                    expect(gd.calcdata[1][1]).toEqual(jasmine.objectContaining({x: 6, y: 21}));
                    expect(gd.calcdata[1][2]).toEqual(jasmine.objectContaining({x: 5, y: 22}));
                    expect(gd.calcdata[1][3]).toEqual(jasmine.objectContaining({x: 8, y: 23}));
                    expect(gd.calcdata[1][4]).toEqual(jasmine.objectContaining({x: 7, y: 24}));

                    expect(gd.calcdata[2][0]).toEqual(jasmine.objectContaining({x: 4, y: 30}));
                    expect(gd.calcdata[2][1]).toEqual(jasmine.objectContaining({x: 10, y: 31}));
                    expect(gd.calcdata[2][2]).toEqual(jasmine.objectContaining({x: 1, y: 11 + 32}));
                    expect(gd.calcdata[2][3]).toEqual(jasmine.objectContaining({x: 3, y: 33}));
                })
                .then(done, done.fail);
            });

            it('fully overlapping - category order follows categoryarray and stacking produces expected results', function(done) {
                var x1 = ['Gear', 'Bearing', 'Motor'];
                var x2 = ['Bearing', 'Gear', 'Motor'];
                var x3 = ['Motor', 'Gear', 'Bearing'];

                Plotly.newPlot(gd, [
                    {x: x1, y: x1.map(function(d, i) {return i + 10;}), type: 'bar'},
                    {x: x2, y: x2.map(function(d, i) {return i + 20;}), type: 'bar'},
                    {x: x3, y: x3.map(function(d, i) {return i + 30;}), type: 'bar'}
                ], {
                    barmode: 'stack',
                    xaxis: {
                        // type: 'category', // commented out to rely on autotyping for added realism
                        categoryorder: 'array',
                        categoryarray: ['Bearing', 'Motor', 'Gear']
                    }
                })
                .then(function() {
                    expect(gd.calcdata[0][0]).toEqual(jasmine.objectContaining({x: 2, y: 10}));
                    expect(gd.calcdata[0][1]).toEqual(jasmine.objectContaining({x: 0, y: 11}));
                    expect(gd.calcdata[0][2]).toEqual(jasmine.objectContaining({x: 1, y: 12}));

                    expect(gd.calcdata[1][0]).toEqual(jasmine.objectContaining({x: 0, y: 11 + 20}));
                    expect(gd.calcdata[1][1]).toEqual(jasmine.objectContaining({x: 2, y: 10 + 21}));
                    expect(gd.calcdata[1][2]).toEqual(jasmine.objectContaining({x: 1, y: 12 + 22}));

                    expect(gd.calcdata[2][0]).toEqual(jasmine.objectContaining({x: 1, y: 12 + 22 + 30}));
                    expect(gd.calcdata[2][1]).toEqual(jasmine.objectContaining({x: 2, y: 10 + 21 + 31}));
                    expect(gd.calcdata[2][2]).toEqual(jasmine.objectContaining({x: 0, y: 11 + 20 + 32}));
                })
                .then(done, done.fail);
            });
        });

        it('should order categories per axis', function(done) {
            Plotly.newPlot(gd, [
                {x: ['a', 'c', 'g', 'e']},
                {x: ['b', 'h', 'f', 'd'], xaxis: 'x2'}
            ], {
                xaxis: {categoryorder: 'category ascending', domain: [0, 0.4]},
                xaxis2: {categoryorder: 'category descending', domain: [0.6, 1]}
            })
            .then(function() {
                expect(gd._fullLayout.xaxis._categories).toEqual(['a', 'c', 'e', 'g']);
                expect(gd._fullLayout.xaxis2._categories).toEqual(['h', 'f', 'd', 'b']);
            })
            .then(done, done.fail);
        });

        it('should consider number categories and their string representation to be the same', function(done) {
            Plotly.newPlot(gd, [{
                x: ['a', 'b', 1, '1'],
                y: [1, 2, 3, 4]
            }], {
                xaxis: {type: 'category'}
            })
            .then(function() {
                expect(gd._fullLayout.xaxis._categories).toEqual(['a', 'b', '1']);
                expect(gd._fullLayout.xaxis._categoriesMap).toEqual({
                    '1': 2,
                    'a': 0,
                    'b': 1
                });
            })
            .then(done, done.fail);
        });

        describe('by value', function() {
            var schema = Plotly.PlotSchema.get();
            var traces = Object.keys(schema.traces);
            var tracesSchema = [];
            var i, j, k;
            for(i = 0; i < traces.length; i++) {
                tracesSchema.push(schema.traces[traces[i]]);
            }
            var cartesianTraces = tracesSchema.filter(function(t) {
                return t.categories.length && t.categories.indexOf('cartesian') !== -1;
            });

            // exclude traces that do not support sorting by value
            var supportedCartesianTraces = cartesianTraces.filter(function(t) {
                if(t.categories.indexOf('noSortingByValue') === -1) return true;
            });

            var cat = ['a', 'b', 'c'];

            // oneOrientationTraces are traces for which swapping x/y is not supported
            var oneOrientationTraces = ['ohlc', 'candlestick'];

            function makeData(type, axName, a, b) {
                var input = [a, b];
                var cat = input[axName === 'yaxis' ? 1 : 0];
                var data = input[axName === 'yaxis' ? 0 : 1];

                var measure = [];
                for(j = 0; j < data.length; j++) {
                    measure.push('absolute');
                }

                var z = Lib.init2dArray(cat.length, data.length);
                for(j = 0; j < z.length; j++) {
                    for(k = 0; k < z[j].length; k++) {
                        z[j][k] = 0;
                    }
                }
                if(axName === 'xaxis') {
                    for(j = 0; j < b.length; j++) {
                        z[0][j] = b[j];
                    }
                }
                if(axName === 'yaxis') {
                    for(j = 0; j < b.length; j++) {
                        z[j][0] = b[j];
                    }
                }

                return Lib.extendDeep({}, {
                    orientation: axName === 'yaxis' ? 'h' : 'v',
                    type: type,
                    x: cat,
                    a: cat,

                    b: data,
                    y: data,
                    z: z,

                    // For OHLC
                    open: data,
                    close: data,
                    high: data,
                    low: data,

                    // For histogram
                    nbinsx: cat.length,
                    nbinsy: data.length,

                    // For waterfall
                    measure: measure,

                    // For splom
                    dimensions: [
                        {
                            label: 'DimensionA',
                            values: a
                        },
                        {
                            label: 'DimensionB',
                            values: b
                        }
                    ]
                });
            }

            supportedCartesianTraces.forEach(function(trace) {
                ['xaxis', 'yaxis'].forEach(function(axName) {
                    if(axName === 'yaxis' && oneOrientationTraces.indexOf(trace.type) !== -1) return;

                    function checkAggregatedValue(baseMock, expectedAgg, finalOrder, done) {
                        var mock = Lib.extendDeep({}, baseMock);

                        if(mock.data[0].type.match(/histogram/)) {
                            for(i = 0; i < mock.data.length; i++) {
                                mock.data[i][axName === 'yaxis' ? 'y' : 'x'].push('a');
                                mock.data[i][axName === 'yaxis' ? 'x' : 'y'].push(7);
                            }
                        }

                        Plotly.newPlot(gd, mock)
                        .then(function(gd) {
                            var agg = gd._fullLayout[trace.type === 'splom' ? 'xaxis' : axName]._categoriesAggregatedValue.sort(function(a, b) {
                                return a[0] > b[0] ? 1 : -1;
                            });
                            expect(agg).toEqual(expectedAgg, 'wrong aggregation for ' + axName);

                            if(finalOrder) {
                                expect(gd._fullLayout[trace.type === 'splom' ? 'xaxis' : axName]._categories).toEqual(finalOrder, 'wrong order');
                            }
                        })
                        .then(done, done.fail);
                    }

                    ['total ascending', 'total descending'].forEach(function(categoryorder) {
                        it('sorts ' + axName + ' by ' + categoryorder + ' for trace type ' + trace.type, function(done) {
                            var data = [7, 2, 3];
                            var baseMock = {data: [makeData(trace.type, axName, cat, data)], layout: {}};
                            baseMock.layout[axName] = { type: 'category', categoryorder: categoryorder};

                            // Set expectations
                            var finalOrder = ['b', 'c', 'a'];
                            if(categoryorder === 'total descending') finalOrder.reverse();
                            var expectedAgg = [['a', 7], ['b', 2], ['c', 3]];

                            if(trace.type === 'ohlc' || trace.type === 'candlestick') expectedAgg = [['a', 14], ['b', 4], ['c', 6]];
                            if(trace.type.match(/histogram/)) expectedAgg = [['a', 2], ['b', 1], ['c', 1]];

                            checkAggregatedValue(baseMock, expectedAgg, finalOrder, done);
                        });
                    });

                    it('sums values across traces of type ' + trace.type, function(done) {
                        var type = trace.type;
                        var data = [7, 2, 3];
                        var data2 = [5, 4, 2];
                        var baseMock = { data: [makeData(type, axName, cat, data), makeData(type, axName, cat, data2)], layout: {}};
                        baseMock.layout[axName] = { type: 'category', categoryorder: 'total ascending'};

                        var expectedAgg = [['a', data[0] + data2[0]], ['b', data[1] + data2[1]], ['c', data[2] + data2[2]]];
                        if(type === 'ohlc' || type === 'candlestick') expectedAgg = [['a', 2 * expectedAgg[0][1]], ['b', 2 * expectedAgg[1][1]], ['c', 2 * expectedAgg[2][1]]];
                        if(type.match(/histogram/)) expectedAgg = [['a', 4], ['b', 2], ['c', 2]];

                        checkAggregatedValue(baseMock, expectedAgg, false, done);
                    });

                    it('ignores values from traces that are not visible ' + trace.type, function(done) {
                        var type = trace.type;
                        var data = [7, 2, 3];
                        var data2 = [5, 4, 2];
                        var baseMock = { data: [makeData(type, axName, cat, data), makeData(type, axName, cat, data2)], layout: {}};
                        baseMock.layout[axName] = { type: 'category', categoryorder: 'total ascending'};

                        // Hide second trace
                        baseMock.data[1].visible = 'legendonly';
                        var expectedAgg = [['a', data[0]], ['b', data[1]], ['c', data[2]]];
                        if(type === 'ohlc' || type === 'candlestick') expectedAgg = [['a', 2 * expectedAgg[0][1]], ['b', 2 * expectedAgg[1][1]], ['c', 2 * expectedAgg[2][1]]];
                        if(type.match(/histogram/)) expectedAgg = [['a', 2], ['b', 1], ['c', 1]];

                        checkAggregatedValue(baseMock, expectedAgg, false, done);
                    });

                    it('finds the minimum value per category across traces of type ' + trace.type, function(done) {
                        var type = trace.type;
                        var data = [7, 2, 3];
                        var data2 = [5, 4, 2];
                        var baseMock = { data: [makeData(type, axName, cat, data), makeData(type, axName, cat, data2)], layout: {}};
                        baseMock.layout[axName] = { type: 'category', categoryorder: 'min ascending'};

                        var expectedAgg = [['a', Math.min(data[0], data2[0])], ['b', Math.min(data[1], data2[1])], ['c', Math.min(data[2], data2[2])]];
                        if(trace.categories.indexOf('2dMap') !== -1) expectedAgg = [['a', 0], ['b', 0], ['c', 0]];
                        if(type === 'histogram') expectedAgg = [['a', 2], ['b', 1], ['c', 1]];

                        checkAggregatedValue(baseMock, expectedAgg, false, done);
                    });

                    it('finds the maximum value per category across traces of type ' + trace.type, function(done) {
                        var type = trace.type;
                        var data = [7, 2, 3];
                        var data2 = [5, 4, 2];
                        var baseMock = { data: [makeData(type, axName, cat, data), makeData(type, axName, cat, data2)], layout: {}};
                        baseMock.layout[axName] = { type: 'category', categoryorder: 'max ascending'};

                        var expectedAgg = [['a', Math.max(data[0], data2[0])], ['b', Math.max(data[1], data2[1])], ['c', Math.max(data[2], data2[2])]];
                        if(type.match(/histogram/)) expectedAgg = [['a', 2], ['b', 1], ['c', 1]];

                        checkAggregatedValue(baseMock, expectedAgg, false, done);
                    });

                    it('takes the mean of all values per category across traces of type ' + trace.type, function(done) {
                        var type = trace.type;
                        var data = [7, 2, 3];
                        var data2 = [5, 4, 2];
                        var baseMock = { data: [makeData(type, axName, cat, data), makeData(type, axName, cat, data2)], layout: {}};
                        baseMock.layout[axName] = { type: 'category', categoryorder: 'mean ascending'};

                        var expectedAgg = [['a', (data[0] + data2[0]) / 2 ], ['b', (data[1] + data2[1]) / 2], ['c', (data[2] + data2[2]) / 2]];
                        if(type === 'histogram') expectedAgg = [['a', 2], ['b', 1], ['c', 1]];
                        if(type === 'histogram2d') expectedAgg = [['a', 2 / 3], ['b', 1 / 3], ['c', 1 / 3]];
                        if(type === 'contour' || type === 'heatmap') expectedAgg = [['a', expectedAgg[0][1] / 3], ['b', expectedAgg[1][1] / 3], ['c', expectedAgg[2][1] / 3]];
                        if(type === 'histogram2dcontour') expectedAgg = [['a', 2 / 4], ['b', 1 / 4], ['c', 1 / 4]]; // TODO: this result is inintuitive

                        checkAggregatedValue(baseMock, expectedAgg, false, done);
                    });

                    it('takes the median of all values per category across traces of type ' + trace.type, function(done) {
                        var type = trace.type;
                        var data = [7, 2, 3];
                        var data2 = [5, 4, 2];
                        var data3 = [6, 5, 7];
                        var baseMock = { data: [makeData(type, axName, cat, data), makeData(type, axName, cat, data2), makeData(type, axName, cat, data3)], layout: {}};
                        baseMock.layout[axName] = { type: 'category', categoryorder: 'median ascending'};

                        var expectedAgg = [['a', 6], ['b', 4], ['c', 3]];
                        if(type === 'histogram') expectedAgg = [['a', 2], ['b', 1], ['c', 1]];
                        if(type === 'histogram2d') expectedAgg = [['a', 1], ['b', 0], ['c', 0]];
                        if(type === 'histogram2dcontour' || type === 'contour' || type === 'heatmap') expectedAgg = [['a', 0], ['b', 0], ['c', 0]];
                        checkAggregatedValue(baseMock, expectedAgg, false, done);
                    });
                });
            });

            it('works on asymmetric splom', function(done) {
                var mock = require('@mocks/splom_multi-axis-type');
                var mockCopy = Lib.extendDeep(mock, {});

                var order = ['donald', 'georgeW', 'bill', 'ronald', 'richard', 'jimmy', 'george', 'barack', 'gerald', 'lyndon'];

                Plotly.newPlot(gd, mockCopy)
                .then(function() {
                    return Plotly.relayout(gd, 'yaxis5.categoryorder', 'total descending');
                })
                .then(function() {
                    expect(gd._fullLayout.yaxis5._categories).toEqual(order, 'wrong order');
                    return Plotly.relayout(gd, 'yaxis5.categoryorder', 'total ascending');
                })
                .then(function() {
                    expect(gd._fullLayout.yaxis5._categories).toEqual(order.reverse(), 'wrong order');
                })
                .then(done, done.fail);
            });
        });
    });

    describe('customdata', function() {
        it('should pass customdata to the calcdata points', function(done) {
            Plotly.newPlot(gd, [{
                x: [0, 1, 3],
                y: [4, 5, 7],
                customdata: ['a', 'b', {foo: 'bar'}]
            }], {})
            .then(function() {
                expect(gd.calcdata[0][0]).toEqual(jasmine.objectContaining({data: 'a'}));
                expect(gd.calcdata[0][1]).toEqual(jasmine.objectContaining({data: 'b'}));
                expect(gd.calcdata[0][2]).toEqual(jasmine.objectContaining({data: {foo: 'bar'}}));
            })
            .then(done, done.fail);
        });
    });
});
