var Plotly = require('@lib/index');

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');

describe('calculated data and points', function() {
    describe('connectGaps', function() {

        var gd;

        beforeEach(function() {
            gd = createGraphDiv();
        });

        afterEach(destroyGraphDiv);

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
});
