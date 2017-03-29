var Plotly = require('@lib/index');
var Plots = require('@src/plots/plots');

var Fx = require('@src/plots/cartesian/graph_interact');

var d3 = require('d3');
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');


describe('Fx defaults', function() {
    'use strict';

    var layoutIn, layoutOut, fullData;

    beforeEach(function() {
        layoutIn = {};
        layoutOut = {
            _has: Plots._hasPlotType
        };
        fullData = [{}];
    });

    it('should default (blank version)', function() {
        Fx.supplyLayoutDefaults(layoutIn, layoutOut, fullData);
        expect(layoutOut.hovermode).toBe('closest', 'hovermode to closest');
        expect(layoutOut.dragmode).toBe('zoom', 'dragmode to zoom');
    });

    it('should default (cartesian version)', function() {
        layoutOut._basePlotModules = [{ name: 'cartesian' }];

        Fx.supplyLayoutDefaults(layoutIn, layoutOut, fullData);
        expect(layoutOut.hovermode).toBe('x', 'hovermode to x');
        expect(layoutOut.dragmode).toBe('zoom', 'dragmode to zoom');
        expect(layoutOut._isHoriz).toBe(false, 'isHoriz to false');
    });

    it('should default (cartesian horizontal version)', function() {
        layoutOut._basePlotModules = [{ name: 'cartesian' }];
        fullData[0] = { orientation: 'h' };

        Fx.supplyLayoutDefaults(layoutIn, layoutOut, fullData);
        expect(layoutOut.hovermode).toBe('y', 'hovermode to y');
        expect(layoutOut.dragmode).toBe('zoom', 'dragmode to zoom');
        expect(layoutOut._isHoriz).toBe(true, 'isHoriz to true');
    });

    it('should default (gl3d version)', function() {
        layoutOut._basePlotModules = [{ name: 'gl3d' }];

        Fx.supplyLayoutDefaults(layoutIn, layoutOut, fullData);
        expect(layoutOut.hovermode).toBe('closest', 'hovermode to closest');
        expect(layoutOut.dragmode).toBe('zoom', 'dragmode to zoom');
    });

    it('should default (geo version)', function() {
        layoutOut._basePlotModules = [{ name: 'geo' }];

        Fx.supplyLayoutDefaults(layoutIn, layoutOut, fullData);
        expect(layoutOut.hovermode).toBe('closest', 'hovermode to closest');
        expect(layoutOut.dragmode).toBe('zoom', 'dragmode to zoom');
    });

    it('should default (multi plot type version)', function() {
        layoutOut._basePlotModules = [{ name: 'cartesian' }, { name: 'gl3d' }];

        Fx.supplyLayoutDefaults(layoutIn, layoutOut, fullData);
        expect(layoutOut.hovermode).toBe('x', 'hovermode to x');
        expect(layoutOut.dragmode).toBe('zoom', 'dragmode to zoom');
    });
});

describe('relayout', function() {
    'use strict';

    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(destroyGraphDiv);

    it('should update main drag with correct', function(done) {

        function assertMainDrag(cursor, isActive) {
            expect(d3.selectAll('rect.nsewdrag').size()).toEqual(1, 'number of nodes');
            var mainDrag = d3.select('rect.nsewdrag'),
                node = mainDrag.node();

            expect(mainDrag.classed('cursor-' + cursor)).toBe(true, 'cursor ' + cursor);
            expect(mainDrag.style('pointer-events')).toEqual('all', 'pointer event');
            expect(!!node.onmousedown).toBe(isActive, 'mousedown handler');
        }

        Plotly.plot(gd, [{
            y: [2, 1, 2]
        }]).then(function() {
            assertMainDrag('crosshair', true);

            return Plotly.relayout(gd, 'dragmode', 'pan');
        }).then(function() {
            assertMainDrag('move', true);

            return Plotly.relayout(gd, 'dragmode', 'drag');
        }).then(function() {
            assertMainDrag('crosshair', true);

            return Plotly.relayout(gd, 'xaxis.fixedrange', true);
        }).then(function() {
            assertMainDrag('ns-resize', true);

            return Plotly.relayout(gd, 'yaxis.fixedrange', true);
        }).then(function() {
            assertMainDrag('pointer', false);

            return Plotly.relayout(gd, 'dragmode', 'drag');
        }).then(function() {
            assertMainDrag('pointer', false);

            return Plotly.relayout(gd, 'dragmode', 'lasso');
        }).then(function() {
            assertMainDrag('pointer', true);

            return Plotly.relayout(gd, 'dragmode', 'select');
        }).then(function() {
            assertMainDrag('pointer', true);

            return Plotly.relayout(gd, 'xaxis.fixedrange', false);
        }).then(function() {
            assertMainDrag('ew-resize', true);
        }).then(done);
    });
});
