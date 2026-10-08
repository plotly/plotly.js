var Plotly = require('../../../lib/index');

var d3Select = require('../../strict-d3').select;
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
const drag = require('../assets/drag');
const doubleClick = require('../assets/double_click');


describe('errorbar plotting', function() {
    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(destroyGraphDiv);

    function countBars(xCount, yCount) {
        expect(d3Select(gd).selectAll('.xerror').size()).toBe(xCount);
        expect(d3Select(gd).selectAll('.yerror').size()).toBe(yCount);
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

    function checkPointOpacities(expected) {
        for (const selector of ['.point', '.xerror', '.yerror']) {
            const values = Array.from(gd.querySelectorAll(selector), (node) => Number(getComputedStyle(node).opacity));
            expect(values).toBeCloseToArray(expected, 5);
        }
    }

    it('applies marker opacity to error bars through selection and clear', async () => {
        await Plotly.newPlot(gd, [{
            x: [1, 2, 3],
            y: [1, 2, 3],
            mode: 'markers',
            marker: { opacity: 0.6 },
            error_x: { type: 'constant', value: 0.2 },
            error_y: { type: 'constant', value: 0.3 },
            selected: { marker: { opacity: 0.9 } },
            unselected: { marker: { opacity: 0.1 } }
        }]);
        checkPointOpacities([0.6, 0.6, 0.6]);

        await Plotly.restyle(gd, { selectedpoints: [[1]] });
        checkPointOpacities([0.1, 0.9, 0.1]);

        await Plotly.restyle(gd, { selectedpoints: [[]] });
        checkPointOpacities([0.1, 0.1, 0.1]);

        await Plotly.restyle(gd, { selectedpoints: null });
        checkPointOpacities([0.6, 0.6, 0.6]);

        await Plotly.restyle(gd, { 'marker.opacity': 0 });
        checkPointOpacities([0, 0, 0]);
    });

    it('uses point opacity arrays across missing data', async () => {
        await Plotly.newPlot(gd, [{
            x: [1, null, 3],
            y: [1, 2, 3],
            mode: 'lines+markers',
            marker: { opacity: [0.8, 0.4, 0.6] },
            error_x: { type: 'constant', value: 0.2 },
            error_y: { type: 'constant', value: 0.3 },
            selectedpoints: [2]
        }]);
        checkPointOpacities([0.16, 0.6]);

        await Plotly.restyle(gd, { selectedpoints: null });
        checkPointOpacities([0.8, 0.6]);
    });

    for (const dragmode of ['select', 'lasso']) {
        it(`updates error bars after ${dragmode} and deselection`, async () => {
            await Plotly.newPlot(gd, [{
                x: [1, 2, 3],
                y: [1, 2, 3],
                mode: 'markers',
                selected: { marker: { opacity: 0.8 } },
                unselected: { marker: { opacity: 0.3 } },
                error_x: { type: 'constant', value: 0.2 },
                error_y: { type: 'constant', value: 0.3 }
            }], {
                width: 400,
                height: 400,
                margin: { l: 50, r: 50, t: 50, b: 50 },
                xaxis: { range: [0, 4] },
                yaxis: { range: [0, 4] },
                dragmode
            });
            await drag({
                path: dragmode === 'select'
                    ? [[100, 300], [150, 250]]
                    : [[100, 300], [150, 300], [150, 250], [100, 250], [100, 300]]
            });
            expect(gd.data[0].selectedpoints).toEqual([0]);
            checkPointOpacities([0.8, 0.3, 0.3]);

            await doubleClick(200, 200);
            checkPointOpacities([1, 1, 1]);
        });
    }

    it('keeps line-only and bar error opacity independent of scatter marker styling', async () => {
        await Plotly.newPlot(gd, [
            {
                x: [1, 2], y: [1, 2], mode: 'lines', marker: { opacity: 0.2 },
                error_y: { type: 'constant', value: 0.2 }
            },
            {
                x: [1, 2], y: [1, 2], type: 'bar', marker: { opacity: 0.6 },
                error_y: { type: 'constant', value: 0.2 }, selectedpoints: [0]
            }
        ]);
        for (const node of gd.querySelectorAll('.yerror')) {
            expect(Number(getComputedStyle(node).opacity)).toBe(1);
        }
    });

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
        .then(done, done.fail);
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

            return Plotly.restyle(gd, {'error_x.array': [[1]], 'error_y.arrayminus': [[5, 6]]});
        })
        .then(function() {
            countBars(1, 2);
            checkCalcdata(gd.calcdata[0], [
                {xs: 0, xh: 1, ys: 25, yh: 30},
                {ys: 34, yh: 40}
            ]);

            return Plotly.restyle(gd, {'error_x.array': [[7, 8]], 'error_y.arrayminus': [[9]]});
        })
        .then(function() {
            countBars(2, 1);
            checkCalcdata(gd.calcdata[0], [
                {xs: 0, xh: 7, ys: 21, yh: 30},
                {xs: 10, xh: 18}
            ]);
        })
        .then(done, done.fail);
    });
});
