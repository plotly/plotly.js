var Plotly = require('@lib/index');

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');

describe('calculated data and points', function() {

    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(destroyGraphDiv);

    describe('connectGaps', function() {

        it('should exclude null and undefined points when false', function() {
            Plotly.plot(gd, [{ x: [1,2,3,undefined,5], y: [1,null,3,4,5]}], {});

            expect(gd.calcdata[0][1]).toEqual({ x: false, y: false});
            expect(gd.calcdata[0][3]).toEqual({ x: false, y: false});
        });

        it('should exclude null and undefined points as categories when false', function() {
            Plotly.plot(gd, [{ x: [1,2,3,undefined,5], y: [1,null,3,4,5] }], { xaxis: { type: 'category' }});

            expect(gd.calcdata[0][1]).toEqual({ x: false, y: false});
            expect(gd.calcdata[0][3]).toEqual({ x: false, y: false});
        });
    });

    describe('category ordering', function() {

        describe('default category ordering reified', function() {

            it('should output categories in the given order by default', function() {

                Plotly.plot(gd, [{x: ['c','a','e','b','d'], y: [15,11,12,13,14]}], { xaxis: {
                    type: 'category'
                }});

                expect(gd.calcdata[0][0].y).toEqual(15);
                expect(gd.calcdata[0][1].y).toEqual(11);
                expect(gd.calcdata[0][2].y).toEqual(12);
                expect(gd.calcdata[0][3].y).toEqual(13);
                expect(gd.calcdata[0][4].y).toEqual(14);
            });

            it('should output categories in the given order if `trace` order is explicitly specified', function() {

                Plotly.plot(gd, [{x: ['c','a','e','b','d'], y: [15,11,12,13,14]}], { xaxis: {
                    type: 'category',
                    categorymode: 'trace'
                    // Also, if axis tick order is made configurable, shouldn't we make trace order configurable?
                    // Trace order as in, if a line or curve is drawn through points, what's the trace sequence.
                    // These are two orthogonal concepts. Currently, the trace order is implied
                    // by the order the {x,y} arrays are specified.
                }});

                expect(gd.calcdata[0][0].y).toEqual(15);
                expect(gd.calcdata[0][1].y).toEqual(11);
                expect(gd.calcdata[0][2].y).toEqual(12);
                expect(gd.calcdata[0][3].y).toEqual(13);
                expect(gd.calcdata[0][4].y).toEqual(14);
            });
        });

        describe('domain alphanumerical category ordering', function() {

            it('should output categories in ascending domain alphanumerical order', function() {

                Plotly.plot(gd, [{x: ['c','a','e','b','d'], y: [15,11,12,13,14]}], { xaxis: {
                    type: 'category',
                    categorymode: 'category ascending'
                }});

                expect(gd.calcdata[0][0]).toEqual(jasmine.objectContaining({x: 2, y: 15}));
                expect(gd.calcdata[0][1]).toEqual(jasmine.objectContaining({x: 0, y: 11}));
                expect(gd.calcdata[0][2]).toEqual(jasmine.objectContaining({x: 4, y: 12}));
                expect(gd.calcdata[0][3]).toEqual(jasmine.objectContaining({x: 1, y: 13}));
                expect(gd.calcdata[0][4]).toEqual(jasmine.objectContaining({x: 3, y: 14}));
            });

            it('should output categories in descending domain alphanumerical order', function() {

                Plotly.plot(gd, [{x: ['c','a','e','b','d'], y: [15,11,12,13,14]}], { xaxis: {
                    type: 'category',
                    categorymode: 'category descending'
                }});

                expect(gd.calcdata[0][0]).toEqual(jasmine.objectContaining({x: 2, y: 15}));
                expect(gd.calcdata[0][1]).toEqual(jasmine.objectContaining({x: 4, y: 11}));
                expect(gd.calcdata[0][2]).toEqual(jasmine.objectContaining({x: 0, y: 12}));
                expect(gd.calcdata[0][3]).toEqual(jasmine.objectContaining({x: 3, y: 13}));
                expect(gd.calcdata[0][4]).toEqual(jasmine.objectContaining({x: 1, y: 14}));
            });

            it('should output categories in ascending domain alphanumerical order even if categories are all numbers', function() {

                Plotly.plot(gd, [{x: [3,1,5,2,4], y: [15,11,12,13,14]}], { xaxis: {
                    type: 'category',
                    categorymode: 'category ascending'
                }});

                expect(gd.calcdata[0][0]).toEqual(jasmine.objectContaining({x: 2, y: 15}));
                expect(gd.calcdata[0][1]).toEqual(jasmine.objectContaining({x: 0, y: 11}));
                expect(gd.calcdata[0][2]).toEqual(jasmine.objectContaining({x: 4, y: 12}));
                expect(gd.calcdata[0][3]).toEqual(jasmine.objectContaining({x: 1, y: 13}));
                expect(gd.calcdata[0][4]).toEqual(jasmine.objectContaining({x: 3, y: 14}));
            });

            it('should output categories in categorymode order even if category array is defined', function() {

                Plotly.plot(gd, [{x: ['c','a','e','b','d'], y: [15,11,12,13,14]}], { xaxis: {
                    type: 'category',
                    categorymode: 'category ascending',
                    categorylist: ['b','a','d','e','c'] // These must be ignored. Alternative: error?
                }});

                expect(gd.calcdata[0][0]).toEqual(jasmine.objectContaining({x: 2, y: 15}));
                expect(gd.calcdata[0][1]).toEqual(jasmine.objectContaining({x: 0, y: 11}));
                expect(gd.calcdata[0][2]).toEqual(jasmine.objectContaining({x: 4, y: 12}));
                expect(gd.calcdata[0][3]).toEqual(jasmine.objectContaining({x: 1, y: 13}));
                expect(gd.calcdata[0][4]).toEqual(jasmine.objectContaining({x: 3, y: 14}));
            });

            it('should output categories in ascending domain alphanumerical order, excluding undefined', function() {

                Plotly.plot(gd, [{x: ['c',undefined,'e','b','d'], y: [15,11,12,13,14]}], { xaxis: {
                    type: 'category',
                    categorymode: 'category ascending'
                }});

                expect(gd.calcdata[0][0]).toEqual(jasmine.objectContaining({x: 1, y: 15}));
                expect(gd.calcdata[0][2]).toEqual(jasmine.objectContaining({x: 3, y: 12}));
                expect(gd.calcdata[0][3]).toEqual(jasmine.objectContaining({x: 0, y: 13}));
                expect(gd.calcdata[0][4]).toEqual(jasmine.objectContaining({x: 2, y: 14}));
            });
        });

/*
        describe('codomain numerical category ordering', function() {

            it('should output categories in ascending codomain numerical order', function() {

                Plotly.plot(gd, [{x: ['c','a','e','b','d'], y: [15,11,12,13,14]}], { xaxis: {
                    type: 'category',
                    categorymode: 'value ascending'
                }});

                expect(gd.calcdata[0][0].y).toEqual(11);
                expect(gd.calcdata[0][1].y).toEqual(12);
                expect(gd.calcdata[0][2].y).toEqual(13);
                expect(gd.calcdata[0][3].y).toEqual(14);
                expect(gd.calcdata[0][4].y).toEqual(15);
            });

            it('should output categories in descending codomain numerical order', function() {

                Plotly.plot(gd, [{x: ['c','a','e','b','d'], y: [15,11,12,13,14]}], { xaxis: {
                    type: 'category',
                    categorymode: 'value descending'
                }});

                expect(gd.calcdata[0][0].y).toEqual(15);
                expect(gd.calcdata[0][1].y).toEqual(14);
                expect(gd.calcdata[0][2].y).toEqual(13);
                expect(gd.calcdata[0][3].y).toEqual(12);
                expect(gd.calcdata[0][4].y).toEqual(11);
            });

            it('should output categories in descending codomain numerical order, excluding nulls', function() {

                Plotly.plot(gd, [{x: ['c','a','e','b','d'], y: [15,11,null,13,14]}], { xaxis: {
                    type: 'category',
                    categorymode: 'value descending'
                }});

                expect(gd.calcdata[0][0].y).toEqual(15);
                expect(gd.calcdata[0][1].y).toEqual(14);
                expect(gd.calcdata[0][2].y).toEqual(12);
                expect(gd.calcdata[0][3].y).toEqual(11);

            });
        });
*/

        describe('explicit category ordering', function() {

            it('should output categories in explicitly supplied order, independent of trace order', function() {

                Plotly.plot(gd, [{x: ['c','a','e','b','d'], y: [15,11,12,13,14]}], { xaxis: {
                    type: 'category',
                    categorymode: 'array',
                    categorylist: ['b','a','d','e','c']
                }});

                expect(gd.calcdata[0][0]).toEqual(jasmine.objectContaining({x: 4, y: 15}));
                expect(gd.calcdata[0][1]).toEqual(jasmine.objectContaining({x: 1, y: 11}));
                expect(gd.calcdata[0][2]).toEqual(jasmine.objectContaining({x: 3, y: 12}));
                expect(gd.calcdata[0][3]).toEqual(jasmine.objectContaining({x: 0, y: 13}));
                expect(gd.calcdata[0][4]).toEqual(jasmine.objectContaining({x: 2, y: 14}));
            });

            it('should output categories in explicitly supplied order even if category values are all numbers', function() {

                Plotly.plot(gd, [{x: [3,1,5,2,4], y: [15,11,12,13,14]}], { xaxis: {
                    type: 'category',
                    categorymode: 'array',
                    categorylist: [2,1,4,5,3]
                }});

                expect(gd.calcdata[0][0]).toEqual(jasmine.objectContaining({x: 4, y: 15}));
                expect(gd.calcdata[0][1]).toEqual(jasmine.objectContaining({x: 1, y: 11}));
                expect(gd.calcdata[0][2]).toEqual(jasmine.objectContaining({x: 3, y: 12}));
                expect(gd.calcdata[0][3]).toEqual(jasmine.objectContaining({x: 0, y: 13}));
                expect(gd.calcdata[0][4]).toEqual(jasmine.objectContaining({x: 2, y: 14}));
            });

            it('should output categories in explicitly supplied order, independent of trace order, pruned', function() {

                Plotly.plot(gd, [{x: ['c',undefined,'e','b','d'], y: [15,11,12,null,14]}], { xaxis: {
                    type: 'category',
                    categorymode: 'array',
                    categorylist: ['b','a','d','e','c']
                }});

                expect(gd.calcdata[0][0]).toEqual(jasmine.objectContaining({x: 4, y: 15}));
                expect(gd.calcdata[0][1]).toEqual({ x: false, y: false});
                expect(gd.calcdata[0][2]).toEqual(jasmine.objectContaining({x: 3, y: 12}));
                expect(gd.calcdata[0][3]).toEqual({ x: false, y: false});
                expect(gd.calcdata[0][4]).toEqual(jasmine.objectContaining({x: 2, y: 14}));
            });

            it('should output categories in explicitly supplied order even if not all categories are present', function() {

                Plotly.plot(gd, [{x: ['c','a','e','b','d'], y: [15,11,12,13,14]}], { xaxis: {
                    type: 'category',
                    categorymode: 'array',
                    categorylist: ['b','x','a','d','z','e','c']
                }});

                expect(gd.calcdata[0][0]).toEqual(jasmine.objectContaining({x: 6, y: 15}));
                expect(gd.calcdata[0][1]).toEqual(jasmine.objectContaining({x: 2, y: 11}));
                expect(gd.calcdata[0][2]).toEqual(jasmine.objectContaining({x: 5, y: 12}));
                expect(gd.calcdata[0][3]).toEqual(jasmine.objectContaining({x: 0, y: 13}));
                expect(gd.calcdata[0][4]).toEqual(jasmine.objectContaining({x: 3, y: 14}));
            });

            it('should output categories in explicitly supplied order even if some missing categories were at the beginning or end of categorylist', function() {

                Plotly.plot(gd, [{x: ['c','a','e','b','d'], y: [15,11,12,13,14]}], { xaxis: {
                    type: 'category',
                    categorymode: 'array',
                    categorylist: ['y','b','x','a','d','z','e','c', 'q', 'k']
                }});

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
            });

            it('should output categories in explicitly supplied order even if some missing categories were at the beginning or end of categorylist', function() {

                // The auto-range feature currently eliminates unutilized category ticks on the left/right edge
                // BUT keeps it if a data point with null is added; test is almost identical to the one above
                // except that it explicitly adds an axis tick for y

                Plotly.plot(gd, [{x: ['c','a','e','b','d', 'y'], y: [15,11,12,13,14, null]}], { xaxis: {
                    type: 'category',
                    categorymode: 'array',
                    categorylist: ['y','b','x','a','d','z','e','c', 'q', 'k']
                }});

                expect(gd.calcdata[0][0]).toEqual(jasmine.objectContaining({x: 7, y: 15}));
                expect(gd.calcdata[0][1]).toEqual(jasmine.objectContaining({x: 3, y: 11}));
                expect(gd.calcdata[0][2]).toEqual(jasmine.objectContaining({x: 6, y: 12}));
                expect(gd.calcdata[0][3]).toEqual(jasmine.objectContaining({x: 1, y: 13}));
                expect(gd.calcdata[0][4]).toEqual(jasmine.objectContaining({x: 4, y: 14}));

                var domTickTexts = Array.prototype.slice.call(document.querySelectorAll('g.xtick'))
                    .map(function(e) {return e.__data__.text;});

                expect(domTickTexts).toEqual(['y', 'b', 'x', 'a', 'd', 'z', 'e', 'c']);  // q, k has no data; y is null
            });

            it('should output categories in explicitly supplied order even if not all categories are present, and should interact with a null value orthogonally', function() {

                Plotly.plot(gd, [{x: ['c','a','e','b','d'], y: [15,null,12,13,14]}], { xaxis: {
                    type: 'category',
                    categorymode: 'array',
                    categorylist: ['b','x','a','d','z','e','c']
                }});

                expect(gd.calcdata[0][0]).toEqual(jasmine.objectContaining({x: 6, y: 15}));
                expect(gd.calcdata[0][1]).toEqual({x: false, y: false});
                expect(gd.calcdata[0][2]).toEqual(jasmine.objectContaining({x: 5, y: 12}));
                expect(gd.calcdata[0][3]).toEqual(jasmine.objectContaining({x: 0, y: 13}));
                expect(gd.calcdata[0][4]).toEqual(jasmine.objectContaining({x: 3, y: 14}));
            });

            it('should output categories in explicitly supplied order first, if not all categories are covered', function() {

                Plotly.plot(gd, [{x: ['c','a','e','b','d'], y: [15,11,12,13,14]}], { xaxis: {
                    type: 'category',
                    categorymode: 'array',
                    categorylist: ['b','a','x','c']
                }});

                expect(gd.calcdata[0][0]).toEqual(jasmine.objectContaining({x: 3, y: 15}));
                expect(gd.calcdata[0][1]).toEqual(jasmine.objectContaining({x: 1, y: 11}));
                expect(gd.calcdata[0][2]).toEqual(jasmine.objectContaining({x: 4, y: 12}));
                expect(gd.calcdata[0][3]).toEqual(jasmine.objectContaining({x: 0, y: 13}));
                expect(gd.calcdata[0][4]).toEqual(jasmine.objectContaining({x: 5, y: 14}));

                // The order of the rest is unspecified, no need to check. Alternative: make _both_ categorymode and
                // categories effective; categories would take precedence and the remaining items would be sorted
                // based on the categorymode. This of course means that the mere presence of categories triggers this
                // behavior, rather than an explicit 'explicit' categorymode.
            });
        });

        describe('ordering tests in the presence of multiple traces - mutually exclusive', function() {

            it('baseline testing for the unordered, disjunct case', function() {

                var x1 = ['Gear', 'Bearing', 'Motor'];
                var x2 = ['Switch', 'Plug', 'Cord', 'Fuse', 'Bulb'];
                var x3 = ['Pump', 'Leak', 'Seals'];

                Plotly.plot(gd, [
                    {x: x1, y: x1.map(function(d, i) {return i + 10;})},
                    {x: x2, y: x2.map(function(d, i) {return i + 20;})},
                    {x: x3, y: x3.map(function(d, i) {return i + 30;})}
                ]);

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
            });

            it('category order follows the trace order (even if categorylist is specified)', function() {

                var x1 = ['Gear', 'Bearing', 'Motor'];
                var x2 = ['Switch', 'Plug', 'Cord', 'Fuse', 'Bulb'];
                var x3 = ['Pump', 'Leak', 'Seals'];

                Plotly.plot(gd, [
                    {x: x1, y: x1.map(function(d, i) {return i + 10;})},
                    {x: x2, y: x2.map(function(d, i) {return i + 20;})},
                    {x: x3, y: x3.map(function(d, i) {return i + 30;})}
                ], { xaxis: {
                    // type: 'category', // commented out to rely on autotyping for added realism
                    categorymode: 'trace',
                    categorylist: ['Switch','Bearing','Motor','Seals','Pump','Cord','Plug','Bulb','Fuse','Gear','Leak']
                }});

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
            });

            it('category order is category ascending (even if categorylist is specified)', function() {

                var x1 = ['Gear', 'Bearing', 'Motor'];
                var x2 = ['Switch', 'Plug', 'Cord', 'Fuse', 'Bulb'];
                var x3 = ['Pump', 'Leak', 'Seals'];

                Plotly.plot(gd, [
                    {x: x1, y: x1.map(function(d, i) {return i + 10;})},
                    {x: x2, y: x2.map(function(d, i) {return i + 20;})},
                    {x: x3, y: x3.map(function(d, i) {return i + 30;})}
                ], { xaxis: {
                    // type: 'category', // commented out to rely on autotyping for added realism
                    categorymode: 'category ascending',
                    categorylist: ['Switch','Bearing','Motor','Seals','Pump','Cord','Plug','Bulb','Fuse','Gear','Leak']
                    // this is the expected sorted outcome: ['Bearing','Bulb','Cord','Fuse','Gear','Leak','Motor','Plug','Pump','Seals','Switch']
                }});

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
            });

            it('category order is category descending (even if categorylist is specified)', function() {

                var x1 = ['Gear', 'Bearing', 'Motor'];
                var x2 = ['Switch', 'Plug', 'Cord', 'Fuse', 'Bulb'];
                var x3 = ['Pump', 'Leak', 'Seals'];

                Plotly.plot(gd, [
                    {x: x1, y: x1.map(function(d, i) {return i + 10;})},
                    {x: x2, y: x2.map(function(d, i) {return i + 20;})},
                    {x: x3, y: x3.map(function(d, i) {return i + 30;})}
                ], { xaxis: {
                    // type: 'category', // commented out to rely on autotyping for added realism
                    categorymode: 'category descending',
                    categorylist: ['Switch','Bearing','Motor','Seals','Pump','Cord','Plug','Bulb','Fuse','Gear','Leak']
                    // this is the expected sorted outcome: ["Switch", "Seals", "Pump", "Plug", "Motor", "Leak", "Gear", "Fuse", "Cord", "Bulb", "Bearing"]
                }});

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
            });

            it('category order follows categorylist', function() {

                var x1 = ['Gear', 'Bearing', 'Motor'];
                var x2 = ['Switch', 'Plug', 'Cord', 'Fuse', 'Bulb'];
                var x3 = ['Pump', 'Leak', 'Seals'];

                Plotly.plot(gd, [
                    {x: x1, y: x1.map(function(d, i) {return i + 10;})},
                    {x: x2, y: x2.map(function(d, i) {return i + 20;})},
                    {x: x3, y: x3.map(function(d, i) {return i + 30;})}
                ], { xaxis: {
                    // type: 'category', // commented out to rely on autotyping for added realism
                    categorymode: 'array',
                    categorylist: ['Switch','Bearing','Motor','Seals','Pump','Cord','Plug','Bulb','Fuse','Gear','Leak']
                }});

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
            });
        });

        describe('ordering tests in the presence of multiple traces - partially overlapping', function() {

            it('baseline testing for the unordered, partially overlapping case', function() {

                var x1 = ['Gear', 'Bearing', 'Motor'];
                var x2 = ['Switch', 'Plug', 'Cord', 'Fuse', 'Bulb'];
                var x3 = ['Pump', 'Leak', 'Bearing', 'Seals'];

                Plotly.plot(gd, [
                    {x: x1, y: x1.map(function(d, i) {return i + 10;})},
                    {x: x2, y: x2.map(function(d, i) {return i + 20;})},
                    {x: x3, y: x3.map(function(d, i) {return i + 30;})}
                ]);

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
            });

            it('category order follows the trace order (even if categorylist is specified)', function() {

                var x1 = ['Gear', 'Bearing', 'Motor'];
                var x2 = ['Switch', 'Plug', 'Cord', 'Fuse', 'Bulb'];
                var x3 = ['Pump', 'Leak', 'Bearing', 'Seals'];

                Plotly.plot(gd, [
                    {x: x1, y: x1.map(function(d, i) {return i + 10;})},
                    {x: x2, y: x2.map(function(d, i) {return i + 20;})},
                    {x: x3, y: x3.map(function(d, i) {return i + 30;})}
                ], { xaxis: {
                    // type: 'category', // commented out to rely on autotyping for added realism
                    categorymode: 'trace',
                    categorylist: ['Switch','Bearing','Motor','Seals','Pump','Cord','Plug','Bulb','Fuse','Gear','Leak']
                }});

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
            });

            it('category order is category ascending (even if categorylist is specified)', function() {

                var x1 = ['Gear', 'Bearing', 'Motor'];
                var x2 = ['Switch', 'Plug', 'Cord', 'Fuse', 'Bulb'];
                var x3 = ['Pump', 'Leak', 'Bearing', 'Seals'];

                Plotly.plot(gd, [
                    {x: x1, y: x1.map(function(d, i) {return i + 10;})},
                    {x: x2, y: x2.map(function(d, i) {return i + 20;})},
                    {x: x3, y: x3.map(function(d, i) {return i + 30;})}
                ], { xaxis: {
                    // type: 'category', // commented out to rely on autotyping for added realism
                    categorymode: 'category ascending',
                    categorylist: ['Switch','Bearing','Motor','Seals','Pump','Cord','Plug','Bulb','Fuse','Gear','Leak']
                    // this is the expected sorted outcome: ['Bearing','Bulb','Cord','Fuse','Gear','Leak','Motor','Plug','Pump','Seals','Switch']
                }});

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
            });

            it('category order is category descending (even if categorylist is specified)', function() {

                var x1 = ['Gear', 'Bearing', 'Motor'];
                var x2 = ['Switch', 'Plug', 'Cord', 'Fuse', 'Bulb'];
                var x3 = ['Pump', 'Leak', 'Bearing', 'Seals'];

                Plotly.plot(gd, [
                    {x: x1, y: x1.map(function(d, i) {return i + 10;})},
                    {x: x2, y: x2.map(function(d, i) {return i + 20;})},
                    {x: x3, y: x3.map(function(d, i) {return i + 30;})}
                ], { xaxis: {
                    // type: 'category', // commented out to rely on autotyping for added realism
                    categorymode: 'category descending',
                    categorylist: ['Switch','Bearing','Motor','Seals','Pump','Cord','Plug','Bulb','Fuse','Gear','Leak']
                    // this is the expected sorted outcome: ["Switch", "Seals", "Pump", "Plug", "Motor", "Leak", "Gear", "Fuse", "Cord", "Bulb", "Bearing"]
                }});

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
            });

            it('category order follows categorylist', function() {

                var x1 = ['Gear', 'Bearing', 'Motor'];
                var x2 = ['Switch', 'Plug', 'Cord', 'Fuse', 'Bulb'];
                var x3 = ['Pump', 'Leak', 'Bearing', 'Seals'];

                Plotly.plot(gd, [
                    {x: x1, y: x1.map(function(d, i) {return i + 10;})},
                    {x: x2, y: x2.map(function(d, i) {return i + 20;})},
                    {x: x3, y: x3.map(function(d, i) {return i + 30;})}
                ], { xaxis: {
                    // type: 'category', // commented out to rely on autotyping for added realism
                    categorymode: 'array',
                    categorylist: ['Switch','Bearing','Motor','Seals','Pump','Cord','Plug','Bulb','Fuse','Gear','Leak']
                }});

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
            });
        });

        describe('ordering tests in the presence of multiple traces - fully overlapping', function() {

            it('baseline testing for the unordered, fully overlapping case', function() {

                var x1 = ['Gear', 'Bearing', 'Motor'];
                var x2 = ['Bearing', 'Gear', 'Motor'];
                var x3 = ['Motor', 'Gear', 'Bearing'];

                Plotly.plot(gd, [
                    {x: x1, y: x1.map(function(d, i) {return i + 10;})},
                    {x: x2, y: x2.map(function(d, i) {return i + 20;})},
                    {x: x3, y: x3.map(function(d, i) {return i + 30;})}
                ]);

                expect(gd.calcdata[0][0]).toEqual(jasmine.objectContaining({x: 0, y: 10}));
                expect(gd.calcdata[0][1]).toEqual(jasmine.objectContaining({x: 1, y: 11}));
                expect(gd.calcdata[0][2]).toEqual(jasmine.objectContaining({x: 2, y: 12}));

                expect(gd.calcdata[1][0]).toEqual(jasmine.objectContaining({x: 1, y: 20}));
                expect(gd.calcdata[1][1]).toEqual(jasmine.objectContaining({x: 0, y: 21}));
                expect(gd.calcdata[1][2]).toEqual(jasmine.objectContaining({x: 2, y: 22}));

                expect(gd.calcdata[2][0]).toEqual(jasmine.objectContaining({x: 2, y: 30}));
                expect(gd.calcdata[2][1]).toEqual(jasmine.objectContaining({x: 0, y: 31}));
                expect(gd.calcdata[2][2]).toEqual(jasmine.objectContaining({x: 1, y: 32}));
            });

            it('category order follows the trace order (even if categorylist is specified)', function() {

                var x1 = ['Gear', 'Bearing', 'Motor'];
                var x2 = ['Bearing', 'Gear', 'Motor'];
                var x3 = ['Motor', 'Gear', 'Bearing'];

                Plotly.plot(gd, [
                    {x: x1, y: x1.map(function(d, i) {return i + 10;})},
                    {x: x2, y: x2.map(function(d, i) {return i + 20;})},
                    {x: x3, y: x3.map(function(d, i) {return i + 30;})}
                ], { xaxis: {
                    // type: 'category', // commented out to rely on autotyping for added realism
                    categorymode: 'trace',
                    categorylist: ['Switch','Bearing','Motor','Seals','Pump','Cord','Plug','Bulb','Fuse','Gear','Leak']
                }});

                expect(gd.calcdata[0][0]).toEqual(jasmine.objectContaining({x: 0, y: 10}));
                expect(gd.calcdata[0][1]).toEqual(jasmine.objectContaining({x: 1, y: 11}));
                expect(gd.calcdata[0][2]).toEqual(jasmine.objectContaining({x: 2, y: 12}));

                expect(gd.calcdata[1][0]).toEqual(jasmine.objectContaining({x: 1, y: 20}));
                expect(gd.calcdata[1][1]).toEqual(jasmine.objectContaining({x: 0, y: 21}));
                expect(gd.calcdata[1][2]).toEqual(jasmine.objectContaining({x: 2, y: 22}));

                expect(gd.calcdata[2][0]).toEqual(jasmine.objectContaining({x: 2, y: 30}));
                expect(gd.calcdata[2][1]).toEqual(jasmine.objectContaining({x: 0, y: 31}));
                expect(gd.calcdata[2][2]).toEqual(jasmine.objectContaining({x: 1, y: 32}));
            });

            it('category order is category ascending (even if categorylist is specified)', function() {

                var x1 = ['Gear', 'Bearing', 'Motor'];
                var x2 = ['Bearing', 'Gear', 'Motor'];
                var x3 = ['Motor', 'Gear', 'Bearing'];

                Plotly.plot(gd, [
                    {x: x1, y: x1.map(function(d, i) {return i + 10;})},
                    {x: x2, y: x2.map(function(d, i) {return i + 20;})},
                    {x: x3, y: x3.map(function(d, i) {return i + 30;})}
                ], { xaxis: {
                    // type: 'category', // commented out to rely on autotyping for added realism
                    categorymode: 'category ascending',
                    categorylist: ['Switch','Bearing','Motor','Seals','Pump','Cord','Plug','Bulb','Fuse','Gear','Leak']
                    // this is the expected sorted outcome: ['Bearing','Bulb','Cord','Fuse','Gear','Leak','Motor','Plug','Pump','Seals','Switch']
                }});

                expect(gd.calcdata[0][0]).toEqual(jasmine.objectContaining({x: 1, y: 10}));
                expect(gd.calcdata[0][1]).toEqual(jasmine.objectContaining({x: 0, y: 11}));
                expect(gd.calcdata[0][2]).toEqual(jasmine.objectContaining({x: 2, y: 12}));

                expect(gd.calcdata[1][0]).toEqual(jasmine.objectContaining({x: 0, y: 20}));
                expect(gd.calcdata[1][1]).toEqual(jasmine.objectContaining({x: 1, y: 21}));
                expect(gd.calcdata[1][2]).toEqual(jasmine.objectContaining({x: 2, y: 22}));

                expect(gd.calcdata[2][0]).toEqual(jasmine.objectContaining({x: 2, y: 30}));
                expect(gd.calcdata[2][1]).toEqual(jasmine.objectContaining({x: 1, y: 31}));
                expect(gd.calcdata[2][2]).toEqual(jasmine.objectContaining({x: 0, y: 32}));
            });

            it('category order is category descending (even if categorylist is specified)', function() {

                var x1 = ['Gear', 'Bearing', 'Motor'];
                var x2 = ['Bearing', 'Gear', 'Motor'];
                var x3 = ['Motor', 'Gear', 'Bearing'];

                Plotly.plot(gd, [
                    {x: x1, y: x1.map(function(d, i) {return i + 10;})},
                    {x: x2, y: x2.map(function(d, i) {return i + 20;})},
                    {x: x3, y: x3.map(function(d, i) {return i + 30;})}
                ], { xaxis: {
                    // type: 'category', // commented out to rely on autotyping for added realism
                    categorymode: 'category descending',
                    categorylist: ['Switch','Bearing','Motor','Seals','Pump','Cord','Plug','Bulb','Fuse','Gear','Leak']
                    // this is the expected sorted outcome: ["Switch", "Seals", "Pump", "Plug", "Motor", "Leak", "Gear", "Fuse", "Cord", "Bulb", "Bearing"]
                }});

                expect(gd.calcdata[0][0]).toEqual(jasmine.objectContaining({x: 1, y: 10}));
                expect(gd.calcdata[0][1]).toEqual(jasmine.objectContaining({x: 2, y: 11}));
                expect(gd.calcdata[0][2]).toEqual(jasmine.objectContaining({x: 0, y: 12}));

                expect(gd.calcdata[1][0]).toEqual(jasmine.objectContaining({x: 2, y: 20}));
                expect(gd.calcdata[1][1]).toEqual(jasmine.objectContaining({x: 1, y: 21}));
                expect(gd.calcdata[1][2]).toEqual(jasmine.objectContaining({x: 0, y: 22}));

                expect(gd.calcdata[2][0]).toEqual(jasmine.objectContaining({x: 0, y: 30}));
                expect(gd.calcdata[2][1]).toEqual(jasmine.objectContaining({x: 1, y: 31}));
                expect(gd.calcdata[2][2]).toEqual(jasmine.objectContaining({x: 2, y: 32}));
            });

            it('category order follows categorylist', function() {

                var x1 = ['Gear', 'Bearing', 'Motor'];
                var x2 = ['Bearing', 'Gear', 'Motor'];
                var x3 = ['Motor', 'Gear', 'Bearing'];

                Plotly.plot(gd, [
                    {x: x1, y: x1.map(function(d, i) {return i + 10;})},
                    {x: x2, y: x2.map(function(d, i) {return i + 20;})},
                    {x: x3, y: x3.map(function(d, i) {return i + 30;})}
                ], {
                    xaxis: {
                        // type: 'category', // commented out to rely on autotyping for added realism
                        categorymode: 'array',
                        categorylist: ['Bearing','Motor','Gear']
                    }
                });

                expect(gd.calcdata[0][0]).toEqual(jasmine.objectContaining({x: 2, y: 10}));
                expect(gd.calcdata[0][1]).toEqual(jasmine.objectContaining({x: 0, y: 11}));
                expect(gd.calcdata[0][2]).toEqual(jasmine.objectContaining({x: 1, y: 12}));

                expect(gd.calcdata[1][0]).toEqual(jasmine.objectContaining({x: 0, y: 20}));
                expect(gd.calcdata[1][1]).toEqual(jasmine.objectContaining({x: 2, y: 21}));
                expect(gd.calcdata[1][2]).toEqual(jasmine.objectContaining({x: 1, y: 22}));

                expect(gd.calcdata[2][0]).toEqual(jasmine.objectContaining({x: 1, y: 30}));
                expect(gd.calcdata[2][1]).toEqual(jasmine.objectContaining({x: 2, y: 31}));
                expect(gd.calcdata[2][2]).toEqual(jasmine.objectContaining({x: 0, y: 32}));
            });

            it('category order follows categorylist even if data is sparse', function() {

                var x1 = ['Gear', 'Bearing', 'Motor'];
                var x2 = ['Bearing', 'Gear', 'Motor'];
                var x3 = ['Motor', 'Gear', 'Bearing'];

                Plotly.plot(gd, [
                    {x: x1, y: x1.map(function(d, i) {return i + 10;})},
                    {x: x2, y: x2.map(function(d, i) {return i + 20;})},
                    {x: x3, y: x3.map(function(d, i) {return i + 30;})}
                ], {
                    xaxis: {
                        // type: 'category', // commented out to rely on autotyping for added realism
                        categorymode: 'array',
                        categorylist: ['Switch','Bearing','Motor','Seals','Pump','Cord','Plug','Bulb','Fuse','Gear','Leak']
                    }
                });

                expect(gd.calcdata[0][0]).toEqual(jasmine.objectContaining({x: 9, y: 10}));
                expect(gd.calcdata[0][1]).toEqual(jasmine.objectContaining({x: 1, y: 11}));
                expect(gd.calcdata[0][2]).toEqual(jasmine.objectContaining({x: 2, y: 12}));

                expect(gd.calcdata[1][0]).toEqual(jasmine.objectContaining({x: 1, y: 20}));
                expect(gd.calcdata[1][1]).toEqual(jasmine.objectContaining({x: 9, y: 21}));
                expect(gd.calcdata[1][2]).toEqual(jasmine.objectContaining({x: 2, y: 22}));

                expect(gd.calcdata[2][0]).toEqual(jasmine.objectContaining({x: 2, y: 30}));
                expect(gd.calcdata[2][1]).toEqual(jasmine.objectContaining({x: 9, y: 31}));
                expect(gd.calcdata[2][2]).toEqual(jasmine.objectContaining({x: 1, y: 32}));
            });
        });

        describe('ordering and stacking combined', function() {

            it('partially overlapping category order follows categorylist and stacking produces expected results', function() {

                var x1 = ['Gear', 'Bearing', 'Motor'];
                var x2 = ['Switch', 'Plug', 'Cord', 'Fuse', 'Bulb'];
                var x3 = ['Pump', 'Leak', 'Bearing', 'Seals'];

                Plotly.plot(gd, [
                    {x: x1, y: x1.map(function(d, i) {return i + 10;}), type: 'bar'},
                    {x: x2, y: x2.map(function(d, i) {return i + 20;}), type: 'bar'},
                    {x: x3, y: x3.map(function(d, i) {return i + 30;}), type: 'bar'}
                ], {
                    barmode: 'stack',
                    xaxis: {
                        // type: 'category', // commented out to rely on autotyping for added realism
                        categorymode: 'array',
                        categorylist: ['Switch','Bearing','Motor','Seals','Pump','Cord','Plug','Bulb','Fuse','Gear','Leak']
                    }
                });

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
            });

            it('fully overlapping - category order follows categorylist and stacking produces expected results', function() {

                var x1 = ['Gear', 'Bearing', 'Motor'];
                var x2 = ['Bearing', 'Gear', 'Motor'];
                var x3 = ['Motor', 'Gear', 'Bearing'];

                Plotly.plot(gd, [
                    {x: x1, y: x1.map(function(d, i) {return i + 10;}), type: 'bar'},
                    {x: x2, y: x2.map(function(d, i) {return i + 20;}), type: 'bar'},
                    {x: x3, y: x3.map(function(d, i) {return i + 30;}), type: 'bar'}
                ], {
                    barmode: 'stack',
                    xaxis: {
                        // type: 'category', // commented out to rely on autotyping for added realism
                        categorymode: 'array',
                        categorylist: ['Bearing','Motor','Gear']
                    }
                });

                expect(gd.calcdata[0][0]).toEqual(jasmine.objectContaining({x: 2, y: 10}));
                expect(gd.calcdata[0][1]).toEqual(jasmine.objectContaining({x: 0, y: 11}));
                expect(gd.calcdata[0][2]).toEqual(jasmine.objectContaining({x: 1, y: 12}));

                expect(gd.calcdata[1][0]).toEqual(jasmine.objectContaining({x: 0, y: 11 + 20}));
                expect(gd.calcdata[1][1]).toEqual(jasmine.objectContaining({x: 2, y: 10 + 21}));
                expect(gd.calcdata[1][2]).toEqual(jasmine.objectContaining({x: 1, y: 12 + 22}));

                expect(gd.calcdata[2][0]).toEqual(jasmine.objectContaining({x: 1, y: 12 + 22 + 30}));
                expect(gd.calcdata[2][1]).toEqual(jasmine.objectContaining({x: 2, y: 10 + 21 + 31}));
                expect(gd.calcdata[2][2]).toEqual(jasmine.objectContaining({x: 0, y: 11 + 20 + 32}));
            });
        });
    });
});
