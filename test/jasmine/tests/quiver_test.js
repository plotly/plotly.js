var Plotly = require('../../../lib/index');

var supplyAllDefaults = require('../assets/supply_defaults');
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');

var delay = require('../assets/delay');
var mouseEvent = require('../assets/mouse_event');

var customAssertions = require('../assets/custom_assertions');
var assertHoverLabelContent = customAssertions.assertHoverLabelContent;

describe('Test quiver defaults', function() {
    var gd;

    function makeGD() {
        return {
            data: [{
                type: 'quiver',
                x: [1, 2],
                y: [1, 2],
                u: [1, 2],
                v: [1, 2]
            }],
            layout: {}
        };
    }

    it('should not set `visible: false` for traces with x,y arrays', function() {
        gd = makeGD();
        supplyAllDefaults(gd);
        expect(gd._fullData[0].visible).toBe(true);
    });

    it('should set `visible: false` for traces missing both x and y arrays', function() {
        gd = makeGD();
        delete gd.data[0].x;
        delete gd.data[0].y;

        supplyAllDefaults(gd);
        expect(gd._fullData[0].visible).toBe(false);
    });

    it('should generate the missing axis from x0/dx or y0/dy (like scatter)', function() {
        // missing x: generated from x0/dx (defaults 0 and 1)
        gd = makeGD();
        delete gd.data[0].x;
        supplyAllDefaults(gd);
        expect(gd._fullData[0].visible).toBe(true, 'missing x');
        expect(gd._fullData[0].x0).toBe(0);
        expect(gd._fullData[0].dx).toBe(1);
        expect(gd._fullData[0]._length).toBe(2);

        // missing y: generated from y0/dy (defaults 0 and 1)
        gd = makeGD();
        delete gd.data[0].y;
        supplyAllDefaults(gd);
        expect(gd._fullData[0].visible).toBe(true, 'missing y');
        expect(gd._fullData[0].y0).toBe(0);
        expect(gd._fullData[0].dy).toBe(1);
        expect(gd._fullData[0]._length).toBe(2);
    });

    it('should default u,v to zeros when missing', function() {
        gd = {
            data: [{
                type: 'quiver',
                x: [1, 2, 3],
                y: [1, 2, 3]
            }],
            layout: {}
        };

        supplyAllDefaults(gd);
        expect(gd._fullData[0].visible).toBe(true);
        expect(gd._fullData[0].u).toEqual([0, 0, 0]);
        expect(gd._fullData[0].v).toEqual([0, 0, 0]);
    });

    it('should default u,v to zeros when empty', function() {
        gd = {
            data: [{
                type: 'quiver',
                x: [1, 2, 3],
                y: [1, 2, 3],
                u: [],
                v: []
            }],
            layout: {}
        };

        supplyAllDefaults(gd);
        expect(gd._fullData[0].visible).toBe(true);
        expect(gd._fullData[0].u).toEqual([0, 0, 0]);
        expect(gd._fullData[0].v).toEqual([0, 0, 0]);
    });

    it('should set sizemode and sizeref defaults correctly', function() {
        gd = makeGD();
        supplyAllDefaults(gd);
        expect(gd._fullData[0].sizemode).toBe('scaled');
        expect(gd._fullData[0].sizeref).toBe(1);
    });

    it('should set anchor default to tail', function() {
        gd = makeGD();
        supplyAllDefaults(gd);
        expect(gd._fullData[0].anchor).toBe('tail');
    });
});

describe('Test quiver calc', function() {
    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(function() {
        Plotly.purge(gd);
        destroyGraphDiv();
    });

    it('should calculate data correctly for simple vectors', function(done) {
        Plotly.newPlot(gd, [{
            type: 'quiver',
            x: [0, 1, 2],
            y: [0, 1, 2],
            u: [1, 0, -1],
            v: [0, 1, 0]
        }]).then(function() {
            var calcData = gd.calcdata[0];
            expect(calcData.length).toBe(3);
            expect(calcData[0].x).toBe(0);
            expect(calcData[0].y).toBe(0);
            expect(calcData[1].x).toBe(1);
            expect(calcData[1].y).toBe(1);
            expect(calcData[2].x).toBe(2);
            expect(calcData[2].y).toBe(2);
        })
        .then(done, done.fail);
    });

    it('should generate x from x0/dx and y from y0/dy with the expected values', function(done) {
        // missing x -> x generated from x0/dx defaults (0, 1)
        Plotly.newPlot(gd, [{
            type: 'quiver',
            y: [10, 20, 30],
            u: [1, 1, 1],
            v: [1, 1, 1]
        }]).then(function() {
            var cd = gd.calcdata[0];
            expect(cd.map(function(c) { return c.x; })).toEqual([0, 1, 2]);
            expect(cd.map(function(c) { return c.y; })).toEqual([10, 20, 30]);

            // missing y -> y generated from y0/dy defaults (0, 1)
            return Plotly.newPlot(gd, [{
                type: 'quiver',
                x: [10, 20, 30],
                u: [1, 1, 1],
                v: [1, 1, 1]
            }]);
        }).then(function() {
            var cd = gd.calcdata[0];
            expect(cd.map(function(c) { return c.x; })).toEqual([10, 20, 30]);
            expect(cd.map(function(c) { return c.y; })).toEqual([0, 1, 2]);
        })
        .then(done, done.fail);
    });
});

