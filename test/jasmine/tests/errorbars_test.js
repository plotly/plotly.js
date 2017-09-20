var Plotly = require('@lib/index');

var d3 = require('d3');
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var fail = require('../assets/fail_test');


describe('errorbar plotting', function() {
    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(destroyGraphDiv);

    it('should autorange to the visible bars and remove invisible bars', function(done) {
        function check(xrange, yrange, xcount, ycount) {
            var xa = gd._fullLayout.xaxis;
            var ya = gd._fullLayout.yaxis;
            expect(xa.range).toBeCloseToArray(xrange, 3);
            expect(ya.range).toBeCloseToArray(yrange, 3);

            expect(d3.selectAll('.xerror').size()).toBe(xcount);
            expect(d3.selectAll('.yerror').size()).toBe(ycount);
        }
        Plotly.newPlot(gd, [{
            y: [1, 2, 3],
            error_x: {type: 'constant', value: 0.5},
            error_y: {type: 'sqrt'}
        }], {
            width: 400, height: 400
        })
        .then(function() {
            check([-0.6667, 2.6667], [-0.2629, 4.9949], 3, 3);
            return Plotly.restyle(gd, {'error_x.visible': false});
        })
        .then(function() {
            check([-0.1511, 2.1511], [-0.2629, 4.9949], 0, 3);
            return Plotly.restyle(gd, {'error_y.visible': false});
        })
        .then(function() {
            check([-0.1511, 2.1511], [0.8451, 3.1549], 0, 0);
            return Plotly.restyle(gd, {'error_x.visible': true, 'error_y.visible': true});
        })
        .then(function() {
            check([-0.6667, 2.6667], [-0.2629, 4.9949], 3, 3);
        })
        .catch(fail)
        .then(done);
    });
});
