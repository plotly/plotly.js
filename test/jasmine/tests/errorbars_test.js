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

    function countBars(xCount, yCount) {
        expect(d3.select(gd).selectAll('.xerror').size()).toBe(xCount);
        expect(d3.select(gd).selectAll('.yerror').size()).toBe(yCount);
    }

    function checkCalcdata(cdTrace, errorBarData) {
        cdTrace.forEach(function(di, i) {
            var ebi = errorBarData[i] || {};
            expect(di.xh).toBe(ebi.xh);
            expect(di.xs).toBe(ebi.xs);
            expect(di.yh).toBe(ebi.yh);
            expect(di.ys).toBe(ebi.ys);
        });
    }

    it('should autorange to the visible bars and remove invisible bars', function(done) {
        function check(xrange, yrange, xCount, yCount) {
            var xa = gd._fullLayout.xaxis;
            var ya = gd._fullLayout.yaxis;
            expect(xa.range).toBeCloseToArray(xrange, 3);
            expect(ya.range).toBeCloseToArray(yrange, 3);

            countBars(xCount, yCount);
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

    it('shows half errorbars and removes individual bars that disappear', function(done) {
        Plotly.newPlot(gd, [{
            x: [0, 10, 20],
            y: [30, 40, 50],
            error_x: {type: 'data', array: [2, 3], visible: true, symmetric: false},
            error_y: {type: 'data', arrayminus: [4], visible: true, symmetric: false}
        }])
        .then(function() {
            countBars(2, 1);
            checkCalcdata(gd.calcdata[0], [
                {xs: 0, xh: 2, ys: 26, yh: 30},
                {xs: 10, xh: 13}
            ]);

            Plotly.restyle(gd, {'error_x.array': [[1]], 'error_y.arrayminus': [[5, 6]]});
        })
        .then(function() {
            countBars(1, 2);
            checkCalcdata(gd.calcdata[0], [
                {xs: 0, xh: 1, ys: 25, yh: 30},
                {ys: 34, yh: 40}
            ]);

            Plotly.restyle(gd, {'error_x.array': [[7, 8]], 'error_y.arrayminus': [[9]]});
        })
        .then(function() {
            countBars(2, 1);
            checkCalcdata(gd.calcdata[0], [
                {xs: 0, xh: 7, ys: 21, yh: 30},
                {xs: 10, xh: 18}
            ]);
        })
        .catch(fail)
        .then(done);
    });
});