describe('Test quiver interactions', function() {
    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(function() {
        Plotly.purge(gd);
        destroyGraphDiv();
    });

    it('should add/clear svg objects correctly', function(done) {
        Plotly.newPlot(gd, [{
            type: 'quiver',
            x: [1, 2],
            y: [1, 2],
            u: [1, 0],
            v: [0, 1]
        }, {
            type: 'quiver',
            x: [3, 4],
            y: [3, 4],
            u: [1, 1],
            v: [1, 1]
        }]).then(function() {
            var quiverLayers = gd._fullLayout._plots.xy.plot.selectAll('.trace.quiver');
            expect(quiverLayers.size()).toBe(2);

            return Plotly.deleteTraces(gd, [0]);
        })
        .then(function() {
            var quiverLayers = gd._fullLayout._plots.xy.plot.selectAll('.trace.quiver');
            expect(quiverLayers.size()).toBe(1);

            return Plotly.deleteTraces(gd, [0]);
        })
        .then(function() {
            var quiverLayers = gd._fullLayout._plots.xy.plot.selectAll('.trace.quiver');
            expect(quiverLayers.size()).toBe(0);
        })
        .then(done, done.fail);
    });

    it('should restyle arrow properties', function(done) {
        Plotly.newPlot(gd, [{
            type: 'quiver',
            x: [1, 2],
            y: [1, 2],
            u: [1, 0],
            v: [0, 1],
            sizeref: 0.5
        }]).then(function() {
            expect(gd._fullData[0].sizeref).toBe(0.5);
            return Plotly.restyle(gd, 'sizeref', 1.5);
        })
        .then(function() {
            expect(gd._fullData[0].sizeref).toBe(1.5);
            return Plotly.restyle(gd, 'anchor', 'tip');
        })
        .then(function() {
            expect(gd._fullData[0].anchor).toBe('tip');
        })
        .then(done, done.fail);
    });

    it('should display hover labels', function(done) {
        var fig = {
            data: [{
                type: 'quiver',
                x: [1, 2, 3],
                y: [1, 2, 3],
                u: [1, 0, -1],
                v: [0, 1, 0]
            }],
            layout: {
                margin: {l: 0, t: 0, r: 0, b: 0},
                width: 400,
                height: 400
            }
        };

        Plotly.newPlot(gd, fig)
        .then(function() {
            mouseEvent('mousemove', 200, 200);
        })
        .then(delay(20))
        .then(function() {
            assertHoverLabelContent({
                nums: '(2, 2)\nu: 0, v: 1'
            });
        })
        .then(done, done.fail);
    });

    it('should render multiple quiver traces', function(done) {
        Plotly.newPlot(gd, [{
            type: 'quiver',
            name: 'trace A',
            x: [1, 2],
            y: [1, 2],
            u: [1, 0],
            v: [0, 1],
            marker: {color: 'red'}
        }, {
            type: 'quiver',
            name: 'trace B',
            x: [3, 4],
            y: [3, 4],
            u: [-1, 0],
            v: [0, -1],
            marker: {color: 'blue'}
        }], {
            margin: {l: 0, t: 0, r: 0, b: 0},
            width: 400,
            height: 400
        })
        .then(function() {
            var quiverLayers = gd._fullLayout._plots.xy.plot.selectAll('.trace.quiver');
            expect(quiverLayers.size()).toBe(2);
        })
        .then(done, done.fail);
    });

    it('should handle sizemode changes', function(done) {
        Plotly.newPlot(gd, [{
            type: 'quiver',
            x: [0, 1, 2],
            y: [0, 1, 2],
            u: [1, 2, 3],
            v: [1, 2, 3],
            sizemode: 'scaled',
            sizeref: 0.5
        }]).then(function() {
            expect(gd._fullData[0].sizemode).toBe('scaled');
            return Plotly.restyle(gd, 'sizemode', 'raw');
        })
        .then(function() {
            expect(gd._fullData[0].sizemode).toBe('raw');
            return Plotly.restyle(gd, 'sizemode', 'scaled');
        })
        .then(function() {
            expect(gd._fullData[0].sizemode).toBe('scaled');
        })
        .then(done, done.fail);
    });

    it('should handle anchor changes', function(done) {
        Plotly.newPlot(gd, [{
            type: 'quiver',
            x: [1, 2],
            y: [1, 2],
            u: [1, 1],
            v: [1, 1],
            anchor: 'tail'
        }]).then(function() {
            expect(gd._fullData[0].anchor).toBe('tail');
            return Plotly.restyle(gd, 'anchor', 'tip');
        })
        .then(function() {
            expect(gd._fullData[0].anchor).toBe('tip');
            return Plotly.restyle(gd, 'anchor', 'center');
        })
        .then(function() {
            expect(gd._fullData[0].anchor).toBe('center');
        })
        .then(done, done.fail);
    });
});

